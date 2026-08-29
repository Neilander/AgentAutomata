"use strict";

const fs = require("node:fs");
const path = require("node:path");

const mode = process.argv[2] || "stage1";
if (!["stage1", "final"].includes(mode)) throw new Error("usage: node verify-public-evidence.js <stage1|final>");
const dir = __dirname;
const ledger = path.join(dir, "machine-records.ndjson");
const rows = fs.readFileSync(ledger, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
if (!rows.length || rows[0].command !== "start" || rows[0].cliCommand !== "player-start") throw new Error("player-start contract");
if (rows.filter((row) => row.command === "start").length !== 1) throw new Error("start must occur exactly once");

let explicitPredictionActions = 0;
let deliberateActions = 0;
for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  if (row.sequence !== String(index + 1).padStart(3, "0")) throw new Error(`sequence ${row.sequence}`);
  if (row.exitCode !== 0) throw new Error(`nonzero exit at ${row.sequence}`);
  if (!row.public || !Array.isArray(row.public.availableOperations)) throw new Error(`missing public response at ${row.sequence}`);
  if (row.public.game?.playerId !== "ufs-v20-fresh-player") throw new Error(`player identity mismatch at ${row.sequence}`);
  if (row.public.game?.playerProfileRevision !== 0) throw new Error(`unexpected profile revision at ${row.sequence}`);
  const energy = Number(row.public.observation?.energy);
  if (Number.isFinite(energy) && energy < 0) throw new Error(`negative energy at ${row.sequence}`);
  const prior = rows[index - 1]?.public;
  if (row.command === "advance") {
    deliberateActions += 1;
    const payload = JSON.parse(fs.readFileSync(path.join(dir, row.payloadFile), "utf8"));
    if (!prior?.availableOperations?.includes(payload.type)) throw new Error(`operation not offered at ${row.sequence}`);
    const contract = prior.operationContracts?.find((candidate) => candidate.type === payload.type);
    if (!contract) throw new Error(`missing public operation contract at ${row.sequence}`);
    for (const field of contract.requiredFields || []) {
      if (!(field in payload)) throw new Error(`payload omitted required ${field} at ${row.sequence}`);
    }
    if (Array.isArray(payload.predictions) && payload.predictions.length > 0) explicitPredictionActions += 1;
  }
  if (row.command === "random" && prior?.status !== "random") throw new Error(`random boundary at ${row.sequence}`);
}

const last = rows.at(-1).public;
if (mode === "stage1") {
  const validPause = last.status === "random"
    && last.reason === "waiting_for_next_round_roll"
    && last.pending?.type === "next_round_roll"
    && last.pending?.round === 4
    && last.game?.completedRoundCount === 3;
  if (!validPause) throw new Error("invalid three-round stop");
} else if (last.status !== "complete" || !last.observation?.outcome) {
  throw new Error("final evidence is not at a formal outcome");
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  mode,
  records: rows.length,
  deliberateActions,
  explicitPredictionActions,
  predictionCoverage: deliberateActions ? explicitPredictionActions / deliberateActions : 0,
  completedRoundCount: last.game?.completedRoundCount,
  outcome: last.observation?.outcome || null,
}, null, 2)}\n`);
