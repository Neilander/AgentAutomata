"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function hash(relativePath) {
  return crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest("hex");
}

function learningCounts(profile) {
  return {
    trajectories: profile.cognition.feedbackLearningState.trajectories.length,
    connections: profile.cognition.feedbackLearningState.connectionUpdates.length,
    attentionAdjustments: profile.cognition.feedbackLearningState.attentionAdjustments.length,
    predictionLedger: profile.cognition.predictionLedger.length,
  };
}

function comparableView(view) {
  const output = structuredClone(view);
  delete output.game.playerId;
  delete output.game.episodeId;
  delete output.game.playerProfileRevision;
  return output;
}

const manifest = readJson("pair-manifest.json");
const treatmentInput = readJson(manifest.arms.treatment.profile);
const controlInput = readJson(manifest.arms.control.profile);
const treatmentBase = readJson("states/treatment-episode2/player-profile-base.json");
const controlBase = readJson("states/control-episode1/player-profile-base.json");
const treatmentView = readJson("states/treatment-episode2/current-player-view.json");
const controlView = readJson("states/control-episode1/current-player-view.json");
const treatmentCheckpoint = readJson("states/treatment-episode2/full-game-host-checkpoint.json");
const controlCheckpoint = readJson("states/control-episode1/full-game-host-checkpoint.json");

assert.equal(treatmentInput.playerId, manifest.arms.treatment.playerId);
assert.equal(controlInput.playerId, manifest.arms.control.playerId);
assert.notEqual(treatmentInput.playerId, controlInput.playerId);
assert.equal(treatmentInput.progress.revision, 1);
assert.equal(controlInput.progress.revision, 0);
assert.equal(treatmentInput.progress.episodesCaptured, 1);
assert.equal(controlInput.progress.episodesCaptured, 0);
assert.deepEqual(learningCounts(treatmentInput), {
  trajectories: 54,
  connections: 9,
  attentionAdjustments: 0,
  predictionLedger: 189,
});
assert.deepEqual(learningCounts(controlInput), {
  trajectories: 0,
  connections: 0,
  attentionAdjustments: 0,
  predictionLedger: 0,
});

assert.equal(treatmentBase.template.templateFingerprint, manifest.canonicalTemplateFingerprint);
assert.equal(controlBase.template.templateFingerprint, manifest.canonicalTemplateFingerprint);
assert.equal(treatmentBase.attention.baseSeed, manifest.attentionSeed);
assert.equal(controlBase.attention.baseSeed, manifest.attentionSeed);
assert.deepEqual(learningCounts(treatmentBase), learningCounts(treatmentInput));
assert.deepEqual(learningCounts(controlBase), learningCounts(controlInput));
assert.notEqual(hash(manifest.arms.treatment.profile), hash(manifest.arms.control.profile));

assert.deepEqual(
  treatmentCheckpoint.roundSession.core.initialPublicState,
  controlCheckpoint.roundSession.core.initialPublicState,
);
assert.deepEqual(treatmentCheckpoint.publicMap, controlCheckpoint.publicMap);
assert.equal(treatmentCheckpoint.gameAttentionSeed, manifest.attentionSeed);
assert.equal(controlCheckpoint.gameAttentionSeed, manifest.attentionSeed);
assert.deepEqual(comparableView(treatmentView), comparableView(controlView));
assert.equal(treatmentCheckpoint.actionHistory.length, 0);
assert.equal(controlCheckpoint.actionHistory.length, 0);
assert.equal(treatmentView.game.episodeId, "ufs-v20-fresh-player-episode-0002");
assert.equal(controlView.game.episodeId, "ufs-v21-fresh-control-player-episode-0001");
assert.equal(treatmentView.status, "choice");
assert.equal(controlView.status, "choice");

for (const relativePath of [
  "states/treatment-episode2/machine-transcript.jsonl",
  "states/control-episode1/machine-transcript.jsonl",
]) {
  const records = fs.readFileSync(path.join(root, relativePath), "utf8").trim().split(/\r?\n/u);
  assert.equal(records.length, 1);
  assert.equal(JSON.parse(records[0]).kind, "player_start");
}

const summary = {
  schema: "ufs_paired_learning_effect_baseline_v1",
  passed: true,
  attentionSeed: manifest.attentionSeed,
  canonicalTemplateFingerprint: manifest.canonicalTemplateFingerprint,
  formalInitialStateEqual: true,
  publicInitialViewEqualExceptPlayerIdentity: true,
  treatment: {
    playerId: treatmentInput.playerId,
    revision: treatmentInput.progress.revision,
    episodeId: treatmentView.game.episodeId,
    learning: learningCounts(treatmentInput),
    profileSha256: hash(manifest.arms.treatment.profile),
  },
  control: {
    playerId: controlInput.playerId,
    revision: controlInput.progress.revision,
    episodeId: controlView.game.episodeId,
    learning: learningCounts(controlInput),
    profileSha256: hash(manifest.arms.control.profile),
  },
  boundary: {
    treatment: `${treatmentView.status}/${treatmentView.reason}`,
    control: `${controlView.status}/${controlView.reason}`,
    actionCount: 0,
  },
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

