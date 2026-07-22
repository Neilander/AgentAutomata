const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const RUNNER = require("./enriched-two-chapter-run");

const [, , sourcePathInput, outputDirectoryInput] = process.argv;
if (!sourcePathInput || !outputDirectoryInput) {
  throw new Error("usage: node replay-chapter1-feedback-v2.js <source-session.json> <output-directory>");
}

const sourcePath = path.resolve(sourcePathInput);
const outputDirectory = path.resolve(outputDirectoryInput);
const source = readJson(sourcePath);
assert.equal(source.schema, RUNNER.SCHEMA, "source must be an enriched two-chapter real-Agent run");
assert.ok(source.chapter1?.history?.length, "source must contain Chapter 1 history");

let replay = RUNNER.createRun({
  seed: source.seed,
  profileId: source.profileId,
  perceptionProfile: source.perceptionProfile,
  maxCyclesPerChapter: Math.max(source.maxCyclesPerChapter || 0, source.chapter1.history.length),
});

const replayedRows = [];
let attributionFieldConversions = 0;
for (const sourceRow of source.chapter1.history) {
  if (replay.chapter1.gameState?.cleared?.r1_boss) break;
  const decisionRequest = RUNNER.getPendingRequest(replay);
  assert.equal(decisionRequest.type, "decision", `cycle ${sourceRow.cycle} must request a decision`);
  assert.ok(
    decisionRequest.observation.allowedActions.includes(sourceRow.decisionResponse.action),
    `cycle ${sourceRow.cycle} replay action is no longer legal: ${sourceRow.decisionResponse.action}`,
  );
  replay = RUNNER.applyDecisionResponse(replay, sourceRow.decisionResponse);

  const attributionRequest = RUNNER.getPendingRequest(replay);
  assert.equal(attributionRequest.type, "attribution", `cycle ${sourceRow.cycle} must request attribution`);
  assert.ok(sourceRow.attribution, `cycle ${sourceRow.cycle} is missing its real-Agent attribution`);
  const replayAttribution = structuredClone(sourceRow.attribution);
  if (!replayAttribution.primaryCause && replayAttribution.cause) {
    replayAttribution.primaryCause = replayAttribution.cause;
    attributionFieldConversions += 1;
  }
  replay = RUNNER.applyAttributionResponse(replay, replayAttribution);

  const replayRow = replay.chapter1.history.at(-1);
  replayedRows.push({
    cycle: replayRow.cycle,
    sourceAction: sourceRow.action,
    replayAction: replayRow.action,
    sourceOutcome: sourceRow.outcome,
    replayOutcome: replayRow.outcome,
  });
}

assert.equal(replay.chapter1.gameState?.cleared?.r1_boss, true, "replay must clear the Chapter 1 boss");
assert.ok(replayedRows.length > 0, "replay must execute at least one cycle");
for (const row of replayedRows) {
  assert.equal(row.replayAction, row.sourceAction, `cycle ${row.cycle} action changed`);
  assert.equal(row.replayOutcome, row.sourceOutcome, `cycle ${row.cycle} outcome changed`);
}

const feedbackTraces = replay.chapter1.cognitionState.trace.filter((row) => row.feedback || row.feedbackV2);
const missingPairs = feedbackTraces.filter((row) => !row.feedback || !row.feedbackV2);
const compatibilityFailures = feedbackTraces.filter((row) => (
  row.feedbackV2.compatibility?.preservesLegacyTotal !== true
  || Number(row.feedbackV2.compatibility?.totalDelta || 0) !== 0
  || Number(row.feedbackV2.total || 0) !== Number(row.feedback.total || 0)
));
const confirmationSplits = feedbackTraces.filter((row) => row.feedbackV2.compatibility?.legacyACombinedConfirmation);
const nonZeroConfirmation = confirmationSplits.filter((row) => Math.abs(Number(row.feedbackV2.channels.C.value || 0)) > 0);
const decisionTraces = feedbackTraces.filter((row) => row.type === "decision");
const qDecisionNotNull = decisionTraces.filter((row) => row.feedbackV2.channels.process.components.decision.QDecision !== null);
const stateTransitionsNotNull = feedbackTraces.filter((row) => (
  Object.values(row.feedbackV2.stateTransitions || {}).some((value) => value !== null)
));

assert.equal(missingPairs.length, 0, "every feedback-producing trace must contain V1 and V2");
assert.equal(compatibilityFailures.length, 0, "every V2 total must equal its V1 total");
assert.equal(qDecisionNotNull.length, 0, "QDecision must remain null until its algorithm is implemented");
assert.equal(stateTransitionsNotNull.length, 0, "Agency/Stuckness fields must remain null in this trial");

const sourceChapterEmotion = source.chapter1.cognitionState.emotion;
const replayChapterEmotion = replay.chapter1.cognitionState.emotion;
const audit = {
  schema: "chapter1_player_feedback_v2_replay_audit_v1",
  result: "PASS",
  provenance: {
    mode: "real_agent_response_replay",
    sourceSession: sourcePath,
    sourceRequestedModel: source.requestedModel || null,
    seed: source.seed,
    profileId: source.profileId,
    perceptionProfile: source.perceptionProfile,
    limitation: "This validates the current V2 wiring on a real historical Agent path; it is not a fresh behavioral sample.",
    attributionCompatibility: {
      rule: "legacy cause is renamed to primaryCause without changing its text",
      convertedCount: attributionFieldConversions,
    },
  },
  chapter1: {
    cleared: true,
    cycles: replay.chapter1.cycle,
    routeMatchesSource: true,
    route: replayedRows,
  },
  feedback: {
    pairedTraceCount: feedbackTraces.length,
    missingPairCount: missingPairs.length,
    compatibilityFailureCount: compatibilityFailures.length,
    confirmationSplitCount: confirmationSplits.length,
    nonZeroConfirmationCount: nonZeroConfirmation.length,
    confirmationExamples: nonZeroConfirmation.slice(0, 5).map((row) => ({
      eventId: row.eventId,
      type: row.type,
      legacyA: row.feedback.channels.A.value,
      A: row.feedbackV2.channels.A.value,
      C: row.feedbackV2.channels.C.value,
      total: row.feedbackV2.total,
    })),
    decisionTraceCount: decisionTraces.length,
    EDecisionDistribution: countBy(
      decisionTraces.map((row) => row.feedbackV2.channels.process.components.decision.EDecision),
    ),
    qDecisionNonNullCount: qDecisionNotNull.length,
    stateTransitionNonNullCount: stateTransitionsNotNull.length,
  },
  legacyBehavior: {
    sourceFinalEmotion: sourceChapterEmotion.value,
    replayFinalEmotion: replayChapterEmotion.value,
    finalEmotionDelta: round(replayChapterEmotion.value - sourceChapterEmotion.value),
    sourceEmotionTotals: pickEmotionTotals(sourceChapterEmotion),
    replayEmotionTotals: pickEmotionTotals(replayChapterEmotion),
  },
};

fs.mkdirSync(outputDirectory, { recursive: true });
writeJson(path.join(outputDirectory, "session.json"), replay);
writeJson(path.join(outputDirectory, "feedback-v2-audit.json"), audit);
process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);

function pickEmotionTotals(emotion) {
  return {
    processTotal: round(emotion.processTotal),
    acquiredTotal: round(emotion.acquiredTotal),
    expectationTotal: round(emotion.expectationTotal),
    verificationTotal: round(emotion.verificationTotal),
  };
}

function countBy(values) {
  return Object.fromEntries([...values.reduce((counts, value) => {
    const key = value === null ? "null" : String(value);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map()).entries()]);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}
