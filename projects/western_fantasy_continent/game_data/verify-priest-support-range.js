"use strict";

const assert = require("node:assert/strict");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

function roleSpec(role, overrides = {}) {
  return { role, ...SKILLS.roleKits[role].kit, ...overrides };
}

assert.equal(SKILLS.roleKits.priest.supportRange, 42, "Priest support range is not the designed 42 units");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "priest-support-range", maxTime: 5 });
sim.units = sim.makeTeam("left", [
  roleSpec("priest", { name: "范围牧师", x: 10, y: 50 }),
  roleSpec("warrior", { name: "范围内伤员", x: 40, y: 50 }),
  roleSpec("mage", { name: "范围外核心", x: 80, y: 50, physicalPower: 200, magicPower: 200 }),
]);
const [priest, nearAlly, farAlly] = sim.units;
assert.equal(priest.supportRange, 42, "Priest support range did not reach combat runtime");

nearAlly.hp = nearAlly.maxHp * 0.5;
farAlly.hp = farAlly.maxHp * 0.1;
const nearHpBefore = nearAlly.hp;
const farHpBefore = farAlly.hp;
sim.skills.heal.cast({ unit: priest, target: null, visual: false });
assert(nearAlly.hp > nearHpBefore, "Single-target heal did not select the wounded ally inside support range");
assert.equal(farAlly.hp, farHpBefore, "Single-target heal reached the lower-health ally outside support range");

nearAlly.hp = nearAlly.maxHp * 0.5;
farAlly.hp = farAlly.maxHp * 0.5;
const sanctuaryNearBefore = nearAlly.hp;
const sanctuaryFarBefore = farAlly.hp;
sim.skills.sanctuary.cast({ unit: priest, target: null, visual: false });
assert(nearAlly.hp > sanctuaryNearBefore && nearAlly.shield > 0, "Sanctuary did not heal and shield an ally inside support range");
assert.equal(farAlly.hp, sanctuaryFarBefore, "Sanctuary healed an ally outside support range");
assert.equal(farAlly.shield, 0, "Sanctuary shielded an ally outside support range");

nearAlly.shield = 0;
farAlly.shield = 0;
sim.skills.crownBloodCharm.cast({ unit: priest, target: null, visual: false });
assert(nearAlly.shield > 0, "Carry-target support did not fall back to the strongest ally inside range");
assert.equal(farAlly.shield, 0, "Carry-target support reached the strongest ally outside range");

console.log(JSON.stringify({
  status: "PASS",
  supportRange: priest.supportRange,
  checks: ["lowest-health heal", "area heal and shield", "carry-target shield"],
}, null, 2));
