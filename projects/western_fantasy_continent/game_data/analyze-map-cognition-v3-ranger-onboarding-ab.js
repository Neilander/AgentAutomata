const BASELINE = require("./analyze-map-cognition-v3-action-loop");
const CANDIDATE = require("./analyze-map-cognition-v3-ranger-onboarding");

function runComparison(options = {}) {
  const count = Number(options.count || 30);
  const maxActions = Number(options.maxActions || 40);
  const prefix = options.prefix || "ranger-onboarding";
  const seeds = Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);
  const baseline = seeds.map((seed) => summarizeRoute(BASELINE.runLoop(seed, maxActions), { proofNode: "r1_main_7" }));
  const candidate = seeds.map((seed) => summarizeRoute(CANDIDATE.runLoop(seed, maxActions), { proofNode: "r1_main_4" }));
  return {
    contract: {
      frozenModel: "player-cognition-v3",
      pairedSeeds: seeds,
      gameplayDifference: "candidate scales the isolated Prison enemy team to 0.84 and moves a scaled Ranger proof encounter to Main 4; Frozen V3 and formal gameplay remain unchanged",
    },
    baseline: aggregate(baseline),
    candidate: aggregate(candidate),
    paired: pairedSummary(baseline, candidate),
    routes: seeds.map((seed, index) => ({ seed, baseline: baseline[index], candidate: candidate[index] })),
  };
}

function summarizeRoute(result, options = {}) {
  if (!result.ok) return { ok: false, error: result.error };
  const { loop } = result;
  const actions = loop.actions || [];
  const actionIndex = (predicate) => actions.findIndex(predicate);
  const rescueIndex = actionIndex((row) => row.action === "challenge:r1_prison" && row.outcome === "win");
  const firstPrison = actions.find((row) => row.action === "challenge:r1_prison");
  const swapIndex = actionIndex((row) => row.action === "swap:1:hero_ranger" || row.action === "swap:3:hero_ranger" || row.action === "swap:0:hero_ranger" || row.action === "swap:2:hero_ranger");
  const proofNode = options.proofNode || "r1_main_4";
  const proofIndex = actionIndex((row) => row.action === `challenge:${proofNode}`);
  const bossIndex = actionIndex((row) => row.action === "challenge:r1_boss");
  const proofEvent = (loop.gameState.history || []).find((event) => event.node === proofNode && event.roleProof?.rangerDamageShare != null);
  const experiment = (loop.cognitionState.affordanceExperiments || []).find((row) => row.heroId === "hero_ranger");
  const hypothesis = (loop.cognitionState.hypotheses || []).find((row) => row.id === "verify-team-experiment:hero_ranger");
  return {
    ok: true,
    actions: actions.length,
    losses: actions.filter((row) => row.outcome === "loss").length,
    firstPrisonOutcome: firstPrison?.outcome || "not_attempted",
    rescueIndex,
    swapIndex,
    proofIndex,
    bossIndex,
    rescueBeforeProof: rescueIndex >= 0 && proofIndex >= 0 && rescueIndex < proofIndex,
    rescueBeforeBoss: rescueIndex >= 0 && bossIndex >= 0 && rescueIndex < bossIndex,
    immediateVoluntaryUse: rescueIndex >= 0 && swapIndex === rescueIndex + 1,
    visibleRoleProof: Boolean(proofEvent),
    experimentStatus: experiment?.status || "missing",
    hypothesisStatus: hypothesis?.status || "missing",
    terminal: Boolean(loop.terminal),
    finalEmotion: round(loop.cognitionState.emotion?.value),
    minimumActionEmotion: round(Math.min(...actions.map((row) => Number(row.emotionAfter || 0)))),
    rescueEmotion: rescueIndex >= 0 ? round(actions[rescueIndex]?.emotionAfter) : null,
    proofEmotion: proofIndex >= 0 ? round(actions[proofIndex]?.emotionAfter) : null,
    bossEmotion: bossIndex >= 0 ? round(actions[bossIndex]?.emotionAfter) : null,
    unlockEmotion: emotionEvent(loop, "character_unlock"),
    swapEmotion: emotionEvent(loop, "team_changed"),
    verifyEmotion: emotionEvent(loop, "team_experiment_result"),
  };
}

function emotionEvent(loop, kind) {
  const row = (loop.cognitionState.trace || []).find((entry) => entry.tuple?.result?.kind === kind);
  if (!row) return null;
  return {
    before: round(row.emotionBefore),
    after: round(row.emotionAfter),
    delta: round(Number(row.emotionAfter || 0) - Number(row.emotionBefore || 0)),
  };
}

function aggregate(rows) {
  const valid = rows.filter((row) => row.ok);
  const count = valid.length || 1;
  const countWhere = (key) => valid.filter((row) => row[key]).length;
  const average = (key) => round(valid.reduce((sum, row) => sum + Number(row[key] || 0), 0) / count);
  const averagePresent = (key) => {
    const values = valid.map((row) => row[key]).filter((value) => Number.isFinite(value));
    return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  };
  const eventAverage = (key, field) => {
    const events = valid.map((row) => row[key]).filter(Boolean);
    return events.length ? round(events.reduce((sum, row) => sum + Number(row[field] || 0), 0) / events.length) : null;
  };
  return {
    routes: valid.length,
    firstPrisonWins: valid.filter((row) => row.firstPrisonOutcome === "win").length,
    rescueBeforeProof: countWhere("rescueBeforeProof"),
    rescueBeforeBoss: countWhere("rescueBeforeBoss"),
    immediateVoluntaryUse: countWhere("immediateVoluntaryUse"),
    visibleRoleProof: countWhere("visibleRoleProof"),
    confirmedExperiments: valid.filter((row) => row.hypothesisStatus === "confirmed").length,
    terminalRoutes: countWhere("terminal"),
    averageActions: average("actions"),
    averageLosses: average("losses"),
    averageFinalEmotion: average("finalEmotion"),
    averageEmotionGainPerAction: round(valid.reduce((sum, row) => sum + (row.finalEmotion - 38) / Math.max(1, row.actions), 0) / count),
    averageMinimumActionEmotion: average("minimumActionEmotion"),
    averageEmotionAfterRescue: averagePresent("rescueEmotion"),
    averageEmotionAfterProof: averagePresent("proofEmotion"),
    averageEmotionAfterBoss: averagePresent("bossEmotion"),
    averageUnlockEmotionDelta: eventAverage("unlockEmotion", "delta"),
    averageSwapEmotionDelta: eventAverage("swapEmotion", "delta"),
    averageVerifyEmotionDelta: eventAverage("verifyEmotion", "delta"),
  };
}

function pairedSummary(baseline, candidate) {
  let earlierRescue = 0;
  let gainedPreProofRescue = 0;
  let lostRoleProof = 0;
  let lowerFinalEmotion = 0;
  for (let index = 0; index < baseline.length; index += 1) {
    const before = baseline[index];
    const after = candidate[index];
    if (after.rescueIndex >= 0 && (before.rescueIndex < 0 || after.rescueIndex < before.rescueIndex)) earlierRescue += 1;
    if (!before.rescueBeforeProof && after.rescueBeforeProof) gainedPreProofRescue += 1;
    if (before.visibleRoleProof && !after.visibleRoleProof) lostRoleProof += 1;
    if (after.finalEmotion < before.finalEmotion) lowerFinalEmotion += 1;
  }
  return { earlierRescue, gainedPreProofRescue, lostRoleProof, lowerFinalEmotion };
}

function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

if (require.main === module) console.log(JSON.stringify(runComparison(), null, 2));

module.exports = { aggregate, runComparison, summarizeRoute };
