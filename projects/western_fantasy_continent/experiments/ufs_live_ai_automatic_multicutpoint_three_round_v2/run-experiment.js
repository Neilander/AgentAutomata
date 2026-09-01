"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const {
  UfsFullGameAttentionSession,
} = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const {
  candidatePreference,
  generateCandidates,
  macroIntent,
} = require("./automatic-multicutpoint-controller");

const HERE = __dirname;
const EVIDENCE = path.join(HERE, "evidence");
const ATTENTION_SEED = 2026090102;
const RANDOM_SEED = 0x5f3759df;

function clone(value) {
  return structuredClone(value);
}

function createRandomProvider(seed = RANDOM_SEED) {
  let state = seed >>> 0;
  return {
    values(ids) {
      return Object.fromEntries(ids.map((id) => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        return [id, (state % 6) + 1];
      }));
    },
    inspect() {
      return { algorithm: "xorshift32", initialSeed: seed >>> 0, currentState: state };
    },
  };
}

function pendingRandomOperation(response, provider) {
  if (response.availableOperations?.includes("submit_random_observation")) {
    const ids = clone(response.pending?.dieIds || []);
    return {
      source: "live_environment_random_provider",
      operation: { type: "submit_random_observation", values: provider.values(ids) },
    };
  }
  if (response.availableOperations?.includes("submit_round_roll")) {
    const ids = clone(response.pending?.dice?.map((die) => die.id) || []);
    return {
      source: "live_environment_random_provider",
      operation: { type: "submit_round_roll", values: provider.values(ids) },
    };
  }
  return null;
}

function summarizeResponse(response) {
  return {
    status: response.status,
    reason: response.reason,
    pending: clone(response.pending || null),
    availableOperations: clone(response.availableOperations || []),
    game: clone(response.game || null),
    observation: {
      phase: response.observation?.phase ?? null,
      energy: response.observation?.energy ?? null,
      damage: response.observation?.damage ?? null,
      researchIndex: response.observation?.researchIndex ?? null,
      excavatorIndex: response.observation?.excavatorIndex ?? null,
      mothershipRow: response.observation?.mothershipRow ?? null,
      dice: clone(response.observation?.dice || []),
      ships: clone(response.observation?.ships || []),
      waitingShips: clone(response.observation?.waitingShips || []),
      placements: clone(response.observation?.placements || []),
    },
  };
}

function summarizeFormal(world) {
  const rows = (world.ships || []).map((ship) => ship.row);
  return {
    round: world.round,
    phase: world.phase,
    energy: world.energy,
    damage: world.damage,
    researchIndex: world.researchIndex,
    excavatorIndex: world.excavatorIndex,
    mothershipRow: world.mothershipRow,
    outcome: clone(world.outcome),
    activeShipCount: world.ships?.length || 0,
    waitingShipCount: world.waitingShips?.length || 0,
    maxShipRow: rows.length ? Math.max(...rows) : null,
    totalShipRows: rows.reduce((sum, row) => sum + row, 0),
    ships: clone(world.ships || []),
  };
}

function plannedInputContainsManualQ(candidate) {
  const forbidden = new Set([
    "qBefore", "qAfter", "predictedQ", "predictedQBefore", "predictedQAfter",
    "currentQ", "predictedFollowingQ",
  ]);
  const visit = (value) => {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(visit);
    return Object.entries(value).some(([key, child]) => forbidden.has(key) || visit(child));
  };
  return visit(candidate);
}

function compareBoundary(mental, formal) {
  const scalarFields = [
    "round", "phase", "energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow",
  ];
  const scalarDifferences = scalarFields.filter((field) => mental?.[field] !== formal?.[field])
    .map((field) => ({ field, predicted: mental?.[field], formal: formal?.[field] }));
  const collections = ["ships", "waitingShips", "placements", "robots"];
  const collectionDifferences = collections.filter((field) => (
    JSON.stringify(mental?.[field] || []) !== JSON.stringify(formal?.[field] || [])
  ));
  return { scalarDifferences, collectionDifferences };
}

function gateForRound(roundRecord, response) {
  const plans = roundRecord.planningEvents;
  const actions = roundRecord.actions;
  const nonRandom = actions.filter((row) => row.source === "automatic_multicutpoint_controller");
  const random = actions.filter((row) => row.source === "live_environment_random_provider");
  const assertions = {
    noManualIntermediateQ: plans.every((event) => event.candidates.every((row) => (
      row.manualQPresent === false
    ))),
    noFormalOracleInPlanning: plans.every((event) => event.candidates.every((row) => (
      row.imagination.formalOracleUsed === false
    ))),
    noRejectedLiveOperation: actions.every((row) => row.response.status !== "rejected"),
    eachNonRandomActionHasAutomaticImagination: nonRandom.every((row) => (
      row.planningEventId
      && row.imaginationEvidence?.imagined === true
      && JSON.stringify(row.operation) === JSON.stringify(row.imaginationEvidence.operation)
    )),
    onlyNewestQFirstStepExecuted: nonRandom.every((row) => row.executedStepIndex === 0)
      && new Set(nonRandom.map((row) => row.planningEventId)).size === nonRandom.length,
    noRandomOperationInsidePlan: plans.every((event) => event.candidates.every((row) => (
      row.candidate.steps.every((step) => ![
        "submit_random_observation", "submit_round_roll",
      ].includes(step.operation.type))
    ))),
    allRandomValuesExternal: random.every((row) => row.operation.type === "submit_random_observation"),
    randomPauseWasMarked: random.every((row) => {
      const preceding = plans.find((event) => event.id === row.causedByPlanningEventId);
      return preceding?.selectedImaginationStatus === "paused_random";
    }),
    replannedAfterEveryReroll: random.every((row) => plans.some((event) => (
      event.ordinal > row.planningOrdinal && event.qRevision > row.qRevision
    ))),
    recoverableNextRoundBoundary: response.status === "random"
      && response.reason === "waiting_for_next_round_roll"
      && response.availableOperations?.includes("submit_round_roll"),
    noInvalidOrUncertainCandidateExecuted: nonRandom.every((row) => (
      ["complete", "paused_random"].includes(row.selectedImaginationStatus)
    )),
  };
  return {
    round: roundRecord.round,
    pass: Object.values(assertions).every(Boolean),
    assertions,
    counts: {
      planningEvents: plans.length,
      candidatesImagined: plans.reduce((sum, row) => sum + row.candidates.length, 0),
      nonRandomActions: nonRandom.length,
      randomObservations: random.length,
      automaticTrajectoryPredictions: plans.reduce((sum, event) => sum + (
        event.selectedImagination?.automaticTrajectoryCount || 0
      ), 0),
    },
  };
}

function run() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const session = new UfsFullGameAttentionSession({ publicMap });
  const provider = createRandomProvider();
  let response = session.start({ initialPublicState, attentionSeed: ATTENTION_SEED });
  const evidence = {
    schema: "ufs_live_ai_automatic_multicutpoint_three_round_v2",
    attentionSeed: ATTENTION_SEED,
    randomProvider: null,
    invariants: {
      plannerInput: "current player-visible response only",
      candidateLimit: 3,
      candidateConstruction: "intent and visible room/threat anchors; no die-by-cell Cartesian enumeration",
      intermediateQ: "generated only by imagineSequentialPlan cognitive fork",
      formalAccess: "round-boundary post-hoc audit only; never fed to controller",
    },
    rounds: [],
    stopped: null,
  };
  let globalPlanningOrdinal = 0;
  let qRevision = 0;
  let lastPausedPlanningEvent = null;

  for (let targetRound = 1; targetRound <= 3; targetRound += 1) {
    if (targetRound > 1) {
      const external = pendingRandomOperation(response, provider);
      assert.equal(external?.operation.type, "submit_round_roll");
      response = session.advance(external.operation);
      assert.notEqual(response.status, "rejected");
      qRevision += 1;
    }
    const intent = macroIntent(response);
    const roundRecord = {
      round: targetRound,
      macroIntent: intent,
      startResponse: summarizeResponse(response),
      planningEvents: [],
      actions: [],
      randomReplans: [],
      boundaryAudit: null,
      gate: null,
    };
    evidence.rounds.push(roundRecord);

    let safety = 0;
    while (!(response.status === "random" && response.reason === "waiting_for_next_round_roll")) {
      safety += 1;
      if (safety > 80) throw new Error(`round ${targetRound} exceeded 80 live operations`);

      const external = pendingRandomOperation(response, provider);
      if (external) {
        if (external.operation.type === "submit_round_roll") break;
        const randomAction = {
          ordinal: roundRecord.actions.length + 1,
          source: external.source,
          operation: clone(external.operation),
          causedByPlanningEventId: lastPausedPlanningEvent?.id || null,
          planningOrdinal: lastPausedPlanningEvent?.ordinal || null,
          qRevision,
        };
        response = session.advance(external.operation);
        randomAction.response = summarizeResponse(response);
        roundRecord.actions.push(randomAction);
        qRevision += 1;
        roundRecord.randomReplans.push({
          randomOperationOrdinal: randomAction.ordinal,
          preservedMacroIntentId: intent.id,
          discardedOldSuffix: clone(lastPausedPlanningEvent?.selectedCandidate?.steps?.slice(1) || []),
          nextQRevision: qRevision,
        });
        lastPausedPlanningEvent = null;
        continue;
      }

      const knownOccupiedColumns = roundRecord.actions
        .filter((row) => row.operation.type === "place_die")
        .map((row) => Number(String(row.operation.cellId).match(/-c(\d+)$/u)?.[1] || 1) - 1);
      const candidates = generateCandidates(response, intent, { knownOccupiedColumns });
      if (candidates.length === 0) {
        throw new Error(`no candidates from public Q in round ${targetRound}: ${response.reason}`);
      }
      globalPlanningOrdinal += 1;
      const planningEvent = {
        id: `r${targetRound}-plan-${String(roundRecord.planningEvents.length + 1).padStart(2, "0")}`,
        ordinal: globalPlanningOrdinal,
        qRevision,
        macroIntentId: intent.id,
        cutpoint: response.reason,
        q: summarizeResponse(response),
        candidates: [],
        selectedCandidateId: null,
        selectedCandidate: null,
        selectedImaginationStatus: null,
        selectedImagination: null,
      };
      for (const candidate of candidates) {
        const imagination = session.imagineSequentialPlan({ steps: candidate.steps });
        planningEvent.candidates.push({
          candidate: clone(candidate),
          manualQPresent: plannedInputContainsManualQ(candidate),
          imagination,
          preference: candidatePreference(candidate, imagination, response, intent),
        });
      }
      const selected = [...planningEvent.candidates]
        .sort((left, right) => right.preference - left.preference)[0];
      if (!selected || !Number.isFinite(selected.preference)) {
        const statuses = planningEvent.candidates.map((row) => (
          `${row.candidate.id}:${row.imagination.status}:${row.imagination.reason}`
        ));
        throw new Error(`no executable imagined candidate: ${statuses.join(",")}; public=${JSON.stringify({
          status: response.status,
          reason: response.reason,
          pending: response.pending,
          availableOperations: response.availableOperations,
        })}; cognitive=${JSON.stringify({
          status: session.roundSession.lastPlayerResponse?.status,
          reason: session.roundSession.lastPlayerResponse?.reason,
          pending: session.roundSession.lastPlayerResponse?.pending,
          availableOperations: session.roundSession.lastPlayerResponse?.availableOperations,
        })}`);
      }
      planningEvent.selectedCandidateId = selected.candidate.id;
      planningEvent.selectedCandidate = clone(selected.candidate);
      planningEvent.selectedImaginationStatus = selected.imagination.status;
      planningEvent.selectedImagination = clone(selected.imagination);
      roundRecord.planningEvents.push(planningEvent);

      const operation = clone(selected.candidate.steps[0].operation);
      const trace = selected.imagination.trace[0];
      const action = {
        ordinal: roundRecord.actions.length + 1,
        source: "automatic_multicutpoint_controller",
        planningEventId: planningEvent.id,
        qRevision,
        selectedImaginationStatus: selected.imagination.status,
        executedStepIndex: 0,
        operation,
        imaginationEvidence: {
          imagined: trace.imagined,
          operation: clone(trace.operation),
          anchor: clone(trace.anchor),
          qBefore: clone(trace.qBefore),
          qAfter: clone(trace.qAfter || null),
        },
      };
      response = session.advance(operation);
      action.response = summarizeResponse(response);
      roundRecord.actions.push(action);
      qRevision += 1;
      if (response.status === "rejected") break;
      if (selected.imagination.status === "paused_random") {
        lastPausedPlanningEvent = planningEvent;
      }
    }

    const mental = session.inspectMentalState().observation;
    const formal = session.inspectHostState().observation;
    roundRecord.boundaryAudit = {
      inspectedAtSafeBoundary: response.reason === "waiting_for_next_round_roll",
      mental: summarizeFormal(mental),
      formal: summarizeFormal(formal),
      difference: compareBoundary(mental, formal),
    };
    roundRecord.endResponse = summarizeResponse(response);
    roundRecord.gate = gateForRound(roundRecord, response);

    if (targetRound === 1 && !roundRecord.gate.pass) {
      evidence.stopped = { afterRound: 1, reason: "single_round_gate_failed" };
      break;
    }
    if (!roundRecord.gate.pass) {
      evidence.stopped = { afterRound: targetRound, reason: "later_round_gate_failed" };
      break;
    }
  }

  evidence.randomProvider = provider.inspect();
  evidence.singleRoundGatePassed = evidence.rounds[0]?.gate?.pass === true;
  evidence.threeRoundRunCompleted = evidence.rounds.length === 3
    && evidence.rounds.every((round) => round.gate.pass)
    && evidence.rounds[2].endResponse.reason === "waiting_for_next_round_roll";
  evidence.final = evidence.rounds.at(-1)?.boundaryAudit?.formal || null;
  evidence.claims = {
    mechanismUsable: evidence.singleRoundGatePassed && evidence.threeRoundRunCompleted,
    benefitOrWinRateEstablished: false,
    reason: "The run is an execution/integrity gate with one player and one random stream; it has no control arm or statistical sample.",
  };

  fs.writeFileSync(
    path.join(EVIDENCE, "machine-replay.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(EVIDENCE, "final-host-checkpoint.json"),
    `${JSON.stringify(session.exportCheckpoint(), null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${JSON.stringify({
    singleRoundGatePassed: evidence.singleRoundGatePassed,
    threeRoundRunCompleted: evidence.threeRoundRunCompleted,
    stopped: evidence.stopped,
    rounds: evidence.rounds.map((round) => ({
      round: round.round,
      intent: round.macroIntent.id,
      gate: round.gate,
      randomReplans: round.randomReplans.length,
      boundaryDifference: round.boundaryAudit.difference,
      formal: round.boundaryAudit.formal,
    })),
  }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = {
  createRandomProvider,
  gateForRound,
  pendingRandomOperation,
  plannedInputContainsManualQ,
  run,
};
