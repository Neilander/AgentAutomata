"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SLOT_KEYS,
  assertFiveSlotQ,
  MatrixTrajectoryMemory,
} = require("./five-slot-activation");
const {
  ImaginationPipeline,
  relationCheck,
  validateTrajectoryContracts,
} = require("./imagination-pipeline");
const {
  qFor,
  TRAJECTORIES,
  createScenario,
} = require("./trajectory-fixtures");

function objectById(world, id) {
  return world.objects.find((object) => object.id === id);
}

function runScenario(options = {}, runOptions = {}) {
  const scenario = createScenario(options);
  const pipeline = new ImaginationPipeline();
  const before = structuredClone(scenario.world);
  const result = pipeline.run({
    ...scenario,
    perceptionBudget: runOptions.perceptionBudget ?? 40,
    imaginationBudget: runOptions.imaginationBudget ?? 20,
  });
  return { scenario, before, result };
}

test("five-slot contract is strict and matrix activation returns the matching trajectory", () => {
  const q = qFor("landed_city");
  assert.deepEqual(Object.keys(q), SLOT_KEYS);
  assert.doesNotThrow(() => assertFiveSlotQ(q));
  assert.throws(
    () => assertFiveSlotQ({ ...q, hidden_answer: "no" }),
    /non-five-slot fields/,
  );
  const memory = new MatrixTrajectoryMemory(TRAJECTORIES);
  const candidates = memory.query(q, { topK: 3 });
  assert.equal(candidates[0].trajectory.id, "RULE-LANDED-CITY-DAMAGE");
  assert.ok(candidates[0].activation > 0.99);
  assert.doesNotThrow(() => validateTrajectoryContracts(TRAJECTORIES));
  assert.throws(
    () => validateTrajectoryContracts([{ ...TRAJECTORIES[0], sourceQuote: "" }]),
    /sourceQuote/,
  );
});

test("activation remains primary while the relationship gate rejects the passing-arrow distractor", () => {
  const memory = new MatrixTrajectoryMemory(TRAJECTORIES);
  const query = {
    q: qFor("landed_arrow"),
    metadata: {
      kind: "landed_arrow",
      tileKind: "arrow",
      objectId: "ship-a",
    },
  };
  const candidates = memory.query(query.q, { topK: 4 });
  const distractor = candidates.find(
    (candidate) => candidate.trajectory.id === "RULE-000-PASSING-ARROW-DOES-NOT-SHIFT",
  );
  const actual = candidates.find(
    (candidate) => candidate.trajectory.id === "RULE-LANDED-ARROW-SHIFT",
  );
  assert.ok(distractor.activation > 0.99);
  assert.ok(actual.activation > 0.99);
  assert.equal(relationCheck(distractor.trajectory, query).accepted, false);
  assert.equal(relationCheck(actual.trajectory, query).accepted, true);
});

test("complete pipeline imagines place, descent, arrow shift, and city damage", () => {
  const { scenario, before, result } = runScenario();
  assert.equal(result.status, "complete");
  assert.equal(result.observedWorldUnchanged, true);
  assert.deepEqual(scenario.world, before);
  assert.deepEqual(objectById(result.imaginedWorld, "ship-a"), {
    id: "ship-a",
    column: "C",
    row: 4,
    frozen: false,
    city_distance: 2,
  });
  assert.equal(objectById(result.imaginedWorld, "ship-frozen").row, 6);
  assert.equal(objectById(result.imaginedWorld, "ship-other").row, 1);
  assert.equal(result.imaginedWorld.city.health, 2);
  assert.deepEqual(
    result.trace.groundings.map((row) => row.trajectoryId),
    [
      "RULE-PLACE-DIE-COLUMN-MOVE",
      "RULE-LANDED-ARROW-SHIFT",
      "RULE-LANDED-CITY-DAMAGE",
    ],
  );
  assert.ok(result.trace.relationRejections.some(
    (row) => row.trajectoryId === "RULE-000-PASSING-ARROW-DOES-NOT-SHIFT",
  ));
  assert.equal(result.trace.initialQueryCount, 2);
  const selectedIds = new Set(result.trace.attention.selected.map((row) => row.id));
  for (const grounding of result.trace.groundings) {
    for (const read of grounding.reads) assert.ok(selectedIds.has(read), `unnoticed read: ${read}`);
  }
});

test("normal endpoint completes without inventing another consequence", () => {
  const { result } = runScenario({ endpointKind: "normal" });
  assert.equal(result.status, "complete");
  assert.equal(objectById(result.imaginedWorld, "ship-a").column, "B");
  assert.equal(objectById(result.imaginedWorld, "ship-a").row, 4);
  assert.equal(result.imaginedWorld.city.health, 3);
  assert.deepEqual(
    result.trace.groundings.map((row) => row.trajectoryId),
    ["RULE-PLACE-DIE-COLUMN-MOVE", "RULE-LANDED-NORMAL-COMPLETE"],
  );
});

test("random and choice endpoints stop at their explicit boundaries", () => {
  const random = runScenario({ endpointKind: "random" }).result;
  const choice = runScenario({ endpointKind: "choice" }).result;
  assert.equal(random.status, "random");
  assert.equal(choice.status, "choice");
  assert.equal(random.imaginedWorld.city.health, 3);
  assert.equal(choice.imaginedWorld.city.health, 3);
});

test("unfamiliar endpoint becomes unknown instead of being completed as safe", () => {
  const { result } = runScenario({ endpointKind: "mystery" });
  assert.equal(result.status, "unknown");
  assert.match(result.reason, /no_activated_trajectory/);
  assert.equal(result.imaginedWorld.city.health, 3);
});

test("imagination attention exhaustion prevents an unthought effect from committing", () => {
  const { result } = runScenario({}, { imaginationBudget: 0.5 });
  assert.equal(result.status, "attention_stop");
  assert.equal(result.reason, "imagination_attention_exhausted");
  assert.equal(objectById(result.imaginedWorld, "ship-a").row, 2);
  assert.equal(result.trace.groundings[0].committed, false);
});

test("limited perception blocks a grounding read instead of leaking an unnoticed fact", () => {
  const { result } = runScenario({}, { perceptionBudget: 18 });
  assert.ok(["attention_stop", "complete"].includes(result.status));
  assert.ok(result.trace.boundaries.some((boundary) => (
    boundary.reason === "grounding_required_unnoticed_fact"
    || boundary.reason === "unnoticed_endpoint_effect_omitted_from_imagination"
    || boundary.reason === "no_complete_initial_q"
  )));
  assert.equal(result.imaginedWorld.city.health, 3);
});

test("an unnoticed landing endpoint becomes a possible wrong inference instead of cancelling movement", () => {
  const scenario = createScenario({ endpointKind: "arrow", amount: 2 });
  scenario.action.cellId = "synthetic";
  scenario.action.column = "C2";
  for (const object of scenario.world.objects) {
    object.column = object.column === "B" ? "C2" : "C3";
  }
  for (const tile of scenario.world.tiles) {
    tile.column = tile.column === "B" ? "C2" : "C3";
    if (tile.targetColumn) tile.targetColumn = tile.targetColumn === "B" ? "C2" : "C3";
  }
  const noticedItemIds = ["die:die-3", "base_cell:synthetic", "ship:ship-a"];
  const result = new ImaginationPipeline().run({
    ...scenario,
    externalAttention: {
      noticedItemIds,
      spaceItemCount: 153,
      capacity: 41,
      omittedItemIds: ["sky_cell:4:1"],
      carryoverAppliedItemIds: [],
      traceBefore: [],
      traceAfter: [],
    },
  });

  assert.equal(result.status, "complete");
  assert.equal(result.reason, "unnoticed_endpoint_effect_omitted_from_imagination");
  assert.equal(objectById(result.imaginedWorld, "ship-a").row, 4);
  assert.equal(objectById(result.imaginedWorld, "ship-a").column, "C2");
  const boundary = result.trace.boundaries.find(
    (row) => row.reason === "unnoticed_endpoint_effect_omitted_from_imagination",
  );
  assert.equal(boundary.inferenceQuality, "attention_limited_possible_error");
  assert.equal(boundary.assumption, "no_additional_landing_effect_was_imagined");
});

test("an empty activation port yields unknown and leaves imagined state unchanged", () => {
  const scenario = createScenario();
  const pipeline = new ImaginationPipeline({ memory: { query: () => [] } });
  const result = pipeline.run({
    ...scenario,
    perceptionBudget: 40,
    imaginationBudget: 20,
  });
  assert.equal(result.status, "unknown");
  assert.deepEqual(result.imaginedWorld, scenario.world);
  assert.equal(result.trace.groundings.length, 0);
});

test("a self-looping imagined endpoint is stopped by the repetition guard", () => {
  const scenario = createScenario();
  const arrow = scenario.world.tiles.find((tile) => tile.column === "B" && tile.row === 4);
  arrow.targetColumn = "B";
  arrow.targetRow = 4;
  const pipeline = new ImaginationPipeline();
  const result = pipeline.run({
    ...scenario,
    perceptionBudget: 40,
    imaginationBudget: 20,
  });
  assert.equal(result.status, "unknown");
  assert.ok(result.trace.boundaries.some(
    (boundary) => boundary.reason === "repeated_imagined_query_guard",
  ));
});
