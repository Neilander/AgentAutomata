const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");
const { ARCHETYPES } = require("./equipment-affix-registry");
const { autoEquipBest, generateItem, VARIANTS } = require("./equipment-auto-iteration");
const { applyEquipmentToTeam, buildToCombatBonus } = require("./equipment-combat-validation");

const OUT_DIR = path.join(__dirname, "..", "design", "equipment_progression");
const OUT_JSON = path.join(OUT_DIR, "equipment-progression-loop-simulation.json");
const OUT_REPORT = path.join(OUT_DIR, "equipment-progression-loop-report.md");
const WATERLINE_FILE = path.join(__dirname, "team_pools", "mob-waterline-db.json");

const CONFIG = {
  ticks: 30,
  itemsPerTick: 9,
  itemsPerTeamPerTick: 3,
  scoreWeights: { average: 0.45, best: 0.35, worst: 0.2 },
  highBucketSamplePerBucket: 12,
  highBuckets: ["13_14", "15_17"],
  seed: 73129,
};

const PLAYER_TEAMS = [
  { id: "bloodRage", label: "低血狂战队", archetypeId: "lowHealthBerserker" },
  { id: "fireBurst", label: "火法燃烧队", archetypeId: "fireMage" },
  { id: "ironWall", label: "铁壁骑士队", archetypeId: "ironKnight" },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const waterline = readJson(WATERLINE_FILE);
  const highMobs = pickHighBucketMobs(waterline.teams);
  const baseVariant = VARIANTS.find((variant) => variant.id === "v4_extreme_guard") || VARIANTS[0];
  const rng = mulberry32(CONFIG.seed);
  const teams = PLAYER_TEAMS.map((team) => ({
    ...team,
    inventory: [],
    dropIndex: 0,
    currentBuild: [],
    currentBonus: emptyBonus(),
    equippedTeam: clonePreset(team.id),
  }));

  const timeline = [];
  let lastScores = scoreAllTeams(teams, highMobs, "initial");
  timeline.push(snapshot(0, 0, teams, lastScores, "initial"));

  for (let tick = 1; tick <= CONFIG.ticks; tick += 1) {
    const progressionScore = weightedProgressionScore(lastScores);
    const variant = variantForProgression(baseVariant, progressionScore);
    for (const team of teams) {
      const archetype = ARCHETYPES[team.archetypeId];
      for (let i = 0; i < CONFIG.itemsPerTeamPerTick; i += 1) {
        team.dropIndex += 1;
        team.inventory.push(generateItem(variant, archetype, rng, team.dropIndex));
      }
      const best = autoEquipBest(team.inventory, archetype);
      team.currentBuild = best.items;
      team.currentBonus = buildToCombatBonus(best.items, team.archetypeId);
      team.equippedTeam = applyEquipmentToTeam(clonePreset(team.id), archetype.role, team.currentBonus);
      team.staticScore = best.score;
    }
    lastScores = scoreAllTeams(teams, highMobs, `tick-${tick}`);
    timeline.push(snapshot(tick, progressionScore, teams, lastScores, variant.id));
  }

  const output = {
    schema: "western_fantasy_equipment_progression_loop_v1",
    generatedAt: new Date().toISOString(),
    config: CONFIG,
    playerTeams: PLAYER_TEAMS,
    waterline: {
      source: path.relative(path.dirname(OUT_JSON), WATERLINE_FILE).replace(/\\/g, "/"),
      sampleSize: highMobs.length,
      buckets: CONFIG.highBuckets,
    },
    timeline,
    summary: summarizeTimeline(timeline),
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_REPORT, renderReport(output), "utf8");
  console.log(renderConsole(output));
}

function scoreAllTeams(teams, mobs, seedPrefix) {
  const rows = teams.map((team) => scoreTeam(team, mobs, seedPrefix));
  const scores = rows.map((row) => row.score);
  return {
    average: round(avg(scores), 3),
    best: round(Math.max(...scores), 3),
    worst: round(Math.min(...scores), 3),
    spread: round(Math.max(...scores) - Math.min(...scores), 3),
    rows,
  };
}

function scoreTeam(team, mobs, seedPrefix) {
  let wins = 0;
  for (const mob of mobs) {
    const result = simulateTeams(structuredClone(team.equippedTeam), structuredClone(mob.team), {
      seed: `equipment-progression|${seedPrefix}|${team.id}|${mob.id}`,
      randomizeStats: false,
      maxTime: 70,
      healthInterval: 1,
    });
    if (result.winner === "left") wins += 1;
  }
  return {
    id: team.id,
    label: team.label,
    archetypeId: team.archetypeId,
    wins,
    games: mobs.length,
    score: round(wins / mobs.length, 3),
    staticScore: round(team.staticScore || 0),
    inventorySize: team.inventory.length,
    bonus: team.currentBonus,
  };
}

function weightedProgressionScore(scores) {
  const { average, best, worst } = CONFIG.scoreWeights;
  return round(scores.average * average + scores.best * best + scores.worst * worst, 3);
}

function variantForProgression(baseVariant, progressionScore) {
  const quality = clamp(progressionScore, 0, 1);
  const rareLift = 1 + quality * 1.35;
  const epicLift = 1 + quality * 2.1;
  const roughCut = 1 - quality * 0.45;
  const commonCut = 1 - quality * 0.22;
  const base = baseVariant.rule.rarityWeights || {};
  return {
    ...baseVariant,
    id: `${baseVariant.id}_progression_${Math.round(quality * 100)}`,
    label: `${baseVariant.label} progression ${Math.round(quality * 100)}`,
    rule: {
      ...baseVariant.rule,
      rarityWeights: {
        rough: round((base.rough ?? 28) * roughCut, 3),
        common: round((base.common ?? 31) * commonCut, 3),
        fine: round((base.fine ?? 24) * (1 + quality * 0.18), 3),
        rare: round((base.rare ?? 13) * rareLift, 3),
        epic: round((base.epic ?? 4) * epicLift, 3),
      },
      baseStatGlobalMult: round((baseVariant.rule.baseStatGlobalMult || 1) * (1 + quality * 0.18), 3),
      requiredAffixWeight: round((baseVariant.rule.requiredAffixWeight || 1) * (1 + quality * 0.12), 3),
      archetypeAffixWeight: round((baseVariant.rule.archetypeAffixWeight || 1) * (1 + quality * 0.08), 3),
    },
  };
}

function snapshot(tick, progressionScore, teams, scores, variantId) {
  return {
    tick,
    progressionScore: round(progressionScore, 3),
    dropQuality: round(progressionScore, 3),
    variantId,
    averageScore: scores.average,
    bestScore: scores.best,
    worstScore: scores.worst,
    spread: scores.spread,
    teams: scores.rows.map((row) => ({
      id: row.id,
      label: row.label,
      score: row.score,
      wins: row.wins,
      games: row.games,
      staticScore: row.staticScore,
      inventorySize: row.inventorySize,
      bonus: row.bonus,
    })),
  };
}

function summarizeTimeline(timeline) {
  const first = timeline[0];
  const last = timeline[timeline.length - 1];
  const bestPeak = Math.max(...timeline.map((row) => row.bestScore));
  const worstPeak = Math.max(...timeline.map((row) => row.worstScore));
  const maxSpread = Math.max(...timeline.map((row) => row.spread));
  return {
    start: pickSummary(first),
    end: pickSummary(last),
    delta: {
      average: round(last.averageScore - first.averageScore, 3),
      best: round(last.bestScore - first.bestScore, 3),
      worst: round(last.worstScore - first.worstScore, 3),
      spread: round(last.spread - first.spread, 3),
    },
    peaks: { best: round(bestPeak, 3), worst: round(worstPeak, 3), spread: round(maxSpread, 3) },
    interpretation: interpret(first, last, maxSpread),
  };
}

function pickSummary(row) {
  return {
    tick: row.tick,
    averageScore: row.averageScore,
    bestScore: row.bestScore,
    worstScore: row.worstScore,
    spread: row.spread,
    progressionScore: row.progressionScore,
  };
}

function interpret(first, last, maxSpread) {
  const notes = [];
  if (last.averageScore > first.averageScore + 0.15) notes.push("average team power grows visibly");
  if (last.bestScore > first.bestScore + 0.15) notes.push("top team growth is visible");
  if (last.worstScore <= first.worstScore + 0.05) notes.push("weakest team barely improves");
  if (maxSpread > 0.45) notes.push("team gap becomes large; catch-up pressure is needed");
  if (last.bestScore >= 0.9) notes.push("top team approaches high-bucket ceiling");
  if (!notes.length) notes.push("growth is mild and probably too flat");
  return notes;
}

function pickHighBucketMobs(teams) {
  const result = [];
  for (const bucket of CONFIG.highBuckets) {
    const rows = teams.filter((team) => team.bucket === bucket).slice(0, CONFIG.highBucketSamplePerBucket);
    result.push(...rows);
  }
  return result;
}

function emptyBonus() {
  return {
    maxHpAdd: 0,
    physicalPowerAdd: 0,
    magicPowerAdd: 0,
    armorAdd: 0,
    attackSpeedMult: 1,
    skillHasteMult: 1,
    effectPowerMult: 1,
    effectResistPct: 0,
    receivedHealingMult: 1,
    notes: [],
  };
}

function renderReport(output) {
  const lines = [];
  lines.push("# Equipment Progression Loop Simulation");
  lines.push("");
  lines.push(`Generated at: ${output.generatedAt}`);
  lines.push("");
  lines.push("## Setup");
  lines.push("");
  lines.push(`- Player teams: ${output.playerTeams.map((team) => `${team.label} \`${team.id}\``).join(", ")}`);
  lines.push(`- Ticks: ${output.config.ticks}`);
  lines.push(`- Items per tick: ${output.config.itemsPerTick}, split as ${output.config.itemsPerTeamPerTick} per team`);
  lines.push(`- High bucket sample: ${output.waterline.sampleSize} teams from ${output.waterline.buckets.join(", ")}`);
  lines.push(`- Drop quality score: average ${output.config.scoreWeights.average}, best ${output.config.scoreWeights.best}, worst ${output.config.scoreWeights.worst}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Start average / best / worst: ${output.summary.start.averageScore} / ${output.summary.start.bestScore} / ${output.summary.start.worstScore}`);
  lines.push(`- End average / best / worst: ${output.summary.end.averageScore} / ${output.summary.end.bestScore} / ${output.summary.end.worstScore}`);
  lines.push(`- Delta average / best / worst: ${output.summary.delta.average} / ${output.summary.delta.best} / ${output.summary.delta.worst}`);
  lines.push(`- Max spread: ${output.summary.peaks.spread}`);
  lines.push(`- Interpretation: ${output.summary.interpretation.join("; ")}`);
  lines.push("");
  lines.push("## Timeline");
  lines.push("");
  lines.push("| Tick | Drop quality | Average | Best | Worst | Spread | Team scores |");
  lines.push("| ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const row of output.timeline.filter((item) => item.tick === 0 || item.tick % 3 === 0 || item.tick === output.config.ticks)) {
    lines.push(`| ${row.tick} | ${row.dropQuality} | ${row.averageScore} | ${row.bestScore} | ${row.worstScore} | ${row.spread} | ${row.teams.map((team) => `${team.label}:${team.score}`).join("<br>")} |`);
  }
  lines.push("");
  lines.push("## Final Bonuses");
  lines.push("");
  for (const team of output.timeline[output.timeline.length - 1].teams) {
    const b = team.bonus;
    lines.push(`- ${team.label}: HP +${b.maxHpAdd}, phys +${b.physicalPowerAdd}, magic +${b.magicPowerAdd}, armor +${b.armorAdd}, atk x${b.attackSpeedMult}, haste x${b.skillHasteMult}, effect x${b.effectPowerMult}, resist ${b.effectResistPct}, heal x${b.receivedHealingMult}`);
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- This is a fast loop simulation, not a final economy model.");
  lines.push("- It uses high-bucket mob waterline samples instead of the full 500-team waterline.");
  lines.push("- The goal is to observe score trajectory shape: average, best, worst, and spread.");
  return `${lines.join("\n")}\n`;
}

function renderConsole(output) {
  const s = output.summary;
  return [
    "Equipment progression loop simulation complete.",
    `start avg/best/worst=${s.start.averageScore}/${s.start.bestScore}/${s.start.worstScore}`,
    `end avg/best/worst=${s.end.averageScore}/${s.end.bestScore}/${s.end.worstScore}`,
    `delta avg/best/worst=${s.delta.average}/${s.delta.best}/${s.delta.worst}`,
    `report=${OUT_REPORT}`,
  ].join("\n");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function mulberry32(seed) {
  return function rng() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

if (require.main === module) main();

module.exports = { main };

