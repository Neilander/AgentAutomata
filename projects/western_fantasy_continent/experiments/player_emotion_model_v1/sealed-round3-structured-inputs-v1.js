/*
 * Blind round 3 objective-event structures. Created without reading round 3 answers.
 */
const { NEUTRAL_PROFILE } = require("./sealed-round1-structured-inputs-v1");

const stake = (valueKey, magnitude, extra = {}) => ({
  targetId: valueKey,
  valueKey,
  magnitude,
  probability: 1,
  direction: "negative",
  timeToImpactSeconds: 0,
  immediacyHorizonSeconds: 60,
  confidence: 0.85,
  ...extra,
});
const outcome = (actualUtility, extra = {}) => ({
  actualUtility,
  goalProgress: actualUtility,
  confidence: 0.85,
  ...extra,
});
const self = (causalContribution = 0.9, intentionality = 0.5) => ({
  actorIsSelf: true,
  causalContribution,
  intentionality,
  evidenceConfidence: 0.9,
});
const other = (causalContribution = 0.9, intentionality = 0.8) => ({
  actorIsSelf: false,
  causalContribution,
  intentionality,
  evidenceConfidence: 0.9,
});
const input = (caseId, events) => ({
  caseId,
  profile: NEUTRAL_PROFILE,
  history: { memories: [] },
  events: Array.isArray(events) ? events : [events],
  audit: {
    sourceRead: "round3.inputs.jsonl only",
    reportedEmotionAnswerRead: false,
    encodingMethod: "manual objective-fact structuring before reveal",
  },
});
const noEvent = (caseId) => input(caseId, {
  id: "no-recalled-event",
  time: 0,
  epistemic: { requiredInformationMissing: 1, confidence: 0.95 },
});

const round3StructuredInputs = [
  input("isear-34b2e1e0f6f87b4e7d3e", [
    {
      id: "child-ear-illness",
      time: 0,
      stakes: [stake("relationship", 0.7, {
        probability: 0.75,
        ongoingThreatFraction: 0.65,
      })],
      outcome: outcome(-0.45, {
        expectedUncertainty: 0.65,
        relationshipChange: -0.3,
      }),
      social: {
        relationshipId: "family",
        attachmentRelevance: 0.95,
        relationshipLossProbability: 0.4,
        confidence: 0.85,
      },
      targets: { threatSource: "child's ear illness", relationship: "child" },
    },
    {
      id: "doctor-confirms-recovery",
      time: 60,
      outcome: outcome(0.85, {
        expectedUtility: -0.25,
        expectationConfidence: 0.75,
        rewardConsumed: 0.75,
        relationshipChange: 0.65,
        threatRemovedFraction: 1,
      }),
      social: {
        relationshipId: "family",
        attachmentRelevance: 0.95,
        safetyChange: 0.8,
        confidence: 0.95,
      },
      targets: { resolvedThreat: "child's illness", relationship: "child" },
    },
  ]),
  noEvent("isear-ff47a370871fffdd9910"),
  input("isear-102d3fd2ff49eb804868", {
    id: "grandfather-dies",
    time: 0,
    stakes: [stake("relationship", 0.95, {
      realizedFraction: 1,
      irreversibility: 1,
      confidence: 0.98,
    })],
    outcome: outcome(-1, { relationshipChange: -1 }),
    social: {
      relationshipId: "family",
      attachmentRelevance: 1,
      confidence: 0.98,
    },
    targets: { lossTarget: "grandfather", relationship: "grandfather" },
  }),
  input("isear-01355e57b27e0f6856f6", {
    id: "unexpected-exam-failure",
    time: 0,
    stakes: [stake("competence", 0.75, {
      realizedFraction: 1,
      irreversibility: 0.35,
    })],
    outcome: outcome(-0.8, {
      expectedUtility: 0.8,
      expectationConfidence: 0.9,
      selfEvaluationChange: -0.7,
    }),
    agency: self(0.7, 0.05),
    social: { audienceExposure: 0.25, statusDamage: 0.5, confidence: 0.75 },
    targets: { selfEvaluationTarget: "exam competence", lossTarget: "exam success" },
  }),
  noEvent("isear-37398a30abb73b3abc27"),
  input("isear-a8edb6d76c5d79b36c6e", {
    id: "cut-mature-trees-for-view",
    time: 0,
    stakes: [stake("fairness", 0.75, {
      realizedFraction: 0.9,
      irreversibility: 0.9,
    })],
    outcome: outcome(-0.75),
    agency: other(0.9, 0.9),
    social: { normSeverity: 0.8, harmToOther: 0.5, confidence: 0.8 },
    targets: { normTarget: "destroying trees for convenience", lossTarget: "trees" },
  }),
  input("isear-ff6d1fae7e6ce843478f", {
    id: "racially-unfair-treatment",
    time: 0,
    stakes: [stake("fairness", 0.85, {
      realizedFraction: 0.9,
      irreversibility: 0.55,
    })],
    outcome: outcome(-0.85),
    agency: other(0.9, 0.85),
    social: { normSeverity: 0.95, harmToOther: 0.8, confidence: 0.9 },
    targets: { normTarget: "racial discrimination", harmedOther: "unfairly treated people" },
  }),
  input("isear-f197ccc1cce0da7da224", {
    id: "close-friend-leaves",
    time: 0,
    stakes: [stake("relationship", 0.95, {
      realizedFraction: 1,
      irreversibility: 0.75,
    })],
    outcome: outcome(-0.9, { relationshipChange: -0.9 }),
    social: {
      relationshipId: "friend",
      attachmentRelevance: 1,
      relationshipLossProbability: 0.95,
      confidence: 0.95,
    },
    targets: { lossTarget: "close friendship", relationship: "close friend" },
  }),
  noEvent("isear-12c3475b14e8b21c3918"),
  input("isear-3017073e7c04cece4511", {
    id: "husband-suddenly-seriously-ill",
    time: 0,
    difficulty: 0.95,
    stakes: [stake("relationship", 0.95, {
      probability: 0.8,
      realizedFraction: 0.35,
      ongoingThreatFraction: 0.8,
      irreversibility: 0.8,
      confidence: 0.93,
    })],
    outcome: outcome(-0.6, {
      expectedUncertainty: 0.95,
      relationshipChange: -0.55,
    }),
    social: {
      relationshipId: "partner",
      attachmentRelevance: 1,
      relationshipLossProbability: 0.8,
      confidence: 0.95,
    },
    epistemic: { requiredInformationMissing: 0.9, confidence: 0.9 },
    targets: { threatSource: "husband's illness", relationship: "husband" },
  }),
  input("isear-441aac4080b9994cf384", {
    id: "chosen-engagement",
    time: 0,
    outcome: outcome(0.95, {
      expectedUtility: 0.55,
      rewardConsumed: 0.9,
      relationshipChange: 0.95,
    }),
    agency: self(0.8, 1),
    social: {
      relationshipId: "partner",
      attachmentRelevance: 1,
      safetyChange: 0.9,
      benefitFromOther: 0.75,
      confidence: 0.95,
    },
    targets: { relationship: "fiancé", rewardSource: "engagement" },
  }),
  input("isear-169d1105e8a5c30877bc", {
    id: "child-behavior-and-school-decline",
    time: 0,
    difficulty: 0.75,
    stakes: [stake("relationship", 0.75, {
      probability: 0.8,
      realizedFraction: 0.6,
      ongoingThreatFraction: 0.7,
      irreversibility: 0.35,
    })],
    outcome: outcome(-0.65, {
      expectedUtility: 0.25,
      expectationConfidence: 0.7,
      expectedUncertainty: 0.8,
      relationshipChange: -0.35,
    }),
    social: { relationshipId: "family", attachmentRelevance: 0.95, confidence: 0.9 },
    epistemic: {
      expectationViolation: 0.8,
      requiredInformationMissing: 0.75,
      confidence: 0.8,
    },
    targets: { threatSource: "child's unexplained decline", relationship: "child" },
  }),
  input("isear-1e7e38d49d82bebb2677", {
    id: "mother-scolds-late-return",
    time: 0,
    outcome: outcome(-0.5, {
      selfEvaluationChange: -0.45,
      relationshipChange: -0.3,
    }),
    agency: self(0.8, 0.65),
    social: {
      relationshipId: "family",
      normSeverity: 0.6,
      harmToOther: 0.3,
      audienceExposure: 0.3,
      confidence: 0.8,
    },
    targets: { harmedOther: "mother", selfEvaluationTarget: "responsibility" },
  }),
  input("isear-b71e7a4f8007c1b3c8ef", {
    id: "loved-person-returns",
    time: 0,
    outcome: outcome(0.9, {
      expectedUtility: -0.15,
      expectationConfidence: 0.75,
      rewardConsumed: 0.85,
      relationshipChange: 0.85,
      threatRemovedFraction: 0.9,
    }),
    social: {
      relationshipId: "partner",
      attachmentRelevance: 1,
      safetyChange: 0.8,
      benefitFromOther: 0.65,
      confidence: 0.95,
    },
    targets: { relationship: "loved person", rewardSource: "return" },
  }),
  input("isear-d868df06d63aa056186b", {
    id: "friend-uses-and-abandons",
    time: 0,
    stakes: [stake("relationship", 0.85, {
      realizedFraction: 1,
      irreversibility: 0.65,
    })],
    outcome: outcome(-0.85, { relationshipChange: -0.85 }),
    agency: other(0.95, 0.9),
    social: {
      relationshipId: "friend",
      normSeverity: 0.85,
      attachmentRelevance: 0.9,
      relationshipLossProbability: 0.9,
      confidence: 0.9,
    },
    targets: { relationship: "friend", normTarget: "exploitative friendship" },
  }),
  noEvent("isear-73102daf996e138bd165"),
  input("isear-87bd17edac50b56e49ce", {
    id: "alcoholic-traveler-disrupts-holiday",
    time: 0,
    stakes: [stake("comfort", 0.65, {
      realizedFraction: 0.9,
      irreversibility: 0.25,
    })],
    outcome: outcome(-0.7),
    agency: other(0.9, 0.7),
    social: { normSeverity: 0.75, confidence: 0.85 },
    sensory: { aversiveContactSeverity: 0.45, confidence: 0.7 },
    targets: { normTarget: "disruptive conduct", obstructionSource: "traveler" },
  }),
  input("isear-91f3af0a817c42113ff7", {
    id: "participate-in-bullying",
    time: 0,
    outcome: outcome(-0.8, {
      selfEvaluationChange: -0.75,
      bestForeseeableAlternativeUtility: 0.55,
      alternativeForeseeability: 0.9,
    }),
    agency: self(0.95, 0.85),
    social: {
      relationshipId: "stranger",
      normSeverity: 0.9,
      harmToOther: 0.8,
      audienceExposure: 0.45,
      confidence: 0.9,
    },
    targets: { harmedOther: "bullied girls", selfEvaluationTarget: "past conduct" },
  }),
  input("isear-3ba67929fb1304da7669", {
    id: "group-members-show-no-responsibility",
    time: 0,
    difficulty: 0.65,
    stakes: [stake("fairness", 0.65, {
      realizedFraction: 0.75,
      ongoingThreatFraction: 0.55,
      irreversibility: 0.1,
    })],
    options: [{
      id: "confront-group",
      type: "confront",
      availability: 0.75,
      known: 0.75,
      expectedEffectiveness: 0.6,
      cost: 0.35,
      confidence: 0.7,
    }],
    outcome: outcome(-0.65),
    agency: other(0.9, 0.7),
    social: { normSeverity: 0.65, confidence: 0.8 },
    targets: { obstructionSource: "irresponsible group members" },
  }),
  input("isear-78d6d95528fad7efa289", {
    id: "watch-frightening-film",
    time: 0,
    difficulty: 0.35,
    stakes: [stake("safety", 0.55, {
      probability: 0.25,
      ongoingThreatFraction: 0.6,
      confidence: 0.7,
    })],
    options: [{
      id: "stop-watching",
      type: "escape",
      availability: 1,
      known: 1,
      expectedEffectiveness: 1,
      cost: 0.1,
      confidence: 0.95,
    }],
    epistemic: { expectationViolation: 0.7, confidence: 0.75 },
    targets: { threatSource: "film imagery" },
  }),
];

module.exports = { round3StructuredInputs };
