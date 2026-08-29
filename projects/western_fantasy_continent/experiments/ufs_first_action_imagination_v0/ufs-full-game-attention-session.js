"use strict";

const { UfsAttentionPlayerSession } = require("./ufs-attention-player-session");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const { UfsOneRoundImagination } = require("./ufs-one-round-imagination");
const { UfsOneRoundSession } = require("./ufs-one-round-session");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const { UfsFormalFeedbackOracle } = require("./ufs-formal-feedback-oracle");
const { UfsFullGameFeedbackBridge } = require("./ufs-full-game-feedback-bridge");
const { splitOperationAndPredictionDeclarations } = require("./ufs-prediction-ticket");

const ROUND_DICE = Object.freeze([
  Object.freeze({ color: "gray", ordinal: 0 }),
  Object.freeze({ color: "gray", ordinal: 1 }),
  Object.freeze({ color: "gray", ordinal: 2 }),
  Object.freeze({ color: "white", ordinal: 3 }),
  Object.freeze({ color: "white", ordinal: 4 }),
]);

function clone(value) {
  return structuredClone(value);
}

function roundAttentionSeed(gameSeed, round) {
  return (Number(gameSeed) + Math.imul(Math.max(0, round - 1), 0x9e3779b1)) >>> 0;
}

function roundDiceSpec(round) {
  return ROUND_DICE.map(({ color, ordinal }) => ({
    id: `r${round}-${color}-${ordinal}`,
    color,
  }));
}

function validateRoundRoll(pending, values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) return false;
  const expected = pending.dice.map((die) => die.id).sort();
  const actual = Object.keys(values).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) return false;
  return expected.every((dieId) => (
    Number.isInteger(values[dieId]) && values[dieId] >= 1 && values[dieId] <= 6
  ));
}

function operationField(kind, options = {}) {
  return { kind, ...clone(options) };
}

function buildOperationContracts({ availableOperations = [], pending = null } = {}) {
  const candidates = pending?.candidates || {};
  return availableOperations.map((type) => {
    const contract = {
      schema: "ufs_public_operation_contract_v1",
      type,
      requiredFields: ["type"],
      fields: { type: operationField("fixed", { value: type }) },
    };
    const requireField = (name, field) => {
      contract.requiredFields.push(name);
      contract.fields[name] = field;
    };
    if (type === "place_die") {
      requireField("dieId", operationField("visible_id", {
        source: "observation.dice",
        filter: { placed: false },
      }));
      requireField("cellId", operationField("visible_id", {
        source: "mapView.baseCells",
        note: "the selected die and cell must form a legal placement under the known rules",
      }));
    } else if (type === "submit_random_observation" || type === "submit_round_roll") {
      requireField("values", operationField("integer_map", {
        keys: clone(pending?.dieIds || pending?.dice?.map((die) => die.id) || []),
        minimum: 1,
        maximum: 6,
        suppliedBy: "random_command",
      }));
    } else if (type === "resolve_room") {
      requireField("roomId", operationField("enum", {
        values: clone(candidates.resolvableRoomIds || []),
      }));
      requireField("pay", operationField("fixed", { value: true }));
    } else if (type === "choose_research_advance") {
      requireField("roomId", operationField("fixed", { value: pending?.roomId }));
      requireField("advanceSteps", operationField("integer", {
        minimum: 0,
        maximum: pending?.maxAdvanceSteps,
      }));
    } else if (type === "excavate") {
      requireField("placementId", operationField("enum", {
        values: clone(candidates.excavationPlacementIds || []),
      }));
    } else if (type === "skip_worker") {
      requireField("placementId", operationField("enum", {
        values: clone(candidates.skippablePlacementIds || []),
      }));
    } else if (type === "choose_spawn") {
      requireField("shipId", operationField("fixed", { value: pending?.shipId }));
      requireField("dropPointId", operationField("enum", {
        values: clone(pending?.candidates || []),
      }));
    }
    contract.optionalFields = ["predictions"];
    return contract;
  });
}

class UfsFullGameAttentionSession {
  constructor({
    publicMap,
    feedbackLearner = new UfsFeedbackLearner(),
    formalFeedbackOracle = null,
    feedbackBridge = null,
    choiceAttentionProvider = null,
    playerIdentity = null,
  } = {}) {
    if (!publicMap) throw new TypeError("UfsFullGameAttentionSession requires a publicMap");
    this.publicMap = clone(publicMap);
    this.feedbackLearner = feedbackLearner;
    this.formalFeedbackOracle = formalFeedbackOracle || new UfsFormalFeedbackOracle({ map: publicMap });
    this.feedbackBridge = feedbackBridge || new UfsFullGameFeedbackBridge({ learner: feedbackLearner });
    this.choiceAttentionProvider = choiceAttentionProvider || new UfsFullAttentionProvider({
      learnedAttentionAdjustments: feedbackLearner.exportAttentionAdjustments(),
    });
    this.playerIdentity = clone(playerIdentity);
    this.started = false;
    this.gameAttentionSeed = null;
    this.roundSession = null;
    this.roundSeed = null;
    this.roundActionCount = 0;
    this.completedRounds = [];
    this.actionHistory = [];
    this.lastPlayerResponse = null;
    this.lastFeedbackAudit = null;
    this.lastCognitiveTrial = null;
    this.appliedConnectionSupport = {};
  }

  start({ initialPublicState, attentionSeed = 20260825 }) {
    if (this.started) throw new Error("full-game session has already started");
    this.started = true;
    this.gameAttentionSeed = Number(attentionSeed) >>> 0;
    this.actionHistory = [];
    this.completedRounds = [];
    this.roundActionCount = 0;
    this.choiceAttentionProvider.beginEpisode();
    const formalDecision = this.formalFeedbackOracle.start(initialPublicState);
    this._startCognitiveRound(formalDecision.observation);
    return this._projectFormalDecision(formalDecision, null);
  }

  advance(action) {
    if (!this.started) throw new Error("full-game session must be started before advance");
    if (!action || typeof action.type !== "string") {
      throw new TypeError("advance requires an action with type");
    }
    let prepared;
    try {
      prepared = splitOperationAndPredictionDeclarations(action);
    } catch (error) {
      return this._rejected(action, `invalid_prediction_ticket:${error.message}`);
    }
    const { operation, declarations: predictionDeclarations } = prepared;
    if (!this.lastPlayerResponse.availableOperations.includes(operation.type)) {
      return this._rejected(action, `operation_not_available:${action.type}`);
    }

    const cognitiveCheckpoint = this.roundSession?.exportCheckpoint() || null;
    const mentalBefore = this._mentalObservation();
    let traceDelta = {};
    let predictedWorld = clone(mentalBefore);
    let cognitiveTrial = null;
    if (this.roundSession?.lastPlayerResponse?.availableOperations?.includes(operation.type)) {
      const cognitive = this.roundSession.advance(operation);
      if (cognitive.status !== "rejected") {
        traceDelta = clone(this.roundSession.coreSession.lastResponse?.traceDelta || {});
        predictedWorld = this._mentalObservation();
        cognitiveTrial = this.roundSession.coreSession.inspectRuntimeResult();
      }
    }

    const formalStep = this.formalFeedbackOracle.apply(operation, {
      __hostState: predictedWorld,
    });
    if (!formalStep.accepted) {
      if (cognitiveCheckpoint) this._restoreCognitiveRound(cognitiveCheckpoint);
      return this._rejected(action, `formal_rejected:${formalStep.error}`);
    }

    this.actionHistory.push(clone(operation));
    this.lastCognitiveTrial = clone(cognitiveTrial);
    if (operation.type === "submit_round_roll") {
      this.roundActionCount = 0;
      this._startCognitiveRound(formalStep.after);
    } else {
      this.roundActionCount += 1;
    }
    this._recordCompletedRound(formalStep.after);
    const response = this._projectFormalDecision(formalStep.decision, operation);
    this.lastFeedbackAudit = this.feedbackBridge.process({
      operation,
      traceDelta,
      formalStep,
      playerResponse: response,
      mentalBefore,
      predictedWorld,
      predictionDeclarations,
    });
    this.lastFeedbackAudit.formalStep = clone(formalStep);
    this._applyLearningToRuntime();
    if (formalStep.stable && ["dice", "rooms"].includes(formalStep.after.phase)) {
      const rebasedBelief = this._mergeObservedFormalFeedback({
        predictedWorld,
        formalWorld: formalStep.after,
        playerResponse: response,
      });
      this._startCognitiveRound(rebasedBelief);
    }
    return clone(response);
  }

  exportCheckpoint() {
    if (!this.started) throw new Error("cannot checkpoint an unstarted full-game session");
    return {
      schema: "ufs_full_game_attention_checkpoint_v2",
      publicMap: clone(this.publicMap),
      gameAttentionSeed: this.gameAttentionSeed,
      roundSeed: this.roundSeed,
      roundActionCount: this.roundActionCount,
      completedRounds: clone(this.completedRounds),
      actionHistory: clone(this.actionHistory),
      roundSession: this.roundSession.exportCheckpoint(),
      choiceAttentionTrace: this.choiceAttentionProvider.traceSnapshot(),
      lastPlayerResponse: clone(this.lastPlayerResponse),
      feedbackLearningState: this.feedbackLearner.exportState(),
      feedbackBridge: this.feedbackBridge.exportCheckpoint(),
      formalFeedbackOracle: this.formalFeedbackOracle.exportCheckpoint(),
      lastFeedbackAudit: clone(this.lastFeedbackAudit),
      lastCognitiveTrial: clone(this.lastCognitiveTrial),
      playerIdentity: clone(this.playerIdentity),
    };
  }

  static restore(checkpoint) {
    if (!["ufs_full_game_attention_checkpoint_v0", "ufs_full_game_attention_checkpoint_v1",
      "ufs_full_game_attention_checkpoint_v2"]
      .includes(checkpoint?.schema)) {
      throw new TypeError("invalid UFS full-game attention checkpoint");
    }
    const feedbackLearner = new UfsFeedbackLearner({ state: checkpoint.feedbackLearningState });
    const bridgeState = checkpoint.feedbackBridge || {
      pendingPredictions: [], previousTrajectoryId: null, nextEvidenceId: 1,
    };
    const feedbackBridge = new UfsFullGameFeedbackBridge({
      learner: feedbackLearner,
      pendingPredictions: bridgeState.pendingPredictions,
      pendingPredictionTickets: bridgeState.pendingPredictionTickets || [],
      previousTrajectoryId: bridgeState.previousTrajectoryId,
      nextEvidenceId: bridgeState.nextEvidenceId,
      nextTicketId: bridgeState.nextTicketId || 1,
      seenPredictionKeys: bridgeState.seenPredictionKeys || [],
      predictionLedger: bridgeState.predictionLedger || [],
    });
    const formalFeedbackOracle = checkpoint.formalFeedbackOracle
      ? UfsFormalFeedbackOracle.restore(checkpoint.publicMap, checkpoint.formalFeedbackOracle)
      : new UfsFormalFeedbackOracle({ map: checkpoint.publicMap });
    const choiceAttentionProvider = new UfsFullAttentionProvider({
      learnedAttentionAdjustments: feedbackLearner.exportAttentionAdjustments(),
    });
    if (checkpoint.choiceAttentionTrace) {
      choiceAttentionProvider.restoreTrace(checkpoint.choiceAttentionTrace);
    }
    const session = new UfsFullGameAttentionSession({
      publicMap: checkpoint.publicMap,
      feedbackLearner,
      formalFeedbackOracle,
      feedbackBridge,
      choiceAttentionProvider,
      playerIdentity: checkpoint.playerIdentity || null,
    });
    session.started = true;
    session.gameAttentionSeed = checkpoint.gameAttentionSeed;
    session.roundSeed = checkpoint.roundSeed;
    session.roundActionCount = checkpoint.roundActionCount
      ?? checkpoint.roundSession?.core?.actionHistory?.length
      ?? 0;
    session.completedRounds = clone(checkpoint.completedRounds || []);
    session.actionHistory = clone(checkpoint.actionHistory || []);
    session._restoreCognitiveRound(checkpoint.roundSession);
    if (!checkpoint.formalFeedbackOracle) {
      formalFeedbackOracle.start(session._mentalObservation());
    }
    session.lastPlayerResponse = clone(checkpoint.lastPlayerResponse);
    session.lastFeedbackAudit = clone(checkpoint.lastFeedbackAudit || null);
    session.lastCognitiveTrial = clone(checkpoint.lastCognitiveTrial || null);
    session.appliedConnectionSupport = {};
    session._applyLearningToRuntime();
    return session;
  }

  inspectHostState() {
    return {
      observation: this.formalFeedbackOracle.view(),
      checkpoint: this.exportCheckpoint(),
    };
  }

  inspectMentalState() {
    return {
      observation: this._mentalObservation(),
      differsFromFormal: this.lastFeedbackAudit?.formalStep?.differingSections || [],
    };
  }

  inspectLastCognitiveTrial() {
    return clone(this.lastCognitiveTrial);
  }

  inspectPlayerIdentity() {
    return clone(this.playerIdentity);
  }

  inspectFeedbackState() {
    return {
      learning: this.feedbackLearner.exportState(),
      formalState: this.formalFeedbackOracle.view(),
      mentalState: this._mentalObservation(),
      lastAudit: clone(this.lastFeedbackAudit),
      predictionLedger: this.feedbackBridge.exportPredictionLedger(),
    };
  }

  _newRuntime() {
    return new UfsOneRoundImagination({
      attentionProvider: new UfsFullAttentionProvider({
        learnedAttentionAdjustments: this.feedbackLearner.exportAttentionAdjustments(),
      }),
    });
  }

  _startCognitiveRound(initialPublicState) {
    this.roundSeed = roundAttentionSeed(this.gameAttentionSeed, initialPublicState.round);
    const learned = this.feedbackLearner.exportAttentionAdjustments();
    const runtime = this._newRuntime();
    const coreSession = new UfsOneRoundSession({ publicMap: this.publicMap, runtime });
    this.roundSession = new UfsAttentionPlayerSession({
      publicMap: this.publicMap,
      coreSession,
      attentionProvider: new UfsFullAttentionProvider({ learnedAttentionAdjustments: learned }),
    });
    this.appliedConnectionSupport = {};
    this._applyLearningToRuntime();
    this.roundSession.start({
      initialPublicState: clone(initialPublicState),
      attentionSeed: this.roundSeed,
    });
  }

  _restoreCognitiveRound(checkpoint) {
    const learned = this.feedbackLearner.exportAttentionAdjustments();
    this.roundSession = UfsAttentionPlayerSession.restore(checkpoint, {
      runtime: this._newRuntime(),
      attentionProvider: new UfsFullAttentionProvider({ learnedAttentionAdjustments: learned }),
    });
    this.appliedConnectionSupport = {};
    this._applyLearningToRuntime();
  }

  _runtimeMemories() {
    const runtime = this.roundSession?.coreSession?.runtime;
    return [
      runtime?.eventImagination?.memory,
      runtime?.placementImagination?.placementRuleImagination?.memory,
      runtime?.placementImagination?.eventRuleImagination?.memory,
    ].filter(Boolean);
  }

  _applyLearningToRuntime() {
    const attention = this.feedbackLearner.exportAttentionAdjustments();
    this.choiceAttentionProvider.setLearnedAttentionAdjustments(attention);
    if (!this.roundSession) return;
    this.roundSession.attentionProvider.setLearnedAttentionAdjustments(attention);
    this.roundSession.coreSession.runtime.attentionProvider.setLearnedAttentionAdjustments(attention);
    for (const update of this.feedbackLearner.exportState().connectionUpdates) {
      const applied = Number(this.appliedConnectionSupport[update.trajectoryId] || 0);
      const delta = update.addedSupport - applied;
      if (!(delta > 0)) continue;
      for (const memory of this._runtimeMemories()) {
        try {
          memory.reinforce(update.trajectoryId, { amount: delta });
        } catch (error) {
          if (!String(error.message).includes("unknown trajectory")) throw error;
        }
      }
      this.appliedConnectionSupport[update.trajectoryId] = update.addedSupport;
    }
  }

  _mentalObservation() {
    if (!this.roundSession) return null;
    return clone(this.roundSession.coreSession.inspectRuntimeResult().imaginedWorld);
  }

  _mergeObservedFormalFeedback({ predictedWorld, formalWorld, playerResponse }) {
    const belief = clone(predictedWorld || formalWorld);
    const publicKeys = [
      "round", "phase", "energy", "damage", "researchIndex", "excavatorIndex",
      "mothershipRow", "outcome", "dice", "ships", "waitingShips", "placements", "robots",
    ];
    if (playerResponse.attention?.mode === "all") {
      for (const key of publicKeys) belief[key] = clone(formalWorld[key]);
      return belief;
    }

    // The environment's decision boundary is explicit even if a numeric track
    // was not selected by probabilistic attention.
    belief.round = formalWorld.round;
    belief.phase = formalWorld.phase;
    belief.outcome = clone(formalWorld.outcome);
    const collections = {
      die: "dice",
      ship: "ships",
      waiting_ship: "waitingShips",
      placement: "placements",
      robot: "robots",
    };
    for (const item of playerResponse.noticedItems || []) {
      if (item.itemId.startsWith("track:")) {
        belief[item.itemId.slice("track:".length)] = clone(item.value);
        continue;
      }
      const collection = collections[item.kind];
      if (!collection || !item.value?.id) continue;
      if (!Array.isArray(belief[collection])) belief[collection] = [];
      const index = belief[collection].findIndex((row) => row.id === item.value.id);
      if (index >= 0) belief[collection][index] = clone(item.value);
      else belief[collection].push(clone(item.value));
      if (item.kind === "ship") {
        belief.waitingShips = (belief.waitingShips || [])
          .filter((row) => row.id !== item.value.id);
      } else if (item.kind === "waiting_ship") {
        belief.ships = (belief.ships || [])
          .filter((row) => row.id !== item.value.id);
      }
    }
    return belief;
  }

  _recordCompletedRound(formalState) {
    if (formalState.phase !== "new_round" && !formalState.outcome) return;
    if (this.completedRounds.some((row) => row.round === formalState.round)) return;
    this.completedRounds.push({
      round: formalState.round,
      energy: formalState.energy,
      damage: formalState.damage,
      researchIndex: formalState.researchIndex,
      excavatorIndex: formalState.excavatorIndex,
      mothershipRow: formalState.mothershipRow,
    });
  }

  _projectFormalDecision(formalDecision, lastAction) {
    const formalWorld = clone(formalDecision.observation);
    const attention = this.choiceAttentionProvider.noticeChoice({
      fullWorld: formalWorld,
      publicMap: this.publicMap,
      pending: formalDecision.pending,
      lastAction,
      randomSeed: (this.roundSeed + this.actionHistory.length * 7919) >>> 0,
    });
    const response = {
      schema: "ufs_full_game_attention_response_v1",
      status: formalDecision.status,
      reason: formalDecision.reason,
      observation: attention.observation,
      mapView: attention.mapView,
      noticedItems: attention.noticedItems,
      attention: {
        ...attention.attention,
        seed: this.roundSeed,
        gameSeed: this.gameAttentionSeed,
      },
      pending: clone(formalDecision.pending),
      availableOperations: clone(formalDecision.availableOperations),
      operationContracts: buildOperationContracts(formalDecision),
      lastAction: clone(lastAction),
      roundActionCount: this.roundActionCount,
      actionCount: this.actionHistory.length,
      game: {
        attentionSeed: this.gameAttentionSeed,
        roundAttentionSeed: this.roundSeed,
        round: formalWorld.round,
        completedRoundCount: this.completedRounds.length,
        ...(this.playerIdentity ? {
          playerId: this.playerIdentity.playerId,
          episodeId: this.playerIdentity.episodeId,
          playerProfileRevision: this.playerIdentity.baseProfileRevision,
        } : {}),
        ...(formalWorld.outcome ? { outcome: clone(formalWorld.outcome) } : {}),
      },
    };
    this.lastPlayerResponse = clone(response);
    return response;
  }

  _rejected(action, reason) {
    return {
      ...clone(this.lastPlayerResponse),
      status: "rejected",
      reason,
      lastAction: clone(action),
    };
  }
}

module.exports = {
  UfsFullGameAttentionSession,
  buildOperationContracts,
  roundAttentionSeed,
  roundDiceSpec,
  validateRoundRoll,
};
