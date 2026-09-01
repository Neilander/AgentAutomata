"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { isWaitingForNextRoundRollBoundary } = require("./safety-boundary");

const HERE = __dirname;

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function run() {
  const cases = [
    {
      id: "real-public-shape",
      response: {
        status: "random",
        reason: "waiting_for_next_round_roll",
        availableOperations: ["submit_round_roll"],
        pending: { dice: [{ id: "gray-1" }] },
      },
      expected: true,
    },
    {
      id: "v3-wrong-choice-shape",
      response: {
        status: "choice",
        reason: "waiting_for_next_round_roll",
        availableOperations: ["submit_round_roll"],
      },
      expected: false,
    },
    {
      id: "other-random-boundary",
      response: {
        status: "random",
        reason: "waiting_for_random_observation",
        availableOperations: ["submit_random_observation"],
        pending: { dieIds: ["white-1"] },
      },
      expected: false,
    },
  ].map((testCase) => ({
    ...testCase,
    actual: isWaitingForNextRoundRollBoundary(testCase.response),
  }));

  for (const testCase of cases) assert.equal(testCase.actual, testCase.expected, testCase.id);

  const evidence = {
    schema: "ufs_paired_v4_safety_boundary_contract_test_v1",
    completedAt: new Date().toISOString(),
    hostRuntimeImported: false,
    randomDrawsConsumed: 0,
    helperSha256: sha256(path.join(HERE, "safety-boundary.js")),
    testSourceSha256: sha256(__filename),
    cases,
    passed: true,
  };
  fs.writeFileSync(
    path.join(HERE, "safety-boundary-test-results.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { run };
