"use strict";

const { assertFiveSlotQ } = require("../imagination_pipeline_v0/five-slot-activation");
const { compileQueryVectorsWithGte } = require("./player-feedback-gte");
const {
  feedbackApplicability,
  recalledExpectations,
} = require("./ufs-full-game-feedback-bridge");
const { declaredTicketQ } = require("./ufs-prediction-ticket");
const { jointTransitionQ } = require("./ufs-transition-memory");
const {
  expandTemporalCognitiveUnits,
  operationLabel,
  publicUnit,
} = require("./ufs-temporal-cognitive-unit");

const TRACK_WEIGHTS = Object.freeze({
  energy: 5,
  damage: -22,
  researchIndex: 9,
  excavatorIndex: 7,
  mothershipRow: -18,
});

function clone(value) {
  return structuredClone(value);
}

function stable(value) {
  return JSON.stringify(value);
}

function enumValues(contract, field) {
  const spec = contract?.fields?.[field];
  return spec?.kind === "enum" ? clone(spec.values || []) : [];
}

function fixedValue(contract, field) {
  const spec = contract?.fields?.[field];
  return spec?.kind === "fixed" ? clone(spec.value) : undefined;
}

function enumerateCandidatePayloads(playerResponse) {
  const output = [];
  for (const contract of playerResponse.operationContracts || []) {
    const type = contract.type;
    if (type === "place_die") {
      const dice = (playerResponse.observation?.dice || []).filter((die) => die.placed === false);
      const cells = playerResponse.mapView?.baseCells || [];
      for (const die of dice) {
        for (const cell of cells) output.push({ type, dieId: die.id, cellId: cell.id });
      }
    } else if (type === "resolve_room") {
      for (const roomId of enumValues(contract, "roomId")) {
        output.push({ type, roomId, pay: true });
      }
    } else if (type === "choose_research_advance") {
      const roomId = fixedValue(contract, "roomId");
      const field = contract.fields.advanceSteps;
      for (let advanceSteps = field.minimum; advanceSteps <= field.maximum; advanceSteps += 1) {
        output.push({ type, roomId, advanceSteps });
      }
    } else if (type === "excavate" || type === "skip_worker") {
      for (const placementId of enumValues(contract, "placementId")) {
        output.push({ type, placementId });
      }
    } else if (type === "choose_spawn") {
      const shipId = fixedValue(contract, "shipId");
      for (const dropPointId of enumValues(contract, "dropPointId")) {
        output.push({ type, shipId, dropPointId });
      }
    } else if (type === "end_rooms") {
      output.push({ type });
    }
  }
  return output;
}

function outcomeUtility(state) {
  if (state?.outcome?.result === "win") return 10000;
  if (state?.outcome?.result === "loss") return -10000;
  return 0;
}

function stateDeltaUtility(before, after) {
  let utility = outcomeUtility(after) - outcomeUtility(before);
  const contributions = {};
  for (const [track, weight] of Object.entries(TRACK_WEIGHTS)) {
    const delta = Number(after?.[track] ?? before?.[track] ?? 0)
      - Number(before?.[track] ?? 0);
    contributions[track] = Number((delta * weight).toFixed(6));
    utility += contributions[track];
  }
  if (Number(after?.energy) === 0 && Number(before?.energy) > 0) {
    contributions.zeroEnergyTrap = -60;
    utility -= 60;
  }
  return { utility: Number(utility.toFixed(6)), contributions };
}

function trackExpectationUtility(expectation, before) {
  const prefix = expectation.itemId.split(":", 1)[0];
  if (prefix !== "track" || expectation.change !== "equals") return null;
  const track = expectation.itemId.slice("track:".length);
  if (track === "outcome") {
    return outcomeUtility({ outcome: expectation.value }) - outcomeUtility(before);
  }
  const weight = TRACK_WEIGHTS[track];
  if (weight == null || !Number.isFinite(Number(expectation.value))) return null;
  let utility = (Number(expectation.value) - Number(before?.[track] ?? 0)) * weight;
  if (track === "energy" && Number(expectation.value) === 0 && Number(before?.energy) > 0) {
    utility -= 60;
  }
  return utility;
}

function feedbackOutcomeUtility(expectations, before) {
  const values = expectations.map((row) => trackExpectationUtility(row, before))
    .filter((value) => value != null);
  if (values.length === 0) return null;
  return Number(values.reduce((sum, value) => sum + value, 0).toFixed(6));
}

function changedTrackExpectations(before, after) {
  const expectations = [];
  for (const track of Object.keys(TRACK_WEIGHTS)) {
    if (stable(before?.[track]) === stable(after?.[track])) continue;
    expectations.push({
      itemId: `track:${track}`,
      change: "equals",
      value: clone(after?.[track]),
    });
  }
  if (stable(before?.outcome) !== stable(after?.outcome)) {
    expectations.push({ itemId: "track:outcome", change: "equals", value: clone(after.outcome) });
  }
  if (expectations.length === 0) {
    expectations.push({ itemId: "track:energy", change: "unchanged" });
  }
  return expectations.slice(0, 3);
}

function candidateLabel(payload) {
  return Object.entries(payload).map(([key, value]) => `${key}=${value}`).join("|");
}

function planningDeclaration(payload, before, after, cognitiveUnit = null) {
  const operationDescription = cognitiveUnit
    ? cognitiveUnit.operations.map(operationLabel).join(" → ")
    : candidateLabel(payload);
  return {
    because: cognitiveUnit
      ? `复合候选试演：从${before.phase}阶段执行${operationDescription}，比较整个认知单元完成后的后果`
      : `候选试演：在${before.phase}阶段比较${candidateLabel(payload)}的下一稳定边界后果`,
    expectations: changedTrackExpectations(before, after),
    ...(cognitiveUnit ? {
      verifyBy: `认知单元完成后（${cognitiveUnit.operationCount}个操作；${cognitiveUnit.completionReason}）`,
    } : {}),
  };
}

function planningState(state) {
  return Object.fromEntries([
    "phase", "energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow", "outcome",
  ].map((key) => [key, clone(state?.[key] ?? null)]));
}

function candidateQuery(payload, declaration, before, cognitiveUnit = null) {
  const queryOperation = cognitiveUnit ? {
    type: "cognitive_unit",
    operations: clone(cognitiveUnit.operations),
  } : payload;
  const q = declaredTicketQ(queryOperation, declaration, before).currentQ;
  assertFiveSlotQ(q);
  return q;
}

function planPrechoice({
  playerResponse,
  mentalBefore,
  simulate,
  simulateSequence = null,
  publicMap = null,
  maxUnitOperations = 4,
  feedbackMemory = null,
  predictionLedger = [],
  previousTrajectoryId = null,
  queryCompiler = null,
  topK = 3,
  threshold = 0.55,
} = {}) {
  if (!playerResponse || !mentalBefore || typeof simulate !== "function") {
    throw new TypeError("planPrechoice requires playerResponse, mentalBefore and simulate");
  }
  const attempted = enumerateCandidatePayloads(playerResponse);
  const legal = [];
  const rejected = [];
  for (const payload of attempted) {
    const units = simulateSequence && publicMap
      ? expandTemporalCognitiveUnits({
        firstOperation: payload,
        playerResponse,
        mentalBefore,
        publicMap,
        simulateSequence,
        maxOperations: maxUnitOperations,
      })
      : [];
    const trials = units.length > 0
      ? units
      : [{ ...simulate(clone(payload)), cognitiveUnit: null }];
    if (trials.length === 0 || trials.every((trial) => !trial || trial.status === "rejected")) {
      rejected.push({
        payload: clone(payload),
        reason: trials.find((trial) => trial?.reason)?.reason || "cognitive_trial_rejected",
      });
      continue;
    }
    for (const trial of trials) {
      if (!trial || trial.status === "rejected") continue;
      const after = clone(trial.imaginedWorld);
      const cognitiveUnit = trial.schema ? publicUnit(trial) : null;
      const declaration = planningDeclaration(payload, mentalBefore, after, cognitiveUnit);
      const score = stateDeltaUtility(mentalBefore, after);
      legal.push({
        payload: clone(payload),
        cognitiveUnit,
        imaginedStatus: trial.imaginedStatus || trial.status,
        imaginedReason: trial.imaginedReason || trial.reason,
        simulationReliability: trial.simulationReliability || "cognitive_trial_completed",
        imaginedWorld: after,
        declaration,
        queryQ: candidateQuery(payload, declaration, mentalBefore, cognitiveUnit),
        baselineScore: score.utility,
        baselineContributions: score.contributions,
        feedbackAdjustment: null,
        recalledFeedback: [],
        finalScore: score.utility,
      });
    }
  }
  if (legal.length === 0) {
    return { status: "no_legal_candidate", attemptedCount: attempted.length, rejected };
  }

  if (feedbackMemory && !queryCompiler) {
    throw new Error("compiled player feedback requires a GTE query compiler before choosing");
  }

  if (feedbackMemory && queryCompiler) {
    const compiled = compileQueryVectorsWithGte(legal.map((row) => jointTransitionQ(
      row.queryQ,
      row.cognitiveUnit?.operations || [row.payload],
    )), queryCompiler);
    legal.forEach((candidate, index) => {
      const context = {
        ...feedbackApplicability(candidate.payload, { before: mentalBefore }),
        predictionSource: "deliberate_action_prediction",
      };
      const recalled = feedbackMemory.queryVector(compiled.vectors[index].vector, {
        context,
        operations: candidate.cognitiveUnit?.operations || [candidate.payload],
        previousTrajectoryId,
        topK,
        threshold,
      });
      candidate.recalledFeedback = recalled.map((row) => ({
        trajectoryId: row.trajectory.trajectoryId,
        activation: Number(row.activation.toFixed(6)),
        followingQ: clone(row.trajectory.followingQ),
      }));
      for (const row of recalled) {
        const expectations = recalledExpectations(row.trajectory, predictionLedger);
        const learnedUtility = feedbackOutcomeUtility(expectations, mentalBefore);
        if (learnedUtility == null) continue;
        const activation = Math.min(1, Math.max(0, Number(row.activation)));
        const adjusted = candidate.baselineScore * (1 - activation) + learnedUtility * activation;
        candidate.feedbackAdjustment = {
          trajectoryId: row.trajectory.trajectoryId,
          activation: Number(activation.toFixed(6)),
          auditedExpectations: clone(expectations),
          learnedOutcomeScore: learnedUtility,
          replacedBaselineByConfidence: Number(adjusted.toFixed(6)),
        };
        candidate.finalScore = Number(adjusted.toFixed(6));
        break;
      }
    });
  }

  legal.sort((left, right) => right.finalScore - left.finalScore
    || candidateLabel(left.payload).localeCompare(candidateLabel(right.payload)));
  const recommended = legal[0];
  for (const candidate of legal) {
    candidate.imaginedState = planningState(candidate.imaginedWorld);
    delete candidate.imaginedWorld;
    delete candidate.declaration;
  }
  return {
    schema: "ufs_prechoice_plan_v1",
    status: "planned",
    boundary: clone(playerResponse.pending),
    attemptedCount: attempted.length,
    legalCandidateCount: legal.length,
    rejectedCandidateCount: rejected.length,
    recommendedPayload: {
      ...clone(recommended.payload),
      ...(recommended.cognitiveUnit ? {
        cognitiveUnit: { ...clone(recommended.cognitiveUnit), nextOperationIndex: 0 },
      } : {}),
      predictions: [planningDeclaration(
        recommended.payload,
        mentalBefore,
        recommended.imaginedState,
        recommended.cognitiveUnit,
      )],
    },
    ranking: legal,
    rejected,
  };
}

module.exports = {
  TRACK_WEIGHTS,
  enumerateCandidatePayloads,
  planPrechoice,
  stateDeltaUtility,
};
