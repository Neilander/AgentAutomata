const { EMOTION_FAMILIES } = require("../experiments/player_emotion_model_v1/emotion-model-contract");
const { simulateEmotionSequence } = require("../experiments/player_emotion_model_v1/emotion-simulator-v1");
const PLAYER_PROFILES = require("../experiments/player_agent_api_loop_v1/player-profiles");

const ADAPTER_CONFIG = Object.freeze({
  cycleSeconds: 90,
  expectationScale: 0.35,
  confirmationScale: 0.05,
  resultScale: 3,
  routineRewardHabituationRate: 0.22,
  routineRewardFloor: 0.45,
  categoryRewardHabituationRate: 0.55,
  categoryRewardFloor: 0.4,
  categoryRewardRecoveryTauSeconds: 900,
  emotionThreshold: 0.08,
  maxEmotions: 8,
});

function simulateChapterFeedbackEmotion(session, options = {}) {
  if (!session?.cognitionState?.trace || !Array.isArray(session.history)) {
    throw new Error("a completed player chapter session is required");
  }
  const config = { ...ADAPTER_CONFIG, ...(options.config || {}) };
  const episodes = buildFeedbackEpisodes(session, config);
  if (!episodes.length) throw new Error("chapter session contains no feedback episodes");
  const moments = episodes.flatMap((episode) => episode.emotionMoments);
  const profile = emotionProfileFor(options.profileId || session.profileState?.profileId || "open_novice");
  const simulation = simulateEmotionSequence({
    profile,
    initialPhysiology: { chemistry: {} },
    longTermContext: {
      chronicStress: 0,
      fatigue: 0,
      unresolvedLoss: 0,
      repeatedFailure: 0,
      socialIsolation: 0,
      memories: [],
    },
    events: moments.map((moment) => moment.emotionEvent),
  }, {
    emotionThreshold: config.emotionThreshold,
    maxEmotions: config.maxEmotions,
  });
  const frames = simulation.frames.map((frame, index) => ({
    ...frame,
    episode: summarizeEpisode(moments[index]),
    emotionVector: fullEmotionVector(frame.emotions),
    experiences: moments[index].experiences,
  }));
  return {
    schema: "player_feedback_emotion_sequence_v1",
    adapterSchema: "player_feedback_v2_to_emotion_appraisal_v1",
    profileId: options.profileId || session.profileState?.profileId || "open_novice",
    frames,
    finalChemistry: simulation.finalChemistry,
    audit: {
      inputEpisodeCount: episodes.length,
      inputMomentCount: moments.length,
      outputFrameCount: frames.length,
      rawPhysicalInputsUsed: false,
      agentSuppliedEmotionUsed: false,
      feedbackV1UsedForEmotion: false,
      feedbackV2UsedForEmotion: true,
      qDecisionDefaulted: false,
      agencyDefaulted: false,
      provisionalParameters: structuredClone(config),
    },
  };
}

function buildFeedbackEpisodes(session, config = ADAPTER_CONFIG) {
  const episodes = [];
  let current = null;
  for (const trace of session.cognitionState.trace) {
    if (trace.type === "decision") {
      if (current) episodes.push(current);
      current = {
        cycle: episodes.length + 1,
        decisionTrace: trace,
        feedbackTraces: trace.feedbackV2 ? [trace] : [],
      };
    } else if (current && trace.feedbackV2) {
      current.feedbackTraces.push(trace);
    }
  }
  if (current) episodes.push(current);

  let unresolvedFailureCount = 0;
  let routineWinStreak = 0;
  const rewardCategoryMemory = new Map();
  let previousAction = null;
  let sameActionStreak = 0;
  return episodes.slice(0, session.history.length).map((episode, index) => {
    const history = session.history[index];
    const action = history.action || episode.decisionTrace?.tuple?.result?.action || "unknown";
    const timeSeconds = Number.isFinite(Number(history.timeSeconds))
      ? Number(history.timeSeconds)
      : (index + 1) * config.cycleSeconds;
    const rewardTraces = episode.feedbackTraces.filter((trace) => isRewardTrace(trace));
    const rewardCategories = rewardCategoriesFromTraces(rewardTraces);
    const categoryRewardHabituation = updateCategoryRewardHabituation(
      rewardCategoryMemory,
      rewardCategories,
      timeSeconds,
      config,
    );
    sameActionStreak = action === previousAction ? sameActionStreak + 1 : 1;
    const enriched = enrichEpisode({
      ...episode,
      history,
      action,
      timeSeconds,
      outcome: history.outcome || "unknown",
      failureCountBefore: unresolvedFailureCount,
      routineWinStreakBefore: routineWinStreak,
      rewardCategories,
      categoryRewardHabituation,
      sameActionStreak,
    }, config);
    if (history.outcome === "loss") {
      unresolvedFailureCount += 1;
      routineWinStreak = 0;
    }
    if (history.outcome === "win") {
      unresolvedFailureCount = 0;
      routineWinStreak += 1;
    }
    previousAction = action;
    return enriched;
  });
}

function enrichEpisode(episode, config) {
  const rewardTraces = episode.feedbackTraces.filter((trace) => isRewardTrace(trace));
  const primaryTraces = episode.feedbackTraces.filter((trace) => !isRewardTrace(trace));
  const primaryAggregate = aggregateFeedback(primaryTraces, {
    includeExpectation: episode.action.startsWith("challenge:")
      ? (trace) => trace.type === "combat_result"
        || trace.type === "action_summary"
        || trace.expectationSource === "roster_prediction"
      : null,
  });
  const emotionMoments = [buildEmotionMoment(episode, primaryAggregate, "primary", config)];
  if (rewardTraces.length) {
    emotionMoments.push(buildEmotionMoment(
      episode,
      aggregateFeedback(rewardTraces),
      "reward",
      config,
    ));
  }
  return {
    ...episode,
    emotionMoments,
  };
}

function buildEmotionMoment(episode, aggregate, momentKind, config) {
  const context = episodeContext(episode, aggregate, config, momentKind);
  const appraisals = buildAppraisals(context, config);
  const experiences = buildExperiences(context, config);
  return {
    ...episode,
    momentKind,
    aggregate,
    context,
    experiences,
    emotionEvent: {
      id: `chapter-cycle:${episode.cycle}:${momentKind}:${episode.action}`,
      time: episode.timeSeconds + (momentKind === "reward" ? 20 : 0),
      description: describeEpisode(episode, context, momentKind),
      appraisals,
      targets: buildTargets(episode, context, momentKind),
      measuredChemistry: {},
      observedPhysical: {},
    },
  };
}

function aggregateFeedback(traces, options = {}) {
  const totals = { process: 0, R: 0, A: 0, C: 0, EVerify: 0 };
  const hValues = [];
  const verificationRows = [];
  const expectationStatuses = [];
  for (const trace of traces) {
    const bundle = trace.feedbackV2;
    if (!bundle) continue;
    for (const channel of Object.keys(totals)) {
      if (channel === "A" && options.includeExpectation && !options.includeExpectation(trace)) continue;
      totals[channel] += Number(bundle.channels?.[channel]?.value || 0);
    }
    if (Number.isFinite(Number(bundle.evidence?.H))) hValues.push(Number(bundle.evidence.H));
    verificationRows.push(...(bundle.channels?.EVerify?.rows || []));
    expectationStatuses.push(bundle.channels?.A?.status || "unresolved");
  }
  const strategySatisfaction = verificationRows.reduce(
    (sum, row) => sum + Number(row.derived?.strategySatisfaction || 0),
    0,
  );
  const discoverySatisfaction = verificationRows.reduce(
    (sum, row) => sum + Number(row.derived?.discoverySatisfaction || 0),
    0,
  );
  const causalSupport = verificationRows.reduce(
    (strongest, row) => Math.max(strongest, Number(row.derived?.knowledgeEvidence || 0)),
    0,
  );
  const causalRefutation = verificationRows.reduce(
    (strongest, row) => Math.min(strongest, Number(row.derived?.knowledgeEvidence || 0)),
    0,
  );
  return {
    totals: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, round(value)])),
    meanH: hValues.length ? round(hValues.reduce((sum, value) => sum + value, 0) / hValues.length) : null,
    expectationStatuses,
    verificationRows,
    strategySatisfaction: round(strategySatisfaction),
    discoverySatisfaction: round(discoverySatisfaction),
    causalSupport: round(causalSupport),
    causalRefutation: round(causalRefutation),
  };
}

function episodeContext(episode, aggregate, config, momentKind = "primary") {
  const action = episode.action;
  const outcome = episode.outcome;
  const isReward = momentKind === "reward";
  const isChallenge = action.startsWith("challenge:") && !isReward;
  const isBoss = action.includes("boss");
  const isWin = outcome === "win" && !isReward;
  const isLoss = outcome === "loss" && !isReward;
  const isEquip = outcome === "equipped" && !isReward;
  const isSwap = outcome === "team_changed" && !isReward;
  const EDecision = Number(episode.decisionTrace?.feedbackV2?.channels?.process?.components?.decision?.EDecision || 0);
  const allowedActionCount = episode.history?.decisionRequest?.observation?.allowedActions?.length || 0;
  const decisionAuthorship = allowedActionCount <= 1
    ? 0.15
    : clamp01(0.45 + 0.55 * Math.min(1, EDecision / 4));
  const selectedRosterExpectation = selectedRosterExpectationFor(episode.history, action);
  const unknownRosterPrediction = Boolean(
    selectedRosterExpectation
      && selectedRosterExpectation.predictedPerformanceScore == null,
  );
  const expectationResolved = aggregate.expectationStatuses.some((status) => (
    String(status).startsWith("resolved") || ["reasonable_dry", "abnormal_dry"].includes(status)
  ));
  const positiveResult = squashPositive(aggregate.totals.R, config.resultScale);
  const processDiscomfort = squashPositive(-aggregate.totals.process, 0.8);
  const confirmationStrength = squashPositive(aggregate.totals.C, config.confirmationScale);
  const causalSupport = clamp01(aggregate.causalSupport);
  const difficulty = clamp01(
    (isBoss ? 0.65 : isChallenge ? 0.18 : 0)
      + Math.min(0.65, episode.failureCountBefore * 0.18),
  );
  const routineOutcomeHabituation = isBoss || episode.failureCountBefore > 0
    ? 1
    : Math.max(
      config.routineRewardFloor,
      Math.exp(-config.routineRewardHabituationRate * episode.routineWinStreakBefore),
    );
  const rewardHabituation = isReward
    ? episode.categoryRewardHabituation
    : routineOutcomeHabituation;
  return {
    action,
    outcome,
    momentKind,
    isReward,
    isChallenge,
    isBoss,
    isWin,
    isLoss,
    isEquip,
    isSwap,
    EDecision,
    allowedActionCount,
    decisionAuthorship: round(decisionAuthorship),
    failureCountBefore: episode.failureCountBefore,
    sameActionStreak: episode.sameActionStreak,
    routineWinStreakBefore: episode.routineWinStreakBefore,
    rewardHabituation: round(rewardHabituation),
    rewardCategories: episode.rewardCategories,
    unknownRosterPrediction,
    expectationResolved,
    positiveResult,
    processDiscomfort,
    aggregateA: aggregate.totals.A,
    aggregateC: aggregate.totals.C,
    confirmationStrength,
    causalSupport,
    causalRefutation: clamp01(Math.abs(Math.min(0, aggregate.causalRefutation))),
    strategySatisfaction: aggregate.strategySatisfaction,
    discoverySatisfaction: aggregate.discoverySatisfaction,
    difficulty,
    meanH: aggregate.meanH,
  };
}

function buildAppraisals(context, config) {
  const confidence = clamp01(0.45 + 0.45 * (context.meanH ?? 0.5));
  const goalRelevance = context.isReward ? 0.48
    : context.isBoss ? 1 : context.isChallenge ? 0.9 : context.isSwap ? 0.72 : 0.62;
  const valence = context.isReward
    ? clamp01(0.56 + 0.28 * context.positiveResult)
    : context.isWin ? 0.88
    : context.isLoss ? 0.14
      : context.isEquip ? 0.68
        : context.isSwap ? 0.58
          : clamp01(0.5 + 0.35 * squashSigned(context.positiveResult, 1));
  const goalCongruence = context.isReward
    ? clamp01(0.55 + 0.25 * context.positiveResult)
    : context.isWin ? 0.9
    : context.isLoss ? 0.12
      : context.isEquip ? 0.7
        : context.isSwap ? 0.6
          : valence;
  const lossPressure = context.isLoss
    ? clamp01(0.48 + 0.11 * context.failureCountBefore)
    : 0;
  const threatResolution = context.isWin && context.failureCountBefore > 0
    ? clamp01(0.45 + 0.12 * context.failureCountBefore)
    : 0;
  const control = context.causalSupport > 0
    ? clamp01(0.5 + 0.4 * context.causalSupport)
    : context.isLoss
      ? clamp01(0.48 - 0.08 * context.failureCountBefore)
      : 0.5;
  const informationGap = context.unknownRosterPrediction
    ? 0.82
    : context.causalRefutation > 0
      ? 0.65
      : 0;
  const appraisals = {
    goalRelevance: appraisal(goalRelevance, confidence),
    outcomeValence: appraisal(valence, confidence),
    goalCongruence: appraisal(goalCongruence, confidence),
    socialSafety: appraisal(0, 0.7),
    controllability: appraisal(control, context.causalSupport > 0 ? 0.78 : 0.58),
    obstruction: appraisal(
      Math.max(
        context.isLoss ? clamp01(0.68 + 0.06 * context.failureCountBefore) : 0,
        context.isChallenge ? 0.24 * context.processDiscomfort : 0,
      ),
      confidence,
    ),
    threatMagnitude: appraisal(lossPressure, confidence),
    threatImmediacy: appraisal(context.isLoss ? 0.34 : 0, confidence),
    expectedUncertainty: appraisal(
      context.isLoss || context.unknownRosterPrediction
        ? clamp01(0.55 + 0.08 * context.failureCountBefore)
        : 0.28,
      0.65,
    ),
    rewardConsumption: appraisal(
      context.isWin ? clamp01(0.48 + 0.42 * context.positiveResult) * context.rewardHabituation
        : context.isReward ? clamp01(0.28 + 0.42 * context.positiveResult) * context.rewardHabituation
          : context.isEquip ? 0.42 : 0,
      confidence,
    ),
    positiveOutcomeProspect: appraisal(
      context.isEquip || context.isSwap ? 0.62
        : context.isReward ? 0.24 * (0.7 + 0.3 * context.rewardHabituation)
        : context.isWin && !context.isBoss ? 0.58 * (0.7 + 0.3 * context.rewardHabituation)
          : context.isLoss ? 0.22 : 0.35,
      0.62,
    ),
    threatResolution: appraisal(threatResolution, confidence),
    lossGap: appraisal(context.isLoss ? 0.08 : 0, confidence),
    irreversibility: appraisal(context.isLoss ? 0.02 : 0, 0.8),
    informationGap: appraisal(informationGap, informationGap > 0 ? 0.72 : 0),
    repetition: appraisal(clamp01((context.sameActionStreak - 1) / 3), 0.8),
    unexpectedChange: appraisal(0, 0),
    selfAttribution: appraisal(
      context.isReward ? 0
        : context.isWin
        ? Math.max(context.causalSupport, 0.18 + 0.38 * context.decisionAuthorship)
        : 0,
      context.causalSupport > 0 ? 0.78 : 0.46,
    ),
    selfEvaluationValence: appraisal(
      context.isReward ? 0.5
        : context.isWin
        ? clamp01(0.55 + 0.25 * context.decisionAuthorship + 0.2 * context.confirmationStrength)
        : context.isLoss ? 0.43 : 0.5,
      0.58,
    ),
    statusChallenge: appraisal(
      context.isBoss ? 0.82 : context.isWin && context.failureCountBefore > 0 ? 0.62 : 0,
      context.isBoss || context.failureCountBefore > 0 ? 0.8 : 0,
    ),
  };
  if (context.expectationResolved || context.confirmationStrength > 0) {
    const signedA = squashSigned(context.aggregateA ?? 0, config.expectationScale);
    appraisals.rewardPredictionError = appraisal(0.5 + 0.5 * signedA, confidence);
    appraisals.unexpectedChange = appraisal(Math.abs(signedA), confidence);
  }
  return appraisals;
}

function buildExperiences(context, config) {
  const achievement = context.isWin && !context.isReward
    ? clamp01(context.difficulty * (0.35 + 0.65 * context.decisionAuthorship))
    : 0;
  return {
    achievement: round(achievement),
    strategySatisfaction: round(squashPositive(context.strategySatisfaction ?? 0, 1)),
    discoverySatisfaction: round(squashPositive(context.discoverySatisfaction ?? 0, 1)),
    confirmationSatisfaction: round(squashPositive(context.aggregateC ?? 0, config.confirmationScale)),
  };
}

function selectedRosterExpectationFor(history, action) {
  const view = history?.decisionRequest?.playerState?.rosterChangeExpectations;
  return Array.isArray(view?.actions) ? view.actions.find((row) => row.action === action) || null : null;
}

function describeEpisode(episode, context, momentKind = "primary") {
  if (momentKind === "reward") return `第${episode.cycle}轮：${episode.action}之后的掉落与解锁反馈`;
  if (context.isBoss && context.isWin) return `第${episode.cycle}轮：击败第一章Boss`;
  if (context.isBoss && context.isLoss) return `第${episode.cycle}轮：挑战第一章Boss失败`;
  if (context.isChallenge && context.isWin) return `第${episode.cycle}轮：${episode.action}战斗胜利`;
  if (context.isChallenge && context.isLoss) return `第${episode.cycle}轮：${episode.action}战斗失败`;
  if (context.isEquip) return `第${episode.cycle}轮：主动更换装备`;
  if (context.isSwap) return `第${episode.cycle}轮：主动更换角色`;
  return `第${episode.cycle}轮：${episode.action}，结果${episode.outcome}`;
}

function buildTargets(episode, context, momentKind = "primary") {
  const node = episode.action.startsWith("challenge:") ? episode.action.slice("challenge:".length) : null;
  return {
    attentionTarget: node || episode.action,
    rewardSource: momentKind === "reward" ? "掉落与解锁结果"
      : context.isWin ? node || "本轮结果" : context.isEquip ? "装备提升" : null,
    goalObject: node || "推进第一章",
    obstacleTarget: context.isLoss ? node || "当前阻碍" : null,
    resolvedThreat: context.isWin && context.failureCountBefore > 0 ? node || "此前失败点" : null,
    informationObject: context.unknownRosterPrediction ? "新角色的实际作用" : null,
    self: "player",
  };
}

function summarizeEpisode(episode) {
  return {
    cycle: episode.cycle,
    momentKind: episode.momentKind,
    action: episode.action,
    outcome: episode.outcome,
    feedback: episode.aggregate.totals,
    meanH: episode.aggregate.meanH,
    EDecision: episode.context.EDecision,
    decisionAuthorship: episode.context.decisionAuthorship,
    failureCountBefore: episode.failureCountBefore,
    sameActionStreak: episode.sameActionStreak,
    routineWinStreakBefore: episode.context.routineWinStreakBefore,
    rewardHabituation: episode.context.rewardHabituation,
    rewardCategories: episode.context.rewardCategories,
    unknownRosterPrediction: episode.context.unknownRosterPrediction,
    causalSupport: episode.context.causalSupport,
    causalRefutation: episode.context.causalRefutation,
    difficulty: episode.context.difficulty,
  };
}

function isRewardTrace(trace) {
  return new Set(["loot", "loot_outcome", "character_unlock", "map_unlock"]).has(trace.type);
}

function rewardCategoriesFromTraces(traces) {
  const categories = new Set();
  const hasConcreteLoot = traces.some((trace) => trace.type === "loot");
  for (const trace of traces) {
    const result = trace.feedbackV2?.evidence?.result || trace.tuple?.result || {};
    if (trace.type === "loot") {
      categories.add(`loot:${result.rarity || "unknown"}`);
    } else if (trace.type === "character_unlock") {
      categories.add("character_unlock");
    } else if (trace.type === "map_unlock") {
      categories.add("map_unlock");
    } else if (trace.type === "loot_outcome" && !hasConcreteLoot) {
      const components = Array.isArray(result.components) ? result.components : [];
      if (!components.length) categories.add("loot:none");
      for (const component of components) {
        if (component?.kind === "loot") categories.add(`loot:${component.rarity || "unknown"}`);
      }
    }
  }
  return [...categories].sort();
}

function updateCategoryRewardHabituation(memory, categories, timeSeconds, config) {
  if (!categories.length) return 1;
  const factors = categories.map((category) => {
    const previous = memory.get(category);
    const elapsed = previous ? Math.max(0, timeSeconds - previous.timeSeconds) : 0;
    const exposure = previous
      ? previous.exposure * Math.exp(-elapsed / config.categoryRewardRecoveryTauSeconds)
      : 0;
    const factor = config.categoryRewardFloor
      + (1 - config.categoryRewardFloor)
        * Math.exp(-config.categoryRewardHabituationRate * exposure);
    memory.set(category, {
      exposure: exposure + 1,
      timeSeconds,
    });
    return factor;
  });
  return round(Math.max(...factors));
}

function fullEmotionVector(emotions) {
  const vector = Object.fromEntries(EMOTION_FAMILIES.map((family) => [family, 0]));
  for (const emotion of emotions) vector[emotion.family] = round(emotion.intensity);
  return vector;
}

function emotionProfileFor(profileId) {
  const profile = PLAYER_PROFILES.getPlayerProfile(profileId);
  return {
    riskTolerance: profile.decisionBias?.riskTolerance ?? 0.5,
    domainSelfEfficacy: 0.5,
  };
}

function appraisal(value, confidence) {
  return { value: clamp01(value), confidence: clamp01(confidence) };
}

function squashSigned(value, scale) {
  return Math.tanh(Number(value || 0) / Math.max(0.0001, scale));
}

function squashPositive(value, scale) {
  return clamp01(1 - Math.exp(-Math.max(0, Number(value || 0)) / Math.max(0.0001, scale)));
}

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

module.exports = {
  ADAPTER_CONFIG,
  buildFeedbackEpisodes,
  rewardCategoriesFromTraces,
  simulateChapterFeedbackEmotion,
  updateCategoryRewardHabituation,
};
