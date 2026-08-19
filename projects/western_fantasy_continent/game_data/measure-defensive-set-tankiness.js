"use strict";

const SETS = require("./equipment-sets");
const BUILD = require("./build-layers");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

function roleSpec(role, overrides = {}) {
  return { role, ...SKILLS.roleKits[role].kit, ...overrides };
}

function withSet(role, setId) {
  return BUILD.applyBuildLayers(roleSpec(role), { equipmentItems: SETS.mockSetItems(setId, 6) });
}

function baseTeam() {
  return [roleSpec("priest"), roleSpec("warrior"), roleSpec("knight")];
}

function setTeam(setId) {
  if (setId === "guardianEcho") return [withSet("priest", setId), roleSpec("warrior"), roleSpec("knight")];
  return [roleSpec("priest"), roleSpec("warrior"), withSet("knight", setId)];
}

function enemyTeam(count) {
  return Array.from({ length: count }, (_, index) => roleSpec("warrior", { name: `承伤标尺敌人${index + 1}`, power: 60, maxHp: 900 }));
}

function measure(setId) {
  const rows = [];
  for (const enemyCount of [4, 5, 6, 7, 8]) {
    const options = { randomizeStats: false, seed: `tank-common-${enemyCount}`, maxTime: 75 };
    const baseline = COMBAT.simulateTeams(baseTeam(), enemyTeam(enemyCount), options);
    const equipped = COMBAT.simulateTeams(setTeam(setId), enemyTeam(enemyCount), options);
    rows.push({
      enemyCount,
      baselineDuration: baseline.duration,
      equippedDuration: equipped.duration,
      survivalRatio: equipped.duration / baseline.duration,
      baselineAbsorbed: baseline.metrics.rightDamage,
      equippedAbsorbed: equipped.metrics.rightDamage,
      durabilityRatio: equipped.metrics.rightDamage / baseline.metrics.rightDamage,
    });
  }
  const average = (key) => rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
  return {
    rows: rows.map((row) => ({
      ...row,
      survivalRatio: round(row.survivalRatio),
      durabilityRatio: round(row.durabilityRatio),
    })),
    averageSurvivalRatio: round(average("survivalRatio")),
    averageDurabilityRatio: round(average("durabilityRatio")),
  };
}

function round(value) {
  return Number(value.toFixed(3));
}

console.log(JSON.stringify({
  method: "同一牧师+战士+骑士三人队，在4—8名固定强度战士围攻下直至灭队；以敌方累计真实输出表示有效承伤，以灭队时间表示存活时长。",
  guardianEcho: measure("guardianEcho"),
  sighingWall: measure("sighingWall"),
}, null, 2));
