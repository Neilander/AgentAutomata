"use strict";

const CONFIG = require("./game-config");
const ENGINE = require("./game-engine");
const SEMANTIC = require("./semantic-space");

const PROFILES = Object.freeze({
  steady: {
    id: "steady",
    label: "稳健型",
    conceptWeights: { survival: 0.45, stability: 0.4, defense: 0.22, flexibility: 0.2 },
    riskAversion: 0.9,
    delayDiscount: 0.28,
    lossAversion: 0.9,
  },
  researchDriven: {
    id: "researchDriven",
    label: "研究冲刺型",
    conceptWeights: { research: 0.55, immediate: 0.22, risk: 0.22, survival: 0.12 },
    riskAversion: 0.3,
    delayDiscount: 0.12,
    lossAversion: 0.45,
  },
  builder: {
    id: "builder",
    label: "长期建设型",
    conceptWeights: { infrastructure: 0.55, delayed: 0.42, energy: 0.25, flexibility: 0.2 },
    riskAversion: 0.55,
    delayDiscount: 0.06,
    lossAversion: 0.65,
  },
});

const HYPOTHESES = Object.freeze({
  research_rush: {
    id: "research_rush",
    label: "研究冲刺",
    statement: "更快推进研究，就能在母舰到达前完成武器并获胜",
    conceptWeights: { research: 1.1, energy: 0.25, immediate: 0.25, risk: 0.15 },
  },
  defense_first: {
    id: "defense_first",
    label: "防御优先",
    statement: "先控制敌机和基地伤害，就能活到完成研究",
    conceptWeights: { defense: 1.1, survival: 1, stability: 0.35, energy: 0.15 },
  },
  infrastructure_first: {
    id: "infrastructure_first",
    label: "建设优先",
    statement: "先挖掘基地并建立能源设施，后续强力房间会带来更高总收益",
    conceptWeights: { infrastructure: 1.1, delayed: 0.8, energy: 0.45, research: 0.2 },
  },
});

function composeGoal(space, state, profile, hypothesis, options = {}) {
  const weights = {};
  const components = [];
  // The mission is shared by every player. A personality changes the preferred
  // path to victory; it must not replace the actual objective with an obsession.
  addWeights(weights, components, "task_objective", {
    research: 0.85,
    survival: 0.55,
    energy: 0.12,
  });
  addWeights(weights, components, "player_value", profile.conceptWeights);
  addWeights(weights, components, "hypothesis", hypothesis.conceptWeights);
  if (!options.freezeContext) {
    const nearest = state.ships.length ? Math.max(...state.ships.map((ship) => ship.row)) / CONFIG.CITY_ROW : 0;
    const damagePressure = state.damage / CONFIG.MAX_DAMAGE;
    const timePressure = state.mothership / CONFIG.MOTHERSHIP_LIMIT;
    const energyNeed = 1 - state.energy / CONFIG.MAX_ENERGY;
    const researchNear = state.research / CONFIG.RESEARCH_TARGET;
    const excavationRoom = 1 - state.excavatorDepth / CONFIG.MAX_EXCAVATION;
    addWeights(weights, components, "current_danger", {
      survival: 1.1 * nearest + 0.9 * damagePressure + 0.3 * timePressure,
      defense: 1.2 * nearest + 0.6 * damagePressure,
      immediate: 0.7 * nearest + 0.5 * timePressure,
    });
    addWeights(weights, components, "resource_gap", { energy: 1.1 * energyNeed });
    addWeights(weights, components, "victory_distance", {
      research: 0.25 + 0.6 * researchNear + 0.5 * timePressure,
      infrastructure: 0.6 * excavationRoom * (1 - timePressure),
      delayed: 0.35 * (1 - timePressure),
    });
  }
  return {
    vector: SEMANTIC.weightedVector(space, weights),
    weights: roundObject(weights),
    components: components.map((row) => ({ ...row, weights: roundObject(row.weights) })),
  };
}

function chooseMicroDecision(space, state, profile, hypothesis, options = {}) {
  const goal = options.goal || composeGoal(space, state, profile, hypothesis, options);
  const candidates = ENGINE.allLegalPlacements(state).map((placement) => {
    const option = space.roomTypes[placement.roomType];
    const semanticFit = SEMANTIC.dot(goal.vector, option.vector);
    const structured = structuredPlacementValue(state, placement, profile);
    return { placement, semanticFit, structured };
  });
  const semanticallyRecalled = [...candidates]
    .sort((a, b) => b.semanticFit - a.semanticFit || b.placement.dieValue - a.placement.dieValue || a.placement.id.localeCompare(b.placement.id))
    .slice(0, Math.min(options.recallLimit || 15, candidates.length));
  const fitRange = rangeNormalizer(semanticallyRecalled.map((row) => row.semanticFit));
  const scored = semanticallyRecalled.map((row) => ({
    ...row,
    // Semantic space recalls choices in the right conceptual direction. The
    // concrete board calculation then decides whether a recalled choice works.
    score: 0.38 * fitRange(row.semanticFit) + 0.62 * row.structured.value,
  })).sort((a, b) => b.score - a.score || b.structured.confidence - a.structured.confidence || a.placement.id.localeCompare(b.placement.id));
  const selected = scored[0];
  if (!selected) throw new Error("no legal planning candidate");
  return {
    selected: selected.placement,
    goal,
    topCandidates: scored.slice(0, 3).map(traceCandidate),
    recalledCount: semanticallyRecalled.length,
    legalCount: candidates.length,
  };
}

function planHypothesis(space, inputState, profile, hypothesis, options = {}) {
  let state = ENGINE.cloneState(inputState);
  const trace = [];
  let guard = 0;
  const frozenGoal = options.freezeContext ? composeGoal(space, state, profile, hypothesis, { freezeContext: true }) : null;
  while (state.phase === "dice" && guard < 5) {
    const decision = chooseMicroDecision(space, state, profile, hypothesis, {
      recallLimit: options.recallLimit,
      freezeContext: options.freezeContext,
      goal: frozenGoal,
    });
    trace.push({
      step: trace.length + 1,
      stateBefore: stateSummary(state),
      goalWeights: decision.goal.weights,
      selected: decision.selected,
      topCandidates: decision.topCandidates,
    });
    state = ENGINE.applyPlacement(state, decision.selected, { rerollMode: "expected" });
    guard += 1;
  }
  if (state.phase === "rooms") state = ENGINE.resolveRooms(state);
  if (state.phase === "mothership" && !state.outcome) state = ENGINE.resolveMothership(state, { startNextRound: false });
  const utility = subjectiveUtility(state, profile);
  return {
    hypothesisId: hypothesis.id,
    hypothesisLabel: hypothesis.label,
    statement: hypothesis.statement,
    firstPlacement: trace[0]?.selected || null,
    trace,
    predictedState: stateSummary(state),
    utility,
    score: utility.total,
  };
}

function chooseNextPlacement(space, state, profile, options = {}) {
  const hypotheses = options.hypothesisIds
    ? options.hypothesisIds.map((id) => HYPOTHESES[id])
    : Object.values(HYPOTHESES);
  const plans = hypotheses.map((hypothesis) => planHypothesis(space, state, profile, hypothesis, options));
  plans.sort((a, b) => b.score - a.score || a.hypothesisId.localeCompare(b.hypothesisId));
  if (!plans[0]?.firstPlacement) throw new Error("planner produced no first placement");
  return {
    selected: plans[0].firstPlacement,
    selectedHypothesisId: plans[0].hypothesisId,
    plans,
  };
}

function structuredPlacementValue(state, placement, profile) {
  const roomValue = Math.max(0, placement.dieValue + placement.modifier);
  const timeRemaining = Math.max(0, 1 - state.mothership / CONFIG.MOTHERSHIP_LIMIT);
  const potentialEnergy = state.energy + state.placements
    .filter((row) => row.roomType === "energy")
    .reduce((sum, row) => sum + Math.max(0, row.dieValue + row.modifier), 0);
  let benefit = 0;
  let confidence = 0.9;
  if (placement.roomType === "energy") {
    benefit = Math.min(CONFIG.MAX_ENERGY - state.energy, roomValue) / CONFIG.MAX_ENERGY;
  } else if (placement.roomType === "research") {
    benefit = Math.min(CONFIG.RESEARCH_TARGET - state.research, roomValue) / CONFIG.RESEARCH_TARGET;
    if (potentialEnergy < placement.energyCost) benefit *= 0.1;
  } else if (placement.roomType === "fighter") {
    const movedRows = state.ships.map((ship) => ({
      ...ship,
      row: ship.column === placement.column ? ship.row + placement.dieValue : ship.row,
    }));
    const killable = movedRows.filter((ship) => {
      const threshold = CONFIG.EXPLOSION_SPACES[ship.column][ship.row];
      return threshold != null && threshold <= roomValue;
    }).length;
    benefit = Math.min(1, killable / Math.max(1, state.ships.length) + 0.15 * roomValue / 6);
    if (potentialEnergy < placement.energyCost) benefit *= 0.1;
  } else if (placement.roomType === "aa") {
    const threatened = state.ships.filter((ship) => ship.column === placement.column)
      .some((ship) => ship.row + placement.dieValue >= CONFIG.CITY_ROW);
    benefit = threatened ? 1 : Math.min(0.5, placement.dieValue / 12);
  } else if (placement.roomType === "excavate") {
    const depthGain = placement.depth - state.excavatorDepth;
    benefit = (depthGain / CONFIG.MAX_EXCAVATION) * timeRemaining * (1 - profile.delayDiscount);
    if (potentialEnergy < placement.energyCost) benefit *= 0.1;
    confidence = 0.75;
  }

  const ordinaryDescent = placement.dieValue;
  const actualDescent = Math.max(0, ordinaryDescent - (placement.roomType === "aa" ? 1 : 0));
  const projectedHits = state.ships.filter((ship) => ship.column === placement.column && ship.row + actualDescent >= CONFIG.CITY_ROW).length;
  const nearestAfter = state.ships
    .filter((ship) => ship.column === placement.column)
    .reduce((max, ship) => Math.max(max, Math.min(CONFIG.CITY_ROW, ship.row + actualDescent)), 0) / CONFIG.CITY_ROW;
  const riskPenalty = profile.riskAversion * (0.75 * projectedHits + 0.22 * nearestAfter);
  const whiteUncertainty = placement.dieColor === "white" && state.dice.filter((row) => !row.placed).length > 1
    ? 0.08 * profile.riskAversion
    : 0;
  return {
    value: clamp01(0.15 + 0.95 * benefit - riskPenalty - whiteUncertainty),
    benefit: round(benefit),
    riskPenalty: round(riskPenalty + whiteUncertainty),
    projectedHits,
    confidence,
  };
}

function subjectiveUtility(state, profile) {
  if (state.outcome?.result === "win") return { total: 100, win: 100, survival: 0, research: 0, infrastructure: 0, energy: 0 };
  if (state.outcome?.result === "loss") return { total: -100, win: -100, survival: 0, research: 0, infrastructure: 0, energy: 0 };
  const survival = 20 * (1 - state.damage / CONFIG.MAX_DAMAGE)
    + 8 * (1 - nearestShipRatio(state));
  const research = 62 * state.research / CONFIG.RESEARCH_TARGET;
  const infrastructure = 8 * state.excavatorDepth / CONFIG.MAX_EXCAVATION * (1 - profile.delayDiscount);
  const energy = 6 * state.energy / CONFIG.MAX_ENERGY;
  const time = -10 * state.mothership / CONFIG.MOTHERSHIP_LIMIT;
  const downside = -profile.lossAversion * 16 * state.damage / CONFIG.MAX_DAMAGE;
  const total = survival + research + infrastructure + energy + time + downside;
  return roundObject({ total, survival, research, infrastructure, energy, time, downside });
}

function nearestShipRatio(state) {
  return state.ships.length ? Math.max(...state.ships.map((ship) => ship.row)) / CONFIG.CITY_ROW : 0;
}

function stateSummary(state) {
  return {
    round: state.round,
    phase: state.phase,
    energy: state.energy,
    damage: state.damage,
    research: state.research,
    excavatorDepth: state.excavatorDepth,
    mothership: state.mothership,
    nearestShipRatio: round(nearestShipRatio(state)),
    dice: state.dice.filter((row) => !row.placed).map((row) => ({ id: row.id, color: row.color, value: row.value })),
    outcome: state.outcome,
  };
}

function traceCandidate(row) {
  return {
    placementId: row.placement.id,
    dieValue: row.placement.dieValue,
    dieColor: row.placement.dieColor,
    roomType: row.placement.roomType,
    column: row.placement.column,
    semanticFit: round(row.semanticFit),
    structuredValue: round(row.structured.value),
    score: round(row.score),
    projectedHits: row.structured.projectedHits,
  };
}

function addWeights(target, components, source, additions) {
  const nonzero = {};
  for (const [key, value] of Object.entries(additions)) {
    if (!value) continue;
    target[key] = (target[key] || 0) + value;
    nonzero[key] = value;
  }
  components.push({ source, weights: nonzero });
}

function rangeNormalizer(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (value) => max - min < 1e-9 ? 0.5 : (value - min) / (max - min);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundObject(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]));
}

module.exports = {
  HYPOTHESES,
  PROFILES,
  chooseMicroDecision,
  chooseNextPlacement,
  composeGoal,
  planHypothesis,
  stateSummary,
  structuredPlacementValue,
  subjectiveUtility,
};
