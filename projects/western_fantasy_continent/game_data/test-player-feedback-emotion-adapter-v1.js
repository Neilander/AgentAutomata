const assert = require("node:assert/strict");
const ADAPTER = require("./player-feedback-emotion-adapter-v1");

const trace = [];
const history = [];

addCycle({ action: "challenge:test_gate", outcome: "loss", process: -0.5, R: -0.7, A: -0.08 });
addCycle({ action: "challenge:test_gate", outcome: "loss", process: -0.6, R: -0.8, A: -0.12 });
addCycle({ action: "swap:1:unknown_hero", outcome: "team_changed", process: 0.16, unknownRoster: true, EDecision: 4 });
addCycle({ action: "challenge:test_gate", outcome: "win", process: -0.4, R: 1.2, A: 0.5, EDecision: 4 });
addCycle({
  action: "challenge:test_boss",
  outcome: "win",
  process: -0.3,
  R: 4,
  A: 0,
  C: 0.04,
  EDecision: 4,
  strategySatisfaction: 0.8,
  reward: { R: 0.8, A: -0.55 },
});

const result = ADAPTER.simulateChapterFeedbackEmotion({
  profileState: { profileId: "inertial_player" },
  cognitionState: { trace },
  history,
});

assert.equal(result.audit.inputEpisodeCount, 5);
assert.equal(result.audit.inputMomentCount, 6);
assert.equal(result.frames.length, 6);
assert.equal(result.audit.rawPhysicalInputsUsed, false);

const firstLoss = frame(1, "primary");
const secondLoss = frame(2, "primary");
const unknownSwap = frame(3, "primary");
const breakthrough = frame(4, "primary");
const boss = frame(5, "primary");
const bossReward = frame(5, "reward");

assert.ok(firstLoss.emotionVector.frustration > firstLoss.emotionVector.sadness);
assert.ok(secondLoss.emotionVector.anxiety > firstLoss.emotionVector.anxiety, "连续失败应增加焦虑");
assert.ok(unknownSwap.emotionVector.curiosity > 0.2, "未知角色应形成信息缺口，而不是伪造预测");
assert.ok(breakthrough.emotionVector.relief > 0.3, "连续失败后的突破应产生宽慰");
assert.ok(breakthrough.emotionVector.joy > 0.3);
assert.ok(breakthrough.experiences.achievement > 0.4);
assert.notEqual(boss.emotions[0]?.family, "disappointment", "Boss胜利不能被掉落失望覆盖");
assert.ok(bossReward.emotionVector.disappointment > 0.2, "低于预期的掉落可单独产生失望");
assert.ok(boss.experiences.confirmationSatisfaction > 0.4, "非零C应形成独立确认满足");
assert.ok(boss.experiences.strategySatisfaction > 0.4, "因果支持应形成策略满足");
assert.equal(result.finalChemistry.oxytocin.level, 0.38, "无社交证据时催产素应保持基线");

const routineTrace = [];
const routineHistory = [];
for (let index = 0; index < 6; index += 1) {
  addRoutineWin(index + 1);
}
const routineResult = ADAPTER.simulateChapterFeedbackEmotion({
  profileState: { profileId: "inertial_player" },
  cognitionState: { trace: routineTrace },
  history: routineHistory,
});
const routinePrimary = routineResult.frames.filter((row) => row.episode.momentKind === "primary");
const unexpectedRoutineReward = routineResult.frames.find(
  (row) => row.episode.cycle === 6 && row.episode.momentKind === "reward",
);
assert.ok(
  routinePrimary[5].episode.rewardHabituation < routinePrimary[0].episode.rewardHabituation,
  "连续常规胜利应逐渐习惯化",
);
assert.ok(
  routinePrimary[5].modeledReleases.dopamine < routinePrimary[0].modeledReleases.dopamine,
  "完全符合预期的重复胜利不应持续产生同样强的多巴胺脉冲",
);
assert.ok(
  Math.max(...routinePrimary.map((row) => row.chemistry.dopamine.level)) < 0.85,
  "常规连续胜利不应把多巴胺推到饱和",
);
assert.ok(
  unexpectedRoutineReward.modeledReleases.dopamine > routinePrimary[5].modeledReleases.dopamine * 2,
  "习惯化后真正超预期的奖励仍应重新产生强多巴胺脉冲",
);

console.log(JSON.stringify({
  result: "PASS",
  firstLoss: top(firstLoss),
  secondLoss: top(secondLoss),
  unknownSwap: top(unknownSwap),
  breakthrough: top(breakthrough),
  boss: top(boss),
  bossReward: top(bossReward),
  bossExperiences: boss.experiences,
  finalOxytocin: result.finalChemistry.oxytocin.level,
  routineWinDopamine: routinePrimary.map((row) => row.chemistry.dopamine.level),
  routineWinHabituation: routinePrimary.map((row) => row.episode.rewardHabituation),
  unexpectedRewardDopamineRelease: unexpectedRoutineReward.modeledReleases.dopamine,
}, null, 2));

function addRoutineWin(cycle) {
  const action = `challenge:routine_${cycle}`;
  routineTrace.push({
    eventId: `routine-decision:${cycle}`,
    type: "decision",
    feedbackV2: bundle({ process: 0.04, EDecision: 1 }),
  });
  routineTrace.push({
    eventId: `routine-result:${cycle}`,
    type: "combat_result",
    feedbackV2: bundle({ R: 0.8, A: 0 }),
  });
  if (cycle === 6) {
    routineTrace.push({
      eventId: `routine-loot:${cycle}`,
      type: "loot",
      feedbackV2: bundle({ R: 2.4, A: 1.2 }),
    });
  }
  routineHistory.push({
    cycle,
    action,
    outcome: "win",
    decisionRequest: {
      observation: { allowedActions: [action, "alternative"] },
      playerState: { rosterChangeExpectations: null },
    },
  });
}

function addCycle({
  action,
  outcome,
  process = 0,
  R = 0,
  A = 0,
  C = 0,
  EDecision = 1,
  unknownRoster = false,
  strategySatisfaction = 0,
  reward = null,
}) {
  const cycle = history.length + 1;
  const decisionId = `decision:${cycle}`;
  trace.push({
    eventId: decisionId,
    type: "decision",
    feedbackV2: bundle({ process: EDecision * 0.04, EDecision }),
  });
  trace.push({
    eventId: `result:${cycle}`,
    type: action.startsWith("challenge:") ? "combat_result" : "team_change",
    expectationSource: C !== 0 ? "roster_prediction" : "knowledge",
    feedbackV2: bundle({ process, R, A, C, strategySatisfaction }),
  });
  if (reward) {
    trace.push({
      eventId: `loot:${cycle}`,
      type: "loot",
      feedbackV2: bundle({ R: reward.R, A: reward.A }),
    });
  }
  const rosterChangeExpectations = unknownRoster ? {
    actions: [{ action, predictedPerformanceScore: null, expectedChange: "unknown" }],
  } : null;
  history.push({
    cycle,
    action,
    outcome,
    decisionRequest: {
      observation: { allowedActions: [action, "alternative"] },
      playerState: { rosterChangeExpectations },
    },
  });
}

function bundle({ process = 0, R = 0, A = 0, C = 0, EDecision = null, strategySatisfaction = 0 }) {
  const verificationRows = strategySatisfaction > 0 ? [{
    status: "confirmed",
    derived: {
      strategySatisfaction,
      discoverySatisfaction: 0,
      knowledgeEvidence: strategySatisfaction,
    },
  }] : [];
  return {
    schema: "player_feedback_bundle_v2",
    evidence: { H: 0.8 },
    channels: {
      process: {
        value: process,
        components: { decision: { EDecision, QDecision: null } },
      },
      R: { value: R },
      A: { value: A, status: "resolved" },
      C: { value: C, status: C ? "resolved" : "not_applicable" },
      EVerify: { value: 0, rows: verificationRows },
    },
    stateTransitions: {},
    total: process + R + A + C,
  };
}

function frame(cycle, momentKind) {
  return result.frames.find((row) => row.episode.cycle === cycle && row.episode.momentKind === momentKind);
}

function top(row) {
  return row.emotions.slice(0, 5).map((emotion) => `${emotion.family}:${emotion.intensity}`);
}
