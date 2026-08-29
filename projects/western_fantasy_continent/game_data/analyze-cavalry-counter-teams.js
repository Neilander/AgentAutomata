"use strict";

const GAME = require("../border_village_war/border-village-core");
const COMBAT = require("./combat-sim");
const SKILLS = require("./skill-data");
const BUILD = require("./build-layers");
const SETS = require("./equipment-sets");

const GAMES = Math.max(1, Number(process.argv[2]) || 50);
const ROLE_SETS = {
  knight: "sighingWall",
  warrior: "myriadValor",
  mage: "meteorFireRain",
  priest: "guardianEcho",
  ranger: "eagleEye",
};

const CANDIDATES = [
  { id: "control", label: "当前双战士对照", counts: { warrior: 10, mage: 5, priest: 5 } },
  { id: "k10p2m8", label: "10盾2牧8法", counts: { knight: 10, priest: 2, mage: 8 } },
  { id: "k8p2m10", label: "8盾2牧10法", counts: { knight: 8, priest: 2, mage: 10 } },
  { id: "k8p4m8", label: "8盾4牧8法", counts: { knight: 8, priest: 4, mage: 8 } },
  { id: "k10p5m5", label: "10盾5牧5法", counts: { knight: 10, priest: 5, mage: 5 } },
  { id: "k12p4m4", label: "12盾4牧4法", counts: { knight: 12, priest: 4, mage: 4 } },
  { id: "k8p6m6", label: "8盾6牧6法", counts: { knight: 8, priest: 6, mage: 6 } },
  { id: "k8p2r10", label: "8盾2牧10游", counts: { knight: 8, priest: 2, ranger: 10 } },
  { id: "k10p4r6", label: "10盾4牧6游", counts: { knight: 10, priest: 4, ranger: 6 } },
  { id: "k10w6p4", label: "10盾6战4牧", counts: { knight: 10, warrior: 6, priest: 4 } },
  { id: "k6p4m6r4", label: "6盾4牧6法4游", counts: { knight: 6, priest: 4, mage: 6, ranger: 4 } },
  { id: "k10m10", label: "10盾10法", counts: { knight: 10, mage: 10 } },
  { id: "k8m12", label: "8盾12法", counts: { knight: 8, mage: 12 } },
  { id: "k10p10", label: "10盾10牧", counts: { knight: 10, priest: 10 } },
  { id: "k8p12", label: "8盾12牧", counts: { knight: 8, priest: 12 } },
  { id: "w10m10", label: "10战10法", counts: { warrior: 10, mage: 10 } },
  { id: "w8p2m10", label: "8战2牧10法", counts: { warrior: 8, priest: 2, mage: 10 } },
];

function roleSpec(role, index, fullSets) {
  const spec = {
    role,
    name: `${SKILLS.roleKits[role].role}-${index + 1}`,
    ...structuredClone(SKILLS.roleKits[role].kit),
    unitKind: "mock",
  };
  if (!fullSets) return spec;
  const setId = ROLE_SETS[role];
  if (!setId) throw new Error(`No six-piece set mapping for ${role}`);
  return BUILD.applyBuildLayers(spec, {
    equipmentItems: SETS.mockSetItems(setId, 6),
    tags: ["cavalryCounter", "fullSets", setId],
  });
}

function counterTeam(candidate, fullSets) {
  const team = [];
  for (const [role, count] of Object.entries(candidate.counts)) {
    for (let index = 0; index < count; index += 1) team.push(roleSpec(role, index, fullSets));
  }
  if (team.length !== 20) throw new Error(`${candidate.label} has ${team.length} units instead of 20`);
  return team;
}

function round(value, digits = 1) {
  return Number(value.toFixed(digits));
}

function analyze(candidate, loadout) {
  const fullSets = loadout === "fullSets";
  const cavalryTeam = GAME.cavalryMockPlan(20, loadout).leftTeam;
  const opponent = counterTeam(candidate, fullSets);
  const totals = {
    counterWins: 0,
    duration: 0,
    counterAlive: 0,
    cavalryDamage: 0,
    cavalryTeamDamage: 0,
    cavalrySurvival: 0,
    cavalryCount: 0,
    chargeBreakthroughs: 0,
    chargeIntercepts: 0,
  };

  for (let game = 0; game < GAMES; game += 1) {
    const result = COMBAT.simulateTeams(cavalryTeam, opponent, {
      seed: `cavalry-counter|${loadout}|${game}`,
      randomizeStats: true,
      maxTime: 80,
    });
    if (result.winner === "right") totals.counterWins += 1;
    totals.duration += result.duration;
    totals.counterAlive += result.metrics.rightAlive;
    totals.cavalryTeamDamage += result.metrics.leftDamage;
    const cavalry = result.units.filter((unit) => unit.side === "left" && unit.role === "cavalry");
    const cavalryIds = new Set(cavalry.map((unit) => unit.id));
    totals.cavalryDamage += cavalry.reduce((sum, unit) => sum + unit.damageDone, 0);
    totals.cavalrySurvival += cavalry.reduce((sum, unit) => sum + unit.survivalTime, 0);
    totals.cavalryCount += cavalry.length;
    totals.chargeBreakthroughs += result.signals.filter((signal) => signal.kind === "movement" && cavalryIds.has(signal.source?.id) && signal.tags?.includes("breakthrough")).length;
    totals.chargeIntercepts += result.signals.filter((signal) => cavalryIds.has(signal.target?.id) && signal.tags?.includes("chargeIntercept")).length;
  }

  return {
    id: candidate.id,
    label: candidate.label,
    loadout,
    games: GAMES,
    counterWinPct: round(totals.counterWins / GAMES * 100),
    averageDuration: round(totals.duration / GAMES),
    averageCounterAlive: round(totals.counterAlive / GAMES),
    cavalryDamageSharePct: round(totals.cavalryDamage / Math.max(1, totals.cavalryTeamDamage) * 100),
    cavalryDamagePerUnit: round(totals.cavalryDamage / totals.cavalryCount),
    cavalrySurvival: round(totals.cavalrySurvival / totals.cavalryCount),
    breakthroughsPerBattle: round(totals.chargeBreakthroughs / GAMES, 2),
    interceptsPerBattle: round(totals.chargeIntercepts / GAMES, 2),
  };
}

const results = [];
for (const loadout of ["noSets", "fullSets"]) {
  for (const candidate of CANDIDATES) results.push(analyze(candidate, loadout));
}

const grouped = Object.fromEntries(["noSets", "fullSets"].map((loadout) => [
  loadout,
  results
    .filter((result) => result.loadout === loadout)
    .sort((a, b) => b.counterWinPct - a.counterWinPct || b.averageCounterAlive - a.averageCounterAlive),
]));

console.log(JSON.stringify({
  setup: {
    gamesPerCandidate: GAMES,
    scale: "20v20",
    cavalryTeam: "5 cavalry + 5 warrior + 5 mage + 5 priest",
    formation: "first 10 counter units occupy the two front columns",
  },
  results: grouped,
}, null, 2));
