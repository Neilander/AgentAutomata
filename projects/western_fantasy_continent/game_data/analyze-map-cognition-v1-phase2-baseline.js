const LOOP = require("./analyze-map-cognition-v1-action-loop");

function runBaseline(options = {}) {
  const seeds = options.seeds || ["phase2-a", "phase2-b", "phase2-c", "phase2-d", "phase2-e"];
  const maxActions = Number(options.maxActions || 20);
  const runs = seeds.map((seed) => summarizeRun(LOOP.runLoop(seed, maxActions), seed));
  return { schema: "player_cognition_v1_phase2_baseline", maxActions, runs, aggregate: aggregate(runs) };
}

function summarizeRun(result, seed) {
  if (!result.ok) return { seed, ok: false, error: result.error };
  const actions = result.loop.actions;
  const rows = actions.map((row, index) => ({
    ...row,
    emotionBefore: index ? actions[index - 1].emotionAfter : 38,
    emotionDelta: round(row.emotionAfter - (index ? actions[index - 1].emotionAfter : 38)),
  }));
  const bossRows = rows.filter((row) => row.action === "challenge:r1_boss");
  const firstBossLossIndex = rows.findIndex((row) => row.action === "challenge:r1_boss" && row.outcome === "loss");
  const afterBossLoss = firstBossLossIndex >= 0 ? rows.slice(firstBossLossIndex + 1) : [];
  return {
    seed,
    ok: true,
    rows,
    minimumEmotion: round(Math.min(38, ...rows.map((row) => row.emotionAfter))),
    finalEmotion: rows.at(-1)?.emotionAfter || 38,
    lowestDelta: [...rows].sort((a, b) => a.emotionDelta - b.emotionDelta)[0] || null,
    bossAttempts: bossRows.length,
    bossWins: bossRows.filter((row) => row.outcome === "win").length,
    bossRetriesAfterLoss: afterBossLoss.filter((row) => row.action === "challenge:r1_boss").length,
    postBossLossActions: afterBossLoss.map((row) => row.action),
    repeatedTerminalAction: repeatedTail(rows.map((row) => row.action)),
  };
}

function aggregate(runs) {
  const valid = runs.filter((run) => run.ok);
  const failedBoss = valid.filter((run) => run.bossAttempts > 0 && run.bossWins === 0);
  const noRetry = failedBoss.filter((run) => run.bossRetriesAfterLoss === 0);
  const lowestByAction = {};
  for (const run of valid) {
    const key = run.lowestDelta?.action || "none";
    lowestByAction[key] = (lowestByAction[key] || 0) + 1;
  }
  return {
    runs: valid.length,
    bossReached: valid.filter((run) => run.bossAttempts > 0).length,
    bossCleared: valid.filter((run) => run.bossWins > 0).length,
    bossFailed: failedBoss.length,
    failedBossWithoutRetry: noRetry.length,
    terminalRepeats: valid.map((run) => ({ seed: run.seed, action: run.repeatedTerminalAction })),
    lowestByAction,
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

module.exports = { runBaseline, summarizeRun, aggregate };
