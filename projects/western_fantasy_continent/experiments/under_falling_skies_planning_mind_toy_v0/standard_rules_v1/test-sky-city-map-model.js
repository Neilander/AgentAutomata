"use strict";

const assert = require("assert");
const Model = require("./sky-city-map-model");

function completeCity(state) {
  Object.assign(state.city, {
    id: "roswell",
    label: "Roswell",
    maxDamage: 5,
    startEnergy: 2,
    maxEnergy: 7,
    robotLimit: 2,
  });
  state.research.costsText = "2, 3, 1, 4, 1, 3";
}

function testAssemblyAndEngineShape() {
  const state = Model.createState();
  completeCity(state);
  state.tiles[0].rows[0].cells[2] = { type: "explosion", amount: 4 };
  state.tiles[0].rows[1].cells[3] = { type: "arrow_left", amount: null };
  state.tiles[1].rows[0].cells[1] = { type: "mothership_down", amount: 1 };
  state.tiles[2].rows[2].rail.actions.spawn_white = 1;
  state.tiles[3].rows[3].rail.skull = true;

  const { errors, warnings, result } = Model.validateState(state);
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(warnings, []);
  assert.strictEqual(result.sky.rows.length, 16);
  assert.deepStrictEqual(result.sky.rows[0].cells[2], { explosion: 4 });
  assert.deepStrictEqual(result.sky.rows[1].cells[3], { effect: { type: "arrow", targetRow: 1, targetColumn: 2 } });
  assert.deepStrictEqual(result.sky.rows[4].cells[1], { effect: { type: "mothership_down", amount: 1 } });
  assert.deepStrictEqual(result.sky.rows[10].mothershipActions, [{ type: "spawn_white", amount: 1 }]);
  assert.strictEqual(result.sky.cityRow, 16);
  assert.strictEqual(result.sky.skullRow, 15);
  assert.deepStrictEqual(result.research.costs, [2, 3, 1, 4, 1, 3]);
}

function testTileReorderingChangesGlobalRows() {
  const state = Model.createState();
  state.tiles[0].rows[0].cells[1] = { type: "explosion", amount: 2 };
  state.tileOrder = ["sky-2", "sky-1", "sky-3", "sky-4"];
  const result = Model.buildExport(state);
  assert.deepStrictEqual(result.sky.rows[4].cells[1], { explosion: 2 });
}

function testBoundaryAndSkullValidation() {
  const state = Model.createState();
  completeCity(state);
  state.tiles[0].rows[0].cells[0] = { type: "arrow_left", amount: null };
  state.tiles[0].rows[0].rail.skull = true;
  state.tiles[1].rows[0].rail.skull = true;
  const result = Model.validateState(state);
  assert(result.errors.some((message) => message.includes("最左格不能继续向左")));
  assert(result.errors.some((message) => message.includes("只能有一行")));
}

function testRowsAndRoundTrip() {
  const state = Model.createState();
  Model.addTileRow(state, "sky-1");
  assert.strictEqual(state.tiles[0].rows.length, 5);
  Model.removeTileRow(state, "sky-1");
  assert.strictEqual(state.tiles[0].rows.length, 4);
  state.baseEntry = { schema: "ufs_base_map_entry_v1", base: { cells: [1] } };
  const restored = Model.restoreState(Model.buildExport(state));
  assert.strictEqual(restored.tiles.length, 4);
  assert.strictEqual(restored.baseEntry.schema, "ufs_base_map_entry_v1");
}

testAssemblyAndEngineShape();
testTileReorderingChangesGlobalRows();
testBoundaryAndSkullValidation();
testRowsAndRoundTrip();

console.log(JSON.stringify({ status: "PASS", tests: 4, tiles: 4, columns: 5 }, null, 2));
