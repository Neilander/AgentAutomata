"use strict";

const { ESTIMATE_RESPONSE_SCHEMA } = require("../player_mind_toy_v0/mind-toy-ai-loop");
const { clone, uniqueStrings } = require("./contracts");

const SCHEMA = "sourced_estimate_resolution_v0";

function resolveEstimates(input = {}) {
  const requests = Array.isArray(input.requests) ? input.requests : [];
  const active = input.activeCognition || {};
  const calculators = input.calculators && typeof input.calculators === "object" ? input.calculators : {};
  const evidence = evidenceRows(active);
  const estimates = requests.map((request) => resolveOne(request, evidence, active, calculators));
  return {
    schema: SCHEMA,
    estimateResponse: {
      schema: ESTIMATE_RESPONSE_SCHEMA,
      estimates,
    },
    audit: estimates.map((estimate) => ({
      requestId: estimate.requestId,
      status: estimate.status,
      sourceKind: estimate.sourceKind,
      evidenceIds: estimate.evidenceIds,
    })),
  };
}

function resolveOne(requestInput, evidence, active, calculators) {
  const request = clone(requestInput || {});
  if (!request.id) throw new Error("estimate request requires id");
  const resolution = request.resolution && typeof request.resolution === "object" ? request.resolution : {};
  const factKey = String(resolution.factKey || "");
  if (factKey) {
    const visibleMatches = findFactMatches(evidence.filter((row) => row.sourceKind !== "memory"), factKey, resolution.evidenceId);
    if (visibleMatches.length) return fromFactMatches(request, visibleMatches, "visible_fact");
    const memoryMatches = findFactMatches(evidence.filter((row) => row.sourceKind === "memory"), factKey, resolution.evidenceId);
    if (memoryMatches.length) return fromFactMatches(request, memoryMatches, "retrieved_memory_fact");
  }
  const resolverId = String(resolution.resolverId || "");
  if (resolverId) {
    if (typeof calculators[resolverId] !== "function") return unknown(request, `resolver ${resolverId} is unavailable`);
    const result = calculators[resolverId]({ request: clone(request), activeCognition: clone(active) });
    return fromCalculator(request, resolverId, result, new Set(active.evidenceIds || []));
  }
  return unknown(request, factKey ? `no active evidence contains fact ${factKey}` : "no allowed estimate source");
}

function fromFactMatches(request, matches, sourceKind) {
  const numeric = matches.every((row) => Number.isFinite(Number(row.value)));
  const distinct = new Map(matches.map((row) => [JSON.stringify(row.value), row]));
  const evidenceIds = uniqueStrings(matches.map((row) => row.evidenceId));
  if (distinct.size === 1) {
    const value = matches[0].value;
    return {
      requestId: String(request.id),
      status: "known",
      value: scalarOrFeature(value),
      confidence: minimum(matches.map((row) => row.confidence), 1),
      evidenceIds,
      factBindings: {},
      assumptions: [],
      sourceKind,
    };
  }
  if (numeric) {
    const values = matches.map((row) => Number(row.value));
    return {
      requestId: String(request.id),
      status: "estimated",
      value: { kind: "scalar", expected: mean(values), range: [Math.min(...values), Math.max(...values)] },
      confidence: round(minimum(matches.map((row) => row.confidence), 0.5) * 0.6),
      evidenceIds,
      factBindings: {},
      assumptions: ["active evidence conflicts; preserve the observed range"],
      sourceKind: `${sourceKind}_conflict`,
    };
  }
  return unknown(request, "active fact values conflict and are not numeric", evidenceIds);
}

function fromCalculator(request, resolverId, resultInput, allowedEvidence) {
  const result = resultInput && typeof resultInput === "object" ? clone(resultInput) : null;
  if (!result || result.status === "unknown") return unknown(request, result?.reason || `resolver ${resolverId} returned unknown`);
  const evidenceIds = uniqueStrings(result.evidenceIds);
  for (const id of evidenceIds) {
    if (!allowedEvidence.has(id)) throw new Error(`resolver ${resolverId} cited inactive evidence ${id}`);
  }
  if (!result.value || typeof result.value !== "object") throw new Error(`resolver ${resolverId} requires structured value`);
  return {
    requestId: String(request.id),
    status: result.status === "known" ? "known" : "estimated",
    value: clone(result.value),
    confidence: clamp01(result.confidence),
    evidenceIds,
    factBindings: {},
    assumptions: uniqueStrings(result.assumptions),
    sourceKind: `calculator:${resolverId}`,
  };
}

function unknown(request, reason, evidenceIds = []) {
  return {
    requestId: String(request.id),
    status: "unknown",
    value: null,
    confidence: 0,
    evidenceIds: uniqueStrings(evidenceIds),
    factBindings: {},
    assumptions: [String(reason)],
    sourceKind: "unknown",
  };
}

function evidenceRows(active) {
  return [
    ...(active.observations || []).map((row) => ({ ...row, sourceKind: "visible" })),
    ...(active.knownRules || []).map((row) => ({ ...row, sourceKind: "known_rule" })),
    ...(active.retrievedMemories || []).map((row) => ({ ...row, sourceKind: "memory" })),
  ].map((row) => ({
    id: String(row.id),
    sourceKind: row.sourceKind,
    facts: clone(row.content?.facts || row.facts || {}),
    confidence: clamp01(row.confidence ?? 0.5),
  }));
}

function findFactMatches(rows, factKey, evidenceId) {
  return rows.filter((row) => (!evidenceId || row.id === evidenceId) && Object.hasOwn(row.facts, factKey)).map((row) => ({
    evidenceId: row.id,
    value: clone(row.facts[factKey]),
    confidence: row.confidence,
  }));
}

function scalarOrFeature(value) {
  if (Number.isFinite(Number(value))) {
    const number = Number(value);
    return { kind: "scalar", expected: number, range: [number, number] };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) return { kind: "feature_vector", values: clone(value) };
  return { kind: "feature_vector", values: { value: clone(value) } };
}

function minimum(values, fallback) { return values.length ? Math.min(...values.map(Number)) : fallback; }
function mean(values) { return round(values.reduce((sum, value) => sum + value, 0) / values.length); }
function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
function round(value) { return Number(Number(value || 0).toFixed(4)); }

module.exports = {
  SCHEMA,
  resolveEstimates,
};
