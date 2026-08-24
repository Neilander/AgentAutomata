"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { UfsAttentionPlayerSession } = require("./ufs-attention-player-session");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function filesFor(stateDir) {
  return {
    checkpoint: path.join(stateDir, "host-checkpoint.json"),
    view: path.join(stateDir, "current-player-view.json"),
    transcript: path.join(stateDir, "machine-transcript.jsonl"),
  };
}

function persist(paths, kind, operation, session, response) {
  writeJson(paths.checkpoint, session.exportCheckpoint());
  writeJson(paths.view, response);
  const record = {
    step: response.actionCount,
    kind,
    operation: operation ? structuredClone(operation) : null,
    response,
    recordedAt: new Date().toISOString(),
  };
  fs.appendFileSync(paths.transcript, `${JSON.stringify(record)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

function load(stateDir) {
  const paths = filesFor(stateDir);
  if (!fs.existsSync(paths.checkpoint)) throw new Error("attention player session has not started");
  return { paths, session: UfsAttentionPlayerSession.restore(readJson(paths.checkpoint)) };
}

function start(stateDir) {
  fs.mkdirSync(stateDir, { recursive: true });
  const paths = filesFor(stateDir);
  if (fs.existsSync(paths.transcript)) throw new Error("transcript already exists; refusing to overwrite");
  const session = new UfsAttentionPlayerSession({ publicMap });
  const response = session.start({ initialPublicState, attentionSeed: 20260824 });
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
if (!stateDirArg) throw new Error("usage: node attention-player-cli.js start|advance|random <state-dir> [choice.json]");
const stateDir = path.resolve(stateDirArg);
if (command === "start") start(stateDir);
else if (command === "advance" && choiceFileArg) advance(stateDir, path.resolve(choiceFileArg));
else if (command === "random") observeRandom(stateDir);
else throw new Error("usage: node attention-player-cli.js start|advance|random <state-dir> [choice.json]");
