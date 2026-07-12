const assert = require("node:assert/strict");
const MODEL = require("./player-cognition-v5-sandbox");
const AUDIT = require("./audit-player-model-vertices");
const ABLATION = require("./compare-player-model-ablation");
const GAME = require("./player-model-vertex-game");

const first = GAME.simulateVertexGame("deterministic", {}, { seed: "same" });
const second = GAME.simulateVertexGame("deterministic", {}, { seed: "same" });
assert.deepEqual(first.output, second.output);
assert.deepEqual(first.timeline, second.timeline);

const result = AUDIT.runVertexAudit({ seeds: 6 });
assert.equal(result.vertexTests.length, AUDIT.VERTEX_TESTS.length);
assert(result.vertexTests.every((row) => row.baselineManifest.version === "baseline"));
assert(result.vertexTests.every((row) => row.debugManifest.version === "debug"));
assert(result.vertexTests.every((row) => row.checks.length > 0));
for (const row of result.vertexTests) {
  for (const manifest of [row.baselineManifest, row.debugManifest]) {
    const visibleEnd = manifest.observedTimeline.at(-1)?.time;
    assert.equal(manifest.modelInput.wSeconds, visibleEnd, `${row.id}:${manifest.version} W must match the visible timeline`);
  }
}

for (const id of ["p_enemy_hp", "p_decision_chain", "q_perceptual_clarity", "r_progression_amount", "r_growth_bundle", "a_positive_mismatch", "a_negative_mismatch"]) {
  assert.equal(result.vertexTests.find((row) => row.id === id)?.pass, true, `${id} should remain a working audit ruler`);
}

const defaultConfigLeaves = flattenNumeric(MODEL.DEFAULT_CONFIG).filter((key) => key !== "version");
const coefficientKeys = new Set([...result.configSensitivity, ...result.magnitudeSensitivity].map((row) => row.parameter));
for (const key of defaultConfigLeaves) assert(coefficientKeys.has(key), `missing coefficient sensitivity for ${key}`);

const ledgerPrefixes = new Set(result.parameterLedger.map((row) => row.parameter.split(".")[0]));
for (const prefix of ["P", "Q", "R", "A", "Agency", "H", "experience", "feedback", "coefficient"]) assert(ledgerPrefixes.has(prefix), `missing ${prefix} parameter family`);

assert(result.configSensitivity.every((row) => row.pass), "all executable config coefficients need a measurable vertex");
assert(result.magnitudeSensitivity.every((row) => row.pass), "all magnitude/freshness coefficients need a measurable vertex");

const ablation = ABLATION.compareAudit(result);
assert(ablation.summary.complexOnly > 0, "the complex model should distinguish at least one case hidden from the P/R-only ablation");
assert(ablation.rows.some((row) => row.testId === "h_salience" && row.distinction === "both_blind"));

console.log("player-model vertex audit tests passed");

function flattenNumeric(value, prefix = "") {
  const rows = [];
  for (const [key, child] of Object.entries(value || {})) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (Number.isFinite(child)) rows.push(next);
    else if (child && typeof child === "object" && !Array.isArray(child)) rows.push(...flattenNumeric(child, next));
  }
  return rows;
}
