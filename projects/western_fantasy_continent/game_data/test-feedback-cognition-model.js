const assert = require("assert");
const MODEL = require("./feedback-cognition-model");

function run() {
  const config = MODEL.normalizeConfig({ initialValue: 50, decayPer5s: 4, recoveryPerFailure: 0.4, baseIntensity: { "kill:normal_enemy": 10, "loot:equipment": 20 } });
  const state = MODEL.createState(config, "feedback-test");

  MODEL.advanceTo(state, 12, config);
  assert.strictEqual(state.value, 42, "two five-second ticks should decay feedback by 8");

  MODEL.triggerEvent(state, "kill:normal_enemy", { time: 12 }, config);
  MODEL.triggerEvent(state, "kill:normal_enemy", { time: 12 }, config);
  assert.strictEqual(state.eventRecords["kill:normal_enemy"].freshness, 0.8, "linear repetition should remove ten percentage points per trigger");
  assert.strictEqual(state.value, 61, "first and second kill should grant 10 + 9");

  MODEL.triggerEvent(state, "loot:equipment", { time: 12 }, config);
  assert.strictEqual(state.eventRecords["loot:equipment"].freshness, 0.9, "equipment freshness must be independent from kill freshness");

  for (let index = 0; index < 8; index += 1) MODEL.triggerEvent(state, "kill:normal_enemy", { time: 12 }, config);
  assert.strictEqual(state.eventRecords["kill:normal_enemy"].freshness, 0, "ten total kills should exhaust normal-kill freshness");

  const failure = MODEL.recordFailure(state, "test_lock", ["kill:normal_enemy"], { time: 12 }, { ...config, abandon: { baseBias: -99 } });
  assert.strictEqual(failure.abandoned, false, "forced low abandonment should continue the session");
  assert.ok(state.lastAbandonDecision.preAbandonEmotion !== "已放弃", "pre-roll emotion must stay separate from the terminal abandon decision");
  assert.strictEqual(state.eventRecords["kill:normal_enemy"].freshness, 0.4, "relevant failure should restore forty percentage points");
  assert.strictEqual(state.eventRecords["kill:normal_enemy"].triggerCount, 10, "failure recovery must preserve trigger history");

  assert.ok(!MODEL.emotionLabel(state, config).includes("受挫"), "one unresolved failure should not force the repeated-frustration label");
  assert.strictEqual(MODEL.resolveFailure(state, "test_lock", { time: 12 }, config), true, "matching success should resolve active frustration");
  assert.strictEqual(state.activeFailureCount, 0, "resolved active frustration should clear without deleting cumulative failures");

  const expectationState = MODEL.createState({ ...config, initialValue: 50 }, "expectation-test");
  MODEL.createExpectation(expectationState, "blue:test", { time: 0, strength: 0.4, expectedEvent: "loot:rare_equipment" }, config);
  MODEL.resolveExpectation(expectationState, "blue:test", false, { time: 1 }, config);
  assert.strictEqual(expectationState.value, 48.4, "a missed 40% expectation should apply a proportional disappointment penalty");

  const fatigueState = MODEL.createState({ ...config, initialValue: 60 }, "fatigue-test");
  MODEL.advanceTo(fatigueState, 13, config);
  assert.strictEqual(MODEL.emotionLabel(fatigueState, config), "疲惫", "a long no-gain interval should create fatigue before stock reaches zero");

  console.log("feedback-cognition-model tests passed");
}

run();
