"use strict";

const map = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-threat-0-map");
const engine = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/standard-engine");

function place(state, dieId, cellId) {
  return engine.applyWorkerPlacement(map, state, {
    dieId,
    id: `${dieId}@${cellId}`,
  });
}

function applyMatchingRoomAction(state, predicate) {
  const action = engine.legalRoomActions(map, state).find(predicate);
  if (!action) throw new Error("expected room action was not legal");
  return engine.applyRoomAction(map, state, action);
}

function buildScenarioA() {
  let state = engine.createGame(map, 1);
  state = place(state, "r1-gray-0", "A-r2-c2");
  state = place(state, "r1-gray-1", "A-r2-c1");
  return state;
}

function finishRoundOneFromScenarioA(input) {
  let state = engine.cloneState(input);
  state = place(state, "r1-gray-2", "A-r3-c3");
  state = place(state, "r1-white-3", "A-r2-c4");
  state = place(state, "r1-white-4", "A-r2-c5");
  state = applyMatchingRoomAction(state, (action) => action.type === "resolve_room" && action.roomId === "A-upper-energy");
  state = applyMatchingRoomAction(state, (action) => action.type === "resolve_room" && action.roomId === "A-upper-fighter");
  state = applyMatchingRoomAction(state, (action) => action.type === "excavate");
  state = applyMatchingRoomAction(state, (action) => action.type === "skip_worker" && action.placementId === "r1-gray-0@A-r2-c2");
  state = applyMatchingRoomAction(state, (action) => action.type === "end_rooms");
  return engine.resolveMothership(map, state);
}

function buildScenarioB() {
  return finishRoundOneFromScenarioA(buildScenarioA());
}

function buildScenarioC() {
  let state = buildScenarioB();
  state = place(state, "r2-gray-0", "A-r2-c1");
  state = place(state, "r2-gray-1", "A-r2-c2");
  return state;
}

function summary(state) {
  return {
    mapId: state.mapId,
    seed: state.seed,
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
  };
}

if (require.main === module) {
  console.log(JSON.stringify({
    scenarioA: summary(buildScenarioA()),
    scenarioB: summary(buildScenarioB()),
    scenarioC: summary(buildScenarioC()),
  }, null, 2));
}

module.exports = {
  map,
  engine,
  buildScenarioA,
  buildScenarioB,
  buildScenarioC,
  summary,
};

