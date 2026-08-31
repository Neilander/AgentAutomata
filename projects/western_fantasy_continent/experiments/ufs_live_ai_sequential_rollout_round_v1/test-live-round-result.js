"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const result = JSON.parse(fs.readFileSync(
  path.join(__dirname, "evidence", "paired-round-result.json"),
  "utf8",
));

test("the sequential replay reaches the paired boundary without stale-anchor execution", () => {
  assert.equal(result.rolling.boundary.pending, "next_round_roll");
  assert.equal(result.static.boundary.pending, "next_round_roll");
  assert.equal(result.rolling.rejectedOperations, 0);
  assert.equal(result.static.rejectedOperations, 0);
  assert.equal(result.comparison.sequentialRepairCheck.aaTargetPresentImmediatelyBeforeAa, true);
  assert.equal(result.comparison.sequentialRepairCheck.aaChangedFormalShips, true);
  assert.equal(result.comparison.sequentialRepairCheck.predictedAaTargetEndpointMatchedFormal, true);
  assert.equal(result.comparison.sequentialRepairCheck.researchAnchorRevalidatedAfterRealAa, "supported");
  assert.equal(result.comparison.sequentialRepairCheck.researchExecutedOnlyAfterRevalidation, true);
  assert.equal(result.comparison.sequentialRepairCheck.staleSnapshotBenefitClaim, false);
});

test("the paired result preserves resources and records the complete trade-off", () => {
  assert.equal(result.comparison.sameResourceOutcome, true);
  assert.equal(result.comparison.rollingDelta.mothershipRowsAvoided, 1);
  assert.equal(result.comparison.rollingDelta.maxShipRowReduction, 0);
  assert.equal(result.comparison.rollingDelta.totalShipRowsReduction, 1);
  assert.equal(result.comparison.rollingDelta.activeShipCountReduction, -1);
  assert.equal(result.comparison.rollingDelta.whiteShipCountReduction, -1);
});
