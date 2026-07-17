const DEFAULT_CONFIG = Object.freeze({
  initialEmotion: 38,
  receiveThreshold: 0.08,
  process: {
    decisionEffortValue: 0.04,
    reactiveEffortValue: 0.08,
    verificationEffortValue: 0.06,
    mechanicalTimeDecayPerSecond: 0.018,
  },
  learning: {
    firstAlpha: 0.55,
    repeatAlpha: 0.24,
    confidenceStep: 0.18,
  },
  mismatch: {
    positiveScale: 0.5,
    negativeScale: 0.8,
    positivePower: 1,
    negativePower: 1,
    confirmationConstant: 0.1,
    confirmationPositivePower: 0.5,
    confirmationNegativePower: 1.5,
    confirmationMaxMultiplier: 2,
  },
  longHorizon: {
    failureWakePowerGrowth: 0.3,
  },
  salienceByType: {
    action_start: 0.45,
    damage: 0.5,
    heal: 0.58,
    shield: 0.58,
    shieldBreak: 0.72,
    death: 0.9,
    skill: 0.58,
    movement: 0.35,
    targeting: 0.35,
    status: 0.52,
    combat_result: 0.95,
    loot_outcome: 0.72,
    loot: 0.92,
    character_unlock: 1,
    team_experiment_result: 0.9,
    action_summary: 0.75,
  },
});

function createState(seed = "event-player", configInput = {}) {
  const config = mergeConfig(configInput);
  return {
    schema: "player_cognition_event_state_v3",
    seed,
    config,
    emotion: {
      value: config.initialEmotion,
      minimum: config.initialEmotion,
      processTotal: 0,
      acquiredTotal: 0,
      expectationTotal: 0,
    },
    knowledge: [],
    expectationLedger: [],
    goals: [
      { id: "grow_and_progress", objectiveValue: 1, subjectiveValue: 0.35, progress: 0 },
      { id: "discover_new_capabilities", objectiveValue: 0.85, subjectiveValue: 0.39, progress: 0 },
    ],
    activeGoalId: "grow_and_progress",
    hypotheses: [],
    failureMemories: [],
    affordanceExperiments: [],
    trace: [],
  };
}

function ingestEvents(stateInput, events) {
  const state = structuredClone(stateInput);
  const rows = annotateAttentionCompetition(events).sort((a, b) => Number(a.time || 0) - Number(b.time || 0));
  for (const event of rows) ingestEvent(state, event);
  return state;
}

function annotateAttentionCompetition(events) {
  const rows = structuredClone(events || []);
  const zones = new Map();
  for (const event of rows) {
    if (event.presentation?.visible === false || !event.presentation?.attentionZone) continue;
    const key = event.presentation.attentionZone;
    if (!zones.has(key)) zones.set(key, []);
    zones.get(key).push(event);
  }
  for (const zone of zones.values()) {
    for (const event of zone) {
      const start = Number(event.time || 0);
      const duration = Math.max(0.05, Number(event.presentation?.renderEvidence?.animationSeconds || 0.4));
      const end = start + duration;
      const count = zone.filter((other) => {
        const otherStart = Number(other.time || 0);
        const otherDuration = Math.max(0.05, Number(other.presentation?.renderEvidence?.animationSeconds || 0.4));
        return otherStart < end && start < otherStart + otherDuration;
      }).length;
      const share = 1 / Math.pow(Math.max(1, count), 0.55);
      event.presentation.competitorCount = count;
      event.presentation.attentionShare = round(share);
    }
  }
  return rows;
}

function ingestEvent(state, rawEvent) {
  const event = normalizeEvent(rawEvent);
  const before = round(state.emotion.value);
  const reception = receiveSignal(event, state);
  if (!reception.accepted) {
    state.trace.push({
      eventId: event.id,
      time: event.time,
      type: event.type,
      accepted: false,
      H: reception.H,
      HComponents: reception.components || null,
      reason: reception.reason,
      emotionBefore: before,
      emotionAfter: before,
    });
    return;
  }

  if (event.process) applyProcess(state, event.process);
  const pattern = knowledgePattern(event);
  const matched = matchKnowledge(state.knowledge, pattern);
  const expectedUtility = expectationForEvent(state, event, matched);
  const actualUtility = utilityOf(event);
  const appraisal = appraiseEvent(state, event, matched);
  const directR = event.directResult === false ? 0 : actualUtility * reception.H * appraisal.goalWeight * appraisal.freshness;
  const mismatch = resolveMismatch(state, event, expectedUtility, actualUtility, reception.H, appraisal);
  const hypothesisEvidence = collectHypothesisEvidence(state, event);
  const processDelta = processEmotionOf(event, state.config) + hypothesisEvidence.verifyCount * state.config.process.verificationEffortValue;
  const emotionDelta = processDelta + directR + mismatch.value;

  applyEmotion(state, processDelta, directR, mismatch.value);
  const goalDelta = updateGoalProgress(state, event);

  const trace = {
    eventId: event.id,
    time: event.time,
    type: event.type,
    accepted: true,
    H: reception.H,
    HComponents: reception.components,
    tuple: {
      subject: event.subject,
      environment: event.environment,
      behavior: event.behavior,
      result: event.result,
    },
    knowledgeBefore: matched ? summarizeKnowledge(matched) : null,
    expectedUtility: round(expectedUtility.value),
    expectationSource: expectedUtility.source,
    expectationDetails: mismatch.details || expectedUtility.details || null,
    actualUtility: round(actualUtility),
    appraisal,
    processEmotion: round(processDelta),
    acquiredEmotion: round(directR),
    expectationEmotion: round(mismatch.value),
    mismatchStatus: mismatch.status,
    emotionDelta: round(emotionDelta),
    emotionBefore: before,
    emotionAfter: round(state.emotion.value),
    goalDelta,
    hypothesisEvidence: hypothesisEvidence.ids,
    hypothesisVerification: hypothesisEvidence.rows,
    EVerify: hypothesisEvidence.verifyCount,
    learningOrder: "feedback_then_update",
  };

  const knowledgeAfter = event.learn === false ? matched : updateKnowledge(state, pattern, event, actualUtility);
  trace.knowledgeAfter = summarizeKnowledge(knowledgeAfter);
  if (event.result.kind === "combat_loss") applyFailureLearning(state, event, pattern);
  if (event.result.kind === "combat_win") resolveFailureLearning(state, pattern, event);
  state.trace.push(trace);
  updateAffordanceExperiments(state, event);
}

function updateAffordanceExperiments(state, event) {
  if (event.result.kind === "character_unlock") {
    const character = String(event.result.character || "").trim();
    if (!character) return;
    const heroId = character.startsWith("hero_") ? character : `hero_${character}`;
    if (state.affordanceExperiments.some((row) => row.heroId === heroId)) return;
    state.affordanceExperiments.push({
      id: `team-experiment:${heroId}`,
      kind: "new_character_swap",
      heroId,
      status: "available",
      sourceEventId: event.id,
      selectedAction: null,
      combatEvidence: null,
    });
    return;
  }
  if (event.result.kind === "team_changed") {
    const heroId = event.result.heroId;
    const experiment = state.affordanceExperiments.find((row) => row.heroId === heroId && row.status === "available");
    if (!experiment) return;
    experiment.status = "awaiting_combat";
    experiment.selectedAction = event.behavior?.key || null;
    experiment.swapEventId = event.id;
    const hypothesisId = `verify-${experiment.id}`;
    if (!state.hypotheses.some((row) => row.id === hypothesisId)) {
      state.hypotheses.push({
        id: hypothesisId,
        origin: "evaluator",
        status: "pending",
        action: null,
        problem: `${heroId} has joined the active team but its combat effect is unknown`,
        cause: "the next visible combat can test the changed team",
        resultKind: "team_experiment_contribution",
        settleOnEventKind: "team_experiment_result",
        target: heroId,
        evidence: [],
      });
    }
    experiment.combatHypothesisId = hypothesisId;
    return;
  }
  if (event.result.kind === "team_experiment_result") {
    const experiment = state.affordanceExperiments.find((row) => row.id === event.result.experimentId && row.status === "awaiting_combat");
    if (!experiment) return;
    experiment.status = "resolved";
    experiment.combatEvidence = {
      eventId: event.id,
      node: event.result.node,
      outcome: event.result.outcome,
      heroPresent: event.result.heroPresent !== false,
      hypothesisId: experiment.combatHypothesisId || null,
    };
  }
}

function applyDecision(stateInput, decision) {
  const state = structuredClone(stateInput);
  if (decision?.goalId && state.goals.some((goal) => goal.id === decision.goalId)) state.activeGoalId = decision.goalId;
  const chain = Array.isArray(decision?.reasoningChain) ? decision.reasoningChain.filter((step) => step?.kind && step?.evidence) : [];
  const validation = validateDecisionChain(chain, decision);
  const process = { decisionCount: validation.EDecision, reactiveCount: 0, mechanicalSeconds: 0 };
  applyProcess(state, process);
  const processDelta = processEmotionOf({ process });
  applyEmotion(state, processDelta, 0, 0);
  const hypothesis = decision?.hypothesis && validation.hypothesisValid
    ? createDecisionHypothesis(state, decision)
    : null;
  state.trace.push({
    eventId: decision?.id || `decision:${state.trace.length + 1}`,
    time: Number(decision?.time || 0),
    type: "decision",
    accepted: true,
    H: null,
    HComponents: null,
    tuple: {
      subject: { id: "player", role: "player" },
      environment: decision?.environment || {},
      behavior: { kind: "choose_action", key: decision?.action || "none" },
      result: { kind: "action_selected", action: decision?.action || null },
    },
    alternatives: decision?.alternatives || [],
    reasoningChain: validation.validSteps,
    decisionValidation: validation.details,
    activeGoalId: state.activeGoalId,
    choiceMode: decision?.choiceMode || "goal_pursuit",
    processEmotion: round(processDelta),
    EDecision: validation.EDecision,
    EVerify: 0,
    acquiredEmotion: 0,
    expectationEmotion: 0,
    emotionDelta: round(processDelta),
    emotionBefore: round(state.emotion.value - processDelta),
    emotionAfter: round(state.emotion.value),
    hypothesisId: hypothesis?.id || null,
    learningOrder: "decision_before_action",
  });
  return state;
}

function validateDecisionChain(chain, decision) {
  const byKind = new Map(chain.map((step) => [step.kind, step]));
  const comparisonValid = Boolean(byKind.get("comparison") && (decision?.alternatives || []).length >= 1);
  const hypothesisValid = Boolean(
    decision?.hypothesis
    && byKind.get("goal")
    && (byKind.get("knowledge") || byKind.get("evidence"))
    && byKind.get("affordance")
    && comparisonValid
    && byKind.get("hypothesis")
  );
  const validKinds = hypothesisValid
    ? new Set(["goal", "knowledge", "evidence", "affordance", "comparison", "hypothesis"])
    : new Set(comparisonValid ? ["comparison"] : []);
  const validSteps = chain.filter((step) => validKinds.has(step.kind));
  return {
    EDecision: hypothesisValid ? 4 : comparisonValid ? 1 : 0,
    hypothesisValid,
    validSteps,
    details: {
      comparisonValid,
      hypothesisValid,
      mode: hypothesisValid ? "problem_evidence_behavior_hypothesis" : comparisonValid ? "simple_comparison" : "no_valid_decision_chain",
    },
  };
}

function createDecisionHypothesis(state, decision) {
  const verificationScope = decision.hypothesis.verificationScope === "next_combat"
    ? "next_combat"
    : "current_action";
  if (state.hypotheses.some((row) => row.id === decision.hypothesis.id)) {
    throw new Error(`duplicate hypothesis id: ${decision.hypothesis.id}`);
  }
  const hypothesis = {
    id: decision.hypothesis.id || `hypothesis:${state.hypotheses.length + 1}`,
    origin: "player",
    status: "pending",
    action: verificationScope === "current_action" ? decision.action : null,
    problem: decision.hypothesis.problem || "",
    cause: decision.hypothesis.cause || "",
    resultKind: decision.hypothesis.resultKind || "combat_win",
    target: decision.hypothesis.target || "",
    targetCondition: normalizeTargetCondition(decision.hypothesis.targetCondition),
    verificationScope,
    settleOnEventKind: verificationScope === "next_combat" ? "team_experiment_result" : null,
    evidence: [],
  };
  state.hypotheses.push(hypothesis);
  return hypothesis;
}

function applyProcess(state, process) {
  const config = state.config.process;
  const decision = Math.max(0, Number(process.decisionCount) || 0);
  const reactive = Math.max(0, Number(process.reactiveCount) || 0);
  const mechanicalSeconds = Math.max(0, Number(process.mechanicalSeconds) || 0);
  process._emotion = decision * config.decisionEffortValue
    + reactive * config.reactiveEffortValue
    - mechanicalSeconds * config.mechanicalTimeDecayPerSecond;
}

function processEmotionOf(event) {
  return round(Number(event.process?._emotion) || 0);
}

function receiveSignal(event, stateOrConfig) {
  const state = stateOrConfig?.config ? stateOrConfig : null;
  const config = state?.config || stateOrConfig;
  if (!event.presentation.visible) return { accepted: false, H: 0, reason: "not_visible" };
  const salience = config.salienceByType[event.type] ?? 0.45;
  const channels = [
    event.presentation.hasSource,
    event.presentation.hasTarget,
    event.presentation.hasNumber || event.presentation.hasHealthDelta || event.presentation.hasAnimation,
  ];
  const channelClarity = 0.4 + channels.filter(Boolean).length / channels.length * 0.6;
  const renderEvidence = event.presentation.renderEvidence || null;
  const visualStrength = renderEvidence
    ? visualStrengthFromRenderEvidence(renderEvidence)
    : 1;
  const competition = clamp(Number(event.presentation.attentionShare ?? 1), 0.12, 1);
  const perceptual = channelClarity * (0.55 + 0.45 * visualStrength) * competition;
  const causal = event.presentation.hasSource && event.behavior.key ? 1 : event.presentation.hasSource ? 0.72 : 0.45;
  const goal = goalRelevance(event, state);
  const H = round(salience * perceptual * causal * goal);
  return {
    accepted: H >= config.receiveThreshold,
    H,
    components: {
      salience: round(salience),
      channelClarity: round(channelClarity),
      visualStrength: round(visualStrength),
      competition: round(competition),
      competitorCount: Number(event.presentation.competitorCount || 1),
      perceptual: round(perceptual),
      causal: round(causal),
      goal: round(goal),
      presentationContract: event.presentation.contract || "adapter_event",
    },
    reason: H >= config.receiveThreshold ? "received" : "below_threshold",
  };
}

function visualStrengthFromRenderEvidence(evidence) {
  const size = clamp(Number(evidence.fontPx || 0) / 16, 0.3, 1);
  const color = ({ default: 0.68, fire: 0.9, poison: 0.82, heal: 0.8, shield: 0.82, purple: 0.9 })[evidence.colorToken] || 0.68;
  const motion = evidence.moving ? clamp(Number(evidence.animationSeconds || 0) / 0.9, 0.45, 1) : 0.35;
  return clamp((size + color + motion) / 3, 0.25, 1);
}

function goalRelevance(event, state) {
  const semantic = ["combat_result", "loot_outcome", "loot", "character_unlock", "action_summary"].includes(event.type)
    ? 1
    : ["damage", "death", "heal", "shield", "shieldBreak"].includes(event.type)
      ? 0.82
      : ["skill", "status"].includes(event.type) ? 0.68 : 0.55;
  if (!state?.goals?.length) return semantic;
  const selectedGoal = state.goals.find((goal) => goal.id === state.activeGoalId);
  const active = selectedGoal ? { value: Number(selectedGoal.objectiveValue || 0) + Number(selectedGoal.subjectiveValue || 0), goal: selectedGoal } : state.goals.reduce((best, goal) => {
    const value = Number(goal.objectiveValue || 0) + Number(goal.subjectiveValue || 0);
    return value > best.value ? { value, goal } : best;
  }, { value: 0, goal: null });
  const motivation = clamp(active.value / 2, 0.35, 1);
  return semantic * motivation;
}

function expectationForEvent(state, event, matched) {
  if (event.settleExpectation === false) return { value: 0, source: "observation_only" };
  if (event.rosterExpectationSettlement) {
    closeSuppressedActionLedger(state, event);
    return {
      value: Number(event.rosterExpectationSettlement.expectedPerception?.intensity || 0),
      source: "roster_prediction",
      details: event.rosterExpectationSettlement,
    };
  }
  if (event.expectation?.phase === "open") {
    const value = matched ? expectedKnowledgeUtility(matched, event) : 0;
    state.expectationLedger.push({
      key: event.expectation.key,
      openedAt: event.time,
      expectedUtility: value,
      confidence: matched?.confidence || 0,
      source: matched ? "knowledge_ledger" : "unknown_ledger",
      pattern: knowledgePattern(event),
      deadline: event.expectation.deadline || "action_end",
      status: "pending",
    });
    return { value, source: matched ? "knowledge_opened" : "unknown_opened" };
  }
  if (event.expectation?.phase === "accumulate") {
    const value = matched ? expectedKnowledgeUtility(matched, event) : 0;
    let pending = [...state.expectationLedger].reverse().find((row) => row.key === event.expectation.key && row.status === "pending");
    if (!pending) {
      pending = {
        key: event.expectation.key,
        openedAt: event.time,
        expectedUtility: 0,
        expectedOccurrences: 0,
        opportunities: 0,
        confidence: 0,
        pattern: knowledgePattern(event),
        deadline: event.expectation.deadline || "learned_probability_horizon",
        status: "pending",
      };
      state.expectationLedger.push(pending);
    }
    pending.eventId = event.id;
    pending.opportunities += 1;
    pending.expectedUtility += value;
    pending.expectedOccurrences += Number(matched?.estimatedProbability || 0);
    pending.confidence = Math.max(pending.confidence, Number(matched?.confidence || 0));
    return {
      value: pending.expectedUtility,
      source: matched ? "probability_snapshot" : "unknown_probability_snapshot",
      ledger: pending,
    };
  }
  if (event.expectation?.phase === "close_group") {
    const pending = state.expectationLedger.filter((row) => row.key === event.expectation.key && row.status === "pending");
    for (const row of pending) {
      row.status = "resolved";
      row.resolvedAt = event.time;
    }
    return {
      value: pending.reduce((sum, row) => sum + row.expectedUtility, 0),
      source: pending.some((row) => row.confidence > 0) ? "probability_ledger" : "unknown_probability_ledger",
    };
  }
  if (event.expectation?.phase === "close") {
    const pending = [...state.expectationLedger].reverse().find((row) => row.key === event.expectation.key && row.status === "pending");
    if (!pending) return { value: matched ? expectedKnowledgeUtility(matched, event) : 0, source: matched ? "knowledge" : "unknown" };
    pending.status = "resolved";
    pending.resolvedAt = event.time;
    pending.resolutionBoundary = event.result?.boundary || "normal_end";
    return { value: pending.expectedUtility, source: pending.source || (pending.confidence > 0 ? "knowledge_ledger" : "unknown_ledger") };
  }
  return { value: matched ? expectedKnowledgeUtility(matched, event) : 0, source: matched ? "knowledge" : "unknown" };
}

function resolveMismatch(state, event, expected, actual, H, appraisal) {
  if (event.settleExpectation === false) return { value: 0, status: "observation_only" };
  if (expected?.source === "roster_prediction") {
    const settlement = expected.details || event.rosterExpectationSettlement;
    const delta = Number(settlement?.mismatchInput || 0);
    const expectationWeight = clamp(settlement?.expectationWeight ?? 1, 0, 1);
    const mismatch = mismatchFormula(delta, H, appraisal.goalWeight * expectationWeight, state.config.mismatch);
    const confirmation = confirmationFormula(
      settlement,
      H,
      appraisal.goalWeight,
      state.config.mismatch,
    );
    const value = round(mismatch.value + confirmation.value);
    return {
      value,
      status: "resolved_roster_prediction",
      details: settlement ? {
        ...structuredClone(settlement),
        formula: {
          ...mismatch,
          mismatchValue: mismatch.value,
          confirmation,
          value,
        },
      } : null,
    };
  }
  if (event.expectation?.phase === "open") return { value: 0, status: "pending" };
  if (event.expectation?.phase === "accumulate") {
    const pending = expected.ledger || [...state.expectationLedger].reverse().find((row) => row.eventId === event.id && row.status === "pending");
    if (!pending) return { value: 0, status: "missing_probability_ledger" };
    pending.actualUtility = actual;
    const success = Boolean(event.probability?.success);
    const abnormalDry = !success && pending.expectedOccurrences >= 2.3;
    if (!success && !abnormalDry) {
      pending.drySurprise = round(pending.expectedOccurrences);
      return { value: 0, status: "reasonable_dry" };
    }
    pending.status = "resolved";
    pending.resolvedAt = event.time;
    pending.resolution = success ? "probability_success" : "abnormal_dry";
    pending.drySurprise = round(pending.expectedOccurrences);
    if (String(expected.source).startsWith("unknown") || pending.confidence <= 0) {
      return { value: 0, status: "no_prior" };
    }
    const delta = actual - pending.expectedUtility;
    return {
      value: mismatchEmotion(delta, H, appraisal.goalWeight, state.config.mismatch),
      status: pending.resolution,
    };
  }
  if (!expected || String(expected.source).startsWith("unknown")) return { value: 0, status: "no_prior" };
  const delta = actual - expected.value;
  const boundaryStatus = event.result?.boundary === "interrupted_by_defeat" ? "resolved_interrupted" : "resolved";
  return {
    value: mismatchEmotion(delta, H, appraisal.goalWeight, state.config.mismatch),
    status: boundaryStatus,
  };
}

function closeSuppressedActionLedger(state, event) {
  if (event.expectation?.phase !== "close") return;
  const pending = [...state.expectationLedger].reverse()
    .find((row) => row.key === event.expectation.key && row.status === "pending");
  if (!pending) return;
  pending.status = "resolved";
  pending.resolvedAt = event.time;
  pending.resolutionBoundary = event.result?.boundary || "normal_end";
  pending.resolution = "superseded_by_roster_prediction";
}

function mismatchEmotion(deltaInput, H, goalWeight, config) {
  const delta = Number(deltaInput || 0);
  const formula = mismatchFormula(delta, H, goalWeight, config);
  return round(formula.value);
}

function mismatchFormula(deltaInput, H, goalWeight, config) {
  const delta = Number(deltaInput || 0);
  const positive = Math.max(delta, 0);
  const negative = Math.max(-delta, 0);
  const positiveScale = Number(config.positiveScale ?? 0.5);
  const negativeScale = Number(config.negativeScale ?? 0.8);
  const positivePower = Number(config.positivePower ?? 1);
  const negativePower = Number(config.negativePower ?? 1);
  const perceptualWeight = Number(H || 0) * Number(goalWeight || 0);
  return {
    delta: round(delta),
    positiveScale,
    negativeScale,
    positivePower,
    negativePower,
    H: round(H),
    goalWeight: round(goalWeight),
    value: round((positiveScale * Math.pow(positive, positivePower)
      - negativeScale * Math.pow(negative, negativePower)) * perceptualWeight),
  };
}

function confirmationFormula(settlement, H, goalWeight, config) {
  const confidence = clamp(
    settlement?.effectivePredictionConfidence
    ?? settlement?.predictionConfidence
    ?? 0.5,
    0,
    1,
  );
  const constant = Number(config.confirmationConstant ?? 0.1);
  const expectedProgress = combatProgress(settlement?.predictedCombatScore);
  const actualProgress = combatProgress(settlement?.actualCombatScore);
  const resultRatio = expectedProgress == null || actualProgress == null
    ? 1
    : actualProgress / Math.max(expectedProgress, 0.1);
  const geometric = confirmationGeometricMultiplier(resultRatio, config);
  const expectedLevel = Number(settlement?.expectedPerception?.level);
  const actualLevel = Number(settlement?.actualPerception?.level);
  const clearlyDisconfirmed = Number.isFinite(expectedLevel)
    && Number.isFinite(actualLevel)
    && actualLevel < expectedLevel;
  const appliedMultiplier = clearlyDisconfirmed ? 0 : geometric.multiplier;
  const perceptualWeight = Number(H || 0) * Number(goalWeight || 0);
  return {
    applied: confidence > 0 && !clearlyDisconfirmed,
    samePerceivedBand: settlement?.confirmed === true,
    clearlyDisconfirmed,
    constant,
    confidence: round(confidence),
    H: round(H),
    goalWeight: round(goalWeight),
    expectedProgress: round(expectedProgress),
    actualProgress: round(actualProgress),
    resultRatio: round(resultRatio),
    geometricMultiplier: appliedMultiplier,
    rawGeometricMultiplier: geometric.multiplier,
    geometricBranch: clearlyDisconfirmed
      ? "clear_downward_disconfirmation_zeroes_confirmation"
      : geometric.branch,
    positivePower: geometric.positivePower,
    negativePower: geometric.negativePower,
    maxMultiplier: geometric.maxMultiplier,
    value: round(constant * confidence * perceptualWeight * appliedMultiplier),
  };
}

function confirmationGeometricMultiplier(ratioInput, config = {}) {
  const ratio = Math.max(0, Number(ratioInput || 0));
  const positivePower = Number(config.confirmationPositivePower ?? 0.5);
  const negativePower = Number(config.confirmationNegativePower ?? 1.5);
  const maxMultiplier = Number(config.confirmationMaxMultiplier ?? 2);
  const multiplier = ratio >= 1
    ? Math.min(maxMultiplier, Math.pow(ratio, positivePower))
    : Math.pow(ratio, negativePower);
  return {
    ratio: round(ratio),
    multiplier: round(multiplier),
    branch: ratio >= 1 ? "self_serving_success_amplification" : "failed_confirmation_decay",
    positivePower,
    negativePower,
    maxMultiplier,
  };
}

function combatProgress(scoreInput) {
  const score = Number(scoreInput);
  return Number.isFinite(score) ? clamp((score + 1) / 2, 0, 1) : null;
}

function appraiseEvent(state, event, matched) {
  const selectedGoal = state.goals.find((goal) => goal.id === state.activeGoalId);
  const activeGoal = selectedGoal || state.goals.reduce((best, goal) => {
    const value = Number(goal.objectiveValue || 0) + Number(goal.subjectiveValue || 0);
    return value > best.value ? { value, goal } : best;
  }, { value: 0, goal: null }).goal;
  const goalWeight = activeGoal
    ? clamp(0.35 + 0.35 * Number(activeGoal.objectiveValue || 0) + 0.3 * Number(activeGoal.subjectiveValue || 0), 0.2, 1)
    : 0.5;
  const freshness = matched ? clamp(1 / (1 + Math.log2(1 + matched.count) * 0.15), 0.45, 1) : 1;
  return { goalId: activeGoal?.id || null, goalWeight: round(goalWeight), freshness: round(freshness) };
}

function expectedKnowledgeUtility(row, event) {
  if (event.probability?.opportunity && row.estimatedProbability != null) {
    return Number(row.estimatedProbability) * Number(row.meanSuccessUtility || 0);
  }
  return Number(row.meanUtility || 0);
}

function utilityOf(event) {
  const result = event.result || {};
  if (Number.isFinite(result.utility)) return Number(result.utility);
  switch (result.kind) {
    case "damage": {
      const hpBefore = Math.max(1, Number(result.hpBefore) || Number(result.amount) || 1);
      const value = Math.min(0.08, Math.max(0, Number(result.amount) / hpBefore * 0.08));
      return result.target?.side === "left" ? -value : value;
    }
    case "heal":
    case "shield": {
      const value = Math.min(0.06, Math.max(0, Number(result.amount) / 1000 * 0.06));
      return result.target?.side === "right" ? -value : value;
    }
    case "enemy_kill": return 0.22;
    case "ally_death": return -0.35;
    case "combat_win": return result.firstClear ? 1.2 : 0.45;
    case "combat_loss": return -1;
    case "loot": return rarityUtility(result.rarity);
    case "character_unlock": return 4;
    case "probability_outcome": return (result.components || []).reduce((sum, component) => sum + utilityOf({ result: component }), 0);
    case "action_summary": return (result.components || []).reduce((sum, component) => {
      if (component.kind === "combat_win") return sum + (component.firstClear ? 1.2 : 0.45);
      if (component.kind === "combat_loss") return sum - 1;
      if (component.kind === "loot") return sum + rarityUtility(component.rarity);
      if (component.kind === "character_unlock") return sum + 4;
      return sum;
    }, 0);
    default: return 0;
  }
}

function rarityUtility(rarity) {
  return ({ common: 0.35, rare: 1.1, epic: 2.2, legendary: 3.4, mythic: 4.8 })[rarity] || 0.2;
}

function applyEmotion(state, process, acquired, expectation) {
  state.emotion.processTotal += process;
  state.emotion.acquiredTotal += acquired;
  state.emotion.expectationTotal += expectation;
  state.emotion.value = clamp(state.emotion.value + process + acquired + expectation, 0, 100);
  state.emotion.minimum = Math.min(state.emotion.minimum, state.emotion.value);
}

function knowledgePattern(event) {
  const family = event.probability?.family ? `:${event.probability.family}` : "";
  return {
    subject: event.subject?.role || event.subject?.side || event.subject?.id || "unknown",
    environment: event.environment?.node || event.environment?.nodeType || event.environment?.phase || "unknown",
    behavior: `${event.behavior?.kind || "unknown"}:${event.behavior?.key || event.behavior?.kind || "unknown"}${family}`,
  };
}

function matchKnowledge(rows, pattern) {
  return rows.find((row) => samePattern(row.pattern, pattern)) || null;
}

function updateKnowledge(state, pattern, event, actualUtility) {
  let row = state.knowledge.find((item) => samePattern(item.pattern, pattern));
  if (!row) {
    row = {
      id: `knowledge:${state.knowledge.length + 1}`,
      pattern,
      count: 0,
      meanUtility: 0,
      meanMagnitude: 0,
      confidence: 0,
    opportunities: 0,
    successes: 0,
      meanSuccessUtility: 0,
      dryStreak: 0,
      resultKinds: {},
      meanProcessSeconds: 0,
      outcomeTrials: 0,
      outcomeWins: 0,
    };
    state.knowledge.push(row);
  }
  const alpha = row.count === 0 ? state.config.learning.firstAlpha : state.config.learning.repeatAlpha;
  row.meanUtility = row.count === 0 ? actualUtility : row.meanUtility * (1 - alpha) + actualUtility * alpha;
  const magnitude = Math.abs(Number(event.result.amount) || actualUtility);
  row.meanMagnitude = row.count === 0 ? magnitude : row.meanMagnitude * (1 - alpha) + magnitude * alpha;
  row.count += 1;
  row.confidence = clamp(row.confidence + state.config.learning.confidenceStep, 0, 1);
  row.resultKinds[event.result.kind] = (row.resultKinds[event.result.kind] || 0) + 1;
  const processSeconds = Math.max(0, Number(event.process?.mechanicalSeconds) || 0);
  if (processSeconds > 0) {
    row.meanProcessSeconds = row.count === 1
      ? processSeconds
      : row.meanProcessSeconds * (1 - alpha) + processSeconds * alpha;
  }
  const outcome = (event.result.components || []).find((component) => component.kind === "combat_win" || component.kind === "combat_loss");
  if (outcome) {
    row.outcomeTrials += 1;
    if (outcome.kind === "combat_win") row.outcomeWins += 1;
    row.estimatedSuccess = round((1 + row.outcomeWins) / (2 + row.outcomeTrials));
  }
  if (event.probability?.opportunity) {
    row.opportunities += 1;
    if (event.probability.success) {
      row.successes += 1;
      row.dryStreak = 0;
      row.meanSuccessUtility = row.successes === 1
        ? actualUtility
        : row.meanSuccessUtility * (1 - alpha) + actualUtility * alpha;
    } else row.dryStreak += 1;
    row.estimatedProbability = round((1 + row.successes) / (2 + row.opportunities));
  }
  return row;
}

function updateGoalProgress(state, event) {
  const goal = state.goals.find((row) => row.id === state.activeGoalId) || state.goals[0];
  let delta = 0;
  if (event.result.kind === "combat_win") delta = event.result.firstClear ? 0.12 : 0.03;
  if (event.result.kind === "character_unlock") delta = 0.08;
  if (event.result.kind === "combat_loss") delta = -0.02;
  goal.progress = clamp(goal.progress + delta, 0, 1);
  return round(delta);
}

function collectHypothesisEvidence(state, event) {
  const outcomeKinds = new Set([
    event.result.kind,
    ...(event.result.components || []).map((component) => component.kind),
  ]);
  const action = event.behavior?.key || "";
  const rows = state.hypotheses.filter((row) => row.status === "pending" && (!row.action || row.action === action));
  const resolved = [];
  for (const row of rows) {
    const explicitSettlement = Boolean(row.settleOnEventKind && event.result.kind === row.settleOnEventKind);
    if (row.settleOnEventKind && !explicitSettlement) continue;
    if (explicitSettlement && row.target && event.result.heroId && row.target !== event.result.heroId) continue;
    if (!explicitSettlement && event.result.kind !== "action_summary" && !outcomeKinds.has(row.resultKind)) continue;
    const kindMatched = outcomeKinds.has(row.resultKind);
    const condition = evaluateTargetCondition(row.targetCondition, event.result);
    const explicitNoContribution = explicitSettlement
      && !kindMatched
      && event.result.contribution?.observed === false;
    const comparisonMade = explicitNoContribution || (kindMatched && condition.readable);
    const confirmed = kindMatched && condition.readable && condition.met;
    row.evidence.push({
      eventId: event.id,
      expected: row.resultKind,
      observed: [...outcomeKinds],
      target: row.target || null,
      targetCondition: row.targetCondition || null,
      observedValue: condition.value,
      comparisonMade,
      confirmed,
    });
    row.status = comparisonMade ? (confirmed ? "confirmed" : "refuted") : "inconclusive";
    row.resolvedAt = event.time;
    resolved.push({
      id: row.id,
      status: row.status,
      expected: row.resultKind,
      observed: [...outcomeKinds],
      targetCondition: row.targetCondition || null,
      observedValue: condition.value,
      comparisonMade,
    });
  }
  return {
    ids: resolved.map((row) => row.id),
    rows: resolved,
    verifyCount: resolved.filter((row) => row.comparisonMade).length,
  };
}

function normalizeTargetCondition(input) {
  if (!input || typeof input !== "object") return null;
  const allowedMetrics = new Set(["damage", "heal", "shield", "skillCount", "damageShare", "damageRank"]);
  const allowedOperators = new Set([">", ">=", "<", "<=", "=="]);
  const metric = allowedMetrics.has(input.metric) ? input.metric : null;
  const operator = allowedOperators.has(input.operator) ? input.operator : null;
  const value = Number(input.value);
  return metric && operator && Number.isFinite(value) ? { metric, operator, value } : null;
}

function evaluateTargetCondition(condition, result) {
  if (!condition) return { readable: true, met: true, value: null };
  const value = Number(result?.contribution?.[condition.metric]);
  if (!Number.isFinite(value)) return { readable: false, met: false, value: null };
  const expected = condition.value;
  const met = condition.operator === ">" ? value > expected
    : condition.operator === ">=" ? value >= expected
      : condition.operator === "<" ? value < expected
        : condition.operator === "<=" ? value <= expected
          : value === expected;
  return { readable: true, met, value: round(value) };
}

function applyFailureLearning(state, event, pattern) {
  const goal = state.goals.find((row) => row.id === state.activeGoalId) || state.goals[0];
  goal.subjectiveValue = clamp(goal.subjectiveValue + 0.08, 0, 1);
  const key = `${pattern.subject}|${pattern.environment}|${pattern.behavior}`;
  let memory = state.failureMemories.find((row) => row.key === key);
  if (!memory) {
    memory = {
      key,
      failures: 0,
      fear: 0,
      preferHigherSuccessActions: false,
      resolved: false,
      baselinePower: null,
      wakePowerGrowth: state.config.longHorizon.failureWakePowerGrowth,
    };
    state.failureMemories.push(memory);
  }
  memory.failures += 1;
  memory.fear = clamp(memory.fear + 0.1, 0, 1);
  memory.preferHigherSuccessActions = memory.failures >= 2;
  memory.resolved = false;
  if (event.presentation.visible && event.presentation.hasNumber && Number.isFinite(Number(event.result.observedPower))) {
    memory.baselinePower = Number(event.result.observedPower);
  }
  memory.wakePowerGrowth = Number(memory.wakePowerGrowth || state.config.longHorizon.failureWakePowerGrowth);
  memory.lastEventId = event.id;
}

function resolveFailureLearning(state, pattern, event) {
  const key = `${pattern.subject}|${pattern.environment}|${pattern.behavior}`;
  const memory = state.failureMemories.find((row) => row.key === key && !row.resolved);
  if (!memory) return;
  memory.resolved = true;
  memory.resolvedAtEventId = event.id;
}

function normalizeEvent(input) {
  return {
    id: String(input.id || `event:${input.time || 0}:${input.type || "unknown"}`),
    time: Number(input.time || 0),
    type: input.type || "event",
    subject: input.subject || null,
    environment: input.environment || {},
    behavior: input.behavior || { kind: input.type || "event", key: input.type || "event" },
    result: input.result || { kind: input.type || "event", occurred: true },
    presentation: {
      visible: input.presentation?.visible !== false,
      hasNumber: Boolean(input.presentation?.hasNumber),
      hasSource: Boolean(input.presentation?.hasSource ?? input.subject),
      hasTarget: Boolean(input.presentation?.hasTarget ?? input.result?.target),
      hasHealthDelta: Boolean(input.presentation?.hasHealthDelta),
      hasAnimation: Boolean(input.presentation?.hasAnimation),
      contract: input.presentation?.contract || null,
      renderer: input.presentation?.renderer || null,
      attentionZone: input.presentation?.attentionZone || null,
      competitorCount: Number(input.presentation?.competitorCount || 1),
      attentionShare: Number(input.presentation?.attentionShare ?? 1),
      visual: input.presentation?.visual ? { ...input.presentation.visual } : null,
      renderEvidence: input.presentation?.renderEvidence ? { ...input.presentation.renderEvidence } : null,
    },
    process: input.process ? { ...input.process } : null,
    probability: input.probability ? { ...input.probability } : null,
    expectation: input.expectation ? { ...input.expectation } : null,
    rosterExpectationSettlement: input.rosterExpectationSettlement
      ? structuredClone(input.rosterExpectationSettlement)
      : null,
    directResult: input.directResult,
    settleExpectation: input.settleExpectation,
    learn: input.learn,
  };
}

function summarizeKnowledge(row) {
  return row ? {
    id: row.id,
    pattern: row.pattern,
    count: row.count,
    meanUtility: round(row.meanUtility),
    meanMagnitude: round(row.meanMagnitude),
    confidence: round(row.confidence),
    opportunities: row.opportunities,
    successes: row.successes,
    estimatedProbability: row.estimatedProbability ?? null,
    meanSuccessUtility: round(row.meanSuccessUtility || 0),
    dryStreak: row.dryStreak || 0,
    meanProcessSeconds: round(row.meanProcessSeconds || 0),
    outcomeTrials: row.outcomeTrials || 0,
    outcomeWins: row.outcomeWins || 0,
    estimatedSuccess: row.estimatedSuccess ?? null,
  } : null;
}

function samePattern(a, b) {
  return a.subject === b.subject && a.environment === b.environment && a.behavior === b.behavior;
}

function mergeConfig(input) {
  return {
    ...DEFAULT_CONFIG,
    ...(input || {}),
    process: { ...DEFAULT_CONFIG.process, ...(input?.process || {}) },
    learning: { ...DEFAULT_CONFIG.learning, ...(input?.learning || {}) },
    mismatch: { ...DEFAULT_CONFIG.mismatch, ...(input?.mismatch || {}) },
    longHorizon: { ...DEFAULT_CONFIG.longHorizon, ...(input?.longHorizon || {}) },
    salienceByType: { ...DEFAULT_CONFIG.salienceByType, ...(input?.salienceByType || {}) },
  };
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

module.exports = {
  DEFAULT_CONFIG,
  createState,
  ingestEvent,
  ingestEvents,
  annotateAttentionCompetition,
  applyDecision,
  knowledgePattern,
  matchKnowledge,
  receiveSignal,
  utilityOf,
  confirmationGeometricMultiplier,
};
