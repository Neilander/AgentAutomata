const fs = require("fs");
const path = require("path");
const {
  projectEmotionsAtHorizon,
  simulateEmotionSequence,
} = require("./emotion-simulator-v1");
const { encodeIsearSituation } = require("./isear-appraisal-encoder-v1");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const INPUTS = path.join(DATA_DIR, "development.inputs.jsonl");
const COGNITION = process.env.QUESTIONNAIRE_COGNITION_FILE
  ? path.resolve(process.env.QUESTIONNAIRE_COGNITION_FILE)
  : path.join(DATA_DIR, "development.questionnaire-cognition-v1.jsonl");
const PHYSICAL = process.env.QUESTIONNAIRE_PHYSICAL_FILE
  ? path.resolve(process.env.QUESTIONNAIRE_PHYSICAL_FILE)
  : path.join(DATA_DIR, "development.questionnaire-physical-v1.jsonl");
const USE_PHYSICAL = process.env.USE_QUESTIONNAIRE_PHYSICAL === "1";
const USE_TEXT_APPRAISALS = process.env.USE_TEXT_APPRAISALS === "1";
const OUTPUT = process.env.QUESTIONNAIRE_PREDICTIONS_FILE
  ? path.resolve(process.env.QUESTIONNAIRE_PREDICTIONS_FILE)
  : path.join(DATA_DIR, "development.questionnaire-predictions-v1.jsonl");

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const inputs = readJsonl(INPUTS);
const cognitionById = new Map(readJsonl(COGNITION).map((record) => [record.caseId, record]));
const physicalById = USE_PHYSICAL
  ? new Map(readJsonl(PHYSICAL).map((record) => [record.caseId, record]))
  : new Map();
const predictions = inputs.map((input) => {
  const cognition = cognitionById.get(input.caseId);
  if (!cognition) throw new Error(`missing questionnaire cognition for ${input.caseId}`);
  const textEncoding = USE_TEXT_APPRAISALS ? encodeIsearSituation(input) : { appraisals: {} };
  const combinedAppraisals = {
    ...textEncoding.appraisals,
    ...cognition.appraisals,
  };
  const simulation = simulateEmotionSequence({
    profile: {},
    initialPhysiology: { chemistry: {} },
    longTermContext: {},
    events: [{
      id: input.caseId,
      time: 0,
      description: input.observableBeforeInference.situation,
      appraisals: combinedAppraisals,
      observedPhysical: physicalById.get(input.caseId)?.observedPhysical || {},
      targets: { attentionTarget: "reported situation" },
    }],
  }, { emotionThreshold: 0.08, maxEmotions: 7 });
  const settledEmotions = projectEmotionsAtHorizon(simulation.frames[0].emotions, 60);
  return {
    schema: "isear_emotion_prediction_v1",
    caseId: input.caseId,
    split: input.split,
    sourceGroup: input.sourceGroup,
    evaluationTracks: input.evaluationTracks,
    encoding: cognition,
    textAppraisalsAdded: USE_TEXT_APPRAISALS,
    physicalConditioned: USE_PHYSICAL,
    predictions: settledEmotions.map((emotion) => ({
      family: emotion.family,
      intensity: emotion.intensity,
      onsetIntensity: emotion.onsetIntensity,
      confidence: emotion.confidence,
    })),
    predictionHorizonSeconds: 60,
  };
});

const body = predictions.map((prediction) => JSON.stringify(prediction)).join("\n");
if (body.includes("reportedEmotionFamily")) throw new Error("emotion label leaked into predictions");
fs.writeFileSync(OUTPUT, `${body}\n`, "utf8");
console.log(JSON.stringify({
  status: "PASS",
  predictions: predictions.length,
  questionnaireConditioned: true,
  physicalConditioned: USE_PHYSICAL,
  textAppraisalsAdded: USE_TEXT_APPRAISALS,
  emotionLabelReadByPredictor: false,
  output: OUTPUT,
}, null, 2));
