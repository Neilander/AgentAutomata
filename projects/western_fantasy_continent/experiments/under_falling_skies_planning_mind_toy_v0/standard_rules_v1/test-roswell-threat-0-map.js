"use strict";

const assert = require("assert");
const CONTRACT = require("./map-contract");
const ENGINE = require("./standard-engine");
const map = require("./fixtures/roswell-threat-0-map");

CONTRACT.validateMap(map);

assert.strictEqual(map.columns, 5);
assert.strictEqual(map.threatLevel, 0);
assert.deepStrictEqual(map.city, {
  id: "roswell",
  label: "Roswell（未受损面）",
  maxDamage: 7,
  startEnergy: 2,
  maxEnergy: 7,
  robotLimit: 2,
  firstRoll: null,
});
assert.deepStrictEqual(map.research.costs, [3, 1, 3, 1, 4, 1, 3, 2, 1, 6, 1, 3, 5, 1, 3, 11]);
assert.strictEqual(map.research.costs.length, 16);
assert.strictEqual(map.research.costs.at(-1), 11);

const state = ENGINE.createGame(map, 20260811);
assert.strictEqual(state.mapId, map.id);
assert.strictEqual(state.energy, 2);
assert.strictEqual(state.damage, 0);
assert.strictEqual(state.researchIndex, 0);
assert.strictEqual(state.excavatorIndex, 0);
assert.strictEqual(state.ships.length, 5);
assert.strictEqual(ENGINE.allLegalWorkerPlacements(map, state).length > 0, true);

const finalStepState = { ...state, researchIndex: 15 };
const singleResearch = map.base.rooms.find((room) => room.type === "research" && room.cellIds.length === 1);
const multiResearch = map.base.rooms.find((room) => room.type === "research" && room.cellIds.length > 1);
assert.strictEqual(ENGINE.maxResearchAdvance(map, finalStepState, singleResearch, 11), 0, "single room cannot enter final 11");
assert.strictEqual(ENGINE.maxResearchAdvance(map, finalStepState, multiResearch, 11), 1, "multi-space room can enter final 11");

console.log(JSON.stringify({
  status: "PASS",
  map: map.id,
  startEnergy: state.energy,
  maxDamage: map.city.maxDamage,
  maxEnergy: map.city.maxEnergy,
  robotLimit: map.city.robotLimit,
  researchSpaces: map.research.costs.length,
  finalResearchCost: map.research.costs.at(-1),
  legalOpeningPlacements: ENGINE.allLegalWorkerPlacements(map, state).length,
}, null, 2));
