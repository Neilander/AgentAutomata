const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "attention-samples.json");
const outputPath = path.join(__dirname, "attention-analysis-report.md");

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const defaults = data.defaults;

function pow(value, power) {
  return Math.pow(Math.max(0.0001, value), power);
}

function categoryPenalty(signal, signals, sampleDefaults) {
  const count = signals.filter((item) => item.category === signal.category).length;
  if (count <= 1) return 1;
  return 1 / Math.pow(count, sampleDefaults.categoryDilution);
}

function clusterPenalty(cluster, signal, sampleDefaults) {
  if (cluster.mode === "gestalt_feedback") {
    return 1 + Math.log1p(cluster.signals.length) * 0.08;
  }
  const area = Math.max(0.04, cluster.areaShare || 0.1);
  const density = cluster.signals.length / area;
  const densityPenalty = 1 / (1 + density * sampleDefaults.densityWeight);
  const sameVisualCount = cluster.signals.filter((item) => item.visualGroup === signal.visualGroup).length;
  const similarityPenalty = sameVisualCount <= 1
    ? 1
    : 1 / Math.pow(sameVisualCount, sampleDefaults.visualSimilarityDilution);
  return densityPenalty * similarityPenalty;
}

function signalRaw(signal) {
  const bottomUp = signal.salience * signal.novelty;
  const topDown = signal.importance * signal.intentFit * signal.goalRelevance;
  return (bottomUp * 0.42) + (topDown * 0.58);
}

function analyzeSample(sample) {
  const sampleDefaults = { ...defaults, ...(sample.defaults || {}) };
  const clusters = sample.clusters.map((cluster) => {
    const signals = cluster.signals.map((signal) => {
      const raw = signalRaw(signal);
      const catPenalty = categoryPenalty(signal, cluster.signals, sampleDefaults);
      const clPenalty = clusterPenalty(cluster, signal, sampleDefaults);
      const effective = raw * catPenalty * clPenalty;
      return {
        ...signal,
        raw,
        categoryPenalty: catPenalty,
        clusterPenalty: clPenalty,
        effective,
      };
    });
    const aggregateSum = signals.reduce((sum, signal) => {
      return sum + pow(signal.effective, sampleDefaults.clusterAggregatePower);
    }, 0);
    const strength = Math.pow(Math.max(0.0001, aggregateSum), 1 / sampleDefaults.clusterAggregatePower);
    return { ...cluster, signals, strength };
  });

  const clusterDenom = clusters.reduce((sum, cluster) => {
    return sum + pow(cluster.strength, sampleDefaults.clusterMatthewPower);
  }, 0);

  const withAttention = clusters.map((cluster) => {
    const clusterAttention = sampleDefaults.attentionBudget * pow(cluster.strength, sampleDefaults.clusterMatthewPower) / clusterDenom;
    const signalDenom = cluster.signals.reduce((sum, signal) => {
      return sum + pow(signal.effective, sampleDefaults.signalMatthewPower);
    }, 0);
    const signals = cluster.signals.map((signal) => ({
      ...signal,
      attention: clusterAttention * pow(signal.effective, sampleDefaults.signalMatthewPower) / signalDenom,
    })).sort((a, b) => b.attention - a.attention);
    const thresholds = cluster.thresholds || {};
    let status = "ok";
    if (thresholds.min != null && clusterAttention < thresholds.min) status = "too_low";
    if (thresholds.max != null && clusterAttention > thresholds.max) status = "too_high";
    return {
      ...cluster,
      signals,
      attention: clusterAttention,
      status,
    };
  }).sort((a, b) => b.attention - a.attention);

  const predictedTop = withAttention.slice(0, 3).map((cluster) => cluster.id);
  const expectedTop = sample.expectedTopClusters || [];
  const overlap = predictedTop.filter((id) => expectedTop.includes(id)).length;
  const issues = [];

  withAttention.forEach((cluster) => {
    if (cluster.status === "too_low") issues.push(`${cluster.id} below minimum attention (${cluster.attention.toFixed(1)})`);
    if (cluster.status === "too_high") issues.push(`${cluster.id} above maximum attention (${cluster.attention.toFixed(1)})`);
    if (cluster.mode === "individual_reading" && cluster.signals.length > 8) {
      issues.push(`${cluster.id} has ${cluster.signals.length} individual-reading signals`);
    }
  });

  return {
    sample,
    clusters: withAttention,
    predictedTop,
    expectedTop,
    overlap,
    issues,
  };
}

function formatReport(results) {
  const lines = [];
  lines.push("# Attention Analysis Report");
  lines.push("");
  lines.push("This is a first rough pass. Scores are not calibrated facts; they test whether the formula roughly matches human intuition.");
  lines.push("");
  results.forEach((result) => {
    lines.push(`## ${result.sample.title}`);
    lines.push("");
    lines.push(`- Intent: \`${result.sample.intent}\``);
    lines.push(`- Expected top clusters: ${result.expectedTop.join(", ")}`);
    lines.push(`- Predicted top clusters: ${result.predictedTop.join(", ")}`);
    lines.push(`- Top-3 overlap: ${result.overlap}/3`);
    lines.push("");
    lines.push("| Cluster | Attention | Status | Top signal |");
    lines.push("| --- | ---: | --- | --- |");
    result.clusters.forEach((cluster) => {
      const topSignal = cluster.signals[0];
      lines.push(`| ${cluster.id} | ${cluster.attention.toFixed(1)} | ${cluster.status} | ${topSignal.id} (${topSignal.attention.toFixed(1)}) |`);
    });
    lines.push("");
    if (result.issues.length) {
      lines.push("Issues:");
      result.issues.forEach((issue) => lines.push(`- ${issue}`));
    } else {
      lines.push("Issues: none by current thresholds.");
    }
    lines.push("");
  });
  return lines.join("\n");
}

const results = data.samples.map(analyzeSample);
fs.writeFileSync(outputPath, formatReport(results), "utf8");
console.log(`Wrote ${outputPath}`);
results.forEach((result) => {
  console.log(`${result.sample.id}: predicted=${result.predictedTop.join(",")} expected=${result.expectedTop.join(",")} overlap=${result.overlap}/3`);
});
