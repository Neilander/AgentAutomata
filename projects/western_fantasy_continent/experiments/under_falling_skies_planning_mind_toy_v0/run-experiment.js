"use strict";

const fs = require("node:fs");
const path = require("node:path");

const CONFIG = require("./game-config");
const ENGINE = require("./game-engine");
const PLANNER = require("./planning-model");
const PLAYERS = require("./players");
const SEMANTIC = require("./semantic-space");

const OUT_FILE = path.join(__dirname, "artifacts", "planning-results.json");
const METHODS = ["random", "one_step_rune", "fixed_goal_plan", "full_dynamic_plan"];
const SEEDS = Number(process.env.UFS_SEEDS || 80);
const MAX_ROUNDS = 10;

function main() {
  const space = SEMANTIC.loadSemanticSpace();
  const games = [];
  for (const method of METHODS) {
    for (const profile of Object.values(PLANNER.PROFILES)) {
      for (let seed = 1; seed <= SEEDS; seed += 1) {
        games.push(runGame(space, method, profile, seed));
      }
    }
  }
  const summary = summarize(games);
  const payload = {
    schema: "ufs_planning_experiment_results_v0",
    boundary: {
      frontendUsed: false,
      formalPlayerAgentModified: false,
      commercialArtworkOrAssetsCopied: false,
      ruleScope: "five worker dice, white rerolls, one die per column, enemy descent, AA, energy, research, fighters, excavation, mothership deadline",
      omitted: ["campaign", "city powers", "robots", "characters", "commercial board layout"],
      planningFutureRolls: "unknown white-die rerolls use a fixed expected proxy; actual execution uses seeded random rolls",
    },
    semanticSpace: { dimensions: space.dimensions, model: space.model },
    protocol: { seedsPerCell: SEEDS, maxRounds: MAX_ROUNDS, methods: METHODS, profiles: Object.keys(PLANNER.PROFILES) },
    summary,
    sampleTraces: selectSampleTraces(games),
    games: games.map(compactGame),
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: OUT_FILE, summary }, null, 2));
}

function runGame(space, method, profile, seed) {
  let state = ENGINE.createGame(seed);
  const random = new ENGINE.SeededRng(seed * 7919 + method.length * 101 + profile.id.length);
  const decisions = [];
  while (!state.outcome && state.round <= MAX_ROUNDS) {
    while (!state.outcome && state.phase === "dice") {
      const before = PLANNER.stateSummary(state);
      const choice = PLAYERS.choosePlacement(method, space, state, profile, random);
      state = ENGINE.applyPlacement(state, choice.selected);
      decisions.push({
        index: decisions.length + 1,
        before,
        selected: choice.selected,
        hypothesisId: choice.selectedHypothesisId,
        trace: choice.trace,
        after: PLANNER.stateSummary(state),
      });
    }
    if (!state.outcome && state.phase === "rooms") state = ENGINE.resolveRooms(state);
    if (!state.outcome && state.phase === "mothership") state = ENGINE.resolveMothership(state);
    if (!state.outcome && state.round >= MAX_ROUNDS && state.phase === "dice") break;
  }
  const timedOut = !state.outcome;
  const hypothesisSequence = decisions.map((row) => row.hypothesisId).filter(Boolean);
  return {
    id: `${method}:${profile.id}:${seed}`,
    method,
    profileId: profile.id,
    seed,
    result: state.outcome?.result || "timeout",
    reason: state.outcome?.reason || "round_limit",
    rounds: state.round,
    final: PLANNER.stateSummary(state),
    timedOut,
    hypothesisSwitches: countSwitches(hypothesisSequence),
    roomCounts: countBy(decisions.map((row) => row.selected.roomType)),
    decisions,
  };
}

function summarize(games) {
  const cells = [];
  for (const method of METHODS) {
    for (const profileId of Object.keys(PLANNER.PROFILES)) {
      const rows = games.filter((game) => game.method === method && game.profileId === profileId);
      cells.push({
        method,
        profileId,
        games: rows.length,
        winRate: round(rows.filter((row) => row.result === "win").length / rows.length),
        lossRate: round(rows.filter((row) => row.result === "loss").length / rows.length),
        timeoutRate: round(rows.filter((row) => row.result === "timeout").length / rows.length),
        meanRounds: round(mean(rows.map((row) => row.rounds))),
        meanDamage: round(mean(rows.map((row) => row.final.damage))),
        meanResearch: round(mean(rows.map((row) => row.final.research))),
        meanExcavation: round(mean(rows.map((row) => row.final.excavatorDepth))),
        meanHypothesisSwitches: round(mean(rows.map((row) => row.hypothesisSwitches))),
        roomShares: roomShares(rows),
      });
    }
  }
  return { cells, comparisons: buildComparisons(cells) };
}

function buildComparisons(cells) {
  const rows = [];
  for (const profileId of Object.keys(PLANNER.PROFILES)) {
    const full = cells.find((cell) => cell.method === "full_dynamic_plan" && cell.profileId === profileId);
    const fixed = cells.find((cell) => cell.method === "fixed_goal_plan" && cell.profileId === profileId);
    const rune = cells.find((cell) => cell.method === "one_step_rune" && cell.profileId === profileId);
    const random = cells.find((cell) => cell.method === "random" && cell.profileId === profileId);
    rows.push({
      profileId,
      fullMinusFixedWinRate: round(full.winRate - fixed.winRate),
      fullMinusOneStepWinRate: round(full.winRate - rune.winRate),
      fullMinusRandomWinRate: round(full.winRate - random.winRate),
    });
  }
  return rows;
}

function selectSampleTraces(games) {
  return Object.keys(PLANNER.PROFILES).map((profileId) => {
    const preferred = games.find((game) => game.method === "full_dynamic_plan" && game.profileId === profileId && game.result === "win")
      || games.find((game) => game.method === "full_dynamic_plan" && game.profileId === profileId);
    return compactTrace(preferred);
  });
}

function compactTrace(game) {
  return {
    id: game.id,
    result: game.result,
    final: game.final,
    decisions: game.decisions.map((row) => ({
      index: row.index,
      round: row.before.round,
      diceBefore: row.before.dice,
      hypothesisId: row.hypothesisId,
      selected: row.selected,
      plans: row.trace.plans,
      after: row.after,
    })),
  };
}

function compactGame(game) {
  return {
    id: game.id,
    method: game.method,
    profileId: game.profileId,
    seed: game.seed,
    result: game.result,
    reason: game.reason,
    rounds: game.rounds,
    final: game.final,
    hypothesisSwitches: game.hypothesisSwitches,
    roomCounts: game.roomCounts,
  };
}

function roomShares(rows) {
  const total = rows.reduce((sum, row) => sum + Object.values(row.roomCounts).reduce((inner, value) => inner + value, 0), 0);
  const counts = {};
  for (const row of rows) {
    for (const [key, value] of Object.entries(row.roomCounts)) counts[key] = (counts[key] || 0) + value;
  }
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, round(value / Math.max(1, total))]));
}

function countSwitches(values) {
  let switches = 0;
  for (let index = 1; index < values.length; index += 1) if (values[index] !== values[index - 1]) switches += 1;
  return switches;
}

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return counts;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

if (require.main === module) main();

module.exports = { main, runGame, summarize };
