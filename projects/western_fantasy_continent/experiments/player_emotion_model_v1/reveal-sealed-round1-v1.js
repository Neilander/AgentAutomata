const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const ROUND_DIR = path.join(ROOT, "data", "blind_rounds", "v1");
const ANSWER_SOURCE = path.join(ROOT, "data", "prepared", "isear-v1", "sealed_test.gold.jsonl");
const CORPUS_MANIFEST = path.join(ROOT, "data", "prepared", "isear-v1", "manifest.json");
const INPUT_FILE = path.join(ROUND_DIR, "round1.inputs.jsonl");
const PREDICTION_FILE = path.join(ROUND_DIR, "round1.predictions.frozen.jsonl");
const STRUCTURED_FILE = path.join(ROUND_DIR, "round1.structured-inputs.frozen.jsonl");
const FROZEN_MANIFEST_FILE = path.join(ROUND_DIR, "round1.frozen-manifest.json");
const REVEALED_FILE = path.join(ROUND_DIR, "round1.answers.revealed.jsonl");
const EVALUATION_FILE = path.join(ROUND_DIR, "round1.evaluation.json");
const REPORT_FILE = path.join(ROOT, "SEALED_ROUND1_REPORT_V1.md");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function metric(records, rankKey, cutoff) {
  const correct = records.filter((record) => (
    record.prediction.projected[rankKey]
      .slice(0, cutoff)
      .some((entry) => entry.label === record.answer.reportedEmotionFamily)
  )).length;
  return { correct, total: records.length, accuracy: round(correct / records.length) };
}

function rankOf(record, rankKey) {
  const index = record.prediction.projected[rankKey]
    .findIndex((entry) => entry.label === record.answer.reportedEmotionFamily);
  return index < 0 ? null : index + 1;
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function main() {
  if (fs.existsSync(EVALUATION_FILE)) {
    throw new Error("round 1 has already been revealed; refusing to overwrite first-blind result");
  }
  const frozen = JSON.parse(fs.readFileSync(FROZEN_MANIFEST_FILE, "utf8"));
  const predictionText = fs.readFileSync(PREDICTION_FILE);
  const structuredText = fs.readFileSync(STRUCTURED_FILE);
  if (sha256(predictionText) !== frozen.predictionSha256) {
    throw new Error("frozen prediction hash mismatch");
  }
  if (sha256(structuredText) !== frozen.structuredInputSha256) {
    throw new Error("frozen structured-input hash mismatch");
  }

  const corpusManifest = JSON.parse(fs.readFileSync(CORPUS_MANIFEST, "utf8"));
  const answerSourceText = fs.readFileSync(ANSWER_SOURCE);
  const expectedAnswerHash = corpusManifest.fileHashes["sealed_test.gold.jsonl"];
  if (sha256(answerSourceText) !== expectedAnswerHash) {
    throw new Error("sealed answer source hash mismatch");
  }

  const inputs = readJsonLines(INPUT_FILE);
  const situations = new Map(
    inputs.map((record) => [record.caseId, record.observableBeforeInference.situation]),
  );
  const predictions = readJsonLines(PREDICTION_FILE);
  const selectedIds = new Set(predictions.map((record) => record.caseId));
  const selectedAnswers = answerSourceText.toString("utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((record) => selectedIds.has(record.caseId));
  if (selectedAnswers.length !== predictions.length) {
    throw new Error(`answer count mismatch: ${selectedAnswers.length} vs ${predictions.length}`);
  }
  const answerById = new Map(selectedAnswers.map((record) => [record.caseId, record]));
  const records = predictions.map((prediction) => {
    const answer = answerById.get(prediction.caseId);
    return {
      caseId: prediction.caseId,
      situation: situations.get(prediction.caseId),
      answer,
      prediction,
      ranks: {
        joint: rankOf({ prediction, answer }, "joint"),
        onset: rankOf({ prediction, answer }, "onset"),
        settled: rankOf({ prediction, answer }, "settled"),
      },
    };
  });
  const metrics = {
    jointTop1: metric(records, "joint", 1),
    jointTop3: metric(records, "joint", 3),
    onsetTop3: metric(records, "onset", 3),
    settledTop3: metric(records, "settled", 3),
  };
  const byLabel = Object.fromEntries(
    [...new Set(records.map((record) => record.answer.reportedEmotionFamily))]
      .sort()
      .map((label) => {
        const subset = records.filter(
          (record) => record.answer.reportedEmotionFamily === label,
        );
        return [label, {
          cases: subset.length,
          top1: metric(subset, "joint", 1).accuracy,
          top3: metric(subset, "joint", 3).accuracy,
        }];
      }),
  );
  const failures = records
    .filter((record) => record.ranks.joint > 3)
    .map((record) => ({
      caseId: record.caseId,
      situation: record.situation,
      answer: record.answer.reportedEmotionFamily,
      answerIntensityRaw: record.answer.reportedIntensityRaw,
      predictedTop3: record.prediction.projected.joint.slice(0, 3),
      answerRank: record.ranks.joint,
      rawTop5: record.prediction.raw.joint.slice(0, 5),
    }));
  const evaluation = {
    schema: "player_emotion_blind_round_evaluation_v1",
    revealedAt: new Date().toISOString(),
    frozenPredictionSha256: frozen.predictionSha256,
    answerSourceVerifiedSha256: expectedAnswerHash,
    selectedAnswerCount: selectedAnswers.length,
    remainingAnswerRecordsMaterialized: false,
    metrics,
    byLabel,
    failures,
    cases: records.map((record) => ({
      caseId: record.caseId,
      situation: record.situation,
      answer: record.answer.reportedEmotionFamily,
      answerIntensityRaw: record.answer.reportedIntensityRaw,
      predictedTop3: record.prediction.projected.joint.slice(0, 3),
      ranks: record.ranks,
    })),
    caveats: [
      "This is blind with respect to answers, but the same developer created the model and structured the answer-hidden situations.",
      "ISEAR asks for one prompted category; the generative model can output concurrent finer-grained families.",
      "This round becomes development data after reveal and cannot be reused as a final blind score.",
    ],
  };

  fs.writeFileSync(
    REVEALED_FILE,
    `${selectedAnswers.map((record) => JSON.stringify(record)).join("\n")}\n`,
    "utf8",
  );
  fs.writeFileSync(EVALUATION_FILE, `${JSON.stringify(evaluation, null, 2)}\n`, "utf8");
  const lines = [
    "# 封存盲测第一轮报告",
    "",
    `- 严格样本：${records.length}`,
    `- 联合 Top-1：${metrics.jointTop1.correct}/${metrics.jointTop1.total}（${Math.round(metrics.jointTop1.accuracy * 100)}%）`,
    `- 联合 Top-3：${metrics.jointTop3.correct}/${metrics.jointTop3.total}（${Math.round(metrics.jointTop3.accuracy * 100)}%）`,
    `- 即时 Top-3：${metrics.onsetTop3.correct}/${metrics.onsetTop3.total}（${Math.round(metrics.onsetTop3.accuracy * 100)}%）`,
    `- 稳定 Top-3：${metrics.settledTop3.correct}/${metrics.settledTop3.total}（${Math.round(metrics.settledTop3.accuracy * 100)}%）`,
    "",
    "## 各类结果",
    "",
    "| 类别 | 样本 | Top-1 | Top-3 |",
    "|---|---:|---:|---:|",
    ...Object.entries(byLabel).map(([label, result]) => (
      `| ${label} | ${result.cases} | ${Math.round(result.top1 * 100)}% | ${Math.round(result.top3 * 100)}% |`
    )),
    "",
    "## Top-3 失败",
    "",
    ...failures.flatMap((failure) => [
      `- ${failure.caseId}：答案 ${failure.answer}，模型 ${failure.predictedTop3.map((entry) => `${entry.label}(${entry.score})`).join(" / ")}`,
      `  - 事件：${failure.situation}`,
    ]),
    "",
    "## 诚实边界",
    "",
    "- 这批答案在结构化输入和预测哈希冻结后才揭开，是真揭盲，不是发现集回放。",
    "- 同一开发者仍然兼任了答案不可见的事件整理者，因此不是独立双人盲测。",
    "- 揭盲以后这 34 条已经转为开发资料，后续修改只能去剩余来源组重新测。",
    "- 正式玩家 Agent 没有接入或修改。",
    "",
  ];
  fs.writeFileSync(REPORT_FILE, lines.join("\n"), "utf8");
  process.stdout.write(`${JSON.stringify({ metrics, byLabel, failures }, null, 2)}\n`);
}

main();
