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
  return BUILD.applyBuildLayers(roleSpec("ranger", overrides), {
    equipmentItems: SETS.mockSetItems("eagleEye", pieces),
  });
}

const two = equipped(2);
const three = equipped(3);
const six = equipped(6);
assert.equal(two.range, SKILLS.roleKits.ranger.range, "2 pieces granted the range foundation");
assert.equal(three.range, SKILLS.roleKits.ranger.range + 8, "3-piece range foundation did not enter build layers");
assert.equal(three.physicalPower, SKILLS.roleKits.ranger.power + 10, "3-piece attack foundation did not enter build layers");
assert.equal(three.mechanicModifiers["set:eagleEye:skyArrow"], undefined, "3 pieces activated the 6-piece mechanic");
assert.equal(six.mechanicModifiers["set:eagleEye:skyArrow"], 1, "6 pieces did not activate sky arrow");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "eagle-direct", maxTime: 5 });
sim.units = [
  ...sim.makeTeam("left", [{ ...six, name: "鹰眼游侠", x: 25, y: 50 }]),
  ...sim.makeTeam("right", [
    roleSpec("knight", { name: "锁定靶一", maxHp: 10000, x: 70, y: 50 }),
    roleSpec("knight", { name: "锁定靶二", maxHp: 10000, x: 73, y: 52 }),
  ]),
];
const [source, targetOne, targetTwo] = sim.units;
for (let index = 0; index < 5; index += 1) sim.withAction(source, { tags: ["basic", "attack"], skillName: "校准射击" }, () => sim.takeDamage(source, targetOne, 1, "physical", "校准射击"));
assert.equal(source.eagleEyeLock, 5, "Five same-target hits did not build five lock");
assert.equal(sim.pendingSetEffects.length, 0, "Sky arrow triggered before the lock threshold");
sim.withAction(source, { tags: ["basic", "attack"], skillName: "校准射击" }, () => sim.takeDamage(source, targetOne, 1, "physical", "校准射击"));
assert.equal(sim.pendingSetEffects.length, 1, "Six same-target hits did not schedule one sky-arrow zone");
const warning = sim.signalBus.signals.find((signal) => signal.tags?.includes("skyArrowWarning"));
assert(warning, "Sky-arrow targeting line/zone signal is missing");
const fixedPosition = structuredClone(warning.meta.position);
targetOne.x = 8;
targetOne.y = 14;
const targetOneHpBefore = targetOne.hp;
const targetTwoHpBefore = targetTwo.hp;
sim.time = 1;
sim.tickScheduledSetEffects();
const impact = sim.signalBus.signals.find((signal) => signal.tags?.includes("skyArrowImpact"));
assert.deepEqual(impact.meta.position, fixedPosition, "Sky-arrow zone tracked the moved target");
assert.equal(targetOne.hp, targetOneHpBefore, "Moved target was followed outside the fixed zone");
assert(targetTwo.hp < targetTwoHpBefore, "A unit remaining inside the fixed zone took no real damage");
assert.equal(source.eagleEyeLock, 0, "Sky-arrow damage recursively rebuilt lock");

sim.withAction(source, { tags: ["basic", "attack"], skillName: "转火前" }, () => sim.takeDamage(source, targetOne, 1, "physical", "转火前"));
sim.withAction(source, { tags: ["basic", "attack"], skillName: "转火后" }, () => sim.takeDamage(source, targetTwo, 1, "physical", "转火后"));
assert.equal(source.eagleEyeLock, 1, "Changing targets did not reset prior lock before adding the new hit");
assert(sim.signalBus.signals.some((signal) => signal.tags?.includes("lockReset") && signal.meta?.reason === "targetChanged"), "Target-switch reset was not signaled");

source.eagleEyeLock = 4;
source.slowTimer = 2;
sim.handleEagleEyeControl(source);
assert.equal(source.eagleEyeLock, 0, "Control did not interrupt lock");
assert(sim.signalBus.signals.some((signal) => signal.tags?.includes("lockReset") && signal.meta?.reason === "controlled"), "Control reset was not signaled");
source.slowTimer = 0;
sim.handleEagleEyeControl(source);

source.eagleEyeTargetId = targetTwo.id;
for (let index = 0; index < 3; index += 1) sim.withAction(source, { tags: ["skill", "trap"], skillName: "猎人陷阱" }, () => sim.takeDamage(source, targetTwo, 1, "physical", "猎人陷阱"));
assert.equal(sim.pendingSetEffects.length, 1, "Three trap-tagged hits did not supply six lock");

const enemyTeam = Array.from({ length: 4 }, (_, index) => roleSpec("knight", { name: `鹰眼整场靶${index + 1}`, maxHp: 850 }));
const baseline = COMBAT.simulateTeams([roleSpec("ranger", { name: "无套游侠" })], enemyTeam, { randomizeStats: false, seed: "eagle-integration", maxTime: 40 });
const setResult = COMBAT.simulateTeams([equipped(6, { name: "鹰眼游侠" })], enemyTeam, { randomizeStats: false, seed: "eagle-integration", maxTime: 40 });
const skyWarnings = setResult.signals.filter((signal) => signal.tags?.includes("skyArrowWarning"));
const skyImpacts = setResult.signals.filter((signal) => signal.tags?.includes("skyArrowImpact"));
assert(skyWarnings.length > 0 && skyImpacts.length > 0, "Full shared-combat run never completed lock-to-arrow sequence");
assert(setResult.metrics.leftDamage > baseline.metrics.leftDamage * 1.25, "The complete set did not create a meaningful ranged damage direction");
assert(setResult.metrics.leftDamage >= baseline.metrics.leftDamage * 4.5 && setResult.metrics.leftDamage <= baseline.metrics.leftDamage * 5.5, "Eagle Eye missed its approximate 5x total-output target");
assert(!baseline.signals.some((signal) => signal.tags?.includes("eagleEye")), "Baseline activated eagle eye without equipment");

console.log(JSON.stringify({
  ok: true,
  thresholds: { twoRange: two.range, threeRange: three.range, threePower: three.physicalPower, sixPieceActive: true },
  direct: { fixedZone: true, controlReset: true, targetSwitchReset: true, trapThreeHitTrigger: true },
  integration: {
    baselineDamage: baseline.metrics.leftDamage,
    setDamage: setResult.metrics.leftDamage,
    multiplier: Number((setResult.metrics.leftDamage / baseline.metrics.leftDamage).toFixed(2)),
    skyWarnings: skyWarnings.length,
    skyImpacts: skyImpacts.length,
  },
}, null, 2));
