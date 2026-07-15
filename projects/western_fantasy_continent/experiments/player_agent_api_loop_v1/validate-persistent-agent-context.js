const assert = require("node:assert/strict");
const LOOP = require("./player-agent-loop");
const PERSISTENT_AGENT = require("./persistent-agent-context");

const session = LOOP.createSession("persistent-agent-two-cycle", 2);
const first = LOOP.getPendingRequest(session);

assert.equal(first.agentSession.mode, "bootstrap");
assert.equal(first.agentSession.turn, 1);
assert.equal(first.agentSession.reuseRequired, true);

session.apiCalls.push({ type: "decision", cycle: 1 });
session.agentContext = PERSISTENT_AGENT.completeTurn(session.agentContext);
const second = LOOP.getPendingRequest(session);

assert.equal(second.agentSession.id, first.agentSession.id);
assert.equal(second.agentSession.mode, "continue");
assert.equal(second.agentSession.turn, 2);

const restored = JSON.parse(JSON.stringify(session));
const third = LOOP.getPendingRequest(restored);
assert.equal(third.agentSession.id, first.agentSession.id);
assert.equal(third.agentSession.turn, 2);

const legacy = LOOP.createSession("legacy-agent-upgrade", 1);
delete legacy.agentContext;
const upgraded = LOOP.getPendingRequest(legacy);
assert.equal(upgraded.agentSession.mode, "bootstrap");
assert.match(upgraded.agentSession.id, /^player-agent-/);

console.log(JSON.stringify({
  result: "PASS",
  stableAgentSessionId: first.agentSession.id,
  firstMode: first.agentSession.mode,
  continuedMode: second.agentSession.mode,
  restoredTurn: third.agentSession.turn,
  legacyUpgrade: upgraded.agentSession.id,
}, null, 2));
