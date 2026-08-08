"use strict";

const assert = require("node:assert/strict");
const CONTRACT = require("./map-contract");
const ENGINE = require("./standard-engine");
const MAP = require("./fixtures/synthetic-map");

function testMapContract() {
  assert.equal(CONTRACT.validateMap(MAP), true);
  const broken = structuredClone(MAP);
  broken.sky.rows[0].cells.pop();
  assert.throws(() => CONTRACT.validateMap(broken), /必须正好有 5 个 cells/);
}

function testWhiteRerollAndColumnLock() {
  let state = ENGINE.createGame(MAP, 11);
  setDice(state, [2, 3, 4, 5, 1]);
  const white = state.dice[3];
  const choice = findPlacement(state, white.id, "energy-1");
  state = ENGINE.applyWorkerPlacement(MAP, state, choice, { rerollMode: "expected" });
  assert.equal(state.dice.find((die) => die.id === white.id).value, 5);
  assert.deepEqual(state.dice.filter((die) => !die.placed).map((die) => die.value), [3, 4, 3, 4]);
  assert.equal(ENGINE.allLegalWorkerPlacements(MAP, state).some((row) => row.column === 1), false);
}

function testOnlyOneUnexcavatedPlacement() {
  let state = ENGINE.createGame(MAP, 12);
  setDice(state, [2, 6, 6, 6, 6]);
  const first = findPlacement(state, state.dice[0].id, "deep-energy-0");
  assert.equal(first.excavationCandidate, true);
  state = ENGINE.applyWorkerPlacement(MAP, state, first, { rerollMode: "expected" });
  const remaining = ENGINE.allLegalWorkerPlacements(MAP, state);
  assert.equal(remaining.some((row) => row.excavationCandidate), false);
}

function testAaArrowAndMothershipLanding() {
  let state = ENGINE.createGame(MAP, 13);
  setDice(state, [1, 3, 4, 2, 2]);
  const ship0 = state.ships.find((ship) => ship.column === 0);
  state = ENGINE.applyWorkerPlacement(MAP, state, findPlacement(state, state.dice[0].id, "aa-0"));
  assert.equal(state.ships.find((ship) => ship.id === ship0.id).row, 0, "AA 里的 1 不应移动或触发");

  const ship1 = state.ships.find((ship) => ship.column === 1);
  state = ENGINE.applyWorkerPlacement(MAP, state, findPlacement(state, state.dice[1].id, "energy-1"));
  const moved = state.ships.find((ship) => ship.id === ship1.id);
  assert.deepEqual({ row: moved.row, column: moved.column }, { row: 2, column: 2 });

  state.ships = state.ships.filter((ship) => ship.column !== 2 || ship.id === moved.id);
  moved.column = 2;
  moved.row = 0;
  const before = state.mothershipRow;
  state = ENGINE.applyWorkerPlacement(MAP, state, findPlacement(state, state.dice[2].id, "fighter-2"));
  assert.equal(state.mothershipRow, before + 1, "落在母舰触发格应立即下降但不结算行效果");
}

function testCityHitAndMaximumDamage() {
  let state = ENGINE.createGame(MAP, 14);
  state.damage = MAP.city.maxDamage - 1;
  state.ships.find((ship) => ship.column === 1).row = 8;
  setDice(state, [1, 3, 1, 1, 1]);
  state = ENGINE.applyWorkerPlacement(MAP, state, findPlacement(state, state.dice[1].id, "energy-1"));
  assert.equal(state.outcome.result, "loss");
  assert.equal(state.outcome.reason, "maximum_damage");
}

function testEnergyBeforeResearch() {
  let state = roomState({
    energy: 0,
    placements: [
      worker("w-energy", "energy-1-c1-0", "energy-1", 3),
      worker("w-research", "research-3-c3-0", "research-3", 3),
    ],
  });
  assert.throws(() => resolveRoom(state, "research-3"), /insufficient energy/);
  state = resolveRoom(state, "energy-1");
  assert.equal(state.energy, 3);
  state = resolveRoom(state, "research-3");
  assert.equal(state.researchIndex, 1, "值 3 只能支付首格成本 1，下一格成本为 3");
}

function testMultiSpaceFinalResearchGate() {
  let state = roomState({
    energy: 5,
    researchIndex: MAP.research.costs.length - 1,
    excavatorIndex: 3,
    placements: [worker("single", "research-3-c3-0", "research-3", 6)],
  });
  let action = roomAction(state, "research-3");
  assert.equal(action.value, 6);
  state = ENGINE.applyRoomAction(MAP, state, action);
  assert.equal(state.researchIndex, MAP.research.costs.length - 1);
  assert.equal(state.outcome, null);

  state = roomState({
    energy: 5,
    researchIndex: MAP.research.costs.length - 1,
    excavatorIndex: 3,
    placements: [
      worker("multi-a", "multi-research-c1-0", "multi-research", 1),
      worker("multi-b", "multi-research-c2-1", "multi-research", 2),
    ],
  });
  action = roomAction(state, "multi-research");
  state = ENGINE.applyRoomAction(MAP, state, { ...action, advanceSteps: 1 });
  assert.equal(state.outcome.result, "win");
}

function testFighterPurpleAndWhiteDifference() {
  let state = roomState({
    energy: 3,
    placements: [worker("fighter", "fighter-2-c2-0", "fighter-2", 4)],
  });
  state.ships = [
    { id: "p", color: "purple", column: 0, row: 2 },
    { id: "w", color: "white", column: 3, row: 5 },
  ];
  state = resolveRoom(state, "fighter-2");
  assert.equal(state.ships.length, 0);
  assert.deepEqual(state.waitingShips, [{ id: "p", color: "purple" }]);
}

function testExcavationCostAndDistance() {
  let state = roomState({
    energy: 2,
    excavatorIndex: 0,
    placements: [{
      ...worker("dig", "deep-energy-0-c0-0", "deep-energy-0", 2),
      excavationCandidate: true,
    }],
  });
  const action = ENGINE.legalRoomActions(MAP, state).find((row) => row.type === "excavate");
  state = ENGINE.applyRoomAction(MAP, state, action);
  assert.equal(state.energy, 1);
  assert.equal(state.excavatorIndex, 2);
}

function testRobotInstallUseDecayAndUnblock() {
  let state = roomState({
    energy: 5,
    excavatorIndex: 4,
    placements: [worker("maker", "robot-3-c3-0", "robot-3", 5)],
  });
  const action = roomAction(state, "robot-3");
  state = ENGINE.applyRoomAction(MAP, state, { ...action, targetCellId: "energy-1-c1-0" });
  assert.equal(state.robots[0].value, 5);
  assert.equal(state.robots[0].exhausted, true);
  state = ENGINE.applyRoomAction(MAP, state, { type: "end_rooms" });
  assert.equal(state.robots[0].exhausted, false);

  state.phase = "rooms";
  state.energy = 0;
  state.placements = [];
  const energyAction = roomAction(state, "energy-1");
  state = ENGINE.applyRoomAction(MAP, state, energyAction);
  assert.equal(state.energy, 5);
  assert.equal(state.robots[0].value, 4);
  assert.equal(state.robots[0].exhausted, true);
}

function testMothershipActionsSpawnAndBuryRobot() {
  let state = ENGINE.createGame(MAP, 15);
  state.phase = "mothership";
  state.mothershipRow = 0;
  state.ships.forEach((ship) => { ship.row = 2; });
  state.excavatorIndex = 4;
  state.robots = [{ id: "buried", cellId: "robot-3-c3-0", value: 4, exhausted: false }];
  state = ENGINE.resolveMothership(MAP, state, { startNextRound: false });
  assert.equal(state.ships.some((ship) => ship.color === "white"), true, "row 1 应生成白机");

  state.phase = "mothership";
  state.mothershipRow = 4;
  state = ENGINE.resolveMothership(MAP, state, { startNextRound: false });
  assert.equal(state.excavatorIndex, 2);
  assert.equal(state.robots.length, 0, "挖掘机倒退后埋入未挖掘区的机器人应移除");
}

function testPurpleSpawnsBeforeWhiteAndEmptyColumnsFirst() {
  const state = ENGINE.createGame(MAP, 16);
  state.ships = [{ id: "existing", color: "purple", column: 0, row: 3 }];
  state.waitingShips = [
    { id: "white-x", color: "white" },
    { id: "purple-x", color: "purple" },
  ];
  ENGINE.spawnWaitingShips(MAP, state);
  const purple = state.ships.find((ship) => ship.id === "purple-x");
  const white = state.ships.find((ship) => ship.id === "white-x");
  assert.equal(purple.column, 1);
  assert.equal(white.column, 2);
}

function testCityFirstRollHook() {
  const map = structuredClone(MAP);
  map.city.firstRoll = { type: "set_die", color: "white", ordinal: 0, value: 6 };
  const state = ENGINE.createGame(map, 17);
  assert.equal(state.dice.filter((die) => die.color === "white")[0].value, 6);
}

function roomState(overrides = {}) {
  const state = ENGINE.createGame(MAP, 999);
  state.phase = "rooms";
  state.placements = [];
  return Object.assign(state, overrides);
}

function worker(id, cellId, roomId, dieValue) {
  return {
    id,
    dieId: id,
    dieColor: "gray",
    dieValue,
    cellId,
    roomId,
    roomType: MAP.base.rooms.find((room) => room.id === roomId).type,
    column: MAP.base.cells.find((cell) => cell.id === cellId).column,
    excavationCandidate: false,
    excavationDistance: 0,
    resolved: false,
  };
}

function roomAction(state, roomId) {
  const action = ENGINE.legalRoomActions(MAP, state).find((row) => row.type === "resolve_room" && row.roomId === roomId);
  assert.ok(action, `missing room action ${roomId}`);
  return action;
}

function resolveRoom(state, roomId, additions = {}) {
  return ENGINE.applyRoomAction(MAP, state, { ...roomAction(state, roomId), ...additions });
}

function findPlacement(state, dieId, roomId) {
  const choice = ENGINE.legalWorkerPlacements(MAP, state, dieId).find((row) => row.roomId === roomId);
  assert.ok(choice, `missing placement die=${dieId} room=${roomId}`);
  return choice;
}

function setDice(state, values) {
  state.dice.forEach((die, index) => { die.value = values[index]; });
}

const tests = [
  testMapContract,
  testWhiteRerollAndColumnLock,
  testOnlyOneUnexcavatedPlacement,
  testAaArrowAndMothershipLanding,
  testCityHitAndMaximumDamage,
  testEnergyBeforeResearch,
  testMultiSpaceFinalResearchGate,
  testFighterPurpleAndWhiteDifference,
  testExcavationCostAndDistance,
  testRobotInstallUseDecayAndUnblock,
  testMothershipActionsSpawnAndBuryRobot,
  testPurpleSpawnsBeforeWhiteAndEmptyColumnsFirst,
  testCityFirstRollHook,
];

for (const test of tests) test();
console.log(JSON.stringify({ status: "PASS", tests: tests.length, map: MAP.id }, null, 2));
