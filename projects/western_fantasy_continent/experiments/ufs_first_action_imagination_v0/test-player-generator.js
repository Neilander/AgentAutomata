"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const {
  buildInitialPlayerTemplate,
  capturePlayerProfile,
  createFreshPlayer,
  createSessionForPlayer,
  forkPlayer,
  restoreSessionForPlayer,
  summarizePlayerProfile,
  validatePlayerProfile,
} = require("./ufs-player-generator");

const clock = () => "2026-08-28T12:00:00.000Z";

function fresh(playerId, seed = 2026082830) {
  return createFreshPlayer({ playerId, attentionSeed: seed, now: clock });
}

function start(playerProfile) {
  return createSessionForPlayer({
    playerProfile,
    publicMap,
    initialPublicState,
    now: clock,
    sessionOptions: {
      choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
    },
  });
}

test("the frozen initial player template has a stable cognitive asset fingerprint", () => {
  const left = buildInitialPlayerTemplate();
  const right = buildInitialPlayerTemplate();
  assert.equal(left.templateFingerprint, right.templateFingerprint);
  assert.equal(left.knowledgeAssets.length, 7);
  assert.equal(left.initialPersonalState.feedbackLearningState.trajectories.length, 0);
  assert.deepEqual(left.initialPersonalState.predictionLedger, []);
});

test("fresh players begin with identical knowledge assets but isolated empty learning", () => {
  const alpha = fresh("alpha");
  const beta = fresh("beta");
  assert.equal(alpha.template.templateFingerprint, beta.template.templateFingerprint);
  assert.deepEqual(alpha.cognition, beta.cognition);
  assert.notEqual(alpha.playerId, beta.playerId);
  assert.equal(summarizePlayerProfile(alpha).learnedTrajectories, 0);
  assert.equal(summarizePlayerProfile(beta).learnedTrajectories, 0);
});

test("capturing one player's feedback never changes another fresh player", () => {
  const alpha = fresh("alpha-learning");
  const beta = fresh("beta-clean");
  const { session } = start(alpha);
  session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [{
      because: "错误假设：放骰立即产能",
      expectations: [{ itemId: "track:energy", change: "increase" }],
    }],
  });
  const learnedAlpha = capturePlayerProfile({ playerProfile: alpha, session, now: clock });
  assert.ok(summarizePlayerProfile(learnedAlpha).learnedTrajectories > 0);
  assert.equal(summarizePlayerProfile(alpha).learnedTrajectories, 0);
  assert.equal(summarizePlayerProfile(beta).learnedTrajectories, 0);
  assert.equal(learnedAlpha.progress.revision, 1);
  assert.equal(learnedAlpha.episodeHistory.length, 1);
});

test("continue restores only the same player and same profile revision", () => {
  const alpha = fresh("alpha-continue");
  const { session } = start(alpha);
  session.advance({ type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c2" });
  const checkpoint = session.exportCheckpoint();
  const restored = restoreSessionForPlayer({ playerProfile: alpha, checkpoint });
  assert.equal(restored.inspectPlayerIdentity().playerId, alpha.playerId);
  assert.deepEqual(restored.inspectHostState().observation, session.inspectHostState().observation);

  const beta = fresh("beta-continue");
  assert.throws(() => restoreSessionForPlayer({ playerProfile: beta, checkpoint }), /different player/);
  const captured = capturePlayerProfile({ playerProfile: alpha, session, now: clock });
  assert.throws(() => restoreSessionForPlayer({ playerProfile: captured, checkpoint }), /profile revision/);
});

test("fork inherits one snapshot but later learning remains independent", () => {
  const parent = fresh("parent");
  const { session: parentSession } = start(parent);
  parentSession.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [{
      because: "错误假设",
      expectations: [{ itemId: "track:energy", change: "increase" }],
    }],
  });
  const learnedParent = capturePlayerProfile({ playerProfile: parent, session: parentSession, now: clock });
  const child = forkPlayer({ parentProfile: learnedParent, playerId: "child", now: clock });
  assert.equal(child.lineage.parentPlayerId, learnedParent.playerId);
  assert.equal(child.lineage.parentRevision, learnedParent.progress.revision);
  assert.deepEqual(child.cognition, learnedParent.cognition);

  const { session: childSession } = start(child);
  childSession.advance({
    type: "place_die",
    dieId: "r1-gray-1",
    cellId: "A-r2-c3",
    predictions: [{
      because: "骰子被放置后会显示已占用",
      expectations: [{ itemId: "die:r1-gray-1", field: "placed", change: "equals", value: true }],
    }],
  });
  const learnedChild = capturePlayerProfile({ playerProfile: child, session: childSession, now: clock });
  assert.ok(summarizePlayerProfile(learnedChild).learnedTrajectories
    > summarizePlayerProfile(learnedParent).learnedTrajectories);
  assert.equal(learnedParent.progress.revision, 1);
  assert.equal(child.progress.revision, 0);
});

test("a player snapshot cannot discard a prediction still waiting at a random boundary", () => {
  const player = fresh("pending-player");
  const { session } = start(player);
  session.advance({
    type: "place_die",
    dieId: "r1-white-4",
    cellId: "A-r1-c1",
    predictions: [{
      because: "白骰会触发重投",
      expectations: [{ itemId: "die:r1-gray-0", field: "value", change: "changed" }],
    }],
  });
  assert.throws(
    () => capturePlayerProfile({ playerProfile: player, session, now: clock }),
    /prediction tickets are still pending/,
  );
});

test("player profiles refuse silent use with changed frozen cognitive assets", () => {
  const player = fresh("template-guard");
  const changedTemplate = buildInitialPlayerTemplate();
  changedTemplate.templateFingerprint = "0".repeat(64);
  assert.throws(
    () => validatePlayerProfile(player, { template: changedTemplate }),
    /fingerprint/,
  );
});

test("CLI creates, continues, captures, and forks isolated player profiles", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ufs-player-generator-cli-"));
  const playerCli = path.resolve(__dirname, "ufs-player-cli.js");
  const gameCli = path.resolve(__dirname, "full-game-attention-player-cli.js");
  const alphaFile = path.join(root, "alpha.json");
  const betaFile = path.join(root, "beta.json");
  const childFile = path.join(root, "child.json");
  const stateDir = path.join(root, "alpha-episode");
  const continuedStateDir = path.join(root, "alpha-episode-2");
  const choiceFile = path.join(root, "choice.json");
  try {
    const freshAlpha = spawnSync(process.execPath, [
      playerCli, "fresh", alphaFile, "cli-alpha", "2026082814",
    ], { encoding: "utf8" });
    assert.equal(freshAlpha.status, 0, freshAlpha.stderr);
    const started = spawnSync(process.execPath, [
      gameCli, "player-start", stateDir, alphaFile,
    ], { encoding: "utf8" });
    assert.equal(started.status, 0, started.stderr);
    assert.equal(JSON.parse(started.stdout).game.playerId, "cli-alpha");

    fs.writeFileSync(choiceFile, `${JSON.stringify({
      type: "place_die",
      dieId: "r1-gray-0",
      cellId: "A-r2-c2",
      predictions: [{
        because: "选中的骰子会显示为已放置",
        expectations: [{ itemId: "die:r1-gray-0", field: "placed", change: "equals", value: true }],
      }],
    })}\n`);
    const continued = spawnSync(process.execPath, [
      gameCli, "advance", stateDir, choiceFile,
    ], { encoding: "utf8" });
    assert.equal(continued.status, 0, continued.stderr);
    assert.equal(JSON.parse(continued.stdout).game.playerId, "cli-alpha");

    const captured = spawnSync(process.execPath, [
      gameCli, "player-capture", stateDir, alphaFile,
    ], { encoding: "utf8" });
    assert.equal(captured.status, 0, captured.stderr);
    const alphaSummary = JSON.parse(captured.stdout);
    assert.equal(alphaSummary.revision, 1);
    assert.ok(alphaSummary.learnedTrajectories > 0);

    const freshBeta = spawnSync(process.execPath, [
      playerCli, "fresh", betaFile, "cli-beta", "2026082814",
    ], { encoding: "utf8" });
    assert.equal(freshBeta.status, 0, freshBeta.stderr);
    assert.equal(JSON.parse(freshBeta.stdout).learnedTrajectories, 0);

    const forked = spawnSync(process.execPath, [
      playerCli, "fork", alphaFile, childFile, "cli-child",
    ], { encoding: "utf8" });
    assert.equal(forked.status, 0, forked.stderr);
    assert.equal(JSON.parse(forked.stdout).learnedTrajectories, alphaSummary.learnedTrajectories);

    const nextEpisode = spawnSync(process.execPath, [
      gameCli, "player-start", continuedStateDir, alphaFile,
    ], { encoding: "utf8" });
    assert.equal(nextEpisode.status, 0, nextEpisode.stderr);
    const nextView = JSON.parse(nextEpisode.stdout);
    assert.equal(nextView.game.playerId, "cli-alpha");
    assert.equal(nextView.game.playerProfileRevision, 1);

    const staleCapture = spawnSync(process.execPath, [
      gameCli, "player-capture", stateDir, alphaFile,
    ], { encoding: "utf8" });
    assert.notEqual(staleCapture.status, 0);
    assert.match(staleCapture.stderr, /captured and sealed/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
