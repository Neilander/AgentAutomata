"use strict";

const assert = require("node:assert/strict");
const LOOP = require("./border-village-formal-player-loop");

let session = LOOP.createSession("sealed-border-village", 5);
let request = LOOP.getPendingRequest(session);
let text = JSON.stringify(request);

for (const forbidden of [
  "gameState", "rngState", "internalActions", "leftTeam", "rightTeam", "combatAudit", "fingerprint",
  "removedUnits", "removesBoss", "EVENTS", "RAIDS", "intendedLesson", "expectedDiscovery",
  "futureEvents", "designerGoal", "discover_new_capabilities", "正确答案", "隐藏规则",
  "血鼓萨满", "披甲战兽栏", "最后一支南下商队",
]) assert(!text.includes(forbidden), `formal request leaked forbidden token: ${forbidden}`);

assert.equal(request.type, "decision");
assert.deepEqual(request.observation.actions.map((action) => action.kind), ["story", "grind"]);
const visibleLockedGrind = request.observation.actions.find((action) => action.kind === "grind");
assert.equal(visibleLockedGrind.available, false);
assert(visibleLockedGrind.disabledReason.includes("先完成当前开场剧情"));
assert(request.observation.actions.every((action) => /^choice_[a-z0-9]+$/.test(action.id)));
assert(!request.observation.actions.some((action) => "successChance" in action || "outcome" in action || "internalId" in action));
assert(!request.observation.buildings.some((building) => "future" in building || "solution" in building));

session = LOOP.applyDecisionResponse(session, {
  action: request.observation.actions.find((action) => action.kind === "story").id,
  goalId: request.playerState.goals[0].id,
  reasoningChain: [{ kind: "evidence", evidence: "当前只显示这一项可执行行动" }],
  alternatives: [],
});
let attribution = LOOP.getPendingRequest(session);
assert.equal(attribution.existingKnowledge[0].knowledgeId, "knowledge_current");
session = LOOP.applyAttributionResponse(session, {
  knowledgeId: "knowledge_current",
  primaryCause: "巡视结束后日期推进，巡逻队随后带回了可见敌情",
  confidence: 0.8,
  evidenceEventIds: [attribution.visibleEvents[0].id],
  alternativeCauses: [],
  nextTest: "查看下一日画面",
});

request = LOOP.getPendingRequest(session);
assert.equal(request.observation.time.day, 2);
assert.equal(request.observation.actions.filter((action) => action.kind === "decision").length, 2);
text = JSON.stringify(request);
assert(!text.includes("女巫") && !text.includes("炼金师"), "Day two must not leak later recruits");

const trace = LOOP.exportVisibleTrace(session);
const traceText = JSON.stringify(trace);
assert(trace.cycles[0].decisionInput.observation.actions.length === 2);
assert(trace.cycles[0].cognitionEvidence.length >= 2);
assert(!traceText.includes("gameState") && !traceText.includes("rngState") && !traceText.includes("fingerprint"));
console.log("border village formal input boundary passed");
