const fs = require("node:fs");
const path = require("node:path");
const ADAPTER = require("../../game_data/player-feedback-emotion-adapter-v1");

const EMOTION_LABELS = Object.freeze({
  fear: "害怕", anxiety: "焦虑", anger: "愤怒", frustration: "挫败",
  sadness: "悲伤", disappointment: "失望", disgust: "厌恶", joy: "愉快",
  excitement: "兴奋", satisfaction: "满足", relief: "宽慰", hope: "希望",
  pride: "自豪", shame: "羞耻", guilt: "内疚", regret: "后悔",
  attachment: "依恋", gratitude: "感激", envy: "羡慕", jealousy: "嫉妒",
  surprise: "惊讶", curiosity: "好奇", confusion: "困惑", boredom: "无聊",
});

const [, , sessionPathInput, outputDirectoryInput] = process.argv;
if (!sessionPathInput || !outputDirectoryInput) {
  throw new Error("usage: node analyze-chapter-feedback-emotion-v1.js <session.json> <output-directory>");
}

const sessionPath = path.resolve(sessionPathInput);
const outputDirectory = path.resolve(outputDirectoryInput);
const run = readJson(sessionPath);
const chapter = run.chapter1 || run;
const profileId = run.profileId || chapter.profileState?.profileId || "open_novice";
const result = ADAPTER.simulateChapterFeedbackEmotion(chapter, { profileId });
const summary = summarize(result);

fs.mkdirSync(outputDirectory, { recursive: true });
writeJson(path.join(outputDirectory, "emotion-v2.json"), result);
writeJson(path.join(outputDirectory, "emotion-v2-summary.json"), summary);
fs.writeFileSync(path.join(outputDirectory, "EMOTION_V2_TRACE.md"), renderMarkdown(summary), "utf8");
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

function summarize(result) {
  const rows = result.frames.map((frame) => ({
    cycle: frame.episode.cycle,
    momentKind: frame.episode.momentKind,
    action: frame.episode.action,
    outcome: frame.episode.outcome,
    failureCountBefore: frame.episode.failureCountBefore,
    feedback: frame.episode.feedback,
    topEmotions: frame.emotions.slice(0, 5).map((emotion) => ({
      family: emotion.family,
      intensity: emotion.intensity,
      confidence: emotion.confidence,
    })),
    experiences: frame.experiences,
    chemistry: Object.fromEntries(Object.entries(frame.chemistry).map(([axis, entry]) => [axis, entry.level])),
  }));
  const dominantCounts = {};
  const peaks = {};
  for (const frame of result.frames) {
    const dominant = frame.emotions[0]?.family || "none";
    dominantCounts[dominant] = (dominantCounts[dominant] || 0) + 1;
    for (const emotion of frame.emotions) {
      const previous = peaks[emotion.family];
      if (!previous || emotion.intensity > previous.intensity) {
        peaks[emotion.family] = {
          cycle: frame.episode.cycle,
          intensity: emotion.intensity,
          action: frame.episode.action,
          outcome: frame.episode.outcome,
        };
      }
    }
  }
  const keyFrames = rows.filter((row) => (
    row.outcome === "loss" && row.momentKind === "primary"
      || row.action.startsWith("swap:")
      || row.failureCountBefore > 0 && row.outcome === "win" && row.momentKind === "primary"
      || row.action.includes("boss")
  ));
  return {
    schema: "chapter_feedback_emotion_summary_v1",
    result: "PASS",
    profileId: result.profileId,
    frameCount: rows.length,
    audit: result.audit,
    dominantCounts,
    peaks,
    keyFrames,
    allFrames: rows,
    finalChemistry: Object.fromEntries(
      Object.entries(result.finalChemistry).map(([axis, entry]) => [axis, entry.level]),
    ),
  };
}

function renderMarkdown(summary) {
  const lines = [
    "# 第一章反馈 V2 → 情绪轨迹",
    "",
    `- 玩家：${summary.profileId}`,
    `- 情绪帧：${summary.frameCount}`,
    `- 输入：player_feedback_bundle_v2`,
    `- 物理观测输入：未使用`,
    `- Agent自报情绪：未使用`,
    "",
    "## 每轮",
    "",
    "|轮次|时刻|行为|结果|主要情绪|成就|策略满足|确认满足|",
    "|---:|---|---|---|---|---:|---:|---:|",
  ];
  for (const row of summary.allFrames) {
    const emotions = row.topEmotions.slice(0, 3)
      .map((emotion) => `${EMOTION_LABELS[emotion.family] || emotion.family} ${emotion.intensity}`)
      .join(" / ") || "无超过阈值情绪";
    const moment = row.momentKind === "reward" ? "掉落与解锁" : "主要过程/结果";
    lines.push(
      `|${row.cycle}|${moment}|${row.action}|${row.outcome}|${emotions}`
        + `|${row.experiences.achievement}|${row.experiences.strategySatisfaction}`
        + `|${row.experiences.confirmationSatisfaction}|`,
    );
  }
  lines.push("", "## 说明", "");
  lines.push("- 本结果是 V2 反馈经过试验适配器产生的影子情绪，不影响本次玩家决策。");
  lines.push("- 所有化学轴均由认知评价建模得到，没有伪造心率、出汗等物理观测。");
  lines.push("- 参数仍是工程假设，第一章运行用于发现方向性错误，不代表真人强度校准完成。");
  return `${lines.join("\n")}\n`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
