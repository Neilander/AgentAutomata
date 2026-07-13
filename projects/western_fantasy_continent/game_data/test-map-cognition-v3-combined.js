const assert = require("assert");
const CORE = require("../map_progression_lab/map-progression-cognition-core-phase2-combined");
const LOOP = require("./analyze-map-cognition-v3-combined");
const SIGNALS = require("./combat-signals");

let lossRoutes = 0;
let bypassRoutes = 0;
let bossLossRoutes = 0;
let bossRecoveryRoutes = 0;
for (let index = 1; index <= 40; index += 1) {
  const result = LOOP.runLoop(`combined-regression-${index}`, 40);
  assert.equal(result.ok, true);
  const actions = result.loop.actions;
  const prison = actions.findIndex((row) => row.action === "challenge:r1_prison" && row.outcome === "win");
  const swap = actions.findIndex((row) => row.action.startsWith("swap:") && row.action.endsWith(":hero_ranger"));
  const proof = actions.findIndex((row) => row.action === "challenge:r1_main_4");
  assert.equal(swap, prison + 1, "Ranger use remains immediate");
  assert.equal(proof, swap + 1, "Ranger proof remains the next combat");

  const firstLock = actions.findIndex((row) => row.action === "challenge:r1_main_6");
  if (actions[firstLock].outcome === "loss") {
    lossRoutes += 1;
    assert.equal(actions[firstLock + 1].action, "challenge:r1_bandit", "failure selects the visible key source");
    assert.equal(actions[firstLock + 1].outcome, "win");
    assert.equal(actions[firstLock + 2].action, "challenge:r1_main_6", "key acquisition leads to immediate verification");
    assert.equal(actions[firstLock + 2].outcome, "win", "the key reliably opens the lock");
  } else {
    bypassRoutes += 1;
  }
  const firstBoss = actions.findIndex((row) => row.action === "challenge:r1_boss");
  if (actions[firstBoss]?.outcome === "loss") {
    bossLossRoutes += 1;
    let cursor = firstBoss + 1;
    let preparationActions = 0;
    while (actions[cursor]?.action === "challenge:r1_main_9") {
      assert.equal(actions[cursor].outcome, "win");
      preparationActions += 1;
      cursor += 1;
    }
    assert.ok(preparationActions >= 1 && preparationActions <= 5, "boss recovery remains bounded and visible");
    assert.equal(actions[cursor]?.action, "challenge:r1_boss", "visible growth eventually wakes the boss retry");
    assert.equal(actions[cursor]?.outcome, "win");
    bossRecoveryRoutes += 1;
  }
  assert.ok(result.loop.terminal, "route remains bounded");
}
assert.ok(lossRoutes >= 5, "sample contains meaningful lock routes");
assert.ok(bypassRoutes >= 5, "soft lock preserves existing-build bypass routes");
assert.ok(bossLossRoutes >= 5, "combined sample contains meaningful boss recovery routes");
assert.equal(bossRecoveryRoutes, bossLossRoutes, "every boss loss recovers through Main 9 and wins the retry");

let state = CORE.initialState("midlock-visible-key");
for (const action of [
  "challenge:r1_main_1", "challenge:r1_main_2", "challenge:r1_main_3", "challenge:r1_prison",
  "swap:1:hero_ranger", "challenge:r1_main_4", "challenge:r1_main_5", "challenge:r1_main_6", "challenge:r1_bandit",
]) state = CORE.applyAction(state, action).state;
const verification = CORE.applyAction(state, "challenge:r1_main_6", { captureVisibleSignals: true });
const fieldNames = verification.analysis.combatSignals.filter((row) => row.behavior.kind === "field_effect").map((row) => row.behavior.name);
assert.ok(fieldNames.includes("重盾"), "lock is visible as a field signal");
assert.ok(fieldNames.includes("破盾军械生效"), "key activation is visible to the player model");
assert.ok(fieldNames.includes("裂甲军械生效"), "secondary key activation is visible to the player model");
assert.equal(SIGNALS.describePresentation({ kind: "field", tags: ["field"], target: { id: "target" } }).visible, true, "field signals have a renderer-backed presentation contract");

const parityBase = CORE.initialState("display-settlement-parity");
const parityItem = CORE.nodes.find((item) => item.id === "r1_main_1");
const parityPrepared = CORE.normalizeState(parityBase);
parityPrepared.attempts = { ...parityPrepared.attempts, r1_main_1: 1 };
const playedCombat = CORE.resolveCombat(parityPrepared, parityItem);
const internallySettled = CORE.applyAction(parityBase, "challenge:r1_main_1", { captureVisibleSignals: true });
const displaySettled = CORE.applyAction(parityBase, "challenge:r1_main_1", { captureVisibleSignals: true, resolvedCombat: playedCombat });
assert.equal(internallySettled.event.combatSource, "core_simulation");
assert.equal(displaySettled.event.combatSource, "displayed_battle");
for (const key of ["outcome", "duration", "resolution", "gearBefore", "gearAfter"]) {
  assert.deepEqual(displaySettled.event[key], internallySettled.event[key], `display settlement preserves ${key}`);
}
assert.deepEqual(displaySettled.event.survivors, internallySettled.event.survivors, "display settlement preserves survivors");
assert.deepEqual(displaySettled.event.feedbackSignals, internallySettled.event.feedbackSignals, "display settlement preserves visible feedback");
assert.deepEqual(displaySettled.event.loot, internallySettled.event.loot, "display settlement preserves deterministic loot");
assert.deepEqual(displaySettled.state.inventory, internallySettled.state.inventory, "display settlement preserves inventory");

console.log("map cognition V3 combined-candidate tests passed");
