"use strict";

const {
  loadAllTrajectories,
} = require("./rule_reading_trajectory_v0/compiled-trajectory-loader");
const {
  PrecompiledGteTrajectoryMemory,
} = require("./rule_reading_trajectory_v0/precompiled-gte-memory");
const {
  loadDefaultLibrary,
} = require("../ufs_cognitive_program_library_v0/default-library");
const {
  JsonCognitiveProgramInterpreter,
  selectProgram,
} = require("../ufs_cognitive_program_library_v0/json-program-interpreter");

function clone(value) {
  return structuredClone(value);
}

function add(facts, path, value, activation = 0.9) {
  facts.push({ path, value: clone(value), activation });
}

function projectWhiteDie({ observedState }) {
  const facts = [];
  add(facts, "dice.ids", observedState.dice.map((die) => die.id), 1);
  for (const die of observedState.dice) add(facts, `dice:${die.id}.placed`, die.placed);
  return facts;
}

function projectArrow({ event, observedState }) {
  const facts = [];
  add(facts, "event.shipId", event.shipId, 1);
  add(facts, "tile.arrow.targetColumn", observedState.tile.arrow.targetColumn);
  add(facts, "tile.arrow.targetRow", observedState.tile.arrow.targetRow);
  return facts;
}

function projectMothershipSpace({ observedState }) {
  const facts = [];
  add(facts, "mothership.row", observedState.mothership.row, 1);
  return facts;
}

function projectCityContact({ event }) {
  const facts = [];
  add(facts, "event.shipId", event.shipId, 1);
  return facts;
}

function projectRoomPayment({ observedState }) {
  const facts = [];
  add(facts, "room.energyCost", observedState.room.energyCost, 1);
  add(facts, "player.energy", observedState.player.energy);
  return facts;
}

function projectEnergyRoom({ observedState }) {
  const facts = [];
  add(facts, "room.value", observedState.room.value, 1);
  add(facts, "player.energy", observedState.player.energy);
  add(facts, "player.energyCap", observedState.player.energyCap);
  return facts;
}

function projectFighterRoom({ observedState }) {
  const facts = [];
  add(facts, "room.value", observedState.room.value, 1);
  add(facts, "explosionShip.ids", observedState.explosionShips.map((ship) => ship.id));
  for (const ship of observedState.explosionShips) {
    add(facts, `explosionShip:${ship.id}.threshold`, ship.threshold);
  }
  return facts;
}

function projectResearchRoom({ observedState }) {
  const facts = [];
  add(facts, "room.value", observedState.room.value, 1);
  add(facts, "research.costsAhead", observedState.research.costsAhead);
  return facts;
}

function projectResearchCompletion({ observedState }) {
  const facts = [];
  add(facts, "research.complete", observedState.research.complete, 1);
  add(facts, "city.destroyed", observedState.city.destroyed);
  return facts;
}

function projectDamageThreshold({ observedState }) {
  const facts = [];
  add(facts, "damage.atBottom", observedState.damage.atBottom, 1);
  return facts;
}

function projectMothershipThreshold({ observedState }) {
  const facts = [];
  add(facts, "mothership.onSkullRow", observedState.mothership.onSkullRow, 1);
  return facts;
}

function projectExcavationPlacement({ event, observedState }) {
  const facts = [];
  add(facts, "event.dieValue", event.dieValue, 1);
  add(facts, "excavation.pathDistance", observedState.excavation.pathDistance);
  add(facts, "round.usedUnexcavatedPlacement", observedState.round.usedUnexcavatedPlacement);
  return facts;
}

function projectExcavationResolution({ event, observedState }) {
  const facts = [];
  add(facts, "event.dieId", event.dieId, 1);
  add(facts, "excavation.targetIndex", observedState.excavation.targetIndex);
  add(facts, "excavation.pathIndicesBehind", observedState.excavation.pathIndicesBehind);
  return facts;
}

function projectResearchOrder({ observedState }) {
  const facts = [];
  const rooms = observedState.research.pendingRooms;
  add(facts, "research.pendingRoomIds", rooms.map((room) => room.id), 1);
  for (const room of rooms) add(facts, `research.room:${room.id}.value`, room.value);
  add(facts, "research.costsAhead", observedState.research.costsAhead);
  return facts;
}

function projectMothershipPhase({ observedState }) {
  const facts = [];
  const nextRow = observedState.mothership.row + 1;
  add(facts, "mothership.row", observedState.mothership.row, 1);
  add(facts, `sky.row:${nextRow}.shipIds`, observedState.sky.shipsByRow[nextRow] || []);
  return facts;
}

function projectMothershipAction({ observedState }) {
  const facts = [];
  add(facts, "mothership.rowAction.type", observedState.mothership.rowAction.type, 1);
  add(facts, "mothership.rowAction.value", observedState.mothership.rowAction.value);
  return facts;
}

function projectResearchTop({ observedState }) {
  const facts = [];
  add(facts, "research.atTop", observedState.research.atTop, 1);
  return facts;
}

function projectFinalResearch({ observedState }) {
  const facts = [];
  add(facts, "research.targetCost", observedState.research.targetCost, 1);
  add(facts, "room.type", observedState.room.type);
  add(facts, "room.zone", observedState.room.zone);
  add(facts, "room.cellCount", observedState.room.cellCount);
  return facts;
}

function projectSpawnEmpty({ event, observedState }) {
  const facts = [];
  add(facts, "spawn.shipId", event.shipId, 1);
  add(facts, "sky.columnIds", observedState.sky.columns.map((column) => column.id));
  for (const column of observedState.sky.columns) {
    add(facts, `sky.column:${column.id}.shipIds`, column.shipIds);
    add(facts, `sky.column:${column.id}.dropPointId`, column.dropPointId);
  }
  return facts;
}

function projectSpawnFarthest({ event, observedState }) {
  const facts = [];
  add(facts, "spawn.shipId", event.shipId, 1);
  add(facts, "spawn.availableDropPointIds", observedState.spawn.dropPoints.map((point) => point.id));
  for (const point of observedState.spawn.dropPoints) {
    add(facts, `spawn.dropPoint:${point.id}.distanceFromHighestShip`, point.distanceFromHighestShip);
  }
  return facts;
}

const EVENT_PROJECTORS = Object.freeze({
  white_die_placed: projectWhiteDie,
  ship_final_arrow: projectArrow,
  ship_final_mothership_space: projectMothershipSpace,
  ship_city_contact: projectCityContact,
  room_payment: projectRoomPayment,
  energy_room_resolution: projectEnergyRoom,
  fighter_room_resolution: projectFighterRoom,
  research_room_resolution: projectResearchRoom,
  research_completion: projectResearchCompletion,
  damage_threshold: projectDamageThreshold,
  mothership_threshold: projectMothershipThreshold,
  excavation_placement: projectExcavationPlacement,
  excavation_resolution: projectExcavationResolution,
  research_order: projectResearchOrder,
  mothership_phase_start: projectMothershipPhase,
  mothership_row_action: projectMothershipAction,
  research_top: projectResearchTop,
  final_research_constraint: projectFinalResearch,
  spawn_priority_empty: projectSpawnEmpty,
  spawn_priority_farthest: projectSpawnFarthest,
});

function inferQKind({ event, observedState }) {
  switch (event?.type) {
    case "die_placed":
      return event.dieColor === "white" ? "white_die_placed" : null;
    case "ship_landed": {
      const kinds = {
        arrow: "ship_final_arrow",
        mothership_down: "ship_final_mothership_space",
        city: "ship_city_contact",
      };
      return kinds[observedState.tile?.kind] || null;
    }
    case "room_resolution": {
      if (event.stage === "payment") return "room_payment";
      if (event.stage !== "effect") return null;
      const kinds = {
        energy: "energy_room_resolution",
        fighter: "fighter_room_resolution",
        research: "research_room_resolution",
      };
      return kinds[observedState.room?.type] || null;
    }
    case "research_completed":
      return "research_completion";
    case "damage_changed":
      return "damage_threshold";
    case "mothership_threshold_check":
      return "mothership_threshold";
    case "excavation_placement_considered":
      return "excavation_placement";
    case "excavation_selected":
      return "excavation_resolution";
    case "research_rooms_ready":
      return "research_order";
    case "phase_started":
      return observedState.phase === "mothership" ? "mothership_phase_start" : null;
    case "mothership_descent_completed":
      return "mothership_row_action";
    case "research_position_changed":
      return "research_top";
    case "final_research_considered":
      return "final_research_constraint";
    case "spawn_started": {
      const columns = observedState.sky?.columns;
      if (!Array.isArray(columns)) return null;
      return columns.some((column) => column.shipIds.length === 0)
        ? "spawn_priority_empty"
        : "spawn_priority_farthest";
    }
    default:
      return null;
  }
}

function makeAttention(facts, maxItems) {
  if (!Number.isInteger(maxItems) || maxItems <= 0) throw new TypeError("perceptionBudget must be positive");
  const ranked = [...facts].sort((left, right) => (
    right.activation - left.activation || left.path.localeCompare(right.path)
  ));
  const selected = ranked.slice(0, Math.min(maxItems, ranked.length));
  const byPath = new Map(selected.map((fact) => [fact.path, fact]));
  return {
    totalPublicAtoms: ranked.length,
    maxItems,
    ranked,
    selected,
    has(path) { return byPath.has(path); },
    read(path) {
      if (!byPath.has(path)) throw new Error(`event attention did not expose: ${path}`);
      return clone(byPath.get(path).value);
    },
  };
}

function relationMatches(trajectory, qKind) {
  return trajectory.relation?.qKind === qKind;
}

class UfsEventRuleImagination {
  constructor({
    trajectories = loadAllTrajectories(),
    memory = null,
    programLibrary = loadDefaultLibrary(),
    programInterpreter = new JsonCognitiveProgramInterpreter(),
    activationThreshold = 0.55,
    topK = 4,
  } = {}) {
    this.trajectories = trajectories;
    this.memory = memory || new PrecompiledGteTrajectoryMemory(trajectories);
    this.programLibrary = programLibrary;
    this.programInterpreter = programInterpreter;
    this.activationThreshold = activationThreshold;
    this.topK = topK;
  }

  run({ event, observedState, perceptionBudget = 100 }) {
    const observedBefore = clone(observedState);
    const qKind = inferQKind({ event, observedState });
    const projector = EVENT_PROJECTORS[qKind];
    if (!projector) {
      return {
        status: "unknown", reason: "unrecognized_event_q_kind", patch: null,
        observedWorldUnchanged: true,
        trace: {
          eventDetection: { eventType: event?.type || null, qKind: null },
          q: null, attention: null, candidates: [], relationRejections: [],
        },
      };
    }
    const facts = projector({ event, observedState });
    const attention = makeAttention(facts, perceptionBudget);
    const requiredPaths = facts.map((fact) => fact.path);
    const missingForQ = requiredPaths.filter((path) => !attention.has(path));
    const trace = {
      eventDetection: { eventType: event.type, qKind },
      q: null,
      attention: {
        totalPublicAtoms: attention.totalPublicAtoms,
        budget: attention.maxItems,
        selected: attention.selected.map((fact) => fact.path),
      },
      candidates: [], relationRejections: [], grounding: null,
    };
    if (missingForQ.length > 0) {
      return {
        status: "attention_stop", reason: "incomplete_event_q_attention", patch: null,
        observedWorldUnchanged: JSON.stringify(observedState) === JSON.stringify(observedBefore),
        trace: { ...trace, missingForQ },
      };
    }
    const qHeads = this.trajectories.filter((trajectory) => relationMatches(trajectory, qKind));
    if (qHeads.length !== 1) {
      return {
        status: qHeads.length === 0 ? "unknown" : "ambiguous",
        reason: "event_q_contract_not_unique", patch: null,
        observedWorldUnchanged: JSON.stringify(observedState) === JSON.stringify(observedBefore), trace,
      };
    }
    const currentQ = clone(qHeads[0].triggerQ);
    trace.q = currentQ;
    const candidates = this.memory.query(currentQ, { topK: this.topK });
    trace.candidates = candidates.map((candidate) => ({
      trajectoryId: candidate.trajectory.id,
      sourceRuleId: candidate.trajectory.sourceRuleId,
      activation: candidate.activation,
      followingQ: clone(candidate.trajectory.followingQ),
    }));
    const accepted = candidates.find((candidate) => {
      if (candidate.activation < this.activationThreshold) return false;
      if (!relationMatches(candidate.trajectory, qKind)) {
        trace.relationRejections.push({
          trajectoryId: candidate.trajectory.id,
          reason: "event_q_kind_mismatch",
        });
        return false;
      }
      return true;
    });
    if (!accepted) {
      return {
        status: "unknown", reason: "no_activated_trajectory_passed_relation_gate", patch: null,
        observedWorldUnchanged: JSON.stringify(observedState) === JSON.stringify(observedBefore), trace,
      };
    }
    const programSelection = selectProgram(this.programLibrary, {
      qKind,
      sourceRuleId: accepted.trajectory.sourceRuleId,
      metadata: event.metadata || {},
    });
    if (!programSelection.selected) {
      return {
        status: programSelection.candidates.length === 0 ? "unknown" : "ambiguous",
        reason: "no_unique_json_program_for_activated_trajectory", patch: null,
        observedWorldUnchanged: JSON.stringify(observedState) === JSON.stringify(observedBefore), trace,
      };
    }
    const preview = this.programInterpreter.execute(programSelection.selected.program, { attention });
    const observedWorldUnchanged = JSON.stringify(observedState) === JSON.stringify(observedBefore);
    if (!observedWorldUnchanged) throw new Error("event imagination mutated observed state");
    trace.grounding = {
      trajectoryId: accepted.trajectory.id,
      sourceRuleId: accepted.trajectory.sourceRuleId,
      awakenedFollowingQ: clone(accepted.trajectory.followingQ),
      programId: programSelection.selected.program.programId,
      programRevision: programSelection.selected.program.revision,
      reads: preview.reads,
      patch: preview.patch,
    };
    return {
      status: preview.patch.stopKind || "automatic",
      reason: `trajectory_program:${accepted.trajectory.id}`,
      patch: preview.patch,
      observedWorldUnchanged,
      trace,
    };
  }
}

module.exports = {
  EVENT_PROJECTORS,
  inferQKind,
  UfsEventRuleImagination,
  makeAttention,
  relationMatches,
};
