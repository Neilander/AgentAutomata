"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { auditStageDirectory } = require("../ufs_first_action_imagination_v0/audit-three-round-gate");
const { compactAttentionResponse } = require("../ufs_first_action_imagination_v0/compact-attention-response");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const readLines = (file) => fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const dir = __dirname;
const stateDir = path.join(dir, "state_attempt_2026082816_v16");
const issues = [];
const gate = auditStageDirectory(dir, 3);
if (!gate.stageGatePassed) issues.push(...gate.issues.map((row) => `gate:${row}`));
const machine = readLines(path.join(dir, "machine-records.ndjson"));
const cli = readLines(path.join(stateDir, "machine-transcript.jsonl"));
const attention = readLines(path.join(stateDir, "attention-audit-transcript.jsonl"));
const feedback = readLines(path.join(stateDir, "feedback-audit-transcript.jsonl"));
for (const [name, rows] of [["cli", cli], ["attention", attention], ["feedback", feedback]]) {
  if (rows.length !== machine.length) issues.push(`${name} count ${rows.length} != ${machine.length}`);
}
machine.forEach((row, index) => {
  if (!same(row.public, cli[index]?.response)) issues.push(`public transcript mismatch at ${row.sequence}`);
});
const checkpoint = JSON.parse(fs.readFileSync(path.join(stateDir, "full-game-host-checkpoint.json"), "utf8"));
if (checkpoint.schema !== "ufs_full_game_attention_checkpoint_v1") issues.push(`checkpoint schema ${checkpoint.schema}`);
if (checkpoint.formalFeedbackOracle?.schema !== "ufs_formal_feedback_oracle_checkpoint_v1") issues.push("formal checkpoint is not v1");
const restored = UfsFullGameAttentionSession.restore(checkpoint);
const host = restored.inspectHostState().observation;
const mental = restored.inspectMentalState().observation;
const learning = restored.inspectFeedbackState().learning;
if (!same(compactAttentionResponse(restored.lastPlayerResponse), machine.at(-1)?.public)) issues.push("restored final public mismatch");
let acceptedFormalSteps = 0;
let mismatches = 0;
let rejected = 0;
let formalProjectionViolations = 0;
const feedbackStatuses = {};
const feedbackReasons = {};
const collections = {
  die: "dice",
  ship: "ships",
  waiting_ship: "waitingShips",
  placement: "placements",
  robot: "robots",
};
machine.forEach((row, index) => {
  if (index === 0) return;
  if (row.public.status === "rejected") { rejected += 1; return; }
  const step = feedback[index]?.audit?.formalStep;
  if (!step?.accepted) issues.push(`missing accepted formal step at ${row.sequence}`);
  else {
    acceptedFormalSteps += 1;
    if (step.cognitiveMatch === false) mismatches += 1;
    for (const item of attention[index]?.response?.noticedItems || []) {
      let expected;
      if (item.itemId.startsWith("track:")) {
        expected = step.after[item.itemId.slice("track:".length)];
      } else if (collections[item.kind]) {
        expected = step.after[collections[item.kind]]?.find((candidate) => candidate.id === item.value?.id);
      } else {
        continue;
      }
      if (!same(item.value, expected)) {
        formalProjectionViolations += 1;
        issues.push(`noticed dynamic item is not from formal after-state at ${row.sequence}:${item.itemId}`);
      }
    }
  }
  const status = feedback[index]?.audit?.status || "none";
  const reason = feedback[index]?.audit?.reason || "none";
  feedbackStatuses[status] = (feedbackStatuses[status] || 0) + 1;
  feedbackReasons[reason] = (feedbackReasons[reason] || 0) + 1;
});
if (learning.quarantinedFeedback.length) issues.push(`quarantined feedback ${learning.quarantinedFeedback.length}`);
const result = {
  schema: "ufs_v16_authoritative_stage_audit_v0",
  passed: issues.length === 0,
  issues,
  gate,
  records: machine.length,
  acceptedFormalSteps,
  rejectedSteps: rejected,
  cognitiveMismatchSteps: mismatches,
  formalProjectionViolations,
  feedbackStatuses,
  feedbackReasons,
  hostMentalDiffer: !same(host, mental),
  hostMentalDifferingSections: Object.keys(host)
    .filter((key) => !same(host[key], mental[key])),
  host: {
    round: host.round, phase: host.phase, energy: host.energy, damage: host.damage,
    researchIndex: host.researchIndex, excavatorIndex: host.excavatorIndex,
    mothershipRow: host.mothershipRow, outcome: host.outcome,
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
