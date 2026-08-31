"use strict";

const crypto = require("node:crypto");

const RANDOM_OPERATION_BY_PENDING = Object.freeze({
  white_reroll: "submit_random_observation",
  next_round_roll: "submit_round_roll",
});

function validateValues(values, dieIds) {
  if (!values || Array.isArray(values) || typeof values !== "object") {
    throw new TypeError("random observation values must be an object keyed by public die id");
  }
  const expected = [...dieIds].sort();
  const actual = Object.keys(values).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("random observation must contain exactly the public pending die ids");
  }
  for (const dieId of expected) {
    if (!Number.isInteger(values[dieId]) || values[dieId] < 1 || values[dieId] > 6) {
      throw new TypeError(`random observation for ${dieId} must be an integer from 1 through 6`);
    }
  }
}

function buildRandomObservation(current, suppliedOperation = null, randomInt = crypto.randomInt) {
  const operationType = RANDOM_OPERATION_BY_PENDING[current?.pending?.type];
  if (!operationType) {
    throw new Error(`random is not available for pending boundary: ${current?.pending?.type}`);
  }
  if (!current.availableOperations?.includes(operationType)) {
    throw new Error(`${operationType} is not available at the current boundary`);
  }
  const dieIds = current.pending.dieIds;
  const operation = suppliedOperation == null ? {
    type: operationType,
    values: Object.fromEntries(dieIds.map((dieId) => [dieId, randomInt(1, 7)])),
  } : structuredClone(suppliedOperation);
  if (operation.type !== operationType) {
    throw new Error(`random observation type must be ${operationType}`);
  }
  validateValues(operation.values, dieIds);
  return operation;
}

module.exports = { buildRandomObservation };
