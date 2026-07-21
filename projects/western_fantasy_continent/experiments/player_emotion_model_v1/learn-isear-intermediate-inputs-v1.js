const fs = require("fs");
const path = require("path");
const { mapQuestionnaire } = require("./prepare-isear-questionnaire-cognition-v1");
const { mapQuestionnairePhysical } = require("./prepare-isear-questionnaire-physical-v1");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const TRAIN_INPUTS = path.join(DATA_DIR, "train.inputs.jsonl");
const TRAIN_GOLD = path.join(DATA_DIR, "train.gold.jsonl");
const DEVELOPMENT_INPUTS = path.join(DATA_DIR, "development.inputs.jsonl");
const COGNITION_OUTPUT = path.join(DATA_DIR, "development.learned-cognition-v1.jsonl");
const PHYSICAL_OUTPUT = path.join(DATA_DIR, "development.learned-physical-v1.jsonl");
const DIAGNOSTIC_OUTPUT = path.join(DATA_DIR, "development.learned-questionnaire-fields-v1.jsonl");

const FIELDS = Object.freeze([
  "ERGO", "TROPHO", "TEMPER", "EXPRES", "MOVE", "EXP1", "EXP2", "EXP10", "PARAL",
  "CON", "EXPC", "PLEA", "PLAN", "FAIR", "CAUS", "COPING", "MORL", "SELF", "RELA",
  "VERBAL",
]);

const EMOTION_WORDS = new Set([
  "anger", "angry", "annoyed", "rage", "furious",
  "fear", "afraid", "scared", "terror", "frightened",
  "joy", "joyful", "happy", "delighted", "elated",
  "sad", "sadness", "sorrow", "grief", "depressed",
  "disgust", "disgusted", "disgusting", "revolted", "repulsed",
  "shame", "ashamed", "embarrassed", "humiliated",
  "guilt", "guilty", "remorse",
]);

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function tokenize(text) {
  const words = String(text || "").toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  const filtered = words.filter((word) => !EMOTION_WORDS.has(word));
  const features = filtered.map((word) => `u:${word}`);
  for (let index = 0; index < filtered.length - 1; index++) {
    features.push(`b:${filtered[index]}_${filtered[index + 1]}`);
  }
  return features;
}

function buildVocabulary(documents) {
  const documentFrequency = new Map();
  for (const features of documents) {
    for (const feature of new Set(features)) {
      documentFrequency.set(feature, (documentFrequency.get(feature) || 0) + 1);
    }
  }
  const maximumFrequency = documents.length * 0.72;
  return new Set(
    [...documentFrequency.entries()]
      .filter(([, count]) => count >= 3 && count <= maximumFrequency)
      .map(([feature]) => feature),
  );
}

function makeModel() {
  return {
    classDocuments: new Map(),
    classTokenTotals: new Map(),
    classTokenCounts: new Map(),
    totalDocuments: 0,
  };
}

function trainModels(trainRows, vocabulary) {
  const models = Object.fromEntries(FIELDS.map((field) => [field, makeModel()]));
  for (const row of trainRows) {
    const frequencies = featureFrequencies(row.features, vocabulary);
    for (const field of FIELDS) {
      const className = String(row.questionnaire[field]);
      const model = models[field];
      model.totalDocuments++;
      model.classDocuments.set(className, (model.classDocuments.get(className) || 0) + 1);
      if (!model.classTokenCounts.has(className)) model.classTokenCounts.set(className, new Map());
      const tokenCounts = model.classTokenCounts.get(className);
      let tokenTotal = model.classTokenTotals.get(className) || 0;
      for (const [feature, count] of frequencies) {
        tokenCounts.set(feature, (tokenCounts.get(feature) || 0) + count);
        tokenTotal += count;
      }
      model.classTokenTotals.set(className, tokenTotal);
    }
  }
  return models;
}

function predictField(model, features, vocabulary) {
  const frequencies = featureFrequencies(features, vocabulary);
  const alpha = 0.35;
  const vocabularySize = vocabulary.size;
  const scores = [];
  const classCount = model.classDocuments.size;
  for (const [className, documents] of model.classDocuments) {
    const tokenCounts = model.classTokenCounts.get(className);
    const denominator = model.classTokenTotals.get(className) + alpha * vocabularySize;
    let score = Math.log((documents + alpha) / (model.totalDocuments + alpha * classCount));
    for (const [feature, count] of frequencies) {
      score += count * Math.log(((tokenCounts.get(feature) || 0) + alpha) / denominator);
    }
    scores.push({ className, score });
  }
  scores.sort((left, right) => right.score - left.score);
  const maximum = scores[0].score;
  const weights = scores.map((item) => Math.exp(item.score - maximum));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return {
    value: Number(scores[0].className),
    confidence: Math.min(0.9, Math.max(0.2, weights[0] / total)),
    margin: scores.length > 1 ? Math.min(1, (scores[0].score - scores[1].score) / 8) : 1,
  };
}

function featureFrequencies(features, vocabulary) {
  const frequencies = new Map();
  for (const feature of features) {
    if (!vocabulary.has(feature)) continue;
    frequencies.set(feature, (frequencies.get(feature) || 0) + 1);
  }
  return frequencies;
}

function lowerInferredConfidence(record, factor) {
  for (const entry of Object.values(record.appraisals || record.observedPhysical || {})) {
    entry.confidence = Math.round(entry.confidence * factor * 1000) / 1000;
  }
}

function writeJsonl(file, records) {
  const body = records.map((record) => JSON.stringify(record)).join("\n");
  if (body.includes("reportedEmotionFamily")) throw new Error(`emotion label leaked into ${file}`);
  fs.writeFileSync(file, `${body}\n`, "utf8");
}

function main() {
  const trainInputs = readJsonl(TRAIN_INPUTS);
  const trainGoldById = new Map(readJsonl(TRAIN_GOLD).map((record) => [record.caseId, record]));
  const trainRows = trainInputs.map((input) => {
    const gold = trainGoldById.get(input.caseId);
    if (!gold) throw new Error(`missing training intermediate fields for ${input.caseId}`);
    return {
      features: tokenize(input.observableBeforeInference.situation),
      questionnaire: gold.researchOnlyPostEmotionFields,
    };
  });
  const vocabulary = buildVocabulary(trainRows.map((row) => row.features));
  const models = trainModels(trainRows, vocabulary);
  const developmentInputs = readJsonl(DEVELOPMENT_INPUTS);
  const cognitionRecords = [];
  const physicalRecords = [];
  const diagnosticRecords = [];

  for (const input of developmentInputs) {
    const features = tokenize(input.observableBeforeInference.situation);
    const predictedFields = {};
    const fieldConfidence = {};
    for (const field of FIELDS) {
      const prediction = predictField(models[field], features, vocabulary);
      predictedFields[field] = prediction.value;
      fieldConfidence[field] = {
        confidence: Math.round(prediction.confidence * 1000) / 1000,
        margin: Math.round(prediction.margin * 1000) / 1000,
      };
    }
    const synthetic = {
      caseId: input.caseId,
      split: input.split,
      sourceGroup: input.sourceGroup,
      researchOnlyPostEmotionFields: predictedFields,
    };
    const cognition = mapQuestionnaire(synthetic);
    cognition.schema = "isear_learned_cognition_v1";
    cognition.protocol = {
      emotionLabelReadByLearner: false,
      trainingTarget: "questionnaire cognitive fields only",
      directEmotionWordsRemoved: true,
    };
    lowerInferredConfidence(cognition, 0.62);
    cognitionRecords.push(cognition);

    const physical = mapQuestionnairePhysical(synthetic, "modelled");
    physical.schema = "isear_learned_physical_v1";
    physical.protocol = {
      emotionLabelReadByLearner: false,
      chemistryInferred: false,
      trainingTarget: "questionnaire physical/behavior fields only",
      directEmotionWordsRemoved: true,
    };
    lowerInferredConfidence(physical, 0.58);
    physicalRecords.push(physical);
    diagnosticRecords.push({
      schema: "isear_learned_questionnaire_fields_v1",
      caseId: input.caseId,
      split: input.split,
      sourceGroup: input.sourceGroup,
      predictedFields,
      fieldConfidence,
    });
  }

  writeJsonl(COGNITION_OUTPUT, cognitionRecords);
  writeJsonl(PHYSICAL_OUTPUT, physicalRecords);
  writeJsonl(DIAGNOSTIC_OUTPUT, diagnosticRecords);
  console.log(JSON.stringify({
    status: "PASS",
    trainingCases: trainRows.length,
    developmentCases: developmentInputs.length,
    vocabularySize: vocabulary.size,
    predictedIntermediateFields: FIELDS.length,
    emotionLabelReadByLearner: false,
    directEmotionWordsRemoved: true,
    outputs: {
      cognition: COGNITION_OUTPUT,
      physical: PHYSICAL_OUTPUT,
      diagnostics: DIAGNOSTIC_OUTPUT,
    },
  }, null, 2));
}

main();
