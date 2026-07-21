const assert = require("node:assert/strict");
const { deriveEventImpact } = require("./event-impact-engine-v1");
const { simulateStructuredEmotionSequence } = require("./structured-emotion-pipeline-v1");

function families(frame) {
  return frame.emotions.map((emotion) => emotion.family);
}

function emotion(frame, family) {
  return frame.emotions.find((entry) => entry.family === family);
}

const bossCharge = {
  id: "boss-charge",
  time: 0,
  domain: "bossCombat",
  difficulty: 0.82,
  stakes: [{
    targetId: "playerHealth",
    valueKey: "survival",
    magnitude: 0.9,
    probability: 0.82,
    direction: "negative",
    timeToImpactSeconds: 3,
    immediacyHorizonSeconds: 20,
    confidence: 0.95,
  }],
  options: [{
    id: "dodge",
    type: "escape",
    availability: 0.82,
    known: 0.78,
    expectedEffectiveness: 0.7,
    cost: 0.25,
    confidence: 0.75,
  }],
  targets: { threatSource: "Boss" },
};

const noviceProfile = {
  goalValues: { survival: 1 },
  domainSelfEfficacy: { bossCombat: 0.25 },
  riskTolerance: 0.2,
  emotionDynamics: {
    domainSelfEfficacy: 0.25,
    riskTolerance: 0.2,
  },
};
const veteranProfile = {
  goalValues: { survival: 1 },
  domainSelfEfficacy: { bossCombat: 0.88 },
  riskTolerance: 0.72,
  emotionDynamics: {
    domainSelfEfficacy: 0.88,
    riskTolerance: 0.72,
  },
};
const noviceHistory = {
  chronicStress: 0.35,
  repeatedFailure: 0.75,
  memories: [
    {
      id: "old-losses",
      category: "failure",
      domain: "bossCombat",
      strength: 0.9,
      recency: 0.9,
      count: 3,
      resolved: false,
    },
    {
      id: "old-threat",
      category: "threat",
      domain: "bossCombat",
      strength: 0.85,
      recency: 0.85,
      count: 3,
      resolved: false,
    },
  ],
};
const veteranHistory = {
  memories: [{
    id: "resolved-boss",
    category: "failure",
    domain: "bossCombat",
    strength: 0.5,
    recency: 0.3,
    count: 1,
    resolved: true,
  }],
};

const noviceImpact = deriveEventImpact({
  event: bossCharge,
  profile: noviceProfile,
  history: noviceHistory,
});
const veteranImpact = deriveEventImpact({
  event: bossCharge,
  profile: veteranProfile,
  history: veteranHistory,
});
assert(
  noviceImpact.appraisals.threatMagnitude.value
    > veteranImpact.appraisals.threatMagnitude.value,
  "same objective threat should feel larger with unresolved threat memories and low risk tolerance",
);
assert(
  noviceImpact.appraisals.controllability.value
    < veteranImpact.appraisals.controllability.value,
  "same option set should feel less controllable with low efficacy and repeated failures",
);

const noviceBoss = simulateStructuredEmotionSequence({
  profile: noviceProfile,
  history: noviceHistory,
  events: [bossCharge],
});
const veteranBoss = simulateStructuredEmotionSequence({
  profile: veteranProfile,
  history: veteranHistory,
  events: [bossCharge],
});
assert.equal(noviceBoss.frames[0].emotions[0].family, "fear");
assert(
  emotion(noviceBoss.frames[0], "fear").intensity
    > emotion(veteranBoss.frames[0], "fear").intensity,
);

const reversal = simulateStructuredEmotionSequence({
  profile: noviceProfile,
  history: noviceHistory,
  events: [
    bossCharge,
    {
      id: "dodge-success",
      time: 18,
      domain: "bossCombat",
      difficulty: 0.55,
      options: [{
        id: "counter",
        type: "confront",
        availability: 0.9,
        known: 0.8,
        expectedEffectiveness: 0.75,
        cost: 0.2,
        confidence: 0.8,
      }],
      outcome: {
        actualUtility: 0.55,
        expectedUtility: -0.25,
        expectationConfidence: 0.75,
        expectedUncertainty: 0.65,
        goalProgress: 0.55,
        rewardConsumed: 0.35,
        threatRemovedFraction: 0.7,
        confidence: 0.9,
      },
      agency: {
        actorIsSelf: true,
        causalContribution: 0.9,
        intentionality: 1,
        evidenceConfidence: 0.95,
      },
      targets: {
        resolvedThreat: "Boss必杀",
        rewardSource: "成功闪避",
      },
    },
    {
      id: "boss-defeated",
      time: 34,
      domain: "bossCombat",
      difficulty: 0.2,
      options: [{
        id: "finish",
        type: "confront",
        availability: 1,
        known: 1,
        expectedEffectiveness: 0.95,
        cost: 0.1,
        confidence: 0.95,
      }],
      outcome: {
        actualUtility: 1,
        expectedUtility: 0.1,
        expectationConfidence: 0.8,
        expectedUncertainty: 0.45,
        goalProgress: 1,
        rewardConsumed: 0.95,
        threatRemovedFraction: 1,
        selfEvaluationChange: 0.85,
        confidence: 0.95,
      },
      agency: {
        actorIsSelf: true,
        causalContribution: 0.95,
        intentionality: 1,
        evidenceConfidence: 0.98,
      },
      targets: {
        resolvedThreat: "Boss",
        rewardSource: "反杀",
      },
    },
  ],
});
assert.equal(reversal.frames[0].emotions[0].family, "fear");
assert(families(reversal.frames[1]).includes("relief"));
assert(families(reversal.frames[2]).includes("joy"));
assert(families(reversal.frames[2]).includes("pride"));
assert(
  reversal.frames[1].settledEmotions
    .slice(0, 2)
    .some((entry) => entry.family === "relief"),
  "escaping an active threat should keep relief among the dominant settled emotions",
);

const angerCase = simulateStructuredEmotionSequence({
  profile: {
    goalValues: { progress: 0.95 },
    domainSelfEfficacy: { routePlanning: 0.75 },
    normSensitivity: 0.7,
  },
  history: {},
  events: [{
    id: "intentional-block",
    time: 0,
    domain: "routePlanning",
    difficulty: 0.45,
    options: [{
      id: "remove-block",
      type: "confront",
      availability: 0.9,
      known: 0.9,
      expectedEffectiveness: 0.8,
      cost: 0.2,
      confidence: 0.9,
    }],
    stakes: [{
      targetId: "progress",
      valueKey: "progress",
      magnitude: 0.85,
      probability: 1,
      direction: "negative",
      timeToImpactSeconds: 30,
      confidence: 0.9,
    }],
    outcome: {
      actualUtility: -0.65,
      expectedUtility: 0.25,
      goalProgress: -0.85,
      confidence: 0.9,
    },
    agency: {
      actorIsSelf: false,
      causalContribution: 0.95,
      intentionality: 0.95,
      evidenceConfidence: 0.95,
    },
    social: {
      normSeverity: 0.72,
      confidence: 0.85,
    },
    targets: {
      blameTarget: "rival",
      obstacleTarget: "blocked route",
    },
  }],
});
assert(families(angerCase.frames[0]).includes("anger"));
assert.equal(angerCase.frames[0].settledEmotions[0].family, "anger");

const lossCase = simulateStructuredEmotionSequence({
  profile: {
    goalValues: { settlement: 0.95 },
  },
  history: {},
  events: [{
    id: "permanent-loss",
    time: 0,
    stakes: [{
      targetId: "settlement",
      valueKey: "settlement",
      magnitude: 0.95,
      probability: 1,
      direction: "negative",
      realizedFraction: 1,
      irreversibility: 1,
      timeToImpactSeconds: 0,
      confidence: 0.98,
    }],
    outcome: {
      actualUtility: -0.95,
      expectedUtility: 0.15,
      goalProgress: -1,
      confidence: 0.98,
    },
    targets: { lossObject: "settlement" },
  }],
});
assert.equal(lossCase.frames[0].settledEmotions[0].family, "sadness");

const shameCase = simulateStructuredEmotionSequence({
  profile: {
    normSensitivity: 0.8,
    socialEvaluationSensitivity: 0.85,
  },
  history: {},
  events: [{
    id: "public-self-violation",
    time: 0,
    outcome: {
      actualUtility: -0.45,
      expectedUtility: 0.1,
      goalProgress: -0.35,
      selfEvaluationChange: -0.9,
      confidence: 0.95,
    },
    agency: {
      actorIsSelf: true,
      causalContribution: 0.95,
      intentionality: 0.8,
      evidenceConfidence: 0.98,
    },
    social: {
      normSeverity: 0.9,
      audienceExposure: 0.95,
      statusDamage: 0.85,
      harmToOther: 0.05,
      confidence: 0.95,
    },
    targets: {},
  }],
});
assert.equal(shameCase.frames[0].emotions[0].family, "shame");

const guiltCase = simulateStructuredEmotionSequence({
  profile: {
    normSensitivity: 0.8,
    relationshipValues: { ally: 0.95 },
  },
  history: {},
  events: [{
    id: "self-harms-ally",
    time: 0,
    domain: "socialRepair",
    difficulty: 0.45,
    options: [{
      id: "help-ally",
      type: "repair",
      availability: 0.9,
      known: 0.9,
      expectedEffectiveness: 0.75,
      cost: 0.35,
      confidence: 0.85,
    }],
    outcome: {
      actualUtility: -0.7,
      expectedUtility: 0.15,
      goalProgress: -0.6,
      selfEvaluationChange: -0.5,
      relationshipChange: -0.75,
      confidence: 0.95,
    },
    agency: {
      actorIsSelf: true,
      causalContribution: 0.95,
      intentionality: 0.15,
      evidenceConfidence: 0.98,
    },
    social: {
      relationshipId: "ally",
      normSeverity: 0.78,
      harmToOther: 0.92,
      audienceExposure: 0.05,
      attachmentRelevance: 0.85,
      confidence: 0.95,
    },
    targets: { harmedOther: "ally" },
  }],
});
assert.equal(guiltCase.frames[0].settledEmotions[0].family, "guilt");

const gratitudeCase = simulateStructuredEmotionSequence({
  profile: {
    relationshipValues: { ally: 0.9 },
  },
  history: {},
  events: [{
    id: "ally-saves-run",
    time: 0,
    outcome: {
      actualUtility: 0.95,
      expectedUtility: -0.35,
      goalProgress: 0.9,
      rewardConsumed: 0.85,
      relationshipChange: 0.7,
      confidence: 0.95,
    },
    agency: {
      actorIsSelf: false,
      causalContribution: 0.92,
      intentionality: 0.95,
      evidenceConfidence: 0.98,
    },
    social: {
      relationshipId: "ally",
      benefitFromOther: 0.95,
      attachmentRelevance: 0.75,
      safetyChange: 0.8,
      confidence: 0.95,
    },
    targets: {
      benefactor: "ally",
      rewardSource: "rescue",
    },
  }],
});
assert.equal(gratitudeCase.frames[0].settledEmotions[0].family, "gratitude");
assert(families(gratitudeCase.frames[0]).includes("joy"));

const disgustCase = simulateStructuredEmotionSequence({
  profile: { contaminationSensitivity: 0.85 },
  history: {},
  events: [{
    id: "contaminated-food",
    time: 0,
    sensory: {
      contaminationSeverity: 0.95,
      confidence: 0.98,
    },
    targets: { aversionSource: "contaminated food" },
  }],
});
assert.equal(disgustCase.frames[0].emotions[0].family, "disgust");

const curiosityCase = simulateStructuredEmotionSequence({
  profile: {
    domainSelfEfficacy: { mechanism: 0.75 },
  },
  history: {},
  events: [{
    id: "safe-mystery",
    time: 0,
    domain: "mechanism",
    difficulty: 0.35,
    options: [{
      id: "inspect",
      type: "information",
      availability: 1,
      known: 1,
      expectedEffectiveness: 0.85,
      cost: 0.1,
      confidence: 0.95,
    }],
    outcome: {
      expectedUncertainty: 0.8,
      positiveProspect: 0.45,
      confidence: 0.8,
    },
    epistemic: {
      requiredInformationMissing: 0.9,
      familiarity: 0.1,
      informationGain: 0.8,
      confidence: 0.95,
    },
    targets: { informationObject: "mechanism" },
  }],
});
assert.equal(curiosityCase.frames[0].emotions[0].family, "curiosity");

const safeAnomalyCase = simulateStructuredEmotionSequence({
  profile: {},
  history: {},
  events: [{
    id: "safe-anomaly",
    time: 0,
    domain: "observation",
    difficulty: 0.1,
    options: [{
      id: "inspect",
      type: "information",
      availability: 1,
      known: 1,
      expectedEffectiveness: 0.9,
      cost: 0.05,
      confidence: 0.95,
    }],
    epistemic: {
      expectationViolation: 0.95,
      requiredInformationMissing: 0.55,
      familiarity: 0.1,
      informationGain: 0.4,
      confidence: 0.9,
    },
  }],
});
assert(families(safeAnomalyCase.frames[0]).includes("surprise"));
assert(
  !families(safeAnomalyCase.frames[0]).includes("disappointment"),
  "world-model surprise must not fabricate a failed reward expectation",
);

const rewardShortfallCase = simulateStructuredEmotionSequence({
  profile: {},
  history: {},
  events: [{
    id: "reward-shortfall",
    time: 0,
    outcome: {
      actualUtility: -0.2,
      expectedUtility: 0.7,
      expectationConfidence: 0.9,
      goalProgress: -0.65,
      confidence: 0.9,
    },
  }],
});
assert(
  families(rewardShortfallCase.frames[0]).includes("disappointment"),
  "an actual result below a frozen reward expectation should produce disappointment",
);

const completedLossImpact = deriveEventImpact({
  profile: { goalValues: { bond: 1 } },
  history: {},
  event: {
    id: "completed-loss",
    time: 0,
    stakes: [{
      targetId: "bond",
      valueKey: "bond",
      magnitude: 0.9,
      probability: 1,
      direction: "negative",
      realizedFraction: 1,
      irreversibility: 1,
      timeToImpactSeconds: 0,
      confidence: 0.95,
    }],
  },
});
assert.equal(
  completedLossImpact.appraisals.threatMagnitude.value,
  0,
  "a fully realized loss must not remain a full prospective threat",
);
assert(completedLossImpact.appraisals.lossGap.value > 0.8);

const ongoingAssaultImpact = deriveEventImpact({
  profile: { goalValues: { safety: 1 } },
  history: {},
  event: {
    id: "ongoing-assault",
    time: 0,
    stakes: [{
      targetId: "safety",
      valueKey: "safety",
      magnitude: 0.9,
      probability: 1,
      direction: "negative",
      realizedFraction: 0.7,
      ongoingThreatFraction: 0.85,
      irreversibility: 0.3,
      timeToImpactSeconds: 0,
      confidence: 0.95,
    }],
  },
});
assert(
  ongoingAssaultImpact.appraisals.threatMagnitude.value > 0.7,
  "realized harm can coexist with continuing prospective threat",
);

const unknownExpectationCase = simulateStructuredEmotionSequence({
  profile: {},
  history: {},
  events: [{
    id: "negative-with-unknown-prior-expectation",
    time: 0,
    outcome: {
      actualUtility: -0.8,
      goalProgress: -0.8,
      confidence: 0.9,
    },
  }],
}, { emotionThreshold: 0.1 });
assert(
  !families(unknownExpectationCase.frames[0]).includes("surprise"),
  "an unknown prior expectation must not be silently replaced by a neutral prediction",
);

const privateShameCase = simulateStructuredEmotionSequence({
  profile: {},
  history: {},
  events: [{
    id: "private-self-image-failure",
    time: 0,
    outcome: {
      actualUtility: -0.45,
      goalProgress: -0.35,
      selfEvaluationChange: -0.8,
      confidence: 0.9,
    },
    agency: {
      actorIsSelf: true,
      causalContribution: 0.8,
      intentionality: 0.05,
      evidenceConfidence: 0.9,
    },
    social: {
      normSeverity: 0.35,
      audienceExposure: 0,
      confidence: 0.8,
    },
  }],
});
assert(
  families(privateShameCase.frames[0]).includes("shame"),
  "internal self-image damage can produce shame without a public audience",
);

const moralDisgustCase = simulateStructuredEmotionSequence({
  profile: { normSensitivity: 0.8 },
  history: {},
  events: [{
    id: "intentional-severe-moral-violation",
    time: 0,
    outcome: {
      actualUtility: -0.75,
      goalProgress: -0.65,
      confidence: 0.9,
    },
    agency: {
      actorIsSelf: false,
      causalContribution: 0.95,
      intentionality: 0.95,
      evidenceConfidence: 0.95,
    },
    social: {
      normSeverity: 0.95,
      harmToOther: 0.9,
      confidence: 0.95,
    },
  }],
});
assert(
  families(moralDisgustCase.frames[0]).includes("disgust"),
  "severe intentional moral violation should support disgust without a pathogen cue",
);

const aversiveContactCase = simulateStructuredEmotionSequence({
  profile: {},
  history: {},
  events: [{
    id: "unwanted-aversive-contact",
    time: 0,
    sensory: {
      aversiveContactSeverity: 0.8,
      confidence: 0.9,
    },
  }],
});
assert.equal(
  aversiveContactCase.frames[0].emotions[0].family,
  "disgust",
  "unwanted aversive bodily contact should activate disgust without pathogen contamination",
);

const dutyGuiltCase = simulateStructuredEmotionSequence({
  profile: {},
  history: {},
  events: [{
    id: "low-harm-duty-violation",
    time: 0,
    outcome: {
      actualUtility: -0.4,
      goalProgress: -0.35,
      selfEvaluationChange: -0.35,
      confidence: 0.85,
    },
    agency: {
      actorIsSelf: true,
      causalContribution: 0.9,
      intentionality: 0.3,
      evidenceConfidence: 0.9,
    },
    social: {
      normSeverity: 0.7,
      harmToOther: 0.2,
      audienceExposure: 0.1,
      confidence: 0.85,
    },
  }],
});
assert(
  families(dutyGuiltCase.frames[0]).includes("guilt"),
  "violating an accepted duty can produce guilt even when concrete harm is modest",
);

console.log(JSON.stringify({
  status: "PASS",
  cases: 19,
  objectiveEventDifferentiation: {
    noviceThreat: noviceImpact.appraisals.threatMagnitude.value,
    veteranThreat: veteranImpact.appraisals.threatMagnitude.value,
    noviceControl: noviceImpact.appraisals.controllability.value,
    veteranControl: veteranImpact.appraisals.controllability.value,
    novicePrimary: noviceBoss.frames[0].emotions[0].family,
    veteranPrimary: veteranBoss.frames[0].emotions[0].family,
  },
  trajectory: reversal.frames.map((frame) => ({
    eventId: frame.eventId,
    primary: frame.emotions[0].family,
    coexist: families(frame),
  })),
  categoryCases: {
    anger: angerCase.frames[0].emotions[0].family,
    loss: lossCase.frames[0].emotions[0].family,
    shame: shameCase.frames[0].emotions[0].family,
    guilt: guiltCase.frames[0].emotions[0].family,
    gratitude: gratitudeCase.frames[0].emotions[0].family,
    disgust: disgustCase.frames[0].emotions[0].family,
    curiosity: curiosityCase.frames[0].emotions[0].family,
  },
  audit: reversal.audit,
}, null, 2));
