"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  choose,
  collectMemory,
} = require("../ufs_learned_player_five_games_v22/autoplay-game");
const { valueFor } = require("../ufs_learned_player_five_games_v22/materialize-random-observation");

const ROOT = __dirname;
const RUN_ROOT = path.join(ROOT, "attempt-02", "fixed-baseline");
const STATE = path.join(RUN_ROOT, "state");
const LEDGER = path.join(RUN_ROOT, "machine-records.ndjson");
const PAYLOADS = path.join(RUN_ROOT, "payloads");
const RESULT = path.join(RUN_ROOT, "RESULTS.json");
const CLI = path.resolve(ROOT, "..", "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js");
const TAPE = JSON.parse(fs.readFileSync(path.join(ROOT, "random-tape.json"), "utf8"));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function rows() {
  if (!fs.existsSync(LEDGER)) return [];
  const raw = fs.readFileSync(LEDGER, "utf8").trim();
  return raw ? raw.split(/\r?\n/u).map(JSON.parse) : [];
}

function append(record) {
  fs.mkdirSync(RUN_ROOT, { recursive: true });
  fs.appendFileSync(LEDGER, `${JSON.stringify(record)}\n`, "utf8");
}

function runCli(args) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, UFS_ATTENTION_SEED: "2026082920" },
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function writePayload(sequence, operation) {
  fs.mkdirSync(PAYLOADS, { recursive: true });
  const file = path.join(PAYLOADS, `${String(sequence).padStart(4, "0")}.json`);
  fs.writeFileSync(file, `${JSON.stringify(operation, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return file;
}

function randomOperation(view, history) {
  const pendingType = view.pending.type;
  const occurrence = history.filter((row) => row.random?.pendingType === pendingType).length + 1;
  const dieIds = [...view.pending.dieIds].sort();
  return {
    operation: {
      type: pendingType === "white_reroll" ? "submit_random_observation" : "submit_round_roll",
      values: Object.fromEntries(dieIds.map((dieId, index) => [
        dieId, valueFor(TAPE.seed, pendingType, occurrence, index + 1),
      ])),
    },
    meta: { pendingType, occurrence, dieIds },
  };
}

function main() {
  fs.mkdirSync(STATE, { recursive: true });
  if (!fs.existsSync(path.join(STATE, "full-game-host-checkpoint.json"))) {
    const response = runCli(["start", STATE]);
    append({ command: "start", public: response, payloadFile: null });
  }
  while (true) {
    const history = rows();
    const view = readJson(path.join(STATE, "current-player-view.json"));
    if (view.status === "complete") break;
    if (history.length >= 180) throw new Error("fixed baseline exceeded 180 records");
    const sequence = history.length + 1;
    let operation;
    let random = null;
    if (view.status === "choice" || view.status === "rejected") {
      const paths = { root: ROOT };
      operation = choose(view, collectMemory(paths, history, view)).payload;
    } else if (view.status === "random") {
      const materialized = randomOperation(view, history);
      operation = materialized.operation;
      random = materialized.meta;
    } else throw new Error(`unsupported fixed baseline status ${view.status}`);
    const payloadFile = writePayload(sequence, operation);
    const response = view.status === "random"
      ? runCli(["random", STATE, payloadFile])
      : runCli(["advance", STATE, payloadFile]);
    append({
      command: view.status === "random" ? "random" : "advance",
      public: response,
      payloadFile: path.relative(ROOT, payloadFile).replaceAll("\\", "/"),
      random,
      operation,
    });
    process.stdout.write(`${JSON.stringify({
      sequence, round: response.game?.round, status: response.status, operation: operation.type,
    })}\n`);
  }
  const history = rows();
  const final = history.at(-1).public;
  const operations = history.slice(1).map((row) => row.operation).filter(Boolean);
  const counts = {};
  for (const operation of operations) counts[operation.type] = (counts[operation.type] || 0) + 1;
  const energies = history.map((row) => row.public?.observation?.energy).filter(Number.isFinite);
  const result = {
    schema: "ufs_v24_fixed_controller_baseline_result_v1",
    attentionSeed: 2026082920,
    randomTape: TAPE,
    records: history.length,
    operationCounts: counts,
    rejected: history.filter((row) => row.public?.status === "rejected").length,
    minimumEnergy: Math.min(...energies),
    zeroEnergyObservationCount: energies.filter((value) => value === 0).length,
    outcome: final.game?.outcome || final.observation?.outcome,
    terminalRound: final.game?.round,
    terminalTracks: {
      energy: final.observation?.energy,
      damage: final.observation?.damage,
      researchIndex: final.observation?.researchIndex,
      excavatorIndex: final.observation?.excavatorIndex,
      mothershipRow: final.observation?.mothershipRow,
    },
  };
  if (!fs.existsSync(RESULT)) {
    fs.writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = { main };
