"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..");
const CORE = path.resolve(ROOT, "../ufs_first_action_imagination_v0");
const V2 = path.resolve(ROOT, "../ufs_live_ai_automatic_multicutpoint_three_round_v2");
const OUT = path.join(HERE, "evidence");
const protocol = require(path.join(ROOT, "PAIR_PROTOCOL.json"));
const preRunTest = require(path.join(ROOT, "safety-boundary-test-results.json"));
const { isWaitingForNextRoundRollBoundary } = require(path.join(ROOT, "safety-boundary"));
const initialPublicState = require(path.join(CORE, "public_initial_state.json"));
const publicMap = require(path.join(CORE, "public-map"));
const { UfsFullGameAttentionSession } = require(path.join(CORE, "ufs-full-game-attention-session"));
const {
  candidatePreference,
  generateCandidates,
  macroIntent,
} = require(path.join(V2, "automatic-multicutpoint-controller"));

const EXPECTED_PROTOCOL_HASH = "e431142225927a24cf868174a98975f926399a6731177e223f871b2b5f7b4177";

function clone(value) {
  return structuredClone(value);
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function assertFreshOutput() {
  const targets = ["machine-evidence.json", "random-draw-tape.json", "final-checkpoint.json"];
  for (const target of targets) {
    assert.equal(fs.existsSync(path.join(OUT, target)), false, `refusing to retry over ${target}`);
  }
}

function assertFrozenInputs() {
  const files = {
    protocol: path.join(ROOT, "PAIR_PROTOCOL.json"),
    protocolHashFile: path.join(ROOT, "PAIR_PROTOCOL.sha256"),
    safetyBoundaryHelper: path.join(ROOT, "safety-boundary.js"),
    safetyBoundaryTest: path.join(ROOT, "test-safety-boundary.js"),
    safetyBoundaryEvidence: path.join(ROOT, "safety-boundary-test-results.json"),
    publicInitialState: path.join(CORE, "public_initial_state.json"),
    publicMap: path.join(CORE, "public-map.js"),
    controller: path.join(V2, "automatic-multicutpoint-controller.js"),
    sessionRuntime: path.join(CORE, "ufs-full-game-attention-session.js"),
    oneRoundRuntime: path.join(CORE, "ufs-one-round-imagination.js"),
    sequentialPlanner: path.join(CORE, "ufs-automatic-sequential-imagination.js"),
  };
  const hashes = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, sha256(file)]));
  assert.equal(hashes.protocol, EXPECTED_PROTOCOL_HASH, "PAIR_PROTOCOL changed after V4 freeze");
  assert.equal(
    fs.readFileSync(files.protocolHashFile, "utf8").trim().split(/\s+/u)[0],
    EXPECTED_PROTOCOL_HASH,
  );
  assert.equal(hashes.safetyBoundaryHelper, protocol.safetyBoundary.helperSha256);
  assert.equal(hashes.safetyBoundaryTest, protocol.safetyBoundary.contractTestSha256);
  assert.equal(hashes.safetyBoundaryEvidence, protocol.safetyBoundary.preRunEvidenceSha256);
  assert.equal(hashes.publicInitialState, protocol.assets.publicInitialState.sha256);
  assert.equal(hashes.publicMap, protocol.assets.publicMap.sha256);
  assert.equal(hashes.controller, protocol.arms.new.controllerSha256);
  assert.equal(preRunTest.passed, true);
  assert.equal(preRunTest.hostRuntimeImported, false);
  assert.equal(preRunTest.randomDrawsConsumed, 0);
  assert.deepEqual(preRunTest.cases.map((row) => [row.id, row.actual]), [
    ["real-public-shape", true],
    ["v3-wrong-choice-shape", false],
    ["other-random-boundary", false],
  ]);
  return { files, hashes };
}

function createTapedRandomProvider(seed) {
  let state = seed >>> 0;
  const draws = [];
  return {
    values(ids, context) {
      assert.deepEqual(ids, context.contract.ids, "draw IDs must preserve public contract order");
      const values = {};
      for (const boundId of ids) {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        const value = (state % 6) + 1;
        draws.push({
          ordinal: draws.length + 1,
          rawUnsigned: state,
          value,
          boundId,
          contract: clone(context.contract),
          round: context.round,
          reason: context.reason,
        });
        values[boundId] = value;
      }
      return values;
    },
    snapshot() {
      return {
        algorithm: "xorshift32",
        initialSeedHex: protocol.random.initialSeedHex,
        initialSeedUnsigned: seed >>> 0,
        currentStateUnsigned: state,
        drawCount: draws.length,
        draws: clone(draws),
      };
    },
  };
}

function publicRandomContract(response, operationType, ids) {
  return {
    operationType,
    ids: clone(ids),
    pending: clone(response.pending || null),
    operationContract: clone((response.operationContracts || [])
      .find((row) => row.type === operationType) || null),
  };
}

function randomOperation(response, provider, round) {
  if (response.availableOperations?.includes("submit_random_observation")) {
    const ids = clone(response.pending?.dieIds || []);
    const contract = publicRandomContract(response, "submit_random_observation", ids);
    return {
      source: "live_environment_random_provider",
      ids,
      contract,
      operation: {
        type: "submit_random_observation",
        values: provider.values(ids, { contract, round, reason: response.reason }),
      },
    };
  }
  if (response.availableOperations?.includes("submit_round_roll")) {
    const ids = clone(response.pending?.dice?.map((die) => die.id) || []);
    const contract = publicRandomContract(response, "submit_round_roll", ids);
    return {
      source: "live_environment_random_provider",
      ids,
      contract,
      operation: {
        type: "submit_round_roll",
        values: provider.values(ids, { contract, round, reason: response.reason }),
      },
    };
  }
  return null;
}

function summarizeResponse(response) {
  return {
    status: response.status,
    reason: response.reason,
    pending: clone(response.pending || null),
    operationContracts: clone(response.operationContracts || []),
    availableOperations: clone(response.availableOperations || []),
    game: clone(response.game || null),
    observation: {
      round: response.observation?.round ?? null,
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
      robots: clone(response.observation?.robots || []),
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
    waitingShips: clone(world.waitingShips || []),
    placements: clone(world.placements || []),
    robots: clone(world.robots || []),
  };
}

function compareBoundary(mental, formal) {
  const scalarFields = [
    "round", "phase", "energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow",
  ];
  return {
    scalarDifferences: scalarFields.filter((field) => mental?.[field] !== formal?.[field])
      .map((field) => ({ field, mental: mental?.[field], formal: formal?.[field] })),
    collectionDifferences: ["ships", "waitingShips", "placements", "robots"].filter((field) => (
      JSON.stringify(mental?.[field] || []) !== JSON.stringify(formal?.[field] || [])
    )),
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

function gateForRound(roundRecord, response) {
  const plans = roundRecord.planningEvents;
  const actions = roundRecord.actions;
  const policyActions = actions.filter((row) => row.source === "automatic_multicutpoint_controller");
  const randomActions = actions.filter((row) => row.source === "live_environment_random_provider");
  const assertions = {
    sharedSafetyBoundaryTrue: isWaitingForNextRoundRollBoundary(response),
    noManualIntermediateQ: plans.every((event) => event.candidates.every((row) => !row.manualQPresent)),
    noFormalOracleInPlanning: plans.every((event) => event.candidates.every((row) => (
      row.imagination.formalOracleUsed === false
    ))),
    noRejectedLiveOperation: actions.every((row) => row.response.status !== "rejected"),
    eachPolicyActionHasAutomaticTrace: policyActions.every((row) => (
      row.planningEventId
      && row.imaginationEvidence?.imagined === true
      && JSON.stringify(row.operation) === JSON.stringify(row.imaginationEvidence.operation)
    )),
    onlyNewestQStepZeroExecuted: policyActions.every((row) => row.executedStepIndex === 0)
      && new Set(policyActions.map((row) => row.planningEventId)).size === policyActions.length,
    noRandomOperationInsidePlan: plans.every((event) => event.candidates.every((row) => (
      row.candidate.steps.every((step) => ![
        "submit_random_observation", "submit_round_roll",
      ].includes(step.operation.type))
    ))),
    externalRandomOnly: randomActions.every((row) => row.operation.type === "submit_random_observation"),
    randomPauseWasMarked: randomActions.every((row) => (
      plans.find((event) => event.id === row.causedByPlanningEventId)?.selectedImaginationStatus
        === "paused_random"
    )),
    replannedFromNewQAfterRandom: randomActions.every((row) => plans.some((event) => (
      event.ordinal > row.planningOrdinal && event.qRevision > row.qRevision
    ))),
  };
  return {
    pass: Object.values(assertions).every(Boolean),
    assertions,
    counts: {
      planningEvents: plans.length,
      candidatesImagined: plans.reduce((sum, row) => sum + row.candidates.length, 0),
      policyActions: policyActions.length,
      randomObservations: randomActions.length,
      automaticTrajectoryPredictions: plans.reduce((sum, event) => (
        sum + (event.selectedImagination?.automaticTrajectoryCount || 0)
      ), 0),
    },
  };
}

function run() {
  assertFreshOutput();
  const frozen = assertFrozenInputs();
  fs.mkdirSync(OUT, { recursive: true });
  const formalRunStartedAt = new Date().toISOString();
  assert.ok(Date.parse(preRunTest.completedAt) < Date.parse(formalRunStartedAt));
  const startHashes = clone(frozen.hashes);
  const provider = createTapedRandomProvider(protocol.random.initialSeedUnsigned);
  const session = new UfsFullGameAttentionSession({ publicMap });
  let response = session.start({ initialPublicState, attentionSeed: protocol.attentionSeed });
  let globalPlanningOrdinal = 0;
  let qRevision = 0;
  let lastPausedPlanningEvent = null;
  const evidence = {
    schema: "ufs_automatic_vs_original_paired_v4_new_arm",
    arm: "new",
    protocolHash: frozen.hashes.protocol,
    controllerHash: frozen.hashes.controller,
    frozenHashesBeforeRun: startHashes,
    preRunBoundaryContract: {
      evidence: clone(preRunTest),
      verifiedBeforeSessionConstruction: true,
      verifiedBeforeRandomConsumption: true,
      formalRunStartedAt,
    },
    attentionSeed: protocol.attentionSeed,
    planner: "sealed V2 automatic-multicutpoint-controller + imagineSequentialPlan",
    invariants: {
      intermediateQ: "generated only by imagineSequentialPlan cognitive fork",
      randomInsidePlanning: false,
      formalAccess: "only after shared safety-boundary helper returns true; audit never enters controller input",
      controllerOrRuntimeChangedAfterStart: false,
    },
    roundTransitions: [],
    rounds: [],
    stopped: null,
  };

  for (let targetRound = 1; targetRound <= protocol.roundsToComplete; targetRound += 1) {
    if (targetRound > 1) {
      assert.equal(isWaitingForNextRoundRollBoundary(response), true);
      const transition = randomOperation(response, provider, targetRound);
      assert.equal(transition?.operation.type, "submit_round_roll");
      const before = summarizeResponse(response);
      response = session.advance(transition.operation);
      assert.notEqual(response.status, "rejected");
      qRevision += 1;
      evidence.roundTransitions.push({
        targetRound,
        ids: transition.ids,
        contract: transition.contract,
        operation: transition.operation,
        before,
        after: summarizeResponse(response),
        qRevision,
      });
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
    while (!isWaitingForNextRoundRollBoundary(response)) {
      safety += 1;
      if (safety > 80) throw new Error(`round ${targetRound} exceeded 80 live operations`);

      const external = randomOperation(response, provider, targetRound);
      if (external) {
        if (external.operation.type === "submit_round_roll") {
          throw new Error("submit_round_roll exposed outside the shared V4 safety boundary");
        }
        const randomAction = {
          ordinal: roundRecord.actions.length + 1,
          source: external.source,
          ids: external.ids,
          contract: external.contract,
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
          oldPlanningEventId: lastPausedPlanningEvent?.id || null,
          oldQRevision: lastPausedPlanningEvent?.qRevision ?? null,
          nextQRevision: qRevision,
        });
        lastPausedPlanningEvent = null;
        continue;
      }

      const knownOccupiedColumns = roundRecord.actions
        .filter((row) => row.operation.type === "place_die")
        .map((row) => Number(String(row.operation.cellId).match(/-c(\d+)$/u)?.[1] || 1) - 1);
      const candidates = generateCandidates(response, intent, { knownOccupiedColumns });
      if (candidates.length === 0) throw new Error(`no candidates in round ${targetRound}: ${response.reason}`);
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
        throw new Error(`no executable imagined candidate in ${planningEvent.id}`);
      }
      Object.assign(planningEvent, {
        selectedCandidateId: selected.candidate.id,
        selectedCandidate: clone(selected.candidate),
        selectedImaginationStatus: selected.imagination.status,
        selectedImagination: clone(selected.imagination),
      });
      roundRecord.planningEvents.push(planningEvent);

      const operation = clone(selected.candidate.steps[0].operation);
      const trace = selected.imagination.trace[0];
      const action = {
        ordinal: roundRecord.actions.length + 1,
        source: "automatic_multicutpoint_controller",
        planningEventId: planningEvent.id,
        planningOrdinal: planningEvent.ordinal,
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
          automaticTrajectoryIds: clone(trace.automaticTrajectoryIds || []),
        },
      };
      response = session.advance(operation);
      action.response = summarizeResponse(response);
      roundRecord.actions.push(action);
      qRevision += 1;
      if (response.status === "rejected") break;
      if (selected.imagination.status === "paused_random") lastPausedPlanningEvent = planningEvent;
    }

    assert.equal(isWaitingForNextRoundRollBoundary(response), true, "formal audit outside safe boundary");
    const mental = session.inspectMentalState().observation;
    const formal = session.inspectHostState().observation;
    roundRecord.boundaryAudit = {
      sharedPredicateReturnedTrue: true,
      postHocOnly: true,
      mental: summarizeFormal(mental),
      formal: summarizeFormal(formal),
      difference: compareBoundary(mental, formal),
    };
    roundRecord.endResponse = summarizeResponse(response);
    roundRecord.gate = gateForRound(roundRecord, response);
    if (!roundRecord.gate.pass) {
      evidence.stopped = { afterRound: targetRound, reason: "round_gate_failed" };
      break;
    }
  }

  evidence.randomTape = provider.snapshot();
  evidence.safetyBoundaryCount = evidence.rounds.filter((round) => (
    round.boundaryAudit?.sharedPredicateReturnedTrue
  )).length;
  evidence.threeRoundRunCompleted = evidence.rounds.length === protocol.roundsToComplete
    && evidence.rounds.every((round) => round.gate.pass)
    && evidence.safetyBoundaryCount === protocol.roundsToComplete;
  evidence.final = evidence.rounds.at(-1)?.boundaryAudit?.formal || null;
  evidence.frozenHashesAfterRun = assertFrozenInputs().hashes;
  evidence.invariants.controllerOrRuntimeChangedAfterStart = JSON.stringify(startHashes)
    !== JSON.stringify(evidence.frozenHashesAfterRun);
  assert.equal(evidence.invariants.controllerOrRuntimeChangedAfterStart, false);
  evidence.claims = {
    armIntegrityEstablished: evidence.threeRoundRunCompleted,
    advantageEstablished: false,
    reason: "V4 new arm only; no old-arm result was inspected or compared.",
  };

  const checkpoint = session.exportCheckpoint();
  fs.writeFileSync(path.join(OUT, "machine-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(OUT, "random-draw-tape.json"), `${JSON.stringify(evidence.randomTape, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(OUT, "final-checkpoint.json"), `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    status: evidence.threeRoundRunCompleted ? "PASS" : "FAIL",
    protocolHash: evidence.protocolHash,
    controllerHash: evidence.controllerHash,
    drawCount: evidence.randomTape.drawCount,
    safetyBoundaryCount: evidence.safetyBoundaryCount,
    rounds: evidence.rounds.map((round) => ({
      round: round.round,
      gate: round.gate.pass,
      planningEvents: round.gate.counts.planningEvents,
      candidatesImagined: round.gate.counts.candidatesImagined,
      randomReplans: round.randomReplans.length,
      formal: round.boundaryAudit.formal,
    })),
  }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { assertFrozenInputs, createTapedRandomProvider, run };
