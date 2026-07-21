const fs = require("fs");
const path = require("path");
const { predictIsearEmotion } = require("./isear-appraisal-encoder-v1");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const INPUT = path.join(DATA_DIR, "development.inputs.jsonl");
const OUTPUT = path.join(DATA_DIR, "development.predictions-v1.jsonl");

const inputs = fs.readFileSync(INPUT, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const predictions = inputs.map(predictIsearEmotion);
if (predictions.some((prediction) => JSON.stringify(prediction).includes("reportedEmotionFamily"))) {
  throw new Error("gold label leaked into prediction artifact");
}
fs.writeFileSync(
  OUTPUT,
  `${predictions.map((prediction) => JSON.stringify(prediction)).join("\n")}\n`,
  "utf8",
);

console.log(JSON.stringify({
  status: "PASS",
  inputs: inputs.length,
  predictions: predictions.length,
  strictInferencePredictions: predictions.filter(
    (prediction) => prediction.evaluationTracks.strictEmotionInference,
  ).length,
  encoderReadGold: false,
  output: OUTPUT,
}, null, 2));
