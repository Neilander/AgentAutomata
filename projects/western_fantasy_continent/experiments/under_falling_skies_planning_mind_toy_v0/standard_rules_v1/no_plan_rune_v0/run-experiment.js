"use strict";

const ENGINE = require("../standard-engine");
const MAP = require("../fixtures/roswell-threat-0-map");
const SEMANTIC = require("../../semantic-space");
const RUNE = require("./no-plan-rune-player");

const SPACE = SEMANTIC.loadSemanticSpace();

function runGame(method, seed, traceLimit = 0) {
  let state = ENGINE.createGame(MAP, seed);
  const random = new ENGINE.SeededRng(seed * 104729 + 31);
  const trace = [];
  let decisions = 0;
  let guard = 0;
  while (!state.outcome && state.round <= 12 && guard < 300) {
    if (state.phase === "dice") {
      const legal = ENGINE.allLegalWorkerPlacements(MAP, state);
      if (!legal.length) throw new Error(`no legal placement seed=${seed}`);
      const decision = method === "rune"
        ? RUNE.chooseWorkerPlacement(SPACE, MAP, state)
        : { selected: legal[Math.floor(random.next() * legal.length)], contract: { finalScoring: "random" } };
      if (trace.length < traceLimit) trace.push(traceDecision(state, "worker", decision));
      state = ENGINE.applyWorkerPlacement(MAP, state, decision.selected);
      decisions += 1;
    } else if (state.phase === "rooms") {
      const actions = executableRoomActions(state);
      const decision = method === "rune"
        ? RUNE.chooseRoomAction(SPACE, MAP, state)
        : { selected: actions[Math.floor(random.next() * actions.length)], contract: { finalScoring: "random" } };
      if (trace.length < traceLimit) trace.push(traceDecision(state, "room", decision));
      state = ENGINE.applyRoomAction(MAP, state, decision.selected);
      decisions += 1;
    } else if (state.phase === "mothership") {
      state = ENGINE.resolveMothership(MAP, state);
    } else {
      throw new Error(`unexpected phase ${state.phase}`);
    }
    guard += 1;
  }
  if (guard >= 300) throw new Error(`decision guard exceeded seed=${seed}`);
  return {
    method,
    seed,
    result: state.outcome?.result || "timeout",
    reason: state.outcome?.reason || "round_limit",
    rounds: state.round,
    decisions,
    final: {
      energy: state.energy,
      damage: state.damage,
      research: state.researchIndex,
      excavator: state.excavatorIndex,
      mothership: state.mothershipRow,
    },
    trace,
  };
}

function executableRoomActions(state) {
  const actions = ENGINE.legalRoomActions(MAP, state).filter((action) => action.affordable !== false && action.roomType !== "robot");
  return actions.length ? actions : [{ type: "end_rooms" }];
}

function traceDecision(state, phase, decision) {
  return {
    round: state.round,
    phase,
    state: {
      energy: state.energy,
      damage: state.damage,
      research: state.researchIndex,
      excavator: state.excavatorIndex,
      mothership: state.mothershipRow,
      ships: state.ships.map((ship) => ({ column: ship.column, row: ship.row })),
    },
    selected: decision.selected,
    score: decision.score,
    effects: decision.effects,
    need: decision.need,
    topCandidates: decision.topCandidates,
    contract: decision.contract,
  };
}

function summarize(games) {
  return {
    games: games.length,
    wins: games.filter((game) => game.result === "win").length,
    losses: games.filter((game) => game.result === "loss").length,
    timeouts: games.filter((game) => game.result === "timeout").length,
    meanRounds: round(games.reduce((sum, game) => sum + game.rounds, 0) / games.length),
    meanResearch: round(games.reduce((sum, game) => sum + game.final.research, 0) / games.length),
    meanExcavator: round(games.reduce((sum, game) => sum + game.final.excavator, 0) / games.length),
    reasons: games.reduce((counts, game) => ({ ...counts, [game.reason]: (counts[game.reason] || 0) + 1 }), {},),
  };
}

function main() {
  const seeds = Number(process.env.UFS_RUNE_SEEDS || 30);
  const runeGames = Array.from({ length: seeds }, (_, index) => runGame("rune", index + 1, index === 0 ? 12 : 0));
  const randomGames = Array.from({ length: seeds }, (_, index) => runGame("random", index + 1));
  console.log(JSON.stringify({
    schema: "ufs_no_plan_rune_v0_result",
    map: MAP.id,
    dimensions: SPACE.dimensions,
    boundary: {
      plans: false,
      milestones: false,
      hypotheses: false,
      crossStepMemory: false,
      optionLookaheadActions: 1,
      choiceRule: "current_need_vector dot immediate_option_coordinate",
    },
    rune: summarize(runeGames),
    random: summarize(randomGames),
    exampleTrace: runeGames[0].trace,
  }, null, 2));
}

function round(value) {
  return Math.round(value * 1e6) / 1e6;
}

if (require.main === module) main();

module.exports = { runGame, summarize };
