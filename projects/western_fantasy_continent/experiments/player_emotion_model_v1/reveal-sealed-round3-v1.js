const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const DIR = path.join(ROOT, "data", "blind_rounds", "v3");
const CORPUS = path.join(ROOT, "data", "prepared", "isear-v1");
const FILES = {
  input: path.join(DIR, "round3.inputs.jsonl"),
  prediction: path.join(DIR, "round3.predictions.frozen.jsonl"),
  structured: path.join(DIR, "round3.structured-inputs.frozen.jsonl"),
  frozen: path.join(DIR, "round3.frozen-manifest.json"),
  answerSource: path.join(CORPUS, "sealed_test.gold.jsonl"),
  corpusManifest: path.join(CORPUS, "manifest.json"),
  selectedAnswers: path.join(DIR, "round3.answers.revealed.jsonl"),
  evaluation: path.join(DIR, "round3.evaluation.json"),
  report: path.join(ROOT, "SEALED_ROUND3_REPORT_V1.md"),
};

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const readLines = (file) => fs.readFileSync(file, "utf8").split(/\r?\n/u)
  .filter(Boolean).map((line) => JSON.parse(line));
const metric = (records, cutoff) => {
  const correct = records.filter((record) => record.rank <= cutoff).length;
  return {
    correct,
    total: records.length,
    accuracy: Math.round((correct / records.length) * 10000) / 10000,
  };
};

function main() {
  if (fs.existsSync(FILES.evaluation)) throw new Error("round 3 already revealed");
  const frozen = JSON.parse(fs.readFileSync(FILES.frozen, "utf8"));
  const predictionText = fs.readFileSync(FILES.prediction);
  const structuredText = fs.readFileSync(FILES.structured);
  if (sha256(predictionText) !== frozen.predictionSha256) {
    throw new Error("frozen prediction changed");
  }
  if (sha256(structuredText) !== frozen.structuredInputSha256) {
    throw new Error("frozen structured input changed");
  }
  const answerSource = fs.readFileSync(FILES.answerSource);
  const expectedAnswerHash = JSON.parse(fs.readFileSync(FILES.corpusManifest, "utf8"))
    .fileHashes["sealed_test.gold.jsonl"];
  if (sha256(answerSource) !== expectedAnswerHash) throw new Error("answer source changed");
  const predictions = readLines(FILES.prediction);
  const ids = new Set(predictions.map((record) => record.caseId));
  const answers = answerSource.toString("utf8").split(/\r?\n/u).filter(Boolean)
    .map((line) => JSON.parse(line)).filter((record) => ids.has(record.caseId));
  const answerById = new Map(answers.map((record) => [record.caseId, record]));
  const inputs = new Map(readLines(FILES.input).map((record) => [record.caseId, record]));
  const records = predictions.map((prediction) => {
    const answerRecord = answerById.get(prediction.caseId);
    const answer = answerRecord.reportedEmotionFamily;
    const rank = prediction.projected.joint.findIndex((entry) => entry.label === answer) + 1;
    const situation = inputs.get(prediction.caseId).observableBeforeInference.situation;
    const hasObservedIncident = !/not applicable|not felt this emotion/i.test(situation);
    return {
      caseId: prediction.caseId,
      situation,
      answer,
      answerIntensityRaw: answerRecord.reportedIntensityRaw,
      rank,
      hasObservedIncident,
      predictedTop3: prediction.projected.joint.slice(0, 3),
      rawTop5: prediction.raw.joint.slice(0, 5),
    };
  });
  const evaluable = records.filter((record) => record.hasObservedIncident);
  const all = { top1: metric(records, 1), top3: metric(records, 3) };
  const observedIncidentOnly = {
    top1: metric(evaluable, 1),
    top3: metric(evaluable, 3),
  };
  const byLabel = Object.fromEntries([...new Set(records.map((record) => record.answer))]
    .sort().map((label) => {
      const subset = records.filter((record) => record.answer === label);
      return [label, {
        cases: subset.length,
        top1: metric(subset, 1).accuracy,
        top3: metric(subset, 3).accuracy,
      }];
    }));
  const failures = records.filter((record) => record.rank > 3);
  const evaluation = {
    schema: "player_emotion_blind_round_evaluation_v1",
    revealedAt: new Date().toISOString(),
    frozenPredictionSha256: frozen.predictionSha256,
    answerSourceVerifiedSha256: expectedAnswerHash,
    metrics: { all, observedIncidentOnly },
    byLabel,
    failures,
    cases: records,
    caveats: [
      "Round 3 source groups were excluded from rounds 1 and 2.",
      "Non-event reports remain in the pre-registered primary denominator and are also reported separately.",
      "The developer structured answer-hidden situations; this is not independent two-person annotation.",
    ],
  };
  fs.writeFileSync(
    FILES.selectedAnswers,
    `${answers.map((record) => JSON.stringify(record)).join("\n")}\n`,
    "utf8",
  );
  fs.writeFileSync(FILES.evaluation, `${JSON.stringify(evaluation, null, 2)}\n`, "utf8");
  const report = [
    "# 封存盲测第三轮报告",
    "",
    `- 全部严格样本 Top-1：${all.top1.correct}/${all.top1.total}（${Math.round(all.top1.accuracy * 100)}%）`,
    `- 全部严格样本 Top-3：${all.top3.correct}/${all.top3.total}（${Math.round(all.top3.accuracy * 100)}%）`,
    `- 有可观察事件 Top-1：${observedIncidentOnly.top1.correct}/${observedIncidentOnly.top1.total}（${Math.round(observedIncidentOnly.top1.accuracy * 100)}%）`,
    `- 有可观察事件 Top-3：${observedIncidentOnly.top3.correct}/${observedIncidentOnly.top3.total}（${Math.round(observedIncidentOnly.top3.accuracy * 100)}%）`,
    "",
    "## 各类结果",
    "",
    "| 类别 | 样本 | Top-1 | Top-3 |",
    "|---|---:|---:|---:|",
    ...Object.entries(byLabel).map(([label, value]) => (
      `| ${label} | ${value.cases} | ${Math.round(value.top1 * 100)}% | ${Math.round(value.top3 * 100)}% |`
    )),
    "",
    "## Top-3 失败",
    "",
    ...failures.flatMap((failure) => [
      `- ${failure.caseId}：答案 ${failure.answer}，模型 ${failure.predictedTop3.map((entry) => `${entry.label}(${entry.score})`).join(" / ")}`,
      `  - 事件：${failure.situation}`,
    ]),
    "",
    "- 预测先冻结、后揭盲；第三轮与前两轮来源组完全隔离。",
    "- 正式玩家 Agent 未修改。",
    "",
  ].join("\n");
  fs.writeFileSync(FILES.report, report, "utf8");
  process.stdout.write(`${JSON.stringify({ all, observedIncidentOnly, byLabel, failures }, null, 2)}\n`);
}

main();
