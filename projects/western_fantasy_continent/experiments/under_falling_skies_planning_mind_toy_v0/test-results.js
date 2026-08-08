"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "artifacts", "planning-results.json");
const result = JSON.parse(fs.readFileSync(file, "utf8"));

assert.equal(result.schema, "ufs_planning_experiment_results_v0");
assert.equal(result.boundary.frontendUsed, false);
assert.equal(result.boundary.formalPlayerAgentModified, false);
assert.equal(result.semanticSpace.dimensions, 768);
assert.equal(result.protocol.methods.length, 4);
assert.equal(result.summary.cells.length, 12);
assert.equal(result.sampleTraces.length, 3);
assert.ok(result.sampleTraces.every((trace) => trace.decisions.length > 0));
assert.ok(result.sampleTraces.every((trace) => trace.decisions.every((decision) => decision.plans.length === 3)));
assert.ok(result.sampleTraces.every((trace) => trace.decisions.every((decision) => decision.plans.every((plan) => plan.firstTopCandidates.length <= 3))));

console.log(JSON.stringify({
  status: "PASS",
  cells: result.summary.cells.length,
  samples: result.sampleTraces.length,
  comparisons: result.summary.comparisons,
}, null, 2));
