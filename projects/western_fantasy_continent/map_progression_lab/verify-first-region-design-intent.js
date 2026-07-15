const assert = require("node:assert/strict");
const CORE = require("./map-progression-cognition-core-phase2-midlock");
const INTENT = require("./first-region-design-intent.json");

const sampleCount = 100;
const metrics = {
  completeEarlyRoute: 0,
  prisonFirstClear: 0,
  main4Clear: 0,
  main5Clear: 0,
  campClear: 0,
  prisonPostCampClear: 0,
  postCampPrisonSamples: 0,
  main6Ready: 0,
  main7MageClear: 0,
  main7RangerClear: 0,
  rangerRoleProof: 0,
};

assert.equal(INTENT.immutable.validationNode, "r1_main_7");
assert.equal(INTENT.immutable.branchesDoNotGrantMainlinePermission, true);
assert.deepEqual(CORE.nodes.find((node) => node.id === "r1_main_4").requires, ["r1_main_3"]);
assert.deepEqual(CORE.nodes.find((node) => node.id === "r1_main_5").requires, ["r1_main_4"]);
assert.deepEqual(CORE.nodes.find((node) => node.id === "r1_prison").requires, ["r1_main_3"]);
assert.deepEqual(CORE.nodes.find((node) => node.id === "r1_bandit").requires, ["r1_main_5"]);
assert.deepEqual(CORE.nodes.find((node) => node.id === "r1_main_8").requires, ["r1_main_7"], "Main 8 must not bypass the Ranger validation encounter");
assert.deepEqual(CORE.nodes.find((node) => node.id === "r1_main_9").requires, ["r1_main_8"], "Main 9 must follow Main 8 instead of forming a fork");
assert.deepEqual(CORE.nodes.find((node) => node.id === "r1_main_9").requiresAny, [], "Chapter 1 mainline must not use alternate predecessors");

for (let index = 0; index < sampleCount; index += 1) {
  let state = CORE.initialState(`first-region-intent-${index}`, { starterVariant: "player_agent_role_wave" });
  let result;

  for (const node of ["r1_main_1", "r1_main_2"]) {
    result = challenge(state, node);
    state = result.state;
    if (!result.win) break;
  }
  if (!state.cleared.r1_main_2) continue;
  state = CORE.applyAction(state, "swap:2:hero_mage").state;
  result = challenge(state, "r1_main_3");
  state = result.state;
  if (!result.win) continue;
  metrics.completeEarlyRoute += 1;

  result = challenge(state, "r1_prison");
  state = result.state;
  if (result.win) metrics.prisonFirstClear += 1;

  result = challenge(state, "r1_main_4");
  state = result.state;
  if (!result.win) continue;
  metrics.main4Clear += 1;

  result = challenge(state, "r1_main_5");
  state = result.state;
  if (!result.win) continue;
  metrics.main5Clear += 1;

  for (let attempt = 0; attempt < 3 && !state.cleared.r1_bandit; attempt += 1) {
    result = challenge(state, "r1_bandit");
    state = result.state;
  }
  if (!state.cleared.r1_bandit) continue;
  metrics.campClear += 1;

  if (!state.cleared.r1_prison) {
    metrics.postCampPrisonSamples += 1;
    result = challenge(state, "r1_prison");
    state = result.state;
    if (!result.win) continue;
    metrics.prisonPostCampClear += 1;
  }

  for (let attempt = 0; attempt < 3 && !state.cleared.r1_main_6; attempt += 1) {
    state = challenge(state, "r1_main_6").state;
  }
  if (!state.cleared.r1_main_6) continue;
  metrics.main6Ready += 1;

  const mageState = structuredClone(state);
  let rangerState = structuredClone(state);
  rangerState = CORE.applyAction(rangerState, "swap:2:hero_ranger").state;

  result = challenge(mageState, "r1_main_7");
  if (result.win) metrics.main7MageClear += 1;

  result = challenge(rangerState, "r1_main_7");
  if (result.win) metrics.main7RangerClear += 1;
  if (result.event.roleProof) metrics.rangerRoleProof += 1;
}

assert.equal(metrics.completeEarlyRoute, sampleCount, "Main 1-3 must establish the lesson reliably");
assert(metrics.prisonFirstClear >= 5 && metrics.prisonFirstClear <= 25, `Prison must be a soft early lock, got ${metrics.prisonFirstClear}/${sampleCount}`);
assert.equal(metrics.main4Clear, sampleCount, "Main 4 must not require Prison, Camp, or Ranger");
assert.equal(metrics.main5Clear, sampleCount, "Main 5 must expose Camp without requiring Ranger");
assert.equal(metrics.campClear, sampleCount, "The visible equipment key must be obtainable");
assert.equal(metrics.prisonPostCampClear, metrics.postCampPrisonSamples, "Camp gear must reliably open Prison");
assert.equal(metrics.main6Ready, sampleCount, "Every sampled route must reach the Ranger validation window");
assert(metrics.main7MageClear >= 10 && metrics.main7MageClear <= 60, `Non-Ranger Main 7 route must remain possible but pressured, got ${metrics.main7MageClear}`);
assert(metrics.main7RangerClear >= 90, `Ranger should reliably solve Main 7, got ${metrics.main7RangerClear}`);
assert(metrics.main7RangerClear >= metrics.main7MageClear + 35, "Main 7 must create a material Ranger advantage");
assert(metrics.rangerRoleProof >= 90, "Ranger contribution must be visible, not merely inferred from victory");

console.log(JSON.stringify({ result: "PASS", sampleCount, metrics }, null, 2));

function challenge(state, nodeId) {
  const output = CORE.applyAction(state, `challenge:${nodeId}`);
  return { state: output.state, event: output.event, win: output.event.outcome === "win" };
}
