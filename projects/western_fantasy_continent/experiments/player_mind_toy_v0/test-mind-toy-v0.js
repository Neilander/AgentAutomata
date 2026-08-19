"use strict";

const assert = require("node:assert/strict");
const {
  BUILD_RESPONSE_SCHEMA,
  ESTIMATE_RESPONSE_SCHEMA,
  MODEL_TYPES,
  applyBuildResponse,
  applyEstimateResponse,
  createSession,
  getPendingRequest,
} = require("./mind-toy-ai-loop");
const { attempt } = require("./mind-toy-runtime");
const TIMED_DEFENSE = require("./cases/timed-defense");

function assemble(input, buildResponse, estimateResponse) {
  let session = createSession(input);
  session = applyBuildResponse(session, buildResponse);
  session = applyEstimateResponse(session, estimateResponse);
  return session.mindToy;
}

function commonInput(id = "case") {
  return {
    observableContext: {
      id,
      visibleEvidence: [
        { id: "ev_a", text: "玩家可见证据A" },
        { id: "ev_b", text: "玩家可见证据B" },
        { id: "ev_c", text: "玩家可见证据C" },
      ],
    },
    goal: { id: "goal", statement: "选择主观上最合适的方案" },
    playerMemory: [],
    playerProfile: {},
  };
}

function estimate(requestId, expected, evidenceId = "ev_a", confidence = 1) {
  return {
    requestId,
    status: confidence === 1 ? "known" : "estimated",
    value: { kind: "scalar", expected, range: [expected, expected] },
    confidence,
    evidenceIds: [evidenceId],
    assumptions: [],
  };
}

function testAIRequestPhases() {
  let session = createSession(TIMED_DEFENSE.input);
  const buildRequest = getPendingRequest(session);
  assert.equal(buildRequest.type, "build_mind_structure");
  assert.deepEqual(buildRequest.allowedModels.map((row) => row.id), Object.values(MODEL_TYPES));
  assert.equal(buildRequest.observableContext.id, "timed_defense_visible_context_v0");

  session = applyBuildResponse(session, TIMED_DEFENSE.buildResponse);
  const estimateRequest = getPendingRequest(session);
  assert.equal(estimateRequest.type, "estimate_mind_structure");
  assert.equal(estimateRequest.estimationRequests.length, 5);
  assert(estimateRequest.allowedEvidenceIds.includes("mem_common_event"));

  session = applyEstimateResponse(session, TIMED_DEFENSE.estimateResponse);
  assert.equal(session.phase, "ready");
  assert.equal(getPendingRequest(session).type, "complete");
}

function testInvisibleEvidenceRejected() {
  let session = createSession(TIMED_DEFENSE.input);
  session = applyBuildResponse(session, TIMED_DEFENSE.buildResponse);
  const bad = structuredClone(TIMED_DEFENSE.estimateResponse);
  bad.estimates[0].evidenceIds = ["designer_hidden_truth"];
  assert.throws(() => applyEstimateResponse(session, bad), /invisible evidence/);
}

function testBrokenStructureRejected() {
  const bad = structuredClone(TIMED_DEFENSE.buildResponse);
  bad.structure.nodes.find((node) => node.id === "mine").valueEstimateId = "missing_estimate";
  assert.throws(() => applyBuildResponse(createSession(TIMED_DEFENSE.input), bad), /references missing estimate/);
}

function testSingleRanking() {
  const build = {
    schema: BUILD_RESPONSE_SCHEMA,
    selectedModel: MODEL_TYPES.SINGLE_RANKING,
    selectionReason: "每个选项都能压成一个固定价值。",
    rejectedHigherComplexity: "没有多维权衡、路径或状态变化。",
    structure: {
      model: MODEL_TYPES.SINGLE_RANKING,
      options: [
        { id: "small_reward", label: "领取普通补给", availability: "available", valueEstimateId: "v_small" },
        { id: "large_reward", label: "领取高级补给", availability: "available", valueEstimateId: "v_large" },
        { id: "locked", label: "未解锁奖励", availability: "known_locked", valueEstimateId: "v_locked" },
      ],
    },
    estimationRequests: ["v_small", "v_large", "v_locked"].map((id) => ({ id, outputShape: "scalar" })),
  };
  const estimates = {
    schema: ESTIMATE_RESPONSE_SCHEMA,
    estimates: [estimate("v_small", 3), estimate("v_large", 6), estimate("v_locked", 12)],
  };
  const result = attempt(assemble(commonInput("single"), build, estimates));
  assert.equal(result.selected.id, "large_reward");
  assert.equal(result.excluded[0].id, "locked");
  assert.equal(result.trace.meaningfulComparisons, 1);
}

function testAllRandomHasNoControllableComparison() {
  const build = {
    schema: BUILD_RESPONSE_SCHEMA,
    selectedModel: MODEL_TYPES.SINGLE_RANKING,
    selectionReason: "表面上只有同类随机选项。",
    rejectedHigherComplexity: "没有可利用的差异。",
    structure: {
      model: MODEL_TYPES.SINGLE_RANKING,
      options: ["random_a", "random_b", "random_c"].map((id) => ({ id, availability: "available", valueEstimateId: `v_${id}` })),
    },
    estimationRequests: ["v_random_a", "v_random_b", "v_random_c"].map((id) => ({ id, outputShape: "outcome_distribution" })),
  };
  const sameRandomValue = () => ({
    kind: "outcome_distribution",
    outcomes: [
      { label: "普通奖励", probability: 0.8, scalarValue: 2 },
      { label: "稀有奖励", probability: 0.2, scalarValue: 8 },
    ],
  });
  const estimates = {
    schema: ESTIMATE_RESPONSE_SCHEMA,
    estimates: ["v_random_a", "v_random_b", "v_random_c"].map((requestId) => ({
      requestId,
      status: "estimated",
      value: sameRandomValue(),
      confidence: 0.3,
      evidenceIds: ["ev_a"],
      assumptions: ["三个入口属于同一随机事件池"],
    })),
  };
  const result = attempt(assemble(commonInput("random"), build, estimates));
  assert.equal(result.trace.meaningfulComparisons, 0);
  assert.equal(result.ranking.length, 3);
}

function testMultiValueRanking() {
  const build = {
    schema: BUILD_RESPONSE_SCHEMA,
    selectedModel: MODEL_TYPES.MULTI_RANKING,
    selectionReason: "安全、成长和信息价值不能先压成共同真值。",
    rejectedHigherComplexity: "这是一次性选择，没有路径和连续状态。",
    structure: {
      model: MODEL_TYPES.MULTI_RANKING,
      dimensions: [
        { id: "safety", direction: "maximize", weight: 0.5 },
        { id: "growth", direction: "maximize", weight: 0.2 },
        { id: "information", direction: "maximize", weight: 0.3 },
      ],
      options: [
        { id: "fortify", availability: "available", valueEstimateIds: { safety: "fortify_s", growth: "fortify_g", information: "fortify_i" } },
        { id: "scout", availability: "available", valueEstimateIds: { safety: "scout_s", growth: "scout_g", information: "scout_i" } },
      ],
    },
    estimationRequests: ["fortify_s", "fortify_g", "fortify_i", "scout_s", "scout_g", "scout_i"].map((id) => ({ id, outputShape: "feature_scalar" })),
  };
  const estimates = {
    schema: ESTIMATE_RESPONSE_SCHEMA,
    estimates: [
      estimate("fortify_s", 8), estimate("fortify_g", 3), estimate("fortify_i", 0),
      estimate("scout_s", 3), estimate("scout_g", 2), estimate("scout_i", 9),
    ],
  };
  const result = attempt(assemble(commonInput("multi"), build, estimates));
  assert.equal(result.selected.id, "fortify");
  assert.equal(result.selected.score, 4.6);
  assert.equal(result.ranking[1].score, 4.6);
  assert.equal(result.trace.meaningfulComparisons, 0);
  assert.equal(result.selected.contributions.length, 3);
}

function testTimedDefenseMap() {
  const mindToy = assemble(TIMED_DEFENSE.input, TIMED_DEFENSE.buildResponse, TIMED_DEFENSE.estimateResponse);
  const result = attempt(mindToy, { maxPlans: 50, maxDepth: 4 });
  assert.equal(result.selected.id, "camp_to_watchtower->watchtower_to_supply");
  assert.equal(result.selected.day, 2);
  assert(result.selected.flags.includes("enemy_weakened"));
  assert(result.ranking.some((plan) => plan.id === "camp_to_mine->mine_to_forge"));
  assert(!result.ranking.some((plan) => plan.endNodeId === "ancient_ruins"));
  assert(result.trace.branchExpansions >= 4);
}

function testStateTransitionModel() {
  const build = {
    schema: BUILD_RESPONSE_SCHEMA,
    selectedModel: MODEL_TYPES.STATE_TRANSITION,
    selectionReason: "第一次行动会改变第二次可用行动，需要比较多步状态。",
    rejectedHigherComplexity: "",
    structure: {
      model: MODEL_TYPES.STATE_TRANSITION,
      initialStateId: "unprepared",
      horizon: 2,
      states: [
        { id: "unprepared", valueEstimateId: "value_unprepared" },
        { id: "armed", valueEstimateId: "value_armed" },
        { id: "scouted", valueEstimateId: "value_scouted" },
        { id: "strong", valueEstimateId: "value_strong", terminal: true },
        { id: "enemy_weakened", valueEstimateId: "value_weakened", terminal: true },
      ],
      actions: [
        { id: "train", fromStateId: "unprepared", transitionEstimateId: "transition_train" },
        { id: "scout", fromStateId: "unprepared", transitionEstimateId: "transition_scout" },
        { id: "train_again", fromStateId: "armed", transitionEstimateId: "transition_train_again" },
        { id: "sabotage", fromStateId: "scouted", transitionEstimateId: "transition_sabotage" },
      ],
    },
    estimationRequests: [
      ...["unprepared", "armed", "scouted", "strong", "weakened"].map((id) => ({ id: `value_${id}`, outputShape: "scalar" })),
      ...["train", "scout", "train_again", "sabotage"].map((id) => ({ id: `transition_${id}`, outputShape: "state_distribution" })),
    ],
  };
  const stateDistribution = (requestId, outcomes, confidence = 1) => ({
    requestId,
    status: confidence === 1 ? "known" : "estimated",
    value: { kind: "state_distribution", outcomes },
    confidence,
    evidenceIds: ["ev_b"],
    assumptions: [],
  });
  const estimates = {
    schema: ESTIMATE_RESPONSE_SCHEMA,
    estimates: [
      estimate("value_unprepared", 0), estimate("value_armed", 4), estimate("value_scouted", 1),
      estimate("value_strong", 7), estimate("value_weakened", 10),
      stateDistribution("transition_train", [{ stateId: "armed", probability: 1 }]),
      stateDistribution("transition_scout", [{ stateId: "scouted", probability: 1 }]),
      stateDistribution("transition_train_again", [{ stateId: "strong", probability: 1 }]),
      stateDistribution("transition_sabotage", [
        { stateId: "enemy_weakened", probability: 0.8 },
        { stateId: "scouted", probability: 0.2 },
      ], 0.65),
    ],
  };
  const result = attempt(assemble(commonInput("state"), build, estimates));
  assert.equal(result.selected.actionId, "scout");
  assert.equal(result.selected.score, 8.2);
  assert.equal(result.transitionMatrices.sabotage.probabilities.enemy_weakened, 0.8);
  assert(result.trace.branchExpansions > result.ranking.length);
}

const TESTS = [
  testAIRequestPhases,
  testInvisibleEvidenceRejected,
  testBrokenStructureRejected,
  testSingleRanking,
  testAllRandomHasNoControllableComparison,
  testMultiValueRanking,
  testTimedDefenseMap,
  testStateTransitionModel,
];

for (const test of TESTS) {
  test();
  console.log(`PASS ${test.name}`);
}

console.log(`\n${TESTS.length} mind toy tests passed.`);
