"use strict";

const assert = require("node:assert/strict");
const SETS = require("./equipment-sets");
const BUILD = require("./build-layers");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

function roleSpec(role, overrides = {}) {
  return { role, ...SKILLS.roleKits[role].kit, ...overrides };
}

function cavalrySpec(overrides = {}) {
  return roleSpec("knight", {
    roleName: "骑兵",
    small1: "lanceCharge",
    small2: "shieldBash",
    passive: "chargerMomentum",
    ultimate: "royalCavalryBreak",
    ...overrides,
  });
}

function equipped(pieces, overrides = {}) {
  return BUILD.applyBuildLayers(cavalrySpec(overrides), {
    equipmentItems: SETS.mockSetItems("cavalryCharge", pieces),
  });
}

const two = equipped(2);
const three = equipped(3);
const six = equipped(6);
assert.equal(two.mechanicModifiers.moveSpeed, undefined, "2 pieces granted the movement foundation");
assert.equal(three.mechanicModifiers.moveSpeed, 25, "3-piece movement speed did not enter build layers");
assert.equal(three.mechanicModifiers.moveSpeedAttackConversion, 80, "3-piece speed conversion did not enter build layers");
assert.equal(three.mechanicModifiers.movingDamageReduction, 30, "3-piece moving reduction did not enter build layers");
assert.equal(three.mechanicModifiers["set:cavalryCharge:breakthrough"], undefined, "3 pieces activated the 6-piece mechanic");
assert.equal(six.mechanicModifiers["set:cavalryCharge:breakthrough"], 1, "6 pieces did not activate breakthrough");

const foundationSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "cavalry-foundation", maxTime: 5 });
const [plainRuntime] = foundationSim.makeTeam("left", [two]);
const [foundationRuntime] = foundationSim.makeTeam("left", [three]);
assert(foundationRuntime.cavalryMoveSpeedMult > (plainRuntime.cavalryMoveSpeedMult || 1), "Movement foundation did not reach shared-combat runtime");
assert(foundationRuntime.attackSpeedMult > plainRuntime.attackSpeedMult, "Move-speed-to-attack-speed conversion did not reach runtime");

const runEffect = SKILLS.skills.cavalryRun.effects[0];
assert.equal(runEffect.duration, 1.2, "Cavalry run duration does not match the tuned sustained charge");
const runSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "cavalry-run-arms-charge", maxTime: 5 });
const runRiderSpec = BUILD.applyBuildLayers(roleSpec("cavalry", { name: "短冲骑兵" }), {
  equipmentItems: SETS.mockSetItems("cavalryCharge", 6),
});
runSim.units = [
  ...runSim.makeTeam("left", [runRiderSpec]),
  ...runSim.makeTeam("right", [roleSpec("warrior", { name: "冲刺目标", maxHp: 5000 })]),
];
const [runRider, runTarget] = runSim.units;
runRider.x = 20;
runRider.y = 50;
runTarget.x = 80;
runTarget.y = 50;
runSim.startCavalryRun(runRider, runTarget, runEffect);
assert.equal(runRider.cavalryChargeReady, false, "Casting cavalry run directly granted charge state without movement");
for (let tick = 0; tick < 30; tick += 1) runSim.tickCavalryRun(runRider, 0.04);
const runDistance = runRider.x - 20;
assert.equal(runRider.cavalryRunState, null, "Full-set cavalry run did not end after 1.2 seconds");
assert(Math.abs(runDistance - 22.5) < 1e-9, "Full-set cavalry run did not apply duration, skill speed, and set movement multipliers");
assert.equal(runRider.cavalryChargeReady, true, "A full 1.2-second set run did not naturally cross the 16-distance threshold");
assert(runSim.signalBus.signals.some((signal) => signal.tags?.includes("run") && signal.meta?.enteredChargeState && signal.meta?.pulses === 7), "Run did not report its natural charge entry and seven distance pulses");
assert(runSim.signalBus.signals.some((signal) => signal.tags?.includes("chargeReady") && signal.meta?.movementKind === "skillRun" && signal.meta?.threshold === 16), "Run movement did not naturally trigger charge-ready");
const readyMoveStart = runRider.x;
runSim.moveToward(runRider, runTarget, 0.4);
assert(Math.abs(runRider.x - readyMoveStart - 9) < 1e-9, "Charge-ready state did not multiply the current 15 move speed by 1.5");

const plainRunSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "plain-cavalry-short-run", maxTime: 5 });
plainRunSim.units = [
  ...plainRunSim.makeTeam("left", [roleSpec("cavalry", { name: "无套短冲骑兵" })]),
  ...plainRunSim.makeTeam("right", [roleSpec("warrior", { name: "无套冲刺目标", maxHp: 5000 })]),
];
const [plainRunRider, plainRunTarget] = plainRunSim.units;
plainRunRider.x = 20;
plainRunRider.y = 50;
plainRunTarget.x = 80;
plainRunTarget.y = 50;
plainRunSim.startCavalryRun(plainRunRider, plainRunTarget, runEffect);
assert.equal(plainRunRider.cavalryChargeReady, false, "No-set cavalry run cast entered equipment charge state");
for (let tick = 0; tick < 20; tick += 1) plainRunSim.tickCavalryRun(plainRunRider, 0.04);
assert(Math.abs(plainRunRider.x - 32) < 1e-9, "No-set cavalry short run did not move the intended 12 distance");
assert.equal(plainRunRider.cavalryChargeReady, false, "No-set cavalry entered equipment charge state");

const continuitySim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "cavalry-continuous-distance", maxTime: 5 });
continuitySim.units = [
  ...continuitySim.makeTeam("left", [{ ...six, name: "连续移动测试骑兵" }]),
  ...continuitySim.makeTeam("right", [roleSpec("warrior", { name: "连续移动测试目标", maxHp: 5000 })]),
];
const [continuityRider] = continuitySim.units;
continuityRider.x = 30;
continuityRider.y = 50;
continuitySim.recordCavalryMovement(continuityRider, { x: 20, y: 50 }, continuityRider, "testAdvance");
assert.equal(continuityRider.cavalryDistance, 10, "Initial continuous movement was not recorded");
continuitySim.tickTimers(continuityRider, 0.39);
assert.equal(continuityRider.cavalryDistance, 10, "Sub-0.4-second movement pause reset charge progress too early");
continuitySim.tickTimers(continuityRider, 0.02);
assert.equal(continuityRider.cavalryDistance, 0, "Stopping for 0.4 seconds did not reset incomplete charge progress");
continuityRider.x = 36;
continuitySim.recordCavalryMovement(continuityRider, { x: 30, y: 50 }, continuityRider, "testAdvance");
assert.equal(continuityRider.cavalryChargeReady, false, "Separated movement segments incorrectly combined into charge state");
assert.equal(continuityRider.cavalryDistance, 6, "Post-stop movement did not begin a fresh distance chain");
continuityRider.x = 46;
continuitySim.recordCavalryMovement(continuityRider, { x: 36, y: 50 }, continuityRider, "testAdvance");
assert.equal(continuityRider.cavalryChargeReady, true, "Fresh continuous movement chain did not enter charge state");
continuitySim.tickTimers(continuityRider, 0.5);
assert.equal(continuityRider.cavalryChargeReady, true, "Stopping incorrectly cancelled an already-ready charge state");
assert(continuitySim.signalBus.signals.some((signal) => signal.tags?.includes("chargeProgressReset") && signal.meta?.reason === "stopped" && signal.meta?.continuityGrace === 0.4), "Stopped movement reset was not signaled with the intended grace period");

const leapSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "cavalry-double-leap-continuity", maxTime: 5 });
const leapRiderSpec = BUILD.applyBuildLayers(roleSpec("cavalry", { name: "二连跃连续测试骑兵" }), {
  equipmentItems: SETS.mockSetItems("cavalryCharge", 6),
});
leapSim.units = [
  ...leapSim.makeTeam("left", [leapRiderSpec]),
  ...leapSim.makeTeam("right", [roleSpec("warrior", { name: "二连跃测试目标", maxHp: 5000 })]),
];
const [leapRider, leapTarget] = leapSim.units;
leapRider.x = 20;
leapRider.y = 50;
leapTarget.x = 80;
leapTarget.y = 50;
leapSim.startCavalryDoubleLeap(leapRider, leapTarget, SKILLS.skills.cavalryDoubleLeap.effects[0]);
for (let tick = 0; tick < 26; tick += 1) {
  leapSim.tickTimers(leapRider, 0.04);
  leapSim.tickCavalryDoubleLeap(leapRider, 0.04);
}
assert.equal(leapRider.cavalryChargeReady, true, "Two landings of double leap did not count as one continuous movement chain");
assert(leapSim.signalBus.signals.some((signal) => signal.tags?.includes("chargeReady") && signal.meta?.movementKind === "skillLeap"), "Double leap did not signal its continuous-movement charge state");

foundationSim.units = [foundationRuntime, ...foundationSim.makeTeam("right", [roleSpec("warrior", { name: "减伤攻击者", maxHp: 5000 })])];
const attacker = foundationSim.units[1];
foundationRuntime.hp = foundationRuntime.maxHp;
foundationRuntime.cavalryMovingTimer = 0;
foundationSim.takeDamage(attacker, foundationRuntime, 100, "physical", "静止受击");
const stationaryLoss = foundationRuntime.maxHp - foundationRuntime.hp;
foundationRuntime.hp = foundationRuntime.maxHp;
foundationRuntime.cavalryMovingTimer = 0.2;
foundationSim.takeDamage(attacker, foundationRuntime, 100, "physical", "移动受击");
const movingLoss = foundationRuntime.maxHp - foundationRuntime.hp;
assert(movingLoss < stationaryLoss * 0.75, "Moving damage reduction did not materially reduce incoming damage");
assert(foundationSim.signalBus.signals.some((signal) => signal.tags?.includes("movingDamageReduction")), "Moving reduction was not signaled");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "cavalry-direct", maxTime: 5 });
sim.units = [
  ...sim.makeTeam("left", [{ ...six, name: "奔袭骑兵", x: 20, y: 50 }]),
  ...sim.makeTeam("right", [
    roleSpec("warrior", { name: "路径敌人一", maxHp: 5000, x: 38, y: 50 }),
    roleSpec("warrior", { name: "路径敌人二", maxHp: 5000, x: 44, y: 52 }),
    roleSpec("warrior", { name: "路径外敌人", maxHp: 5000, x: 44, y: 70 }),
  ]),
];
const [source, pathOne, pathTwo, outside] = sim.units;
source.x = 35.9;
sim.recordCavalryMovement(source, { x: 20, y: 50 }, source, "testAdvance");
assert.equal(source.cavalryChargeReady, false, "Charge became ready before the distance threshold");
source.x = 36.2;
sim.recordCavalryMovement(source, { x: 35.9, y: 50 }, source, "testAdvance");
assert.equal(source.cavalryChargeReady, true, "Continuous real movement did not enter charge state");
const hpBefore = [pathOne, pathTwo, outside].map((unit) => unit.hp);
assert.equal(sim.tryCavalryBreakthrough(source, pathOne), true, "Ready cavalry did not execute breakthrough on contact");
assert(pathOne.hp < hpBefore[0] && pathTwo.hp < hpBefore[1], "Breakthrough did not damage multiple enemies on its path");
assert.equal(outside.hp, hpBefore[2], "Breakthrough damaged an enemy outside the path");
const breakthrough = sim.signalBus.signals.find((signal) => signal.tags?.includes("breakthrough") && signal.kind === "movement");
assert(breakthrough?.meta?.ignoresUnitCollision, "Breakthrough did not declare unit-collision bypass");
assert.equal(source.cavalryChargeReady, false, "Breakthrough did not consume charge state");

const blockedSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "cavalry-obstacle", obstacles: [{ id: "stone", x: 38, y: 50, radius: 3 }] });
blockedSim.units = [
  ...blockedSim.makeTeam("left", [{ ...six, name: "受阻骑兵", x: 32, y: 50 }]),
  ...blockedSim.makeTeam("right", [roleSpec("warrior", { name: "障碍后敌人", maxHp: 5000, x: 40, y: 50 })]),
];
const [blockedRider, blockedTarget] = blockedSim.units;
blockedRider.cavalryChargeReady = true;
const blockedHp = blockedTarget.hp;
assert.equal(blockedSim.tryCavalryBreakthrough(blockedRider, blockedTarget), false, "Obstacle failed to block breakthrough");
assert.equal(blockedTarget.hp, blockedHp, "Blocked breakthrough still dealt path damage");
assert(blockedSim.signalBus.signals.some((signal) => signal.tags?.includes("chargeBlocked") && signal.meta?.reason === "obstacle"), "Obstacle block was not signaled");

const enemyTeam = Array.from({ length: 4 }, (_, index) => roleSpec("warrior", { name: `骑兵整场敌人${index + 1}`, maxHp: 700 }));
const baseline = COMBAT.simulateTeams([cavalrySpec({ name: "无套骑兵" })], enemyTeam, { randomizeStats: false, seed: "cavalry-integration", maxTime: 40 });
const setResult = COMBAT.simulateTeams([equipped(6, { name: "奔袭骑兵" })], enemyTeam, { randomizeStats: false, seed: "cavalry-integration", maxTime: 40 });
const readySignals = setResult.signals.filter((signal) => signal.tags?.includes("chargeReady"));
const breakthroughSignals = setResult.signals.filter((signal) => signal.tags?.includes("breakthrough") && signal.kind === "movement");
assert(readySignals.length > 0 && breakthroughSignals.length > 0, "Full shared-combat run never completed movement-to-breakthrough");
assert(setResult.metrics.leftDamage > baseline.metrics.leftDamage * 1.2, "The complete set did not create a meaningful cavalry damage direction");
assert(setResult.metrics.leftDamage >= baseline.metrics.leftDamage * 2.6 && setResult.metrics.leftDamage <= baseline.metrics.leftDamage * 3, "Cavalry set missed its approximate 2.8x total-output target");
assert(!baseline.signals.some((signal) => signal.tags?.includes("cavalryCharge") && signal.tags?.includes("equipmentSet")), "Baseline activated cavalry set without equipment");

console.log(JSON.stringify({
  ok: true,
  thresholds: { moveSpeed: three.mechanicModifiers.moveSpeed, attackSpeedRuntime: foundationRuntime.attackSpeedMult, sixPieceActive: true },
  direct: { stationaryLoss, movingLoss, continuousReset: true, doubleLeapContinuous: true, multiTargetPath: true, outsidePathSafe: true, obstacleBlocked: true },
  integration: {
    baselineDamage: baseline.metrics.leftDamage,
    setDamage: setResult.metrics.leftDamage,
    multiplier: Number((setResult.metrics.leftDamage / baseline.metrics.leftDamage).toFixed(2)),
    readySignals: readySignals.length,
    breakthroughs: breakthroughSignals.length,
  },
}, null, 2));
