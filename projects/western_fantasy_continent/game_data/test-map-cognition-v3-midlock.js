const assert = require("assert");
const CORE = require("../map_progression_lab/map-progression-cognition-core-phase2-midlock");
const LOOP = require("./analyze-map-cognition-v3-midlock");
const SIGNALS = require("./combat-signals");

let lossRoutes = 0;
let bypassRoutes = 0;
let rangerValidationRoutes = 0;
let earlyMain7Bypasses = 0;
for (let index = 1; index <= 20; index += 1) {
  const result = LOOP.runLoop(`midlock-regression-${index}`, 40);
  assert.equal(result.ok, true);
  const actions = result.loop.actions;
  const prison = actions.findIndex((row) => row.action === "challenge:r1_prison" && row.outcome === "win");
  const firstPrison = actions.findIndex((row) => row.action === "challenge:r1_prison");
  const swap = actions.findIndex((row) => row.action.startsWith("swap:") && row.action.endsWith(":hero_ranger"));
  const proof = actions.findIndex((row) => row.action === "challenge:r1_main_7");
  assert.equal(swap, prison + 1, "Ranger use remains immediate");
  if (proof > swap) rangerValidationRoutes += 1;
  else {
    earlyMain7Bypasses += 1;
    assert.ok(proof >= 0 && proof < prison, "A missing post-swap proof must be explained by a successful early Main 7 bypass");
    assert.equal(actions[proof].outcome, "win");
  }
  if (actions[firstPrison].outcome === "loss") {
    assert.ok(actions.findIndex((row) => row.action === "challenge:r1_main_4") < prison, "Main 4 remains traversable after an early Prison loss");
    assert.ok(actions.findIndex((row) => row.action === "challenge:r1_main_5") < prison, "Main 5 remains traversable after an early Prison loss");
  }

  const firstLock = actions.findIndex((row) => row.action === "challenge:r1_main_6");
  if (actions[firstLock].outcome === "loss") {
    lossRoutes += 1;
    assert.equal(actions[firstLock + 1].action, "challenge:r1_bandit", "failure selects the visible key source");
    assert.equal(actions[firstLock + 1].outcome, "win");
    const verification = actions.findIndex((row, actionIndex) => actionIndex > firstLock + 1 && row.action === "challenge:r1_main_6");
    assert.ok(verification > firstLock + 1, "key acquisition eventually leads back to the visible lock");
    assert.equal(actions[verification].outcome, "win", "the key reliably opens the lock after optional rescue actions");
  } else {
    bypassRoutes += 1;
  }
  assert.ok(result.loop.terminal, "route remains bounded");
}
assert.ok(lossRoutes >= 5, "sample contains meaningful lock routes");
assert.ok(bypassRoutes >= 5, "soft lock preserves existing-build bypass routes");
assert.ok(rangerValidationRoutes >= 10, "most routes must validate Ranger after rescue");
assert.ok(earlyMain7Bypasses >= 1, "the optional Ranger key retains a real non-Ranger bypass");

let state = CORE.initialState("midlock-visible-key");
for (const action of [
  "challenge:r1_main_1", "challenge:r1_main_2", "challenge:r1_main_3", "challenge:r1_prison",
  "challenge:r1_main_4", "challenge:r1_main_5", "challenge:r1_main_6", "challenge:r1_bandit",
]) state = CORE.applyAction(state, action).state;
const verification = CORE.applyAction(state, "challenge:r1_main_6", { captureVisibleSignals: true });
const fieldNames = verification.analysis.combatSignals.filter((row) => row.behavior.kind === "field_effect").map((row) => row.behavior.name);
assert.ok(fieldNames.includes("重盾"), "lock is visible as a field signal");
assert.ok(fieldNames.includes("破盾军械生效"), "key activation is visible to the player model");
assert.ok(fieldNames.includes("裂甲军械生效"), "secondary key activation is visible to the player model");
assert.equal(SIGNALS.describePresentation({ kind: "field", tags: ["field"], target: { id: "target" } }).visible, true, "field signals have a renderer-backed presentation contract");

console.log("map cognition V3 mid-lock tests passed");
