"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ARM_DIR = __dirname;
const PAIR_DIR = path.dirname(ARM_DIR);
const SHARED_DIR = path.resolve(PAIR_DIR, "../ufs_first_action_imagination_v0");
const PROTOCOL_FILE = path.join(PAIR_DIR, "PAIR_PROTOCOL.json");
const PROTOCOL_HASH_FILE = path.join(PAIR_DIR, "PAIR_PROTOCOL.sha256");
const HELPER_FILE = path.join(PAIR_DIR, "safety-boundary.js");
const TEST_FILE = path.join(PAIR_DIR, "test-safety-boundary.js");
const SEALED_TEST_RESULT_FILE = path.join(PAIR_DIR, "safety-boundary-test-results.json");
const OUTPUT_FILE = path.join(ARM_DIR, "preflight-validation.json");
const { isWaitingForNextRoundRollBoundary } = require(HELPER_FILE);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function run() {
  if (fs.existsSync(OUTPUT_FILE)) throw new Error("sealed preflight output already exists");
  const protocol = JSON.parse(fs.readFileSync(PROTOCOL_FILE, "utf8"));
  const sidecarProtocolHash = fs.readFileSync(PROTOCOL_HASH_FILE, "utf8").trim().split(/\s+/)[0];
  const actual = {
    protocol: sha256(PROTOCOL_FILE),
    helper: sha256(HELPER_FILE),
    contractTest: sha256(TEST_FILE),
    sealedTestResult: sha256(SEALED_TEST_RESULT_FILE),
    publicInitialState: sha256(path.resolve(PAIR_DIR, protocol.assets.publicInitialState.path)),
    publicMap: sha256(path.resolve(PAIR_DIR, protocol.assets.publicMap.path)),
  };
  const expected = {
    protocol: sidecarProtocolHash,
    helper: protocol.safetyBoundary.helperSha256,
    contractTest: protocol.safetyBoundary.contractTestSha256,
    sealedTestResult: protocol.safetyBoundary.preRunEvidenceSha256,
    publicInitialState: protocol.assets.publicInitialState.sha256,
    publicMap: protocol.assets.publicMap.sha256,
  };
  assert.deepEqual(actual, expected, "all frozen hashes must match before formal session construction");

  const sealed = JSON.parse(fs.readFileSync(SEALED_TEST_RESULT_FILE, "utf8"));
  assert.equal(sealed.passed, true);
  assert.equal(sealed.hostRuntimeImported, false);
  assert.equal(sealed.randomDrawsConsumed, 0);
  assert.equal(sealed.helperSha256, expected.helper);
  assert.equal(sealed.testSourceSha256, expected.contractTest);

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
    schema: "ufs_paired_v4_old_arm_preflight_v1",
    completedAt: new Date().toISOString(),
    hostRuntimeImported: false,
    sessionConstructed: false,
    randomDrawsConsumed: 0,
    sharedHelperImported: true,
    frozenHashes: actual,
    sealedStructuralEvidence: {
      schema: sealed.schema,
      completedAt: sealed.completedAt,
      passed: sealed.passed,
    },
    hostFreeCases: cases,
    passed: true,
  };
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
}

run();
