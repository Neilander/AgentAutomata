const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");
const { ROLE_ATTRS, ATTR_ORDER, applyBuildLayers } = require("./build-layers");

const DB_DIR = path.join(__dirname, "team_pools");
const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const SOURCE_WATERLINE_FILE = path.join(DB_DIR, "mob-waterline-db.json");
const OUT_JSON = path.join(DB_DIR, "mob-waterline-super-db.json");
const OUT_REPORT = path.join(OUT_DIR, "mob-waterline-super-report.md");

const FIXED_PRESETS = Object.keys(SKILL_DATA.presets || {});
const SOURCE_PER_BUCKET = 22;
const TARGET_TOTAL = 120;

const DIFFICULTY_BUCKETS = [
  { key: "30_45", label: "30-45", min: 0.3, max: 0.45, target: 18 },
  { key: "45_60", label: "45-60", min: 0.45, max: 0.6, target: 20 },
  { key: "60_75", label: "60-75", min: 0.6, max: 0.75, target: 24 },
  { key: "75_90", label: "75-90", min: 0.75, max: 0.9, target: 24 },
  { key: "90_100", label: "90-100", min: 0.9, max: 1.01, target: 22 },
  { key: "100_plus", label: "100+", min: 1.01, max: 9, target: 12 },
];

const BOOSTS = [
  { id: "all2_spec6", label: "全属性+2 专业+6", all: 2, specialty: 6, gear: 0 },
  { id: "all4_spec10", label: "全属性+4 专业+10", all: 4, specialty: 10, gear: 0 },
  { id: "all6_spec14", label: "全属性+6 专业+14", all: 6, specialty: 14, gear: 0 },
  { id: "all8_spec18", label: "全属性+8 专业+18", all: 8, specialty: 18, gear: 0 },
  { id: "gear16", label: "装备预算16", all: 2, specialty: 8, gear: 16 },
  { id: "gear28", label: "装备预算28", all: 4, specialty: 12, gear: 28 },
  { id: "gear42", label: "装备预算42", all: 6, specialty: 16, gear: 42 },
  { id: "gear60", label: "装备预算60", all: 8, specialty: 20, gear: 60 },
  { id: "boss80", label: "Boss预算80", all: 10, specialty: 24, gear: 80, hpMult: 1.12 },
  { id: "boss110", label: "Boss预算110", all: 12, specialty: 28, gear: 110, hpMult: 1.22 },
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
        sourceScore: mob.evaluation?.score ?? mob.evaluation?.baseScore100 ?? 0,
        boost,
        team,
        evaluation,
        difficultyBucket: bucketForPressure(evaluation.pressureScore).key,
      });
    }
  }

  const selected = selectByBuckets(candidates);
  const db = {
    schema: "western_fantasy_super_mob_waterline_v1",
    generatedAt: new Date().toISOString(),
    source: path.relative(DB_DIR, SOURCE_WATERLINE_FILE).replace(/\\/g, "/"),
    target: {
      teams: TARGET_TOTAL,
      distribution: "super pressure waterline: includes attribute-boosted and equipment-budget boosted teams, with buckets above normal fixed-preset win-rate.",
    },
    fixedPresetCount: basePresets.length,
    candidateCount: candidates.length,
    sampledSourceCount: sourceTeams.length,
    selectedCount: selected.length,
    bucketSummary: summarizeBuckets(selected),
    boostSummary: summarizeBoosts(selected),
    pressureSummary: summarizePressure(selected),
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
    const equipmentModifiers = boost.gear ? enemyGearBundle(unit.role, boost.gear) : undefined;
    const next = applyBuildLayers(unit, {
      attributePoints: points,
      equipmentModifiers,
      tags: [`super-waterline:${boost.id}`],
    });
    if (boost.hpMult) {
      next.maxHp = Math.round(next.maxHp * boost.hpMult);
      next.hp = next.maxHp;
    }
    return next;
  });
}

function enemyGearBundle(role, budget) {
  const physical = ["warrior", "berserker", "assassin", "ranger", "knight"].includes(role);
  const magic = ["mage", "priest", "warlock", "alchemist", "bard"].includes(role);
  const frontline = ["warrior", "berserker", "knight"].includes(role);
  return {
    source: "super-waterline-equipment",
    maxHpAdd: budget * (frontline ? 5.8 : 3.2),
    physicalPowerAdd: budget * (physical ? 0.52 : 0.14),
    magicPowerAdd: budget * (magic ? 0.54 : 0.12),
    armorAdd: budget * (frontline ? 0.24 : 0.12),
    attackSpeedMult: 1 + budget * (physical ? 0.0046 : 0.0018),
    skillHasteMult: 1 + budget * (magic ? 0.0048 : 0.0022),
    effectPowerMult: 1 + budget * (magic ? 0.0035 : 0.0014),
    effectResistPct: budget * 0.0009,
    receivedHealingMult: 1 + budget * (frontline ? 0.0025 : 0.0012),
    mechanicModifiers: {},
    notes: [`super waterline gear ${budget}`],
    debug: { role, budget },
  };
}

function evaluateCandidate(team, basePresets, seedPrefix) {
  let playerWins = 0;
  let pressureScore = 0;
  const cells = [];
  for (const preset of basePresets) {
    const result = simulateTeams(structuredClone(preset.team), structuredClone(team), {
      seed: `super-waterline|${seedPrefix}|${preset.id}`,
      randomizeStats: false,
      maxTime: 70,
      healthInterval: 1,
    });
    const playerWon = result.winner === "left";
    if (playerWon) playerWins += 1;
    const hpGap = Math.max(0, result.rightHp - result.leftHp);
    const pressure = (playerWon ? 0 : 1) + hpGap * 0.35;
    pressureScore += pressure;
    cells.push({
      presetId: preset.id,
      playerWon,
      winner: result.winner,
      leftHp: result.leftHp,
      rightHp: result.rightHp,
      pressure: round(pressure),
    });
  }
  return {
    playerWins,
    games: basePresets.length,
    playerWinRate: round(playerWins / basePresets.length, 4),
    playerScore100: round((playerWins / basePresets.length) * 100, 2),
    pressureScore: round((pressureScore / basePresets.length) * 100, 2),
    cells,
  };
}

function selectByBuckets(candidates) {
  const selected = [];
  const used = new Set();
  for (const bucket of DIFFICULTY_BUCKETS) {
    const rows = candidates
      .filter((candidate) => candidate.evaluation.pressureScore >= bucket.min * 100 && candidate.evaluation.pressureScore < bucket.max * 100)
      .sort((a, b) => Math.abs(mid(bucket) * 100 - a.evaluation.pressureScore) - Math.abs(mid(bucket) * 100 - b.evaluation.pressureScore));
    for (const row of rows) {
      if (selected.filter((item) => item.difficultyBucket === bucket.key).length >= bucket.target) break;
      if (used.has(row.id)) continue;
      selected.push({ ...row, id: `super-${String(selected.length + 1).padStart(3, "0")}` });
      used.add(row.id);
    }
  }
  if (selected.length >= TARGET_TOTAL) return selected.slice(0, TARGET_TOTAL);
  const fallback = candidates
    .filter((row) => !used.has(row.id))
    .sort((a, b) => b.evaluation.pressureScore - a.evaluation.pressureScore);
  for (const row of fallback) {
    if (selected.length >= TARGET_TOTAL) break;
    selected.push({ ...row, id: `super-${String(selected.length + 1).padStart(3, "0")}` });
  }
  return selected.slice(0, TARGET_TOTAL);
}

function summarizeBuckets(teams) {
  return DIFFICULTY_BUCKETS.map((bucket) => {
    const rows = teams.filter((team) => team.difficultyBucket === bucket.key);
    return {
      key: bucket.key,
      label: bucket.label,
      count: rows.length,
      target: bucket.target,
      avgPressureScore: round(avg(rows.map((team) => team.evaluation.pressureScore)), 2),
      avgPlayerScore100: round(avg(rows.map((team) => team.evaluation.playerScore100)), 2),
      boostMix: summarizeBoosts(rows),
    };
  });
}

function summarizeBoosts(teams) {
  const counts = {};
  for (const team of teams) counts[team.boost.id] = (counts[team.boost.id] || 0) + 1;
  return counts;
}

function summarizePressure(teams) {
  return {
    avgPressureScore: round(avg(teams.map((team) => team.evaluation.pressureScore)), 2),
    avgPlayerScore100: round(avg(teams.map((team) => team.evaluation.playerScore100)), 2),
    minPressureScore: round(Math.min(...teams.map((team) => team.evaluation.pressureScore)), 2),
    maxPressureScore: round(Math.max(...teams.map((team) => team.evaluation.pressureScore)), 2),
  };
}

function bucketForPressure(score) {
  const normalized = score / 100;
  return DIFFICULTY_BUCKETS.find((bucket) => normalized >= bucket.min && normalized < bucket.max) || DIFFICULTY_BUCKETS[DIFFICULTY_BUCKETS.length - 1];
}

function renderReport(db) {
  const lines = [];
  lines.push("# Super Mob Waterline Report", "");
  lines.push(`Generated at: ${db.generatedAt}`, "");
  lines.push("## Summary", "");
  lines.push(`- Selected teams: ${db.selectedCount}/${db.target.teams}`);
  lines.push(`- Candidate count: ${db.candidateCount}`);
  lines.push(`- Sampled source teams: ${db.sampledSourceCount}`);
  lines.push(`- Avg pressure score: ${db.pressureSummary.avgPressureScore}`);
  lines.push(`- Avg player score against super bucket: ${db.pressureSummary.avgPlayerScore100}/100`);
  lines.push(`- Pressure range: ${db.pressureSummary.minPressureScore} - ${db.pressureSummary.maxPressureScore}`);
  lines.push("", "## Buckets", "");
  lines.push("| Pressure bucket | Count | Target | Avg pressure | Avg player score | Boost mix |");
  lines.push("| --- | ---: | ---: | ---: | ---: | --- |");
  for (const row of db.bucketSummary) {
    lines.push(`| ${row.label} | ${row.count} | ${row.target} | ${row.avgPressureScore} | ${row.avgPlayerScore100} | ${formatCounts(row.boostMix)} |`);
  }
  lines.push("", "## Boost Mix", "");
  for (const [id, count] of Object.entries(db.boostSummary)) lines.push(`- ${id}: ${count}`);
  lines.push("", "## Examples", "");
  for (const bucket of DIFFICULTY_BUCKETS) {
    lines.push(`### ${bucket.label}`, "");
    for (const team of db.teams.filter((item) => item.difficultyBucket === bucket.key).slice(0, 5)) {
      lines.push(`- ${team.id}: ${team.name}; pressure ${team.evaluation.pressureScore}; player score ${team.evaluation.playerScore100}/100; boost ${team.boost.id}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderConsole(db) {
  return [
    "Super mob waterline complete.",
    `selected=${db.selectedCount}, candidates=${db.candidateCount}`,
    `avgPressure=${db.pressureSummary.avgPressureScore}, avgPlayerScore=${db.pressureSummary.avgPlayerScore100}/100`,
    `report=${OUT_REPORT}`,
  ].join("\n");
}

function formatCounts(counts) {
  return Object.entries(counts).map(([id, count]) => `${id}:${count}`).join(", ") || "-";
}

function mid(bucket) {
  return (bucket.min + Math.min(bucket.max, 1.25)) / 2;
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
