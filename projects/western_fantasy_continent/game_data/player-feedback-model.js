const DEFAULT_FEEDBACK_CONFIG = Object.freeze({
  verification: {
    strategyEmotionScale: 0.06,
    discoveryEmotionScale: 0.06,
    unknownContributionWeight: 0.5,
    causalPriorSupportMass: 1,
    causalPriorRefuteMass: 1,
  },
});

const CONTRIBUTION_WEIGHTS = Object.freeze({
  primary: 1,
  joint: 0.75,
  supporting: 0.5,
  irrelevant: 0,
});

function produceProcessFeedback({ baseValue = 0, verificationCount = 0, verificationEffortValue = 0 }) {
  const base = Number(baseValue || 0);
  const verificationProcess = Math.max(0, Number(verificationCount) || 0)
    * Number(verificationEffortValue || 0);
  return {
    channel: "process",
    value: round(base + verificationProcess),
    baseValue: round(base),
    verificationProcess: round(verificationProcess),
  };
}

function produceResultFeedback({
  enabled = true,
  actualUtility = 0,
  H = 0,
  goalWeight = 0,
  freshness = 0,
}) {
  const value = enabled
    ? Number(actualUtility || 0) * Number(H || 0) * Number(goalWeight || 0) * Number(freshness || 0)
    : 0;
  return {
    channel: "R",
    value: round(value),
    enabled: Boolean(enabled),
    actualUtility: round(actualUtility),
    H: round(H),
    goalWeight: round(goalWeight),
    freshness: round(freshness),
  };
}

function produceExpectationFeedback(settlement = {}) {
  return {
    channel: "A",
    value: round(settlement.value),
    status: settlement.status || "unresolved",
    details: settlement.details || null,
  };
}

function calculateMismatchFeedback(deltaInput, H, goalWeight, config = {}) {
  const delta = Number(deltaInput || 0);
  const positive = Math.max(delta, 0);
  const negative = Math.max(-delta, 0);
  const positiveScale = Number(config.positiveScale ?? 0.5);
  const negativeScale = Number(config.negativeScale ?? 0.8);
  const positivePower = Number(config.positivePower ?? 1);
  const negativePower = Number(config.negativePower ?? 1);
  const perceptualWeight = Number(H || 0) * Number(goalWeight || 0);
  return {
    delta: round(delta),
    positiveScale,
    negativeScale,
    positivePower,
    negativePower,
    H: round(H),
    goalWeight: round(goalWeight),
    value: round((positiveScale * Math.pow(positive, positivePower)
      - negativeScale * Math.pow(negative, negativePower)) * perceptualWeight),
  };
}

function calculateConfirmationFeedback(settlement, H, goalWeight, config = {}) {
  const confidence = clamp(
    settlement?.effectivePredictionConfidence
      ?? settlement?.predictionConfidence
      ?? 0.5,
    0,
    1,
  );
  const constant = Number(config.confirmationConstant ?? 0.1);
  const expectedProgress = combatProgress(settlement?.predictedCombatScore);
  const actualProgress = combatProgress(settlement?.actualCombatScore);
  const resultRatio = expectedProgress == null || actualProgress == null
    ? 1
    : actualProgress / Math.max(expectedProgress, 0.1);
  const geometric = confirmationGeometricMultiplier(resultRatio, config);
  const expectedLevel = Number(settlement?.expectedPerception?.level);
  const actualLevel = Number(settlement?.actualPerception?.level);
  const clearlyDisconfirmed = Number.isFinite(expectedLevel)
    && Number.isFinite(actualLevel)
    && actualLevel < expectedLevel;
  const appliedMultiplier = clearlyDisconfirmed ? 0 : geometric.multiplier;
  const perceptualWeight = Number(H || 0) * Number(goalWeight || 0);
  return {
    applied: confidence > 0 && !clearlyDisconfirmed,
    samePerceivedBand: settlement?.confirmed === true,
    clearlyDisconfirmed,
    constant,
    confidence: round(confidence),
    H: round(H),
    goalWeight: round(goalWeight),
    expectedProgress: round(expectedProgress),
    actualProgress: round(actualProgress),
    resultRatio: round(resultRatio),
    geometricMultiplier: appliedMultiplier,
    rawGeometricMultiplier: geometric.multiplier,
    geometricBranch: clearlyDisconfirmed
      ? "clear_downward_disconfirmation_zeroes_confirmation"
      : geometric.branch,
    positivePower: geometric.positivePower,
    negativePower: geometric.negativePower,
    maxMultiplier: geometric.maxMultiplier,
    value: round(constant * confidence * perceptualWeight * appliedMultiplier),
  };
}

function confirmationGeometricMultiplier(ratioInput, config = {}) {
  const ratio = Math.max(0, Number(ratioInput || 0));
  const positivePower = Number(config.confirmationPositivePower ?? 0.5);
  const negativePower = Number(config.confirmationNegativePower ?? 1.5);
  const maxMultiplier = Number(config.confirmationMaxMultiplier ?? 2);
  const multiplier = ratio >= 1
    ? Math.min(maxMultiplier, Math.pow(ratio, positivePower))
    : Math.pow(ratio, negativePower);
  return {
    ratio: round(ratio),
    multiplier: round(multiplier),
    branch: ratio >= 1 ? "self_serving_success_amplification" : "failed_confirmation_decay",
    positivePower,
    negativePower,
    maxMultiplier,
  };
}

function produceVerificationFeedback({
  rows = [],
  H = 0,
  config = {},
}) {
  const merged = mergeFeedbackConfig(config);
  const resolvedRows = rows.map((row) => verificationRow(row, H, merged.verification));
  const strategySatisfaction = sum(resolvedRows, (row) => row.derived.strategySatisfaction);
  const discoverySatisfaction = sum(resolvedRows, (row) => row.derived.discoverySatisfaction);
  const knowledgeEvidence = sum(resolvedRows, (row) => row.derived.knowledgeEvidence);
  const strategyEmotion = strategySatisfaction * merged.verification.strategyEmotionScale;
  const discoveryEmotion = discoverySatisfaction * merged.verification.discoveryEmotionScale;
  return {
    channel: "EVerify",
    value: round(strategyEmotion + discoveryEmotion),
    dimensions: {
      support: round(average(resolvedRows, (row) => row.dimensions.support)),
      strength: round(average(resolvedRows, (row) => row.dimensions.strength)),
      contribution: round(average(resolvedRows, (row) => row.dimensions.contributionWeight)),
      novelty: round(average(resolvedRows, (row) => row.dimensions.novelty)),
      closure: round(average(resolvedRows, (row) => row.dimensions.closure)),
    },
    derived: {
      knowledgeEvidence: round(knowledgeEvidence),
      strategySatisfaction: round(strategySatisfaction),
      discoverySatisfaction: round(discoverySatisfaction),
      strategyEmotion: round(strategyEmotion),
      discoveryEmotion: round(discoveryEmotion),
    },
    rows: resolvedRows,
  };
}

function verificationRow(row, H, config) {
  const explicit = row.causalEvidence && typeof row.causalEvidence === "object"
    ? row.causalEvidence
    : {};
  const fallbackSupport = row.status === "confirmed" ? 1 : row.status === "refuted" ? -1 : 0;
  const alternativeStrength = clamp(explicit.alternativeExplanationStrength, 0, 1);
  const support = clamp(
    (isFiniteValue(explicit.support) ? Number(explicit.support) : fallbackSupport)
      * (1 - alternativeStrength),
    -1,
    1,
  );
  const strength = isFiniteValue(explicit.strength)
    ? clamp(explicit.strength, 0, 1)
    : inferEvidenceStrength(row, H);
  const contribution = normalizeContribution(explicit.contribution, config.unknownContributionWeight);
  const novelty = clamp(explicit.novelty, 0, 1);
  const closure = isFiniteValue(explicit.closure)
    ? clamp(explicit.closure, 0, 1)
    : 0;
  const strategySatisfaction = Math.max(0, support) * strength;
  const discoverySatisfaction = novelty * strength * closure;
  const knowledgeEvidence = support * strength * contribution.weight;

  return {
    id: row.id,
    status: row.status,
    comparisonMade: Boolean(row.comparisonMade),
    evidenceSource: Object.keys(explicit).length ? "semantic_causal_evidence" : "target_condition_proxy",
    dimensions: {
      support: round(support),
      strength: round(strength),
      contribution: contribution.kind,
      contributionWeight: round(contribution.weight),
      novelty: round(novelty),
      closure: round(closure),
    },
    derived: {
      knowledgeEvidence: round(knowledgeEvidence),
      strategySatisfaction: round(strategySatisfaction),
      discoverySatisfaction: round(discoverySatisfaction),
    },
  };
}

function composeFeedback({ process, result, expectation, verification }) {
  const channels = {
    process: process || produceProcessFeedback({}),
    R: result || produceResultFeedback({ enabled: false }),
    A: expectation || produceExpectationFeedback({}),
    EVerify: verification || produceVerificationFeedback({}),
  };
  return {
    schema: "player_feedback_bundle_v1",
    channels,
    total: round(
      Number(channels.process.value || 0)
      + Number(channels.R.value || 0)
      + Number(channels.A.value || 0)
      + Number(channels.EVerify.value || 0),
    ),
  };
}

function applyCausalKnowledgeEvidence(rows, hypothesis, verificationRowInput, event, config = {}) {
  const evidence = Number(verificationRowInput?.derived?.knowledgeEvidence || 0);
  if (!hypothesis || !verificationRowInput?.comparisonMade || Math.abs(evidence) < 0.000001) return null;
  const merged = mergeFeedbackConfig(config);
  const scope = {
    cause: hypothesis.cause || "",
    behavior: hypothesis.chosenBehavior || hypothesis.action || "",
    resultKind: hypothesis.resultKind || "",
    target: hypothesis.target || "",
    targetCondition: hypothesis.targetCondition || null,
    environment: {
      region: event?.environment?.region || null,
      node: event?.environment?.node || null,
    },
  };
  const key = JSON.stringify(scope);
  let row = rows.find((candidate) => candidate.key === key);
  if (!row) {
    row = {
      id: `causal-knowledge:${rows.length + 1}`,
      key,
      scope,
      supportMass: merged.verification.causalPriorSupportMass,
      refuteMass: merged.verification.causalPriorRefuteMass,
      evidenceCount: 0,
      belief: 0,
      confidence: 0,
      evidence: [],
    };
    rows.push(row);
  }
  row.supportMass += Math.max(evidence, 0);
  row.refuteMass += Math.max(-evidence, 0);
  row.evidenceCount += 1;
  row.belief = round((row.supportMass - row.refuteMass) / (row.supportMass + row.refuteMass));
  row.confidence = round(Math.abs(row.belief));
  row.lastStatus = verificationRowInput.status;
  row.lastEventId = event?.id || null;
  row.evidence.push({
    eventId: event?.id || null,
    hypothesisId: hypothesis.id,
    status: verificationRowInput.status,
    evidence: round(evidence),
  });
  return summarizeCausalKnowledge(row);
}

function summarizeCausalKnowledge(row) {
  return row ? {
    id: row.id,
    scope: row.scope,
    belief: round(row.belief),
    confidence: round(row.confidence),
    evidenceCount: row.evidenceCount,
    lastStatus: row.lastStatus,
    lastEventId: row.lastEventId,
  } : null;
}

function inferEvidenceStrength(row, H) {
  if (!row.comparisonMade) return 0;
  const visibility = Math.sqrt(clamp(H, 0, 1));
  const condition = row.targetCondition;
  const observed = Number(row.observedValue);
  if (!condition || !Number.isFinite(observed)) return round(visibility * 0.5);
  const target = Number(condition.value);
  const floor = condition.metric === "damageRank" || condition.metric === "skillCount" ? 1 : 0.1;
  const relativeGap = Math.abs(observed - target) / Math.max(Math.abs(target), floor);
  const separation = 0.5 + 0.5 * (1 - Math.exp(-2 * relativeGap));
  return round(visibility * separation);
}

function combatProgress(scoreInput) {
  const score = Number(scoreInput);
  return Number.isFinite(score) ? clamp((score + 1) / 2, 0, 1) : null;
}

function normalizeContribution(input, unknownWeight) {
  if (isFiniteValue(input)) {
    return { kind: "numeric", weight: clamp(input, 0, 1) };
  }
  const kind = Object.hasOwn(CONTRIBUTION_WEIGHTS, input) ? input : "unknown";
  return {
    kind,
    weight: kind === "unknown" ? clamp(unknownWeight, 0, 1) : CONTRIBUTION_WEIGHTS[kind],
  };
}

function isFiniteValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function mergeFeedbackConfig(input) {
  return {
    ...DEFAULT_FEEDBACK_CONFIG,
    ...(input || {}),
    verification: {
      ...DEFAULT_FEEDBACK_CONFIG.verification,
      ...(input?.verification || {}),
    },
  };
}

function average(rows, getter) {
  return rows.length ? sum(rows, getter) / rows.length : 0;
}

function sum(rows, getter) {
  return rows.reduce((total, row) => total + Number(getter(row) || 0), 0);
}

function clamp(value, min, max) {
  const number = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : 0));
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

module.exports = {
  DEFAULT_FEEDBACK_CONFIG,
  produceProcessFeedback,
  produceResultFeedback,
  produceExpectationFeedback,
  calculateMismatchFeedback,
  calculateConfirmationFeedback,
  confirmationGeometricMultiplier,
  produceVerificationFeedback,
  composeFeedback,
  applyCausalKnowledgeEvidence,
  summarizeCausalKnowledge,
};
