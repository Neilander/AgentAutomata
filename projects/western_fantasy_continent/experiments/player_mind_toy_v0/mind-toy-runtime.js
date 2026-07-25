"use strict";

const { MODEL_TYPES } = require("./mind-toy-ai-loop");

function attempt(mindToyInput, options = {}) {
  const mindToy = structuredClone(mindToyInput);
  if (!mindToy || mindToy.schema !== "player_mind_toy_v0") throw new Error("invalid mind toy");
  if (mindToy.model === MODEL_TYPES.SINGLE_RANKING) return attemptSingleRanking(mindToy, options);
  if (mindToy.model === MODEL_TYPES.MULTI_RANKING) return attemptMultiRanking(mindToy, options);
  if (mindToy.model === MODEL_TYPES.MAP) return attemptMap(mindToy, options);
  if (mindToy.model === MODEL_TYPES.STATE_TRANSITION) return attemptStateTransition(mindToy, options);
  throw new Error(`unsupported mind toy model: ${mindToy.model}`);
}

function attemptSingleRanking(mindToy) {
  const options = mindToy.structure.options || [];
  const rows = options.map((option) => {
    const estimate = estimateById(mindToy, option.valueEstimateId);
    return {
      id: option.id,
      label: option.label || option.id,
      availability: option.availability || "available",
      score: scalarExpected(estimate),
      confidence: estimate?.confidence ?? 0,
      estimateStatus: estimate?.status || "missing",
    };
  });
  return rankingResult(mindToy.model, rows, {
    branchExpansions: rows.filter((row) => row.availability === "available").length,
    maxDepth: 1,
    structureOperations: ["scalar_estimate", "sort"],
  });
}

function attemptMultiRanking(mindToy) {
  const dimensions = mindToy.structure.dimensions || [];
  const totalWeight = dimensions.reduce((sum, dimension) => sum + Math.abs(number(dimension.weight)), 0) || 1;
  const rows = (mindToy.structure.options || []).map((option) => {
    let score = 0;
    let confidenceWeighted = 0;
    let knownWeight = 0;
    const contributions = [];
    for (const dimension of dimensions) {
      const weight = number(dimension.weight) / totalWeight;
      const estimateId = option.valueEstimateIds?.[dimension.id];
      const estimate = estimateById(mindToy, estimateId);
      const expected = scalarExpected(estimate);
      if (expected == null) {
        contributions.push({ dimensionId: dimension.id, weight: round(weight), expected: null, contribution: null });
        continue;
      }
      const direction = dimension.direction === "minimize" ? -1 : 1;
      const contribution = expected * weight * direction;
      score += contribution;
      knownWeight += Math.abs(weight);
      confidenceWeighted += Math.abs(weight) * number(estimate.confidence);
      contributions.push({ dimensionId: dimension.id, weight: round(weight), expected: round(expected), contribution: round(contribution) });
    }
    return {
      id: option.id,
      label: option.label || option.id,
      availability: option.availability || "available",
      score: knownWeight > 0 ? round(score) : null,
      confidence: knownWeight > 0 ? round(confidenceWeighted / knownWeight) : 0,
      coverage: round(knownWeight),
      contributions,
    };
  });
  return rankingResult(mindToy.model, rows, {
    branchExpansions: rows.filter((row) => row.availability === "available").length,
    maxDepth: 1,
    structureOperations: ["feature_estimate", "weighted_combine", "sort"],
  });
}

function attemptMap(mindToy, options = {}) {
  const structure = mindToy.structure;
  const nodes = new Map((structure.nodes || []).map((node) => [node.id, node]));
  const edgesByFrom = groupBy(structure.edges || [], (edge) => edge.from);
  const calendar = structure.calendar || {};
  const days = Math.max(1, integer(calendar.days, 1));
  const actionPointsPerDay = Math.max(1, integer(calendar.actionPointsPerDay, 1));
  const maxPlans = Math.max(1, integer(options.maxPlans, mindToy.cognitiveBudget?.maxBranches || 200));
  const maxDepth = Math.max(1, integer(options.maxDepth, mindToy.cognitiveBudget?.maxDepth || days * actionPointsPerDay));
  const initialFlags = new Set(structure.initialFlags || []);
  const initial = {
    nodeId: structure.startNodeId,
    day: 1,
    actionPoints: actionPointsPerDay,
    visited: new Set([structure.startNodeId]),
    flags: initialFlags,
    steps: [],
    score: 0,
    confidenceProduct: 1,
  };
  const plans = [];
  let branchExpansions = 0;

  function expand(state) {
    if (plans.length >= maxPlans) return;
    if (state.steps.length > 0) plans.push(serializePlan(state));
    if (state.steps.length >= maxDepth) return;
    const edges = edgesByFrom.get(state.nodeId) || [];
    for (const edge of edges) {
      if (plans.length >= maxPlans) break;
      if (!requirementsMet(edge.requires, state.flags)) continue;
      const target = nodes.get(edge.to);
      if (!target || target.availability === "hidden" || target.availability === "anticipated") continue;
      if (state.visited.has(target.id) && edge.repeatable !== true) continue;
      const spent = spendActionPoints(state.day, state.actionPoints, days, actionPointsPerDay, edge.actionCost);
      if (!spent) continue;
      branchExpansions += 1;
      const contribution = mapNodeContribution(mindToy, structure, target);
      const nextFlags = new Set(state.flags);
      for (const flag of target.grants || []) nextFlags.add(flag);
      for (const flag of edge.grants || []) nextFlags.add(flag);
      const nextVisited = new Set(state.visited);
      nextVisited.add(target.id);
      expand({
        nodeId: target.id,
        day: spent.day,
        actionPoints: spent.actionPoints,
        visited: nextVisited,
        flags: nextFlags,
        steps: [...state.steps, {
          edgeId: edge.id,
          from: edge.from,
          to: edge.to,
          day: spent.day,
          actionPointsAfter: spent.actionPoints,
          scoreContribution: contribution.score,
          confidence: contribution.confidence,
        }],
        score: state.score + contribution.score,
        confidenceProduct: state.confidenceProduct * contribution.confidence,
      });
    }
  }

  expand(initial);
  const ranking = plans.sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.steps.length - b.steps.length);
  const uniqueScores = new Set(ranking.map((plan) => round(plan.score)));
  return {
    schema: "mind_attempt_result_v0",
    model: mindToy.model,
    selected: ranking[0] || null,
    ranking,
    trace: {
      consideredOptions: ranking.length,
      scoredOptions: ranking.length,
      meaningfulComparisons: Math.max(0, uniqueScores.size - 1),
      decisionRelevantBranches: uniqueScores.size > 1 ? ranking.length : 0,
      branchExpansions,
      maxDepth: ranking.reduce((max, plan) => Math.max(max, plan.steps.length), 0),
      uncertaintyCount: ranking.filter((plan) => plan.confidence < 0.9999).length,
      structureOperations: ["map_expand", "prerequisite_check", "calendar_budget", "route_ranking"],
      truncated: plans.length >= maxPlans,
    },
  };
}

function attemptStateTransition(mindToy, options = {}) {
  const structure = mindToy.structure;
  if (structure.representation === "factorized_additive") return attemptFactorizedStateTransition(mindToy, options);
  const states = new Map((structure.states || []).map((state) => [state.id, state]));
  const actionsByState = groupBy(structure.actions || [], (action) => action.fromStateId);
  const horizon = Math.max(1, integer(options.horizon, structure.horizon || 1));
  const matrices = buildTransitionMatrices(mindToy, structure);
  let branchExpansions = 0;
  let deepest = 0;

  function stateValue(stateId, remaining, path) {
    deepest = Math.max(deepest, horizon - remaining);
    const state = states.get(stateId);
    if (!state) return { value: 0, confidence: 0, plan: [], cycleCut: false };
    if (remaining <= 0 || state.terminal === true) {
      const estimate = estimateById(mindToy, state.valueEstimateId);
      return { value: scalarExpected(estimate) ?? 0, confidence: estimate?.confidence ?? 0, plan: [], cycleCut: false };
    }
    const actions = actionsByState.get(stateId) || [];
    if (actions.length === 0) {
      const estimate = estimateById(mindToy, state.valueEstimateId);
      return { value: scalarExpected(estimate) ?? 0, confidence: estimate?.confidence ?? 0, plan: [], cycleCut: false };
    }
    const ranked = [];
    for (const action of actions) {
      const estimate = estimateById(mindToy, action.transitionEstimateId);
      const outcomes = stateOutcomes(estimate);
      if (!outcomes.length) continue;
      branchExpansions += outcomes.length;
      let expected = immediateValue(mindToy, action);
      let confidence = number(estimate.confidence);
      const children = [];
      for (const outcome of outcomes) {
        const childPath = new Set(path);
        const cycleKey = `${outcome.stateId}:${remaining - 1}`;
        if (childPath.has(cycleKey)) {
          children.push({ ...outcome, value: 0, plan: [], cycleCut: true });
          continue;
        }
        childPath.add(cycleKey);
        const child = stateValue(outcome.stateId, remaining - 1, childPath);
        expected += outcome.probability * child.value;
        confidence *= Math.max(0.0001, child.confidence || 1);
        children.push({ ...outcome, value: round(child.value), plan: child.plan, cycleCut: child.cycleCut });
      }
      ranked.push({
        actionId: action.id,
        label: action.label || action.id,
        score: round(expected),
        confidence: round(confidence),
        outcomes: children,
      });
    }
    ranked.sort((a, b) => b.score - a.score || b.confidence - a.confidence);
    const best = ranked[0];
    return best
      ? { value: best.score, confidence: best.confidence, plan: [best.actionId, ...(best.outcomes[0]?.plan || [])], ranked, cycleCut: false }
      : { value: 0, confidence: 0, plan: [], ranked: [], cycleCut: false };
  }

  const initial = stateValue(structure.initialStateId, horizon, new Set([`${structure.initialStateId}:${horizon}`]));
  const ranking = initial.ranked || [];
  return {
    schema: "mind_attempt_result_v0",
    model: mindToy.model,
    selected: ranking[0] || null,
    ranking,
    transitionMatrices: matrices,
    trace: {
      consideredOptions: ranking.length,
      scoredOptions: ranking.length,
      meaningfulComparisons: distinctScoreCount(ranking) - (ranking.length ? 1 : 0),
      decisionRelevantBranches: distinctScoreCount(ranking) > 1 ? ranking.length : 0,
      branchExpansions,
      maxDepth: deepest,
      uncertaintyCount: Object.values(mindToy.estimates).filter((estimate) => estimate.value?.kind === "state_distribution" && estimate.confidence < 1).length,
      structureOperations: ["transition_matrix", "multi_step_expectation", "backward_value"],
    },
  };
}

function attemptFactorizedStateTransition(mindToy, options = {}) {
  const structure = mindToy.structure;
  const slots = structure.slots || [];
  const actions = structure.actions || [];
  const beamWidth = Math.max(1, integer(options.beamWidth, mindToy.cognitiveBudget?.beamWidth || structure.searchBudget?.beamWidth || 300));
  const resultLimit = Math.max(1, integer(options.resultLimit, mindToy.cognitiveBudget?.resultLimit || 20));
  const initialMetrics = { ...(structure.initialState?.metrics || {}) };
  let frontier = [{
    slotIndex: 0,
    metrics: initialMetrics,
    giWeightedTotal: 0,
    glWeightTotal: 0,
    preferenceTotal: 0,
    selectedActionIds: [],
    selectedCategories: [],
    confidenceProduct: 1,
    trace: [],
  }];
  let branchExpansions = 0;
  let prunedBranches = 0;
  const unknownActionIds = new Set();

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    const slot = slots[slotIndex];
    const next = [];
    for (const state of frontier) {
      for (const action of actions) {
        if (!(action.allowedSlotIds || []).includes(slot.id)) continue;
        if (structure.noRepeat !== false && state.selectedActionIds.includes(action.id)) continue;
        const featuresEstimate = estimateById(mindToy, action.featureEstimateId);
        if (featuresEstimate?.status === "unknown" || featuresEstimate?.value?.kind !== "feature_vector") {
          unknownActionIds.add(action.id);
          continue;
        }
        const preferenceEstimate = action.preferenceEstimateId ? estimateById(mindToy, action.preferenceEstimateId) : null;
        if (action.preferenceEstimateId && scalarExpected(preferenceEstimate) == null) {
          unknownActionIds.add(action.id);
          continue;
        }
        branchExpansions += 1;
        next.push(applyFactorizedAction(state, slot, action, featuresEstimate, preferenceEstimate, structure));
      }
    }
    for (const state of next) {
      state.partialScore = scoreFactorizedState(state, structure, slotIndex + 1, slots.length).score;
    }
    next.sort((a, b) => b.partialScore - a.partialScore || b.confidenceProduct - a.confidenceProduct);
    if (next.length > beamWidth) prunedBranches += next.length - beamWidth;
    frontier = next.slice(0, beamWidth);
    if (frontier.length === 0) break;
  }

  const rawRanking = frontier.map((state) => {
    const scored = scoreFactorizedState(state, structure, slots.length, slots.length);
    return {
      id: state.selectedActionIds.join("->"),
      selectedActionIds: state.selectedActionIds,
      score: scored.score,
      dimensionScores: scored.dimensionScores,
      finalMetrics: scored.finalMetrics,
      confidence: round(Math.pow(state.confidenceProduct, 1 / Math.max(1, state.selectedActionIds.length))),
      steps: state.trace,
    };
  }).sort((a, b) => b.score - a.score || b.confidence - a.confidence);
  const compressed = compressEquivalentPlans(rawRanking, structure.equivalence);
  const ranking = compressed.ranking.slice(0, resultLimit);
  const distinctScores = distinctScoreCount(ranking);
  return {
    schema: "mind_attempt_result_v0",
    model: mindToy.model,
    representation: structure.representation,
    selected: ranking[0] || null,
    ranking,
    trace: {
      consideredOptions: ranking.length,
      scoredOptions: ranking.length,
      meaningfulComparisons: Math.max(0, distinctScores - 1),
      decisionRelevantBranches: distinctScores > 1 ? ranking.length : 0,
      branchExpansions,
      prunedBranches,
      equivalentPlansCompressed: compressed.removed,
      maxDepth: slots.length,
      uncertaintyCount: Object.values(mindToy.estimates).filter((estimate) => estimate.confidence < 0.9999).length,
      unknownActionIds: [...unknownActionIds].sort(),
      structureOperations: ["factorized_state_update", "closed_world_features", "beam_search", "terminal_multi_value_ranking"],
    },
  };
}

function compressEquivalentPlans(ranking, equivalence = {}) {
  if (equivalence.mode !== "selected_set") return { ranking, removed: 0 };
  const seen = new Set();
  const kept = [];
  for (const plan of ranking) {
    const key = [...plan.selectedActionIds].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(plan);
  }
  return { ranking: kept, removed: ranking.length - kept.length };
}

function applyFactorizedAction(state, slot, action, featuresEstimate, preferenceEstimate, structure) {
  const features = featuresEstimate.value.values;
  const metrics = { ...state.metrics };
  for (const feature of structure.aggregation?.additiveFeatures || []) {
    metrics[feature] = number(metrics[feature]) + number(features[feature]);
  }
  const gi = number(features[structure.aggregation?.giFeature || "gi"]);
  const gl = number(features[structure.aggregation?.glFeature || "gl"]);
  const preference = scalarExpected(preferenceEstimate) ?? 0;
  const confidence = number(featuresEstimate.confidence) * (preferenceEstimate ? number(preferenceEstimate.confidence) : 1);
  return {
    slotIndex: state.slotIndex + 1,
    metrics,
    giWeightedTotal: state.giWeightedTotal + gi * gl,
    glWeightTotal: state.glWeightTotal + gl,
    preferenceTotal: state.preferenceTotal + preference,
    selectedActionIds: [...state.selectedActionIds, action.id],
    selectedCategories: [...state.selectedCategories, action.category || action.id],
    confidenceProduct: state.confidenceProduct * Math.max(0.0001, confidence),
    trace: [...state.trace, {
      slotId: slot.id,
      actionId: action.id,
      addedFeatures: Object.fromEntries((structure.aggregation?.additiveFeatures || []).map((feature) => [feature, number(features[feature])])),
      preference: round(preference),
    }],
  };
}

function scoreFactorizedState(state, structure, selectedCount, totalSlots) {
  const finalMetrics = { ...state.metrics };
  finalMetrics.dailyGI = state.glWeightTotal > 0 ? state.giWeightedTotal / state.glWeightTotal : 0;
  finalMetrics.averagePreference = selectedCount > 0 ? state.preferenceTotal / selectedCount : 0;
  finalMetrics.categoryVariety = selectedCount > 0 ? new Set(state.selectedCategories).size / selectedCount : 0;

  const projected = { ...finalMetrics };
  if (selectedCount > 0 && selectedCount < totalSlots) {
    const scale = totalSlots / selectedCount;
    for (const feature of structure.aggregation?.additiveFeatures || []) projected[feature] = number(finalMetrics[feature]) * scale;
  }

  const dimensions = structure.terminalScoring?.dimensions || [];
  const totalWeight = dimensions.reduce((sum, dimension) => sum + Math.abs(number(dimension.weight)), 0) || 1;
  let score = 0;
  const dimensionScores = [];
  for (const dimension of dimensions) {
    const raw = number(projected[dimension.source]);
    const utility = dimensionUtility(raw, dimension);
    const normalizedWeight = number(dimension.weight) / totalWeight;
    const contribution = utility * normalizedWeight;
    score += contribution;
    dimensionScores.push({
      id: dimension.id,
      raw: round(raw),
      utility: round(utility),
      weight: round(normalizedWeight),
      contribution: round(contribution),
    });
  }
  return { score: round(score), dimensionScores, finalMetrics: roundObject(finalMetrics) };
}

function dimensionUtility(raw, dimension) {
  if (dimension.utility === "target_range") {
    const min = number(dimension.target?.[0]);
    const max = number(dimension.target?.[1]);
    if (raw >= min && raw <= max) return 1;
    const distance = raw < min ? min - raw : raw - max;
    return Math.max(0, 1 - distance / Math.max(0.0001, number(dimension.tolerance) || Math.max(1, max - min)));
  }
  if (dimension.utility === "max_limit") {
    const limit = number(dimension.limit);
    if (raw <= limit) return 1;
    return Math.max(0, 1 - (raw - limit) / Math.max(0.0001, number(dimension.tolerance) || Math.max(1, limit)));
  }
  if (dimension.utility === "min_limit") {
    const limit = number(dimension.limit);
    if (raw >= limit) return 1;
    return Math.max(0, 1 - (limit - raw) / Math.max(0.0001, number(dimension.tolerance) || Math.max(1, limit)));
  }
  if (dimension.utility === "maximize") {
    const min = number(dimension.scale?.[0]);
    const max = number(dimension.scale?.[1]);
    return Math.max(0, Math.min(1, (raw - min) / Math.max(0.0001, max - min)));
  }
  if (dimension.utility === "minimize") {
    const min = number(dimension.scale?.[0]);
    const max = number(dimension.scale?.[1]);
    return 1 - Math.max(0, Math.min(1, (raw - min) / Math.max(0.0001, max - min)));
  }
  return 0;
}

function rankingResult(model, rows, trace) {
  const available = rows.filter((row) => row.availability === "available" && row.score != null);
  available.sort((a, b) => b.score - a.score || b.confidence - a.confidence);
  const meaningfulComparisons = Math.max(0, distinctScoreCount(available) - 1);
  return {
    schema: "mind_attempt_result_v0",
    model,
    selected: available[0] || null,
    ranking: available,
    excluded: rows.filter((row) => row.availability !== "available" || row.score == null),
    trace: {
      consideredOptions: available.length,
      scoredOptions: available.length,
      meaningfulComparisons,
      decisionRelevantBranches: meaningfulComparisons > 0 ? available.length : 0,
      uncertaintyCount: available.filter((row) => row.confidence < 0.9999).length,
      ...trace,
    },
  };
}

function mapNodeContribution(mindToy, structure, node) {
  if (structure.routeScoring?.model === MODEL_TYPES.MULTI_RANKING) {
    const dimensions = structure.routeScoring.dimensions || [];
    const totalWeight = dimensions.reduce((sum, row) => sum + Math.abs(number(row.weight)), 0) || 1;
    let score = 0;
    let confidence = 0;
    let coverage = 0;
    for (const dimension of dimensions) {
      const estimate = estimateById(mindToy, node.valueEstimateIds?.[dimension.id]);
      const expected = scalarExpected(estimate);
      if (expected == null) continue;
      const normalizedWeight = number(dimension.weight) / totalWeight;
      score += expected * normalizedWeight * (dimension.direction === "minimize" ? -1 : 1);
      confidence += Math.abs(normalizedWeight) * number(estimate.confidence);
      coverage += Math.abs(normalizedWeight);
    }
    return { score: round(score), confidence: coverage ? round(confidence / coverage) : 0 };
  }
  const estimate = estimateById(mindToy, node.valueEstimateId);
  return { score: scalarExpected(estimate) ?? 0, confidence: estimate?.confidence ?? 0 };
}

function serializePlan(state) {
  return {
    id: state.steps.map((step) => step.edgeId).join("->"),
    endNodeId: state.nodeId,
    score: round(state.score),
    confidence: round(Math.pow(state.confidenceProduct, 1 / state.steps.length)),
    day: state.day,
    actionPointsRemaining: state.actionPoints,
    steps: state.steps,
    flags: [...state.flags].sort(),
  };
}

function spendActionPoints(day, remaining, totalDays, perDay, rawCost) {
  const cost = Math.max(0, integer(rawCost, 1));
  if (cost > perDay) return null;
  if (cost <= remaining) return { day, actionPoints: remaining - cost };
  if (day >= totalDays) return null;
  return { day: day + 1, actionPoints: perDay - cost };
}

function requirementsMet(requirements, flags) {
  return (requirements || []).every((requirement) => flags.has(requirement));
}

function buildTransitionMatrices(mindToy, structure) {
  const stateIds = (structure.states || []).map((state) => state.id);
  const matrices = {};
  for (const action of structure.actions || []) {
    const row = Object.fromEntries(stateIds.map((id) => [id, 0]));
    for (const outcome of stateOutcomes(estimateById(mindToy, action.transitionEstimateId))) {
      row[outcome.stateId] = round(outcome.probability);
    }
    matrices[action.id] = { fromStateId: action.fromStateId, probabilities: row };
  }
  return matrices;
}

function immediateValue(mindToy, action) {
  const estimate = estimateById(mindToy, action.immediateValueEstimateId);
  return scalarExpected(estimate) ?? 0;
}

function stateOutcomes(estimate) {
  if (estimate?.status === "unknown" || estimate?.value?.kind !== "state_distribution") return [];
  return estimate.value.outcomes.map((outcome) => ({ stateId: outcome.stateId, probability: number(outcome.probability) }));
}

function scalarExpected(estimate) {
  if (!estimate || estimate.status === "unknown" || !estimate.value) return null;
  if (estimate.value.kind === "scalar") return number(estimate.value.expected);
  if (estimate.value.kind === "outcome_distribution") {
    return estimate.value.outcomes.reduce((sum, outcome) => sum + number(outcome.probability) * number(outcome.scalarValue), 0);
  }
  return null;
}

function estimateById(mindToy, id) {
  return id ? mindToy.estimates?.[id] || null : null;
}

function groupBy(rows, keyFn) {
  const result = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(row);
  }
  return result;
}

function distinctScoreCount(rows) {
  return new Set(rows.map((row) => round(row.score))).size;
}

function integer(value, fallback) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Number(number(value).toFixed(4));
}

function roundObject(value) {
  return Object.fromEntries(Object.entries(value || {}).map(([key, row]) => [key, typeof row === "number" ? round(row) : row]));
}

module.exports = {
  attempt,
  attemptFactorizedStateTransition,
  attemptMap,
  attemptMultiRanking,
  attemptSingleRanking,
  attemptStateTransition,
};
