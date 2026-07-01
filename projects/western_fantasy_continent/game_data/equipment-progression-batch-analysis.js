const fs = require("fs");
const path = require("path");
const { simulateTeams, clonePreset } = require("./combat-sim");
const { ARCHETYPES } = require("./equipment-affix-registry");
const { autoEquipBest, generateItem, VARIANTS } = require("./equipment-auto-iteration");
const { applyEquipmentToTeam, buildToCombatBonus } = require("./equipment-combat-validation");

const OUT_DIR = path.join(__dirname, "..", "design", "equipment_progression");
const OUT_JSON = path.join(OUT_DIR, "equipment-progression-batch-analysis.json");
const OUT_REPORT = path.join(OUT_DIR, "equipment-progression-batch-analysis.md");
const WATERLINE_FILE = path.join(__dirname, "team_pools", "mob-waterline-enhanced-db.json");

const CONFIG = {
  ticks: Number(process.env.EQUIP_TICKS || 30),
  itemsPerTeamPerTick: Number(process.env.EQUIP_ITEMS_PER_TICK || 3),
  waterlineSample: Number(process.env.EQUIP_WATERLINE_SAMPLE || 60),
  scoreWeights: { average: 0.45, best: 0.35, worst: 0.2 },
  satisfyingJump: 0.05,
  capScore: 0.95,
  lowFloor: 0.4,
};

const TEAM_LIBRARY = {
  bloodRage: { id: "bloodRage", label: "低血狂战", archetypeId: "lowHealthBerserker" },
  fireBurst: { id: "fireBurst", label: "火法燃烧", archetypeId: "fireMage" },
  poisonBloom: { id: "poisonBloom", label: "剧毒绽放", archetypeId: "poisonBloom" },
  shadowExecute: { id: "shadowExecute", label: "暗影处决", archetypeId: "shadowAssassin" },
  ironWall: { id: "ironWall", label: "铁壁反击", archetypeId: "ironKnight" },
  holySustain: { id: "holySustain", label: "圣光续航", archetypeId: "holySustain" },
};

const SCENARIOS = [
  { id: "front_spell_a", seed: 73129, teamIds: ["bloodRage", "fireBurst", "ironWall"] },
  { id: "front_spell_b", seed: 73130, teamIds: ["bloodRage", "fireBurst", "ironWall"] },
  { id: "status_execute_a", seed: 91871, teamIds: ["poisonBloom", "shadowExecute", "holySustain"] },
  { id: "status_execute_b", seed: 91872, teamIds: ["poisonBloom", "shadowExecute", "holySustain"] },
  { id: "double_dot_front_a", seed: 44221, teamIds: ["fireBurst", "poisonBloom", "ironWall"] },
  { id: "double_dot_front_b", seed: 44222, teamIds: ["fireBurst", "poisonBloom", "ironWall"] },
  { id: "risk_burst_sustain", seed: 66513, teamIds: ["bloodRage", "shadowExecute", "holySustain"] },
  { id: "defensive_shells", seed: 12017, teamIds: ["ironWall", "holySustain", "bloodRage"] },
  { id: "damage_shells_a", seed: 84391, teamIds: ["fireBurst", "poisonBloom", "shadowExecute"] },
  { id: "damage_shells_b", seed: 84392, teamIds: ["fireBurst", "poisonBloom", "shadowExecute"] },
  { id: "spell_execute_sustain", seed: 57133, teamIds: ["fireBurst", "shadowExecute", "holySustain"] },
  { id: "pressure_front", seed: 44633, teamIds: ["bloodRage", "poisonBloom", "ironWall"] },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const waterline = sampleWaterline(readJson(WATERLINE_FILE).teams, CONFIG.waterlineSample);
  const runs = SCENARIOS.map((scenario) => runScenario(scenario, waterline));
  const output = {
    schema: "western_fantasy_equipment_progression_batch_analysis_v1",
    generatedAt: new Date().toISOString(),
    config: CONFIG,
    waterlineTeams: waterline.length,
    runs,
    synthesis: synthesize(runs),
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_REPORT, renderReport(output), "utf8");
  console.log(renderConsole(output));
}

function runScenario(scenario, waterline) {
  const baseVariant = VARIANTS.find((variant) => variant.id === "v4_extreme_guard") || VARIANTS[0];
  const rng = mulberry32(scenario.seed);
  const teams = scenario.teamIds.map((id) => {
    const team = TEAM_LIBRARY[id];
    return {
      ...team,
      inventory: [],
      dropIndex: 0,
      currentBuild: [],
      currentBonus: emptyBonus(),
      equippedTeam: clonePreset(team.id),
    };
  });

  const timeline = [];
  let lastScores = scoreAllTeams(teams, waterline, `${scenario.id}|initial`);
  timeline.push(snapshot(0, 0, lastScores, "initial"));

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
    lastScores = scoreAllTeams(teams, waterline, `${scenario.id}|tick-${tick}`);
    timeline.push(snapshot(tick, progressionScore, lastScores, variant.id));
  }

  return {
    id: scenario.id,
    seed: scenario.seed,
    teamIds: scenario.teamIds,
    timeline,
    summary: summarizeRun(timeline),
    teamSummaries: summarizeTeams(timeline),
  };
}

function scoreAllTeams(teams, mobs, seedPrefix) {
  const rows = teams.map((team) => scoreTeam(team, mobs, seedPrefix));
  const values = rows.map((row) => row.score);
  return {
    average: round(avg(values)),
    best: round(Math.max(...values)),
    worst: round(Math.min(...values)),
    spread: round(Math.max(...values) - Math.min(...values)),
    rows,
  };
}

function scoreTeam(team, mobs, seedPrefix) {
  let wins = 0;
  let damage = 0;
  let dotDamage = 0;
  let duration = 0;
  for (const mob of mobs) {
    const result = simulateTeams(structuredClone(team.equippedTeam), structuredClone(mob.team), {
      seed: `equipment-batch|${seedPrefix}|${team.id}|${mob.id}`,
      randomizeStats: false,
      maxTime: 70,
      healthInterval: 1,
    });
    if (result.winner === "left") wins += 1;
    damage += result.metrics.leftDamage || 0;
    dotDamage += result.metrics.leftDotDamage || 0;
    duration += result.duration || 0;
  }
  return {
    id: team.id,
    label: team.label,
    archetypeId: team.archetypeId,
    wins,
    games: mobs.length,
    score: round(wins / mobs.length),
    avgDamage: Math.round(damage / mobs.length),
    avgDotDamage: Math.round(dotDamage / mobs.length),
    avgDuration: round(duration / mobs.length, 1),
    staticScore: round(team.staticScore || 0),
    inventorySize: team.inventory.length,
    bonus: team.currentBonus,
  };
}

function snapshot(tick, progressionScore, scores, variantId) {
  return {
    tick,
    progressionScore: round(progressionScore),
    variantId,
    averageScore: scores.average,
    bestScore: scores.best,
    worstScore: scores.worst,
    spread: scores.spread,
    teams: scores.rows,
  };
}

function summarizeRun(timeline) {
  const first = timeline[0];
  const last = timeline[timeline.length - 1];
  const averageSeries = timeline.map((row) => row.averageScore);
  const jumps = seriesJumps(averageSeries);
  return {
    start: pickRunSummary(first),
    end: pickRunSummary(last),
    deltaAverage: round(last.averageScore - first.averageScore),
    deltaBest: round(last.bestScore - first.bestScore),
    deltaWorst: round(last.worstScore - first.worstScore),
    satisfyingJumps: jumps.filter((jump) => jump >= CONFIG.satisfyingJump).length,
    maxJump: round(Math.max(...jumps, 0)),
    plateauTicks: countPlateauTicks(averageSeries),
    capTicks: timeline.filter((row) => row.bestScore >= CONFIG.capScore).length,
    lowFloorTicks: timeline.filter((row) => row.worstScore <= CONFIG.lowFloor).length,
    finalSpread: last.spread,
    feel: feelVerdict({ first, last, jumps, timeline }),
  };
}

function summarizeTeams(timeline) {
  const ids = timeline[0].teams.map((team) => team.id);
  return ids.map((id) => {
    const series = timeline.map((row) => row.teams.find((team) => team.id === id));
    const scoreSeries = series.map((row) => row.score);
    const jumps = seriesJumps(scoreSeries);
    const first = series[0];
    const last = series[series.length - 1];
    return {
      id,
      label: last.label,
      archetypeId: last.archetypeId,
      startScore: first.score,
      endScore: last.score,
      delta: round(last.score - first.score),
      satisfyingJumps: jumps.filter((jump) => jump >= CONFIG.satisfyingJump).length,
      maxJump: round(Math.max(...jumps, 0)),
      capTicks: series.filter((row) => row.score >= CONFIG.capScore).length,
      plateauTicks: countPlateauTicks(scoreSeries),
      finalBonus: last.bonus,
      finalStaticScore: last.staticScore,
      avgDamage: last.avgDamage,
      avgDotDamage: last.avgDotDamage,
    };
  });
}

function feelVerdict({ first, last, jumps, timeline }) {
  const gain = last.averageScore - first.averageScore;
  const satisfying = jumps.filter((jump) => jump >= CONFIG.satisfyingJump).length;
  const capTicks = timeline.filter((row) => row.bestScore >= CONFIG.capScore).length;
  const lowFloorTicks = timeline.filter((row) => row.worstScore <= CONFIG.lowFloor).length;
  if (capTicks >= 12) return "overcap-risk";
  if (gain >= 0.25 && satisfying >= 3 && lowFloorTicks <= 12) return "good-growth";
  if (gain >= 0.18 && satisfying >= 2) return "acceptable-growth";
  if (gain < 0.12) return "weak-growth";
  return "uneven-growth";
}

function synthesize(runs) {
  const allTeams = runs.flatMap((run) => run.teamSummaries.map((team) => ({ ...team, runId: run.id })));
  const byTeam = {};
  for (const team of allTeams) {
    byTeam[team.id] ||= [];
    byTeam[team.id].push(team);
  }
  const archetypes = Object.fromEntries(Object.entries(byTeam).map(([id, rows]) => [id, {
    runs: rows.length,
    avgEnd: round(avg(rows.map((row) => row.endScore))),
    avgDelta: round(avg(rows.map((row) => row.delta))),
    avgSatisfyingJumps: round(avg(rows.map((row) => row.satisfyingJumps))),
    totalCapTicks: rows.reduce((sum, row) => sum + row.capTicks, 0),
    avgPlateauTicks: round(avg(rows.map((row) => row.plateauTicks))),
    maxFinalStaticScore: round(Math.max(...rows.map((row) => row.finalStaticScore))),
    examples: rows.slice(0, 3).map((row) => ({ runId: row.runId, endScore: row.endScore, delta: row.delta, capTicks: row.capTicks, bonus: row.finalBonus })),
  }]));

  const overcapTeams = allTeams
    .filter((team) => team.endScore >= CONFIG.capScore || team.capTicks >= 8)
    .sort((a, b) => b.endScore - a.endScore || b.capTicks - a.capTicks)
    .slice(0, 12);
  const weakGrowthTeams = allTeams
    .filter((team) => team.delta < 0.15 || team.endScore < CONFIG.lowFloor)
    .sort((a, b) => a.endScore - b.endScore || a.delta - b.delta)
    .slice(0, 12);
  return {
    runs: runs.length,
    averageEndAverage: round(avg(runs.map((run) => run.summary.end.averageScore))),
    averageDeltaAverage: round(avg(runs.map((run) => run.summary.deltaAverage))),
    averageSatisfyingJumps: round(avg(runs.map((run) => run.summary.satisfyingJumps))),
    feelCounts: countBy(runs.map((run) => run.summary.feel)),
    archetypes,
    overcapTeams,
    weakGrowthTeams,
    conclusion: makeConclusion({ runs, archetypes, overcapTeams, weakGrowthTeams }),
  };
}

function makeConclusion({ runs, archetypes, overcapTeams, weakGrowthTeams }) {
  const notes = [];
  const goodOrAcceptable = runs.filter((run) => ["good-growth", "acceptable-growth"].includes(run.summary.feel)).length;
  notes.push(`${goodOrAcceptable}/${runs.length} runs have acceptable or good growth feel.`);
  if (overcapTeams.length) notes.push(`Overcap exists: ${[...new Set(overcapTeams.map((team) => team.id))].join(", ")}.`);
  if (weakGrowthTeams.length) notes.push(`Weak growth exists: ${[...new Set(weakGrowthTeams.map((team) => team.id))].join(", ")}.`);
  if ((archetypes.fireBurst?.totalCapTicks || 0) > 0 || (archetypes.poisonBloom?.totalCapTicks || 0) > 0) notes.push("Fire/poison still need equipment-specific checks, even after attribute haste tuning.");
  return notes;
}

function renderReport(output) {
  const lines = [];
  lines.push("# Equipment Progression Batch Analysis", "");
  lines.push(`Generated at: ${output.generatedAt}`);
  lines.push(`Runs: ${output.synthesis.runs}; waterline sample: ${output.waterlineTeams}; ticks: ${output.config.ticks}; items/team/tick: ${output.config.itemsPerTeamPerTick}`, "");
  lines.push("## Summary", "");
  lines.push(`- Average final team-set score: ${output.synthesis.averageEndAverage}`);
  lines.push(`- Average score gain: ${output.synthesis.averageDeltaAverage}`);
  lines.push(`- Average satisfying jumps per run: ${output.synthesis.averageSatisfyingJumps}`);
  lines.push(`- Feel counts: ${JSON.stringify(output.synthesis.feelCounts)}`);
  for (const note of output.synthesis.conclusion) lines.push(`- ${note}`);
  lines.push("");
  lines.push("## Archetype Aggregate", "");
  lines.push("| Team | Runs | Avg End | Avg Gain | Avg Jumps | Cap Ticks | Avg Plateau | Max Static |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const [id, row] of Object.entries(output.synthesis.archetypes)) {
    lines.push(`| ${id} | ${row.runs} | ${row.avgEnd} | ${row.avgDelta} | ${row.avgSatisfyingJumps} | ${row.totalCapTicks} | ${row.avgPlateauTicks} | ${row.maxFinalStaticScore} |`);
  }
  lines.push("");
  lines.push("## Runs", "");
  lines.push("| Run | Teams | Start Avg | End Avg | Gain | Jumps | Max Jump | Cap Ticks | Low Floor Ticks | Feel |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const run of output.runs) {
    lines.push(`| ${run.id} | ${run.teamIds.join(" / ")} | ${run.summary.start.averageScore} | ${run.summary.end.averageScore} | ${run.summary.deltaAverage} | ${run.summary.satisfyingJumps} | ${run.summary.maxJump} | ${run.summary.capTicks} | ${run.summary.lowFloorTicks} | ${run.summary.feel} |`);
  }
  lines.push("");
  lines.push("## Overcap Watch", "");
  if (!output.synthesis.overcapTeams.length) lines.push("- None.");
  for (const team of output.synthesis.overcapTeams) {
    lines.push(`- ${team.runId} / ${team.id}: end ${team.endScore}, gain ${team.delta}, capTicks ${team.capTicks}, bonus ${bonusText(team.finalBonus)}`);
  }
  lines.push("");
  lines.push("## Weak Growth Watch", "");
  if (!output.synthesis.weakGrowthTeams.length) lines.push("- None.");
  for (const team of output.synthesis.weakGrowthTeams) {
    lines.push(`- ${team.runId} / ${team.id}: end ${team.endScore}, gain ${team.delta}, capTicks ${team.capTicks}, bonus ${bonusText(team.finalBonus)}`);
  }
  lines.push("");
  lines.push("## Readout", "");
  lines.push("- A satisfying jump is a score increase of at least 0.05 in one tick.");
  lines.push("- Cap risk means score reaches 0.95 or above for many ticks.");
  lines.push("- Plateau ticks count nearly-flat ticks below 0.01 score change.");
  return `${lines.join("\n")}\n`;
}

function renderConsole(output) {
  return [
    "Equipment progression batch analysis complete.",
    `runs=${output.synthesis.runs} sample=${output.waterlineTeams}`,
    `avgEnd=${output.synthesis.averageEndAverage} avgGain=${output.synthesis.averageDeltaAverage} avgJumps=${output.synthesis.averageSatisfyingJumps}`,
    `feel=${JSON.stringify(output.synthesis.feelCounts)}`,
    `report=${OUT_REPORT}`,
  ].join("\n");
}

function bonusText(bonus) {
  return `hp+${bonus.maxHpAdd}, phys+${bonus.physicalPowerAdd}, magic+${bonus.magicPowerAdd}, armor+${bonus.armorAdd}, atkSpd x${bonus.attackSpeedMult}, haste x${bonus.skillHasteMult}, effect x${bonus.effectPowerMult}`;
}

function pickRunSummary(row) {
  return {
    tick: row.tick,
    averageScore: row.averageScore,
    bestScore: row.bestScore,
    worstScore: row.worstScore,
    spread: row.spread,
  };
}

function seriesJumps(series) {
  const jumps = [];
  for (let i = 1; i < series.length; i += 1) jumps.push(round(series[i] - series[i - 1]));
  return jumps;
}

function countPlateauTicks(series) {
  return seriesJumps(series).filter((jump) => Math.abs(jump) < 0.01).length;
}

function weightedProgressionScore(scores) {
  return round(scores.average * CONFIG.scoreWeights.average + scores.best * CONFIG.scoreWeights.best + scores.worst * CONFIG.scoreWeights.worst);
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
    rule: {
      ...baseVariant.rule,
      rarityWeights: {
        rough: round((base.rough ?? 28) * roughCut),
        common: round((base.common ?? 31) * commonCut),
        fine: round((base.fine ?? 24) * (1 + quality * 0.18)),
        rare: round((base.rare ?? 13) * rareLift),
        epic: round((base.epic ?? 4) * epicLift),
      },
      baseStatGlobalMult: round((baseVariant.rule.baseStatGlobalMult || 1) * (1 + quality * 0.18)),
      requiredAffixWeight: round((baseVariant.rule.requiredAffixWeight || 1) * (1 + quality * 0.12)),
      archetypeAffixWeight: round((baseVariant.rule.archetypeAffixWeight || 1) * (1 + quality * 0.08)),
    },
  };
}

function sampleWaterline(teams, sampleSize) {
  if (!sampleSize || teams.length <= sampleSize) return teams;
  const result = [];
  for (let i = 0; i < sampleSize; i += 1) result.push(teams[Math.floor(i * teams.length / sampleSize)]);
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

function countBy(values) {
  return values.reduce((out, value) => {
    out[value] = (out[value] || 0) + 1;
    return out;
  }, {});
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
