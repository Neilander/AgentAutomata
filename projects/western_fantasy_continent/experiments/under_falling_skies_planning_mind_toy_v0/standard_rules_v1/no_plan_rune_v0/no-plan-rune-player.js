"use strict";

const SEMANTIC = require("../../semantic-space");
const ENGINE = require("../standard-engine");

function buildCurrentNeed(space, map, state) {
  const nearestShip = state.ships.length ? Math.max(...state.ships.map((ship) => ship.row)) : 0;
  const shipPressure = clamp(nearestShip / map.sky.cityRow);
  const mothershipPressure = clamp((state.mothershipRow + 1) / (map.sky.skullRow + 1));
  const damagePressure = clamp(state.damage / map.city.maxDamage);
  const danger = Math.max(shipPressure, mothershipPressure, damagePressure);
  const energyGap = clamp(1 - state.energy / map.city.maxEnergy);
  const multiResearchUnlocked = map.base.rooms
    .filter((room) => room.type === "research" && room.cellIds.length > 1)
    .some((room) => room.cellIds.every((cellId) => map.base.cells.find((cell) => cell.id === cellId).unlockIndex <= state.excavatorIndex));

  // These are present-state activations of rule knowledge, not a route,
  // milestone list, hypothesis, or prediction of later turns.
  const weights = {
    research: 1,
    survival: 0.75 + danger,
    energy: 0.15 + energyGap,
    defense: 0.15 + shipPressure + 0.5 * damagePressure,
    infrastructure: multiResearchUnlocked ? 0.05 : 0.35,
    stability: 0.1 + 0.6 * danger,
    immediate: 0.05 + 0.7 * danger,
    delayed: 0.12 * (1 - danger),
    flexibility: 0.08,
  };
  return {
    vector: SEMANTIC.weightedVector(space, weights),
    weights: roundObject(weights),
    facts: {
      shipPressure: round(shipPressure),
      mothershipPressure: round(mothershipPressure),
      damagePressure: round(damagePressure),
      energyGap: round(energyGap),
      multiResearchUnlocked,
    },
  };
}

function chooseWorkerPlacement(space, map, state, options = {}) {
  const need = buildCurrentNeed(space, map, state);
  const candidates = ENGINE.allLegalWorkerPlacements(map, state).map((placement) => {
    const simulated = ENGINE.applyWorkerPlacement(map, state, placement);
    const effects = placementEffects(map, state, simulated, placement);
    const coordinate = rawEffectCoordinate(space, effects);
    return {
      id: placement.id,
      option: placement,
      effects: roundObject(effects),
      coordinate,
      score: SEMANTIC.dot(need.vector, coordinate),
    };
  });
  return selectCandidate(candidates, need, options.traceLimit);
}

function chooseRoomAction(space, map, state, options = {}) {
  const need = buildCurrentNeed(space, map, state);
  const candidates = [];
  for (const action of ENGINE.legalRoomActions(map, state)) {
    if (action.affordable === false || action.roomType === "robot") continue;
    try {
      const simulated = ENGINE.applyRoomAction(map, state, action);
      const effects = roomActionEffects(map, state, simulated, action);
      const coordinate = rawEffectCoordinate(space, effects);
      candidates.push({
        id: actionId(action),
        option: action,
        effects: roundObject(effects),
        coordinate,
        score: SEMANTIC.dot(need.vector, coordinate),
      });
    } catch {
      // An action that needs extra parameters is not a candidate for this
      // Roswell A+B baseline. The real map contains no robot rooms.
    }
  }
  if (!candidates.length) {
    const fallback = { type: "end_rooms" };
    candidates.push({ id: "end_rooms", option: fallback, effects: {}, coordinate: Array(space.dimensions).fill(0), score: 0 });
  }
  return selectCandidate(candidates, need, options.traceLimit);
}

function selectCandidate(candidates, need, traceLimit = 5) {
  const sorted = [...candidates].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const selected = sorted[0];
  if (!selected) throw new Error("no rune candidate");
  return {
    selected: selected.option,
    score: round(selected.score),
    coordinate: selected.coordinate,
    effects: selected.effects,
    need: { weights: need.weights, facts: need.facts },
    topCandidates: sorted.slice(0, traceLimit).map((candidate) => ({
      id: candidate.id,
      score: round(candidate.score),
      effects: candidate.effects,
    })),
    contract: {
      planner: false,
      memory: false,
      hypotheses: false,
      milestones: false,
      lookaheadActions: 1,
      finalScoring: "768d_dot_product_only",
    },
  };
}

function placementEffects(map, before, after, placement) {
  const effects = {};
  const room = map.base.rooms.find((candidate) => candidate.id === placement.roomId);
  if (placement.excavationCandidate) {
    add(effects, "infrastructure", 0.55 + 0.08 * placement.excavationDistance);
    add(effects, "delayed", 0.25);
  } else if (room) {
    const value = Math.max(0, placement.dieValue + room.modifier) / 6 / room.cellIds.length;
    if (room.type === "energy") add(effects, "energy", value);
    if (room.type === "research") add(effects, "research", value);
    if (room.type === "fighter") {
      add(effects, "defense", value);
      add(effects, "survival", 0.35 * value);
    }
    if (room.type === "aa") add(effects, "defense", 0.18);
    if (room.energyCost) add(effects, "energy", -room.energyCost / map.city.maxEnergy);
  }
  addStateDeltaEffects(map, before, after, effects);
  return effects;
}

function roomActionEffects(map, before, after, action) {
  const effects = {};
  addStateDeltaEffects(map, before, after, effects);
  if (action.type === "end_rooms") add(effects, "flexibility", 0.01);
  if (action.type === "skip_worker") add(effects, "stability", -0.03);
  return effects;
}

function addStateDeltaEffects(map, before, after, effects) {
  const energyDelta = after.energy - before.energy;
  const researchDelta = after.researchIndex - before.researchIndex;
  const excavationDelta = after.excavatorIndex - before.excavatorIndex;
  const damageDelta = after.damage - before.damage;
  const mothershipDelta = after.mothershipRow - before.mothershipRow;
  const beforeShips = new Map(before.ships.map((ship) => [ship.id, ship]));
  const afterShips = new Map(after.ships.map((ship) => [ship.id, ship]));
  let shipAdvance = 0;
  for (const [id, ship] of afterShips) {
    const previous = beforeShips.get(id);
    if (previous) shipAdvance += Math.max(0, ship.row - previous.row);
  }
  const destroyedOrRemoved = Math.max(0, before.ships.length - after.ships.length - damageDelta);

  if (energyDelta) add(effects, "energy", energyDelta / map.city.maxEnergy);
  if (researchDelta) {
    add(effects, "research", researchDelta / 3);
    add(effects, "immediate", 0.12 * researchDelta);
  }
  if (excavationDelta) {
    add(effects, "infrastructure", excavationDelta / map.base.excavatorPath.length);
    add(effects, "delayed", 0.1);
  }
  if (destroyedOrRemoved) {
    add(effects, "defense", 0.45 * destroyedOrRemoved);
    add(effects, "survival", 0.25 * destroyedOrRemoved);
    add(effects, "immediate", 0.15 * destroyedOrRemoved);
  }
  if (shipAdvance) {
    add(effects, "defense", -shipAdvance / map.sky.cityRow);
    add(effects, "survival", -0.6 * shipAdvance / map.sky.cityRow);
    add(effects, "risk", 0.3 * shipAdvance / map.sky.cityRow);
  }
  if (damageDelta) {
    add(effects, "survival", -1.6 * damageDelta);
    add(effects, "stability", -0.9 * damageDelta);
    add(effects, "risk", 0.5 * damageDelta);
  }
  if (mothershipDelta) {
    add(effects, "survival", -1.1 * mothershipDelta);
    add(effects, "stability", -0.5 * mothershipDelta);
  }
  if (after.outcome?.result === "win") add(effects, "research", 4);
  if (after.outcome?.result === "loss") {
    add(effects, "survival", -5);
    add(effects, "stability", -3);
  }
}

function rawEffectCoordinate(space, effects) {
  const vector = Array(space.dimensions).fill(0);
  for (const [conceptId, strength] of Object.entries(effects)) {
    if (!strength) continue;
    const concept = space.concepts[conceptId];
    if (!concept) throw new Error(`unknown rule knowledge concept: ${conceptId}`);
    for (let index = 0; index < vector.length; index += 1) vector[index] += concept.vector[index] * strength;
  }
  return vector;
}

function actionId(action) {
  if (action.type === "resolve_room") return `resolve:${action.roomId}`;
  if (action.type === "excavate") return `excavate:${action.placementId}`;
  if (action.type === "skip_worker") return `skip:${action.placementId}`;
  if (action.type === "remove_robot") return `remove:${action.robotId}`;
  return action.type;
}

function add(target, key, value) {
  target[key] = (target[key] || 0) + value;
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function round(value) {
  return Math.round(value * 1e6) / 1e6;
}

function roundObject(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, round(value)]));
}

module.exports = {
  buildCurrentNeed,
  chooseRoomAction,
  chooseWorkerPlacement,
  rawEffectCoordinate,
};
