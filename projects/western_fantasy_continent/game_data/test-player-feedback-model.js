const assert = require("node:assert/strict");
const FEEDBACK = require("./player-feedback-model");

const R = FEEDBACK.produceResultFeedback({
  actualUtility: 1.2,
  H: 0.9,
  goalWeight: 0.8,
  freshness: 1,
});
assert.equal(R.value, 0.864);

const strongConfirmation = FEEDBACK.produceVerificationFeedback({
  H: 0.9,
  rows: [verificationRow({
    status: "confirmed",
    support: 0.9,
    strength: 0.9,
    contribution: "primary",
    novelty: 0,
    closure: 0.9,
  })],
});
assert.equal(strongConfirmation.derived.strategySatisfaction, 0.81);
assert.equal(strongConfirmation.derived.knowledgeEvidence, 0.81);
assert.equal(strongConfirmation.derived.discoverySatisfaction, 0);

const sameResultWrongCause = FEEDBACK.produceVerificationFeedback({
  H: 0.9,
  rows: [verificationRow({
    status: "confirmed",
    support: 0.9,
    strength: 0.9,
    contribution: "supporting",
    alternativeExplanationStrength: 0.9,
    novelty: 0,
    closure: 0.4,
  })],
});
assert.equal(sameResultWrongCause.derived.strategySatisfaction, 0.081);
assert.equal(sameResultWrongCause.derived.knowledgeEvidence, 0.0405);
assert.ok(
  strongConfirmation.value > sameResultWrongCause.value,
  "同样成功时，清楚证明自己策略的反馈必须高于被其他原因解释的成功",
);

const explorationDefaultsOff = FEEDBACK.produceVerificationFeedback({
  H: 0.9,
  rows: [{
    id: "verification:no-discovery-evidence",
    status: "confirmed",
    comparisonMade: true,
    targetCondition: { metric: "damageShare", operator: ">=", value: 0.25 },
    observedValue: 0.4,
  }],
});
assert.equal(explorationDefaultsOff.dimensions.novelty, 0);
assert.equal(explorationDefaultsOff.dimensions.closure, 0);
assert.equal(explorationDefaultsOff.derived.discoverySatisfaction, 0);

const clearRefutation = FEEDBACK.produceVerificationFeedback({
  H: 0.9,
  rows: [verificationRow({
    status: "refuted",
    support: -0.9,
    strength: 0.9,
    contribution: "primary",
    novelty: 0,
    closure: 0.9,
  })],
});
assert.equal(clearRefutation.derived.strategySatisfaction, 0);
assert.equal(clearRefutation.derived.knowledgeEvidence, -0.81);

const discovery = FEEDBACK.produceVerificationFeedback({
  H: 0.9,
  rows: [verificationRow({
    status: "confirmed",
    support: 0.5,
    strength: 0.8,
    contribution: "joint",
    novelty: 1,
    closure: 0.9,
  })],
});
assert.equal(discovery.derived.strategySatisfaction, 0.4);
assert.equal(discovery.derived.discoverySatisfaction, 0.72);

const bundle = FEEDBACK.composeFeedback({
  process: FEEDBACK.produceProcessFeedback({
    baseValue: 0.02,
    verificationCount: 1,
    verificationEffortValue: 0.06,
  }),
  result: R,
  expectation: FEEDBACK.produceExpectationFeedback({ value: -0.2, status: "resolved" }),
  verification: strongConfirmation,
});
assert.equal(
  bundle.total,
  Number((bundle.channels.process.value + R.value - 0.2 + strongConfirmation.value).toFixed(4)),
);

const causalKnowledge = [];
const learned = FEEDBACK.applyCausalKnowledgeEvidence(
  causalKnowledge,
  {
    id: "ranger-slow",
    cause: "游侠减速能让主C拖到大招",
    chosenBehavior: "swap:2:hero_ranger",
    resultKind: "team_experiment_contribution",
    target: "hero_ranger",
    targetCondition: { metric: "damageShare", operator: ">=", value: 0.25 },
  },
  strongConfirmation.rows[0],
  { id: "combat:1", environment: { region: "region_1", node: "main_7" } },
);
assert.equal(causalKnowledge.length, 1);
assert.ok(learned.belief > 0);
assert.ok(learned.confidence > 0 && learned.confidence < 1, "单个案例不能直接形成满置信知识");

console.log(JSON.stringify({
  result: "PASS",
  R,
  strongConfirmation,
  sameResultWrongCause,
  explorationDefaultsOff,
  clearRefutation,
  discovery,
  learned,
}, null, 2));

function verificationRow({
  status,
  support,
  strength,
  contribution,
  novelty,
  closure,
  alternativeExplanationStrength = 0,
}) {
  return {
    id: `verification:${status}:${support}`,
    status,
    comparisonMade: true,
    targetCondition: { metric: "damageShare", operator: ">=", value: 0.25 },
    observedValue: status === "refuted" ? 0.1 : 0.4,
    causalEvidence: {
      support,
      strength,
      contribution,
      novelty,
      closure,
      alternativeExplanationStrength,
    },
  };
}
