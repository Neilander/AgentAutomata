const crypto = require("node:crypto");

const SCHEMA = "persistent_player_agent_context_v1";
const BOOTSTRAP_VERSION = "player-agent-contract-2026-07-15";

function create(seed) {
  return {
    schema: SCHEMA,
    id: `player-agent-${crypto.createHash("sha256").update(String(seed)).digest("hex").slice(0, 16)}`,
    bootstrapVersion: BOOTSTRAP_VERSION,
    completedTurns: 0,
  };
}

function ensure(value, seed) {
  if (!value || value.schema !== SCHEMA || !value.id) return create(seed);
  return {
    schema: SCHEMA,
    id: String(value.id),
    bootstrapVersion: String(value.bootstrapVersion || BOOTSTRAP_VERSION),
    completedTurns: Math.max(0, Number(value.completedTurns || 0)),
  };
}

function requestMetadata(context, phase) {
  const state = ensure(context, "fallback");
  return {
    schema: "persistent_player_agent_turn_v1",
    id: state.id,
    mode: state.completedTurns === 0 ? "bootstrap" : "continue",
    turn: state.completedTurns + 1,
    phase,
    bootstrapVersion: state.bootstrapVersion,
    reuseRequired: true,
    authority: "The repository session is authoritative. Agent conversation memory may help continuity but cannot replace supplied observations, retrieved knowledge, or legal actions.",
  };
}

function completeTurn(context) {
  const state = ensure(context, "fallback");
  state.completedTurns += 1;
  return state;
}

module.exports = { BOOTSTRAP_VERSION, SCHEMA, completeTurn, create, ensure, requestMetadata };
