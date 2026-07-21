const CASE_SCHEMA = "player_emotion_case_v1";

const CHEMICAL_AXES = Object.freeze([
  "centralNorepinephrine",
  "epinephrine",
  "cortisol",
  "dopamine",
  "serotonin",
  "acetylcholine",
  "endogenousOpioid",
  "endocannabinoid",
  "oxytocin",
  "vasopressin",
  "testosterone",
  "inflammatoryLoad",
]);

const PHYSICAL_AXES = Object.freeze([
  "sympatheticArousal",
  "somaticDistress",
  "approachWithdrawal",
  "expressiveActivation",
  "smiling",
  "crying",
  "aggression",
  "vocalActivation",
  "temperatureActivation",
]);

const APPRAISAL_AXES = Object.freeze([
  "threatMagnitude",
  "threatImmediacy",
  "controllability",
  "escapeAvailability",
  "obstruction",
  "blameCertainty",
  "goalRelevance",
  "rewardPredictionError",
  "rewardConsumption",
  "expectedUncertainty",
  "unexpectedChange",
  "socialSafety",
  "statusChallenge",
  "selfAttribution",
  "lossGap",
  "irreversibility",
  "normViolation",
  "positiveOutcomeProspect",
  "threatResolution",
  "contamination",
  "socialExposure",
  "harmToOther",
  "repairOpportunity",
  "counterfactualBetterOption",
  "attachmentRelevance",
  "benefitFromOther",
  "comparisonDisadvantage",
  "relationshipThreat",
  "informationGap",
  "repetition",
  "outcomeValence",
  "goalCongruence",
  "selfEvaluationValence",
  "relationshipValence",
]);

const EMOTION_FAMILIES = Object.freeze([
  "fear",
  "anxiety",
  "anger",
  "frustration",
  "sadness",
  "disappointment",
  "disgust",
  "joy",
  "excitement",
  "satisfaction",
  "relief",
  "hope",
  "pride",
  "shame",
  "guilt",
  "regret",
  "attachment",
  "gratitude",
  "envy",
  "jealousy",
  "surprise",
  "curiosity",
  "confusion",
  "boredom",
]);

const SPLITS = new Set(["train", "development", "sealed_test"]);
const SOURCE_KINDS = new Set(["literature", "film", "documentary", "news", "interview", "experiment"]);
const CHEMISTRY_PROVENANCE = new Set(["measured", "profile_baseline", "unknown"]);
const PHYSICAL_PROVENANCE = new Set(["measured", "self_reported", "modelled", "unknown"]);
const GOLD_EVIDENCE_LEVELS = new Set(["A", "B", "C"]);

function validateCaseRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["case must be an object"];
  requiredEqual(errors, record.schema, CASE_SCHEMA, "schema");
  requiredString(errors, record.id, "id");
  if (!SPLITS.has(record.split)) errors.push("split must be train, development, or sealed_test");

  const source = record.source;
  if (!source || typeof source !== "object") {
    errors.push("source is required");
  } else {
    if (!SOURCE_KINDS.has(source.kind)) errors.push("source.kind is invalid");
    requiredString(errors, source.title, "source.title");
    requiredString(errors, source.sourceGroup, "source.sourceGroup");
    requiredString(errors, source.locator, "source.locator");
  }

  const protocol = record.annotationProtocol;
  if (!protocol || typeof protocol !== "object") {
    errors.push("annotationProtocol is required");
  } else {
    if (protocol.inputFrozenBeforeGoldReview !== true) {
      errors.push("annotationProtocol.inputFrozenBeforeGoldReview must be true");
    }
    if (protocol.usedGoldEmotionToInferInputs !== false) {
      errors.push("annotationProtocol.usedGoldEmotionToInferInputs must be false");
    }
    requiredString(errors, protocol.inputAnnotator, "annotationProtocol.inputAnnotator");
    requiredString(errors, protocol.goldAnnotator, "annotationProtocol.goldAnnotator");
  }

  const input = record.modelInput;
  if (!input || typeof input !== "object") {
    errors.push("modelInput is required");
  } else {
    validateChemistry(errors, input.initialPhysiology?.chemistry || {});
    validateAppraisals(errors, input.appraisals || {});
    if (!Array.isArray(input.eventSequence) || input.eventSequence.length === 0) {
      errors.push("modelInput.eventSequence must contain at least one pre-emotion observable event");
    } else {
      let previousTime = -Infinity;
      input.eventSequence.forEach((event, index) => {
        const time = Number(event?.time);
        if (!Number.isFinite(time)) errors.push(`modelInput.eventSequence[${index}].time must be finite`);
        if (time < previousTime) errors.push("modelInput.eventSequence must be chronological");
        previousTime = time;
        requiredString(errors, event?.description, `modelInput.eventSequence[${index}].description`);
        validatePhysical(errors, event?.observedPhysical || {}, `modelInput.eventSequence[${index}].observedPhysical`);
        if (event?.derivedFromGoldEmotion === true) {
          errors.push(`modelInput.eventSequence[${index}] cannot be derived from the gold emotion`);
        }
      });
    }
  }

  const gold = record.gold;
  if (!gold || !Array.isArray(gold.emotions) || gold.emotions.length === 0) {
    errors.push("gold.emotions must contain at least one label");
  } else {
    gold.emotions.forEach((emotion, index) => validateGoldEmotion(errors, emotion, index));
  }

  return errors;
}

function validatePhysical(errors, physical, path) {
  for (const [axis, entry] of Object.entries(physical)) {
    if (!PHYSICAL_AXES.includes(axis)) {
      errors.push(`unknown physical axis: ${axis}`);
      continue;
    }
    if (!entry || typeof entry !== "object") {
      errors.push(`${path}.${axis} must be an object`);
      continue;
    }
    const value = Number(entry.value);
    const validValue = axis === "approachWithdrawal"
      ? Number.isFinite(value) && value >= -1 && value <= 1
      : Number.isFinite(value) && value >= 0 && value <= 1;
    if (!validValue) {
      errors.push(`${path}.${axis}.value must be ${axis === "approachWithdrawal" ? "in [-1,1]" : "in [0,1]"}`);
    }
    bounded(errors, entry.confidence, `${path}.${axis}.confidence`);
    if (!PHYSICAL_PROVENANCE.has(entry.provenance)) {
      errors.push(`${path}.${axis}.provenance is invalid`);
    }
    if (entry.derivedFromGoldEmotion === true) {
      errors.push(`${path}.${axis} cannot be derived from the gold emotion`);
    }
  }
}

function validateCorpus(records) {
  const errors = [];
  const ids = new Set();
  const groupSplit = new Map();
  for (const record of records || []) {
    const caseErrors = validateCaseRecord(record);
    errors.push(...caseErrors.map((error) => `${record?.id || "unknown"}: ${error}`));
    if (record?.id) {
      if (ids.has(record.id)) errors.push(`${record.id}: duplicate id`);
      ids.add(record.id);
    }
    const group = record?.source?.sourceGroup;
    if (group && record?.split) {
      const existing = groupSplit.get(group);
      if (existing && existing !== record.split) {
        errors.push(`${record.id}: sourceGroup ${group} leaks across ${existing} and ${record.split}`);
      } else groupSplit.set(group, record.split);
    }
  }
  return errors;
}

function validateChemistry(errors, chemistry) {
  for (const [axis, entry] of Object.entries(chemistry)) {
    if (!CHEMICAL_AXES.includes(axis)) {
      errors.push(`unknown chemistry axis: ${axis}`);
      continue;
    }
    if (!entry || typeof entry !== "object") {
      errors.push(`chemistry.${axis} must be an object`);
      continue;
    }
    bounded(errors, entry.level, `chemistry.${axis}.level`);
    bounded(errors, entry.baseline, `chemistry.${axis}.baseline`);
    bounded(errors, entry.confidence, `chemistry.${axis}.confidence`);
    if (!CHEMISTRY_PROVENANCE.has(entry.provenance)) {
      errors.push(`chemistry.${axis}.provenance must be measured, profile_baseline, or unknown`);
    }
    if (entry.derivedFromGoldEmotion === true) {
      errors.push(`chemistry.${axis} cannot be derived from the gold emotion`);
    }
  }
}

function validateAppraisals(errors, appraisals) {
  for (const [axis, entry] of Object.entries(appraisals)) {
    if (!APPRAISAL_AXES.includes(axis)) {
      errors.push(`unknown appraisal axis: ${axis}`);
      continue;
    }
    if (!entry || typeof entry !== "object") {
      errors.push(`appraisals.${axis} must be an object`);
      continue;
    }
    bounded(errors, entry.value, `appraisals.${axis}.value`);
    bounded(errors, entry.confidence, `appraisals.${axis}.confidence`);
    if (!Array.isArray(entry.basisEventIds) || entry.basisEventIds.length === 0) {
      errors.push(`appraisals.${axis}.basisEventIds must cite pre-emotion evidence`);
    }
    if (entry.derivedFromGoldEmotion === true) {
      errors.push(`appraisals.${axis} cannot be derived from the gold emotion`);
    }
  }
}

function validateGoldEmotion(errors, emotion, index) {
  const prefix = `gold.emotions[${index}]`;
  if (!EMOTION_FAMILIES.includes(emotion?.family)) errors.push(`${prefix}.family is invalid`);
  requiredString(errors, emotion?.target, `${prefix}.target`);
  if (!GOLD_EVIDENCE_LEVELS.has(emotion?.evidenceLevel)) errors.push(`${prefix}.evidenceLevel must be A, B, or C`);
  if (!Array.isArray(emotion?.evidenceRefs) || emotion.evidenceRefs.length === 0) {
    errors.push(`${prefix}.evidenceRefs must not be empty`);
  }
  if (emotion?.intensityRange != null) {
    if (!Array.isArray(emotion.intensityRange) || emotion.intensityRange.length !== 2) {
      errors.push(`${prefix}.intensityRange must be [min,max]`);
    } else {
      bounded(errors, emotion.intensityRange[0], `${prefix}.intensityRange[0]`);
      bounded(errors, emotion.intensityRange[1], `${prefix}.intensityRange[1]`);
      if (Number(emotion.intensityRange[0]) > Number(emotion.intensityRange[1])) {
        errors.push(`${prefix}.intensityRange must be ascending`);
      }
    }
  }
}

function bounded(errors, value, path) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1) errors.push(`${path} must be in [0,1]`);
}

function requiredString(errors, value, path) {
  if (typeof value !== "string" || value.trim() === "") errors.push(`${path} must be a non-empty string`);
}

function requiredEqual(errors, value, expected, path) {
  if (value !== expected) errors.push(`${path} must equal ${expected}`);
}

module.exports = {
  APPRAISAL_AXES,
  CASE_SCHEMA,
  CHEMICAL_AXES,
  EMOTION_FAMILIES,
  PHYSICAL_AXES,
  validateCaseRecord,
  validateCorpus,
};
