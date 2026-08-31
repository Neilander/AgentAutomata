"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

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

function materialize({ game, occurrence }) {
  const root = __dirname;
  const stateDir = path.join(root, "states", `game-${String(game).padStart(2, "0")}`);
  const view = readJson(path.join(stateDir, "current-player-view.json"));
  const tape = readJson(path.join(root, "random-tape.json"));
  const pendingType = view.pending?.type;
  const type = OPERATION_BY_PENDING[pendingType];
  if (!type || !view.availableOperations?.includes(type)) {
    throw new Error(`game ${game} is not at a public random boundary`);
  }
  const dieIds = [...view.pending.dieIds].sort();
  const operation = {
    type,
    values: Object.fromEntries(dieIds.map((dieId, index) => [
      dieId,
      valueFor(tape.seed, pendingType, occurrence, index + 1),
    ])),
  };
  const outputDir = path.join(
    root,
    "records",
    `game-${String(game).padStart(2, "0")}`,
    "random-observations",
  );
  fs.mkdirSync(outputDir, { recursive: true });
  const output = path.join(
    outputDir,
    `${pendingType}-${String(occurrence).padStart(3, "0")}.json`,
  );
  fs.writeFileSync(output, `${JSON.stringify(operation, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return { game, pendingType, occurrence, dieIds, output, operation };
}

if (require.main === module) {
  const [gameRaw, occurrenceRaw] = process.argv.slice(2);
  if (!/^[1-5]$/u.test(gameRaw ?? "") || !/^[1-9]\d*$/u.test(occurrenceRaw ?? "")) {
    throw new Error("Usage: node materialize-random-observation.js <game 1..5> <occurrence>");
  }
  process.stdout.write(`${JSON.stringify(materialize({
    game: Number(gameRaw),
    occurrence: Number(occurrenceRaw),
  }), null, 2)}\n`);
}

module.exports = { materialize, valueFor };

