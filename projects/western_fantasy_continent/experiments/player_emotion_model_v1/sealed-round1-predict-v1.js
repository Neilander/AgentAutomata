const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { round1StructuredInputs } = require("./sealed-round1-structured-inputs-v1");
const { simulateStructuredEmotionSequence } = require("./structured-emotion-pipeline-v1");

const ROOT = __dirname;
const ROUND_DIR = path.join(ROOT, "data", "blind_rounds", "v1");
const INPUT_FILE = path.join(ROUND_DIR, "round1.inputs.jsonl");
const PRE_REGISTRATION_FILE = path.join(ROUND_DIR, "round1.pre_registered.json");
const STRUCTURED_SNAPSHOT_FILE = path.join(ROUND_DIR, "round1.structured-inputs.frozen.jsonl");
const PREDICTION_FILE = path.join(ROUND_DIR, "round1.predictions.frozen.jsonl");
const FROZEN_MANIFEST_FILE = path.join(ROUND_DIR, "round1.frozen-manifest.json");
const MODEL_FILES = [
  "emotion-model-contract.js",
  "event-impact-engine-v1.js",
  "emotion-simulator-v1.js",
  "structured-emotion-pipeline-v1.js",
  "sealed-round1-structured-inputs-v1.js",
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

function maximumFamilyScores(frames, key) {
  const scores = {};
  for (const frame of frames) {
    for (const emotion of frame[key]) {
      scores[emotion.family] = Math.max(scores[emotion.family] || 0, emotion.intensity);
    }
  }
  return scores;
}

function projectScores(rawScores, projection) {
  return Object.fromEntries(
    Object.entries(projection).map(([label, families]) => [
      label,
      Math.max(...families.map((family) => rawScores[family] || 0)),
    ]),
  );
}

function ranking(scores) {
  return Object.entries(scores)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, score]) => ({ label, score }));
}

function predict(structured, projection) {
  const result = simulateStructuredEmotionSequence(structured, {
    emotionThreshold: 0,
    maxEmotions: 24,
    settledHorizonSeconds: 60,
  });
  const onsetRaw = maximumFamilyScores(result.frames, "emotions");
  const settledRaw = maximumFamilyScores(result.frames, "settledEmotions");
  const jointRaw = Object.fromEntries(
    [...new Set([...Object.keys(onsetRaw), ...Object.keys(settledRaw)])].map((family) => [
      family,
      Math.max(onsetRaw[family] || 0, settledRaw[family] || 0),
    ]),
  );
  return {
    schema: "player_emotion_blind_prediction_v1",
    caseId: structured.caseId,
    projected: {
      joint: ranking(projectScores(jointRaw, projection)),
      onset: ranking(projectScores(onsetRaw, projection)),
      settled: ranking(projectScores(settledRaw, projection)),
    },
    raw: {
      joint: ranking(jointRaw),
      onset: ranking(onsetRaw),
      settled: ranking(settledRaw),
    },
    audit: {
      answerRead: false,
      eventImpactReadNarrative: result.audit.narrativeTextReadByImpactEngine,
      eventImpactReadAnswer: result.audit.goldEmotionReadByImpactEngine,
      structuredEventCount: structured.events.length,
    },
  };
}

function main() {
  const shouldFreeze = process.argv.includes("--freeze");
  const inputText = fs.readFileSync(INPUT_FILE, "utf8");
  const preRegistration = JSON.parse(fs.readFileSync(PRE_REGISTRATION_FILE, "utf8"));
  if (sha256(inputText) !== preRegistration.round1.inputSha256) {
    throw new Error("round input changed after pre-registration");
  }

  const blindInputs = readJsonLines(INPUT_FILE);
  const strictIds = blindInputs
    .filter((record) => record.evaluationTracks?.strictEmotionInference === true)
    .map((record) => record.caseId)
    .sort();
  const structuredIds = round1StructuredInputs.map((record) => record.caseId).sort();
  if (JSON.stringify(strictIds) !== JSON.stringify(structuredIds)) {
    const missing = strictIds.filter((caseId) => !structuredIds.includes(caseId));
    const extra = structuredIds.filter((caseId) => !strictIds.includes(caseId));
    throw new Error(`structured inputs do not match strict round; missing=${missing}, extra=${extra}`);
  }

  const projection = preRegistration.preRegisteredEvaluation.labelProjection;
  const predictions = round1StructuredInputs.map((record) => predict(record, projection));
  const preview = predictions.map((record) => ({
    caseId: record.caseId,
    top3: record.projected.joint.slice(0, 3),
    rawTop3: record.raw.joint.slice(0, 3),
  }));

  if (!shouldFreeze) {
    process.stdout.write(`${JSON.stringify({
      mode: "preview-only",
      answersRead: false,
      cases: preview,
    }, null, 2)}\n`);
    return;
  }

  if (fs.existsSync(FROZEN_MANIFEST_FILE)) {
    throw new Error("frozen manifest already exists; refusing to overwrite blind prediction");
  }
  const structuredText = jsonLines(round1StructuredInputs);
  const predictionText = jsonLines(predictions);
  fs.writeFileSync(STRUCTURED_SNAPSHOT_FILE, structuredText, "utf8");
  fs.writeFileSync(PREDICTION_FILE, predictionText, "utf8");
  const modelHashes = Object.fromEntries(MODEL_FILES.map((file) => [
    file,
    sha256(fs.readFileSync(path.join(ROOT, file))),
  ]));
  const frozenManifest = {
    schema: "player_emotion_blind_round_frozen_v1",
    frozenAt: new Date().toISOString(),
    preRegistrationSha256: sha256(fs.readFileSync(PRE_REGISTRATION_FILE)),
    roundInputSha256: sha256(inputText),
    structuredInputSha256: sha256(structuredText),
    predictionSha256: sha256(predictionText),
    strictCaseCount: predictions.length,
    modelHashes,
    evaluation: preRegistration.preRegisteredEvaluation,
    state: {
      structuredInputsFrozen: true,
      predictionsFrozen: true,
      answersOpenedForSelectedRound: false,
      remainingHoldoutAnswersOpened: false,
    },
  };
  fs.writeFileSync(FROZEN_MANIFEST_FILE, `${JSON.stringify(frozenManifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    mode: "frozen",
    strictCases: predictions.length,
    structuredInputSha256: frozenManifest.structuredInputSha256,
    predictionSha256: frozenManifest.predictionSha256,
    preview,
  }, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = {
  predict,
};
