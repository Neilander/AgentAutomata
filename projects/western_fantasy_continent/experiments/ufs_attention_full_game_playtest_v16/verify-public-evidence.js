"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dir = __dirname;
const rows = fs.readFileSync(path.join(dir, "machine-records.ndjson"), "utf8")
  .trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
if (!rows.length || rows[0].command !== "start" || rows.filter((row) => row.command === "start").length !== 1) throw new Error("start contract");
for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  if (row.sequence !== String(index + 1).padStart(3, "0")) throw new Error(`sequence ${row.sequence}`);
  if (row.exitCode !== 0) throw new Error(`nonzero exit at ${row.sequence}`);
  if (!row.public || !Array.isArray(row.public.availableOperations)) throw new Error(`missing public response at ${row.sequence}`);
  const energy = Number(row.public.observation?.energy);
  if (Number.isFinite(energy) && energy < 0) throw new Error(`negative energy at ${row.sequence}`);
  const prior = rows[index - 1]?.public;
  if (row.command === "advance") {
    const payload = JSON.parse(fs.readFileSync(path.join(dir, row.payloadFile), "utf8"));
    if (!prior?.availableOperations?.includes(payload.type)) throw new Error(`operation not offered at ${row.sequence}`);
  }
  if (row.command === "random" && prior?.status !== "random") throw new Error(`random boundary at ${row.sequence}`);
}
const last = rows.at(-1).public;
const validPause = last.status === "random"
  && last.reason === "waiting_for_next_round_roll"
  && last.pending?.type === "next_round_roll"
  && last.pending?.round === 4
  && last.game?.completedRoundCount === 3;
if (!(validPause || last.status === "complete")) throw new Error("invalid stop");
console.log("public evidence OK");

