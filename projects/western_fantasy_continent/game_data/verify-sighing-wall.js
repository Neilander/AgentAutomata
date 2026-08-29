"use strict";

const assert = require("node:assert/strict");
const SETS = require("./equipment-sets");
const BUILD = require("./build-layers");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

function roleSpec(role, overrides = {}) {
  return { role, ...SKILLS.roleKits[role].kit, ...overrides };
}

function shieldBearer(overrides = {}) {
  return roleSpec("knight", { roleName: "盾兵", ...overrides });
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

function equippedWall(pieces, overrides = {}) {
  return BUILD.applyBuildLayers(shieldBearer(overrides), { equipmentItems: SETS.mockSetItems("sighingWall", pieces) });
}

function equippedCavalry(pieces, overrides = {}) {
  return BUILD.applyBuildLayers(cavalrySpec(overrides), { equipmentItems: SETS.mockSetItems("cavalryCharge", pieces) });
}

const two = equippedWall(2);
const three = equippedWall(3);
const six = equippedWall(6);
assert.equal(two.maxHp, SKILLS.roleKits.knight.hp, "2 pieces granted the HP foundation");
assert.equal(three.maxHp, SKILLS.roleKits.knight.hp + 80, "3-piece HP foundation did not enter build layers");
assert.equal(three.mechanicModifiers.shieldPower, 20, "3-piece shield power did not enter build layers");
assert.equal(three.mechanicModifiers["set:sighingWall:unyieldingBoundary"], undefined, "3 pieces activated the 6-piece boundary");
assert.equal(six.mechanicModifiers["set:sighingWall:unyieldingBoundary"], 1, "6 pieces did not activate the boundary");

const pulseSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "wall-pulse", maxTime: 5 });
pulseSim.units = [
  ...pulseSim.makeTeam("left", [
    { ...six, name: "叹息盾兵", x: 35, y: 50 },
    roleSpec("warrior", { name: "圈内友军", x: 44, y: 50 }),
    roleSpec("warrior", { name: "圈外友军", x: 10, y: 80 }),
  ]),
  ...pulseSim.makeTeam("right", [roleSpec("warrior", { name: "占位敌人", x: 80, y: 50 })]),
];
const [wall, nearAlly, farAlly] = pulseSim.units;
pulseSim.tickEquipmentSetAuras(wall);
assert(wall.shield > 0 && nearAlly.shield > 0, "Opening wall pulse did not shield self and nearby ally");
assert.equal(farAlly.shield, 0, "Wall pulse escaped its aura radius");
const firstNearShield = nearAlly.shield;
pulseSim.tickEquipmentSetAuras(wall);
assert.equal(nearAlly.shield, firstNearShield, "Wall pulsed again before the 20-second interval");
wall.sighingWallCooldown = 0;
pulseSim.tickEquipmentSetAuras(wall);
assert(nearAlly.shield > firstNearShield, "Wall did not pulse again after its interval became ready");
assert.equal(pulseSim.signalBus.signals.filter((signal) => signal.tags?.includes("wallPulse") && signal.kind === "status").length, 2, "Wall pulse timing was not signaled correctly");

const walkSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "wall-walk", maxTime: 5 });
walkSim.units = [
  ...walkSim.makeTeam("left", [roleSpec("warrior", { name: "普通步行者", x: 20, y: 50 })]),
  ...walkSim.makeTeam("right", [{ ...six, name: "边界盾兵", x: 42, y: 50 }]),
];
const [walker, walkingTarget] = walkSim.units;
const walkX = walker.x;
walkSim.moveToward(walker, { ...walkingTarget, x: 70, y: 50 }, 1);
assert(walker.x > walkX, "Normal walking was blocked by the wall boundary");
assert.equal(walker.stunTimer, 0, "Normal walking incorrectly triggered charge interception");

const skillChargeSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "wall-skill-charge", maxTime: 5 });
skillChargeSim.units = [
  ...skillChargeSim.makeTeam("left", [cavalrySpec({ name: "技能冲锋骑兵", x: 20, y: 50 })]),
  ...skillChargeSim.makeTeam("right", [{ ...six, name: "截断盾兵", x: 35, y: 50 }]),
];
const [skillRider, skillWall] = skillChargeSim.units;
const skillStart = { x: skillRider.x, y: skillRider.y };
skillChargeSim.chargeToTarget(skillRider, skillWall, { distance: 18, stopRange: 5, label: "长枪冲锋" });
assert.deepEqual({ x: skillRider.x, y: skillRider.y }, skillStart, "Existing charge skill crossed the wall boundary");
assert(skillRider.stunTimer > 0, "Intercepted existing charge was not stunned");
assert(skillChargeSim.signalBus.signals.some((signal) => signal.tags?.includes("chargeIntercept") && signal.meta?.chargeKind === "skillCharge"), "Existing charge interception was not signaled");

const runSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "wall-cavalry-run", maxTime: 5 });
runSim.units = [
  ...runSim.makeTeam("left", [roleSpec("cavalry", { name: "奔跑骑兵", x: 20, y: 50 })]),
  ...runSim.makeTeam("right", [{ ...six, name: "奔跑截断盾兵", x: 40, y: 50 }]),
];
const [runRider, runWall] = runSim.units;
runSim.startCavalryRun(runRider, runWall, SKILLS.skills.cavalryRun.effects[0]);
for (let tick = 0; tick < 30 && runRider.cavalryRunState; tick += 1) runSim.tickCavalryRun(runRider, 0.04);
assert(runRider.x < runWall.x, "Cavalry run crossed the wall boundary");
assert.equal(runRider.cavalryRunState, null, "Intercepted cavalry run kept moving");
assert(runRider.stunTimer > 0, "Intercepted cavalry run was not stunned");
assert(runSim.signalBus.signals.some((signal) => signal.tags?.includes("chargeIntercept") && signal.meta?.chargeKind === "skillRun"), "Cavalry run interception was not signaled");

const leapSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "wall-cavalry-leap", maxTime: 5 });
leapSim.units = [
  ...leapSim.makeTeam("left", [roleSpec("cavalry", { name: "跃墙骑兵", x: 20, y: 50 })]),
  ...leapSim.makeTeam("right", [{ ...six, name: "不能截跳盾兵", x: 35, y: 50, maxHp: 5000 }]),
];
const [leapRider, leapWall] = leapSim.units;
leapSim.startCavalryDoubleLeap(leapRider, leapWall, SKILLS.skills.cavalryDoubleLeap.effects[0]);
for (let tick = 0; tick < 45 && leapRider.cavalryLeapState; tick += 1) leapSim.tickCavalryDoubleLeap(leapRider, 0.04);
assert(leapRider.x > leapWall.x, "Double leap failed to pass through the wall boundary");
assert(!leapSim.signalBus.signals.some((signal) => signal.tags?.includes("chargeIntercept")), "Double leap was incorrectly intercepted by the wall");

const setChargeSim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "wall-set-charge", maxTime: 5 });
setChargeSim.units = [
  ...setChargeSim.makeTeam("left", [{ ...equippedCavalry(6), name: "套装冲锋骑兵", x: 20, y: 50 }]),
  ...setChargeSim.makeTeam("right", [{ ...six, name: "截断盾兵", x: 30, y: 50 }]),
];
const [setRider, setWall] = setChargeSim.units;
setRider.cavalryChargeReady = true;
const wallHpBefore = setWall.hp;
assert.equal(setChargeSim.tryCavalryBreakthrough(setRider, setWall), false, "Set breakthrough crossed the wall boundary");
assert.equal(setWall.hp, wallHpBefore, "Intercepted set breakthrough still dealt damage");
assert(setRider.stunTimer > 0 && !setRider.cavalryChargeReady, "Wall did not interrupt, consume, and stun set charge");
assert(setChargeSim.signalBus.signals.some((signal) => signal.tags?.includes("chargeIntercept") && signal.meta?.chargeKind === "setBreakthrough"), "Set breakthrough interception was not signaled");

const baselineTeam = [shieldBearer({ name: "无套盾兵" }), roleSpec("warrior", { name: "被保护前锋" })];
const setTeam = [equippedWall(6, { name: "叹息盾兵" }), roleSpec("warrior", { name: "被保护前锋" })];
const enemies = Array.from({ length: 4 }, (_, index) => roleSpec("warrior", { name: `围攻敌人${index + 1}`, maxHp: 700 }));
const baseline = COMBAT.simulateTeams(baselineTeam, enemies, { randomizeStats: false, seed: "wall-integration", maxTime: 40 });
const setResult = COMBAT.simulateTeams(setTeam, enemies, { randomizeStats: false, seed: "wall-integration", maxTime: 40 });
const pulses = setResult.signals.filter((signal) => signal.tags?.includes("wallPulse") && signal.kind === "status");
assert(pulses.length >= 1, "Full shared-combat run never pulsed the wall aura");
assert(setResult.metrics.leftShield > baseline.metrics.leftShield, "The complete set did not improve real shield output");
assert(!baseline.signals.some((signal) => signal.tags?.includes("sighingWall")), "Baseline activated sighing wall without equipment");

console.log(JSON.stringify({
  ok: true,
  thresholds: { twoHp: two.maxHp, threeHp: three.maxHp, shieldPower: three.mechanicModifiers.shieldPower, sixPieceActive: true },
  direct: { openingPulse: true, intervalPulse: true, normalWalkingPasses: true, skillChargeBlocked: true, cavalryRunBlocked: true, doubleLeapPasses: true, setBreakthroughBlocked: true },
  integration: { baselineShield: baseline.metrics.leftShield, setShield: setResult.metrics.leftShield, pulses: pulses.length },
}, null, 2));
