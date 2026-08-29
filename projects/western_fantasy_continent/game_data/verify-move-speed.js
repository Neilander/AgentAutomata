"use strict";

const assert = require("node:assert/strict");
const BUILD = require("./build-layers");
const COMBAT = require("./combat-sim");
const SKILLS = require("./skill-data");

for (const [role, profile] of Object.entries(SKILLS.roleKits)) {
  assert(Number.isFinite(profile.moveSpeed) && profile.moveSpeed > 0, `${role} is missing base move speed`);
}
assert.equal(SKILLS.roleKits.warrior.moveSpeed, 7, "warrior move speed changed from the former shared baseline");
assert.equal(SKILLS.roleKits.assassin.moveSpeed, 10, "assassin move speed changed from the former special baseline");

const builtWarrior = BUILD.applyBuildLayers({ role: "warrior", ...SKILLS.roleKits.warrior.kit });
assert.equal(builtWarrior.moveSpeed, 7, "build layers did not carry role move speed");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "move-speed", maxTime: 1 });
const normal = sim.makeTeam("left", [{ role: "warrior", name: "普通步速" }])[0];
const cavalry = sim.makeTeam("left", [{ role: "cavalry", name: "马骑兵" }])[0];
const target = sim.makeTeam("right", [{ role: "knight", name: "移动目标" }])[0];

for (const unit of [normal, cavalry]) {
  unit.x = 10;
  unit.y = 50;
}
target.x = 80;
target.y = 50;

sim.moveToward(normal, target, 1);
sim.moveToward(cavalry, target, 1);
assert.equal(normal.x, 17, "moveToward did not use the normal unit move-speed attribute");
assert.equal(cavalry.x, 22, "moveToward did not use the cavalry base move-speed attribute");
assert.equal(cavalry.range, SKILLS.roleKits.warrior.range, "cavalry range must match warrior");

cavalry.x = 10;
cavalry.slowTimer = 1;
sim.moveToward(cavalry, target, 1);
assert(Math.abs(cavalry.x - 17.2) < 1e-9, "slow did not scale the move-speed attribute");

console.log(JSON.stringify({
  status: "ok",
  preserved: { standard: normal.moveSpeed, assassin: SKILLS.roleKits.assassin.moveSpeed },
  cavalry: { moveSpeed: cavalry.moveSpeed, range: cavalry.range },
  slowMultiplier: 0.6,
}, null, 2));
