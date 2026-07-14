const assert = require("node:assert/strict");
const LOOP = require("./player-agent-loop");

function completeAction(session, action) {
  const decisionRequest = LOOP.getPendingRequest(session);
  assert.equal(decisionRequest.type, "decision");
  assert(decisionRequest.observation.allowedActions.includes(action), `unavailable action: ${action}`);
  let next = LOOP.applyDecisionResponse(session, {
    action,
    goalId: decisionRequest.playerState.activeGoalId,
    reasoningChain: [{ kind: "affordance", evidence: `${action} is currently available.` }],
    alternatives: [],
    hypothesis: null,
  });
  const attributionRequest = LOOP.getPendingRequest(next);
  assert.equal(attributionRequest.type, "attribution");
  const visibleIds = new Set(attributionRequest.visibleEvents.map((row) => row.id));
  const knowledge = [...attributionRequest.existingKnowledge].reverse().find((row) =>
    (row.evidenceEventIds || []).some((id) => visibleIds.has(id))
  );
  assert(knowledge, `no attributable knowledge after ${action}`);
  const evidenceEventIds = (knowledge.evidenceEventIds || []).filter((id) => visibleIds.has(id)).slice(0, 2);
  next = LOOP.applyAttributionResponse(next, {
    knowledgeId: knowledge.id,
    primaryCause: `The cited visible result followed ${action}.`,
    confidence: 0.8,
    evidenceEventIds,
    alternativeCauses: [],
    nextTest: "",
  });
  return next;
}

function main() {
  let session = LOOP.createChapter2Session("chapter2-signal-chain", 12);
  for (const action of [
    "challenge:r2_entry",
    "challenge:r2_knight_rescue",
    "challenge:r2_priest_rescue",
    "swap:1:hero_knight",
    "swap:2:hero_priest",
    "challenge:r2_shield_trial",
  ]) {
    session = completeAction(session, action);
  }

  const shieldRecord = session.history.find((row) => row.action === "challenge:r2_shield_trial");
  assert(shieldRecord, "shield trial record missing");
  assert(shieldRecord.eventLog.some((row) => row.type === "field" || row.result?.kind === "field_effect"), "field signal missing");
  const fieldKnowledge = session.knowledgeBase.find((row) => row.subject?.id === "field:shield_detonation");
  assert(fieldKnowledge, "canonical field knowledge missing");

  const entryRecord = session.history.find((row) => row.action === "challenge:r2_entry");
  const levelLoot = entryRecord.eventLog.find((row) => row.type === "loot" && row.result?.equipmentLevel === 22);
  assert(levelLoot, "equipment level missing from visible loot signal");
  assert.deepEqual(levelLoot.result.baseStats, { physicalPower: 11 });
  assert.equal(levelLoot.result.affixCount, 1);

  console.log(JSON.stringify({
    result: "PASS",
    cycles: session.cycle,
    fieldEventCount: shieldRecord.eventLog.filter((row) => row.type === "field" || row.result?.kind === "field_effect").length,
    fieldKnowledge: {
      subject: fieldKnowledge.subject,
      environment: fieldKnowledge.environment,
      behavior: fieldKnowledge.behavior,
      latestObservation: fieldKnowledge.result.observations.at(-1),
    },
    equipmentLevelSignal: levelLoot.result,
  }, null, 2));
}

main();
