"use strict";

const assert = require("assert");
const MAP = require("../fixtures/roswell-threat-0-map");
const ENGINE = require("../standard-engine");
const PLAYER = require("./beam-player");

function preparedState() {
  const state = ENGINE.createGame(MAP, 123);
  state.phase = "rooms";
  state.researchIndex = 15;
  state.excavatorIndex = 18;
  state.energy = 2;
  state.mothershipRow = 8;
  state.placements = [];
  return state;
}

const prepared = preparedState();
const readiness = PLAYER.finishReadiness(MAP, prepared);
assert.equal(readiness.remainingCost, 11, "research 15 still owes the final 11 points");
assert.equal(readiness.bestUnlockedCellCount, 3, "deep three-cell research room is available at excavation 18");
assert.equal(readiness.energyShortfall, 0, "two energy can pay the deep research room");
assert.equal(readiness.safeMotherPhases, 2, "row 8 has two safe future mothership phases before skull row 11");

const unprepared = structuredClone(prepared);
unprepared.excavatorIndex = 6;
unprepared.energy = 0;
assert(
  PLAYER.scoreState(MAP, prepared) > PLAYER.scoreState(MAP, unprepared),
  "research 15 must be worth more when its final room and energy are actually ready",
);

const spawnView = {
  ships: [
    { id: "purple-1", color: "purple", column: 0, row: 4 },
    { id: "white-1", color: "white", column: 1, row: 2 },
  ],
};
assert.equal(
  PLAYER.chooseSpawnColumn(MAP, spawnView, [0, 1, 2]),
  PLAYER.chooseSpawnColumn(MAP, structuredClone(spawnView), [0, 1, 2]),
  "planning and execution use one pure spawn choice function",
);

console.log(JSON.stringify({
  status: "PASS",
  finalCostAtResearch15: readiness.remainingCost,
  deepRoomCells: readiness.bestUnlockedCellCount,
  safeMotherPhases: readiness.safeMotherPhases,
}, null, 2));
