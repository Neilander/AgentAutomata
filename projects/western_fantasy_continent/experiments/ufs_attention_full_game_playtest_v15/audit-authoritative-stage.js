"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { auditStageDirectory } = require("../ufs_first_action_imagination_v0/audit-three-round-gate");
const { compactAttentionResponse } = require("../ufs_first_action_imagination_v0/compact-attention-response");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

const dir = __dirname;
const stateDir = path.join(dir, "state_attempt_2026082815_v15");
const issues = [];
const gate = auditStageDirectory(dir, 3);
if (!gate.stageGatePassed) issues.push(...gate.issues.map((row) => `gate:${row}`));

const machine = readJsonLines(path.join(dir, "machine-records.ndjson"));
const cliMachine = readJsonLines(path.join(stateDir, "machine-transcript.jsonl"));
const attention = readJsonLines(path.join(stateDir, "attention-audit-transcript.jsonl"));
const feedback = readJsonLines(path.join(stateDir, "feedback-audit-transcript.jsonl"));
for (const [name, rows] of [["cliMachine", cliMachine], ["attention", attention], ["feedback", feedback]]) {
  if (rows.length !== machine.length) issues.push(`${name} count ${rows.length} != machine ${machine.length}`);
}
for (let index = 0; index < Math.min(machine.length, cliMachine.length); index += 1) {
  if (!same(machine[index].public, cliMachine[index].response)) {
    issues.push(`public/CLI transcript mismatch at sequence ${machine[index].sequence}`);
  }
}

const checkpoint = JSON.parse(fs.readFileSync(
  path.join(stateDir, "full-game-host-checkpoint.json"),
  "utf8",
));
if (checkpoint.schema !== "ufs_full_game_attention_checkpoint_v1") {
  issues.push(`checkpoint schema is ${checkpoint.schema}`);
}
if (checkpoint.formalFeedbackOracle?.schema !== "ufs_formal_feedback_oracle_checkpoint_v1") {
  issues.push(`formal checkpoint schema is ${checkpoint.formalFeedbackOracle?.schema}`);
}
const restored = UfsFullGameAttentionSession.restore(checkpoint);
const host = restored.inspectHostState().observation;
const mental = restored.inspectMentalState().observation;
const learning = restored.inspectFeedbackState().learning;
const lastPublic = machine.at(-1)?.public;
if (!same(compactAttentionResponse(restored.lastPlayerResponse), lastPublic)) {
  issues.push("restored public response differs from final recorded response");
}

let acceptedFormalSteps = 0;
let cognitiveMismatchSteps = 0;
let rejectedSteps = 0;
for (let index = 0; index < machine.length; index += 1) {
  const publicResponse = machine[index].public;
  if (!publicResponse) {
    issues.push(`missing public response at ${machine[index].sequence}`);
    continue;
  }
  if (publicResponse.status === "rejected") {
    rejectedSteps += 1;
    continue;
  }
  if (index === 0) continue;
  const formalStep = feedback[index]?.audit?.formalStep;
  if (!formalStep?.accepted) {
    issues.push(`accepted public operation lacks accepted formal step at ${machine[index].sequence}`);
    continue;
  }
  acceptedFormalSteps += 1;
  if (formalStep.cognitiveMatch === false) cognitiveMismatchSteps += 1;
}
if ((learning.quarantinedFeedback || []).length > 0) {
  issues.push(`quarantined feedback count is ${learning.quarantinedFeedback.length}`);
}

const finalSummary = feedback.at(-1)?.learningSummary || {};
if (finalSummary.learnedTrajectories !== learning.trajectories.length) {
  issues.push("learned trajectory summary differs from checkpoint");
}
if (finalSummary.reinforcedConnections !== learning.connectionUpdates.length) {
  issues.push("connection summary differs from checkpoint");
}

const result = {
  schema: "ufs_v15_authoritative_stage_audit_v0",
  passed: issues.length === 0,
  issues,
  gate,
  records: machine.length,
  acceptedFormalSteps,
  rejectedSteps,
  cognitiveMismatchSteps,
  hostMentalDiffer: !same(host, mental),
  host: {
    round: host.round,
    phase: host.phase,
    energy: host.energy,
    damage: host.damage,
    researchIndex: host.researchIndex,
    excavatorIndex: host.excavatorIndex,
    mothershipRow: host.mothershipRow,
    outcome: host.outcome,
  },
  learning: {
    trajectories: learning.trajectories.length,
    connections: learning.connectionUpdates.length,
    attentionAdjustments: learning.attentionAdjustments.length,
    quarantined: learning.quarantinedFeedback.length,
  },
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.passed) process.exitCode = 1;
