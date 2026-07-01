const fs = require("fs");
const path = require("path");
const { simulateTeams, clonePreset } = require("./combat-sim");
const { ARCHETYPES } = require("./equipment-affix-registry");
const { autoEquipBest, generateItem, VARIANTS } = require("./equipment-auto-iteration");
const { applyEquipmentToTeam, buildToCombatBonus } = require("./equipment-combat-validation");

const OUT_DIR = path.join(__dirname, "..", "design", "equipment_progression");
const OUT_JSON = path.join(OUT_DIR, "equipment-progression-comparison-8teamsets-enhanced-waterline.json");
const OUT_REPORT = path.join(OUT_DIR, "equipment-progression-comparison-8teamsets-enhanced-waterline.md");
const WATERLINE_FILE = path.join(__dirname, "team_pools", "mob-waterline-enhanced-db.json");

const CONFIG = {
  ticks: 30,
  itemsPerTeamPerTick: 3,
  scoreWeights: { average: 0.45, best: 0.35, worst: 0.2 },
  highBucketSamplePerBucket: 12,
  highBuckets: [],
  waterlineMode: "enhanced-full-100",
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
  { id: "s1_front_spell", label: "前排火法", seed: 73129, teamIds: ["bloodRage", "fireBurst", "ironWall"] },
  { id: "s2_status_execute", label: "异常处决", seed: 91871, teamIds: ["poisonBloom", "shadowExecute", "holySustain"] },
  { id: "s3_dot_front", label: "双DOT铁壁", seed: 44221, teamIds: ["fireBurst", "poisonBloom", "ironWall"] },
  { id: "s4_risk_burst_sustain", label: "风险爆发续航", seed: 66513, teamIds: ["bloodRage", "shadowExecute", "holySustain"] },
  { id: "s5_defensive_shells", label: "防御壳", seed: 12017, teamIds: ["ironWall", "holySustain", "bloodRage"] },
  { id: "s6_damage_shells", label: "纯输出压力", seed: 84391, teamIds: ["fireBurst", "poisonBloom", "shadowExecute"] },
  { id: "s7_spell_execute_sustain", label: "法术处决续航", seed: 57133, teamIds: ["fireBurst", "shadowExecute", "holySustain"] },
  { id: "s8_pressure_front", label: "压力前排", seed: 44633, teamIds: ["bloodRage", "poisonBloom", "ironWall"], samplePerBucket: 20 },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const waterline = readJson(WATERLINE_FILE);
  const runs = SCENARIOS.map((scenario) => runScenario(scenario, waterline));
  const synthesis = synthesize(runs);
  const output = {
    schema: "western_fantasy_equipment_progression_comparison_8teamsets_v1",
    generatedAt: new Date().toISOString(),
    config: CONFIG,
    scenarios: runs,
    synthesis,
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_REPORT, renderReport(output), "utf8");
  console.log(renderConsole(output));
}

function runScenario(scenario, waterline) {
  const config = {
    ...CONFIG,
    highBucketSamplePerBucket: scenario.samplePerBucket || CONFIG.highBucketSamplePerBucket,
  };
  const highMobs = pickWaterlineMobs(waterline.teams, config);
  const baseVariant = VARIANTS.find((variant) => variant.id === "v4_extreme_guard") || VARIANTS[0];
  const rng = mulberry32(scenario.seed);
  const teamSet = scenario.teamIds.map((id) => TEAM_LIBRARY[id]);
  const teams = teamSet.map((team) => ({
    ...team,
    inventory: [],
    dropIndex: 0,
    currentBuild: [],
    currentBonus: emptyBonus(),
    equippedTeam: clonePreset(team.id),
  }));

  const timeline = [];
  let lastScores = scoreAllTeams(teams, highMobs, `${scenario.id}|initial`);
  timeline.push(snapshot(0, 0, lastScores, "initial"));

  for (let tick = 1; tick <= config.ticks; tick += 1) {
    const progressionScore = weightedProgressionScore(lastScores, config.scoreWeights);
    const variant = variantForProgression(baseVariant, progressionScore);
    for (const team of teams) {
      const archetype = ARCHETYPES[team.archetypeId];
      for (let i = 0; i < config.itemsPerTeamPerTick; i += 1) {
        team.dropIndex += 1;
        team.inventory.push(generateItem(variant, archetype, rng, team.dropIndex));
      }
      const best = autoEquipBest(team.inventory, archetype);
      team.currentBuild = best.items;
      team.currentBonus = buildToCombatBonus(best.items, team.archetypeId);
      team.equippedTeam = applyEquipmentToTeam(clonePreset(team.id), archetype.role, team.currentBonus);
      team.staticScore = best.score;
    }
    lastScores = scoreAllTeams(teams, highMobs, `${scenario.id}|tick-${tick}`);
    timeline.push(snapshot(tick, progressionScore, lastScores, variant.id));
  }

  const summary = summarizeTimeline(timeline);
  return {
    id: scenario.id,
    label: scenario.label,
    seed: scenario.seed,
    teamSet,
    timeline,
    summary,
    possibleConclusion: possibleConclusion(scenario, teamSet, summary),
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
  for (const mob of mobs) {
    const result = simulateTeams(structuredClone(team.equippedTeam), structuredClone(mob.team), {
      seed: `equipment-progression-teamsets|${seedPrefix}|${team.id}|${mob.id}`,
      randomizeStats: false,
      maxTime: 70,
      healthInterval: 1,
    });
    if (result.winner === "left") wins += 1;
  }
  return {
    id: team.id,
    label: team.label,
    wins,
    games: mobs.length,
    score: round(wins / mobs.length),
    staticScore: round(team.staticScore || 0),
    inventorySize: team.inventory.length,
    bonus: team.currentBonus,
  };
}

function possibleConclusion(scenario, teamSet, summary) {
  const notes = [];
  const ids = new Set(teamSet.map((team) => team.id));
  if (summary.delta.average >= 0.35) notes.push("平均成长明显");
  else notes.push("平均成长偏弱或中等");
  if (summary.end.bestScore >= 0.95) notes.push("最高队接近封顶");
  if (summary.end.worstScore <= 0.35) notes.push("最低队追赶不足");
  if (summary.peaks.spread >= 0.65) notes.push("过程分化严重");
  if (ids.has("fireBurst") && summary.end.bestScore >= 0.95) notes.push("含火法时容易出现封顶队");
  if (ids.has("ironWall") && summary.end.worstScore <= 0.35) notes.push("含铁壁时可能有短板风险");
  if (ids.has("shadowExecute") && summary.end.worstScore <= 0.35) notes.push("含刺杀时稳定性需要观察");
  return notes;
}

function synthesize(runs) {
  const endAverages = runs.map((run) => run.summary.end.averageScore);
  const endBests = runs.map((run) => run.summary.end.bestScore);
  const endWorsts = runs.map((run) => run.summary.end.worstScore);
  const maxSpreads = runs.map((run) => run.summary.peaks.spread);
  const bestWorst = runs.slice().sort((a, b) => b.summary.end.worstScore - a.summary.end.worstScore)[0];
  const bestAverage = runs.slice().sort((a, b) => b.summary.end.averageScore - a.summary.end.averageScore)[0];
  const lowestSpread = runs.slice().sort((a, b) => a.summary.end.spread - b.summary.end.spread)[0];
  return {
    aggregate: {
      averageEndAverage: round(avg(endAverages)),
      averageEndBest: round(avg(endBests)),
      averageEndWorst: round(avg(endWorsts)),
      averageMaxSpread: round(avg(maxSpreads)),
    },
    comparisonLedger: [
      {
        conclusion: "装备循环在不同队伍组合下仍有成长感",
        supportedBy: runs.filter((run) => run.summary.delta.average >= 0.25).map((run) => run.id),
        contradictedBy: runs.filter((run) => run.summary.delta.average < 0.25).map((run) => run.id),
        confidence: "high",
      },
      {
        conclusion: "最高队封顶是跨队伍组合的稳定现象",
        supportedBy: runs.filter((run) => run.summary.end.bestScore >= 0.9).map((run) => run.id),
        contradictedBy: runs.filter((run) => run.summary.end.bestScore < 0.9).map((run) => run.id),
        confidence: "high",
      },
      {
        conclusion: "最低队追赶不足仍然存在，但强度依赖队伍组合",
        supportedBy: runs.filter((run) => run.summary.end.worstScore <= 0.4).map((run) => run.id),
        contradictedBy: runs.filter((run) => run.summary.end.worstScore > 0.4).map((run) => run.id),
        confidence: "medium-high",
      },
      {
        conclusion: "火法是最常见的封顶来源",
        supportedBy: runs.filter((run) => run.teamSet.some((team) => team.id === "fireBurst") && run.summary.end.bestScore >= 0.95).map((run) => run.id),
        contradictedBy: runs.filter((run) => run.teamSet.some((team) => team.id === "fireBurst") && run.summary.end.bestScore < 0.95).map((run) => run.id),
        confidence: "high",
      },
      {
        conclusion: "铁壁/刺杀更容易落成短板或波动源",
        supportedBy: runs.filter((run) => run.summary.end.worstScore <= 0.35 && run.teamSet.some((team) => ["ironWall", "shadowExecute"].includes(team.id))).map((run) => run.id),
        contradictedBy: runs.filter((run) => run.summary.end.worstScore > 0.35 && run.teamSet.some((team) => ["ironWall", "shadowExecute"].includes(team.id))).map((run) => run.id),
        confidence: "medium",
      },
    ],
    bestWorstScenario: { id: bestWorst.id, label: bestWorst.label, endWorst: bestWorst.summary.end.worstScore },
    bestAverageScenario: { id: bestAverage.id, label: bestAverage.label, endAverage: bestAverage.summary.end.averageScore },
    lowestSpreadScenario: { id: lowestSpread.id, label: lowestSpread.label, endSpread: lowestSpread.summary.end.spread },
    finalConclusion: [
      "不同队伍组合下，装备循环依然能提供成长。",
      "最高队封顶比最低队追赶更稳定，是当前循环的第一问题。",
      "最低队追赶不足不是单一经济公式能解决，和队伍/流派吃装备能力有关。",
      "下一步应做封顶衰减和按队伍短板的定向掉落，而不是只改全局掉落质量。",
    ],
  };
}

function snapshot(tick, progressionScore, scores, variantId) {
  return {
    tick,
    progressionScore: round(progressionScore),
    dropQuality: round(progressionScore),
    variantId,
    averageScore: scores.average,
    bestScore: scores.best,
    worstScore: scores.worst,
    spread: scores.spread,
    teams: scores.rows,
  };
}

function summarizeTimeline(timeline) {
  const first = timeline[0];
  const last = timeline[timeline.length - 1];
  return {
    start: pickSummary(first),
    end: pickSummary(last),
    delta: {
      average: round(last.averageScore - first.averageScore),
      best: round(last.bestScore - first.bestScore),
      worst: round(last.worstScore - first.worstScore),
      spread: round(last.spread - first.spread),
    },
    peaks: {
      best: round(Math.max(...timeline.map((row) => row.bestScore))),
      worst: round(Math.max(...timeline.map((row) => row.worstScore))),
      spread: round(Math.max(...timeline.map((row) => row.spread))),
    },
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

function weightedProgressionScore(scores, weights) {
  return round(scores.average * weights.average + scores.best * weights.best + scores.worst * weights.worst);
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

function pickWaterlineMobs(teams, config) {
  if (config.waterlineMode === "enhanced-full-100") return teams;
  const result = [];
  for (const bucket of config.highBuckets) {
    result.push(...teams.filter((team) => team.bucket === bucket).slice(0, config.highBucketSamplePerBucket));
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
  lines.push("# Equipment Progression Comparison - 8 Different Team Sets", "");
  lines.push(`Generated at: ${output.generatedAt}`, "");
  lines.push("## 每次模拟的可能结论", "");
  lines.push("| Run | 队伍组合 | 终局 平均/最高/最低 | 差距峰值 | 可能结论 |");
  lines.push("| --- | --- | --- | ---: | --- |");
  for (const run of output.scenarios) {
    lines.push(`| ${run.id} | ${run.teamSet.map((team) => team.label).join(" / ")} | ${run.summary.end.averageScore}/${run.summary.end.bestScore}/${run.summary.end.worstScore} | ${run.summary.peaks.spread} | ${run.possibleConclusion.join("<br>")} |`);
  }
  lines.push("", "## 对比分析过程", "");
  for (const item of output.synthesis.comparisonLedger) {
    lines.push(`### ${item.conclusion}`, "");
    lines.push(`- Supported by: ${item.supportedBy.join(", ") || "-"}`);
    lines.push(`- Contradicted by: ${item.contradictedBy.join(", ") || "-"}`);
    lines.push(`- Confidence: ${item.confidence}`, "");
  }
  lines.push("## 汇总指标", "");
  lines.push(`- 平均终局平均分: ${output.synthesis.aggregate.averageEndAverage}`);
  lines.push(`- 平均终局最高分: ${output.synthesis.aggregate.averageEndBest}`);
  lines.push(`- 平均终局最低分: ${output.synthesis.aggregate.averageEndWorst}`);
  lines.push(`- 平均最大差距: ${output.synthesis.aggregate.averageMaxSpread}`);
  lines.push(`- 最能拉最低队: ${output.synthesis.bestWorstScenario.label} (${output.synthesis.bestWorstScenario.endWorst})`);
  lines.push(`- 平均分最高: ${output.synthesis.bestAverageScenario.label} (${output.synthesis.bestAverageScenario.endAverage})`);
  lines.push(`- 终局差距最低: ${output.synthesis.lowestSpreadScenario.label} (${output.synthesis.lowestSpreadScenario.endSpread})`, "");
  lines.push("## 最终结论", "");
  for (const conclusion of output.synthesis.finalConclusion) lines.push(`- ${conclusion}`);
  lines.push("", "## 建议下一步", "");
  lines.push("- 做封顶衰减：最高队水桶分超过 0.85 后，最高分权重逐步转移给平均分和最低分。");
  lines.push("- 做短板定向掉落：最低队低于平均队 0.25 以上时，提高该队适配词条或装备分配权重。");
  lines.push("- 单独检查火法为什么最容易封顶，以及铁壁/刺杀为什么容易成为短板或波动源。");
  return `${lines.join("\n")}\n`;
}

function renderConsole(output) {
  return [
    "Equipment progression comparison with enhanced waterline complete.",
    `runs=${output.scenarios.length}`,
    `avgEnd=${output.synthesis.aggregate.averageEndAverage}, bestEnd=${output.synthesis.aggregate.averageEndBest}, worstEnd=${output.synthesis.aggregate.averageEndWorst}`,
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
