"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const transcript = JSON.parse(fs.readFileSync(path.join(root, "machine-transcript.json"), "utf8"));

function readResponse(entry) {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, entry.responseFile), "utf8"));
  return artifact.response || artifact;
}

test("action counts and command order are monotonic", () => {
  assert.deepEqual(transcript.entries.map((entry) => entry.actionCount), [0,1,2,3,4,5,6]);
  assert.deepEqual(transcript.entries.map((entry) => entry.command), ["start","advance","advance","random","advance","advance","advance"]);
});

test("random occurs only after the explicit random boundary", () => {
  const before = readResponse(transcript.entries[2]);
  const after = readResponse(transcript.entries[3]);
  assert.equal(before.status, "random");
  assert.equal(before.pending.type, "white_reroll");
  assert.deepEqual(before.availableOperations, ["submit_random_observation"]);
  assert.equal(after.lastAction.type, "submit_random_observation");
  assert.deepEqual(after.lastAction.values, {"r1-gray-0":2,"r1-gray-1":3,"r1-white-4":1});
});

test("each advance response matches its single choice file", () => {
  for (const entry of transcript.entries.filter((item) => item.command === "advance")) {
    const choice = JSON.parse(fs.readFileSync(path.join(root, entry.choiceFile), "utf8"));
    const response = readResponse(entry);
    assert.deepEqual(response.lastAction, choice, entry.choiceFile);
  }
});

test("terminal attention_stop seals the attempt with no post-terminal command", () => {
  const last = transcript.entries.at(-1);
  const response = readResponse(last);
  assert.equal(transcript.sealed, true);
  assert.equal(response.status, "attention_stop");
  assert.equal(response.reason, "next_endpoint_not_noticed");
  assert.deepEqual(response.availableOperations, []);
  assert.equal(last.seq, transcript.entries.length - 1);
});

test("thought log covers every response boundary in order", () => {
  const lines = fs.readFileSync(path.join(root, "thought-log.jsonl"), "utf8").trim().split(/\r?\n/).map(JSON.parse);
  assert.deepEqual(lines.map((entry) => entry.step), [0,1,2,3,4,5,6]);
  for (const entry of lines) {
    assert.ok(entry.noticed);
    assert.ok(Array.isArray(entry.explicitUnknowns));
    assert.ok(Array.isArray(entry.macroNeeds));
    assert.ok(Array.isArray(entry.legalCandidates));
    assert.ok(typeof entry.counterfactual === "string" && entry.counterfactual.length > 20);
    assert.ok(entry.finalOperation);
    assert.ok(typeof entry.workingMemoryAfter === "string" && entry.workingMemoryAfter.length > 20);
  }
});
