"use strict";

const assert = require("node:assert/strict");
const SETS = require("../game_data/equipment-sets");
const BUILD_LAYERS = require("../game_data/build-layers");
const GAME = require("./border-village-core");

function hasTag(signal, tag) { return signal.kind === "status" && signal.tags?.includes(tag); }

const twoPiece = BUILD_LAYERS.buildEquipmentModifierBundle(SETS.mockSetItems("verdantCircle", 2)).mechanicModifiers;
const threePiece = BUILD_LAYERS.buildEquipmentModifierBundle(SETS.mockSetItems("verdantCircle", 3)).mechanicModifiers;
const sixPiece = BUILD_LAYERS.buildEquipmentModifierBundle(SETS.mockSetItems("verdantCircle", 6)).mechanicModifiers;

assert.equal(twoPiece["set:verdantCircle:sowing"], undefined, "Two pieces incorrectly activate the three-piece effect");
assert.equal(threePiece["set:verdantCircle:sowing"], 1, "Three pieces do not activate sowing");
assert.equal(threePiece["set:verdantCircle:propagation"], undefined, "Three pieces incorrectly activate propagation");
assert.equal(sixPiece["set:verdantCircle:sowing"], 1, "Six pieces lost the three-piece effect");
assert.equal(sixPiece["set:verdantCircle:propagation"], 1, "Six pieces do not activate propagation");

const plan = GAME.natureSetMockPlan();
assert.equal(plan.mock, true);
assert(plan.leftTeam.filter((unit) => unit.mechanicModifiers?.["set:verdantCircle:propagation"]).length >= 2, "Mock battle bypasses equipment-set build layers");

const result = GAME.simulatePlan(plan);
const baseline = GAME.simulatePlan(GAME.natureSetMockPlan("baseline"));
assert(!baseline.signals.some((signal) => signal.tags?.includes("natureSeed")), "Baseline unexpectedly activates Verdant Circle");
assert(result.metrics.leftDamage > baseline.metrics.leftDamage, "Six-piece set does not improve damage over the same-seed baseline");
assert(result.metrics.rightAlive < baseline.metrics.rightAlive, "Six-piece set does not defeat more enemies than the same-seed baseline");
for (const tag of ["seedPlant", "seedGrow", "seedBloom", "seedSpread"]) {
  assert(result.signals.some((signal) => hasTag(signal, tag)), `Mock battle never emitted ${tag}`);
}
assert(result.signals.some((signal) => signal.kind === "heal" && signal.tags?.includes("verdantCircle")), "Friendly seed never produced real healing");
assert(result.signals.some((signal) => signal.kind === "damage" && signal.tags?.includes("verdantCircle")), "Enemy seed never produced real damage");
assert(result.signals.filter((signal) => hasTag(signal, "seedSpread")).every((signal) => signal.meta?.canSpread === false), "Propagated seeds can recursively spread");

const counts = Object.fromEntries(["seedPlant", "seedGrow", "seedBloom", "seedSpread"].map((tag) => [tag, result.signals.filter((signal) => hasTag(signal, tag)).length]));
console.log(JSON.stringify({ ok: true, baseline: { duration: baseline.duration, enemiesAlive: baseline.metrics.rightAlive, damage: baseline.metrics.leftDamage, healing: baseline.metrics.leftHealing }, set: { duration: result.duration, enemiesAlive: result.metrics.rightAlive, damage: result.metrics.leftDamage, healing: result.metrics.leftHealing }, delta: { damage: Math.round(result.metrics.leftDamage - baseline.metrics.leftDamage), healing: Math.round(result.metrics.leftHealing - baseline.metrics.leftHealing), defeated: baseline.metrics.rightAlive - result.metrics.rightAlive }, counts }, null, 2));
