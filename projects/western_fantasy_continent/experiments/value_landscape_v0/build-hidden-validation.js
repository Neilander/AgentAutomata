const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TEAM_EXPERIMENT = path.resolve(ROOT, "..", "team_vector_guess_v1");
const TEAM_ARTIFACT = path.join(TEAM_EXPERIMENT, "artifacts", "team-vector-knowledge.json");
const OUT_DIR = path.join(ROOT, "artifacts");
const OUT_FILE = path.join(OUT_DIR, "hidden-win-rates.json");
const GAME_DATA = path.resolve(ROOT, "..", "..", "game_data");
const COMBAT = require(path.join(GAME_DATA, "combat-sim"));
const BUILDER = require(path.join(TEAM_EXPERIMENT, "build-team-knowledge"));

const SEED_COUNT = 20;

function main() {
  const source = JSON.parse(fs.readFileSync(TEAM_ARTIFACT, "utf8"));
  const rows = [];
  for (const team of source.teams) {
    for (const opponent of BUILDER.OPPONENTS) {
      let wins = 0;
      let ownAlive = 0;
      let duration = 0;
      for (let seedIndex = 0; seedIndex < SEED_COUNT; seedIndex += 1) {
        const result = COMBAT.simulateTeams(
          BUILDER.buildCombatTeam(team),
          COMBAT.clonePreset(opponent.id),
          {
            seed: `value-landscape-hidden-v0|${seedIndex}|${team.id}|${opponent.id}`,
            randomizeStats: false,
            maxTime: 75,
            healthInterval: 0.5,
          },
        );
        wins += result.winner === "left" ? 1 : 0;
        ownAlive += result.metrics.leftAlive;
        duration += result.duration;
      }
      rows.push({
        teamId: team.id,
        opponentId: opponent.id,
        samples: SEED_COUNT,
        wins,
        winRate: round(wins / SEED_COUNT),
        meanOwnAlive: round(ownAlive / SEED_COUNT),
        meanDuration: round(duration / SEED_COUNT),
      });
    }
  }
  const payload = {
    schema: "value_landscape_hidden_validation_v0",
    boundary: {
      playerVisible: false,
      usedForLearning: false,
      purpose: "held-out outcome estimate only",
    },
    seedCount: SEED_COUNT,
    teamCount: source.teams.length,
    opponentCount: BUILDER.OPPONENTS.length,
    rows,
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: OUT_FILE, battles: rows.length * SEED_COUNT }, null, 2));
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

if (require.main === module) main();
