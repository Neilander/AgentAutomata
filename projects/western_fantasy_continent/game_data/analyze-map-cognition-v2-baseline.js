const LOOP = require("./analyze-map-cognition-v2-action-loop");

function runBaseline(options = {}) {
  const seeds = options.seeds || ["phase2-a", "phase2-b", "phase2-c", "phase2-d", "phase2-e"];
  const maxActions = Number(options.maxActions || 40);
  const runs = seeds.map((seed) => summarize(LOOP.runLoop(seed, maxActions), seed));
  return { schema: "player_cognition_v2_long_horizon_baseline", maxActions, runs, aggregate: aggregate(runs) };
}

function summarize(result, seed) {
  if (!result.ok) return { seed, ok: false, error: result.error };
  const actions = result.loop.actions;
  const bossRows = actions.filter((row) => row.action === "challenge:r1_boss");
  const firstLoss = actions.findIndex((row) => row.action === "challenge:r1_boss" && row.outcome === "loss");
  const afterLoss = firstLoss < 0 ? [] : actions.slice(firstLoss + 1);
  return {
    seed,
    ok: true,
    actionCount: actions.length,
    bossAttempts: bossRows.length,
    bossLosses: bossRows.filter((row) => row.outcome === "loss").length,
    bossWins: bossRows.filter((row) => row.outcome === "win").length,
    bossRetriesAfterLoss: afterLoss.filter((row) => row.action === "challenge:r1_boss").length,
    finalEmotion: actions.at(-1)?.emotionAfter ?? 38,
    terminal: result.loop.terminal || null,
    repeatedTail: repeatedTail(actions.map((row) => row.action)),
    route: actions.map((row) => `${row.action}:${row.outcome}`),
  };
}

function aggregate(runs) {
  const valid = runs.filter((run) => run.ok);
  return {
    runs: valid.length,
    bossReached: valid.filter((run) => run.bossAttempts > 0).length,
    bossCleared: valid.filter((run) => run.bossWins > 0).length,
    lossesWithRetry: valid.filter((run) => run.bossLosses > 0 && run.bossRetriesAfterLoss > 0).length,
    lossesWithoutRetry: valid.filter((run) => run.bossLosses > 0 && run.bossRetriesAfterLoss === 0).length,
    terminalConclusions: valid.filter((run) => run.terminal).length,
    terminalAttractors: valid.filter((run) => run.repeatedTail).length,
    averageActions: round(valid.reduce((sum, run) => sum + run.actionCount, 0) / Math.max(1, valid.length)),
    averageFinalEmotion: round(valid.reduce((sum, run) => sum + run.finalEmotion, 0) / Math.max(1, valid.length)),
  };
}

function repeatedTail(actions) {
  if (!actions.length) return null;
  const last = actions.at(-1);
  let count = 0;
  for (let index = actions.length - 1; index >= 0 && actions[index] === last; index -= 1) count += 1;
  return count >= 3 ? { action: last, count } : null;
}

function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

if (require.main === module) console.log(JSON.stringify(runBaseline(), null, 2));

module.exports = { runBaseline };
