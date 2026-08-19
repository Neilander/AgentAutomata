"use strict";

const MAP = require("../../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-threat-0-map");
const ENGINE = require("../../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/standard-engine");
const API = require("../../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/matrix_planning_player_v0/player-api");

function publicMapView() {
  return {
    schema: "ufs_public_map_for_memory_imagination_v0",
    id: MAP.id,
    columns: MAP.columns,
    city: { maxDamage: MAP.city.maxDamage, maxEnergy: MAP.city.maxEnergy },
    research: {
      costs: [...MAP.research.costs],
      finalRequiresMultiSpace: MAP.research.finalRequiresMultiSpace,
    },
    base: {
      rooms: MAP.base.rooms.map((room) => structuredClone(room)),
      cells: MAP.base.cells.map((cell) => structuredClone(cell)),
      startExcavatorIndex: MAP.base.startExcavatorIndex,
    },
    sky: {
      dropRow: MAP.sky.dropRow,
      cityRow: MAP.sky.cityRow,
      skullRow: MAP.sky.skullRow,
      rows: MAP.sky.rows.map((row) => ({
        index: row.index,
        cells: row.cells.map((cell) => ({
          ...(cell.effect ? { effect: structuredClone(cell.effect) } : {}),
          ...(cell.explosion != null ? { explosion: cell.explosion } : {}),
        })),
      })),
    },
  };
}

function strategicState(state) {
  const observation = API.publicObservation(MAP, state);
  return {
    damage: observation.damage,
    mothershipRow: observation.mothershipRow,
    ships: observation.ships
      .map(({ id, color, column, row }) => ({ id, color, column, row }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    waitingShips: observation.waitingShips
      .map(({ id, color }) => ({ id, color }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

function snapshot(seed) {
  const state = ENGINE.createGame(MAP, seed);
  const observation = API.publicObservation(MAP, state);
  const safe = API.assertObservationSafe(observation);
  if (!safe.ok) throw new Error(`unsafe public observation: ${safe.violations.join(",")}`);
  return {
    schema: "ufs_memory_player_public_input_v0",
    observation,
    legalActions: API.publicLegalActions(MAP, state),
    publicMap: publicMapView(),
  };
}

function evaluateWorkers(seed) {
  const initial = ENGINE.createGame(MAP, seed);
  const actions = API.publicLegalActions(MAP, initial)
    .filter((row) => row.kind === "worker_placement");
  const outcomes = {};
  for (const action of actions) {
    outcomes[action.id] = strategicState(API.applyPublicAction(MAP, initial, action.id));
  }
  return { schema: "ufs_hidden_after_choice_evaluation_v0", outcomes };
}

function delayedOutcome(state, action) {
  const afterPlacement = API.applyPublicAction(MAP, state, action.id);
  const future = structuredClone(afterPlacement);
  for (const die of future.dice) die.placed = true;
  future.phase = "rooms";
  const before = API.publicObservation(MAP, future);
  const legal = ENGINE.legalRoomActions(MAP, future);
  let roomAction = null;
  if (action.placement.excavationCandidate) {
    roomAction = legal.find((row) => row.type === "excavate" && row.placementId === action.placement.id);
  } else {
    roomAction = legal.find((row) => row.type === "resolve_room" && row.roomId === action.placement.roomId);
  }
  if (!roomAction) {
    const room = MAP.base.rooms.find((row) => row.id === action.placement.roomId);
    const features = zeroFutureFeatures();
    if (!action.placement.excavationCandidate && room?.cellIds.length > 1) features.setupProgress = 1;
    return { status: "conditional_or_incomplete", features };
  }
  if (roomAction.affordable === false) return { status: "currently_unaffordable", features: zeroFutureFeatures() };
  const resolved = ENGINE.applyRoomAction(MAP, future, roomAction);
  const after = API.publicObservation(MAP, resolved);
  const beforeIds = new Set(before.ships.map((ship) => ship.id));
  const afterIds = new Set(after.ships.map((ship) => ship.id));
  return {
    status: "resolved_in_immediate_room_counterfactual",
    features: {
      energyDelta: after.energy - before.energy,
      researchAdvance: after.researchIndex - before.researchIndex,
      shipsDestroyed: [...beforeIds].filter((id) => !afterIds.has(id)).length,
      excavatorAdvance: after.excavatorIndex - before.excavatorIndex,
      setupProgress: 0,
    },
  };
}

function zeroFutureFeatures() {
  return { energyDelta: 0, researchAdvance: 0, shipsDestroyed: 0, excavatorAdvance: 0, setupProgress: 0 };
}

function evaluateDelayed(seed) {
  const initial = ENGINE.createGame(MAP, seed);
  const actions = API.publicLegalActions(MAP, initial).filter((row) => row.kind === "worker_placement");
  return {
    schema: "ufs_hidden_delayed_counterfactual_evaluation_v0",
    outcomes: Object.fromEntries(actions.map((action) => [action.id, delayedOutcome(initial, action)])),
  };
}

function main() {
  const mode = process.argv[2];
  const seed = Number(process.argv[3]);
  if (!Number.isFinite(seed)) throw new Error("seed is required");
  if (mode === "snapshot") console.log(JSON.stringify(snapshot(seed)));
  else if (mode === "evaluate-workers") console.log(JSON.stringify(evaluateWorkers(seed)));
  else if (mode === "evaluate-delayed") console.log(JSON.stringify(evaluateDelayed(seed)));
  else throw new Error(`unknown mode: ${mode}`);
}

if (require.main === module) main();

module.exports = { evaluateDelayed, evaluateWorkers, publicMapView, snapshot, strategicState };
