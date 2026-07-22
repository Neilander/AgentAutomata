const assert = require("node:assert/strict");
const FEEDBACK = require("./player-feedback-model");
const RUNTIME = require("./player-cognition-v3-event-runtime");

const process = FEEDBACK.produceProcessFeedback({
  baseValue: 0.16,
  verificationCount: 1,
  verificationEffortValue: 0.06,
});
const result = FEEDBACK.produceResultFeedback({
  actualUtility: 1,
  H: 0.8,
  goalWeight: 0.75,
  freshness: 1,
});
const verification = FEEDBACK.produceVerificationFeedback({});

const ordinaryV1 = FEEDBACK.composeFeedback({
  process,
  result,
  expectation: FEEDBACK.produceExpectationFeedback({ value: -0.2, status: "resolved" }),
  verification,
});
const ordinaryV2 = FEEDBACK.composeFeedbackV2({
  legacyBundle: ordinaryV1,
  evidence: {
    H: 0.8,
    eventId: "ordinary-result",
    subject: { id: "player_team" },
    environment: { node: "main_1" },
    behavior: { kind: "combat" },
    result: { kind: "combat_win" },
  },
  processContext: {
    decision: { EDecision: 4 },
    verificationEffort: { count: 1, value: process.verificationProcess },
  },
});

assert.equal(ordinaryV2.schema, "player_feedback_bundle_v2");
assert.equal(ordinaryV2.channels.A.value, -0.2);
assert.equal(ordinaryV2.channels.C.value, 0);
assert.equal(ordinaryV2.channels.C.status, "not_applicable");
assert.equal(ordinaryV2.total, ordinaryV1.total);
assert.equal(ordinaryV2.compatibility.totalDelta, 0);
assert.equal(ordinaryV2.compatibility.preservesLegacyTotal, true);
assert.equal(ordinaryV2.channels.process.components.decision.EDecision, 4);
assert.equal(ordinaryV2.channels.process.components.decision.QDecision, null);
assert.equal(ordinaryV2.stateTransitions.agencyBefore, null);

const rosterExpectation = FEEDBACK.produceExpectationFeedback({
  value: -0.14,
  status: "resolved_roster_prediction",
  details: {
    formula: {
      delta: -0.25,
      mismatchValue: -0.2,
      confirmation: {
        value: 0.06,
        applied: true,
        confidence: 0.75,
        geometricBranch: "self_serving_success_amplification",
      },
      value: -0.14,
    },
  },
});
const rosterV1 = FEEDBACK.composeFeedback({
  process: FEEDBACK.produceProcessFeedback({}),
  result: FEEDBACK.produceResultFeedback({ enabled: false }),
  expectation: rosterExpectation,
  verification: FEEDBACK.produceVerificationFeedback({}),
});
const rosterV2 = FEEDBACK.composeFeedbackV2({ legacyBundle: rosterV1 });

assert.equal(rosterV2.channels.A.value, -0.2);
assert.equal(rosterV2.channels.A.legacyCombinedValue, -0.14);
assert.equal(rosterV2.channels.C.value, 0.06);
assert.equal(rosterV2.channels.C.confidence, 0.75);
assert.equal(rosterV2.channels.A.details.formula.confirmation, undefined);
assert.equal(rosterV2.total, rosterV1.total, "拆出 C 后不能重复计算或丢失旧总量");
assert.equal(rosterV2.compatibility.legacyACombinedConfirmation, true);

const initialState = RUNTIME.createState("feedback-v2-decision-test");
const afterDecision = RUNTIME.applyDecision(initialState, {
  id: "decision:simple-comparison",
  action: "explore",
  alternatives: ["fight", "explore"],
  reasoningChain: [
    { kind: "comparison", evidence: "探索成本较低，战斗风险较高" },
  ],
});
const decisionTrace = afterDecision.trace.at(-1);

assert.equal(decisionTrace.EDecision, 1);
assert.equal(decisionTrace.feedback.schema, "player_feedback_bundle_v1");
assert.equal(decisionTrace.feedbackV2.schema, "player_feedback_bundle_v2");
assert.equal(decisionTrace.feedbackV2.channels.process.components.decision.EDecision, 1);
assert.equal(decisionTrace.feedbackV2.channels.process.components.decision.QDecision, null);
assert.equal(decisionTrace.feedbackV2.total, decisionTrace.feedback.total);
assert.equal(decisionTrace.emotionDelta, decisionTrace.feedbackV2.total);

console.log(JSON.stringify({
  result: "PASS",
  ordinary: {
    oldTotal: ordinaryV1.total,
    newTotal: ordinaryV2.total,
    A: ordinaryV2.channels.A.value,
    C: ordinaryV2.channels.C.value,
  },
  rosterPrediction: {
    oldCombinedA: rosterV1.channels.A.value,
    splitA: rosterV2.channels.A.value,
    C: rosterV2.channels.C.value,
    newTotal: rosterV2.total,
  },
  decision: {
    EDecision: decisionTrace.EDecision,
    QDecision: decisionTrace.feedbackV2.channels.process.components.decision.QDecision,
    total: decisionTrace.feedbackV2.total,
  },
}, null, 2));
