"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const result = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts", "closed-loop-results.json"), "utf8"));

assert.equal(result.schema, "semantic_solution_closed_loop_v0");
assert.equal(result.boundary.formalPlayerAgentModified, false);
assert.equal(result.boundary.opponentsAbsentFromPriorTraining, true);
assert.equal(result.boundary.hiddenTruthUsedForSelection, false);
assert.equal(result.boundary.causalVerificationUsesOrdinaryPerceptionAndRealStructuredEventMatcher, true);
assert.equal(result.parameters.recallLimit, 8);
assert.equal(result.parameters.mindToyLimit, 3);
assert(result.corpus.episodeCount >= 20, "need enough naturally failed sealed episodes");
assert.equal(Object.keys(result.methods).length, 7);
assert.equal(result.parameters.availableTeamLimit, 16);
assert(result.learningAudit.maximumRecallCount <= result.parameters.recallLimit);
assert(result.learningAudit.maximumMindToyOptionCount <= result.parameters.mindToyLimit);
assert(result.methods.full_closed_loop.firstChoiceHiddenWinRate >= 0);
assert(result.methods.full_closed_loop.firstChoiceHiddenWinRate <= 1);
assert(result.sampleEpisodes.every((row) => row.selectionTraces.every((trace) => trace.mindToyOptions.length <= 3)));

console.log(JSON.stringify({
  pass: true,
  episodes: result.corpus.episodeCount,
  full: result.methods.full_closed_loop,
  learningAudit: result.learningAudit,
}, null, 2));
