const assert = require("node:assert/strict");
const ADAPTER = require("./player-feedback-emotion-adapter-v1");

const trace = [];
const history = [];

const schedule = [
  common(90), common(180), common(270), common(360), common(450), common(540),
  wait(630), wait(900), wait(1200), wait(1500), wait(1800), wait(2100),
  common(2400), character(2490), common(2580), common(2670), common(2760),
  mythic(2850, 1.2), mythic(2940, 0.3), mythic(3030, 0),
  wait(3300), wait(3600), wait(3900), wait(4200), wait(4500),
  mythic(4800, 0), common(4890), character(4980), character(5070), mythic(5160, 0),
];

schedule.forEach((entry, index) => addCycle(index + 1, entry));

const result = ADAPTER.simulateChapterFeedbackEmotion({
  profileState: { profileId: "inertial_player" },
  cognitionState: { trace },
  history,
});

assert.equal(history.length, 30, "固定测试必须覆盖30个连续时刻");

const c1 = rewardFrame(1);
const c6 = rewardFrame(6);
const c13 = rewardFrame(13);
const characterFirst = rewardFrame(14);
const mythicFirst = rewardFrame(18);
const mythicSecond = rewardFrame(19);
const mythicThird = rewardFrame(20);
const mythicRecovered = rewardFrame(26);
const characterRecovered = rewardFrame(28);
const characterRepeated = rewardFrame(29);

assert.ok(c6.episode.rewardHabituation < c1.episode.rewardHabituation, "同类普通奖励应逐渐习惯化");
assert.ok(c6.modeledReleases.endogenousOpioid < c1.modeledReleases.endogenousOpioid, "同类奖励的享受脉冲应下降");
assert.ok(c13.episode.rewardHabituation > c6.episode.rewardHabituation + 0.2, "奖励空窗后同类敏感度应恢复");
assert.equal(characterFirst.episode.rewardHabituation, 1, "看腻普通装备不应削弱首次角色解锁");
assert.equal(mythicFirst.episode.rewardHabituation, 1, "首次神话奖励应作为新类别处理");
assert.ok(mythicSecond.episode.rewardHabituation < mythicFirst.episode.rewardHabituation, "重复神话也应开始习惯化");
assert.ok(mythicThird.episode.rewardHabituation < mythicSecond.episode.rewardHabituation, "神话奖励不能永久保持首次强度");
assert.ok(mythicFirst.modeledReleases.dopamine > mythicThird.modeledReleases.dopamine * 1.5, "真正超预期的首次神话应有更强多巴胺脉冲");
assert.ok(mythicRecovered.episode.rewardHabituation > mythicThird.episode.rewardHabituation + 0.15, "神话奖励空窗后应恢复部分敏感度");
assert.ok(characterRecovered.episode.rewardHabituation > characterRepeated.episode.rewardHabituation, "恢复后的角色奖励再次重复仍应下降");
assert.ok(result.finalChemistry.dopamine.level < 0.9, "长序列结束时多巴胺不应饱和");
assert.ok(result.finalChemistry.endogenousOpioid.level < 0.95, "长序列结束时内源性阿片不应饱和");

console.log(JSON.stringify({
  result: "PASS",
  moments: history.length,
  commonHabituation: [1, 2, 3, 4, 5, 6].map((cycle) => rewardFrame(cycle).episode.rewardHabituation),
  commonAfterGap: c13.episode.rewardHabituation,
  characterFirst: characterFirst.episode.rewardHabituation,
  mythicHabituation: [mythicFirst, mythicSecond, mythicThird].map((frame) => frame.episode.rewardHabituation),
  mythicDopamineRelease: [mythicFirst, mythicSecond, mythicThird].map((frame) => frame.modeledReleases.dopamine),
  mythicAfterGap: mythicRecovered.episode.rewardHabituation,
  characterRecoveredThenRepeated: [
    characterRecovered.episode.rewardHabituation,
    characterRepeated.episode.rewardHabituation,
  ],
  finalChemistry: {
    dopamine: result.finalChemistry.dopamine.level,
    endogenousOpioid: result.finalChemistry.endogenousOpioid.level,
  },
}, null, 2));

function common(timeSeconds) {
  return { timeSeconds, reward: { type: "loot", category: "common", R: 0.45, A: 0 } };
}

function character(timeSeconds) {
  return { timeSeconds, reward: { type: "character_unlock", category: "character", R: 1.8, A: 0.8 } };
}

function mythic(timeSeconds, A) {
  return { timeSeconds, reward: { type: "loot", category: "mythic", R: 3.6, A } };
}

function wait(timeSeconds) {
  return { timeSeconds, reward: null };
}

function addCycle(cycle, entry) {
  const action = `observe:reward_${cycle}`;
  trace.push({
    eventId: `decision:${cycle}`,
    type: "decision",
    feedbackV2: bundle({}),
  });
  if (entry.reward) {
    trace.push({
      eventId: `reward:${cycle}`,
      type: entry.reward.type,
      feedbackV2: bundle({
        R: entry.reward.R,
        A: entry.reward.A,
        result: rewardResult(entry.reward),
      }),
    });
  }
  history.push({
    cycle,
    timeSeconds: entry.timeSeconds,
    action,
    outcome: entry.reward ? "reward_observed" : "no_reward_window",
    decisionRequest: {
      observation: { allowedActions: [action] },
      playerState: { rosterChangeExpectations: null },
    },
  });
}

function rewardResult(reward) {
  if (reward.type === "loot") {
    return { kind: "loot", occurred: true, rarity: reward.category };
  }
  return {
    kind: "character_unlock",
    occurred: true,
    character: "test_hero",
    heroId: "hero_test",
  };
}

function bundle({ R = 0, A = 0, result = null }) {
  return {
    schema: "player_feedback_bundle_v2",
    evidence: { H: 0.8, result },
    channels: {
      process: { value: 0, components: { decision: { EDecision: 0, QDecision: null } } },
      R: { value: R },
      A: { value: A, status: result ? "resolved" : "unresolved" },
      C: { value: 0, status: "not_applicable" },
      EVerify: { value: 0, rows: [] },
    },
    stateTransitions: {},
    total: R + A,
  };
}

function rewardFrame(cycle) {
  return result.frames.find((frame) => frame.episode.cycle === cycle && frame.episode.momentKind === "reward");
}
