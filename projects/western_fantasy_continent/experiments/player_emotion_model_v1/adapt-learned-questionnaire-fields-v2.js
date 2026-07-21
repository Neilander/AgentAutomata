const fs = require("fs");
const path = require("path");
const { mapQuestionnaire } = require("./prepare-isear-questionnaire-cognition-v1");
const { mapQuestionnairePhysical } = require("./prepare-isear-questionnaire-physical-v1");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const INPUT = path.join(DATA_DIR, "development.sklearn-questionnaire-fields-v2.jsonl");
const COGNITION_OUTPUT = path.join(DATA_DIR, "development.sklearn-cognition-v2.jsonl");
const PHYSICAL_OUTPUT = path.join(DATA_DIR, "development.sklearn-physical-v2.jsonl");

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function lowerConfidence(record, fieldConfidence, factor) {
  for (const entry of Object.values(record.appraisals || record.observedPhysical || {})) {
    const basisFields = String(entry.basis || "")
      .match(/[A-Z][A-Z0-9]+/g) || [];
    const learnedConfidence = basisFields.length
      ? Math.min(...basisFields.map((field) => fieldConfidence[field] ?? 0.45))
      : 0.45;
    entry.confidence = Math.round(entry.confidence * learnedConfidence * factor * 1000) / 1000;
  }
}

function writeJsonl(file, records) {
  const body = records.map((record) => JSON.stringify(record)).join("\n");
  if (body.includes("reportedEmotionFamily")) throw new Error(`emotion label leaked into ${file}`);
  fs.writeFileSync(file, `${body}\n`, "utf8");
}

const cognition = [];
const physical = [];
for (const prediction of readJsonl(INPUT)) {
  const synthetic = {
    caseId: prediction.caseId,
    split: prediction.split,
    sourceGroup: prediction.sourceGroup,
    researchOnlyPostEmotionFields: prediction.predictedFields,
  };
  const cognitionRecord = mapQuestionnaire(synthetic);
  cognitionRecord.schema = "isear_sklearn_cognition_v2";
  cognitionRecord.protocol = prediction.protocol;
  lowerConfidence(cognitionRecord, prediction.fieldConfidence, 0.82);
  cognition.push(cognitionRecord);

  const physicalRecord = mapQuestionnairePhysical(synthetic, "modelled");
  physicalRecord.schema = "isear_sklearn_physical_v2";
  physicalRecord.protocol = {
    ...prediction.protocol,
    chemistryInferred: false,
  };
  lowerConfidence(physicalRecord, prediction.fieldConfidence, 0.78);
  physical.push(physicalRecord);
}

writeJsonl(COGNITION_OUTPUT, cognition);
writeJsonl(PHYSICAL_OUTPUT, physical);
console.log(JSON.stringify({
  status: "PASS",
  records: cognition.length,
  emotionLabelUsedAsTrainingTarget: false,
  outputs: {
    cognition: COGNITION_OUTPUT,
    physical: PHYSICAL_OUTPUT,
  },
}, null, 2));
