"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { auditStageRecords } = require("../ufs_first_action_imagination_v0/audit-three-round-gate");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");

const root = __dirname;
const ARM = Object.freeze({
  treatment: {
    playerId: "ufs-v20-fresh-player",
    revision: 1,
    state: "states/treatment-episode2",
  },
  control: {
    playerId: "ufs-v21-fresh-control-player",
    revision: 0,
    state: "states/control-episode1",
  },
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readRecords(arm) {
  return fs.readFileSync(path.join(root, "records", arm, "machine-records.ndjson"), "utf8")
    .trim().split(/\r?\n/u).map(JSON.parse);
}

function normalizedPublic(response) {
  const output = structuredClone(response);
  delete output.game.playerId;
  delete output.game.episodeId;
  delete output.game.playerProfileRevision;
  return output;
}

const output = { schema: "ufs_paired_stage1_audit_v1", passed: true, arms: {}, paired: {} };
const recordsByArm = {};
for (const [arm, contract] of Object.entries(ARM)) {
  const records = readRecords(arm);
  recordsByArm[arm] = records;
  assert.equal(records[0].command, "snapshot");
  const auditableRecords = structuredClone(records);
  auditableRecords[0].command = "start";
  const checkpoint = readJson(`${contract.state}/full-game-host-checkpoint.json`);
  const restored = UfsFullGameAttentionSession.restore(checkpoint);
  const gate = auditStageRecords({
    records: auditableRecords,
    expectedRounds: 3,
    hostObservation: restored.inspectHostState().observation,
  });
  assert.equal(gate.stageGatePassed, true, JSON.stringify(gate.issues));
  let deliberateActions = 0;
  let explicitPredictionActions = 0;
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    assert.equal(record.sequence, String(index + 1).padStart(3, "0"));
    assert.equal(record.exitCode, 0);
    assert.equal(record.public.game.playerId, contract.playerId);
    assert.equal(record.public.game.playerProfileRevision, contract.revision);
    assert.notEqual(record.public.status, "rejected");
    if (record.command === "advance") {
      deliberateActions += 1;
      const payload = readJson(record.payloadFile);
      assert.ok(records[index - 1].public.availableOperations.includes(payload.type));
      if (payload.predictions?.length) explicitPredictionActions += 1;
    }
  }
  assert.equal(explicitPredictionActions, deliberateActions);
  output.arms[arm] = {
    gate,
    records: records.length,
    deliberateActions,
    explicitPredictionActions,
    predictionCoverage: deliberateActions ? explicitPredictionActions / deliberateActions : 0,
    rejected: 0,
  };
}

const treatmentRecords = recordsByArm.treatment;
const controlRecords = recordsByArm.control;
assert.equal(treatmentRecords.length, controlRecords.length);
for (let index = 0; index < treatmentRecords.length; index += 1) {
  assert.deepEqual(
    normalizedPublic(treatmentRecords[index].public),
    normalizedPublic(controlRecords[index].public),
    `public divergence at paired record ${index + 1}`,
  );
  if (treatmentRecords[index].command === "advance") {
    assert.deepEqual(
      readJson(treatmentRecords[index].payloadFile),
      readJson(controlRecords[index].payloadFile),
      `choice divergence at paired record ${index + 1}`,
    );
  }
  if (treatmentRecords[index].command === "random") {
    assert.deepEqual(treatmentRecords[index].randomMeta, controlRecords[index].randomMeta);
    assert.deepEqual(
      readJson(treatmentRecords[index].payloadFile),
      readJson(controlRecords[index].payloadFile),
      `random divergence at paired record ${index + 1}`,
    );
  }
}
output.paired = {
  recordCountEqual: true,
  everyPublicViewEqualExceptIdentity: true,
  everySubmittedChoiceEqual: true,
  everyRandomObservationEqual: true,
  behavioralDivergenceCount: 0,
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

