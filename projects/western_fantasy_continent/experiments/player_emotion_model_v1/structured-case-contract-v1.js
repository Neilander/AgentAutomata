const crypto = require("node:crypto");
const { deriveEventImpact } = require("./event-impact-engine-v1");

const SOURCE_KINDS = new Set([
  "experiment",
  "interview",
  "documentary",
  "news",
  "literature",
  "film",
  "gameplay_observation",
]);
const SPLITS = new Set(["discovery", "development", "sealed_test"]);
const GOLD_EVIDENCE = new Set([
  "first_person_self_report",
  "contemporaneous_behavior",
  "author_explicit",
  "independent_annotation",
]);

function freezeStructuredInput(input) {
  const unsigned = deepClone(input);
  delete unsigned.contentHash;
  return {
    ...unsigned,
    contentHash: `sha256:${sha256(stableStringify(unsigned))}`,
  };
}

function validateStructuredCaseBundle(bundle, options = {}) {
  const errors = [];
  const source = bundle?.source;
  const input = bundle?.input;
  const gold = bundle?.gold;
  const requireGold = options.requireGold !== false;

  validateSource(source, errors);
  validateInput(input, errors);
  if (requireGold) validateGold(gold, errors);

  const caseIds = [source?.caseId, input?.caseId, gold?.caseId].filter(Boolean);
  if (new Set(caseIds).size > 1) errors.push("source/input/gold caseId must match");

  if (source && input) {
    const sourceFactIds = new Set((source.preEmotionFacts || []).map((fact) => fact.id));
    for (const factId of input.sourceFactIds || []) {
      if (!sourceFactIds.has(factId)) {
        errors.push(`input.sourceFactIds contains unknown fact: ${factId}`);
      }
    }
  }

  if (input?.split === "sealed_test") {
    if (input.annotation?.goldVisibleDuringEncoding !== false) {
      errors.push("sealed_test input annotation must explicitly hide gold");
    }
    if (
      gold
      && input.annotation?.inputAnnotator
      && gold.annotation?.goldAnnotator
      && input.annotation.inputAnnotator === gold.annotation.goldAnnotator
    ) {
      errors.push("sealed_test input and gold annotators must be different");
    }
    const frozenAt = Date.parse(input.annotation?.frozenAt || "");
    const revealedAt = Date.parse(gold?.annotation?.revealedAt || "");
    if (gold && (!Number.isFinite(frozenAt) || !Number.isFinite(revealedAt) || revealedAt <= frozenAt)) {
      errors.push("sealed_test gold must be revealed after the input freeze");
    }
  }

  return errors;
}

function validateSource(source, errors) {
  if (!source || typeof source !== "object") {
    errors.push("source record is required");
    return;
  }
  if (source.schema !== "structured_emotion_source_v1") {
    errors.push("source.schema must equal structured_emotion_source_v1");
  }
  requiredString(errors, source.caseId, "source.caseId");
  requiredString(errors, source.title, "source.title");
  requiredString(errors, source.sourceGroup, "source.sourceGroup");
  requiredString(errors, source.locator, "source.locator");
  if (!SOURCE_KINDS.has(source.kind)) errors.push("source.kind is invalid");
  if (!Array.isArray(source.preEmotionFacts) || source.preEmotionFacts.length === 0) {
    errors.push("source.preEmotionFacts must contain independently checkable facts");
  } else {
    const ids = new Set();
    for (const [index, fact] of source.preEmotionFacts.entries()) {
      requiredString(errors, fact?.id, `source.preEmotionFacts[${index}].id`);
      requiredString(errors, fact?.statement, `source.preEmotionFacts[${index}].statement`);
      requiredString(errors, fact?.locator, `source.preEmotionFacts[${index}].locator`);
      if (ids.has(fact?.id)) errors.push(`duplicate source fact id: ${fact.id}`);
      ids.add(fact?.id);
    }
  }
}

function validateInput(input, errors) {
  if (!input || typeof input !== "object") {
    errors.push("input record is required");
    return;
  }
  if (input.schema !== "structured_emotion_input_v1") {
    errors.push("input.schema must equal structured_emotion_input_v1");
  }
  requiredString(errors, input.caseId, "input.caseId");
  if (!SPLITS.has(input.split)) errors.push("input.split is invalid");
  if (!Array.isArray(input.sourceFactIds) || input.sourceFactIds.length === 0) {
    errors.push("input.sourceFactIds must not be empty");
  }
  requiredString(errors, input.annotation?.inputAnnotator, "input.annotation.inputAnnotator");
  requiredString(errors, input.annotation?.frozenAt, "input.annotation.frozenAt");
  rejectCircularFields(input, "input", errors);

  if (!Array.isArray(input.events) || input.events.length === 0) {
    errors.push("input.events must contain structured events");
  } else {
    let lastTime = -Infinity;
    for (const [index, event] of input.events.entries()) {
      if (Number(event?.time) < lastTime) errors.push("input.events must be chronological");
      lastTime = Number(event?.time);
      try {
        const impact = deriveEventImpact({
          event,
          profile: input.profile || {},
          history: input.history || {},
        });
        if (impact.audit.readNarrativeText || impact.audit.readGoldEmotion) {
          errors.push(`input.events[${index}] impact audit crossed the model boundary`);
        }
      } catch (error) {
        errors.push(`input.events[${index}] invalid: ${error.message}`);
      }
    }
  }

  if (typeof input.contentHash !== "string") {
    errors.push("input.contentHash is required");
  } else {
    const expected = freezeStructuredInput(input).contentHash;
    if (input.contentHash !== expected) errors.push("input.contentHash does not match frozen content");
  }
}

function validateGold(gold, errors) {
  if (!gold || typeof gold !== "object") {
    errors.push("gold record is required");
    return;
  }
  if (gold.schema !== "structured_emotion_gold_v1") {
    errors.push("gold.schema must equal structured_emotion_gold_v1");
  }
  requiredString(errors, gold.caseId, "gold.caseId");
  if (!Array.isArray(gold.emotions) || gold.emotions.length === 0) {
    errors.push("gold.emotions must contain at least one emotion");
  } else {
    for (const [index, emotion] of gold.emotions.entries()) {
      requiredString(errors, emotion?.family, `gold.emotions[${index}].family`);
      if (emotion?.intensityKnown === false) {
        if (emotion.intensity != null) {
          errors.push(`gold.emotions[${index}].intensity must be omitted when unknown`);
        }
      } else {
        const intensity = Number(emotion?.intensity);
        if (!Number.isFinite(intensity) || intensity < 0 || intensity > 1) {
          errors.push(`gold.emotions[${index}].intensity must be in [0,1] or explicitly unknown`);
        }
      }
    }
  }
  if (!GOLD_EVIDENCE.has(gold.evidenceType)) errors.push("gold.evidenceType is invalid");
  requiredString(errors, gold.goldLocator, "gold.goldLocator");
  requiredString(errors, gold.annotation?.goldAnnotator, "gold.annotation.goldAnnotator");
}

function rejectCircularFields(value, path, errors) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (/^(gold|goldEmotion|actualEmotion|emotion|emotions)$/i.test(key)) {
      errors.push(`${childPath} is forbidden in structured input`);
      continue;
    }
    rejectCircularFields(child, childPath, errors);
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requiredString(errors, value, path) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} is required`);
}

module.exports = {
  freezeStructuredInput,
  validateStructuredCaseBundle,
};
