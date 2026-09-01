"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const evidence = JSON.parse(fs.readFileSync(
  path.join(__dirname, "evidence", "machine-replay.json"),
  "utf8",
));

assert.equal(evidence.singleRoundGatePassed, true);
assert.equal(evidence.threeRoundRunCompleted, true);
assert.equal(evidence.rounds.length, 3);
assert.ok(evidence.rounds.every((round) => round.gate.pass));
assert.ok(evidence.rounds.every((round) => round.randomReplans.length >= 1));
assert.ok(evidence.rounds.every((round) => round.boundaryAudit.inspectedAtSafeBoundary));
assert.ok(evidence.rounds.every((round) => (
  round.planningEvents.every((event) => event.candidates.length >= 1 && event.candidates.length <= 3)
)));
assert.ok(evidence.rounds.every((round) => (
  round.actions.filter((action) => action.source === "automatic_multicutpoint_controller")
    .every((action) => action.imaginationEvidence.imagined === true)
)));
assert.equal(evidence.claims.benefitOrWinRateEstablished, false);

const summary = {
  status: "PASS",
  singleRoundGatePassed: true,
  threeRoundRunCompleted: true,
  rounds: evidence.rounds.map((round) => ({
    round: round.round,
    gate: round.gate.pass,
    planningEvents: round.gate.counts.planningEvents,
    candidatesImagined: round.gate.counts.candidatesImagined,
    randomReplans: round.randomReplans.length,
    formal: round.boundaryAudit.formal,
  })),
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
