const CORE = require("../map_progression_lab/map-progression-cognition-core");
const RUNTIME = require("./player-cognition-v2-event-runtime");
const ADAPTER = require("./map-cognition-v2-event-adapter");
const POLICY = require("./player-cognition-v2-action-policy");

function createLoop(seed = "map-cognition-action-loop") {
  return {
    seed,
    gameState: CORE.initialState(seed),
    cognitionState: RUNTIME.createState(seed),
    actions: [],
  };
}

function stepLoop(loopInput) {
  const loop = structuredClone(loopInput);
  const observation = CORE.observe(loop.gameState);
  const choice = POLICY.selectNextAction(loop.cognitionState, observation, { time: loop.gameState.step || 0 });
  if (!choice.action && choice.terminal) {
    loop.terminal = { reason: choice.reason, step: loop.actions.length + 1 };
    return { ok: true, loop, terminal: true, choice };
  }
  if (!choice.action) return { ok: false, loop, error: "no_action" };
  const result = ADAPTER.runMapAction(CORE, loop.gameState, choice.action, choice.cognitionState);
  if (!result.ok) return { ok: false, loop, error: result.error, choice };
  loop.gameState = result.state;
  loop.cognitionState = result.cognitionState;
  loop.actions.push({
    step: loop.actions.length + 1,
    action: choice.action,
    outcome: result.event.outcome,
    emotionAfter: round(result.cognitionState.emotion.value),
    topCandidates: choice.candidates.slice(0, 3),
  });
  return { ok: true, loop, choice, event: result.event, eventLog: result.eventLog };
}

function runLoop(seed = "map-cognition-action-loop", maxActions = 8) {
  let loop = createLoop(seed);
  for (let index = 0; index < maxActions; index += 1) {
    const result = stepLoop(loop);
    if (!result.ok) return result;
    loop = result.loop;
    if (result.terminal) break;
  }
  return { ok: true, loop, summary: summarize(loop) };
}

function summarize(loop) {
  const decisions = loop.cognitionState.trace.filter((row) => row.type === "decision");
  return {
    seed: loop.seed,
    actions: loop.actions,
    emotion: loop.cognitionState.emotion,
    decisions: decisions.map((row) => ({
      action: row.tuple.result.action,
      reasoningChain: row.reasoningChain,
      alternatives: row.alternatives.slice(0, 3),
      processEmotion: row.processEmotion,
    })),
    failureMemories: loop.cognitionState.failureMemories,
    hypotheses: loop.cognitionState.hypotheses,
    terminal: loop.terminal || null,
  };
}

function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

if (require.main === module) {
  const result = runLoop(process.argv[2] || "map-cognition-action-loop", Number(process.argv[3] || 8));
  console.log(JSON.stringify(result.ok ? result.summary : result, null, 2));
}

module.exports = { createLoop, runLoop, stepLoop, summarize };
