const assert = require("assert");
const { buildSystematicResult } = require("./run-systematic-credibility-test");

const result = buildSystematicResult();
assert.strictEqual(result.execution.fiveBattleSequences, 1440);
assert.strictEqual(result.execution.battleAnalysesAcrossSequences, 7200);
assert.strictEqual(result.verdict, "credible_with_guardrails");

const byId = new Map(result.checks.map((check) => [check.id, check]));
for (const id of [
  "objective_profile_invariance",
  "profile_resolution_is_observable",
  "near_threshold_trait_gate",
  "subject_local_primacy",
  "replacement_identity_isolation",
  "replacement_knowledge_and_trait_isolation",
  "trait_order_stability",
  "counterevidence_revises_belief",
  "team_relative_confounding",
  "simultaneous_strength_matrix",
  "top_thirty_scale_recalibration",
  "trait_battle_revalidation",
]) {
  assert.strictEqual(byId.get(id)?.status, "pass", `${id} must pass`);
}

assert.strictEqual(byId.get("negative_bands_are_profile_invariant")?.status, "warn");

console.log(JSON.stringify({
  result: "PASS",
  verdict: result.verdict,
  execution: result.execution,
  checks: result.checks.map(({ id, status }) => ({ id, status })),
}, null, 2));
