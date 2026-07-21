const assert = require("node:assert/strict");
const {
  projectEmotionsAtHorizon,
  simulateEmotionSequence,
} = require("./emotion-simulator-v1");

function v(value, confidence = 1) {
  return { value, confidence };
}

function runCase(name, events, overrides = {}) {
  const result = simulateEmotionSequence({
    profile: {
      domainSelfEfficacy: 0.55,
      riskTolerance: 0.5,
      relationshipSecurity: 0.55,
      ...(overrides.profile || {}),
    },
    initialPhysiology: overrides.initialPhysiology || {},
    longTermContext: overrides.longTermContext || {},
    events,
  });
  return {
    name,
    result,
    families: result.frames.at(-1).emotions.map((emotion) => emotion.family),
    primary: result.frames.at(-1).emotions[0],
  };
}

function event(id, time, description, appraisals, targets = {}) {
  return { id, time, description, appraisals, targets };
}

const cases = [];

cases.push(runCase("immediate-uncontrollable-threat", [
  event("threat", 0, "A hostile creature suddenly blocks the only exit.", {
    threatMagnitude: v(0.95),
    threatImmediacy: v(0.95),
    controllability: v(0.1),
    escapeAvailability: v(0.05),
    expectedUncertainty: v(0.65),
    unexpectedChange: v(0.9),
  }, { threatSource: "hostile creature" }),
]));
assert.equal(cases.at(-1).primary.family, "fear");
assert(cases.at(-1).families.includes("anxiety"));

cases.push(runCase("blamed-controllable-obstruction", [
  event("block", 0, "A rival deliberately cancels the player's winning move.", {
    obstruction: v(0.95),
    blameCertainty: v(0.95),
    controllability: v(0.75),
    goalRelevance: v(0.9),
    statusChallenge: v(0.65),
  }, { blameTarget: "rival" }),
]));
assert.equal(cases.at(-1).primary.family, "anger");

cases.push(runCase("uncontrollable-obstruction", [
  event("block", 0, "A required route remains closed and there is no known workaround.", {
    obstruction: v(0.95),
    blameCertainty: v(0.15),
    controllability: v(0.08),
    goalRelevance: v(0.95),
  }, { obstacleTarget: "closed route" }),
]));
assert.equal(cases.at(-1).primary.family, "frustration");

cases.push(runCase("irreversible-loss", [
  event("loss", 0, "A long-built settlement is permanently erased.", {
    lossGap: v(0.95),
    irreversibility: v(0.95),
    controllability: v(0.05),
    goalRelevance: v(0.95),
    rewardPredictionError: v(0.05),
  }, { lossObject: "settlement" }),
]));
assert.equal(cases.at(-1).primary.family, "sadness");
assert(cases.at(-1).families.includes("disappointment"));

cases.push(runCase("threat-then-safety", [
  event("threat", 0, "The party appears trapped by a powerful enemy.", {
    threatMagnitude: v(0.9),
    threatImmediacy: v(0.85),
    controllability: v(0.2),
    expectedUncertainty: v(0.7),
  }, { threatSource: "powerful enemy" }),
  event("safe", 45, "A hidden exit opens and the party escapes unharmed.", {
    threatResolution: v(0.95),
    rewardPredictionError: v(0.85),
    rewardConsumption: v(0.65),
    goalRelevance: v(0.9),
    unexpectedChange: v(0.7),
  }, { resolvedThreat: "the trap", rewardSource: "hidden exit" }),
]));
assert.equal(cases.at(-1).primary.family, "relief");
assert(cases.at(-1).families.includes("joy"));
const settledEscape = projectEmotionsAtHorizon(cases.at(-1).result.frames.at(-1).emotions, 60);
assert.notEqual(settledEscape[0].family, "surprise");

cases.push(runCase("self-caused-success", [
  event("success", 0, "The player's own plan defeats a difficult boss.", {
    rewardPredictionError: v(0.92),
    rewardConsumption: v(0.9),
    goalRelevance: v(0.95),
    selfAttribution: v(0.95),
    controllability: v(0.9),
  }, { rewardSource: "successful plan" }),
]));
assert(cases.at(-1).families.includes("pride"));
assert(cases.at(-1).families.includes("joy"));

cases.push(runCase("public-self-violation", [
  event("exposure", 0, "The player's own dishonest action is revealed to the whole group.", {
    normViolation: v(0.95),
    selfAttribution: v(0.95),
    socialExposure: v(0.95),
    harmToOther: v(0.15),
  }),
]));
assert.equal(cases.at(-1).primary.family, "shame");

cases.push(runCase("repairable-harm-to-other", [
  event("harm", 0, "The player realizes their choice injured a trusted ally and can still help them.", {
    normViolation: v(0.75),
    selfAttribution: v(0.95),
    harmToOther: v(0.95),
    repairOpportunity: v(0.9),
    socialExposure: v(0.2),
  }, { harmedOther: "trusted ally" }),
]));
assert.equal(cases.at(-1).primary.family, "guilt");

cases.push(runCase("physical-contamination", [
  event("contamination", 0, "Rotten fluid splashes onto the player's food.", {
    contamination: v(0.98),
    threatMagnitude: v(0.15),
    normViolation: v(0.25),
  }, { aversionSource: "rotten fluid" }),
]));
assert.equal(cases.at(-1).primary.family, "disgust");

cases.push(runCase("safe-information-gap", [
  event("mystery", 0, "A harmless mechanism behaves in a new unexplained way.", {
    informationGap: v(0.9),
    unexpectedChange: v(0.75),
    controllability: v(0.7),
    expectedUncertainty: v(0.75),
    threatMagnitude: v(0.05),
  }, { informationObject: "mechanism" }),
]));
assert.equal(cases.at(-1).primary.family, "curiosity");

cases.push(runCase("relationship-threat", [
  event("rival", 0, "A rival begins drawing a valued companion away from the player.", {
    relationshipThreat: v(0.9),
    attachmentRelevance: v(0.9),
    expectedUncertainty: v(0.65),
    threatMagnitude: v(0.45),
  }, { relationshipObject: "valued companion", rival: "rival" }),
]));
assert.equal(cases.at(-1).primary.family, "jealousy");

cases.push(runCase("benefit-from-other", [
  event("help", 0, "An ally sacrifices a rare resource to save the player's run.", {
    benefitFromOther: v(0.95),
    rewardPredictionError: v(0.9),
    rewardConsumption: v(0.8),
    selfAttribution: v(0.05),
    socialSafety: v(0.8),
    attachmentRelevance: v(0.7),
  }, { benefactor: "ally", rewardSource: "rescue" }),
]));
assert(cases.at(-1).families.includes("gratitude"));
assert(cases.at(-1).families.includes("joy"));

cases.push(runCase("low-value-repetition", [
  event("repeat", 0, "The player repeats an already-mastered action with no new result.", {
    repetition: v(0.95),
    goalRelevance: v(0.05),
    informationGap: v(0.02),
    unexpectedChange: v(0.02),
  }, { currentActivity: "mastered action" }),
]));
assert.equal(cases.at(-1).primary.family, "boredom");

const lowSerotoninAnger = runCase("low-serotonin-anger", [
  event("insult", 0, "A rival deliberately humiliates the player and blocks progress.", {
    obstruction: v(0.9),
    blameCertainty: v(0.95),
    statusChallenge: v(0.9),
    controllability: v(0.7),
    goalRelevance: v(0.8),
  }, { blameTarget: "rival" }),
], {
  initialPhysiology: {
    chemistry: {
      serotonin: { level: 0.15, baseline: 0.2, confidence: 0.9, provenance: "measured" },
    },
  },
});
const highSerotoninAnger = runCase("high-serotonin-anger", [
  event("insult", 0, "A rival deliberately humiliates the player and blocks progress.", {
    obstruction: v(0.9),
    blameCertainty: v(0.95),
    statusChallenge: v(0.9),
    controllability: v(0.7),
    goalRelevance: v(0.8),
  }, { blameTarget: "rival" }),
], {
  initialPhysiology: {
    chemistry: {
      serotonin: { level: 0.85, baseline: 0.8, confidence: 0.9, provenance: "measured" },
    },
  },
});
assert.equal(lowSerotoninAnger.primary.family, "anger");
assert.equal(highSerotoninAnger.primary.family, "anger");
assert(lowSerotoninAnger.primary.intensity > highSerotoninAnger.primary.intensity);
assert(highSerotoninAnger.primary.actionBias.includes("pauseThenEvaluate"));

const memoryBiased = runCase("unresolved-threat-memory", [
  event("ambiguous", 0, "A sound resembles the warning that preceded an earlier ambush.", {
    threatMagnitude: v(0.35, 0.7),
    threatImmediacy: v(0.45, 0.7),
    expectedUncertainty: v(0.85),
    controllability: v(0.35),
  }, { threatSource: "ambiguous sound" }),
], {
  longTermContext: {
    chronicStress: 0.45,
    memories: [
      { id: "old-ambush", category: "threat", strength: 0.9, recency: 0.8, resolved: false },
    ],
  },
});
assert(memoryBiased.families.includes("anxiety"));

const chronicStressIsTonic = runCase("chronic-stress-is-tonic", [
  event("acute-threat", 0, "An immediate threat appears.", {
    threatMagnitude: v(0.8),
    threatImmediacy: v(0.8),
    expectedUncertainty: v(0.6),
    controllability: v(0.25),
  }),
  event("neutral-update", 60, "Time passes without a new threat.", {}),
], {
  longTermContext: {
    chronicStress: 0.8,
    fatigue: 0.6,
  },
});
const stressedFrames = chronicStressIsTonic.result.frames;
assert(
  stressedFrames[1].chemistry.cortisol.level
    < stressedFrames[0].chemistry.cortisol.level,
  "a neutral later event must not add another chronic-stress cortisol release",
);
assert.equal(
  stressedFrames[1].modeledReleases.inflammatoryLoad,
  0,
  "fatigue and chronic stress belong to tonic baseline, not event-count accumulation",
);
assert(
  stressedFrames[1].chemistry.cortisol.level
    >= stressedFrames[1].chemistry.cortisol.baseline,
  "acute cortisol should decay toward the elevated chronic baseline",
);

const lowEvidenceThreat = runCase("low-evidence-threat", [
  event("threat", 0, "A threat estimate with limited evidence.", {
    threatMagnitude: v(0.8, 0.3),
    threatImmediacy: v(0.85, 0.3),
    controllability: v(0.2, 0.3),
  }),
]);
const highEvidenceThreat = runCase("high-evidence-threat", [
  event("threat", 0, "The same threat estimate with strong evidence.", {
    threatMagnitude: v(0.8, 0.95),
    threatImmediacy: v(0.85, 0.95),
    controllability: v(0.2, 0.95),
  }),
]);
assert.equal(lowEvidenceThreat.primary.family, "fear");
assert.equal(highEvidenceThreat.primary.family, "fear");
assert.equal(
  lowEvidenceThreat.primary.intensity,
  highEvidenceThreat.primary.intensity,
  "confidence must not multiply an already estimated impact value a second time",
);
assert(
  lowEvidenceThreat.primary.confidence < highEvidenceThreat.primary.confidence,
  "confidence should change how certain the emotion inference is",
);

const report = {
  status: "PASS",
  cases: cases.length + 6,
  coreCases: cases.map((item) => ({
    name: item.name,
    primary: item.primary.family,
    coexist: item.families,
  })),
  serotoninCase: {
    low: {
      intensity: lowSerotoninAnger.primary.intensity,
      actions: lowSerotoninAnger.primary.actionBias,
    },
    high: {
      intensity: highSerotoninAnger.primary.intensity,
      actions: highSerotoninAnger.primary.actionBias,
    },
    familyPreserved: true,
  },
  memoryCase: {
    primary: memoryBiased.primary.family,
    coexist: memoryBiased.families,
  },
  tonicStressCase: {
    acuteCortisol: stressedFrames[0].chemistry.cortisol.level,
    afterNeutralEvent: stressedFrames[1].chemistry.cortisol.level,
    tonicBaseline: stressedFrames[1].chemistry.cortisol.baseline,
    neutralInflammatoryRelease: stressedFrames[1].modeledReleases.inflammatoryLoad,
  },
  confidenceCase: {
    lowEvidence: {
      intensity: lowEvidenceThreat.primary.intensity,
      confidence: lowEvidenceThreat.primary.confidence,
    },
    highEvidence: {
      intensity: highEvidenceThreat.primary.intensity,
      confidence: highEvidenceThreat.primary.confidence,
    },
  },
};

console.log(JSON.stringify(report, null, 2));
