const ENTITY_IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");
const ROSTER_EXPECTATIONS = require("./roster-change-expectation");

const SCHEMA = "roster_prediction_a_state_v1";
const SETTLEMENT_SCHEMA = "roster_prediction_a_settlement_v1";
const DENOMINATOR_FLOOR = 0.1;
const MAX_HISTORY = 64;
const NEW_ENCOUNTER_INERTIA_WEIGHT = 0.25;
const STRONG_ENCOUNTER_SIGNAL_THRESHOLD = 0.7;
const STRONG_ENCOUNTER_EXPECTATION_WEIGHT = 0.7;

function createState() {
  return {
    schema: SCHEMA,
    nextSequence: 1,
    pending: null,
    history: [],
  };
}

function ensureState(input) {
  if (!input || input.schema !== SCHEMA) return createState();
  return {
    schema: SCHEMA,
    nextSequence: Math.max(1, Number(input.nextSequence || 1)),
    pending: input.pending ? structuredClone(input.pending) : null,
    history: Array.isArray(input.history) ? structuredClone(input.history).slice(-MAX_HISTORY) : [],
  };
}

function freezeSelectedPrediction(stateInput, input = {}) {
  const state = ensureState(stateInput);
  const action = String(input.action || "");
  if (!action.startsWith("swap:")) return { state, record: null };

  if (state.pending) {
    archive(state, {
      ...state.pending,
      status: "superseded",
      resolvedAtCycle: Number(input.cycle || 0),
      resolutionReason: "a newer roster decision replaced the untested prediction",
    });
    state.pending = null;
  }

  const view = input.rosterChangeExpectations || {};
  const selected = (view.actions || []).find((row) => row.action === action);
  const baselineScore = finiteOrNull(view.baseline?.performanceScore);
  const predictedScore = finiteOrNull(selected?.predictedPerformanceScore);
  if (!selected || baselineScore == null || predictedScore == null || !view.targetNode) {
    return { state, record: null };
  }

  const perceptionProfile = normalizeProfile(input.perceptionProfile);
  const expectedImprovement = relativeImprovement(baselineScore, predictedScore);
  const candidateTeamIds = [...(selected.candidateTeamIds || [])];
  const record = {
    schema: "roster_prediction_a_record_v1",
    id: `roster-prediction:${state.nextSequence}`,
    status: "awaiting_combat",
    source: "roster_prediction",
    selectedAtCycle: Number(input.cycle || 0),
    selectedAction: action,
    targetNode: view.targetNode,
    candidateTeamIds,
    candidateTeamFingerprint: fingerprint(candidateTeamIds),
    candidateEquipmentFingerprint: ROSTER_EXPECTATIONS.equipmentFingerprint(input.gameState, candidateTeamIds),
    perceptionProfile,
    denominatorFloor: DENOMINATOR_FLOOR,
    baselineCombatScore: baselineScore,
    basePredictedCombatScore: predictedScore,
    predictedCombatScore: predictedScore,
    candidateBaseStrength: finiteOrNull(selected.candidateBaseStrength),
    baseCandidateEquipmentPower: finiteOrNull(
      selected.candidateEquipmentPower
      ?? ROSTER_EXPECTATIONS.equipmentPower(input.gameState, candidateTeamIds),
    ),
    candidateEquipmentPower: finiteOrNull(
      selected.candidateEquipmentPower
      ?? ROSTER_EXPECTATIONS.equipmentPower(input.gameState, candidateTeamIds),
    ),
    expectedImprovementRaw: round(expectedImprovement),
    expectedPerception: perceiveImprovement(expectedImprovement, perceptionProfile),
    predictionEvidenceScope: selected.evidenceScope || "unknown",
    predictionConfidence: finiteOrNull(selected.confidence),
    effectivePredictionConfidence: finiteOrNull(selected.confidence),
    expectationWeight: 1,
    equipmentAdjustments: [],
  };
  state.nextSequence += 1;
  state.pending = record;
  return { state, record: structuredClone(record) };
}

function resolveChallenge(stateInput, input = {}) {
  const state = ensureState(stateInput);
  let pending = state.pending;
  const action = String(input.action || "");
  if (!pending || !action.startsWith("challenge:")) {
    return { state, settlement: null, resolution: null };
  }

  const node = input.gameEvent?.node || action.split(":")[1] || null;
  const teamIds = [...(input.gameStateBefore?.teamSlots || [])];
  const equipmentFingerprint = ROSTER_EXPECTATIONS.equipmentFingerprint(input.gameStateBefore, teamIds);
  const invalidReason = fingerprint(teamIds) !== pending.candidateTeamFingerprint
    ? "different_team"
    : null;

  if (invalidReason) {
    const resolution = {
      ...pending,
      status: "invalidated",
      resolvedAtCycle: Number(input.cycle || 0),
      resolutionReason: invalidReason,
      observedChallenge: { node, teamIds, equipmentFingerprint },
    };
    state.pending = null;
    archive(state, resolution);
    return { state, settlement: null, resolution: structuredClone(resolution) };
  }

  if (!sameNullable(equipmentFingerprint, pending.candidateEquipmentFingerprint)) {
    const rebased = rebaseEquipmentExpectation(state, {
      gameStateAfter: input.gameStateBefore,
      cycle: input.cycle,
      source: "challenge_time_equipment_rebase",
    });
    pending = rebased.state.pending;
  }

  const originalTargetNode = pending.targetNode;
  if (node !== pending.targetNode) {
    pending = carryPredictionToEncounter(pending, node, input.encounterSignal);
    state.pending = pending;
  }

  const actualScore = ROSTER_EXPECTATIONS.combatPerformanceScore(input.gameEvent || {});
  const actualImprovement = relativeImprovement(pending.baselineCombatScore, actualScore);
  const actualPerception = perceiveImprovement(actualImprovement, pending.perceptionProfile);
  const mismatchInput = actualPerception.intensity - pending.expectedPerception.intensity;
  const confirmed = actualPerception.level === pending.expectedPerception.level;
  const settlement = {
    schema: SETTLEMENT_SCHEMA,
    id: pending.id,
    source: "roster_prediction",
    status: "resolved",
    selectedAction: pending.selectedAction,
    targetNode: node,
    predictionTargetNode: originalTargetNode,
    perceptionProfile: pending.perceptionProfile,
    denominatorFloor: pending.denominatorFloor,
    baselineCombatScore: pending.baselineCombatScore,
    predictedCombatScore: pending.predictedCombatScore,
    actualCombatScore: actualScore,
    expectedImprovementRaw: pending.expectedImprovementRaw,
    actualImprovementRaw: round(actualImprovement),
    expectedPerception: pending.expectedPerception,
    actualPerception,
    mismatchInput,
    confirmed,
    predictionConfidence: pending.predictionConfidence,
    effectivePredictionConfidence: pending.effectivePredictionConfidence
      ?? pending.predictionConfidence,
    expectationWeight: pending.expectationWeight,
    resolutionMode: pending.encounterInertia ? "new_encounter_inertia" : "same_encounter",
    encounterInertia: pending.encounterInertia || null,
    equipmentAdjustments: pending.equipmentAdjustments || [],
    selectedAtCycle: pending.selectedAtCycle,
    resolvedAtCycle: Number(input.cycle || 0),
  };
  const resolution = { ...pending, ...settlement };
  state.pending = null;
  archive(state, resolution);
  return { state, settlement: structuredClone(settlement), resolution: structuredClone(resolution) };
}

function rebaseEquipmentExpectation(stateInput, input = {}) {
  const state = ensureState(stateInput);
  const pending = state.pending;
  if (!pending) return { state, record: null };

  const gameStateAfter = input.gameStateAfter || input.gameState;
  const teamIds = [...(gameStateAfter?.teamSlots || pending.candidateTeamIds || [])];
  if (fingerprint(teamIds) !== pending.candidateTeamFingerprint) {
    return { state, record: null };
  }

  const equipmentFingerprint = ROSTER_EXPECTATIONS.equipmentFingerprint(gameStateAfter, teamIds);
  if (sameNullable(equipmentFingerprint, pending.candidateEquipmentFingerprint)) {
    return { state, record: null };
  }

  const basePower = finiteOrNull(pending.baseCandidateEquipmentPower);
  const currentPower = finiteOrNull(
    input.currentEquipmentPower
    ?? ROSTER_EXPECTATIONS.equipmentPower(gameStateAfter, teamIds),
  );
  const equipmentMultiplier = equipmentMultiplierFromPower(basePower, currentPower);
  const baseStrength = finiteOrNull(pending.candidateBaseStrength);
  const effectiveExpectedStrength = ROSTER_EXPECTATIONS.effectiveStrength(baseStrength, equipmentMultiplier);
  const baseScore = finiteOrNull(pending.basePredictedCombatScore) ?? pending.predictedCombatScore;
  const baseProgress = (Number(baseScore) + 1) / 2;
  const strengthScoreDelta = baseStrength != null && effectiveExpectedStrength != null
    ? (effectiveExpectedStrength - baseStrength) * ROSTER_EXPECTATIONS.POSITION_LEVEL_TO_PERFORMANCE
    : null;
  const adjustedProgress = equipmentMultiplier == null
    ? baseProgress
    : clamp(baseProgress * equipmentMultiplier, 0, 1);
  const predictedCombatScore = clamp(round(
    strengthScoreDelta == null ? adjustedProgress * 2 - 1 : baseScore + strengthScoreDelta,
  ), -1, 1);
  const expectedImprovement = relativeImprovement(pending.baselineCombatScore, predictedCombatScore);
  const record = {
    cycle: Number(input.cycle || 0),
    source: input.source || "explicit_equipment_action",
    baseEquipmentPower: basePower,
    currentEquipmentPower: currentPower,
    equipmentMultiplier,
    baseExpectedStrength: baseStrength,
    effectiveExpectedStrength,
    predictedCombatScoreBefore: pending.predictedCombatScore,
    predictedCombatScoreAfter: predictedCombatScore,
    status: equipmentMultiplier == null ? "kept_prior_missing_power_baseline" : "recalculated",
  };

  state.pending = {
    ...pending,
    candidateEquipmentFingerprint: equipmentFingerprint,
    candidateEquipmentPower: currentPower,
    predictedCombatScore,
    expectedImprovementRaw: round(expectedImprovement),
    expectedPerception: perceiveImprovement(expectedImprovement, pending.perceptionProfile),
    equipmentAdjustments: [...(pending.equipmentAdjustments || []), record],
  };
  return { state, record: structuredClone(record) };
}

function carryPredictionToEncounter(pendingInput, node, signalInput = null) {
  const pending = structuredClone(pendingInput);
  const signal = normalizeEncounterSignal(signalInput);
  const strongSignal = signal && signal.strength >= STRONG_ENCOUNTER_SIGNAL_THRESHOLD;
  const direction = signal?.direction === "easier" ? 1 : signal?.direction === "harder" ? -1 : 0;
  const scoreDelta = strongSignal
    ? direction * Number(signal.performanceDelta ?? 0.2 * signal.strength)
    : 0;
  const predictedCombatScore = clamp(round(pending.predictedCombatScore + scoreDelta), -1, 1);
  const expectedImprovement = relativeImprovement(pending.baselineCombatScore, predictedCombatScore);
  const expectationWeight = strongSignal
    ? STRONG_ENCOUNTER_EXPECTATION_WEIGHT
    : NEW_ENCOUNTER_INERTIA_WEIGHT;
  const sourceConfidence = finiteOrNull(
    pending.effectivePredictionConfidence
    ?? pending.predictionConfidence,
  ) ?? 0.5;
  return {
    ...pending,
    targetNode: node,
    predictedCombatScore,
    expectedImprovementRaw: round(expectedImprovement),
    expectedPerception: perceiveImprovement(expectedImprovement, pending.perceptionProfile),
    expectationWeight,
    effectivePredictionConfidence: round(sourceConfidence * expectationWeight),
    encounterInertia: {
      fromEncounter: pending.targetNode,
      toEncounter: node,
      rule: strongSignal ? "visible_signal_overrides_weak_inertia" : "weakly_inherit_previous_encounter",
      signal,
      scoreDelta: round(scoreDelta),
      inheritedExpectedStrength: pending.candidateBaseStrength ?? null,
      sourceConfidence: round(sourceConfidence),
      effectiveConfidence: round(sourceConfidence * expectationWeight),
    },
  };
}

function equipmentMultiplierFromPower(basePowerInput, currentPowerInput) {
  const basePower = finiteOrNull(basePowerInput);
  const currentPower = finiteOrNull(currentPowerInput);
  if (basePower == null || currentPower == null || basePower <= 0) return null;
  return round(clamp(currentPower / basePower, 0.25, 3));
}

function normalizeEncounterSignal(input) {
  if (!input || !["harder", "easier"].includes(input.direction)) return null;
  return {
    direction: input.direction,
    strength: clamp(input.strength, 0, 1),
    performanceDelta: finiteOrNull(input.performanceDelta),
    source: input.source || "visible_encounter_signal",
  };
}

function attachSettlement(eventLogInput, settlement) {
  const eventLog = eventLogInput;
  if (!settlement) return eventLog;
  const summary = eventLog.find((row) => row.type === "action_summary" && row.expectation?.phase === "close");
  if (!summary) throw new Error(`roster prediction settlement ${settlement.id} has no action_summary boundary`);
  summary.rosterExpectationSettlement = structuredClone(settlement);
  return eventLog;
}

function relativeImprovement(baselineScore, nextScore, denominatorFloor = DENOMINATOR_FLOOR) {
  const baselineProgress = (Number(baselineScore) + 1) / 2;
  const nextProgress = (Number(nextScore) + 1) / 2;
  return (nextProgress - baselineProgress) / Math.max(baselineProgress, denominatorFloor);
}

function perceiveImprovement(rawImprovement, profileInput) {
  const profile = normalizeProfile(profileInput);
  const perceived = ENTITY_IMPRESSIONS.perceivePositive(Number(rawImprovement || 0) * 100, profile);
  return {
    profile,
    rawImprovement: round(rawImprovement),
    rawPercent: perceived.rawPercent,
    cappedPercent: perceived.cappedPercent,
    level: perceived.level,
    intensity: perceived.level / 9,
    label: perceived.label,
  };
}

function archive(state, record) {
  state.history.push(structuredClone(record));
  if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);
}

function normalizeProfile(profile) {
  return ENTITY_IMPRESSIONS.POSITIVE_BANDS[profile] ? profile : "ordinary";
}

function sameNullable(a, b) {
  if (a == null && b == null) return true;
  return a === b;
}

function finiteOrNull(value) {
  return value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
}
function fingerprint(ids) { return [...(ids || [])].join("|"); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

module.exports = {
  SCHEMA,
  SETTLEMENT_SCHEMA,
  DENOMINATOR_FLOOR,
  createState,
  ensureState,
  freezeSelectedPrediction,
  resolveChallenge,
  rebaseEquipmentExpectation,
  carryPredictionToEncounter,
  attachSettlement,
  relativeImprovement,
  perceiveImprovement,
  equipmentMultiplierFromPower,
  NEW_ENCOUNTER_INERTIA_WEIGHT,
  STRONG_ENCOUNTER_SIGNAL_THRESHOLD,
};
