"use strict";

const { UfsAttentionPlayerSession } = require("./ufs-attention-player-session");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const { UfsOneRoundImagination } = require("./ufs-one-round-imagination");
const { UfsOneRoundSession } = require("./ufs-one-round-session");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const { UfsFormalFeedbackOracle } = require("./ufs-formal-feedback-oracle");
const { UfsFullGameFeedbackBridge } = require("./ufs-full-game-feedback-bridge");
const {
  PlayerFeedbackGteMemory,
  compileFeedbackGteForLearner,
} = require("./player-feedback-gte");
const { splitOperationAndPredictionDeclarations } = require("./ufs-prediction-ticket");
const { planPrechoice } = require("./ufs-prechoice-planner");
const { imagineAutomaticSequentialPlan } = require("./ufs-automatic-sequential-imagination");

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

function sameOperation(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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
    contract.optionalFields = ["predictions", "cognitiveUnit"];
    return contract;
  });
}

class UfsFullGameAttentionSession {
  constructor({
    publicMap,
    feedbackLearner = new UfsFeedbackLearner(),
    formalFeedbackOracle = null,
    feedbackBridge = null,
    feedbackGteOverlay = null,
    feedbackGteCompiler = null,
    choiceAttentionProvider = null,
    playerIdentity = null,
  } = {}) {
    if (!publicMap) throw new TypeError("UfsFullGameAttentionSession requires a publicMap");
    this.publicMap = clone(publicMap);
    this.feedbackLearner = feedbackLearner;
    this.formalFeedbackOracle = formalFeedbackOracle || new UfsFormalFeedbackOracle({ map: publicMap });
    this.feedbackBridge = feedbackBridge || new UfsFullGameFeedbackBridge({ learner: feedbackLearner });
    this.feedbackGteOverlay = clone(feedbackGteOverlay);
    this.feedbackGteCompiler = feedbackGteCompiler;
    this.lastFeedbackGteCompile = null;
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
    this.activeCognitiveUnit = null;
    this.lastCognitiveUnitTransition = null;
    this.appliedConnectionSupport = {};
    this._refreshFeedbackGteMemory();
  }

  start({ initialPublicState, attentionSeed = 20260825 }) {
    if (this.started) throw new Error("full-game session has already started");
    this.started = true;
    this.gameAttentionSeed = Number(attentionSeed) >>> 0;
    this.actionHistory = [];
    this.completedRounds = [];
    this.roundActionCount = 0;
    this.lastFeedbackGteCompile = this._compilePendingFeedbackGte({ throwOnFailure: true });
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
    if (this.feedbackLearner.pendingMatrixRecords().length > 0 && this.feedbackGteCompiler) {
      const retry = this._compilePendingFeedbackGte();
      if (retry.status === "failed") {
        return this._rejected(action, `feedback_gte_compile_pending:${retry.error}`);
      }
    }
    let prepared;
    try {
      prepared = splitOperationAndPredictionDeclarations(action);
    } catch (error) {
      return this._rejected(action, `invalid_prediction_ticket:${error.message}`);
    }
    const {
      operation,
      declarations: predictionDeclarations,
      cognitiveUnit,
    } = prepared;
    if (!this.lastPlayerResponse.availableOperations.includes(operation.type)) {
      return this._rejected(action, `operation_not_available:${action.type}`);
    }
    let cognitiveUnitCommit = null;
    if (cognitiveUnit) {
      const expected = cognitiveUnit.operations[cognitiveUnit.nextOperationIndex];
      if (!sameOperation(expected, operation)) {
        return this._rejected(action, "cognitive_unit_operation_does_not_match_sequence");
      }
      if (this.activeCognitiveUnit) {
        if (JSON.stringify(this.activeCognitiveUnit.operations) !== JSON.stringify(cognitiveUnit.operations)
          || cognitiveUnit.nextOperationIndex !== this.activeCognitiveUnit.nextOperationIndex) {
          return this._rejected(action, "cognitive_unit_continuation_does_not_match_active_unit");
        }
      } else if (cognitiveUnit.nextOperationIndex !== 0) {
        return this._rejected(action, "cognitive_unit_must_start_at_operation_zero");
      }
      cognitiveUnitCommit = clone(cognitiveUnit);
    } else if (this.activeCognitiveUnit) {
      const expected = this.activeCognitiveUnit.operations[this.activeCognitiveUnit.nextOperationIndex];
      if (sameOperation(expected, operation)) cognitiveUnitCommit = clone(this.activeCognitiveUnit);
      else {
        this.lastCognitiveUnitTransition = {
          status: "abandoned",
          reason: "submitted_operation_left_active_cognitive_unit",
          unit: clone(this.activeCognitiveUnit),
        };
        this.activeCognitiveUnit = null;
      }
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
    if (cognitiveUnitCommit) {
      const nextOperationIndex = cognitiveUnitCommit.nextOperationIndex + 1;
      if (nextOperationIndex >= cognitiveUnitCommit.operations.length) {
        this.lastCognitiveUnitTransition = {
          status: "completed",
          reason: cognitiveUnitCommit.completionReason,
          unit: { ...clone(cognitiveUnitCommit), nextOperationIndex },
        };
        this.activeCognitiveUnit = null;
      } else {
        this.activeCognitiveUnit = { ...clone(cognitiveUnitCommit), nextOperationIndex };
        this.lastCognitiveUnitTransition = {
          status: "in_progress",
          reason: "awaiting_next_planned_operation",
          unit: clone(this.activeCognitiveUnit),
        };
      }
    }
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
      cognitiveUnitEvent: cognitiveUnitCommit ? {
        operationIndex: cognitiveUnitCommit.nextOperationIndex,
        status: this.lastCognitiveUnitTransition?.status || "in_progress",
        unit: clone(cognitiveUnitCommit),
      } : null,
    });
    this.lastFeedbackGteCompile = this._compilePendingFeedbackGte();
    this.lastFeedbackAudit.feedbackGteCompile = clone(this.lastFeedbackGteCompile);
    this.lastFeedbackAudit.formalStep = clone(formalStep);
    this._applyLearningToRuntime();
    const shouldRebaseAtPublicBoundary = formalStep.after.phase === "spawning"
      || (formalStep.stable && ["dice", "rooms"].includes(formalStep.after.phase));
    if (operation.type !== "submit_round_roll" && shouldRebaseAtPublicBoundary) {
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
      feedbackGteOverlay: clone(this.feedbackGteOverlay),
      lastFeedbackGteCompile: clone(this.lastFeedbackGteCompile),
      formalFeedbackOracle: this.formalFeedbackOracle.exportCheckpoint(),
      lastFeedbackAudit: clone(this.lastFeedbackAudit),
      lastCognitiveTrial: clone(this.lastCognitiveTrial),
      activeCognitiveUnit: clone(this.activeCognitiveUnit),
      lastCognitiveUnitTransition: clone(this.lastCognitiveUnitTransition),
      playerIdentity: clone(this.playerIdentity),
    };
  }

  static restore(checkpoint, { feedbackGteOverlay = null, feedbackGteCompiler = null } = {}) {
    if (!["ufs_full_game_attention_checkpoint_v0", "ufs_full_game_attention_checkpoint_v1",
      "ufs_full_game_attention_checkpoint_v2"]
      .includes(checkpoint?.schema)) {
      throw new TypeError("invalid UFS full-game attention checkpoint");
    }
    const feedbackLearner = new UfsFeedbackLearner({ state: checkpoint.feedbackLearningState });
    const bridgeState = checkpoint.feedbackBridge || {
      pendingPredictions: [], previousTrajectoryId: null, nextEvidenceId: 1,
    };
    const restoredFeedbackGteOverlay = checkpoint.feedbackGteOverlay || feedbackGteOverlay;
    const feedbackBridge = new UfsFullGameFeedbackBridge({
      learner: feedbackLearner,
      feedbackGteMemory: restoredFeedbackGteOverlay == null ? null : new PlayerFeedbackGteMemory({
        overlay: restoredFeedbackGteOverlay,
        trajectories: feedbackLearner.exportState().trajectories,
        memories: feedbackLearner.exportState().memories,
        chains: feedbackLearner.exportState().chains,
      }),
      pendingPredictions: bridgeState.pendingPredictions,
      pendingPredictionTickets: bridgeState.pendingPredictionTickets || [],
      pendingCognitiveUnitTickets: bridgeState.pendingCognitiveUnitTickets || [],
      completedCognitiveUnitPending: bridgeState.completedCognitiveUnitPending || false,
      episodeId: bridgeState.episodeId || null,
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
      feedbackGteOverlay: restoredFeedbackGteOverlay,
      feedbackGteCompiler,
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
    session.activeCognitiveUnit = clone(checkpoint.activeCognitiveUnit || null);
    session.lastCognitiveUnitTransition = clone(checkpoint.lastCognitiveUnitTransition || null);
    session.lastFeedbackGteCompile = clone(checkpoint.lastFeedbackGteCompile || null);
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
      feedbackGte: {
        matrixRecords: this.feedbackGteOverlay?.recordIds.length || 0,
        fingerprint: this.feedbackGteOverlay?.fingerprint || null,
        pendingRecords: this.feedbackLearner.pendingMatrixRecords().length,
        lastCompile: clone(this.lastFeedbackGteCompile),
      },
    };
  }

  predictLearnedTransition(currentQ, operations, options = {}) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new TypeError("predictLearnedTransition requires an operation sequence");
    }
    const matrix = this.feedbackBridge.feedbackGteMemory;
    const experiences = this.feedbackLearner.recallExperiences(currentQ, {
      operations,
      context: options.context ?? null,
      topK: options.topK,
    });
    if (matrix) {
      return {
        mode: "gte_joint_current_operation",
        matches: matrix.query(currentQ, { ...options, operations }),
        memoryIds: experiences.map((row) => row.memoryId),
        memories: experiences,
      };
    }
    const recalled = this.feedbackLearner.recall(currentQ, { ...options, operations });
    return {
      mode: "exact_uncompiled_transition",
      matches: recalled.candidates.map((trajectory) => ({
        activation: 1,
        trajectory,
        supportingMemoryIds: clone(trajectory.supportingMemoryIds || []),
        supportingMemories: (trajectory.supportingMemoryIds || [])
          .map((id) => this.feedbackLearner.recallMemory(id))
          .filter(Boolean),
      })),
      memoryIds: experiences.map((row) => row.memoryId),
      memories: experiences,
    };
  }

  traceLearnedTransition(currentQ, followingQ, options = {}) {
    const exact = this.feedbackLearner.traceTransition(currentQ, followingQ, options);
    const matrix = this.feedbackBridge.feedbackGteMemory;
    if (matrix) {
      return {
        mode: "gte_paired_transition",
        matches: matrix.queryPair(currentQ, followingQ, options),
        trajectoryIds: exact.trajectoryIds,
        memoryIds: exact.memoryIds,
        memories: exact.memories,
      };
    }
    return {
      mode: "exact_uncompiled_transition",
      matches: exact.trajectories.map((trajectory) => ({
        activation: 1,
        trajectory,
        supportingMemoryIds: clone(trajectory.supportingMemoryIds || []),
        supportingMemories: (trajectory.supportingMemoryIds || [])
          .map((id) => this.feedbackLearner.recallMemory(id))
          .filter(Boolean),
      })),
      trajectoryIds: exact.trajectoryIds,
      memoryIds: exact.memoryIds,
      memories: exact.memories,
    };
  }

  recallExplicitMemory(memoryId) {
    return this.feedbackLearner.recallMemory(memoryId);
  }

  exportFeedbackGteOverlay() {
    return clone(this.feedbackGteOverlay);
  }

  ensureFeedbackGteCompiled({ compiler = this.feedbackGteCompiler } = {}) {
    return this._compilePendingFeedbackGte({ compiler, throwOnFailure: true });
  }

  imagineSequentialPlan({ steps } = {}) {
    if (!this.started) throw new Error("full-game session must be started before imagination");
    if (!this.roundSession) throw new Error("no cognitive round is available for imagination");
    const cognitiveCheckpoint = this.roundSession.exportCheckpoint();
    const fork = this._forkCognitiveRound(cognitiveCheckpoint);
    return imagineAutomaticSequentialPlan({ cognitiveFork: fork, steps });
  }

  planCurrentChoice({
    queryCompiler = this.feedbackGteCompiler,
    maxUnitOperations = 4,
  } = {}) {
    if (!this.started) throw new Error("full-game session must be started before planning");
    if (this.lastPlayerResponse?.status !== "choice") {
      throw new Error(`planning requires a choice boundary, got ${this.lastPlayerResponse?.status}`);
    }
    if (this.activeCognitiveUnit) {
      const index = this.activeCognitiveUnit.nextOperationIndex;
      const operation = this.activeCognitiveUnit.operations[index];
      if (this.lastPlayerResponse.availableOperations.includes(operation.type)) {
        return {
          schema: "ufs_temporal_cognitive_unit_continuation_plan_v1",
          status: "planned_continuation",
          boundary: clone(this.lastPlayerResponse.pending),
          recommendedPayload: {
            ...clone(operation),
            cognitiveUnit: clone(this.activeCognitiveUnit),
          },
          cognitiveUnit: clone(this.activeCognitiveUnit),
        };
      }
      this.lastCognitiveUnitTransition = {
        status: "suspended",
        reason: "next_planned_operation_not_available_at_current_boundary",
        unit: clone(this.activeCognitiveUnit),
      };
    }
    const cognitiveCheckpoint = this.roundSession.exportCheckpoint();
    const mentalBefore = this._mentalObservation();
    return planPrechoice({
      playerResponse: clone(this.lastPlayerResponse),
      mentalBefore,
      feedbackMemory: this.feedbackBridge.feedbackGteMemory,
      predictionLedger: this.feedbackBridge.exportPredictionLedger(),
      previousTrajectoryId: this.feedbackBridge.previousTrajectoryId,
      queryCompiler,
      publicMap: this.publicMap,
      maxUnitOperations,
      simulateSequence: (operations) => {
        const fork = this._forkCognitiveRound(cognitiveCheckpoint);
        let response = null;
        for (const operation of operations) {
          if (!fork.lastPlayerResponse?.availableOperations?.includes(operation.type)) {
            return {
              status: "rejected",
              reason: `cognitive_unit_operation_unavailable:${operation.type}`,
              imaginedWorld: mentalBefore,
            };
          }
          response = fork.advance(operation);
          if (response.status === "rejected") {
            return {
              status: "rejected",
              reason: response.reason,
              imaginedWorld: mentalBefore,
            };
          }
        }
        return {
          status: response?.status || "rejected",
          reason: response?.reason || "empty_cognitive_unit",
          pending: clone(response?.pending || null),
          imaginedWorld: response?.status === "rejected"
            ? mentalBefore
            : fork.coreSession.inspectRuntimeResult().imaginedWorld,
          simulationReliability: "cognitive_trial_completed",
        };
      },
      simulate: (operation) => {
        const fork = this._forkCognitiveRound(cognitiveCheckpoint);
        if (!fork.lastPlayerResponse?.availableOperations?.includes(operation.type)) {
          return {
            status: "choice",
            reason: "cognitive_trial_operation_unavailable_at_formal_choice",
            imaginedWorld: mentalBefore,
            simulationReliability: "unavailable_use_neutral_baseline",
          };
        }
        const response = fork.advance(operation);
        if (response.status === "rejected" && operation.type !== "place_die") {
          return {
            status: "choice",
            reason: `cognitive_trial_rejected_at_formal_choice:${response.reason}`,
            imaginedWorld: mentalBefore,
            simulationReliability: "unavailable_use_neutral_baseline",
          };
        }
        return {
          status: response.status,
          reason: response.reason,
          imaginedWorld: response.status === "rejected"
            ? mentalBefore
            : fork.coreSession.inspectRuntimeResult().imaginedWorld,
          simulationReliability: "cognitive_trial_completed",
        };
      },
    });
  }

  _refreshFeedbackGteMemory() {
    if (!this.feedbackGteOverlay) {
      this.feedbackBridge.feedbackGteMemory = null;
      return;
    }
    const learning = this.feedbackLearner.exportState();
    this.feedbackBridge.feedbackGteMemory = new PlayerFeedbackGteMemory({
      overlay: this.feedbackGteOverlay,
      trajectories: learning.trajectories,
      memories: learning.memories,
      chains: learning.chains,
    });
  }

  _compilePendingFeedbackGte({
    compiler = this.feedbackGteCompiler,
    throwOnFailure = false,
  } = {}) {
    const pendingBefore = this.feedbackLearner.pendingMatrixRecords().length;
    if (pendingBefore === 0) {
      this._refreshFeedbackGteMemory();
      return {
        status: "up_to_date",
        compiledNow: 0,
        matrixRecords: this.feedbackGteOverlay?.recordIds.length || 0,
      };
    }
    if (!compiler) {
      return {
        status: "not_configured",
        compiledNow: 0,
        pendingRecords: pendingBefore,
      };
    }
    try {
      this.feedbackGteOverlay = compileFeedbackGteForLearner({
        learner: this.feedbackLearner,
        previousOverlay: this.feedbackGteOverlay,
        compiler,
      });
      this._refreshFeedbackGteMemory();
      return {
        status: "compiled",
        compiledNow: pendingBefore,
        matrixRecords: this.feedbackGteOverlay?.recordIds.length || 0,
        fingerprint: this.feedbackGteOverlay?.fingerprint || null,
      };
    } catch (error) {
      const failure = {
        status: "failed",
        compiledNow: 0,
        pendingRecords: pendingBefore,
        error: String(error.message),
      };
      if (throwOnFailure) throw new Error(`feedback GTE compile failed: ${failure.error}`);
      return failure;
    }
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

  _forkCognitiveRound(checkpoint) {
    const learned = this.feedbackLearner.exportAttentionAdjustments();
    return UfsAttentionPlayerSession.restore(clone(checkpoint), {
      runtime: this._newRuntime(),
      attentionProvider: new UfsFullAttentionProvider({ learnedAttentionAdjustments: learned }),
    });
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
    if (playerResponse.pending?.type === "spawn" && playerResponse.pending.shipId) {
      const shipId = playerResponse.pending.shipId;
      const publicWaitingShip = {
        id: shipId,
        color: String(shipId).split("-")[0],
      };
      belief.ships = (belief.ships || []).filter((row) => row.id !== shipId);
      belief.waitingShips = (belief.waitingShips || []).filter((row) => row.id !== shipId);
      belief.waitingShips.push(publicWaitingShip);
    }
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
      cognitiveUnit: {
        active: clone(this.activeCognitiveUnit),
        lastTransition: clone(this.lastCognitiveUnitTransition),
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
