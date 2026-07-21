const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const ROUND_DIR = path.join(ROOT, "data", "blind_rounds", "v2");
const ANSWER_SOURCE = path.join(ROOT, "data", "prepared", "isear-v1", "sealed_test.gold.jsonl");
const CORPUS_MANIFEST = path.join(ROOT, "data", "prepared", "isear-v1", "manifest.json");
const INPUT_FILE = path.join(ROUND_DIR, "round2.inputs.jsonl");
const PREDICTION_FILE = path.join(ROUND_DIR, "round2.predictions.frozen.jsonl");
const STRUCTURED_FILE = path.join(ROUND_DIR, "round2.structured-inputs.frozen.jsonl");
const FROZEN_MANIFEST_FILE = path.join(ROUND_DIR, "round2.frozen-manifest.json");
const REVEALED_FILE = path.join(ROUND_DIR, "round2.answers.revealed.jsonl");
const EVALUATION_FILE = path.join(ROUND_DIR, "round2.evaluation.json");
const REPORT_FILE = path.join(ROOT, "SEALED_ROUND2_REPORT_V1.md");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function rankOf(prediction, answer, key) {
  const index = prediction.projected[key].findIndex((entry) => entry.label === answer);
  return index < 0 ? null : index + 1;
}

function metric(records, key, cutoff) {
  const correct = records.filter((record) => record.ranks[key] <= cutoff).length;
  return {
    correct,
    total: records.length,
    accuracy: Math.round((correct / records.length) * 10000) / 10000,
  };
}

function main() {
  if (fs.existsSync(EVALUATION_FILE)) {
    throw new Error("round 2 already revealed; refusing overwrite");
  }
  const frozen = JSON.parse(fs.readFileSync(FROZEN_MANIFEST_FILE, "utf8"));
  const predictionText = fs.readFileSync(PREDICTION_FILE);
  const structuredText = fs.readFileSync(STRUCTURED_FILE);
  if (sha256(predictionText) !== frozen.predictionSha256) {
    throw new Error("round 2 frozen prediction hash mismatch");
  }
  if (sha256(structuredText) !== frozen.structuredInputSha256) {
    throw new Error("round 2 frozen structured input hash mismatch");
  }
  const corpusManifest = JSON.parse(fs.readFileSync(CORPUS_MANIFEST, "utf8"));
  const answerText = fs.readFileSync(ANSWER_SOURCE);
  const expectedAnswerHash = corpusManifest.fileHashes["sealed_test.gold.jsonl"];
  if (sha256(answerText) !== expectedAnswerHash) throw new Error("answer source hash mismatch");
  const predictions = readJsonLines(PREDICTION_FILE);
  const selectedIds = new Set(predictions.map((record) => record.caseId));
  const selectedAnswers = answerText.toString("utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((record) => selectedIds.has(record.caseId));
  const answerById = new Map(selectedAnswers.map((record) => [record.caseId, record]));
  const situations = new Map(readJsonLines(INPUT_FILE).map((record) => [
    record.caseId,
    record.observableBeforeInference.situation,
  ]));
  const records = predictions.map((prediction) => {
    const answerRecord = answerById.get(prediction.caseId);
    if (!answerRecord) throw new Error(`missing selected answer ${prediction.caseId}`);
    const answer = answerRecord.reportedEmotionFamily;
    return {
      caseId: prediction.caseId,
      situation: situations.get(prediction.caseId),
      answer,
      intensity: answerRecord.reportedIntensityRaw,
      prediction,
      ranks: {
        joint: rankOf(prediction, answer, "joint"),
        onset: rankOf(prediction, answer, "onset"),
        settled: rankOf(prediction, answer, "settled"),
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
    [...new Set(records.map((record) => record.answer))].sort().map((label) => {
      const subset = records.filter((record) => record.answer === label);
      return [label, {
        cases: subset.length,
        top1: metric(subset, "joint", 1).accuracy,
        top3: metric(subset, "joint", 3).accuracy,
      }];
    }),
  );
  const failures = records.filter((record) => record.ranks.joint > 3).map((record) => ({
    caseId: record.caseId,
    situation: record.situation,
    answer: record.answer,
    answerIntensityRaw: record.intensity,
    answerRank: record.ranks.joint,
    predictedTop3: record.prediction.projected.joint.slice(0, 3),
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
      answer: record.answer,
      answerIntensityRaw: record.intensity,
      predictedTop3: record.prediction.projected.joint.slice(0, 3),
      ranks: record.ranks,
    })),
    caveats: [
      "Round 2 was selected from source groups excluded from round 1.",
      "Four strict records explicitly report no recalled incident and remain in the denominator.",
      "The same developer structured answer-hidden situations; this is not an independent two-person blind test.",
    ],
  };
  fs.writeFileSync(
    REVEALED_FILE,
    `${selectedAnswers.map((record) => JSON.stringify(record)).join("\n")}\n`,
    "utf8",
  );
  fs.writeFileSync(EVALUATION_FILE, `${JSON.stringify(evaluation, null, 2)}\n`, "utf8");
  const report = [
    "# 封存盲测第二轮报告",
    "",
    `- 严格样本：${records.length}`,
    `- 联合 Top-1：${metrics.jointTop1.correct}/${records.length}（${Math.round(metrics.jointTop1.accuracy * 100)}%）`,
    `- 联合 Top-3：${metrics.jointTop3.correct}/${records.length}（${Math.round(metrics.jointTop3.accuracy * 100)}%）`,
    `- 即时 Top-3：${metrics.onsetTop3.correct}/${records.length}（${Math.round(metrics.onsetTop3.accuracy * 100)}%）`,
    `- 稳定 Top-3：${metrics.settledTop3.correct}/${records.length}（${Math.round(metrics.settledTop3.accuracy * 100)}%）`,
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
    "## 边界",
    "",
    "- 第二轮来自第一轮完全未使用的来源组，冻结预测后才揭晓答案。",
    "- 4 条“想不起事件”仍计入分母；它们不适合验证事件生成模型，会单独报告含/不含脏样本成绩。",
    "- 正式玩家 Agent 未修改。",
    "",
  ].join("\n");
  fs.writeFileSync(REPORT_FILE, report, "utf8");
  process.stdout.write(`${JSON.stringify({ metrics, byLabel, failures }, null, 2)}\n`);
}

main();
