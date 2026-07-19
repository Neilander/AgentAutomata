const ENTITY_IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");
const EQUIPMENT = require("../../game_data/equipment-runtime");

const SCHEMA = "roster_change_expectation_v1";
const POSITION_LEVEL_TO_PERFORMANCE = 0.12;
const TRAIT_LEVEL_WEIGHT = 0.35;
const MAX_HISTORY = 32;
const CAPABILITY_AXES = ["output", "protection", "buff"];

function createState() {
  return {
    schema: SCHEMA,
    observations: [],
  };
}

function ensureState(input) {
  if (!input || input.schema !== SCHEMA) return createState();
  return {
    schema: SCHEMA,
    observations: Array.isArray(input.observations) ? structuredClone(input.observations) : [],
  };
}

function recordChallenge(stateInput, input = {}) {
  const state = ensureState(stateInput);
  const event = input.record?.gameEvent || input.gameEvent || {};
  const teamIds = [...(input.teamIds || input.gameStateBefore?.teamSlots || [])].filter(Boolean);
  const cognition = currentCognition(input.entityImpressionState);
  const observation = {
    id: input.record?.entityImpressionUpdate?.reportId
      || `roster-expectation:${event.node || "unknown"}:${state.observations.length + 1}`,
    order: state.observations.length + 1,
    node: event.node || String(input.record?.action || "").split(":")[1] || "unknown",
    region: input.region || inferRegion(event.node),
    outcome: input.record?.outcome || event.outcome || "unknown",
    performanceScore: combatPerformanceScore(event),
    equippedPower: finiteOrNull(event.gearBefore ?? input.equippedPower),
    contextTags: visibleEncounterTags(event),
    teamIds,
    teamFingerprint: fingerprint(teamIds),
    equipmentFingerprint: equipmentFingerprint(input.gameStateBefore, teamIds)
      || input.equipmentFingerprint
      || null,
    characterSnapshot: teamIds.map((id) => cognition.get(id)).filter(Boolean),
  };
  state.observations.push(observation);
  if (state.observations.length > MAX_HISTORY) {
    state.observations.splice(0, state.observations.length - MAX_HISTORY);
  }
  return { state, observation };
}

function buildExpectations(input = {}) {
  const state = ensureState(input.state);
  const currentTeamIds = [...(input.currentTeamIds || [])];
  const allowedSwapActions = (input.allowedActions || []).filter((action) => String(action).startsWith("swap:"));
  const cognition = currentCognition(input.entityImpressionState);
  const targetNode = input.targetNode || selectTargetNode(state.observations, input.visibleNodeIds || []);
  const nodeHistory = state.observations.filter((row) => row.node === targetNode);
  const targetHistory = nodeHistory.filter((row) => comparablePower(row.equippedPower, input.currentPower));
  const currentFingerprint = fingerprint(currentTeamIds);
  const currentEquipmentFingerprint = equipmentFingerprint(input.gameState, currentTeamIds)
    || input.currentEquipmentFingerprint
    || null;
  const exactCurrentHistory = targetHistory.filter((row) => row.teamFingerprint === currentFingerprint
    && comparableEquipment(row.equipmentFingerprint, currentEquipmentFingerprint)
    && comparableCognition(row, currentTeamIds, cognition));
  const baseline = robustRecentObservation(exactCurrentHistory) || null;
  const contextTags = baseline?.contextTags || [];
  const requireCapabilityMix = Boolean(input.requireCapabilityMix);

  const actions = allowedSwapActions.map((action) => {
    const [, slotText, incomingId] = String(action).split(":");
    const slotIndex = Number(slotText);
    const outgoingId = currentTeamIds[slotIndex] || null;
    const candidateTeamIds = currentTeamIds.slice();
    if (Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < candidateTeamIds.length) {
      candidateTeamIds[slotIndex] = incomingId;
    }
    const candidateFingerprint = fingerprint(candidateTeamIds);
    const candidateEquipmentFingerprint = equipmentFingerprint(input.gameState, candidateTeamIds)
      || input.candidateEquipmentFingerprints?.[candidateFingerprint]
      || null;
    const candidatePower = equipmentPower(input.gameState, candidateTeamIds) ?? input.currentPower;
    const candidateBaseStrength = teamBaseStrength(candidateTeamIds, cognition);
    const exactCandidateHistory = nodeHistory.filter((row) => row.teamFingerprint === candidateFingerprint
      && comparablePower(row.equippedPower, candidatePower)
      && comparableEquipment(row.equipmentFingerprint, candidateEquipmentFingerprint)
      && comparableCognition(row, candidateTeamIds, cognition));
    const exactPrediction = robustRecentObservation(exactCandidateHistory);
    const incoming = cognition.get(incomingId);
    const outgoing = cognition.get(outgoingId);

    if (exactPrediction) {
      const exactExpectedOutcome = outcomeFromExactHistory(exactPrediction);
      return {
        action,
        outgoingId,
        incomingId,
        candidateTeamIds,
        candidateBaseStrength,
        candidateEquipmentPower: candidatePower,
        evidenceScope: "exact_team_and_encounter",
        evidenceCount: exactCandidateHistory.length,
        expectedChange: comparePerformance(exactPrediction.performanceScore, baseline?.performanceScore),
        expectedOutcome: exactExpectedOutcome,
        predictedPerformanceScore: exactPrediction.performanceScore,
        exactObservedWinRate: exactPrediction.weightedWinRate,
        performanceInterpretation: exactPrediction.weightedWinRate === 0 && exactPrediction.performanceScore > 0.08
          ? "favorable_hp_margin_did_not_produce_a_win"
          : "outcome_and_hp_margin_are_consistent",
        priorFailureTransfer: exactPrediction.weightedWinRate < 0.5 ? "exact_failure_applies" : "exact_history_applies",
        reason: "this exact team already has visible evidence in this encounter",
      };
    }

    if (!baseline) {
      return unknown(action, outgoingId, incomingId, candidateTeamIds, "no comparable encounter history");
    }
    if (!incoming || !outgoing) {
      return unknown(action, outgoingId, incomingId, candidateTeamIds,
        !incoming ? "incoming character has no accepted combat cognition" : "outgoing character has no accepted combat cognition");
    }

    const strengthDelta = round(incoming.position - outgoing.position);
    const capabilityDeltas = capabilityDeltaByAxis(incoming, outgoing);
    const trait = traitFitDelta(incoming, outgoing, contextTags);
    const effectiveLevelDelta = round(strengthDelta + TRAIT_LEVEL_WEIGHT * trait.delta);
    const legacyPredictedPerformanceScore = clamp(round(
      baseline.performanceScore + effectiveLevelDelta * POSITION_LEVEL_TO_PERFORMANCE,
    ), -1, 1);
    const expectedChange = requireCapabilityMix
      ? "awaiting_agent_capability_mix"
      : changeFromLevelDelta(effectiveLevelDelta);
    const expectedOutcome = requireCapabilityMix
      ? "awaiting_agent_capability_mix"
      : outcomeFromScore(legacyPredictedPerformanceScore);
    const predictedPerformanceScore = requireCapabilityMix
      ? null
      : legacyPredictedPerformanceScore;
    return {
      action,
      outgoingId,
      incomingId,
      candidateTeamIds,
      candidateBaseStrength,
      candidateEquipmentPower: candidatePower,
      evidenceScope: "one_member_counterfactual_from_exact_current_team",
      evidenceCount: 0,
      baseline: {
        teamIds: baseline.teamIds,
        outcome: baseline.outcome,
        performanceScore: baseline.performanceScore,
      },
      strengthDelta,
      capabilityDeltas,
      capabilitySelectionRule: "Agent根据当前可见问题独立选择输出、保护或增益差；这些差值不自动平均或相加",
      capabilityScenarioPredictions: capabilityScenarioPredictions(
        baseline.performanceScore,
        capabilityDeltas,
        trait.delta,
      ),
      contextRelevantTraitDomains: trait.contextDomains,
      comparedTraitDomains: trait.comparedDomains,
      unknownTraitDomains: trait.unknownDomains,
      traitEvidenceStatus: trait.evidenceStatus,
      traitLevelDelta: trait.delta,
      effectiveLevelDelta,
      expectedChange,
      expectedOutcome,
      predictedPerformanceScore,
      priorFailureTransfer: requireCapabilityMix
        ? "defer_until_agent_capability_mix"
        : transferFailure(baseline, effectiveLevelDelta, predictedPerformanceScore),
      confidence: counterfactualConfidence(incoming, outgoing, baseline, trait),
      reason: "the prior result remains scoped to its exact team; this action is re-estimated from the incoming-versus-outgoing cognition difference",
      legacyPredictionAudit: requireCapabilityMix ? {
        effectiveLevelDelta,
        predictedPerformanceScore: legacyPredictedPerformanceScore,
        usedForAgentDecision: false,
        usedForA: false,
      } : null,
    };
  });

  return {
    schema: "roster_change_expectation_view_v1",
    targetNode,
    baseline: baseline ? {
      evidenceScope: baseline.teamFingerprint === currentFingerprint
        ? "exact_current_team_and_encounter"
        : "nearest_encounter_history",
      teamIds: baseline.teamIds,
      outcome: baseline.outcome,
      performanceScore: baseline.performanceScore,
      equippedPower: baseline.equippedPower,
      contextTags,
    } : null,
    actions,
    rule: "failure belongs to the observed team and encounter; independent output/protection/buff cognition is shown for need-based Agent choice, while the existing A prediction remains isolated on its previously validated settlement path",
    calibration: {
      positionLevelToPerformance: POSITION_LEVEL_TO_PERFORMANCE,
      traitLevelWeight: TRAIT_LEVEL_WEIGHT,
      status: "provisional_ordinal_prediction_mapping",
    },
  };
}

function currentCognition(state) {
  const strength = new Map(ENTITY_IMPRESSIONS.listCurrentStrengthCognition(state || {}).map((row) => [row.subject.id, row]));
  const capabilities = new Map(
    ENTITY_IMPRESSIONS.listCurrentCapabilityCognition(state || {})
      .map((row) => [row.subject.id, row.capabilities]),
  );
  const result = new Map();
  for (const [id, row] of strength) {
    const traits = ENTITY_IMPRESSIONS.retrieveImpressions(state, id)
      .filter((belief) => belief.kind === "trait" && belief.relation === "synthesizes_trait_revalidation")
      .map((belief) => ({
        domain: belief.claim.domain,
        level: belief.claim.level,
        currentSalient: Boolean(belief.claim.currentSalient),
        observationCount: Number(belief.observationCount || 0),
      }));
    result.set(id, {
      id,
      position: Number(row.position || 0),
      level: Number(row.level || 0),
      evidenceCount: Number(row.evidenceCount || 0),
      traits,
      capabilities: structuredClone(capabilities.get(id) || {}),
    });
  }
  return result;
}

function capabilityDeltaByAxis(incoming, outgoing) {
  return Object.fromEntries(CAPABILITY_AXES.map((axis) => {
    const incomingAxis = incoming.capabilities?.[axis];
    const outgoingAxis = outgoing.capabilities?.[axis];
    if (!incomingAxis || !outgoingAxis) {
      return [axis, {
        status: "unknown",
        delta: null,
        reason: "incoming or outgoing character lacks accepted evidence on this capability axis",
      }];
    }
    return [axis, {
      status: "known",
      delta: round(Number(incomingAxis.position || 0) - Number(outgoingAxis.position || 0)),
      incomingRelativeToScale: Number(incomingAxis.relativeToScale || 0),
      outgoingRelativeToScale: Number(outgoingAxis.relativeToScale || 0),
      minimumEvidenceCount: Math.min(
        Number(incomingAxis.evidenceCount || 0),
        Number(outgoingAxis.evidenceCount || 0),
      ),
    }];
  }));
}

function capabilityScenarioPredictions(baselineScore, capabilityDeltas, traitLevelDelta = 0) {
  return Object.fromEntries(CAPABILITY_AXES.map((axis) => {
    const row = capabilityDeltas?.[axis];
    if (!row || row.status !== "known" || !Number.isFinite(Number(row.delta))) {
      return [axis, {
        status: "unknown",
        predictedPerformanceScore: null,
        expectedChange: "unknown",
        expectedOutcome: "unknown",
      }];
    }
    const effectiveLevelDelta = round(Number(row.delta) + TRAIT_LEVEL_WEIGHT * Number(traitLevelDelta || 0));
    const predictedPerformanceScore = clamp(round(
      Number(baselineScore || 0) + effectiveLevelDelta * POSITION_LEVEL_TO_PERFORMANCE,
    ), -1, 1);
    return [axis, {
      status: "known",
      effectiveLevelDelta,
      predictedPerformanceScore,
      expectedChange: changeFromLevelDelta(effectiveLevelDelta),
      expectedOutcome: outcomeFromScore(predictedPerformanceScore),
    }];
  }));
}

function normalizeCapabilityNeedMix(input) {
  if (input == null) return null;
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("capabilityNeedMix must be an object");
  }
  const raw = {};
  for (const axis of CAPABILITY_AXES) {
    const value = Number(input[axis] ?? 0);
    if (!Number.isInteger(value) || value < 0 || value > 10) {
      throw new Error(`capabilityNeedMix.${axis} must be an integer from 0 to 10`);
    }
    raw[axis] = value;
  }
  const total = CAPABILITY_AXES.reduce((sum, axis) => sum + raw[axis], 0);
  if (total <= 0) throw new Error("capabilityNeedMix total must be greater than zero");
  return {
    raw,
    normalized: Object.fromEntries(CAPABILITY_AXES.map((axis) => [
      axis,
      round(raw[axis] / total, 4),
    ])),
    total,
    granularity: "agent integer weights 0..10 normalized by code",
  };
}

function projectCapabilityMix(selected, baselineScore, mixInput) {
  const mix = normalizeCapabilityNeedMix(mixInput);
  if (!mix) {
    return {
      status: "missing_mix",
      predictedPerformanceScore: null,
      missingAxes: [],
      capabilityNeedMix: null,
    };
  }
  const missingAxes = CAPABILITY_AXES.filter((axis) => (
    mix.raw[axis] > 0
    && (
      selected?.capabilityDeltas?.[axis]?.status !== "known"
      || !Number.isFinite(Number(selected.capabilityDeltas[axis].delta))
    )
  ));
  if (missingAxes.length) {
    return {
      status: "insufficient_axis_evidence",
      predictedPerformanceScore: null,
      missingAxes,
      capabilityNeedMix: mix,
    };
  }
  const weightedCapabilityDelta = round(CAPABILITY_AXES.reduce((sum, axis) => (
    sum + mix.normalized[axis] * Number(selected.capabilityDeltas[axis].delta || 0)
  ), 0));
  const contextTraitAdjustment = round(
    TRAIT_LEVEL_WEIGHT * Number(selected.traitLevelDelta || 0),
  );
  const effectiveLevelDelta = round(weightedCapabilityDelta + contextTraitAdjustment);
  const predictedPerformanceScore = clamp(round(
    Number(baselineScore || 0) + effectiveLevelDelta * POSITION_LEVEL_TO_PERFORMANCE,
  ), -1, 1);
  const axisEvidenceConfidence = round(CAPABILITY_AXES.reduce((sum, axis) => {
    if (mix.normalized[axis] <= 0) return sum;
    const evidence = Number(selected.capabilityDeltas[axis].minimumEvidenceCount || 0);
    return sum + mix.normalized[axis] * clamp(evidence / 4, 0.2, 1);
  }, 0));
  return {
    status: "projected_from_agent_capability_mix",
    capabilityNeedMix: mix,
    weightedCapabilityDelta,
    contextTraitAdjustment,
    effectiveLevelDelta,
    predictedPerformanceScore,
    expectedChange: changeFromLevelDelta(effectiveLevelDelta),
    expectedOutcome: outcomeFromScore(predictedPerformanceScore),
    priorFailureTransfer: transferFailure(
      { outcome: selected?.baseline?.outcome || "unknown" },
      effectiveLevelDelta,
      predictedPerformanceScore,
    ),
    axisEvidenceConfidence,
    missingAxes: [],
  };
}

function robustRecentObservation(rows) {
  if (!rows.length) return null;
  const recent = rows.slice(-5).reverse();
  const weights = [1, 0.7, 0.5, 0.35, 0.25];
  const totalWeight = recent.reduce((sum, _, index) => sum + weights[index], 0);
  const performanceScore = round(recent.reduce((sum, row, index) => (
    sum + Number(row.performanceScore || 0) * weights[index]
  ), 0) / totalWeight);
  const weightedWinRate = round(recent.reduce((sum, row, index) => (
    sum + (row.outcome === "win" ? weights[index] : 0)
  ), 0) / totalWeight);
  return {
    ...structuredClone(recent[0]),
    performanceScore,
    weightedWinRate,
    evidenceCount: recent.length,
  };
}

function outcomeFromExactHistory(observation) {
  if (observation.weightedWinRate >= 0.67) return "plausible_success";
  if (observation.weightedWinRate <= 0.33) return "likely_failure";
  return "uncertain_near_boundary";
}

function traitFitDelta(incoming, outgoing, contextTags) {
  const contextDomains = relevantDomains(contextTags);
  const incomingTraits = new Map((incoming.traits || []).map((row) => [row.domain, Number(row.level || 0)]));
  const outgoingTraits = new Map((outgoing.traits || []).map((row) => [row.domain, Number(row.level || 0)]));
  const comparedDomains = contextDomains.filter((domain) => incomingTraits.has(domain) && outgoingTraits.has(domain));
  const unknownDomains = contextDomains.filter((domain) => !incomingTraits.has(domain) || !outgoingTraits.has(domain));
  const delta = comparedDomains.reduce((sum, domain) => (
    sum + (incomingTraits.get(domain) || 0) - (outgoingTraits.get(domain) || 0)
  ), 0);
  return {
    contextDomains,
    comparedDomains,
    unknownDomains,
    evidenceStatus: contextDomains.length === 0 ? "not_applicable"
      : unknownDomains.length === 0 ? "complete"
        : comparedDomains.length > 0 ? "partial" : "unknown",
    delta: round(delta),
  };
}

function relevantDomains(tags) {
  const values = new Set();
  if (tags.includes("many_targets")) {
    values.add("area_damage");
    values.add("control");
  }
  if (tags.includes("single_target")) {
    values.add("single_target_damage");
    values.add("sustained_damage");
  }
  if (tags.includes("survival_pressure")) {
    values.add("healing");
    values.add("shielding");
    values.add("durability");
    values.add("control");
  }
  return [...values];
}

function visibleEncounterTags(event) {
  const enemyCount = Math.max(
    Number(event.teamSizes?.enemy || 0),
    (event.waveSummary || []).reduce((sum, row) => sum + Number(row.unitCount || 0), 0),
  );
  const playerSize = Math.max(1, Number(event.teamSizes?.player || 1));
  const playerRemaining = clamp(Number(event.hpScore?.player || 0) / playerSize, 0, 1);
  const tags = [];
  if (enemyCount >= 5) tags.push("many_targets");
  if (enemyCount > 0 && enemyCount <= 2) tags.push("single_target");
  if (event.outcome === "loss" || playerRemaining < 0.45) tags.push("survival_pressure");
  return tags;
}

function combatPerformanceScore(event) {
  const playerSize = Number(event.teamSizes?.player);
  const enemySize = Number(event.teamSizes?.enemy);
  const playerHp = Number(event.hpScore?.player);
  const enemyHp = Number(event.hpScore?.enemy);
  if (playerSize > 0 && enemySize > 0 && Number.isFinite(playerHp) && Number.isFinite(enemyHp)) {
    return round(clamp(playerHp / playerSize, 0, 1) - clamp(enemyHp / enemySize, 0, 1));
  }
  return event.outcome === "win" ? 1 : event.outcome === "loss" ? -1 : 0;
}

function selectTargetNode(observations, visibleNodeIds) {
  const visible = new Set(visibleNodeIds);
  const latestVisibleFailure = observations.slice().reverse()
    .find((row) => row.outcome === "loss" && (!visible.size || visible.has(row.node)));
  const latestVisibleObservation = observations.slice().reverse()
    .find((row) => !visible.size || visible.has(row.node));
  return latestVisibleFailure?.node
    || latestVisibleObservation?.node
    || visibleNodeIds[0]
    || observations.at(-1)?.node
    || null;
}

function transferFailure(baseline, levelDelta, predictedScore) {
  if (baseline.outcome !== "loss") return "no_failure_baseline";
  if (predictedScore > 0) return "failure_expectation_reopened_by_material_cognition_change";
  if (levelDelta > 0) return "failure_still_likely_but_less_certain";
  return "failure_expectation_carries_for_no_improvement";
}

function counterfactualConfidence(incoming, outgoing, baseline, trait) {
  const evidence = Math.min(Number(incoming.evidenceCount || 0), Number(outgoing.evidenceCount || 0));
  const evidenceConfidence = clamp(evidence / 4, 0.2, 1);
  const baselineConfidence = clamp(Number(baseline.evidenceCount || 1) / 3, 0.33, 1);
  const traitCoverage = trait.contextDomains.length === 0
    ? 1
    : 0.65 + 0.35 * trait.comparedDomains.length / trait.contextDomains.length;
  return round(evidenceConfidence * baselineConfidence * traitCoverage);
}

function comparePerformance(candidate, baseline) {
  if (!Number.isFinite(Number(baseline))) return "unknown";
  const delta = Number(candidate) - Number(baseline);
  return delta >= 0.25 ? "materially_better"
    : delta >= 0.08 ? "slightly_better"
      : delta <= -0.25 ? "materially_worse"
        : delta <= -0.08 ? "slightly_worse" : "similar";
}

function changeFromLevelDelta(delta) {
  return delta >= 2.5 ? "materially_better"
    : delta >= 0.75 ? "slightly_better"
      : delta <= -2.5 ? "materially_worse"
        : delta <= -0.75 ? "slightly_worse" : "similar";
}

function outcomeFromScore(score) {
  return score > 0.08 ? "plausible_success"
    : score >= -0.08 ? "uncertain_near_boundary"
      : "likely_failure";
}

function unknown(action, outgoingId, incomingId, candidateTeamIds, reason) {
  return {
    action,
    outgoingId,
    incomingId,
    candidateTeamIds,
    evidenceScope: "insufficient_player_knowledge",
    expectedChange: "unknown",
    expectedOutcome: "unknown",
    predictedPerformanceScore: null,
    priorFailureTransfer: "do_not_generalize_without_character_evidence",
    reason,
  };
}

function inferRegion(node) { return String(node || "").startsWith("r2_") ? "region_2" : "region_1"; }
function comparablePower(observed, current) {
  if (!Number.isFinite(Number(current)) || observed == null) return true;
  const oldValue = Number(observed);
  const newValue = Number(current);
  return Math.abs(newValue - oldValue) / Math.max(1, Math.abs(oldValue)) <= 0.1;
}

function comparableCognition(observation, teamIds, cognition) {
  const snapshot = new Map((observation.characterSnapshot || []).map((row) => [row.id, row]));
  const domains = relevantDomains(observation.contextTags || []);
  return teamIds.every((id) => {
    const before = snapshot.get(id);
    const current = cognition.get(id);
    if (!before || !current || Math.abs(Number(current.position || 0) - Number(before.position || 0)) > 1.25) return false;
    const beforeTraits = new Map((before.traits || []).map((row) => [row.domain, Number(row.level || 0)]));
    const currentTraits = new Map((current.traits || []).map((row) => [row.domain, Number(row.level || 0)]));
    return domains.every((domain) => comparableTraitBelief(beforeTraits, currentTraits, domain));
  });
}

function comparableTraitBelief(beforeTraits, currentTraits, domain) {
  const beforeKnown = beforeTraits.has(domain);
  const currentKnown = currentTraits.has(domain);
  if (!beforeKnown && !currentKnown) return true;
  if (beforeKnown && currentKnown) {
    return Math.abs(currentTraits.get(domain) - beforeTraits.get(domain)) <= 1.25;
  }
  const knownLevel = beforeKnown ? beforeTraits.get(domain) : currentTraits.get(domain);
  return Math.abs(knownLevel) <= 1.25;
}

function equipmentFingerprint(gameState, teamIds) {
  if (!gameState || !Array.isArray(gameState.roster)) return null;
  const roster = new Map(gameState.roster.map((unit) => [unit.id, unit]));
  return teamIds.map((id) => {
    const equipment = roster.get(id)?.equipment || {};
    const slots = Object.keys(equipment).sort().map((slot) => `${slot}:${itemBuildFingerprint(equipment[slot])}`);
    return `${id}[${slots.join(",")}]`;
  }).join("|");
}

function itemBuildFingerprint(item = {}) {
  const baseStats = Object.entries(item.baseStats || {}).sort(([a], [b]) => a.localeCompare(b));
  const affixes = (item.affixes || []).map((row) => ({
    stat: row.stat || row.id || null,
    level: finiteOrNull(row.level),
    value: finiteOrNull(row.value),
  })).sort((a, b) => String(a.stat).localeCompare(String(b.stat))
    || Number(a.level || 0) - Number(b.level || 0)
    || Number(a.value || 0) - Number(b.value || 0));
  return JSON.stringify({
    slot: item.slot || null,
    rarity: item.rarity || null,
    equipmentLevel: finiteOrNull(item.equipmentLevel),
    baseStats,
    affixes,
  });
}

function comparableEquipment(observed, current) {
  if (!observed || !current) return true;
  return observed === current;
}

function equipmentPower(gameState, teamIds) {
  if (!gameState || !Array.isArray(gameState.roster)) return null;
  return EQUIPMENT.teamEquipmentScore(gameState.roster, teamIds);
}

function teamBaseStrength(teamIds, cognition) {
  const values = (teamIds || [])
    .map((id) => finiteOrNull(cognition.get(id)?.position))
    .filter((value) => value != null);
  if (!values.length || values.length !== (teamIds || []).length) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function effectiveStrength(baseStrength, equipmentMultiplier = 1) {
  const base = finiteOrNull(baseStrength);
  const multiplier = finiteOrNull(equipmentMultiplier);
  if (base == null || multiplier == null) return null;
  return round(base * multiplier);
}

function finiteOrNull(value) {
  return value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
}
function fingerprint(ids) { return [...ids].join("|"); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function round(value, digits = 3) { return Number(Number(value || 0).toFixed(digits)); }

module.exports = {
  SCHEMA,
  POSITION_LEVEL_TO_PERFORMANCE,
  TRAIT_LEVEL_WEIGHT,
  createState,
  ensureState,
  recordChallenge,
  buildExpectations,
  visibleEncounterTags,
  combatPerformanceScore,
  equipmentFingerprint,
  equipmentPower,
  effectiveStrength,
  normalizeCapabilityNeedMix,
  projectCapabilityMix,
  capabilityScenarioPredictions,
  CAPABILITY_AXES,
};
