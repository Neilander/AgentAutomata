"use strict";

const { collectPredictionEnvelopes } = require("./ufs-full-game-feedback-bridge");
const {
  evaluateEntityAnchor,
  runSequentialRollout,
} = require("./ufs-sequential-q-rollout");

function clone(value) {
  return structuredClone(value);
}

function matches(row, expected = {}) {
  return Object.entries(expected).every(([key, value]) => (
    JSON.stringify(row?.[key]) === JSON.stringify(value)
  ));
}

function stateDigest(world) {
  return {
    round: world?.round ?? null,
    phase: world?.phase ?? null,
    energy: world?.energy ?? null,
    damage: world?.damage ?? null,
    researchIndex: world?.researchIndex ?? null,
    excavatorIndex: world?.excavatorIndex ?? null,
    mothershipRow: world?.mothershipRow ?? null,
    outcome: clone(world?.outcome ?? null),
    counts: {
      dice: world?.dice?.length || 0,
      ships: world?.ships?.length || 0,
      waitingShips: world?.waitingShips?.length || 0,
      placements: world?.placements?.length || 0,
      robots: world?.robots?.length || 0,
    },
  };
}

function observeRequested(world, requests = []) {
  return requests.map((request) => {
    const collection = world?.[request.collection];
    if (!Array.isArray(collection)) {
      return { request: clone(request), status: "collection_unavailable", value: null };
    }
    const found = collection.find((row) => matches(row, request.match));
    if (!found) return { request: clone(request), status: "absent", value: null };
    const fields = request.fields || Object.keys(found);
    return {
      request: clone(request),
      status: "present",
      value: Object.fromEntries(fields.map((field) => [field, clone(found[field])])),
    };
  });
}

function publicTrajectory(row) {
  return {
    occurrence: row.occurrence,
    trajectoryId: row.trajectoryId,
    activation: Number(row.activation.toFixed(6)),
    currentQ: clone(row.currentQ),
    predictedFollowingQ: clone(row.predictedFollowingQ),
    patch: clone(row.patch),
    omittedItemCount: row.omittedItemIds.length,
  };
}

function cognitiveQ(fork, trajectoryPredictions = []) {
  return {
    world: clone(fork.coreSession.inspectRuntimeResult().imaginedWorld),
    epistemic: {
      source: "cognitive_trajectory_program_runtime",
      availableOperations: clone(fork.lastPlayerResponse?.availableOperations || []),
      status: fork.lastPlayerResponse?.status || null,
      reason: fork.lastPlayerResponse?.reason || null,
      omittedCollections: [],
    },
    trajectoryPredictions: clone(trajectoryPredictions),
  };
}

function sanitizeTraceRow(row) {
  const evidence = row.imaginationEvidence || {};
  return {
    index: row.index,
    stepId: row.stepId,
    operation: clone(row.operation),
    anchor: clone(row.anchor),
    imagined: row.imagined,
    qBefore: {
      state: stateDigest(row.qBefore?.world),
      availableOperations: clone(row.qBefore?.epistemic?.availableOperations || []),
      inheritedTrajectoryPredictions: clone(row.qBefore?.trajectoryPredictions || []),
    },
    ...(row.imagined ? {
      qAfter: {
        state: stateDigest(row.qAfter?.world),
        availableOperations: clone(row.qAfter?.epistemic?.availableOperations || []),
        trajectoryPredictions: clone(row.qAfter?.trajectoryPredictions || []),
      },
      response: clone(evidence.response || null),
      observationsAfter: clone(evidence.observationsAfter || []),
    } : {}),
  };
}

function imagineAutomaticSequentialPlan({ cognitiveFork, steps } = {}) {
  if (!cognitiveFork?.coreSession || !cognitiveFork?.lastPlayerResponse) {
    throw new TypeError("cognitiveFork must be a restorable UFS attention player session");
  }
  if (!Array.isArray(steps) || steps.length === 0) throw new TypeError("steps are required");

  const normalizedSteps = steps.map((step, index) => {
    if (!step?.operation || typeof step.operation.type !== "string") {
      throw new TypeError(`step ${index} requires an operation`);
    }
    if (step.operation.type === "submit_random_observation") {
      throw new TypeError(
        "sequential planning cannot supply random observations; resume after the live environment observes them",
      );
    }
    return {
      id: step.id || `step-${index + 1}`,
      operation: clone(step.operation),
      ...(step.anchor ? { anchor: clone(step.anchor) } : {}),
      observeAfter: clone(step.observeAfter || []),
    };
  });
  const initialQ = cognitiveQ(cognitiveFork);
  let rejection = null;
  let rollout;
  try {
    rollout = runSequentialRollout({
      initialQ,
      steps: normalizedSteps,
      evaluateAnchor: (q, anchor, step) => {
        if (!q.epistemic.availableOperations.includes(step.operation.type)) {
          return {
            status: "unsupported",
            reason: `operation_not_available:${step.operation.type}`,
            evidence: null,
          };
        }
        return evaluateEntityAnchor(q, anchor);
      },
      imagineStep: ({ step }) => {
        const response = cognitiveFork.advance(step.operation);
        if (response.status === "rejected") {
          rejection = { stepId: step.id, operation: clone(step.operation), reason: response.reason };
          throw new Error(`cognitive_sequence_rejected:${response.reason}`);
        }
        const traceDelta = cognitiveFork.coreSession.lastResponse?.traceDelta || {};
        const trajectoryPredictions = collectPredictionEnvelopes(traceDelta).map(publicTrajectory);
        const qAfter = cognitiveQ(cognitiveFork, trajectoryPredictions);
        return {
          qAfter,
          evidence: {
            response: {
              status: response.status,
              reason: response.reason,
              pending: clone(response.pending || null),
            },
            observationsAfter: observeRequested(qAfter.world, step.observeAfter),
            trajectoryPredictions,
          },
          ...(response.status === "random" ? {
            stop: {
              status: "paused_random",
              reason: response.reason || "waiting_for_actual_random_observation",
              boundary: { pending: clone(response.pending || null) },
            },
          } : {}),
        };
      },
    });
  } catch (error) {
    if (!rejection) throw error;
    return {
      schema: "ufs_automatic_sequential_imagination_v1",
      status: "rejected",
      reason: rejection.reason,
      rejectedStep: rejection,
      formalOracleUsed: false,
      cognitiveSource: "real GTE trajectory activation plus cognitive JSON programs",
    };
  }

  const trace = rollout.trace.map(sanitizeTraceRow);
  return {
    schema: "ufs_automatic_sequential_imagination_v1",
    status: rollout.status,
    reason: rollout.stopReason,
    stoppedBeforeStep: rollout.stoppedBeforeStep,
    stoppedAfterStep: rollout.stoppedAfterStep,
    boundary: clone(rollout.boundary || null),
    deterministicBenefitClaimAllowed: rollout.deterministicBenefitClaimAllowed,
    formalOracleUsed: false,
    cognitiveSource: "real GTE trajectory activation plus cognitive JSON programs",
    automaticTrajectoryCount: trace.reduce((sum, row) => (
      sum + (row.qAfter?.trajectoryPredictions?.length || 0)
    ), 0),
    trace,
    finalState: stateDigest(rollout.finalQ.world),
  };
}

module.exports = {
  imagineAutomaticSequentialPlan,
  observeRequested,
  stateDigest,
};
