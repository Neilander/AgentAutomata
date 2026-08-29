"use strict";

const assert = require("node:assert/strict");
const COMBAT = require("./combat-sim");
const SKILLS = require("./skill-data");

for (const roleKey of Object.keys(SKILLS.roleKits)) {
  const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: `nearest-target-${roleKey}`, maxTime: 5 });
  const attacker = sim.makeTeam("left", [{ role: roleKey, ...SKILLS.roleKits[roleKey].kit, x: 20, y: 50 }])[0];
  const [fartherFront, nearerBack] = sim.makeTeam("right", [
    { role: "warrior", ...SKILLS.roleKits.warrior.kit, x: 50, y: 75, line: "前排" },
    { role: "mage", ...SKILLS.roleKits.mage.kit, x: 32, y: 50, line: "后排" },
  ]);
  sim.units = [attacker, fartherFront, nearerBack];
  fartherFront.hp = 1;
  assert.equal(sim.chooseTarget(attacker).id, nearerBack.id, `${roleKey} did not choose the nearest visible enemy`);
}

const prioritySim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "nearest-target-priorities", maxTime: 5 });
const warrior = prioritySim.makeTeam("left", [{ role: "warrior", ...SKILLS.roleKits.warrior.kit, x: 20, y: 50 }])[0];
const [farEnemy, nearEnemy] = prioritySim.makeTeam("right", [
  { role: "warrior", ...SKILLS.roleKits.warrior.kit, x: 60, y: 50 },
  { role: "mage", ...SKILLS.roleKits.mage.kit, x: 32, y: 50 },
]);
prioritySim.units = [warrior, farEnemy, nearEnemy];

nearEnemy.hiddenTimer = 2;
assert.equal(prioritySim.chooseTarget(warrior).id, farEnemy.id, "hidden enemy was selected over a visible enemy");
nearEnemy.hiddenTimer = 0;

warrior.forcedTargetId = farEnemy.id;
warrior.forcedTargetTimer = 2;
assert.equal(prioritySim.chooseTarget(warrior).id, farEnemy.id, "forced target did not override nearest targeting");
warrior.forcedTargetId = null;
warrior.forcedTargetTimer = 0;

farEnemy.tauntTimer = 2;
assert.equal(prioritySim.chooseTarget(warrior).id, farEnemy.id, "taunt did not override nearest targeting");

console.log(JSON.stringify({
  status: "ok",
  defaultRule: "nearest visible enemy",
  rolesVerified: Object.keys(SKILLS.roleKits).length,
  overrides: ["forcedTarget", "taunt", "assassinFocus", "skill-specific targeting"],
}, null, 2));
