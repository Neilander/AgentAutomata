const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulatePresetMatchup } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "archetype-matchup-report.md");
const GAMES = 15;
const TOTAL_GAMES = GAMES * 2;

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
  const lines = [
    "# Archetype Matchup Report",
    "",
    `Generated with \`${GAMES}\` deterministic seeds per side, \`${TOTAL_GAMES}\` total games per matchup, from \`game_data/combat-sim.js\`.`,
    "",
    "Rates are left preset win rates. This is now signal-backed simulation evidence, but it is still a prototype core and should be compared with the browser arena after major changes.",
    "",
    "## Win Matrix",
    "",
    `| Preset | ${keys.map((key) => SKILL_DATA.presets[key].name).join(" | ")} |`,
    `| --- | ${keys.map(() => "---:").join(" | ")} |`,
  ];
  for (const row of rows) {
    lines.push(`| ${SKILL_DATA.presets[row.key].name} | ${row.cells.map((cell) => cell ? renderRate(cell) : "—").join(" | ")} |`);
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

module.exports = { run, runPair };
