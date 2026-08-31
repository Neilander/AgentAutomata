"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const ATTEMPT = path.join(ROOT, "attempt-02");
const SOURCE = path.resolve(
  ROOT, "..", "ufs_learned_player_five_games_v22", "profiles", "game-05-compiled-revision-7.json",
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readRows(file) {
  return fs.readFileSync(file, "utf8").trim().split(/\r?\n/u).map(JSON.parse);
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function operationCounts(rows) {
  const counts = {};
  for (const row of rows) {
    if (!row.operation?.type) continue;
    counts[row.operation.type] = (counts[row.operation.type] || 0) + 1;
  }
  return counts;
}

function planMetrics(game) {
  const label = `game-${String(game).padStart(2, "0")}`;
  const planRoot = path.join(ATTEMPT, "records", label, "plans");
  const plans = fs.readdirSync(planRoot).sort().map((file) => readJson(path.join(planRoot, file)));
  let feedbackApplications = 0;
  let numericallyChangedCandidates = 0;
  let positiveCandidateChanges = 0;
  let negativeCandidateChanges = 0;
  let maxAbsoluteCandidateDelta = 0;
  let winnerScoreChangedCount = 0;
  const trajectoryIds = new Set();
  for (const plan of plans) {
    const winner = plan.ranking[0];
    if (winner.finalScore !== winner.baselineScore) winnerScoreChangedCount += 1;
    for (const candidate of plan.ranking) {
      if (!candidate.feedbackAdjustment) continue;
      feedbackApplications += 1;
      trajectoryIds.add(candidate.feedbackAdjustment.trajectoryId);
      const delta = candidate.finalScore - candidate.baselineScore;
      if (delta === 0) continue;
      numericallyChangedCandidates += 1;
      if (delta > 0) positiveCandidateChanges += 1;
      else negativeCandidateChanges += 1;
      maxAbsoluteCandidateDelta = Math.max(maxAbsoluteCandidateDelta, Math.abs(delta));
    }
  }
  return {
    planCount: plans.length,
    feedbackApplications,
    numericallyChangedCandidates,
    positiveCandidateChanges,
    negativeCandidateChanges,
    maxAbsoluteCandidateDelta: Number(maxAbsoluteCandidateDelta.toFixed(6)),
    uniqueFeedbackTrajectories: trajectoryIds.size,
    winnerScoreChangedCount,
  };
}

function profileAudit(game) {
  const label = `game-${String(game).padStart(2, "0")}`;
  const inputRevision = game + 6;
  const outputRevision = game + 7;
  const profileRoot = path.join(ATTEMPT, "profiles");
  const inputFile = path.join(profileRoot, `${label}-input-revision-${inputRevision}.json`);
  const outputFile = path.join(profileRoot, `${label}-output-revision-${outputRevision}.json`);
  const input = readJson(inputFile);
  const output = readJson(outputFile);
  const newLedger = output.cognition.predictionLedger.slice(input.cognition.predictionLedger.length);
  const badObservedScalarTracks = newLedger.flatMap((entry) => (
    entry.ticket?.evaluation?.evaluations || []
  )).filter((evaluation) => (
    evaluation.observed
    && evaluation.expectation?.itemId?.startsWith("track:")
    && evaluation.afterValue === undefined
  )).length;
  return {
    inputRevision: input.progress.revision,
    outputRevision: output.progress.revision,
    inputSha256: sha256(inputFile),
    outputSha256: sha256(outputFile),
    trajectoriesBefore: input.cognition.feedbackLearningState.trajectories.length,
    trajectoriesAfter: output.cognition.feedbackLearningState.trajectories.length,
    compiledBefore: input.cognition.feedbackGteOverlay?.recordIds.length || 0,
    compiledAfter: output.cognition.feedbackGteOverlay?.recordIds.length || 0,
    pendingAfter: output.cognition.feedbackLearningState.trajectories
      .filter((row) => row.compileStatus !== "compiled_matrix").length,
    ledgerBefore: input.cognition.predictionLedger.length,
    ledgerAfter: output.cognition.predictionLedger.length,
    badObservedScalarTracks,
    captureReceipt: fs.existsSync(path.join(ATTEMPT, "states", label, "player-capture-receipt.json")),
  };
}

function main() {
  const result = readJson(path.join(ATTEMPT, "RESULTS.json"));
  const fixed = readJson(path.join(ATTEMPT, "fixed-baseline", "RESULTS.json"));
  const gameRows = [1, 2].map((game) => readRows(path.join(
    ATTEMPT, "records", `game-${String(game).padStart(2, "0")}`, "machine-records.ndjson",
  )));
  const profiles = [profileAudit(1), profileAudit(2)];
  const plans = [planMetrics(1), planMetrics(2)];
  const sourceSha = sha256(SOURCE);
  assert.equal(profiles[0].inputSha256, sourceSha);
  assert.equal(profiles[1].inputSha256, profiles[0].outputSha256);
  assert.deepEqual(profiles.map((row) => [row.inputRevision, row.outputRevision]), [[7, 8], [8, 9]]);
  assert.ok(profiles.every((row) => row.pendingAfter === 0 && row.captureReceipt));
  assert.ok(profiles.every((row) => row.badObservedScalarTracks === 0));
  assert.ok(gameRows.every((rows) => rows.every((row) => row.response?.status !== "rejected")));
  assert.equal(result.comparison.behaviorDivergenceCount, 0);
  assert.equal(result.games[0].outcome.result, "loss");
  assert.equal(result.games[1].outcome.result, "loss");
  assert.deepEqual(result.games[0].terminalTracks, result.games[1].terminalTracks);
  assert.equal(plans[0].winnerScoreChangedCount, 0);
  assert.equal(plans[1].winnerScoreChangedCount, 0);
  assert.ok(plans[1].numericallyChangedCandidates > 0);

  const audit = {
    schema: "ufs_v24_two_game_single_step_planner_audit_v1",
    passed: true,
    sourceProfile: { revision: 7, sha256: sourceSha, preserved: true },
    pairing: {
      attentionSeed: result.attentionSeed,
      randomTape: result.randomTape,
      behaviorDivergenceCount: result.comparison.behaviorDivergenceCount,
    },
    games: result.games.map((game, index) => ({
      ...game,
      operationCounts: operationCounts(gameRows[index]),
      profile: profiles[index],
      planner: plans[index],
      rejected: 0,
    })),
    learningConclusion: {
      feedbackEnteredCandidateRanking: plans[1].feedbackApplications > 0,
      numericallyChangedCandidates: plans[1].numericallyChangedCandidates,
      winnerScoreChangedCount: plans[1].winnerScoreChangedCount,
      behaviorChangedFromGame1: false,
      game2ImprovedOverGame1: false,
    },
    fixedControllerBaseline: fixed,
    plannerVersusFixed: {
      bothLost: true,
      terminalRoundDelta: result.games[0].terminalRound - fixed.terminalRound,
      researchIndexDelta: result.games[0].terminalTracks.researchIndex - fixed.terminalTracks.researchIndex,
      damageDelta: result.games[0].terminalTracks.damage - fixed.terminalTracks.damage,
      mothershipRowDelta: result.games[0].terminalTracks.mothershipRow - fixed.terminalTracks.mothershipRow,
      conclusion: "mixed_tradeoff_not_a_gameplay_improvement",
    },
  };
  const output = path.join(ATTEMPT, "AUDIT.json");
  if (fs.existsSync(output)) assert.deepEqual(readJson(output), audit);
  else fs.writeFileSync(output, `${JSON.stringify(audit, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = { main, planMetrics, profileAudit };
