"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  engine,
  map,
} = require("../ufs_real_state_candidate_exam_v0/scenario-fixtures");
const {
  MISS_PURPLE_ZERO_AT_FIGHTER_ROOM,
  ROUND_ONE_RANDOM_OBSERVATIONS,
  ROUND_ONE_SCRIPT,
} = require("./one-round-fixture");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const { UfsOneRoundImagination } = require("./ufs-one-round-imagination");

function fullAttentionControl(options = {}) {
  return new UfsOneRoundImagination({
    attentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
    ...options,
  });
}

function formalOracle() {
  let state = engine.createGame(map, 1);
  for (const row of ROUND_ONE_SCRIPT.placements) {
    const action = engine.allLegalWorkerPlacements(map, state).find((candidate) => (
      candidate.dieId === row.dieId && candidate.cellId === row.cellId
    ));
    assert.ok(action, `oracle placement must be legal: ${row.dieId}@${row.cellId}`);
    state = engine.applyWorkerPlacement(map, state, action);
  }
  for (const row of ROUND_ONE_SCRIPT.roomActions) {
    let action;
    if (row.type === "resolve_room") {
      action = engine.legalRoomActions(map, state).find((candidate) => (
        candidate.type === row.type && candidate.roomId === row.roomId
      ));
    } else if (row.type === "excavate") {
      action = engine.legalRoomActions(map, state).find((candidate) => candidate.type === row.type);
    } else if (row.type === "skip_worker") {
      action = engine.legalRoomActions(map, state).find((candidate) => (
        candidate.type === row.type && candidate.placementId === row.placementId
      ));
    } else {
      action = engine.legalRoomActions(map, state).find((candidate) => candidate.type === row.type);
    }
    assert.ok(action, `oracle room action must be legal: ${row.type}`);
    state = engine.applyRoomAction(map, state, action);
  }
  return engine.resolveMothership(map, state, {
    startNextRound: false,
    spawnPolicy({ waiting, candidates }) {
      const requested = ROUND_ONE_SCRIPT.spawnChoices[waiting.id];
      return requested == null ? Math.min(...candidates) : Number(requested.slice("DP-C".length)) - 1;
    },
  });
}

function stateView(state) {
  return {
    round: state.round,
    phase: state.phase,
    energy: state.energy,
    damage: state.damage,
    researchIndex: state.researchIndex,
    excavatorIndex: state.excavatorIndex,
    mothershipRow: state.mothershipRow,
    nextWhiteId: state.nextWhiteId,
    outcome: state.outcome,
    dice: state.dice.map((die) => ({ id: die.id, color: die.color, value: die.value, placed: die.placed })),
    placements: state.placements.map((row) => ({
      id: row.id, dieId: row.dieId, dieValue: row.dieValue, cellId: row.cellId,
      roomId: row.roomId, resolved: row.resolved,
    })),
    ships: state.ships.map((ship) => ({ ...ship })).sort((left, right) => left.id.localeCompare(right.id)),
    waitingShips: state.waitingShips.map((ship) => ({ ...ship })).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

test("fixed five-die script imagines one full round to the next-round boundary", () => {
  const initial = engine.createGame(map, 1);
  const before = structuredClone(initial);
  const result = fullAttentionControl().run({
    initialPublicState: initial,
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
    randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
  });
  assert.equal(result.status, "complete");
  assert.equal(result.reason, "one_round_imagined_to_next_round_boundary");
  assert.equal(result.pending, null);
  assert.equal(result.observedWorldUnchanged, true);
  assert.deepEqual(initial, before);
  assert.deepEqual(stateView(result.imaginedWorld), stateView(formalOracle()));
});

test("all cognitive consequences use Q, real GTE trajectory activation, and JSON programs", () => {
  const result = fullAttentionControl().run({
    initialPublicState: engine.createGame(map, 1),
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
    randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
  });
  assert.equal(result.trace.placements.length, 5);
  assert.equal(result.trace.randomBoundaries.length, 1);
  assert.equal(result.trace.roomSteps.length, 6);
  assert.equal(result.trace.mothershipSteps.length, 5);

  for (const step of result.trace.placements) {
    assert.equal(step.decisionOrigin, "fixed_test_script");
    assert.equal(step.cognitiveTrace.placementRules.queries.length, 2);
    assert.ok(step.cognitiveTrace.placementRules.groundings.every((row) => row.programId));
    assert.ok(step.cognitiveTrace.placementRules.activations.every((activation) => (
      activation.candidates.every((candidate) => candidate.matrixKind === "precompiled_real_gte_matrix")
    )));
  }
  const eventSteps = [
    ...result.trace.randomBoundaries,
    ...result.trace.roomSteps.filter((row) => row.cognitiveTrace),
    ...result.trace.mothershipSteps,
  ];
  assert.equal(eventSteps.length, 11);
  for (const step of eventSteps) {
    assert.ok(step.cognitiveTrace.q);
    assert.ok(step.cognitiveTrace.candidates.length > 0);
    assert.equal(step.cognitiveTrace.grounding.programRevision, 1);
    assert.ok(step.cognitiveTrace.grounding.programId);
  }
  assert.ok(result.trace.roomSteps
    .filter((row) => row.action?.type === "resolve_room" && row.stage === "effect")
    .every((row) => row.roomInputOrigin === "remembered_placement_room_patch"));
  assert.deepEqual(
    result.trace.mothershipSteps.filter((row) => row.stage === "spawn")
      .map((row) => [row.shipId, row.cognitiveTrace.eventDetection.qKind, row.chosenDropPointId]),
    [
      ["purple-0", "spawn_priority_empty", "DP-C1"],
      ["white-1", "spawn_priority_farthest", "DP-C4"],
    ],
  );
});

test("a missed fighter target produces a coherent wrong inference that continues through the round", () => {
  const initial = engine.createGame(map, 1);
  const before = structuredClone(initial);
  const result = fullAttentionControl({
    eventPerception: MISS_PURPLE_ZERO_AT_FIGHTER_ROOM,
  }).run({
    initialPublicState: initial,
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
    randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
  });
  const oracle = formalOracle();
  const fighter = result.trace.roomSteps.find((row) => (
    row.stage === "effect" && row.action?.roomId === "A-upper-fighter"
  ));

  assert.equal(result.status, "complete");
  assert.deepEqual(fighter.cognitiveTrace.perception.omittedItemIds, ["ship:purple-0@explosion:E2"]);
  assert.equal(fighter.cognitiveTrace.perception.mode, "injected_single_attention_omission");
  assert.equal(fighter.cognitiveTrace.grounding.programId, "fighter-room-resolution");
  assert.deepEqual(fighter.patch.eligibleShipIds, []);

  const imaginedPurple = result.imaginedWorld.ships.find((ship) => ship.id === "purple-0");
  const actualPurple = oracle.ships.find((ship) => ship.id === "purple-0");
  assert.deepEqual({ column: imaginedPurple.column, row: imaginedPurple.row }, { column: 0, row: 3 });
  assert.deepEqual({ column: actualPurple.column, row: actualPurple.row }, { column: 0, row: 0 });
  assert.notDeepEqual(stateView(result.imaginedWorld), stateView(oracle));

  assert.deepEqual(
    result.trace.mothershipSteps.filter((row) => row.stage === "spawn").map((row) => row.shipId),
    ["white-1"],
  );
  assert.equal(
    result.trace.mothershipSteps.find((row) => row.stage === "spawn")
      .cognitiveTrace.eventDetection.qKind,
    "spawn_priority_farthest",
  );
  assert.equal(result.observedWorldUnchanged, true);
  assert.deepEqual(initial, before);
});

test("random reroll stops without an external observed value and invents nothing", () => {
  const initial = engine.createGame(map, 1);
  const before = structuredClone(initial);
  const result = fullAttentionControl().run({
    initialPublicState: initial,
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
  });
  assert.equal(result.status, "random");
  assert.equal(result.reason, "waiting_for_actual_reroll");
  assert.deepEqual(result.pending, { type: "white_reroll", dieIds: ["r1-white-4"] });
  assert.equal(result.trace.placements.length, 4);
  assert.equal(result.imaginedWorld.dice.find((die) => die.id === "r1-white-4").value, 1);
  assert.deepEqual(initial, before);
});

test("phase changes and skip are visibly controller decisions, not disguised trajectories", () => {
  const result = fullAttentionControl().run({
    initialPublicState: engine.createGame(map, 1),
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
    randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
  });
  assert.deepEqual(
    result.trace.administrativeTransitions.map((row) => [row.from, row.to, row.trajectoryDriven]),
    [
      ["dice", "rooms", false],
      ["rooms", "mothership", false],
      ["mothership", "new_round", false],
    ],
  );
  const skip = result.trace.roomSteps.find((row) => row.action?.type === "skip_worker");
  assert.equal(skip.resumedBy, "fixed_test_choice");
  assert.equal(skip.trajectoryDriven, false);
});

test("one-round cognitive core does not import or call the formal oracle engine", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "ufs-one-round-imagination.js"), "utf8");
  assert.doesNotMatch(source, /standard-engine|scenario-fixtures|applyWorkerPlacement|applyRoomAction|resolveMothership/);
});
