"use strict";

// This file is deliberately separate from run-autonomous-round.js. It may read
// the formal engine only after the cognitive experiment has produced its trace.
const assert = require("node:assert/strict");
const decisions = require("./agent_decisions.json");
const external = require("./external_random_observations.json");
const { runExperiment } = require("./run-autonomous-round");
const { engine, map } = require("../ufs_real_state_candidate_exam_v0/scenario-fixtures");

function sortedShips(ships) {
  return ships.map((ship) => ({ ...ship })).sort((left, right) => left.id.localeCompare(right.id));
}

function formalReplay() {
  let state = engine.createGame(map, 1);
  for (const selected of decisions.placements) {
    const action = engine.allLegalWorkerPlacements(map, state).find((row) => (
      row.dieId === selected.dieId && row.cellId === selected.cellId
    ));
    assert.ok(action, `illegal placement ${selected.cardId}`);
    state = engine.applyWorkerPlacement(map, state, action);
    const expected = external.observations[`after:${selected.dieId}`];
    if (expected) {
      for (const [dieId, value] of Object.entries(expected)) {
        assert.equal(state.dice.find((die) => die.id === dieId).value, value, `random observation ${dieId}`);
      }
    }
  }
  for (const selected of decisions.roomActions) {
    const action = engine.legalRoomActions(map, state).find((row) => (
      row.type === selected.type
      && (selected.roomId == null || row.roomId === selected.roomId)
      && (selected.placementId == null || row.placementId === selected.placementId)
    ));
    assert.ok(action, `illegal room action ${selected.cardId}`);
    state = engine.applyRoomAction(map, state, action);
  }
  return engine.resolveMothership(map, state, {
    startNextRound: false,
    spawnPolicy({ waiting, candidates }) {
      const choice = decisions.spawnChoices[waiting.id]?.dropPointId;
      return choice == null ? Math.min(...candidates) : Number(choice.slice("DP-C".length)) - 1;
    },
  });
}

function stateView(state) {
  return {
    phase: state.phase,
    energy: state.energy,
    damage: state.damage,
    researchIndex: state.researchIndex,
    excavatorIndex: state.excavatorIndex,
    mothershipRow: state.mothershipRow,
    ships: sortedShips(state.ships),
    waitingShips: sortedShips(state.waitingShips),
  };
}

function audit() {
  const cognitive = runExperiment();
  const formal = formalReplay();
  assert.equal(cognitive.status, "complete");
  assert.deepEqual(stateView(cognitive.cognitiveResult.imaginedWorld), stateView(formal));
  return {
    result: "PASS",
    isolation: "formal engine imported only by post-hoc audit",
    legalPlacements: decisions.placements.length,
    legalRoomActions: decisions.roomActions.length,
    externalRandomObservationsMatched: Object.keys(external.observations).length,
    finalStateMatched: true,
    final: stateView(formal),
  };
}

if (require.main === module) console.log(JSON.stringify(audit(), null, 2));

module.exports = { audit, formalReplay, stateView };
