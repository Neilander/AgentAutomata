const assert = require("node:assert/strict");
const ROSTER_EXPECTATIONS = require("./roster-change-expectation");
const ROSTER_A = require("./roster-expectation-a");
const ADAPTER = require("../../game_data/map-cognition-v3-event-adapter");
const RUNTIME = require("../../game_data/player-cognition-v3-event-runtime");

const confirmation = confirmationCase();
const geometricCurve = geometricCurveCase();
const equipment = equipmentCase();
const inertia = inertiaCase();

console.log(JSON.stringify({
  result: "PASS",
  confirmation,
  geometricCurve,
  equipment,
  inertia,
  scope: "single-player deterministic program-level precision test",
}, null, 2));

function confirmationCase() {
  const exact = confirmationVariant("actual_exact", 0.57);
  const lowerSameBand = confirmationVariant("actual_lower_same_band", 0.45);
  const higherSameBand = confirmationVariant("actual_higher_same_band", 0.7);
  const lowerCrossBand = confirmationVariant("actual_lower_cross_band", 0.2);
  const higherCrossBand = confirmationVariant("actual_higher_cross_band", 0.9);

  assert.equal(exact.confirmed, true);
  assert.equal(exact.geometricMultiplier, 1);
  assert(exact.confirmationC > 0);
  assert.equal(lowerSameBand.confirmed, true);
  assert.equal(lowerSameBand.mismatchA, 0);
  assert(lowerSameBand.confirmationC > 0 && lowerSameBand.confirmationC < exact.confirmationC);
  assert.equal(higherSameBand.confirmed, true);
  assert.equal(higherSameBand.mismatchA, 0);
  assert(higherSameBand.confirmationC > exact.confirmationC);
  assert.equal(lowerCrossBand.confirmed, false);
  assert.equal(lowerCrossBand.confirmationC, 0);
  assert.equal(lowerCrossBand.geometricMultiplier, 0);
  assert(lowerCrossBand.mismatchA < 0);
  assert.equal(higherCrossBand.confirmed, false);
  assert(higherCrossBand.confirmationC > higherSameBand.confirmationC);
  assert(higherCrossBand.mismatchA > 0);

  const negativeDirectResult = -0.4;
  assert(negativeDirectResult + lowerSameBand.totalExpectationA < 0,
    "confirmation C must not turn an expected failure into a pleasant total result");
  return {
    exact,
    lowerSameBand,
    higherSameBand,
    lowerCrossBand,
    higherCrossBand,
    expectedFailureExampleTotal: Number(
      (negativeDirectResult + lowerSameBand.totalExpectationA).toFixed(4),
    ),
  };
}

function confirmationVariant(id, actualScore) {
  const frozen = freeze({
    predictedScore: 0.57,
    candidateBaseStrength: 5,
    candidateEquipmentPower: 100,
  });
  const gameEvent = eventFromScore(actualScore, "target_gate", 2);
  const resolved = ROSTER_A.resolveChallenge(frozen.state, {
    action: "challenge:target_gate",
    gameStateBefore: candidateGameState("blade_v1", 10),
    gameEvent,
    cycle: 2,
  });
  let cognition = RUNTIME.createState(`confirmation-c:${id}`);
  const eventLog = ADAPTER.buildMapEventLog("challenge:target_gate", gameEvent, { region: "region_1" });
  ROSTER_A.attachSettlement(eventLog, resolved.settlement);
  cognition = RUNTIME.ingestEvents(cognition, eventLog);
  const summary = cognition.trace.filter((row) => row.type === "action_summary").at(-1);
  const formula = summary.expectationDetails.formula;
  return {
    actualScore,
    expectedBand: resolved.settlement.expectedPerception.level,
    actualBand: resolved.settlement.actualPerception.level,
    confirmed: resolved.settlement.confirmed,
    mismatchA: formula.mismatchValue,
    confirmationC: formula.confirmation.value,
    totalExpectationA: summary.expectationEmotion,
    resultRatio: formula.confirmation.resultRatio,
    geometricMultiplier: formula.confirmation.geometricMultiplier,
  };
}

function geometricCurveCase() {
  const rows = [0.5, 0.8, 1, 1.2, 2, 4].map((ratio) => ({
    ratio,
    ...RUNTIME.confirmationGeometricMultiplier(ratio, RUNTIME.DEFAULT_CONFIG.mismatch),
  }));
  const byRatio = new Map(rows.map((row) => [row.ratio, row]));
  assert(close(byRatio.get(0.5).multiplier, 0.3536));
  assert(close(byRatio.get(0.8).multiplier, 0.7155));
  assert.equal(byRatio.get(1).multiplier, 1);
  assert(close(byRatio.get(1.2).multiplier, 1.0954));
  assert(close(byRatio.get(2).multiplier, 1.4142));
  assert.equal(byRatio.get(4).multiplier, 2);
  return rows;
}

function equipmentCase() {
  assert.equal(ROSTER_EXPECTATIONS.effectiveStrength(5, 2), 10,
    "base cognition strength 5 at 200% equipment multiplier must become expected strength 10");
  const frozen = freeze({
    predictedScore: 0,
    candidateBaseStrength: 5,
    candidateEquipmentPower: 100,
  });
  const changedState = candidateGameState("blade_v2", 20);
  const rebased = ROSTER_A.rebaseEquipmentExpectation(frozen.state, {
    gameStateAfter: changedState,
    currentEquipmentPower: 200,
    cycle: 2,
  });
  assert(rebased.record);
  assert.equal(rebased.record.equipmentMultiplier, 2);
  assert.equal(rebased.record.baseExpectedStrength, 5);
  assert.equal(rebased.record.effectiveExpectedStrength, 10);
  assert.equal(rebased.record.predictedCombatScoreAfter, 0.6);
  assert.equal(rebased.state.pending.status, "awaiting_combat",
    "equipment change must update rather than invalidate the pending prediction");
  return {
    baseStrength: rebased.record.baseExpectedStrength,
    equipmentMultiplier: rebased.record.equipmentMultiplier,
    effectiveExpectedStrength: rebased.record.effectiveExpectedStrength,
    predictedScoreBefore: rebased.record.predictedCombatScoreBefore,
    predictedScoreAfter: rebased.record.predictedCombatScoreAfter,
    pendingStatus: rebased.state.pending.status,
  };
}

function inertiaCase() {
  const pending = freeze({
    predictedScore: 0.4,
    candidateBaseStrength: 5,
    candidateEquipmentPower: 100,
  }).record;
  const weak = ROSTER_A.carryPredictionToEncounter(pending, "new_gate");
  assert.equal(weak.expectationWeight, ROSTER_A.NEW_ENCOUNTER_INERTIA_WEIGHT);
  assert.equal(weak.predictedCombatScore, pending.predictedCombatScore);
  assert.equal(weak.candidateBaseStrength, 5);
  assert.equal(weak.encounterInertia.inheritedExpectedStrength, 5);
  assert.equal(weak.encounterInertia.sourceConfidence, 0.7);
  assert.equal(weak.effectivePredictionConfidence, 0.175);
  assert.equal(weak.encounterInertia.rule, "weakly_inherit_previous_encounter");

  const strong = ROSTER_A.carryPredictionToEncounter(pending, "boss_gate", {
    direction: "harder",
    strength: 0.9,
    performanceDelta: 0.3,
    source: "visible_boss_label",
  });
  assert(strong.expectationWeight > weak.expectationWeight);
  assert.equal(strong.predictedCombatScore, 0.1);
  assert.equal(strong.encounterInertia.rule, "visible_signal_overrides_weak_inertia");
  return {
    weakCarry: {
      expectedStrength: weak.candidateBaseStrength,
      predictedScore: weak.predictedCombatScore,
      sourceConfidence: weak.encounterInertia.sourceConfidence,
      effectiveConfidence: weak.effectivePredictionConfidence,
    },
    strongHardSignal: {
      predictedScore: strong.predictedCombatScore,
      expectationWeight: strong.expectationWeight,
      source: strong.encounterInertia.signal.source,
    },
  };
}

function freeze(spec) {
  return ROSTER_A.freezeSelectedPrediction(ROSTER_A.createState(), {
    action: "swap:3:strong",
    rosterChangeExpectations: {
      targetNode: "target_gate",
      baseline: { performanceScore: -0.15 },
      actions: [{
        action: "swap:3:strong",
        candidateTeamIds: ["a", "b", "c", "strong"],
        predictedPerformanceScore: spec.predictedScore,
        candidateBaseStrength: spec.candidateBaseStrength,
        candidateEquipmentPower: spec.candidateEquipmentPower,
        evidenceScope: "focused_test",
        confidence: 0.7,
      }],
    },
    gameState: candidateGameState("blade_v1", 10),
    perceptionProfile: "ordinary",
    cycle: 1,
  });
}

function candidateGameState(itemId, attack) {
  const teamIds = ["a", "b", "c", "strong"];
  return {
    teamSlots: teamIds,
    roster: teamIds.map((id) => ({
      id,
      equipment: id === "strong" ? {
        weapon: {
          id: itemId,
          slot: "weapon",
          rarity: "common",
          equipmentLevel: 1,
          baseStats: { attack },
          affixes: [],
        },
      } : {},
    })),
  };
}

function eventFromScore(score, node, step) {
  const playerRemaining = (score + 1) / 2;
  const enemyRemaining = (1 - score) / 2;
  return {
    node,
    step,
    outcome: score > 0.2 ? "win" : "loss",
    duration: 10,
    teamSizes: { player: 4, enemy: 4 },
    hpScore: { player: playerRemaining * 4, enemy: enemyRemaining * 4 },
    waveSummary: [{ unitCount: 8 }],
    loot: [],
  };
}

function close(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.0002;
}
