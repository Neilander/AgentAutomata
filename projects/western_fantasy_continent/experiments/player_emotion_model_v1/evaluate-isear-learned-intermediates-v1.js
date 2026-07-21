const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const PREDICTIONS = path.join(DATA_DIR, "development.learned-questionnaire-fields-v1.jsonl");
const GOLD = path.join(DATA_DIR, "development.gold.jsonl");
const OUTPUT = path.join(__dirname, "development-learned-intermediate-evaluation-v1.json");

const FIELDS = [
  "ERGO", "TROPHO", "TEMPER", "EXPRES", "MOVE", "EXP1", "EXP2", "EXP10", "PARAL",
  "CON", "EXPC", "PLEA", "PLAN", "FAIR", "CAUS", "COPING", "MORL", "SELF", "RELA",
  "VERBAL",
];

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const predictions = readJsonl(PREDICTIONS);
const goldById = new Map(readJsonl(GOLD).map((record) => [record.caseId, record]));
const fieldStats = Object.fromEntries(FIELDS.map((field) => [field, {
  cases: 0,
  exact: 0,
  absoluteError: 0,
}]));

for (const prediction of predictions) {
  const gold = goldById.get(prediction.caseId);
  if (!gold) throw new Error(`missing gold for ${prediction.caseId}`);
  for (const field of FIELDS) {
    const predicted = prediction.predictedFields[field];
    const actual = gold.researchOnlyPostEmotionFields[field];
    const stats = fieldStats[field];
    stats.cases++;
    stats.exact += Number(predicted === actual);
    stats.absoluteError += Math.abs(predicted - actual);
  }
}

for (const stats of Object.values(fieldStats)) {
  stats.exactAccuracy = Math.round((stats.exact / stats.cases) * 1000) / 1000;
  stats.meanAbsoluteError = Math.round((stats.absoluteError / stats.cases) * 1000) / 1000;
}
const macroExact = Object.values(fieldStats)
  .reduce((sum, stats) => sum + stats.exactAccuracy, 0) / FIELDS.length;
const report = {
  schema: "isear_learned_intermediate_evaluation_v1",
  developmentCases: predictions.length,
  emotionLabelUsedAsTrainingTarget: false,
  macroExactAccuracy: Math.round(macroExact * 1000) / 1000,
  fieldStats,
};
fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  status: "PASS",
  developmentCases: predictions.length,
  macroExactAccuracy: report.macroExactAccuracy,
  output: OUTPUT,
}, null, 2));
