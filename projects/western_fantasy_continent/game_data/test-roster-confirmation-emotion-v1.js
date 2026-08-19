const assert = require("node:assert/strict");
const {
  calculateConfirmationFeedback,
  calculateMismatchFeedback,
} = require("./player-feedback-model");
const ADAPTER = require("./player-feedback-emotion-adapter-v1");

const exact = confirmationCase({
  name: "exact",
  predictedScore: 0.4,
  actualScore: 0.4,
  expectedLevel: 3,
  actualLevel: 3,
  mismatchDelta: 0,
  outcome: "win",
  R: 0.8,
});
const better = confirmationCase({
  name: "better",
  predictedScore: 0.4,
  actualScore: 0.8,
  expectedLevel: 3,
  actualLevel: 5,
  mismatchDelta: 0.5,
  outcome: "win",
  R: 1.2,
});
const worse = confirmationCase({
  name: "worse",
  predictedScore: 0.4,
  actualScore: -0.2,
  expectedLevel: 3,
  actualLevel: 2,
  mismatchDelta: -0.5,
  outcome: "loss",
  R: -0.8,
});
const rightResultWrongCause = confirmationCase({
  name: "right-result-wrong-cause",
  predictedScore: 0.4,
  actualScore: 0.4,
  expectedLevel: 3,
  actualLevel: 3,
  mismatchDelta: 0,
  outcome: "win",
  R: 0.8,
  causalSupport: 0,
});
const rightResultRightCause = confirmationCase({
  name: "right-result-right-cause",
  predictedScore: 0.4,
  actualScore: 0.4,
  expectedLevel: 3,
  actualLevel: 3,
  mismatchDelta: 0,
  outcome: "win",
  R: 0.8,
  causalSupport: 0.8,
});

assert.ok(exact.confirmation.value > 0, "结果符合冻结预测时应产生C");
assert.ok(exact.frame.experiences.confirmationSatisfaction > 0.4, "符合预期应形成确认满足");
assert.ok(better.confirmation.value > exact.confirmation.value, "明显超预期应放大自我确认");
assert.ok(better.frame.emotionVector.surprise > exact.frame.emotionVector.surprise, "明显超预期还应额外产生惊喜");
assert.equal(worse.confirmation.value, 0, "感知档位明确下降时不应保留自我确认");
assert.equal(worse.frame.experiences.confirmationSatisfaction, 0, "明显失败没有确认满足");
assert.equal(rightResultWrongCause.frame.experiences.strategySatisfaction, 0, "只赢了但缺乏因果支持时不能宣称策略被验证");
assert.ok(rightResultWrongCause.frame.experiences.confirmationSatisfaction > 0.4, "结果预测可以成立，但必须与因果确认分开");
assert.ok(rightResultRightCause.frame.experiences.strategySatisfaction > 0.4, "结果与因果链同时成立时才产生策略满足");
assert.equal(
  rightResultRightCause.frame.experiences.confirmationSatisfaction,
  rightResultWrongCause.frame.experiences.confirmationSatisfaction,
  "EVerify不能反过来伪造或放大C",
);

console.log(JSON.stringify({
  result: "PASS",
  exact: summarize(exact),
  better: summarize(better),
  worse: summarize(worse),
  rightResultWrongCause: summarize(rightResultWrongCause),
  rightResultRightCause: summarize(rightResultRightCause),
}, null, 2));

function confirmationCase({
  name,
  predictedScore,
  actualScore,
  expectedLevel,
  actualLevel,
  mismatchDelta,
  outcome,
  R,
  causalSupport = 0,
}) {
  const H = 0.8;
  const goalWeight = 0.8;
  const confirmation = calculateConfirmationFeedback({
    effectivePredictionConfidence: 0.8,
    predictedCombatScore: predictedScore,
    actualCombatScore: actualScore,
    expectedPerception: { level: expectedLevel },
    actualPerception: { level: actualLevel },
    confirmed: expectedLevel === actualLevel,
  }, H, goalWeight);
  const mismatch = calculateMismatchFeedback(mismatchDelta, H, goalWeight);
  const verificationRows = causalSupport > 0 ? [{
    status: "confirmed",
    derived: {
      strategySatisfaction: causalSupport,
      discoverySatisfaction: 0,
      knowledgeEvidence: causalSupport,
    },
  }] : [];
  const action = "challenge:roster_test";
  const feedbackV2 = {
    schema: "player_feedback_bundle_v2",
    evidence: { H },
    channels: {
      process: { value: 0.04, components: { decision: { EDecision: 1, QDecision: null } } },
      R: { value: R },
      A: { value: mismatch.value, status: "resolved_roster_prediction" },
      C: { value: confirmation.value, status: confirmation.applied ? "resolved" : "disconfirmed" },
      EVerify: { value: 0, rows: verificationRows },
    },
    stateTransitions: {},
    total: 0.04 + R + mismatch.value + confirmation.value,
  };
  const session = {
    profileState: { profileId: "inertial_player" },
    cognitionState: {
      trace: [{
        eventId: `decision:${name}`,
        type: "decision",
        feedbackV2: {
          ...feedbackV2,
          channels: {
            ...feedbackV2.channels,
            R: { value: 0 },
            A: { value: 0, status: "unresolved" },
            C: { value: 0, status: "not_applicable" },
            EVerify: { value: 0, rows: [] },
          },
        },
      }, {
        eventId: `combat:${name}`,
        type: "combat_result",
        expectationSource: "roster_prediction",
        feedbackV2,
      }],
    },
    history: [{
      cycle: 1,
      timeSeconds: 90,
      action,
      outcome,
      decisionRequest: {
        observation: { allowedActions: [action, "alternative"] },
        playerState: { rosterChangeExpectations: null },
      },
    }],
  };
  const result = ADAPTER.simulateChapterFeedbackEmotion(session);
  return { confirmation, mismatch, frame: result.frames[0] };
}

function summarize(row) {
  return {
    A: row.mismatch.value,
    C: row.confirmation.value,
    confirmationMultiplier: row.confirmation.geometricMultiplier,
    emotions: row.frame.emotions.slice(0, 5).map((emotion) => `${emotion.family}:${emotion.intensity}`),
    experiences: row.frame.experiences,
  };
}
