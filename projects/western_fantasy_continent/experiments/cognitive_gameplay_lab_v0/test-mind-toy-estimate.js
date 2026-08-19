"use strict";

const assert = require("node:assert/strict");
const { MODEL_TYPES } = require("../player_mind_toy_v0/mind-toy-ai-loop");
const { buildActiveCognition } = require("./active-cognition");
const { createPlayerView } = require("./game-boundary");
const {
  applyMindToyBuildResponse,
  applyResolvedEstimates,
  createMindToyBuildSession,
  getMindToyBuildRequest,
} = require("./mind-toy-builder");
const { resolveEstimates } = require("./estimate-resolver");

test("AI build request contains only ActiveCognition evidence", () => {
  const active = activeFixture();
  const session = createMindToyBuildSession({ activeCognition: active, adequacyContract: adequacyContract() });
  const request = getMindToyBuildRequest(session);
  assert.equal(request.type, "build_mind_structure");
  assert.deepEqual(new Set(request.allowedEvidenceIds), new Set(active.evidenceIds));
  assert.equal(JSON.stringify(request).includes("inactive_memory"), false);
});

test("AI MindToy build must cite active evidence and cover a legal action", () => {
  const session = createMindToyBuildSession({ activeCognition: activeFixture(), adequacyContract: adequacyContract() });
  const built = applyMindToyBuildResponse(session, validBuildResponse());
  assert.equal(built.baseSession.phase, "estimate");
  assert.equal(built.adequacyAudit.pass, true);
  assert.ok(built.adequacyAudit.referencedActions.includes("probe:rune_4"));
  assert.throws(
    () => applyMindToyBuildResponse(session, { ...validBuildResponse(), evidenceIds: ["inactive_memory"] }),
    /inactive evidence/,
  );
});

test("structurally valid but task-inadequate MindToy is rejected", () => {
  const session = createMindToyBuildSession({ activeCognition: activeFixture(), adequacyContract: adequacyContract() });
  const response = validBuildResponse();
  response.structure.actions[0].id = "think_about_nothing";
  assert.throws(() => applyMindToyBuildResponse(session, response), /structurally inadequate/);
});

test("Estimate resolves visible fact, retrieved memory, calculator, and unknown separately", () => {
  const active = activeFixture();
  const requests = [
    request("candidate_min", { factKey: "candidateMin" }),
    request("prior_hint", { factKey: "preferredProbe" }),
    request("candidate_count", { resolverId: "candidate_count" }),
    request("hidden_answer", { factKey: "secretRune" }),
  ];
  const resolved = resolveEstimates({
    requests,
    activeCognition: active,
    calculators: {
      candidate_count: ({ activeCognition }) => ({
        status: "known",
        value: { kind: "scalar", expected: 8, range: [8, 8] },
        confidence: 1,
        evidenceIds: [activeCognition.observations[0].id],
      }),
    },
  });
  const byId = Object.fromEntries(resolved.estimateResponse.estimates.map((row) => [row.requestId, row]));
  assert.equal(byId.candidate_min.sourceKind, "visible_fact");
  assert.equal(byId.prior_hint.sourceKind, "retrieved_memory_fact");
  assert.equal(byId.candidate_count.sourceKind, "calculator:candidate_count");
  assert.equal(byId.hidden_answer.status, "unknown");
});

test("conflicting retrieved estimates stay a range instead of becoming false certainty", () => {
  const active = activeFixture();
  active.retrievedMemories.push({
    id: "active-memory:second_hint",
    kind: "retrieved_memory",
    concepts: ["符文探测"],
    content: { facts: { preferredProbe: 6 } },
    confidence: 0.6,
  });
  const resolved = resolveEstimates({ requests: [request("prior_hint", { factKey: "preferredProbe" })], activeCognition: active });
  const estimate = resolved.estimateResponse.estimates[0];
  assert.equal(estimate.status, "estimated");
  assert.deepEqual(estimate.value.range, [4, 6]);
  assert.ok(estimate.confidence < 0.6);
});

test("resolved estimates assemble through the existing MindToy validator", () => {
  const active = activeFixture();
  let session = createMindToyBuildSession({ activeCognition: active, adequacyContract: adequacyContract() });
  session = applyMindToyBuildResponse(session, validBuildResponse());
  const resolved = resolveEstimates({
    requests: session.baseSession.buildResponse.estimationRequests,
    activeCognition: active,
    calculators: {
      probe_partition: () => ({
        status: "estimated",
        value: {
          kind: "state_distribution",
          outcomes: [
            { stateId: "lower_than_4", probability: 0.375 },
            { stateId: "rune_4", probability: 0.125 },
            { stateId: "higher_than_4", probability: 0.5 },
          ],
        },
        confidence: 0.9,
        evidenceIds: [active.observations[0].id, active.knownRules[0].id],
      }),
      state_value: ({ request }) => ({
        status: "estimated",
        value: stateValue(request.targetId),
        confidence: 0.7,
        evidenceIds: [active.observations[0].id, active.knownRules[0].id],
        assumptions: ["候选越少越接近找出目标符文"],
      }),
    },
  });
  session = applyResolvedEstimates(session, resolved.estimateResponse);
  assert.equal(session.baseSession.phase, "ready");
  assert.equal(session.baseSession.mindToy.model, MODEL_TYPES.STATE_TRANSITION);
});

function activeFixture() {
  const view = createPlayerView({
    gameId: "rune_guess",
    turn: 0,
    status: "playing",
    scene: {
      id: "rune_console",
      label: "符文探测台",
      concepts: ["符文探测", "有序频率"],
      environment: ["符文实验"],
      currentProblem: "从1到8中找出目标符文",
    },
    visibleSignals: [],
    allowedActions: ["probe:rune_1", "probe:rune_2", "probe:rune_3", "probe:rune_4", "probe:rune_5", "probe:rune_6", "probe:rune_7", "probe:rune_8"],
    actionHistory: [],
  });
  return buildActiveCognition({
    playerView: view,
    goal: { id: "identify_rune", label: "找出目标符文", concepts: ["符文探测"] },
    attentionResult: {
      budget: 1,
      spent: 1,
      remaining: 0,
      received: [{
        id: "attention:signal:candidate_range/gist",
        sourceSignalId: "signal:candidate_range",
        layerId: "gist",
        concepts: ["候选范围"],
        text: "当前候选是符文1到8",
        content: { facts: { candidateMin: 1, candidateMax: 8 } },
        priority: 0.8,
        goalFit: 1,
      }],
    },
    retrievalResult: {
      selected: [{
        id: "memory:mid_probe",
        concepts: ["符文探测"],
        environment: ["符文实验"],
        behavior: "优先探测中间附近",
        result: "通常能缩小较多候选",
        content: { facts: { preferredProbe: 4 } },
        confidence: 0.7,
        score: 8,
        reasons: ["concept_match"],
      }],
      attentionSpent: 0.25,
      attentionRemaining: 0.75,
    },
    attentionCapacity: 2,
    knownRules: [{
      id: "rule:ordered_feedback",
      activated: true,
      text: "每次探测会返回目标频率更高、更低或一致",
      concepts: ["有序反馈"],
      confidence: 1,
      facts: { feedbackKinds: ["lower", "equal", "higher"] },
    }],
  });
}

function adequacyContract() {
  return {
    minimumReferencedActions: 1,
    requiredStructureTokens: ["current_candidates"],
    allowedModels: [MODEL_TYPES.STATE_TRANSITION],
    publicHints: { mustRepresent: ["current candidate state", "one legal probe"] },
  };
}

function validBuildResponse() {
  return {
    schema: "mind_structure_build_response_v0",
    selectedModel: MODEL_TYPES.STATE_TRANSITION,
    selectionReason: "探测会改变下一轮候选状态",
    rejectedHigherComplexity: "已经是需要的状态结构",
    evidenceIds: ["attention:signal:candidate_range/gist", "rule:ordered_feedback"],
    structure: {
      model: MODEL_TYPES.STATE_TRANSITION,
      initialStateId: "current_candidates",
      horizon: 1,
      states: [
        { id: "current_candidates", valueEstimateId: "estimate:value:current_candidates" },
        { id: "lower_than_4", terminal: true, valueEstimateId: "estimate:value:lower_than_4" },
        { id: "rune_4", terminal: true, valueEstimateId: "estimate:value:rune_4" },
        { id: "higher_than_4", terminal: true, valueEstimateId: "estimate:value:higher_than_4" },
      ],
      actions: [{
        id: "probe:rune_4",
        fromStateId: "current_candidates",
        transitionEstimateId: "estimate:probe_4_partition",
      }],
    },
    estimationRequests: [{
      id: "estimate:probe_4_partition",
      targetKind: "transition",
      targetId: "probe:rune_4",
      field: "outcomes",
      outputShape: "state_distribution",
      knowledgeRule: "derive_only_from_cited_knowledge",
      reason: "不同反馈会改变下一轮候选范围",
      resolution: { resolverId: "probe_partition" },
    }, ...["current_candidates", "lower_than_4", "rune_4", "higher_than_4"].map((stateId) => ({
      id: `estimate:value:${stateId}`,
      targetKind: "state_value",
      targetId: stateId,
      field: "subjectiveValue",
      outputShape: "scalar",
      knowledgeRule: "derive_only_from_cited_knowledge",
      reason: "用于比较探测前后离目标还有多远",
      resolution: { resolverId: "state_value" },
    }))],
  };
}

function stateValue(stateId) {
  const values = {
    current_candidates: -8,
    lower_than_4: -3,
    rune_4: 10,
    higher_than_4: -4,
  };
  const expected = values[stateId];
  return { kind: "scalar", expected, range: [expected, expected] };
}

function request(id, resolution) {
  return { id, targetKind: "other", targetId: id, field: "value", outputShape: "scalar", resolution };
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

console.log("MindToy/Estimate tests passed: 6");
