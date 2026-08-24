"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { UfsOneRoundSession } = require("../ufs_first_action_imagination_v0/ufs-one-round-session");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");

const ROOT = __dirname;
const STATE = path.join(ROOT, "runtime");
const RESPONSES = path.join(ROOT, "responses");
const CHECKPOINT = path.join(STATE, "checkpoint.json");
const CURRENT = path.join(STATE, "current-response.json");
const TRANSCRIPT = path.join(ROOT, "machine-transcript.jsonl");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ensureDirs() {
  fs.mkdirSync(STATE, { recursive: true });
  fs.mkdirSync(RESPONSES, { recursive: true });
}

function transcriptLength() {
  if (!fs.existsSync(TRANSCRIPT)) return 0;
  return fs.readFileSync(TRANSCRIPT, "utf8").split(/\r?\n/).filter(Boolean).length;
}

function persist(kind, operation, response) {
  const step = transcriptLength();
  const record = {
    step,
    kind,
    operation: operation || null,
    response,
    recordedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CHECKPOINT, `${JSON.stringify(response.checkpoint, null, 2)}\n`);
  fs.writeFileSync(CURRENT, `${JSON.stringify(response, null, 2)}\n`);
  fs.writeFileSync(path.join(RESPONSES, `${String(step).padStart(3, "0")}.json`), `${JSON.stringify(record, null, 2)}\n`);
  fs.appendFileSync(TRANSCRIPT, `${JSON.stringify(record)}\n`);
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

function start() {
  if (fs.existsSync(TRANSCRIPT)) throw new Error("live transcript already exists; refusing to overwrite");
  const initialPublicState = readJson(path.join(ROOT, "..", "ufs_first_action_imagination_v0", "public_initial_state.json"));
  const session = new UfsOneRoundSession({ publicMap });
  const response = session.start({ initialPublicState, attentionSeed: 20260824 });
  persist("start", null, response);
}

function advance(choiceFile) {
  if (!fs.existsSync(CHECKPOINT)) throw new Error("start the session first");
  const operation = readJson(choiceFile);
  const session = UfsOneRoundSession.restore(readJson(CHECKPOINT));
  const response = session.advance(operation);
  persist("advance", operation, response);
}

ensureDirs();
const [command, choiceFile] = process.argv.slice(2);
if (command === "start") start();
else if (command === "advance" && choiceFile) advance(path.resolve(choiceFile));
else throw new Error("usage: node session-cli.js start | advance <one-choice.json>");
