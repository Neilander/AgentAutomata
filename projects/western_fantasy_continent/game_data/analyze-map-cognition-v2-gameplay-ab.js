const BASE_CORE = require("../map_progression_lab/map-progression-cognition-core");
const RECOVERY_CORE = require("../map_progression_lab/map-progression-cognition-core-phase2-recovery");
const RUNTIME = require("./player-cognition-v2-event-runtime");
const ADAPTER = require("./map-cognition-v2-event-adapter");
const POLICY = require("./player-cognition-v2-action-policy");

function runWithCore(core, seed, maxActions = 40) {
  let gameState = core.initialState(seed);
  let cognitionState = RUNTIME.createState(seed);
  const actions = [];
  let terminal = null;
  for (let step = 1; step <= maxActions; step += 1) {
    const observation = core.observe(gameState);
    const choice = POLICY.selectNextAction(cognitionState, observation, { time: gameState.step || 0 });
    if (choice.terminal) {
      terminal = { step, reason: choice.reason };
      break;
    }
    if (!choice.action) return { ok: false, seed, error: "no_action", actions };
    const emotionBefore = cognitionState.emotion.value;
    const gearBefore = observation.gear.score;
    const result = ADAPTER.runMapAction(core, gameState, choice.action, choice.cognitionState);
    if (!result.ok) return { ok: false, seed, error: result.error, actions };
    gameState = result.state;
    cognitionState = result.cognitionState;
    actions.push({
      step,
      action: choice.action,
      outcome: result.event.outcome,
      emotionBefore: round(emotionBefore),
      emotionAfter: round(cognitionState.emotion.value),
      emotionDelta: round(cognitionState.emotion.value - emotionBefore),
      gearBefore,
      gearAfter: core.observe(gameState).gear.score,
      loot: result.event.loot || [],
      rewardHint: observation.visibleNodes.find((node) => `challenge:${node.id}` === choice.action)?.rewardHint || "",
    });
  }
  return { ok: true, seed, actions, terminal, cognitionState, gameState };
}

function summarize(run) {
  const bossRows = run.actions.filter((row) => row.action === "challenge:r1_boss");
  const firstBossLoss = run.actions.findIndex((row) => row.action === "challenge:r1_boss" && row.outcome === "loss");
  const retryIndex = firstBossLoss < 0 ? -1 : run.actions.findIndex((row, index) => index > firstBossLoss && row.action === "challenge:r1_boss");
  const preparation = firstBossLoss < 0 ? [] : run.actions.slice(firstBossLoss + 1, retryIndex < 0 ? undefined : retryIndex);
  return {
    seed: run.seed,
    bossLosses: bossRows.filter((row) => row.outcome === "loss").length,
    bossWins: bossRows.filter((row) => row.outcome === "win").length,
    preparationActions: preparation.length,
    preparationEmotion: round(preparation.reduce((sum, row) => sum + row.emotionDelta, 0)),
    preparationGearGain: preparation.length ? preparation.at(-1).gearAfter - preparation[0].gearBefore : 0,
    preparationNoGrowth: preparation.filter((row) => row.gearAfter <= row.gearBefore).length,
    preparationEmotionPerAction: round(preparation.reduce((sum, row) => sum + row.emotionDelta, 0) / Math.max(1, preparation.length)),
    preparationRoute: preparation.map((row) => row.action),
    minimumActionDelta: round(Math.min(...run.actions.map((row) => row.emotionDelta))),
    finalEmotion: round(run.cognitionState.emotion.value),
    totalActions: run.actions.length,
    terminal: Boolean(run.terminal),
  };
}

function runPair(options = {}) {
  const seeds = options.seeds || ["phase2-a", "phase2-b", "phase2-c", "phase2-d", "phase2-e"];
  const pairs = seeds.map((seed) => {
    const baseline = runWithCore(BASE_CORE, seed, options.maxActions || 40);
    const recovery = runWithCore(RECOVERY_CORE, seed, options.maxActions || 40);
    return { seed, baseline: summarize(baseline), recovery: summarize(recovery), baselineRun: baseline, recoveryRun: recovery };
  });
  return { schema: "player_cognition_v2_gameplay_ab", pairs, aggregate: aggregate(pairs) };
}

function aggregate(pairs) {
  const losses = pairs.filter((pair) => pair.baseline.bossLosses > 0);
  return {
    pairedSeeds: pairs.length,
    bossLossSeeds: losses.length,
    baseline: average(losses.map((pair) => pair.baseline)),
    recovery: average(losses.map((pair) => pair.recovery)),
  };
}

function average(rows) {
  const mean = (key) => round(rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / Math.max(1, rows.length));
  return {
    preparationActions: mean("preparationActions"),
    preparationEmotion: mean("preparationEmotion"),
    preparationGearGain: mean("preparationGearGain"),
    preparationNoGrowth: mean("preparationNoGrowth"),
    preparationEmotionPerAction: mean("preparationEmotionPerAction"),
    finalEmotion: mean("finalEmotion"),
    totalActions: mean("totalActions"),
  };
}

function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

if (require.main === module) {
  const result = runPair();
  console.log(JSON.stringify({ aggregate: result.aggregate, pairs: result.pairs.map(({ seed, baseline, recovery }) => ({ seed, baseline, recovery })) }, null, 2));
}

module.exports = { runWithCore, runPair, summarize };
