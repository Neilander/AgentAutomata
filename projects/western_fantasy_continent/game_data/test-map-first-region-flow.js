const assert = require("node:assert/strict");
const CORE = require("../map_progression_lab/map-progression-cognition-core");
const FLOW = require("./analyze-map-cognition-v5-flow");
const BATCH = require("./analyze-map-cognition-batch");

function clearMain(state, from, to) {
  let current = state;
  for (let index = from; index <= to; index += 1) {
    const result = CORE.applyAction(current, `challenge:r1_main_${index}`);
    assert.equal(result.ok, true, `main ${index} should be challengeable`);
    assert.equal(result.event.outcome, "win", `main ${index} should be an onboarding clear`);
    current = result.state;
  }
  return current;
}

function testInitialRosterCanSwap() {
  const observation = CORE.observe(CORE.initialState("initial-swap"));
  assert(observation.allowedActions.some((action) => action.startsWith("swap:")), "initial heroes and militia should be swappable");
}

function testForkTopology() {
  let state = clearMain(CORE.initialState("fork"), 1, 6);
  let observation = CORE.observe(state);
  assert(observation.allowedActions.includes("challenge:r1_main_7"));
  assert(observation.allowedActions.includes("challenge:r1_main_8"));
  assert(!observation.allowedActions.includes("challenge:r1_main_9"));

  const branch = CORE.applyAction(state, "challenge:r1_main_7");
  assert.equal(branch.event.outcome, "win");
  state = branch.state;
  observation = CORE.observe(state);
  assert(observation.allowedActions.includes("challenge:r1_main_9"), "either branch should unlock the merge node");
}

function testOneTimeRewards() {
  const result = BATCH.checkBranchInvariants(8);
  assert.equal(result.campRepeatNoRewardRate, 1);
  assert.equal(result.prisonImmediateRetryRate, 1);
  assert.equal(result.prisonRepeatNoRewardRate, 1);
}

function testCognitionFlow() {
  const result = FLOW.runBatch(30).aggregate;
  assert(result.completionRate >= 0.9, `completion rate too low: ${result.completionRate}`);
  assert(result.averageMinimumFeedback >= 28, `feedback floor too low: ${result.averageMinimumFeedback}`);
  assert((result.branchChoices.r1_main_7 || 0) > 0 && (result.branchChoices.r1_main_8 || 0) > 0, "both routes should be exercised");
  assert(result.hypotheses.confirmed > 0 && result.hypotheses.refuted > 0, "the flow should produce actual hypothesis tests");
}

testInitialRosterCanSwap();
testForkTopology();
testOneTimeRewards();
testCognitionFlow();
console.log("map first-region flow tests passed");
