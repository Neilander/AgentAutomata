const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const OLD_ROOT = path.join(
  __dirname,
  "controlled_runs",
  "2026-07-17_enriched_two_chapter",
);
const NEW_ROOT = path.join(
  PROJECT_ROOT,
  ".local_run_archive",
  "player_agent_api_loop_v1",
  "2026-07-18_post_cognition_two_agents",
);
const PROFILES = [
  { id: "open_novice", directory: "open_novice_paired_alpha" },
  { id: "inertial_player", directory: "inertial_player_paired_alpha" },
];

const comparisons = PROFILES.map(({ id, directory }) => {
  const oldRun = analyzeRun(
    readJson(path.join(OLD_ROOT, id, "paired-alpha", "session.json")),
    readJson(path.join(OLD_ROOT, id, "paired-alpha", "summary.json")),
  );
  const newRun = analyzeRun(
    readJson(path.join(NEW_ROOT, directory, "session.json")),
    readJson(path.join(NEW_ROOT, directory, "summary.json")),
  );
  return {
    profileId: id,
    old: oldRun,
    current: newRun,
    delta: numericDelta(oldRun, newRun),
  };
});

const output = {
  schema: "post_cognition_two_agent_comparison_v1",
  comparisonRule: {
    seed: "paired-alpha",
    perceptionProfile: "ordinary",
    environmentVariant: "enriched_v1",
    changedSystem: "current formal cognition, filtered canonical knowledge, expectation fixes",
    caveat: "Agent sampling is not deterministic; behavioral differences are evidence, not single-run proof.",
  },
  comparisons,
};

const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

function analyzeRun(run, summary) {
  const chapters = [run.chapter1, run.chapter2].filter(Boolean);
  const history = chapters.flatMap((chapter) => (
    (chapter.history || []).map((record) => ({ ...record, chapter: chapter.chapter || null }))
  ));
  const finalChapter = run.chapter2 || run.chapter1;
  const knowledge = finalChapter.knowledgeBase || [];
  const battleAndRewardKnowledge = knowledge.filter((row) => (
    !["equip_item", "change_team", "swap_team_member"].includes(row.behavior?.kind)
  ));
  const challenges = history.filter((record) => record.action?.startsWith("challenge:"));
  const challengeKnowledge = knowledge.filter((row) => row.behavior?.kind === "challenge_level");
  const decisions = history
    .map((record) => record.decisionResponse)
    .filter(Boolean);
  const decisionTexts = decisions.map((response) => JSON.stringify(response.reasoningChain || []));
  const receivedAudits = challenges
    .map((record) => record.receivedInformation?.audit)
    .filter(Boolean);
  const predictionSelections = history
    .map((record) => record.rosterPredictionSelection)
    .filter(Boolean);
  const predictionResolutions = history
    .map((record) => record.rosterPredictionResolution)
    .filter(Boolean);
  const confirmationValues = [];
  for (const resolution of predictionResolutions) {
    collectNamedNumbers(resolution, /^(C|confirmation|confirmationC|confirmationValue)$/i, confirmationValues);
  }

  return {
    complete: Boolean(summary.status?.complete),
    cycles: Number(summary.status?.cycles?.chapter1 || 0)
      + Number(summary.status?.cycles?.chapter2 || 0),
    fights: Number(summary.combat?.challenges || 0),
    wins: Number(summary.combat?.wins || 0),
    losses: Number(summary.combat?.losses || 0),
    swaps: Number(summary.roster?.swaps || 0),
    equips: Number(summary.equipment?.manualEquips || 0),
    finalEmotion: finite(summary.emotion?.final),
    knowledgeCount: knowledge.length,
    challengeKnowledgeCount: challengeKnowledge.length,
    battleKnowledgeRowsWithNonPublicEvidence: battleAndRewardKnowledge.filter((row) => (
      (row.evidenceEventIds || []).some((id) => !String(id).startsWith("battle_signal:"))
    )).length,
    knowledgeRowsWithRawThreatShape: knowledge.filter((row) => (
      /"firstAllyDeath"|"enemySurvivors"|right-\d+/i.test(JSON.stringify(row))
    )).length,
    challengeRowsWithFourMemberCognition: challengeKnowledge.filter(hasFourMemberCognition).length,
    challengeRowsWithValidCognitionMath: challengeKnowledge.filter(hasValidCognitionMath).length,
    decisionsMentioningCognition: decisionTexts.filter((text) => (
      /认知|标尺|矩阵|cognition|relative.?to.?scale/i.test(text)
    )).length,
    decisionsMentioningHistoricalCognition: decisionTexts.filter((text) => (
      /历史|过去|当时|historical|past/i.test(text)
      && /认知|标尺|矩阵|cognition|relative.?to.?scale/i.test(text)
    )).length,
    lossesFollowedBy: summarizePostLoss(history),
    rosterPredictions: {
      selected: predictionSelections.length,
      resolved: predictionResolutions.filter((row) => row.status === "resolved").length,
      invalidated: predictionResolutions.filter((row) => row.status === "invalidated").length,
      inherited: predictionResolutions.filter((row) => (
        /inherit|惯性/i.test(JSON.stringify(row))
      )).length,
      confirmationCount: confirmationValues.length,
      confirmationTotal: round(confirmationValues.reduce((sum, value) => sum + value, 0)),
    },
    filteredInformation: {
      challengeRecordsWithAudit: receivedAudits.length,
      candidateSignals: sumAudit(receivedAudits, "candidateSignalCount"),
      receivedSignals: challenges.reduce((sum, record) => (
        sum + (record.receivedInformation?.receivedObservations || []).length
      ), 0),
      divertedCharacterSignals: sumAudit(receivedAudits, "divertedCharacterSignalCount"),
      causalRoutes: receivedAudits.reduce((sum, audit) => (
        sum + Number(audit.routeCounts?.causalKnowledge || 0)
      ), 0),
    },
  };
}

function hasFourMemberCognition(row) {
  return (row.result?.observations || []).some((observation) => (
    Array.isArray(observation.teamCognitionSnapshot)
      && observation.teamCognitionSnapshot.length === 4
  ));
}

function hasValidCognitionMath(row) {
  const snapshots = (row.result?.observations || [])
    .map((observation) => observation.teamCognitionSnapshot)
    .filter(Array.isArray);
  if (!snapshots.length) return false;
  return snapshots.every((snapshot) => (
    snapshot.length === 4
      && snapshot.every((member) => (
        Number.isFinite(member.cognitionMatrixPosition)
          && Number.isFinite(member.cognitionScaleBoundaryPosition)
          && Number.isFinite(member.cognitionRelativeToScale)
          && Math.abs(
            member.cognitionMatrixPosition
              - member.cognitionScaleBoundaryPosition
              - member.cognitionRelativeToScale
          ) <= 0.002
      ))
  ));
}

function summarizePostLoss(history) {
  const result = {
    total: 0,
    immediateRetrySameNode: 0,
    challengeOtherNode: 0,
    swap: 0,
    equip: 0,
    other: 0,
  };
  for (let index = 0; index < history.length - 1; index += 1) {
    const current = history[index];
    if (!current.action?.startsWith("challenge:") || current.outcome !== "loss") continue;
    result.total += 1;
    const next = history[index + 1];
    if (next.action === current.action) result.immediateRetrySameNode += 1;
    else if (next.action?.startsWith("challenge:")) result.challengeOtherNode += 1;
    else if (next.action?.startsWith("swap:")) result.swap += 1;
    else if (next.action?.startsWith("equip:")) result.equip += 1;
    else result.other += 1;
  }
  return result;
}

function numericDelta(oldRun, newRun) {
  return {
    cycles: newRun.cycles - oldRun.cycles,
    fights: newRun.fights - oldRun.fights,
    losses: newRun.losses - oldRun.losses,
    swaps: newRun.swaps - oldRun.swaps,
    equips: newRun.equips - oldRun.equips,
    finalEmotion: round(newRun.finalEmotion - oldRun.finalEmotion),
    knowledgeCount: newRun.knowledgeCount - oldRun.knowledgeCount,
    battleKnowledgeRowsWithNonPublicEvidence: (
      newRun.battleKnowledgeRowsWithNonPublicEvidence
        - oldRun.battleKnowledgeRowsWithNonPublicEvidence
    ),
    knowledgeRowsWithRawThreatShape: (
      newRun.knowledgeRowsWithRawThreatShape - oldRun.knowledgeRowsWithRawThreatShape
    ),
    decisionsMentioningCognition: (
      newRun.decisionsMentioningCognition - oldRun.decisionsMentioningCognition
    ),
    rosterPredictionsResolved: (
      newRun.rosterPredictions.resolved - oldRun.rosterPredictions.resolved
    ),
  };
}

function collectNamedNumbers(value, keyPattern, output) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (keyPattern.test(key) && Number.isFinite(Number(nested))) output.push(Number(nested));
    else collectNamedNumbers(nested, keyPattern, output);
  }
}

function sumAudit(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

function finite(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function round(value) {
  return Math.round(Number(value || 0) * 10000) / 10000;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
