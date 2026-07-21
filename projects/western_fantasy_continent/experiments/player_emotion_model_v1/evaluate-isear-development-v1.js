const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const PREDICTIONS = process.env.PREDICTIONS_FILE
  ? path.resolve(process.env.PREDICTIONS_FILE)
  : path.join(DATA_DIR, "development.predictions-v1.jsonl");
const GOLD = path.join(DATA_DIR, "development.gold.jsonl");
const REPORT = process.env.REPORT_FILE
  ? path.resolve(process.env.REPORT_FILE)
  : path.join(__dirname, "development-evaluation-v1.json");

const COARSE_GROUPS = Object.freeze({
  anger: new Set(["anger", "frustration"]),
  fear: new Set(["fear", "anxiety"]),
  sadness: new Set(["sadness", "disappointment", "regret"]),
  disgust: new Set(["disgust"]),
  joy: new Set(["joy", "excitement", "satisfaction", "relief", "hope", "pride", "gratitude"]),
  shame: new Set(["shame"]),
  guilt: new Set(["guilt"]),
});

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function evaluateTrack(predictions, goldById, predicate) {
  const rows = predictions.filter(predicate);
  let exactTop1 = 0;
  let exactTop3 = 0;
  let coarseTop1 = 0;
  let coarseTop3 = 0;
  const byGold = {};
  const confusion = {};
  const errors = [];

  for (const prediction of rows) {
    const gold = goldById.get(prediction.caseId);
    if (!gold) throw new Error(`missing gold for ${prediction.caseId}`);
    const label = gold.reportedEmotionFamily;
    const families = prediction.predictions.map((item) => item.family);
    const top1 = families[0];
    const top3 = families.slice(0, 3);
    const exact1 = top1 === label;
    const exact3 = top3.includes(label);
    const group = COARSE_GROUPS[label] || new Set([label]);
    const coarse1 = group.has(top1);
    const coarse3 = top3.some((family) => group.has(family));
    exactTop1 += Number(exact1);
    exactTop3 += Number(exact3);
    coarseTop1 += Number(coarse1);
    coarseTop3 += Number(coarse3);

    byGold[label] ||= { cases: 0, exactTop1: 0, exactTop3: 0, coarseTop1: 0, coarseTop3: 0 };
    byGold[label].cases++;
    byGold[label].exactTop1 += Number(exact1);
    byGold[label].exactTop3 += Number(exact3);
    byGold[label].coarseTop1 += Number(coarse1);
    byGold[label].coarseTop3 += Number(coarse3);
    confusion[label] ||= {};
    confusion[label][top1] = (confusion[label][top1] || 0) + 1;
    if (!coarse3 && errors.length < 40) {
      errors.push({
        caseId: prediction.caseId,
        gold: label,
        predicted: top3,
        encodedAxes: Object.keys(prediction.encoding.appraisals),
      });
    }
  }

  for (const stats of Object.values(byGold)) {
    stats.exactTop1Rate = round(stats.exactTop1 / stats.cases);
    stats.exactTop3Rate = round(stats.exactTop3 / stats.cases);
    stats.coarseTop1Rate = round(stats.coarseTop1 / stats.cases);
    stats.coarseTop3Rate = round(stats.coarseTop3 / stats.cases);
  }
  return {
    cases: rows.length,
    exactTop1: round(exactTop1 / rows.length),
    exactTop3: round(exactTop3 / rows.length),
    coarseTop1: round(coarseTop1 / rows.length),
    coarseTop3: round(coarseTop3 / rows.length),
    coverageByGold: byGold,
    top1Confusion: confusion,
    firstFortyCoarseTop3Errors: errors,
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

const predictions = readJsonl(PREDICTIONS);
const gold = readJsonl(GOLD);
const goldById = new Map(gold.map((record) => [record.caseId, record]));
if (predictions.length !== gold.length) throw new Error("prediction/gold row count mismatch");

const report = {
  schema: process.env.EVALUATION_SCHEMA || "isear_development_evaluation_v1",
  protocol: {
    predictionsFrozenBeforeGoldRead: true,
    sealedTestRead: false,
    exactMetric: "Exact 24-family model label versus 7 ISEAR labels.",
    coarseMetric: "Model subfamilies count under the matching ISEAR umbrella.",
  },
  naturalNarrative: evaluateTrack(predictions, goldById, () => true),
  strictInference: evaluateTrack(
    predictions,
    goldById,
    (prediction) => prediction.evaluationTracks.strictEmotionInference,
  ),
};

fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  status: "PASS",
  report: REPORT,
  naturalNarrative: {
    cases: report.naturalNarrative.cases,
    exactTop1: report.naturalNarrative.exactTop1,
    coarseTop3: report.naturalNarrative.coarseTop3,
  },
  strictInference: {
    cases: report.strictInference.cases,
    exactTop1: report.strictInference.exactTop1,
    coarseTop3: report.strictInference.coarseTop3,
  },
}, null, 2));
