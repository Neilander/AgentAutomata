"use strict";

const {
  buildScenarioA,
  buildScenarioB,
  buildScenarioC,
  map,
} = require("../ufs_real_state_candidate_exam_v0/scenario-fixtures");

const BUILDERS = Object.freeze({
  A: buildScenarioA,
  B: buildScenarioB,
  C: buildScenarioC,
});

function toPublicState(state) {
  return structuredClone({
    schema: "ufs_public_state_for_imagination_v0",
    mapId: state.mapId,
    round: state.round,
    phase: state.phase,
    energy: state.energy,
    damage: state.damage,
    researchIndex: state.researchIndex,
    excavatorIndex: state.excavatorIndex,
    mothershipRow: state.mothershipRow,
    dice: state.dice,
    ships: state.ships,
    placements: state.placements,
  });
}

function buildPublicScenario(label) {
  const build = BUILDERS[label];
  if (!build) throw new Error(`unknown scenario: ${label}`);
  return {
    label,
    publicState: toPublicState(build()),
    publicMap: map,
  };
}

module.exports = {
  BUILDERS,
  buildPublicScenario,
  toPublicState,
};
