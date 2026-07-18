const DEFAULT_LIMIT = 18;
const DEFAULT_BYTE_BUDGET = 18000;

function retrieveKnowledge(input = {}) {
  const knowledgeBase = Array.isArray(input.knowledgeBase) ? input.knowledgeBase : [];
  const observation = input.observation || {};
  const goals = Array.isArray(input.goals) ? input.goals : [];
  const failures = Array.isArray(input.failureMemories) ? input.failureMemories : [];
  const hypotheses = Array.isArray(input.hypotheses) ? input.hypotheses : [];
  const limit = Math.max(1, Number(input.limit) || DEFAULT_LIMIT);
  const byteBudget = Math.max(1000, Number(input.byteBudget) || DEFAULT_BYTE_BUDGET);
  const context = buildRetrievalContext({ observation, goals, failures, hypotheses, history: input.history || [] });
  const candidates = knowledgeBase.map((row, index) => scoreKnowledge(row, index, knowledgeBase.length, context));
  candidates.sort((a, b) => b.score - a.score || b.index - a.index);
  const required = requiredKnowledgeChecks(candidates, context);
  const forcedIds = new Set(required.map((check) => check.knowledgeIds[0]).filter(Boolean));

  const selected = [];
  let selectedBytes = 2;
  const categoryCounts = new Map();
  const orderedCandidates = [
    ...candidates.filter((entry) => forcedIds.has(entry.row.id)),
    ...candidates.filter((entry) => !forcedIds.has(entry.row.id)),
  ];
  for (const candidate of orderedCandidates) {
    if (selected.length >= limit) break;
    const category = knowledgeCategory(candidate.row);
    if (!forcedIds.has(candidate.row.id) && categoryCounts.get(category) >= categoryLimit(category)) continue;
    const summary = summarizeKnowledge(candidate.row);
    const bytes = byteLength(summary);
    if (!forcedIds.has(candidate.row.id) && selected.length && selectedBytes + bytes > byteBudget) continue;
    selected.push({ ...candidate, summary, bytes });
    selectedBytes += bytes;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  const selectedIds = new Set(selected.map((entry) => entry.row.id));
  const rejected = candidates.filter((entry) => !selectedIds.has(entry.row.id));
  const missedRequired = required.filter((check) => !check.knowledgeIds.some((id) => selectedIds.has(id)));
  const fullBytes = byteLength(knowledgeBase);

  return {
    knowledge: selected.map((entry) => entry.summary),
    audit: {
      schema: "knowledge_retrieval_audit_v1",
      query: context.query,
      candidateCount: candidates.length,
      selectedCount: selected.length,
      selectedBytes,
      fullKnowledgeBytes: fullBytes,
      byteReductionRatio: fullBytes ? round(1 - selectedBytes / fullBytes) : 0,
      selected: selected.map((entry) => ({
        id: entry.row.id,
        score: round(entry.score),
        reasons: entry.reasons,
        bytes: entry.bytes,
      })),
      rejectedCount: rejected.length,
      topRejected: rejected.slice(0, 6).map((entry) => ({
        id: entry.row.id,
        score: round(entry.score),
        reasons: entry.reasons,
      })),
      requiredChecks: required.map((check) => ({
        id: check.id,
        reason: check.reason,
        matchedKnowledgeIds: check.knowledgeIds,
        selected: check.knowledgeIds.some((id) => selectedIds.has(id)),
      })),
      missedRequired: missedRequired.map((check) => check.id),
    },
  };
}

function buildRetrievalContext({ observation, goals, failures, hypotheses, history }) {
  const allowedActions = Array.isArray(observation.allowedActions) ? observation.allowedActions : [];
  const challengeNodes = new Set(allowedActions.filter((action) => action.startsWith("challenge:")).map(actionTarget));
  const equipTargets = new Set(allowedActions.filter((action) => action.startsWith("equip:")).map((action) => action.split(":")[1]));
  const swapTargets = new Set(allowedActions.filter((action) => action.startsWith("swap:")).map((action) => action.split(":")[2]));
  const teamIds = new Set((observation.teamSlots || []).map((slot) => slot.heroId || slot).filter(Boolean));
  const visibleNodeById = new Map((observation.visibleNodes || []).map((node) => [node.id, node]));
  const primaryChallengeNodes = new Set([...challengeNodes].filter((id) => visibleNodeById.get(id)?.status === "available"));
  const availableFieldIds = new Set([...challengeNodes].map((id) => visibleNodeById.get(id)?.fieldEffect?.id).filter(Boolean));
  const unresolvedFailureNodes = new Set(failures.filter((row) => !row.resolved).map(failureNode).filter(Boolean));
  const pendingHypothesisTargets = new Set(hypotheses.filter((row) => row.status === "pending").map((row) => row.target).filter(Boolean));
  const latestKnowledgeIds = new Set();
  for (const record of history.slice(-2)) {
    for (const row of record.learningDelta?.addedKnowledge || []) latestKnowledgeIds.add(row.id);
    for (const row of record.learningDelta?.updatedKnowledge || []) latestKnowledgeIds.add(row.id);
  }
  const region = inferRegion(observation, visibleNodeById);
  return {
    observation,
    goals,
    challengeNodes,
    primaryChallengeNodes,
    equipTargets,
    swapTargets,
    teamIds,
    visibleNodeById,
    availableFieldIds,
    unresolvedFailureNodes,
    pendingHypothesisTargets,
    latestKnowledgeIds,
    hasInventory: (observation.inventory || []).length > 0,
    region,
    query: {
      activeGoal: observation.currentGoal || goals[0]?.label || goals[0]?.id || "",
      region,
      challengeNodes: [...challengeNodes],
      primaryChallengeNodes: [...primaryChallengeNodes],
      activeTeam: [...teamIds],
      swapCandidates: [...swapTargets],
      equipCandidates: [...equipTargets],
      fieldEffects: [...availableFieldIds],
      unresolvedFailureNodes: [...unresolvedFailureNodes],
      pendingHypothesisTargets: [...pendingHypothesisTargets],
      inventoryCount: (observation.inventory || []).length,
    },
  };
}

function scoreKnowledge(row, index, total, context) {
  const reasons = [];
  let score = 0;
  const subjectId = row.subject?.id || "";
  const subjectMembers = (row.subject?.members || []).map((member) => member.id);
  const node = row.environment?.node || "";
  const band = row.environment?.encounterBand || "";
  const fieldId = row.environment?.fieldEffect
    || latestObservation(row)?.fieldEffect?.id
    || (String(subjectId).startsWith("field:") ? String(subjectId).slice("field:".length) : "");
  const behaviorKind = row.behavior?.kind || "";
  const behaviorTarget = row.behavior?.target || row.behavior?.itemId || "";
  const latest = latestObservation(row);

  if (context.latestKnowledgeIds.has(row.id)) add(10, "changed_since_last_decision");
  if (node && context.unresolvedFailureNodes.has(node)) add(12, "unresolved_failure_target");
  if (node && context.primaryChallengeNodes.has(node)) add(8, "current_progression_node");
  else if (node && context.challengeNodes.has(node)) add(2, "repeatable_node");
  if (fieldId && context.availableFieldIds.has(fieldId)) add(9, "current_field_rule");
  if (context.pendingHypothesisTargets.has(subjectId) || context.pendingHypothesisTargets.has(behaviorTarget)) add(12, "pending_hypothesis_target");
  if (context.teamIds.has(subjectId)) add(4, "active_team_member");
  if (subjectMembers.some((id) => context.teamIds.has(id))) add(3, "active_team_composition");
  if (context.swapTargets.has(subjectId)) add(5, "available_swap_candidate");
  if (context.swapTargets.has(latest.character?.heroId) || context.swapTargets.has(latest.character?.id)) add(7, "newly_unlocked_swap_candidate");
  if (context.equipTargets.has(behaviorTarget) || context.equipTargets.has(row.environment?.hero?.id)) add(5, "available_equip_target");
  if (context.hasInventory && ["equip_item", "clear_level"].includes(behaviorKind)) add(3, "inventory_decision_support");
  if (context.hasInventory && ["loot_obtained", "item_equipped"].includes(latest.outcome)) add(3, "equipment_causality");
  if (context.region && row.environment?.region === context.region) add(1.5, "same_region");
  if (band && [...context.challengeNodes].some((id) => band.includes(nodeBandToken(id)))) add(2, "same_encounter_band");
  if (["character_unlocked", "character_reward", "field_effect_observed", "field_rule_observed"].includes(latest.outcome)) add(2.5, "capability_or_rule_learning");
  if (row.attributions?.length) add(0.8, "has_causal_attribution");
  if (Number(row.result?.sampleCount || 0) > 1) add(Math.min(1.2, Number(row.result.sampleCount) * 0.15), "repeated_evidence");
  add(Math.max(0, 0.9 - (total - 1 - index) * 0.012), "recency");

  return { row, index, score, reasons };

  function add(value, reason) {
    score += value;
    if (!reasons.includes(reason)) reasons.push(reason);
  }
}

function summarizeKnowledge(row) {
  const observations = row.result?.observations || [];
  const playerReadableFact = summarizePlayerReadableFact(row);
  return {
    id: row.id,
    key: row.key,
    subject: compactObject(row.subject, 8),
    environment: compactObject(row.environment, 10),
    behavior: compactObject(row.behavior, 10),
    result: {
      sampleCount: Number(row.result?.sampleCount || observations.length || 0),
      outcomeDistribution: row.result?.outcomeDistribution || {},
      latestObservation: compactObservation(observations.at(-1) || row.result?.latestObservation || {}),
    },
    evidence: {
      count: (row.evidenceEventIds || []).length,
      recentEventIds: (row.evidenceEventIds || []).slice(-3),
    },
    latestAttribution: compactAttribution((row.attributions || []).at(-1) || row.latestAttribution || null),
    ...(playerReadableFact ? { playerReadableFact } : {}),
  };
}

function summarizePlayerReadableFact(row) {
  if (row.behavior?.kind !== "challenge_level") return null;
  const observation = latestObservation(row);
  const snapshot = observation.teamCognitionSnapshot || [];
  if (!snapshot.length) return null;
  const slotLabels = ["前排1", "前排2", "后排1", "后排2"];
  const formation = snapshot.map((member, index) => {
    const slotIndex = Math.max(0, Number(member.formationSlot || index + 1) - 1);
    const matrix = formatNumber(member.cognitionMatrixPosition);
    const boundary = formatNumber(member.cognitionScaleBoundaryPosition);
    const relative = formatSignedNumber(member.cognitionRelativeToScale);
    return `${slotLabels[slotIndex] || `站位${slotIndex + 1}`} ${member.name || member.id}`
      + `（矩阵位置${matrix}，当时前30%标尺${boundary}，相对标尺${relative}，${member.cognitionLabel || `认知等级${member.cognitionLevel}`}，证据${member.cognitionEvidenceCount || 0}场）`;
  });
  return `历史战斗事实：${row.environment?.node || "未知关卡"}；阵型：${formation.join("；")}；`
    + `结果${observation.outcome || "unknown"}，表现分${formatNumber(observation.performanceScore)}。`
    + "相对标尺=矩阵位置-当时前30%标尺；这是当时认知，不是程序对当前结果的裁决。";
}

function compactObservation(value) {
  if (!value || typeof value !== "object") return value;
  const next = compactObject(value, 18);
  if (Array.isArray(value.drops)) next.drops = value.drops.slice(0, 4).map((item) => compactObject(item, 8));
  if (Array.isArray(value.enemySurvivors)) next.enemySurvivors = value.enemySurvivors.slice(0, 4).map((item) => compactObject(item, 6));
  if (Array.isArray(value.observedTargets)) next.observedTargets = value.observedTargets.slice(0, 6);
  if (Array.isArray(value.supportTargets)) next.supportTargets = value.supportTargets.slice(0, 6);
  return next;
}

function compactObject(value, maxKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value).slice(0, maxKeys));
}

function compactAttribution(value) {
  if (!value) return null;
  return {
    cause: value.cause || value.primaryCause || "",
    confidence: value.confidence,
    nextTest: value.nextTest || "",
    evidenceCount: (value.evidenceEventIds || []).length,
  };
}

function requiredKnowledgeChecks(candidates, context) {
  const checks = [];
  for (const node of context.unresolvedFailureNodes) addCheck(`failure:${node}`, "Unresolved failure must remain available for the next plan.", (row) => row.environment?.node === node);
  for (const target of context.pendingHypothesisTargets) addCheck(`hypothesis:${target}`, "Pending hypothesis evidence must remain available until settlement.", (row) => row.subject?.id === target || row.behavior?.target === target);
  for (const fieldId of context.availableFieldIds) addCheck(`field:${fieldId}`, "A learned rule for a currently available field must remain visible.", (row) => JSON.stringify(row).includes(fieldId));
  if (context.hasInventory) addCheck("equipment:causality", "Inventory decisions need learned equip or loot causality when it exists.", (row) => ["equip_item", "clear_level"].includes(row.behavior?.kind));
  for (const heroId of context.teamIds) addCheck(`active-contribution:${heroId}`, "Known contribution of each active role should remain available for roster planning.", (row) => row.subject?.id === heroId && row.behavior?.kind === "combat_participation");
  return checks;

  function addCheck(id, reason, predicate) {
    const knowledgeIds = candidates.filter((entry) => predicate(entry.row)).map((entry) => entry.row.id);
    if (knowledgeIds.length) checks.push({ id, reason, knowledgeIds });
  }
}

function knowledgeCategory(row) {
  const subjectId = String(row.subject?.id || "");
  const behaviorKind = row.behavior?.kind || "";
  if (subjectId.startsWith("field:")) return "field";
  if (behaviorKind === "combat_participation") return `contribution:${subjectId}`;
  if (["equip_item", "clear_level"].includes(behaviorKind) && ["equipment", "loot_drop"].includes(row.environment?.phase)) return "equipment";
  if (row.environment?.node) return `node:${row.environment.node}`;
  if (row.environment?.phase === "character_reward") return "character_reward";
  return `general:${behaviorKind || "unknown"}`;
}

function categoryLimit(category) {
  if (category === "equipment") return 4;
  if (category.startsWith("node:")) return 3;
  if (category.startsWith("contribution:")) return 2;
  if (category.startsWith("general:")) return 2;
  return 3;
}

function inferRegion(observation, visibleNodeById) {
  const currentNode = [...visibleNodeById.keys()].find((id) => String(id).startsWith("r2_")) ? "region_2" : "region_1";
  return observation.region || currentNode;
}

function failureNode(row) {
  if (row.node) return row.node;
  const match = String(row.key || "").match(/\|(r\d+_[^|]+)\|/);
  return match?.[1] || "";
}

function actionTarget(action) { return String(action).split(":")[1] || ""; }
function nodeBandToken(node) { return String(node).replace(/_\d+$/, ""); }
function latestObservation(row) { return row.result?.observations?.at?.(-1) || row.result?.latestObservation || {}; }
function byteLength(value) { return Buffer.byteLength(JSON.stringify(value), "utf8"); }
function formatNumber(value) {
  return Number.isFinite(Number(value)) ? String(round(value)) : "未知";
}
function formatSignedNumber(value) {
  if (!Number.isFinite(Number(value))) return "未知";
  const number = round(value);
  return number > 0 ? `+${number}` : String(number);
}
function round(value) { return Number(Number(value || 0).toFixed(4)); }

module.exports = {
  DEFAULT_BYTE_BUDGET,
  DEFAULT_LIMIT,
  retrieveKnowledge,
  summarizeKnowledge,
};
