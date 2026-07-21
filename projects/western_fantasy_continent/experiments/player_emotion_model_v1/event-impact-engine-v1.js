const { APPRAISAL_AXES } = require("./emotion-model-contract");

const DEFAULT_PROFILE = Object.freeze({
  goalValues: {},
  relationshipValues: {},
  domainSelfEfficacy: {},
  defaultSelfEfficacy: 0.5,
  riskTolerance: 0.5,
  uncertaintyTolerance: 0.5,
  normSensitivity: 0.6,
  socialEvaluationSensitivity: 0.6,
  contaminationSensitivity: 0.6,
  counterfactualSensitivity: 0.5,
});

function deriveEventImpact({ event, profile = {}, history = {}, context = {} }) {
  validateStructuredEvent(event);
  const person = normalizeProfile(profile);
  const memories = Array.isArray(history.memories) ? history.memories : [];
  const domain = event.domain || "default";
  const failureBias = memoryBias(memories, "failure", domain);
  const threatMemoryBias = memoryBias(memories, "threat", domain);
  const relationshipMemoryBias = memoryBias(memories, "relationship", domain);
  const appraisals = {};
  const add = (axis, value, confidence, basis, components) => {
    if (!APPRAISAL_AXES.includes(axis)) throw new Error(`unsupported appraisal axis: ${axis}`);
    appraisals[axis] = {
      value: round(clamp01(value)),
      confidence: round(clamp01(confidence)),
      basisEventIds: [event.id],
      basis,
      components: Object.fromEntries(
        Object.entries(components || {}).map(([key, component]) => [key, round(component)]),
      ),
      derivedFromGoldEmotion: false,
    };
  };

  const stakeResult = deriveStakes(event, person);
  if (stakeResult.known) {
    const riskGain = 1.12 - 0.24 * person.riskTolerance;
    const rememberedThreat = 0.28 * threatMemoryBias;
    add(
      "threatMagnitude",
      noisyOr([stakeResult.threat * riskGain, rememberedThreat]),
      combineConfidence(stakeResult.confidence, threatMemoryBias > 0 ? 0.62 : 0),
      "objective stakes × valued target × probability, adjusted by risk tolerance and similar memories",
      {
        objectiveThreat: stakeResult.threat,
        riskGain,
        rememberedThreat,
      },
    );
    add(
      "threatImmediacy",
      stakeResult.immediacy,
      stakeResult.confidence,
      "time remaining before the threatened consequence",
      { immediacy: stakeResult.immediacy },
    );
    add(
      "goalRelevance",
      stakeResult.goalRelevance,
      stakeResult.confidence,
      "magnitude of change to goals weighted by this person's goal values",
      { goalRelevance: stakeResult.goalRelevance },
    );
    if (stakeResult.realizedLoss > 0) {
      add(
        "lossGap",
        stakeResult.realizedLoss,
        stakeResult.confidence,
        "realized loss of a valued state or object",
        { realizedLoss: stakeResult.realizedLoss },
      );
      add(
        "irreversibility",
        stakeResult.irreversibility,
        stakeResult.confidence,
        "unrecoverable fraction and recovery time/cost",
        { irreversibility: stakeResult.irreversibility },
      );
    }
  }

  const optionResult = deriveOptions(event, person, failureBias);
  if (optionResult.known) {
    add(
      "controllability",
      optionResult.controllability,
      optionResult.confidence,
      "known effective options × availability × self-efficacy versus event difficulty",
      optionResult.components,
    );
    add(
      "escapeAvailability",
      optionResult.escapeAvailability,
      optionResult.confidence,
      "best currently known escape option",
      { escapeAvailability: optionResult.escapeAvailability },
    );
    if (optionResult.repairOpportunity > 0) {
      add(
        "repairOpportunity",
        optionResult.repairOpportunity,
        optionResult.confidence,
        "best currently known action that can repair the consequence",
        { repairOpportunity: optionResult.repairOpportunity },
      );
    }
  }

  const outcome = event.outcome;
  if (outcome) {
    const confidence = clamp01(finiteOr(outcome.confidence, 0.8));
    if (Number.isFinite(Number(outcome.actualUtility))) {
      add(
        "outcomeValence",
        utilityToUnit(outcome.actualUtility),
        confidence,
        "actual utility of the outcome, independent of whether it was expected",
        { actualUtility: clamp(Number(outcome.actualUtility), -1, 1) },
      );
    }
    if (Number.isFinite(Number(outcome.goalProgress))) {
      const absoluteProgress = Math.abs(clamp(Number(outcome.goalProgress), -1, 1));
      if (!appraisals.goalRelevance) {
        add(
          "goalRelevance",
          absoluteProgress,
          confidence,
          "absolute realized progress reveals how strongly the active goal was affected",
          { absoluteGoalProgress: absoluteProgress },
        );
      }
      add(
        "goalCongruence",
        utilityToUnit(outcome.goalProgress),
        confidence,
        "actual progress toward or away from the active goal",
        { goalProgress: clamp(Number(outcome.goalProgress), -1, 1) },
      );
      if (Number(outcome.goalProgress) < 0) {
        add(
          "obstruction",
          Math.abs(clamp(Number(outcome.goalProgress), -1, 0)),
          confidence,
          "negative progress blocks an active goal",
          { blockedProgress: Math.abs(Number(outcome.goalProgress)) },
        );
      }
    }
    if (
      Number.isFinite(Number(outcome.actualUtility))
      && Number.isFinite(Number(outcome.expectedUtility))
    ) {
      const delta = clamp(Number(outcome.actualUtility), -1, 1)
        - clamp(Number(outcome.expectedUtility), -1, 1);
      const scale = Math.max(0.15, finiteOr(outcome.predictionScale, 0.55));
      add(
        "rewardPredictionError",
        0.5 + 0.5 * Math.tanh(delta / scale),
        Math.min(confidence, clamp01(finiteOr(outcome.expectationConfidence, 0.7))),
        "actual utility minus the pre-event expected utility",
        {
          actualUtility: Number(outcome.actualUtility),
          expectedUtility: Number(outcome.expectedUtility),
          delta,
        },
      );
      add(
        "unexpectedChange",
        Math.min(1, Math.abs(delta) / Math.max(0.25, scale)),
        Math.min(confidence, clamp01(finiteOr(outcome.expectationConfidence, 0.7))),
        "absolute deviation from the frozen pre-event expectation",
        { predictionErrorMagnitude: Math.abs(delta) },
      );
    }
    if (Number.isFinite(Number(outcome.expectedUncertainty))) {
      const raw = clamp01(outcome.expectedUncertainty);
      add(
        "expectedUncertainty",
        raw * (1.12 - 0.24 * person.uncertaintyTolerance),
        clamp01(finiteOr(outcome.expectationConfidence, 0.7)),
        "uncertainty known before the outcome, adjusted by uncertainty tolerance",
        {
          expectedUncertainty: raw,
          uncertaintyTolerance: person.uncertaintyTolerance,
        },
      );
    }
    if (Number.isFinite(Number(outcome.rewardConsumed))) {
      add(
        "rewardConsumption",
        outcome.rewardConsumed,
        confidence,
        "reward is currently received rather than merely possible",
        { rewardConsumed: Number(outcome.rewardConsumed) },
      );
    }
    if (Number.isFinite(Number(outcome.positiveProspect))) {
      add(
        "positiveOutcomeProspect",
        outcome.positiveProspect,
        confidence,
        "valued positive outcome remains possible but not yet consumed",
        { positiveProspect: Number(outcome.positiveProspect) },
      );
    }
    if (Number.isFinite(Number(outcome.selfEvaluationChange))) {
      add(
        "selfEvaluationValence",
        utilityToUnit(outcome.selfEvaluationChange),
        confidence,
        "effect of the outcome on the person's self-evaluation",
        { selfEvaluationChange: Number(outcome.selfEvaluationChange) },
      );
    }
    if (Number.isFinite(Number(outcome.relationshipChange))) {
      add(
        "relationshipValence",
        utilityToUnit(outcome.relationshipChange),
        confidence,
        "effect of the outcome on the focal relationship",
        { relationshipChange: Number(outcome.relationshipChange) },
      );
    }
    const previousThreat = clamp01(finiteOr(context.priorThreat, 0));
    const removed = Number.isFinite(Number(outcome.threatRemovedFraction))
      ? clamp01(outcome.threatRemovedFraction)
      : stakeResult.known
        ? clamp01(1 - stakeResult.threat)
        : 0;
    if (previousThreat > 0.05 && removed > 0.05) {
      add(
        "threatResolution",
        removed,
        confidence,
        "fraction of a previously active threat that is now removed",
        { previousThreat, threatRemovedFraction: removed },
      );
    }
    if (
      Number.isFinite(Number(outcome.bestForeseeableAlternativeUtility))
      && Number.isFinite(Number(outcome.actualUtility))
    ) {
      const gap = Math.max(
        0,
        clamp(Number(outcome.bestForeseeableAlternativeUtility), -1, 1)
          - clamp(Number(outcome.actualUtility), -1, 1),
      ) / 2;
      const foreseeability = clamp01(finiteOr(outcome.alternativeForeseeability, 0.5));
      add(
        "counterfactualBetterOption",
        gap * foreseeability * (0.7 + 0.3 * person.counterfactualSensitivity),
        confidence,
        "advantage of a genuinely available and foreseeable unchosen alternative",
        { utilityGap: gap, foreseeability },
      );
    }
  }

  const agency = event.agency;
  if (agency) {
    const causalContribution = clamp01(finiteOr(agency.causalContribution, 0));
    const evidenceConfidence = clamp01(finiteOr(agency.evidenceConfidence, 0.5));
    const intentionality = clamp01(finiteOr(agency.intentionality, 0));
    add(
      "selfAttribution",
      agency.actorIsSelf === true ? causalContribution : 0,
      evidenceConfidence,
      "causal contribution assigned to the self before emotion decoding",
      { causalContribution, actorIsSelf: agency.actorIsSelf === true ? 1 : 0 },
    );
    add(
      "blameCertainty",
      causalContribution * (0.35 + 0.65 * intentionality),
      evidenceConfidence,
      "causal contribution × intentionality × evidence confidence",
      { causalContribution, intentionality },
    );
  }

  const social = event.social;
  if (social) {
    const confidence = clamp01(finiteOr(social.confidence, 0.7));
    const relationshipValue = relationshipValueFor(person, social.relationshipId);
    if (Number.isFinite(Number(social.safetyChange))) {
      const baselineSafety = clamp01(finiteOr(social.baselineSafety, 0.5));
      add(
        "socialSafety",
        clamp01(baselineSafety + 0.5 * Number(social.safetyChange)),
        confidence,
        "baseline relationship safety plus observed supportive or rejecting behavior",
        { baselineSafety, safetyChange: Number(social.safetyChange) },
      );
    }
    if (Number.isFinite(Number(social.audienceExposure))) {
      add(
        "socialExposure",
        clamp01(social.audienceExposure) * (0.65 + 0.35 * person.socialEvaluationSensitivity),
        confidence,
        "size/salience of the observing audience × social-evaluation sensitivity",
        {
          audienceExposure: Number(social.audienceExposure),
          socialEvaluationSensitivity: person.socialEvaluationSensitivity,
        },
      );
    }
    if (Number.isFinite(Number(social.statusDamage))) {
      add(
        "statusChallenge",
        clamp01(social.statusDamage) * (0.65 + 0.35 * person.socialEvaluationSensitivity),
        confidence,
        "threatened status/reputation × social-evaluation sensitivity",
        { statusDamage: Number(social.statusDamage) },
      );
    }
    if (Number.isFinite(Number(social.normSeverity))) {
      add(
        "normViolation",
        clamp01(social.normSeverity) * (0.6 + 0.4 * person.normSensitivity),
        confidence,
        "objective norm breach × this person's norm sensitivity",
        {
          normSeverity: Number(social.normSeverity),
          normSensitivity: person.normSensitivity,
        },
      );
    }
    if (Number.isFinite(Number(social.harmToOther))) {
      add(
        "harmToOther",
        clamp01(social.harmToOther) * (0.45 + 0.55 * relationshipValue),
        confidence,
        "harm magnitude weighted by value of the affected person",
        { harmMagnitude: Number(social.harmToOther), relationshipValue },
      );
    }
    if (Number.isFinite(Number(social.benefitFromOther))) {
      add(
        "benefitFromOther",
        clamp01(social.benefitFromOther),
        confidence,
        "benefit causally supplied by another person",
        { benefitFromOther: Number(social.benefitFromOther) },
      );
    }
    if (Number.isFinite(Number(social.attachmentRelevance))) {
      add(
        "attachmentRelevance",
        clamp01(social.attachmentRelevance) * (0.45 + 0.55 * relationshipValue),
        confidence,
        "relationship relevance weighted by stored relationship value",
        {
          attachmentRelevance: Number(social.attachmentRelevance),
          relationshipValue,
        },
      );
    }
    if (Number.isFinite(Number(social.relationshipLossProbability))) {
      add(
        "relationshipThreat",
        clamp01(social.relationshipLossProbability)
          * (0.45 + 0.55 * relationshipValue)
          * (1 + 0.18 * relationshipMemoryBias),
        confidence,
        "probability of losing a valued relationship, including unresolved relationship memories",
        {
          lossProbability: Number(social.relationshipLossProbability),
          relationshipValue,
          relationshipMemoryBias,
        },
      );
    }
    if (
      Number.isFinite(Number(social.otherOutcomeUtility))
      && Number.isFinite(Number(social.selfOutcomeUtility))
    ) {
      const disadvantage = Math.max(
        0,
        clamp(Number(social.otherOutcomeUtility), -1, 1)
          - clamp(Number(social.selfOutcomeUtility), -1, 1),
      ) / 2;
      add(
        "comparisonDisadvantage",
        disadvantage * clamp01(finiteOr(social.comparisonRelevance, 0.6)),
        confidence,
        "positive outcome gap favoring a comparison target × comparison relevance",
        { disadvantage, comparisonRelevance: finiteOr(social.comparisonRelevance, 0.6) },
      );
    }
  }

  const sensory = event.sensory;
  if (
    sensory
    && (
      Number.isFinite(Number(sensory.contaminationSeverity))
      || Number.isFinite(Number(sensory.aversiveContactSeverity))
    )
  ) {
    const confidence = clamp01(finiteOr(sensory.confidence, 0.8));
    const contaminationSeverity = clamp01(finiteOr(sensory.contaminationSeverity, 0));
    const aversiveContactSeverity = clamp01(finiteOr(sensory.aversiveContactSeverity, 0));
    const aversionSeverity = Math.max(contaminationSeverity, aversiveContactSeverity);
    add(
      "contamination",
      aversionSeverity * (0.6 + 0.4 * person.contaminationSensitivity),
      confidence,
      "contamination, decay, or unwanted aversive bodily-contact cue × aversion sensitivity",
      {
        contaminationSeverity,
        aversiveContactSeverity,
        contaminationSensitivity: person.contaminationSensitivity,
      },
    );
  }

  const epistemic = event.epistemic;
  if (epistemic) {
    const confidence = clamp01(finiteOr(epistemic.confidence, 0.7));
    if (
      Number.isFinite(Number(epistemic.expectationViolation))
      && !appraisals.unexpectedChange
    ) {
      add(
        "unexpectedChange",
        clamp01(epistemic.expectationViolation),
        confidence,
        "observed state violates the pre-event world model without implying reward loss",
        { expectationViolation: Number(epistemic.expectationViolation) },
      );
    }
    if (Number.isFinite(Number(epistemic.requiredInformationMissing))) {
      add(
        "informationGap",
        clamp01(epistemic.requiredInformationMissing),
        confidence,
        "fraction of decision-relevant information still missing",
        { requiredInformationMissing: Number(epistemic.requiredInformationMissing) },
      );
    }
    if (Number.isFinite(Number(epistemic.familiarity))) {
      const lowGain = 1 - clamp01(finiteOr(epistemic.informationGain, 0));
      add(
        "repetition",
        clamp01(epistemic.familiarity) * lowGain,
        confidence,
        "familiarity × absence of new information",
        {
          familiarity: Number(epistemic.familiarity),
          informationGain: finiteOr(epistemic.informationGain, 0),
        },
      );
    }
  }

  return {
    schema: "event_impact_v1",
    eventId: event.id,
    time: event.time,
    appraisals,
    targets: event.targets || {},
    audit: {
      readNarrativeText: false,
      readGoldEmotion: false,
      formulaVersion: "event-impact-v1",
      memoryBias: {
        failure: round(failureBias),
        threat: round(threatMemoryBias),
        relationship: round(relationshipMemoryBias),
      },
    },
  };
}

function deriveStakes(event, profile) {
  const stakes = Array.isArray(event.stakes) ? event.stakes : [];
  if (stakes.length === 0) return {
    known: false,
    threat: 0,
    immediacy: 0,
    goalRelevance: 0,
    realizedLoss: 0,
    irreversibility: 0,
    confidence: 0,
  };
  const threatContributions = [];
  const relevanceContributions = [];
  const realizedLosses = [];
  const irreversibleLosses = [];
  const confidences = [];
  let immediacy = 0;
  for (const stake of stakes) {
    const magnitude = clamp01(finiteOr(stake.magnitude, 0));
    const probability = clamp01(finiteOr(stake.probability, 1));
    const value = goalValueFor(profile, stake.valueKey || stake.targetId);
    const confidence = clamp01(finiteOr(stake.confidence, 0.7));
    const negative = stake.direction === "positive" ? 0 : 1;
    const realizedFraction = clamp01(finiteOr(stake.realizedFraction, 0));
    const ongoingThreatFraction = clamp01(finiteOr(stake.ongoingThreatFraction, 0));
    const prospectiveFraction = Math.max(1 - realizedFraction, ongoingThreatFraction);
    threatContributions.push(
      magnitude * value * probability * negative * prospectiveFraction,
    );
    relevanceContributions.push(magnitude * value);
    const time = Math.max(0, finiteOr(stake.timeToImpactSeconds, 300));
    const horizon = Math.max(1, finiteOr(stake.immediacyHorizonSeconds, 60));
    immediacy = Math.max(
      immediacy,
      magnitude * prospectiveFraction * Math.exp(-time / horizon),
    );
    const realized = magnitude * value * realizedFraction * negative;
    realizedLosses.push(realized);
    irreversibleLosses.push(
      realized * clamp01(finiteOr(stake.irreversibility, 0)),
    );
    confidences.push(confidence);
  }
  const realizedLoss = noisyOr(realizedLosses);
  const irreversibility = realizedLoss > 0
    ? clamp01(irreversibleLosses.reduce((sum, value) => sum + value, 0) / realizedLoss)
    : 0;
  return {
    known: true,
    threat: noisyOr(threatContributions),
    immediacy: clamp01(immediacy),
    goalRelevance: noisyOr(relevanceContributions),
    realizedLoss,
    irreversibility,
    confidence: mean(confidences),
  };
}

function deriveOptions(event, profile, failureBias) {
  const options = Array.isArray(event.options) ? event.options : [];
  const difficulty = clamp01(finiteOr(event.difficulty, 0.5));
  if (options.length === 0 && !Number.isFinite(Number(event.difficulty))) {
    return {
      known: false,
      controllability: 0,
      escapeAvailability: 0,
      repairOpportunity: 0,
      confidence: 0,
      components: {},
    };
  }
  const domain = event.domain || "default";
  const selfEfficacy = clamp01(
    profile.domainSelfEfficacy[domain] ?? profile.defaultSelfEfficacy,
  ) * (1 - 0.38 * failureBias);
  const effectiveOptions = [];
  let escapeAvailability = 0;
  let repairOpportunity = 0;
  const confidences = [];
  for (const option of options) {
    const availability = clamp01(finiteOr(option.availability, 0));
    const known = clamp01(finiteOr(option.known, 0));
    const effectiveness = clamp01(finiteOr(option.expectedEffectiveness, 0));
    const costPenalty = 1 - 0.45 * clamp01(finiteOr(option.cost, 0));
    const confidence = clamp01(finiteOr(option.confidence, 0.65));
    const effective = availability * known * effectiveness * costPenalty * confidence;
    effectiveOptions.push(effective);
    if (option.type === "escape") escapeAvailability = Math.max(escapeAvailability, effective);
    if (option.type === "repair") repairOpportunity = Math.max(repairOpportunity, effective);
    confidences.push(confidence);
  }
  const optionCoverage = noisyOr(effectiveOptions);
  const controllability = logistic(
    3.1 * (optionCoverage - difficulty)
      + 1.8 * (selfEfficacy - 0.5),
  );
  return {
    known: true,
    controllability,
    escapeAvailability,
    repairOpportunity,
    confidence: confidences.length ? mean(confidences) : 0.45,
    components: {
      optionCoverage,
      difficulty,
      selfEfficacy,
      failureMemoryPenalty: failureBias,
    },
  };
}

function normalizeProfile(profile) {
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    goalValues: { ...DEFAULT_PROFILE.goalValues, ...(profile.goalValues || {}) },
    relationshipValues: {
      ...DEFAULT_PROFILE.relationshipValues,
      ...(profile.relationshipValues || {}),
    },
    domainSelfEfficacy: {
      ...DEFAULT_PROFILE.domainSelfEfficacy,
      ...(profile.domainSelfEfficacy || {}),
    },
  };
}

function validateStructuredEvent(event) {
  if (!event || typeof event !== "object") throw new Error("event must be an object");
  if (typeof event.id !== "string" || !event.id.trim()) throw new Error("event.id is required");
  if (!Number.isFinite(Number(event.time))) throw new Error("event.time must be finite");
  if (Object.prototype.hasOwnProperty.call(event, "emotion")
    || Object.prototype.hasOwnProperty.call(event, "goldEmotion")) {
    throw new Error("structured event cannot contain an emotion answer");
  }
}

function goalValueFor(profile, key) {
  if (key && Number.isFinite(Number(profile.goalValues[key]))) {
    return clamp01(profile.goalValues[key]);
  }
  return 0.5;
}

function relationshipValueFor(profile, key) {
  if (key && Number.isFinite(Number(profile.relationshipValues[key]))) {
    return clamp01(profile.relationshipValues[key]);
  }
  return 0.5;
}

function memoryBias(memories, category, domain) {
  let combined = 0;
  let remaining = 1;
  for (const memory of memories) {
    if (memory?.category !== category) continue;
    if (memory.domain && domain && memory.domain !== domain) continue;
    const strength = clamp01(finiteOr(memory.strength, 0.5));
    const recency = clamp01(finiteOr(memory.recency, 0.5));
    const countGain = 1 - Math.exp(-Math.max(1, finiteOr(memory.count, 1)) / 3);
    const unresolved = memory.resolved === true ? 0.22 : 1;
    const contribution = strength * (0.4 + 0.6 * recency) * (0.55 + 0.45 * countGain) * unresolved;
    combined += remaining * contribution;
    remaining *= 1 - contribution;
  }
  return clamp01(combined);
}

function noisyOr(values) {
  return clamp01(1 - values.reduce((remaining, value) => remaining * (1 - clamp01(value)), 1));
}

function combineConfidence(first, second) {
  if (second <= 0) return first;
  return noisyOr([0.75 * first, 0.45 * second]);
}

function utilityToUnit(value) {
  return 0.5 + 0.5 * clamp(Number(value), -1, 1);
}

function logistic(value) {
  return 1 / (1 + Math.exp(-value));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
  deriveEventImpact,
};
