const assert = require("node:assert/strict");
const CORE = require("../map_progression_lab/map-progression-cognition-core");
const RUNTIME = require("./player-cognition-v1-event-runtime");
const ADAPTER = require("./map-cognition-v1-event-adapter");
const FLOW = require("./analyze-map-cognition-v1-events");
const POLICY = require("./player-cognition-v1-action-policy");
const ACTION_LOOP = require("./analyze-map-cognition-v1-action-loop");
const COMBAT_SIGNALS = require("./combat-signals");

const FORBIDDEN_PSYCHOLOGY_KEYS = new Set([
  "H", "perceptual", "progression", "deadRepetition", "Agency", "R", "A", "emotion",
]);

function testCoreAnalysisIsOptInAndTransient() {
  const initial = CORE.initialState("v1-core-contract");
  const normal = CORE.applyAction(initial, "challenge:r1_main_1");
  assert.equal(normal.ok, true);
  assert.equal(Object.hasOwn(normal, "analysis"), false, "normal gameplay must not produce cognition analysis");
  assert.equal(Object.hasOwn(normal.event, "analysis"), false);
  assert.equal(Object.hasOwn(normal.state.history[0], "analysis"), false);

  const captured = CORE.applyAction(initial, "challenge:r1_main_1", { captureVisibleSignals: true });
  assert.equal(captured.ok, true);
  assert.equal(captured.analysis.schema, "map_cognition_analysis_v1");
  assert(captured.analysis.combatSignals.length > 0);
  assert.equal(Object.hasOwn(captured.event, "cognitionSignals"), false);
  assert.equal(Object.hasOwn(captured.state.history[0], "cognitionSignals"), false);

  const kinds = new Set(captured.analysis.combatSignals.map((row) => row.type));
  assert(kinds.has("damage"));
  assert(kinds.has("skill"));
  assert(!kinds.has("health"));
  assert(!kinds.has("targeting"));
  assert(!kinds.has("shieldBreak"));
  for (const row of captured.analysis.combatSignals) {
    assert.equal(row.presentation.contract, "battle_view_unified_signal_v1");
    assert(row.presentation.renderer && row.presentation.renderer !== "none");
    assertNoPsychologyFields(row);
  }
}

function testRealTraceAndFeedbackBeforeLearning() {
  const result = FLOW.runMainOpening("v1-real-trace");
  assert.equal(result.ok, true);
  const state = result.session.cognitionState;
  assert.equal(new Set(state.trace.map((row) => row.eventId)).size, state.trace.length, "event ids must stay unique across repeated encounters");
  const damageRows = state.trace.filter((row) => row.accepted && row.type === "damage");
  assert(damageRows.length > 0);
  assert(damageRows.every((row) => row.tuple.subject && row.tuple.environment && row.tuple.behavior && row.tuple.result));
  assert(damageRows.every((row) => row.learningOrder === "feedback_then_update"));
  const firstNew = damageRows.find((row) => !row.knowledgeBefore && row.knowledgeAfter?.count === 1);
  assert(firstNew, "a first observation must settle before creating knowledge");
  const repeated = damageRows.find((row) => row.knowledgeBefore && row.knowledgeAfter?.count > row.knowledgeBefore.count);
  assert(repeated, "a repeated observation must use an old snapshot before updating it");
  assert.equal(state.expectationLedger.some((row) => row.status === "pending" && !String(row.key).startsWith("probability:")), false);
}

function testVisibilityCausalControl() {
  const captured = CORE.applyAction(CORE.initialState("v1-visibility"), "challenge:r1_main_1", { captureVisibleSignals: true });
  const actualDamage = captured.analysis.combatSignals.find((row) => row.type === "damage" && row.result.amount > 0);
  assert(actualDamage);

  const visibleState = RUNTIME.ingestEvents(RUNTIME.createState("visible"), [actualDamage]);
  const hiddenEvent = structuredClone(actualDamage);
  hiddenEvent.presentation.visible = false;
  const hiddenState = RUNTIME.ingestEvents(RUNTIME.createState("hidden"), [hiddenEvent]);

  assert.equal(visibleState.trace[0].accepted, true);
  assert.notEqual(visibleState.emotion.value, visibleState.config.initialEmotion);
  assert.equal(hiddenState.trace[0].accepted, false);
  assert.equal(hiddenState.emotion.value, hiddenState.config.initialEmotion);
  assert.equal(hiddenState.knowledge.length, 0);
}

function testDamageUtilityUsesBattlePerspective() {
  const captured = CORE.applyAction(CORE.initialState("v1-perspective"), "challenge:r1_main_1", { captureVisibleSignals: true });
  const dealt = captured.analysis.combatSignals.find((row) => row.type === "damage" && row.subject?.side === "left" && row.result.target?.side === "right");
  const taken = captured.analysis.combatSignals.find((row) => row.type === "damage" && row.subject?.side === "right" && row.result.target?.side === "left");
  assert(dealt && taken);
  assert(RUNTIME.utilityOf(dealt) > 0, "damage dealt by the player should be positive");
  assert(RUNTIME.utilityOf(taken) < 0, "damage taken by the player should be negative");
}

function testActualPresentationCompetitionDilutesH() {
  const captured = CORE.applyAction(CORE.initialState("v1-attention"), "challenge:r1_main_1", { captureVisibleSignals: true });
  const actualDamage = captured.analysis.combatSignals.find((row) => row.type === "damage" && row.result.amount > 0);
  assert(actualDamage?.presentation?.attentionZone);
  const single = RUNTIME.ingestEvents(RUNTIME.createState("single-attention"), [actualDamage]);
  const crowdedEvents = Array.from({ length: 9 }, (_, index) => ({
    ...structuredClone(actualDamage),
    id: `${actualDamage.id}:crowded:${index}`,
    time: actualDamage.time + index * 0.01,
  }));
  const crowded = RUNTIME.ingestEvents(RUNTIME.createState("crowded-attention"), crowdedEvents);
  const singleH = single.trace[0].H;
  const crowdedH = crowded.trace.find((row) => row.accepted)?.H || crowded.trace[0].H;
  assert(crowdedH < singleH, "signals competing in the same rendered zone should receive less H");
  assert.equal(crowded.trace[0].HComponents.competitorCount, 9);
  assert(crowded.trace[0].HComponents.presentationContract === "battle_view_unified_signal_v1");
}

function testRendererContractRequiresResolvableAnchorsAndUsesOverlap() {
  assert.equal(COMBAT_SIGNALS.describePresentation({ kind: "skill", source: null, target: null, tags: [] }).visible, false);
  assert.equal(COMBAT_SIGNALS.describePresentation({ kind: "damage", source: { id: "a" }, target: null, amount: 10, tags: [] }).visible, false);
  const base = {
    type: "damage",
    subject: { id: "a", role: "warrior", side: "left" },
    environment: { node: "overlap" },
    behavior: { kind: "damage", key: "attack" },
    result: { kind: "damage", amount: 10, target: { id: "target", side: "right" }, hpBefore: 100, hpAfter: 90 },
    presentation: {
      visible: true,
      attentionZone: "target",
      renderEvidence: { animationSeconds: 0.9, fontPx: 13, colorToken: "default", moving: true },
    },
  };
  const rows = RUNTIME.annotateAttentionCompetition([
    { ...structuredClone(base), id: "overlap-a", time: 0.39 },
    { ...structuredClone(base), id: "overlap-b", time: 0.41 },
  ]);
  assert.equal(rows[0].presentation.competitorCount, 2);
  assert.equal(rows[1].presentation.competitorCount, 2);
}

function testProbabilityUsesOneDelayedLedger() {
  const base = {
    subject: { id: "player", role: "player" },
    environment: { node: "loot_test", phase: "reward" },
    behavior: { kind: "encounter_reward", key: "reward:loot_test" },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
  };
  const events = [
    {
      ...base,
      id: "loot-opportunity",
      time: 1,
      type: "loot",
      result: { kind: "probability_outcome", occurred: true, components: [] },
      probability: { opportunity: true, success: false, family: "rare_equipment:loot_test" },
      expectation: { phase: "accumulate", key: "loot-window", deadline: "action_end" },
    },
    {
      ...base,
      id: "loot-close",
      time: 2,
      type: "action_summary",
      result: { kind: "action_summary", utility: 0, occurred: true, components: [] },
      expectation: { phase: "close_group", key: "loot-window", deadline: "action_end" },
      directResult: false,
      learn: false,
    },
  ];
  const state = RUNTIME.ingestEvents(RUNTIME.createState("probability"), events);
  const opportunity = state.trace.find((row) => row.eventId === "loot-opportunity");
  const close = state.trace.find((row) => row.eventId === "loot-close");
  assert.equal(opportunity.mismatchStatus, "reasonable_dry");
  assert.equal(opportunity.expectationEmotion, 0);
  assert.equal(close.mismatchStatus, "no_prior");
  assert.equal(state.expectationLedger[0].status, "resolved");
}

function testEncounterOutcomeSettlesExpectationOnlyAtSummary() {
  const gameState = CORE.initialState("single-settlement");
  const cognition = RUNTIME.createState("single-settlement");
  const first = ADAPTER.runMapAction(CORE, gameState, "challenge:r1_main_1", cognition, { decisionMade: true });
  assert.equal(first.ok, true);
  const resultRow = first.cognitionState.trace.find((row) => row.eventId.endsWith(":result"));
  const summaryRow = first.cognitionState.trace.find((row) => row.eventId.endsWith(":summary") && !row.eventId.endsWith(":loot-summary"));
  assert.equal(resultRow.mismatchStatus, "observation_only");
  assert.equal(resultRow.expectationEmotion, 0);
  assert(summaryRow);
  assert.equal(summaryRow.expectationSource, "unknown_ledger");
  assert.equal(summaryRow.mismatchStatus, "no_prior");
  assert.equal(summaryRow.expectationEmotion, 0);
  assert.equal(first.cognitionState.knowledge.filter((row) => row.pattern.behavior.includes("map_action")).length, 1);
}

function testSameEventChangesWithPriorKnowledgeAndDesire() {
  const raw = {
    id: "counterfactual-loot",
    time: 1,
    type: "loot",
    subject: { id: "player", role: "player" },
    environment: { node: "counterfactual", phase: "reward" },
    behavior: { kind: "encounter_reward", key: "counterfactual-reward" },
    result: { kind: "loot", rarity: "legendary", occurred: true },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
  };

  const novice = RUNTIME.ingestEvents(RUNTIME.createState("novice"), [raw]);
  let learned = RUNTIME.createState("learned");
  for (let index = 0; index < 4; index += 1) {
    learned = RUNTIME.ingestEvents(learned, [{ ...raw, id: `learn-${index}` }]);
  }
  learned = RUNTIME.ingestEvents(learned, [{ ...raw, id: "learned-probe" }]);
  const noviceRow = novice.trace.at(-1);
  const learnedRow = learned.trace.at(-1);
  assert.equal(noviceRow.expectationSource, "unknown");
  assert.equal(learnedRow.expectationSource, "knowledge");
  assert(learnedRow.appraisal.freshness < noviceRow.appraisal.freshness);
  assert(learnedRow.acquiredEmotion < noviceRow.acquiredEmotion, "learned repetition should reduce direct freshness feedback");

  const lowDesire = RUNTIME.createState("low-desire");
  lowDesire.goals[0].subjectiveValue = 0;
  const highDesire = RUNTIME.createState("high-desire");
  highDesire.goals[0].subjectiveValue = 1;
  const low = RUNTIME.ingestEvents(lowDesire, [{ ...raw, id: "low-desire" }]).trace.at(-1);
  const high = RUNTIME.ingestEvents(highDesire, [{ ...raw, id: "high-desire" }]).trace.at(-1);
  assert(high.acquiredEmotion > low.acquiredEmotion, "the same result should matter more under a stronger active desire");
}

function testLearnedProbabilityFormsExpectation() {
  const base = {
    time: 1,
    type: "loot_outcome",
    subject: { id: "player", role: "player" },
    environment: { node: "probability-learning", phase: "reward" },
    behavior: { kind: "encounter_reward", key: "probability-learning" },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: false },
    directResult: false,
  };
  let state = RUNTIME.createState("probability-learning");
  for (let index = 0; index < 6; index += 1) {
    const success = index < 2;
    state = RUNTIME.ingestEvents(state, [{
      ...base,
      id: `probability-history-${index}`,
      result: { kind: "probability_outcome", occurred: true, components: success ? [{ kind: "loot", rarity: "rare" }] : [] },
      probability: { opportunity: true, success, family: "rare_equipment:test" },
    }]);
  }
  state = RUNTIME.ingestEvents(state, [{
    ...base,
    id: "probability-probe",
    result: { kind: "probability_outcome", occurred: true, components: [] },
    probability: { opportunity: true, success: false, family: "rare_equipment:test" },
    expectation: { phase: "accumulate", key: "probability-probe-window", deadline: "action_end" },
  }]);
  const probe = state.trace.at(-1);
  assert.equal(probe.expectationSource, "probability_snapshot");
  assert(probe.expectedUtility > 0, "learned occurrence rate and success value should form a nonzero expectation");
  assert.equal(probe.mismatchStatus, "reasonable_dry");
}

function testReasonableAndAbnormalDryUseDifferentSettlement() {
  const base = {
    time: 1,
    type: "loot_outcome",
    subject: { id: "player", role: "player" },
    environment: { node: "dry-test", phase: "reward" },
    behavior: { kind: "encounter_reward", key: "dry-test" },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: false },
    probability: { opportunity: true, success: false, family: "rare_equipment:dry-test" },
    expectation: { phase: "accumulate", key: "probability:rare_equipment:dry-test", deadline: "learned_probability_horizon" },
    directResult: false,
  };
  let state = RUNTIME.createState("dry-test");
  state = RUNTIME.ingestEvents(state, [{
    ...base,
    id: "dry-training-success",
    result: { kind: "probability_outcome", occurred: true, components: [{ kind: "loot", rarity: "rare" }] },
    probability: { ...base.probability, success: true },
  }]);
  let abnormal = null;
  for (let index = 0; index < 20 && !abnormal; index += 1) {
    state = RUNTIME.ingestEvents(state, [{
      ...base,
      id: `dry-miss-${index}`,
      result: { kind: "probability_outcome", occurred: true, components: [] },
    }]);
    const row = state.trace.at(-1);
    if (index === 0) {
      assert.equal(row.mismatchStatus, "reasonable_dry");
      assert.equal(row.expectationEmotion, 0);
    }
    if (row.mismatchStatus === "abnormal_dry") abnormal = row;
  }
  assert(abnormal, "a long enough learned dry streak should eventually cross the abnormal threshold");
  assert(abnormal.expectationEmotion < 0);
}

function testFirstProbabilitySuccessHasNoInventedExpectation() {
  const event = {
    id: "first-probability-success",
    time: 1,
    type: "loot_outcome",
    subject: { id: "player", role: "player" },
    environment: { node: "first-probability", phase: "reward" },
    behavior: { kind: "encounter_reward", key: "first-probability" },
    result: { kind: "probability_outcome", occurred: true, components: [{ kind: "loot", rarity: "rare" }] },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
    probability: { opportunity: true, success: true, family: "rare_equipment:first-probability" },
    expectation: { phase: "accumulate", key: "probability:rare_equipment:first-probability", deadline: "learned_probability_horizon" },
    directResult: false,
  };
  const state = RUNTIME.ingestEvents(RUNTIME.createState("first-probability"), [event]);
  assert.equal(state.trace[0].mismatchStatus, "no_prior");
  assert.equal(state.trace[0].expectationEmotion, 0);
}

function testAdapterUsesReturnedAnalysisOnly() {
  const gameState = CORE.initialState("adapter-contract");
  const cognition = RUNTIME.createState("adapter-contract");
  const result = ADAPTER.runMapAction(CORE, gameState, "challenge:r1_main_1", cognition, { decisionMade: true });
  assert.equal(result.ok, true);
  assert(result.analysis?.combatSignals?.length > 0);
  assert.equal(Object.hasOwn(result.event, "cognitionSignals"), false);
  assert(result.eventLog.some((row) => row.type === "damage"));
}

function testCognitionSelectsRealNextActions() {
  const result = ACTION_LOOP.runLoop("cognition-selects-actions", 6);
  assert.equal(result.ok, true);
  assert.equal(result.loop.actions[0].action, "challenge:r1_main_1");
  assert(result.loop.actions.every((row) => row.action), "every executed action must come from the policy");
  const decisions = result.loop.cognitionState.trace.filter((row) => row.type === "decision");
  assert.equal(decisions.length, result.loop.actions.length);
  assert(decisions.every((row) => row.EDecision >= 1));
  assert(decisions.every((row) => ["simple_comparison", "problem_evidence_behavior_hypothesis"].includes(row.decisionValidation.mode)));
}

function testSameVisibleStateChangesChoiceAfterRealFailureKnowledge() {
  let gameState = CORE.initialState("cognition-loop-review");
  let cognitionState = RUNTIME.createState("cognition-loop-review");
  for (let index = 1; index <= 3; index += 1) {
    const result = ADAPTER.runMapAction(CORE, gameState, `challenge:r1_main_${index}`, cognitionState);
    assert.equal(result.event.outcome, "win");
    gameState = result.state;
    cognitionState = result.cognitionState;
  }
  const fixedVisibleState = CORE.observe(gameState);
  const before = POLICY.selectNextAction(cognitionState, fixedVisibleState);
  assert.equal(before.action, "challenge:r1_prison", "the visible character reward should initially justify exploration");

  const prison = ADAPTER.runMapAction(CORE, gameState, "challenge:r1_prison", before.cognitionState);
  assert.equal(prison.event.outcome, "loss");
  assert.equal(prison.event.lootOpportunity, false);
  assert.equal(prison.eventLog.some((row) => row.type === "loot_outcome"), false, "defeat must truncate the reward opportunity");
  const interruptedSummary = prison.eventLog.find((row) => row.id.endsWith(":summary"));
  assert.equal(interruptedSummary.result.boundary, "interrupted_by_defeat");
  const interruptedLedger = prison.cognitionState.expectationLedger.find((row) => row.key.includes("map_action:r1_prison"));
  assert.equal(interruptedLedger.resolutionBoundary, "interrupted_by_defeat");
  const normalSummary = ADAPTER.buildMapEventLog("challenge:r1_main_3", { node: "r1_main_3", step: 3, outcome: "win", duration: 1, firstClear: true }, {}).find((row) => row.id.endsWith(":summary"));
  assert.equal(normalSummary.result.boundary, "normal_end");
  const after = POLICY.selectNextAction(prison.cognitionState, fixedVisibleState);
  assert.notEqual(after.action, before.action, "real failure knowledge should alter choice under the same visible affordances");
  assert.equal(after.action, "challenge:r1_main_4");
  assert.equal(before.decision.goalId, "discover_new_capabilities");
  assert.equal(after.decision.goalId, "grow_and_progress");
  assert.equal(after.decision.choiceMode, "switch_to_other_goal_after_failure");
  const prisonBefore = before.candidates.find((row) => row.action === "challenge:r1_prison");
  const prisonAfter = after.candidates.find((row) => row.action === "challenge:r1_prison");
  assert(prisonAfter.score < prisonBefore.score);
  assert(prisonAfter.failureBasis?.failures === 1);
}

function testEmotionChangesRiskRankingWithoutChangingVisibleState() {
  let gameState = CORE.initialState("cognition-loop-review");
  let cognitionState = RUNTIME.createState("cognition-loop-review");
  for (let index = 1; index <= 3; index += 1) {
    const result = ADAPTER.runMapAction(CORE, gameState, `challenge:r1_main_${index}`, cognitionState);
    gameState = result.state;
    cognitionState = result.cognitionState;
  }
  const fixedVisibleState = CORE.observe(gameState);
  const discouraged = structuredClone(cognitionState);
  discouraged.emotion.value = 5;
  const confident = structuredClone(cognitionState);
  confident.emotion.value = 90;
  const lowChoice = POLICY.selectNextAction(discouraged, fixedVisibleState);
  const highChoice = POLICY.selectNextAction(confident, fixedVisibleState);
  const lowPrison = lowChoice.candidates.find((row) => row.action === "challenge:r1_prison");
  const highPrison = highChoice.candidates.find((row) => row.action === "challenge:r1_prison");
  assert(highPrison.score > lowPrison.score, "higher feedback should increase tolerance for an optional unknown route");
  assert(highPrison.components.optionalRiskPenalty < lowPrison.components.optionalRiskPenalty);
}

function testRealPresentationDerivedEmotionChangesAction() {
  let gameState = CORE.initialState("emotion-visible-real");
  let visibleCognition = RUNTIME.createState("emotion-visible-player");
  let occludedCognition = RUNTIME.createState("emotion-occluded-player");
  const feedBoth = (action) => {
    const result = CORE.applyAction(gameState, action, { captureVisibleSignals: true });
    assert.equal(result.ok, true);
    const node = CORE.nodes.find((item) => item.id === result.event.node);
    const eventLog = ADAPTER.buildMapEventLog(action, result.event, { analysis: result.analysis, nodeType: node?.type || "map" });
    visibleCognition = RUNTIME.ingestEvents(visibleCognition, eventLog);
    const occludedLog = structuredClone(eventLog);
    for (const event of occludedLog) {
      if (["damage", "heal", "shield", "skill", "status", "death", "loot", "loot_outcome"].includes(event.type)) {
        event.presentation.visible = false;
      }
    }
    occludedCognition = RUNTIME.ingestEvents(occludedCognition, occludedLog);
    gameState = result.state;
  };

  for (let index = 1; index <= 3; index += 1) feedBoth(`challenge:r1_main_${index}`);
  for (let index = 0; index < 20; index += 1) feedBoth("challenge:r1_main_1");

  const fixedVisibleState = CORE.observe(gameState);
  const visibleChoice = POLICY.selectNextAction(visibleCognition, fixedVisibleState);
  const occludedChoice = POLICY.selectNextAction(occludedCognition, fixedVisibleState);
  assert(visibleCognition.emotion.value > occludedCognition.emotion.value);
  assert.deepEqual(visibleCognition.goals, occludedCognition.goals, "both players must have identical map-goal progress");
  assert.equal(visibleChoice.candidates.find((row) => row.action === "challenge:r1_prison").knowledgeBasis, null);
  assert.equal(occludedChoice.candidates.find((row) => row.action === "challenge:r1_prison").knowledgeBasis, null);
  assert.equal(visibleChoice.action, "challenge:r1_prison");
  assert.equal(occludedChoice.action, "challenge:r1_main_4");
}

function testHypothesisVerificationComesFromTheChosenActionResult() {
  const result = ACTION_LOOP.runLoop("cognition-loop-review", 4);
  assert.equal(result.ok, true);
  const decisions = result.loop.cognitionState.trace.filter((row) => row.type === "decision");
  const prisonDecision = decisions.find((row) => row.tuple.result.action === "challenge:r1_prison");
  const firstDecision = decisions.find((row) => row.tuple.result.action === "challenge:r1_main_1");
  assert(prisonDecision?.hypothesisId, "the visible optional reward should create an auditable exploration hypothesis");
  assert.equal(firstDecision?.hypothesisId, null, "routine low-information progression need not create a hypothesis");
  const verification = result.loop.cognitionState.trace.find((row) => row.hypothesisEvidence?.includes(prisonDecision.hypothesisId));
  assert(verification);
  assert.equal(verification.hypothesisVerification[0].status, "refuted");
  assert.equal(verification.EVerify, 1, "explicit comparison with the hypothesis should create one verification-E step");
}

function assertNoPsychologyFields(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!FORBIDDEN_PSYCHOLOGY_KEYS.has(key), `game event injected psychology field: ${key}`);
    assertNoPsychologyFields(child);
  }
}

testCoreAnalysisIsOptInAndTransient();
testRealTraceAndFeedbackBeforeLearning();
testVisibilityCausalControl();
testDamageUtilityUsesBattlePerspective();
testActualPresentationCompetitionDilutesH();
testRendererContractRequiresResolvableAnchorsAndUsesOverlap();
testProbabilityUsesOneDelayedLedger();
testEncounterOutcomeSettlesExpectationOnlyAtSummary();
testSameEventChangesWithPriorKnowledgeAndDesire();
testLearnedProbabilityFormsExpectation();
testReasonableAndAbnormalDryUseDifferentSettlement();
testFirstProbabilitySuccessHasNoInventedExpectation();
testAdapterUsesReturnedAnalysisOnly();
testCognitionSelectsRealNextActions();
testSameVisibleStateChangesChoiceAfterRealFailureKnowledge();
testEmotionChangesRiskRankingWithoutChangingVisibleState();
testRealPresentationDerivedEmotionChangesAction();
testHypothesisVerificationComesFromTheChosenActionResult();
console.log("player cognition V1 event tests passed");
