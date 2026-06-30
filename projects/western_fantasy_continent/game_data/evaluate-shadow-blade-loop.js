const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams } = require("./combat-sim");
const { ATTR_BONUS } = require("./analyze-attribute-build-routes-v2");

const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const JSON_OUT = path.join(OUT_DIR, "shadow-blade-loop-evaluation.json");
const MD_OUT = path.join(OUT_DIR, "shadow-blade-loop-evaluation.md");
const TEAM_POOL_FILE = path.join(__dirname, "team_pools", "team-pool-db.json");

const MATRIX_SEEDS = 18;
const WATERLINE_SEEDS = 5;
const WATERLINE_LIMIT = 500;

const ASSASSIN_KIT = {
  small1: "shadowBurstAmbush",
  small2: "throatCut",
  passive: "shadowBladeLoop",
  ultimate: "midnightBloom",
};

const ROUTES = [
  { key: "none", name: "无加点", points: {} },
  { key: "fortitude10", name: "10坚韧", points: { fortitude: 10 } },
  { key: "agility3_might7", name: "3敏捷7武力", points: { agility: 3, might: 7 } },
  { key: "agility7_might3", name: "7敏捷3武力", points: { agility: 7, might: 3 } },
  { key: "agility7", name: "7敏捷", points: { agility: 7 } },
  { key: "agility10", name: "10敏捷", points: { agility: 10 } },
];

const SUBJECTS = [
  {
    key: "singleShadowBlade",
    name: "单影刃刺客",
    team: [
      unit("knight", { small1: "guard", small2: "tauntLine", passive: "fortressStance", ultimate: "bannerWall" }),
      unit("assassin", ASSASSIN_KIT),
      unit("priest", { small1: "heal", small2: "bloodCharm", passive: "afterglowGrace", ultimate: "sanctuary" }),
      unit("ranger", { small1: "markShot", small2: "pinningArrow", passive: "duelistFocus", ultimate: "arrowStorm" }),
    ],
  },
  {
    key: "doubleShadowBlade",
    name: "双影刃刺客",
    team: [
      unit("knight", { small1: "guard", small2: "tauntLine", passive: "fortressStance", ultimate: "bannerWall" }),
      unit("assassin", ASSASSIN_KIT),
      unit("assassin", ASSASSIN_KIT),
      unit("priest", { small1: "heal", small2: "bloodCharm", passive: "afterglowGrace", ultimate: "sanctuary" }),
    ],
  },
];

function run() {
  const presetOpponents = Object.entries(SKILL_DATA.presets || {}).map(([key, preset]) => ({
    key,
    name: preset.name || key,
    team: preset.team,
  }));
  const waterlineOpponents = readJson(TEAM_POOL_FILE).teams.slice(0, WATERLINE_LIMIT).map((entry) => ({
    key: entry.id,
    name: entry.name,
    pattern: entry.pattern,
    patternName: entry.patternName,
    team: entry.team,
  }));

  const cases = [];
  for (const subject of SUBJECTS) {
    for (const route of ROUTES) {
      const team = applyAssassinRoute(subject.team, route);
      const scope = route.key === "none" ? "noAttr" : "withAttr";
      cases.push({
        scope,
        subjectKey: subject.key,
        subjectName: subject.name,
        routeKey: route.key,
        routeName: route.name,
        matrix: evaluatePool(team, presetOpponents, {
          seedPrefix: `shadow-blade-matrix|${subject.key}|${route.key}`,
          seeds: MATRIX_SEEDS,
        }),
        waterline: evaluatePool(team, waterlineOpponents, {
          seedPrefix: `shadow-blade-waterline|${subject.key}|${route.key}`,
          seeds: WATERLINE_SEEDS,
        }),
      });
    }
  }

  const report = {
    schema: "shadow_blade_loop_evaluation_v1",
    generatedAt: new Date().toISOString(),
    skill: "shadowBladeLoop",
    matrixSeeds: MATRIX_SEEDS,
    waterlineSeeds: WATERLINE_SEEDS,
    waterlineLimit: WATERLINE_LIMIT,
    scopeNote: "Attribute routes apply only to assassin units in the subject team; non-assassin allies remain on base stats.",
    cases,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(MD_OUT, renderMarkdown(report), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), JSON_OUT)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_OUT)}`);
  console.log(renderConsoleSummary(report));
}

function evaluatePool(leftTeam, opponents, options) {
  const rows = opponents.map((opponent) => evaluateOpponent(leftTeam, opponent, options));
  const games = rows.reduce((sum, row) => sum + row.games, 0);
  const wins = rows.reduce((sum, row) => sum + row.wins, 0);
  return {
    opponents: opponents.length,
    games,
    wins,
    winRate: round(wins / games, 3),
    avgDuration: round(weighted(rows, "avgDuration"), 2),
    avgLeftHp: round(weighted(rows, "avgLeftHp"), 3),
    avgRightHp: round(weighted(rows, "avgRightHp"), 3),
    cooldownRefundPerGame: round(weighted(rows, "cooldownRefundPerGame"), 2),
    markBurstPerGame: round(weighted(rows, "markBurstPerGame"), 2),
    resetPerGame: round(weighted(rows, "resetPerGame"), 2),
    focusSwitchErrors: rows.reduce((sum, row) => sum + row.focusSwitchErrors, 0),
    best: rows.slice().sort((a, b) => b.winRate - a.winRate || b.avgLeftHp - a.avgLeftHp).slice(0, 5),
    worst: rows.slice().sort((a, b) => a.winRate - b.winRate || b.avgRightHp - a.avgRightHp).slice(0, 5),
    rows,
  };
}

function evaluateOpponent(leftTeam, opponent, options) {
  const samples = [];
  for (let seed = 0; seed < options.seeds; seed += 1) {
    const result = simulateTeams(clone(leftTeam), toCombatTeam(opponent.team), {
      seed: `${options.seedPrefix}|${opponent.key}|${seed}`,
      randomizeStats: false,
      maxTime: 75,
      healthInterval: 1,
    });
    samples.push(summarizeBattle(result));
  }
  const wins = samples.filter((item) => item.win).length;
  return {
    key: opponent.key,
    name: opponent.name,
    pattern: opponent.pattern || "preset",
    patternName: opponent.patternName || "固定预设",
    games: samples.length,
    wins,
    winRate: round(wins / samples.length, 3),
    avgDuration: round(avg(samples.map((item) => item.duration)), 2),
    avgLeftHp: round(avg(samples.map((item) => item.leftHp)), 3),
    avgRightHp: round(avg(samples.map((item) => item.rightHp)), 3),
    cooldownRefundPerGame: round(avg(samples.map((item) => item.cooldownRefund)), 2),
    markBurstPerGame: round(avg(samples.map((item) => item.markBurst)), 2),
    resetPerGame: round(avg(samples.map((item) => item.reset)), 2),
    focusSwitchErrors: samples.reduce((sum, item) => sum + item.focusSwitchErrors, 0),
  };
}

function summarizeBattle(result) {
  const signals = result.signals || [];
  return {
    win: result.winner === "left",
    duration: result.duration,
    leftHp: result.leftHp,
    rightHp: result.rightHp,
    cooldownRefund: signals.filter((signal) => signal.tags?.includes("cooldownRefund")).length,
    markBurst: signals.filter((signal) => signal.tags?.includes("markBurst")).length,
    reset: signals.filter((signal) => signal.tags?.includes("shadowKillReset") || signal.skillName === "影杀转火").length,
    focusSwitchErrors: countFocusSwitchErrors(signals),
  };
}

function countFocusSwitchErrors(signals) {
  const deaths = new Map();
  for (const signal of signals) {
    if (signal.tags?.includes("death") && signal.target?.id) deaths.set(signal.target.id, signal.time || 0);
  }
  let errors = 0;
  const lastFocused = {};
  for (const signal of signals) {
    if (!signal.tags?.includes("targeting")) continue;
    const sourceId = signal.source?.id;
    const focusId = signal.meta?.assassinFocusTargetId;
    if (!sourceId || !focusId) continue;
    if (lastFocused[sourceId] && lastFocused[sourceId] !== focusId) {
      const deathTime = deaths.get(lastFocused[sourceId]);
      if (deathTime === undefined || deathTime > (signal.time || 0)) errors += 1;
    }
    lastFocused[sourceId] = focusId;
  }
  return errors;
}

function applyAssassinRoute(team, route) {
  return team.map((spec, index) => {
    const base = { ...spec, slotIndex: index };
    if (spec.role !== "assassin") return base;
    return applyAttrs(base, route.points);
  });
}

function applyAttrs(spec, points) {
  const base = SKILL_DATA.roleKits[spec.role];
  const bonus = buildBonus(points);
  return {
    ...spec,
    hp: Math.round((spec.hp || base.hp) + bonus.hp),
    power: spec.power ?? base.power,
    physicalPower: round((spec.physicalPower ?? spec.power ?? base.power) + bonus.physicalPower, 2),
    magicPower: round((spec.magicPower ?? spec.power ?? base.power) + bonus.magicPower, 2),
    armor: round((spec.armor ?? base.armor) + bonus.armor, 2),
    attackSpeedMult: round((spec.attackSpeedMult || 1) + bonus.attackSpeed, 3),
    skillHasteMult: round((spec.skillHasteMult || 1) + bonus.skillHaste, 3),
    effectPowerMult: round((spec.effectPowerMult || 1) + bonus.effectPower, 3),
    effectResistPct: Math.min(0.5, round((spec.effectResistPct || 0) + bonus.effectResist, 3)),
    receivedHealingMult: round((spec.receivedHealingMult || 1) + bonus.receivedHealing, 3),
  };
}

function buildBonus(points) {
  const bonus = { hp: 0, physicalPower: 0, magicPower: 0, armor: 0, attackSpeed: 0, skillHaste: 0, effectPower: 0, effectResist: 0, receivedHealing: 0 };
  for (const [attr, value] of Object.entries(points || {})) {
    const row = ATTR_BONUS[attr];
    if (!row || !value) continue;
    bonus.hp += (row.hp || 0) * value;
    bonus.physicalPower += (row.physicalPower || 0) * value;
    bonus.magicPower += (row.magicPower || 0) * value;
    bonus.armor += (row.armor || 0) * value;
    bonus.attackSpeed += (row.attackSpeed || 0) * value;
    bonus.skillHaste += (row.skillHaste || 0) * value;
    bonus.effectPower += (row.effectPower || 0) * value;
    bonus.effectResist += (row.effectResist || 0) * value;
    bonus.receivedHealing += (row.receivedHealing || 0) * value;
  }
  return bonus;
}

function unit(role, kit) {
  return {
    role,
    ...kit,
  };
}

function toCombatTeam(team) {
  return team.map((spec, index) => ({
    ...spec,
    slotIndex: index,
  }));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function weighted(rows, field) {
  const games = rows.reduce((sum, row) => sum + row.games, 0);
  if (!games) return 0;
  return rows.reduce((sum, row) => sum + row[field] * row.games, 0) / games;
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function renderConsoleSummary(report) {
  return report.cases.map((item) => `${item.subjectName}/${item.routeName}: matrix ${pct(item.matrix.winRate)}, waterline ${pct(item.waterline.winRate)}, refund ${item.waterline.cooldownRefundPerGame}/g, burst ${item.waterline.markBurstPerGame}/g, reset ${item.waterline.resetPerGame}/g, switchErr ${item.waterline.focusSwitchErrors}`).join("\n");
}

function renderMarkdown(report) {
  const lines = [
    "# Shadow Blade Loop Evaluation",
    "",
    `Skill: \`${report.skill}\``,
    "",
    report.scopeNote,
    "",
    "## Summary",
    "",
    "| Scope | Team | Route | Preset Matrix | Waterline | CD Refund/G | Burst/G | Reset/G | Switch Errors |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const item of report.cases) {
    lines.push(`| ${item.scope} | ${item.subjectName} | ${item.routeName} | ${pct(item.matrix.winRate)} | ${pct(item.waterline.winRate)} | ${item.waterline.cooldownRefundPerGame} | ${item.waterline.markBurstPerGame} | ${item.waterline.resetPerGame} | ${item.waterline.focusSwitchErrors} |`);
  }
  lines.push("", "## Worst Waterline Matchups", "");
  for (const item of report.cases) {
    lines.push(`### ${item.subjectName} / ${item.routeName}`);
    for (const row of item.waterline.worst.slice(0, 5)) {
      lines.push(`- ${row.name} \`${row.key}\`: ${pct(row.winRate)}, pattern ${row.patternName}, rightHp ${row.avgRightHp}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

if (require.main === module) run();
