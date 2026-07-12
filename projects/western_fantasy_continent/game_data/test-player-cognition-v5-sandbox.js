const assert = require("node:assert/strict");
const MODEL = require("./player-cognition-v5-sandbox");

const result = MODEL.runSuite();
const byId = Object.fromEntries(result.scenarios.map((row) => [row.id, row]));

assert.ok(byId.planned_multikill.totalExperience > byId.random_multikill.totalExperience);
assert.ok(byId.upgrade_hypothesis_confirmed.totalExperience > byId.random_multikill.totalExperience);
assert.ok(byId.random_multikill.totalExperience > byId.opening_ten_hit_baseline.totalExperience);
assert.ok(byId.opening_ten_hit_baseline.totalExperience > byId.position_hypothesis_refuted.totalExperience);

assert.ok(byId.opening_ten_hit_baseline.feedbackAfter < byId.opening_ten_hit_baseline.feedbackBefore);
assert.ok(byId.upgrade_hypothesis_confirmed.feedbackAfter > byId.upgrade_hypothesis_confirmed.feedbackBefore);
assert.ok(byId.position_hypothesis_refuted.feedbackAfter < 32);
assert.ok(byId.random_multikill.feedbackAfter > byId.random_multikill.feedbackBefore);

const magnitude = result.magnitudeSequence;
assert.ok(magnitude[0].feedback > magnitude[1].feedback);
assert.ok(magnitude[1].feedback > magnitude[2].feedback);
assert.ok(magnitude[3].feedback > magnitude[2].feedback);
assert.ok(magnitude[3].feedback > magnitude[4].feedback);
assert.ok(magnitude[5].feedback > magnitude[3].feedback);

assert.equal(MODEL.validDecisionStepCount(["problem", "cause", "behavior", "hypothesis"]), 4);
assert.equal(MODEL.validDecisionStepCount(["problem", "nonsense", "behavior", "hypothesis"]), 1);
assert.equal(MODEL.evaluateVerification({ compared: false, observed: 5, target: 5 }).status, "pending");
assert.equal(MODEL.evaluateVerification({ compared: true }).status, "inconclusive");
assert.equal(MODEL.evaluateVerification({ compared: true, observed: 5, operator: "?", target: 5 }).status, "inconclusive");

const noComparison = MODEL.simulateScenario({
  ...MODEL.SCENARIOS.find((row) => row.id === "planned_multikill"),
  id: "no_comparison",
  verify: { compared: false, observed: 5, operator: ">=", target: 5, freshness: 1 },
});
assert.equal(noComparison.EVerify, 0);
assert.equal(noComparison.verificationR, 0);
assert.equal(noComparison.hypothesisStatus, "pending");

const profiles = MODEL.runProfiles();
const profileRows = Object.fromEntries(Object.entries(profiles).map(([id, rows]) => [
  id,
  Object.fromEntries(rows.map((row) => [row.id, row])),
]));
assert.ok(profileRows.impatient.opening_ten_hit_baseline.totalExperience
  < profileRows.balanced.opening_ten_hit_baseline.totalExperience);
assert.ok(profileRows.analytical.upgrade_hypothesis_confirmed.totalExperience
  > profileRows.balanced.upgrade_hypothesis_confirmed.totalExperience);
assert.ok(profileRows.impatient.position_hypothesis_refuted.totalExperience
  < profileRows.balanced.position_hypothesis_refuted.totalExperience);
assert.equal(profileRows.balanced.upgrade_hypothesis_confirmed.nextAction.type, "continue");
assert.equal(profileRows.balanced.position_hypothesis_refuted.nextAction.type, "switch");
assert.equal(profileRows.balanced.position_hypothesis_refuted.nextAction.behavior, "equip_upgrade");

const doubleSequence = MODEL.simulateMagnitudeSequence([100, 200], 33);
assert.ok(doubleSequence[1].feedback > doubleSequence[0].feedback);
const dipThenPeak = MODEL.simulateMagnitudeSequence([1000, 900, 2000], 33);
assert.ok(dipThenPeak[2].feedback > dipThenPeak[1].feedback);

const bounded = MODEL.simulateScenario({
  ...MODEL.SCENARIOS.find((row) => row.id === "upgrade_hypothesis_confirmed"),
  id: "bounded_inputs",
  progressionFreshness: 10,
  baseline: { d50: 100, d90: 150, frequency: 1, impact: 0.1, confidence: 1000 },
});
assert.ok(bounded.progressionR <= MODEL.DEFAULT_CONFIG.result.progressionScale);
assert.ok(bounded.growth.value <= MODEL.DEFAULT_CONFIG.result.growthScale);

console.log("player-cognition-v5-sandbox tests passed");
