const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { round3StructuredInputs } = require("./sealed-round3-structured-inputs-v1");
const { predict } = require("./sealed-round1-predict-v1");

const ROOT = __dirname;
const DIR = path.join(ROOT, "data", "blind_rounds", "v3");
const INPUT = path.join(DIR, "round3.inputs.jsonl");
const PRE = path.join(DIR, "round3.pre_registered.json");
const STRUCTURED = path.join(DIR, "round3.structured-inputs.frozen.jsonl");
const PREDICTIONS = path.join(DIR, "round3.predictions.frozen.jsonl");
const FROZEN = path.join(DIR, "round3.frozen-manifest.json");
const MODEL_FILES = [
  "emotion-model-contract.js",
  "event-impact-engine-v1.js",
  "emotion-simulator-v1.js",
  "structured-emotion-pipeline-v1.js",
  "sealed-round3-structured-inputs-v1.js",
];

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const readLines = (file) => fs.readFileSync(file, "utf8").split(/\r?\n/u)
  .filter(Boolean).map((line) => JSON.parse(line));
const jsonLines = (records) => `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;

function main() {
  const freeze = process.argv.includes("--freeze");
  const pre = JSON.parse(fs.readFileSync(PRE, "utf8"));
  const inputText = fs.readFileSync(INPUT, "utf8");
  if (sha256(inputText) !== pre.round3.inputSha256) throw new Error("round 3 input changed");
  const strictIds = readLines(INPUT)
    .filter((record) => record.evaluationTracks?.strictEmotionInference === true)
    .map((record) => record.caseId).sort();
  const structuredIds = round3StructuredInputs.map((record) => record.caseId).sort();
  if (JSON.stringify(strictIds) !== JSON.stringify(structuredIds)) {
    throw new Error("round 3 structures do not match strict inputs");
  }
  const projection = pre.preRegisteredEvaluation.labelProjection;
  const predictions = round3StructuredInputs.map((record) => predict(record, projection));
  const preview = predictions.map((record) => ({
    caseId: record.caseId,
    top3: record.projected.joint.slice(0, 3),
    rawTop3: record.raw.joint.slice(0, 3),
  }));
  if (!freeze) {
    process.stdout.write(`${JSON.stringify({ mode: "preview", answersRead: false, preview }, null, 2)}\n`);
    return;
  }
  if (fs.existsSync(FROZEN)) throw new Error("round 3 is already frozen");
  const structuredText = jsonLines(round3StructuredInputs);
  const predictionText = jsonLines(predictions);
  fs.writeFileSync(STRUCTURED, structuredText, "utf8");
  fs.writeFileSync(PREDICTIONS, predictionText, "utf8");
  const manifest = {
    schema: "player_emotion_blind_round_frozen_v1",
    frozenAt: new Date().toISOString(),
    preRegistrationSha256: sha256(fs.readFileSync(PRE)),
    roundInputSha256: sha256(inputText),
    structuredInputSha256: sha256(structuredText),
    predictionSha256: sha256(predictionText),
    strictCaseCount: predictions.length,
    modelHashes: Object.fromEntries(MODEL_FILES.map((file) => [
      file,
      sha256(fs.readFileSync(path.join(ROOT, file))),
    ])),
    evaluation: pre.preRegisteredEvaluation,
    state: {
      structuredInputsFrozen: true,
      predictionsFrozen: true,
      answersOpenedForSelectedRound: false,
      remainingHoldoutAnswersOpened: false,
    },
  };
  fs.writeFileSync(FROZEN, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    mode: "frozen",
    cases: predictions.length,
    structuredInputSha256: manifest.structuredInputSha256,
    predictionSha256: manifest.predictionSha256,
    preview,
  }, null, 2)}\n`);
}

main();
