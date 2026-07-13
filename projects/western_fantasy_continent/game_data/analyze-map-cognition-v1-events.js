const CORE = require("../map_progression_lab/map-progression-cognition-core");
const RUNTIME = require("./player-cognition-v1-event-runtime");
const ADAPTER = require("./map-cognition-v1-event-adapter");

function createSession(seed = "map-cognition-v1", config = {}) {
  return {
    schema: "map_cognition_v1_event_session",
    seed,
    gameState: CORE.initialState(seed),
    cognitionState: RUNTIME.createState(seed, config),
    actions: [],
  };
}

function applyAction(sessionInput, action, options = {}) {
  const session = structuredClone(sessionInput);
  const result = ADAPTER.runMapAction(CORE, session.gameState, action, session.cognitionState, options);
  if (!result.ok) return { ok: false, session, error: result.error };
  session.gameState = result.state;
  session.cognitionState = result.cognitionState;
  session.actions.push({
    action,
    outcome: result.event.outcome,
    node: result.event.node || null,
    eventCount: result.eventLog.length,
    emotionAfter: round(result.cognitionState.emotion.value),
    knowledgeCount: result.cognitionState.knowledge.length,
    pendingExpectations: result.cognitionState.expectationLedger.filter((row) => row.status === "pending").length,
  });
  return { ok: true, session, event: result.event, eventLog: result.eventLog };
}

function runMainOpening(seed = "map-cognition-v1") {
  let session = createSession(seed);
  const first = applyAction(session, "challenge:r1_main_1", { decisionMade: true });
  if (!first.ok) return first;
  session = first.session;
  const repeat = applyAction(session, "challenge:r1_main_1", { decisionMade: false });
  if (!repeat.ok) return repeat;
  return {
    ok: true,
    session: repeat.session,
    summary: summarize(repeat.session),
  };
}

function summarize(session) {
  const trace = session.cognitionState.trace;
  return {
    seed: session.seed,
    actions: session.actions,
    emotion: session.cognitionState.emotion,
    acceptedSignals: trace.filter((row) => row.accepted).length,
    ignoredSignals: trace.filter((row) => !row.accepted).length,
    emotionEvents: trace.filter((row) => Math.abs(row.emotionDelta || 0) > 0.0001).length,
    learnedKnowledge: session.cognitionState.knowledge.length,
    resolvedExpectations: session.cognitionState.expectationLedger.filter((row) => row.status === "resolved").length,
    pendingExpectations: session.cognitionState.expectationLedger.filter((row) => row.status === "pending").length,
    firstEmotionRows: trace.filter((row) => Math.abs(row.emotionDelta || 0) > 0.0001).slice(0, 12),
  };
}

function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

if (require.main === module) {
  const result = runMainOpening(process.argv[2] || "map-cognition-v1");
  console.log(JSON.stringify(result.ok ? result.summary : result, null, 2));
}

module.exports = { applyAction, createSession, runMainOpening, summarize };
