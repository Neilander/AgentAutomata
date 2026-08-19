"use strict";

const assert = require("node:assert/strict");
const ENGINE = require("./game-engine");
const PLANNER = require("./planning-model");
const SEMANTIC = require("./semantic-space");

const space = SEMANTIC.loadSemanticSpace();

function testSpaceAndGoalDynamics() {
  assert.equal(space.dimensions, 768);
  const profile = PLANNER.PROFILES.steady;
  const hypothesis = PLANNER.HYPOTHESES.research_rush;
  const low = ENGINE.createGame(101);
  low.energy = 0;
  const high = ENGINE.cloneState(low);
  high.energy = 7;
  const lowGoal = PLANNER.composeGoal(space, low, profile, hypothesis);
  const highGoal = PLANNER.composeGoal(space, high, profile, hypothesis);
  assert.ok(lowGoal.weights.energy > highGoal.weights.energy);

  const safe = ENGINE.cloneState(low);
  safe.ships.forEach((ship) => { ship.row = 0; });
  const danger = ENGINE.cloneState(low);
  danger.ships.forEach((ship) => { ship.row = 8; });
  const safeGoal = PLANNER.composeGoal(space, safe, profile, hypothesis);
  const dangerGoal = PLANNER.composeGoal(space, danger, profile, hypothesis);
  assert.ok(dangerGoal.weights.defense > safeGoal.weights.defense);
  assert.ok(dangerGoal.weights.survival > safeGoal.weights.survival);
}

function testProfilesRemainDifferent() {
  const state = ENGINE.createGame(103);
  const hypothesis = PLANNER.HYPOTHESES.infrastructure_first;
  const steady = PLANNER.composeGoal(space, state, PLANNER.PROFILES.steady, hypothesis);
  const builder = PLANNER.composeGoal(space, state, PLANNER.PROFILES.builder, hypothesis);
  assert.ok(builder.weights.infrastructure > steady.weights.infrastructure);
  assert.ok(steady.weights.stability > (builder.weights.stability || 0));
}

function testMissionObjectiveSurvivesPersonality() {
  const state = ENGINE.createGame(105);
  for (const profile of Object.values(PLANNER.PROFILES)) {
    const goal = PLANNER.composeGoal(space, state, profile, PLANNER.HYPOTHESES.infrastructure_first);
    assert.ok(goal.weights.research >= 0.85, `${profile.id} lost the shared research objective`);
    assert.ok(goal.weights.survival >= 0.55, `${profile.id} lost the shared survival objective`);
    assert.equal(goal.components[0].source, "task_objective");
  }
}

function testBoundedAuditablePlan() {
  const state = ENGINE.createGame(107);
  const plan = PLANNER.planHypothesis(space, state, PLANNER.PROFILES.builder, PLANNER.HYPOTHESES.infrastructure_first);
  assert.ok(plan.trace.length > 0 && plan.trace.length <= 5);
  assert.equal(plan.trace.every((step) => step.topCandidates.length <= 3), true);
  assert.equal(new Set(plan.trace.map((step) => step.selected.column)).size, plan.trace.length);
  assert.ok(plan.trace.every((step) => Object.keys(step.goalWeights).length >= 4));
}

function testChosenPlacementIsLegalAndReplanned() {
  let state = ENGINE.createGame(109);
  const profile = PLANNER.PROFILES.steady;
  const first = PLANNER.chooseNextPlacement(space, state, profile);
  assert.ok(ENGINE.allLegalPlacements(state).some((row) => row.id === first.selected.id));
  state = ENGINE.applyPlacement(state, first.selected);
  const second = PLANNER.chooseNextPlacement(space, state, profile);
  assert.ok(ENGINE.allLegalPlacements(state).some((row) => row.id === second.selected.id));
  assert.ok(second.plans.every((plan) => plan.trace[0].stateBefore.dice.length === 4));
}

function testRiskAffectsHighDiePlacement() {
  const state = ENGINE.createGame(113);
  state.ships.find((ship) => ship.column === 0).row = 7;
  state.dice[0].value = 5;
  const risky = ENGINE.legalPlacements(state, state.dice[0].id).find((row) => row.column === 0 && row.roomType === "energy");
  const steadyValue = PLANNER.structuredPlacementValue(state, risky, PLANNER.PROFILES.steady);
  const rushValue = PLANNER.structuredPlacementValue(state, risky, PLANNER.PROFILES.researchDriven);
  assert.ok(rushValue.value > steadyValue.value);
}

testSpaceAndGoalDynamics();
testProfilesRemainDifferent();
testMissionObjectiveSurvivesPersonality();
testBoundedAuditablePlan();
testChosenPlacementIsLegalAndReplanned();
testRiskAffectsHighDiePlacement();

console.log(JSON.stringify({ status: "PASS", tests: 6, dimensions: space.dimensions }, null, 2));
