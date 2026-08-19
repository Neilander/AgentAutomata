"use strict";

const assert = require("node:assert/strict");
const {
  applyBuildResponse,
  applyEstimateResponse,
  createSession,
  getPendingRequest,
} = require("./mind-toy-ai-loop");
const { attempt } = require("./mind-toy-runtime");
const FOOD_CASE = require("./cases/food-day-planning");

function assemble(input, estimates) {
  let session = createSession(input);
  session = applyBuildResponse(session, FOOD_CASE.createBuildResponse());
  session = applyEstimateResponse(session, estimates);
  return session;
}

function testClosedWorldRequest() {
  let session = createSession(FOOD_CASE.createInput());
  session = applyBuildResponse(session, FOOD_CASE.createBuildResponse());
  const request = getPendingRequest(session);
  assert.equal(request.knowledgePolicy.mode, "closed_world");
  assert.equal(request.estimationRequests.length, 40);
  assert.equal(request.allowedEvidenceIds.filter((id) => id.startsWith("knowledge_food_")).length, 20);
}

function testClosedWorldFactMismatchRejected() {
  const input = FOOD_CASE.createInput();
  let session = createSession(input);
  session = applyBuildResponse(session, FOOD_CASE.createBuildResponse());
  const response = FOOD_CASE.createEstimateResponse();
  response.estimates.find((row) => row.requestId === "nutrition_oats").value.values.calories = 999;
  assert.throws(() => applyEstimateResponse(session, response), /fact binding mismatch/);
}

function testExactNutritionCannotBecomeFreeEstimate() {
  const input = FOOD_CASE.createInput();
  let session = createSession(input);
  session = applyBuildResponse(session, FOOD_CASE.createBuildResponse());
  const response = FOOD_CASE.createEstimateResponse();
  response.estimates.find((row) => row.requestId === "nutrition_oats").status = "estimated";
  assert.throws(() => applyEstimateResponse(session, response), /must be known or unknown/);
}

function testFullKnowledgeMealPlanning() {
  const session = assemble(FOOD_CASE.createInput(), FOOD_CASE.createEstimateResponse());
  const result = attempt(session.mindToy, { beamWidth: 400, resultLimit: 20 });
  assert.equal(result.representation, "factorized_additive");
  assert.equal(result.selected.selectedActionIds.length, 6);
  assert.equal(new Set(result.selected.selectedActionIds).size, 6);
  assert(result.selected.finalMetrics.calories >= 1500);
  assert(result.selected.finalMetrics.addedSugar <= 25);
  assert(result.selected.finalMetrics.averagePreference >= 7);
  assert(result.trace.branchExpansions > 1000);
  assert(result.trace.prunedBranches > 0);
  assert(result.trace.equivalentPlansCompressed > 0);
  assert.equal(new Set(result.ranking.map((plan) => [...plan.selectedActionIds].sort().join("|"))).size, result.ranking.length);
  assert.deepEqual(result.trace.unknownActionIds, []);
}

function testMissingKnowledgeStaysUnknown() {
  const missingFoodIds = ["salmon", "cake", "cola"];
  const input = FOOD_CASE.createInput({ id: "food_missing_knowledge", missingFoodIds });
  const session = assemble(input, FOOD_CASE.createEstimateResponse({ missingFoodIds }));
  const result = attempt(session.mindToy, { beamWidth: 300, resultLimit: 10 });
  for (const foodId of missingFoodIds) {
    assert(result.trace.unknownActionIds.includes(foodId));
    assert(!result.ranking.some((plan) => plan.selectedActionIds.includes(foodId)));
  }
  assert.equal(result.selected.selectedActionIds.length, 6);
}

function testPlayerPlanningBudgetLimitsSearch() {
  const lowSession = assemble(FOOD_CASE.createInput({ id: "food_low_budget", beamWidth: 5 }), FOOD_CASE.createEstimateResponse());
  const highSession = assemble(FOOD_CASE.createInput({ id: "food_high_budget", beamWidth: 80 }), FOOD_CASE.createEstimateResponse());
  const low = attempt(lowSession.mindToy);
  const high = attempt(highSession.mindToy);
  assert(low.trace.branchExpansions < high.trace.branchExpansions);
  assert(low.ranking.length <= 5);
  assert(high.ranking.length >= low.ranking.length);
}

const TESTS = [
  testClosedWorldRequest,
  testClosedWorldFactMismatchRejected,
  testExactNutritionCannotBecomeFreeEstimate,
  testFullKnowledgeMealPlanning,
  testMissingKnowledgeStaysUnknown,
  testPlayerPlanningBudgetLimitsSearch,
];

for (const test of TESTS) {
  test();
  console.log(`PASS ${test.name}`);
}

console.log(`\n${TESTS.length} food planning tests passed.`);
