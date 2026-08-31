"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ARM_STATE = Object.freeze({
  treatment: "states/treatment-episode2",
  control: "states/control-episode1",
});
const OPERATION_BY_PENDING = Object.freeze({
  next_round_roll: "submit_round_roll",
  white_reroll: "submit_random_observation",
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function valueFor(seed, pendingType, occurrence, ordinal) {
  const bytes = crypto.createHash("sha256")
    .update(`${seed}:${pendingType}:${occurrence}:${ordinal}`)
    .digest();
  return (bytes.readUInt32BE(0) % 6) + 1;
}

const [arm, occurrenceRaw] = process.argv.slice(2);
if (!Object.hasOwn(ARM_STATE, arm) || !/^[1-9]\d*$/u.test(occurrenceRaw ?? "")) {
  throw new Error("Usage: node materialize-random-observation.js <treatment|control> <occurrence>");
}
const occurrence = Number(occurrenceRaw);
const root = __dirname;
const tape = readJson(path.join(root, "random-tape.json"));
const view = readJson(path.join(root, ARM_STATE[arm], "current-player-view.json"));
const pendingType = view.pending?.type;
const type = OPERATION_BY_PENDING[pendingType];
if (!type || !view.availableOperations?.includes(type)) {
  throw new Error(`arm ${arm} is not at a public random boundary`);
}
const dieIds = [...view.pending.dieIds].sort();
const operation = {
  type,
  values: Object.fromEntries(dieIds.map((dieId, index) => [
    dieId,
    valueFor(tape.seed, pendingType, occurrence, index + 1),
  ])),
};
const outputDir = path.join(root, "random-observations", arm);
fs.mkdirSync(outputDir, { recursive: true });
const output = path.join(outputDir, `${pendingType}-${String(occurrence).padStart(3, "0")}.json`);
fs.writeFileSync(output, `${JSON.stringify(operation, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
process.stdout.write(`${JSON.stringify({ arm, pendingType, occurrence, output, operation }, null, 2)}\n`);

