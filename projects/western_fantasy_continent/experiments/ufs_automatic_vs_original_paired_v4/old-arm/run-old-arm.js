"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ARM_DIR = __dirname;
const PAIR_DIR = path.dirname(ARM_DIR);
const SHARED_DIR = path.resolve(PAIR_DIR, "../ufs_first_action_imagination_v0");
const PROTOCOL_FILE = path.join(PAIR_DIR, "PAIR_PROTOCOL.json");
const PROTOCOL_HASH_FILE = path.join(PAIR_DIR, "PAIR_PROTOCOL.sha256");
const HELPER_FILE = path.join(PAIR_DIR, "safety-boundary.js");
const TEST_FILE = path.join(PAIR_DIR, "test-safety-boundary.js");
const SEALED_TEST_RESULT_FILE = path.join(PAIR_DIR, "safety-boundary-test-results.json");
const PREFLIGHT_FILE = path.join(ARM_DIR, "preflight-validation.json");
const INITIAL_STATE_FILE = path.join(SHARED_DIR, "public_initial_state.json");
const PUBLIC_MAP_FILE = path.join(SHARED_DIR, "public-map.js");
const SESSION_FILE = path.join(SHARED_DIR, "ufs-full-game-attention-session.js");
const PLANNER_SOURCE_FILES = [
  SESSION_FILE,
  path.join(SHARED_DIR, "ufs-prechoice-planner.js"),
  path.join(SHARED_DIR, "ufs-temporal-cognitive-unit.js"),
];
const { isWaitingForNextRoundRollBoundary } = require(HELPER_FILE);

function clone(value) {
  return structuredClone(value);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function canonicalSha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function stable(value) {
  return JSON.stringify(value);
}

function assertFrozenInputs(protocol) {
  const sidecarProtocolHash = fs.readFileSync(PROTOCOL_HASH_FILE, "utf8").trim().split(/\s+/)[0];
  const frozenHashes = {
    protocol: sha256File(PROTOCOL_FILE),
    helper: sha256File(HELPER_FILE),
    contractTest: sha256File(TEST_FILE),
    sealedTestResult: sha256File(SEALED_TEST_RESULT_FILE),
    publicInitialState: sha256File(INITIAL_STATE_FILE),
    publicMap: sha256File(PUBLIC_MAP_FILE),
  };
  assert.equal(frozenHashes.protocol, sidecarProtocolHash, "protocol sidecar mismatch");
  assert.equal(frozenHashes.helper, protocol.safetyBoundary.helperSha256, "helper hash mismatch");
  assert.equal(frozenHashes.contractTest, protocol.safetyBoundary.contractTestSha256, "test hash mismatch");
  assert.equal(frozenHashes.sealedTestResult, protocol.safetyBoundary.preRunEvidenceSha256, "sealed test result hash mismatch");
  assert.equal(frozenHashes.publicInitialState, protocol.assets.publicInitialState.sha256, "initial state hash mismatch");
  assert.equal(frozenHashes.publicMap, protocol.assets.publicMap.sha256, "public map hash mismatch");
  const preflight = JSON.parse(fs.readFileSync(PREFLIGHT_FILE, "utf8"));
  assert.equal(preflight.passed, true, "host-free preflight did not pass");
  assert.equal(preflight.hostRuntimeImported, false, "preflight touched host runtime");
  assert.equal(preflight.sessionConstructed, false, "preflight constructed a session");
  assert.equal(preflight.randomDrawsConsumed, 0, "preflight consumed random draws");
  assert.deepEqual(preflight.frozenHashes, frozenHashes, "preflight hashes differ from formal run hashes");
  assert.deepEqual(preflight.hostFreeCases.map(({ id, expected, actual }) => ({ id, expected, actual })), [
    { id: "real-public-shape", expected: true, actual: true },
    { id: "v3-wrong-choice-shape", expected: false, actual: false },
    { id: "other-random-boundary", expected: false, actual: false },
  ]);
  return frozenHashes;
}

class ExternalXorshift32Provider {
  constructor(seedUnsigned) {
    this.state = Number(seedUnsigned) >>> 0;
    this.ordinal = 0;
    this.tape = [];
  }

  draw({ boundId, contractType, contractSnapshot, round, reason }) {
    let value = this.state >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    this.ordinal += 1;
    const dieValue = (this.state % 6) + 1;
    this.tape.push({
      ordinal: this.ordinal,
      rawUnsigned: this.state,
      value: dieValue,
      boundId,
      contractType,
      fullPublicContract: clone(contractSnapshot),
      round,
      reason,
    });
    return dieValue;
  }

  operationFor(response) {
    const available = response.availableOperations || [];
    const isObservation = available.includes("submit_random_observation");
    const isRoundRoll = available.includes("submit_round_roll");
    if (isObservation === isRoundRoll) throw new Error(`ambiguous random boundary: ${stable(available)}`);
    const type = isObservation ? "submit_random_observation" : "submit_round_roll";
    const ids = isObservation
      ? clone(response.pending?.dieIds || [])
      : clone((response.pending?.dice || []).map((die) => die.id));
    if (ids.length === 0) throw new Error(`random contract ${type} exposed no IDs`);
    if (new Set(ids).size !== ids.length) throw new Error(`random contract exposed duplicate IDs: ${stable(ids)}`);
    const contractSnapshot = {
      status: response.status,
      reason: response.reason,
      availableOperations: clone(response.availableOperations || []),
      pending: clone(response.pending || null),
    };
    const values = {};
    for (const boundId of ids) {
      values[boundId] = this.draw({
        boundId,
        contractType: type,
        contractSnapshot,
        round: response.game.round,
        reason: response.reason,
      });
    }
    return {
      operation: { type, values },
      ids,
      contractSnapshot,
      contractRound: response.game.round,
    };
  }
}

function planSummary(plan) {
  const selectedOperation = clone(plan.recommendedPayload || null);
  const selectedCore = selectedOperation == null ? null : clone(selectedOperation);
  if (selectedCore) {
    delete selectedCore.predictions;
    delete selectedCore.cognitiveUnit;
  }
  const selectedCandidate = (plan.ranking || []).find((row) => stable(row.payload) === stable(selectedCore));
  return {
    schema: plan.schema || null,
    status: plan.status,
    boundary: clone(plan.boundary || null),
    attemptedCount: plan.attemptedCount ?? null,
    legalCandidateCount: plan.legalCandidateCount ?? null,
    rejectedCandidateCount: plan.rejectedCandidateCount ?? null,
    selectedOperation,
    selectedCandidate: selectedCandidate ? {
      payload: clone(selectedCandidate.payload),
      finalScore: selectedCandidate.finalScore,
      baselineScore: selectedCandidate.baselineScore,
      baselineContributions: clone(selectedCandidate.baselineContributions),
      imaginedStatus: selectedCandidate.imaginedStatus,
      imaginedReason: selectedCandidate.imaginedReason,
      imaginedState: clone(selectedCandidate.imaginedState),
      simulationReliability: selectedCandidate.simulationReliability,
      cognitiveUnit: clone(selectedCandidate.cognitiveUnit || null),
    } : null,
    topRanking: clone((plan.ranking || []).slice(0, 3).map((row) => ({
      payload: row.payload,
      finalScore: row.finalScore,
      baselineScore: row.baselineScore,
      imaginedState: row.imaginedState,
      cognitiveUnit: row.cognitiveUnit || null,
    }))),
    rejected: clone(plan.rejected || []),
  };
}

function isRandomBoundary(response) {
  const available = response.availableOperations || [];
  return available.includes("submit_random_observation") || available.includes("submit_round_roll");
}

function boundaryMetrics(observation) {
  const shipRows = (observation.ships || []).map((ship) => Number(ship.row));
  return {
    round: observation.round,
    phase: observation.phase,
    energy: observation.energy,
    damage: observation.damage,
    researchIndex: observation.researchIndex,
    excavatorIndex: observation.excavatorIndex,
    mothershipRow: observation.mothershipRow,
    shipCount: shipRows.length,
    waitingShipCount: (observation.waitingShips || []).length,
    shipRowSum: shipRows.reduce((sum, value) => sum + value, 0),
    maxShipRow: shipRows.length === 0 ? null : Math.max(...shipRows),
    outcome: clone(observation.outcome),
  };
}

function run() {
  for (const output of [
    "machine-evidence.json",
    "random-draw-tape.json",
    "final-checkpoint.json",
    "run-manifest.json",
    "verification.json",
  ]) {
    if (fs.existsSync(path.join(ARM_DIR, output))) throw new Error(`sealed output already exists: ${output}`);
  }

  const protocol = JSON.parse(fs.readFileSync(PROTOCOL_FILE, "utf8"));
  const frozenHashes = assertFrozenInputs(protocol);
  assert.equal(protocol.roundsToComplete, 3, "old arm is sealed to exactly three rounds");
  assert.equal(protocol.attentionSeed, 2026090104, "unexpected attention seed");
  assert.equal(protocol.random.algorithm, "xorshift32", "unexpected random algorithm");
  assert.equal(protocol.random.initialSeedUnsigned, 608135816, "unexpected random seed");

  const initialPublicState = require(INITIAL_STATE_FILE);
  const publicMap = require(PUBLIC_MAP_FILE);
  const { UfsFullGameAttentionSession } = require(SESSION_FILE);
  const plannerSourceHashes = Object.fromEntries(PLANNER_SOURCE_FILES.map((file) => [
    path.relative(SHARED_DIR, file).replaceAll("\\", "/"),
    sha256File(file),
  ]));
  const provider = new ExternalXorshift32Provider(protocol.random.initialSeedUnsigned);
  const session = new UfsFullGameAttentionSession({ publicMap });

  let inspectHostCallCount = 0;
  let hostAuditPermission = false;
  const originalInspectHostState = session.inspectHostState.bind(session);
  session.inspectHostState = () => {
    if (!hostAuditPermission) throw new Error("formal host inspection attempted outside shared-helper boundary audit");
    inspectHostCallCount += 1;
    return originalInspectHostState();
  };
  let imagineSequentialPlanCalls = 0;
  if (typeof session.imagineSequentialPlan === "function") {
    session.imagineSequentialPlan = () => {
      imagineSequentialPlanCalls += 1;
      throw new Error("sequential imagination is forbidden in the original-policy arm");
    };
  }

  let response = session.start({
    initialPublicState: clone(initialPublicState),
    attentionSeed: protocol.attentionSeed,
  });
  const events = [{
    eventOrdinal: 1,
    kind: "start",
    planInvocationOrdinal: null,
    planSummary: null,
    selectedOperation: null,
    submittedOperation: null,
    response: clone(response),
  }];
  const hostAudits = [];
  let planInvocationCount = 0;
  let deliberateActionCount = 0;
  let randomContractCount = 0;
  let rejectedResponseCount = 0;
  const manualRescueCount = 0;
  const externalPolicyActionCount = 0;
  let failure = null;

  while (hostAudits.length < protocol.roundsToComplete) {
    if (isWaitingForNextRoundRollBoundary(response)) {
      hostAuditPermission = true;
      let audit;
      try {
        audit = session.inspectHostState();
      } finally {
        hostAuditPermission = false;
      }
      const auditOrdinal = hostAudits.length + 1;
      hostAudits.push({
        auditOrdinal,
        sharedHelperAccepted: true,
        publicStatus: response.status,
        publicReason: response.reason,
        publicAvailableOperations: clone(response.availableOperations || []),
        actionCount: response.actionCount,
        metrics: boundaryMetrics(audit.observation),
        checkpointCanonicalSha256: canonicalSha256(audit.checkpoint),
        checkpoint: auditOrdinal === protocol.roundsToComplete ? clone(audit.checkpoint) : null,
      });
      if (hostAudits.length === protocol.roundsToComplete) break;
    }

    if (isRandomBoundary(response)) {
      let provided;
      try {
        provided = provider.operationFor(response);
      } catch (error) {
        failure = `external_random_provider_failed:${error.message}`;
        break;
      }
      randomContractCount += 1;
      const submittedOperation = clone(provided.operation);
      response = session.advance(submittedOperation);
      if (response.status === "rejected") rejectedResponseCount += 1;
      events.push({
        eventOrdinal: events.length + 1,
        kind: "external_random",
        planInvocationOrdinal: null,
        planSummary: null,
        randomContractIds: clone(provided.ids),
        randomContractRound: provided.contractRound,
        fullPublicContract: clone(provided.contractSnapshot),
        selectedOperation: null,
        submittedOperation,
        response: clone(response),
      });
      if (response.status === "rejected") {
        failure = `random_operation_rejected:${response.reason}`;
        break;
      }
      continue;
    }

    if (response.status !== "choice") {
      failure = `unexpected_public_status:${response.status}:${response.reason}`;
      break;
    }

    planInvocationCount += 1;
    let plan;
    try {
      plan = session.planCurrentChoice();
    } catch (error) {
      failure = `default_planner_threw:${error.message}`;
      break;
    }
    const summary = planSummary(plan);
    if (!summary.selectedOperation || !["planned", "planned_continuation"].includes(plan.status)) {
      events.push({
        eventOrdinal: events.length + 1,
        kind: "planner_failure",
        planInvocationOrdinal: planInvocationCount,
        planSummary: summary,
        selectedOperation: null,
        submittedOperation: null,
        response: clone(response),
      });
      failure = `default_planner_no_operation:${plan.status}`;
      break;
    }
    const selectedOperation = clone(summary.selectedOperation);
    deliberateActionCount += 1;
    response = session.advance(selectedOperation);
    if (response.status === "rejected") rejectedResponseCount += 1;
    events.push({
      eventOrdinal: events.length + 1,
      kind: "default_plan_action",
      planInvocationOrdinal: planInvocationCount,
      planSummary: summary,
      selectedOperation,
      submittedOperation: clone(selectedOperation),
      response: clone(response),
    });
    if (response.status === "rejected") {
      failure = `default_planner_operation_rejected:${response.reason}`;
      break;
    }
  }

  const lastAudit = hostAudits.at(-1) || null;
  const completed = failure == null && hostAudits.length === protocol.roundsToComplete;
  const automaticControllerModuleLoaded = Object.keys(require.cache).some((file) => (
    path.basename(file) === "automatic-multicutpoint-controller.js"
  ));
  const evidence = {
    schema: "ufs_original_default_planner_paired_v4_evidence",
    arm: "old",
    policy: "UfsFullGameAttentionSession.planCurrentChoice() exactly once per non-random public choice; execute returned recommendedPayload unchanged",
    runStatus: completed ? "completed" : "failed",
    failure,
    frozenHashes,
    preflightSha256: sha256File(PREFLIGHT_FILE),
    plannerSourceHashes,
    attentionSeed: protocol.attentionSeed,
    randomAlgorithm: protocol.random.algorithm,
    randomInitialSeedHex: protocol.random.initialSeedHex,
    counters: {
      completedRoundBoundaries: hostAudits.length,
      planInvocationCount,
      deliberateActionCount,
      randomContractCount,
      randomDrawCount: provider.tape.length,
      rejectedResponseCount,
      manualRescueCount,
      externalPolicyActionCount,
      imagineSequentialPlanCalls,
      automaticMulticutpointControllerCalls: 0,
      inspectHostCallCount,
    },
    automaticControllerModuleLoaded,
    hostAuditPolicy: "inspectHostState hard-guarded and called only after imported shared helper returned true; audit data never enters later planning",
    hostAudits: hostAudits.map(({ checkpoint, ...audit }) => audit),
    events,
  };
  writeJson(path.join(ARM_DIR, "machine-evidence.json"), evidence);
  writeJson(path.join(ARM_DIR, "random-draw-tape.json"), {
    schema: "ufs_paired_v4_xorshift32_draw_tape_v1",
    algorithm: protocol.random.algorithm,
    initialSeedHex: protocol.random.initialSeedHex,
    initialSeedUnsigned: protocol.random.initialSeedUnsigned,
    mapping: "advance xorshift32 once per bound public pending ID in exposed order, then value=(rawUnsigned % 6)+1",
    draws: provider.tape,
  });
  if (lastAudit?.checkpoint) writeJson(path.join(ARM_DIR, "final-checkpoint.json"), lastAudit.checkpoint);
  writeJson(path.join(ARM_DIR, "run-manifest.json"), {
    schema: "ufs_original_default_planner_paired_v4_manifest",
    arm: "old",
    runStatus: completed ? "completed" : "failed",
    failure,
    completedRoundBoundaries: hostAudits.length,
    outputHashes: Object.fromEntries([
      "preflight-validation.json",
      "machine-evidence.json",
      "random-draw-tape.json",
      ...(lastAudit?.checkpoint ? ["final-checkpoint.json"] : []),
    ].map((name) => [name, sha256File(path.join(ARM_DIR, name))])),
  });

  if (!completed) throw new Error(`old arm stopped honestly: ${failure}`);
}

run();
