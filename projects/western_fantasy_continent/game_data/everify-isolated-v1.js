const {
  INFORMATION_PRESENTATION_CONTRACT,
} = require("./combat-signals");

const MIN_CHAIN_STEPS = 3;
const EVIDENCE_STATES = new Set(["observed", "contradicted"]);
const PRESENTATION_TIERS = INFORMATION_PRESENTATION_CONTRACT.tiers;

function evaluateEVerify({ hypothesis, receivedStepEvidence }) {
  const validation = validateHypothesis(hypothesis);
  if (!validation.valid) {
    return invalidResult(hypothesis, validation.errors);
  }

  const links = buildLinks(hypothesis.causalChain);
  const evidenceIndex = indexEvidence(receivedStepEvidence, hypothesis.causalChain);
  const linkResults = links.map((link) => evaluateLink(link, evidenceIndex));
  const contradictedLink = linkResults.find((row) => row.status === "contradicted");
  const allSupported = linkResults.every((row) => row.status === "supported");
  const supportedPrefix = supportedPrefixOf(linkResults);

  const status = contradictedLink
    ? "refuted"
    : allSupported
      ? "confirmed"
      : supportedPrefix.length > 0
        ? "partially_confirmed"
        : "inconclusive";
  const support = status === "confirmed" ? 1 : status === "refuted" ? -1 : 0;
  const strength = status === "confirmed"
    ? weakestStrength(linkResults)
    : contradictedLink?.strength || 0;
  const comparisonMade = linkResults.some((row) => row.status !== "unknown");

  return {
    schema: "everify_causal_chain_isolated_v2",
    hypothesisId: hypothesis.id,
    claim: hypothesis.claim,
    chosenBehavior: hypothesis.chosenBehavior,
    comparisonMade,
    status,
    dimensions: {
      support,
      strength: round(strength),
    },
    derived: {
      signedEvidence: round(support * strength),
      knowledgeEvidence: round(support * strength),
      strategySatisfaction: status === "confirmed" ? round(strength) : 0,
      supportedPrefixThrough: supportedPrefix.at(-1)?.toStepId || null,
      localLinkKnowledge: linkResults
        .filter((row) => row.status !== "unknown")
        .map((row) => ({
          linkId: row.id,
          fromStepId: row.fromStepId,
          toStepId: row.toStepId,
          evidence: round(row.support * row.strength),
        })),
    },
    chainAudit: {
      stepCount: hypothesis.causalChain.length,
      linkCount: links.length,
      comparedLinkCount: linkResults.filter((row) => row.status !== "unknown").length,
      supportedLinkCount: linkResults.filter((row) => row.status === "supported").length,
      contradictedLinkCount: linkResults.filter((row) => row.status === "contradicted").length,
      supportedPrefixLinkCount: supportedPrefix.length,
      informationContract: INFORMATION_PRESENTATION_CONTRACT.schema,
      usesWeakestLinkStrength: true,
      readsCustomSupport: false,
      readsCustomStrength: false,
      derivesLinkStateFromStepEvidence: true,
      readsResultR: false,
      links: linkResults,
      invalidEvidence: evidenceIndex.invalid,
    },
  };
}

function validateHypothesis(hypothesis) {
  const errors = [];
  if (!hypothesis || typeof hypothesis !== "object") {
    return { valid: false, errors: ["hypothesis_required"] };
  }
  if (!nonEmptyString(hypothesis.id)) errors.push("hypothesis_id_required");
  if (!nonEmptyString(hypothesis.claim)) errors.push("hypothesis_claim_required");
  if (!nonEmptyString(hypothesis.chosenBehavior)) errors.push("chosen_behavior_required");
  if (!Array.isArray(hypothesis.causalChain)) {
    errors.push("causal_chain_required");
    return { valid: false, errors };
  }
  if (hypothesis.causalChain.length < MIN_CHAIN_STEPS) {
    errors.push(`causal_chain_requires_${MIN_CHAIN_STEPS}_steps`);
  }
  const ids = new Set();
  for (const [index, step] of hypothesis.causalChain.entries()) {
    if (!nonEmptyString(step?.id)) errors.push(`step_${index}_id_required`);
    if (!nonEmptyString(step?.statement)) errors.push(`step_${index}_statement_required`);
    if (ids.has(step?.id)) errors.push(`duplicate_step_id:${step.id}`);
    ids.add(step?.id);
  }
  return { valid: errors.length === 0, errors };
}

function buildLinks(steps) {
  return steps.slice(0, -1).map((step, index) => {
    const next = steps[index + 1];
    return {
      id: `${step.id}->${next.id}`,
      fromStepId: step.id,
      toStepId: next.id,
      claim: `${step.statement} -> ${next.statement}`,
    };
  });
}

function indexEvidence(input, steps) {
  const validStepIds = new Set(steps.map((row) => row.id));
  const rows = new Map();
  const invalid = [];

  for (const [index, evidence] of (Array.isArray(input) ? input : []).entries()) {
    const normalized = normalizeEvidence(evidence, validStepIds);
    if (!normalized.valid) {
      invalid.push({ index, reason: normalized.reason });
      continue;
    }
    if (rows.has(normalized.row.stepId)) {
      rows.set(normalized.row.stepId, {
        conflict: true,
        rows: [rows.get(normalized.row.stepId), normalized.row],
      });
      continue;
    }
    rows.set(normalized.row.stepId, normalized.row);
  }

  return { rows, invalid };
}

function normalizeEvidence(evidence, validStepIds) {
  if (!evidence || typeof evidence !== "object") {
    return { valid: false, reason: "evidence_object_required" };
  }
  if (!validStepIds.has(evidence.stepId)) {
    return { valid: false, reason: "unknown_step_id" };
  }
  if (!EVIDENCE_STATES.has(evidence.state)) {
    return { valid: false, reason: "invalid_evidence_state" };
  }
  if (!Object.hasOwn(PRESENTATION_TIERS, evidence.informationTier)) {
    return { valid: false, reason: "frozen_information_tier_required" };
  }
  const time = Number(evidence.time);
  if (!Number.isFinite(time)) {
    return { valid: false, reason: "event_times_required" };
  }
  return {
    valid: true,
    row: {
      stepId: evidence.stepId,
      state: evidence.state,
      informationTier: evidence.informationTier,
      strength: PRESENTATION_TIERS[evidence.informationTier].perceptionStrength,
      time,
      semanticEvidenceIds: Array.isArray(evidence.semanticEvidenceIds)
        ? [...evidence.semanticEvidenceIds]
        : [],
    },
  };
}

function evaluateLink(link, evidenceIndex) {
  const fromEvidence = evidenceIndex.rows.get(link.fromStepId);
  const toEvidence = evidenceIndex.rows.get(link.toStepId);
  if (!fromEvidence || !toEvidence) {
    return unknownLink(link, "missing_received_step_evidence");
  }
  if (fromEvidence.conflict || toEvidence.conflict) {
    return unknownLink(link, "conflicting_received_step_evidence");
  }

  const contradictedRows = [fromEvidence, toEvidence]
    .filter((row) => row.state === "contradicted");
  const temporalOrderValid = fromEvidence.time <= toEvidence.time;
  const status = contradictedRows.length > 0 || !temporalOrderValid
    ? "contradicted"
    : "supported";
  const strength = contradictedRows.length > 0
    ? Math.max(...contradictedRows.map((row) => row.strength))
    : Math.min(fromEvidence.strength, toEvidence.strength);
  const support = status === "supported" ? 1 : -1;
  return {
    ...link,
    status,
    support,
    strength: round(strength),
    fromEvidence: auditStepEvidence(fromEvidence),
    toEvidence: auditStepEvidence(toEvidence),
    temporalOrderValid,
  };
}

function unknownLink(link, reason) {
  return {
    ...link,
    status: "unknown",
    support: 0,
    strength: 0,
    reason,
  };
}

function auditStepEvidence(row) {
  return {
    stepId: row.stepId,
    state: row.state,
    informationTier: row.informationTier,
    strength: row.strength,
    time: row.time,
    semanticEvidenceIds: row.semanticEvidenceIds,
  };
}

function supportedPrefixOf(linkResults) {
  const prefix = [];
  for (const row of linkResults) {
    if (row.status !== "supported") break;
    prefix.push(row);
  }
  return prefix;
}

function weakestStrength(rows) {
  return rows.length > 0 ? Math.min(...rows.map((row) => row.strength)) : 0;
}

function invalidResult(hypothesis, errors) {
  return {
    schema: "everify_causal_chain_isolated_v2",
    hypothesisId: hypothesis?.id || null,
    comparisonMade: false,
    status: "invalid_hypothesis",
    dimensions: { support: 0, strength: 0 },
    derived: {
      signedEvidence: 0,
      knowledgeEvidence: 0,
      strategySatisfaction: 0,
      supportedPrefixThrough: null,
      localLinkKnowledge: [],
    },
    chainAudit: {
      validationErrors: errors,
      informationContract: INFORMATION_PRESENTATION_CONTRACT.schema,
      readsCustomSupport: false,
      readsCustomStrength: false,
      derivesLinkStateFromStepEvidence: true,
      readsResultR: false,
    },
  };
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

module.exports = {
  MIN_CHAIN_STEPS,
  evaluateEVerify,
  validateHypothesis,
};
