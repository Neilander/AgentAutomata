const LOOP = require("./player-agent-loop");

const SCHEMA = "enriched_two_chapter_player_run_v1";
const ENVIRONMENT_VARIANT = "enriched_v1";

function createRun(options = {}) {
  const seed = String(options.seed || "enriched-two-chapter");
  const profileId = String(options.profileId || "open_novice");
  const perceptionProfile = String(options.perceptionProfile || "ordinary");
  const maxCyclesPerChapter = Math.max(12, Math.floor(Number(options.maxCyclesPerChapter) || 60));
  return {
    schema: SCHEMA,
    environmentVariant: ENVIRONMENT_VARIANT,
    seed,
    profileId,
    perceptionProfile,
    requestedModel: "5.5fast",
    modelSelection: {
      status: "unsupported_by_current_orchestrator",
      actualModel: "unknown_platform_default",
    },
    activeChapter: 1,
    maxCyclesPerChapter,
    chapter1: LOOP.createSession(`${seed}:chapter1`, maxCyclesPerChapter, {
      profileId,
      perceptionProfile,
      environmentVariant: ENVIRONMENT_VARIANT,
    }),
    chapter2: null,
    transitions: [],
  };
}

function getPendingRequest(runInput) {
  const run = validate(runInput);
  if (isComplete(run)) return { type: "complete", status: status(run) };
  if (run.activeChapter === 1 && chapterOneCleared(run) && readyForTransition(run.chapter1)) {
    return { type: "chapter_transition", instruction: "Advance to Chapter 2 while preserving this player's state.", status: status(run) };
  }
  const request = LOOP.getPendingRequest(activeSession(run));
  return { ...request, enrichedRun: requestMetadata(run) };
}

function applyDecisionResponse(runInput, responseInput) {
  const run = validate(runInput);
  setActiveSession(run, LOOP.applyDecisionResponse(activeSession(run), responseInput));
  return run;
}

function applyAttributionResponse(runInput, responseInput) {
  const run = validate(runInput);
  setActiveSession(run, LOOP.applyAttributionResponse(activeSession(run), responseInput));
  return run;
}

function advanceToChapter2(runInput) {
  const run = validate(runInput);
  if (run.activeChapter !== 1) throw new Error("run is already in Chapter 2");
  if (!chapterOneCleared(run)) throw new Error("Chapter 1 boss has not been cleared");
  if (!readyForTransition(run.chapter1)) throw new Error("finish the pending attribution before changing chapters");
  run.chapter2 = LOOP.createChapter2SessionFromChapter1(
    run.chapter1,
    run.maxCyclesPerChapter,
    `${run.seed}:chapter2`,
  );
  run.activeChapter = 2;
  run.transitions.push({
    from: 1,
    to: 2,
    chapter1Cycles: run.chapter1.cycle,
    agentSessionId: run.chapter2.agentContext.id,
    carriedEquipmentCount: run.chapter2.chapterTransition?.carriedEquipmentCount || 0,
  });
  return run;
}

function status(runInput) {
  const run = validate(runInput);
  return {
    schema: "enriched_two_chapter_status_v1",
    seed: run.seed,
    profileId: run.profileId,
    activeChapter: run.activeChapter,
    chapter1Cleared: chapterOneCleared(run),
    chapter2Cleared: Boolean(run.chapter2?.gameState?.cleared?.r2_boss),
    complete: isComplete(run),
    phase: activeSession(run).phase,
    cycles: {
      chapter1: run.chapter1.cycle,
      chapter2: run.chapter2?.cycle || 0,
    },
    agentSessionIds: {
      chapter1: run.chapter1.agentContext.id,
      chapter2: run.chapter2?.agentContext?.id || null,
    },
  };
}

function summarize(runInput) {
  const run = validate(runInput);
  const chapters = [run.chapter1, run.chapter2].filter(Boolean);
  const history = chapters.flatMap((session, chapterIndex) => session.history.map((row) => ({
    chapter: chapterIndex + 1,
    ...row,
  })));
  const challenges = history.filter((row) => row.action.startsWith("challenge:"));
  const equipmentActions = history.filter((row) => row.action.startsWith("equip:"));
  const swapActions = history.filter((row) => row.action.startsWith("swap:"));
  const drops = challenges.flatMap((row) => row.gameEvent?.loot || []);
  const rarityCounts = {};
  for (const item of drops) rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
  const rosterSettlements = history.map((row) => row.rosterPredictionResolution).filter((row) => row?.status === "resolved");
  const rosterPredictionATrace = history.flatMap((row) => row.eventTrace || [])
    .filter((row) => row.expectationSource === "roster_prediction");
  const allEmotion = history.flatMap((row) => [row.emotionBeforeDecision, row.emotionAfterDecision, row.emotionAfterEvents]).filter(Number.isFinite);
  const finalSession = chapters.at(-1);
  return {
    schema: "enriched_two_chapter_summary_v1",
    status: status(run),
    model: { requested: run.requestedModel, ...run.modelSelection },
    route: history.map((row) => ({ chapter: row.chapter, cycle: row.cycle, action: row.action, outcome: row.outcome })),
    combat: {
      challenges: challenges.length,
      wins: challenges.filter((row) => row.outcome === "win").length,
      losses: challenges.filter((row) => row.outcome === "loss").length,
      attemptsByNode: Object.fromEntries(chapters.flatMap((session) => Object.entries(session.gameState.attempts || {}))),
    },
    roster: {
      swaps: swapActions.length,
      unlocked: challenges.map((row) => row.gameEvent?.characterUnlock).filter(Boolean),
      finalTeam: finalSession.gameState.teamSlots,
      impressionCount: finalSession.entityImpressionState?.strengthCognitionMatrix?.entries?.length || 0,
    },
    equipment: {
      manualEquips: equipmentActions.length,
      drops: drops.length,
      rarityCounts,
      mythicDrops: drops.filter((item) => item.rarity === "mythic").length,
    },
    rosterPredictionA: {
      settlements: rosterSettlements.length,
      positive: rosterPredictionATrace.filter((row) => Number(row.expectationEmotion || 0) > 0).length,
      negative: rosterPredictionATrace.filter((row) => Number(row.expectationEmotion || 0) < 0).length,
      total: round(rosterPredictionATrace.reduce((sum, row) => sum + Number(row.expectationEmotion || 0), 0)),
    },
    emotion: {
      initial: allEmotion[0] ?? finalSession.cognitionState.emotion.value,
      final: allEmotion.at(-1) ?? finalSession.cognitionState.emotion.value,
      minimum: allEmotion.length ? Math.min(...allEmotion) : finalSession.cognitionState.emotion.minimum,
      maximum: allEmotion.length ? Math.max(...allEmotion) : finalSession.cognitionState.emotion.value,
      processTotal: round(finalSession.cognitionState.emotion.processTotal),
      acquiredTotal: round(finalSession.cognitionState.emotion.acquiredTotal),
      expectationTotal: round(finalSession.cognitionState.emotion.expectationTotal),
    },
    knowledgeCount: finalSession.knowledgeBase.length,
    rawTraceLocation: "chapter1.history + chapter2.history",
  };
}

function requestMetadata(run) {
  return {
    environmentVariant: run.environmentVariant,
    chapter: run.activeChapter,
    seed: run.seed,
    profileId: run.profileId,
    requestedModel: run.requestedModel,
    actualModel: run.modelSelection.actualModel,
  };
}

function chapterOneCleared(run) {
  return Boolean(run.chapter1.gameState?.cleared?.r1_boss);
}

function readyForTransition(session) {
  return session.phase !== "attribution" && !session.pendingAttribution;
}

function isComplete(run) {
  return Boolean(run.activeChapter === 2 && run.chapter2?.gameState?.cleared?.r2_boss && readyForTransition(run.chapter2));
}

function activeSession(run) {
  return run.activeChapter === 2 ? run.chapter2 : run.chapter1;
}

function setActiveSession(run, session) {
  if (run.activeChapter === 2) run.chapter2 = session;
  else run.chapter1 = session;
}

function validate(input) {
  const run = structuredClone(input);
  if (!run || run.schema !== SCHEMA) throw new Error("invalid enriched two-chapter run");
  return run;
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

module.exports = {
  ENVIRONMENT_VARIANT,
  SCHEMA,
  advanceToChapter2,
  applyAttributionResponse,
  applyDecisionResponse,
  createRun,
  getPendingRequest,
  status,
  summarize,
};
