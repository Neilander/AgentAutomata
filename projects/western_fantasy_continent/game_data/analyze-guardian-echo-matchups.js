"use strict";

const SETS = require("./equipment-sets");
const BUILD = require("./build-layers");
const SKILLS = require("./skill-data");
const COMBAT = require("./combat-sim");

const MAX_TIME = 180;
const ALLY_HP_SCALE = 9;
const ENEMY_HP_SCALE = 18;
const SEEDS = ["a", "b", "c"];
const SIZES = [4, 8, 20];
const MATCHUPS = ["cavalry", "mage", "sniper", "warrior"];
const FORMATIONS = ["balanced", "escort", "spreadSolo"];

const LABELS = Object.freeze({
  cavalry: "奔袭铁骑阵",
  mage: "流星火雨阵",
  sniper: "鹰眼狙击阵",
  warrior: "万夫战士阵",
  balanced: "密集均衡阵",
  escort: "护卫保核阵",
  spreadSolo: "分散单奶阵",
});

function roleSpec(role, hpScale, overrides = {}) {
  const kit = SKILLS.roleKits[role];
  return {
    role,
    ...kit.kit,
    maxHp: kit.hp * hpScale,
    ...overrides,
  };
}

function withSet(role, setId, hpScale, overrides = {}) {
  return BUILD.applyBuildLayers(roleSpec(role, hpScale, overrides), {
    equipmentItems: SETS.mockSetItems(setId, 6),
  });
}

function cavalrySpec(hpScale, overrides = {}, equipped = true) {
  const spec = roleSpec("knight", hpScale, {
    roleName: "骑兵",
    small1: "lanceCharge",
    small2: "shieldBash",
    passive: "chargerMomentum",
    ultimate: "royalCavalryBreak",
    ...overrides,
  });
  return equipped
    ? BUILD.applyBuildLayers(spec, { equipmentItems: SETS.mockSetItems("cavalryCharge", 6) })
    : spec;
}

function countByRatio(size, ratio, minimum = 0) {
  return Math.max(minimum, Math.round(size * ratio));
}

function addRole(team, role, count, hpScale, options = {}) {
  for (let index = 0; index < count; index += 1) {
    const ordinal = team.length + 1;
    const name = options.namePrefix ? `${options.namePrefix}${index + 1}` : `${SKILLS.roleKits[role].name}${ordinal}`;
    const overrides = { name, ...(options.overrides || {}) };
    const spec = options.setId
      ? withSet(role, options.setId, hpScale, overrides)
      : roleSpec(role, hpScale, overrides);
    team.push(spec);
  }
}

function buildAlliedTeam(size, formation, guardianEquipped) {
  const team = [];
  if (formation === "balanced") {
    const priests = countByRatio(size, 0.25, 1);
    const knights = countByRatio(size, 0.25, 1);
    const warriors = countByRatio(size, 0.25, 1);
    addRole(team, "priest", priests, ALLY_HP_SCALE, { setId: guardianEquipped ? "guardianEcho" : null, namePrefix: "均衡牧师" });
    addRole(team, "knight", knights, ALLY_HP_SCALE, { namePrefix: "均衡盾卫" });
    addRole(team, "warrior", warriors, ALLY_HP_SCALE, { namePrefix: "均衡战士" });
    addRole(team, "ranger", size - team.length, ALLY_HP_SCALE, { namePrefix: "均衡游侠" });
  } else if (formation === "escort") {
    const priests = countByRatio(size, 0.25, 1);
    const knights = countByRatio(size, 0.25, 1);
    addRole(team, "priest", priests, ALLY_HP_SCALE, { setId: guardianEquipped ? "guardianEcho" : null, namePrefix: "护送牧师" });
    addRole(team, "knight", knights, ALLY_HP_SCALE, { namePrefix: "护送盾卫" });
    addRole(team, "ranger", 1, ALLY_HP_SCALE, { namePrefix: "核心游侠" });
    addRole(team, "warrior", Math.max(0, size - team.length), ALLY_HP_SCALE, { namePrefix: "护送战士" });
  } else {
    addRole(team, "priest", 1, ALLY_HP_SCALE, { setId: guardianEquipped ? "guardianEcho" : null, namePrefix: "孤立牧师" });
    const knights = countByRatio(size, 0.25, 1);
    const warriors = countByRatio(size, 0.35, 1);
    addRole(team, "knight", knights, ALLY_HP_SCALE, { namePrefix: "分散盾卫" });
    addRole(team, "warrior", warriors, ALLY_HP_SCALE, { namePrefix: "分散战士" });
    addRole(team, "ranger", Math.max(0, size - team.length), ALLY_HP_SCALE, { namePrefix: "分散游侠" });
  }
  positionTeam(team, "left", formation === "spreadSolo" ? "spread" : "compact");
  return team;
}

function buildEnemyTeam(size, matchup) {
  const team = [];
  if (matchup === "cavalry") {
    const riders = countByRatio(size, 0.75, 1);
    for (let index = 0; index < riders; index += 1) team.push(cavalrySpec(ENEMY_HP_SCALE, { name: `奔袭骑兵${index + 1}` }));
    addRole(team, "warrior", size - team.length, ENEMY_HP_SCALE, { namePrefix: "铁骑步兵" });
  } else if (matchup === "mage") {
    addRole(team, "mage", Math.max(1, Math.round(size * 0.1)), ENEMY_HP_SCALE, { setId: "meteorFireRain", namePrefix: "火雨法师" });
    addRole(team, "knight", countByRatio(size, 0.4), ENEMY_HP_SCALE, { namePrefix: "火雨盾卫" });
    addRole(team, "warrior", size - team.length, ENEMY_HP_SCALE, { namePrefix: "火雨前锋" });
  } else if (matchup === "sniper") {
    addRole(team, "ranger", countByRatio(size, 0.25, 1), ENEMY_HP_SCALE, { setId: "eagleEye", namePrefix: "鹰眼游侠" });
    addRole(team, "knight", countByRatio(size, 0.4), ENEMY_HP_SCALE, { namePrefix: "鹰眼盾卫" });
    addRole(team, "warrior", size - team.length, ENEMY_HP_SCALE, { namePrefix: "鹰眼前锋" });
  } else {
    addRole(team, "warrior", countByRatio(size, 0.25, 1), ENEMY_HP_SCALE, { setId: "myriadValor", namePrefix: "万夫战士" });
    addRole(team, "knight", size - team.length, ENEMY_HP_SCALE, { namePrefix: "万夫盾卫" });
  }
  positionTeam(team, "right", "compact");
  return team;
}

function positionTeam(team, side, layout) {
  if (layout === "spread") {
    const columns = Math.ceil(team.length / 4);
    team.forEach((unit, index) => {
      const column = Math.floor(index / 4);
      const row = index % 4;
      unit.homeX = side === "left" ? 6 + column * 7 : 94 - column * 7;
      unit.homeY = 14 + row * 24;
      unit.line = column >= Math.ceil(columns / 2) ? "前排" : "后排";
    });
    return;
  }
  const frontline = team.filter((unit) => ["warrior", "knight", "berserker"].includes(unit.role) || unit.roleName === "骑兵");
  const backline = team.filter((unit) => !frontline.includes(unit));
  placeLine(frontline, side === "left" ? 31 : 69, "前排");
  placeLine(backline, side === "left" ? 20 : 80, "后排");
}

function placeLine(units, x, line) {
  if (!units.length) return;
  const spacing = Math.min(9, 68 / Math.max(1, units.length - 1));
  const firstY = 50 - spacing * (units.length - 1) / 2;
  units.forEach((unit, index) => {
    unit.homeX = x;
    unit.homeY = firstY + spacing * index;
    unit.line = line;
  });
}

function summarize(result, coreName) {
  const deaths = new Map(
    result.signals
      .filter((signal) => signal.kind === "death" && signal.target?.side === "left")
      .map((signal) => [signal.target.id, signal.time]),
  );
  const leftUnits = result.units.filter((unit) => unit.side === "left");
  const lifetimes = leftUnits.map((unit) => deaths.get(unit.id) ?? MAX_TIME);
  const sorted = [...lifetimes].sort((a, b) => a - b);
  const core = leftUnits.find((unit) => unit.name.startsWith(coreName));
  const echoProcs = result.signals.filter((signal) => signal.tags?.includes("echoProc"));
  return {
    absorbed: result.metrics.rightDamage,
    healing: result.metrics.leftHealing,
    shielding: result.metrics.leftShield,
    meanLifetime: average(lifetimes),
    firstDeath: sorted[0] ?? MAX_TIME,
    medianDeath: median(sorted),
    lastDeath: sorted[sorted.length - 1] ?? MAX_TIME,
    coreLifetime: core ? (deaths.get(core.id) ?? MAX_TIME) : null,
    aliveAt60: lifetimes.filter((time) => time >= 60).length,
    aliveAt120: lifetimes.filter((time) => time >= 120).length,
    aliveAt180: result.metrics.leftAlive,
    won: result.metrics.rightAlive === 0 && result.metrics.leftAlive > 0,
    battleDuration: result.duration,
    echoProcs: echoProcs.length,
    echoTargetsPerProc: echoProcs.length ? average(echoProcs.map((signal) => signal.meta?.targets?.length || 0)) : 0,
  };
}

function runVariant(size, matchup, formation, equipped) {
  return SEEDS.map((seed) => {
    const left = buildAlliedTeam(size, formation, equipped);
    const right = buildEnemyTeam(size, matchup);
    const result = COMBAT.simulateTeams(left, right, {
      randomizeStats: false,
      seed: `guardian-matrix-${size}-${matchup}-${formation}-${seed}`,
      maxTime: MAX_TIME,
    });
    return summarize(result, formation === "escort" ? "核心游侠" : formation === "spreadSolo" ? "分散游侠" : "均衡游侠");
  });
}

function aggregate(rows) {
  const numericKeys = Object.keys(rows[0]).filter((key) => typeof rows[0][key] === "number");
  const summary = Object.fromEntries(numericKeys.map((key) => [key, average(rows.map((row) => row[key]))]));
  summary.winRate = rows.filter((row) => row.won).length / rows.length;
  return summary;
}

function compare(baseline, equipped) {
  return {
    absorbedPct: percentChange(baseline.absorbed, equipped.absorbed),
    meanLifetimePct: percentChange(baseline.meanLifetime, equipped.meanLifetime),
    firstDeathPct: percentChange(baseline.firstDeath, equipped.firstDeath),
    medianDeathPct: percentChange(baseline.medianDeath, equipped.medianDeath),
    lastDeathPct: percentChange(baseline.lastDeath, equipped.lastDeath),
    coreLifetimePct: baseline.coreLifetime == null ? null : percentChange(baseline.coreLifetime, equipped.coreLifetime),
    aliveAt60Delta: round(equipped.aliveAt60 - baseline.aliveAt60),
    aliveAt120Delta: round(equipped.aliveAt120 - baseline.aliveAt120),
    aliveAt180Delta: round(equipped.aliveAt180 - baseline.aliveAt180),
    protectionPct: percentChange(baseline.healing + baseline.shielding, equipped.healing + equipped.shielding),
    echoProcs: round(equipped.echoProcs),
    echoTargetsPerProc: round(equipped.echoTargetsPerProc),
  };
}

function average(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function percentChange(before, after) {
  return before > 0 ? round((after / before - 1) * 100) : null;
}

function round(value) {
  return Number(value.toFixed(2));
}

function averageChanges(selectedRows) {
  const keys = ["absorbedPct", "meanLifetimePct", "firstDeathPct", "medianDeathPct", "lastDeathPct", "coreLifetimePct", "protectionPct", "echoProcs", "echoTargetsPerProc"];
  return Object.fromEntries(keys.map((key) => [key, round(average(selectedRows.map((row) => row.change[key])))]));
}

const rows = [];
for (const size of SIZES) {
  for (const matchup of MATCHUPS) {
    for (const formation of FORMATIONS) {
      const baseline = aggregate(runVariant(size, matchup, formation, false));
      const equipped = aggregate(runVariant(size, matchup, formation, true));
      rows.push({
        size,
        matchup,
        matchupLabel: LABELS[matchup],
        formation,
        formationLabel: LABELS[formation],
        baseline: Object.fromEntries(Object.entries(baseline).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
        equipped: Object.fromEntries(Object.entries(equipped).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
        change: compare(baseline, equipped),
      });
    }
  }
}

const output = {
  method: {
    maxTime: MAX_TIME,
    seedsPerCell: SEEDS.length,
    allyHpScale: ALLY_HP_SCALE,
    enemyHpScale: ENEMY_HP_SCALE,
    note: "敌方生命仅用于避免胜利过早截断承伤测试；存活角色按180秒右删失计入平均寿命。所有战斗均调用共享combat-sim。",
  },
  rows,
};

if (process.argv.includes("--compact")) {
  console.log(JSON.stringify({
    method: output.method,
    bySizeAndMatchup: SIZES.flatMap((size) => MATCHUPS.map((matchup) => ({
      size,
      matchup: LABELS[matchup],
      ...averageChanges(rows.filter((row) => row.size === size && row.matchup === matchup)),
    }))),
    byFormation: FORMATIONS.map((formation) => ({
      formation: LABELS[formation],
      ...averageChanges(rows.filter((row) => row.formation === formation)),
    })),
    rows: rows.map((row) => ({
      size: row.size,
      matchup: row.matchupLabel,
      formation: row.formationLabel,
      baselineMeanLifetime: row.baseline.meanLifetime,
      equippedMeanLifetime: row.equipped.meanLifetime,
      ...row.change,
    })),
  }, null, 2));
} else {
  console.log(JSON.stringify(output, null, 2));
}
