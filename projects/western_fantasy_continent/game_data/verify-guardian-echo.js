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
  return BUILD.applyBuildLayers(roleSpec("priest", overrides), {
    equipmentItems: SETS.mockSetItems("guardianEcho", pieces),
  });
}

const two = equipped(2);
const three = equipped(3);
const six = equipped(6);
assert.equal(two.maxHp, SKILLS.roleKits.priest.hp, "2 pieces granted the HP foundation");
assert.equal(three.maxHp, SKILLS.roleKits.priest.hp + 60, "3-piece self-HP foundation did not enter build layers");
assert(three.magicPower > two.magicPower, "3-piece healing foundation did not improve healing power through build layers");
assert.equal(three.mechanicModifiers["set:guardianEcho:resonance"], undefined, "3 pieces activated the 6-piece mechanic");
assert.equal(six.mechanicModifiers["set:guardianEcho:resonance"], 1, "6 pieces did not activate resonance");

const sim = new COMBAT.CombatSimulation({ randomizeStats: false, seed: "guardian-direct", maxTime: 5 });
sim.units = [
  ...sim.makeTeam("left", [
    { ...six, name: "回响牧师", x: 30, y: 50 },
    roleSpec("warrior", { name: "近邻一", x: 34, y: 47 }),
    roleSpec("warrior", { name: "近邻二", x: 35, y: 54 }),
    roleSpec("warrior", { name: "远处友军", x: 10, y: 80 }),
  ]),
  ...sim.makeTeam("right", [roleSpec("knight", { name: "伤害测试敌人", x: 70, y: 50, maxHp: 5000 })]),
];
const [source, nearOne, nearTwo, farAlly, enemy] = sim.units;
for (const ally of [source, nearOne, nearTwo, farAlly]) ally.hp -= 180;
sim.rng = () => 0;
sim.withAction(source, { tags: ["skill", "heal"], skillName: "单体治疗" }, () => sim.healUnit(nearOne, 100, "单体治疗", source));
const healEchoes = sim.signalBus.signals.filter((signal) => signal.tags?.includes("echoProc") && signal.meta?.kind === "heal");
assert.equal(healEchoes.length, 1, "One original heal did not make exactly one independent echo roll");
assert.equal(healEchoes[0].meta.radius, 18, "Guardian Echo no longer uses the intended finite battlefield radius");
assert(nearTwo.hp > nearTwo.maxHp - 180, "Healing echo did not reach a nearby ally");
assert.equal(farAlly.hp, farAlly.maxHp - 180, "Healing echo escaped its battlefield radius");

nearOne.hp = Math.max(1, nearOne.hp - 100);
const nearOneAfterFirstEcho = nearOne.hp;
sim.withAction(source, { tags: ["skill", "heal", "multiTarget"], skillName: "另一目标治疗" }, () => sim.healUnit(nearTwo, 40, "另一目标治疗", source));
assert(nearOne.hp > nearOneAfterFirstEcho, "A second original target could not create an overlapping echo on the first target");

const shieldsBefore = [source, nearOne, nearTwo].map((unit) => unit.shield);
sim.withAction(source, { tags: ["skill", "shield"], skillName: "单体护盾" }, () => sim.shield(nearOne, 80, "单体护盾", source));
assert([source, nearOne, nearTwo].every((unit, index) => unit.shield > shieldsBefore[index]), "Shield echo did not reproduce protection in the larger area");

for (const ally of [nearOne, nearTwo]) sim.addBurn(ally, 3, 8, enemy);
sim.withAction(source, { tags: ["skill", "cleanse"], skillName: "单体净化" }, () => sim.cleanseStatus(source, nearOne, "burn", 3, 0, "单体净化"));
assert.equal(nearOne.burn.stacks, 0, "Original cleanse failed");
assert.equal(nearTwo.burn.stacks, 0, "Cleanse echo did not clear the nearby ally");

const procCountBeforeDamage = sim.signalBus.signals.filter((signal) => signal.tags?.includes("echoProc")).length;
sim.withAction(source, { tags: ["skill", "damage"], skillName: "战锤打击" }, () => sim.takeDamage(source, enemy, 100, "physical", "战锤打击"));
assert.equal(sim.signalBus.signals.filter((signal) => signal.tags?.includes("echoProc")).length, procCountBeforeDamage, "Damage incorrectly triggered a protective echo");
assert(!sim.signalBus.signals.some((signal) => signal.tags?.includes("guardianEcho") && signal.kind === "damage"), "Hammer damage was copied by the set");

const baselineTeam = [roleSpec("priest", { name: "无套牧师" }), roleSpec("warrior", { name: "受护前锋" })];
const setTeam = [equipped(6, { name: "回响牧师" }), roleSpec("warrior", { name: "受护前锋" })];
const enemies = Array.from({ length: 4 }, (_, index) => roleSpec("warrior", { name: `压测敌人${index + 1}`, maxHp: 650 }));
const baseline = COMBAT.simulateTeams(baselineTeam, enemies, { randomizeStats: false, seed: "guardian-integration", maxTime: 40 });
const setResult = COMBAT.simulateTeams(setTeam, enemies, { randomizeStats: false, seed: "guardian-integration", maxTime: 40 });
const echoSignals = setResult.signals.filter((signal) => signal.tags?.includes("echoProc"));
const baselineProtection = baseline.metrics.leftHealing + baseline.metrics.leftShield;
const setProtection = setResult.metrics.leftHealing + setResult.metrics.leftShield;
assert(echoSignals.length > 0, "Full shared-combat run never triggered a protection echo");
assert(setProtection > baselineProtection, "The complete set did not improve real healing-plus-shield output");
assert(!baseline.signals.some((signal) => signal.tags?.includes("guardianEcho")), "Baseline activated guardian echo without equipment");

console.log(JSON.stringify({
  ok: true,
  thresholds: { twoHp: two.maxHp, threeHp: three.maxHp, threeMagic: three.magicPower, sixPieceActive: true },
  direct: {
    radius: healEchoes[0].meta.radius,
    healEchoes: healEchoes.length,
    shieldEchoes: sim.signalBus.signals.filter((signal) => signal.tags?.includes("echoProc") && signal.meta?.kind === "shield").length,
    cleanseEchoes: sim.signalBus.signals.filter((signal) => signal.tags?.includes("echoProc") && signal.meta?.kind === "cleanse").length,
    damageCopied: false,
  },
  integration: { baselineProtection, setProtection, echoProcs: echoSignals.length },
}, null, 2));
