"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  evaluateEntityAnchor,
  revalidateNextStep,
  runSequentialRollout,
} = require("./sequential-q-rollout");

const targetAnchor = {
  collection: "ships",
  match: { id: "purple-2", column: 2 },
};

const steps = [
  { id: "research", operation: { type: "place_die", cellId: "A-r2-c2" } },
  { id: "aa", operation: { type: "place_die", cellId: "A-r1-c3" }, anchor: targetAnchor },
];

test("step two is checked against predicted Q1 rather than stale Q0", () => {
  const calls = [];
  const result = runSequentialRollout({
    initialQ: { world: { ships: [{ id: "purple-2", column: 2, row: 0 }] }, epistemic: {} },
    steps,
    imagineStep: ({ step, qBefore }) => {
      calls.push({ stepId: step.id, ships: structuredClone(qBefore.world.ships) });
      return { qAfter: { world: { ships: [] }, epistemic: {} }, evidence: "research_removed_target" };
    },
  });
  assert.equal(result.status, "invalidated");
  assert.equal(result.stoppedBeforeStep, 1);
  assert.equal(result.trace[1].anchor.reason, "matching_entity_absent");
  assert.equal(calls.length, 1);
  assert.deepEqual(result.trace[1].qBefore.world.ships, []);
});

test("a retained target permits the second imagination and receives Q1", () => {
  const calls = [];
  const result = runSequentialRollout({
    initialQ: { world: { ships: [{ id: "purple-2", column: 2, row: 0 }] }, epistemic: {} },
    steps,
    imagineStep: ({ step, qBefore }) => {
      calls.push({ stepId: step.id, ships: structuredClone(qBefore.world.ships) });
      if (step.id === "research") {
        return { qAfter: { world: { ships: [{ id: "purple-2", column: 2, row: 0 }], marker: "Q1" }, epistemic: {} } };
      }
      return { qAfter: { world: { ships: [{ id: "purple-2", column: 2, row: 4 }], marker: "Q2" }, epistemic: {} } };
    },
  });
  assert.equal(result.status, "complete");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].ships[0].row, 0);
  assert.equal(result.trace[1].qBefore.world.marker, "Q1");
  assert.equal(result.finalQ.world.marker, "Q2");
});

test("probabilistic omission pauses the anchor and forbids a deterministic benefit claim", () => {
  const actualQ = {
    world: { ships: [] },
    epistemic: { omittedCollections: ["ships"] },
  };
  assert.equal(evaluateEntityAnchor(actualQ, targetAnchor).status, "uncertain");
  const check = revalidateNextStep({ actualQ, step: steps[1] });
  assert.equal(check.mayExecute, false);
  assert.equal(check.mayClaimDeterministicBenefit, false);
  assert.equal(check.requiresReplan, true);
});
