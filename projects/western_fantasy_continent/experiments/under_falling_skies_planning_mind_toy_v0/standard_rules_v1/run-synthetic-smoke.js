"use strict";

const ENGINE = require("./standard-engine");
const MAP = require("./fixtures/synthetic-map");

function runGame(seed, map = MAP) {
  let state = ENGINE.createGame(map, seed);
  const chooser = new ENGINE.SeededRng(seed * 7919 + 17);
  let decisions = 0;
  while (!state.outcome && state.round <= 12) {
    if (state.phase === "dice") {
      const legal = ENGINE.allLegalWorkerPlacements(map, state);
      if (!legal.length) throw new Error(`no legal worker placement: seed=${seed} round=${state.round}`);
      const choice = legal[Math.floor(chooser.next() * legal.length)];
      state = ENGINE.applyWorkerPlacement(map, state, choice);
      decisions += 1;
    } else if (state.phase === "rooms") {
      state = playRoomPhase(state, map);
    } else if (state.phase === "mothership") {
      state = ENGINE.resolveMothership(map, state);
    } else {
      throw new Error(`unexpected phase ${state.phase}`);
    }
  }
  return { seed, result: state.outcome?.result || "timeout", reason: state.outcome?.reason || "round_limit", rounds: state.round, decisions };
}

function playRoomPhase(input, map = MAP) {
  let state = input;
  let guard = 0;
  while (state.phase === "rooms" && guard < 30) {
    const actions = ENGINE.legalRoomActions(map, state);
    let action = first(actions, (row) => row.type === "resolve_room" && row.roomType === "energy" && row.affordable)
      || first(actions, (row) => row.type === "resolve_room" && row.roomType === "research" && row.affordable)
      || first(actions, (row) => row.type === "resolve_room" && row.roomType === "fighter" && row.affordable)
      || first(actions, (row) => row.type === "excavate" && row.affordable)
      || robotAction(map, state, actions)
      || first(actions, (row) => row.type === "resolve_room" && row.affordable && row.roomType !== "robot")
      || first(actions, (row) => row.type === "skip_worker")
      || { type: "end_rooms" };
    state = ENGINE.applyRoomAction(map, state, action);
    if (state.outcome) return state;
    guard += 1;
    if (!state.placements.some((placement) => !placement.resolved)) {
      state = ENGINE.applyRoomAction(map, state, { type: "end_rooms" });
    }
  }
  if (guard >= 30) throw new Error("room phase guard exceeded");
  return state;
}

function robotAction(map, state, actions) {
  const action = first(actions, (row) => row.type === "resolve_room" && row.roomType === "robot" && row.affordable);
  if (!action) return null;
  const occupied = new Set([
    ...state.placements.filter((placement) => !placement.resolved).map((placement) => placement.cellId),
    ...state.robots.map((robot) => robot.cellId),
  ]);
  const target = map.base.cells.find((cell) => cell.unlockIndex <= state.excavatorIndex && !occupied.has(cell.id));
  if (!target) return null;
  const result = { ...action, targetCellId: target.id };
  if (state.robots.length >= map.city.robotLimit) result.removeRobotId = state.robots[0].id;
  return result;
}

function first(values, predicate) {
  return values.find(predicate) || null;
}

function main() {
  const count = Number(process.env.UFS_STANDARD_SEEDS || 100);
  const games = Array.from({ length: count }, (_, index) => runGame(index + 1));
  const summary = {
    map: MAP.id,
    disclaimer: "规则稳定性冒烟测试；合成地图不是正式商业版图，胜率没有游戏难度意义",
    games: count,
    wins: games.filter((game) => game.result === "win").length,
    losses: games.filter((game) => game.result === "loss").length,
    timeouts: games.filter((game) => game.result === "timeout").length,
    meanRounds: games.reduce((sum, game) => sum + game.rounds, 0) / count,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.timeouts) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { runGame };
