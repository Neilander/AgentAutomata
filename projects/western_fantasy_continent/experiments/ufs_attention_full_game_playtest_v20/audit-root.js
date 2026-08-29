"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const { compactAttentionResponse } = require("../ufs_first_action_imagination_v0/compact-attention-response");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const { createSessionForPlayer } = require("../ufs_first_action_imagination_v0/ufs-player-generator");

const dir = __dirname;
const stateDir = path.join(dir, "state_attempt_2026082920_v20");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const readLines = (file) => fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const records = readLines(path.join(dir, "machine-records.ndjson"));
const baseProfile = readJson(path.join(stateDir, "player-profile-base.json"));

const replay = createSessionForPlayer({ playerProfile: baseProfile, publicMap, initialPublicState });
let replayResponse = replay.response;
for (let index = 0; index < 48; index += 1) {
  const record = records[index];
  if (index > 0) {
    const action = record.command === "advance"
      ? readJson(path.join(dir, record.payloadFile))
      : record.public.lastAction;
    replayResponse = replay.session.advance(action);
  }
  assert.ok(same(compactAttentionResponse(replayResponse), record.public), `stage replay diverged at ${record.sequence}`);
}
const stageRestored = UfsFullGameAttentionSession.restore(replay.session.exportCheckpoint());
const stageHost = stageRestored.inspectHostState().observation;
assert.equal(replayResponse.status, "random");
assert.equal(replayResponse.reason, "waiting_for_next_round_roll");
assert.equal(replayResponse.game.completedRoundCount, 3);
assert.equal(stageHost.round, 3);
assert.equal(stageHost.phase, "new_round");

const checkpoint = readJson(path.join(stateDir, "full-game-host-checkpoint.json"));
const finalSession = UfsFullGameAttentionSession.restore(checkpoint);
const finalHost = finalSession.inspectHostState().observation;
const finalFeedback = finalSession.inspectFeedbackState();
assert.ok(same(compactAttentionResponse(finalSession.lastPlayerResponse), records.at(-1).public), "final checkpoint/public mismatch");
assert.equal(finalHost.outcome?.result, "loss");
assert.equal(finalHost.outcome?.reason, "mothership_reached_skull_row");
assert.equal(checkpoint.playerIdentity?.playerId, "ufs-v20-fresh-player");
assert.equal(checkpoint.playerIdentity?.baseProfileRevision, 0);
assert.equal(checkpoint.feedbackBridge?.pendingPredictionTickets?.length || 0, 0);
assert.equal(finalFeedback.learning.quarantinedFeedback.length, 0);

const cliRows = readLines(path.join(stateDir, "machine-transcript.jsonl"));
const attentionRows = readLines(path.join(stateDir, "attention-audit-transcript.jsonl"));
const feedbackRows = readLines(path.join(stateDir, "feedback-audit-transcript.jsonl"));
assert.equal(cliRows.length, records.length);
assert.equal(attentionRows.length, records.length);
assert.equal(feedbackRows.length, records.length);
const responseStatuses = {};
for (const record of records) responseStatuses[record.public.status] = (responseStatuses[record.public.status] || 0) + 1;
const ledger = finalFeedback.predictionLedger;
const predictionDispositions = {};
for (const row of ledger) predictionDispositions[row.status] = (predictionDispositions[row.status] || 0) + 1;

process.stdout.write(`${JSON.stringify({
  schema: "ufs_v20_root_audit_v1",
  passed: true,
  records: records.length,
  responseStatuses,
  stageGate: {
    replayedThroughSequence: 48,
    completedRoundCount: replayResponse.game.completedRoundCount,
    host: {
      round: stageHost.round,
      phase: stageHost.phase,
      energy: stageHost.energy,
      damage: stageHost.damage,
      researchIndex: stageHost.researchIndex,
      excavatorIndex: stageHost.excavatorIndex,
      mothershipRow: stageHost.mothershipRow,
    },
  },
  final: {
    round: finalHost.round,
    energy: finalHost.energy,
    damage: finalHost.damage,
    researchIndex: finalHost.researchIndex,
    excavatorIndex: finalHost.excavatorIndex,
    mothershipRow: finalHost.mothershipRow,
    outcome: finalHost.outcome,
  },
  player: checkpoint.playerIdentity,
  learning: {
    trajectories: finalFeedback.learning.trajectories.length,
    connectionUpdates: finalFeedback.learning.connectionUpdates.length,
    attentionAdjustments: finalFeedback.learning.attentionAdjustments.length,
    quarantined: finalFeedback.learning.quarantinedFeedback.length,
    predictionLedgerEntries: ledger.length,
    predictionDispositions,
    pendingPredictionTickets: checkpoint.feedbackBridge?.pendingPredictionTickets?.length || 0,
  },
}, null, 2)}\n`);

