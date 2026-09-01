"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const { UfsFullGameAttentionSession } = require("./ufs-full-game-attention-session");
const { UfsFullGameFeedbackBridge } = require("./ufs-full-game-feedback-bridge");

const currentQ = {
  affected_object: "研究房与研究轨道",
  change_trend: "研究效果等待结算",
  cause_relation: "玩家选择研究房",
  temporal_state: "结算前",
  context: "脑内规则设想",
};

const predictedQ = {
  affected_object: "研究轨道",
  change_trend: "研究推进一格",
  cause_relation: "研究房结算",
  temporal_state: "结算后",
  context: "脑内预测",
};

function begin(state = initialPublicState) {
  const session = new UfsFullGameAttentionSession({ publicMap });
  session.start({ initialPublicState: state, attentionSeed: 2026082814 });
  return session;
}

test("a matching formal step reinforces live rule connections and survives checkpoint restore", () => {
  const session = begin();
  session.advance({ type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c2" });
  const feedback = session.inspectFeedbackState();
  assert.equal(feedback.lastAudit.status, "learned_confirmations");
  assert.equal(feedback.lastAudit.formalStep.cognitiveMatch, true);
  const movement = feedback.learning.connectionUpdates.find((row) => (
    row.trajectoryId === "read-rule-place-die-to-same-column-descent"
  ));
  assert.equal(movement.addedObservations, 1);
  assert.equal(feedback.learning.trajectories.length, 0);

  const restored = UfsFullGameAttentionSession.restore(session.exportCheckpoint());
  const restoredMovement = restored.inspectFeedbackState().learning.connectionUpdates.find((row) => (
    row.trajectoryId === "read-rule-place-die-to-same-column-descent"
  ));
  assert.equal(restoredMovement.addedObservations, 1);
});

test("mothership landing collection now matches the formal transition", () => {
  const session = begin();
  session.advance({ type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c1" });
  const feedback = session.inspectFeedbackState();
  assert.equal(feedback.lastAudit.status, "learned_confirmations");
  assert.deepEqual(feedback.lastAudit.ticketCounts, {
    confirmed: 1,
    contradicted: 0,
    unresolved: 2,
  });
  assert.equal(feedback.lastAudit.formalStep.cognitiveMatch, true);
  assert.deepEqual(feedback.lastAudit.formalStep.differingSections, []);
  assert.deepEqual(
    feedback.formalState.waitingShips.map((row) => row.id),
    ["purple-1", "purple-2", "purple-3", "purple-4"],
  );
  assert.equal(feedback.learning.trajectories.length, 0);
  assert.deepEqual(feedback.learning.connectionUpdates.map((row) => row.trajectoryId), [
    "read-rule-mothership-space-to-mothership-descent",
  ]);
});

test("mothership landing collection is present in both cognitive and authoritative state", () => {
  const session = begin();
  const response = session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c1",
  });
  const host = session.inspectHostState().observation;
  const mental = session.inspectMentalState().observation;

  assert.deepEqual(host, session.inspectFeedbackState().formalState);
  assert.deepEqual(host.waitingShips.map((row) => row.id), [
    "purple-1", "purple-2", "purple-3", "purple-4",
  ]);
  assert.deepEqual(mental.waitingShips, host.waitingShips);
  assert.deepEqual(mental.ships, host.ships);
  assert.equal(response.status, "choice");
  assert.deepEqual(response.availableOperations, ["place_die"]);
});

test("the player-facing environment is projected from formal state, not imagined state", () => {
  const session = new UfsFullGameAttentionSession({
    publicMap,
    choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
  });
  session.start({ initialPublicState, attentionSeed: 2026082814 });
  const response = session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c1",
  });
  const host = session.inspectHostState().observation;

  assert.deepEqual(response.observation.ships, host.ships);
  assert.deepEqual(response.observation.waitingShips, host.waitingShips);
  assert.deepEqual(session.inspectMentalState().observation.ships, host.ships);
  assert.deepEqual(session.inspectMentalState().observation.waitingShips, host.waitingShips);
});

test("a formal rejection is atomic and rolls back the parallel cognitive trial", () => {
  const session = begin();
  const beforeHost = session.inspectHostState().observation;
  const beforeMental = session.inspectMentalState().observation;
  const beforeActions = session.actionHistory.length;
  const response = session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "not-a-real-cell",
  });

  assert.equal(response.status, "rejected");
  assert.match(response.reason, /^formal_rejected:/);
  assert.deepEqual(session.inspectHostState().observation, beforeHost);
  assert.deepEqual(session.inspectMentalState().observation, beforeMental);
  assert.equal(session.actionHistory.length, beforeActions);
});

test("the cognitive predictor cannot veto an operation accepted by the formal game", () => {
  const session = begin();
  session.roundSession.lastPlayerResponse.availableOperations = [];
  const response = session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
  });

  assert.equal(response.status, "choice");
  assert.equal(
    session.inspectHostState().observation.dice.find((die) => die.id === "r1-gray-0").placed,
    true,
  );
  assert.equal(session.inspectFeedbackState().lastAudit.status, "no_prediction");
});

test("a real zero-yield research result is learned only when it was explicitly predicted", () => {
  const state = structuredClone(initialPublicState);
  state.energy = 4;
  state.researchIndex = 4;
  const session = begin(state);
  const actions = [
    { type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c2" },
    { type: "place_die", dieId: "r1-gray-1", cellId: "A-r2-c1" },
    { type: "place_die", dieId: "r1-gray-2", cellId: "A-r3-c3" },
    { type: "place_die", dieId: "r1-white-3", cellId: "A-r2-c4" },
    { type: "submit_random_observation", values: { "r1-white-4": 3 } },
    { type: "place_die", dieId: "r1-white-4", cellId: "A-r2-c5" },
    {
      type: "resolve_room",
      roomId: "A-upper-research",
      pay: true,
      predictions: [{
        because: "研究预算不足以支付下一格需求",
        expectations: [
          { itemId: "track:energy", change: "decrease" },
          { itemId: "track:researchIndex", change: "unchanged" },
        ],
      }],
    },
    { type: "choose_research_advance", roomId: "A-upper-research", advanceSteps: 0 },
  ];
  actions.forEach((action) => session.advance(action));
  const learned = session.inspectFeedbackState().learning.trajectories;
  const concrete = learned.find((row) => row.applicability?.roomId === "A-upper-research");
  assert.ok(concrete);
  assert.equal(concrete.applicability.predictionSource, "deliberate_action_prediction");
  assert.match(concrete.followingQ.change_trend, /track:energy减少/);
  assert.match(concrete.followingQ.change_trend, /track:researchIndex保持不变/);
  assert.equal(Object.hasOwn(concrete, "candidateValue"), false);
});

test("the same zero-yield result without a prediction does not create learning", () => {
  const state = structuredClone(initialPublicState);
  state.energy = 4;
  state.researchIndex = 4;
  const session = begin(state);
  const actions = [
    { type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c2" },
    { type: "place_die", dieId: "r1-gray-1", cellId: "A-r2-c1" },
    { type: "place_die", dieId: "r1-gray-2", cellId: "A-r3-c3" },
    { type: "place_die", dieId: "r1-white-3", cellId: "A-r2-c4" },
    { type: "submit_random_observation", values: { "r1-white-4": 3 } },
    { type: "place_die", dieId: "r1-white-4", cellId: "A-r2-c5" },
    { type: "resolve_room", roomId: "A-upper-research", pay: true },
    { type: "choose_research_advance", roomId: "A-upper-research", advanceSteps: 0 },
  ];
  actions.forEach((action) => session.advance(action));
  assert.equal(
    session.inspectFeedbackState().learning.trajectories.some((row) => (
      row.applicability?.operationType === "choose_research_advance"
    )),
    false,
  );
});

test("a single attributable mismatch creates a specific trajectory and scoped attention repair", () => {
  const learner = new UfsFeedbackLearner();
  const bridge = new UfsFullGameFeedbackBridge({ learner });
  const traceDelta = {
    roomSteps: [{
      action: { type: "resolve_room", roomId: "R" },
      stage: "effect",
      cognitiveTrace: {
        q: currentQ,
        candidates: [{ trajectoryId: "old-research", activation: 0.95 }],
        grounding: {
          trajectoryId: "old-research",
          awakenedFollowingQ: predictedQ,
          patch: { kind: "research_room_choice", budget: 2, continuousCosts: [4] },
        },
        perception: { omittedItemIds: ["track:researchIndex"] },
      },
    }],
    placements: [], randomBoundaries: [], mothershipSteps: [],
  };
  const result = bridge.process({
    operation: { type: "resolve_room", roomId: "R" },
    traceDelta,
    formalStep: {
      accepted: true,
      stable: true,
      cognitiveMatch: false,
      before: { phase: "rooms", energy: 3, researchIndex: 2, excavatorIndex: 0, mothershipRow: 0 },
      after: { phase: "rooms", energy: 2, researchIndex: 2, excavatorIndex: 0, mothershipRow: 0 },
      changedSections: ["energy"],
      differingSections: ["researchIndex"],
    },
    playerResponse: {
      noticedItems: [{ itemId: "track:energy" }],
    },
  });
  assert.equal(result.status, "learned_correction");
  const state = learner.exportState();
  assert.equal(state.trajectories.length, 1);
  assert.deepEqual(state.trajectories[0].correctsTrajectoryIds, ["old-research"]);
  assert.equal(state.attentionAdjustments.length, 1);
  assert.deepEqual(state.attentionAdjustments[0].selector, { itemIds: ["track:researchIndex"] });
  assert.deepEqual(state.attentionAdjustments[0].scope, { action: "resolve_room", phase: "rooms" });
});
