"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const EXPERIMENT_DIR = __dirname;
const ROUNDS = [
  ["round-01-seed-2026082501", 2026082501],
  ["round-02-seed-2026082502", 2026082502],
  ["round-03-seed-2026082503", 2026082503],
];

function listRecords(roundName) {
  const machineDir = path.join(EXPERIMENT_DIR, roundName, "machine");
  return fs.readdirSync(machineDir)
    .filter((name) => name.endsWith(".record.json"))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(machineDir, name), "utf8")));
}

test("three unique requested and echoed attention seeds", () => {
  const requested = [];
  const stateDirs = [];
  for (const [roundName, expectedSeed] of ROUNDS) {
    const records = listRecords(roundName);
    assert.equal(records[0].command, "start");
    assert.equal(records[0].parsedPublicResponse.attention.seed, expectedSeed);
    for (const record of records) {
      assert.equal(Number(record.requestedSeed), expectedSeed);
      assert.equal(record.parsedPublicResponse.attention.seed, expectedSeed);
      stateDirs.push(record.stateDir);
    }
    requested.push(expectedSeed);
  }
  assert.equal(new Set(requested).size, 3);
  assert.equal(new Set(stateDirs).size, 3);
});

test("all raw stdout is intact, parseable, and paired with machine metadata", () => {
  for (const [roundName] of ROUNDS) {
    for (const record of listRecords(roundName)) {
      const raw = fs.readFileSync(record.stdoutPath);
      assert.equal(raw.length, record.stdoutBytes);
      assert.deepEqual(JSON.parse(raw.toString("utf8")), record.parsedPublicResponse);
      assert.equal(record.parseError, null);
      assert.equal(record.exitCode, 0);
      assert.equal(record.stderrBytes, 0);
      assert.equal(fs.readFileSync(record.stderrPath).length, 0);
    }
  }
});

test("every command follows the previous public operation boundary", () => {
  for (const [roundName] of ROUNDS) {
    const records = listRecords(roundName);
    for (let index = 1; index < records.length; index += 1) {
      const previous = records[index - 1].parsedPublicResponse;
      const current = records[index];
      if (current.command === "random") {
        assert.equal(previous.status, "random");
        assert.ok(previous.availableOperations.includes("submit_random_observation"));
      } else {
        assert.equal(current.command, "advance");
        const payload = JSON.parse(fs.readFileSync(current.payloadPath, "utf8"));
        assert.ok(previous.availableOperations.includes(payload.type));
      }
    }
  }
});

test("white-die boundaries used CLI random and no attempt was rejected or stopped unknown", () => {
  let randomCount = 0;
  for (const [roundName] of ROUNDS) {
    for (const record of listRecords(roundName)) {
      if (record.command === "random") randomCount += 1;
      assert.notEqual(record.parsedPublicResponse.status, "rejected");
      assert.notEqual(record.parsedPublicResponse.status, "unknown");
      assert.notEqual(record.parsedPublicResponse.status, "attention_stop");
    }
  }
  assert.equal(randomCount, 3);
});

test("all three unique attempts complete at the next-round boundary", () => {
  for (const [roundName] of ROUNDS) {
    const records = listRecords(roundName);
    const final = records.at(-1).parsedPublicResponse;
    assert.equal(final.status, "complete");
    assert.equal(final.reason, "one_round_imagined_to_next_round_boundary");
    assert.equal(final.observation.phase, "new_round");
    assert.equal(final.pending, null);
    assert.deepEqual(final.availableOperations, []);
  }
});

test("each captured command has a prior decision section and each advance has a payload", () => {
  for (const [roundName] of ROUNDS) {
    const records = listRecords(roundName);
    const decisions = fs.readFileSync(path.join(EXPERIMENT_DIR, roundName, "decisions.md"), "utf8");
    const sectionCount = (decisions.match(/^## \d\d /gm) || []).length;
    assert.equal(sectionCount, records.length);
    const advanceCount = records.filter((record) => record.command === "advance").length;
    const choiceCount = fs.readdirSync(path.join(EXPERIMENT_DIR, roundName, "choices"))
      .filter((name) => name.endsWith(".json")).length;
    assert.equal(choiceCount, advanceCount);
  }
});

test("write public stdout SHA-256 audit manifest", () => {
  const manifest = {
    schemaVersion: 1,
    generatedFrom: "public stdout only; state directories were not read",
    rounds: {},
  };
  for (const [roundName, expectedSeed] of ROUNDS) {
    const records = listRecords(roundName);
    manifest.rounds[roundName] = {
      expectedSeed,
      echoedSeed: records[0].parsedPublicResponse.attention.seed,
      stateDir: records[0].stateDir,
      commands: records.map((record) => ({
        stepId: record.stepId,
        command: record.command,
        stdoutBytes: record.stdoutBytes,
        stdoutSha256: crypto.createHash("sha256").update(fs.readFileSync(record.stdoutPath)).digest("hex"),
        status: record.parsedPublicResponse.status,
        reason: record.parsedPublicResponse.reason,
      })),
    };
  }
  fs.writeFileSync(
    path.join(EXPERIMENT_DIR, "PUBLIC_STDOUT_SHA256.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
});
