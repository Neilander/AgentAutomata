const {
  APPRAISAL_AXES,
  CHEMICAL_AXES,
  EMOTION_FAMILIES,
  PHYSICAL_AXES,
} = require("./emotion-model-contract");

const DEFAULT_BASELINES = Object.freeze({
  centralNorepinephrine: 0.32,
  epinephrine: 0.28,
  cortisol: 0.30,
  dopamine: 0.45,
  serotonin: 0.50,
  acetylcholine: 0.42,
  endogenousOpioid: 0.28,
  endocannabinoid: 0.32,
  oxytocin: 0.38,
  vasopressin: 0.36,
  testosterone: 0.42,
  inflammatoryLoad: 0.18,
});

const DEFAULT_TAU_SECONDS = Object.freeze({
  centralNorepinephrine: 35,
  epinephrine: 55,
  cortisol: 900,
  dopamine: 120,
  serotonin: 3600,
  acetylcholine: 90,
  endogenousOpioid: 480,
  endocannabinoid: 600,
  oxytocin: 900,
  vasopressin: 1200,
  testosterone: 1800,
  inflammatoryLoad: 21600,
});

const ACTION_BIASES = Object.freeze({
  fear: ["avoid", "freeze", "seekSafety"],
  anxiety: ["scanThreat", "delayCommitment", "seekCertainty"],
  anger: ["confront", "removeObstacle", "assertBoundary"],
  frustration: ["retry", "switchMethod", "disengage"],
  sadness: ["withdraw", "seekComfort", "conserveEnergy"],
  disappointment: ["lowerExpectation", "reviewPrediction"],
  disgust: ["reject", "distance", "cleanse"],
  joy: ["approach", "share", "continue"],
  excitement: ["approach", "explore", "actQuickly"],
  satisfaction: ["consolidate", "repeatStrategy", "rest"],
  relief: ["releaseTension", "resumeNormalAction"],
  hope: ["persist", "plan", "approach"],
  pride: ["displayCompetence", "repeatStrategy"],
  shame: ["hide", "appease", "repairSelfImage"],
  guilt: ["repairHarm", "apologize", "compensate"],
  regret: ["reverseChoice", "learnCounterfactual"],
  attachment: ["maintainProximity", "protectRelationship"],
  gratitude: ["reciprocate", "affiliate"],
  envy: ["compare", "acquire", "improveStatus"],
  jealousy: ["monitorRelationship", "guardBond", "confrontRival"],
  surprise: ["orientAttention", "pauseCurrentPlan"],
  curiosity: ["inspect", "experiment", "seekInformation"],
  confusion: ["slowDown", "seekExplanation", "testAlternatives"],
  boredom: ["seekStimulation", "switchActivity", "disengage"],
});

const EMOTION_TARGET_KEYS = Object.freeze({
  fear: ["threatSource", "attentionTarget"],
  anxiety: ["threatSource", "attentionTarget"],
  anger: ["blameTarget", "obstacleTarget", "attentionTarget"],
  frustration: ["obstacleTarget", "attentionTarget"],
  sadness: ["lossObject", "attentionTarget"],
  disappointment: ["expectedOutcome", "attentionTarget"],
  disgust: ["aversionSource", "normViolator", "attentionTarget"],
  joy: ["rewardSource", "attentionTarget"],
  excitement: ["rewardSource", "anticipatedOutcome", "attentionTarget"],
  satisfaction: ["rewardSource", "goalObject", "attentionTarget"],
  relief: ["resolvedThreat", "threatSource", "attentionTarget"],
  hope: ["anticipatedOutcome", "goalObject", "attentionTarget"],
  pride: ["self"],
  shame: ["self"],
  guilt: ["harmedOther", "self"],
  regret: ["rejectedAlternative", "self"],
  attachment: ["socialObject", "attentionTarget"],
  gratitude: ["benefactor", "socialObject", "attentionTarget"],
  envy: ["comparisonOther", "desiredObject", "attentionTarget"],
  jealousy: ["relationshipObject", "rival", "attentionTarget"],
  surprise: ["changeSource", "attentionTarget"],
  curiosity: ["informationObject", "attentionTarget"],
  confusion: ["informationObject", "attentionTarget"],
  boredom: ["currentActivity", "attentionTarget"],
});

function simulateEmotionSequence(input, options = {}) {
  const normalized = normalizeInput(input);
  const state = makeInitialState(normalized);
  const frames = [];
  const threshold = finiteOr(options.emotionThreshold, 0.12);
  const maxEmotions = Math.max(1, Math.floor(finiteOr(options.maxEmotions, 6)));

  for (const event of normalized.events) {
    const deltaSeconds = Math.max(0, event.time - state.time);
    decayChemistry(state, normalized.profile, deltaSeconds);
    const appraisal = resolveAppraisals(event.appraisals, normalized.profile, normalized.longTermContext, state);
    applyMeasuredChemistry(state, event.measuredChemistry);
    const releases = releaseChemistry(state, appraisal, normalized.profile, normalized.longTermContext);
    const rawScores = scoreEmotionFamilies(
      appraisal,
      state,
      normalized.profile,
      normalized.longTermContext,
      event.observedPhysical,
    );
    const emotions = buildEmotionOutputs({
      rawScores,
      appraisal,
      state,
      event,
      threshold,
      maxEmotions,
      longTermContext: normalized.longTermContext,
      observedPhysical: event.observedPhysical,
    });
    state.time = event.time;
    state.priorThreat = clamp01(
      Math.max(
        appraisalValue(appraisal, "threatMagnitude"),
        state.priorThreat * Math.exp(-deltaSeconds / 240),
      ),
    );
    if (appraisalValue(appraisal, "threatResolution") > 0.2) {
      state.priorThreat *= 1 - 0.8 * appraisalValue(appraisal, "threatResolution");
    }
    frames.push({
      time: event.time,
      eventId: event.id,
      eventDescription: event.description,
      chemistry: snapshotChemistry(state),
      modeledReleases: releases,
      effectiveAppraisals: appraisal,
      emotions,
    });
  }
  return {
    schema: "player_emotion_simulation_v1",
    frames,
    finalChemistry: snapshotChemistry(state),
    assumptions: normalized.assumptions,
  };
}

function projectEmotionsAtHorizon(emotions, horizonSeconds) {
  const horizon = Math.max(0, finiteOr(horizonSeconds, 0));
  return emotions
    .map((emotion) => ({
      ...emotion,
      onsetIntensity: emotion.intensity,
      intensity: round(
        emotion.intensity * Math.exp(-horizon / Math.max(1, emotion.expectedDurationSeconds)),
      ),
      projectionHorizonSeconds: horizon,
    }))
    .sort((left, right) => right.intensity - left.intensity);
}

function normalizeInput(input) {
  if (!input || typeof input !== "object") throw new Error("input must be an object");
  const events = Array.isArray(input.events) ? input.events.map(normalizeEvent) : [];
  if (events.length === 0) throw new Error("input.events must contain at least one event");
  events.sort((a, b) => a.time - b.time);
  const profile = {
    chemicalBaselines: { ...DEFAULT_BASELINES, ...(input.profile?.chemicalBaselines || {}) },
    chemicalSensitivity: Object.fromEntries(
      CHEMICAL_AXES.map((axis) => [axis, clamp(finiteOr(input.profile?.chemicalSensitivity?.[axis], 1), 0.25, 2)]),
    ),
    clearanceTauSeconds: {
      ...DEFAULT_TAU_SECONDS,
      ...(input.profile?.clearanceTauSeconds || {}),
    },
    domainSelfEfficacy: clamp01(finiteOr(input.profile?.domainSelfEfficacy, 0.5)),
    riskTolerance: clamp01(finiteOr(input.profile?.riskTolerance, 0.5)),
    traitRumination: clamp01(finiteOr(input.profile?.traitRumination, 0.35)),
    relationshipSecurity: clamp01(finiteOr(input.profile?.relationshipSecurity, 0.5)),
    appraisalBias: input.profile?.appraisalBias || {},
  };
  for (const axis of CHEMICAL_AXES) {
    profile.chemicalBaselines[axis] = clamp01(finiteOr(profile.chemicalBaselines[axis], DEFAULT_BASELINES[axis]));
    profile.clearanceTauSeconds[axis] = Math.max(
      1,
      finiteOr(profile.clearanceTauSeconds[axis], DEFAULT_TAU_SECONDS[axis]),
    );
  }
  const initialChemistry = input.initialPhysiology?.chemistry || {};
  const longTermContext = normalizeLongTermContext(input.longTermContext);
  return {
    profile,
    initialChemistry,
    longTermContext,
    events,
    assumptions: {
      unmeasuredChemistry: "profile baseline plus modelled event release; never inferred from a gold emotion label",
      serotonin: "regulation and patience modulation, not a direct happiness score",
      emotionOutput: "multiple families may coexist; labels are decoded from appraisal patterns and physiology",
    },
  };
}

function normalizeEvent(event, index) {
  if (!event || typeof event !== "object") throw new Error(`events[${index}] must be an object`);
  const time = Number(event.time);
  if (!Number.isFinite(time)) throw new Error(`events[${index}].time must be finite`);
  return {
    id: String(event.id || `event-${index + 1}`),
    time,
    description: String(event.description || "").trim() || `event ${index + 1}`,
    appraisals: event.appraisals || {},
    targets: event.targets || {},
    measuredChemistry: event.measuredChemistry || {},
    observedPhysical: normalizeObservedPhysical(event.observedPhysical || {}),
  };
}

function normalizeObservedPhysical(raw) {
  const normalized = {};
  for (const [axis, entry] of Object.entries(raw)) {
    if (!PHYSICAL_AXES.includes(axis)) throw new Error(`unknown observed physical axis: ${axis}`);
    const value = typeof entry === "number" ? entry : entry.value;
    normalized[axis] = {
      value: axis === "approachWithdrawal"
        ? clamp(finiteOr(value, 0), -1, 1)
        : clamp01(finiteOr(value, 0)),
      confidence: clamp01(finiteOr(typeof entry === "number" ? 0.7 : entry.confidence, 0.7)),
      provenance: typeof entry === "number" ? "modelled" : entry.provenance || "unknown",
    };
  }
  return normalized;
}

function normalizeLongTermContext(context = {}) {
  return {
    chronicStress: clamp01(finiteOr(context.chronicStress, 0)),
    fatigue: clamp01(finiteOr(context.fatigue, 0)),
    unresolvedLoss: clamp01(finiteOr(context.unresolvedLoss, 0)),
    repeatedFailure: clamp01(finiteOr(context.repeatedFailure, 0)),
    socialIsolation: clamp01(finiteOr(context.socialIsolation, 0)),
    memories: Array.isArray(context.memories) ? context.memories : [],
  };
}

function makeInitialState(input) {
  const chemistry = {};
  for (const axis of CHEMICAL_AXES) {
    const baseline = input.profile.chemicalBaselines[axis];
    const supplied = input.initialChemistry[axis];
    chemistry[axis] = {
      baseline,
      level: clamp01(finiteOr(supplied?.level, baseline)),
      confidence: clamp01(finiteOr(supplied?.confidence, supplied ? 0.7 : 0.35)),
      provenance: supplied?.provenance || "profile_baseline",
    };
  }
  const cortisolTonicShift = 0.18 * input.longTermContext.chronicStress;
  const inflammatoryTonicShift = 0.14 * input.longTermContext.fatigue
    + 0.08 * input.longTermContext.chronicStress;
  chemistry.cortisol.baseline = clamp01(chemistry.cortisol.baseline + cortisolTonicShift);
  chemistry.inflammatoryLoad.baseline = clamp01(
    chemistry.inflammatoryLoad.baseline + inflammatoryTonicShift,
  );
  if (!input.initialChemistry.cortisol) {
    chemistry.cortisol.level = chemistry.cortisol.baseline;
  }
  if (!input.initialChemistry.inflammatoryLoad) {
    chemistry.inflammatoryLoad.level = chemistry.inflammatoryLoad.baseline;
  }
  return {
    time: input.events[0].time,
    chemistry,
    priorThreat: memoryBias(input.longTermContext.memories, "threat") * 0.45,
  };
}

function decayChemistry(state, profile, deltaSeconds) {
  for (const axis of CHEMICAL_AXES) {
    const entry = state.chemistry[axis];
    const tau = profile.clearanceTauSeconds[axis];
    const retention = Math.exp(-deltaSeconds / tau);
    entry.level = clamp01(entry.baseline + (entry.level - entry.baseline) * retention);
    entry.confidence = clamp01(entry.confidence * Math.exp(-deltaSeconds / (tau * 2)) + 0.25 * (1 - retention));
  }
}

function resolveAppraisals(raw, profile, context, state) {
  const resolved = {};
  for (const axis of APPRAISAL_AXES) {
    const entry = raw[axis];
    if (entry == null) {
      resolved[axis] = { value: 0, confidence: 0, known: false };
      continue;
    }
    const value = typeof entry === "number" ? entry : entry.value;
    const confidence = typeof entry === "number" ? 1 : finiteOr(entry.confidence, 0.7);
    const bias = finiteOr(profile.appraisalBias[axis], 0);
    resolved[axis] = {
      value: clamp01(finiteOr(value, 0) + bias),
      confidence: clamp01(confidence),
      known: true,
    };
  }

  const threatMemory = memoryBias(context.memories, "threat");
  const failureMemory = Math.max(context.repeatedFailure, memoryBias(context.memories, "failure"));
  addAppraisalBias(resolved, "threatMagnitude", 0.22 * threatMemory + 0.10 * context.chronicStress);
  addAppraisalBias(resolved, "expectedUncertainty", 0.16 * failureMemory);
  addAppraisalBias(resolved, "controllability", 0.22 * (profile.domainSelfEfficacy - 0.5));
  addAppraisalBias(resolved, "threatMagnitude", -0.12 * (profile.riskTolerance - 0.5));
  addAppraisalBias(resolved, "relationshipThreat", 0.16 * (0.5 - profile.relationshipSecurity));
  if (state.priorThreat > 0 && appraisalValue(resolved, "threatResolution") > 0) {
    resolved.threatResolution.contextualPriorThreat = state.priorThreat;
  }
  return resolved;
}

function addAppraisalBias(appraisal, axis, delta) {
  const entry = appraisal[axis];
  if (!entry) return;
  if (!entry.known && delta === 0) return;
  entry.value = clamp01(entry.value + delta);
  entry.confidence = clamp01(Math.max(entry.confidence, Math.min(0.65, Math.abs(delta) * 2.5)));
  entry.known = true;
}

function applyMeasuredChemistry(state, measured) {
  for (const [axis, entry] of Object.entries(measured || {})) {
    if (!CHEMICAL_AXES.includes(axis)) throw new Error(`unknown measured chemistry axis: ${axis}`);
    if (entry?.provenance !== "measured") throw new Error(`measuredChemistry.${axis} provenance must be measured`);
    state.chemistry[axis].level = clamp01(finiteOr(entry.level, state.chemistry[axis].level));
    state.chemistry[axis].confidence = clamp01(finiteOr(entry.confidence, 0.9));
    state.chemistry[axis].provenance = "measured";
  }
}

function releaseChemistry(state, appraisal, profile, context) {
  const a = (axis) => appraisalValue(appraisal, axis);
  const positiveRpe = Math.max(0, a("rewardPredictionError") - 0.5) * 2;
  const negativeRpe = Math.max(0, 0.5 - a("rewardPredictionError")) * 2;
  const positiveValence = Math.max(0, a("outcomeValence") - 0.5) * 2;
  const negativeValence = Math.max(0, 0.5 - a("outcomeValence")) * 2;
  const threat = a("threatMagnitude");
  const immediate = a("threatImmediacy");
  const uncertainty = a("expectedUncertainty");
  const social = Math.max(a("socialSafety"), a("attachmentRelevance"), a("benefitFromOther"));
  const release = {
    centralNorepinephrine: 0.32 * threat * (0.45 + 0.55 * immediate)
      + 0.18 * a("unexpectedChange") + 0.10 * a("informationGap"),
    epinephrine: 0.34 * threat * immediate + 0.12 * a("statusChallenge"),
    cortisol: 0.10 * threat * (0.45 + uncertainty)
      + 0.05 * Math.max(negativeRpe, negativeValence),
    // Phasic dopamine is led by prediction error and anticipated value. A good but
    // fully expected outcome still has a small motivational pulse; it is not treated
    // as if it were equally surprising every time.
    dopamine: 0.18 * positiveRpe + 0.05 * positiveValence + 0.10 * a("positiveOutcomeProspect")
      + 0.04 * a("rewardConsumption") - 0.08 * Math.max(negativeRpe, negativeValence),
    serotonin: 0.018 * a("socialSafety") + 0.010 * a("rewardConsumption")
      - 0.022 * threat * context.chronicStress,
    acetylcholine: 0.22 * a("informationGap") + 0.16 * a("unexpectedChange")
      + 0.10 * uncertainty,
    endogenousOpioid: 0.16 * a("rewardConsumption") + 0.08 * a("threatResolution")
      + 0.06 * social,
    endocannabinoid: 0.10 * threat + 0.08 * a("threatResolution"),
    oxytocin: 0.14 * social + 0.08 * a("benefitFromOther"),
    vasopressin: 0.10 * a("relationshipThreat") + 0.08 * a("statusChallenge"),
    testosterone: 0.11 * a("statusChallenge") * (0.4 + 0.6 * a("controllability")),
    inflammatoryLoad: 0,
  };

  for (const axis of CHEMICAL_AXES) {
    const sensitivity = profile.chemicalSensitivity[axis];
    const signed = release[axis] * sensitivity;
    state.chemistry[axis].level = clamp01(state.chemistry[axis].level + signed);
    state.chemistry[axis].confidence = clamp01(Math.max(state.chemistry[axis].confidence, 0.55));
    if (state.chemistry[axis].provenance !== "measured") state.chemistry[axis].provenance = "modelled";
    release[axis] = round(signed);
  }
  return release;
}

function scoreEmotionFamilies(appraisal, state, profile, context, observedPhysical) {
  const a = (axis) => appraisalValue(appraisal, axis);
  const posRpe = clamp01((a("rewardPredictionError") - 0.5) * 2);
  const negRpe = clamp01((0.5 - a("rewardPredictionError")) * 2);
  const positiveValence = clamp01((a("outcomeValence") - 0.5) * 2);
  const negativeValence = clamp01((0.5 - a("outcomeValence")) * 2);
  const positiveGoal = clamp01((a("goalCongruence") - 0.5) * 2);
  const negativeGoal = clamp01((0.5 - a("goalCongruence")) * 2);
  const positiveSelfEvaluation = clamp01((a("selfEvaluationValence") - 0.5) * 2);
  const negativeSelfEvaluation = clamp01((0.5 - a("selfEvaluationValence")) * 2);
  const positiveRelationship = clamp01((a("relationshipValence") - 0.5) * 2);
  const negativeRelationship = clamp01((0.5 - a("relationshipValence")) * 2);
  const threat = a("threatMagnitude");
  const control = a("controllability");
  const uncertainty = a("expectedUncertainty");
  const obstruction = a("obstruction");
  const goal = a("goalRelevance");
  const acuteThreatDominance = threat * a("threatImmediacy");
  const loss = Math.max(
    a("lossGap"),
    context.unresolvedLoss * 0.6,
    negativeRelationship * a("attachmentRelevance") * 0.65,
  );
  const self = a("selfAttribution");
  const norm = a("normViolation");
  const priorThreat = Math.max(state.priorThreat, threat);
  const reliefRouting = a("threatResolution") * priorThreat;
  const externallyBlamed = a("blameCertainty") * (1 - self);
  const selfCounterfactualRouting = self * a("counterfactualBetterOption");
  const disappointmentRetention = (1 - 0.55 * externallyBlamed)
    * (1 - 0.55 * selfCounterfactualRouting);
  const frustrationRetention = 1 - 0.35 * externallyBlamed;
  const joySpecificityRetention = (1 - 0.55 * reliefRouting)
    * (1 - 0.30 * a("benefitFromOther"))
    * (1 - 0.40 * self * positiveSelfEvaluation);

  const chemistry = chemistryModulators(state);
  const physical = physicalModulators(observedPhysical);
  const scores = {
    fear: Math.max(
      threat * a("threatImmediacy") * (0.35 + 0.65 * (1 - control)),
      0.48 * physical.sympatheticArousal * physical.withdrawal * (1 - 0.7 * physical.aggression),
      1.18 * physical.sympatheticArousal
        * (0.55 + 0.25 * a("unexpectedChange") + 0.20 * negativeValence)
        * (1 - 0.65 * physical.aggression),
    ) * chemistry.threatGain,
    anxiety: Math.max(
      threat * (0.25 + 0.75 * uncertainty) * (0.45 + 0.55 * (1 - control)),
      0.36 * physical.sympatheticArousal * physical.withdrawal * (1 - 0.5 * physical.aggression),
    ) * chemistry.sustainedStressGain,
    anger: Math.max(
      obstruction * (0.25 + 0.75 * a("blameCertainty"))
        * (0.30 + 0.30 * control + 0.20 * a("statusChallenge") + 0.20 * norm),
      0.88 * physical.aggression,
      0.45 * physical.sympatheticArousal * physical.approach,
    ) * chemistry.approachGain * (0.9 + 0.4 * externallyBlamed),
    frustration: obstruction * (0.35 + 0.65 * goal)
      * (0.45 + 0.55 * (1 - control))
      * frustrationRetention
      * (1 - 0.75 * a("irreversibility")),
    sadness: Math.max(
      loss,
      0.55 * negativeValence * a("irreversibility"),
      0.82 * physical.crying,
      0.55 * physical.somaticDistress * physical.withdrawal,
    )
      * (0.30 + 0.70 * Math.max(a("irreversibility"), negativeRelationship)) * chemistry.lossGain,
    disappointment: Math.max(negRpe, negativeGoal * negativeValence)
      * (0.30 + 0.70 * goal)
      * (0.75 + 0.25 * (1 - a("irreversibility")))
      * disappointmentRetention,
    disgust: Math.max(
      a("contamination"),
      0.72 * norm
        * (0.30 + 0.70 * (1 - self))
        * (0.30 + 0.70 * a("blameCertainty")),
      0.55 * norm * a("harmToOther") * (1 - self),
    ) * (0.6 + 0.4 * chemistry.arousal),
    joy: Math.max(
      posRpe,
      positiveValence * Math.max(0.55, positiveGoal),
      0.85 * a("rewardConsumption"),
      0.86 * physical.smiling,
      0.42 * physical.approach * (1 - physical.aggression),
    )
      * (0.35 + 0.65 * goal)
      * chemistry.rewardGain
      * joySpecificityRetention,
    excitement: Math.max(
      posRpe,
      a("positiveOutcomeProspect") * (0.30 + 0.70 * positiveValence),
      positiveValence * a("unexpectedChange"),
    )
      * (0.25 + 0.45 * a("unexpectedChange") + 0.30 * chemistry.arousal)
      * chemistry.rewardGain
      * (1 - 0.75 * reliefRouting),
    satisfaction: Math.max(a("rewardConsumption"), positiveValence * positiveGoal)
      * (0.35 + 0.65 * goal) * (0.55 + 0.45 * control),
    relief: a("threatResolution") * (0.25 + 0.75 * priorThreat) * chemistry.reliefGain,
    hope: a("positiveOutcomeProspect") * (0.30 + 0.70 * uncertainty)
      * (0.35 + 0.65 * Math.max(control, profile.domainSelfEfficacy)) * chemistry.rewardGain,
    pride: Math.max(posRpe, a("rewardConsumption"), positiveSelfEvaluation)
      * self * (0.45 + 0.55 * goal),
    shame: Math.max(
      norm * self,
      negativeSelfEvaluation * Math.max(self, 0.55),
      0.38 * physical.withdrawal * negativeSelfEvaluation,
    )
      * (0.40 + 0.60 * Math.max(a("socialExposure"), negativeSelfEvaluation * 0.75))
      * chemistry.socialPainGain,
    guilt: Math.max(norm, a("harmToOther")) * self * (0.50 + 0.50 * a("harmToOther"))
      * (0.75 + 0.25 * a("repairOpportunity")),
    regret: Math.max(
      negRpe,
      negativeValence * a("counterfactualBetterOption"),
    ) * self * a("counterfactualBetterOption"),
    attachment: Math.max(a("attachmentRelevance"), a("benefitFromOther") * 0.6)
      * (0.25 + 0.75 * Math.max(a("socialSafety"), positiveRelationship))
      * chemistry.affiliationGain
      * 0.68,
    gratitude: a("benefitFromOther") * Math.max(posRpe, a("rewardConsumption"))
      * (0.55 + 0.45 * (1 - self)) * chemistry.affiliationGain,
    envy: a("comparisonDisadvantage") * (0.35 + 0.65 * goal) * chemistry.statusGain,
    jealousy: Math.max(a("relationshipThreat"), negativeRelationship * a("attachmentRelevance"))
      * (0.35 + 0.65 * a("attachmentRelevance"))
      * chemistry.socialVigilanceGain,
    surprise: a("unexpectedChange") * (0.55 + 0.45 * chemistry.arousal),
    curiosity: a("informationGap") * (0.35 + 0.65 * control)
      * (0.45 + 0.55 * (1 - threat)) * chemistry.attentionGain,
    confusion: a("informationGap") * (0.25 + 0.75 * a("unexpectedChange"))
      * (0.35 + 0.65 * (1 - control))
      * (0.55 + 0.45 * uncertainty)
      * clamp(1 - 2.1 * acuteThreatDominance, 0.2, 1),
    boredom: a("repetition") * (0.35 + 0.65 * (1 - goal))
      * (0.55 + 0.45 * (1 - chemistry.arousal)) * chemistry.fatigueGain,
  };
  for (const family of EMOTION_FAMILIES) scores[family] = clamp01(scores[family] || 0);
  return scores;
}

function chemistryModulators(state) {
  const c = (axis) => state.chemistry[axis].level;
  const arousal = clamp01(0.45 * c("centralNorepinephrine") + 0.35 * c("epinephrine") + 0.20 * c("cortisol"));
  const regulation = clamp01(0.65 * c("serotonin") + 0.35 * (1 - c("cortisol")));
  return {
    arousal,
    threatGain: clamp(0.75 + 0.55 * arousal - 0.12 * regulation, 0.65, 1.35),
    sustainedStressGain: clamp(0.70 + 0.65 * c("cortisol") - 0.10 * regulation, 0.65, 1.35),
    approachGain: clamp(
      0.70 + 0.28 * c("dopamine") + 0.22 * c("testosterone") + 0.15 * arousal - 0.18 * regulation,
      0.65,
      1.35,
    ),
    lossGain: clamp(0.78 + 0.34 * c("cortisol") + 0.24 * c("inflammatoryLoad") - 0.12 * c("dopamine"), 0.65, 1.35),
    rewardGain: clamp(0.72 + 0.42 * c("dopamine") + 0.18 * c("endogenousOpioid"), 0.65, 1.35),
    reliefGain: clamp(0.72 + 0.30 * c("endogenousOpioid") + 0.22 * c("endocannabinoid"), 0.65, 1.25),
    socialPainGain: clamp(0.78 + 0.30 * c("cortisol") + 0.16 * c("vasopressin"), 0.7, 1.3),
    affiliationGain: clamp(0.72 + 0.40 * c("oxytocin") + 0.16 * c("endogenousOpioid"), 0.65, 1.3),
    statusGain: clamp(0.76 + 0.28 * c("dopamine") + 0.22 * c("testosterone"), 0.7, 1.3),
    socialVigilanceGain: clamp(0.78 + 0.30 * c("vasopressin") + 0.20 * c("cortisol"), 0.7, 1.3),
    attentionGain: clamp(0.72 + 0.42 * c("acetylcholine") + 0.16 * c("centralNorepinephrine"), 0.7, 1.3),
    fatigueGain: clamp(0.78 + 0.40 * c("inflammatoryLoad") + 0.18 * (1 - c("dopamine")), 0.75, 1.35),
    regulation,
  };
}

function physicalModulators(observedPhysical) {
  const value = (axis, neutral = 0) => {
    const entry = observedPhysical?.[axis];
    if (!entry) return neutral;
    if (axis === "approachWithdrawal") return entry.value * entry.confidence;
    return clamp01(entry.value * entry.confidence);
  };
  const direction = value("approachWithdrawal", 0);
  return {
    sympatheticArousal: value("sympatheticArousal"),
    somaticDistress: value("somaticDistress"),
    approach: Math.max(0, direction),
    withdrawal: Math.max(0, -direction),
    expressiveActivation: value("expressiveActivation"),
    smiling: value("smiling"),
    crying: value("crying"),
    aggression: value("aggression"),
    vocalActivation: value("vocalActivation"),
    temperatureActivation: value("temperatureActivation"),
  };
}

function buildEmotionOutputs({
  rawScores,
  appraisal,
  state,
  event,
  threshold,
  maxEmotions,
  longTermContext,
  observedPhysical,
}) {
  const physiology = chemistryModulators(state);
  const output = Object.entries(rawScores)
    .filter(([, score]) => score >= threshold)
    .sort((left, right) => right[1] - left[1])
    .slice(0, maxEmotions)
    .map(([family, score]) => {
      const confidence = emotionConfidence(family, appraisal, state);
      const actionBias = modulateActions(ACTION_BIASES[family], family, physiology);
      return {
        family,
        intensity: round(score),
        target: resolveTarget(family, event.targets),
        cause: event.description,
        confidence: round(confidence),
        onset: event.time,
        expectedDurationSeconds: expectedDuration(family, score, longTermContext),
        actionBias,
        supportingPhysiology: supportingPhysiology(family, state),
        supportingPhysical: supportingPhysical(family, observedPhysical),
        supportingAppraisals: supportingAppraisals(family, appraisal),
        supportingMemories: supportingMemories(family, longTermContext.memories),
      };
    });
  if (output.length === 0) {
    output.push({
      family: "confusion",
      intensity: 0.08,
      target: resolveTarget("confusion", event.targets),
      cause: event.description,
      confidence: 0.18,
      onset: event.time,
      expectedDurationSeconds: 20,
      actionBias: ["seekInformation"],
      supportingPhysiology: [],
      supportingPhysical: [],
      supportingAppraisals: [],
      supportingMemories: [],
      belowActivationThreshold: true,
    });
  }
  return output;
}

function appraisalValue(appraisal, axis) {
  const entry = appraisal[axis];
  const neutral = {
    controllability: 0.5,
    escapeAvailability: 0.5,
    rewardPredictionError: 0.5,
    socialSafety: 0.5,
    outcomeValence: 0.5,
    goalCongruence: 0.5,
    selfEvaluationValence: 0.5,
    relationshipValence: 0.5,
  }[axis] ?? 0;
  if (!entry || !entry.known) return neutral;
  return clamp01(entry.value);
}

function emotionConfidence(family, appraisal, state) {
  const relevant = supportingAppraisals(family, appraisal);
  const appraisalConfidence = relevant.length
    ? relevant.reduce((sum, item) => sum + item.confidence, 0) / relevant.length
    : 0.2;
  const physiologySupport = supportingPhysiology(family, state);
  const physiologyConfidence = physiologySupport.length
    ? physiologySupport.reduce((sum, item) => sum + item.confidence, 0) / physiologySupport.length
    : 0.25;
  return clamp01(0.78 * appraisalConfidence + 0.22 * physiologyConfidence);
}

function supportingPhysical(family, observedPhysical) {
  const map = {
    fear: ["sympatheticArousal", "approachWithdrawal", "temperatureActivation"],
    anxiety: ["sympatheticArousal", "approachWithdrawal"],
    anger: ["aggression", "approachWithdrawal", "vocalActivation", "sympatheticArousal"],
    frustration: ["vocalActivation", "sympatheticArousal"],
    sadness: ["crying", "somaticDistress", "approachWithdrawal"],
    disgust: ["approachWithdrawal", "somaticDistress"],
    joy: ["smiling", "approachWithdrawal", "expressiveActivation"],
    excitement: ["sympatheticArousal", "expressiveActivation"],
    shame: ["approachWithdrawal", "vocalActivation"],
    guilt: ["somaticDistress", "approachWithdrawal"],
    surprise: ["sympatheticArousal", "expressiveActivation"],
  };
  return (map[family] || [])
    .filter((axis) => observedPhysical?.[axis])
    .map((axis) => ({
      axis,
      value: round(observedPhysical[axis].value),
      confidence: round(observedPhysical[axis].confidence),
      provenance: observedPhysical[axis].provenance,
    }));
}

function supportingAppraisals(family, appraisal) {
  const map = {
    fear: ["threatMagnitude", "threatImmediacy", "controllability"],
    anxiety: ["threatMagnitude", "expectedUncertainty", "controllability"],
    anger: ["obstruction", "blameCertainty", "controllability", "statusChallenge"],
    frustration: ["obstruction", "goalRelevance", "controllability"],
    sadness: ["lossGap", "irreversibility", "outcomeValence", "relationshipValence"],
    disappointment: ["rewardPredictionError", "goalRelevance", "goalCongruence", "outcomeValence"],
    disgust: ["contamination", "normViolation"],
    joy: ["outcomeValence", "goalCongruence", "rewardPredictionError", "rewardConsumption", "goalRelevance"],
    excitement: ["outcomeValence", "positiveOutcomeProspect", "unexpectedChange"],
    satisfaction: ["outcomeValence", "goalCongruence", "rewardConsumption", "goalRelevance", "controllability"],
    relief: ["threatResolution"],
    hope: ["positiveOutcomeProspect", "expectedUncertainty", "controllability"],
    pride: ["selfEvaluationValence", "rewardPredictionError", "rewardConsumption", "selfAttribution"],
    shame: ["selfEvaluationValence", "normViolation", "selfAttribution", "socialExposure"],
    guilt: ["harmToOther", "selfAttribution", "normViolation", "repairOpportunity"],
    regret: ["rewardPredictionError", "selfAttribution", "counterfactualBetterOption"],
    attachment: ["attachmentRelevance", "socialSafety", "relationshipValence"],
    gratitude: ["benefitFromOther", "rewardPredictionError", "rewardConsumption"],
    envy: ["comparisonDisadvantage", "goalRelevance"],
    jealousy: ["relationshipThreat", "attachmentRelevance", "relationshipValence"],
    surprise: ["unexpectedChange"],
    curiosity: ["informationGap", "controllability", "threatMagnitude"],
    confusion: ["informationGap", "unexpectedChange", "controllability", "expectedUncertainty"],
    boredom: ["repetition", "goalRelevance"],
  };
  return (map[family] || [])
    .filter((axis) => appraisal[axis]?.known)
    .map((axis) => ({
      axis,
      value: round(appraisal[axis].value),
      confidence: round(appraisal[axis].confidence),
    }));
}

function supportingPhysiology(family, state) {
  const map = {
    fear: ["centralNorepinephrine", "epinephrine", "cortisol", "serotonin"],
    anxiety: ["cortisol", "centralNorepinephrine", "serotonin"],
    anger: ["centralNorepinephrine", "testosterone", "serotonin"],
    frustration: ["centralNorepinephrine", "cortisol"],
    sadness: ["cortisol", "dopamine", "inflammatoryLoad"],
    disappointment: ["dopamine", "cortisol"],
    disgust: ["centralNorepinephrine"],
    joy: ["dopamine", "endogenousOpioid"],
    excitement: ["dopamine", "centralNorepinephrine"],
    satisfaction: ["dopamine", "endogenousOpioid"],
    relief: ["endogenousOpioid", "endocannabinoid", "cortisol"],
    hope: ["dopamine", "serotonin"],
    pride: ["dopamine", "testosterone"],
    shame: ["cortisol", "vasopressin"],
    guilt: ["cortisol", "oxytocin"],
    regret: ["dopamine", "cortisol"],
    attachment: ["oxytocin", "endogenousOpioid"],
    gratitude: ["oxytocin", "dopamine"],
    envy: ["dopamine", "testosterone"],
    jealousy: ["vasopressin", "cortisol"],
    surprise: ["centralNorepinephrine", "acetylcholine"],
    curiosity: ["acetylcholine", "dopamine"],
    confusion: ["acetylcholine", "centralNorepinephrine"],
    boredom: ["dopamine", "inflammatoryLoad"],
  };
  return (map[family] || []).map((axis) => ({
    axis,
    level: round(state.chemistry[axis].level),
    baseline: round(state.chemistry[axis].baseline),
    confidence: round(state.chemistry[axis].confidence),
    provenance: state.chemistry[axis].provenance,
  }));
}

function supportingMemories(family, memories) {
  const categoryMap = {
    fear: ["threat"],
    anxiety: ["threat", "failure"],
    frustration: ["failure"],
    sadness: ["loss"],
    disappointment: ["failure"],
    shame: ["social"],
    guilt: ["harm"],
    jealousy: ["relationship"],
  };
  const categories = categoryMap[family] || [];
  return memories
    .filter((memory) => categories.includes(memory.category))
    .slice(0, 3)
    .map((memory) => memory.id || memory.description || memory.category);
}

function modulateActions(actions = [], family, physiology) {
  const output = [...actions];
  if (["anger", "envy", "jealousy"].includes(family) && physiology.regulation > 0.62) {
    const confrontIndex = output.findIndex((action) => ["confront", "guardBond", "acquire"].includes(action));
    if (confrontIndex >= 0) output[confrontIndex] = "pauseThenEvaluate";
  }
  if (family === "fear" && physiology.arousal > 0.72 && physiology.regulation < 0.4) {
    output.unshift("startle");
  }
  return [...new Set(output)];
}

function expectedDuration(family, intensity, context) {
  const base = {
    surprise: 12,
    excitement: 90,
    fear: 120,
    anger: 240,
    frustration: 300,
    relief: 180,
    joy: 420,
    curiosity: 480,
    confusion: 360,
    anxiety: 900,
    sadness: 1800,
    guilt: 1500,
    shame: 1200,
    attachment: 3600,
  }[family] || 600;
  const rumination = ["anxiety", "anger", "sadness", "shame", "guilt", "regret"].includes(family)
    ? 1 + 0.8 * context.chronicStress
    : 1;
  return Math.round(base * (0.55 + intensity) * rumination);
}

function resolveTarget(family, targets) {
  for (const key of EMOTION_TARGET_KEYS[family] || ["attentionTarget"]) {
    if (key === "self") return "self";
    if (typeof targets[key] === "string" && targets[key].trim()) return targets[key].trim();
  }
  return "unspecified";
}

function memoryBias(memories, category) {
  let remaining = 1;
  let combined = 0;
  for (const memory of memories) {
    if (memory?.category !== category && !(category === "failure" && memory?.category === "failure")) continue;
    const strength = clamp01(finiteOr(memory.strength, 0.5));
    const unresolved = memory.resolved === true ? 0.25 : 1;
    const recency = clamp01(finiteOr(memory.recency, 0.5));
    const contribution = strength * unresolved * (0.45 + 0.55 * recency);
    combined += remaining * contribution;
    remaining *= 1 - contribution;
  }
  return clamp01(combined);
}

function snapshotChemistry(state) {
  return Object.fromEntries(CHEMICAL_AXES.map((axis) => [axis, {
    level: round(state.chemistry[axis].level),
    baseline: round(state.chemistry[axis].baseline),
    confidence: round(state.chemistry[axis].confidence),
    provenance: state.chemistry[axis].provenance,
  }]));
}

function finiteOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

module.exports = {
  DEFAULT_BASELINES,
  DEFAULT_TAU_SECONDS,
  projectEmotionsAtHorizon,
  simulateEmotionSequence,
};
