const { simulateEmotionSequence } = require("./emotion-simulator-v1");

const v = (value, confidence = 1) => ({ value, confidence });

const result = simulateEmotionSequence({
  profile: {
    domainSelfEfficacy: 0.48,
    riskTolerance: 0.42,
    traitRumination: 0.55,
    chemicalBaselines: {
      serotonin: 0.52,
      dopamine: 0.44,
      cortisol: 0.34,
    },
  },
  initialPhysiology: { chemistry: {} },
  longTermContext: {
    chronicStress: 0.38,
    repeatedFailure: 0.72,
    memories: [
      {
        id: "three_previous_defeats",
        category: "threat",
        strength: 0.82,
        recency: 0.9,
        resolved: false,
      },
      {
        id: "failed_dodges",
        category: "failure",
        strength: 0.75,
        recency: 0.88,
        resolved: false,
      },
    ],
  },
  events: [
    {
      id: "boss_charge",
      time: 0,
      description: "阶段A：Boss开始蓄力必杀",
      appraisals: {
        threatMagnitude: v(0.88),
        threatImmediacy: v(0.92),
        controllability: v(0.28),
        expectedUncertainty: v(0.62),
        unexpectedChange: v(0.3),
      },
      targets: { threatSource: "Boss" },
    },
    {
      id: "successful_dodge",
      time: 18,
      description: "阶段B：玩家成功躲过必杀",
      appraisals: {
        threatMagnitude: v(0.45),
        threatImmediacy: v(0.35),
        controllability: v(0.82),
        threatResolution: v(0.68),
        outcomeValence: v(0.72),
        goalCongruence: v(0.76),
        rewardPredictionError: v(0.78),
        selfAttribution: v(0.86),
      },
      targets: {
        threatSource: "Boss",
        resolvedThreat: "Boss必杀",
        rewardSource: "成功闪避",
      },
    },
    {
      id: "boss_defeated",
      time: 34,
      description: "阶段C：玩家抓住破绽完成反杀",
      appraisals: {
        threatResolution: v(0.96),
        controllability: v(0.9),
        outcomeValence: v(0.96),
        goalCongruence: v(0.98),
        rewardConsumption: v(0.94),
        rewardPredictionError: v(0.86),
        selfAttribution: v(0.92),
        unexpectedChange: v(0.55),
      },
      targets: {
        resolvedThreat: "Boss",
        rewardSource: "反杀成功",
      },
    },
  ],
});

console.log(JSON.stringify(result.frames.map((frame) => ({
  stage: frame.eventDescription,
  chemistry: {
    norepinephrine: frame.chemistry.centralNorepinephrine.level,
    cortisol: frame.chemistry.cortisol.level,
    dopamine: frame.chemistry.dopamine.level,
    serotonin: frame.chemistry.serotonin.level,
  },
  emotions: frame.emotions.slice(0, 5).map((emotion) => ({
    family: emotion.family,
    intensity: emotion.intensity,
    target: emotion.target,
    actions: emotion.actionBias,
  })),
})), null, 2));
