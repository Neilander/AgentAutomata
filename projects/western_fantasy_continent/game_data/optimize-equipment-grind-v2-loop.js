const fs = require("fs");
const path = require("path");
const { simulateGrind, loadDungeons } = require("./simulate-equipment-grind-v2-feedback");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "design", "equipment_progression");
const SEEDS = [
  "feedback-loop-v2",
  "feedback-loop-v2-b",
  "feedback-loop-v2-c",
  "feedback-loop-v2-d",
  "feedback-loop-v2-e",
  "feedback-loop-v2-f",
  "feedback-loop-v2-g",
  "feedback-loop-v2-h",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function tuneRarity(rarity, shifts) {
  const next = { ...rarity };
  for (const [key, delta] of Object.entries(shifts)) {
    next[key] = Math.max(0, (next[key] || 0) + delta);
  }
  const total = Object.values(next).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(next).map(([key, value]) => [key, round(value / total, 4)]));
}

function scaleDungeon(dungeon, spec) {
  const next = { ...dungeon, rarity: { ...dungeon.rarity }, itemLevelRange: [...dungeon.itemLevelRange] };
  if (spec.enemyGear) next.enemyGear = Math.max(0, Math.round(next.enemyGear * spec.enemyGear));
  if (spec.enemyPoints) next.enemyPoints = Math.max(0, Math.round(next.enemyPoints * spec.enemyPoints));
  if (spec.power) next.power = Math.round(next.power * spec.power / 100) * 100;
  if (spec.dropCount) next.dropCount = Math.max(1, Math.round(next.dropCount + spec.dropCount));
  if (spec.levelMax) next.itemLevelRange[1] = Math.max(next.itemLevelRange[0], next.itemLevelRange[1] + spec.levelMax);
  if (spec.levelMin) next.itemLevelRange[0] = Math.max(1, next.itemLevelRange[0] + spec.levelMin);
  if (spec.rarityShift) next.rarity = tuneRarity(next.rarity, spec.rarityShift);
  return next;
}

function applyCandidate(base, candidate) {
  const next = clone(base);
  for (const rule of candidate.rules) {
    for (let i = rule.from - 1; i <= rule.to - 1; i += 1) {
      next[i] = scaleDungeon(next[i], rule);
    }
  }
  return next;
}

function candidates() {
  return [
    {
      id: "baseline-thirst2",
      label: "Only thirst multiplier changed",
      rules: [],
    },
    {
      id: "early-more-drops",
      label: "D1-D3 +2 drops, tiny rarity lift",
      rules: [
        { from: 1, to: 3, dropCount: 2, rarityShift: { rare: 0.04, epic: 0.01, common: -0.05 } },
      ],
    },
    {
      id: "early-reliable-farm",
      label: "D1-D4 softer enemies, +1 early drop",
      rules: [
        { from: 1, to: 4, enemyGear: 0.86, enemyPoints: 0.9, power: 0.9, dropCount: 1 },
      ],
    },
    {
      id: "wave-supply",
      label: "Reward spikes before major walls",
      rules: [
        { from: 1, to: 2, dropCount: 1, rarityShift: { rare: 0.04, common: -0.04 } },
        { from: 3, to: 3, dropCount: 2, levelMax: 6, rarityShift: { epic: 0.04, legendary: 0.01, common: -0.05 } },
        { from: 5, to: 5, dropCount: 2, levelMax: 8, rarityShift: { legendary: 0.04, mythic: 0.01, epic: -0.05 } },
        { from: 7, to: 7, dropCount: 2, levelMax: 8, rarityShift: { mythic: 0.06, epic: -0.06 } },
      ],
    },
    {
      id: "wave-supply-plus-early",
      label: "Wave supply plus stronger D1-D2 onboarding",
      rules: [
        { from: 1, to: 2, dropCount: 2, rarityShift: { rare: 0.06, epic: 0.01, common: -0.07 } },
        { from: 3, to: 3, dropCount: 2, levelMax: 6, rarityShift: { epic: 0.04, legendary: 0.01, common: -0.05 } },
        { from: 5, to: 5, dropCount: 2, levelMax: 8, rarityShift: { legendary: 0.04, mythic: 0.01, epic: -0.05 } },
        { from: 7, to: 7, dropCount: 2, levelMax: 8, rarityShift: { mythic: 0.06, epic: -0.06 } },
      ],
    },
    {
      id: "wave-supply-soft-walls",
      label: "Wave supply with slightly softer major walls",
      rules: [
        { from: 1, to: 2, dropCount: 1, rarityShift: { rare: 0.04, common: -0.04 } },
        { from: 3, to: 3, dropCount: 2, levelMax: 6, rarityShift: { epic: 0.04, legendary: 0.01, common: -0.05 } },
        { from: 4, to: 4, enemyGear: 0.94, enemyPoints: 0.95, power: 0.96 },
        { from: 5, to: 5, dropCount: 2, levelMax: 8, rarityShift: { legendary: 0.04, mythic: 0.01, epic: -0.05 } },
        { from: 6, to: 6, enemyGear: 0.94, enemyPoints: 0.95, power: 0.96 },
        { from: 7, to: 7, dropCount: 2, levelMax: 8, rarityShift: { mythic: 0.06, epic: -0.06 } },
        { from: 8, to: 8, enemyGear: 0.94, enemyPoints: 0.95, power: 0.96 },
      ],
    },
    {
      id: "wave-supply-lean",
      label: "Wave supply but leaner drops",
      rules: [
        { from: 1, to: 2, dropCount: 1, rarityShift: { rare: 0.03, common: -0.03 } },
        { from: 3, to: 3, dropCount: 1, levelMax: 4, rarityShift: { epic: 0.03, legendary: 0.01, common: -0.04 } },
        { from: 5, to: 5, dropCount: 1, levelMax: 6, rarityShift: { legendary: 0.03, mythic: 0.01, epic: -0.04 } },
        { from: 7, to: 7, dropCount: 1, levelMax: 6, rarityShift: { mythic: 0.04, epic: -0.04 } },
      ],
    },
    {
      id: "wave-supply-rarity-rich",
      label: "Wave supply with stronger rarity unlock moments",
      rules: [
        { from: 1, to: 2, dropCount: 1, rarityShift: { rare: 0.05, epic: 0.01, common: -0.06 } },
        { from: 3, to: 3, dropCount: 2, levelMax: 6, rarityShift: { epic: 0.07, legendary: 0.02, common: -0.09 } },
        { from: 5, to: 5, dropCount: 2, levelMax: 8, rarityShift: { legendary: 0.07, mythic: 0.02, epic: -0.09 } },
        { from: 7, to: 7, dropCount: 2, levelMax: 8, rarityShift: { mythic: 0.09, epic: -0.09 } },
      ],
    },
    {
      id: "wave-supply-late-tail",
      label: "Wave supply with extra late-tail drops",
      rules: [
        { from: 1, to: 2, dropCount: 1, rarityShift: { rare: 0.04, common: -0.04 } },
        { from: 3, to: 3, dropCount: 2, levelMax: 6, rarityShift: { epic: 0.04, legendary: 0.01, common: -0.05 } },
        { from: 5, to: 5, dropCount: 2, levelMax: 8, rarityShift: { legendary: 0.04, mythic: 0.01, epic: -0.05 } },
        { from: 7, to: 9, dropCount: 2, levelMax: 8, rarityShift: { mythic: 0.06, epic: -0.06 } },
      ],
    },
    {
      id: "smoother-walls",
      label: "D4/D6/D8 walls softened, drops unchanged",
      rules: [
        { from: 4, to: 4, enemyGear: 0.82, enemyPoints: 0.86, power: 0.88 },
        { from: 6, to: 6, enemyGear: 0.84, enemyPoints: 0.88, power: 0.9 },
        { from: 8, to: 8, enemyGear: 0.86, enemyPoints: 0.9, power: 0.92 },
      ],
    },
    {
      id: "wide-loot-waves",
      label: "More loot across all tiers, modest wall softening",
      rules: [
        { from: 1, to: 3, dropCount: 2, enemyGear: 0.92, rarityShift: { rare: 0.04, epic: 0.01, common: -0.05 } },
        { from: 4, to: 6, dropCount: 1, enemyGear: 0.9, rarityShift: { legendary: 0.03, mythic: 0.01, rare: -0.02, epic: -0.02 } },
        { from: 7, to: 9, dropCount: 1, enemyGear: 0.92, rarityShift: { mythic: 0.04, epic: -0.04 } },
      ],
    },
    {
      id: "conservative-rarity",
      label: "Same enemies, better rarity cadence only",
      rules: [
        { from: 2, to: 3, rarityShift: { rare: 0.06, epic: 0.02, common: -0.08 } },
        { from: 4, to: 5, rarityShift: { epic: 0.04, legendary: 0.04, rare: -0.08 } },
        { from: 6, to: 7, rarityShift: { legendary: 0.04, mythic: 0.04, epic: -0.08 } },
      ],
    },
  ];
}

function evaluateCandidate(base, candidate, options = {}) {
  const dungeons = applyCandidate(base, candidate);
  const runs = SEEDS.map((seed) => simulateGrind({
    seed,
    dungeons,
    maxRuns: Number(options.maxRuns || 80),
    useThirst: true,
  }));
  const avg = (fn) => round(runs.reduce((sum, row) => sum + fn(row), 0) / runs.length, 3);
  const clearValues = runs.map((row) => row.finalBestClear);
  const boredomValues = runs.map((row) => row.finalBoredom);
  const feedbackValues = runs.map((row) => row.finalFeedback);
  const summary = {
    id: candidate.id,
    label: candidate.label,
    avgClear: avg((row) => row.finalBestClear),
    minClear: Math.min(...clearValues),
    avgFeedback: avg((row) => row.finalFeedback),
    minFeedback: Math.min(...feedbackValues),
    avgBoredom: avg((row) => row.finalBoredom),
    maxBoredom: Math.max(...boredomValues),
    smoothSeeds: runs.filter((row) => row.finalBoredom <= 80).length,
    stuckSeeds: runs.filter((row) => row.finalBestClear < 4).length,
    score: 0,
  };
  summary.score = round(
    summary.avgFeedback
    - summary.avgBoredom * 0.55
    + summary.avgClear * 9
    + summary.minClear * 5
    + summary.smoothSeeds * 8
    - summary.stuckSeeds * 18
    - Math.max(0, summary.maxBoredom - 180) * 0.35,
    3,
  );
  return { candidate, dungeons, runs, summary };
}

function markdownReport(results) {
  const sorted = [...results].sort((a, b) => b.summary.score - a.summary.score);
  const lines = [
    "# Equipment Grind V2 Loop Optimization Batch",
    "",
    "| Rank | Candidate | Score | Avg clear | Min clear | Avg feedback | Min feedback | Avg boredom | Max boredom | Smooth seeds | Stuck seeds |",
    "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  sorted.forEach((row, index) => {
    const s = row.summary;
    lines.push(`| ${index + 1} | ${s.id} | ${s.score} | ${s.avgClear} | ${s.minClear} | ${s.avgFeedback} | ${round(s.minFeedback, 2)} | ${s.avgBoredom} | ${s.maxBoredom} | ${s.smoothSeeds}/8 | ${s.stuckSeeds}/8 |`);
  });
  const best = sorted[0];
  lines.push("");
  lines.push(`## Best Candidate: ${best.summary.id}`);
  lines.push("");
  lines.push(best.summary.label);
  lines.push("");
  lines.push("| D | Power | Points | Gear | Drops | Level range | Rarity |");
  lines.push("|---:|---:|---:|---:|---:|---|---|");
  for (const dungeon of best.dungeons) {
    lines.push(`| D${dungeon.level} | ${dungeon.power} | ${dungeon.enemyPoints} | ${dungeon.enemyGear} | ${dungeon.dropCount} | ${dungeon.itemLevelRange.join("-")} | ${Object.entries(dungeon.rarity).map(([k, v]) => `${k}:${v}`).join(" ")} |`);
  }
  return lines.join("\n");
}

function runBatch() {
  const base = loadDungeons();
  const results = candidates().map((candidate) => evaluateCandidate(base, candidate));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "equipment-grind-v2-loop-optimization.json"), JSON.stringify(results.map((row) => ({
    summary: row.summary,
    rules: row.candidate.rules,
    dungeons: row.dungeons,
  })), null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "equipment-grind-v2-loop-optimization.md"), markdownReport(results));
  console.log(markdownReport(results));
}

function round(value, digits = 3) {
  return Number((Number(value) || 0).toFixed(digits));
}

if (require.main === module) runBatch();

module.exports = { candidates, evaluateCandidate, applyCandidate };
