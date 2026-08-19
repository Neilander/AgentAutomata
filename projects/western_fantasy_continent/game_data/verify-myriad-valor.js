"use strict";

const assert = require("node:assert/strict");
const SETS = require("./equipment-sets");
const BUILD = require("./build-layers");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

function roleSpec(role, overrides = {}) {
  return { role, ...SKILLS.roleKits[role].kit, ...overrides };
}

function equipped(role, pieces, overrides = {}) {
  return BUILD.applyBuildLayers(roleSpec(role, overrides), {
    equipmentItems: SETS.mockSetItems("myriadValor", pieces),
  });
}

const two = equipped("warrior", 2);
const three = equipped("warrior", 3);
const six = equipped("warrior", 6);
assert.equal(two.mechanicModifiers["set:myriadValor:foundation"], undefined, "2 pieces activated the 3-piece foundation");
assert.equal(two.maxHp, SKILLS.roleKits.warrior.hp, "2 pieces granted the 3-piece HP bonus");
assert.equal(three.maxHp, SKILLS.roleKits.warrior.hp + 60, "3-piece HP foundation did not enter build layers");
assert.equal(three.physicalPower, SKILLS.roleKits.warrior.power + 12, "3-piece attack foundation did not enter build layers");
assert.equal(three.mechanicModifiers["set:myriadValor:battleGrowth"], undefined, "3 pieces activated the 6-piece mechanic");
assert.equal(six.mechanicModifiers["set:myriadValor:battleGrowth"], 1, "6 pieces did not activate battle growth");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "myriad-direct", maxTime: 2 });
sim.units = [
  ...sim.makeTeam("left", [six]),
  ...sim.makeTeam("right", [
    roleSpec("knight", { name: "盾甲一", maxHp: 2000 }),
    roleSpec("knight", { name: "盾甲二", maxHp: 2000 }),
    roleSpec("knight", { name: "盾甲三", maxHp: 2000 }),
  ]),
];
const source = sim.units[0];
const enemies = sim.units.slice(1);
const powerBefore = sim.effectivePower(source, "physical");
sim.withAction(source, { tags: ["skill", "area"], skillName: "三目标横扫" }, () => {
  for (const enemy of enemies) sim.hit(source, enemy, 20, "physical", "三目标横扫");
});
assert.equal(source.myriadValorStacks, 3, "AoE did not count each actually hit enemy separately");
assert(sim.effectivePower(source, "physical") > powerBefore, "Battle-growth stacks did not raise later physical power");

const stacksBeforeRepeat = source.myriadValorStacks;
sim.withAction(source, { tags: ["skill", "multiHit"], skillName: "连斩" }, () => {
  sim.hit(source, enemies[0], 10, "physical", "连斩");
  sim.hit(source, enemies[0], 10, "physical", "连斩");
});
assert.equal(source.myriadValorStacks, stacksBeforeRepeat + 2, "Repeated real hits did not each grant growth");

enemies[1].shield = 9999;
const stacksBeforeShield = source.myriadValorStacks;
sim.withAction(source, { tags: ["skill", "attack"], skillName: "破盾试击" }, () => {
  sim.hit(source, enemies[1], 1, "physical", "破盾试击");
});
assert.equal(source.myriadValorStacks, stacksBeforeShield + 1, "A real hit absorbed by shield did not count as a hit");

const stacksBeforeSetDamage = source.myriadValorStacks;
sim.withAction(source, { tags: ["equipmentSet"], skillName: "套装附伤" }, () => {
  sim.takeDamage(source, enemies[2], 10, "physical", "套装附伤");
});
assert.equal(source.myriadValorStacks, stacksBeforeSetDamage, "Equipment-set damage recursively generated growth");

const resetSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "myriad-reset", maxTime: 2 });
resetSim.units = [...resetSim.makeTeam("left", [six]), ...resetSim.makeTeam("right", [roleSpec("knight")])];
assert.equal(resetSim.units[0].myriadValorStacks, 0, "Battle-only growth leaked into a new combat");

const baseline = COMBAT.simulateTeams(
  [roleSpec("warrior", { name: "无套前锋" })],
  [roleSpec("knight", { name: "厚甲靶一" }), roleSpec("knight", { name: "厚甲靶二" }), roleSpec("knight", { name: "厚甲靶三" })],
  { randomizeStats: false, seed: "myriad-integration", maxTime: 25 },
);
const setResult = COMBAT.simulateTeams(
  [equipped("warrior", 6, { name: "万夫前锋" })],
  [roleSpec("knight", { name: "厚甲靶一" }), roleSpec("knight", { name: "厚甲靶二" }), roleSpec("knight", { name: "厚甲靶三" })],
  { randomizeStats: false, seed: "myriad-integration", maxTime: 25 },
);
const growthSignals = setResult.signals.filter((signal) => signal.tags?.includes("battleGrowth"));
assert(growthSignals.length >= 3, "Full shared-combat run did not visibly exercise battle growth");
assert(setResult.metrics.leftDamage > baseline.metrics.leftDamage * 1.25, "The complete set did not create a meaningful damage direction");
assert(setResult.metrics.leftDamage >= baseline.metrics.leftDamage * 2.3 && setResult.metrics.leftDamage <= baseline.metrics.leftDamage * 2.7, "Myriad Valor missed its approximate 2.5x total-output target");
assert(!baseline.signals.some((signal) => signal.tags?.includes("myriadValor")), "Baseline activated the set without equipment");

console.log(JSON.stringify({
  ok: true,
  thresholds: { twoHp: two.maxHp, threeHp: three.maxHp, threePower: three.physicalPower, sixPieceActive: true },
  direct: { stacks: source.myriadValorStacks, powerBefore, powerAfter: Number(sim.effectivePower(source, "physical").toFixed(3)) },
  integration: {
    baselineDamage: baseline.metrics.leftDamage,
    setDamage: setResult.metrics.leftDamage,
    multiplier: Number((setResult.metrics.leftDamage / baseline.metrics.leftDamage).toFixed(2)),
    growthSignals: growthSignals.length,
  },
}, null, 2));
