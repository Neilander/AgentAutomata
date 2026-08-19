"use strict";

const { clone, uniqueStrings } = require("./contracts");

const IDEA_SCHEMA = "cognitive_idea_v0";
const ATTEMPT_SCHEMA = "cognitive_local_attempt_v0";
const EVALUATION_SCHEMA = "cognitive_idea_evaluation_v0";

function createIdeaRequest(input = {}) {
  const active = requireActive(input.activeCognition);
  if (!input.mindToy || input.mindToy.schema !== "player_mind_toy_v0") throw new Error("ready MindToy is required");
  return {
    type: "propose_one_idea",
    schema: "cognitive_idea_request_v0",
    instruction: [
      "一次只提出一个可尝试思路，不要枚举所有组合。",
      "行动必须来自allowedActions；依据只能引用allowedEvidenceIds。",
      "说明这个行动预计改变什么，以及哪些估算仍是假设。",
    ].join("\n"),
    goal: clone(active.goal),
    activeCognition: clone(active),
    mindToy: clone(input.mindToy),
    previousIdeas: (input.previousIdeas || []).map(summarizeIdea),
    allowedActions: clone(active.allowedActions),
    allowedEvidenceIds: clone(active.evidenceIds),
    responseContract: {
      schema: IDEA_SCHEMA,
      id: "unique idea id",
      actionId: "one id from allowedActions",
      claim: "该行动预计会怎样推进当前目标",
      rationale: "基于当前激活认知的简短理由",
      evidenceIds: ["ids from allowedEvidenceIds"],
      estimateIds: ["MindToy estimate ids used"],
    },
  };
}

function acceptIdeaResponse(request, responseInput) {
  if (!request || request.schema !== "cognitive_idea_request_v0") throw new Error("invalid idea request");
  const response = clone(responseInput || {});
  if (response.schema !== IDEA_SCHEMA) throw new Error(`idea schema must be ${IDEA_SCHEMA}`);
  if (!response.id) throw new Error("idea requires id");
  response.actionId = String(response.actionId || "");
  if (!request.allowedActions.includes(response.actionId)) throw new Error(`idea action is not legal: ${response.actionId}`);
  response.claim = String(response.claim || "").trim();
  response.rationale = String(response.rationale || "").trim();
  if (!response.claim || !response.rationale) throw new Error("idea requires claim and rationale");
  response.evidenceIds = uniqueStrings(response.evidenceIds);
  if (!response.evidenceIds.length) throw new Error("idea requires active evidence");
  const allowedEvidence = new Set(request.allowedEvidenceIds);
  for (const id of response.evidenceIds) if (!allowedEvidence.has(id)) throw new Error(`idea cites inactive evidence: ${id}`);
  response.estimateIds = uniqueStrings(response.estimateIds);
  const allowedEstimates = new Set(Object.keys(request.mindToy.estimates || {}));
  for (const id of response.estimateIds) if (!allowedEstimates.has(id)) throw new Error(`idea cites missing estimate: ${id}`);
  const signature = ideaSignature(response);
  if ((request.previousIdeas || []).some((row) => row.signature === signature)) throw new Error(`duplicate idea: ${signature}`);
  return { ...response, signature, status: "proposed" };
}

function attemptIdea(input = {}) {
  const idea = input.idea || {};
  const toy = input.mindToy || {};
  if (idea.schema !== IDEA_SCHEMA) throw new Error("accepted idea is required");
  if (toy.schema !== "player_mind_toy_v0") throw new Error("MindToy is required");
  if (toy.model !== "state_transition") throw new Error(`V0 local attempt does not support ${toy.model}`);
  const action = (toy.structure.actions || []).find((row) => row.id === idea.actionId);
  if (!action) throw new Error(`MindToy does not contain action ${idea.actionId}`);
  const transition = toy.estimates?.[action.transitionEstimateId];
  if (!transition || transition.status === "unknown" || transition.value?.kind !== "state_distribution") {
    return unknownAttempt(idea, action, "transition estimate is unknown");
  }
  const stateById = new Map((toy.structure.states || []).map((row) => [row.id, row]));
  const fromState = stateById.get(action.fromStateId);
  const currentValue = scalarEstimate(toy, fromState?.valueEstimateId);
  const outcomes = transition.value.outcomes.map((row) => {
    const state = stateById.get(row.stateId);
    return {
      stateId: row.stateId,
      probability: Number(row.probability),
      subjectiveValue: scalarEstimate(toy, state?.valueEstimateId),
    };
  });
  const valuesKnown = currentValue !== null && outcomes.every((row) => row.subjectiveValue !== null);
  const expectedValue = valuesKnown
    ? round(outcomes.reduce((sum, row) => sum + row.probability * row.subjectiveValue, 0))
    : null;
  const confidence = Math.min(Number(transition.confidence || 0), ...outcomes.map((row) => {
    const state = stateById.get(row.stateId);
    return Number(toy.estimates?.[state?.valueEstimateId]?.confidence || 0);
  }));
  return {
    schema: ATTEMPT_SCHEMA,
    ideaId: idea.id,
    actionId: idea.actionId,
    status: valuesKnown ? "simulated" : "partial",
    currentStateId: action.fromStateId,
    currentValue,
    expectedValue,
    valueDelta: valuesKnown ? round(expectedValue - currentValue) : null,
    outcomes,
    confidence: round(confidence),
    sourceEstimateIds: uniqueStrings([action.transitionEstimateId, fromState?.valueEstimateId,
      ...outcomes.map((row) => stateById.get(row.stateId)?.valueEstimateId)]),
    assumptions: uniqueStrings(transition.assumptions),
  };
}

function evaluateIdea(input = {}) {
  const attempt = input.attempt || {};
  if (attempt.schema !== ATTEMPT_SCHEMA) throw new Error("local attempt is required");
  const minimumConfidence = Number(input.minimumConfidence ?? 0.35);
  const useful = attempt.status === "simulated"
    && Number(attempt.valueDelta) > 0
    && Number(attempt.confidence) >= minimumConfidence;
  return {
    schema: EVALUATION_SCHEMA,
    ideaId: attempt.ideaId,
    actionId: attempt.actionId,
    verdict: useful ? "useful" : attempt.status === "unknown" ? "blocked" : "weak",
    useful,
    predictedProgress: attempt.valueDelta,
    confidence: attempt.confidence,
    decisiveUnknown: attempt.status === "unknown" ? attempt.reason : null,
    reason: useful
      ? "局部推演显示该思路以足够置信度推进当前目标"
      : attempt.status === "unknown" ? "缺少完成局部推演所需的估算" : "局部推演没有显示出足够可靠的正向推进",
  };
}

function unknownAttempt(idea, action, reason) {
  return {
    schema: ATTEMPT_SCHEMA,
    ideaId: idea.id,
    actionId: idea.actionId,
    status: "unknown",
    currentStateId: action.fromStateId,
    currentValue: null,
    expectedValue: null,
    valueDelta: null,
    outcomes: [],
    confidence: 0,
    sourceEstimateIds: uniqueStrings([action.transitionEstimateId]),
    assumptions: [],
    reason,
  };
}

function scalarEstimate(toy, id) {
  const estimate = toy.estimates?.[id];
  if (!estimate || estimate.status === "unknown" || estimate.value?.kind !== "scalar") return null;
  return Number(estimate.value.expected);
}

function ideaSignature(idea) { return `${String(idea.actionId)}|${String(idea.claim).trim().toLowerCase()}`; }
function summarizeIdea(idea) { return { id: idea.id, actionId: idea.actionId, claim: idea.claim, signature: idea.signature || ideaSignature(idea) }; }
function requireActive(input) { if (!input || input.schema !== "active_cognition_v0") throw new Error("ActiveCognition is required"); return input; }
function round(value) { return Number(Number(value).toFixed(4)); }

module.exports = {
  ATTEMPT_SCHEMA,
  EVALUATION_SCHEMA,
  IDEA_SCHEMA,
  acceptIdeaResponse,
  attemptIdea,
  createIdeaRequest,
  evaluateIdea,
};
