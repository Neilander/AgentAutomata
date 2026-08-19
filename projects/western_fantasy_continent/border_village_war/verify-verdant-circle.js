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
const unitDamage = (combatResult, name) => combatResult.units.find((unit) => unit.name === name)?.damageDone || 0;
const baselineWarlockDamage = unitDamage(baseline, "自然术士·盐枝");
const setWarlockDamage = unitDamage(result, "自然术士·盐枝");
const baselineWarlockDps = baselineWarlockDamage / baseline.duration;
const setWarlockDps = setWarlockDamage / result.duration;
assert(!baseline.signals.some((signal) => signal.tags?.includes("natureSeed")), "Baseline unexpectedly activates Verdant Circle");
assert(result.metrics.leftDamage > baseline.metrics.leftDamage, "Six-piece set does not improve damage over the same-seed baseline");
assert(result.metrics.rightAlive < baseline.metrics.rightAlive, "Six-piece set does not defeat more enemies than the same-seed baseline");
assert(setWarlockDps >= baselineWarlockDps * 1.8, `Adapted damage dealer did not approach double output rate: ${setWarlockDps} vs ${baselineWarlockDps}`);
for (const tag of ["seedPlant", "seedGrow", "seedBloom", "seedSpread"]) {
  assert(result.signals.some((signal) => hasTag(signal, tag)), `Mock battle never emitted ${tag}`);
}
assert(result.signals.some((signal) => signal.kind === "heal" && signal.tags?.includes("verdantCircle")), "Friendly seed never produced real healing");
assert(result.signals.some((signal) => signal.kind === "damage" && signal.tags?.includes("verdantCircle")), "Enemy seed never produced real damage");
assert(result.signals.some((signal) => signal.kind === "damage" && signal.skillName === "繁生之环·花潮"), "Six-piece bloom never produced area damage");
assert(result.signals.some((signal) => signal.kind === "shield" && signal.skillName === "繁生之环·余蕴"), "Six-piece overflow healing never became a shield");
assert(result.signals.filter((signal) => hasTag(signal, "seedSpread")).every((signal) => signal.meta?.canSpread === false), "Propagated seeds can recursively spread");
assert(result.signals.filter((signal) => hasTag(signal, "seedSpread")).every((signal) => signal.meta?.growth === 2), "Propagated six-piece seeds do not start at two growth");

const counts = Object.fromEntries(["seedPlant", "seedGrow", "seedBloom", "seedSpread"].map((tag) => [tag, result.signals.filter((signal) => hasTag(signal, tag)).length]));
console.log(JSON.stringify({ ok: true, baseline: { duration: baseline.duration, enemiesAlive: baseline.metrics.rightAlive, damage: baseline.metrics.leftDamage, healing: baseline.metrics.leftHealing, adaptedWarlockDamage: baselineWarlockDamage, adaptedWarlockDps: Number(baselineWarlockDps.toFixed(2)) }, set: { duration: result.duration, enemiesAlive: result.metrics.rightAlive, damage: result.metrics.leftDamage, healing: result.metrics.leftHealing, adaptedWarlockDamage: setWarlockDamage, adaptedWarlockDps: Number(setWarlockDps.toFixed(2)) }, delta: { damage: Math.round(result.metrics.leftDamage - baseline.metrics.leftDamage), healing: Math.round(result.metrics.leftHealing - baseline.metrics.leftHealing), defeated: baseline.metrics.rightAlive - result.metrics.rightAlive, adaptedWarlockDpsMultiplier: Number((setWarlockDps / baselineWarlockDps).toFixed(2)) }, counts }, null, 2));
