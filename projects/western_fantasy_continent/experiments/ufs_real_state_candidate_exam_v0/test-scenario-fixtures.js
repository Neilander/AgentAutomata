"use strict";

const assert = require("node:assert/strict");
const {
  buildScenarioA,
  buildScenarioB,
  buildScenarioC,
  engine,
  map,
} = require("./scenario-fixtures");

function shipAt(state, color, column, row) {
  return state.ships.some((ship) => ship.color === color && ship.column === column && ship.row === row);
}

const a = buildScenarioA();
assert.equal(a.mapId, "roswell-ab-threat-0");
assert.equal(a.round, 1);
assert.equal(a.energy, 2);
assert.equal(a.excavatorIndex, 0);
assert.deepEqual(a.dice.filter((die) => !die.placed).map((die) => [die.color, die.value]), [
  ["gray", 4], ["white", 5], ["white", 1],
]);
assert.ok(shipAt(a, "purple", 0, 3));
assert.ok(shipAt(a, "purple", 1, 2));
assert.equal(engine.allLegalWorkerPlacements(map, a).length, 26);

const b = buildScenarioB();
assert.equal(b.round, 2);
assert.equal(b.energy, 5);
assert.equal(b.damage, 0);
assert.equal(b.researchIndex, 0);
assert.equal(b.excavatorIndex, 2);
assert.equal(b.mothershipRow, 0);
assert.deepEqual(b.dice.map((die) => [die.color, die.value]), [
  ["gray", 5], ["gray", 4], ["gray", 1], ["white", 4], ["white", 2],
]);
assert.ok(shipAt(b, "white", 3, 0));
assert.ok(shipAt(b, "purple", 4, 3));
assert.equal(engine.allLegalWorkerPlacements(map, b).length, 81);

const c = buildScenarioC();
assert.equal(c.round, 2);
assert.deepEqual(c.dice.filter((die) => !die.placed).map((die) => [die.color, die.value]), [
  ["gray", 1], ["white", 4], ["white", 2],
]);
assert.ok(shipAt(c, "purple", 1, 6));
assert.ok(shipAt(c, "purple", 4, 3));
assert.equal(engine.allLegalWorkerPlacements(map, c).length, 27);

console.log(JSON.stringify({ result: "PASS", scenarios: 3 }, null, 2));
