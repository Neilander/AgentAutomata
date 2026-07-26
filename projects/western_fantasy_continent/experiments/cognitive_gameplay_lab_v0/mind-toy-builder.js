"use strict";

const BASE = require("../player_mind_toy_v0/mind-toy-ai-loop");
const { clone, uniqueStrings } = require("./contracts");

const LAB_BUILD_SCHEMA = "cognitive_lab_mind_build_v0";

function createMindToyBuildSession(input = {}) {
  const active = validateActiveCognition(input.activeCognition);
  const observableContext = {
    id: `${active.gameId}:turn:${active.turn}`,
    gameId: active.gameId,
    turn: active.turn,
    scene: clone(active.scene),
    allowedActions: clone(active.allowedActions),
    unresolvedUnknowns: clone(active.unresolvedUnknowns),
    visibleEvidence: [
      ...active.observations.map(toEvidenceRow),
      ...active.knownRules.map(toEvidenceRow),
    ],
  };
  const playerMemory = active.retrievedMemories.map(toEvidenceRow);
  const baseSession = BASE.createSession({
    observableContext,
    goal: clone(active.goal),
    playerMemory,
    playerProfile: clone(input.playerProfile || {}),
    knowledgePolicy: clone(input.knowledgePolicy || { mode: "open_but_player_visible" }),
  });
  return {
    schema: LAB_BUILD_SCHEMA,
    activeEvidenceIds: uniqueStrings(active.evidenceIds),
    activeAllowedActions: uniqueStrings(active.allowedActions),
    adequacyContract: normalizeAdequacyContract(input.adequacyContract),
    baseSession,
    adequacyAudit: null,
  };
}

function getMindToyBuildRequest(labSessionInput) {
  const lab = validateLabSession(labSessionInput);
  const request = BASE.getPendingRequest(lab.baseSession);
  if (request.type !== "build_mind_structure") return request;
  return {
    ...request,
    labInstruction: [
      "这是可运行认知玩家的MindToy构建边界，必须由AI根据ActiveCognition构建。",
      "evidenceIds只能引用本请求给出的allowedEvidenceIds。",
      "structure必须足以表达至少一个当前合法行动，但不需要复制全部界面信息。",
      "不得引用长期知识库中未被本轮检索激活的内容。",
    ].join("\n"),
    allowedEvidenceIds: clone(lab.activeEvidenceIds),
    adequacyContract: clone(lab.adequacyContract.publicHints),
    responseContract: {
      ...request.responseContract,
      evidenceIds: ["one or more ids from allowedEvidenceIds used to choose the structure"],
    },
  };
}

function applyMindToyBuildResponse(labSessionInput, responseInput) {
  const lab = validateLabSession(labSessionInput);
  if (lab.baseSession.phase !== "build") throw new Error(`cannot build in phase ${lab.baseSession.phase}`);
  const response = clone(responseInput);
  response.evidenceIds = uniqueStrings(response.evidenceIds);
  if (!response.evidenceIds.length) throw new Error("MindToy build response requires evidenceIds");
  const allowedEvidence = new Set(lab.activeEvidenceIds);
  for (const id of response.evidenceIds) {
    if (!allowedEvidence.has(id)) throw new Error(`MindToy build cites inactive evidence: ${id}`);
  }
  const baseSession = BASE.applyBuildResponse(lab.baseSession, response);
  const adequacyAudit = assessBuildAdequacy({
    response: baseSession.buildResponse,
    allowedActions: lab.activeAllowedActions,
    contract: lab.adequacyContract,
  });
  if (!adequacyAudit.pass) throw new Error(`MindToy build is structurally inadequate: ${adequacyAudit.errors.join(";")}`);
  return { ...lab, baseSession, adequacyAudit };
}

function applyResolvedEstimates(labSessionInput, estimateResponse) {
  const lab = validateLabSession(labSessionInput);
  const baseSession = BASE.applyEstimateResponse(lab.baseSession, estimateResponse);
  return { ...lab, baseSession };
}

function assessBuildAdequacy(input = {}) {
  const response = input.response || {};
  const contract = normalizeAdequacyContract(input.contract);
  const allowedActions = uniqueStrings(input.allowedActions);
  const serialized = JSON.stringify(response.structure || {});
  const referencedActions = allowedActions.filter((action) => serialized.includes(JSON.stringify(action)));
  const errors = [];
  if (allowedActions.length && referencedActions.length < contract.minimumReferencedActions) {
    errors.push(`references ${referencedActions.length} legal actions; minimum ${contract.minimumReferencedActions}`);
  }
  for (const token of contract.requiredStructureTokens) {
    if (!serialized.includes(token)) errors.push(`missing required structure token ${token}`);
  }
  if (contract.allowedModels.length && !contract.allowedModels.includes(response.selectedModel)) {
    errors.push(`model ${response.selectedModel} is outside adequacy contract`);
  }
  if ((response.estimationRequests || []).some((row) => !String(row.reason || "").trim())) {
    errors.push("every estimation request needs a decision-relevance reason");
  }
  return {
    pass: errors.length === 0,
    errors,
    selectedModel: response.selectedModel,
    referencedActions,
    requiredStructureTokens: clone(contract.requiredStructureTokens),
  };
}

function normalizeAdequacyContract(input = {}) {
  return {
    minimumReferencedActions: Math.max(1, Math.floor(Number(input.minimumReferencedActions) || 1)),
    requiredStructureTokens: uniqueStrings(input.requiredStructureTokens),
    allowedModels: uniqueStrings(input.allowedModels),
    publicHints: clone(input.publicHints || {}),
  };
}

function toEvidenceRow(row) {
  return {
    id: String(row.id),
    kind: String(row.kind || "active_evidence"),
    text: String(row.text || row.result || ""),
    concepts: uniqueStrings(row.concepts),
    confidence: Number(row.confidence ?? 0.5),
    facts: clone(row.content?.facts || row.facts || {}),
    environment: clone(row.environment || []),
    behavior: String(row.behavior || ""),
    result: String(row.result || ""),
    provenance: clone(row.provenance || {}),
  };
}

function validateActiveCognition(input) {
  if (!input || input.schema !== "active_cognition_v0") throw new Error("activeCognition is required");
  return clone(input);
}
function validateLabSession(input) {
  if (!input || input.schema !== LAB_BUILD_SCHEMA) throw new Error("invalid cognitive lab build session");
  return clone(input);
}

module.exports = {
  LAB_BUILD_SCHEMA,
  applyMindToyBuildResponse,
  applyResolvedEstimates,
  assessBuildAdequacy,
  createMindToyBuildSession,
  getMindToyBuildRequest,
};
