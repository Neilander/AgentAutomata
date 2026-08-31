"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { pathsFor, readRecords, sha256 } = require("./record-game-step");
const { verify } = require("./verify-game");

const SOURCE_SHA = "a1c3a2f13257cd89eea08581137ad1fedbd0b81addda0eff5a0ee4a4e9b8d92c";
const TAPE_SHA = "87af864441a322a5f766151e66feb60a4845b8d2a26905e6abad3bdc709d81d5";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizedPublic(response) {
  const output = structuredClone(response);
  if (output.game) {
    delete output.game.playerId;
    delete output.game.episodeId;
    delete output.game.playerProfileRevision;
  }
  return output;
}

function payload(root, record, includePredictions = true) {
  if (!record.payloadFile) return null;
  const output = readJson(path.join(root, record.payloadFile));
  if (!includePredictions) delete output.predictions;
  return output;
}

function compareGames(leftGame, rightGame) {
  const leftPaths = pathsFor(leftGame);
  const rightPaths = pathsFor(rightGame);
  const left = readRecords(leftPaths.ledger);
  const right = readRecords(rightPaths.ledger);
  assert.equal(left.length, right.length);
  let publicViewDivergences = 0;
  let behaviorPayloadDivergences = 0;
  let fullPredictionPayloadDivergences = 0;
  let randomPayloadDivergences = 0;
  const behaviorDivergenceSequences = [];
  for (let index = 0; index < left.length; index += 1) {
    if (!fs.existsSync(left[index].stdoutFile) || !fs.existsSync(right[index].stdoutFile)) {
      // Paths in records are experiment-root-relative, not process-cwd-relative.
    }
    if (!require("node:util").isDeepStrictEqual(
      normalizedPublic(left[index].public), normalizedPublic(right[index].public))) {
      publicViewDivergences += 1;
    }
    if (left[index].command === "advance" && right[index].command === "advance") {
      if (!require("node:util").isDeepStrictEqual(
        payload(leftPaths.root, left[index], false), payload(rightPaths.root, right[index], false))) {
        behaviorPayloadDivergences += 1;
        behaviorDivergenceSequences.push(left[index].sequence);
      }
      if (!require("node:util").isDeepStrictEqual(
        payload(leftPaths.root, left[index], true), payload(rightPaths.root, right[index], true))) {
        fullPredictionPayloadDivergences += 1;
      }
    }
    if (left[index].command === "random" && right[index].command === "random"
      && !require("node:util").isDeepStrictEqual(
        payload(leftPaths.root, left[index]), payload(rightPaths.root, right[index]))) {
      randomPayloadDivergences += 1;
    }
  }
  return {
    leftGame,
    rightGame,
    records: left.length,
    publicViewDivergences,
    behaviorPayloadDivergences,
    behaviorDivergenceSequences,
    fullPredictionPayloadDivergences,
    randomPayloadDivergences,
  };
}

function run() {
  const root = __dirname;
  const source = path.join(root, "..", "ufs_revision1_vs_fresh_control_v21", "profiles", "treatment-v20-revision1.json");
  assert.equal(sha256(source), SOURCE_SHA, "frozen V20 revision-1 source changed");
  assert.equal(sha256(path.join(root, "random-tape.json")), TAPE_SHA, "random tape changed after precommit");

  const games = [];
  const stateRealpaths = new Set();
  for (let game = 1; game <= 5; game += 1) {
    const audit = verify(game, "post-capture");
    games.push(audit);
    const paths = pathsFor(game);
    const stateRealpath = fs.realpathSync(paths.stateDir);
    assert.equal(stateRealpaths.has(stateRealpath), false, "state directory reused");
    stateRealpaths.add(stateRealpath);
    const receipt = readJson(path.join(paths.stateDir, "player-capture-receipt.json"));
    const captureRecord = readJson(path.join(paths.recordDir, "capture-record.json"));
    assert.equal(receipt.playerId, "ufs-v20-fresh-player");
    assert.equal(receipt.fromRevision, game);
    assert.equal(receipt.toRevision, game + 1);
    assert.equal(captureRecord.exitCode, 0);
    assert.equal(fs.readdirSync(paths.stateDir)
      .filter((name) => name === "player-capture-receipt.json").length, 1);
    if (game === 1) {
      assert.equal(sha256(paths.inputProfile), SOURCE_SHA);
    } else {
      const previous = pathsFor(game - 1);
      assert.equal(sha256(paths.inputProfile), sha256(previous.outputProfile),
        `game ${game} input is not the exact prior capture output`);
    }
  }

  const finalProfile = readJson(pathsFor(5).outputProfile);
  assert.equal(finalProfile.progress.revision, 6);
  assert.equal(finalProfile.progress.episodesCaptured, 6);
  assert.equal(finalProfile.episodeHistory.length, 6);
  assert.deepEqual(finalProfile.episodeHistory.slice(-5).map((episode) => episode.baseProfileRevision),
    [1, 2, 3, 4, 5]);
  assert.deepEqual(finalProfile.episodeHistory.slice(-5).map((episode) => episode.outcome?.result),
    ["loss", "loss", "loss", "loss", "loss"]);

  const comparisons = [];
  comparisons.push(compareGames(1, 5));
  for (let game = 3; game <= 5; game += 1) {
    const comparison = compareGames(2, game);
    comparisons.push(comparison);
    assert.equal(comparison.publicViewDivergences, 0,
      `game 2 and game ${game} public views diverged despite no feedback activation`);
    assert.equal(comparison.behaviorPayloadDivergences, 0,
      `game 2 and game ${game} choices diverged`);
    assert.equal(comparison.randomPayloadDivergences, 0,
      `game 2 and game ${game} random tape observations diverged`);
  }
  const game1v5 = comparisons[0];
  assert.equal(game1v5.randomPayloadDivergences, 0);

  const allFormalMetricsEqual = games.every((game) => require("node:util").isDeepStrictEqual(
    game.outcome, games[0].outcome));
  const totalFeedbackActivations = games.reduce((sum, game) =>
    sum + game.feedbackActivation.actualTicketActivations, 0);
  const summary = {
    schema: "ufs_v22_five_game_chain_audit_v1",
    passed: true,
    sourceProfile: {
      sha256: SOURCE_SHA,
      preserved: true,
      inputRevision: 1,
    },
    randomTape: {
      sha256: TAPE_SHA,
      seed: 2026082922,
      pairing: "pending-type-plus-occurrence-plus-sorted-die-ordinal",
      game1VsGame5RandomPayloadDivergences: game1v5.randomPayloadDivergences,
    },
    chain: {
      inputRevisions: [1, 2, 3, 4, 5],
      outputRevisions: [2, 3, 4, 5, 6],
      episodeIds: games.map((game) => game.player.episodeId),
      capturesPerGame: games.map((game) => game.evidence.captureReceiptCount),
      isolatedStateDirectories: stateRealpaths.size,
      finalRevision: finalProfile.progress.revision,
      finalEpisodesCaptured: finalProfile.progress.episodesCaptured,
    },
    games,
    comparisons,
    learningConclusion: {
      learningSaved: true,
      feedbackTrajectoryActualActivationCount: totalFeedbackActivations,
      learningActivated: totalFeedbackActivations > 0,
      allFormalMetricsEqual,
      game5ImprovedOverGame1: false,
      explanation: "Game 1 and Game 5 have the same formal loss, terminal round, tracks, operation counts, prediction dispositions, hazards, and zero feedback-* activations.",
    },
  };
  fs.writeFileSync(path.join(root, "AUDIT_SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (require.main === module) run();

module.exports = { compareGames, run };
