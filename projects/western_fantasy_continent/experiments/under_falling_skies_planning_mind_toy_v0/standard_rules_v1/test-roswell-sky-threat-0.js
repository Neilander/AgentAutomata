"use strict";

const assert = require("assert");
const CONTRACT = require("./map-contract");
const syntheticMap = require("./fixtures/synthetic-map");
const base = require("./fixtures/roswell-base-ab");
const sky = require("./fixtures/roswell-sky-threat-0");

const map = {
  ...syntheticMap,
  id: "roswell-threat-0-partial-test-shell",
  base,
  sky,
};

CONTRACT.validateMap(map);

assert.strictEqual(sky.threatLevel, 0);
assert.strictEqual(sky.tiles.length, 4);
assert(sky.tiles.every((tile) => tile.side === "easy"));
assert.strictEqual(sky.rows.length, 16);
assert(sky.rows.every((row) => row.cells.length === 5));
assert.strictEqual(sky.cityRow, 16);
assert.strictEqual(sky.skullRow, 11);

const cells = sky.rows.flatMap((row) => row.cells);
const explosions = cells.filter((cell) => cell.explosion != null);
const arrows = cells.filter((cell) => cell.effect?.type === "arrow");
const mothershipDrops = cells.filter((cell) => cell.effect?.type === "mothership_down");
const railActions = sky.rows.flatMap((row) => row.mothershipActions);

assert.strictEqual(cells.length, 80);
assert.strictEqual(explosions.length, 19);
assert.strictEqual(arrows.length, 15);
assert.strictEqual(mothershipDrops.length, 8);
assert.strictEqual(railActions.length, 8);
for (const [rowIndex, row] of sky.rows.entries()) {
  for (const [column, cell] of row.cells.entries()) {
    if (cell.effect?.type !== "arrow") continue;
    assert.strictEqual(cell.effect.targetRow, rowIndex);
    assert.strictEqual(Math.abs(cell.effect.targetColumn - column), 1);
    assert(cell.effect.targetColumn >= 0 && cell.effect.targetColumn < 5);
  }
}

console.log(JSON.stringify({
  status: "PASS",
  tiles: sky.tiles.length,
  rows: sky.rows.length,
  cells: cells.length,
  explosions: explosions.length,
  arrows: arrows.length,
  mothershipDrops: mothershipDrops.length,
  railActions: railActions.length,
  skullRow: sky.skullRow,
}, null, 2));
