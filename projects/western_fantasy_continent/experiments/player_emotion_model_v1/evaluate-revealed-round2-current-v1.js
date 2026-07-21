const fs = require("node:fs");
const path = require("node:path");
const { round2StructuredInputs } = require("./sealed-round2-structured-inputs-v1");
const { predict } = require("./sealed-round1-predict-v1");

const ROOT = __dirname;
const ROUND_DIR = path.join(ROOT, "data", "blind_rounds", "v2");

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function score(records, cutoff) {
  const correct = records.filter((record) => (
    record.prediction.projected.joint.slice(0, cutoff)
      .some((entry) => entry.label === record.answer)
  )).length;
  return {
    correct,
    total: records.length,
    accuracy: Math.round((correct / records.length) * 10000) / 10000,
  };
}

function main() {
  const answers = new Map(readJsonLines(path.join(ROUND_DIR, "round2.answers.revealed.jsonl"))
    .map((record) => [record.caseId, record.reportedEmotionFamily]));
  const projection = JSON.parse(
    fs.readFileSync(path.join(ROUND_DIR, "round2.frozen-manifest.json"), "utf8"),
  ).evaluation.labelProjection;
  const records = round2StructuredInputs.map((structured) => ({
    caseId: structured.caseId,
    answer: answers.get(structured.caseId),
    prediction: predict(structured, projection),
    hasObservedIncident: structured.events[0].id !== "no-recalled-event",
  }));
  const evaluable = records.filter((record) => record.hasObservedIncident);
  const result = {
    schema: "player_emotion_revealed_development_evaluation_v1",
    warning: "Not blind: round 2 answers were opened before these changes.",
    allRecords: { top1: score(records, 1), top3: score(records, 3) },
    observedIncidentOnly: { top1: score(evaluable, 1), top3: score(evaluable, 3) },
    failures: records.filter((record) => !record.prediction.projected.joint.slice(0, 3)
      .some((entry) => entry.label === record.answer)).map((record) => ({
      caseId: record.caseId,
      answer: record.answer,
      hasObservedIncident: record.hasObservedIncident,
      predictedTop3: record.prediction.projected.joint.slice(0, 3),
    })),
  };
  fs.writeFileSync(
    path.join(ROUND_DIR, "round2.current-development-evaluation.json"),
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();
