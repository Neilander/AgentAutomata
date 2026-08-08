"use strict";

const ENGINE = require("./game-engine");
const PLANNER = require("./planning-model");

const PROFILE_HYPOTHESIS = Object.freeze({
  steady: "defense_first",
  researchDriven: "research_rush",
  builder: "infrastructure_first",
});

function choosePlacement(method, space, state, profile, random) {
  if (method === "random") {
    const legal = ENGINE.allLegalPlacements(state);
    const selected = legal[Math.floor(random.next() * legal.length)];
    return { selected, selectedHypothesisId: null, trace: { legalCount: legal.length } };
  }
  if (method === "one_step_rune") {
    const hypothesis = PLANNER.HYPOTHESES[PROFILE_HYPOTHESIS[profile.id]];
    const decision = PLANNER.chooseMicroDecision(space, state, profile, hypothesis);
    return {
      selected: decision.selected,
      selectedHypothesisId: hypothesis.id,
      trace: {
        goalWeights: decision.goal.weights,
        topCandidates: decision.topCandidates,
        recalledCount: decision.recalledCount,
      },
    };
  }
  if (method === "fixed_goal_plan") {
    const decision = PLANNER.chooseNextPlacement(space, state, profile, { freezeContext: true });
    return {
      selected: decision.selected,
      selectedHypothesisId: decision.selectedHypothesisId,
      trace: { plans: compactPlans(decision.plans) },
    };
  }
  if (method === "full_dynamic_plan") {
    const decision = PLANNER.chooseNextPlacement(space, state, profile);
    return {
      selected: decision.selected,
      selectedHypothesisId: decision.selectedHypothesisId,
      trace: { plans: compactPlans(decision.plans) },
    };
  }
  throw new Error(`unknown method: ${method}`);
}

function compactPlans(plans) {
  return plans.map((plan) => ({
    hypothesisId: plan.hypothesisId,
    score: plan.score,
    firstPlacementId: plan.firstPlacement?.id || null,
    predictedState: plan.predictedState,
    firstGoalWeights: plan.trace[0]?.goalWeights || {},
    firstTopCandidates: plan.trace[0]?.topCandidates || [],
  }));
}

module.exports = { choosePlacement };
