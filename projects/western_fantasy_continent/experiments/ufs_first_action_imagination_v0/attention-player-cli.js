"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { compactAttentionResponse } = require("./compact-attention-response");
const { UfsAttentionPlayerSession } = require("./ufs-attention-player-session");

const HELP = `Usage:
  node attention-player-cli.js start <state-dir>
  node attention-player-cli.js advance <state-dir> <choice.json>
  node attention-player-cli.js random <state-dir>
  node attention-player-cli.js help

Start seed:
  Set UFS_ATTENTION_SEED to an unsigned 32-bit integer; default is 20260824.

Choice payloads:
  {"type":"place_die","dieId":"...","cellId":"..."}
  {"type":"resolve_room","roomId":"...","pay":true}
  {"type":"choose_research_advance","roomId":"...","advanceSteps":1}
  {"type":"excavate","placementId":"..."}
  {"type":"skip_worker","placementId":"..."}
  {"type":"end_rooms"}
  {"type":"choose_spawn","shipId":"...","dropPointId":"DP-C3"}

Only submit an operation listed by the current response.availableOperations and values exposed
by its current pending/noticed view. The random command supplies the external white-die result.
Stdout and current-player-view.json contain the compact player view. Full noticed-item and
attention-trace evidence is private host audit data in attention-audit-transcript.jsonl.
`;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function configuredAttentionSeed() {
  const raw = process.env.UFS_ATTENTION_SEED ?? process.env.ATTENTION_SEED ?? "20260824";
  if (!/^\d+$/.test(raw)) throw new Error("UFS_ATTENTION_SEED must be an unsigned 32-bit integer");
  const seed = Number(raw);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error("UFS_ATTENTION_SEED must be an unsigned 32-bit integer");
  }
  return seed;
}

function filesFor(stateDir) {
  return {
    checkpoint: path.join(stateDir, "host-checkpoint.json"),
    view: path.join(stateDir, "current-player-view.json"),
    transcript: path.join(stateDir, "machine-transcript.jsonl"),
    attentionAudit: path.join(stateDir, "attention-audit-transcript.jsonl"),
  };
}

function persist(paths, kind, operation, session, response) {
  const checkpoint = session.exportCheckpoint();
  const auditResponse = structuredClone(response);
  auditResponse.attention.seed = checkpoint.attentionSeed;
  const publicResponse = compactAttentionResponse(auditResponse);
  writeJson(paths.checkpoint, checkpoint);
  writeJson(paths.view, publicResponse);
  const record = {
    step: publicResponse.actionCount,
    kind,
    operation: operation ? structuredClone(operation) : null,
    response: publicResponse,
    recordedAt: new Date().toISOString(),
  };
  fs.appendFileSync(paths.transcript, `${JSON.stringify(record)}\n`, "utf8");
  fs.appendFileSync(paths.attentionAudit, `${JSON.stringify({
    step: auditResponse.actionCount,
    kind,
    operation: operation ? structuredClone(operation) : null,
    response: auditResponse,
    recordedAt: record.recordedAt,
  })}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(publicResponse, null, 2)}\n`);
}

function load(stateDir) {
  const paths = filesFor(stateDir);
  if (!fs.existsSync(paths.checkpoint)) throw new Error("attention player session has not started");
  return { paths, session: UfsAttentionPlayerSession.restore(readJson(paths.checkpoint)) };
}

function start(stateDir) {
  fs.mkdirSync(stateDir, { recursive: true });
  const paths = filesFor(stateDir);
  if (fs.existsSync(paths.transcript) || fs.existsSync(paths.attentionAudit)) {
    throw new Error("transcript already exists; refusing to overwrite");
  }
  const session = new UfsAttentionPlayerSession({ publicMap });
  const response = session.start({
    initialPublicState,
    attentionSeed: configuredAttentionSeed(),
  });
  persist(paths, "start", null, session, response);
}

function advance(stateDir, choiceFile) {
  const { paths, session } = load(stateDir);
  const operation = readJson(choiceFile);
  const response = session.advance(operation);
  persist(paths, "advance", operation, session, response);
}

function observeRandom(stateDir) {
  const { paths, session } = load(stateDir);
  const current = readJson(paths.view);
  if (current.status !== "random" || current.pending?.type !== "white_reroll") {
    throw new Error("random observation is only available at the current white-reroll boundary");
  }
  const values = Object.fromEntries(current.pending.dieIds.map((dieId) => [dieId, crypto.randomInt(1, 7)]));
  const operation = { type: "submit_random_observation", values };
  const response = session.advance(operation);
  persist(paths, "external_random_observation", operation, session, response);
}

const [command, stateDirArg, choiceFileArg] = process.argv.slice(2);
if (["help", "--help", "-h"].includes(command)) {
  process.stdout.write(HELP);
  process.exit(0);
}
if (!stateDirArg) throw new Error(HELP);
const stateDir = path.resolve(stateDirArg);
if (command === "start") start(stateDir);
else if (command === "advance" && choiceFileArg) advance(stateDir, path.resolve(choiceFileArg));
else if (command === "random") observeRandom(stateDir);
else throw new Error(HELP);
