const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");
const { ROLE_ATTRS, ATTR_ORDER, applyBuildLayers } = require("./build-layers");

const DB_DIR = path.join(__dirname, "team_pools");
const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const SOURCE_WATERLINE_FILE = path.join(DB_DIR, "mob-waterline-db.json");
const OUT_JSON = path.join(DB_DIR, "mob-waterline-enhanced-db.json");
const OUT_REPORT = path.join(OUT_DIR, "mob-waterline-enhanced-report.md");

const TARGET_TOTAL = 100;
const TARGET_BASE_SCORE = 30;
const TARGET_BASE_RATE = TARGET_BASE_SCORE / 100;
const FIXED_PRESETS = Object.keys(SKILL_DATA.presets || {});
const SOURCE_PER_BUCKET = 35;

const DIFFICULTY_BUCKETS = [
  { key: "00_10", label: "0-10", min: 0, max: 0.1, target: 17 },
  { key: "10_20", label: "10-20", min: 0.1, max: 0.2, target: 17 },
  { key: "20_30", label: "20-30", min: 0.2, max: 0.3, target: 16 },
  { key: "30_40", label: "30-40", min: 0.3, max: 0.4, target: 17 },
  { key: "40_50", label: "40-50", min: 0.4, max: 0.5, target: 17 },
  { key: "50_60", label: "50-60", min: 0.5, max: 0.6, target: 16 },
];

const BOOSTS = [
  { id: "base", label: "基础", all: 0, specialty: 0 },
  { id: "all1", label: "全属性+1", all: 1, specialty: 0 },
  { id: "all2", label: "全属性+2", all: 2, specialty: 0 },
  { id: "spec3", label: "专业属性+3", all: 0, specialty: 3 },
  { id: "spec5", label: "专业属性+5", all: 0, specialty: 5 },
  { id: "all1_spec4", label: "全属性+1 专业+4", all: 1, specialty: 4 },
  { id: "all2_spec6", label: "全属性+2 专业+6", all: 2, specialty: 6 },
  { id: "all3_spec8", label: "全属性+3 专业+8", all: 3, specialty: 8 },
  { id: "all4_spec10", label: "全属性+4 专业+10", all: 4, specialty: 10 },
];

function main() {
  const source = readJson(SOURCE_WATERLINE_FILE);
  const basePresets = FIXED_PRESETS.map((id) => ({ id, name: SKILL_DATA.presets[id].name || id, team: clonePreset(id) }));
  const sourceTeams = selectSourceTeams(source.teams);
  const candidates = [];
  for (const mob of sourceTeams) {
    for (const boost of BOOSTS) {
      const team = boostTeam(mob.team, boost);
      const evaluation = evaluateCandidate(team, basePresets, `${mob.id}|${boost.id}`);
      candidates.push({
        id: `${mob.id}-${boost.id}`,
        sourceId: mob.id,
        name: `${mob.name || mob.id} ${boost.label}`,
        sourceBucket: mob.bucket,
        sourceScore: mob.evaluation?.score ?? 0,
        boost,
        team,
        evaluation,
        difficultyBucket: bucketForBaseWinRate(evaluation.baseWinRate).key,
      });
    }
  }
  const selected = selectUniform(candidates);
  const baseScore = summarizeBaseScore(selected);
  const db = {
    schema: "western_fantasy_enhanced_mob_waterline_v1",
    generatedAt: new Date().toISOString(),
    source: path.relative(DB_DIR, SOURCE_WATERLINE_FILE).replace(/\\/g, "/"),
    target: {
      teams: TARGET_TOTAL,
      baseScore: TARGET_BASE_SCORE,
      baseWinRate: TARGET_BASE_RATE,
      distribution: "near-uniform over base-preset win-rate 0-60, so the current no-growth baseline averages near 30/100",
    },
    fixedPresetCount: basePresets.length,
    candidateCount: candidates.length,
    sampledSourceCount: sourceTeams.length,
    selectedCount: selected.length,
    baseScore,
    bucketSummary: summarizeBuckets(selected),
    boostSummary: summarizeBoosts(selected),
    teams: selected,
  };
  writeJson(OUT_JSON, db);
  fs.writeFileSync(OUT_REPORT, renderReport(db), "utf8");
  console.log(renderConsole(db));
}

function selectSourceTeams(teams) {
  const output = [];
  for (const bucket of new Set(teams.map((team) => team.bucket))) {
    const rows = teams.filter((team) => team.bucket === bucket);
    const step = Math.max(1, Math.floor(rows.length / SOURCE_PER_BUCKET));
    for (let i = 0; i < rows.length && output.filter((team) => team.bucket === bucket).length < SOURCE_PER_BUCKET; i += step) {
      output.push(rows[i]);
    }
  }
  return output;
}

function boostTeam(team, boost) {
  return team.map((unit) => {
    const points = Object.fromEntries(ATTR_ORDER.map((attr) => [attr, boost.all || 0]));
    const specialty = ROLE_ATTRS[unit.role] || [];
    for (const attr of specialty) points[attr] = (points[attr] || 0) + (boost.specialty || 0);
    return applyBuildLayers(unit, {
      attributePoints: points,
      tags: [`waterline:${boost.id}`],
    });
  });
}

function evaluateCandidate(team, basePresets, seedPrefix) {
  let baseWins = 0;
  const winsByPreset = [];
  const lossesByPreset = [];
  for (const preset of basePresets) {
    const result = simulateTeams(structuredClone(preset.team), structuredClone(team), {
      seed: `enhanced-waterline|${seedPrefix}|${preset.id}`,
      randomizeStats: false,
      maxTime: 70,
      healthInterval: 1,
    });
    if (result.winner === "left") {
      baseWins += 1;
      winsByPreset.push(preset.id);
    } else {
      lossesByPreset.push(preset.id);
    }
  }
  return {
    baseWins,
    baseGames: basePresets.length,
    baseWinRate: round(baseWins / basePresets.length, 4),
    baseScore100: round((baseWins / basePresets.length) * 100, 2),
    winsByPreset,
    lossesByPreset,
  };
}

function selectUniform(candidates) {
  const selected = [];
  const usedSourceBoost = new Set();
  for (const bucket of DIFFICULTY_BUCKETS) {
    const rows = candidates
      .filter((candidate) => candidate.evaluation.baseWinRate >= bucket.min && candidate.evaluation.baseWinRate < bucket.max)
      .sort((a, b) => Math.abs(mid(bucket) - a.evaluation.baseWinRate) - Math.abs(mid(bucket) - b.evaluation.baseWinRate));
    for (const row of rows) {
      if (selected.filter((item) => item.difficultyBucket === bucket.key).length >= bucket.target) break;
      if (usedSourceBoost.has(row.id)) continue;
      selected.push({ ...row, id: `enhanced-${String(selected.length + 1).padStart(3, "0")}` });
      usedSourceBoost.add(row.id);
    }
  }
  if (selected.length >= TARGET_TOTAL) return selected.slice(0, TARGET_TOTAL);

  const selectedKeys = new Set(selected.map((row) => `${row.sourceId}|${row.boost.id}`));
  const overflow = candidates
    .filter((row) => !selectedKeys.has(`${row.sourceId}|${row.boost.id}`))
    .sort((a, b) => Math.abs(TARGET_BASE_RATE - a.evaluation.baseWinRate) - Math.abs(TARGET_BASE_RATE - b.evaluation.baseWinRate));
  for (const row of overflow) {
    if (selected.length >= TARGET_TOTAL) break;
    selected.push({ ...row, id: `enhanced-${String(selected.length + 1).padStart(3, "0")}` });
  }
  return selected.slice(0, TARGET_TOTAL);
}

function summarizeBaseScore(teams) {
  const avgBaseWinRate = avg(teams.map((team) => team.evaluation.baseWinRate));
  return {
    score100: round(avgBaseWinRate * 100, 2),
    winRate: round(avgBaseWinRate, 4),
    targetScore100: TARGET_BASE_SCORE,
    error: round(avgBaseWinRate * 100 - TARGET_BASE_SCORE, 2),
  };
}

function summarizeBuckets(teams) {
  return DIFFICULTY_BUCKETS.map((bucket) => {
    const rows = teams.filter((team) => team.difficultyBucket === bucket.key);
    return {
      key: bucket.key,
      label: bucket.label,
      count: rows.length,
      target: bucket.target,
      avgBaseScore100: round(avg(rows.map((team) => team.evaluation.baseScore100)), 2),
      boostMix: summarizeBoosts(rows),
    };
  });
}

function summarizeBoosts(teams) {
  const counts = {};
  for (const team of teams) counts[team.boost.id] = (counts[team.boost.id] || 0) + 1;
  return counts;
}

function bucketForBaseWinRate(rate) {
  return DIFFICULTY_BUCKETS.find((bucket) => rate >= bucket.min && rate < bucket.max) || DIFFICULTY_BUCKETS[DIFFICULTY_BUCKETS.length - 1];
}

function renderReport(db) {
  const lines = [];
  lines.push("# Enhanced Mob Waterline Report", "");
  lines.push(`Generated at: ${db.generatedAt}`, "");
  lines.push("## Target", "");
  lines.push(`- Selected teams: ${db.selectedCount}/${db.target.teams}`);
  lines.push(`- Base preset target score: ${db.target.baseScore}/100`);
  lines.push(`- Actual base preset score: ${db.baseScore.score100}/100`);
  lines.push(`- Error: ${db.baseScore.error}`);
  lines.push(`- Candidate count: ${db.candidateCount}`);
  lines.push(`- Sampled source teams: ${db.sampledSourceCount}`);
  lines.push("", "## Distribution", "");
  lines.push("| Player win-rate bucket | Count | Target | Avg base score | Boost mix |");
  lines.push("| --- | ---: | ---: | ---: | --- |");
  for (const row of db.bucketSummary) {
    lines.push(`| ${row.label} | ${row.count} | ${row.target} | ${row.avgBaseScore100} | ${formatCounts(row.boostMix)} |`);
  }
  lines.push("", "## Boost Mix", "");
  for (const [id, count] of Object.entries(db.boostSummary)) {
    const boost = BOOSTS.find((item) => item.id === id);
    lines.push(`- ${boost?.label || id}: ${count}`);
  }
  lines.push("", "## Examples", "");
  for (const bucket of DIFFICULTY_BUCKETS) {
    lines.push(`### ${bucket.label}`, "");
    for (const team of db.teams.filter((item) => item.difficultyBucket === bucket.key).slice(0, 5)) {
      lines.push(`- ${team.id}: ${team.name}; base score ${team.evaluation.baseScore100}/100; boost ${team.boost.label}; source ${team.sourceId}`);
    }
    lines.push("");
  }
  lines.push("## Notes", "");
  lines.push("- This waterline is player-facing score calibrated: fixed base preset teams average near 30/100.");
  lines.push("- It is built from existing mob waterline teams plus boost variants: base, all attributes, and role specialty attributes.");
  lines.push("- Use this as the next benchmark for equipment progression and attribute growth tests.");
  return `${lines.join("\n")}\n`;
}

function renderConsole(db) {
  return [
    "Enhanced mob waterline complete.",
    `selected=${db.selectedCount}, candidates=${db.candidateCount}`,
    `baseScore=${db.baseScore.score100}/100 target=${TARGET_BASE_SCORE}/100 error=${db.baseScore.error}`,
    `report=${OUT_REPORT}`,
  ].join("\n");
}

function formatCounts(counts) {
  return Object.entries(counts).map(([id, count]) => `${id}:${count}`).join(", ") || "-";
}

function mid(bucket) {
  return (bucket.min + Math.min(bucket.max, 1)) / 2;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

if (require.main === module) main();

module.exports = { main };
