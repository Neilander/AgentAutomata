"use strict";

const {
  PrecompiledGteTrajectoryMemory,
} = require("./rule_reading_trajectory_v0/precompiled-gte-memory");
const {
  loadPlacementTrajectories,
} = require("./rule_reading_trajectory_v0/compiled-trajectory-loader");
const {
  loadDefaultLibrary,
} = require("../ufs_cognitive_program_library_v0/default-library");
const {
  JsonCognitiveProgramInterpreter,
  selectProgram,
} = require("../ufs_cognitive_program_library_v0/json-program-interpreter");

function qFor(kind) {
  const rows = {
    placement_movement: {
      affected_object: "same-column ships",
      change_trend: "descent amount pending",
      cause_relation: "die placed in one base column",
      temporal_state: "ready to happen",
      context: "imagined candidate action",
    },
    placement_room_state: {
      affected_object: "base room containing placed die",
      change_trend: "occupancy and future room effect pending",
      cause_relation: "die occupied one room cell",
      temporal_state: "after placement before room phase",
      context: "imagined candidate action",
    },
  };
  if (!rows[kind]) throw new Error(`unknown placement q kind: ${kind}`);
  return { ...rows[kind] };
}

// The memory rows are loaded from a frozen AI rule-reading artifact. This file
// still owns attention, relation gating and grounding, but no longer authors the
// remembered current->following trajectory heads inline.
const PLACEMENT_TRAJECTORIES = loadPlacementTrajectories();

class PlacementAttentionError extends Error {
  constructor(atomId) {
    super(`placement attention did not expose: ${atomId}`);
    this.name = "PlacementAttentionError";
    this.atomId = atomId;
  }
}

function locateSelection(publicState, publicMap, selectedAction) {
  const die = publicState.dice.find((candidate) => candidate.id === selectedAction.dieId);
  if (!die || die.placed) throw new Error(`selected die is unavailable: ${selectedAction.dieId}`);
  if (die.color !== selectedAction.dieColor || die.value !== selectedAction.dieValue) {
    throw new Error("selected die description disagrees with public state");
  }
  const cell = publicMap.base.cells.find((candidate) => candidate.id === selectedAction.cellId);
  if (!cell) throw new Error(`unknown public base cell: ${selectedAction.cellId}`);
  const room = publicMap.base.rooms.find((candidate) => candidate.id === cell.roomId);
  if (!room) throw new Error(`missing room for public base cell: ${selectedAction.cellId}`);
  if (publicState.placements.some((placement) => placement.column === cell.column)) {
    throw new Error(`selected column is already occupied: C${cell.column + 1}`);
  }
  return { die, cell, room };
}

function buildPlacementAtoms(publicState, selectedAction, die, cell, room) {
  const existingByCell = new Map(
    publicState.placements.map((placement) => [placement.cellId, placement]),
  );
  existingByCell.set(selectedAction.cellId, {
    dieId: die.id,
    dieValue: die.value,
  });
  const atoms = [];
  function add(id, value, activation) {
    atoms.push({ id, value, activation });
  }
  add("event.type", "place_die", 1);
  add("event.dieId", die.id, 1);
  add("event.dieValue", die.value, 1);
  add("event.cellId", cell.id, 1);
  add("cell.column", cell.column, 0.96);
  add("cell.roomId", room.id, 0.96);
  add("room.id", room.id, 0.92);
  add("room.type", room.type, 0.92);
  add("room.cellIds", [...room.cellIds], 0.88);
  add("room.modifier", room.modifier, 0.84);
  add("room.energyCost", room.energyCost, 0.84);
  for (const roomCellId of room.cellIds) {
    const placement = existingByCell.get(roomCellId) || null;
    add(`room.cell:${roomCellId}.occupied`, Boolean(placement), 0.9);
    add(`room.cell:${roomCellId}.dieValue`, placement?.dieValue ?? null, 0.86);
  }
  return atoms.sort((left, right) => (
    right.activation - left.activation || left.id.localeCompare(right.id)
  ));
}

function makeAttention(atoms, maxItems) {
  if (!Number.isInteger(maxItems) || maxItems <= 0) {
    throw new TypeError("placement perception budget must be a positive integer");
  }
  const selected = atoms.slice(0, Math.min(maxItems, atoms.length));
  const byId = new Map(selected.map((atom) => [atom.id, atom]));
  return {
    totalPublicAtoms: atoms.length,
    maxItems,
    selected,
    has(id) {
      return byId.has(id);
    },
    read(id, reads = null) {
      const atom = byId.get(id);
      if (!atom) throw new PlacementAttentionError(id);
      if (reads) reads.push(id);
      return structuredClone(atom.value);
    },
  };
}

function globalSourcesForAtom(atomId, publicState, selectedAction, room) {
  if (atomId === "event.type") return [];
  if (atomId.startsWith("event.die")) return [`die:${selectedAction.dieId}`];
  if (atomId === "event.cellId" || atomId === "cell.column") {
    return [`base_cell:${selectedAction.cellId}`];
  }
  if (atomId === "cell.roomId") {
    return [`base_cell:${selectedAction.cellId}`, `room:${room.id}`];
  }
  if (atomId.startsWith("room.cell:")) {
    const match = /^room\.cell:(.+)\.(occupied|dieValue)$/.exec(atomId);
    if (!match) return [`room:${room.id}`];
    const cellId = match[1];
    const sources = [`room:${room.id}`, `base_cell:${cellId}`];
    if (cellId === selectedAction.cellId) sources.push(`die:${selectedAction.dieId}`);
    const placement = publicState.placements.find((row) => row.cellId === cellId && !row.resolved);
    if (placement) sources.push(`placement:${placement.id}`);
    return sources;
  }
  if (atomId.startsWith("room.")) return [`room:${room.id}`];
  return [];
}

function makeFullAttention(atoms, allocation, publicState, selectedAction, room) {
  if (!allocation || !Array.isArray(allocation.noticedItemIds)) {
    throw new TypeError("globalAttention must be a full attention allocation");
  }
  const noticed = new Set(allocation.noticedItemIds);
  const selected = atoms.filter((atom) => globalSourcesForAtom(
    atom.id, publicState, selectedAction, room,
  ).every((itemId) => noticed.has(itemId)));
  const byId = new Map(selected.map((atom) => [atom.id, atom]));
  return {
    totalPublicAtoms: atoms.length,
    maxItems: selected.length,
    selected,
    has(id) { return byId.has(id); },
    read(id, reads = null) {
      const atom = byId.get(id);
      if (!atom) throw new PlacementAttentionError(id);
      if (reads) reads.push(id);
      return structuredClone(atom.value);
    },
  };
}

function buildQueries(attention) {
  const common = ["event.type", "event.dieValue", "cell.roomId", "room.type", "room.cellIds"];
  if (!common.every((id) => attention.has(id))) return [];
  const roomType = attention.read("room.type");
  const cellCount = attention.read("room.cellIds").length;
  return [
    {
      q: qFor("placement_movement"),
      metadata: { kind: "placement_movement", roomType, cellCount },
    },
    {
      q: qFor("placement_room_state"),
      metadata: { kind: "placement_room_state", roomType, cellCount },
    },
  ];
}

function relationCheck(trajectory, query) {
  const relation = trajectory.relation;
  if (relation.qKind !== query.metadata.kind) return false;
  if (relation.roomTypes && !relation.roomTypes.includes(query.metadata.roomType)) return false;
  if (relation.excludedRoomTypes?.includes(query.metadata.roomType)) return false;
  if (relation.cellCount !== undefined && relation.cellCount !== query.metadata.cellCount) return false;
  if (
    relation.minimumCellCount !== undefined
    && query.metadata.cellCount < relation.minimumCellCount
  ) return false;
  return true;
}

function applyPatch(imaginedConsequences, patch) {
  if (patch.kind === "set_movement_amount") {
    imaginedConsequences.movement = { ...patch };
    return;
  }
  if (patch.kind === "set_noticed_room_state") {
    imaginedConsequences.room = { ...patch };
    return;
  }
  throw new Error(`unknown placement imagination patch: ${patch.kind}`);
}

class PlacementRuleImagination {
  constructor({
    memory = new PrecompiledGteTrajectoryMemory(PLACEMENT_TRAJECTORIES),
    programLibrary = loadDefaultLibrary(),
    programInterpreter = new JsonCognitiveProgramInterpreter(),
    topK = 6,
    activationThreshold = 0.55,
  } = {}) {
    this.memory = memory;
    this.programLibrary = programLibrary;
    this.programInterpreter = programInterpreter;
    this.topK = topK;
    this.activationThreshold = activationThreshold;
  }

  run({
    publicState,
    publicMap,
    selectedAction,
    perceptionBudget = 30,
    globalAttention = null,
  }) {
    const { die, cell, room } = locateSelection(publicState, publicMap, selectedAction);
    const atoms = buildPlacementAtoms(publicState, selectedAction, die, cell, room);
    const attention = globalAttention
      ? makeFullAttention(atoms, globalAttention, publicState, selectedAction, room)
      : makeAttention(atoms, perceptionBudget);
    const queries = buildQueries(attention);
    const imaginedConsequences = { movement: null, room: null };
    const trace = {
      attention: {
        mode: globalAttention ? "external_full_attention" : "legacy_local_attention",
        totalPublicAtoms: attention.totalPublicAtoms,
        budget: attention.maxItems,
        selected: attention.selected.map((atom) => atom.id),
        ...(globalAttention ? {
          fullSpaceItemCount: globalAttention.spaceItemCount,
          fullCapacity: globalAttention.capacity,
          fullNoticedItemIds: globalAttention.noticedItemIds,
          fullOmittedItemIds: globalAttention.omittedItemIds,
          fullCarryoverAppliedItemIds: globalAttention.carryoverAppliedItemIds,
          attentionTraceBefore: globalAttention.traceBefore,
          attentionTraceAfter: globalAttention.traceAfter,
          fullField: globalAttention.field,
        } : {}),
      },
      queries: queries.map((query) => ({ kind: query.metadata.kind, q: query.q })),
      activations: [],
      relationRejections: [],
      groundings: [],
    };
    if (queries.length === 0) {
      return {
        status: "attention_stop",
        reason: "no_complete_placement_q",
        imaginedConsequences,
        context: { die, cell, room },
        trace,
      };
    }
    try {
      for (const query of queries) {
        const candidates = this.memory.query(query.q, { topK: this.topK });
        trace.activations.push({
          queryKind: query.metadata.kind,
          candidates: candidates.map((candidate) => ({
            trajectoryId: candidate.trajectory.id,
            activation: candidate.activation,
            aboveThreshold: candidate.activation >= this.activationThreshold,
            connectionStrength: candidate.connectionStrength ?? null,
            generationOrigin: candidate.trajectory.generationOrigin,
            matrixKind: candidate.matrixKind ?? "injected_test_memory",
            observations: candidate.observations ?? null,
            support: candidate.support ?? null,
            followingQ: candidate.trajectory.followingQ,
          })),
        });
        const accepted = candidates.find((candidate) => {
          if (candidate.activation < this.activationThreshold) return false;
          const matched = relationCheck(candidate.trajectory, query);
          if (!matched) {
            trace.relationRejections.push({
              queryKind: query.metadata.kind,
              trajectoryId: candidate.trajectory.id,
            });
          }
          return matched;
        });
        if (!accepted) {
          return {
            status: "unknown",
            reason: `no_rule_for:${query.metadata.kind}`,
            imaginedConsequences,
            context: { die, cell, room },
            trace,
          };
        }
        const programSelection = selectProgram(this.programLibrary, {
          qKind: query.metadata.kind,
          sourceRuleId: accepted.trajectory.sourceRuleId,
          metadata: query.metadata,
        });
        if (!programSelection.selected) {
          return {
            status: "unknown",
            reason: `no_unique_json_program_for:${query.metadata.kind}`,
            imaginedConsequences,
            context: { die, cell, room },
            trace,
          };
        }
        const preview = this.programInterpreter.execute(
          programSelection.selected.program,
          { attention },
        );
        preview.patch.sourceRuleId = accepted.trajectory.sourceRuleId;
        applyPatch(imaginedConsequences, preview.patch);
        trace.groundings.push({
          queryKind: query.metadata.kind,
          trajectoryId: accepted.trajectory.id,
          sourceRuleId: accepted.trajectory.sourceRuleId,
          currentQ: accepted.trajectory.triggerQ,
          awakenedFollowingQ: accepted.trajectory.followingQ,
          generationOrigin: accepted.trajectory.generationOrigin,
          programId: programSelection.selected.program.programId,
          programRevision: programSelection.selected.program.revision,
          programProvenance: programSelection.selected.provenance,
          reads: preview.reads,
          patch: preview.patch,
          committed: true,
        });
      }
    } catch (error) {
      if (error instanceof PlacementAttentionError) {
        return {
          status: "attention_stop",
          reason: "grounding_required_unnoticed_room_fact",
          missingAtom: error.atomId,
          imaginedConsequences,
          context: { die, cell, room },
          trace,
        };
      }
      throw error;
    }
    return {
      status: "automatic",
      reason: "placement_rules_grounded",
      imaginedConsequences,
      context: { die, cell, room },
      trace,
    };
  }
}

module.exports = {
  PLACEMENT_TRAJECTORIES,
  PlacementRuleImagination,
  locateSelection,
  qFor,
};
