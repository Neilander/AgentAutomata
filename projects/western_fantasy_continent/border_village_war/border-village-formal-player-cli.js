"use strict";

const fs = require("node:fs");
const path = require("node:path");
const LOOP = require("./border-village-formal-player-loop");

const [, , command, sessionInput, payloadInput, optionInput, profileInput] = process.argv;
if (!command || !sessionInput) usage();
const sessionPath = path.resolve(sessionInput);

if (command === "init") {
  writeJson(sessionPath, LOOP.createSession(payloadInput || "border-village-formal-player", Math.max(1, Number(optionInput) || 100), { profileId: profileInput || "open_novice" }));
  printStatus();
} else if (command === "request") {
  emit(LOOP.getPendingRequest(readJson(sessionPath)), payloadInput);
} else if (command === "decision") {
  if (!payloadInput) usage();
  writeJson(sessionPath, LOOP.applyDecisionResponse(readJson(sessionPath), readJson(path.resolve(payloadInput))));
  printStatus();
} else if (command === "decision-json") {
  if (!payloadInput) usage();
  writeJson(sessionPath, LOOP.applyDecisionResponse(readJson(sessionPath), JSON.parse(payloadInput)));
  printStatus();
} else if (command === "attribution") {
  if (!payloadInput) usage();
  writeJson(sessionPath, LOOP.applyAttributionResponse(readJson(sessionPath), readJson(path.resolve(payloadInput))));
  printStatus();
} else if (command === "attribution-json") {
  if (!payloadInput) usage();
  writeJson(sessionPath, LOOP.applyAttributionResponse(readJson(sessionPath), JSON.parse(payloadInput)));
  printStatus();
} else if (command === "summary") {
  emit(LOOP.exportVisibleTrace(readJson(sessionPath)), payloadInput);
} else if (command === "replay-final") {
  if (!payloadInput) usage();
  writeJson(path.resolve(payloadInput), LOOP.createFinalReplaySession(readJson(sessionPath)));
  const replay = LOOP.createFinalReplaySession(readJson(sessionPath));
  process.stdout.write(`${JSON.stringify({ phase: replay.phase, completedCycles: replay.cycle, sessionPath: path.resolve(payloadInput) })}\n`);
} else {
  usage();
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function writeJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`); }
function emit(value, target) { if (target) writeJson(path.resolve(target), value); else process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
function printStatus() { const session = readJson(sessionPath); process.stdout.write(`${JSON.stringify({ phase: session.phase, completedCycles: session.cycle, sessionPath })}\n`); }
function usage() { throw new Error("usage: node border-village-formal-player-cli.js <init|request|decision|decision-json|attribution|attribution-json|summary|replay-final> <session.json> [payload.json|json|seed|target-session] [maxCycles] [profileId]"); }
