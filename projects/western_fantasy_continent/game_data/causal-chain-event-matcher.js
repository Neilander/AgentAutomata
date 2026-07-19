const {
  INFORMATION_PRESENTATION_CONTRACT,
} = require("./combat-signals");
const {
  evaluateEVerify,
  validateHypothesis,
} = require("./everify-isolated-v1");

const PREDICATES = new Set([
  "ally_defeated",
  "combat_lost",
  "combat_won",
  "control_applied",
  "damage_dealt",
  "damage_increased",
  "enemy_group_defeated",
  "formation_broken",
  "formation_intact",
  "shield_applied",
  "skill_cast",
  "survived_checkpoint",
  "target_defeated",
]);

const QUALIFIERS = new Set([
  "alive",
  "burn",
  "damage_up",
  "fire",
  "formation",
  "high_health",
  "protected",
  "shielded",
  "slow",
  "ultimate",
]);

const OPPOSITE_PREDICATES = Object.freeze({
  combat_won: "combat_lost",
  combat_lost: "combat_won",
  formation_broken: "formation_intact",
  formation_intact: "formation_broken",
  survived_checkpoint: "ally_defeated",
});

const ALLOWED_MATCHER_KEYS = new Set([
  "predicate",
  "subject",
  "object",
  "qualifiersAll",
  "environment",
  "exclusiveSubject",
]);

const ALLOWED_REF_KEYS = new Set(["refId", "conceptId", "publicEntityId", "side", "kind"]);
const ALLOWED_ENVIRONMENT_KEYS = new Set(["region", "node", "fieldEffect"]);
const TIERS = INFORMATION_PRESENTATION_CONTRACT.tiers;

function matchCausalChain({ hypothesis, receivedSemanticEvents }) {
  const hypothesisValidation = validateMatcherHypothesis(hypothesis);
  const eventValidation = validateReceivedEvents(receivedSemanticEvents);
  if (!hypothesisValidation.valid || !eventValidation.valid) {
    return {
      schema: "causal_chain_event_matcher_v1",
      status: "invalid_input",
      hypothesisValidation,
      eventValidation,
      stepMatches: [],
      everify: null,
    };
  }

  const events = eventValidation.events;
  const candidateLists = hypothesis.causalChain.map((step) => (
    events.filter((event) => eventMatches(step.matcher, event))
  ));
  const fullOrderedPath = bestOrderedPath(candidateLists);
  const selectedByStep = fullOrderedPath
    ? new Map(fullOrderedPath.map((event, index) => [hypothesis.causalChain[index].id, event]))
    : selectBestIndividualMatches(hypothesis.causalChain, candidateLists);
  const stepMatches = hypothesis.causalChain.map((step) => (
    resolveStepMatch(step, events, selectedByStep.get(step.id))
  ));
  const receivedStepEvidence = stepMatches
    .filter((row) => row.state !== "unknown")
    .map((row) => ({
      stepId: row.stepId,
      state: row.state,
      informationTier: row.informationTier,
      time: row.time,
      semanticEvidenceIds: [row.semanticEventId],
    }));
  const everify = evaluateEVerify({
    hypothesis,
    receivedStepEvidence,
  });

  return {
    schema: "causal_chain_event_matcher_v1",
    status: "matched",
    hypothesisValidation,
    eventValidation: {
      valid: true,
      acceptedCount: eventValidation.events.length,
      rejected: eventValidation.rejected,
    },
    stepMatches,
    audit: {
      usedFullOrderedPath: Boolean(fullOrderedPath),
      usesNaturalLanguageMatching: false,
      agentCanSetSupport: false,
      agentCanSetStrength: false,
      supportsPrimaryCauseClaims: false,
      provesPathOccurredNotExclusiveCause: true,
      informationContract: INFORMATION_PRESENTATION_CONTRACT.schema,
    },
    everify,
  };
}

function validateMatcherHypothesis(hypothesis) {
  const base = validateHypothesis(hypothesis);
  const errors = [...base.errors];
  if (hypothesis?.claimMode !== "contributing_path") {
    errors.push(hypothesis?.claimMode === "primary_cause"
      ? "primary_cause_not_supported_by_observational_matcher"
      : "claim_mode_contributing_path_required");
  }
  for (const [index, step] of (hypothesis?.causalChain || []).entries()) {
    const matcher = step?.matcher;
    if (!matcher || typeof matcher !== "object") {
      errors.push(`step_${index}_matcher_required`);
      continue;
    }
    for (const key of Object.keys(matcher)) {
      if (!ALLOWED_MATCHER_KEYS.has(key)) errors.push(`step_${index}_matcher_key_not_allowed:${key}`);
    }
    if (!PREDICATES.has(matcher.predicate)) {
      errors.push(`step_${index}_predicate_not_allowed`);
    }
    validateRef(matcher.subject, `step_${index}_subject`, errors);
    validateRef(matcher.object, `step_${index}_object`, errors);
    validateQualifiers(matcher.qualifiersAll, `step_${index}`, errors);
    validateEnvironment(matcher.environment, `step_${index}`, errors);
  }
  return {
    valid: errors.length === 0,
    errors,
    contract: {
      claimMode: "contributing_path",
      minimumSteps: 3,
      allowedPredicates: [...PREDICATES],
    },
  };
}

function validateReceivedEvents(input) {
  const rows = Array.isArray(input) ? input : [];
  const events = [];
  const rejected = [];
  for (const [index, row] of rows.entries()) {
    const result = normalizeReceivedEvent(row);
    if (result.valid) events.push(result.event);
    else rejected.push({ index, reason: result.reason });
  }
  return {
    valid: Array.isArray(input),
    events,
    rejected,
  };
}

function normalizeReceivedEvent(row) {
  if (!row || typeof row !== "object") return { valid: false, reason: "event_object_required" };
  if (!nonEmptyString(row.id) || hasRawIdentity(row.id)) {
    return { valid: false, reason: "public_semantic_event_id_required" };
  }
  if (!PREDICATES.has(row.predicate)) return { valid: false, reason: "predicate_not_allowed" };
  if (!Object.hasOwn(TIERS, row.informationTier)) {
    return { valid: false, reason: "frozen_information_tier_required" };
  }
  const time = Number(row.time);
  if (!Number.isFinite(time)) return { valid: false, reason: "event_time_required" };
  const forbiddenKeys = ["rawId", "internalName", "role", "support", "strength", "diagnosis"];
  if (forbiddenKeys.some((key) => deepHasKey(row, key))) {
    return { valid: false, reason: "forbidden_hidden_or_computed_field" };
  }
  const refErrors = [];
  validateRef(row.subject, "event_subject", refErrors);
  validateRef(row.object, "event_object", refErrors);
  validateQualifiers(row.qualifiers, "event", refErrors);
  validateEnvironment(row.environment, "event", refErrors);
  if (refErrors.length) return { valid: false, reason: refErrors[0] };

  return {
    valid: true,
    event: {
      id: row.id,
      time,
      predicate: row.predicate,
      subject: clone(row.subject || {}),
      object: clone(row.object || {}),
      qualifiers: [...(row.qualifiers || [])],
      environment: clone(row.environment || {}),
      informationTier: row.informationTier,
      strength: TIERS[row.informationTier].perceptionStrength,
    },
  };
}

function resolveStepMatch(step, events, selectedEvent) {
  if (selectedEvent) return observedStep(step, selectedEvent);
  const contradiction = findContradiction(step.matcher, events);
  if (contradiction) {
    return {
      stepId: step.id,
      statement: step.statement,
      state: "contradicted",
      reason: contradiction.reason,
      semanticEventId: contradiction.event.id,
      time: contradiction.event.time,
      informationTier: contradiction.event.informationTier,
    };
  }
  return {
    stepId: step.id,
    statement: step.statement,
    state: "unknown",
    reason: "no_matching_received_semantic_event",
    semanticEventId: null,
    time: null,
    informationTier: null,
  };
}

function observedStep(step, event) {
  return {
    stepId: step.id,
    statement: step.statement,
    state: "observed",
    reason: "exact_structured_match",
    semanticEventId: event.id,
    time: event.time,
    informationTier: event.informationTier,
  };
}

function findContradiction(matcher, events) {
  const opposite = OPPOSITE_PREDICATES[matcher.predicate];
  if (opposite) {
    const event = events.find((row) => eventMatches({
      ...matcher,
      predicate: opposite,
      qualifiersAll: [],
      exclusiveSubject: false,
    }, row));
    if (event) return { event, reason: `opposite_predicate:${opposite}` };
  }
  if (matcher.exclusiveSubject) {
    const event = events.find((row) => (
      row.predicate === matcher.predicate
      && !refMatches(matcher.subject, row.subject)
      && refMatches(matcher.object, row.object)
      && qualifiersMatch(matcher.qualifiersAll, row.qualifiers)
      && environmentMatches(matcher.environment, row.environment)
    ));
    if (event) return { event, reason: "exclusive_outcome_has_different_subject" };
  }
  return null;
}

function eventMatches(matcher, event) {
  return matcher.predicate === event.predicate
    && refMatches(matcher.subject, event.subject)
    && refMatches(matcher.object, event.object)
    && qualifiersMatch(matcher.qualifiersAll, event.qualifiers)
    && environmentMatches(matcher.environment, event.environment);
}

function bestOrderedPath(candidateLists) {
  if (candidateLists.length === 0 || candidateLists.some((rows) => rows.length === 0)) return null;
  let paths = candidateLists[0].map((event) => ({
    events: [event],
    bottleneck: event.strength,
  }));
  for (let index = 1; index < candidateLists.length; index += 1) {
    const nextPaths = [];
    for (const path of paths) {
      const last = path.events.at(-1);
      for (const event of candidateLists[index]) {
        if (event.time < last.time) continue;
        nextPaths.push({
          events: [...path.events, event],
          bottleneck: Math.min(path.bottleneck, event.strength),
        });
      }
    }
    paths = prunePaths(nextPaths);
    if (paths.length === 0) return null;
  }
  paths.sort(comparePaths);
  return paths[0].events;
}

function prunePaths(paths) {
  const bestByLastEvent = new Map();
  for (const path of paths) {
    const key = path.events.at(-1).id;
    const old = bestByLastEvent.get(key);
    if (!old || comparePaths(path, old) < 0) bestByLastEvent.set(key, path);
  }
  return [...bestByLastEvent.values()];
}

function comparePaths(a, b) {
  if (a.bottleneck !== b.bottleneck) return b.bottleneck - a.bottleneck;
  return a.events.at(-1).time - b.events.at(-1).time;
}

function selectBestIndividualMatches(steps, candidateLists) {
  return new Map(steps.flatMap((step, index) => {
    const candidates = [...candidateLists[index]].sort((a, b) => (
      b.strength - a.strength || a.time - b.time
    ));
    return candidates.length ? [[step.id, candidates[0]]] : [];
  }));
}

function refMatches(matcherRef, eventRef) {
  if (!matcherRef || Object.keys(matcherRef).length === 0) return true;
  return Object.entries(matcherRef).every(([key, value]) => eventRef?.[key] === value);
}

function qualifiersMatch(required, actual) {
  return (required || []).every((value) => (actual || []).includes(value));
}

function environmentMatches(required, actual) {
  return Object.entries(required || {}).every(([key, value]) => actual?.[key] === value);
}

function validateRef(ref, label, errors) {
  if (ref == null) return;
  if (typeof ref !== "object" || Array.isArray(ref)) {
    errors.push(`${label}_must_be_object`);
    return;
  }
  for (const [key, value] of Object.entries(ref)) {
    if (!ALLOWED_REF_KEYS.has(key)) errors.push(`${label}_key_not_allowed:${key}`);
    if (!nonEmptyString(value)) errors.push(`${label}_${key}_must_be_nonempty_string`);
    if (hasRawIdentity(value)) errors.push(`${label}_${key}_raw_identity_forbidden`);
  }
}

function validateQualifiers(values, label, errors) {
  if (values == null) return;
  if (!Array.isArray(values)) {
    errors.push(`${label}_qualifiers_must_be_array`);
    return;
  }
  for (const value of values) {
    if (!QUALIFIERS.has(value)) errors.push(`${label}_qualifier_not_allowed:${value}`);
  }
}

function validateEnvironment(environment, label, errors) {
  if (environment == null) return;
  if (typeof environment !== "object" || Array.isArray(environment)) {
    errors.push(`${label}_environment_must_be_object`);
    return;
  }
  for (const [key, value] of Object.entries(environment)) {
    if (!ALLOWED_ENVIRONMENT_KEYS.has(key)) errors.push(`${label}_environment_key_not_allowed:${key}`);
    if (!nonEmptyString(value)) errors.push(`${label}_environment_${key}_must_be_nonempty_string`);
  }
}

function hasRawIdentity(value) {
  return /^(?:left|right)-\d+$/i.test(String(value || ""))
    || /(?:attempt|combat|event):\d+/i.test(String(value || ""));
}

function deepHasKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.hasOwn(value, key)) return true;
  return Object.values(value).some((child) => deepHasKey(child, key));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  PREDICATES,
  QUALIFIERS,
  matchCausalChain,
  validateMatcherHypothesis,
  validateReceivedEvents,
};
