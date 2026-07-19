const LOOP = require("./player-agent-loop");

const SCHEMA = "controlled_two_chapter_player_run_v1";

function createRun(options = {}) {
  const seed = String(options.seed || "controlled-two-chapter-run");
  const profileId = String(options.profileId || "open_novice");
  return {
    schema: SCHEMA,
    seed,
    profileId,
    activeChapter: 1,
    chapter1: LOOP.createSession(`${seed}:chapter1`, options.chapter1MaxCycles || 40, { profileId }),
    chapter2: null,
    controls: [],
  };
}

function getPendingRequest(runInput, directiveInput = null) {
  const run = validate(runInput);
  const session = activeSession(run);
  const request = LOOP.getPendingRequest(session);
  if (request.type !== "decision") {
    return {
      ...request,
      controller: currentControl(run),
    };
  }

  const directive = normalizeDirective(directiveInput, request.observation.allowedActions);
  return {
    ...request,
    instruction: `${request.instruction} A user-authored controller directive is active. Obey it; do not optimize against or reinterpret its intent. Choose only from controller.eligibleActions.`,
    controller: directive,
  };
}

function applyDecisionResponse(runInput, directiveInput, responseInput) {
  const run = validate(runInput);
  const session = activeSession(run);
  const baseRequest = LOOP.getPendingRequest(session);
  if (baseRequest.type !== "decision") throw new Error(`expected decision request, got ${baseRequest.type}`);
  const directive = normalizeDirective(directiveInput, baseRequest.observation.allowedActions);
  if (!directive.eligibleActions.includes(responseInput?.action)) {
    throw new Error(`Agent action violates controller directive: ${responseInput?.action}`);
  }
  setActiveSession(run, LOOP.applyDecisionResponse(session, responseInput));
  run.controls.push({
    chapter: run.activeChapter,
    cycle: activeSession(run).cycle + 1,
    directive,
    action: responseInput.action,
  });
  return run;
}

function applyAttributionResponse(runInput, responseInput) {
  const run = validate(runInput);
  setActiveSession(run, LOOP.applyAttributionResponse(activeSession(run), responseInput));
  return run;
}

function advanceToChapter2(runInput, options = {}) {
  const run = validate(runInput);
  if (run.activeChapter !== 1) throw new Error("run is already in Chapter 2");
  if (run.chapter1.phase === "attribution" || run.chapter1.pendingAttribution) {
    throw new Error("finish the current attribution before advancing chapters");
  }
  run.chapter2 = LOOP.createChapter2SessionFromChapter1(
    run.chapter1,
    options.maxCycles || 40,
    `${run.seed}:chapter2`,
  );
  run.activeChapter = 2;
  return run;
}

function extendActiveChapter(runInput, maxCycles) {
  const run = validate(runInput);
  const session = activeSession(run);
  const nextMaxCycles = Math.max(session.cycle + 1, Math.floor(Number(maxCycles) || 0));
  if (nextMaxCycles <= session.maxCycles) {
    throw new Error(`new maxCycles must exceed current maxCycles ${session.maxCycles}`);
  }
  session.maxCycles = nextMaxCycles;
  if (session.phase === "complete" && !session.pendingAttribution) session.phase = "decision";
  setActiveSession(run, session);
  return run;
}

function summarizeEmotion(runInput) {
  const run = validate(runInput);
  const chapters = [
    summarizeChapter(1, run.chapter1),
    run.chapter2 ? summarizeChapter(2, run.chapter2) : null,
  ].filter(Boolean);
  const points = chapters.flatMap((chapter) => chapter.cycles.flatMap((cycle) => [
    cycle.emotionBeforeDecision,
    cycle.emotionAfterDecision,
    cycle.emotionAfterEvents,
  ])).filter(Number.isFinite);
  return {
    schema: "controlled_two_chapter_emotion_summary_v1",
    seed: run.seed,
    profileId: run.profileId,
    chapters,
    overall: {
      initial: points[0] ?? run.chapter1.cognitionState.emotion.value,
      final: points.at(-1) ?? run.chapter1.cognitionState.emotion.value,
      minimum: points.length ? Math.min(...points) : run.chapter1.cognitionState.emotion.minimum,
      maximum: points.length ? Math.max(...points) : run.chapter1.cognitionState.emotion.value,
      processTotal: round(activeSession(run).cognitionState.emotion.processTotal),
      acquiredTotal: round(activeSession(run).cognitionState.emotion.acquiredTotal),
      expectationTotal: round(activeSession(run).cognitionState.emotion.expectationTotal),
      verificationTotal: round(activeSession(run).cognitionState.emotion.verificationTotal),
    },
  };
}

function summarizeChapter(chapter, session) {
  return {
    chapter,
    completedCycles: session.cycle,
    finalEmotion: round(session.cognitionState.emotion.value),
    cycles: session.history.map((row) => ({
      cycle: row.cycle,
      action: row.action,
      outcome: row.outcome,
      emotionBeforeDecision: round(row.emotionBeforeDecision),
      emotionAfterDecision: round(row.emotionAfterDecision),
      emotionAfterEvents: round(row.emotionAfterEvents),
      automaticEmotionDelta: round(row.automaticEmotionDelta),
      eventEmotion: row.eventTrace.map((event) => ({
        eventId: event.eventId,
        type: event.type,
        H: event.H,
        process: event.processEmotion,
        acquired: event.acquiredEmotion,
        expectation: event.expectationEmotion,
        verification: event.verificationEmotion,
        delta: event.emotionDelta,
      })),
    })),
  };
}

function normalizeDirective(input, allowedActions) {
  if (!input || typeof input !== "object") {
    throw new Error("a controller directive is required at every decision node");
  }
  const exactAction = typeof input.exactAction === "string" ? input.exactAction : null;
  const prefixes = Array.isArray(input.allowedActionPrefixes)
    ? input.allowedActionPrefixes.map(String).filter(Boolean)
    : [];
  let eligibleActions = [...allowedActions];
  if (exactAction) eligibleActions = eligibleActions.filter((action) => action === exactAction);
  if (prefixes.length) eligibleActions = eligibleActions.filter((action) => prefixes.some((prefix) => action.startsWith(prefix)));
  if (!eligibleActions.length) {
    throw new Error(`controller directive has no legal action: ${JSON.stringify(input)}`);
  }
  return {
    schema: "user_controller_directive_v1",
    id: String(input.id || `control:${exactAction || prefixes.join("+") || "choice"}`),
    intent: String(input.intent || "Follow the user's requested play action."),
    exactAction,
    allowedActionPrefixes: prefixes,
    eligibleActions,
    unspecifiedChoiceOwner: eligibleActions.length === 1 ? "controller" : "agent",
  };
}

function currentControl(run) {
  const latest = [...run.controls].reverse().find((row) => row.chapter === run.activeChapter);
  return latest?.directive || null;
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
  if (!run || run.schema !== SCHEMA) throw new Error("invalid controlled two-chapter run");
  return run;
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

module.exports = {
  SCHEMA,
  advanceToChapter2,
  applyAttributionResponse,
  applyDecisionResponse,
  createRun,
  extendActiveChapter,
  getPendingRequest,
  summarizeEmotion,
};
