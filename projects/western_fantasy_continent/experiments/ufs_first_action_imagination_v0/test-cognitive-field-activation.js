"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
const {
  PlayerFeedbackGteMemory,
  compileFeedbackGteForLearner,
  compileQueryVectorsWithGte,
} = require("./player-feedback-gte");
const {
  activateCognitiveField,
  activateCognitiveFieldVectors,
} = require("./ufs-cognitive-field-activation");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");

const WIDTH = 3840;

function vectorFor(q) {
  const vector = Buffer.alloc(WIDTH * 4);
  const coordinate = crypto.createHash("sha256")
    // Preserve one semantic feature so a raw Q-before cue can still match the
    // stored Q-before+operation activation row in this dependency-free test.
    .update(q.affected_object).digest().readUInt32LE(0) % WIDTH;
  vector.writeFloatLE(1, coordinate * 4);
  return vector;
}

function fakeCompiler(records) {
  const current = Buffer.concat(records.map((row) => vectorFor(row.currentQ)));
  const following = Buffer.concat(records.map((row) => vectorFor(row.followingQ)));
  return {
    schema: "ufs_player_feedback_gte_compile_batch_v1",
    encoder: "test-cognitive-field-exact",
    dtype: "float32-le",
    slotWeights: [1, 1, 1, 1, 1],
    coordinateWidth: WIDTH,
    recordIds: records.map((row) => row.trajectoryId),
    currentMatrixBase64: current.toString("base64"),
    followingMatrixBase64: following.toString("base64"),
  };
}

const beforeQ = {
  affected_object: "可结算的研究房与玩家能源",
  change_trend: "研究房等待支付，研究推进尚未选择",
  cause_relation: "玩家看见已经准备好的研究房",
  temporal_state: "两步研究开始前",
  context: "当前公开房间状态",
};
const afterQ = {
  affected_object: "研究标记与玩家能源",
  change_trend: "研究增加2格，能源从2降到0",
  cause_relation: "支付研究房后选择推进2格",
  temporal_state: "两步研究全部完成后",
  context: "研究进度增加的目标结果",
};
const operations = [
  { type: "resolve_room", roomId: "A-upper-research", pay: true },
  { type: "choose_research_advance", roomId: "A-upper-research", advanceSteps: 2 },
];

function preparedMemory() {
  const learner = new UfsFeedbackLearner({ now: () => "2026-08-30T02:00:00.000Z" });
  learner.learnObservedTransition({
    evidence: {
      evidenceId: "rulebook-two-step-research",
      playerVisible: true,
      transition: "knowledge_query",
      systemIntegrity: "passed",
    },
    currentQ: beforeQ,
    actualFollowingQ: afterQ,
    operations,
    source: { kind: "rule_query", ref: "research-room-two-step" },
    applicability: { operationType: "cognitive_unit", phaseBefore: "rooms" },
  });
  const overlay = compileFeedbackGteForLearner({ learner, compiler: fakeCompiler });
  const state = learner.exportState();
  return new PlayerFeedbackGteMemory({
    overlay,
    trajectories: state.trajectories,
    memories: state.memories,
    chains: state.chains,
  });
}

test("a before cue alone can recall the complete two-step research trajectory", () => {
  const memory = preparedMemory();
  const query = compileQueryVectorsWithGte([beforeQ], fakeCompiler);
  assert.equal(memory.queryVector(query.vectors[0].vector, { threshold: 0 }).length, 1);
  const result = activateCognitiveField({
    memory,
    queryCompiler: fakeCompiler,
    cues: [{
      cueId: "visible-research-room",
      kind: "attended_object",
      channel: "before",
      source: { statePaths: ["pending.roomId"] },
      q: beforeQ,
    }],
  });
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.candidates[0].trajectory.operations, operations);
  assert.deepEqual(result.candidates[0].matchedChannels, ["before"]);
});

test("need and visible-room cues converge on one trajectory without becoming utility", () => {
  const result = activateCognitiveField({
    memory: preparedMemory(),
    queryCompiler: fakeCompiler,
    cues: [
      {
        cueId: "visible-research-room",
        kind: "attended_object",
        channel: "before",
        q: beforeQ,
      },
      {
        cueId: "need-more-research",
        kind: "active_need",
        channel: "after",
        q: afterQ,
      },
    ],
  });
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.candidates[0].matchedChannels, ["after", "before"]);
  assert.deepEqual(result.candidates[0].matchedCueKinds, ["active_need", "attended_object"]);
  assert.equal(result.candidates[0].recallActivation, 2);
  assert.equal("utility" in result.candidates[0], false);
  assert.deepEqual(result.candidates[0].supportingMemoryIds, ["memory-00001"]);
});

test("a cue not present in either endpoint does not fabricate a plan", () => {
  const unrelatedQ = {
    affected_object: "母舰与城市伤害",
    change_trend: "母舰向城市下降",
    cause_relation: "回合结束触发母舰移动",
    temporal_state: "母舰阶段",
    context: "当前城市危险",
  };
  const result = activateCognitiveField({
    memory: preparedMemory(),
    queryCompiler: fakeCompiler,
    cues: [{
      cueId: "mothership-danger",
      kind: "danger",
      channel: "before",
      q: unrelatedQ,
    }],
  });
  assert.deepEqual(result.candidates, []);
});

test("precompiled cue vectors can be reused without changing convergence", () => {
  const memory = preparedMemory();
  const cues = [
    { cueId: "before", kind: "state", channel: "before", q: beforeQ },
    { cueId: "after", kind: "need", channel: "after", q: afterQ },
  ];
  const compiled = compileQueryVectorsWithGte(cues.map((cue) => cue.q), fakeCompiler);
  const reused = activateCognitiveFieldVectors({
    memory,
    cues,
    vectors: compiled.vectors.map((row) => row.vector),
  });
  const direct = activateCognitiveField({ memory, cues, queryCompiler: fakeCompiler });
  assert.deepEqual(reused, direct);
});
