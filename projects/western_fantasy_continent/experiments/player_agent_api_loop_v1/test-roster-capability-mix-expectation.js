const assert = require("node:assert/strict");
const ROSTER = require("./roster-change-expectation");
const ROSTER_A = require("./roster-expectation-a");

const selected = {
  action: "swap:3:support",
  evidenceScope: "one_member_counterfactual_from_exact_current_team",
  candidateTeamIds: ["a", "b", "c", "support"],
  candidateBaseStrength: 5,
  candidateEquipmentPower: 100,
  confidence: 0.8,
  baseline: {
    outcome: "loss",
    performanceScore: -0.4,
  },
  capabilityDeltas: {
    output: known(4, 4),
    protection: known(8, 3),
    buff: known(-2, 2),
  },
  traitLevelDelta: 0,
};

const pureOutput = ROSTER.projectCapabilityMix(
  selected,
  -0.4,
  { output: 10, protection: 0, buff: 0 },
);
const pureProtection = ROSTER.projectCapabilityMix(
  selected,
  -0.4,
  { output: 0, protection: 10, buff: 0 },
);
const mixed = ROSTER.projectCapabilityMix(
  selected,
  -0.4,
  { output: 3, protection: 6, buff: 1 },
);

assert.equal(pureOutput.weightedCapabilityDelta, 4);
assert.equal(pureProtection.weightedCapabilityDelta, 8);
assert.equal(mixed.weightedCapabilityDelta, 5.8);
assert(pureProtection.predictedPerformanceScore > mixed.predictedPerformanceScore);
assert(mixed.predictedPerformanceScore > pureOutput.predictedPerformanceScore);
assert.deepEqual(mixed.capabilityNeedMix.raw, { output: 3, protection: 6, buff: 1 });
assert.deepEqual(mixed.capabilityNeedMix.normalized, { output: 0.3, protection: 0.6, buff: 0.1 });

const sameRatio = ROSTER.projectCapabilityMix(
  selected,
  -0.4,
  { output: 1, protection: 2, buff: 0 },
);
const sameRatioScaled = ROSTER.projectCapabilityMix(
  selected,
  -0.4,
  { output: 5, protection: 10, buff: 0 },
);
assert.equal(sameRatio.weightedCapabilityDelta, sameRatioScaled.weightedCapabilityDelta,
  "only the ratio may matter after code normalization");
assert.equal(sameRatio.predictedPerformanceScore, sameRatioScaled.predictedPerformanceScore);

const missingBuff = structuredClone(selected);
missingBuff.capabilityDeltas.buff = {
  status: "unknown",
  delta: null,
  reason: "no accepted buff evidence",
};
const missingProjection = ROSTER.projectCapabilityMix(
  missingBuff,
  -0.4,
  { output: 2, protection: 3, buff: 5 },
);
assert.equal(missingProjection.status, "insufficient_axis_evidence");
assert.equal(missingProjection.predictedPerformanceScore, null);
assert.deepEqual(missingProjection.missingAxes, ["buff"]);

assert.throws(
  () => ROSTER.normalizeCapabilityNeedMix({ output: 0, protection: 0, buff: 0 }),
  /greater than zero/,
);
assert.throws(
  () => ROSTER.normalizeCapabilityNeedMix({ output: 2.5, protection: 5, buff: 0 }),
  /integer/,
);
assert.throws(
  () => ROSTER.normalizeCapabilityNeedMix({ output: 11, protection: 0, buff: 0 }),
  /0 to 10/,
);

const view = {
  targetNode: "survival_gate",
  baseline: { performanceScore: -0.4 },
  actions: [selected],
};
const profileSettlements = ["ordinary", "familiar", "expert"].map((profile) => {
  const frozen = ROSTER_A.freezeSelectedPrediction(ROSTER_A.createState(), {
    action: selected.action,
    rosterChangeExpectations: view,
    gameState: { teamSlots: ["a", "b", "c", "d"], roster: [] },
    perceptionProfile: profile,
    cycle: 1,
    capabilityNeedMix: { output: 2, protection: 7, buff: 1 },
  });
  assert(frozen.record);
  assert.equal(frozen.record.predictionCompositionMode, "projected_from_agent_capability_mix");
  assert.deepEqual(frozen.record.capabilityNeedMix.raw, { output: 2, protection: 7, buff: 1 });
  assert.equal(frozen.record.weightedCapabilityDelta, 6.2);
  assert.equal(frozen.record.predictedCombatScore, 0.344);
  return {
    profile,
    predictedCombatScore: frozen.record.predictedCombatScore,
    expectedLevel: frozen.record.expectedPerception.level,
    predictionConfidence: frozen.record.predictionConfidence,
  };
});
assert.equal(new Set(profileSettlements.map((row) => row.predictedCombatScore)).size, 1,
  "player profile changes perception bands, not the selected capability projection");

console.log(JSON.stringify({
  result: "PASS",
  projections: {
    pureOutput,
    pureProtection,
    mixed,
    missingProjection,
  },
  profileSettlements,
  rule: "Agent supplies coarse need weights; code normalizes, projects, freezes, and later settles A without changing the A curve",
}, null, 2));

function known(delta, evidenceCount) {
  return {
    status: "known",
    delta,
    incomingRelativeToScale: delta,
    outgoingRelativeToScale: 0,
    minimumEvidenceCount: evidenceCount,
  };
}
