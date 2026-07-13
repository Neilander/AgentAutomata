const BASELINE = require("./analyze-map-cognition-v3-ranger-onboarding");
const CANDIDATE = require("./analyze-map-cognition-v3-midlock");

function runComparison(options = {}) {
  const count = Number(options.count || 30);
  const maxActions = Number(options.maxActions || 40);
  const prefix = options.prefix || "midlock-ab";
  const seeds = Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);
  const baseline = seeds.map((seed) => summarize(BASELINE.runLoop(seed, maxActions)));
  const candidate = seeds.map((seed) => summarize(CANDIDATE.runLoop(seed, maxActions)));
  return {
    contract: {
      frozenModel: "player-cognition-v3",
      pairedSeeds: seeds,
      gameplayDifference: "candidate adds a Main 6 heavy-shield soft lock and a third visible Bandit key item; formal gameplay and Frozen V3 remain unchanged",
    },
    baseline: aggregate(baseline),
    candidate: aggregate(candidate),
    paired: pairedSummary(baseline, candidate),
    routes: seeds.map((seed, index) => ({ seed, baseline: baseline[index], candidate: candidate[index] })),
  };
}

function summarize(result) {
  if (!result.ok) return { ok: false, error: result.error };
  const { loop } = result;
  const actions = loop.actions || [];
  const firstLockIndex = actions.findIndex((row) => row.action === "challenge:r1_main_6");
  const firstLock = actions[firstLockIndex];
  const campIndex = actions.findIndex((row, index) => index > firstLockIndex && row.action === "challenge:r1_bandit" && row.outcome === "win");
  const retryIndex = actions.findIndex((row, index) => index > firstLockIndex && row.action === "challenge:r1_main_6");
  const retry = actions[retryIndex];
  const prisonIndex = actions.findIndex((row) => row.action === "challenge:r1_prison" && row.outcome === "win");
  const rangerSwapIndex = actions.findIndex((row) => row.action.startsWith("swap:") && row.action.endsWith(":hero_ranger"));
  const rangerProofIndex = actions.findIndex((row) => row.action === "challenge:r1_main_4");
  const rangerProof = (loop.gameState.history || []).find((event) => event.node === "r1_main_4" && event.roleProof?.rangerDamageShare != null);
  const campEvent = (loop.gameState.history || []).find((event) => event.node === "r1_bandit" && event.firstClear);
  const main6Memory = (loop.cognitionState.failureMemories || []).find((row) => row.key?.includes("r1_main_6"));
  return {
    ok: true,
    actions: actions.length,
    losses: actions.filter((row) => row.outcome === "loss").length,
    firstLockOutcome: firstLock?.outcome || "missing",
    choseCampAfterFailure: firstLock?.outcome === "loss" && campIndex === firstLockIndex + 1,
    retriedImmediately: campIndex >= 0 && retryIndex === campIndex + 1,
    retryOutcome: retry?.outcome || "none",
    bypassedWithExistingBuild: firstLock?.outcome === "win",
    keyGearGrowth: campEvent && campEvent.gearBefore > 0 ? round((campEvent.gearAfter - campEvent.gearBefore) / campEvent.gearBefore) : null,
    main6FailureRemembered: Boolean(main6Memory),
    onboardingPreserved: prisonIndex >= 0 && rangerSwapIndex === prisonIndex + 1 && rangerProofIndex === rangerSwapIndex + 1 && Boolean(rangerProof),
    terminal: Boolean(loop.terminal),
    finalEmotion: round(loop.cognitionState.emotion?.value),
    minimumActionEmotion: round(Math.min(...actions.map((row) => Number(row.emotionAfter || 0)))),
    emotionBeforeLock: firstLockIndex > 0 ? round(actions[firstLockIndex - 1].emotionAfter) : null,
    emotionAfterLock: firstLock ? round(firstLock.emotionAfter) : null,
    emotionAfterCamp: campIndex >= 0 ? round(actions[campIndex].emotionAfter) : null,
    emotionAfterRetry: retryIndex >= 0 ? round(actions[retryIndex].emotionAfter) : null,
  };
}

function aggregate(rows) {
  const valid = rows.filter((row) => row.ok);
  const count = valid.length || 1;
  const countWhere = (predicate) => valid.filter(predicate).length;
  const average = (key) => round(valid.reduce((sum, row) => sum + Number(row[key] || 0), 0) / count);
  const averagePresent = (key, subset = valid) => {
    const values = subset.map((row) => row[key]).filter((value) => Number.isFinite(value));
    return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  };
  const lossRoutes = valid.filter((row) => row.firstLockOutcome === "loss");
  return {
    routes: valid.length,
    firstLockWins: countWhere((row) => row.firstLockOutcome === "win"),
    firstLockLosses: lossRoutes.length,
    choseCampAfterFailure: countWhere((row) => row.choseCampAfterFailure),
    immediateRetries: countWhere((row) => row.retriedImmediately),
    successfulRetries: countWhere((row) => row.retryOutcome === "win"),
    existingBuildBypasses: countWhere((row) => row.bypassedWithExistingBuild),
    onboardingPreserved: countWhere((row) => row.onboardingPreserved),
    terminalRoutes: countWhere((row) => row.terminal),
    averageActions: average("actions"),
    averageLosses: average("losses"),
    averageFinalEmotion: average("finalEmotion"),
    averageEmotionGainPerAction: round(valid.reduce((sum, row) => sum + (row.finalEmotion - 38) / Math.max(1, row.actions), 0) / count),
    averageMinimumActionEmotion: average("minimumActionEmotion"),
    lossRouteEmotionBeforeLock: averagePresent("emotionBeforeLock", lossRoutes),
    lossRouteEmotionAfterLock: averagePresent("emotionAfterLock", lossRoutes),
    lossRouteEmotionAfterCamp: averagePresent("emotionAfterCamp", lossRoutes),
    lossRouteEmotionAfterRetry: averagePresent("emotionAfterRetry", lossRoutes),
    averageKeyGearGrowth: averagePresent("keyGearGrowth", lossRoutes),
  };
}

function pairedSummary(baseline, candidate) {
  let introducedReadableLock = 0;
  let preservedOnboarding = 0;
  let lostTerminal = 0;
  for (let index = 0; index < baseline.length; index += 1) {
    if (baseline[index].firstLockOutcome === "win" && candidate[index].firstLockOutcome === "loss" && candidate[index].retryOutcome === "win") introducedReadableLock += 1;
    if (baseline[index].onboardingPreserved && candidate[index].onboardingPreserved) preservedOnboarding += 1;
    if (baseline[index].terminal && !candidate[index].terminal) lostTerminal += 1;
  }
  return { introducedReadableLock, preservedOnboarding, lostTerminal };
}

function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

if (require.main === module) console.log(JSON.stringify(runComparison(), null, 2));

module.exports = { aggregate, runComparison, summarize };

