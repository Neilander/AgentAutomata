const CORE = require("../map_progression_lab/map-progression-cognition-core");
const RUNTIME = require("./player-cognition-v1-event-runtime");
const ADAPTER = require("./map-cognition-v1-event-adapter");

function runProbabilityTrace(seed = "dry-real-long", attempts = 100, nodeId = "r1_main_1") {
  let gameState = CORE.initialState(seed);
  let cognitionState = RUNTIME.createState(seed);
  const rows = [];
  for (let index = 0; index < attempts; index += 1) {
    const result = ADAPTER.runMapAction(CORE, gameState, `challenge:${nodeId}`, cognitionState);
    if (!result.ok) return { ok: false, error: result.error, rows };
    gameState = result.state;
    cognitionState = result.cognitionState;
    const trace = [...cognitionState.trace].reverse().find((row) => row.type === "loot_outcome");
    const ledger = [...cognitionState.expectationLedger].reverse().find((row) => row.key === `probability:rare_equipment:${nodeId}`);
    const knowledge = cognitionState.knowledge.find((row) => row.pattern?.behavior?.includes(`rare_equipment:${nodeId}`));
    rows.push({
      attempt: index + 1,
      rarity: (result.event.loot || []).map((item) => item.rarity),
      mismatchStatus: trace?.mismatchStatus || "missing",
      expectationEmotion: trace?.expectationEmotion || 0,
      estimatedProbability: knowledge?.estimatedProbability ?? null,
      dryStreak: knowledge?.dryStreak || 0,
      expectedOccurrences: ledger?.expectedOccurrences || 0,
      ledgerStatus: ledger?.status || "missing",
    });
  }
  return { ok: true, seed, attempts, nodeId, rows, summary: summarize(rows) };
}

function summarize(rows) {
  const counts = {};
  for (const row of rows) counts[row.mismatchStatus] = (counts[row.mismatchStatus] || 0) + 1;
  return {
    counts,
    rareAttempts: rows.filter((row) => row.mismatchStatus === "probability_success").map((row) => row.attempt),
    abnormalDryAttempts: rows.filter((row) => row.mismatchStatus === "abnormal_dry").map((row) => row.attempt),
    firstReasonableDry: rows.find((row) => row.mismatchStatus === "reasonable_dry") || null,
    firstAbnormalDry: rows.find((row) => row.mismatchStatus === "abnormal_dry") || null,
  };
}

if (require.main === module) {
  const result = runProbabilityTrace(process.argv[2] || "dry-real-long", Number(process.argv[3] || 100), process.argv[4] || "r1_main_1");
  console.log(JSON.stringify(result.ok ? result.summary : result, null, 2));
}

module.exports = { runProbabilityTrace, summarize };
