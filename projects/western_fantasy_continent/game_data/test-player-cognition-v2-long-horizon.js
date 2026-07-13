const assert = require("assert");
const RUNTIME = require("./player-cognition-v2-event-runtime");
const POLICY = require("./player-cognition-v2-action-policy");

function visibleNodes(overrides = {}) {
  return [
    { id: "r1_main_10", name: "Main 10", type: "main", status: "farmable", rewardHint: "equipment" },
    { id: "r1_boss", name: "Boss", type: "boss", status: "available", rewardHint: "region clear" },
  ].map((node) => ({ ...node, ...(overrides[node.id] || {}) }));
}

function observation(power, overrides = {}) {
  const nodes = visibleNodes(overrides);
  return {
    step: 20,
    currentGoal: "defeat the region boss",
    gear: { score: power },
    visibleNodes: nodes,
    allowedActions: nodes.filter((node) => ["available", "farmable", "repeatable"].includes(node.status)).map((node) => `challenge:${node.id}`),
  };
}

function lossEvent(power) {
  return {
    id: "boss-loss",
    time: 1,
    type: "combat_result",
    subject: { id: "player_squad" },
    environment: { node: "r1_boss" },
    behavior: { kind: "map_action", key: "challenge:r1_boss" },
    result: { kind: "combat_loss", occurred: true, observedPower: power },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasNumber: true, hasAnimation: true },
  };
}

function testFailureBaselineWake() {
  const failed = RUNTIME.ingestEvents(RUNTIME.createState("v2-wake"), [lossEvent(100)]);
  const memory = failed.failureMemories[0];
  assert.equal(memory.baselinePower, 100, "failure stores observed power baseline");
  assert.equal(memory.wakePowerGrowth, 0.3, "failure stores explicit wake threshold");

  const dormant = POLICY.selectNextAction(failed, observation(125));
  assert.notEqual(dormant.action, "challenge:r1_boss", "sub-threshold growth keeps failed boss dormant");

  const awake = POLICY.selectNextAction(failed, observation(131));
  assert.equal(awake.action, "challenge:r1_boss", "observed growth above threshold wakes boss reconsideration");
  assert.equal(awake.candidates[0].failureBasis.wakeReady, true);
}

function testPostCompletionStops() {
  const state = RUNTIME.createState("v2-terminal");
  const done = observation(150, {
    r1_boss: { status: "cleared" },
    r1_main_10: { status: "farmable" },
  });
  const choice = POLICY.selectNextAction(state, done);
  assert.equal(choice.terminal, true, "completed region without unfinished visible nodes concludes");
  assert.equal(choice.action, null);
}

function testHiddenPowerCannotCreateWakeBaseline() {
  const hidden = lossEvent(100);
  hidden.presentation.hasNumber = false;
  const state = RUNTIME.ingestEvents(RUNTIME.createState("v2-hidden-power"), [hidden]);
  assert.equal(state.failureMemories[0].baselinePower, null, "unseen power cannot become a failure baseline");
  const choice = POLICY.selectNextAction(state, observation(1000));
  const boss = choice.candidates.find((candidate) => candidate.action === "challenge:r1_boss");
  assert.equal(boss.failureBasis.wakeReady, false, "unseen baseline cannot be woken by later numeric state");
}

function testUsefulRepetitionRemainsAvailable() {
  const failed = RUNTIME.ingestEvents(RUNTIME.createState("v2-useful-repeat"), [lossEvent(100)]);
  const prep = observation(110);
  const first = POLICY.selectNextAction(failed, prep);
  assert.equal(first.action, "challenge:r1_main_10", "known growth action remains available while boss wake condition is unmet");
  const second = POLICY.selectNextAction(first.cognitionState, prep);
  assert.equal(second.action, "challenge:r1_main_10", "bounded repetition remains possible for a visible unfinished goal");
}

testFailureBaselineWake();
testPostCompletionStops();
testHiddenPowerCannotCreateWakeBaseline();
testUsefulRepetitionRemainsAvailable();
console.log("player cognition V2 long-horizon tests passed");
