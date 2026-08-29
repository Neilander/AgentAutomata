"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { auditStageRecords } = require("./audit-three-round-gate");

function response(overrides = {}) {
  return {
    status: "choice",
    reason: "waiting_for_die_placement",
    observation: { energy: 2 },
    pending: { type: "place_die" },
    availableOperations: ["place_die"],
    game: { completedRoundCount: 0 },
    ...overrides,
  };
}

function record(sequence, publicResponse, command = "advance") {
  return { sequence: String(sequence).padStart(3, "0"), command, exitCode: 0, public: publicResponse };
}

const safeBoundary = response({
  status: "random",
  reason: "waiting_for_next_round_roll",
  observation: { energy: 1 },
  pending: { type: "next_round_roll", round: 4 },
  availableOperations: ["submit_round_roll"],
  game: { completedRoundCount: 3 },
});

const safeHost = {
  round: 3,
  phase: "new_round",
  energy: 1,
  damage: 2,
  researchIndex: 1,
  excavatorIndex: 2,
  mothershipRow: 3,
  outcome: null,
};

test("three-round audit passes only at a restorable next-round boundary", () => {
  const result = auditStageRecords({
    records: [record(1, response(), "start"), record(2, safeBoundary)],
    expectedRounds: 3,
    hostObservation: safeHost,
  });
  assert.equal(result.stageGatePassed, true);
  assert.deepEqual(result.issues, []);
});

test("three-round audit catches negative energy and an unsafe stopping point", () => {
  const result = auditStageRecords({
    records: [record(1, response({ observation: { energy: -1 } }), "start")],
    expectedRounds: 3,
    hostObservation: { ...safeHost, energy: -1, phase: "rooms" },
  });
  assert.equal(result.stageGatePassed, false);
  assert.ok(result.issues.some((issue) => issue.includes("negative energy")));
  assert.ok(result.issues.some((issue) => issue.includes("safe next-round boundary")));
  assert.ok(result.issues.some((issue) => issue.includes("nonnegative invariant")));
});

test("three-round audit catches contradictory excavation candidates", () => {
  const result = auditStageRecords({
    records: [
      record(1, response(), "start"),
      record(2, response({
        observation: { energy: 0 },
        pending: {
          type: "room_action",
          candidates: {
            excavationEnergyCost: 1,
            excavationPlacementIds: ["p1"],
            unaffordableExcavationPlacementIds: ["p1"],
          },
        },
      })),
      record(3, safeBoundary),
    ],
    expectedRounds: 3,
    hostObservation: safeHost,
  });
  assert.equal(result.stageGatePassed, false);
  assert.ok(result.issues.some((issue) => issue.includes("both affordable and unaffordable")));
  assert.ok(result.issues.some((issue) => issue.includes("below its energy cost")));
});
