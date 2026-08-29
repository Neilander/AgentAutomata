"use strict";

const assert = require("node:assert/strict");
const COMBAT = require("./combat-sim");
const SKILLS = require("./skill-data");

const role = SKILLS.roleKits.cavalry;
assert(role, "cavalry role is missing");
assert.equal(role.hp, 320);
assert.equal(role.physicalPower, 50);
assert.equal(role.magicPower, 0);
assert.equal(role.armor, 9);
assert.equal(role.magicResist, 9);
assert.equal(role.moveSpeed, 12);
assert.equal(role.range, SKILLS.roleKits.warrior.range, "cavalry attack range must match warrior");
assert.equal(role.range, 13);
assert.equal(role.attackSpeedMult, 0.8);
assert.equal(role.skillHasteMult, 0.85);

assert.equal(SKILLS.skills.cavalryDoubleLeap.cooldown, 18);
assert.equal(SKILLS.skills.cavalryRun.cooldown, 10);
assert.equal(SKILLS.skills.cavalryWhirlwind.cooldown, 35);

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "verify-cavalry-role", maxTime: 10 });
const cavalry = sim.makeTeam("left", [{ role: "cavalry", ...role.kit, x: 20, y: 50 }])[0];
const enemy = sim.makeTeam("right", [{ role: "warrior", hp: 2000, x: 40, y: 50 }])[0];
sim.units = [cavalry, enemy];

assert.equal(cavalry.magicPower, 0, "cavalry inherited physical power as magic power");
assert.equal(cavalry.attackSpeedMult, 0.8, "cavalry low attack speed did not enter combat");
assert.equal(cavalry.skillHasteMult, 0.85, "cavalry low skill haste did not enter combat");

const leap = SKILLS.skills.cavalryDoubleLeap.effects[0];
assert.equal(leap.triggerRange, leap.distance * 2 + leap.radius, "double leap trigger range must match its two jumps plus landing radius");
enemy.x = cavalry.x + leap.triggerRange + 1;
assert(!sim.canCastSlot(cavalry, "small1", enemy), "double leap could cast before the enemy entered sight range");
enemy.x = cavalry.x + leap.triggerRange;
assert(sim.canCastSlot(cavalry, "small1", enemy), "double leap did not cast when the enemy entered sight range");
enemy.x = 40;

const gateSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "verify-double-leap-sight", maxTime: 5 });
const gateCavalry = gateSim.makeTeam("left", [{ role: "cavalry", ...role.kit }])[0];
const gateEnemy = gateSim.makeTeam("right", [{ role: "warrior", ...SKILLS.roleKits.warrior.kit }])[0];
gateSim.units = [gateCavalry, gateEnemy];
gateCavalry.x = 10;
gateCavalry.y = 50;
gateEnemy.x = 90;
gateEnemy.y = 50;
gateEnemy.stunTimer = 999;
gateCavalry.skillCd.small1 = 0;
gateCavalry.skillCd.small2 = 999;
gateCavalry.skillCd.ultimate = 999;
gateSim.update(0.1);
assert(!gateCavalry.cavalryLeapState, "double leap started while the enemy was outside sight range");
assert.equal(gateCavalry.skillCd.small1, 0, "waiting for sight incorrectly consumed double leap cooldown");
gateEnemy.x = gateCavalry.x + leap.triggerRange - 0.1;
gateSim.update(0.1);
assert(gateCavalry.cavalryLeapState, "double leap did not start after the enemy entered sight range");
assert.equal(gateCavalry.skillCd.small1, 18, "visible-target double leap did not enter cooldown");

const targetSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "verify-cavalry-nearest-target", maxTime: 5 });
const targetCavalry = targetSim.makeTeam("left", [{ role: "cavalry", ...role.kit, x: 20, y: 50 }])[0];
const [fartherFront, nearerBack] = targetSim.makeTeam("right", [
  { role: "warrior", ...SKILLS.roleKits.warrior.kit, x: 50, y: 75, line: "前排" },
  { role: "mage", ...SKILLS.roleKits.mage.kit, x: 32, y: 50, line: "后排" },
]);
targetSim.units = [targetCavalry, fartherFront, nearerBack];
assert.equal(targetSim.chooseTarget(targetCavalry).id, nearerBack.id, "cavalry did not choose the globally preferred nearest visible enemy");
const run = SKILLS.skills.cavalryRun.effects[0];
assert.equal(run.duration, 1.2, "cavalry run duration does not match the tuned sustained charge");
assert.equal(run.pulseDistance, 3, "cavalry run pulse distance is not data-driven");
targetSim.startCavalryRun(targetCavalry, fartherFront, run);
assert.equal(targetCavalry.cavalryRunState.targetId, nearerBack.id, "cavalry run did not lock the nearest visible enemy");
assert(Math.abs(targetCavalry.cavalryRunState.direction.y) < 1e-9, "cavalry run aimed toward the farther front-line enemy");
targetCavalry.cavalryRunState = null;
targetCavalry.forcedTargetId = fartherFront.id;
targetCavalry.forcedTargetTimer = 2;
targetSim.startCavalryRun(targetCavalry, fartherFront, run);
assert.equal(targetCavalry.cavalryRunState.targetId, fartherFront.id, "cavalry run ignored a forced target");

const pulseSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "verify-cavalry-run-pulse", maxTime: 5 });
const [pulseRider] = pulseSim.makeTeam("left", [{ role: "cavalry", ...role.kit, x: 20, y: 50 }]);
const [farRunTarget, pulseVictim] = pulseSim.makeTeam("right", [
  { role: "warrior", ...SKILLS.roleKits.warrior.kit, hp: 2000, x: 80, y: 50 },
  { role: "warrior", ...SKILLS.roleKits.warrior.kit, hp: 2000, x: 26, y: 50 },
]);
pulseSim.units = [pulseRider, farRunTarget];
pulseSim.startCavalryRun(pulseRider, farRunTarget, run);
pulseSim.units.push(pulseVictim);
pulseSim.rng = () => 0;
const pulseVictimHp = pulseVictim.hp;
pulseSim.tickCavalryRun(pulseRider, 0.1);
assert.equal(pulseVictim.hp, pulseVictimHp, "cavalry run pulse triggered before three distance");
pulseSim.tickCavalryRun(pulseRider, 0.1);
assert(pulseVictim.hp < pulseVictimHp, "cavalry run pulse did not deal nearby area damage at three distance");
assert.equal(pulseVictim.stunTimer, run.stunDuration, "cavalry run pulse did not apply its configured stun");
assert(pulseSim.signalBus.signals.some((signal) => signal.tags?.includes("runPulse") && signal.tags?.includes("area") && signal.target?.id === pulseRider.id), "cavalry run pulse did not emit its visible area signal");
assert(pulseSim.signalBus.signals.some((signal) => signal.tags?.includes("runPulse") && signal.tags?.includes("stun")), "cavalry run stun did not emit a combat signal");

sim.startCavalryDoubleLeap(cavalry, enemy, leap);
const hpBeforeLeap = enemy.hp;
sim.tickCavalryDoubleLeap(cavalry, 0.24);
assert.equal(cavalry.x, 30, "first leap did not move the configured distance");
assert(enemy.hp < hpBeforeLeap, "first leap did not deal landing damage");

const cavalryHpBefore = cavalry.hp;
sim.takeDamage(enemy, cavalry, 100, "physical", "leap reduction test");
assert.equal(cavalryHpBefore - cavalry.hp, 20, "double leap did not reduce incoming damage by 80%");

cavalry.cavalryLeapState = null;
enemy.hp = 1;
sim.hit(cavalry, enemy, 100, "physical", "kill trigger", false, "physical");
assert.equal(cavalry.kills, 1, "cavalry kill was not counted");
assert.equal(cavalry.cavalryKillChargeTimer, 6, "kill did not arm charge state");

const nextEnemy = sim.makeTeam("right", [{ role: "warrior", hp: 2000, x: 70, y: 50 }])[0];
sim.units.push(nextEnemy);
assert(sim.tryCavalryKillChargeDash(cavalry, nextEnemy), "kill charge did not dash toward the next enemy");
const preChargeHp = nextEnemy.hp;
cavalry.attackCd = 0;
sim.basicAttack(cavalry, nextEnemy);
assert(nextEnemy.hp < preChargeHp, "charged basic attack did not deal damage");
assert.equal(cavalry.cavalryKillChargeTimer, 0, "charged basic attack did not consume charge state");

const whirlwind = SKILLS.skills.cavalryWhirlwind.effects[0];
nextEnemy.x = cavalry.x + whirlwind.radius - 1;
assert(sim.canCastSlot(cavalry, "ultimate"), "ultimate was blocked despite a nearby enemy");
nextEnemy.x = cavalry.x + whirlwind.radius + 5;
assert(!sim.canCastSlot(cavalry, "ultimate"), "ultimate could cast without an enemy in range");

console.log(JSON.stringify({
  status: "ok",
  role: { hp: role.hp, physicalPower: role.physicalPower, magicPower: role.magicPower, armor: role.armor, magicResist: role.magicResist, moveSpeed: role.moveSpeed, range: role.range, attackSpeedMult: role.attackSpeedMult, skillHasteMult: role.skillHasteMult },
  cooldowns: { small1: 18, small2: 10, ultimate: 35 },
  leap: { distance: leap.distance, triggerRange: leap.triggerRange, damageReduction: leap.damageReduction },
  run: { duration: run.duration, pulseDistance: run.pulseDistance, radius: run.radius, stunChance: run.stunChance, stunDuration: run.stunDuration, nearestVisibleTarget: true, fullSetChargeCompatible: true },
  passiveCharge: { duration: SKILLS.skills.cavalryKillCharge.effects[0].duration, triggered: true },
  ultimateNearbyGate: true,
}, null, 2));
