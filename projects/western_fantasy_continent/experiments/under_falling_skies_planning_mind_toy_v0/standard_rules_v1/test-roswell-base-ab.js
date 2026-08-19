"use strict";

const assert = require("assert");
const ENGINE = require("./standard-engine");
const CONTRACT = require("./map-contract");
const syntheticMap = require("./fixtures/synthetic-map");
const base = require("./fixtures/roswell-base-ab");

const map = {
  ...syntheticMap,
  id: "roswell-base-ab-test-shell",
  base,
};

CONTRACT.validateMap(map);

assert.strictEqual(base.cells.length, 30, "A+B should contain 30 logical cells");
assert.strictEqual(base.rooms.length, 25, "A+B should contain 25 room groups");
assert.strictEqual(base.fullRoute.length, 30, "physical yellow tunnel should connect all 30 cells");
assert.strictEqual(base.excavatorPath.length, 20, "future excavation path should contain the start plus 19 later cells");
assert.deepStrictEqual(base.fullRoute, [
  "A-r1-c5", "A-r1-c4", "A-r1-c3", "A-r1-c2", "A-r1-c1",
  "A-r2-c1", "A-r2-c2", "A-r2-c3", "A-r2-c4", "A-r2-c5",
  "A-r3-c5", "A-r3-c4", "A-r3-c3", "A-r3-c2", "A-r3-c1",
  "B-r1-c1", "B-r1-c2", "B-r1-c3", "B-r1-c4", "B-r1-c5",
  "B-r2-c5", "B-r2-c4", "B-r2-c3", "B-r2-c2", "B-r2-c1",
  "B-r3-c1", "B-r3-c2", "B-r3-c3", "B-r3-c4", "B-r3-c5",
]);
assert.deepStrictEqual(base.excavatorPath, [
  "A-r3-c5", "A-r3-c4", "A-r3-c3", "A-r3-c2", "A-r3-c1",
  "B-r1-c1", "B-r1-c2", "B-r1-c3", "B-r1-c4", "B-r1-c5",
  "B-r2-c5", "B-r2-c4", "B-r2-c3", "B-r2-c2", "B-r2-c1",
  "B-r3-c1", "B-r3-c2", "B-r3-c3", "B-r3-c4", "B-r3-c5",
]);

const byId = new Map(base.cells.map((cell) => [cell.id, cell]));
base.excavatorPath.forEach((cellId, order) => {
  assert.strictEqual(byId.get(cellId).unlockIndex, order, `${cellId} should unlock at path order ${order}`);
});
for (const cell of base.cells.filter((candidate) => candidate.tile === "A" && candidate.row < 2)) {
  assert.strictEqual(cell.unlockIndex, 0, `${cell.id} should be open at game start`);
}

let state = ENGINE.createGame(map, 19);
const die = state.dice[0];
const placements = ENGINE.legalWorkerPlacements(map, state, die.id);
const start = placements.find((item) => item.cellId === "A-r3-c5");
const next = placements.find((item) => item.cellId === "A-r3-c4");
assert(start && !start.excavationCandidate, "excavator start cell should already be open");
assert(next && next.excavationCandidate && next.excavationDistance === 1, "next path cell should be one excavation step away");

state = ENGINE.applyWorkerPlacement(map, state, next);
state.phase = "rooms";
const excavation = ENGINE.legalRoomActions(map, state).find((action) => action.type === "excavate");
assert(excavation && excavation.targetIndex === 1, "placed die should offer excavation to index 1");
state = ENGINE.applyRoomAction(map, state, excavation);
assert.strictEqual(state.excavatorIndex, 1, "excavator should move to the selected path position");

console.log(JSON.stringify({
  status: "PASS",
  cells: base.cells.length,
  rooms: base.rooms.length,
  fullRouteCells: base.fullRoute.length,
  pathCells: base.excavatorPath.length,
  pathStart: base.excavatorPath[0],
  pathEnd: base.excavatorPath.at(-1),
}, null, 2));
