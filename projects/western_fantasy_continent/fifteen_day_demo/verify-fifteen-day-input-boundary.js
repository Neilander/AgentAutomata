"use strict";

const assert = require("node:assert/strict");
const LOOP = require("./fifteen-day-formal-player-loop");

const session = LOOP.createSession("sealed-input", 4);
const request = LOOP.getPendingRequest(session);
const text = JSON.stringify(request);

for (const forbidden of [
  "gameState", "rngState", "internalAction", "hpScale", "powerScale", "politicalRouteAvailable",
  "volunteerCount", "showdownPlan", "EVENTS", "intendedLesson", "expectedDiscovery", "futureEvents",
  "designerGoal", "discover_new_capabilities", "正确答案", "隐藏规则", "联盟瓦解",
]) assert(!text.includes(forbidden), `formal request leaked forbidden token: ${forbidden}`);

assert.equal(request.type, "decision");
assert(request.observation.actions.every((action) => /^choice_[a-z0-9]+$/.test(action.id)));
assert(request.observation.places.every((place) => Number.isInteger(place.actionCount) && place.actionCount >= 0));
assert(!request.observation.actions.some((action) => "outcome" in action || "requirements" in action || "successChance" in action));
assert(!request.observation.places.some((place) => "future" in place || "solution" in place));

const selected = request.observation.actions.find((action) => action.kind === "grind");
let advanced = LOOP.applyDecisionResponse(session, {
  action: selected.id,
  goalId: request.playerState.goals[0].id,
  reasoningChain: [{ kind: "evidence", evidence: "当前画面显示这个行动不消耗行动点" }],
  alternatives: [],
});
const attribution = LOOP.getPendingRequest(advanced);
advanced = LOOP.applyAttributionResponse(advanced, {
  knowledgeId: attribution.existingKnowledge[0].knowledgeId,
  primaryCause: "这次可见战斗带回了装备",
  confidence: 0.6,
  evidenceEventIds: [attribution.visibleEvents[0].id],
  alternativeCauses: [],
  nextTest: "再次尝试同一可见行动",
});
const trace = LOOP.exportVisibleTrace(advanced);
assert(trace.cycles[0].decisionInput?.observation?.actions?.length > 0, "trace must preserve the exact pre-decision visible actions");
assert(trace.cycles[0].cognitionEvidence.length >= 2, "trace must preserve auditable cognition evidence");
assert(!JSON.stringify(trace).includes("gameState"), "visible trace must not export authoritative state");
console.log("fifteen-day formal input boundary passed");
