"use strict";

const MODEL = require("./acquisition-meaning");

const scenarios = [
  { id: "after_goal_rule", stage: 1, events: [] },
  { id: "after_room_rules_no_block", stage: 3, events: [] },
  { id: "after_energy_shortage", stage: 3, events: ["research_room_energy_shortage"] },
  { id: "after_final_room_locked", stage: 5, events: ["final_research_room_locked"] },
];

const results = scenarios.map((scenario) => {
  const state = MODEL.buildMeaningState(scenario);
  return {
    ...scenario,
    activeRelations: state.activeRelations,
    surfaces: state.surfaces,
    meaningRanking: state.meaning.ranked,
  };
});

console.log(JSON.stringify({
  schema: "ufs_acquisition_meaning_experiment_v1",
  dimensions: 768,
  scoring: "normalized acquisition surface; path meaning is the product of local 768d cosine closeness; no manual utility weights",
  results,
}, null, 2));
