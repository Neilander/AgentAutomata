const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UI_FILE = path.join(ROOT, "equipment_grind_v3", "equipment-grind-simulator.js");
const OUT_DIR = path.join(ROOT, "design", "equipment_progression");
const OUT_JSON = path.join(OUT_DIR, "equipment-grind-v3-flow-recommended-power.json");
const OUT_MD = path.join(OUT_DIR, "equipment-grind-v3-flow-recommended-power.md");

const { simulateGrind } = require("./simulate-equipment-grind-v2-feedback");
const { loadDungeons } = require("./calibrate-equipment-grind-v3-recommended-power");

const SEEDS = Number(process.env.SEEDS || 120);
const MAX_RUNS = Number(process.env.RUNS || 100);
const TARGET_RATE = Number(process.env.TARGET_RATE || 0.7);
const BAND = Number(process.env.BAND || 0.1);
const MIN_SAMPLES = Number(process.env.MIN_SAMPLES || 10);

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dungeons = loadDungeons();
  const attempts = collectAttempts(dungeons);
  const rows = dungeons.map((dungeon) => summarizeDungeon(dungeon, attempts.filter((row) => row.level === dungeon.level)));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), settings: settingsSnapshot(), rows }, null, 2), "utf8");
  fs.writeFileSync(OUT_MD, renderMarkdown(rows), "utf8");
  printRows(rows);
}

function settingsSnapshot() {
  return {
    seeds: SEEDS,
    maxRuns: MAX_RUNS,
    targetRate: TARGET_RATE,
    band: BAND,
    minSamples: MIN_SAMPLES,
    source: "fresh-run challenge attempts only",
  };
}

function collectAttempts(dungeons) {
  const attempts = [];
  for (let seed = 0; seed < SEEDS; seed += 1) {
    const result = simulateGrind({
      dungeons,
      seed: `v3-flow-recommended-power-${seed}`,
      maxRuns: MAX_RUNS,
      useThirst: true,
    });
    for (const row of result.runs) {
      if (row.mode !== "挑战") continue;
      const level = parseDungeonLevel(row.dungeon);
      if (!level) continue;
      attempts.push({
        seed,
        run: row.run,
        level,
        won: Boolean(row.won),
        power: Number(row.teamPowerBefore) || 0,
        powerAfter: Number(row.teamPowerAfter) || 0,
        duration: Number(row.duration) || 0,
      });
    }
  }
  return attempts;
}

function summarizeDungeon(dungeon, attempts) {
  const tested = candidatePowers(attempts).map((targetPower) => testBucket(attempts, targetPower));
  const valid = tested.filter((row) => row.samples >= MIN_SAMPLES);
  const passed = valid.find((row) => row.winRate >= TARGET_RATE);
  const fallback = passed || valid
    .slice()
    .sort((a, b) => Math.abs(b.winRate - TARGET_RATE) - Math.abs(a.winRate - TARGET_RATE))
    .at(-1) || tested.at(-1) || emptyBucket(dungeon.power);
  const firstClears = firstClearRows(attempts);
  const firstClear = summarizeFirstClears(firstClears);
  const recommendedPower = firstClear.p70Power
    ? roundToStep(firstClear.p70Power, stepForPower(firstClear.p70Power))
    : roundToStep(fallback.avgPower || fallback.targetPower || dungeon.power, stepForPower(dungeon.power));
  return {
    level: dungeon.level,
    name: dungeon.name,
    oldPower: dungeon.power,
    recommendedPower,
    recommendationBasis: firstClear.p70Power ? "first-clear p70 power" : "fallback local bucket",
    targetPower: fallback.targetPower,
    samples: fallback.samples,
    wins: fallback.wins,
    winRate: round(fallback.winRate, 3),
    avgPower: round(fallback.avgPower),
    avgDuration: round(fallback.avgDuration, 1),
    totalAttempts: attempts.length,
    totalWins: attempts.filter((row) => row.won).length,
    firstClear,
    tested: tested.map((row) => ({
      targetPower: row.targetPower,
      samples: row.samples,
      wins: row.wins,
      winRate: round(row.winRate, 3),
      avgPower: round(row.avgPower),
      avgDuration: round(row.avgDuration, 1),
    })),
  };
}

function candidatePowers(attempts) {
  const powers = attempts.map((row) => row.power).filter(Boolean).sort((a, b) => a - b);
  if (!powers.length) return [];
  const min = Math.floor(powers[0] / 500) * 500;
  const max = Math.ceil(powers[powers.length - 1] / 500) * 500;
  const values = new Set();
  for (let power = min; power <= max; power += stepForPower(power)) values.add(power);
  for (const q of [0.15, 0.3, 0.45, 0.6, 0.7, 0.8, 0.9]) values.add(roundToStep(quantile(powers, q), stepForPower(quantile(powers, q))));
  return [...values].filter((value) => value > 0).sort((a, b) => a - b);
}

function testBucket(attempts, targetPower) {
  const lower = targetPower * (1 - BAND);
  const upper = targetPower * (1 + BAND);
  let bucket = attempts.filter((row) => row.power >= lower && row.power <= upper);
  if (bucket.length < MIN_SAMPLES) {
    bucket = attempts
      .slice()
      .sort((a, b) => Math.abs(a.power - targetPower) - Math.abs(b.power - targetPower))
      .slice(0, MIN_SAMPLES);
  }
  const wins = bucket.filter((row) => row.won).length;
  const powerSum = bucket.reduce((sum, row) => sum + row.power, 0);
  const durationSum = bucket.reduce((sum, row) => sum + row.duration, 0);
  return {
    targetPower,
    samples: bucket.length,
    wins,
    winRate: bucket.length ? wins / bucket.length : 0,
    avgPower: bucket.length ? powerSum / bucket.length : 0,
    avgDuration: bucket.length ? durationSum / bucket.length : 0,
  };
}

function firstClearRows(attempts) {
  const bySeed = new Map();
  for (const row of attempts) {
    if (!row.won || bySeed.has(row.seed)) continue;
    bySeed.set(row.seed, row);
  }
  return [...bySeed.values()];
}

function summarizeFirstClears(rows) {
  const powers = rows.map((row) => row.power).sort((a, b) => a - b);
  const runs = rows.map((row) => row.run).sort((a, b) => a - b);
  if (!rows.length) return { clears: 0 };
  return {
    clears: rows.length,
    avgRun: round(avg(runs), 2),
    p50Run: quantile(runs, 0.5),
    avgPower: round(avg(powers)),
    p50Power: round(quantile(powers, 0.5)),
    p70Power: round(quantile(powers, 0.7)),
  };
}

function updateUiPowerValues(updates) {
  let text = fs.readFileSync(UI_FILE, "utf8");
  for (const [level, power] of Object.entries(updates)) {
    const pattern = new RegExp(`(\\{ level: ${level},[^\\n]*? power: )\\d+`, "m");
    if (!pattern.test(text)) throw new Error(`Cannot find power field for D${level}.`);
    text = text.replace(pattern, `$1${power}`);
  }
  fs.writeFileSync(UI_FILE, text, "utf8");
}

function renderMarkdown(rows) {
  const lines = [
    "# Equipment Grind V3 Flow Recommended Power",
    "",
    "Definition: first-clear p70 is a progression diagnostic, not the displayed recommendation. It can underestimate late-game displayed power if the grind-flow simulator's power formula drifts from the V3 UI formula.",
    "",
    `Settings: ${SEEDS} seeds, ${MAX_RUNS} max runs, target ${Math.round(TARGET_RATE * 100)}%, local band +/-${Math.round(BAND * 100)}%, minimum ${MIN_SAMPLES} attempts.`,
    "",
    "| Dungeon | Old | New recommended | Basis | Diagnostic bucket win | First-clear p70 power | First-clear median run | Total challenge attempts |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const row of rows) {
    lines.push(`| D${row.level} | ${row.oldPower} | ${row.recommendedPower} | ${row.recommendationBasis} | ${Math.round(row.winRate * 100)}%/${row.samples} | ${row.firstClear.p70Power || "-"} | ${row.firstClear.p50Run || "-"} | ${row.totalAttempts} |`);
  }
  lines.push("", "## Notes", "");
  lines.push("- This replaces the previous static similar-power-team interpretation for the displayed recommendation.");
  lines.push("- It only samples rows where the grind loop is actively challenging the next uncleared dungeon, so farm/overkill rows do not inflate the recommendation.");
  lines.push("- The local bucket win rate is kept only as a diagnostic; the displayed recommendation uses first-clear p70 because the user wants a practical progression recommendation, not a stable-farm threshold.");
  lines.push("- If a late dungeon has thin samples, rerun with higher `SEEDS` before treating the number as final.");
  return `${lines.join("\n")}\n`;
}

function printRows(rows) {
  console.log("| D | old | recommended | basis | bucket win | samples | first p70 power | first median run | attempts |");
  console.log("|---|---:|---:|---|---:|---:|---:|---:|---:|");
  for (const row of rows) {
    console.log(`| D${row.level} | ${row.oldPower} | ${row.recommendedPower} | ${row.recommendationBasis} | ${Math.round(row.winRate * 100)}% | ${row.samples} | ${row.firstClear.p70Power || "-"} | ${row.firstClear.p50Run || "-"} | ${row.totalAttempts} |`);
  }
}

function parseDungeonLevel(label) {
  const match = String(label || "").match(/^D(\d+)/);
  return match ? Number(match[1]) : 0;
}

function stepForPower(power) {
  if (power < 10000) return 500;
  if (power < 50000) return 1000;
  return 2500;
}

function emptyBucket(targetPower) {
  return { targetPower, samples: 0, wins: 0, winRate: 0, avgPower: targetPower, avgDuration: 0 };
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function quantile(values, q) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))];
}

function round(value, digits = 2) {
  return Number((Number(value) || 0).toFixed(digits));
}

function roundToStep(value, step) {
  return Math.max(step, Math.round((Number(value) || step) / step) * step);
}

if (require.main === module) main();

module.exports = { collectAttempts, summarizeDungeon };
