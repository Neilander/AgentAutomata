const assert = require("node:assert/strict");
const LOOP = require("./player-agent-loop");

let session = LOOP.createSession("causal-loop-test", 2);
session = LOOP.applyDecisionResponse(session, {
  action: "challenge:r1_main_1",
  goalId: "grow_and_progress",
  reasoningChain: [{ kind: "affordance", evidence: "Main 1 is the available progression action." }],
  alternatives: [],
  hypothesis: null,
});

assert.equal(session.gameState.inventory.length, 2, "clearing Main 1 should place two items in inventory");
assert.equal(equippedCount(session.gameState), 0, "loot must not auto-equip");
assert.equal(session.gameState.history[0].gearAfter, 0, "loot alone must not change equipped power");
assert.equal(session.knowledgeBase.some((row) => row.behavior.kind === "receive_reward"), false);

const lootFact = session.knowledgeBase.find((row) => row.environment.phase === "loot_drop");
assert.equal(lootFact.behavior.kind, "clear_level");
assert.equal(lootFact.result.observations[0].powerChanged, false);
assert.equal("requiresExplicitEquipForPower" in lootFact.result.observations[0], false, "unobserved equipment rules must not leak into learned knowledge");
assert.deepEqual(lootFact.result.observations[0].unlockedNodes, undefined);

const progressionFact = session.knowledgeBase.find((row) => row.environment.phase === "map_progression");
assert.deepEqual(progressionFact.result.observations[0].unlockedNodes, ["r1_main_2"]);
assert.deepEqual(progressionFact.evidenceEventIds, ["map_unlock:r1_main_1:1"]);
const threatFacts = session.knowledgeBase.filter((row) => row.result.observations[0].outcome === "enemy_concept_threat");
assert(threatFacts.length >= 2);
assert.deepEqual(threatFacts.map((row) => row.result.observations[0].threatRank).sort((a, b) => a - b), [1, 2]);
assert.deepEqual(threatFacts.map((row) => row.subject.name).sort(), ["近战小怪", "远程小怪"]);
assert(session.history[0].rawEventLog.some((row) => /盗匪|路匪/.test(row.subject?.name || "")), "raw audit log should retain engine identities");
assert.equal(session.history[0].eventLog.some((row) => /盗匪|路匪/.test(JSON.stringify(row))), false, "player semantic events must not leak engine enemy identities");
assert.equal(session.knowledgeBase.some((row) => /盗匪|路匪/.test(JSON.stringify(row))), false, "knowledge must be learned from concepts, not engine enemy identities");
assert(session.history[0].conceptInterpretation.decisions.every((row) => row.visibleEvidence.every((evidence) => evidence.eventId)), "concept matches must cite visible events");
assert.equal(session.history[0].learningDelta.addedKnowledge.length, 11, "first challenge must persist its exact knowledge additions");
assert.deepEqual(session.history[0].learningDelta.matchedConcepts.map((row) => row.label).sort(), ["近战小怪", "远程小怪"]);
assert.equal(session.history[0].learningDelta.conceptLibraryChanged, false, "matching an existing concept is not concept creation");
const herbContribution = session.knowledgeBase.find((row) => row.subject.id === "militia_herb" && row.behavior.kind === "combat_participation");
assert(herbContribution.result.observations[0].healing > 0, "low damage must not erase support contribution");
const firstCycleEventIds = new Set(session.history[0].eventLog.map((row) => row.id));
for (const row of session.knowledgeBase) {
  assert(row.evidenceEventIds.length > 0, `knowledge lacks evidence: ${row.id}`);
  assert(row.evidenceEventIds.every((id) => firstCycleEventIds.has(id)), `knowledge cites non-game evidence: ${row.id}`);
}

const combatResultId = session.history[0].eventLog.find((row) => row.type === "combat_result").id;
const summaryId = session.history[0].eventLog.find((row) => row.type === "action_summary").id;
session = LOOP.applyAttributionResponse(session, {
  knowledgeId: "knowledge:1",
  primaryCause: "The squad eliminated every enemy and survived the encounter.",
  confidence: 0.95,
  evidenceEventIds: [combatResultId, summaryId],
  alternativeCauses: [],
  nextTest: "Equip one dropped item.",
});

const request = LOOP.getPendingRequest(session);
const item = request.observation.inventory[0];
const bestHero = item.bestFits[0];
const equipAction = `equip:${bestHero.heroId}:${item.id}`;
assert(request.observation.allowedActions.includes(equipAction));
assert.equal(request.observation.gear.score, 0);

session = LOOP.applyDecisionResponse(session, {
  action: equipAction,
  goalId: "grow_and_progress",
  reasoningChain: [
    { kind: "knowledge", evidence: "Dropped items are still in inventory and power is unchanged." },
    { kind: "comparison", evidence: "This hero has the highest listed fit score for the item." },
  ],
  alternatives: [{ action: "challenge:r1_main_2", reason: "Progress without testing equipment." }],
  hypothesis: null,
});

assert.equal(session.gameState.inventory.length, 1, "explicit equip should consume one inventory item");
assert.equal(equippedCount(session.gameState), 1, "explicit equip should change one equipment slot");
assert(session.gameState.history[0].gearAfter > 0, "equipped power should rise only after explicit equip");

const equipFact = session.knowledgeBase.find((row) => row.environment.phase === "equipment");
assert.equal(equipFact.behavior.kind, "equip_item");
assert(equipFact.result.observations[0].powerDelta > 0);
assert.equal(session.history[1].learningDelta.addedKnowledge.length, 1, "equip must persist one new causal knowledge row");
for (const row of session.knowledgeBase) {
  assert(row.subject && row.environment && row.behavior && row.result, `invalid knowledge tuple: ${row.id}`);
}

const equipResultId = session.history[1].eventLog.find((row) => row.type === "equipment_change").id;
const equipSummaryId = session.history[1].eventLog.find((row) => row.type === "action_summary").id;
session = LOOP.applyAttributionResponse(session, {
  knowledgeId: equipFact.id,
  primaryCause: "The player explicitly equipped an inventory item on the best-fit hero.",
  confidence: 0.99,
  evidenceEventIds: [equipResultId, equipSummaryId],
  alternativeCauses: [],
  nextTest: "Challenge Main 2 with the equipped item.",
});

assert.equal(session.phase, "complete");
assert.equal(session.cycle, 2);

let repeated = LOOP.createSession("knowledge-dedup-test", 9);
for (let cycle = 0; cycle < 9; cycle += 1) {
  repeated = LOOP.applyDecisionResponse(repeated, {
    action: "challenge:r1_main_1",
    goalId: "grow_and_progress",
    reasoningChain: [{ kind: "evidence", evidence: "Repeat the same encounter to test knowledge consolidation." }],
    alternatives: [],
    hypothesis: null,
  });
  const repeatedResultId = repeated.history.at(-1).eventLog.find((row) => row.type === "combat_result").id;
  const repeatedSummaryId = repeated.history.at(-1).eventLog.find((row) => row.type === "action_summary").id;
  const encounterKnowledge = repeated.knowledgeBase.find((row) => row.behavior.kind === "challenge_level");
  repeated = LOOP.applyAttributionResponse(repeated, {
    knowledgeId: encounterKnowledge.id,
    primaryCause: "The squad completed the repeated encounter.",
    confidence: 0.9,
    evidenceEventIds: [repeatedResultId, repeatedSummaryId],
    alternativeCauses: [],
    nextTest: "",
  });
}
assert.equal(repeated.knowledgeBase.length, 11, "repeating one encounter must update existing knowledge instead of creating detail spam");
assert(repeated.knowledgeBase.every((row) => row.result.observations.length <= 8), "knowledge history must stay bounded");
assert.equal(repeated.knowledgeBase.some((row) => ["skill_cast", "skill_effect", "damage"].includes(row.behavior.kind)), false);
assert.equal(repeated.knowledgeBase.some((row) => /^right-/.test(row.subject.id)), false, "individual disposable enemies must not become long-term knowledge");
assert.equal(repeated.knowledgeBase.some((row) => /盗匪|路匪/.test(JSON.stringify(row))), false, "repeated knowledge must remain concept-level");

console.log(JSON.stringify({
  result: "PASS",
  cycles: session.cycle,
  knowledgeCount: session.knowledgeBase.length,
  repeatedEncounterCycles: repeated.cycle,
  repeatedKnowledgeCount: repeated.knowledgeBase.length,
  inventoryAfterLoot: 2,
  gearAfterLoot: lootFact.result.observations[0].equippedPowerAfter,
  gearAfterExplicitEquip: equipFact.result.observations[0].equippedPowerAfter,
}, null, 2));

function equippedCount(state) {
  return state.roster.reduce((sum, unit) => sum + Object.keys(unit.equipment || {}).length, 0);
}
