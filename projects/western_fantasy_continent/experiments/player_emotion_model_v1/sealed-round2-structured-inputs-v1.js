/*
 * Blind round 2 objective-event structures. Created after the round 1 fixes and
 * before any round 2 answer was opened.
 */
const { NEUTRAL_PROFILE } = require("./sealed-round1-structured-inputs-v1");

function stake(valueKey, magnitude, overrides = {}) {
  return {
    targetId: valueKey,
    valueKey,
    magnitude,
    probability: 1,
    direction: "negative",
    timeToImpactSeconds: 0,
    immediacyHorizonSeconds: 60,
    confidence: 0.82,
    ...overrides,
  };
}

function outcome(actualUtility, overrides = {}) {
  return {
    actualUtility,
    goalProgress: actualUtility,
    confidence: 0.8,
    ...overrides,
  };
}

function agency(actorIsSelf, causalContribution, intentionality) {
  return {
    actorIsSelf,
    causalContribution,
    intentionality,
    evidenceConfidence: 0.88,
  };
}

function input(caseId, event) {
  return {
    caseId,
    profile: NEUTRAL_PROFILE,
    history: { memories: [] },
    events: [event],
    audit: {
      sourceRead: "round2.inputs.jsonl only",
      reportedEmotionAnswerRead: false,
      encodingMethod: "manual objective-fact structuring before reveal",
    },
  };
}

function noIncident(caseId) {
  return input(caseId, {
    id: "no-recalled-event",
    time: 0,
    epistemic: {
      requiredInformationMissing: 1,
      familiarity: 0,
      informationGain: 0,
      confidence: 0.95,
    },
    targets: { informationObject: "unreported incident" },
  });
}

const round2StructuredInputs = [
  input("isear-a01bc0ccfb5e646e2a31", {
    id: "await-dentist",
    time: 0,
    domain: "medicalThreat",
    difficulty: 0.65,
    stakes: [stake("safety", 0.55, { probability: 0.7, timeToImpactSeconds: 900 })],
    options: [{
      id: "endure-treatment",
      type: "confront",
      availability: 0.8,
      known: 0.75,
      expectedEffectiveness: 0.75,
      cost: 0.45,
      confidence: 0.75,
    }],
    outcome: outcome(0, { expectedUncertainty: 0.6, positiveProspect: 0.45 }),
    targets: { threatSource: "dental procedure" },
  }),
  input("isear-272c0b4c737f13e7103a", {
    id: "mother-critical-accident",
    time: 0,
    domain: "familyThreat",
    difficulty: 0.95,
    stakes: [stake("relationship", 1, {
      probability: 0.85,
      realizedFraction: 0.45,
      irreversibility: 0.9,
      confidence: 0.95,
    })],
    outcome: outcome(-0.65, { expectedUncertainty: 0.85, relationshipChange: -0.65 }),
    social: {
      relationshipId: "family",
      attachmentRelevance: 1,
      relationshipLossProbability: 0.85,
      confidence: 0.96,
    },
    targets: { threatSource: "mother's injuries", relationship: "mother" },
  }),
  input("isear-441e0544661d962b1e4e", {
    id: "intimacy-without-affection",
    time: 0,
    domain: "moralChoice",
    outcome: outcome(-0.55, {
      selfEvaluationChange: -0.55,
      relationshipChange: -0.35,
      bestForeseeableAlternativeUtility: 0.35,
      alternativeForeseeability: 0.85,
    }),
    agency: agency(true, 0.95, 0.9),
    social: {
      relationshipId: "stranger",
      normSeverity: 0.65,
      harmToOther: 0.4,
      audienceExposure: 0.05,
      confidence: 0.78,
    },
    sensory: {
      aversiveContactSeverity: 0.7,
      confidence: 0.82,
    },
    targets: { harmedOther: "sexual partner", selfEvaluationTarget: "integrity" },
  }),
  input("isear-2f9b19fc118257919d42", {
    id: "near-car-collision",
    time: 0,
    domain: "physicalThreat",
    difficulty: 0.92,
    stakes: [stake("safety", 0.95, { probability: 0.9, confidence: 0.95 })],
    options: [{
      id: "evade",
      type: "escape",
      availability: 0.35,
      known: 0.8,
      expectedEffectiveness: 0.45,
      cost: 0.15,
      confidence: 0.82,
    }],
    epistemic: { expectationViolation: 0.9, confidence: 0.9 },
    targets: { threatSource: "car" },
  }),
  input("isear-60fc7fc8096b94843b6f", {
    id: "unrequited-love",
    time: 0,
    domain: "relationshipLoss",
    stakes: [stake("relationship", 0.9, {
      realizedFraction: 0.9,
      irreversibility: 0.65,
      confidence: 0.9,
    })],
    outcome: outcome(-0.85, { relationshipChange: -0.85 }),
    social: {
      relationshipId: "partner",
      attachmentRelevance: 0.95,
      relationshipLossProbability: 0.85,
      confidence: 0.9,
    },
    targets: { lossTarget: "desired relationship", relationship: "loved girl" },
  }),
  input("isear-6ae191e4f05da03e8a81", {
    id: "fail-entrance-exam",
    time: 0,
    domain: "achievement",
    stakes: [stake("competence", 0.8, {
      realizedFraction: 1,
      irreversibility: 0.5,
      confidence: 0.95,
    })],
    outcome: outcome(-0.85, {
      expectedUtility: 0.35,
      expectationConfidence: 0.7,
      selfEvaluationChange: -0.75,
    }),
    agency: agency(true, 0.65, 0.1),
    social: { audienceExposure: 0.3, statusDamage: 0.6, confidence: 0.75 },
    targets: { selfEvaluationTarget: "academic competence", lossTarget: "university place" },
  }),
  noIncident("isear-1820e2c684abd64de1a5"),
  input("isear-35c5df59915534dca1c7", {
    id: "recurrent-excess-workload",
    time: 0,
    domain: "work",
    difficulty: 0.85,
    stakes: [stake("comfort", 0.7, {
      probability: 1,
      realizedFraction: 0.75,
      irreversibility: 0.15,
    })],
    options: [{
      id: "reduce-work",
      type: "repair",
      availability: 0.35,
      known: 0.65,
      expectedEffectiveness: 0.6,
      cost: 0.5,
      confidence: 0.65,
    }],
    outcome: outcome(-0.7),
    epistemic: { familiarity: 0.9, informationGain: 0.05, confidence: 0.9 },
    targets: { obstructionSource: "workload" },
  }),
  input("isear-e387748d8354447ff408", {
    id: "friend-died",
    time: 0,
    domain: "relationshipLoss",
    stakes: [stake("relationship", 1, {
      realizedFraction: 1,
      irreversibility: 1,
      confidence: 0.98,
    })],
    outcome: outcome(-1, { relationshipChange: -1 }),
    social: {
      relationshipId: "friend",
      attachmentRelevance: 1,
      confidence: 0.98,
    },
    targets: { lossTarget: "friend", relationship: "friend" },
  }),
  input("isear-b6bb7250cc6e134cd948", {
    id: "observe-disapproved-style",
    time: 0,
    domain: "socialNorm",
    outcome: outcome(-0.25),
    agency: agency(false, 0.75, 0.9),
    social: { normSeverity: 0.45, confidence: 0.55 },
    targets: { normTarget: "imitated foreign dress" },
  }),
  input("isear-761f663af13ba798b833", {
    id: "close-partner-avoids-me",
    time: 0,
    domain: "relationshipLoss",
    stakes: [stake("relationship", 0.9, {
      realizedFraction: 0.8,
      irreversibility: 0.6,
      confidence: 0.9,
    })],
    outcome: outcome(-0.85, {
      relationshipChange: -0.85,
      selfEvaluationChange: -0.45,
    }),
    agency: agency(true, 0.5, 0.55),
    social: {
      relationshipId: "partner",
      attachmentRelevance: 1,
      relationshipLossProbability: 0.9,
      normSeverity: 0.45,
      harmToOther: 0.35,
      confidence: 0.85,
    },
    targets: { lossTarget: "intimate relationship", relationship: "close friend" },
  }),
  noIncident("isear-9b79904b066c459e0af3"),
  input("isear-a8d76cd948fbb2dcf367", {
    id: "intimate-friend-chooses-girlfriend",
    time: 0,
    domain: "relationshipLoss",
    stakes: [stake("relationship", 0.95, {
      realizedFraction: 0.9,
      irreversibility: 0.7,
      confidence: 0.95,
    })],
    outcome: outcome(-0.9, { relationshipChange: -0.9 }),
    agency: agency(false, 0.85, 0.7),
    social: {
      relationshipId: "partner",
      attachmentRelevance: 1,
      relationshipLossProbability: 0.95,
      comparisonRelevance: 0.9,
      otherOutcomeUtility: 0.75,
      selfOutcomeUtility: -0.75,
      confidence: 0.95,
    },
    targets: { lossTarget: "intimate relationship", relationship: "friend" },
  }),
  input("isear-446ba4f4d4001e4b1c41", {
    id: "short-sexual-relationship-without-love",
    time: 0,
    domain: "moralChoice",
    outcome: outcome(-0.5, {
      selfEvaluationChange: -0.5,
      bestForeseeableAlternativeUtility: 0.3,
      alternativeForeseeability: 0.8,
    }),
    agency: agency(true, 0.95, 0.9),
    social: {
      relationshipId: "stranger",
      normSeverity: 0.6,
      harmToOther: 0.35,
      confidence: 0.75,
    },
    targets: { harmedOther: "sexual partner", selfEvaluationTarget: "integrity" },
  }),
  input("isear-0589b7aed0ef230c897e", {
    id: "forgot-bus-pass",
    time: 0,
    domain: "selfError",
    difficulty: 0.5,
    outcome: outcome(-0.5, { selfEvaluationChange: -0.5 }),
    agency: agency(true, 0.95, 0.05),
    options: [{
      id: "find-alternative-fare",
      type: "repair",
      availability: 0.55,
      known: 0.65,
      expectedEffectiveness: 0.6,
      cost: 0.45,
      confidence: 0.6,
    }],
    social: {
      normSeverity: 0.35,
      audienceExposure: 0.45,
      statusDamage: 0.25,
      confidence: 0.7,
    },
    targets: { selfEvaluationTarget: "competence" },
  }),
  input("isear-c3c0198111af1912f6fd", {
    id: "unjustified-assault",
    time: 0,
    domain: "witnessedHarm",
    stakes: [stake("fairness", 0.9, {
      realizedFraction: 1,
      irreversibility: 0.45,
      confidence: 0.92,
    })],
    outcome: outcome(-0.9),
    agency: agency(false, 0.98, 1),
    social: { normSeverity: 1, harmToOther: 0.95, confidence: 0.95 },
    targets: { normTarget: "unjustified assault", harmedOther: "victim" },
  }),
  input("isear-d6dcec734cbbffb48edc", {
    id: "university-admission",
    time: 0,
    domain: "achievement",
    outcome: outcome(0.95, {
      expectedUtility: 0.35,
      expectationConfidence: 0.65,
      rewardConsumed: 0.9,
      selfEvaluationChange: 0.8,
    }),
    agency: agency(true, 0.9, 1),
    targets: { rewardSource: "university admission", selfEvaluationTarget: "competence" },
  }),
  input("isear-1090568abc285ff694a8", {
    id: "classmate-assaults-me",
    time: 0,
    domain: "physicalThreat",
    stakes: [stake("safety", 0.9, {
      realizedFraction: 0.7,
      ongoingThreatFraction: 0.85,
      irreversibility: 0.3,
      confidence: 0.9,
    })],
    outcome: outcome(-0.85),
    agency: agency(false, 0.98, 0.95),
    social: { normSeverity: 0.9, statusDamage: 0.45, confidence: 0.9 },
    targets: { threatSource: "classmate", obstructionSource: "classmate" },
  }),
  noIncident("isear-1eb8c8c330f84c45cce4"),
  noIncident("isear-a4d29f1662aa262afacd"),
  input("isear-3029c5055a04144cded0", {
    id: "late-homework",
    time: 0,
    domain: "selfError",
    outcome: outcome(-0.55, {
      selfEvaluationChange: -0.55,
      bestForeseeableAlternativeUtility: 0.35,
      alternativeForeseeability: 0.9,
    }),
    agency: agency(true, 0.9, 0.35),
    social: {
      normSeverity: 0.6,
      harmToOther: 0.2,
      audienceExposure: 0.4,
      statusDamage: 0.35,
      confidence: 0.8,
    },
    targets: { selfEvaluationTarget: "reliability", harmedOther: "teacher" },
  }),
  input("isear-9fcd98385cfe0533d68b", {
    id: "public-insult",
    time: 0,
    domain: "socialConflict",
    outcome: outcome(-0.75, { selfEvaluationChange: -0.6 }),
    agency: agency(false, 0.95, 0.9),
    social: {
      audienceExposure: 0.95,
      statusDamage: 0.9,
      normSeverity: 0.75,
      confidence: 0.92,
    },
    targets: { obstructionSource: "insulter", socialAudience: "public" },
  }),
];

module.exports = {
  round2StructuredInputs,
};
