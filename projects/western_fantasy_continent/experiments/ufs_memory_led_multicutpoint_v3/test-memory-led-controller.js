"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const {
  UfsFullGameAttentionSession,
} = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const {
  MemoryLedMulticutpointController,
  groundMemoryLedAnchor,
} = require("./memory-led-multicutpoint-controller");

const controller = new MemoryLedMulticutpointController();

function start() {
  const session = new UfsFullGameAttentionSession({ publicMap });
  const response = session.start({ initialPublicState, attentionSeed: 2026090104 });
  return { session, response };
}

test("public placement contract exposes only die and position bindings", () => {
  const { response } = start();
  const contract = response.operationContracts.find((row) => row.type === "place_die");
  assert.deepEqual(contract.requiredFields, ["type", "dieId", "cellId"]);
  assert.deepEqual(Object.keys(contract.fields), ["type", "dieId", "cellId"]);
  assert.doesNotMatch(JSON.stringify(contract), /requiredDiceCount|minimumDice|completeRoom|allCells/iu);
  assert.doesNotMatch(
    JSON.stringify(response.mapView.rooms),
    /requiredDiceCount|minimumDice|requiresAllCells|mustFillAll|completeRoom/iu,
  );
});

test("real Q-after and Q-before routes awaken result and all-cells memories", () => {
  const { response } = start();
  const intent = require("../ufs_live_ai_automatic_multicutpoint_three_round_v2/automatic-multicutpoint-controller")
    .macroIntent(response);
  const recalled = controller.recall.recall({ response, intent });
  assert.ok(recalled.qAfter.find((row) => row.role === "energy").accepted.some((row) => (
    row.sourceTrajectoryId === "read-rule-energy-room-to-energy-gain"
  )));
  assert.ok(recalled.qBefore.accepted.some((row) => (
    row.sourceTrajectoryId === "read-rule-multi-room-placement-to-completeness"
  )));
});

test("real two-cell room becomes two primitive placements because memory says all cells", () => {
  const { response } = start();
  const candidates = controller.generateCandidates(response);
  const energy = candidates.find((row) => row.id.includes("energy"));
  assert.ok(energy);
  assert.equal(energy.steps.length, 2);
  assert.equal(new Set(energy.steps.map((row) => row.operation.cellId)).size, 2);
  assert.ok(energy.steps.every((row) => (
    JSON.stringify(Object.keys(row.operation)) === JSON.stringify(["type", "dieId", "cellId"])
  )));
  assert.deepEqual(energy.triggeredBy, ["q_after", "q_before"]);
});

test("the same recalled all-cells relation grounds to three steps for a three-cell room", () => {
  const { response } = start();
  const synthetic = structuredClone(response);
  const room = synthetic.mapView.rooms.find((row) => row.id === "A-upper-energy");
  room.cellIds.push("synthetic-energy-cell-3");
  synthetic.mapView.baseCells.push({
    id: "synthetic-energy-cell-3",
    roomId: room.id,
    column: 2,
    unlockIndex: 0,
  });
  const recalled = controller.recall.recall({ response: synthetic, intent: {
    priorities: ["energy"],
  } });
  const resultMemory = recalled.qAfter[0].accepted[0];
  const grounded = groundMemoryLedAnchor({ response: synthetic, resultMemory, recall: recalled });
  assert.equal(grounded.status, "grounded");
  assert.equal(grounded.steps.length, 3);
  assert.deepEqual(grounded.steps.map((row) => row.operation.cellId).sort(), [
    "A-r2-c4", "A-r2-c5", "synthetic-energy-cell-3",
  ].sort());
});

test("without the Q-before completion memory a multicell result is not grounded", () => {
  const { response } = start();
  const recalled = controller.recall.recall({ response, intent: { priorities: ["energy"] } });
  const resultMemory = recalled.qAfter[0].accepted[0];
  const withoutCompletion = structuredClone(recalled);
  withoutCompletion.qBefore.accepted = [];
  const grounded = groundMemoryLedAnchor({
    response, resultMemory, recall: withoutCompletion,
  });
  assert.equal(grounded.status, "not_grounded");
  assert.equal(grounded.reason, "missing_recalled_multicell_completion_relation");
});

test("the recalled two-step candidate is automatically imagined as incomplete then complete", () => {
  const { session, response } = start();
  const energy = controller.generateCandidates(response).find((row) => row.id.includes("energy"));
  const imagined = session.imagineSequentialPlan({ steps: energy.steps });
  assert.equal(imagined.status, "complete");
  assert.equal(imagined.trace.length, 2);
  const first = imagined.trace[0].qAfter.trajectoryPredictions.find((row) => (
    row.trajectoryId === "read-rule-multi-room-placement-to-completeness"
  ));
  const second = imagined.trace[1].qAfter.trajectoryPredictions.find((row) => (
    row.trajectoryId === "read-rule-multi-room-placement-to-completeness"
  ));
  assert.equal(first.patch.complete, false);
  assert.equal(second.patch.complete, true);
});

test("memory-led controller source contains no room-type dice-count special case", () => {
  const source = fs.readFileSync(path.join(__dirname, "memory-led-multicutpoint-controller.js"), "utf8");
  assert.doesNotMatch(source, /type\s*===\s*["']energy["']/u);
  assert.doesNotMatch(source, /Math\.min\(2/u);
  assert.doesNotMatch(source, /requiredDiceCount|minimumDice/u);
});
