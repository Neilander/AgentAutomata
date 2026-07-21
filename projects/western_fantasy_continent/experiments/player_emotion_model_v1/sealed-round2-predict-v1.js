const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { round2StructuredInputs } = require("./sealed-round2-structured-inputs-v1");
const { predict } = require("./sealed-round1-predict-v1");

const ROOT = __dirname;
const ROUND_DIR = path.join(ROOT, "data", "blind_rounds", "v2");
const INPUT_FILE = path.join(ROUND_DIR, "round2.inputs.jsonl");
const PRE_REGISTRATION_FILE = path.join(ROUND_DIR, "round2.pre_registered.json");
const STRUCTURED_FILE = path.join(ROUND_DIR, "round2.structured-inputs.frozen.jsonl");
const PREDICTION_FILE = path.join(ROUND_DIR, "round2.predictions.frozen.jsonl");
const FROZEN_MANIFEST_FILE = path.join(ROUND_DIR, "round2.frozen-manifest.json");
const MODEL_FILES = [
  "emotion-model-contract.js",
  "event-impact-engine-v1.js",
  "emotion-simulator-v1.js",
  "structured-emotion-pipeline-v1.js",
  "sealed-round2-structured-inputs-v1.js",
];

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function jsonLines(records) {
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
}

function main() {
  const freeze = process.argv.includes("--freeze");
  const preRegistration = JSON.parse(fs.readFileSync(PRE_REGISTRATION_FILE, "utf8"));
  const inputText = fs.readFileSync(INPUT_FILE, "utf8");
  if (sha256(inputText) !== preRegistration.round2.inputSha256) {
    throw new Error("round 2 input changed after pre-registration");
  }
  const strictIds = readJsonLines(INPUT_FILE)
    .filter((record) => record.evaluationTracks?.strictEmotionInference === true)
    .map((record) => record.caseId)
    .sort();
  const structuredIds = round2StructuredInputs.map((record) => record.caseId).sort();
  if (JSON.stringify(strictIds) !== JSON.stringify(structuredIds)) {
    throw new Error("round 2 structures do not exactly match strict input ids");
  }
  const projection = preRegistration.preRegisteredEvaluation.labelProjection;
  const predictions = round2StructuredInputs.map((record) => predict(record, projection));
  const preview = predictions.map((record) => ({
    caseId: record.caseId,
    top3: record.projected.joint.slice(0, 3),
    rawTop3: record.raw.joint.slice(0, 3),
  }));
  if (!freeze) {
    process.stdout.write(`${JSON.stringify({
      mode: "preview-only",
      answersRead: false,
      cases: preview,
    }, null, 2)}\n`);
    return;
  }
  if (fs.existsSync(FROZEN_MANIFEST_FILE)) {
    throw new Error("round 2 frozen manifest already exists; refusing overwrite");
  }
  const structuredText = jsonLines(round2StructuredInputs);
  const predictionText = jsonLines(predictions);
  fs.writeFileSync(STRUCTURED_FILE, structuredText, "utf8");
  fs.writeFileSync(PREDICTION_FILE, predictionText, "utf8");
  const manifest = {
    schema: "player_emotion_blind_round_frozen_v1",
    frozenAt: new Date().toISOString(),
    preRegistrationSha256: sha256(fs.readFileSync(PRE_REGISTRATION_FILE)),
    roundInputSha256: sha256(inputText),
    structuredInputSha256: sha256(structuredText),
    predictionSha256: sha256(predictionText),
    strictCaseCount: predictions.length,
    modelHashes: Object.fromEntries(MODEL_FILES.map((file) => [
      file,
      sha256(fs.readFileSync(path.join(ROOT, file))),
    ])),
    evaluation: preRegistration.preRegisteredEvaluation,
    state: {
      structuredInputsFrozen: true,
      predictionsFrozen: true,
      answersOpenedForSelectedRound: false,
      remainingHoldoutAnswersOpened: false,
    },
  };
  fs.writeFileSync(FROZEN_MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    mode: "frozen",
    strictCases: predictions.length,
    structuredInputSha256: manifest.structuredInputSha256,
    predictionSha256: manifest.predictionSha256,
    preview,
  }, null, 2)}\n`);
}

main();
