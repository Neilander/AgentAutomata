const assert = require("node:assert/strict");
const LOOP = require("./player-agent-loop");
const COMBAT_SIM = require("../../game_data/combat-sim");
const ENCOUNTERS = require("../../map_progression_lab/map-progression-encounters");
const ROSTER = require("../../map_progression_lab/map-progression-roster");
const DESIGN_INTENT = require("../../map_progression_lab/first-region-design-intent.json");

let session = LOOP.createSession("causal-loop-test", 2);
const initialRequest = LOOP.getPendingRequest(session);
assert.equal(initialRequest.observation.roster.length, 5, "initial roster should contain one full hero and four militia");
assert.equal(initialRequest.observation.roster.some((unit) => unit.id === "hero_mage"), false, "Mage must not exist before Main 2");
assert.deepEqual(initialRequest.observation.teamSlots.map((slot) => slot.heroId), [
  "hero_warrior",
  "militia_barricade",
  "militia_spear",
  "militia_herb",
]);
assert(initialRequest.observation.roster.every((unit) => unit.note), "decision agent must see every role description");
assert.equal(initialRequest.observation.roster.find((unit) => unit.id === "militia_drum").isActive, false);
assert.equal("affordanceExperiments" in initialRequest.playerState, false, "evaluator experiments must never enter the player request");
assert.equal(initialRequest.playerState.goals.some((goal) => goal.id === "discover_new_capabilities"), false, "the natural-swap test must not expose a discovery goal");
session = LOOP.applyDecisionResponse(session, {
  action: "challenge:r1_main_1",
  goalId: "grow_and_progress",
  reasoningChain: [{ kind: "affordance", evidence: "Main 1 is the available progression action." }],
  alternatives: [],
  hypothesis: null,
});

assert.equal(session.gameState.inventory.length, 2, "clearing Main 1 should place two items in inventory");
assert.equal(session.history[0].gameEvent.performance.killCount, 10, "Main 1 must execute all ten wave enemies");
assert.equal(session.history[0].gameEvent.resolution, "elimination");
assert.deepEqual(session.history[0].gameEvent.waveSummary.map((row) => row.unitCount), [3, 3, 4]);
assert(session.history[0].gameEvent.waveSummary[1].time > 0.5, "the second entry must wait until the opening group is reduced");
assert.equal(session.history[0].eventLog.filter((row) => row.behavior.tags?.includes("reinforcement")).length, 3, "all wave entries must be visible to cognition");
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
assert.equal(threatFacts.length, 1);
assert.equal(threatFacts[0].result.observations[0].observedUnitCount, 10);
assert.equal(threatFacts[0].subject.name, "普通小怪");
const engineEnemyPattern = /盗匪|路匪|郊野短刀兵|郊野投石手/;
assert(session.history[0].rawEventLog.some((row) => engineEnemyPattern.test(row.subject?.name || "")), "raw audit log should retain engine identities");
assert.equal(session.history[0].eventLog.some((row) => engineEnemyPattern.test(JSON.stringify(row))), false, "player semantic events must not leak engine enemy identities");
assert.equal(session.knowledgeBase.some((row) => engineEnemyPattern.test(JSON.stringify(row))), false, "knowledge must be learned from concepts, not engine enemy identities");
assert(session.history[0].conceptInterpretation.decisions.every((row) => row.visibleEvidence.every((evidence) => evidence.eventId)), "concept matches must cite visible events");
assert.equal(session.history[0].learningDelta.addedKnowledge.length, 10, "first challenge must persist its exact knowledge additions");
assert.deepEqual(session.history[0].learningDelta.matchedConcepts.map((row) => row.label).sort(), ["普通小怪"]);
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

let onboarding = LOOP.createSession("main2-mage-onboarding-test", 5);
onboarding = chooseAndAttribute(onboarding, "challenge:r1_main_1");
onboarding = LOOP.applyDecisionResponse(onboarding, decisionFor("challenge:r1_main_2"));
const main2Record = onboarding.history.at(-1);
assert.equal(main2Record.outcome, "win", "starter team must be able to earn the Main 2 Mage");
assert.equal(main2Record.gameEvent.characterUnlock?.heroId, "hero_mage");
assert(main2Record.eventLog.some((row) => row.type === "character_unlock" && row.result.character === "mage"));
assert(onboarding.knowledgeBase.some((row) => row.environment.phase === "character_reward"
  && row.result.observations.some((observation) => observation.character?.heroId === "hero_mage")));
onboarding = attributePending(onboarding);

const postMain2Request = LOOP.getPendingRequest(onboarding);
const visibleMage = postMain2Request.observation.roster.find((unit) => unit.id === "hero_mage");
assert.deepEqual(visibleMage, {
  id: "hero_mage",
  name: "烬火法师",
  role: "mage",
  kind: "hero",
  note: "完整输出英雄，负责清怪与爆发。",
  isActive: false,
  teamSlot: null,
  slotLabel: null,
  equippedSlots: [],
});
assert(postMain2Request.observation.allowedActions.includes("swap:2:hero_mage"));
assert.equal("affordanceExperiments" in postMain2Request.playerState, false);
assert.equal(postMain2Request.playerState.hypotheses.some((row) => String(row.id).includes("team-experiment")), false);
assert(onboarding.evaluatorState.affordanceExperiments.some((row) => row.heroId === "hero_mage" && row.status === "available"));

assert.throws(() => LOOP.applyDecisionResponse(onboarding, {
  action: "swap:2:hero_mage",
  goalId: "grow_and_progress",
  reasoningChain: [{ kind: "hypothesis", evidence: "Mage may contribute damage." }],
  alternatives: [],
  hypothesis: {
    id: "invalid-mage-hypothesis",
    problem: "Mage value is unknown.",
    cause: "Mage may deal damage.",
    resultKind: "team_experiment_contribution",
    target: "hero_mage",
    verificationScope: "next_combat",
    targetCondition: { metric: "damage", operator: ">", value: 0 },
  },
}), /decision hypothesis rejected/, "an incomplete reasoning chain must not silently discard a hypothesis");

onboarding = LOOP.applyDecisionResponse(onboarding, hypothesisDecisionFor("swap:2:hero_mage", {
  id: "player-test-mage-contribution",
  problem: "The newly rescued Mage's combat value is unknown.",
  cause: "Putting the Mage in the active team should produce visible spell damage in the next battle.",
  resultKind: "team_experiment_contribution",
  target: "hero_mage",
  verificationScope: "next_combat",
  targetCondition: { metric: "damage", operator: ">", value: 0 },
}));
onboarding = attributePending(onboarding);
const postSwapRequest = LOOP.getPendingRequest(onboarding);
assert.equal(postSwapRequest.playerState.hypotheses.some((row) => String(row.id).includes("team-experiment")), false, "the evaluator must not tell the player agent to verify its swap");
const pendingMageHypothesis = postSwapRequest.playerState.hypotheses.find((row) => row.id === "player-test-mage-contribution");
assert.equal(pendingMageHypothesis.status, "pending", "the player's delayed hypothesis must survive the swap action");
assert.equal(pendingMageHypothesis.verificationScope, "next_combat");
assert(onboarding.evaluatorState.affordanceExperiments.some((row) => row.heroId === "hero_mage" && row.status === "awaiting_combat"));
onboarding = LOOP.applyDecisionResponse(onboarding, decisionFor("challenge:r1_main_3"));
const experimentEvent = onboarding.history.at(-1).eventLog.find((row) => row.type === "team_experiment_result");
const hypothesisTrace = onboarding.history.at(-1).eventTrace.find((row) => row.hypothesisVerification
  .some((verification) => verification.id === "player-test-mage-contribution"));
const mageSettledContribution = onboarding.history.at(-1).gameEvent.contributions.find((row) => row.name === visibleMage.name);
const settledTeamDamage = onboarding.history.at(-1).gameEvent.contributions.reduce((sum, row) => sum + row.damage, 0);
const settledMageRank = 1 + onboarding.history.at(-1).gameEvent.contributions
  .filter((row) => row.damage > mageSettledContribution.damage).length;
assert.equal(onboarding.history.at(-1).outcome, "win");
assert.equal(experimentEvent.result.heroId, "hero_mage");
assert(experimentEvent.result.contribution.damage > 0, "Mage experiment must record visible combat contribution");
assert.equal(experimentEvent.result.contribution.damage, mageSettledContribution.damage, "experiment damage must match authoritative combat settlement");
assert.equal(experimentEvent.result.contribution.teamDamage, settledTeamDamage);
assert.equal(experimentEvent.result.contribution.damageRank, settledMageRank);
assert.equal(hypothesisTrace.EVerify, 1, "a measured next-combat comparison must produce one EVerify");
assert.equal(hypothesisTrace.hypothesisVerification[0].status, "confirmed");
assert.equal(hypothesisTrace.hypothesisVerification[0].observedValue, experimentEvent.result.contribution.damage);
assert.equal(onboarding.cognitionState.hypotheses.find((row) => row.id === "player-test-mage-contribution").status, "confirmed");
assert.equal(onboarding.cognitionState.affordanceExperiments.length, 0);
assert(onboarding.evaluatorState.affordanceExperiments.some((row) => row.heroId === "hero_mage" && row.status === "resolved"));
onboarding = attributePending(onboarding);
const postMain3Request = LOOP.getPendingRequest(onboarding);
assert.equal(postMain3Request.playerState.hypotheses.find((row) => row.id === "player-test-mage-contribution").status, "confirmed", "the next decision must see the verified result");
assert.notEqual(
  postMain3Request.observation.visibleNodes.find((node) => node.id === "r1_main_4")?.enemyHint,
  "一头高生命蛮熊；需要对同一目标保持持续输出",
  "Main 4 must not require the Ranger before the Prison/Camp acquisition window",
);
assert.equal(
  postMain3Request.observation.visibleNodes.find((node) => node.id === "r1_prison")?.rewardHint,
  "首通营救林地游侠：持续锁定单体并累积猎标；复战无首通奖励",
);
assert.equal(
  postMain3Request.observation.optionalOpportunities.find((row) => row.node === "r1_prison")?.reason,
  "可选救援：首通营救擅长持续单体输出的林地游侠",
);
assert.equal(DESIGN_INTENT.immutable.validationNode, "r1_main_7");
assert.equal(DESIGN_INTENT.immutable.branchesDoNotGrantMainlinePermission, true);
assert.deepEqual(DESIGN_INTENT.immutable.optionalBranches, ["r1_prison", "r1_bandit"]);

const teachingEnemy = ENCOUNTERS.rangerTeachingTeam();
assert.equal(teachingEnemy.length, 1);
assert.equal(teachingEnemy[0].hp, 1000);
const teachingRoster = ROSTER.rescueHero(ROSTER.createInitialRoster(), "ranger");
let mageWins = 0;
let rangerWins = 0;
for (let index = 0; index < 20; index += 1) {
  const options = { seed: `ranger-teaching-${index}`, randomizeStats: false, maxTime: 70 };
  const mageTeam = ROSTER.buildTeam(teachingRoster, ["hero_warrior", "militia_barricade", "hero_mage", "militia_herb"]);
  const rangerTeam = ROSTER.buildTeam(teachingRoster, ["hero_warrior", "militia_barricade", "hero_ranger", "militia_herb"]);
  if (COMBAT_SIM.simulateTeams(mageTeam, teachingEnemy, options).winner === "left") mageWins += 1;
  if (COMBAT_SIM.simulateTeams(rangerTeam, teachingEnemy, options).winner === "left") rangerWins += 1;
}
assert(rangerWins >= 8, `The naked Ranger team should retain visible single-target value; wins=${rangerWins}`);
assert(rangerWins >= mageWins + 8, `Ranger should clearly outperform Mage before progression gear; ranger=${rangerWins}, mage=${mageWins}`);

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
assert.equal(repeated.knowledgeBase.length, 10, "repeating one encounter must update existing knowledge instead of creating detail spam");
assert(repeated.knowledgeBase.every((row) => row.result.observations.length <= 8), "knowledge history must stay bounded");
assert.equal(repeated.knowledgeBase.some((row) => ["skill_cast", "skill_effect", "damage"].includes(row.behavior.kind)), false);
assert.equal(repeated.knowledgeBase.some((row) => /^right-/.test(row.subject.id)), false, "individual disposable enemies must not become long-term knowledge");
assert.equal(repeated.knowledgeBase.some((row) => engineEnemyPattern.test(JSON.stringify(row))), false, "repeated knowledge must remain concept-level");

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

function decisionFor(action) {
  return {
    action,
    goalId: "grow_and_progress",
    reasoningChain: [{ kind: "affordance", evidence: `Exercise visible action ${action}.` }],
    alternatives: [],
    hypothesis: null,
  };
}

function hypothesisDecisionFor(action, hypothesis) {
  return {
    action,
    goalId: "grow_and_progress",
    reasoningChain: [
      { kind: "goal", evidence: "Improve the active squad and continue progression." },
      { kind: "knowledge", evidence: "The newly unlocked hero has not yet fought in the active team." },
      { kind: "affordance", evidence: `${action} can place that hero into the active team.` },
      { kind: "comparison", evidence: "Keeping the current unit would not test the new hero's contribution." },
      { kind: "hypothesis", evidence: "The next combat can measure the new hero's contribution." },
    ],
    alternatives: [{ action: "challenge:r1_main_3", reason: "Continue without testing the new hero." }],
    hypothesis,
  };
}

function chooseAndAttribute(sessionInput, action) {
  return attributePending(LOOP.applyDecisionResponse(sessionInput, decisionFor(action)));
}

function attributePending(sessionInput) {
  const pending = sessionInput.pendingAttribution;
  const knowledge = sessionInput.knowledgeBase.find((row) => row.id === pending.knowledgeIds[0]);
  return LOOP.applyAttributionResponse(sessionInput, {
    knowledgeId: knowledge.id,
    primaryCause: "The visible result followed the selected action.",
    confidence: 0.9,
    evidenceEventIds: knowledge.evidenceEventIds.slice(0, 2),
    alternativeCauses: [],
    nextTest: "",
  });
}
