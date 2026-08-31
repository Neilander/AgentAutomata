"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { materialize } = require("./materialize-random-observation");

const SOURCE_PROFILE_SHA256 = "a1c3a2f13257cd89eea08581137ad1fedbd0b81addda0eff5a0ee4a4e9b8d92c";

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readRecords(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  return raw ? raw.split(/\r?\n/u).map(JSON.parse) : [];
}

function pathsFor(game) {
  const root = __dirname;
  const label = `game-${String(game).padStart(2, "0")}`;
  const recordDir = path.join(root, "records", label);
  return {
    root,
    label,
    stateDir: path.join(root, "states", label),
    recordDir,
    evidenceDir: path.join(recordDir, "evidence"),
    payloadDir: path.join(recordDir, "payloads"),
    ledger: path.join(recordDir, "machine-records.ndjson"),
    decisions: path.join(recordDir, "DECISIONS.md"),
    inputProfile: path.join(root, "profiles", `${label}-input-revision-${game}.json`),
    outputProfile: path.join(root, "profiles", `${label}-output-revision-${game + 1}.json`),
    sourceProfile: game === 1
      ? path.join(root, "..", "ufs_revision1_vs_fresh_control_v21", "profiles", "treatment-v20-revision1.json")
      : path.join(root, "profiles", `game-${String(game - 1).padStart(2, "0")}-output-revision-${game}.json`),
    cli: path.join(root, "..", "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js"),
  };
}

function ensureInputProfile(game, paths) {
  if (!fs.existsSync(paths.sourceProfile)) {
    throw new Error(`missing source profile for game ${game}: ${paths.sourceProfile}`);
  }
  if (game === 1 && sha256(paths.sourceProfile) !== SOURCE_PROFILE_SHA256) {
    throw new Error("Game 1 source profile SHA-256 does not match the frozen V20 revision 1 profile");
  }
  const source = readJson(paths.sourceProfile);
  if (source.playerId !== "ufs-v20-fresh-player" || source.progress?.revision !== game) {
    throw new Error(`game ${game} expected input revision ${game}`);
  }
  if (!fs.existsSync(paths.inputProfile)) {
    fs.mkdirSync(path.dirname(paths.inputProfile), { recursive: true });
    fs.copyFileSync(paths.sourceProfile, paths.inputProfile, fs.constants.COPYFILE_EXCL);
  }
  if (sha256(paths.inputProfile) !== sha256(paths.sourceProfile)) {
    throw new Error(`game ${game} input profile is not an exact copy of its source revision`);
  }
}

function recordStep({ game, sequence, command, decision, payload = null }) {
  const paths = pathsFor(game);
  fs.mkdirSync(paths.evidenceDir, { recursive: true });
  fs.mkdirSync(paths.payloadDir, { recursive: true });
  const records = readRecords(paths.ledger);
  const expected = String(records.length + 1).padStart(4, "0");
  if (sequence !== expected) throw new Error(`expected sequence ${expected}, received ${sequence}`);
  if (command === "player-start" && records.length) throw new Error("player-start must be the first record");
  if (command !== "player-start" && !records.length) throw new Error("first record must be player-start");

  fs.appendFileSync(paths.decisions,
    `\n## Step ${sequence} - ${command}\n\n- Recorded before operation: ${new Date().toISOString()}\n- Judgment: ${decision}\n`,
    "utf8");

  let payloadFile = null;
  let randomMeta = null;
  let result;
  if (command === "player-start") {
    ensureInputProfile(game, paths);
    result = spawnSync(process.execPath, [paths.cli, "player-start", paths.stateDir, paths.inputProfile], {
      cwd: paths.root,
      encoding: "utf8",
    });
  } else if (command === "advance") {
    if (!payload || typeof payload.type !== "string") throw new Error("advance requires an operation payload");
    payloadFile = path.join(paths.payloadDir, `${sequence}.json`);
    fs.writeFileSync(payloadFile, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    result = spawnSync(process.execPath, [paths.cli, "advance", paths.stateDir, payloadFile], {
      cwd: paths.root,
      encoding: "utf8",
    });
  } else if (command === "random") {
    const view = readJson(path.join(paths.stateDir, "current-player-view.json"));
    const pendingType = view.pending?.type;
    const occurrence = records.filter((record) => record.randomMeta?.pendingType === pendingType).length + 1;
    const observation = materialize({ game, occurrence });
    payloadFile = observation.output;
    randomMeta = { pendingType, occurrence, dieIds: observation.dieIds };
    result = spawnSync(process.execPath, [paths.cli, "random", paths.stateDir, payloadFile], {
      cwd: paths.root,
      encoding: "utf8",
    });
  } else {
    throw new Error(`unsupported command: ${command}`);
  }

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const stdoutFile = path.join(paths.evidenceDir, `${sequence}.stdout.json`);
  const stderrFile = path.join(paths.evidenceDir, `${sequence}.stderr.txt`);
  fs.writeFileSync(stdoutFile, stdout, "utf8");
  fs.writeFileSync(stderrFile, stderr, "utf8");
  let response = null;
  try { response = JSON.parse(stdout); } catch { /* verifier reports malformed evidence */ }
  fs.appendFileSync(paths.ledger, `${JSON.stringify({
    schema: "ufs_v22_public_step_record_v1",
    game,
    sequence,
    command,
    inputProfile: command === "player-start" ? path.relative(paths.root, paths.inputProfile).replaceAll("\\", "/") : null,
    payloadFile: payloadFile ? path.relative(paths.root, payloadFile).replaceAll("\\", "/") : null,
    randomMeta,
    exitCode: result.status,
    signal: result.signal,
    stdoutFile: path.relative(paths.root, stdoutFile).replaceAll("\\", "/"),
    stderrFile: path.relative(paths.root, stderrFile).replaceAll("\\", "/"),
    public: response,
  })}\n`, "utf8");
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  process.exitCode = result.status === null ? 1 : result.status;
  return { paths, response, exitCode: result.status };
}

if (require.main === module) {
  const [gameRaw, sequence, command, decision, payloadRaw] = process.argv.slice(2);
  if (!/^[1-5]$/u.test(gameRaw ?? "") || !/^\d{4}$/u.test(sequence ?? "")
    || !["player-start", "advance", "random"].includes(command) || !decision) {
    throw new Error("Usage: node record-game-step.js <game 1..5> <NNNN> <player-start|advance|random> <decision> [payload-json]");
  }
  const payload = payloadRaw == null ? null : JSON.parse(payloadRaw);
  recordStep({ game: Number(gameRaw), sequence, command, decision, payload });
}

module.exports = { pathsFor, readRecords, recordStep, sha256 };

