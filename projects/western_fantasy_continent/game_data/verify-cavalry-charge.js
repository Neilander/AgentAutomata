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
  direct: { stationaryLoss, movingLoss, multiTargetPath: true, outsidePathSafe: true, obstacleBlocked: true },
  integration: {
    baselineDamage: baseline.metrics.leftDamage,
    setDamage: setResult.metrics.leftDamage,
    multiplier: Number((setResult.metrics.leftDamage / baseline.metrics.leftDamage).toFixed(2)),
    readySignals: readySignals.length,
    breakthroughs: breakthroughSignals.length,
  },
}, null, 2));
