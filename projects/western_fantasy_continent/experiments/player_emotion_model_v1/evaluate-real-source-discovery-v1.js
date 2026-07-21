const { simulateStructuredEmotionSequence } = require("./structured-emotion-pipeline-v1");
const { cases } = require("./real-source-discovery-cases-v1");
const { validateStructuredCaseBundle } = require("./structured-case-contract-v1");

const results = [];
for (const bundle of cases) {
  const errors = validateStructuredCaseBundle(bundle);
  if (errors.length) {
    throw new Error(`${bundle.source.caseId}: ${errors.join("; ")}`);
  }
  const simulation = simulateStructuredEmotionSequence(bundle.input, {
    settledHorizonSeconds: 60,
    maxEmotions: 8,
    emotionThreshold: 0.08,
  });
  const goldCountByTimepoint = bundle.gold.emotions.reduce((counts, expected) => {
    counts[expected.timepoint] = (counts[expected.timepoint] || 0) + 1;
    return counts;
  }, {});
  const checks = bundle.gold.emotions.map((expected) => {
    const frame = expected.eventId
      ? simulation.frames.find((candidate) => candidate.eventId === expected.eventId)
      : simulation.frames.at(-1);
    const predictions = expected.timepoint === "settled"
      ? frame.settledEmotions
      : frame.emotions;
    const rank = predictions.findIndex((prediction) => prediction.family === expected.family);
    const acceptedTopK = Math.max(
      expected.timepoint === "settled" ? 2 : 3,
      goldCountByTimepoint[expected.timepoint] || 1,
    );
    return {
      expected: expected.family,
      timepoint: expected.timepoint,
      rank: rank < 0 ? null : rank + 1,
      found: rank >= 0,
      acceptedTopK,
      acceptableRank: rank >= 0 && rank < acceptedTopK,
      primary: predictions[0]?.family || null,
      predicted: predictions.slice(0, 6).map((prediction) => ({
        family: prediction.family,
        intensity: prediction.intensity,
      })),
    };
  });
  results.push({
    caseId: bundle.source.caseId,
    sourceKind: bundle.source.kind,
    checks,
    allExpectedFound: checks.every((check) => check.found),
    allRanksAcceptable: checks.every((check) => check.acceptableRank),
    primaryMatches: checks.filter((check) => check.rank === 1).length,
  });
}

const checks = results.flatMap((result) => result.checks);
console.log(JSON.stringify({
  status: results.every((result) => result.allRanksAcceptable) ? "PASS" : "DISCOVERY_MISMATCH",
  warning: "These cases were encoded after the developer saw the source emotion. They are diagnostic discovery cases, not blind accuracy.",
  caseCount: results.length,
  expectedEmotionCount: checks.length,
  expectedFound: checks.filter((check) => check.found).length,
  acceptableRanks: checks.filter((check) => check.acceptableRank).length,
  primaryMatches: checks.filter((check) => check.rank === 1).length,
  results,
}, null, 2));
