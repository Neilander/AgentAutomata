const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulatePresetMatchup } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "archetype-matchup-report.md");
const GAMES = 15;
const TOTAL_GAMES = GAMES * 2;
const BALANCE_HEALTH_LIMITS = {
  absoluteRateMaxShare: 0.1,
  hardCounterMaxShare: 0.25,
  softBandMinShare: 0.45,
  absoluteRateLow: 0,
  absoluteRateHigh: 1,
  hardCounterLow: 0.1,
  hardCounterHigh: 0.9,
  softBandLow: 0.35,
  softBandHigh: 0.65,
};

function run() {
  const keys = Object.keys(SKILL_DATA.presets);
  const rows = keys.map((left) => ({
    key: left,
    cells: keys.map((right) => left === right ? null : runPair(left, right)),
  }));
  fs.writeFileSync(OUT_FILE, renderMarkdown(keys, rows), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

function runPair(left, right) {
  const games = [];
  let wins = 0;
  const totals = emptyTotals();
  for (let seed = 0; seed < GAMES; seed += 1) {
    const leftResult = simulatePresetMatchup(left, right, { seed });
    games.push(leftResult);
    if (leftResult.winner === "left") wins += 1;
    addPerspectiveTotals(totals, leftResult, "left");

    const rightResult = simulatePresetMatchup(right, left, { seed });
    games.push(rightResult);
    if (rightResult.winner === "right") wins += 1;
    addPerspectiveTotals(totals, rightResult, "right");
  }
  return {
    left,
    right,
    wins,
    games: TOTAL_GAMES,
    rate: wins / TOTAL_GAMES,
    avgDuration: totals.duration / TOTAL_GAMES,
    avg: averageTotals(totals),
    expectation: classifyExpectation(left, right, wins / TOTAL_GAMES),
  };
}

function classifyExpectation(left, right, rate) {
  const design = SKILL_DATA.presets[left]?.design || {};
  const expected = {
    strong: design.strongMatchups || [],
    weak: design.weakMatchups || [],
  };
  const actual = rate >= 0.6 ? "favored" : rate <= 0.4 ? "weak" : "even";
  const intended = expected.strong.includes(right) ? "favored" : expected.weak.includes(right) ? "weak" : "flex";
  const ok = intended === "flex" || intended === actual || (intended === "favored" && rate >= 0.53) || (intended === "weak" && rate <= 0.47);
  return { intended, actual, ok };
}

function renderMarkdown(keys, rows) {
  const health = analyzeBalanceHealth(rows);
  const lines = [
    "# Archetype Matchup Report",
    "",
    `Generated with \`${GAMES}\` deterministic seeds per side, \`${TOTAL_GAMES}\` total games per matchup, from \`game_data/combat-sim.js\`.`,
    "",
    "Rates are left preset win rates. Expectation checks ask whether a matchup follows the intended strong/weak/flex contract; balance health separately checks whether the matrix has too many extreme 0/100-style outcomes.",
    "",
    "## Win Matrix",
    "",
    `| Preset | ${keys.map((key) => SKILL_DATA.presets[key].name).join(" | ")} |`,
    `| --- | ${keys.map(() => "---:").join(" | ")} |`,
  ];
  for (const row of rows) {
    lines.push(`| ${SKILL_DATA.presets[row.key].name} | ${row.cells.map((cell) => cell ? renderRate(cell) : "—").join(" | ")} |`);
  }
  lines.push("", "## Balance Health", "");
  lines.push(`- Result: ${health.pass ? "pass" : "fail"}.`);
  lines.push(`- Matrix cells checked: ${health.total}.`);
  lines.push(`- Absolute outcomes (${percent(BALANCE_HEALTH_LIMITS.absoluteRateLow)} or ${percent(BALANCE_HEALTH_LIMITS.absoluteRateHigh)}): ${health.absolute.length}/${health.total} (${percent(health.absoluteShare)}), target <= ${percent(BALANCE_HEALTH_LIMITS.absoluteRateMaxShare)}.`);
  lines.push(`- Hard counters (<= ${percent(BALANCE_HEALTH_LIMITS.hardCounterLow)} or >= ${percent(BALANCE_HEALTH_LIMITS.hardCounterHigh)}): ${health.hard.length}/${health.total} (${percent(health.hardShare)}), target <= ${percent(BALANCE_HEALTH_LIMITS.hardCounterMaxShare)}.`);
  lines.push(`- Soft band (${percent(BALANCE_HEALTH_LIMITS.softBandLow)}-${percent(BALANCE_HEALTH_LIMITS.softBandHigh)}): ${health.soft.length}/${health.total} (${percent(health.softShare)}), target >= ${percent(BALANCE_HEALTH_LIMITS.softBandMinShare)}.`);
  lines.push(`- Polarization score: ${health.polarizationScore.toFixed(2)} (0 is all 50/50, 1 is all 0/100).`);
  if (health.failures.length) {
    lines.push("- Failed checks:");
    for (const failure of health.failures) lines.push(`  - ${failure}`);
  }
  lines.push("");
  lines.push("Most polarized ordered matchups:");
  for (const cell of health.mostPolarized.slice(0, 12)) {
    lines.push(`- \`${cell.left}\` vs \`${cell.right}\`: ${percent(cell.rate)} (${cell.expectation.intended}/${cell.expectation.actual})`);
  }
  lines.push("", "## Expectation Mismatches", "");
  const mismatches = rows.flatMap((row) => row.cells.filter((cell) => cell && !cell.expectation.ok));
  if (!mismatches.length) {
    lines.push("- None in this run.");
  } else {
    for (const cell of mismatches) {
      lines.push(`- \`${cell.left}\` vs \`${cell.right}\`: expected ${cell.expectation.intended}, actual ${cell.expectation.actual}, rate ${percent(cell.rate)}.`);
    }
  }
  lines.push("", "## Pair Details", "");
  for (const row of rows) {
    for (const cell of row.cells.filter(Boolean)) {
      lines.push(`### \`${cell.left}\` into \`${cell.right}\``);
      lines.push("");
      lines.push(`- Win rate: ${percent(cell.rate)} (${cell.wins}/${cell.games})`);
      lines.push(`- Expectation: intended ${cell.expectation.intended}, actual ${cell.expectation.actual}, ${cell.expectation.ok ? "ok" : "mismatch"}`);
      lines.push(`- Avg duration: ${cell.avgDuration.toFixed(1)}s`);
      lines.push(`- Avg left basic / DOT / heal / shield: ${num(cell.avg.leftBasicDamage)} / ${num(cell.avg.leftDotDamage)} / ${num(cell.avg.leftHealing)} / ${num(cell.avg.leftShield)}`);
      lines.push(`- Avg right basic / DOT / heal / shield: ${num(cell.avg.rightBasicDamage)} / ${num(cell.avg.rightDotDamage)} / ${num(cell.avg.rightHealing)} / ${num(cell.avg.rightShield)}`);
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

function analyzeBalanceHealth(rows) {
  const cells = rows.flatMap((row) => row.cells.filter(Boolean));
  const total = Math.max(1, cells.length);
  const absolute = cells.filter((cell) => cell.rate <= BALANCE_HEALTH_LIMITS.absoluteRateLow || cell.rate >= BALANCE_HEALTH_LIMITS.absoluteRateHigh);
  const hard = cells.filter((cell) => cell.rate <= BALANCE_HEALTH_LIMITS.hardCounterLow || cell.rate >= BALANCE_HEALTH_LIMITS.hardCounterHigh);
  const soft = cells.filter((cell) => cell.rate >= BALANCE_HEALTH_LIMITS.softBandLow && cell.rate <= BALANCE_HEALTH_LIMITS.softBandHigh);
  const absoluteShare = absolute.length / total;
  const hardShare = hard.length / total;
  const softShare = soft.length / total;
  const polarizationScore = cells.reduce((sum, cell) => sum + Math.abs(cell.rate - 0.5) * 2, 0) / total;
  const failures = [];
  if (absoluteShare > BALANCE_HEALTH_LIMITS.absoluteRateMaxShare) {
    failures.push(`absolute outcomes are too common (${percent(absoluteShare)} > ${percent(BALANCE_HEALTH_LIMITS.absoluteRateMaxShare)})`);
  }
  if (hardShare > BALANCE_HEALTH_LIMITS.hardCounterMaxShare) {
    failures.push(`hard counters are too common (${percent(hardShare)} > ${percent(BALANCE_HEALTH_LIMITS.hardCounterMaxShare)})`);
  }
  if (softShare < BALANCE_HEALTH_LIMITS.softBandMinShare) {
    failures.push(`soft-band matchups are too rare (${percent(softShare)} < ${percent(BALANCE_HEALTH_LIMITS.softBandMinShare)})`);
  }
  return {
    total: cells.length,
    absolute,
    hard,
    soft,
    absoluteShare,
    hardShare,
    softShare,
    polarizationScore,
    mostPolarized: [...cells].sort((a, b) => Math.abs(b.rate - 0.5) - Math.abs(a.rate - 0.5)),
    failures,
    pass: failures.length === 0,
  };
}

function renderRate(cell) {
  const mark = cell.expectation.ok ? "" : "!";
  return `${percent(cell.rate)}${mark}`;
}

function emptyTotals() {
  return {
    duration: 0,
    leftBasicDamage: 0,
    rightBasicDamage: 0,
    leftDotDamage: 0,
    rightDotDamage: 0,
    leftHealing: 0,
    rightHealing: 0,
    leftShield: 0,
    rightShield: 0,
  };
}

function addPerspectiveTotals(totals, result, perspective) {
  const metrics = result.metrics;
  totals.duration += result.duration;
  const own = perspective === "left" ? "left" : "right";
  const opp = perspective === "left" ? "right" : "left";
  totals.leftBasicDamage += metrics[`${own}BasicDamage`] || 0;
  totals.leftDotDamage += metrics[`${own}DotDamage`] || 0;
  totals.leftHealing += metrics[`${own}Healing`] || 0;
  totals.leftShield += metrics[`${own}Shield`] || 0;
  totals.rightBasicDamage += metrics[`${opp}BasicDamage`] || 0;
  totals.rightDotDamage += metrics[`${opp}DotDamage`] || 0;
  totals.rightHealing += metrics[`${opp}Healing`] || 0;
  totals.rightShield += metrics[`${opp}Shield`] || 0;
}

function averageTotals(totals) {
  const out = {};
  for (const [key, value] of Object.entries(totals)) out[key] = value / TOTAL_GAMES;
  return out;
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function num(value) {
  return String(Math.round(value));
}

if (require.main === module) {
  run();
}

module.exports = { run, runPair, analyzeBalanceHealth };
