"use strict";

const ENGINE = require("../standard-engine");

const HIDDEN_KEYS = new Set(["seed", "rngState", "history", "nextWhiteId", "nextRobotId"]);

function publicObservation(map, state) {
  return {
    schema: "ufs_public_observation_v1",
    mapId: state.mapId,
    round: state.round,
    phase: state.phase,
    energy: state.energy,
    damage: state.damage,
    researchIndex: state.researchIndex,
    excavatorIndex: state.excavatorIndex,
    mothershipRow: state.mothershipRow,
    ships: structuredClone(state.ships),
    waitingShips: structuredClone(state.waitingShips),
    dice: state.dice.map((die) => ({ id: die.id, color: die.color, value: die.value, placed: die.placed })),
    placements: structuredClone(state.placements),
    robots: structuredClone(state.robots),
    outcome: structuredClone(state.outcome),
    publicLimits: {
      maxEnergy: map.city.maxEnergy,
      maxDamage: map.city.maxDamage,
      researchSpaces: map.research.costs.length,
      skullRow: map.sky.skullRow,
      cityRow: map.sky.cityRow,
    },
  };
}

function publicLegalActions(map, state) {
  if (state.outcome) return [];
  if (state.phase === "dice") {
    return ENGINE.allLegalWorkerPlacements(map, state).map((placement) => ({
      id: `worker:${placement.id}`,
      kind: "worker_placement",
      placement: structuredClone(placement),
    }));
  }
  if (state.phase === "rooms") {
    const actions = ENGINE.legalRoomActions(map, state)
      .filter((action) => action.affordable !== false && action.roomType !== "robot")
      .filter((action) => !["skip_worker", "remove_robot"].includes(action.type));
    return actions.map((action) => ({ id: roomActionId(action), kind: "room_action", action: structuredClone(action) }));
  }
  if (state.phase === "mothership") return [{ id: "environment:resolve_mothership", kind: "environment" }];
  return [];
}

function applyPublicAction(map, state, actionId, policy = null) {
  const legal = publicLegalActions(map, state);
  const selected = legal.find((action) => action.id === actionId);
  if (!selected) throw new Error(`player selected non-public or illegal action: ${actionId}`);
  if (selected.kind === "worker_placement") return ENGINE.applyWorkerPlacement(map, state, selected.placement);
  if (selected.kind === "room_action") return ENGINE.applyRoomAction(map, state, selected.action);
  if (selected.kind === "environment") {
    const observation = publicObservation(map, state);
    return ENGINE.resolveMothership(map, state, {
      spawnPolicy: ({ waiting, candidates }) => {
        const publicInput = { waiting: structuredClone(waiting), candidates: [...candidates], observation };
        const chosen = policy?.chooseSpawnColumn ? policy.chooseSpawnColumn(publicInput) : Math.min(...candidates);
        if (!candidates.includes(chosen)) throw new Error(`policy chose illegal spawn column: ${chosen}`);
        return chosen;
      },
    });
  }
  throw new Error(`unsupported public action kind: ${selected.kind}`);
}

function assertObservationSafe(observation) {
  const violations = [];
  scan(observation, "observation", violations);
  return { ok: violations.length === 0, violations };
}

function scan(value, path, violations) {
  if (Array.isArray(value)) return value.forEach((item, index) => scan(item, `${path}[${index}]`, violations));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (HIDDEN_KEYS.has(key)) violations.push(`${path}.${key}`);
    scan(item, `${path}.${key}`, violations);
  }
}

function roomActionId(action) {
  if (action.type === "resolve_room") return `room:resolve:${action.roomId}`;
  if (action.type === "excavate") return `room:excavate:${action.placementId}`;
  return `room:${action.type}`;
}

module.exports = { applyPublicAction, assertObservationSafe, publicLegalActions, publicObservation, roomActionId };
