"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const {
  PlayerFeedbackGteMemory,
  compileFeedbackGteForLearner,
} = require("./player-feedback-gte");
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
    feedbackGteCompiler: testFeedbackGteCompiler,
    sessionOptions: {
      choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
    },
  });
}

function restoreForTest(options) {
  return restoreSessionForPlayer({
    ...options,
    feedbackGteCompiler: testFeedbackGteCompiler,
  });
}

function testVector(q) {
  const vector = new Float32Array(3840);
  const text = JSON.stringify(q);
  for (let index = 0; index < text.length; index += 1) {
    const digest = crypto.createHash("sha256").update(`${index}:${text[index]}`).digest();
    const column = digest.readUInt16LE(0) % vector.length;
    vector[column] += (digest[2] & 1) === 0 ? 1 : -1;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  for (let index = 0; index < vector.length; index += 1) vector[index] /= norm;
  return vector;
}

function testMatrix(records, field) {
  const matrix = Buffer.alloc(records.length * 3840 * 4);
  records.forEach((row, rowIndex) => {
    const vector = testVector(row[field]);
    vector.forEach((value, column) => matrix.writeFloatLE(value, (rowIndex * 3840 + column) * 4));
  });
  return matrix;
}

function testFeedbackGteCompiler(records) {
  const current = testMatrix(records, "currentQ");
  const following = testMatrix(records, "followingQ");
  return {
    schema: "ufs_player_feedback_gte_compile_batch_v1",
    encoder: "deterministic-test-only-player-feedback-encoder",
    dtype: "float32-le",
    slotWeights: {
      affected_object: 0.20,
      change_trend: 0.27,
      cause_relation: 0.23,
      temporal_state: 0.13,
      context: 0.17,
    },
    coordinateWidth: 3840,
    recordIds: records.map((row) => row.trajectoryId),
    currentMatrixBase64: current.toString("base64"),
    followingMatrixBase64: following.toString("base64"),
    currentSha256: crypto.createHash("sha256").update(current).digest("hex"),
    followingSha256: crypto.createHash("sha256").update(following).digest("hex"),
  };
}

function captureForTest(options) {
  return capturePlayerProfile({ ...options, feedbackGteCompiler: testFeedbackGteCompiler });
}

test("the frozen initial player template has a stable cognitive asset fingerprint", () => {
  const left = buildInitialPlayerTemplate();
  const right = buildInitialPlayerTemplate();
  assert.equal(left.templateFingerprint, right.templateFingerprint);
  assert.equal(left.knowledgeAssets.length, 7);
  assert.equal(left.initialPersonalState.feedbackLearningState.trajectories.length, 0);
  assert.deepEqual(left.initialPersonalState.predictionLedger, []);
});

test("the V20 revision 1 profile survives worktree JSON line-ending differences", () => {
  const legacyProfile = JSON.parse(fs.readFileSync(path.resolve(
    __dirname,
    "../ufs_attention_full_game_playtest_v20/player-v20-fresh.json",
  ), "utf8"));
  const normalized = validatePlayerProfile(legacyProfile);
  assert.equal(normalized.progress.revision, 1);
  assert.equal(normalized.template.templateFingerprint, buildInitialPlayerTemplate().templateFingerprint);
  const { response } = start(normalized);
  assert.equal(response.game.playerId, "ufs-v20-fresh-player");
  assert.equal(response.game.playerProfileRevision, 1);
});

test("fresh players begin with identical knowledge assets but isolated empty learning", () => {
  const alpha = fresh("alpha");
  const beta = fresh("beta");
  assert.equal(alpha.template.templateFingerprint, beta.template.templateFingerprint);
  assert.deepEqual(alpha.cognition, beta.cognition);
  assert.notEqual(alpha.playerId, beta.playerId);
  assert.equal(summarizePlayerProfile(alpha).learnedTrajectories, 0);
  assert.equal(summarizePlayerProfile(beta).learnedTrajectories, 0);
  assert.equal(summarizePlayerProfile(alpha).explicitMemories, 0);
  assert.equal(summarizePlayerProfile(beta).explicitMemories, 0);
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
  const liveFeedback = session.inspectFeedbackState();
  assert.equal(liveFeedback.feedbackGte.pendingRecords, 0);
  assert.equal(liveFeedback.feedbackGte.lastCompile.status, "compiled");
  assert.equal(liveFeedback.feedbackGte.matrixRecords, liveFeedback.learning.trajectories.length);
  const explicitMemory = liveFeedback.learning.memories[0];
  assert.equal(explicitMemory.experienceContext.episodeId, "alpha-learning-episode-0001");
  assert.match(explicitMemory.experienceContext.ticketId, /^prediction-ticket-/u);
  const forward = session.predictLearnedTransition(
    explicitMemory.currentQ,
    explicitMemory.operations,
    { context: explicitMemory.applicability },
  );
  assert.equal(forward.mode, "gte_joint_current_operation");
  assert.equal(forward.matches[0].supportingMemoryIds.includes(explicitMemory.memoryId), true);
  const traced = session.traceLearnedTransition(
    explicitMemory.currentQ,
    explicitMemory.followingQ,
    { operations: explicitMemory.operations, context: explicitMemory.applicability },
  );
  assert.equal(traced.mode, "gte_paired_transition");
  assert.equal(traced.matches[0].supportingMemoryIds.includes(explicitMemory.memoryId), true);
  assert.deepEqual(session.recallExplicitMemory(explicitMemory.memoryId), explicitMemory);
  const restoredWithMemory = restoreForTest({
    playerProfile: alpha,
    checkpoint: session.exportCheckpoint(),
  });
  assert.deepEqual(restoredWithMemory.recallExplicitMemory(explicitMemory.memoryId), explicitMemory);
  assert.equal(restoredWithMemory.traceLearnedTransition(
    explicitMemory.currentQ,
    explicitMemory.followingQ,
    { operations: explicitMemory.operations },
  ).matches[0].supportingMemoryIds.includes(explicitMemory.memoryId), true);
  const learnedAlpha = captureForTest({ playerProfile: alpha, session, now: clock });
  assert.ok(summarizePlayerProfile(learnedAlpha).learnedTrajectories > 0);
  assert.ok(summarizePlayerProfile(learnedAlpha).explicitMemories > 0);
  assert.equal(summarizePlayerProfile(alpha).learnedTrajectories, 0);
  assert.equal(summarizePlayerProfile(beta).learnedTrajectories, 0);
  assert.equal(summarizePlayerProfile(alpha).explicitMemories, 0);
  assert.equal(summarizePlayerProfile(beta).explicitMemories, 0);
  assert.equal(learnedAlpha.progress.revision, 1);
  assert.equal(learnedAlpha.episodeHistory.length, 1);
});

test("continue restores only the same player and same profile revision", () => {
  const alpha = fresh("alpha-continue");
  const { session } = start(alpha);
  session.advance({ type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c2" });
  const checkpoint = session.exportCheckpoint();
  const restored = restoreForTest({ playerProfile: alpha, checkpoint });
  assert.equal(restored.inspectPlayerIdentity().playerId, alpha.playerId);
  assert.deepEqual(restored.inspectHostState().observation, session.inspectHostState().observation);

  const beta = fresh("beta-continue");
  assert.throws(() => restoreForTest({ playerProfile: beta, checkpoint }), /different player/);
  const captured = captureForTest({ playerProfile: alpha, session, now: clock });
  assert.throws(() => restoreForTest({ playerProfile: captured, checkpoint }), /profile revision/);
});

test("continued players activate compiled feedback GTE while fresh initialization stays empty", () => {
  const alpha = fresh("alpha-feedback-recall");
  const first = start(alpha).session;
  const repeatedAction = {
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [{
      because: "错误假设：放骰立即产能",
      expectations: [{ itemId: "track:energy", change: "increase" }],
    }],
  };
  first.advance(repeatedAction);
  const learnedAlpha = captureForTest({ playerProfile: alpha, session: first, now: clock });
  assert.ok(summarizePlayerProfile(learnedAlpha).learnedTrajectories > 0);
  assert.equal(
    summarizePlayerProfile(learnedAlpha).compiledFeedbackTrajectories,
    summarizePlayerProfile(learnedAlpha).learnedTrajectories,
  );

  const continued = start(learnedAlpha).session;
  const restored = restoreForTest({
    playerProfile: learnedAlpha,
    checkpoint: continued.exportCheckpoint(),
  });
  restored.advance(repeatedAction);
  const recalled = restored.inspectFeedbackState().lastAudit.tickets.find((ticket) => (
    ticket.source === "gte_feedback_trajectory"
  ));
  assert.ok(recalled);
  assert.match(recalled.trajectoryId, /^feedback-/u);
  assert.equal(recalled.recalledFrom.compileStatus, "compiled_matrix");
  assert.equal(recalled.recalledFrom.matrixKind, "player_feedback_real_gte_matrix");
  assert.deepEqual(recalled.expectations, [{
    itemId: "track:energy",
    change: "equals",
    value: 2,
  }]);
  assert.equal(recalled.evaluation.status, "confirmed");

  const beta = fresh("beta-feedback-empty");
  const freshSession = start(beta).session;
  freshSession.advance(repeatedAction);
  assert.equal(freshSession.inspectFeedbackState().lastAudit.tickets.some((ticket) => (
    ticket.source === "gte_feedback_trajectory"
  )), false);
  assert.equal(summarizePlayerProfile(beta).learnedTrajectories, 0);
  assert.equal(summarizePlayerProfile(beta).explicitMemories, 0);
  assert.equal(buildInitialPlayerTemplate().initialPersonalState.feedbackLearningState.trajectories.length, 0);
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
  const learnedParent = captureForTest({ playerProfile: parent, session: parentSession, now: clock });
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
  const learnedChild = captureForTest({ playerProfile: child, session: childSession, now: clock });
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
    () => captureForTest({ playerProfile: player, session, now: clock }),
    /prediction tickets are still pending/,
  );
});

test("a failed feedback GTE compile leaves an explicit pending gate before the next action", () => {
  const player = fresh("compile-gate-player");
  const failingCompiler = () => {
    throw new Error("test encoder unavailable");
  };
  const { session } = createSessionForPlayer({
    playerProfile: player,
    publicMap,
    initialPublicState,
    now: clock,
    feedbackGteCompiler: failingCompiler,
    sessionOptions: {
      choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
    },
  });
  const accepted = session.advance({
    type: "place_die",
    dieId: "r1-gray-0",
    cellId: "A-r2-c2",
    predictions: [{
      because: "错误假设：放骰立即产能",
      expectations: [{ itemId: "track:energy", change: "increase" }],
    }],
  });
  assert.notEqual(accepted.status, "rejected");
  const failed = session.inspectFeedbackState().feedbackGte;
  assert.equal(failed.pendingRecords, 1);
  assert.equal(failed.lastCompile.status, "failed");

  const blocked = session.advance({
    type: "place_die",
    dieId: "r1-gray-1",
    cellId: "A-r2-c3",
  });
  assert.equal(blocked.status, "rejected");
  assert.match(blocked.reason, /feedback_gte_compile_pending:test encoder unavailable/u);
  assert.equal(session.actionHistory.length, 1);
});

test("compiled GTE Top-K uses learned trajectory chaining to break semantic ties", () => {
  const learner = new UfsFeedbackLearner({ now: clock });
  const currentQ = {
    affected_object: "同一个公开对象",
    change_trend: "等待后续变化",
    cause_relation: "同一个已提交动作",
    temporal_state: "正式反馈之前",
    context: "连续轨迹排序测试",
  };
  const learn = (suffix) => learner.learnObservedTransition({
    evidence: {
      evidenceId: `chain-evidence-${suffix}`,
      playerVisible: true,
      transition: "committed",
      systemIntegrity: "passed",
    },
    currentQ,
    actualFollowingQ: {
      affected_object: `结果${suffix}`,
      change_trend: `形成后续${suffix}`,
      cause_relation: "正式反馈",
      temporal_state: "结算后",
      context: "连续轨迹排序测试",
    },
    source: { kind: "single_experience", ref: `chain-evidence-${suffix}` },
    applicability: { operationType: "chain_test" },
  }).trajectory;
  const first = learn("A");
  const second = learn("B");
  const overlay = compileFeedbackGteForLearner({
    learner,
    compiler: testFeedbackGteCompiler,
  });
  const memory = new PlayerFeedbackGteMemory({
    overlay,
    trajectories: learner.exportState().trajectories,
    chains: [{
      fromTrajectoryId: "previous-feedback",
      toTrajectoryId: second.trajectoryId,
      chainingStrength: 1,
    }],
  });
  const recalled = memory.query(currentQ, {
    context: { operationType: "chain_test" },
    previousTrajectoryId: "previous-feedback",
    topK: 2,
  });
  assert.equal(recalled[0].trajectory.trajectoryId, second.trajectoryId);
  assert.equal(recalled[0].chain.chainingStrength, 1);
  assert.equal(recalled[1].trajectory.trajectoryId, first.trajectoryId);
});

test("compiled GTE predicts forward and traces a Q pair to all supporting memories", () => {
  const learner = new UfsFeedbackLearner({ now: clock });
  const currentQ = {
    affected_object: "锁住的门与手中的钥匙",
    change_trend: "开门行为尚未开始",
    cause_relation: "玩家准备尝试钥匙",
    temporal_state: "门仍关闭",
    context: "双向GTE来源查询测试",
  };
  const followingQ = {
    affected_object: "门",
    change_trend: "从关闭变为打开",
    cause_relation: "插入钥匙后再旋转",
    temporal_state: "完整行为结束后",
    context: "双向GTE来源查询测试",
  };
  const operations = [{ type: "insert_key" }, { type: "turn_key" }];
  for (const evidenceId of ["door-memory-1", "door-memory-2"]) {
    learner.learnObservedTransition({
      evidence: {
        evidenceId,
        playerVisible: true,
        transition: "committed",
        systemIntegrity: "passed",
      },
      currentQ,
      actualFollowingQ: followingQ,
      operations,
      source: { kind: "single_experience", ref: evidenceId },
      applicability: { scene: "door" },
    });
  }
  const state = learner.exportState();
  const overlay = compileFeedbackGteForLearner({ learner, compiler: testFeedbackGteCompiler });
  const memory = new PlayerFeedbackGteMemory({
    overlay,
    trajectories: learner.exportState().trajectories,
    memories: state.memories,
  });
  const forward = memory.query(currentQ, {
    operations,
    context: { scene: "door" },
  });
  assert.equal(forward.length, 1);
  assert.deepEqual(forward[0].trajectory.followingQ, followingQ);
  assert.equal(forward[0].supportingMemoryIds.length, 2);
  assert.equal(forward[0].supportingMemories.length, 2);

  const traced = memory.queryPair(currentQ, followingQ, {
    operations,
    context: { scene: "door" },
  });
  assert.equal(traced.length, 1);
  assert.deepEqual(traced[0].supportingMemoryIds, forward[0].supportingMemoryIds);
  assert.deepEqual(
    traced[0].supportingMemories.map((row) => row.evidence.evidenceId),
    ["door-memory-1", "door-memory-2"],
  );
});

test("compiled GTE does not confuse reversed operation sequences", () => {
  const learner = new UfsFeedbackLearner({ now: clock });
  const currentQ = {
    affected_object: "门锁",
    change_trend: "两个动作等待执行",
    cause_relation: "顺序可能影响结果",
    temporal_state: "操作前",
    context: "操作顺序隔离测试",
  };
  const followingQ = {
    affected_object: "门锁",
    change_trend: "门打开",
    cause_relation: "正确顺序完成",
    temporal_state: "操作后",
    context: "操作顺序隔离测试",
  };
  const correct = [{ type: "insert_key" }, { type: "turn_key" }];
  const reversed = [{ type: "turn_key" }, { type: "insert_key" }];
  learner.learnObservedTransition({
    evidence: {
      evidenceId: "ordered-door",
      playerVisible: true,
      transition: "committed",
      systemIntegrity: "passed",
    },
    currentQ,
    actualFollowingQ: followingQ,
    operations: correct,
    source: { kind: "single_experience", ref: "ordered-door" },
  });
  const state = learner.exportState();
  const overlay = compileFeedbackGteForLearner({ learner, compiler: testFeedbackGteCompiler });
  const memory = new PlayerFeedbackGteMemory({
    overlay,
    trajectories: learner.exportState().trajectories,
    memories: state.memories,
  });
  assert.equal(memory.query(currentQ, { operations: correct }).length, 1);
  assert.equal(memory.query(currentQ, { operations: reversed }).length, 0);
  assert.equal(memory.queryPair(currentQ, followingQ, { operations: reversed }).length, 0);
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
    const liveCheckpoint = JSON.parse(fs.readFileSync(
      path.join(stateDir, "full-game-host-checkpoint.json"), "utf8",
    ));
    assert.equal(liveCheckpoint.lastFeedbackGteCompile.status, "compiled");
    assert.ok(liveCheckpoint.feedbackGteOverlay.recordIds.length > 0);
    assert.equal(liveCheckpoint.feedbackLearningState.trajectories.some((row) => (
      row.compileStatus === "pending_matrix_compile"
    )), false);

    const captured = spawnSync(process.execPath, [
      gameCli, "player-capture", stateDir, alphaFile,
    ], { encoding: "utf8" });
    assert.equal(captured.status, 0, captured.stderr);
    const alphaSummary = JSON.parse(captured.stdout);
    assert.equal(alphaSummary.revision, 1);
    assert.ok(alphaSummary.learnedTrajectories > 0);
    assert.equal(alphaSummary.compiledFeedbackTrajectories, alphaSummary.learnedTrajectories);
    assert.match(alphaSummary.feedbackGteFingerprint, /^[a-f0-9]{64}$/u);

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
