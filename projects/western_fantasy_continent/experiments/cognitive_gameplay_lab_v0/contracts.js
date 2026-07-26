"use strict";

const SCHEMAS = Object.freeze({
  GAME_VIEW: "cognitive_game_view_v0",
  COGNITIVE_STATE: "cognitive_gameplay_state_v0",
  TRACE: "cognitive_thought_trace_v0",
});

function createCognitiveState(input = {}) {
  const playerView = clone(input.playerView || {});
  if (playerView.schema !== SCHEMAS.GAME_VIEW) {
    throw new Error(`playerView.schema must be ${SCHEMAS.GAME_VIEW}`);
  }
  return {
    schema: SCHEMAS.COGNITIVE_STATE,
    cycle: nonNegativeInteger(input.cycle, 0),
    playerId: String(input.playerId || "player"),
    goal: normalizeGoal(input.goal),
    playerView,
    attention: {
      capacity: positiveNumber(input.attention?.capacity, 10),
      remaining: positiveOrZero(input.attention?.remaining, input.attention?.capacity ?? 10),
    },
    memoryStore: Array.isArray(input.memoryStore) ? clone(input.memoryStore) : [],
    activeCognition: input.activeCognition ? clone(input.activeCognition) : null,
    mindToy: input.mindToy ? clone(input.mindToy) : null,
    ideaBoard: Array.isArray(input.ideaBoard) ? clone(input.ideaBoard) : [],
    trace: createTrace(input.trace),
  };
}

function createTrace(input = {}) {
  const events = Array.isArray(input?.events) ? clone(input.events) : [];
  return {
    schema: SCHEMAS.TRACE,
    events,
    nextSequence: nonNegativeInteger(input?.nextSequence, events.length + 1),
  };
}

function appendTrace(traceInput, eventInput) {
  const trace = createTrace(traceInput);
  if (!eventInput || typeof eventInput !== "object" || Array.isArray(eventInput)) {
    throw new Error("trace event must be an object");
  }
  const event = clone(eventInput);
  if (!event.type) throw new Error("trace event requires type");
  trace.events.push({
    sequence: trace.nextSequence,
    cycle: nonNegativeInteger(event.cycle, 0),
    type: String(event.type),
    module: String(event.module || "unknown"),
    inputRefs: uniqueStrings(event.inputRefs),
    outputRefs: uniqueStrings(event.outputRefs),
    attentionCost: positiveOrZero(event.attentionCost, 0),
    payload: event.payload && typeof event.payload === "object" ? clone(event.payload) : {},
  });
  trace.nextSequence += 1;
  return trace;
}

function validateReplayableState(state) {
  if (!state || state.schema !== SCHEMAS.COGNITIVE_STATE) throw new Error("invalid cognitive state");
  if (state.playerView?.schema !== SCHEMAS.GAME_VIEW) throw new Error("invalid player view");
  if (state.trace?.schema !== SCHEMAS.TRACE) throw new Error("invalid thought trace");
  if (state.attention.remaining > state.attention.capacity) throw new Error("attention remaining exceeds capacity");
  return true;
}

function stableJson(value) {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
}

function normalizeGoal(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("goal is required");
  if (!input.id) throw new Error("goal.id is required");
  return {
    id: String(input.id),
    label: String(input.label || input.id),
    concepts: uniqueStrings(input.concepts),
    successCondition: String(input.successCondition || ""),
  };
}

function uniqueStrings(input) {
  return [...new Set((Array.isArray(input) ? input : []).map(String).filter(Boolean))];
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function positiveOrZero(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : Number(fallback) || 0;
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  SCHEMAS,
  appendTrace,
  clone,
  createCognitiveState,
  createTrace,
  stableJson,
  uniqueStrings,
  validateReplayableState,
};
