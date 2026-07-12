const DEFAULT_CONFIG = {
  version: "cognition-v5-sandbox-1",
  initialFeedbackStock: 38,
  abandonThreshold: 20,
  stockDecayPerSecond: 0.15,
  cognitiveProcessWeight: 0.35,
  wProcessWeight: 0.4,
  k: 0.35,
  q: {
    baseWithDecision: 0.08,
    clarityWeight: 0.1,
    causalWeight: 0.08,
    progressWeight: 0.06,
    deadRepetitionPenalty: 0.22,
    incomprehensionPenalty: 0.4,
    noDecisionBase: 0,
  },
  result: {
    progressionScale: 0.45,
    growthScale: 2.5,
    peakGrowthWeight: 0.25,
    impactGrowthWeight: 0.2,
    verificationBase: 1.2,
  },
  mismatch: {
    positiveScale: 0.4,
    positivePower: 0.9,
    negativeScale: 1.05,
    negativePower: 1.15,
  },
  freshnessLambda: 0.24,
  familyFreshnessWeight: 0.3,
  magnitudeSurpriseWeight: 0.7,
  breakthroughWeight: 0.4,
  baselineAlpha: 0.25,
};

const SCENARIOS = [
  {
    id: "opening_ten_hit_baseline",
    title: "First ten-hit ordinary enemy, no prior decision",
    wSeconds: 10,
    decisionSteps: [],
    verify: null,
    signal: { salience: 0.75, perceptual: 0.9, causal: 0.9, goal: 0.7, repetitions: 10 },
    process: { deadRepetition: 0.25, incomprehension: 0, progressReadability: 0.9 },
    progression: 1,
    progressionFreshness: 1,
    performance: { d50: 100, d90: 150, frequency: 1, impact: 0.1 },
    baseline: null,
  },
  {
    id: "upgrade_hypothesis_confirmed",
    title: "Failure -> equip upgrade -> damage target confirmed",
    wSeconds: 10,
    decisionSteps: ["problem", "cause", "behavior", "hypothesis"],
    verify: { compared: true, observed: 140, operator: ">=", target: 120, freshness: 0.9 },
    signal: { salience: 0.8, perceptual: 0.9, causal: 0.95, goal: 1, repetitions: 8 },
    process: { deadRepetition: 0.15, incomprehension: 0, progressReadability: 0.9 },
    progression: 1,
    progressionFreshness: 1,
    performance: { d50: 140, d90: 220, frequency: 1.05, impact: 0.14 },
    baseline: { d50: 100, d90: 150, frequency: 1, impact: 0.1, confidence: 0.8 },
    agencyBefore: { desire: 1, gap: 0.6, clarity: 0.8, path: 0.7, causal: 0.55, improvement: 0.4, cost: 1 },
    agencyAfter: { desire: 1, gap: 0.42, clarity: 0.9, path: 0.85, causal: 0.85, improvement: 0.4, cost: 1 },
    decisionContext: {
      triedBehavior: "equip_upgrade",
      causes: [
        { id: "equipment_too_weak", confidence: 0.6 },
        { id: "wrong_character", confidence: 0.3 },
        { id: "bad_position", confidence: 0.1 },
      ],
      behaviors: [
        { id: "equip_upgrade", available: true, addresses: ["equipment_too_weak"], causal: 0.8, improvement: 0.4, cost: 1 },
        { id: "swap_character", available: true, addresses: ["wrong_character"], causal: 0.6, improvement: 0.2, cost: 0.8 },
        { id: "change_position", available: true, addresses: ["bad_position"], causal: 0.35, improvement: 0.15, cost: 0.3 },
      ],
    },
  },
  {
    id: "position_hypothesis_refuted",
    title: "Failure -> change position -> survival target missed",
    wSeconds: 10,
    decisionSteps: ["problem", "cause", "behavior", "hypothesis"],
    verify: { compared: true, observed: 8, operator: ">=", target: 12, freshness: 1 },
    signal: { salience: 0.7, perceptual: 0.85, causal: 0.8, goal: 1, repetitions: 5 },
    process: { deadRepetition: 0.2, incomprehension: 0.1, progressReadability: 0.7 },
    progression: 0.35,
    progressionFreshness: 0.8,
    otherResult: -1.5,
    performance: null,
    baseline: null,
    agencyBefore: { desire: 1, gap: 0.7, clarity: 0.75, path: 0.8, causal: 0.35, improvement: 0.25, cost: 0.4 },
    agencyAfter: { desire: 1, gap: 0.7, clarity: 0.8, path: 0.65, causal: 0.12, improvement: 0.2, cost: 0.4 },
    decisionContext: {
      triedBehavior: "change_position",
      causes: [
        { id: "equipment_too_weak", confidence: 0.6 },
        { id: "wrong_character", confidence: 0.3 },
        { id: "bad_position", confidence: 0.1 },
      ],
      behaviors: [
        { id: "equip_upgrade", available: true, addresses: ["equipment_too_weak"], causal: 0.8, improvement: 0.4, cost: 1 },
        { id: "swap_character", available: true, addresses: ["wrong_character"], causal: 0.6, improvement: 0.2, cost: 0.8 },
        { id: "change_position", available: true, addresses: ["bad_position"], causal: 0.35, improvement: 0.15, cost: 0.3 },
      ],
    },
  },
  {
    id: "random_multikill",
    title: "Random five-target kill without a decision",
    wSeconds: 2,
    decisionSteps: [],
    verify: null,
    signal: { salience: 1, perceptual: 0.95, causal: 0.55, goal: 0.8, repetitions: 1 },
    process: { deadRepetition: 0, incomprehension: 0.2, progressReadability: 0.95 },
    progression: 1.8,
    progressionFreshness: 1,
    otherResult: 1,
    performance: null,
    baseline: null,
  },
  {
    id: "planned_multikill",
    title: "Chosen chain build produces the predicted five-target kill",
    wSeconds: 2,
    decisionSteps: ["problem", "cause", "behavior", "hypothesis"],
    verify: { compared: true, observed: 5, operator: ">=", target: 5, freshness: 1 },
    signal: { salience: 1, perceptual: 0.95, causal: 0.95, goal: 1, repetitions: 1 },
    process: { deadRepetition: 0, incomprehension: 0, progressReadability: 0.95 },
    progression: 1.8,
    progressionFreshness: 1,
    otherResult: 1,
    performance: null,
    baseline: null,
  },
];

const PLAYER_PROFILES = {
  balanced: {},
  impatient: {
    abandonThreshold: 28,
    stockDecayPerSecond: 0.3,
    cognitiveProcessWeight: 0.25,
    k: 0.45,
    mismatch: { negativeScale: 1.2 },
  },
  analytical: {
    abandonThreshold: 18,
    stockDecayPerSecond: 0.1,
    cognitiveProcessWeight: 0.45,
    k: 0.3,
    q: { baseWithDecision: 0.12 },
  },
};

function simulateScenario(input, configInput = {}) {
  const config = mergeConfig(configInput);
  const EDecision = validDecisionStepCount(input.decisionSteps || []);
  const verification = evaluateVerification(input.verify);
  const EVerify = verification.compared ? 1 : 0;
  const E = EDecision + EVerify;
  const W = Math.max(0, Number(input.wSeconds) || 0);
  const P = config.cognitiveProcessWeight * E + config.wProcessWeight * W;
  const h = signalStrength(input.signal);
  const averageFreshness = averageEventFreshness(input.signal?.repetitions || 1, config.freshnessLambda);
  const q = processQuality(input, E, h, config);
  const growth = growthFeedback(input.performance, input.baseline, averageFreshness, config);
  const progressionR = config.result.progressionScale
    * Math.max(0, Number(input.progression) || 0)
    * clamp(input.process?.progressReadability ?? 1, 0, 1)
    * clamp(input.signal?.causal ?? 1, 0, 1)
    * clamp(input.progressionFreshness ?? 1, 0, 1);
  const verificationR = verification.status === "confirmed"
    ? config.result.verificationBase * clamp(input.verify.freshness ?? 1, 0, 1)
    : 0;
  const R = progressionR + growth.value + verificationR + (Number(input.otherResult) || 0);
  const expectedResult = config.k * P;
  const mismatch = R - expectedResult;
  const A = mismatchFeedback(mismatch, config.mismatch);
  const processFeedback = P * q;
  const totalExperience = processFeedback + R + A;
  const feedbackAfter = clamp(
    config.initialFeedbackStock - config.stockDecayPerSecond * W + totalExperience,
    0,
    100,
  );
  const nextAction = chooseNextAction(input, verification.status, feedbackAfter, config);
  return {
    id: input.id,
    title: input.title,
    H: round(h),
    averageFreshness: round(averageFreshness),
    EDecision,
    EVerify,
    E,
    W: round(W),
    P: round(P),
    Q: round(q),
    processFeedback: round(processFeedback),
    progressionR: round(progressionR),
    growth,
    verificationR: round(verificationR),
    R: round(R),
    expectedResult: round(expectedResult),
    mismatch: round(mismatch),
    A: round(A),
    totalExperience: round(totalExperience),
    feedbackBefore: config.initialFeedbackStock,
    feedbackAfter: round(feedbackAfter),
    agencyBefore: agency(input.agencyBefore),
    agencyAfter: agency(input.agencyAfter),
    hypothesisStatus: verification.status,
    nextAction,
  };
}

function simulateMagnitudeSequence(values, startReference = 33, configInput = {}) {
  const config = mergeConfig(configInput);
  let expectedLogMagnitude = Math.log(Math.max(1e-6, startReference));
  let historicalPeak = Math.max(1e-6, startReference);
  let exposureCount = 0;
  return values.map((value, index) => {
    const expectedBefore = Math.exp(expectedLogMagnitude);
    const freshness = Math.exp(-config.freshnessLambda * exposureCount);
    const surprise = Math.log(Math.max(1e-6, value) / Math.max(1e-6, expectedBefore));
    const breakthrough = Math.max(0, Math.log(Math.max(1e-6, value) / historicalPeak));
    const positiveMagnitudeFeedback =
      config.familyFreshnessWeight * freshness
      + config.magnitudeSurpriseWeight * Math.max(0, surprise)
      + config.breakthroughWeight * breakthrough;
    const row = {
      index,
      value,
      expectedBefore: round(expectedBefore),
      freshness: round(freshness),
      magnitudeSurprise: round(surprise),
      breakthrough: round(breakthrough),
      feedback: round(positiveMagnitudeFeedback),
    };
    exposureCount += 1;
    historicalPeak = Math.max(historicalPeak, value);
    expectedLogMagnitude += config.baselineAlpha * (Math.log(Math.max(1e-6, value)) - expectedLogMagnitude);
    return row;
  });
}

function processQuality(input, E, h, config) {
  const row = input.process || {};
  const signal = input.signal || {};
  let value = E > 0 ? config.q.baseWithDecision : config.q.noDecisionBase;
  if (E > 0) {
    value += config.q.clarityWeight * (signal.perceptual ?? 0);
    value += config.q.causalWeight * (signal.causal ?? 0);
    value += config.q.progressWeight * (row.progressReadability ?? 0);
  }
  value -= config.q.deadRepetitionPenalty * (row.deadRepetition ?? 0);
  value -= config.q.incomprehensionPenalty * (row.incomprehension ?? 0);
  if (E === 0 && h >= 0.7 && (row.progressReadability ?? 0) >= 0.8) value = Math.max(value, 0);
  return clamp(value, -1, 1);
}

function validDecisionStepCount(steps) {
  const expected = ["problem", "cause", "behavior", "hypothesis"];
  let count = 0;
  for (let index = 0; index < expected.length; index += 1) {
    if (steps[index] !== expected[index]) break;
    count += 1;
  }
  return count;
}

function evaluateVerification(input) {
  if (!input) return { compared: false, status: "none" };
  if (!input.compared) return { compared: false, status: "pending" };
  const observed = Number(input.observed);
  const target = Number(input.target);
  if (!Number.isFinite(observed) || !Number.isFinite(target)) {
    return { compared: true, status: "inconclusive" };
  }
  const operators = {
    ">=": (a, b) => a >= b,
    "<=": (a, b) => a <= b,
    ">": (a, b) => a > b,
    "<": (a, b) => a < b,
    "==": (a, b) => a === b,
  };
  if (!operators[input.operator]) return { compared: true, status: "inconclusive" };
  const met = operators[input.operator](observed, target);
  return { compared: true, status: met ? "confirmed" : "refuted" };
}

function selectAction(context, excludeId = null) {
  if (!context) return null;
  const causeConfidence = Object.fromEntries((context.causes || []).map((row) => [
    row.id,
    clamp(Number(row.confidence) || 0, 0, 1),
  ]));
  const rows = (context.behaviors || [])
    .filter((row) => row.available && row.id !== excludeId)
    .map((row) => {
      const attribution = (row.addresses || []).reduce(
        (sum, cause) => sum + (causeConfidence[cause] || 0),
        0,
      );
      const roi = clamp(Number(row.causal) || 0, 0, 1)
        * Math.max(0, Number(row.improvement) || 0)
        / Math.max(0.05, Number(row.cost) || 0);
      return { id: row.id, score: attribution * roi };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return rows[0] && rows[0].score > 0 ? { id: rows[0].id, score: round(rows[0].score) } : null;
}

function chooseNextAction(input, verificationStatus, feedbackAfter, config) {
  if (verificationStatus === "confirmed") {
    return { type: "continue", reason: "hypothesis_confirmed" };
  }
  if (verificationStatus === "refuted") {
    const alternative = selectAction(input.decisionContext, input.decisionContext?.triedBehavior);
    if (alternative) return { type: "switch", behavior: alternative.id, score: alternative.score };
  }
  if (feedbackAfter < config.abandonThreshold) {
    return { type: "abandon", reason: "feedback_below_threshold" };
  }
  return { type: "continue", reason: "no_better_known_action" };
}

function growthFeedback(current, baseline, freshness, config) {
  if (!current || !baseline) {
    return { value: 0, status: "baseline_created", gTypical: 0, gFrequency: 0, gPeak: 0, gImpact: 0 };
  }
  const gTypical = safeLogRatio(current.d50, baseline.d50);
  const gFrequency = safeLogRatio(current.frequency, baseline.frequency);
  const gPeak = safeLogRatio(current.d90, baseline.d90);
  const gImpact = safeLogRatio(current.impact, baseline.impact);
  const combined = gTypical + gFrequency
    + config.result.peakGrowthWeight * gPeak
    + config.result.impactGrowthWeight * gImpact;
  const value = clamp(baseline.confidence ?? 1, 0, 1)
    * freshness
    * config.result.growthScale
    * Math.tanh(combined);
  return {
    value: round(value),
    status: "compared",
    gTypical: round(gTypical),
    gFrequency: round(gFrequency),
    gPeak: round(gPeak),
    gImpact: round(gImpact),
  };
}

function signalStrength(signal = {}) {
  return clamp(signal.salience ?? 0, 0, 1)
    * clamp(signal.perceptual ?? 0, 0, 1)
    * clamp(signal.causal ?? 0, 0, 1)
    * clamp(signal.goal ?? 0, 0, 1);
}

function averageEventFreshness(count, lambda) {
  if (count <= 0) return 1;
  let total = 0;
  for (let index = 0; index < count; index += 1) total += Math.exp(-lambda * index);
  return total / count;
}

function mismatchFeedback(delta, config) {
  if (delta >= 0) return config.positiveScale * Math.pow(delta, config.positivePower);
  return -config.negativeScale * Math.pow(-delta, config.negativePower);
}

function agency(input) {
  if (!input) return null;
  const goal = clamp(input.desire, 0, 1) * clamp(input.gap, 0, 1) * clamp(input.clarity, 0, 1);
  const roi = clamp(input.causal, 0, 1) * Math.max(0, input.improvement) / Math.max(0.05, input.cost);
  return { goal: round(goal), roi: round(roi), value: round(goal * clamp(input.path, 0, 1) * roi) };
}

function mergeConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    q: { ...DEFAULT_CONFIG.q, ...(overrides.q || {}) },
    result: { ...DEFAULT_CONFIG.result, ...(overrides.result || {}) },
    mismatch: { ...DEFAULT_CONFIG.mismatch, ...(overrides.mismatch || {}) },
  };
}

function safeLogRatio(a, b) {
  return Math.log(Math.max(1e-6, a) / Math.max(1e-6, b));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function runSuite(config = {}) {
  return {
    config: mergeConfig(config),
    scenarios: SCENARIOS.map((scenario) => simulateScenario(scenario, config)),
    magnitudeSequence: simulateMagnitudeSequence([999, 999, 999, 1999, 1999, 29970], 33, config),
  };
}

function runProfiles() {
  return Object.fromEntries(Object.entries(PLAYER_PROFILES).map(([id, config]) => [
    id,
    SCENARIOS.map((scenario) => simulateScenario(scenario, config)),
  ]));
}

if (require.main === module) {
  console.log(JSON.stringify({ ...runSuite(), profiles: runProfiles() }, null, 2));
}

module.exports = {
  DEFAULT_CONFIG,
  PLAYER_PROFILES,
  SCENARIOS,
  evaluateVerification,
  runSuite,
  runProfiles,
  selectAction,
  simulateMagnitudeSequence,
  simulateScenario,
  validDecisionStepCount,
};
