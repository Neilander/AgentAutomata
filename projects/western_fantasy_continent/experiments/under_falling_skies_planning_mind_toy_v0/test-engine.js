"use strict";

const assert = require("node:assert/strict");
const CONFIG = require("./game-config");
const ENGINE = require("./game-engine");

function findPlacement(state, dieId, roomType, column = null) {
  return ENGINE.legalPlacements(state, dieId).find((row) => row.roomType === roomType && (column == null || row.column === column));
}

function testFiveDiceAndColumns() {
  const state = ENGINE.createGame(7);
  assert.equal(state.dice.length, 5);
  assert.equal(state.dice.filter((row) => row.color === "white").length, 2);
  const die = state.dice[0];
  const placement = findPlacement(state, die.id, "aa", 0);
  const next = ENGINE.applyPlacement(state, placement);
  assert.equal(next.placements.length, 1);
  assert.equal(ENGINE.legalPlacements(next, next.dice[1].id).some((row) => row.column === 0), false);
}

function testWhiteReroll() {
  const state = ENGINE.createGame(11);
  const white = state.dice.find((row) => row.color === "white");
  const before = state.dice.filter((row) => row.id !== white.id).map((row) => row.value);
  const next = ENGINE.applyPlacement(state, findPlacement(state, white.id, "aa", 0));
  const after = next.dice.filter((row) => !row.placed).map((row) => row.value);
  assert.notDeepEqual(after, before);
  assert.equal(next.history.at(-1).type, "white_reroll");
}

function testEnergyBeforeResearch() {
  let state = ENGINE.createGame(19);
  state.energy = 0;
  state.dice[0].value = 4;
  state.dice[1].value = 4;
  state = ENGINE.applyPlacement(state, findPlacement(state, state.dice[0].id, "energy", 0), { rerollMode: "expected" });
  state = ENGINE.applyPlacement(state, findPlacement(state, state.dice[1].id, "research", 1), { rerollMode: "expected" });
  for (const die of state.dice.filter((row) => !row.placed)) {
    state = ENGINE.applyPlacement(state, findPlacement(state, die.id, "aa"), { rerollMode: "expected" });
  }
  state = ENGINE.resolveRooms(state);
  assert.ok(state.energy >= 0);
  assert.ok(state.research > 0, "energy room should make later research usable");
}

function testExcavationUnlocksRooms() {
  let state = ENGINE.createGame(23);
  const die = state.dice[0];
  die.value = 3;
  const excavation = findPlacement(state, die.id, "excavate", 2);
  state = ENGINE.applyPlacement(state, excavation, { rerollMode: "expected" });
  for (const remaining of state.dice.filter((row) => !row.placed)) {
    state = ENGINE.applyPlacement(state, findPlacement(state, remaining.id, "aa"), { rerollMode: "expected" });
  }
  state = ENGINE.resolveRooms(state);
  assert.equal(state.excavatorDepth, 3);
  state = ENGINE.resolveMothership(state);
  assert.ok(ENGINE.allLegalPlacements(state).some((row) => row.roomId === "energy-c2-d3"));
}

function testHighDieMovesShipsAndAaReduces() {
  let normal = ENGINE.createGame(29);
  normal.dice[0].value = 4;
  normal = ENGINE.applyPlacement(normal, findPlacement(normal, normal.dice[0].id, "energy", 0));
  const normalRow = normal.ships.find((row) => row.column === 0).row;

  let aa = ENGINE.createGame(29);
  aa.dice[0].value = 4;
  aa = ENGINE.applyPlacement(aa, findPlacement(aa, aa.dice[0].id, "aa", 0));
  const aaRow = aa.ships.find((row) => row.column === 0).row;
  assert.equal(normalRow, 4);
  assert.equal(aaRow, 3);
}

function testWinAndLossBoundaries() {
  let winState = ENGINE.createGame(31);
  winState.research = CONFIG.RESEARCH_TARGET - 1;
  winState.energy = CONFIG.MAX_ENERGY;
  winState.dice[0].value = 2;
  winState = ENGINE.applyPlacement(winState, findPlacement(winState, winState.dice[0].id, "research", 1), { rerollMode: "expected" });
  for (const die of winState.dice.filter((row) => !row.placed)) {
    winState = ENGINE.applyPlacement(winState, findPlacement(winState, die.id, "aa"), { rerollMode: "expected" });
  }
  winState = ENGINE.resolveRooms(winState);
  assert.equal(winState.outcome?.result, "win");

  let lossState = ENGINE.createGame(37);
  lossState.damage = CONFIG.MAX_DAMAGE - 1;
  lossState.ships.find((row) => row.column === 0).row = CONFIG.CITY_ROW - 1;
  lossState.dice[0].value = 2;
  lossState = ENGINE.applyPlacement(lossState, findPlacement(lossState, lossState.dice[0].id, "energy", 0));
  assert.equal(lossState.outcome?.result, "loss");
}

testFiveDiceAndColumns();
testWhiteReroll();
testEnergyBeforeResearch();
testExcavationUnlocksRooms();
testHighDieMovesShipsAndAaReduces();
testWinAndLossBoundaries();

console.log(JSON.stringify({ status: "PASS", tests: 6 }, null, 2));
