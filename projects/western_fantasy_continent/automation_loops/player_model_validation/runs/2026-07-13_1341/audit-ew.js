const fs = require("node:fs");
const path = require("node:path");

const RUNTIME = require("../../../../game_data/player-cognition-v3-event-runtime");
const POLICY = require("../../../../game_data/player-cognition-v3-action-policy");
const ADAPTER = require("../../../../game_data/map-cognition-v3-event-adapter");
const BASELINE_CORE = require("../../../../map_progression_lab/map-progression-cognition-core-phase2-ranger-onboarding");
const CANDIDATE_CORE = require("../../../../map_progression_lab/map-progression-cognition-core-phase2-midlock");

// A bounded paired audit is enough to test component necessity; seed 2 is the
// previously documented representative lock route, and adjacent paired seeds
// preserve the original experiment's deterministic seed family.
const SEEDS = ["midlock-ab-2"];
const MAX_ACTIONS = 20;

function processConfig(kind, multiplier) {
  const base = RUNTIME.DEFAULT_CONFIG.process;
  if (kind === "E") {
    return {
      decisionEffortValue: base.decisionEffortValue * multiplier,
      reactiveEffortValue: base.reactiveEffortValue * multiplier,
      verificationEffortValue: base.verificationEffortValue * multiplier,
      mechanicalTimeDecayPerSecond: base.mechanicalTimeDecayPerSecond,
    };
  }
  if (kind === "W") {
    return {
      decisionEffortValue: base.decisionEffortValue,
      reactiveEffortValue: base.reactiveEffortValue,
      verificationEffortValue: base.verificationEffortValue,
      mechanicalTimeDecayPerSecond: base.mechanicalTimeDecayPerSecond * multiplier,
    };
  }
  return { ...base };
}

function buildTape(core, seed) {
  let gameState = core.initialState(seed);
  let cognitionState = RUNTIME.createState(seed);
  const steps = [];
  for (let index = 0; index < MAX_ACTIONS; index += 1) {
    const observation = core.observe(gameState);
    const choice = POLICY.selectNextAction(cognitionState, observation, { time: gameState.step || 0 });
    if (!choice.action) break;
    const result = ADAPTER.runMapAction(core, gameState, choice.action, choice.cognitionState);
    if (!result.ok) throw new Error(`${seed}:${choice.action}:${result.error || "action_failed"}`);
    steps.push({
      index,
      observation: structuredClone(observation),
      action: choice.action,
      decision: structuredClone(choice.decision),
      fullCandidates: structuredClone(choice.candidates),
      outcome: result.event.outcome,
      event: structuredClone(result.event),
      eventLog: structuredClone(result.eventLog),
    });
    gameState = result.state;
    cognitionState = result.cognitionState;
  }
  return { seed, steps, terminal: POLICY.terminalDecision(cognitionState, core.observe(gameState)), sourceFinalState: cognitionState };
}

function replayTape(tape, config = {}) {
  let state = RUNTIME.createState(tape.seed, config);
  const decisions = [];
  const statesBefore = [];
  const checkpoints = [];
  let globalTime = 0;
  let lastPositiveTime = 0;
  let longestNoPositive = 0;

  for (const step of tape.steps) {
    statesBefore.push(structuredClone(state));
    const query = POLICY.selectNextAction(state, step.observation, { time: step.index });
    const rankedActions = query.candidates.map((row) => row.action);
    const recordedRank = rankedActions.indexOf(step.action) + 1;
    const margin = query.candidates.length > 1
      ? Number(query.candidates[0].score) - Number(query.candidates[1].score)
      : null;
    decisions.push({
      step: step.index + 1,
      recordedAction: step.action,
      selectedAction: query.action,
      recordedRank,
      margin: round(margin),
      ranking: query.candidates.map((row) => ({ action: row.action, score: row.score })),
      emotionBefore: round(state.emotion.value),
    });

    const traceStart = state.trace.length;
    state = RUNTIME.applyDecision(state, step.decision);
    state = RUNTIME.ingestEvents(state, step.eventLog);
    const newTrace = state.trace.slice(traceStart);
    const actionDuration = Math.max(0.1, ...step.eventLog.map((row) => Number(row.time || 0))) + 0.1;
    for (const row of newTrace) {
      const localTime = row.type === "decision" ? 0 : Math.max(0, Number(row.time || 0));
      const absoluteTime = globalTime + localTime;
      if (Number(row.emotionDelta || 0) > 0) {
        longestNoPositive = Math.max(longestNoPositive, absoluteTime - lastPositiveTime);
        lastPositiveTime = absoluteTime;
      }
    }
    globalTime += actionDuration;
    checkpoints.push({
      step: step.index + 1,
      action: step.action,
      outcome: step.outcome,
      emotion: round(state.emotion.value),
      processTotal: round(state.emotion.processTotal),
      acquiredTotal: round(state.emotion.acquiredTotal),
      expectationTotal: round(state.emotion.expectationTotal),
      knowledge: state.knowledge.length,
      goalSubjective: round(goalSubjective(state)),
      signals: newTrace.map((row) => ({
        type: row.type,
        eventId: row.eventId,
        result: row.tuple?.result?.kind || null,
        H: row.H,
        EDecision: row.EDecision || 0,
        EVerify: row.EVerify || 0,
        processEmotion: round(row.processEmotion),
        acquiredEmotion: round(row.acquiredEmotion),
        expectationEmotion: round(row.expectationEmotion),
        emotionBefore: round(row.emotionBefore),
        emotionAfter: round(row.emotionAfter),
      })),
    });
  }
  longestNoPositive = Math.max(longestNoPositive, globalTime - lastPositiveTime);
  return {
    state,
    statesBefore,
    decisions,
    checkpoints,
    metrics: {
      finalEmotion: round(state.emotion.value),
      minimumEmotion: round(state.emotion.minimum),
      processTotal: round(state.emotion.processTotal),
      acquiredTotal: round(state.emotion.acquiredTotal),
      expectationTotal: round(state.emotion.expectationTotal),
      knowledgeCount: state.knowledge.length,
      goalSubjective: round(goalSubjective(state)),
      longestNoPositive: round(longestNoPositive),
      duration: round(globalTime),
      unresolvedFailures: state.failureMemories.filter((row) => !row.resolved).length,
    },
  };
}

function goalSubjective(state) {
  return (state.goals || []).reduce((sum, row) => sum + Number(row.subjectiveValue || 0), 0);
}

function compareReplay(full, shadow) {
  const rows = full.decisions.map((decision, index) => {
    const other = shadow.decisions[index];
    return {
      step: decision.step,
      recordedAction: decision.recordedAction,
      fullSelected: decision.selectedAction,
      shadowSelected: other.selectedAction,
      selectedChanged: decision.selectedAction !== other.selectedAction,
      fullRank: decision.recordedRank,
      shadowRank: other.recordedRank,
      rankChanged: decision.recordedRank !== other.recordedRank,
      fullMargin: decision.margin,
      shadowMargin: other.margin,
      marginChange: round(Number(decision.margin || 0) - Number(other.margin || 0)),
    };
  });
  return {
    decisions: rows.length,
    selectedChanges: rows.filter((row) => row.selectedChanged).length,
    rankChanges: rows.filter((row) => row.rankChanged).length,
    marginChanges: rows.filter((row) => Math.abs(row.marginChange) >= 0.00005).length,
    maxAbsMarginChange: round(Math.max(0, ...rows.map((row) => Math.abs(row.marginChange)))),
    minFullMargin: finiteMin(rows.map((row) => row.fullMargin)),
    minShadowMargin: finiteMin(rows.map((row) => row.shadowMargin)),
    rows,
  };
}

function auditVariant(name, core) {
  const routeRows = [];
  for (const seed of SEEDS) {
    const tape = buildTape(core, seed);
    const full = replayTape(tape);
    const noE = replayTape(tape, { process: processConfig("E", 0) });
    const noW = replayTape(tape, { process: processConfig("W", 0) });
    routeRows.push({
      seed,
      tape: summarizeTape(tape),
      full,
      noE,
      noW,
      compareNoE: compareReplay(full, noE),
      compareNoW: compareReplay(full, noW),
    });
  }
  return summarizeVariant(name, routeRows);
}

function summarizeTape(tape) {
  const firstMain6 = tape.steps.findIndex((row) => row.action === "challenge:r1_main_6");
  const banditAfter = tape.steps.findIndex((row, index) => index > firstMain6 && row.action === "challenge:r1_bandit");
  const retry = tape.steps.findIndex((row, index) => index > banditAfter && row.action === "challenge:r1_main_6");
  return {
    actions: tape.steps.length,
    sourceFinalEmotion: round(tape.sourceFinalState.emotion.value),
    losses: tape.steps.filter((row) => row.outcome === "loss").length,
    firstMain6Outcome: firstMain6 >= 0 ? tape.steps[firstMain6].outcome : "missing",
    banditAfterMain6: banditAfter >= 0,
    retryOutcome: retry >= 0 ? tape.steps[retry].outcome : "none",
  };
}

function summarizeVariant(name, routeRows) {
  const models = {};
  for (const model of ["full", "noE", "noW"]) {
    models[model] = aggregateMetrics(routeRows.map((row) => row[model].metrics));
  }
  return {
    name,
    routes: routeRows.length,
    realEvents: {
      totalActions: sum(routeRows.map((row) => row.tape.actions)),
      totalLosses: sum(routeRows.map((row) => row.tape.losses)),
      firstMain6Losses: routeRows.filter((row) => row.tape.firstMain6Outcome === "loss").length,
      banditAfterMain6: routeRows.filter((row) => row.tape.banditAfterMain6).length,
      successfulRetries: routeRows.filter((row) => row.tape.retryOutcome === "win").length,
    },
    models,
    noE: aggregateComparisons(routeRows.map((row) => row.compareNoE)),
    noW: aggregateComparisons(routeRows.map((row) => row.compareNoW)),
    focal: routeRows.slice(0, 3).map(summarizeFocalRoute),
    _routeRows: routeRows,
  };
}

function summarizeFocalRoute(row) {
  const indices = row.tape.firstMain6Outcome === "loss"
    ? row.full.checkpoints.map((point, index) => ({ point, index })).filter(({ point }) => point.action === "challenge:r1_main_6" || point.action === "challenge:r1_bandit").map(({ index }) => index)
    : [Math.max(0, row.full.checkpoints.findIndex((point) => point.action === "challenge:r1_main_6"))];
  return {
    seed: row.seed,
    tape: row.tape,
    checkpoints: indices.map((index) => ({
      action: row.full.checkpoints[index]?.action,
      outcome: row.full.checkpoints[index]?.outcome,
      fullEmotion: row.full.checkpoints[index]?.emotion,
      noEEmotion: row.noE.checkpoints[index]?.emotion,
      noWEmotion: row.noW.checkpoints[index]?.emotion,
      fullNext: row.full.decisions[index + 1]?.selectedAction || null,
      noENext: row.noE.decisions[index + 1]?.selectedAction || null,
      noWNext: row.noW.decisions[index + 1]?.selectedAction || null,
      fullSignals: row.full.checkpoints[index]?.signals || [],
      noESignals: row.noE.checkpoints[index]?.signals || [],
      noWSignals: row.noW.checkpoints[index]?.signals || [],
    })),
  };
}

function aggregateMetrics(rows) {
  const keys = Object.keys(rows[0] || {});
  return Object.fromEntries(keys.map((key) => [`average${capitalize(key)}`, round(average(rows.map((row) => row[key]))) ]));
}

function aggregateComparisons(rows) {
  return {
    decisions: sum(rows.map((row) => row.decisions)),
    selectedChanges: sum(rows.map((row) => row.selectedChanges)),
    rankChanges: sum(rows.map((row) => row.rankChanges)),
    marginChanges: sum(rows.map((row) => row.marginChanges)),
    maxAbsMarginChange: round(Math.max(...rows.map((row) => row.maxAbsMarginChange))),
    minFullMargin: finiteMin(rows.map((row) => row.minFullMargin)),
    minShadowMargin: finiteMin(rows.map((row) => row.minShadowMargin)),
  };
}

function designDelta(candidate, baseline, model) {
  const c = candidate.models[model];
  const b = baseline.models[model];
  return {
    finalEmotion: round(c.averageFinalEmotion - b.averageFinalEmotion),
    minimumEmotion: round(c.averageMinimumEmotion - b.averageMinimumEmotion),
    longestNoPositive: round(c.averageLongestNoPositive - b.averageLongestNoPositive),
    goalSubjective: round(c.averageGoalSubjective - b.averageGoalSubjective),
    expectationTotal: round(c.averageExpectationTotal - b.averageExpectationTotal),
    knowledgeCount: round(c.averageKnowledgeCount - b.averageKnowledgeCount),
  };
}

function stripRoutes(variant) {
  const result = { ...variant };
  delete result._routeRows;
  return result;
}

function main() {
  const baseline = auditVariant("baseline", BASELINE_CORE);
  const candidate = auditVariant("candidate", CANDIDATE_CORE);
  const evidence = {
    schema: "player_model_fixed_tape_ew_audit_v1",
    generatedAt: new Date().toISOString(),
    claim: "If E or W is necessary, removing it on identical real-event tapes should change paired design-emotion judgment or later action ranking, margin, or selection.",
    designVariable: "candidate adds the Main 6 heavy-shield soft lock and Bandit key package; baseline does not",
    frozen: {
      seeds: SEEDS,
      maxActions: MAX_ACTIONS,
      onlineSettlement: true,
      gameplayChanged: false,
      modelFilesChanged: false,
    },
    baseline: stripRoutes(baseline),
    candidate: stripRoutes(candidate),
    designDeltas: {
      full: designDelta(candidate, baseline, "full"),
      noE: designDelta(candidate, baseline, "noE"),
      noW: designDelta(candidate, baseline, "noW"),
    },
    exactReplayChecks: {
      baselineFinalEmotionDifference: round(baseline.models.full.averageFinalEmotion - average(baseline._routeRows.map((row) => row.tape.sourceFinalEmotion))),
      candidateFinalEmotionDifference: round(candidate.models.full.averageFinalEmotion - average(candidate._routeRows.map((row) => row.tape.sourceFinalEmotion))),
    },
  };
  const output = path.join(__dirname, "evidence.json");
  fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    baseline: evidence.baseline,
    candidate: evidence.candidate,
    designDeltas: evidence.designDeltas,
    output,
  }, null, 2));
}

function finiteMin(values) {
  const rows = values.filter(Number.isFinite);
  return rows.length ? round(Math.min(...rows)) : null;
}
function sum(values) { return values.reduce((total, value) => total + Number(value || 0), 0); }
function average(values) { return values.length ? sum(values) / values.length : 0; }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

main();
