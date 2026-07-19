const assert = require("node:assert/strict");
const ROSTER_A = require("./roster-expectation-a");

const needMix = { output: 2, protection: 7, buff: 1 };
const lowLegacyStrength = runCase(2);
const highLegacyStrength = runCase(8);

assert.deepEqual(
  lowLegacyStrength.frozen.capabilityNeedMix.raw,
  needMix,
  "the frozen roster prediction must retain the Agent's capability mix",
);
assert.equal(
  lowLegacyStrength.frozen.predictedCombatScore,
  highLegacyStrength.frozen.predictedCombatScore,
  "identical capability evidence and need mix must create the same initial prediction",
);
assert.equal(lowLegacyStrength.rebase.equipmentMultiplier, 1.25);
assert.equal(highLegacyStrength.rebase.equipmentMultiplier, 1.25);
assert.equal(
  lowLegacyStrength.rebase.predictedCombatScoreAfter,
  highLegacyStrength.rebase.predictedCombatScoreAfter,
  "legacy composite strength must not change a capability-mix equipment rebase",
);

console.log(JSON.stringify({
  result: "PASS",
  boundedCase: "same capability mix and capability evidence; only legacy composite strength differs",
  capabilityNeedMix: needMix,
  initialPrediction: lowLegacyStrength.frozen.predictedCombatScore,
  equipmentMultiplier: lowLegacyStrength.rebase.equipmentMultiplier,
  lowLegacyStrength,
  highLegacyStrength,
  divergenceAfterEquipment: round(
    highLegacyStrength.rebase.predictedCombatScoreAfter
      - lowLegacyStrength.rebase.predictedCombatScoreAfter,
  ),
  conclusion: {
    initialSwapPredictionUsesCapabilityMix: true,
    frozenMixSurvivesEquipmentChange: true,
    equipmentRebaseMagnitudeStillDependsOnLegacyCompositeStrength: false,
    equipmentRebaseUsesFrozenMixedPredictionProgress: true,
    ACurveChanged: false,
  },
  independentReview: "not_run: deterministic formula-level audit, not a gameplay trace",
}, null, 2));

function runCase(candidateBaseStrength) {
  const candidateTeamIds = ["a", "b", "c", "support"];
  const selected = {
    action: "swap:3:support",
    evidenceScope: "one_member_counterfactual_from_exact_current_team",
    candidateTeamIds,
    candidateBaseStrength,
    candidateEquipmentPower: 100,
    confidence: 0.8,
    capabilityDeltas: {
      output: known(4, 4),
      protection: known(8, 3),
      buff: known(-2, 2),
    },
    traitLevelDelta: 0,
  };
  const frozenResult = ROSTER_A.freezeSelectedPrediction(ROSTER_A.createState(), {
    action: selected.action,
    rosterChangeExpectations: {
      targetNode: "survival_gate",
      baseline: { performanceScore: -0.4 },
      actions: [selected],
    },
    gameState: gameState(candidateTeamIds, "old_blade", 10),
    perceptionProfile: "ordinary",
    cycle: 1,
    capabilityNeedMix: needMix,
  });
  assert(frozenResult.record);

  const rebasedResult = ROSTER_A.rebaseEquipmentExpectation(frozenResult.state, {
    gameStateAfter: gameState(candidateTeamIds, "new_blade", 20),
    currentEquipmentPower: 125,
    cycle: 2,
    source: "focused_capability_mix_equipment_audit",
  });
  assert(rebasedResult.record);

  return {
    legacyCompositeStrength: candidateBaseStrength,
    frozen: {
      predictionCompositionMode: frozenResult.record.predictionCompositionMode,
      capabilityNeedMix: frozenResult.record.capabilityNeedMix,
      weightedCapabilityDelta: frozenResult.record.weightedCapabilityDelta,
      predictedCombatScore: frozenResult.record.predictedCombatScore,
    },
    rebase: {
      equipmentMultiplier: rebasedResult.record.equipmentMultiplier,
      rebaseBasis: rebasedResult.record.rebaseBasis,
      baseExpectedStrength: rebasedResult.record.baseExpectedStrength,
      effectiveExpectedStrength: rebasedResult.record.effectiveExpectedStrength,
      basePredictionProgress: rebasedResult.record.basePredictionProgress,
      adjustedPredictionProgress: rebasedResult.record.adjustedPredictionProgress,
      predictedCombatScoreBefore: rebasedResult.record.predictedCombatScoreBefore,
      predictedCombatScoreAfter: rebasedResult.record.predictedCombatScoreAfter,
      pendingMixAfter: rebasedResult.state.pending.capabilityNeedMix,
    },
  };
}

function known(delta, evidenceCount) {
  return {
    status: "known",
    delta,
    incomingRelativeToScale: delta,
    outgoingRelativeToScale: 0,
    minimumEvidenceCount: evidenceCount,
  };
}

function gameState(teamIds, itemId, attack) {
  return {
    teamSlots: [...teamIds],
    roster: teamIds.map((id) => ({
      id,
      equipment: id === "support"
        ? {
          weapon: {
            id: itemId,
            slot: "weapon",
            rarity: "common",
            equipmentLevel: 1,
            baseStats: { attack },
            affixes: [],
          },
        }
        : {},
    })),
  };
}

function round(value) {
  return Math.round(Number(value) * 10000) / 10000;
}
