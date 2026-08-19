"use strict";

const MODEL_TYPES = Object.freeze({
  SINGLE_RANKING: "single_ranking",
  MULTI_RANKING: "multi_ranking",
  MAP: "map",
  STATE_TRANSITION: "state_transition",
});

const MODEL_TYPE_VALUES = Object.freeze(Object.values(MODEL_TYPES));
const BUILD_RESPONSE_SCHEMA = "mind_structure_build_response_v0";
const ESTIMATE_RESPONSE_SCHEMA = "mind_estimate_response_v0";

function createSession(input = {}) {
  if (!input.observableContext || typeof input.observableContext !== "object") {
    throw new Error("observableContext is required");
  }
  if (!input.goal || typeof input.goal !== "object") throw new Error("goal is required");

  return {
    schema: "player_mind_toy_session_v0",
    phase: "build",
    observableContext: clone(input.observableContext),
    goal: clone(input.goal),
    playerMemory: clone(input.playerMemory || []),
    playerProfile: clone(input.playerProfile || {}),
    knowledgePolicy: clone(input.knowledgePolicy || { mode: "open_but_player_visible" }),
    buildResponse: null,
    estimateResponse: null,
    mindToy: null,
  };
}

function getPendingRequest(sessionInput) {
  const session = validateSession(sessionInput);
  if (session.phase === "build") return buildStructureRequest(session);
  if (session.phase === "estimate") return buildEstimateRequest(session);
  return { type: "complete", schema: "mind_toy_complete_v0", mindToy: clone(session.mindToy) };
}

function applyBuildResponse(sessionInput, responseInput) {
  const session = validateSession(sessionInput);
  if (session.phase !== "build") throw new Error(`cannot apply build response in phase ${session.phase}`);
  const response = validateBuildResponse(responseInput);
  session.buildResponse = response;
  session.phase = "estimate";
  return session;
}

function applyEstimateResponse(sessionInput, responseInput) {
  const session = validateSession(sessionInput);
  if (session.phase !== "estimate") throw new Error(`cannot apply estimate response in phase ${session.phase}`);
  const response = validateEstimateResponse(session, responseInput);
  session.estimateResponse = response;
  session.mindToy = assembleMindToy(session, response);
  session.phase = "ready";
  return session;
}

function buildStructureRequest(session) {
  return {
    type: "build_mind_structure",
    schema: "mind_structure_build_request_v0",
    instruction: [
      "你正在构造玩家此刻主观使用的最小思维结构，不是在复原游戏真相。",
      "只能使用 observableContext、playerMemory 和 playerProfile 中的信息。",
      "从四种模型里选择能覆盖当前问题的最低复杂度模型；不要为了显得聪明而升级模型。",
      "single_ranking：选项能压成一个互相可比的固定主观价值，且不需要规划顺序。",
      "multi_ranking：单步选项有多个不可直接合并的价值维度，需要按玩家偏好加权。",
      "map：位置、行动力、路径或前置解锁会改变可达选择；地点收益可以估算，路线最后复用排行榜评分。",
      "state_transition：行动会改变后续状态和可用行动，需要多步预测；用按行动区分的状态转移关系。",
      "只建立当前目标需要的节点与关系。把所有未知收益或转移写成 estimationRequests，不要在构建阶段假装知道答案。",
    ].join("\n"),
    observableContext: clone(session.observableContext),
    goal: clone(session.goal),
    playerMemory: clone(session.playerMemory),
    playerProfile: clone(session.playerProfile),
    knowledgePolicy: clone(session.knowledgePolicy),
    allowedModels: modelDescriptions(),
    responseContract: {
      schema: BUILD_RESPONSE_SCHEMA,
      selectedModel: MODEL_TYPE_VALUES,
      selectionReason: "简短说明为什么这是最低充分复杂度",
      rejectedHigherComplexity: "说明为何不需要更高阶模型；若已选最高阶则为空字符串",
      structure: "符合所选模型合同的声明式结构，估算位置只引用 estimationRequests.id",
      estimationRequests: [{
        id: "unique id",
        targetKind: "option|dimension|map_node|transition|state_value|other",
        targetId: "structure中的对象id",
        field: "需要填入的字段",
        outputShape: "scalar|feature_scalar|outcome_distribution|state_distribution",
        knowledgeRule: "exact_fact_or_unknown|derive_only_from_cited_knowledge|optional",
        reason: "为什么这项估算可能改变决策",
      }],
    },
  };
}

function buildEstimateRequest(session) {
  return {
    type: "estimate_mind_structure",
    schema: "mind_estimate_request_v0",
    instruction: [
      "根据玩家可见信息和既有记忆，填写思维结构明确要求的主观估算。",
      "估算不是设计师真值。没有根据时返回 unknown，不要编造具体奖励、概率或隐藏规则。",
      "estimated 表示根据类型经验、界面信号或已知规律形成的假设；known 只用于玩家已明确获知的值。",
      "knowledgePolicy.mode为closed_world时，禁止使用常识补全。known数值必须逐字段绑定到知识卡facts；没有知识卡依据就返回unknown。",
      "每项估算必须给出置信度、可见证据id和必要假设。证据只能引用 allowedEvidenceIds。",
      "概率分布必须归一；数值范围必须包含 expected。",
    ].join("\n"),
    observableContext: clone(session.observableContext),
    goal: clone(session.goal),
    playerMemory: clone(session.playerMemory),
    playerProfile: clone(session.playerProfile),
    knowledgePolicy: clone(session.knowledgePolicy),
    selectedModel: session.buildResponse.selectedModel,
    structure: clone(session.buildResponse.structure),
    estimationRequests: clone(session.buildResponse.estimationRequests),
    allowedEvidenceIds: visibleEvidenceIds(session.observableContext, session.playerMemory),
    responseContract: {
      schema: ESTIMATE_RESPONSE_SCHEMA,
      estimates: [{
        requestId: "exact estimationRequests.id",
        status: "known|estimated|unknown",
        value: {
          scalar: { kind: "scalar", expected: "number", range: ["min", "max"] },
          featureVector: { kind: "feature_vector", values: { featureName: "number|string|boolean" } },
          stateDistribution: { kind: "state_distribution", outcomes: [{ stateId: "structure state id", probability: "0..1" }] },
          outcomeDistribution: { kind: "outcome_distribution", outcomes: [{ label: "player-readable", probability: "0..1", scalarValue: "number" }] },
          unknown: null,
        },
        confidence: "0..1",
        evidenceIds: ["ids from allowedEvidenceIds"],
        factBindings: { fieldName: { evidenceId: "knowledge card id", factKey: "key inside evidence.facts" } },
        assumptions: ["explicit assumptions"],
      }],
    },
  };
}

function assembleMindToy(session, estimateResponse) {
  return {
    schema: "player_mind_toy_v0",
    model: session.buildResponse.selectedModel,
    goal: clone(session.goal),
    cognitiveBudget: clone(session.playerProfile?.planningBudget || {}),
    structure: clone(session.buildResponse.structure),
    estimates: Object.fromEntries(estimateResponse.estimates.map((estimate) => [estimate.requestId, clone(estimate)])),
    provenance: {
      subjective: true,
      observableContextId: session.observableContext.id || null,
      selectionReason: session.buildResponse.selectionReason,
      rejectedHigherComplexity: session.buildResponse.rejectedHigherComplexity,
    },
  };
}

function validateBuildResponse(input) {
  const response = clone(input);
  if (!response || response.schema !== BUILD_RESPONSE_SCHEMA) throw new Error(`build response schema must be ${BUILD_RESPONSE_SCHEMA}`);
  if (!MODEL_TYPE_VALUES.includes(response.selectedModel)) throw new Error(`unsupported selectedModel: ${response.selectedModel}`);
  if (!response.structure || typeof response.structure !== "object") throw new Error("build response structure is required");
  if (response.structure.model !== response.selectedModel) throw new Error("structure.model must match selectedModel");
  if (!Array.isArray(response.estimationRequests)) throw new Error("estimationRequests must be an array");
  const ids = new Set();
  for (const request of response.estimationRequests) {
    if (!request?.id) throw new Error("every estimation request needs an id");
    if (ids.has(request.id)) throw new Error(`duplicate estimation request id: ${request.id}`);
    ids.add(request.id);
    if (!request.outputShape) throw new Error(`estimation request ${request.id} needs outputShape`);
  }
  validateStructure(response.structure, response.selectedModel, ids);
  response.selectionReason = String(response.selectionReason || "");
  response.rejectedHigherComplexity = String(response.rejectedHigherComplexity || "");
  return response;
}

function validateEstimateResponse(session, input) {
  const response = clone(input);
  if (!response || response.schema !== ESTIMATE_RESPONSE_SCHEMA) throw new Error(`estimate response schema must be ${ESTIMATE_RESPONSE_SCHEMA}`);
  if (!Array.isArray(response.estimates)) throw new Error("estimates must be an array");
  const requested = new Map(session.buildResponse.estimationRequests.map((row) => [row.id, row]));
  const allowedEvidence = new Set(visibleEvidenceIds(session.observableContext, session.playerMemory));
  const evidenceRows = visibleEvidenceRows(session.observableContext, session.playerMemory);
  const seen = new Set();

  for (const estimate of response.estimates) {
    if (!requested.has(estimate?.requestId)) throw new Error(`unexpected estimate requestId: ${estimate?.requestId}`);
    if (seen.has(estimate.requestId)) throw new Error(`duplicate estimate: ${estimate.requestId}`);
    seen.add(estimate.requestId);
    if (!["known", "estimated", "unknown"].includes(estimate.status)) throw new Error(`invalid status for ${estimate.requestId}`);
    estimate.confidence = clamp01(estimate.confidence);
    estimate.evidenceIds = Array.isArray(estimate.evidenceIds) ? estimate.evidenceIds.map(String) : [];
    estimate.assumptions = Array.isArray(estimate.assumptions) ? estimate.assumptions.map(String) : [];
    for (const evidenceId of estimate.evidenceIds) {
      if (!allowedEvidence.has(evidenceId)) throw new Error(`estimate ${estimate.requestId} cites invisible evidence: ${evidenceId}`);
    }
    if (estimate.status === "unknown") {
      estimate.value = null;
      continue;
    }
    if (session.knowledgePolicy?.mode === "closed_world" && estimate.evidenceIds.length === 0) {
      throw new Error(`closed-world estimate ${estimate.requestId} needs visible evidence`);
    }
    const request = requested.get(estimate.requestId);
    if (session.knowledgePolicy?.mode === "closed_world"
      && request.knowledgeRule === "exact_fact_or_unknown"
      && estimate.status !== "known") {
      throw new Error(`closed-world exact fact ${estimate.requestId} must be known or unknown`);
    }
    validateEstimateValue(estimate.value, estimate.requestId);
    validateClosedWorldBindings(session, estimate, evidenceRows);
    if (estimate.value.kind === "state_distribution") {
      const stateIds = new Set((session.buildResponse.structure.states || []).map((state) => state.id));
      for (const outcome of estimate.value.outcomes) {
        if (!stateIds.has(outcome.stateId)) throw new Error(`estimate ${estimate.requestId} references unknown state: ${outcome.stateId}`);
      }
    }
  }

  for (const requestId of requested.keys()) {
    if (!seen.has(requestId)) throw new Error(`missing estimate: ${requestId}`);
  }
  return response;
}

function validateStructure(structure, model, estimateIds) {
  if (model === MODEL_TYPES.SINGLE_RANKING) {
    requireUniqueRows(structure.options, "options");
    for (const option of structure.options) requireEstimateRef(option.valueEstimateId, estimateIds, `option ${option.id}`);
    return;
  }
  if (model === MODEL_TYPES.MULTI_RANKING) {
    requireUniqueRows(structure.dimensions, "dimensions");
    requireUniqueRows(structure.options, "options");
    for (const dimension of structure.dimensions) {
      if (!Number.isFinite(Number(dimension.weight))) throw new Error(`dimension ${dimension.id} needs numeric weight`);
    }
    for (const option of structure.options) {
      for (const dimension of structure.dimensions) {
        requireEstimateRef(option.valueEstimateIds?.[dimension.id], estimateIds, `option ${option.id} dimension ${dimension.id}`);
      }
    }
    return;
  }
  if (model === MODEL_TYPES.MAP) {
    requireUniqueRows(structure.nodes, "nodes");
    requireUniqueRows(structure.edges, "edges");
    const nodeIds = new Set(structure.nodes.map((node) => node.id));
    if (!nodeIds.has(structure.startNodeId)) throw new Error("map startNodeId must reference a node");
    for (const edge of structure.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) throw new Error(`map edge ${edge.id} references unknown node`);
      if (!Number.isFinite(Number(edge.actionCost)) || Number(edge.actionCost) < 0) throw new Error(`map edge ${edge.id} needs non-negative actionCost`);
    }
    if (![MODEL_TYPES.SINGLE_RANKING, MODEL_TYPES.MULTI_RANKING].includes(structure.routeScoring?.model)) {
      throw new Error("map routeScoring must reuse single_ranking or multi_ranking");
    }
    for (const node of structure.nodes) {
      if (node.id === structure.startNodeId) continue;
      if (structure.routeScoring.model === MODEL_TYPES.SINGLE_RANKING) {
        requireEstimateRef(node.valueEstimateId, estimateIds, `map node ${node.id}`);
      } else {
        for (const dimension of structure.routeScoring.dimensions || []) {
          requireEstimateRef(node.valueEstimateIds?.[dimension.id], estimateIds, `map node ${node.id} dimension ${dimension.id}`);
        }
      }
    }
    return;
  }
  if (model === MODEL_TYPES.STATE_TRANSITION) {
    if (structure.representation === "factorized_additive") {
      requireUniqueRows(structure.slots, "slots");
      requireUniqueRows(structure.actions, "actions");
      if (!structure.initialState || typeof structure.initialState !== "object") throw new Error("factorized state transition needs initialState");
      if (!structure.terminalScoring?.dimensions?.length) throw new Error("factorized state transition needs terminal scoring dimensions");
      for (const action of structure.actions) {
        requireEstimateRef(action.featureEstimateId, estimateIds, `factorized action ${action.id}`);
        if (action.preferenceEstimateId) requireEstimateRef(action.preferenceEstimateId, estimateIds, `factorized action ${action.id} preference`);
        if (!Array.isArray(action.allowedSlotIds) || action.allowedSlotIds.length === 0) throw new Error(`factorized action ${action.id} needs allowedSlotIds`);
      }
      return;
    }
    requireUniqueRows(structure.states, "states");
    requireUniqueRows(structure.actions, "actions");
    const stateIds = new Set(structure.states.map((state) => state.id));
    if (!stateIds.has(structure.initialStateId)) throw new Error("initialStateId must reference a state");
    if (!Number.isFinite(Number(structure.horizon)) || Number(structure.horizon) < 1) throw new Error("state transition horizon must be >= 1");
    for (const state of structure.states) requireEstimateRef(state.valueEstimateId, estimateIds, `state ${state.id}`);
    for (const action of structure.actions) {
      if (!stateIds.has(action.fromStateId)) throw new Error(`action ${action.id} references unknown source state`);
      requireEstimateRef(action.transitionEstimateId, estimateIds, `action ${action.id}`);
      if (action.immediateValueEstimateId) requireEstimateRef(action.immediateValueEstimateId, estimateIds, `action ${action.id} immediate value`);
    }
  }
}

function requireUniqueRows(rows, label) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${label} must be a non-empty array`);
  const ids = new Set();
  for (const row of rows) {
    if (!row?.id) throw new Error(`every ${label} row needs an id`);
    if (ids.has(row.id)) throw new Error(`duplicate ${label} id: ${row.id}`);
    ids.add(row.id);
  }
}

function requireEstimateRef(id, estimateIds, label) {
  if (!id || !estimateIds.has(id)) throw new Error(`${label} references missing estimate: ${id || "<empty>"}`);
}

function validateEstimateValue(value, requestId) {
  if (!value || typeof value !== "object") throw new Error(`estimate ${requestId} needs value`);
  if (value.kind === "scalar") {
    if (!Number.isFinite(Number(value.expected))) throw new Error(`scalar estimate ${requestId} needs expected`);
    if (!Array.isArray(value.range) || value.range.length !== 2) throw new Error(`scalar estimate ${requestId} needs [min,max] range`);
    const min = Number(value.range[0]);
    const max = Number(value.range[1]);
    const expected = Number(value.expected);
    if (![min, max].every(Number.isFinite) || min > expected || expected > max) throw new Error(`invalid scalar range for ${requestId}`);
    value.expected = expected;
    value.range = [min, max];
    return;
  }
  if (value.kind === "feature_vector") {
    if (!value.values || typeof value.values !== "object" || Array.isArray(value.values)) {
      throw new Error(`feature vector ${requestId} needs values object`);
    }
    if (Object.keys(value.values).length === 0) throw new Error(`feature vector ${requestId} cannot be empty`);
    for (const [field, fieldValue] of Object.entries(value.values)) {
      if (!["number", "string", "boolean"].includes(typeof fieldValue) || (typeof fieldValue === "number" && !Number.isFinite(fieldValue))) {
        throw new Error(`feature vector ${requestId}.${field} has unsupported value`);
      }
    }
    return;
  }
  if (value.kind === "state_distribution" || value.kind === "outcome_distribution") {
    if (!Array.isArray(value.outcomes) || value.outcomes.length === 0) throw new Error(`distribution ${requestId} needs outcomes`);
    let total = 0;
    for (const outcome of value.outcomes) {
      const probability = Number(outcome.probability);
      if (!Number.isFinite(probability) || probability < 0 || probability > 1) throw new Error(`invalid probability in ${requestId}`);
      outcome.probability = probability;
      total += probability;
      if (value.kind === "state_distribution" && !outcome.stateId) throw new Error(`state outcome in ${requestId} needs stateId`);
      if (value.kind === "outcome_distribution" && !Number.isFinite(Number(outcome.scalarValue))) throw new Error(`outcome in ${requestId} needs scalarValue`);
    }
    if (Math.abs(total - 1) > 0.0001) throw new Error(`probabilities in ${requestId} must sum to 1`);
    return;
  }
  throw new Error(`unsupported estimate value kind for ${requestId}: ${value.kind}`);
}

function validateClosedWorldBindings(session, estimate, evidenceRows) {
  if (session.knowledgePolicy?.mode !== "closed_world" || estimate.status !== "known") return;
  const bindings = estimate.factBindings && typeof estimate.factBindings === "object" ? estimate.factBindings : {};
  if (estimate.value.kind === "feature_vector") {
    for (const [field, value] of Object.entries(estimate.value.values)) {
      const binding = bindings[field];
      if (!binding) throw new Error(`closed-world known field ${estimate.requestId}.${field} needs fact binding`);
      assertFactBinding(evidenceRows, binding, value, `${estimate.requestId}.${field}`);
    }
    return;
  }
  if (estimate.value.kind === "scalar") {
    const binding = bindings.expected;
    if (!binding) throw new Error(`closed-world known scalar ${estimate.requestId} needs expected fact binding`);
    assertFactBinding(evidenceRows, binding, estimate.value.expected, `${estimate.requestId}.expected`);
  }
}

function assertFactBinding(evidenceRows, binding, actualValue, label) {
  const row = evidenceRows.get(String(binding.evidenceId || ""));
  if (!row) throw new Error(`fact binding ${label} references invisible evidence`);
  if (!row.facts || !Object.prototype.hasOwnProperty.call(row.facts, binding.factKey)) {
    throw new Error(`fact binding ${label} references missing fact ${binding.factKey}`);
  }
  const expectedValue = row.facts[binding.factKey];
  if (typeof expectedValue === "number" && typeof actualValue === "number") {
    if (Math.abs(expectedValue - actualValue) > 0.000001) throw new Error(`fact binding mismatch for ${label}`);
    return;
  }
  if (expectedValue !== actualValue) throw new Error(`fact binding mismatch for ${label}`);
}

function visibleEvidenceIds(context, memory) {
  const contextRows = Array.isArray(context.visibleEvidence) ? context.visibleEvidence : [];
  const memoryRows = Array.isArray(memory) ? memory : [];
  return [...new Set([...contextRows, ...memoryRows].map((row) => String(row?.id || "")).filter(Boolean))];
}

function visibleEvidenceRows(context, memory) {
  const contextRows = Array.isArray(context.visibleEvidence) ? context.visibleEvidence : [];
  const memoryRows = Array.isArray(memory) ? memory : [];
  return new Map([...contextRows, ...memoryRows].filter((row) => row?.id).map((row) => [String(row.id), row]));
}

function modelDescriptions() {
  return [
    { id: MODEL_TYPES.SINGLE_RANKING, useWhen: "所有当前选项可压缩成一个固定主观价值，不涉及顺序与状态变化" },
    { id: MODEL_TYPES.MULTI_RANKING, useWhen: "单步选项存在多个价值维度，需要按玩家偏好权衡" },
    { id: MODEL_TYPES.MAP, useWhen: "可达性、位置、行动力、路径或前置解锁影响可选计划" },
    { id: MODEL_TYPES.STATE_TRANSITION, useWhen: "行动持续改变未来状态和后续可用行动，需要多步状态预测" },
  ];
}

function validateSession(input) {
  const session = clone(input);
  if (!session || session.schema !== "player_mind_toy_session_v0") throw new Error("invalid mind toy session");
  return session;
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

module.exports = {
  BUILD_RESPONSE_SCHEMA,
  ESTIMATE_RESPONSE_SCHEMA,
  MODEL_TYPES,
  applyBuildResponse,
  applyEstimateResponse,
  createSession,
  getPendingRequest,
  validateBuildResponse,
  validateEstimateResponse,
};
