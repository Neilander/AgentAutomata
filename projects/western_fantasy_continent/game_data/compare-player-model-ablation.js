const fs = require("node:fs");
const path = require("node:path");

function simpleScore(report, decay = 0.15) {
  return Number(report.R || 0) - decay * Number(report.W || 0);
}

function direction(value, epsilon = 0.01) {
  if (value > epsilon) return "up";
  if (value < -epsilon) return "down";
  return "flat";
}

function compareAudit(audit) {
  const rows = audit.vertexTests.map((test) => {
    const complexDelta = Number(test.deltas.totalExperience || 0);
    const simpleDelta = simpleScore(test.debug) - simpleScore(test.baseline);
    const complexDirection = direction(complexDelta);
    const simpleDirection = direction(simpleDelta);
    return {
      testId: test.id,
      designChange: test.designChange,
      family: test.id.split("_")[0],
      complexDelta: round(complexDelta),
      simpleDelta: round(simpleDelta),
      complexDirection,
      simpleDirection,
      distinction: complexDirection !== "flat" && simpleDirection === "flat"
        ? "complex_only"
        : complexDirection === "flat" && simpleDirection === "flat"
          ? "both_blind"
          : complexDirection === simpleDirection
            ? "same_direction"
            : "different_direction",
    };
  });
  return {
    schema: "player_model_ablation_comparison_v1",
    note: "The simple score is a deliberate P/R-only ablation (R - time decay), not a reconstruction of a historical model version.",
    summary: {
      total: rows.length,
      complexOnly: rows.filter((row) => row.distinction === "complex_only").length,
      bothBlind: rows.filter((row) => row.distinction === "both_blind").length,
      sameDirection: rows.filter((row) => row.distinction === "same_direction").length,
      differentDirection: rows.filter((row) => row.distinction === "different_direction").length,
    },
    rows,
  };
}

function renderMarkdown(comparison) {
  const lines = [
    "# Complex Model vs P/R-only Ablation",
    "",
    comparison.note,
    "",
    `- Tests: ${comparison.summary.total}`,
    `- Added discrimination from complex model: ${comparison.summary.complexOnly}`,
    `- Blind in both models: ${comparison.summary.bothBlind}`,
    `- Same direction: ${comparison.summary.sameDirection}`,
    `- Different direction: ${comparison.summary.differentDirection}`,
    "",
    "| Test | Complex delta | Simple delta | Result |",
    "|---|---:|---:|---|",
  ];
  for (const row of comparison.rows) {
    lines.push(`| ${row.testId} | ${row.complexDelta} | ${row.simpleDelta} | ${row.distinction} |`);
  }
  lines.push("", "## Interpretation", "");
  lines.push("`complex_only` means Q/A/decision structure adds information that a time-plus-result model cannot see.");
  lines.push("`both_blind` means the current complex model still does not connect that construct to experience or behavior.");
  lines.push("`same_direction` means the complex model may improve magnitude or attribution, but the extra structure is not required to detect direction.");
  return `${lines.join("\n")}\n`;
}

function round(value, digits = 4) {
  return Number(Number(value).toFixed(digits));
}

if (require.main === module) {
  const inputPath = path.resolve(process.argv[2]);
  const outputDir = path.resolve(process.argv[3] || path.dirname(inputPath));
  const audit = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const comparison = compareAudit(audit);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "ablation-comparison.json"), `${JSON.stringify(comparison, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, "ablation-comparison.md"), renderMarkdown(comparison));
  console.log(JSON.stringify(comparison.summary, null, 2));
}

module.exports = { compareAudit, simpleScore };
