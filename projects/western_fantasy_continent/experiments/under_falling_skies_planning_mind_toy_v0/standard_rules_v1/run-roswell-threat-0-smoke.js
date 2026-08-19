"use strict";

const map = require("./fixtures/roswell-threat-0-map");
const { runGame } = require("./run-synthetic-smoke");

function main() {
  const count = Number(process.env.UFS_ROSWELL_SEEDS || 100);
  const games = Array.from({ length: count }, (_, index) => runGame(index + 1, map));
  const summary = {
    map: map.id,
    disclaimer: "规则状态机冒烟；使用简单随机放置和固定房间优先级，不代表玩家水平或正式难度胜率。",
    games: count,
    wins: games.filter((game) => game.result === "win").length,
    losses: games.filter((game) => game.result === "loss").length,
    timeouts: games.filter((game) => game.result === "timeout").length,
    meanRounds: games.reduce((sum, game) => sum + game.rounds, 0) / count,
    lossReasons: games
      .filter((game) => game.result === "loss")
      .reduce((counts, game) => ({ ...counts, [game.reason]: (counts[game.reason] || 0) + 1 }), {}),
  };
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) main();
