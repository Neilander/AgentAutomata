"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ARM_DIR = __dirname;
const PAIR_DIR = path.dirname(ARM_DIR);
const SHARED_DIR = path.resolve(PAIR_DIR, "../ufs_first_action_imagination_v0");
const PROTOCOL_FILE = path.join(PAIR_DIR, "PAIR_PROTOCOL.json");
const PROTOCOL_HASH_FILE = path.join(PAIR_DIR, "PAIR_PROTOCOL.sha256");
const INITIAL_STATE_FILE = path.join(SHARED_DIR, "public_initial_state.json");
const PUBLIC_MAP_FILE = path.join(SHARED_DIR, "public-map.js");
const PLANNER_SOURCE_FILES = [
  path.join(SHARED_DIR, "ufs-full-game-attention-session.js"),
  path.join(SHARED_DIR, "ufs-prechoice-planner.js"),
  path.join(SHARED_DIR, "ufs-temporal-cognitive-unit.js"),
];

const initialPublicState = require(INITIAL_STATE_FILE);
const publicMap = require(PUBLIC_MAP_FILE);
const { UfsFullGameAttentionSession } = require(
  path.join(SHARED_DIR, "ufs-full-game-attention-session.js"),
);

function clone(value) {
  return structuredClone(value);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function stable(value) {
  return JSON.stringify(value);
}

function assertFrozenInputs(protocol) {
  const expectedProtocolHash = fs.readFileSync(PROTOCOL_HASH_FILE, "utf8").trim().split(/\s+/)[0];
  const actualProtocolHash = sha256File(PROTOCOL_FILE);
  if (actualProtocolHash !== expectedProtocolHash) {
    throw new Error(`protocol hash mismatch: ${actualProtocolHash} != ${expectedProtocolHash}`);
  }
  const initialHash = sha256File(INITIAL_STATE_FILE);
  const mapHash = sha256File(PUBLIC_MAP_FILE);
  if (initialHash !== protocol.assets.publicInitialState.sha256) {
    throw new Error(`public initial state hash mismatch: ${initialHash}`);
  }
  if (mapHash !== protocol.assets.publicMap.sha256) {
    throw new Error(`public map hash mismatch: ${mapHash}`);
  }
  return { protocol: actualProtocolHash, publicInitialState: initialHash, publicMap: mapHash };
}

class ExternalXorshift32Provider {
  constructor(seedUnsigned) {
    this.state = Number(seedUnsigned) >>> 0;
    this.ordinal = 0;
    this.tape = [];
  }

  draw({ boundId, contractType, round, reason }) {
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
      round,
      reason,
    });
    return dieValue;
  }

  operationFor(response) {
    const available = response.availableOperations || [];
    const isObservation = available.includes("submit_random_observation");
    const isRoundRoll = available.includes("submit_round_roll");
    if (isObservation === isRoundRoll) {
      throw new Error(`ambiguous random boundary: ${stable(available)}`);
    }
    const type = isObservation ? "submit_random_observation" : "submit_round_roll";
    const ids = isObservation
      ? clone(response.pending?.dieIds || [])
      : clone((response.pending?.dice || []).map((die) => die.id));
    if (ids.length === 0) throw new Error(`random contract ${type} exposed no IDs`);
    const values = {};
    for (const boundId of ids) {
      values[boundId] = this.draw({
        boundId,
        contractType: type,
        round: response.game.round,
        reason: response.reason,
      });
    }
    return { operation: { type, values }, ids };
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

function isRoundAuditBoundary(response) {
  return response.status === "choice"
    && response.reason === "waiting_for_next_round_roll"
    && (response.availableOperations || []).includes("submit_round_roll");
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
    if (fs.existsSync(path.join(ARM_DIR, output))) {
      throw new Error(`sealed output already exists; refusing to overwrite: ${output}`);
    }
  }

  const protocol = JSON.parse(fs.readFileSync(PROTOCOL_FILE, "utf8"));
  const frozenHashes = assertFrozenInputs(protocol);
  if (protocol.roundsToComplete !== 3) throw new Error("old arm is sealed to exactly three rounds");
  if (protocol.random.algorithm !== "xorshift32") throw new Error("unexpected random algorithm");

  const plannerSourceHashes = Object.fromEntries(PLANNER_SOURCE_FILES.map((file) => [
    path.relative(SHARED_DIR, file).replaceAll("\\", "/"),
    sha256File(file),
  ]));
  const provider = new ExternalXorshift32Provider(protocol.random.initialSeedUnsigned);
  const session = new UfsFullGameAttentionSession({ publicMap });
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
  let manualRescueCount = 0;
  let externalPolicyActionCount = 0;
  let failure = null;

  while (hostAudits.length < protocol.roundsToComplete) {
    if (isRoundAuditBoundary(response)) {
      const audit = session.inspectHostState();
      hostAudits.push({
        auditOrdinal: hostAudits.length + 1,
        publicReason: response.reason,
        actionCount: response.actionCount,
        metrics: boundaryMetrics(audit.observation),
        checkpointSha256: crypto.createHash("sha256")
          .update(JSON.stringify(audit.checkpoint))
          .digest("hex"),
        checkpoint: hostAudits.length + 1 === protocol.roundsToComplete
          ? clone(audit.checkpoint)
          : null,
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
  const evidence = {
    schema: "ufs_original_default_planner_paired_v3_evidence",
    arm: "old",
    policy: "UfsFullGameAttentionSession.planCurrentChoice() once per non-random public choice; execute returned recommendedPayload unchanged",
    runStatus: completed ? "completed" : "failed",
    failure,
    frozenHashes,
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
      imagineSequentialPlanCalls: 0,
      automaticMulticutpointControllerCalls: 0,
    },
    hostAuditPolicy: "inspectHostState called only after public waiting_for_next_round_roll and audit data never enters planning",
    hostAudits: hostAudits.map(({ checkpoint, ...audit }) => audit),
    events,
  };
  writeJson(path.join(ARM_DIR, "machine-evidence.json"), evidence);
  writeJson(path.join(ARM_DIR, "random-draw-tape.json"), {
    schema: "ufs_paired_xorshift32_draw_tape_v1",
    algorithm: protocol.random.algorithm,
    initialSeedHex: protocol.random.initialSeedHex,
    mapping: "advance xorshift32 once per bound ID, then value=(rawUnsigned % 6)+1",
    draws: provider.tape,
  });
  if (lastAudit?.checkpoint) writeJson(path.join(ARM_DIR, "final-checkpoint.json"), lastAudit.checkpoint);
  writeJson(path.join(ARM_DIR, "run-manifest.json"), {
    schema: "ufs_original_default_planner_paired_v3_manifest",
    arm: "old",
    runStatus: completed ? "completed" : "failed",
    failure,
    completedRoundBoundaries: hostAudits.length,
    outputHashes: Object.fromEntries([
      "machine-evidence.json",
      "random-draw-tape.json",
      ...(lastAudit?.checkpoint ? ["final-checkpoint.json"] : []),
    ].map((name) => [name, sha256File(path.join(ARM_DIR, name))])),
  });

  if (!completed) throw new Error(`old arm stopped honestly: ${failure}`);
}

run();
