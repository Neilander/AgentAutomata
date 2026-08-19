"use strict";

const { clone, uniqueStrings } = require("./contracts");
const { assertNoForbiddenKeys } = require("./game-boundary");

const SCHEMA = "active_cognition_v0";

function buildActiveCognition(input = {}) {
  const playerView = input.playerView || {};
  const attention = input.attentionResult || {};
  const retrieval = input.retrievalResult || {};
  const observations = (attention.received || []).map((row) => ({
    id: String(row.id),
    kind: "perceived_signal",
    concepts: uniqueStrings(row.concepts),
    text: String(row.text || ""),
    content: clone(row.content),
    confidence: perceptionConfidence(row),
    provenance: { source: "attention", sourceId: row.sourceSignalId, layerId: row.layerId },
  }));
  const retrievedMemories = (retrieval.selected || []).map((row) => ({
    id: `active-memory:${row.id}`,
    memoryId: String(row.id),
    kind: "retrieved_memory",
    concepts: uniqueStrings(row.concepts),
    environment: uniqueStrings(row.environment),
    behavior: String(row.behavior || ""),
    result: String(row.result || ""),
    content: clone(row.content),
    confidence: clamp01(row.confidence),
    provenance: { source: "memory_retrieval", score: row.score, reasons: clone(row.reasons || []) },
  }));
  const active = {
    schema: SCHEMA,
    gameId: String(playerView.gameId || "unknown_game"),
    turn: Number(playerView.turn || 0),
    goal: clone(input.goal || {}),
    scene: clone(playerView.scene || {}),
    observations,
    retrievedMemories,
    knownRules: normalizeExplicitRules(input.knownRules),
    allowedActions: uniqueStrings(playerView.allowedActions),
    unresolvedUnknowns: uniqueStrings(input.unresolvedUnknowns),
    attention: {
      capacity: Number(input.attentionCapacity ?? (Number(attention.budget || 0) + Number(retrieval.attentionSpent || 0))),
      perceptionSpent: Number(attention.spent || 0),
      retrievalSpent: Number(retrieval.attentionSpent || 0),
      remaining: Number(retrieval.attentionRemaining ?? attention.remaining ?? 0),
    },
    evidenceIds: uniqueStrings([
      ...observations.map((row) => row.id),
      ...retrievedMemories.map((row) => row.id),
      ...normalizeExplicitRules(input.knownRules).map((row) => row.id),
    ]),
  };
  assertNoForbiddenKeys(active);
  return active;
}

function normalizeExplicitRules(input) {
  return (Array.isArray(input) ? input : []).map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("known rule must be an object");
    if (row.activated !== true) throw new Error("known rule must be explicitly activated before entering ActiveCognition");
    return {
      id: String(row.id || `known-rule:${index + 1}`),
      text: String(row.text || ""),
      concepts: uniqueStrings(row.concepts),
      confidence: clamp01(row.confidence ?? 1),
      facts: clone(row.content?.facts || row.facts || {}),
      provenance: clone(row.provenance || { source: "seeded_player_knowledge" }),
    };
  });
}

function perceptionConfidence(row) {
  const priority = clamp01(row.priority);
  const goalFit = clamp01(row.goalFit);
  return Number((0.55 + 0.25 * priority + 0.2 * goalFit).toFixed(4));
}

function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }

module.exports = {
  SCHEMA,
  buildActiveCognition,
};
