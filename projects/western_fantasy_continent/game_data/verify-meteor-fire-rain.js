"use strict";

const assert = require("node:assert/strict");
const SETS = require("./equipment-sets");
const BUILD = require("./build-layers");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

function roleSpec(role, overrides = {}) {
  return { role, ...SKILLS.roleKits[role].kit, ...overrides };
}

function equipped(pieces, overrides = {}) {
  return BUILD.applyBuildLayers(roleSpec("mage", overrides), {
    equipmentItems: SETS.mockSetItems("meteorFireRain", pieces),
  });
}

const two = equipped(2);
const three = equipped(3);
const six = equipped(6);
assert.equal(two.magicPower, SKILLS.roleKits.mage.power, "2 pieces granted the magic foundation");
assert.equal(three.magicPower, SKILLS.roleKits.mage.power + 15, "3-piece magic-power foundation did not enter build layers");
assert.equal(three.mechanicModifiers["set:meteorFireRain:skyfall"], undefined, "3 pieces activated the 6-piece mechanic");
assert.equal(six.mechanicModifiers["set:meteorFireRain:skyfall"], 1, "6 pieces did not activate skyfall");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "meteor-direct", maxTime: 5 });
sim.units = [
  ...sim.makeTeam("left", [six]),
  ...sim.makeTeam("right", [
    roleSpec("knight", { name: "火雨靶一", maxHp: 10000, x: 66, y: 40 }),
    roleSpec("knight", { name: "火雨靶二", maxHp: 10000, x: 70, y: 50 }),
    roleSpec("knight", { name: "火雨靶三", maxHp: 10000, x: 66, y: 60 }),
  ]),
];
const source = sim.units[0];
const targets = sim.units.slice(1);
sim.withAction(source, { tags: ["skill", "fire", "area"], skillName: "二十段火焰测试" }, () => {
  for (let index = 0; index < 19; index += 1) sim.takeDamage(source, targets[index % targets.length], 1, "fire", "火焰测试");
});
assert.equal(sim.pendingSetEffects.length, 0, "Meteor rain triggered before twenty effective fire-damage instances");
sim.withAction(source, { tags: ["dot", "damage", "burn"], skillName: "燃烧" }, () => {
  sim.takeDamage(source, targets[0], 1, "burn", "燃烧");
});
assert.equal(sim.pendingSetEffects.length, 7, "The twentieth fire/burn instance did not schedule exactly seven strikes");
const warnings = sim.signalBus.signals.filter((signal) => signal.tags?.includes("meteorWarning"));
assert.equal(warnings.length, 7, "Seven visible fixed warning positions were not emitted");
assert(warnings.every((signal) => signal.meta.delay >= 0.5 && signal.meta.delay <= 1.5), "A meteor delay escaped the 0.5-1.5 second window");
const scheduledPositions = warnings.map((signal) => JSON.stringify(signal.meta.position));

targets.forEach((target) => { target.x = 8; target.y = 14; });
sim.time = Math.max(...sim.pendingSetEffects.map((effect) => effect.dueAt)) + 0.01;
sim.tickScheduledSetEffects();
const impacts = sim.signalBus.signals.filter((signal) => signal.tags?.includes("meteorImpact"));
assert.equal(impacts.length, 7, "Not all scheduled meteors resolved");
assert.deepEqual(impacts.map((signal) => JSON.stringify(signal.meta.position)).sort(), scheduledPositions.sort(), "Meteor positions tracked moved targets instead of remaining fixed");
assert.equal(source.meteorFireHits, 0, "Meteor rain damage recursively rebuilt its own counter");

const directSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "meteor-impact", maxTime: 5 });
directSim.units = [
  ...directSim.makeTeam("left", [six]),
  ...directSim.makeTeam("right", [
    roleSpec("knight", { name: "密集靶一", maxHp: 10000, x: 70, y: 48 }),
    roleSpec("knight", { name: "密集靶二", maxHp: 10000, x: 71, y: 51 }),
  ]),
];
const directSource = directSim.units[0];
for (let index = 0; index < 20; index += 1) directSim.withAction(directSource, { tags: ["skill", "fire"], skillName: "触发火焰" }, () => directSim.takeDamage(directSource, directSim.units[1], 1, "fire", "触发火焰"));
directSim.time = 2;
directSim.tickScheduledSetEffects();
assert(directSim.signalBus.signals.some((signal) => signal.kind === "damage" && signal.tags?.includes("meteorRain")), "Resolved meteor positions never caused real shared-combat damage");
assert.equal(directSource.meteorFireHits, 0, "Meteor impacts recursively counted as new fire instances");

const enemyTeam = Array.from({ length: 5 }, (_, index) => roleSpec("knight", { name: `火雨整场靶${index + 1}`, maxHp: 1200 }));
const baseline = COMBAT.simulateTeams([roleSpec("mage", { name: "无套火法" }), roleSpec("knight"), roleSpec("priest")], enemyTeam, { randomizeStats: false, seed: "meteor-supported", maxTime: 70 });
const setResult = COMBAT.simulateTeams([equipped(6, { name: "火雨法师" }), roleSpec("knight"), roleSpec("priest")], enemyTeam, { randomizeStats: false, seed: "meteor-supported", maxTime: 70 });
const integrationWarnings = setResult.signals.filter((signal) => signal.tags?.includes("meteorWarning"));
const integrationImpacts = setResult.signals.filter((signal) => signal.tags?.includes("meteorImpact"));
assert(integrationWarnings.length >= 7, "Full shared-combat run never triggered meteor rain");
assert(integrationImpacts.length >= 7, "Full shared-combat run never resolved meteor rain");
assert(setResult.metrics.leftDamage > baseline.metrics.leftDamage * 1.2, "The complete set did not create a meaningful damage direction");
assert(!baseline.signals.some((signal) => signal.tags?.includes("meteorFireRain")), "Baseline activated meteor rain without equipment");
const unitDamage = (combatResult, name) => combatResult.units.find((unit) => unit.name === name)?.damageDone || 0;
const baselineMageDamage = unitDamage(baseline, "无套火法");
const setMageDamage = unitDamage(setResult, "火雨法师");
assert(setMageDamage >= baselineMageDamage * 3.2, "Meteor Fire Rain missed its minimum 3.2x supported-fight output target");

console.log(JSON.stringify({
  ok: true,
  thresholds: { twoMagic: two.magicPower, threeMagic: three.magicPower, sixPieceActive: true },
  direct: { warnings: warnings.length, impacts: impacts.length, fixedPositions: true, recursiveCount: source.meteorFireHits },
  integration: {
    baselineDamage: baselineMageDamage,
    setDamage: setMageDamage,
    multiplier: Number((setMageDamage / baselineMageDamage).toFixed(2)),
    warnings: integrationWarnings.length,
    impacts: integrationImpacts.length,
  },
}, null, 2));
