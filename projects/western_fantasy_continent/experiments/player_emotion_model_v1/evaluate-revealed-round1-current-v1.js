const fs = require("node:fs");
const path = require("node:path");
const { round1StructuredInputs } = require("./sealed-round1-structured-inputs-v1");
const { predict } = require("./sealed-round1-predict-v1");

const ROOT = __dirname;
const ROUND_DIR = path.join(ROOT, "data", "blind_rounds", "v1");
const ANSWERS = path.join(ROUND_DIR, "round1.answers.revealed.jsonl");
const FROZEN_MANIFEST = path.join(ROUND_DIR, "round1.frozen-manifest.json");
const OUTPUT = path.join(ROUND_DIR, "round1.current-development-evaluation.json");

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function accuracy(records, cutoff) {
  const correct = records.filter((record) => (
    record.prediction.projected.joint
      .slice(0, cutoff)
      .some((entry) => entry.label === record.answer)
  )).length;
  return {
    correct,
    total: records.length,
    accuracy: Math.round((correct / records.length) * 10000) / 10000,
  };
}

function main() {
  const answers = new Map(
    readJsonLines(ANSWERS).map((record) => [record.caseId, record.reportedEmotionFamily]),
  );
  const projection = JSON.parse(fs.readFileSync(FROZEN_MANIFEST, "utf8"))
    .evaluation.labelProjection;
  const records = round1StructuredInputs.map((structured) => ({
    caseId: structured.caseId,
    answer: answers.get(structured.caseId),
    prediction: predict(structured, projection),
  }));
  const result = {
    schema: "player_emotion_revealed_development_evaluation_v1",
    warning: "Not a blind score: round 1 answers were already known before these changes.",
    top1: accuracy(records, 1),
    top3: accuracy(records, 3),
    failures: records
      .filter((record) => !record.prediction.projected.joint
        .slice(0, 3)
        .some((entry) => entry.label === record.answer))
      .map((record) => ({
        caseId: record.caseId,
        answer: record.answer,
        predictedTop3: record.prediction.projected.joint.slice(0, 3),
      })),
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();
