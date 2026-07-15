const assert = require("node:assert/strict");
const ADAPTER = require("./map-cognition-v3-event-adapter");
const RUNTIME = require("./player-cognition-v3-event-runtime");

function event(step, hpPlayer, hpEnemy, outcome = "loss") {
  return {
    step,
    node: "continuous_test",
    outcome,
    duration: 10,
    firstClear: outcome === "win",
    survivors: { player: outcome === "win" ? 1 : 0, enemy: outcome === "loss" ? 1 : 0 },
    teamSizes: { player: 4, enemy: 4 },
    hpScore: { player: hpPlayer, enemy: hpEnemy },
    loot: [],
  };
}

function testContinuousPerformanceSeparatesMargins() {
  const hardLoss = ADAPTER.continuousCombatPerformance(event(1, 0, 3.6));
  const closeLoss = ADAPTER.continuousCombatPerformance(event(2, 0, 0.4));
  const closeWin = ADAPTER.continuousCombatPerformance(event(3, 0.4, 0, "win"));
  const cleanWin = ADAPTER.continuousCombatPerformance(event(4, 3.6, 0, "win"));

  assert.equal(hardLoss.score, -0.9);
  assert.equal(closeLoss.score, -0.1);
  assert.equal(closeWin.score, 0.1);
  assert.equal(cleanWin.score, 0.9);
  assert(hardLoss.score < closeLoss.score);
  assert(closeLoss.score < closeWin.score);
  assert(closeWin.score < cleanWin.score);
}

function testActionExpectationLearnsContinuousPerformance() {
  const action = "challenge:continuous_test";
  let state = RUNTIME.createState("continuous-performance");
  const firstRows = ADAPTER.buildMapEventLog(action, event(1, 0, 3.6));
  state = RUNTIME.ingestEvents(state, firstRows);
  const firstSummary = state.trace.find((row) => row.eventId.endsWith(":summary"));
  assert.equal(firstSummary.actualUtility, -0.9);
  assert.equal(firstSummary.mismatchStatus, "no_prior");

  const traceCount = state.trace.length;
  const secondRows = ADAPTER.buildMapEventLog(action, event(2, 0, 0.4));
  state = RUNTIME.ingestEvents(state, secondRows);
  const secondSummary = state.trace.slice(traceCount).find((row) => row.eventId.endsWith(":summary"));
  assert.equal(secondSummary.expectedUtility, -0.9);
  assert.equal(secondSummary.actualUtility, -0.1);
  assert(secondSummary.expectationEmotion > 0, "an objectively closer loss should beat the learned hard-loss expectation");
}

function testMissingCombatDetailKeepsLegacySettlement() {
  const rows = ADAPTER.buildMapEventLog("challenge:legacy", {
    step: 1,
    node: "legacy",
    outcome: "loss",
    duration: 10,
    loot: [],
  });
  const summary = rows.find((row) => row.type === "action_summary");
  assert.equal(Object.hasOwn(summary.result, "utility"), false);
  assert.equal(RUNTIME.utilityOf(summary), -1);
}

testContinuousPerformanceSeparatesMargins();
testActionExpectationLearnsContinuousPerformance();
testMissingCombatDetailKeepsLegacySettlement();

console.log(JSON.stringify({ result: "PASS", tests: 3 }, null, 2));
