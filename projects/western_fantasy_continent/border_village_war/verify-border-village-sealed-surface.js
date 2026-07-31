"use strict";

const assert = require("node:assert/strict");
const LOOP = require("./border-village-formal-player-loop");

let session = LOOP.createSession("sealed-all-days", 30);
const requests = [];

function request() {
  const current = LOOP.getPendingRequest(session);
  requests.push(structuredClone(current));
  auditRequest(current);
  return current;
}

function choose(predicate) {
  const decision = request();
  assert.equal(decision.type, "decision");
  const action = decision.observation.actions.find(predicate);
  assert(action, `No public action matched at day ${decision.observation.time.day}`);
  session = LOOP.applyDecisionResponse(session, {
    action: action.id,
    goalId: decision.playerState.goals[0].id,
    reasoningChain: [{ kind: "evidence", evidence: `当前画面显示“${action.label}”可以执行` }],
    alternatives: [],
  });
  const attribution = request();
  assert.equal(attribution.type, "attribution");
  session = LOOP.applyAttributionResponse(session, {
    knowledgeId: attribution.existingKnowledge[0].knowledgeId,
    primaryCause: attribution.visibleEvents[0].summary,
    confidence: 0.7,
    evidenceEventIds: [attribution.visibleEvents[0].id],
    alternativeCauses: [],
    nextTest: "继续观察后续画面",
  });
}

function auditRequest(value) {
  const text = JSON.stringify(value);
  for (const token of ["gameState", "rngState", "internalActions", "leftTeam", "rightTeam", "combatAudit", "fingerprint", "successChance", "intendedLesson", "expectedDiscovery", "designerGoal", "futureEvents"]) {
    assert(!text.includes(token), `sealed surface leaked ${token}`);
  }
  if (value.type === "decision") {
    assert(value.observation.actions.every((action) => /^choice_[a-z0-9]+$/.test(action.id)), "Non-opaque action id reached player");
    const day = value.observation.time.day;
    if (day < 4) assert(!text.includes("圣殿火堆旁的女巫"), "Witch event leaked before day four");
    if (day < 5) assert(!text.includes("追着巨兽脚印而来的猎人"), "Hunter event leaked before day five");
    if (day < 6) assert(!text.includes("最后一支南下商队"), "Caravan event leaked before day six");
  }
}

choose((action) => action.kind === "story");
choose((action) => action.kind === "decision");
choose((action) => action.kind === "grind");
choose((action) => action.kind === "time");
choose((action) => action.kind === "time");
choose((action) => action.kind === "time");
choose((action) => action.kind === "time");

let finalRequest = request();
assert.equal(finalRequest.observation.time.day, 7);
assert(finalRequest.observation.actions.some((action) => action.kind === "combat"), "Final surface must expose the real battle");
assert(finalRequest.observation.actions.every((action) => ["combat", "selection", "equipment"].includes(action.kind)), "Final surface may only add pre-battle roster and equipment preparation");
assert(finalRequest.observation.actions.some((action) => action.label.includes("一键") && action.kind === "equipment"), "Final surface should allow one-click equipment before committing to battle");
choose((action) => action.kind === "combat");
assert.equal(LOOP.getPendingRequest(session).type, "complete");

const trace = LOOP.exportVisibleTrace(session);
auditRequest(trace);
assert(trace.cycles.filter((cycle) => cycle.combatProcess?.ran).length === 2, "Hunt and final battle must both record actual combat timelines");
assert(trace.cycles.filter((cycle) => cycle.combatProcess?.ran).every((cycle) => cycle.combatProcess.signalCount > 0));

console.log(JSON.stringify({ status: "PASS", auditedRequests: requests.length, daysReached: 7, realCombats: 2, finalResult: trace.finalObservation.result.title }, null, 2));
