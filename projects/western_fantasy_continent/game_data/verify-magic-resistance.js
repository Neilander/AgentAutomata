"use strict";

const assert = require("node:assert/strict");
const BUILD = require("./build-layers");
const COMBAT = require("./combat-sim");
const SKILLS = require("./skill-data");

const EXPECTED_ROLE_MAGIC_RESIST = {
  warrior: 6,
  knight: 3,
  berserker: 9,
  ranger: 0,
  assassin: 0,
  warlock: 6,
  alchemist: 9,
  priest: 6,
  bard: 3,
  mage: 6,
};
for (const [role, expected] of Object.entries(EXPECTED_ROLE_MAGIC_RESIST)) {
  assert.equal(SKILLS.roleKits[role].magicResist, expected, `${role} base magic resistance tier is incorrect`);
}

const baseKnight = BUILD.applyBuildLayers({ role: "knight", ...SKILLS.roleKits.knight.kit });
const wardedKnight = BUILD.applyBuildLayers(
  { role: "knight", ...SKILLS.roleKits.knight.kit },
  { attributePoints: { warding: 10 } },
);
assert.equal(baseKnight.magicResist, SKILLS.roleKits.knight.magicResist, "base role magic resistance was not carried into build layers");
assert(wardedKnight.magicResist > baseKnight.magicResist, "灵御 did not increase magic resistance");
assert(wardedKnight.maxHp > baseKnight.maxHp, "灵御 did not grant its minor HP yield");
assert.equal(wardedKnight.armor, baseKnight.armor, "灵御 incorrectly increased armor");
assert.equal(wardedKnight.effectResistPct, baseKnight.effectResistPct, "灵御 incorrectly increased effect resistance");

const equippedKnight = BUILD.applyBuildLayers(
  { role: "knight", ...SKILLS.roleKits.knight.kit },
  { equipmentItems: [{ baseStats: { magicResist: 10 }, affixes: [{ stat: "warding", value: 4 }] }] },
);
assert(equippedKnight.magicResist > baseKnight.magicResist + 8, "equipment magic resistance or 灵御 affix did not enter build layers");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "magic-resistance", maxTime: 1 });
sim.units = [
  ...sim.makeTeam("left", [{ role: "mage", name: "法术测试源", power: 0, physicalPower: 0, magicPower: 0 }]),
  ...sim.makeTeam("right", [
    { role: "warrior", name: "高甲无魔抗", hp: 1000, armor: 100, magicResist: 0 },
    { role: "warrior", name: "无甲高魔抗", hp: 1000, armor: 0, magicResist: 100 },
  ]),
];
const [source, armored, warded] = sim.units;
sim.hit(source, armored, 100, "fire", "法术测试", false, "magic");
sim.hit(source, warded, 100, "fire", "法术测试", false, "magic");
assert.equal(armored.hp, 900, "armor still reduced direct magic damage");
assert.equal(warded.hp, 972, "magic resistance did not reduce direct magic damage with the standard coefficient");

sim.hit(source, armored, 100, "physical", "物理测试", false, "physical");
sim.hit(source, warded, 100, "physical", "物理测试", false, "physical");
assert.equal(armored.hp, 872, "armor did not reduce direct physical damage");
assert.equal(warded.hp, 872, "magic resistance incorrectly reduced direct physical damage");
sim.takeDamage(source, warded, 100, "poison", "DOT测试");
assert.equal(warded.hp, 772, "magic resistance incorrectly reduced DOT damage");

console.log(JSON.stringify({
  status: "ok",
  attribute: { id: "warding", label: "灵御", magicResist: wardedKnight.magicResist, maxHp: wardedKnight.maxHp, effectResistPct: wardedKnight.effectResistPct },
  equipmentMagicResist: equippedKnight.magicResist,
  damage: { armoredMagicTaken: 100, wardedMagicTaken: 28, armoredPhysicalTaken: 28, wardedPhysicalTaken: 100, wardedDotTaken: 100 },
}, null, 2));
