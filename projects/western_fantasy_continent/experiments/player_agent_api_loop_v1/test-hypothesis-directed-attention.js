const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const PARSER = require("./battle-information-parser");
const ORGANIZER = require("./received-information-organizer");
const ATTENTION = require("./hypothesis-directed-attention");
const MATCHER = require("../../game_data/causal-chain-event-matcher");

const ARCHIVE_ROOT = path.join(
  __dirname,
  "..",
  "..",
  ".local_run_archive",
  "player_agent_api_loop_v1",
  "2026-07-19_formal_structured_everify_ch1",
);

const archivedSessions = [
  loadChapter("open_novice_paired_alpha"),
  loadChapter("inertial_player_paired_alpha"),
];

const statusDirection = verifyStatusDirection(archivedSessions[0]);
const deterministicReplay = replayArchivedHypotheses(archivedSessions);
const stochasticCalibration = calibrateDirectedAttention(archivedSessions[0]);

assert(deterministicReplay.focusedResolvedCount >= deterministicReplay.baselineResolvedCount);
assert(deterministicReplay.focusedResolvedCount < deterministicReplay.caseCount);
assert(stochasticCalibration.focusedClosedChainRate > stochasticCalibration.baselineClosedChainRate);
assert(stochasticCalibration.focusedClosedChainRate < 1);
assert.equal(stochasticCalibration.unrelatedSelectionChanges, 0);

console.log(JSON.stringify({
  result: "PASS",
  statusDirection,
  deterministicReplay,
  stochasticCalibration,
}, null, 2));

function loadChapter(name) {
  const session = JSON.parse(fs.readFileSync(path.join(ARCHIVE_ROOT, name, "session.json"), "utf8"));
  return { name, chapter: session.chapter1 };
}

function verifyStatusDirection(sessionRow) {
  const record = sessionRow.chapter.history.find((row) => row.cycle === 12);
  const candidates = PARSER.selectReceivedCandidatesForOrganizer(
    record.rawEventLog,
    { perceptionLevel: "high" },
  ).candidates;
  const statusCandidates = candidates.filter((row) => row.type.endsWith("_visible_status"));
  const enemy = statusCandidates.find((row) => row.type === "enemy_visible_status");
  assert(enemy);
  assert(enemy.statement.includes("猎标箭"));
  assert(enemy.evidence.every((event) => event.subject?.side === "right"));
  assert(statusCandidates
    .filter((row) => row.type === "ally_visible_status")
    .every((row) => row.evidence.every((event) => event.subject?.side === "left")));
  assert(statusCandidates.every((row) => row.evidence.every((event) => (
    ["left", "right"].includes(event.subject?.side)
  ))));

  const subjectlessOnly = PARSER.selectReceivedCandidatesForOrganizer(
    record.rawEventLog.filter((event) => event.type === "status" && !event.subject),
    { perceptionLevel: "high" },
  ).candidates;
  assert(!subjectlessOnly.some((row) => row.type.endsWith("_visible_status")));

  return {
    enemySkillSourceVerified: true,
    subjectlessFieldStatusExcludedFromCharacterDirection: true,
    statusCandidateCount: statusCandidates.length,
  };
}

function replayArchivedHypotheses(sessionRows) {
  const cases = [];
  for (const sessionRow of sessionRows) {
    const history = sessionRow.chapter.history;
    for (const [index, origin] of history.entries()) {
      const hypothesis = origin.decisionResponse?.hypothesis;
      if (!Array.isArray(hypothesis?.causalChain)) continue;
      const battle = hypothesis.verificationScope === "current_action"
        ? origin
        : history.slice(index + 1).find((row) => row.action.startsWith("challenge:"));
      assert(battle, `missing verification battle for ${hypothesis.id}`);
      cases.push(replayCase(sessionRow.name, origin, battle, hypothesis));
    }
  }

  const statusCounts = (key) => Object.fromEntries([
    "confirmed",
    "partially_confirmed",
    "refuted",
    "inconclusive",
  ].map((status) => [
    status,
    cases.filter((row) => row[key] === status).length,
  ]));
  const baselineStatuses = statusCounts("baselineStatus");
  const focusedStatuses = statusCounts("focusedStatus");
  return {
    caseCount: cases.length,
    baselineStatuses,
    focusedStatuses,
    baselineResolvedCount: cases.filter((row) => row.baselineStatus !== "inconclusive").length,
    focusedResolvedCount: cases.filter((row) => row.focusedStatus !== "inconclusive").length,
    newlyReceivedFocusedEvidence: cases.reduce((sum, row) => sum + row.newFocusedEvidenceCount, 0),
    cases,
  };
}

function replayCase(sessionName, origin, battle, hypothesisInput) {
  const pendingHypothesis = pendingRuntimeHypothesis(origin, hypothesisInput);
  const attention = ATTENTION.buildHypothesisDirectedAttention(
    [pendingHypothesis],
    { action: battle.action },
  );
  assert.equal(attention.active, true);
  const options = organizerOptions(battle);
  const baseline = ORGANIZER.organizeReceivedBattleInformation(battle.rawEventLog, options);
  const focused = ORGANIZER.organizeReceivedBattleInformation(battle.rawEventLog, {
    ...options,
    hypothesisAttention: attention,
  });
  assert.deepEqual(
    baseline.causalEvidence.map((row) => row.id),
    battle.receivedInformation.causalEvidence.map((row) => row.id),
    `baseline replay drifted for ${hypothesisInput.id}`,
  );
  assert.deepEqual(
    baseline.receivedObservations,
    focused.receivedObservations,
    "定向注意不得改变普通知识信号",
  );

  const baselineResult = match(hypothesisInput, origin.action, baseline.causalEvidence);
  const focusedResult = match(hypothesisInput, origin.action, focused.causalEvidence);
  const baselineById = new Map(baseline.causalEvidence.map((row) => [row.id, row]));
  for (const event of focused.causalEvidence) {
    if (!baselineById.has(event.id)) continue;
    assert.equal(
      event.informationTier,
      baselineById.get(event.id).informationTier,
      "注意力只能提高接收机会，不能伪造画面强度",
    );
  }

  return {
    session: sessionName,
    hypothesisId: hypothesisInput.id,
    battleCycle: battle.cycle,
    baselineStatus: baselineResult.everify.status,
    focusedStatus: focusedResult.everify.status,
    baselineStepStates: baselineResult.stepMatches.map((row) => row.state),
    focusedStepStates: focusedResult.stepMatches.map((row) => row.state),
    focusedCandidateCount: focused.audit.hypothesisAttention.focusedCandidateCount,
    receivedFocusedCandidateCount: focused.audit.hypothesisAttention.receivedFocusedCandidateCount,
    newFocusedEvidenceCount: focused.causalEvidence.filter((row) => (
      !baselineById.has(row.id)
    )).length,
  };
}

function calibrateDirectedAttention(sessionRow) {
  const battle = sessionRow.chapter.history.find((row) => row.cycle === 3);
  const hypothesis = battle.decisionResponse.hypothesis;
  const pending = pendingRuntimeHypothesis(battle, hypothesis);
  const attention = ATTENTION.buildHypothesisDirectedAttention([pending], { action: battle.action });
  const baseOptions = organizerOptions(battle);
  let baselineClosed = 0;
  let focusedClosed = 0;
  let unrelatedSelectionChanges = 0;
  const trials = 240;

  for (let index = 0; index < trials; index += 1) {
    const seed = `attention-calibration:${index}`;
    const baselineReception = PARSER.selectReceivedCandidatesForOrganizer(
      battle.rawEventLog,
      { ...baseOptions, seed },
    );
    const focusedReception = PARSER.selectReceivedCandidatesForOrganizer(
      battle.rawEventLog,
      { ...baseOptions, seed, hypothesisAttention: attention },
    );
    const baselineEvidence = baselineReception.selectedCausalEvidence.map(publicEvidence);
    const focusedEvidence = focusedReception.selectedCausalEvidence.map(publicEvidence);
    if (match(hypothesis, battle.action, baselineEvidence).everify.comparisonMade) baselineClosed += 1;
    if (match(hypothesis, battle.action, focusedEvidence).everify.comparisonMade) focusedClosed += 1;

    const focusedIds = new Set(
      focusedReception.causalEvidenceCandidates
        .filter((row) => row.hypothesisAttention.matched)
        .map((row) => row.publicId),
    );
    const baselineUnrelated = baselineReception.selectedCausalEvidence
      .filter((row) => !focusedIds.has(row.publicId))
      .map((row) => row.publicId);
    const focusedUnrelated = focusedReception.selectedCausalEvidence
      .filter((row) => !focusedIds.has(row.publicId))
      .map((row) => row.publicId);
    if (JSON.stringify(baselineUnrelated) !== JSON.stringify(focusedUnrelated)) {
      unrelatedSelectionChanges += 1;
    }
  }

  return {
    trials,
    baselineClosedChainRate: round(baselineClosed / trials),
    focusedClosedChainRate: round(focusedClosed / trials),
    unrelatedSelectionChanges,
    strengthBonus: 0.12,
    forcedReception: false,
  };
}

function pendingRuntimeHypothesis(origin, hypothesis) {
  return {
    ...structuredClone(hypothesis),
    status: "pending",
    action: origin.action,
    chosenBehavior: origin.action,
  };
}

function organizerOptions(record) {
  const teamMembers = record.decisionRequest.observation.teamSlots.map((row) => ({
    id: row.heroId,
    name: row.heroName,
  }));
  return {
    seed: `formal:${record.cycle}:${record.action}`,
    episodeId: `formal:${record.cycle}`,
    perceptionLevel: "ordinary",
    causalContext: {
      action: record.action,
      node: record.gameEvent?.node,
      region: record.rawEventLog.find((row) => row.environment?.region)?.environment?.region,
      teamIds: teamMembers.map((row) => row.id),
      teamMembers,
      gameEvent: record.gameEvent,
      performanceScore: record.rosterExpectationUpdate?.performanceScore,
    },
  };
}

function match(hypothesis, chosenBehavior, evidence) {
  return MATCHER.matchCausalChain({
    hypothesis: {
      id: hypothesis.id,
      claim: hypothesis.claim,
      claimMode: hypothesis.claimMode,
      chosenBehavior,
      causalChain: hypothesis.causalChain,
    },
    receivedSemanticEvents: evidence,
  });
}

function publicEvidence(row) {
  return {
    id: row.publicId,
    ...structuredClone(row.semanticEvent),
    informationTier: row.features.informationTier,
  };
}

function round(value) {
  return Number(value.toFixed(4));
}
