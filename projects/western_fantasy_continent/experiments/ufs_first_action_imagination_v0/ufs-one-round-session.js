"use strict";

const { UfsOneRoundImagination } = require("./ufs-one-round-imagination");

function clone(value) {
  return structuredClone(value);
}

function playerObservation(world) {
  const keys = [
    "round", "phase", "energy", "damage", "researchIndex", "excavatorIndex",
    "mothershipRow", "outcome", "dice", "ships", "waitingShips", "placements", "robots",
  ];
  return Object.fromEntries(keys.map((key) => [key, clone(world[key] ?? null)]));
}

function availableOperations(result) {
  if (result.status === "complete") return [];
  if (result.status === "random" && result.pending?.type === "white_reroll") {
    return ["submit_random_observation"];
  }
  if (result.status !== "choice") return [];
  if (result.pending?.type === "place_die") return ["place_die"];
  if (result.pending?.type === "room_action") {
    return ["resolve_room", "excavate", "skip_worker", "end_rooms"];
  }
  if (result.pending?.type === "room_effect"
    && result.pending?.effectKind === "research_room_choice") {
    return ["choose_research_advance"];
  }
  if (result.pending?.type === "spawn") return ["choose_spawn"];
  return [];
}

function changedTrace(previous = {}, current = {}) {
  const names = ["placements", "randomBoundaries", "roomSteps", "mothershipSteps", "administrativeTransitions"];
  return Object.fromEntries(names.map((name) => {
    const before = previous[name] || [];
    const after = current[name] || [];
    let shared = 0;
    while (shared < before.length && shared < after.length
      && JSON.stringify(before[shared]) === JSON.stringify(after[shared])) shared += 1;
    return [name, clone(after.slice(shared))];
  }));
}

class UfsOneRoundSession {
  constructor({ publicMap, runtime = new UfsOneRoundImagination() } = {}) {
    if (!publicMap) throw new TypeError("UfsOneRoundSession requires a publicMap");
    this.publicMap = clone(publicMap);
    this.runtime = runtime;
    this.started = false;
    this.initialPublicState = null;
    this.attentionSeed = null;
    this.script = null;
    this.randomObservations = null;
    this.actionHistory = [];
    this.lastRuntimeResult = null;
    this.lastResponse = null;
  }

  start({ initialPublicState, attentionSeed = 20260824 }) {
    if (this.started) throw new Error("session has already started");
    this.started = true;
    this.initialPublicState = clone(initialPublicState);
    this.attentionSeed = attentionSeed;
    this.script = { placements: [], roomActions: [], spawnChoices: {} };
    this.randomObservations = {};
    this.actionHistory = [];
    return this._run(null, {});
  }

  advance(action) {
    if (!this.started) throw new Error("session must be started before advance");
    if (!action || typeof action.type !== "string") throw new TypeError("advance requires an action with type");
    const allowed = this.lastResponse.availableOperations;
    if (!allowed.includes(action.type)) {
      return this._rejected(action, `operation_not_available:${action.type}`);
    }
    const nextScript = clone(this.script);
    const nextRandom = clone(this.randomObservations);
    if (action.type === "place_die") {
      if (typeof action.dieId !== "string" || typeof action.cellId !== "string") {
        return this._rejected(action, "place_die_requires_dieId_and_cellId");
      }
      nextScript.placements.push({ dieId: action.dieId, cellId: action.cellId });
    } else if (action.type === "submit_random_observation") {
      if (!action.values || typeof action.values !== "object") {
        return this._rejected(action, "submit_random_observation_requires_values");
      }
      const afterDieId = this.lastRuntimeResult.pending.afterDieId;
      nextRandom[`after:${afterDieId}`] = clone(action.values);
    } else if (action.type === "resolve_room") {
      if (typeof action.roomId !== "string") return this._rejected(action, "resolve_room_requires_roomId");
      if (action.pay !== true) return this._rejected(action, "resolve_room_requires_explicit_pay_true_or_skip");
      nextScript.roomActions.push({ type: "resolve_room", roomId: action.roomId, pay: true });
    } else if (action.type === "choose_research_advance") {
      const pending = this.lastRuntimeResult.pending;
      if (pending?.type !== "room_effect" || pending.effectKind !== "research_room_choice") {
        return this._rejected(action, "choose_research_advance_requires_current_research_choice");
      }
      if (action.roomId !== pending.roomId || !Number.isInteger(action.advanceSteps)
        || action.advanceSteps < 0 || action.advanceSteps > pending.maxAdvanceSteps) {
        return this._rejected(action, "choose_research_advance_requires_current_room_and_legal_steps");
      }
      const targetIndex = nextScript.roomActions.findLastIndex((row) => (
        row.type === "resolve_room" && row.roomId === pending.roomId && row.advanceSteps == null
      ));
      if (targetIndex < 0) return this._rejected(action, "research_resolution_action_not_found");
      nextScript.roomActions[targetIndex].advanceSteps = action.advanceSteps;
    } else if (action.type === "excavate") {
      if (typeof action.placementId !== "string") return this._rejected(action, "excavate_requires_placementId");
      nextScript.roomActions.push({ type: "excavate", placementId: action.placementId });
    } else if (action.type === "skip_worker") {
      if (typeof action.placementId !== "string") return this._rejected(action, "skip_worker_requires_placementId");
      nextScript.roomActions.push({ type: "skip_worker", placementId: action.placementId });
    } else if (action.type === "end_rooms") {
      nextScript.roomActions.push({ type: "end_rooms" });
    } else if (action.type === "choose_spawn") {
      const pending = this.lastRuntimeResult.pending;
      if (typeof action.dropPointId !== "string" || !pending.candidates.includes(action.dropPointId)) {
        return this._rejected(action, "choose_spawn_requires_a_current_candidate");
      }
      nextScript.spawnChoices[pending.shipId] = action.dropPointId;
    }
    return this._run(action, { nextScript, nextRandom });
  }

  exportCheckpoint() {
    if (!this.started) throw new Error("cannot checkpoint an unstarted session");
    return {
      schema: "ufs_one_round_session_checkpoint_v0",
      initialPublicState: clone(this.initialPublicState),
      publicMap: clone(this.publicMap),
      attentionSeed: this.attentionSeed,
      script: clone(this.script),
      randomObservations: clone(this.randomObservations),
      actionHistory: clone(this.actionHistory),
    };
  }

  static restore(checkpoint, { runtime = new UfsOneRoundImagination() } = {}) {
    if (checkpoint?.schema !== "ufs_one_round_session_checkpoint_v0") {
      throw new TypeError("invalid UFS one-round session checkpoint");
    }
    const session = new UfsOneRoundSession({ publicMap: checkpoint.publicMap, runtime });
    session.started = true;
    session.initialPublicState = clone(checkpoint.initialPublicState);
    session.attentionSeed = checkpoint.attentionSeed;
    session.script = clone(checkpoint.script);
    session.randomObservations = clone(checkpoint.randomObservations);
    session.actionHistory = clone(checkpoint.actionHistory);
    session._run(null, {});
    return session;
  }

  inspectRuntimeResult() {
    return clone(this.lastRuntimeResult);
  }

  _run(action, { nextScript = this.script, nextRandom = this.randomObservations }) {
    const previousTrace = this.lastRuntimeResult?.trace || {};
    let result;
    try {
      result = this.runtime.run({
        initialPublicState: this.initialPublicState,
        publicMap: this.publicMap,
        script: nextScript,
        randomObservations: nextRandom,
        attentionSeed: this.attentionSeed,
        allowPartialScript: true,
        decisionOrigin: "interactive_operation",
        choiceOrigin: "interactive_operation",
      });
    } catch (error) {
      return this._rejected(action, `invalid_action:${error.message}`);
    }
    this.script = clone(nextScript);
    this.randomObservations = clone(nextRandom);
    if (action) this.actionHistory.push(clone(action));
    this.lastRuntimeResult = result;
    const response = {
      schema: "ufs_one_round_session_response_v0",
      status: result.status,
      reason: result.reason,
      observation: playerObservation(result.imaginedWorld),
      pending: clone(result.pending),
      availableOperations: availableOperations(result),
      lastAction: clone(action),
      traceDelta: changedTrace(previousTrace, result.trace),
      actionCount: this.actionHistory.length,
    };
    response.checkpoint = this.exportCheckpoint();
    this.lastResponse = response;
    return clone(response);
  }

  _rejected(action, reason) {
    return {
      schema: "ufs_one_round_session_response_v0",
      status: "rejected",
      reason,
      observation: clone(this.lastResponse?.observation ?? null),
      pending: clone(this.lastResponse?.pending ?? null),
      availableOperations: clone(this.lastResponse?.availableOperations ?? []),
      lastAction: clone(action),
      traceDelta: {},
      actionCount: this.actionHistory.length,
      checkpoint: this.started ? this.exportCheckpoint() : null,
    };
  }
}

module.exports = {
  UfsOneRoundSession,
  availableOperations,
  playerObservation,
};
