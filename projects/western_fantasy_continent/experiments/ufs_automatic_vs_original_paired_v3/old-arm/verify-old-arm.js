"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ARM_DIR = __dirname;
const PAIR_DIR = path.dirname(ARM_DIR);

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(ARM_DIR, name), "utf8"));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function stable(value) {
  return JSON.stringify(value);
}

function check(name, pass, details) {
  return { name, pass: Boolean(pass), details };
}

const protocol = JSON.parse(fs.readFileSync(path.join(PAIR_DIR, "PAIR_PROTOCOL.json"), "utf8"));
const expectedProtocolHash = fs.readFileSync(path.join(PAIR_DIR, "PAIR_PROTOCOL.sha256"), "utf8")
  .trim().split(/\s+/)[0];
const evidence = readJson("machine-evidence.json");
const tape = readJson("random-draw-tape.json");
const checkpointFile = path.join(ARM_DIR, "final-checkpoint.json");
const checkpoint = fs.existsSync(checkpointFile) ? readJson("final-checkpoint.json") : null;
const deliberate = evidence.events.filter((row) => row.kind === "default_plan_action");
const randomEvents = evidence.events.filter((row) => row.kind === "external_random");
const rejected = evidence.events.filter((row) => row.response?.status === "rejected");
const publicSafeBoundaries = evidence.events.filter((row) => (
  row.response?.reason === "waiting_for_next_round_roll"
  && (row.response?.availableOperations || []).includes("submit_round_roll")
));

const ordinalAndBindings = [];
let expectedOrdinal = 1;
let tapeOffset = 0;
for (const event of randomEvents) {
  const ids = event.randomContractIds || [];
  for (const id of ids) {
    const draw = tape.draws[tapeOffset];
    ordinalAndBindings.push(Boolean(draw)
      && draw.ordinal === expectedOrdinal
      && draw.boundId === id
      && event.submittedOperation.values[id] === draw.value);
    expectedOrdinal += 1;
    tapeOffset += 1;
  }
}

const checks = [
  check("protocol hash matches frozen sidecar", sha256(path.join(PAIR_DIR, "PAIR_PROTOCOL.json")) === expectedProtocolHash, expectedProtocolHash),
  check("protocol hash recorded by run", evidence.frozenHashes.protocol === expectedProtocolHash, evidence.frozenHashes.protocol),
  check("run completed", evidence.runStatus === "completed" && evidence.failure == null, evidence.failure),
  check("exactly three public safe boundaries and execution stopped there", publicSafeBoundaries.length === 3 && evidence.events.at(-1)?.response?.reason === "waiting_for_next_round_roll", { observed: publicSafeBoundaries.length, finalReason: evidence.events.at(-1)?.response?.reason }),
  check("exactly three formal safe-boundary audits", evidence.hostAudits.length === 3 && evidence.counters.completedRoundBoundaries === 3, evidence.hostAudits.map((row) => row.metrics)),
  check("every audit is waiting_for_next_round_roll", evidence.hostAudits.every((row) => row.publicReason === "waiting_for_next_round_roll"), evidence.hostAudits.map((row) => row.publicReason)),
  check("non-random action count equals plan invocation count", deliberate.length === evidence.counters.planInvocationCount && deliberate.length === evidence.counters.deliberateActionCount, { deliberate: deliberate.length, plans: evidence.counters.planInvocationCount }),
  check("every non-random action is exactly the selected operation", deliberate.every((row) => row.planInvocationOrdinal && stable(row.selectedOperation) === stable(row.submittedOperation) && stable(row.planSummary.selectedOperation) === stable(row.submittedOperation)), deliberate.length),
  check("no default-planner failure event", !evidence.events.some((row) => row.kind === "planner_failure"), null),
  check("zero rejected live responses", rejected.length === 0 && evidence.counters.rejectedResponseCount === 0, rejected.map((row) => row.response.reason)),
  check("zero manual rescue", evidence.counters.manualRescueCount === 0, evidence.counters.manualRescueCount),
  check("zero external policy action", evidence.counters.externalPolicyActionCount === 0, evidence.counters.externalPolicyActionCount),
  check("no sequential imagination or automatic controller calls", evidence.counters.imagineSequentialPlanCalls === 0 && evidence.counters.automaticMulticutpointControllerCalls === 0, { imagineSequentialPlanCalls: evidence.counters.imagineSequentialPlanCalls, automaticMulticutpointControllerCalls: evidence.counters.automaticMulticutpointControllerCalls }),
  check("random contracts all come from provider events", randomEvents.length === evidence.counters.randomContractCount, { events: randomEvents.length, counter: evidence.counters.randomContractCount }),
  check("random draw tape is contiguous and bound in public ID order", ordinalAndBindings.length === tape.draws.length && ordinalAndBindings.every(Boolean), { verified: ordinalAndBindings.filter(Boolean).length, draws: tape.draws.length }),
  check("random draw values are 1..6", tape.draws.every((row) => Number.isInteger(row.value) && row.value >= 1 && row.value <= 6), tape.draws.length),
  check("final checkpoint exists", checkpoint != null, checkpointFile),
  check("final checkpoint is the third safe-boundary checkpoint", checkpoint?.completedRounds?.length === 3 && checkpoint?.formalFeedbackOracle?.state?.phase === "new_round", { completedRounds: checkpoint?.completedRounds?.length ?? null, phase: checkpoint?.formalFeedbackOracle?.state?.phase ?? null }),
  check("frozen attention and random seeds recorded", evidence.attentionSeed === protocol.attentionSeed && evidence.randomInitialSeedHex === protocol.random.initialSeedHex, { attentionSeed: evidence.attentionSeed, randomInitialSeedHex: evidence.randomInitialSeedHex }),
];

const verification = {
  schema: "ufs_original_default_planner_paired_v3_verification",
  arm: "old",
  pass: checks.every((row) => row.pass),
  passed: checks.filter((row) => row.pass).length,
  total: checks.length,
  checks,
  evidenceHashes: {
    machineEvidence: sha256(path.join(ARM_DIR, "machine-evidence.json")),
    randomDrawTape: sha256(path.join(ARM_DIR, "random-draw-tape.json")),
    finalCheckpoint: checkpoint == null ? null : sha256(checkpointFile),
  },
};
fs.writeFileSync(path.join(ARM_DIR, "verification.json"), `${JSON.stringify(verification, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(verification, null, 2)}\n`);
if (!verification.pass) process.exitCode = 1;
