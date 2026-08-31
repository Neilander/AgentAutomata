"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  buildInitialPlayerTemplate,
  compilePlayerFeedbackProfile,
  createFreshPlayer,
  forkPlayer,
  summarizePlayerProfile,
  validatePlayerProfile,
} = require("./ufs-player-generator");

const HELP = `Usage:
  node ufs-player-cli.js template
  node ufs-player-cli.js fresh <profile.json> <player-id> [attention-seed]
  node ufs-player-cli.js fork <parent-profile.json> <profile.json> <player-id> [attention-seed]
  node ufs-player-cli.js compile-feedback <profile.json> <compiled-profile.json>
  node ufs-player-cli.js inspect <profile.json>

fresh creates a new player with frozen rule knowledge and empty personal learning.
fork copies one explicit parent learning snapshot, then future learning is independent.
continue is performed by full-game-attention-player-cli.js advance/random on a player-start state directory.
compile-feedback upgrades an older learned profile with its private real-GTE matrix and increments
the profile revision without inventing an episode. It never overwrites the input profile.
`;

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
}

function writeNewJson(file, value) {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

function parseSeed(value) {
  if (value == null) return 20260825;
  if (!/^\d+$/u.test(value)) throw new TypeError("attention-seed must be an unsigned integer");
  const seed = Number(value);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new TypeError("attention-seed must be an unsigned 32-bit integer");
  }
  return seed;
}

const [command, ...args] = process.argv.slice(2);
if (["help", "--help", "-h"].includes(command)) {
  process.stdout.write(HELP);
} else if (command === "template" && args.length === 0) {
  process.stdout.write(`${JSON.stringify(buildInitialPlayerTemplate(), null, 2)}\n`);
} else if (command === "fresh" && args.length >= 2 && args.length <= 3) {
  const [profileFile, playerId, seedRaw] = args;
  const profile = createFreshPlayer({ playerId, attentionSeed: parseSeed(seedRaw) });
  writeNewJson(profileFile, profile);
  process.stdout.write(`${JSON.stringify(summarizePlayerProfile(profile), null, 2)}\n`);
} else if (command === "fork" && args.length >= 3 && args.length <= 4) {
  const [parentFile, profileFile, playerId, seedRaw] = args;
  const parentProfile = validatePlayerProfile(readJson(parentFile));
  const profile = forkPlayer({
    parentProfile,
    playerId,
    attentionSeed: seedRaw == null ? null : parseSeed(seedRaw),
  });
  writeNewJson(profileFile, profile);
  process.stdout.write(`${JSON.stringify(summarizePlayerProfile(profile), null, 2)}\n`);
} else if (command === "compile-feedback" && args.length === 2) {
  const [profileFile, outputFile] = args;
  const profile = compilePlayerFeedbackProfile({ playerProfile: readJson(profileFile) });
  writeNewJson(outputFile, profile);
  process.stdout.write(`${JSON.stringify(summarizePlayerProfile(profile), null, 2)}\n`);
} else if (command === "inspect" && args.length === 1) {
  process.stdout.write(`${JSON.stringify(summarizePlayerProfile(readJson(args[0])), null, 2)}\n`);
} else {
  throw new Error(HELP);
}
