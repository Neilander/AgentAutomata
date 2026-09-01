"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ARM_DIR = __dirname;
const PAIR_DIR = path.dirname(ARM_DIR);
const SHARED_DIR = path.resolve(PAIR_DIR, "../ufs_first_action_imagination_v0");
const PROTOCOL_FILE = path.join(PAIR_DIR, "PAIR_PROTOCOL.json");
const HELPER_FILE = path.join(PAIR_DIR, "safety-boundary.js");
const { isWaitingForNextRoundRollBoundary } = require(HELPER_FILE);

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(ARM_DIR, name), "utf8"));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function canonicalSha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stable(value) {
  return JSON.stringify(value);
}

function check(name, pass, details) {
  return { name, pass: Boolean(pass), details };
}

const protocol = JSON.parse(fs.readFileSync(PROTOCOL_FILE, "utf8"));
const expectedProtocolHash = fs.readFileSync(path.join(PAIR_DIR, "PAIR_PROTOCOL.sha256"), "utf8")
  .trim().split(/\s+/)[0];
const evidence = readJson("machine-evidence.json");
const tape = readJson("random-draw-tape.json");
const preflight = readJson("preflight-validation.json");
const manifest = readJson("run-manifest.json");
const checkpointFile = path.join(ARM_DIR, "final-checkpoint.json");
const checkpoint = fs.existsSync(checkpointFile) ? readJson("final-checkpoint.json") : null;
const deliberate = evidence.events.filter((row) => row.kind === "default_plan_action");
const randomEvents = evidence.events.filter((row) => row.kind === "external_random");
const rejected = evidence.events.filter((row) => row.response?.status === "rejected");
const publicSafeBoundaries = evidence.events.filter((row) => isWaitingForNextRoundRollBoundary(row.response));

const randomChecks = [];
let expectedOrdinal = 1;
let tapeOffset = 0;
let expectedState = protocol.random.initialSeedUnsigned >>> 0;
for (const event of randomEvents) {
  const ids = event.randomContractIds || [];
  const expectedIds = event.submittedOperation.type === "submit_random_observation"
    ? (event.fullPublicContract.pending?.dieIds || [])
    : (event.fullPublicContract.pending?.dice || []).map((die) => die.id);
  randomChecks.push({
    kind: "contract",
    pass: stable(ids) === stable(expectedIds)
      && stable(Object.keys(event.submittedOperation.values || {})) === stable(ids)
      && Number.isInteger(event.randomContractRound),
  });
  for (const id of ids) {
    let value = expectedState >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    expectedState = value >>> 0;
    const draw = tape.draws[tapeOffset];
    const expectedValue = (expectedState % 6) + 1;
    randomChecks.push({
      kind: "draw",
      pass: Boolean(draw)
        && draw.ordinal === expectedOrdinal
        && draw.rawUnsigned === expectedState
        && draw.value === expectedValue
        && draw.boundId === id
        && draw.contractType === event.submittedOperation.type
        && draw.round === event.randomContractRound
        && draw.reason === event.fullPublicContract.reason
        && stable(draw.fullPublicContract) === stable(event.fullPublicContract)
        && event.submittedOperation.values[id] === draw.value,
    });
    expectedOrdinal += 1;
    tapeOffset += 1;
  }
}

const plannerHashesStillMatch = Object.entries(evidence.plannerSourceHashes).every(([name, hash]) => (
  sha256(path.join(SHARED_DIR, name)) === hash
));
const thirdAudit = evidence.hostAudits[2] || null;
const checks = [
  check("host-free preflight passed before runtime construction", preflight.passed === true && preflight.hostRuntimeImported === false && preflight.sessionConstructed === false && preflight.randomDrawsConsumed === 0, preflight.hostFreeCases.map(({ id, expected, actual }) => ({ id, expected, actual }))),
  check("protocol/helper/test/result and public assets match frozen hashes", sha256(PROTOCOL_FILE) === expectedProtocolHash
    && evidence.frozenHashes.protocol === expectedProtocolHash
    && evidence.frozenHashes.helper === protocol.safetyBoundary.helperSha256
    && evidence.frozenHashes.contractTest === protocol.safetyBoundary.contractTestSha256
    && evidence.frozenHashes.sealedTestResult === protocol.safetyBoundary.preRunEvidenceSha256
    && evidence.frozenHashes.publicInitialState === protocol.assets.publicInitialState.sha256
    && evidence.frozenHashes.publicMap === protocol.assets.publicMap.sha256, evidence.frozenHashes),
  check("run completed", evidence.runStatus === "completed" && evidence.failure == null && manifest.runStatus === "completed", evidence.failure),
  check("exactly three imported-helper boundaries and stopped at third", publicSafeBoundaries.length === 3
    && isWaitingForNextRoundRollBoundary(evidence.events.at(-1)?.response)
    && evidence.counters.completedRoundBoundaries === 3, { boundaries: publicSafeBoundaries.length, finalEvent: evidence.events.at(-1)?.eventOrdinal }),
  check("exactly three post-hoc host audits, all helper-approved", evidence.hostAudits.length === 3
    && evidence.counters.inspectHostCallCount === 3
    && evidence.hostAudits.every((row) => row.sharedHelperAccepted === true
      && row.publicStatus === "random"
      && row.publicReason === "waiting_for_next_round_roll"
      && row.publicAvailableOperations.includes("submit_round_roll")), evidence.hostAudits.map((row) => row.metrics)),
  check("non-random action count equals unique one-call planner ordinals", deliberate.length === evidence.counters.planInvocationCount
    && deliberate.length === evidence.counters.deliberateActionCount
    && deliberate.every((row, index) => row.planInvocationOrdinal === index + 1), { deliberate: deliberate.length, plans: evidence.counters.planInvocationCount }),
  check("every non-random action is byte-for-byte the unique default recommendation", deliberate.every((row) => row.planInvocationOrdinal
    && stable(row.selectedOperation) === stable(row.submittedOperation)
    && stable(row.planSummary.selectedOperation) === stable(row.submittedOperation)), deliberate.length),
  check("no default-planner failure event", !evidence.events.some((row) => row.kind === "planner_failure"), null),
  check("zero rejected live responses", rejected.length === 0 && evidence.counters.rejectedResponseCount === 0, rejected.map((row) => row.response.reason)),
  check("zero manual rescue and external policy action", evidence.counters.manualRescueCount === 0 && evidence.counters.externalPolicyActionCount === 0, { manual: evidence.counters.manualRescueCount, external: evidence.counters.externalPolicyActionCount }),
  check("zero sequential imagination and automatic controller use", evidence.counters.imagineSequentialPlanCalls === 0
    && evidence.counters.automaticMulticutpointControllerCalls === 0
    && evidence.automaticControllerModuleLoaded === false, { sequential: evidence.counters.imagineSequentialPlanCalls, automatic: evidence.counters.automaticMulticutpointControllerCalls, moduleLoaded: evidence.automaticControllerModuleLoaded }),
  check("planner source identities stayed stable during verification", plannerHashesStillMatch, evidence.plannerSourceHashes),
  check("random contracts all come from provider events", randomEvents.length === evidence.counters.randomContractCount, { events: randomEvents.length, counter: evidence.counters.randomContractCount }),
  check("random tape is exact xorshift32 stream with full contract and public ID binding", randomChecks.length > 0
    && randomChecks.every((row) => row.pass)
    && tapeOffset === tape.draws.length
    && tape.draws.length === evidence.counters.randomDrawCount, { checked: randomChecks.length, failed: randomChecks.filter((row) => !row.pass).length, draws: tape.draws.length }),
  check("random draw values are 1..6", tape.draws.every((row) => Number.isInteger(row.value) && row.value >= 1 && row.value <= 6), tape.draws.length),
  check("final checkpoint exists", checkpoint != null, checkpointFile),
  check("final checkpoint is exactly the third boundary checkpoint", checkpoint != null
    && thirdAudit != null
    && canonicalSha256(checkpoint) === thirdAudit.checkpointCanonicalSha256
    && checkpoint.completedRounds?.length === 3
    && checkpoint.formalFeedbackOracle?.state?.phase === "new_round", { hash: checkpoint == null ? null : canonicalSha256(checkpoint), auditHash: thirdAudit?.checkpointCanonicalSha256, completedRounds: checkpoint?.completedRounds?.length, phase: checkpoint?.formalFeedbackOracle?.state?.phase }),
  check("frozen attention and random seeds recorded", evidence.attentionSeed === protocol.attentionSeed
    && evidence.randomInitialSeedHex === protocol.random.initialSeedHex
    && tape.initialSeedUnsigned === protocol.random.initialSeedUnsigned, { attentionSeed: evidence.attentionSeed, randomInitialSeedHex: evidence.randomInitialSeedHex }),
  check("manifest hashes bind all evidence outputs", manifest.outputHashes["preflight-validation.json"] === sha256(path.join(ARM_DIR, "preflight-validation.json"))
    && manifest.outputHashes["machine-evidence.json"] === sha256(path.join(ARM_DIR, "machine-evidence.json"))
    && manifest.outputHashes["random-draw-tape.json"] === sha256(path.join(ARM_DIR, "random-draw-tape.json"))
    && manifest.outputHashes["final-checkpoint.json"] === sha256(checkpointFile), manifest.outputHashes),
];

const verification = {
  schema: "ufs_original_default_planner_paired_v4_verification",
  arm: "old",
  pass: checks.every((row) => row.pass),
  passed: checks.filter((row) => row.pass).length,
  total: checks.length,
  checks,
  evidenceHashes: {
    preflight: sha256(path.join(ARM_DIR, "preflight-validation.json")),
    machineEvidence: sha256(path.join(ARM_DIR, "machine-evidence.json")),
    randomDrawTape: sha256(path.join(ARM_DIR, "random-draw-tape.json")),
    finalCheckpoint: checkpoint == null ? null : sha256(checkpointFile),
  },
};
fs.writeFileSync(path.join(ARM_DIR, "verification.json"), `${JSON.stringify(verification, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(verification, null, 2)}\n`);
if (!verification.pass) process.exitCode = 1;
