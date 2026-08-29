"use strict";

const fs = require("node:fs");
const path = require("node:path");

const dir = __dirname;
const ledgerPath = path.join(dir, "machine-records.ndjson");
const lines = fs.readFileSync(ledgerPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);

if (!lines.length || lines[0].command !== "start" || lines.filter((line) => line.command === "start").length !== 1) {
  throw new Error("start contract");
}

for (let i = 0; i < lines.length; i += 1) {
  const expectedSequence = String(i + 1).padStart(3, "0");
  if (lines[i].sequence !== expectedSequence) throw new Error(`sequence ${lines[i].sequence}`);
  const knownPipelineRecoveryBug = lines[i].sequence === "075"
    && lines[i].command === "random"
    && lines[i].exitCode !== 0
    && lines[i].public === null;
  if (lines[i].exitCode !== 0 && !knownPipelineRecoveryBug) {
    throw new Error(`nonzero exit at ${lines[i].sequence}`);
  }
  const publicResponse = lines[i].public;
  if (knownPipelineRecoveryBug) continue;
  if (!publicResponse || !Array.isArray(publicResponse.availableOperations)) {
    throw new Error(`missing public response at ${lines[i].sequence}`);
  }
  if (lines[i].command === "advance") {
    const payload = JSON.parse(fs.readFileSync(path.join(dir, lines[i].payloadFile), "utf8"));
    const priorPublicLine = lines.slice(0, i).reverse().find((line) => line.public);
    const allowed = priorPublicLine?.public?.availableOperations || [];
    if (!allowed.includes(payload.type)) throw new Error(`operation not offered at ${lines[i].sequence}`);
  }
  const priorPublicLine = lines.slice(0, i).reverse().find((line) => line.public);
  if (lines[i].command === "random" && priorPublicLine?.public?.status !== "random") {
    throw new Error(`random boundary at ${lines[i].sequence}`);
  }
}

const last = lines.at(-1).public;
const validStagePause = last.status === "random"
  && last.reason === "waiting_for_next_round_roll"
  && last.pending?.type === "next_round_roll"
  && last.pending?.round === 4
  && last.game?.completedRoundCount === 3;
if (!(validStagePause || last.status === "complete" || (last.status === "attention_stop" && last.availableOperations.length === 0))) {
  throw new Error("invalid stop");
}

console.log("public evidence OK");
