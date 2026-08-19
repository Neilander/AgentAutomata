"use strict";

const assert = require("assert");
const ENGINE = require("../standard-engine");
const MAP = require("../fixtures/roswell-threat-0-map");
const SEMANTIC = require("../../semantic-space");
const RUNE = require("./no-plan-rune-player");

const space = SEMANTIC.loadSemanticSpace();
const state = ENGINE.createGame(MAP, 1);
const decision = RUNE.chooseWorkerPlacement(space, MAP, state);

assert.strictEqual(space.dimensions, 768);
assert.strictEqual(decision.coordinate.length, 768);
assert.strictEqual(decision.contract.planner, false);
assert.strictEqual(decision.contract.memory, false);
assert.strictEqual(decision.contract.hypotheses, false);
assert.strictEqual(decision.contract.milestones, false);
assert.strictEqual(decision.contract.lookaheadActions, 1);
assert.strictEqual(decision.contract.finalScoring, "768d_dot_product_only");
assert(ENGINE.allLegalWorkerPlacements(MAP, state).some((placement) => placement.id === decision.selected.id));
assert(decision.topCandidates.length > 0);
assert(Object.keys(decision.need.weights).includes("research"));

const repeated = RUNE.chooseWorkerPlacement(space, MAP, state);
assert.strictEqual(repeated.selected.id, decision.selected.id, "same state must produce the same rune choice");

console.log(JSON.stringify({
  status: "PASS",
  dimensions: space.dimensions,
  selected: decision.selected.id,
  score: decision.score,
  effects: decision.effects,
  planFieldsPresent: false,
}, null, 2));
