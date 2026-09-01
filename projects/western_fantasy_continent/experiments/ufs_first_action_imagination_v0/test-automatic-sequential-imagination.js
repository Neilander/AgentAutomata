"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { UfsFullGameAttentionSession } = require("./ufs-full-game-attention-session");

const PREFIX = [
  { type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c4" },
  { type: "place_die", dieId: "r1-gray-1", cellId: "A-r2-c5" },
  { type: "place_die", dieId: "r1-white-3", cellId: "A-r2-c1" },
  {
    type: "submit_random_observation",
    values: { "r1-gray-2": 5, "r1-white-4": 6 },
  },
];

const PURPLE_2 = {
  collection: "ships",
  match: { id: "purple-2", column: 2 },
};

function atPostRerollCutpoint() {
  const session = new UfsFullGameAttentionSession({ publicMap });
  session.start({ initialPublicState, attentionSeed: 2026082504 });
  for (const operation of PREFIX) session.advance(operation);
  return session;
}

function atPreRerollCutpoint() {
  const session = new UfsFullGameAttentionSession({ publicMap });
  session.start({ initialPublicState, attentionSeed: 2026082504 });
  for (const operation of PREFIX.slice(0, 2)) session.advance(operation);
  return session;
}

test("automatic Q chaining pauses explicitly at a white-die reroll boundary", () => {
  const session = atPreRerollCutpoint();
  const before = session.exportCheckpoint();
  const result = session.imagineSequentialPlan({
    steps: [
      {
        id: "place-white",
        operation: { type: "place_die", dieId: "r1-white-3", cellId: "A-r2-c1" },
      },
      {
        id: "must-not-run-before-reroll",
        operation: { type: "place_die", dieId: "r1-gray-2", cellId: "A-r1-c3" },
      },
    ],
  });

  assert.equal(result.status, "paused_random");
  assert.equal(result.reason, "waiting_for_actual_reroll");
  assert.equal(result.stoppedAfterStep, 0);
  assert.equal(result.stoppedBeforeStep, 1);
  assert.equal(result.deterministicBenefitClaimAllowed, false);
  assert.deepEqual(result.boundary.pending, {
    type: "white_reroll",
    afterDieId: "r1-white-3",
    dieIds: ["r1-gray-2", "r1-white-4"],
  });
  assert.equal(result.trace.length, 1);
  assert.deepEqual(result.trace[0].qAfter.availableOperations, ["submit_random_observation"]);
  assert.ok(result.trace[0].qAfter.trajectoryPredictions.some((row) => (
    row.trajectoryId === "read-rule-place-white-die-to-reroll"
  )));
  assert.deepEqual(session.exportCheckpoint(), before, "random-boundary imagination must remain read-only");
});

test("a sequence ending at reroll is paused rather than incorrectly complete", () => {
  const session = atPreRerollCutpoint();
  const result = session.imagineSequentialPlan({
    steps: [{
      id: "place-white",
      operation: { type: "place_die", dieId: "r1-white-3", cellId: "A-r2-c1" },
    }],
  });
  assert.equal(result.status, "paused_random");
  assert.equal(result.stoppedAfterStep, 0);
  assert.equal(result.stoppedBeforeStep, null);
  assert.equal(result.deterministicBenefitClaimAllowed, false);
});

test("planning rejects a pre-authored random observation", () => {
  const session = atPreRerollCutpoint();
  assert.throws(() => session.imagineSequentialPlan({
    steps: [{
      id: "invent-reroll",
      operation: {
        type: "submit_random_observation",
        values: { "r1-gray-2": 5, "r1-white-4": 6 },
      },
    }],
  }), /cannot supply random observations/u);
});

test("automatic Q chaining invalidates stale AA after research removes its target", () => {
  const session = atPostRerollCutpoint();
  const before = session.exportCheckpoint();
  const result = session.imagineSequentialPlan({
    steps: [
      {
        id: "research-first",
        operation: { type: "place_die", dieId: "r1-gray-2", cellId: "A-r2-c2" },
        observeAfter: [
          { collection: "ships", match: { id: "purple-2" }, fields: ["id", "column", "row"] },
          { collection: "waitingShips", match: { id: "purple-2" }, fields: ["id", "color"] },
        ],
      },
      {
        id: "aa-second",
        operation: { type: "place_die", dieId: "r1-white-4", cellId: "A-r1-c3" },
        anchor: PURPLE_2,
      },
    ],
  });

  assert.equal(result.status, "invalidated");
  assert.equal(result.stoppedBeforeStep, 1);
  assert.equal(result.trace[1].anchor.reason, "matching_entity_absent");
  assert.equal(result.trace[1].imagined, false);
  assert.equal(result.trace[0].observationsAfter[0].status, "absent");
  assert.equal(result.trace[0].observationsAfter[1].status, "present");
  assert.ok(result.trace[0].qAfter.trajectoryPredictions.some((row) => (
    row.trajectoryId === "read-rule-mothership-space-to-mothership-descent"
  )));
  assert.equal(result.formalOracleUsed, false);
  assert.deepEqual(session.exportCheckpoint(), before, "planning must not mutate the live session");

  session.advance({ type: "place_die", dieId: "r1-gray-2", cellId: "A-r2-c2" });
  const formal = session.inspectHostState().observation;
  assert.equal(formal.ships.some((ship) => ship.id === "purple-2"), false);
  assert.equal(formal.waitingShips.some((ship) => ship.id === "purple-2"), true);
  assert.equal(formal.mothershipRow, 0);
});

test("automatic Q chaining preserves the target when AA is imagined first", () => {
  const session = atPostRerollCutpoint();
  const result = session.imagineSequentialPlan({
    steps: [
      {
        id: "aa-first",
        operation: { type: "place_die", dieId: "r1-gray-2", cellId: "A-r1-c3" },
        anchor: PURPLE_2,
        observeAfter: [
          { collection: "ships", match: { id: "purple-2" }, fields: ["id", "column", "row"] },
        ],
      },
      {
        id: "research-second",
        operation: { type: "place_die", dieId: "r1-white-4", cellId: "A-r2-c2" },
        anchor: { collection: "dice", match: { id: "r1-white-4", placed: false } },
      },
    ],
  });

  assert.equal(result.status, "complete");
  assert.equal(result.deterministicBenefitClaimAllowed, true);
  assert.equal(result.automaticTrajectoryCount, 4);
  assert.deepEqual(result.trace[0].observationsAfter[0].value, {
    id: "purple-2", column: 2, row: 4,
  });
  assert.ok(result.trace[1].qBefore.inheritedTrajectoryPredictions.some((row) => (
    row.trajectoryId === "read-rule-aa-placement-to-reduced-descent"
  )));
  assert.ok(result.trace[1].qAfter.trajectoryPredictions.some((row) => (
    row.trajectoryId === "read-rule-place-die-to-same-column-descent"
  )));

  session.advance({ type: "place_die", dieId: "r1-gray-2", cellId: "A-r1-c3" });
  const formalTarget = session.inspectHostState().observation.ships
    .find((ship) => ship.id === "purple-2");
  assert.deepEqual(formalTarget, { id: "purple-2", color: "purple", column: 2, row: 4 });
});
