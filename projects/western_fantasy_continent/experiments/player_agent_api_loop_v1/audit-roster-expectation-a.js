const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ADAPTER = require("../../game_data/map-cognition-v3-event-adapter");
const RUNTIME = require("../../game_data/player-cognition-v3-event-runtime");
const ROSTER_A = require("./roster-expectation-a");

const RUN_ROOT = path.join(__dirname, "controlled_runs", "2026-07-16_roster_real_agents");
const PROFILE_IDS = [
  "open_novice",
  "damage_absolutist",
  "safety_conservative",
  "low_friction_optimizer",
  "inertial_player",
  "novelty_collector",
];
const DENOMINATOR_FLOOR = 0.1;

const rows = [];
for (const profileId of PROFILE_IDS) {
  const profileDir = path.join(RUN_ROOT, profileId);
  const finalState = readJson(path.join(profileDir, "state.json"));
  let cognition = RUNTIME.createState(`a-audit:${profileId}`);
  let rosterAState = ROSTER_A.createState();

  const baseline = finalState.visibleHistory[0];
  cognition = ingestFight(cognition, baseline, 0, null, null);

  for (let round = 1; round < finalState.round; round += 1) {
    const responseFile = path.join(profileDir, `response-${round}.json`);
    const requestFile = path.join(profileDir, `request-${round}.json`);
    if (!fs.existsSync(responseFile) || !fs.existsSync(requestFile)) continue;
    const response = readJson(responseFile);
    const request = readJson(requestFile);
    const actual = finalState.visibleHistory.find((row) => row.round === round);
    if (!actual || !String(response.action).startsWith("swap:")) continue;

    const prediction = request.visibleState.rosterChangeExpectations.actions
      .find((candidate) => candidate.action === response.action);
    assert(prediction, `missing roster prediction for ${profileId} round ${round}`);
    assert(Number.isFinite(prediction.predictedPerformanceScore),
      `non-numeric prediction for ${profileId} round ${round}`);

    const baselineScore = Number(request.visibleState.rosterChangeExpectations.baseline.performanceScore);
    const expectedScore = Number(prediction.predictedPerformanceScore);
    const actualScore = Number(actual.performanceScore);
    const expectedImprovement = relativeImprovement(baselineScore, expectedScore);
    const actualImprovement = relativeImprovement(baselineScore, actualScore);
    const expectedBand = perceiveOrdinary(expectedImprovement);
    const actualBand = perceiveOrdinary(actualImprovement);
    const contractAInput = round4((actualBand.level - expectedBand.level) / 9);

    const beforeTraceCount = cognition.trace.length;
    const frozen = ROSTER_A.freezeSelectedPrediction(rosterAState, {
      action: response.action,
      rosterChangeExpectations: request.visibleState.rosterChangeExpectations,
      gameState: {
        teamSlots: request.visibleState.currentTeam.map((row) => row.id),
        roster: [],
      },
      perceptionProfile: "ordinary",
      cycle: round,
    });
    const gameEvent = gameEventFor(actual, round);
    const resolved = ROSTER_A.resolveChallenge(frozen.state, {
      action: "challenge:visible_swarm_gate",
      gameStateBefore: { teamSlots: actual.teamIds, roster: [] },
      gameEvent,
      cycle: round,
    });
    rosterAState = resolved.state;
    assert(resolved.settlement, `missing settlement for ${profileId} round ${round}`);
    cognition = ingestFight(cognition, actual, round, {
      id: `roster-experiment:${profileId}:${round}`,
      heroId: response.action.split(":")[2],
    }, resolved.settlement);
    const newTrace = cognition.trace.slice(beforeTraceCount);
    const summaryTrace = newTrace.find((trace) => trace.type === "action_summary");
    const experimentTrace = newTrace.find((trace) => trace.type === "team_experiment_result");
    const mismatchScale = contractAInput >= 0
      ? cognition.config.mismatch.positiveScale
      : cognition.config.mismatch.negativeScale;
    const contractAEmotion = round4(contractAInput * mismatchScale
      * Number(summaryTrace?.H || 0) * Number(summaryTrace?.appraisal?.goalWeight || 0));

    rows.push({
      profileId,
      round,
      action: response.action,
      baselineScore,
      predictedScore: expectedScore,
      actualScore,
      expectedImprovement: round4(expectedImprovement),
      actualImprovement: round4(actualImprovement),
      expectedBand,
      actualBand,
      contractAInput,
      contractAEmotion,
      currentRuntime: {
        actionSummaryA: summaryTrace?.expectationEmotion ?? null,
        actionSummarySource: summaryTrace?.expectationSource ?? null,
        actionSummaryStatus: summaryTrace?.mismatchStatus ?? null,
        teamExperimentA: experimentTrace?.expectationEmotion ?? null,
        teamExperimentSource: experimentTrace?.expectationSource ?? null,
        teamExperimentStatus: experimentTrace?.mismatchStatus ?? null,
      },
    });
  }
}

assert.equal(rows.length, 10, "the five successful agents should produce ten swap settlements");
assert(rows.some((row) => row.contractAInput < 0), "audit needs a disappointment case");
assert(rows.some((row) => row.contractAInput > 0), "audit needs a positive-surprise case");
assert(rows.some((row) => row.contractAInput === 0), "audit needs a same-band case");
assert(rows.every((row) => row.currentRuntime.actionSummarySource === "roster_prediction"),
  "every selected swap must settle from roster_prediction");
assert(rows.every((row) => row.currentRuntime.actionSummaryA === row.contractAEmotion),
  "runtime A must match the perception-band contract for every selected swap");

const summary = {
  audit: "roster expectation -> next-fight A settlement",
  perceptionProfile: "ordinary",
  denominatorFloor: DENOMINATOR_FLOOR,
  swapSettlements: rows.length,
  contractMismatchCounts: {
    negative: rows.filter((row) => row.contractAInput < 0).length,
    zero: rows.filter((row) => row.contractAInput === 0).length,
    positive: rows.filter((row) => row.contractAInput > 0).length,
  },
  currentRuntimeNonZeroA: rows.filter((row) => row.currentRuntime.actionSummaryA !== 0
    || row.currentRuntime.teamExperimentA !== 0).length,
  currentRuntimeMatchesContract: rows.filter((row) => row.currentRuntime.actionSummaryA === row.contractAEmotion).length,
  actionSummarySources: [...new Set(rows.map((row) => row.currentRuntime.actionSummarySource))],
  verdict: "PASS: every selected roster prediction settles once through the persistent perception profile on the next comparable fight",
  rows,
};

console.log(JSON.stringify(summary, null, 2));

function ingestFight(state, visibleResult, step, activeExperiment, settlement) {
  const event = gameEventFor(visibleResult, step);
  const eventLog = ADAPTER.buildMapEventLog("challenge:visible_swarm_gate", event, {
    region: "region_1",
    activeExperiment,
    experimentContribution: activeExperiment
      ? { observed: true, damage: 100, heal: 0, shield: 0, skillCount: 1, teamDamage: 300, damageShare: 1 / 3, damageRank: 2 }
      : null,
  });
  ROSTER_A.attachSettlement(eventLog, settlement);
  return RUNTIME.ingestEvents(state, eventLog);
}

function gameEventFor(visibleResult, step) {
  const score = Number(visibleResult.performanceScore);
  const playerRemaining = (score + 1) / 2;
  const enemyRemaining = (1 - score) / 2;
  return {
    node: "visible_swarm_gate",
    step,
    outcome: visibleResult.outcome,
    duration: 10,
    teamSizes: { player: 4, enemy: 4 },
    hpScore: { player: playerRemaining * 4, enemy: enemyRemaining * 4 },
    waveSummary: [{ unitCount: 8 }],
    loot: [],
  };
}

function relativeImprovement(baselineScore, nextScore) {
  const baselineProgress = (baselineScore + 1) / 2;
  const nextProgress = (nextScore + 1) / 2;
  return (nextProgress - baselineProgress) / Math.max(baselineProgress, DENOMINATOR_FLOOR);
}

function perceiveOrdinary(rawImprovement) {
  const percent = Math.max(0, Math.min(1.5, rawImprovement)) * 100;
  if (percent < 25) return { level: 0, label: "no noticeable difference" };
  if (percent < 45) return { level: 1, label: "a little" };
  if (percent < 70) return { level: 2, label: "a fair amount" };
  if (percent < 110) return { level: 4, label: "much stronger" };
  return { level: 7, label: "explosive improvement" };
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function round4(value) { return Number(Number(value).toFixed(4)); }
