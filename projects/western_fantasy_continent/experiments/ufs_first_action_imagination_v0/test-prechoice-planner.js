"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const {
  compileFeedbackGteForLearner,
} = require("./player-feedback-gte");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const {
  feedbackApplicability,
  UfsFullGameFeedbackBridge,
} = require("./ufs-full-game-feedback-bridge");
const { UfsFullGameAttentionSession } = require("./ufs-full-game-attention-session");
const { itemValue } = require("./ufs-prediction-ticket");

const WIDTH = 3840;

function vectorFor(q) {
  const vector = Buffer.alloc(WIDTH * 4);
  const hash = crypto.createHash("sha256").update(JSON.stringify(q)).digest();
  const coordinate = hash.readUInt32LE(0) % WIDTH;
  vector.writeFloatLE(1, coordinate * 4);
  return vector;
}

function fakeGteCompiler(records) {
  const current = Buffer.concat(records.map((row) => vectorFor(row.currentQ)));
  const following = Buffer.concat(records.map((row) => vectorFor(row.followingQ)));
  return {
    schema: "ufs_player_feedback_gte_compile_batch_v1",
    encoder: "test-exact-query-gte",
    dtype: "float32-le",
    slotWeights: [1, 1, 1, 1, 1],
    coordinateWidth: WIDTH,
    recordIds: records.map((row) => row.trajectoryId),
    currentMatrixBase64: current.toString("base64"),
    followingMatrixBase64: following.toString("base64"),
  };
}

function beginFresh() {
  const session = new UfsFullGameAttentionSession({ publicMap });
  session.start({ initialPublicState, attentionSeed: 2026082504 });
  return session;
}

test("legacy redundant fields on scalar tracks preserve the audited value", () => {
  assert.equal(itemValue({ energy: 4 }, "track:energy", "energy"), 4);
  assert.equal(itemValue({ researchIndex: 2 }, "track:researchIndex", "researchIndex"), 2);
});

test("pre-choice planning tries every visible candidate without mutating the live session", () => {
  const session = beginFresh();
  const before = JSON.stringify(session.exportCheckpoint());
  const plan = session.planCurrentChoice();

  assert.equal(plan.status, "planned");
  assert.equal(plan.attemptedCount, 55);
  assert.equal(plan.legalCandidateCount, 72);
  assert.equal(plan.rejectedCandidateCount, 1);
  assert.equal(plan.ranking.length, 72);
  assert.equal(JSON.stringify(session.exportCheckpoint()), before);
  assert.deepEqual(plan.recommendedPayload.predictions[0].expectations, [{
    itemId: "track:energy",
    change: "unchanged",
  }]);
  assert.ok(plan.ranking.some((row) => (
    row.cognitiveUnit?.operationCount === 2
      && row.cognitiveUnit.objective.roomId === "A-upper-energy"
      && row.cognitiveUnit.completionReason === "room_investment_ready"
  )), "two placements into one multi-cell room should remain one cognitive unit");
});

function prepareResearchRoomChoice() {
  const state = structuredClone(initialPublicState);
  state.dice.find((die) => die.id === "r1-gray-0").value = 6;
  const session = new UfsFullGameAttentionSession({ publicMap });
  session.start({ initialPublicState: state, attentionSeed: 2026082504 });
  const operations = [
    { type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c2" },
    { type: "place_die", dieId: "r1-gray-1", cellId: "A-r2-c1" },
    { type: "place_die", dieId: "r1-gray-2", cellId: "A-r3-c3" },
    { type: "place_die", dieId: "r1-white-3", cellId: "A-r2-c4" },
    { type: "submit_random_observation", values: { "r1-white-4": 3 } },
    { type: "place_die", dieId: "r1-white-4", cellId: "A-r2-c5" },
  ];
  operations.forEach((operation) => {
    const response = session.advance(operation);
    assert.notEqual(response.status, "rejected", response.reason);
  });
  return session;
}

test("research payment and advance form one persistent two-operation cognitive unit", () => {
  const session = prepareResearchRoomChoice();
  const plan = session.planCurrentChoice();
  const branch = plan.ranking.find((row) => (
    row.payload.type === "resolve_room"
      && row.payload.roomId === "A-upper-research"
      && row.cognitiveUnit?.operations[1]?.advanceSteps === 2
  ));
  assert.ok(branch, "planner did not form the two-operation research branch");
  assert.equal(branch.cognitiveUnit.operationCount, 2);
  assert.equal(branch.imaginedState.energy, 0);
  assert.equal(branch.imaginedState.researchIndex, 2);
  assert.match(branch.queryQ.change_trend, /cognitive_unit/);

  const first = session.advance({
    ...branch.payload,
    cognitiveUnit: { ...branch.cognitiveUnit, nextOperationIndex: 0 },
    predictions: [{
      because: "研究房的支付与推进属于同一个因果认知单元",
      verifyBy: "两操作认知单元完成后",
      expectations: [
        { itemId: "track:energy", change: "equals", value: 0 },
        { itemId: "track:researchIndex", change: "equals", value: 2 },
      ],
    }],
  });
  assert.equal(first.status, "choice");
  assert.equal(first.pending.effectKind, "research_room_choice");
  assert.equal(first.cognitiveUnit.active.nextOperationIndex, 1);
  assert.equal(session.feedbackBridge.pendingCognitiveUnitTickets.length, 1);

  const continuation = session.planCurrentChoice();
  assert.equal(continuation.status, "planned_continuation");
  assert.deepEqual(continuation.recommendedPayload, {
    type: "choose_research_advance",
    roomId: "A-upper-research",
    advanceSteps: 2,
    cognitiveUnit: { ...branch.cognitiveUnit, nextOperationIndex: 1 },
  });
  const completed = session.advance(continuation.recommendedPayload);
  assert.equal(completed.observation.researchIndex, 2);
  assert.equal(completed.cognitiveUnit.active, null);
  assert.equal(completed.cognitiveUnit.lastTransition.status, "completed");
  assert.equal(session.feedbackBridge.pendingCognitiveUnitTickets.length, 0);
  const unitTicket = session.feedbackBridge.exportPredictionLedger().find((row) => (
    row.ticket.issuedForOperation === "cognitive_unit"
  ));
  assert.equal(unitTicket.status, "confirmed");
  assert.equal(unitTicket.ticket.evaluation.evaluations[1].afterValue, 2);
  const researchMemory = session.inspectFeedbackState().learning.memories.find((row) => (
    row.evidence.evidenceId === unitTicket.evidenceId
  ));
  assert.deepEqual(researchMemory.operations, branch.cognitiveUnit.operations);
  assert.equal(session.feedbackLearner.traceTransition(
    researchMemory.currentQ,
    researchMemory.followingQ,
    { operations: branch.cognitiveUnit.operations },
  ).memoryIds.includes(researchMemory.memoryId), true);
});

test("two room investments and their payoff stay one three-operation Q transition", () => {
  const state = structuredClone(initialPublicState);
  const existing = [
    ["r1-gray-2", "A-r1-c1", "A-aa-c1", 0],
    ["r1-white-3", "A-r1-c2", "A-aa-c2", 1],
    ["r1-white-4", "A-r1-c3", "A-aa-c3", 2],
  ];
  for (const [dieId] of existing) state.dice.find((die) => die.id === dieId).placed = true;
  state.placements = existing.map(([dieId, cellId, roomId, column]) => ({
    id: `${dieId}@${cellId}`,
    dieId,
    dieValue: state.dice.find((die) => die.id === dieId).value,
    cellId,
    roomId,
    column,
    excavationCandidate: false,
    resolved: false,
  }));
  const session = new UfsFullGameAttentionSession({ publicMap });
  session.start({ initialPublicState: state, attentionSeed: 2026082504 });
  const plan = session.planCurrentChoice();
  const branch = plan.ranking.find((row) => (
    row.cognitiveUnit?.operationCount === 3
      && row.cognitiveUnit.objective.roomId === "A-upper-energy"
      && row.cognitiveUnit.operations[0].dieId === "r1-gray-0"
      && row.cognitiveUnit.operations[1].dieId === "r1-gray-1"
  ));
  assert.ok(branch, "planner did not preserve both investments through the room payoff");
  assert.equal(branch.cognitiveUnit.completionReason, "room_effect_resolved");
  assert.equal(branch.imaginedState.energy, 4);

  let response = session.advance({
    ...branch.payload,
    cognitiveUnit: { ...branch.cognitiveUnit, nextOperationIndex: 0 },
    predictions: [{
      because: "两颗骰子的共同投入在房间结算后才产生能源",
      verifyBy: "三操作认知单元完成后",
      expectations: [{ itemId: "track:energy", change: "equals", value: 4 }],
    }],
  });
  assert.equal(response.cognitiveUnit.active.nextOperationIndex, 1);
  assert.equal(session.feedbackBridge.pendingCognitiveUnitTickets.length, 1);

  let continuation = session.planCurrentChoice();
  assert.equal(continuation.recommendedPayload.type, "place_die");
  response = session.advance(continuation.recommendedPayload);
  assert.equal(response.cognitiveUnit.active.nextOperationIndex, 2);

  continuation = session.planCurrentChoice();
  assert.equal(continuation.recommendedPayload.type, "resolve_room");
  response = session.advance(continuation.recommendedPayload);
  assert.equal(response.observation.energy, 4);
  assert.equal(response.cognitiveUnit.active, null);
  assert.equal(response.cognitiveUnit.lastTransition.status, "completed");
  assert.equal(session.feedbackBridge.pendingCognitiveUnitTickets.length, 0);
  const unitTicket = session.feedbackBridge.exportPredictionLedger().find((row) => (
    row.ticket.issuedForOperation === "cognitive_unit"
  ));
  assert.equal(unitTicket.status, "confirmed");
  assert.equal(unitTicket.ticket.evaluation.evaluations[0].afterValue, 4);
  const roomMemory = session.inspectFeedbackState().learning.memories.find((row) => (
    row.evidence.evidenceId === unitTicket.evidenceId
  ));
  assert.equal(roomMemory.operations.length, 3);
  assert.deepEqual(roomMemory.operations, branch.cognitiveUnit.operations);
});

test("compiled audited player feedback can change the choice before submission", () => {
  const fresh = beginFresh();
  const freshPlan = fresh.planCurrentChoice();
  const discouraged = freshPlan.ranking[0];
  const mentalBefore = fresh.inspectMentalState().observation;
  const evidenceId = "planning-feedback-evidence-0001";
  const applicability = {
    ...feedbackApplicability(discouraged.payload, { before: mentalBefore }),
    predictionSource: "deliberate_action_prediction",
  };
  const learner = new UfsFeedbackLearner({ now: () => "2026-08-29T17:00:00.000Z" });
  learner.learnObservedTransition({
    evidence: {
      evidenceId,
      playerVisible: true,
      transition: "committed",
      systemIntegrity: "passed",
    },
    currentQ: discouraged.queryQ,
    actualFollowingQ: {
      affected_object: "城市伤害",
      change_trend: "该候选实际令城市伤害升至7",
      cause_relation: "玩家可见的正式结算反馈",
      temporal_state: "候选执行并到达稳定边界后",
      context: "同一公开选择情境中的已审计个人经验",
    },
    source: { kind: "single_experience", ref: evidenceId },
    operations: discouraged.cognitiveUnit?.operations || [discouraged.payload],
    applicability,
  });
  const overlay = compileFeedbackGteForLearner({
    learner,
    compiler: fakeGteCompiler,
  });
  const bridge = new UfsFullGameFeedbackBridge({
    learner,
    predictionLedger: [{
      evidenceId,
      status: "contradicted",
      ticket: {
        evaluation: {
          evaluations: [{
            observed: true,
            expectation: { itemId: "track:damage", change: "equals", value: 7 },
            beforeValue: 0,
            afterValue: 7,
          }],
        },
      },
    }],
  });
  const learned = new UfsFullGameAttentionSession({
    publicMap,
    feedbackLearner: learner,
    feedbackBridge: bridge,
    feedbackGteOverlay: overlay,
    feedbackGteCompiler: fakeGteCompiler,
  });
  learned.start({ initialPublicState, attentionSeed: 2026082504 });
  const learnedPlan = learned.planCurrentChoice();
  const discouragedAfterLearning = learnedPlan.ranking.find((row) => (
    JSON.stringify(row.payload) === JSON.stringify(discouraged.payload)
  ));

  assert.notDeepEqual(learnedPlan.recommendedPayload, freshPlan.recommendedPayload);
  assert.equal(discouragedAfterLearning.recalledFeedback[0].trajectoryId, "feedback-trajectory-00001");
  assert.equal(discouragedAfterLearning.feedbackAdjustment.activation, 1);
  assert.equal(discouragedAfterLearning.feedbackAdjustment.learnedOutcomeScore, -154);
  assert.equal(discouragedAfterLearning.finalScore, -154);
  assert.deepEqual(learnedPlan.ranking[0].recalledFeedback, []);
});

test("the CLI plan command is read-only and returns a directly submit-able payload", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "ufs-prechoice-plan-cli-"));
  const cli = path.resolve(__dirname, "full-game-attention-player-cli.js");
  try {
    const started = spawnSync(process.execPath, [cli, "start", stateDir], {
      encoding: "utf8",
      env: { ...process.env, UFS_ATTENTION_SEED: "2026082504" },
    });
    assert.equal(started.status, 0, started.stderr);
    const checkpointFile = path.join(stateDir, "full-game-host-checkpoint.json");
    const transcriptFile = path.join(stateDir, "machine-transcript.jsonl");
    const checkpointBefore = fs.readFileSync(checkpointFile, "utf8");
    const transcriptBefore = fs.readFileSync(transcriptFile, "utf8");

    const planned = spawnSync(process.execPath, [cli, "plan", stateDir], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(planned.status, 0, planned.stderr);
    const plan = JSON.parse(planned.stdout);
    assert.equal(plan.status, "planned");
    assert.equal(plan.recommendedPayload.type, "place_die");
    assert.equal(plan.recommendedPayload.predictions.length, 1);
    assert.equal(fs.readFileSync(checkpointFile, "utf8"), checkpointBefore);
    assert.equal(fs.readFileSync(transcriptFile, "utf8"), transcriptBefore);
  } finally {
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test("a formal enum choice remains selectable when the cognitive fork cannot replay that boundary", () => {
  const playerResponse = {
    pending: { type: "spawn", shipId: "purple-0", candidates: ["DP-C3"] },
    observation: {},
    mapView: {},
    operationContracts: [{
      type: "choose_spawn",
      fields: {
        shipId: { kind: "fixed", value: "purple-0" },
        dropPointId: { kind: "enum", values: ["DP-C3"] },
      },
    }],
  };
  const { planPrechoice } = require("./ufs-prechoice-planner");
  const plan = planPrechoice({
    playerResponse,
    mentalBefore: {
      phase: "spawning", energy: 2, damage: 0, researchIndex: 0,
      excavatorIndex: 0, mothershipRow: 1, outcome: null,
    },
    simulate: () => ({
      status: "choice",
      reason: "cognitive_trial_operation_unavailable_at_formal_choice",
      simulationReliability: "unavailable_use_neutral_baseline",
      imaginedWorld: {
        phase: "spawning", energy: 2, damage: 0, researchIndex: 0,
        excavatorIndex: 0, mothershipRow: 1, outcome: null,
      },
    }),
  });
  assert.equal(plan.status, "planned");
  assert.deepEqual(plan.recommendedPayload, {
    type: "choose_spawn",
    shipId: "purple-0",
    dropPointId: "DP-C3",
    predictions: [{
      because: "候选试演：在spawning阶段比较type=choose_spawn|shipId=purple-0|dropPointId=DP-C3的下一稳定边界后果",
      expectations: [{ itemId: "track:energy", change: "unchanged" }],
    }],
  });
  assert.equal(plan.ranking[0].simulationReliability, "unavailable_use_neutral_baseline");
});
