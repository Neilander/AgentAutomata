"use strict";

const assert = require("node:assert/strict");
const SETS = require("./equipment-sets");
const BUILD = require("./build-layers");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

function roleSpec(role, overrides = {}) {
  return { role, ...SKILLS.roleKits[role].kit, ...overrides };
}

function withSet(spec, setId) {
  return BUILD.applyBuildLayers(spec, { equipmentItems: SETS.mockSetItems(setId, 6) });
}

const cavalry = (overrides = {}) => roleSpec("knight", {
  roleName: "骑兵",
  small1: "lanceCharge",
  small2: "shieldBash",
  passive: "chargerMomentum",
  ultimate: "royalCavalryBreak",
  ...overrides,
});

const baselineTeam = [
  roleSpec("warrior", { name: "前锋" }),
  roleSpec("mage", { name: "火法" }),
  roleSpec("priest", { name: "护佑者" }),
  roleSpec("ranger", { name: "弓手" }),
  cavalry({ name: "骑兵" }),
  roleSpec("knight", { name: "盾兵", roleName: "盾兵" }),
];
const setTeam = [
  withSet(roleSpec("warrior", { name: "万夫前锋" }), "myriadValor"),
  withSet(roleSpec("mage", { name: "火雨法师" }), "meteorFireRain"),
  withSet(roleSpec("priest", { name: "回响护佑者" }), "guardianEcho"),
  withSet(roleSpec("ranger", { name: "鹰眼弓手" }), "eagleEye"),
  withSet(cavalry({ name: "奔袭骑兵" }), "cavalryCharge"),
  withSet(roleSpec("knight", { name: "叹息盾兵", roleName: "盾兵" }), "sighingWall"),
];
const enemies = Array.from({ length: 10 }, (_, index) => roleSpec(index % 3 === 0 ? "knight" : "warrior", {
  name: `综合压测敌人${index + 1}`,
  maxHp: 1100,
  power: 48,
}));

for (const spec of setTeam) {
  const activeSixPieceKeys = Object.entries(spec.mechanicModifiers || {}).filter(([key, value]) => key.startsWith("set:") && !key.endsWith(":pieces") && value && !key.endsWith(":foundation"));
  assert.equal(activeSixPieceKeys.length, 1, `${spec.name} activated another set's six-piece mechanic`);
}

const baseline = COMBAT.simulateTeams(baselineTeam, enemies, { randomizeStats: false, seed: "all-role-sets", maxTime: 55 });
const result = COMBAT.simulateTeams(setTeam, enemies, { randomizeStats: false, seed: "all-role-sets", maxTime: 55 });
const requiredTags = ["myriadValor", "meteorFireRain", "guardianEcho", "eagleEye", "cavalryCharge", "sighingWall"];
for (const tag of requiredTags) assert(result.signals.some((signal) => signal.tags?.includes(tag)), `Combined shared-combat run never exposed ${tag}`);
assert(result.metrics.leftDamage > baseline.metrics.leftDamage, "Combined sets did not improve team damage");
assert(result.metrics.leftShield + result.metrics.leftHealing > baseline.metrics.leftShield + baseline.metrics.leftHealing, "Combined sets did not improve team protection");

function assertFiniteDeep(value, path = "result") {
  if (typeof value === "number") assert(Number.isFinite(value), `${path} contains a non-finite number`);
  else if (Array.isArray(value)) value.forEach((entry, index) => assertFiniteDeep(entry, `${path}[${index}]`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => assertFiniteDeep(entry, `${path}.${key}`));
}
assertFiniteDeep(result);

const signalCounts = Object.fromEntries(requiredTags.map((tag) => [tag, result.signals.filter((signal) => signal.tags?.includes(tag)).length]));
console.log(JSON.stringify({
  ok: true,
  winner: result.winner,
  duration: result.duration,
  baseline: { damage: baseline.metrics.leftDamage, protection: baseline.metrics.leftShield + baseline.metrics.leftHealing, alive: baseline.metrics.leftAlive },
  sets: { damage: result.metrics.leftDamage, protection: result.metrics.leftShield + result.metrics.leftHealing, alive: result.metrics.leftAlive },
  signalCounts,
  finiteOutput: true,
}, null, 2));
