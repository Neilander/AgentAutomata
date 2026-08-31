"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { buildRandomObservation } = require("./replayable-random-observation");

const roundBoundary = {
  pending: { type: "next_round_roll", dieIds: ["gray-1", "white-1"] },
  availableOperations: ["submit_round_roll"],
};

test("a supplied paired random observation is replayed exactly", () => {
  const supplied = {
    type: "submit_round_roll",
    values: { "gray-1": 2, "white-1": 6 },
  };
  assert.deepEqual(buildRandomObservation(roundBoundary, supplied), supplied);
});

test("a supplied random observation must match the public boundary and die ids", () => {
  assert.throws(() => buildRandomObservation(roundBoundary, {
    type: "submit_random_observation",
    values: { "gray-1": 2, "white-1": 6 },
  }), /type must be submit_round_roll/);
  assert.throws(() => buildRandomObservation(roundBoundary, {
    type: "submit_round_roll",
    values: { "gray-1": 2 },
  }), /exactly the public pending die ids/);
  assert.throws(() => buildRandomObservation(roundBoundary, {
    type: "submit_round_roll",
    values: { "gray-1": 2, "white-1": 7 },
  }), /integer from 1 through 6/);
});

test("the default path still draws one value per public die", () => {
  const draws = [3, 5];
  const operation = buildRandomObservation(roundBoundary, null, () => draws.shift());
  assert.deepEqual(operation, {
    type: "submit_round_roll",
    values: { "gray-1": 3, "white-1": 5 },
  });
});
