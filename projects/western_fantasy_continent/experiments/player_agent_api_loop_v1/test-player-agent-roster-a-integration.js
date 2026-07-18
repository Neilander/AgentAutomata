const assert = require("node:assert/strict");
const LOOP = require("./player-agent-loop");
const ROSTER_EXPECTATIONS = require("./roster-change-expectation");
const IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");

let session = LOOP.createSession("roster-a-player-loop-integration", 8, {
  profileId: "open_novice",
  perceptionProfile: "ordinary",
});
session = chooseAndAttribute(session, "challenge:r1_main_1");
session = chooseAndAttribute(session, "challenge:r1_main_2");
const formalIdentityAudits = session.history
  .filter((row) => String(row.action).startsWith("challenge:"))
  .map((row) => row.entityImpressionUpdate?.stableIdentityAudit);
assert(formalIdentityAudits.every((audit) => audit?.allTemporaryFriendlyActorsMapped === true));
assert(formalIdentityAudits.every((audit) => audit?.temporaryIdentityCount === 4));

seedKnownMage(session);
session.rosterExpectationState = ROSTER_EXPECTATIONS.recordChallenge(session.rosterExpectationState, {
  teamIds: session.gameState.teamSlots,
  gameStateBefore: session.gameState,
  entityImpressionState: session.entityImpressionState,
  record: {
    action: "challenge:r1_main_3",
    outcome: "loss",
    gameEvent: {
      node: "r1_main_3",
      outcome: "loss",
      teamSizes: { player: 4, enemy: 4 },
      hpScore: { player: 2, enemy: 3 },
      waveSummary: [{ unitCount: 8 }],
    },
  },
}).state;

const beforeSwap = LOOP.getPendingRequest(session);
const mageAction = "swap:2:hero_mage";
const prediction = beforeSwap.playerState.rosterChangeExpectations.actions
  .find((row) => row.action === mageAction);
assert.equal(beforeSwap.playerState.rosterChangeExpectations.targetNode, "r1_main_3");
assert(prediction && Number.isFinite(prediction.predictedPerformanceScore),
  "the integration fixture needs a code-owned numeric mage prediction");

session = LOOP.applyDecisionResponse(session, decisionFor(mageAction));
const selection = session.history.at(-1).rosterPredictionSelection;
assert(selection, "player loop must freeze the selected prediction on the successful swap");
assert.equal(selection.source, "roster_prediction");
assert.equal(selection.targetNode, "r1_main_3");
assert.equal(session.rosterPredictionAState.pending.id, selection.id);
session = attributePending(session);

session = LOOP.applyDecisionResponse(session, decisionFor("challenge:r1_main_3"));
const fight = session.history.at(-1);
const summaryTrace = fight.eventTrace.find((row) => row.result === "action_summary");
assert(fight.rosterPredictionResolution, "next comparable combat must resolve the pending prediction");
assert.equal(fight.rosterPredictionResolution.id, selection.id);
assert.equal(session.rosterPredictionAState.pending, null);
assert.equal(summaryTrace.expectationSource, "roster_prediction");
assert.equal(summaryTrace.mismatchStatus, "resolved_roster_prediction");
assert.equal(summaryTrace.learningOrder, "feedback_then_update");
assert.equal(summaryTrace.expectationDetails.id, selection.id);
assert.equal(session.rosterPredictionAState.history.filter((row) => row.id === selection.id).length, 1,
  "one selected prediction must settle exactly once");

console.log(JSON.stringify({
  result: "PASS",
  selectedAction: mageAction,
  targetNode: selection.targetNode,
  baselineScore: selection.baselineCombatScore,
  predictedScore: selection.predictedCombatScore,
  actualScore: fight.rosterPredictionResolution.actualCombatScore,
  expectedLevel: fight.rosterPredictionResolution.expectedPerception.level,
  actualLevel: fight.rosterPredictionResolution.actualPerception.level,
  A: summaryTrace.expectationEmotion,
  source: summaryTrace.expectationSource,
  historyCount: session.rosterPredictionAState.history.length,
}, null, 2));

function seedKnownMage(targetSession) {
  const matrix = targetSession.entityImpressionState.strengthCognitionMatrix;
  matrix.entries = matrix.entries.filter((row) => row.subject.id !== "hero_mage");
  matrix.entries.push({
    subject: { id: "hero_mage", name: "Mage", role: "mage" },
    position: 8,
    stiffness: 4,
    evidenceCount: 3,
    firstObservedReportId: "integration-visible-mage-evidence",
    lastObservedReportId: "integration-visible-mage-evidence",
    lastObservedLevel: 8,
    scaleView: null,
  });
  IMPRESSIONS.STRENGTH_MATRIX.refreshStrengthScale(matrix);
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
