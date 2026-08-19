"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const TEAM_EXPERIMENT = path.resolve(ROOT, "..", "team_vector_guess_v1");
const TEAM_ARTIFACT = path.join(TEAM_EXPERIMENT, "artifacts", "team-vector-knowledge.json");
const OUT_FILE = path.join(ROOT, "artifacts", "unseen-hidden-truth.json");
const COMBAT = require(path.resolve(ROOT, "..", "..", "game_data", "combat-sim"));
const BUILDER = require(path.join(TEAM_EXPERIMENT, "build-team-knowledge"));

const UNSEEN_OPPONENTS = Object.freeze([
  "ironWall",
  "purgeAttrition",
  "frostTrapField",
  "cavalryBreak",
  "martyrFrontline",
]);
const SEED_COUNT = 12;

function main() {
  const source = JSON.parse(fs.readFileSync(TEAM_ARTIFACT, "utf8"));
  const seen = new Set(source.opponents.map((row) => row.id));
  for (const opponentId of UNSEEN_OPPONENTS) {
    if (seen.has(opponentId)) throw new Error(`sealed opponent leaked into prior training set: ${opponentId}`);
  }
  const rows = [];
  for (const team of source.teams) {
    for (const opponentId of UNSEEN_OPPONENTS) {
      let wins = 0;
      let ownAlive = 0;
      let duration = 0;
      for (let index = 0; index < SEED_COUNT; index += 1) {
        const result = simulate(team, opponentId, `semantic-loop-hidden|${index}|${team.id}|${opponentId}`);
        wins += result.winner === "left" ? 1 : 0;
        ownAlive += result.metrics.leftAlive;
        duration += result.duration;
      }
      rows.push({
        teamId: team.id,
        opponentId,
        samples: SEED_COUNT,
        wins,
        winRate: round(wins / SEED_COUNT),
        meanOwnAlive: round(ownAlive / SEED_COUNT),
        meanDuration: round(duration / SEED_COUNT),
      });
    }
  }
  const payload = {
    schema: "semantic_solution_unseen_truth_v0",
    boundary: {
      playerVisible: false,
      usedForSelection: false,
      opponentsAbsentFromPriorSixContextTraining: true,
      purpose: "sealed scoring only",
    },
    seedCount: SEED_COUNT,
    opponents: UNSEEN_OPPONENTS,
    rows,
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: OUT_FILE, battles: rows.length * SEED_COUNT }, null, 2));
}

function simulate(team, opponentId, seed) {
  return COMBAT.simulateTeams(
    BUILDER.buildCombatTeam(team),
    COMBAT.clonePreset(opponentId),
    { seed, randomizeStats: false, maxTime: 75, healthInterval: 0.5 },
  );
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

if (require.main === module) main();

module.exports = { SEED_COUNT, UNSEEN_OPPONENTS };
