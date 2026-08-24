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
  BUILDERS,
  buildPublicScenario,
} = require("./experiment-fixtures");
const {
  resolveSelectedAction,
} = require("./selection-adapter");
const {
  UfsFirstActionImagination,
} = require("./ufs-first-action-imagination");
const {
  PLACEMENT_TRAJECTORIES,
  PlacementRuleImagination,
  qFor,
} = require("./placement-rule-imagination");
const {
  MatrixTrajectoryMemory,
} = require("../imagination_pipeline_v0/five-slot-activation");
const {
  generatedBundle,
  validateGeneratedBundle,
} = require("./rule_reading_trajectory_v0/compiled-trajectory-loader");
const {
  PrecompiledGteTrajectoryMemory,
} = require("./rule_reading_trajectory_v0/precompiled-gte-memory");

const submissionPath = path.resolve(
  __dirname,
  "../ufs_real_state_candidate_exam_v0/submissions/agent_01.md",
);
const submissionText = fs.readFileSync(submissionPath, "utf8");

const EXPECTED = Object.freeze({
  A: {
    actionId: "r1-gray-2@A-r2-c5",
    descent: 4,
    movedShip: ["purple-4", 4],
    roomId: "A-upper-energy",
    roomComplete: false,
    roomValue: null,
    movementRuleId: "die_moves_same_column_ships",
    roomRuleId: "multi_room_requires_all_spaces",
    movementProgramId: "ordinary-descent-v1",
    roomProgramId: "multi-room-completeness-v1",
    remaining: 2,
  },
  B: {
    actionId: "r2-gray-0@A-r2-c1",
    descent: 5,
    movedShip: ["purple-0", 5],
    roomId: "A-upper-fighter",
    roomComplete: true,
    roomValue: 4,
    movementRuleId: "die_moves_same_column_ships",
    roomRuleId: "room_value",
    movementProgramId: "ordinary-descent-v1",
    roomProgramId: "single-room-value-v1",
    remaining: 4,
  },
  C: {
    actionId: "r2-gray-2@A-r1-c3",
    descent: 0,
    movedShip: ["purple-2", 4],
    roomId: "A-aa-c3",
    roomComplete: true,
    roomValue: null,
    movementRuleId: "aa_room",
    roomRuleId: "aa_room",
    movementProgramId: "aa-descent-v1",
    roomProgramId: "aa-room-no-output-v1",
    remaining: 2,
  },
});

function sortedShips(state) {
  return state.ships
    .map((ship) => ({ id: ship.id, column: ship.column, row: ship.row }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

for (const label of Object.keys(EXPECTED)) {
  test(`scenario ${label}: selected first action imagines automatic effects then stops at choice`, () => {
    const expected = EXPECTED[label];
    const scenario = buildPublicScenario(label);
    const before = structuredClone(scenario.publicState);
    const selection = resolveSelectedAction({
      submissionText,
      scenarioLabel: label,
      publicState: scenario.publicState,
    });
    const result = new UfsFirstActionImagination().run({
      ...scenario,
      selectedAction: selection.action,
    });

    assert.equal(`${selection.action.dieId}@${selection.action.cellId}`, expected.actionId);
    assert.equal(result.status, "choice");
    assert.equal(result.reason, "next_player_decision");
    assert.equal(result.stoppedBeforeSecondAction, true);
    assert.equal(result.nextAction, null);
    assert.equal(result.observedWorldUnchanged, true);
    assert.deepEqual(scenario.publicState, before);
    assert.equal(result.imaginedConsequences.movement.amount, expected.descent);
    assert.equal(
      result.imaginedConsequences.movement.sourceRuleId,
      expected.movementRuleId,
    );
    assert.equal(result.imaginedConsequences.skyStatus, "complete");
    assert.equal(result.imaginedConsequences.room.roomId, expected.roomId);
    assert.equal(result.imaginedConsequences.room.complete, expected.roomComplete);
    assert.equal(result.imaginedConsequences.room.roomValue, expected.roomValue);
    assert.equal(result.imaginedConsequences.room.sourceRuleId, expected.roomRuleId);
    assert.equal(result.trace.placementRules.queries.length, 2);
    assert.equal(result.trace.placementRules.groundings.length, 2);
    assert.ok(result.trace.placementRules.groundings.every((row) => row.committed));
    assert.ok(result.trace.placementRules.groundings.every((row) => row.reads.length > 0));
    assert.ok(result.trace.placementRules.groundings.every(
      (row) => row.generationOrigin === "ai_rule_reading",
    ));
    assert.ok(result.trace.placementRules.groundings.every(
      (row) => row.currentQ && row.awakenedFollowingQ,
    ));
    assert.deepEqual(
      result.trace.placementRules.groundings.map((row) => row.programId),
      [expected.movementProgramId, expected.roomProgramId],
    );
    assert.ok(result.trace.placementRules.groundings.every(
      (row) => row.programRevision === 1
        && row.programProvenance.author === "isolated_agent_01",
    ));
    assert.ok(result.trace.placementRules.activations.every((activation) => (
      activation.candidates.every((candidate) => (
        candidate.matrixKind === "precompiled_real_gte_matrix"
      ))
    )));
    assert.equal(result.remainingDice.length, expected.remaining);
    const moved = result.imaginedState.ships.find((ship) => ship.id === expected.movedShip[0]);
    assert.equal(moved.row, expected.movedShip[1]);

    const realState = BUILDERS[label]();
    const engineAction = engine.allLegalWorkerPlacements(map, realState).find((candidate) => (
      candidate.dieId === selection.action.dieId && candidate.cellId === selection.action.cellId
    ));
    assert.ok(engineAction, "formal engine oracle must agree that selection is legal");
    const actual = engine.applyWorkerPlacement(map, realState, engineAction);
    assert.deepEqual(sortedShips(result.imaginedState), sortedShips(actual));
    assert.deepEqual(
      result.imaginedState.dice.map((die) => [die.id, die.placed]),
      actual.dice.map((die) => [die.id, die.placed]),
    );
    assert.deepEqual(result.imaginedState.placements, actual.placements);
    for (const field of [
      "phase",
      "energy",
      "damage",
      "researchIndex",
      "excavatorIndex",
      "mothershipRow",
    ]) {
      assert.equal(result.imaginedState[field], actual[field], `public state mismatch: ${field}`);
    }
  });
}

test("core imagination module has no formal-engine dependency", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "ufs-first-action-imagination.js"), "utf8");
  assert.doesNotMatch(source, /standard-engine|scenario-fixtures|applyWorkerPlacement/);
  assert.doesNotMatch(source, /projectRoom/);
  const placementSource = fs.readFileSync(
    path.resolve(__dirname, "placement-rule-imagination.js"),
    "utf8",
  );
  assert.doesNotMatch(placementSource, /standard-engine|scenario-fixtures|applyWorkerPlacement/);
  assert.doesNotMatch(
    placementSource,
    /ordinary_descent|aa_descent|inspect_multi_room|inspect_single_room|room_has_no_phase_output/,
  );
  assert.match(placementSource, /JsonCognitiveProgramInterpreter|selectProgram/);
});

test("placement memory is loaded from a frozen AI current-to-following trajectory set", () => {
  const validation = validateGeneratedBundle();
  assert.equal(validation.sourceCount, 24);
  assert.equal(validation.edgeCount, 25);
  assert.equal(validation.firstActionEdgeCount, 5);
  assert.equal(PLACEMENT_TRAJECTORIES.length, 5);
  assert.ok(PLACEMENT_TRAJECTORIES.every(
    (trajectory) => trajectory.generationOrigin === "ai_rule_reading",
  ));
  assert.ok(PLACEMENT_TRAJECTORIES.every(
    (trajectory) => trajectory.triggerQ && trajectory.followingQ,
  ));
  const generatedIds = new Set(generatedBundle.edges.map((edge) => edge.edgeId));
  assert.ok(PLACEMENT_TRAJECTORIES.every((trajectory) => generatedIds.has(trajectory.id)));
});

test("repeated validation strengthens one GTE connection without duplicating its matrix row", () => {
  const memory = new PrecompiledGteTrajectoryMemory(PLACEMENT_TRAJECTORIES);
  const edgeId = "read-rule-place-die-to-same-column-descent";
  const beforeRows = memory.exportLearningOverlay().records;
  const before = memory.query(qFor("placement_movement"), { topK: 5 })
    .find((candidate) => candidate.trajectory.id === edgeId);
  assert.ok(before);

  const reinforced = memory.reinforce(edgeId, { amount: 2 });
  const afterRows = memory.exportLearningOverlay().records;
  const after = memory.query(qFor("placement_movement"), { topK: 5 })
    .find((candidate) => candidate.trajectory.id === edgeId);

  assert.equal(afterRows.length, beforeRows.length);
  assert.equal(reinforced.support, before.support + 2);
  assert.equal(reinforced.observations, before.observations + 1);
  assert.equal(after.support, before.support + 2);
  assert.equal(after.observations, before.observations + 1);
  assert.ok(Math.abs(after.activation - before.activation) < 1e-7);
});

test("without noticed room facts, room consequence is not produced", () => {
  const scenario = buildPublicScenario("A");
  const selection = resolveSelectedAction({
    submissionText,
    scenarioLabel: "A",
    publicState: scenario.publicState,
  });
  const result = new UfsFirstActionImagination().run({
    ...scenario,
    selectedAction: selection.action,
    placementPerceptionBudget: 4,
  });
  assert.equal(result.status, "attention_stop");
  assert.equal(result.reason, "no_complete_placement_q");
  assert.equal(result.imaginedConsequences.room, null);
  assert.equal(result.trace.sky, null);
  assert.deepEqual(result.imaginedState, scenario.publicState);
});

test("without placement-rule memory, adapter cannot calculate room truth directly", () => {
  const scenario = buildPublicScenario("A");
  const selection = resolveSelectedAction({
    submissionText,
    scenarioLabel: "A",
    publicState: scenario.publicState,
  });
  const result = new UfsFirstActionImagination({
    placementRuleImagination: new PlacementRuleImagination({
      memory: { query: () => [] },
    }),
  }).run({
    ...scenario,
    selectedAction: selection.action,
  });
  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "no_rule_for:placement_movement");
  assert.equal(result.imaginedConsequences.movement, null);
  assert.equal(result.imaginedConsequences.room, null);
  assert.equal(result.trace.sky, null);
  assert.deepEqual(result.imaginedState, scenario.publicState);
});

test("movement memory alone cannot make the adapter fill in a room answer", () => {
  const scenario = buildPublicScenario("A");
  const selection = resolveSelectedAction({
    submissionText,
    scenarioLabel: "A",
    publicState: scenario.publicState,
  });
  const movementMemory = new MatrixTrajectoryMemory(
    PLACEMENT_TRAJECTORIES.filter((trajectory) => (
      trajectory.relation.qKind === "placement_movement"
    )),
  );
  const result = new UfsFirstActionImagination({
    placementRuleImagination: new PlacementRuleImagination({
      memory: movementMemory,
    }),
  }).run({
    ...scenario,
    selectedAction: selection.action,
  });
  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "no_rule_for:placement_room_state");
  assert.equal(result.imaginedConsequences.movement.amount, 4);
  assert.equal(result.imaginedConsequences.room, null);
  assert.equal(result.trace.sky, null);
  assert.deepEqual(result.imaginedState, scenario.publicState);
});

test("a low-activation rule cannot pass only because its relation metadata matches", () => {
  const scenario = buildPublicScenario("A");
  const selection = resolveSelectedAction({
    submissionText,
    scenarioLabel: "A",
    publicState: scenario.publicState,
  });
  const lowActivationCandidate = PLACEMENT_TRAJECTORIES.find((trajectory) => (
    trajectory.id === "read-rule-place-die-to-same-column-descent"
  ));
  const result = new UfsFirstActionImagination({
    placementRuleImagination: new PlacementRuleImagination({
      memory: {
        query: () => [{ trajectory: lowActivationCandidate, activation: 0.1 }],
      },
    }),
  }).run({
    ...scenario,
    selectedAction: selection.action,
  });
  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "no_rule_for:placement_movement");
  assert.equal(result.imaginedConsequences.movement, null);
  assert.equal(result.imaginedConsequences.room, null);
  assert.equal(result.trace.sky, null);
});
