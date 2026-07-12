const fs = require("node:fs");
const path = require("node:path");
const MODEL = require("./player-cognition-v5-sandbox");
const GAME = require("./player-model-vertex-game");

const DECISION = ["problem", "cause", "behavior", "hypothesis"];
const GROWTH_BASELINE = { d50: 20, d90: 20, frequency: 1, impact: 0.2, confidence: 0.8 };

const VERTEX_TESTS = [
  test("p_enemy_hp", "Reduce ordinary enemy HP", {}, { enemyHp: 60 }, [
    change("P.W", "W", -1), change("P.total", "P", -1), change("feedback.stock", "feedbackAfter", 1),
  ]),
  test("p_travel_wait", "Reduce pre-contact travel time", { moveSeconds: 8 }, { moveSeconds: 1 }, [
    change("P.W", "W", -1), change("P.total", "P", -1), change("feedback.stock", "feedbackAfter", 1),
  ]),
  test("p_decision_chain", "Add a complete visible reasoning chain", { decisionSteps: [] }, { decisionSteps: DECISION }, [
    change("P.E_decision", "EDecision", 1), change("P.E", "E", 1), change("P.total", "P", 1), change("Q.total", "Q", 1),
  ]),
  test("p_verification", "Make the chosen hypothesis testable and confirmed", {
    decisionSteps: DECISION,
    verification: { compared: false, observed: 2, operator: ">=", target: 2, freshness: 1 },
  }, {
    decisionSteps: DECISION,
    verification: { compared: true, observed: 2, operator: ">=", target: 2, freshness: 1 },
  }, [change("P.E_verify", "EVerify", 1), change("R.verification", "verificationR", 1), change("R.total", "R", 1)]),
  test("q_perceptual_clarity", "Make the same decision feedback visually clear", {
    decisionSteps: DECISION, signal: { perceptual: 0.2 },
  }, {
    decisionSteps: DECISION, signal: { perceptual: 1 },
  }, [change("H.perceptual", "H", 1), change("Q.total", "Q", 1), change("Q.process_feedback", "processFeedback", 1)]),
  test("q_causal_clarity", "Make cause and result attribution explicit", {
    decisionSteps: DECISION, signal: { causal: 0.2 },
  }, {
    decisionSteps: DECISION, signal: { causal: 1 },
  }, [change("H.causal", "H", 1), change("Q.total", "Q", 1), change("R.progression", "progressionR", 1)]),
  test("q_progress_readability", "Expose progress toward the current goal", {
    decisionSteps: DECISION, process: { progressReadability: 0.15 },
  }, {
    decisionSteps: DECISION, process: { progressReadability: 1 },
  }, [change("Q.progress_readability", "Q", 1), change("R.progression", "progressionR", 1)]),
  test("q_dead_repetition", "Replace repeated dead time with varied useful actions", {
    decisionSteps: DECISION, process: { deadRepetition: 0.9 },
  }, {
    decisionSteps: DECISION, process: { deadRepetition: 0 },
  }, [change("Q.dead_repetition", "Q", 1), change("Q.process_feedback", "processFeedback", 1)]),
  test("q_incomprehension", "Turn unreadable combat into interpretable combat", {
    decisionSteps: DECISION, process: { incomprehension: 0.9 },
  }, {
    decisionSteps: DECISION, process: { incomprehension: 0 },
  }, [change("Q.incomprehension", "Q", 1), change("Q.process_feedback", "processFeedback", 1)]),
  test("h_salience", "Increase visual salience without changing information", {
    decisionSteps: DECISION, signal: { salience: 0.15 },
  }, {
    decisionSteps: DECISION, signal: { salience: 1 },
  }, [change("H.salience", "H", 1), change("experience.total", "totalExperience", 1, 0.01)], { expectedRisk: "May be diagnostic-only in current formula" }),
  test("h_goal_relevance", "Make the same signal directly relevant to the active goal", {
    decisionSteps: DECISION, signal: { goal: 0.15 },
  }, {
    decisionSteps: DECISION, signal: { goal: 1 },
  }, [change("H.goal", "H", 1), change("experience.total", "totalExperience", 1, 0.01)], { expectedRisk: "May be diagnostic-only in current formula" }),
  test("r_progression_amount", "Increase objective progress delivered by the encounter", { progression: 0.4 }, { progression: 2 }, [
    change("R.progression_amount", "progressionR", 1), change("R.total", "R", 1), change("A.mismatch", "A", 1),
  ]),
  test("r_progression_freshness", "Turn repeated progress into a fresh milestone", { progressionFreshness: 0.2 }, { progressionFreshness: 1 }, [
    change("R.progression_freshness", "progressionR", 1), change("R.total", "R", 1),
  ]),
  test("r_growth_bundle", "Increase equipment damage per hit", {
    damagePerHit: 20, baseline: GROWTH_BASELINE,
  }, {
    damagePerHit: 30, baseline: GROWTH_BASELINE,
  }, [
    change("R.growth.typical", "growth.gTypical", 1), change("R.growth.peak", "growth.gPeak", 1), change("R.growth.impact", "growth.gImpact", 1), change("R.growth.total", "growth.value", 1),
  ]),
  test("r_growth_frequency", "Increase attack frequency while holding hit damage", {
    attackInterval: 1, durationSeconds: 12, enemyHp: 1000, baseline: GROWTH_BASELINE,
  }, {
    attackInterval: 0.5, durationSeconds: 12, enemyHp: 1000, baseline: GROWTH_BASELINE,
  }, [change("R.growth.frequency", "growth.gFrequency", 1), change("R.growth.total", "growth.value", 1)]),
  test("r_growth_peak", "Add periodic burst hits without changing ordinary hits", {
    burstEvery: 0, burstMultiplier: 1, durationSeconds: 12, enemyHp: 1000, baseline: GROWTH_BASELINE,
  }, {
    burstEvery: 4, burstMultiplier: 3, durationSeconds: 12, enemyHp: 1000, baseline: GROWTH_BASELINE,
  }, [change("R.growth.peak", "growth.gPeak", 1), change("R.growth.total", "growth.value", 1)]),
  test("r_growth_impact", "Fight lower-HP targets so each unchanged hit removes more relative health", {
    enemyHp: 200, damagePerHit: 20, durationSeconds: 12, baseline: GROWTH_BASELINE,
  }, {
    enemyHp: 100, damagePerHit: 20, durationSeconds: 12, baseline: GROWTH_BASELINE,
  }, [change("R.growth.impact", "growth.gImpact", 1), change("R.growth.total", "growth.value", 1)]),
  test("r_baseline_confidence", "Confirm the old performance baseline before comparing growth", {
    damagePerHit: 30, baseline: { ...GROWTH_BASELINE, confidence: 0.2 },
  }, {
    damagePerHit: 30, baseline: { ...GROWTH_BASELINE, confidence: 1 },
  }, [change("R.growth.baseline_confidence", "growth.value", 1)]),
  test("r_growth_freshness", "Make the same growth event fresh rather than repeatedly exposed", {
    damagePerHit: 30, baseline: GROWTH_BASELINE, signal: { repetitions: 8 },
  }, {
    damagePerHit: 30, baseline: GROWTH_BASELINE, signal: { repetitions: 1 },
  }, [change("R.growth.freshness", "averageFreshness", 1), change("R.growth.total", "growth.value", 1)]),
  test("r_verification_freshness", "Confirm a fresh rather than repeatedly proven hypothesis", {
    decisionSteps: DECISION, verification: { compared: true, observed: 2, operator: ">=", target: 2, freshness: 0.2 },
  }, {
    decisionSteps: DECISION, verification: { compared: true, observed: 2, operator: ">=", target: 2, freshness: 1 },
  }, [change("R.verification_freshness", "verificationR", 1), change("R.total", "R", 1)]),
  test("r_other_result", "Add an understood non-progression reward", { otherResult: 0 }, { otherResult: 2 }, [
    change("R.other_result", "R", 1), change("A.mismatch", "A", 1), change("experience.total", "totalExperience", 1),
  ]),
  test("a_positive_mismatch", "Give a reward much larger than the learned exchange rate predicts", {
    otherResult: 0,
  }, {
    otherResult: 4,
  }, [change("A.positive_mismatch", "mismatch", 1), change("A.total", "A", 1)]),
  test("a_negative_mismatch", "Remove expected result while preserving effort", {
    progression: 2, otherResult: 2,
  }, {
    progression: 0, otherResult: -1,
  }, [change("A.negative_mismatch", "mismatch", -1), change("A.total", "A", -1)]),
  agencyTest("agency_desire", "Increase desire for the active goal", "desire", 0.2, 1),
  agencyTest("agency_gap", "Make the perceived gap meaningful", "gap", 0.2, 1),
  agencyTest("agency_clarity", "Clarify the current problem", "clarity", 0.2, 1),
  agencyTest("agency_path", "Reveal a path to improvement", "path", 0.15, 1),
  agencyTest("agency_causal_control", "Increase trust that the action causes the result", "causal", 0.15, 1),
  agencyTest("agency_improvement", "Increase expected improvement from the action", "improvement", 0.1, 0.7),
  agencyTest("agency_cost", "Reduce perceived action cost", "cost", 2, 0.25),
];

const CONFIG_SENSITIVITY = [
  configSpec("initialFeedbackStock", "feedbackAfter", 1),
  configSpec("abandonThreshold", "nextAction.type", 1, "abandon"),
  configSpec("stockDecayPerSecond", "feedbackAfter", -1),
  configSpec("cognitiveProcessWeight", "P", 1),
  configSpec("wProcessWeight", "P", 1),
  configSpec("k", "expectedResult", 1),
  configSpec("q.baseWithDecision", "Q", 1),
  configSpec("q.noDecisionBase", "Q", 1, "no_decision"),
  configSpec("q.clarityWeight", "Q", 1),
  configSpec("q.causalWeight", "Q", 1),
  configSpec("q.progressWeight", "Q", 1),
  configSpec("q.deadRepetitionPenalty", "Q", -1),
  configSpec("q.incomprehensionPenalty", "Q", -1),
  configSpec("result.progressionScale", "progressionR", 1),
  configSpec("result.growthScale", "growth.value", 1),
  configSpec("result.peakGrowthWeight", "growth.value", 1),
  configSpec("result.impactGrowthWeight", "growth.value", 1),
  configSpec("result.verificationBase", "verificationR", 1),
  configSpec("mismatch.positiveScale", "A", 1),
  configSpec("mismatch.positivePower", "A", 1),
  configSpec("mismatch.negativeScale", "A", -1, "negative"),
  configSpec("mismatch.negativePower", "A", -1, "negative"),
  configSpec("freshnessLambda", "averageFreshness", -1),
];

function runVertexAudit(options = {}) {
  const seeds = Number(options.seeds || 16);
  const rows = VERTEX_TESTS.map((definition) => runVertexTest(definition, seeds));
  const configRows = CONFIG_SENSITIVITY.map(runConfigSensitivity);
  const magnitudeRows = runMagnitudeSensitivity();
  return {
    schema: "player_model_vertex_audit_v1",
    modelVersion: MODEL.DEFAULT_CONFIG.version,
    seeds,
    summary: summarize(rows, configRows, magnitudeRows),
    vertexTests: rows,
    configSensitivity: configRows,
    magnitudeSensitivity: magnitudeRows,
    parameterLedger: buildParameterLedger(rows, configRows, magnitudeRows),
  };
}

function runVertexTest(definition, seeds) {
  const baselineRuns = [];
  const debugRuns = [];
  for (let index = 0; index < seeds; index += 1) {
    const seed = `${definition.id}:${index + 1}`;
    baselineRuns.push(GAME.simulateVertexGame(`${definition.id}:baseline`, definition.baselinePatch, { seed }));
    debugRuns.push(GAME.simulateVertexGame(`${definition.id}:debug`, definition.debugPatch, { seed }));
  }
  const baseline = averageOutputs(baselineRuns);
  const debug = averageOutputs(debugRuns);
  const deltas = diffNumeric(baseline, debug);
  const checks = definition.targets.map((target) => evaluateTarget(target, baseline, debug));
  const changedOutputs = Object.entries(deltas).filter(([, value]) => Math.abs(value) >= 0.001).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const behaviorChanged = baseline.nextActionType !== debug.nextActionType || baseline.nextActionBehavior !== debug.nextActionBehavior;
  const emotionChanged = Math.abs(deltas.totalExperience || 0) >= 0.01 || Math.abs(deltas.feedbackAfter || 0) >= 0.01;
  const diagnosticChanged = Math.abs(deltas.H || 0) >= 0.01 || Math.abs(deltas["agencyAfter.value"] || 0) >= 0.01;
  return {
    id: definition.id,
    designChange: definition.designChange,
    expectedRisk: definition.expectedRisk || "",
    baselinePatch: definition.baselinePatch,
    debugPatch: definition.debugPatch,
    baseline,
    debug,
    deltas,
    checks,
    pass: checks.every((row) => row.pass),
    channel: behaviorChanged ? "behavior" : emotionChanged ? "emotion" : diagnosticChanged ? "diagnostic_only" : "no_effect",
    changedOutputs: Object.fromEntries(changedOutputs.slice(0, 18)),
    baselineManifest: manifestEntry(definition, "baseline", baselineRuns[0]),
    debugManifest: manifestEntry(definition, "debug", debugRuns[0]),
  };
}

function runConfigSensitivity(spec) {
  const baseValue = getPath(MODEL.DEFAULT_CONFIG, spec.parameter);
  const lowValue = baseValue === 0 ? 0 : baseValue * 0.8;
  const highValue = baseValue === 0 ? 0.1 : baseValue * 1.2;
  if (spec.mode === "abandon") {
    const patch = { wSeconds: 0, progression: 0, otherResult: 0, decisionSteps: [], process: { deadRepetition: 0, incomprehension: 0 } };
    const low = GAME.simulateVertexGame(`config:${spec.parameter}:low`, patch, { jitter: 0, modelConfig: { initialFeedbackStock: baseValue, abandonThreshold: lowValue } }).output;
    const high = GAME.simulateVertexGame(`config:${spec.parameter}:high`, patch, { jitter: 0, modelConfig: { initialFeedbackStock: baseValue, abandonThreshold: highValue } }).output;
    return {
      parameter: spec.parameter,
      baseValue,
      lowValue: round(lowValue),
      highValue: round(highValue),
      output: spec.output,
      lowMetric: low.nextAction.type,
      highMetric: high.nextAction.type,
      delta: `${low.nextAction.type}->${high.nextAction.type}`,
      expectedDirection: "continue->abandon",
      pass: low.nextAction.type === "continue" && high.nextAction.type === "abandon",
    };
  }
  const patch = sensitivityPatch(spec.mode);
  const low = GAME.simulateVertexGame(`config:${spec.parameter}:low`, patch, { jitter: 0, modelConfig: setPath({}, spec.parameter, lowValue) }).output;
  const high = GAME.simulateVertexGame(`config:${spec.parameter}:high`, patch, { jitter: 0, modelConfig: setPath({}, spec.parameter, highValue) }).output;
  const lowMetric = Number(getPath(low, spec.output));
  const highMetric = Number(getPath(high, spec.output));
  const delta = round(highMetric - lowMetric);
  return {
    parameter: spec.parameter,
    baseValue,
    lowValue: round(lowValue),
    highValue: round(highValue),
    output: spec.output,
    lowMetric: round(lowMetric),
    highMetric: round(highMetric),
    delta,
    expectedDirection: spec.direction,
    pass: spec.direction > 0 ? delta > 0.001 : delta < -0.001,
  };
}

function runMagnitudeSensitivity() {
  const specs = [
    { parameter: "familyFreshnessWeight", metric: "feedback", direction: 1 },
    { parameter: "magnitudeSurpriseWeight", metric: "feedback", direction: 1 },
    { parameter: "breakthroughWeight", metric: "feedback", direction: 1 },
    { parameter: "baselineAlpha", metric: "expectedBefore", direction: 1 },
  ];
  return specs.map((spec) => {
    const baseValue = MODEL.DEFAULT_CONFIG[spec.parameter];
    const lowValue = baseValue * 0.8;
    const highValue = baseValue * 1.2;
    const values = spec.parameter === "baselineAlpha" ? [100, 300, 300] : [100, 100, 400];
    const lowRows = MODEL.simulateMagnitudeSequence(values, 33, { [spec.parameter]: lowValue });
    const highRows = MODEL.simulateMagnitudeSequence(values, 33, { [spec.parameter]: highValue });
    const index = spec.parameter === "baselineAlpha" ? 2 : 2;
    const lowMetric = lowRows[index][spec.metric];
    const highMetric = highRows[index][spec.metric];
    const delta = round(highMetric - lowMetric);
    return { parameter: spec.parameter, baseValue, output: spec.metric, lowValue: round(lowValue), highValue: round(highValue), lowMetric, highMetric, delta, expectedDirection: spec.direction, pass: spec.direction > 0 ? delta > 0.001 : delta < -0.001 };
  });
}

function sensitivityPatch(mode = "positive") {
  if (mode === "no_decision") {
    return {
      wSeconds: 6,
      decisionSteps: [],
      process: { deadRepetition: 0, incomprehension: 0, progressReadability: 0.8 },
      progression: 0.5,
      otherResult: 0,
    };
  }
  if (mode === "negative") {
    return {
      wSeconds: 10,
      decisionSteps: DECISION,
      signal: { perceptual: 0.9, causal: 0.8 },
      process: { deadRepetition: 0.4, incomprehension: 0.35, progressReadability: 0.8 },
      progression: 0,
      otherResult: -4,
      damagePerHit: 30,
      baseline: GROWTH_BASELINE,
      verification: { compared: true, observed: 2, operator: ">=", target: 2, freshness: 1 },
    };
  }
  return {
    wSeconds: 10,
    decisionSteps: DECISION,
    signal: { perceptual: 0.9, causal: 0.8, repetitions: 4 },
    process: { deadRepetition: 0.4, incomprehension: 0.35, progressReadability: 0.8 },
    progression: 1.4,
    otherResult: 4,
    damagePerHit: 30,
    baseline: GROWTH_BASELINE,
    verification: { compared: true, observed: 2, operator: ">=", target: 2, freshness: 1 },
  };
}

function buildParameterLedger(rows, configRows, magnitudeRows) {
  const ledger = {};
  for (const row of rows) {
    for (const check of row.checks) {
      const entry = ledger[check.parameter] || (ledger[check.parameter] = { parameter: check.parameter, tests: [], passes: 0, failures: 0, channels: new Set() });
      entry.tests.push(row.id);
      entry.passes += check.pass ? 1 : 0;
      entry.failures += check.pass ? 0 : 1;
      entry.channels.add(row.channel);
    }
  }
  for (const row of [...configRows, ...magnitudeRows]) {
    const key = `coefficient.${row.parameter}`;
    ledger[key] = { parameter: key, tests: [`coefficient:${row.parameter}`], passes: row.pass ? 1 : 0, failures: row.pass ? 0 : 1, channels: new Set(["formula_sensitivity"]) };
  }
  return Object.values(ledger).map((entry) => {
    const channels = [...entry.channels];
    const verdict = entry.failures
      ? "fail"
      : channels.every((channel) => channel === "diagnostic_only" || channel === "formula_sensitivity") ? "limited" : "pass";
    return { ...entry, channels, verdict };
  });
}

function writeAudit(outputDir, audit) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "machine-results.json"), `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, "baseline-manifest.json"), `${JSON.stringify(audit.vertexTests.map((row) => row.baselineManifest), null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, "debug-manifest.json"), `${JSON.stringify(audit.vertexTests.map((row) => row.debugManifest), null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, "parameter-ledger.md"), renderLedger(audit));
}

function renderLedger(audit) {
  const lines = [
    "# Player Model Vertex Audit",
    "",
    `- Model: ${audit.modelVersion}`,
    `- Seeds per vertex: ${audit.seeds}`,
    `- Construct tests passed: ${audit.summary.vertexPassed}/${audit.summary.vertexTotal}`,
    `- Coefficient tests passed: ${audit.summary.coefficientPassed}/${audit.summary.coefficientTotal}`,
    "",
    "| Parameter | Verdict | Tests | Channels |",
    "|---|---|---|---|",
  ];
  for (const row of audit.parameterLedger) lines.push(`| ${row.parameter} | ${row.verdict} | ${row.tests.join(", ")} | ${row.channels.join(", ")} |`);
  lines.push("", "## Failed Vertex Checks", "");
  for (const row of audit.vertexTests.filter((item) => !item.pass)) {
    lines.push(`### ${row.id}`, "", row.designChange, "");
    for (const check of row.checks.filter((item) => !item.pass)) lines.push(`- ${check.parameter}: expected ${check.expected}, observed delta ${check.delta}`);
  }
  return `${lines.join("\n")}\n`;
}

function averageOutputs(runs) {
  const numeric = {};
  for (const run of runs) collectNumeric(run.output, "", numeric);
  const averaged = Object.fromEntries(Object.entries(numeric).map(([key, values]) => [key, round(average(values))]));
  const first = runs[0].output;
  averaged.nextActionType = first.nextAction?.type || "";
  averaged.nextActionBehavior = first.nextAction?.behavior || "";
  return averaged;
}

function collectNumeric(value, prefix, target) {
  if (Number.isFinite(value)) {
    (target[prefix] || (target[prefix] = [])).push(value);
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const [key, child] of Object.entries(value)) collectNumeric(child, prefix ? `${prefix}.${key}` : key, target);
}

function diffNumeric(baseline, debug) {
  const result = {};
  for (const key of new Set([...Object.keys(baseline), ...Object.keys(debug)])) {
    if (Number.isFinite(baseline[key]) && Number.isFinite(debug[key])) result[key] = round(debug[key] - baseline[key]);
  }
  return result;
}

function evaluateTarget(target, baseline, debug) {
  const before = Number(getPath(baseline, target.output));
  const after = Number(getPath(debug, target.output));
  const delta = round(after - before);
  const pass = target.direction > 0 ? delta >= target.minAbs : delta <= -target.minAbs;
  return { parameter: target.parameter, output: target.output, before: round(before), after: round(after), delta, expected: target.direction > 0 ? `>= +${target.minAbs}` : `<= -${target.minAbs}`, pass };
}

function summarize(rows, configRows, magnitudeRows) {
  const coefficients = [...configRows, ...magnitudeRows];
  return {
    vertexTotal: rows.length,
    vertexPassed: rows.filter((row) => row.pass).length,
    vertexFailed: rows.filter((row) => !row.pass).length,
    diagnosticOnly: rows.filter((row) => row.channel === "diagnostic_only").length,
    noEffect: rows.filter((row) => row.channel === "no_effect").length,
    coefficientTotal: coefficients.length,
    coefficientPassed: coefficients.filter((row) => row.pass).length,
    coefficientFailed: coefficients.filter((row) => !row.pass).length,
  };
}

function manifestEntry(definition, version, run) {
  return {
    testId: definition.id,
    version,
    designChange: definition.designChange,
    facts: run.facts,
    observedTimeline: run.timeline,
    modelInput: run.input,
    modelReport: run.output,
  };
}

function test(id, designChange, baselinePatch, debugPatch, targets, options = {}) {
  return { id, designChange, baselinePatch, debugPatch, targets, ...options };
}

function agencyTest(id, designChange, key, before, after) {
  return test(id, designChange, { agencyAfter: { [key]: before } }, { agencyAfter: { [key]: after } }, [
    change(`Agency.${key}`, "agencyAfter.value", 1, 0.001),
    change(`Agency.${key}.behavioral_effect`, "totalExperience", 1, 0.01),
  ], { expectedRisk: "Agency may currently be diagnostic-only" });
}

function change(parameter, output, direction, minAbs = 0.005) {
  return { parameter, output, direction, minAbs };
}

function configSpec(parameter, output, direction, mode = "positive") {
  return { parameter, output, direction, mode };
}

function getPath(object, dotted) {
  if (Object.prototype.hasOwnProperty.call(object || {}, dotted)) return object[dotted];
  return String(dotted).split(".").reduce((value, key) => value?.[key], object);
}

function setPath(object, dotted, value) {
  const parts = dotted.split(".");
  let cursor = object;
  for (let index = 0; index < parts.length - 1; index += 1) cursor = cursor[parts[index]] || (cursor[parts[index]] = {});
  cursor[parts.at(-1)] = value;
  return object;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value, digits = 4) {
  return Number.isFinite(Number(value)) ? Number(Number(value).toFixed(digits)) : 0;
}

if (require.main === module) {
  const outputDir = process.argv[2];
  const audit = runVertexAudit({ seeds: Number(process.argv[3] || 16) });
  if (outputDir) writeAudit(path.resolve(outputDir), audit);
  console.log(JSON.stringify(audit.summary, null, 2));
}

module.exports = { CONFIG_SENSITIVITY, VERTEX_TESTS, runVertexAudit, runVertexTest, writeAudit };
