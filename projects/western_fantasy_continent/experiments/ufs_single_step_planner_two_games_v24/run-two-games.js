"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { valueFor } = require("../ufs_learned_player_five_games_v22/materialize-random-observation");

const ROOT = __dirname;
const CLI = path.resolve(ROOT, "..", "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js");
const SOURCE = path.resolve(
  ROOT, "..", "ufs_learned_player_five_games_v22", "profiles", "game-05-compiled-revision-7.json",
);
const TAPE = JSON.parse(fs.readFileSync(path.join(ROOT, "random-tape.json"), "utf8"));
const MAX_RECORDS = 180;
const ATTEMPT = "attempt-02";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeNewJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

function records(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  return raw ? raw.split(/\r?\n/u).map(JSON.parse) : [];
}

function pathsFor(game) {
  const label = `game-${String(game).padStart(2, "0")}`;
  const attemptRoot = path.join(ROOT, ATTEMPT);
  const recordDir = path.join(attemptRoot, "records", label);
  return {
    label,
    stateDir: path.join(attemptRoot, "states", label),
    recordDir,
    ledger: path.join(recordDir, "machine-records.ndjson"),
    plans: path.join(recordDir, "plans"),
    payloads: path.join(recordDir, "payloads"),
    inputProfile: path.join(attemptRoot, "profiles", `${label}-input-revision-${game + 6}.json`),
    outputProfile: path.join(attemptRoot, "profiles", `${label}-output-revision-${game + 7}.json`),
    sourceProfile: game === 1
      ? SOURCE
      : path.join(attemptRoot, "profiles", "game-01-output-revision-8.json"),
  };
}

function runCli(args) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 15 * 60 * 1000,
  });
  if (result.status !== 0) {
    throw new Error(`CLI ${args[0]} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function append(paths, record) {
  fs.mkdirSync(paths.recordDir, { recursive: true });
  fs.appendFileSync(paths.ledger, `${JSON.stringify(record)}\n`, "utf8");
}

function payloadKey(payload) {
  return JSON.stringify(Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "predictions")));
}

function candidateKey(payload) {
  return Object.entries(payload).map(([key, value]) => `${key}=${value}`).join("|");
}

function baselineWinner(plan) {
  return [...plan.ranking].sort((left, right) => (
    right.baselineScore - left.baselineScore
    || candidateKey(left.payload).localeCompare(candidateKey(right.payload))
  ))[0];
}

function planSummary(plan) {
  const winner = plan.ranking[0];
  const baseline = baselineWinner(plan);
  return {
    attemptedCount: plan.attemptedCount,
    legalCandidateCount: plan.legalCandidateCount,
    selectedPayload: winner.payload,
    selectedBaselineScore: winner.baselineScore,
    selectedFinalScore: winner.finalScore,
    selectedFeedbackAdjustment: winner.feedbackAdjustment,
    recalledCandidateCount: plan.ranking.filter((row) => row.recalledFeedback.length > 0).length,
    adjustedCandidateCount: plan.ranking.filter((row) => row.feedbackAdjustment).length,
    baselinePayload: baseline.payload,
    choiceChangedByFeedback: payloadKey(winner.payload) !== payloadKey(baseline.payload),
  };
}

function randomOperation(view, history) {
  const pendingType = view.pending?.type;
  const occurrence = history.filter((row) => row.random?.pendingType === pendingType).length + 1;
  const dieIds = [...(view.pending?.dieIds || [])].sort();
  const type = pendingType === "white_reroll" ? "submit_random_observation" : "submit_round_roll";
  return {
    operation: {
      type,
      values: Object.fromEntries(dieIds.map((dieId, index) => [
        dieId, valueFor(TAPE.seed, pendingType, occurrence, index + 1),
      ])),
    },
    meta: { pendingType, occurrence, dieIds },
  };
}

function ensureStart(game, paths) {
  fs.mkdirSync(paths.stateDir, { recursive: true });
  fs.mkdirSync(path.dirname(paths.inputProfile), { recursive: true });
  if (!fs.existsSync(paths.inputProfile)) {
    fs.copyFileSync(paths.sourceProfile, paths.inputProfile, fs.constants.COPYFILE_EXCL);
  }
  const input = readJson(paths.inputProfile);
  if (input.progress.revision !== game + 6) throw new Error(`${paths.label} input revision mismatch`);
  if (fs.existsSync(path.join(paths.stateDir, "full-game-host-checkpoint.json"))) return;
  const response = runCli(["player-start", paths.stateDir, paths.inputProfile]);
  append(paths, {
    schema: "ufs_v24_step_v1",
    sequence: 1,
    kind: "player_start",
    response,
  });
}

function play(game) {
  const paths = pathsFor(game);
  ensureStart(game, paths);
  while (true) {
    const history = records(paths.ledger);
    if (history.length >= MAX_RECORDS) throw new Error(`${paths.label} exceeded ${MAX_RECORDS} records`);
    const view = readJson(path.join(paths.stateDir, "current-player-view.json"));
    if (view.status === "complete") break;
    const sequence = history.length + 1;
    const sequenceLabel = String(sequence).padStart(4, "0");
    let operation;
    let plan = null;
    let random = null;
    if (view.status === "choice" || view.status === "rejected") {
      const planFile = path.join(paths.plans, `${sequenceLabel}.json`);
      plan = fs.existsSync(planFile) ? readJson(planFile) : runCli(["plan", paths.stateDir]);
      if (!fs.existsSync(planFile)) writeNewJson(planFile, plan);
      operation = plan.recommendedPayload;
    } else if (view.status === "random") {
      const materialized = randomOperation(view, history);
      operation = materialized.operation;
      random = materialized.meta;
    } else {
      throw new Error(`${paths.label} unsupported status ${view.status}`);
    }
    const payloadFile = path.join(paths.payloads, `${sequenceLabel}.json`);
    if (!fs.existsSync(payloadFile)) writeNewJson(payloadFile, operation);
    const response = view.status === "random"
      ? runCli(["random", paths.stateDir, payloadFile])
      : runCli(["advance", paths.stateDir, payloadFile]);
    const record = {
      schema: "ufs_v24_step_v1",
      sequence,
      kind: view.status === "random" ? "random" : "planned_choice",
      operation,
      ...(plan ? { plan: planSummary(plan) } : {}),
      ...(random ? { random } : {}),
      response,
    };
    append(paths, record);
    process.stdout.write(`${JSON.stringify({
      game,
      sequence,
      round: response.game?.round,
      status: response.status,
      operation: operation.type,
      ...(record.plan ? {
        adjusted: record.plan.adjustedCandidateCount,
        choiceChangedByFeedback: record.plan.choiceChangedByFeedback,
      } : {}),
    })}\n`);
  }
  if (!fs.existsSync(path.join(paths.stateDir, "player-capture-receipt.json"))) {
    if (fs.existsSync(paths.outputProfile)) {
      throw new Error(`${paths.label} output profile exists without capture receipt`);
    }
    runCli(["player-capture", paths.stateDir, paths.outputProfile]);
  }
  return summarizeGame(game, paths);
}

function summarizeGame(game, paths) {
  const history = records(paths.ledger);
  const choices = history.filter((row) => row.kind === "planned_choice");
  const publicRows = history.map((row) => row.response).filter(Boolean);
  const energies = publicRows.map((row) => row.observation?.energy).filter(Number.isFinite);
  const final = publicRows.at(-1);
  const input = readJson(paths.inputProfile);
  const output = readJson(paths.outputProfile);
  return {
    game,
    inputRevision: input.progress.revision,
    outputRevision: output.progress.revision,
    records: history.length,
    plannedChoices: choices.length,
    recalledChoiceCount: choices.filter((row) => row.plan.recalledCandidateCount > 0).length,
    adjustedChoiceCount: choices.filter((row) => row.plan.adjustedCandidateCount > 0).length,
    selectedAdjustmentCount: choices.filter((row) => row.plan.selectedFeedbackAdjustment).length,
    choiceChangedByFeedbackCount: choices.filter((row) => row.plan.choiceChangedByFeedback).length,
    minimumEnergy: energies.length ? Math.min(...energies) : null,
    zeroEnergyObservationCount: energies.filter((value) => value === 0).length,
    outcome: final?.game?.outcome || final?.observation?.outcome || null,
    terminalRound: final?.game?.round || null,
    terminalTracks: {
      energy: final?.observation?.energy,
      damage: final?.observation?.damage,
      researchIndex: final?.observation?.researchIndex,
      excavatorIndex: final?.observation?.excavatorIndex,
      mothershipRow: final?.observation?.mothershipRow,
    },
    learnedTrajectoriesBefore: input.cognition.feedbackLearningState.trajectories.length,
    learnedTrajectoriesAfter: output.cognition.feedbackLearningState.trajectories.length,
    compiledFeedbackBefore: input.cognition.feedbackGteOverlay?.recordIds.length || 0,
    compiledFeedbackAfter: output.cognition.feedbackGteOverlay?.recordIds.length || 0,
    predictionLedgerBefore: input.cognition.predictionLedger.length,
    predictionLedgerAfter: output.cognition.predictionLedger.length,
  };
}

function compare(left, right) {
  const leftActions = records(pathsFor(left).ledger).filter((row) => row.kind === "planned_choice")
    .map((row) => payloadKey(row.operation));
  const rightActions = records(pathsFor(right).ledger).filter((row) => row.kind === "planned_choice")
    .map((row) => payloadKey(row.operation));
  const shared = Math.min(leftActions.length, rightActions.length);
  const divergences = [];
  for (let index = 0; index < shared; index += 1) {
    if (leftActions[index] !== rightActions[index]) divergences.push(index + 1);
  }
  return {
    sharedPlannedChoiceCount: shared,
    behaviorDivergenceCount: divergences.length + Math.abs(leftActions.length - rightActions.length),
    firstBehaviorDivergenceOrdinal: divergences[0] || (leftActions.length === rightActions.length ? null : shared + 1),
  };
}

function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`missing learned revision-7 source: ${SOURCE}`);
  const game1 = play(1);
  const game2 = play(2);
  const result = {
    schema: "ufs_v24_two_game_single_step_planner_result_v1",
    attempt: ATTEMPT,
    attentionSeed: 2026082920,
    randomTape: TAPE,
    games: [game1, game2],
    comparison: compare(1, 2),
  };
  const resultFile = path.join(ROOT, ATTEMPT, "RESULTS.json");
  if (!fs.existsSync(resultFile)) writeNewJson(resultFile, result);
  else if (JSON.stringify(readJson(resultFile)) !== JSON.stringify(result)) {
    throw new Error("existing RESULTS.json disagrees with recomputed result");
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = { baselineWinner, compare, main, pathsFor, planSummary, summarizeGame };
