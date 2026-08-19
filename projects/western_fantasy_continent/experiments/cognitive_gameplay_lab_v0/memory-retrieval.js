"use strict";

const { clone, uniqueStrings } = require("./contracts");

const SCHEMA = "game_memory_retrieval_v0";

function buildGameMemoryQuery(input = {}) {
  const playerView = input.playerView || {};
  const scene = playerView.scene || {};
  const received = Array.isArray(input.receivedAttention) ? input.receivedAttention : [];
  return {
    goalIds: uniqueStrings([input.goal?.id]),
    concepts: uniqueStrings([
      ...(input.goal?.concepts || []),
      ...(scene.concepts || []),
      ...received.flatMap((row) => row.concepts || []),
    ]),
    environment: uniqueStrings(scene.environment),
    actionTokens: uniqueStrings(playerView.allowedActions),
    text: [scene.label, scene.currentProblem, ...received.map((row) => row.text)].filter(Boolean).join(" "),
  };
}

function retrieveGameMemories(input = {}) {
  const mode = input.mode === "deliberate" ? "deliberate" : "automatic";
  const query = normalizeQuery(input.query || {});
  const memories = (Array.isArray(input.memories) ? input.memories : []).map(normalizeMemory);
  const limit = Math.max(1, Math.floor(Number(input.limit) || 4));
  let remainingAttention = nonNegative(input.attentionBudget, 0);
  const automaticThreshold = nonNegative(input.automaticThreshold, 6);
  const candidates = memories.map((memory) => scoreMemory(memory, query));
  candidates.sort((a, b) => b.score - a.score || b.memory.strength - a.memory.strength || a.memory.id.localeCompare(b.memory.id));

  const selected = [];
  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    const cost = mode === "automatic" ? candidate.memory.automaticCost : candidate.memory.retrievalCost;
    if (mode === "automatic" && candidate.score < automaticThreshold) continue;
    if (cost > remainingAttention) continue;
    remainingAttention = round(remainingAttention - cost);
    selected.push({
      id: candidate.memory.id,
      kind: candidate.memory.kind,
      content: clone(candidate.memory.content),
      concepts: [...candidate.memory.concepts],
      environment: [...candidate.memory.environment],
      behavior: candidate.memory.behavior,
      result: candidate.memory.result,
      confidence: candidate.memory.confidence,
      score: round(candidate.score),
      cost,
      reasons: candidate.reasons,
    });
  }

  const selectedIds = new Set(selected.map((row) => row.id));
  return {
    schema: SCHEMA,
    mode,
    query,
    selected,
    attentionSpent: round(nonNegative(input.attentionBudget, 0) - remainingAttention),
    attentionRemaining: remainingAttention,
    audit: {
      candidateCount: candidates.length,
      rejected: candidates.filter((row) => !selectedIds.has(row.memory.id)).map((row) => ({
        id: row.memory.id,
        score: round(row.score),
        reasons: row.reasons,
      })),
    },
  };
}

function scoreMemory(memory, query) {
  const reasons = [];
  let score = 0;
  addOverlap(memory.concepts, query.concepts, 4, "concept_match");
  addOverlap(memory.environment, query.environment, 2.5, "environment_match");
  addOverlap(memory.goalIds, query.goalIds, 3, "goal_match");
  addOverlap(memory.cues, new Set([...query.concepts, ...query.environment]), 2, "cue_match");
  const lexicalMatches = intersect(memory.lexicalTokens, query.lexicalTokens).length;
  if (lexicalMatches) add(Math.min(2, lexicalMatches * 0.35), "lexical_match");
  reasons.push("memory_strength_gate");
  add(memory.recency * 0.6, "recency");
  score *= 0.35 + 0.65 * memory.strength;
  score -= memory.interference * 0.8;
  if (memory.interference > 0) reasons.push("interference_penalty");
  return { memory, score, reasons };

  function addOverlap(left, right, weight, reason) {
    const matches = intersect(left, right).length;
    if (matches) add(matches * weight, reason);
  }
  function add(value, reason) {
    score += value;
    if (!reasons.includes(reason)) reasons.push(reason);
  }
}

function normalizeMemory(input, index) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("memory row must be an object");
  if (!input.id) throw new Error(`memory row ${index + 1} requires id`);
  const concepts = new Set(uniqueStrings(input.concepts));
  const environment = new Set(uniqueStrings(input.environment));
  const goalIds = new Set(uniqueStrings(input.goalIds));
  const cues = new Set(uniqueStrings(input.cues));
  const behavior = String(input.behavior || "");
  const result = String(input.result || "");
  const lexicalTokens = new Set(tokenize([input.text, behavior, result, ...concepts, ...environment, ...cues].join(" ")));
  return {
    id: String(input.id),
    kind: String(input.kind || "episode"),
    content: input.content == null ? null : clone(input.content),
    concepts,
    environment,
    goalIds,
    cues,
    behavior,
    result,
    lexicalTokens,
    strength: clamp01(input.strength ?? 0.5),
    confidence: clamp01(input.confidence ?? input.strength ?? 0.5),
    recency: clamp01(input.recency ?? 0.5),
    interference: clamp01(input.interference ?? 0),
    retrievalCost: positive(input.retrievalCost, 2),
    automaticCost: nonNegative(input.automaticCost, 0.25),
  };
}

function normalizeQuery(input) {
  const query = {
    goalIds: uniqueStrings(input.goalIds),
    concepts: uniqueStrings(input.concepts),
    environment: uniqueStrings(input.environment),
    actionTokens: uniqueStrings(input.actionTokens),
    text: String(input.text || ""),
  };
  query.lexicalTokens = tokenize([
    query.text,
    ...query.goalIds,
    ...query.concepts,
    ...query.environment,
    ...query.actionTokens,
  ].join(" "));
  return query;
}

function tokenize(text) {
  const raw = String(text || "").toLowerCase();
  const base = raw.split(/[^\p{L}\p{N}_:-]+/u).filter(Boolean);
  const tokens = new Set(base);
  for (const token of base) {
    if (/^[\p{Script=Han}]+$/u.test(token) && token.length >= 3) {
      for (let index = 0; index < token.length - 1; index += 1) tokens.add(token.slice(index, index + 2));
    }
  }
  return [...tokens];
}

function intersect(left, right) {
  const rightSet = right instanceof Set ? right : new Set(right);
  return [...left].filter((item) => rightSet.has(item));
}
function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
function positive(value, fallback) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : fallback; }
function nonNegative(value, fallback) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : fallback; }
function round(value) { return Number(Number(value || 0).toFixed(4)); }

module.exports = {
  SCHEMA,
  buildGameMemoryQuery,
  retrieveGameMemories,
  tokenize,
};
