"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { runExperiment } = require("./run-autonomous-round");
const { audit } = require("./audit-formal-oracle");

test("isolated agent decisions complete one cognitive round", () => {
  const result = runExperiment();
  assert.equal(result.status, "complete");
  assert.equal(result.pending, null);
  assert.equal(result.summary.attentionStops, 0);
  assert.equal(result.summary.unknownStops, 0);
  assert.equal(result.choiceReplay.placementCards.length, 5);
  assert.equal(result.choiceReplay.roomCards.length, 5);
  assert.equal(result.observedWorldUnchanged, true);
  assert.match(result.protocol.controlAdapter, /start\/advance/);
  assert.equal(result.interactions[0].kind, "start");
  assert.deepEqual(result.interactions[0].response.availableOperations, ["place_die"]);
});

test("driver submits one operation at a time and waits at both random boundaries", () => {
  const result = runExperiment();
  const statuses = result.interactions.map((row) => row.response.status);
  assert.equal(statuses.filter((status) => status === "random").length, 2);
  assert.equal(result.interactions.filter((row) => row.kind === "external_random_observation").length, 2);
  assert.equal(result.interactions.at(-1).response.status, "complete");
  assert.equal(result.interactions.at(-1).response.actionCount, 13);
});

test("all placements use the full probabilistic attention entry", () => {
  const result = runExperiment();
  for (const step of result.choiceReplay.placementCards) {
    assert.equal(step.attention.mode, "external_full_attention");
    assert.ok(step.attention.fullSpaceItemCount >= 153);
    assert.equal(step.attention.noticedCount, 41);
    assert.ok(step.attention.omittedCount >= 112);
  }
  assert.ok(result.choiceReplay.placementCards.slice(1).some((step) => step.attention.carriedCount > 0));
});

test("both rerolls resume only from explicit external observations", () => {
  const result = runExperiment();
  assert.deepEqual(result.summary.randomBoundaries.map((row) => row.resumedBy), [
    "external_observation",
    "external_observation",
  ]);
  assert.deepEqual(result.summary.randomBoundaries.map((row) => row.requestedDieIds), [
    ["r1-gray-0", "r1-white-4"],
    ["r1-gray-0"],
  ]);
});

test("spawn priority exposes a real two-way player choice", () => {
  const result = runExperiment();
  assert.deepEqual(result.choiceReplay.spawnCards, [{
    ...result.choiceReplay.spawnCards[0],
    cardId: "S1",
    shipId: "white-1",
    candidates: ["DP-C1", "DP-C3"],
    chosen: "DP-C1",
    status: "choice",
  }]);
});

test("cognitive driver imports neither formal engine nor fixed one-round fixture", () => {
  const source = fs.readFileSync(path.join(__dirname, "run-autonomous-round.js"), "utf8");
  assert.doesNotMatch(source, /standard-engine|scenario-fixtures|one-round-fixture/);
});

test("separate post-hoc formal audit accepts every action and matches final state", () => {
  assert.equal(audit().result, "PASS");
});
