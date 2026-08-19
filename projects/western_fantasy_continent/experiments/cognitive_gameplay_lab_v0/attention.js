"use strict";

const { clone, uniqueStrings } = require("./contracts");

const SCHEMA = "cognitive_attention_result_v0";

function allocateAttention(input = {}) {
  const budget = nonNegative(input.budget, 0);
  const goalConcepts = new Set(uniqueStrings(input.goal?.concepts));
  const signals = (Array.isArray(input.signals) ? input.signals : []).map(normalizeSignal);
  const received = [];
  const receivedLayerIds = new Set();
  let remaining = budget;

  while (remaining > 0) {
    const candidates = [];
    for (const signal of signals) {
      for (const layer of signal.layers) {
        const ref = `${signal.id}/${layer.id}`;
        if (receivedLayerIds.has(ref)) continue;
        if (layer.requires.some((required) => !receivedLayerIds.has(`${signal.id}/${required}`))) continue;
        if (layer.cost > remaining) continue;
        const goalFit = overlapRatio([...goalConcepts], [...signal.concepts, ...layer.concepts]);
        const priority = priorityOf(signal, layer, goalFit);
        candidates.push({ signal, layer, ref, goalFit, priority });
      }
    }
    if (!candidates.length) break;
    candidates.sort((a, b) => b.priority - a.priority || a.layer.cost - b.layer.cost || a.ref.localeCompare(b.ref));
    const chosen = candidates[0];
    receivedLayerIds.add(chosen.ref);
    remaining = round(remaining - chosen.layer.cost);
    received.push({
      id: `attention:${chosen.ref}`,
      sourceSignalId: chosen.signal.id,
      layerId: chosen.layer.id,
      concepts: uniqueStrings([...chosen.signal.concepts, ...chosen.layer.concepts]),
      text: chosen.layer.text,
      content: clone(chosen.layer.content),
      cost: chosen.layer.cost,
      goalFit: round(chosen.goalFit),
      priority: round(chosen.priority),
    });
  }

  const receivedRefs = new Set(received.map((row) => `${row.sourceSignalId}/${row.layerId}`));
  const missed = [];
  for (const signal of signals) {
    for (const layer of signal.layers) {
      const ref = `${signal.id}/${layer.id}`;
      if (!receivedRefs.has(ref)) missed.push({ sourceSignalId: signal.id, layerId: layer.id, cost: layer.cost });
    }
  }

  return {
    schema: SCHEMA,
    budget,
    spent: round(budget - remaining),
    remaining,
    received,
    missed,
  };
}

function normalizeSignal(input, index) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("attention signal must be an object");
  const id = String(input.id || `signal:${index + 1}`);
  const layersInput = Array.isArray(input.layers) && input.layers.length
    ? input.layers
    : [{ id: "gist", cost: input.attentionCost ?? 1, text: input.text, content: input.content, concepts: input.concepts }];
  const layerIds = new Set();
  const layers = layersInput.map((layer, layerIndex) => {
    const layerId = String(layer.id || `layer:${layerIndex + 1}`);
    if (layerIds.has(layerId)) throw new Error(`duplicate attention layer ${id}/${layerId}`);
    layerIds.add(layerId);
    return {
      id: layerId,
      cost: positive(layer.cost, 1),
      importance: clamp01(layer.importance ?? 0.5),
      concepts: uniqueStrings(layer.concepts),
      requires: uniqueStrings(layer.requires),
      text: String(layer.text || input.text || ""),
      content: layer.content == null ? null : clone(layer.content),
    };
  });
  for (const layer of layers) {
    for (const required of layer.requires) {
      if (!layerIds.has(required)) throw new Error(`unknown prerequisite ${id}/${required}`);
    }
  }
  return {
    id,
    concepts: new Set(uniqueStrings(input.concepts)),
    salience: clamp01(input.salience ?? 0.5),
    explicitGoalRelevance: optionalClamp01(input.goalRelevance),
    novelty: clamp01(input.novelty ?? 0.5),
    competition: Math.max(1, Number(input.competition) || 1),
    layers,
  };
}

function priorityOf(signal, layer, inferredGoalFit) {
  const goalFit = signal.explicitGoalRelevance == null ? inferredGoalFit : signal.explicitGoalRelevance;
  const competitionPenalty = 1 / Math.sqrt(signal.competition);
  const raw = 0.42 * goalFit + 0.28 * signal.salience + 0.15 * signal.novelty + 0.15 * layer.importance;
  return raw * competitionPenalty / Math.sqrt(layer.cost);
}

function overlapRatio(left, right) {
  const leftSet = new Set(left);
  if (!leftSet.size) return 0;
  const rightSet = new Set(right);
  let matches = 0;
  for (const item of leftSet) if (rightSet.has(item)) matches += 1;
  return matches / leftSet.size;
}

function optionalClamp01(value) {
  return value == null ? null : clamp01(value);
}
function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
function positive(value, fallback) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : fallback; }
function nonNegative(value, fallback) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : fallback; }
function round(value) { return Number(Number(value || 0).toFixed(4)); }

module.exports = {
  SCHEMA,
  allocateAttention,
};
