"use strict";

const engine = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/standard-engine");

function clone(value) {
  return structuredClone(value);
}

function normalizedOutcome(outcome) {
  if (!outcome) return null;
  const reason = outcome.reason === "mothership_reached_skull"
    ? "mothership_reached_skull_row"
    : outcome.reason;
  return { result: outcome.result, reason, round: outcome.round };
}

function ordered(rows) {
  return [...(rows || [])].map(clone)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
}

function publicStateView(state) {
  return {
    round: state.round,
    phase: state.phase,
    energy: state.energy,
    damage: state.damage,
    researchIndex: state.researchIndex,
    excavatorIndex: state.excavatorIndex,
    mothershipRow: state.mothershipRow,
    outcome: normalizedOutcome(state.outcome),
    dice: ordered(state.dice).map((row) => ({
      id: row.id, color: row.color, value: row.value, placed: Boolean(row.placed),
    })),
    ships: ordered(state.ships).map((row) => ({
      id: row.id, color: row.color, column: row.column, row: row.row,
    })),
    waitingShips: ordered(state.waitingShips).map((row) => ({ id: row.id, color: row.color })),
    placements: ordered(state.placements).map((row) => ({
      id: row.id,
      dieId: row.dieId,
      dieValue: row.dieValue,
      cellId: row.cellId,
      roomId: row.roomId,
      column: row.column,
      excavationCandidate: Boolean(row.excavationCandidate),
      resolved: Boolean(row.resolved),
    })),
    robots: ordered(state.robots).map((row) => ({
      id: row.id,
      cellId: row.cellId,
      value: row.value,
      exhausted: Boolean(row.exhausted),
    })),
  };
}

function seedFormalState(map, initialPublicState) {
  const state = engine.createGame(map, 1);
  for (const key of [
    "round", "phase", "energy", "damage", "researchIndex", "excavatorIndex",
    "mothershipRow", "outcome", "dice", "ships", "waitingShips", "placements", "robots",
    "nextWhiteId", "nextRobotId", "rngState",
  ]) {
    if (Object.prototype.hasOwnProperty.call(initialPublicState, key)) {
      state[key] = clone(initialPublicState[key]);
    }
  }
  state.mapId = map.id;
  state.history = [];
  return state;
}

function differingSections(left, right) {
  if (!right) return Object.keys(left);
  return Object.keys(left)
    .filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]));
}

function matchingRoomAction(map, state, action) {
  return engine.legalRoomActions(map, state).find((candidate) => (
    candidate.type === action.type
    && (action.roomId == null || candidate.roomId === action.roomId)
    && (action.placementId == null || candidate.placementId === action.placementId)
  ));
}

function formalRoomCandidates(map, state) {
  const legal = engine.legalRoomActions(map, state);
  return {
    resolvableRoomIds: legal.filter((row) => row.type === "resolve_room" && row.affordable !== false)
      .map((row) => row.roomId).sort(),
    unaffordableRoomIds: legal.filter((row) => row.type === "resolve_room" && row.affordable === false)
      .map((row) => row.roomId).sort(),
    excavationPlacementIds: legal.filter((row) => row.type === "excavate" && row.affordable !== false)
      .map((row) => row.placementId).sort(),
    unaffordableExcavationPlacementIds: legal
      .filter((row) => row.type === "excavate" && row.affordable === false)
      .map((row) => row.placementId).sort(),
    skippablePlacementIds: legal.filter((row) => row.type === "skip_worker")
      .map((row) => row.placementId).sort(),
  };
}

function exactRollValues(dieIds, values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) return false;
  const expected = [...dieIds].sort();
  const actual = Object.keys(values).sort();
  return JSON.stringify(expected) === JSON.stringify(actual)
    && expected.every((id) => Number.isInteger(values[id]) && values[id] >= 1 && values[id] <= 6);
}

class UfsFormalFeedbackOracle {
  constructor({
    map,
    state = null,
    pendingResearch = null,
    pendingRandom = null,
    deferredBefore = null,
  } = {}) {
    if (!map) throw new TypeError("formal game session requires a map");
    this.map = clone(map);
    this.state = state ? clone(state) : null;
    this.pendingResearch = clone(pendingResearch);
    this.pendingRandom = clone(pendingRandom);
    this.deferredBefore = clone(deferredBefore);
  }

  start(initialPublicState) {
    if (this.state) throw new Error("formal game session already started");
    this.state = seedFormalState(this.map, initialPublicState);
    return this.decision();
  }

  view() {
    if (!this.state) throw new Error("formal game session has not started");
    return publicStateView(this.state);
  }

  decision() {
    const state = this.view();
    if (state.outcome) {
      return {
        status: "complete",
        reason: state.outcome.reason,
        pending: null,
        availableOperations: [],
        observation: state,
      };
    }
    if (this.pendingRandom) {
      return {
        status: "random",
        reason: "waiting_for_actual_reroll",
        pending: clone(this.pendingRandom),
        availableOperations: ["submit_random_observation"],
        observation: state,
      };
    }
    if (this.pendingResearch) {
      return {
        status: "choice",
        reason: "waiting_for_research_advance_choice",
        pending: clone(this.pendingResearch.pending),
        availableOperations: ["choose_research_advance"],
        observation: state,
      };
    }
    if (state.phase === "dice") {
      return {
        status: "choice",
        reason: "waiting_for_die_placement",
        pending: { type: "place_die" },
        availableOperations: engine.allLegalWorkerPlacements(this.map, this.state).length
          ? ["place_die"] : [],
        observation: state,
      };
    }
    if (state.phase === "rooms") {
      const candidates = formalRoomCandidates(this.map, this.state);
      const available = [];
      if (candidates.resolvableRoomIds.length) available.push("resolve_room");
      if (candidates.excavationPlacementIds.length) available.push("excavate");
      if (candidates.skippablePlacementIds.length) available.push("skip_worker");
      available.push("end_rooms");
      return {
        status: "choice",
        reason: "waiting_for_room_action",
        pending: { type: "room_action", candidates },
        availableOperations: available,
        observation: state,
      };
    }
    if (state.phase === "spawning") {
      const next = engine.nextSpawnChoice(this.map, this.state);
      if (!next) throw new Error("formal spawning phase has no pending choice");
      return {
        status: "choice",
        reason: "waiting_for_spawn_choice",
        pending: {
          type: "spawn",
          shipId: next.waiting.id,
          candidates: next.candidates.map((column) => `DP-C${column + 1}`),
        },
        availableOperations: ["choose_spawn"],
        observation: state,
      };
    }
    if (state.phase === "new_round") {
      const nextRound = state.round + 1;
      const dice = ["gray", "gray", "gray", "white", "white"].map((color, index) => ({
        id: `r${nextRound}-${color}-${index}`,
        color,
      }));
      return {
        status: "random",
        reason: "waiting_for_next_round_roll",
        pending: {
          type: "next_round_roll",
          round: nextRound,
          dice,
          dieIds: dice.map((die) => die.id),
        },
        availableOperations: ["submit_round_roll"],
        observation: state,
      };
    }
    throw new Error(`formal game session cannot expose phase ${state.phase}`);
  }

  exportCheckpoint() {
    return {
      schema: "ufs_formal_feedback_oracle_checkpoint_v1",
      state: clone(this.state),
      pendingResearch: clone(this.pendingResearch),
      pendingRandom: clone(this.pendingRandom),
      deferredBefore: clone(this.deferredBefore),
    };
  }

  static restore(map, checkpoint) {
    if (!["ufs_formal_feedback_oracle_checkpoint_v0", "ufs_formal_feedback_oracle_checkpoint_v1"]
      .includes(checkpoint?.schema)) {
      throw new TypeError("invalid formal game checkpoint");
    }
    return new UfsFormalFeedbackOracle({
      map,
      state: checkpoint.state,
      pendingResearch: checkpoint.pendingResearch,
      pendingRandom: checkpoint.pendingRandom,
      deferredBefore: checkpoint.deferredBefore,
    });
  }

  _finishSpawningIfReady() {
    if (this.state.phase === "spawning" && !engine.nextSpawnChoice(this.map, this.state)) {
      this.state = engine.finishDeferredMothership(this.state);
    }
  }

  apply(action, cognitiveResponse = {}) {
    if (!this.state) throw new Error("formal game session has not started");
    const internalBefore = this.exportCheckpoint();
    const stepBefore = this.view();
    let stable = true;
    let deferredReason = null;
    try {
      const decision = this.decision();
      if (!decision.availableOperations.includes(action.type)) {
        throw new Error(`formal operation not available: ${action.type}`);
      }
      if (action.type === "place_die") {
        const legal = engine.allLegalWorkerPlacements(this.map, this.state).find((row) => (
          row.dieId === action.dieId && row.cellId === action.cellId
        ));
        if (!legal) throw new Error(`formal engine rejected placement ${action.dieId}@${action.cellId}`);
        this.state = engine.applyWorkerPlacement(this.map, this.state, legal, { rerollMode: "deferred" });
        const placed = this.state.dice.find((die) => die.id === action.dieId);
        const unplacedIds = this.state.dice.filter((die) => !die.placed).map((die) => die.id);
        if (placed?.color === "white" && unplacedIds.length) {
          this.pendingRandom = {
            type: "white_reroll",
            afterDieId: action.dieId,
            dieIds: unplacedIds,
          };
          stable = false;
          deferredReason = "awaiting_public_white_reroll";
        }
      } else if (action.type === "submit_random_observation") {
        if (!this.pendingRandom || !exactRollValues(this.pendingRandom.dieIds, action.values)) {
          throw new Error("formal reroll requires every pending die value from 1 to 6");
        }
        for (const [dieId, value] of Object.entries(action.values)) {
          this.state.dice.find((die) => die.id === dieId).value = value;
        }
        this.pendingRandom = null;
      } else if (action.type === "resolve_room") {
        if (action.pay !== true) throw new Error("formal room resolution requires explicit pay:true");
        const legal = matchingRoomAction(this.map, this.state, action);
        if (!legal || legal.affordable === false) throw new Error(`formal engine rejected room ${action.roomId}`);
        if (legal.roomType === "research") {
          const room = this.map.base.rooms.find((row) => row.id === legal.roomId);
          const continuousCosts = this.map.research.costs.slice(this.state.researchIndex);
          this.pendingResearch = {
            action: legal,
            pending: {
              type: "room_effect",
              effectKind: "research_room_choice",
              roomId: legal.roomId,
              budget: legal.value,
              continuousCosts,
              maxAdvanceSteps: engine.maxResearchAdvance(this.map, this.state, room, legal.value),
            },
          };
          stable = false;
          deferredReason = "awaiting_research_advance_choice";
        } else {
          this.state = engine.applyRoomAction(this.map, this.state, legal);
        }
      } else if (action.type === "choose_research_advance") {
        const pending = this.pendingResearch;
        if (!pending || pending.action.roomId !== action.roomId
          || !Number.isInteger(action.advanceSteps)
          || action.advanceSteps < 0
          || action.advanceSteps > pending.pending.maxAdvanceSteps) {
          throw new Error(`formal research choice rejected for ${action.roomId}`);
        }
        this.state = engine.applyRoomAction(this.map, this.state, {
          ...pending.action,
          advanceSteps: action.advanceSteps,
        });
        this.pendingResearch = null;
      } else if (["excavate", "skip_worker", "end_rooms"].includes(action.type)) {
        const legal = matchingRoomAction(this.map, this.state, action);
        if (!legal || legal.affordable === false) throw new Error(`formal engine rejected ${action.type}`);
        this.state = engine.applyRoomAction(this.map, this.state, legal);
        if (action.type === "end_rooms") {
          this.state = engine.resolveMothership(this.map, this.state, {
            startNextRound: false,
            deferSpawns: true,
          });
          this._finishSpawningIfReady();
          if (!this.state.outcome && this.state.phase === "spawning") {
            stable = false;
            deferredReason = "awaiting_spawn_choices";
          }
        }
      } else if (action.type === "choose_spawn") {
        const column = Number(String(action.dropPointId).slice("DP-C".length)) - 1;
        this.state = engine.applySpawnChoice(this.map, this.state, {
          shipId: action.shipId,
          column,
        });
        this._finishSpawningIfReady();
        if (this.state.phase === "spawning") {
          stable = false;
          deferredReason = "awaiting_more_spawn_choices";
        }
      } else if (action.type === "submit_round_roll") {
        const pending = decision.pending;
        if (pending?.type !== "next_round_roll" || !exactRollValues(pending.dieIds, action.values)) {
          throw new Error("formal next round roll requires all five d6 values");
        }
        this.state.round += 1;
        this.state.phase = "dice";
        this.state.dice = pending.dice.map((die) => ({
          id: die.id,
          color: die.color,
          value: action.values[die.id],
          placed: false,
        }));
        this.state.placements = [];
        this.state.outcome = null;
      } else {
        throw new Error(`formal game session does not support ${action.type}`);
      }

      if (!stable && !this.deferredBefore) this.deferredBefore = clone(stepBefore);
      const after = this.view();
      const reportedBefore = stable && this.deferredBefore ? clone(this.deferredBefore) : stepBefore;
      if (stable) this.deferredBefore = null;
      const changedSections = differingSections(reportedBefore, after);
      const cognitiveWorld = cognitiveResponse.__hostState
        ? publicStateView(cognitiveResponse.__hostState)
        : null;
      const cognitiveDifferences = stable ? differingSections(after, cognitiveWorld) : [];
      return {
        schema: "ufs_formal_feedback_step_v1",
        accepted: true,
        stable,
        deferredReason,
        before: reportedBefore,
        after,
        changedSections,
        cognitiveMatch: stable ? cognitiveDifferences.length === 0 : null,
        differingSections: cognitiveDifferences,
        decision: this.decision(),
      };
    } catch (error) {
      const restored = UfsFormalFeedbackOracle.restore(this.map, internalBefore);
      this.state = restored.state;
      this.pendingResearch = restored.pendingResearch;
      this.pendingRandom = restored.pendingRandom;
      this.deferredBefore = restored.deferredBefore;
      return {
        schema: "ufs_formal_feedback_step_v1",
        accepted: false,
        stable: false,
        deferredReason: null,
        before: stepBefore,
        after: this.view(),
        changedSections: [],
        cognitiveMatch: null,
        differingSections: [],
        error: error.message,
        decision: this.decision(),
      };
    }
  }
}

module.exports = {
  UfsFormalFeedbackOracle,
  differingSections,
  formalRoomCandidates,
  publicStateView,
  seedFormalState,
};
