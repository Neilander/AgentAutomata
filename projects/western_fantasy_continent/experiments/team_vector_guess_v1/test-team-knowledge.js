const assert = require("assert");
const fs = require("fs");
const path = require("path");

const BUILDER = require("./build-team-knowledge");

const artifactFile = path.join(__dirname, "artifacts", "team-vector-knowledge.json");
assert(fs.existsSync(artifactFile), "run build-team-knowledge.js first");
const artifact = JSON.parse(fs.readFileSync(artifactFile, "utf8"));

const generated = BUILDER.generateTeams(50, "team-vector-knowledge-v1");
assert.equal(generated.length, 50);
assert.equal(new Set(generated.map((team) => team.fingerprint)).size, 50);
assert(generated.some((team) => new Set(team.roles).size < 4), "sampling must allow repeated roles");
assert(generated.some((team) => new Set(team.roles).size === 1), "all-same-role edge case must be covered");

assert.equal(artifact.teams.length, 50);
assert.equal(artifact.opponents.length, 6);
assert.equal(artifact.axes.length, 9);
assert.equal(artifact.knowledge.cells.length, 300);
assert.equal(artifact.heldOutValidation.cells.length, 300);
assert.equal(artifact.knowledge.vectors.length, 50);
assert.equal(artifact.heldOutValidation.vectors.length, 50);
assert(artifact.knowledge.rawSignalCount > artifact.knowledge.visibleSignalCount);
assert(artifact.knowledge.visibleSignalCount > 0);
assert.equal(artifact.audits.stableSlotIdentity, true);
assert.equal(artifact.audits.reorderedPair.treatedAsDistinct, true);
assert(artifact.audits.reorderedPair.maxVectorDifference > 0.05);

for (const cell of artifact.knowledge.cells) {
  assert.equal(cell.subject.type, "ordered_team");
  assert.equal(cell.subject.slots.length, 4);
  assert.equal(cell.environment.type, "fixed_opponent_team");
  assert.equal(cell.behavior.kind, "fight_with_ordered_formation");
  assert(["win", "loss"].includes(cell.result.outcome));
  assert.equal(typeof cell.signalSummary.rawAxes.damage, "number");
  assert.equal(typeof cell.receivedKnowledge.receivedStatementCount, "number");
  assert(!Object.hasOwn(cell, "rawSignals"), "full raw signals must not bloat tracked artifacts");
}

for (const vector of artifact.knowledge.vectors) {
  assert.equal(vector.vector.length, artifact.axes.length);
  assert(vector.vector.every((value) => Number.isFinite(value) && value >= -1 && value <= 1));
  assert.equal(vector.coordinateOrder.join("|"), artifact.axes.map((axis) => axis.id).join("|"));
  for (const axis of artifact.axes) {
    assert.equal(vector.axes[axis.id].contextCount, 6);
    assert(vector.axes[axis.id].confidence > 0 && vector.axes[axis.id].confidence <= 1);
  }
}

console.log(JSON.stringify({
  pass: true,
  teams: artifact.teams.length,
  battles: artifact.knowledge.cells.length + artifact.heldOutValidation.cells.length,
  repeatedRoleTeams: artifact.audits.repeatedRoleTeamCount,
  allSameRoleTeams: artifact.audits.allSameRoleTeamCount,
  reorderedMaxVectorDifference: artifact.audits.reorderedPair.maxVectorDifference,
}, null, 2));
