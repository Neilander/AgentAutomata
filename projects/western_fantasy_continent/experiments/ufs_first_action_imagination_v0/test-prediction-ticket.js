"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const { UfsFullGameAttentionSession } = require("./ufs-full-game-attention-session");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const { UfsFullGameFeedbackBridge } = require("./ufs-full-game-feedback-bridge");
const {
  evaluatePredictionTicket,
  splitOperationAndPredictionDeclarations,
} = require("./ufs-prediction-ticket");

function begin() {
  const session = new UfsFullGameAttentionSession({
    publicMap,
    choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
  });
  session.start({ initialPublicState, attentionSeed: 2026082820 });
  return session;
}

test("prediction declarations are metadata and are removed from the formal operation", () => {
  const prepared = splitOperationAndPredictionDeclarations({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [{
      because: "放入骰子",
      expectations: [{ itemId: "die:r1-gray-0", field: "placed", change: "equals", value: true }],
    }],
  });
  assert.equal(Object.hasOwn(prepared.operation, "predictions"), false);
  assert.equal(prepared.declarations.length, 1);
});

test("prediction evaluation distinguishes confirmation, contradiction, and missing attention", () => {
  const ticket = {
    expectations: [{ itemId: "track:energy", change: "increase" }],
  };
  const formalBefore = { energy: 2 };
  const formalAfter = { energy: 3 };
  assert.equal(evaluatePredictionTicket(ticket, {
    formalBefore,
    formalAfter,
    noticedItemIds: ["track:energy"],
  }).status, "confirmed");
  assert.equal(evaluatePredictionTicket(ticket, {
    formalBefore,
    formalAfter: { energy: 2 },
    noticedItemIds: ["track:energy"],
  }).status, "contradicted");
  assert.equal(evaluatePredictionTicket(ticket, {
    formalBefore,
    formalAfter,
    noticedItemIds: [],
  }).status, "unresolved");
});

test("a delayed ticket compares against the belief captured when it was issued", () => {
  const ticket = {
    expectations: [{ itemId: "track:energy", change: "increase", baselineValue: 5 }],
  };
  const result = evaluatePredictionTicket(ticket, {
    formalBefore: { energy: 0 },
    formalAfter: { energy: 3 },
    noticedItemIds: ["track:energy"],
  });
  assert.equal(result.status, "contradicted");
  assert.equal(result.evaluations[0].beforeValue, 5);
});

test("an unobserved prediction is preserved as unresolved across checkpoint restore", () => {
  const learner = new UfsFeedbackLearner();
  let bridge = new UfsFullGameFeedbackBridge({ learner });
  const before = {
    round: 1,
    phase: "dice",
    energy: 2,
    damage: 0,
    researchIndex: 0,
    excavatorIndex: 0,
    mothershipRow: -1,
    dice: [], ships: [], waitingShips: [], placements: [], robots: [],
  };
  const result = bridge.process({
    operation: { type: "place_die" },
    traceDelta: {},
    formalStep: {
      accepted: true,
      stable: true,
      before,
      after: { ...before, energy: 3 },
    },
    playerResponse: { noticedItems: [] },
    mentalBefore: before,
    predictedWorld: before,
    predictionDeclarations: [{
      because: "预测能源增加",
      expectations: [{ itemId: "track:energy", change: "increase" }],
    }],
  });
  assert.equal(result.status, "not_learned");
  assert.equal(bridge.exportPredictionLedger()[0].status, "unresolved");
  const checkpoint = bridge.exportCheckpoint();
  bridge = new UfsFullGameFeedbackBridge({
    learner,
    ...checkpoint,
  });
  assert.equal(bridge.exportPredictionLedger()[0].status, "unresolved");
});

test("a deliberate wrong prediction creates a correction only after visible formal feedback", () => {
  const session = begin();
  session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [{
      because: "猜测普通放置会立刻增加能源",
      expectations: [{ itemId: "track:energy", change: "increase" }],
    }],
  });
  const feedback = session.inspectFeedbackState();
  const deliberate = feedback.lastAudit.tickets.find((row) => (
    row.source === "deliberate_action_prediction"
  ));
  assert.equal(deliberate.evaluation.status, "contradicted");
  assert.equal(feedback.lastAudit.status, "learned_correction");
  const learned = feedback.learning.trajectories.find((row) => (
    row.applicability?.predictionSource === "deliberate_action_prediction"
  ));
  assert.ok(learned);
  assert.match(learned.followingQ.change_trend, /track:energy实际为2/);
});

test("overlapping wrong prediction tickets remain ambiguous instead of double-learning", () => {
  const session = begin();
  session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [
      {
        because: "猜测一",
        expectations: [{ itemId: "track:energy", change: "increase" }],
      },
      {
        because: "猜测二",
        expectations: [{ itemId: "track:energy", change: "decrease" }],
      },
    ],
  });
  const feedback = session.inspectFeedbackState();
  const deliberate = feedback.lastAudit.tickets.filter((row) => (
    row.source === "deliberate_action_prediction"
  ));
  assert.deepEqual(deliberate.map((row) => row.learningDisposition), ["ambiguous", "ambiguous"]);
  assert.equal(feedback.learning.trajectories.some((row) => (
    row.applicability?.predictionSource === "deliberate_action_prediction"
  )), false);
});

test("a prediction ticket survives a random boundary and checkpoint restore", () => {
  let session = begin();
  const response = session.advance({
    type: "place_die",
    dieId: "r1-white-4",
    cellId: "A-r1-c1",
    predictions: [{
      because: "白骰放下后其余骰子会重投",
      expectations: [{ itemId: "die:r1-gray-0", field: "value", change: "equals", value: 6 }],
    }],
  });
  assert.equal(response.status, "random");
  assert.equal(session.inspectFeedbackState().lastAudit.status, "deferred");
  session = UfsFullGameAttentionSession.restore(session.exportCheckpoint());
  session.advance({
    type: "submit_random_observation",
    values: {
      "r1-gray-0": 6,
      "r1-gray-1": 5,
      "r1-gray-2": 4,
      "r1-white-3": 3,
    },
  });
  const deliberate = session.inspectFeedbackState().lastAudit.tickets.find((row) => (
    row.source === "deliberate_action_prediction"
  ));
  assert.equal(deliberate.evaluation.status, "confirmed");
});

test("more than three prediction tickets is atomically rejected", () => {
  const session = begin();
  const before = session.inspectHostState().observation;
  const prediction = {
    expectations: [{ itemId: "track:energy", change: "unchanged" }],
  };
  const response = session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [prediction, prediction, prediction, prediction],
  });
  assert.equal(response.status, "rejected");
  assert.match(response.reason, /at most 3 tickets/);
  assert.deepEqual(session.inspectHostState().observation, before);
});
