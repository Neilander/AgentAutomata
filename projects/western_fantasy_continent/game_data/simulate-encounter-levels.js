const fs = require("fs");
const path = require("path");
const { simulateTeams } = require("./combat-sim");
const { ENCOUNTER_LEVELS, ENCOUNTER_ROSTER, rosterTeam } = require("./encounter-data");

const OUT_FILE = path.join(__dirname, "..", "design", "encounter-level-report.md");
const OUT_JSON = path.join(__dirname, "..", "design", "encounter-level-results.json");
const SEEDS = 5;

function run() {
  const results = ENCOUNTER_LEVELS.map((level) => simulateLevel(level));
  fs.writeFileSync(OUT_JSON, `${JSON.stringify({
    schema: "western_fantasy_encounter_level_results_v1",
    generatedAt: new Date().toISOString(),
    seedsPerCombination: SEEDS,
    levels: results,
  }, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_FILE, renderMarkdown(results), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), OUT_JSON)}`);
  return results;
}

function simulateLevel(level) {
  const combinations = choose(level.rosterIds, level.chooseCount).map((ids) => simulateCombination(level, ids));
  const winners = combinations.filter((combo) => combo.winRate >= 0.6);
  const stableWinners = combinations.filter((combo) => combo.winRate >= 1);
  const nearMisses = combinations.filter((combo) => combo.winRate > 0 && combo.winRate < 0.6);
  const winShare = combinations.length ? winners.length / combinations.length : 0;
  return {
    id: level.id,
    name: level.name,
    fantasy: level.fantasy,
    chooseCount: level.chooseCount,
    rosterIds: level.rosterIds,
    enemyTeam: level.enemyTeam.map((enemy) => enemy.name),
    target: level.target,
    totalCombinations: combinations.length,
    winningCombinations: winners.length,
    stableWinningCombinations: stableWinners.length,
    nearMissCombinations: nearMisses.length,
    winShare: round(winShare, 3),
    targetOk: winners.length >= level.target.minWinCombos && winShare <= level.target.maxWinShare && winners.length < combinations.length,
    topWinners: combinations.filter((combo) => combo.winRate >= 0.6).sort(rankCombination).slice(0, 12),
    nearMisses: nearMisses.sort(rankCombination).slice(0, 8),
    hardFails: combinations.filter((combo) => combo.winRate === 0).sort((a, b) => b.avgLeftHp - a.avgLeftHp).slice(0, 8),
  };
}

function simulateCombination(level, ids) {
  const games = [];
  for (let seed = 0; seed < SEEDS; seed += 1) {
    const result = simulateTeams(rosterTeam(ids), cloneTeam(level.enemyTeam), {
      seed: `${level.id}|${ids.join("+")}|${seed}`,
      randomizeStats: false,
      maxTime: 75,
    });
    games.push(summarizeGame(result));
  }
  const wins = games.filter((game) => game.winner === "left").length;
  return {
    ids,
    names: ids.map((id) => ENCOUNTER_ROSTER[id].name),
    tags: summarizeTags(ids),
    wins,
    games: SEEDS,
    winRate: wins / SEEDS,
    avgDuration: round(avg(games, "duration"), 2),
    avgLeftHp: round(avg(games, "leftHp"), 2),
    avgRightHp: round(avg(games, "rightHp"), 2),
    avgLeftAlive: round(avg(games, "leftAlive"), 2),
    avgRightAlive: round(avg(games, "rightAlive"), 2),
    avgDamageLead: round(avg(games, "damageLead"), 2),
  };
}

function summarizeGame(result) {
  const leftAlive = result.metrics.leftAlive;
  const rightAlive = result.metrics.rightAlive;
  return {
    winner: rightAlive === 0 && leftAlive > 0 ? "left" : "right",
    duration: result.duration,
    leftHp: result.leftHp,
    rightHp: result.rightHp,
    leftAlive,
    rightAlive,
    damageLead: (result.metrics.leftDamage || 0) - (result.metrics.rightDamage || 0),
  };
}

function renderMarkdown(levels) {
  const lines = [
    "# Encounter Level Simulation Report",
    "",
    `Generated with ${SEEDS} deterministic-order seeds per combination. A passing solution is win rate >= 60%; stable means 100%.`,
    "",
    "## Summary",
    "",
    "| Level | Pick | Enemy | Winning combos | Stable | Win share | Target |",
    "| --- | ---: | --- | ---: | ---: | ---: | --- |",
  ];
  for (const level of levels) {
    lines.push(`| ${level.name} \`${level.id}\` | ${level.chooseCount} | ${level.enemyTeam.join(", ")} | ${level.winningCombinations}/${level.totalCombinations} | ${level.stableWinningCombinations} | ${percent(level.winShare)} | ${level.targetOk ? "ok" : "review"} |`);
  }
  for (const level of levels) {
    lines.push("", `## ${level.name} \`${level.id}\``, "");
    lines.push(`- Fantasy: ${level.fantasy}`);
    lines.push(`- Pick ${level.chooseCount} from: ${level.rosterIds.map((id) => ENCOUNTER_ROSTER[id].name).join(", ")}.`);
    lines.push(`- Enemy: ${level.enemyTeam.join(", ")}.`);
    lines.push(`- Result: ${level.winningCombinations}/${level.totalCombinations} winning combos; target ${level.targetOk ? "ok" : "review"} (min ${level.target.minWinCombos}, max win share ${percent(level.target.maxWinShare)}).`);
    lines.push("", "Top solutions:");
    for (const combo of level.topWinners.slice(0, 6)) lines.push(`- ${formatCombo(combo)}`);
    lines.push("", "Near misses:");
    if (!level.nearMisses.length) lines.push("- None.");
    for (const combo of level.nearMisses.slice(0, 4)) lines.push(`- ${formatCombo(combo)}`);
    lines.push("", "Hard fail examples:");
    for (const combo of level.hardFails.slice(0, 4)) lines.push(`- ${formatCombo(combo)}`);
  }
  return `${lines.join("\n")}\n`;
}

function formatCombo(combo) {
  return `${combo.names.join(" + ")}: ${combo.wins}/${combo.games}, leftHp ${combo.avgLeftHp}, rightHp ${combo.avgRightHp}, alive ${combo.avgLeftAlive}-${combo.avgRightAlive}, tags ${combo.tags.join(", ") || "-"}.`;
}

function summarizeTags(ids) {
  const counts = {};
  for (const id of ids) {
    for (const tag of ENCOUNTER_ROSTER[id].tags || []) counts[tag] = (counts[tag] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([tag, count]) => count > 1 ? `${tag}x${count}` : tag);
}

function choose(items, count) {
  if (count <= 0) return [[]];
  if (items.length < count) return [];
  if (items.length === count) return [items];
  const [head, ...tail] = items;
  return [
    ...choose(tail, count - 1).map((combo) => [head, ...combo]),
    ...choose(tail, count),
  ];
}

function cloneTeam(team) {
  return team.map((unit) => ({ ...unit }));
}

function rankCombination(a, b) {
  return b.winRate - a.winRate || b.avgLeftHp - a.avgLeftHp || a.avgDuration - b.avgDuration;
}

function avg(items, key) {
  return items.reduce((sum, item) => sum + (item[key] || 0), 0) / Math.max(1, items.length);
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function round(value, digits = 1) {
  return Number(Number(value || 0).toFixed(digits));
}

if (require.main === module) run();

module.exports = { run, simulateLevel };
