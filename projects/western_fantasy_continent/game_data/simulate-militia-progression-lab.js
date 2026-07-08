const CORE = require("../militia_progression_lab/militia-progression-core.js");

function runBatch(count = 12, rounds = 18) {
  const runs = [];
  for (let i = 0; i < count; i += 1) {
    const run = CORE.runAutoPlay(rounds, `batch-${i + 1}`);
    runs.push({
      index: i + 1,
      summary: run.summary,
      checkpoints: run.checkpoints.map((item) => ({
        round: item.round,
        encounter: item.encounter,
        win: item.win,
        powerBefore: item.powerBefore,
        powerAfter: item.powerAfter,
        loot: item.loot,
        topDamage: item.result.topDamage,
        topTaken: item.result.topTaken,
        topHeal: item.result.topHeal,
      })),
    });
  }
  return {
    runs,
    aggregate: aggregate(runs),
  };
}

function aggregate(runs) {
  const summaries = runs.map((run) => run.summary);
  return {
    runs: runs.length,
    avgWins: avg(summaries.map((item) => item.wins)),
    avgFinalPower: avg(summaries.map((item) => item.finalPower)),
    avgRoster: avg(summaries.map((item) => item.roster)),
    avgEpics: avg(summaries.map((item) => item.epics)),
    firstEpicRounds: summaries.map((item) => item.firstEpicRound).filter(Boolean),
    clearedGateRuns: summaries.filter((item) => item.clearedGates >= 2).length,
    verdicts: summaries.reduce((map, item) => {
      map[item.verdict] = (map[item.verdict] || 0) + 1;
      return map;
    }, {}),
  };
}

function avg(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

if (require.main === module) {
  const result = runBatch(Number(process.argv[2] || 12), Number(process.argv[3] || 18));
  console.log(JSON.stringify(result.aggregate, null, 2));
  for (const run of result.runs.slice(0, 3)) {
    console.log(`\nRun ${run.index}:`, JSON.stringify(run.summary));
    run.checkpoints.slice(0, 8).forEach((item) => {
      console.log(`  #${item.round} ${item.win ? "WIN " : "LOSE"} ${item.encounter} ${item.powerBefore}->${item.powerAfter} loot=${item.loot.join(",") || "-"}`);
    });
  }
}

module.exports = { runBatch };
