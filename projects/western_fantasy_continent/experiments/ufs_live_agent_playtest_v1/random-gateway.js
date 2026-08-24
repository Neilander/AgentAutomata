"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const current = JSON.parse(fs.readFileSync(path.join(ROOT, "runtime", "current-response.json"), "utf8"));
if (current.status !== "random" || current.pending?.type !== "white_reroll") {
  throw new Error("random gateway may only run at the current white_reroll boundary");
}

const checkpoint = current.checkpoint;
const afterDieId = current.pending.afterDieId;
const placed = new Set(checkpoint.script.placements.map((entry) => entry.dieId));
const values = Object.fromEntries(
  checkpoint.initialPublicState.dice
    .filter((die) => !placed.has(die.id))
    .map((die) => [die.id, crypto.randomInt(1, 7)])
);
const operation = { type: "submit_random_observation", values };
const ordinal = String(current.actionCount + 1).padStart(3, "0");
const target = path.join(ROOT, "choices", `${ordinal}-random-after-${afterDieId}.json`);
fs.mkdirSync(path.dirname(target), { recursive: true });
if (fs.existsSync(target)) throw new Error(`refusing to overwrite ${target}`);
fs.writeFileSync(target, `${JSON.stringify(operation, null, 2)}\n`);
process.stdout.write(`${target}\n${JSON.stringify(operation, null, 2)}\n`);

