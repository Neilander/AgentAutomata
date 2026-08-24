"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDefaultLibrary } = require("./default-library");
const { JsonCognitiveProgramInterpreter } = require("./json-program-interpreter");
const { BATCHES, auditBatch } = require("./install-round2-submissions");

function attention(values) {
  return {
    read(readPath) {
      if (!Object.prototype.hasOwnProperty.call(values, readPath)) {
        throw new Error(`hidden state did not expose attention path: ${readPath}`);
      }
      return structuredClone(values[readPath]);
    },
  };
}

function execute(programId, values) {
  const row = loadDefaultLibrary().get(programId);
  assert.ok(row, `installed program missing: ${programId}`);
  return new JsonCognitiveProgramInterpreter().execute(row.program, { attention: attention(values) });
}

test("all three blind submissions pass audits and coexist with the later tunnel gap fix", () => {
  for (const batch of BATCHES) assert.doesNotThrow(() => auditBatch(batch));
  assert.equal(BATCHES.flatMap((row) => row.submission.programs).length, 20);
  const library = loadDefaultLibrary();
  assert.equal(library.list().length, 26);
  const tunnel = library.get("tunnel-room-no-output-v1");
  assert.equal(tunnel.provenance.author, "root_gap_fix");
  assert.equal(tunnel.provenance.triggeringExperiment, "ufs_live_agent_playtest_v1");
});

test("sky programs bind reroll, final arrow, mothership space, and city contact", () => {
  assert.deepEqual(execute("white-die-reroll", {
    "dice.ids": ["white", "grey", "black"],
    "dice:white.placed": true, "dice:grey.placed": false, "dice:black.placed": false,
  }).patch, {
    kind: "randomize_unplaced_dice", dieIds: ["grey", "black"], field: "value",
    valueState: "random_unknown", stopKind: "random", stopReason: "waiting_for_actual_reroll",
  });
  assert.deepEqual(execute("arrow-final-landing", {
    "event.shipId": "purple-1", "tile.arrow.targetColumn": "C4", "tile.arrow.targetRow": 7,
  }).patch, { kind: "move_ship", shipId: "purple-1", column: "C4", row: 7, stopKind: "automatic" });
  assert.deepEqual(execute("mothership-down-space", { "mothership.row": 3 }).patch,
    { kind: "move_mothership", fromRow: 3, toRow: 4, delta: 1, stopKind: "automatic" });
  assert.deepEqual(execute("city-contact", { "event.shipId": "white-2" }).patch,
    { kind: "city_contact", shipId: "white-2", damageDelta: 1, shipDestination: "mothership_queue", stopKind: "automatic" });
});

test("room programs bind payment, energy, fighter, and research choices", () => {
  assert.deepEqual(execute("room-energy-payment", { "room.energyCost": 3, "player.energy": 2 }).patch,
    { kind: "room_payment_choice", energyCost: 3, canPay: false, stopKind: "choice" });
  assert.deepEqual(execute("energy-room-resolution", {
    "room.value": 4, "player.energy": 8, "player.energyCap": 10,
  }).patch, { kind: "energy_room_result", energyBefore: 8, gain: 2, energyAfter: 10, removeDie: true, stopKind: "automatic" });
  assert.deepEqual(execute("fighter-room-resolution", {
    "room.value": 4, "explosionShip.ids": ["S1", "S2", "S3"],
    "explosionShip:S1.threshold": 2, "explosionShip:S2.threshold": 5, "explosionShip:S3.threshold": 4,
  }).patch, { kind: "fighter_room_result", eligibleShipIds: ["S1", "S3"], roomValue: 4, removeDie: true, stopKind: "automatic" });
  assert.deepEqual(execute("research-room-choice", {
    "room.value": 6, "research.costsAhead": [2, 3, 4],
  }).patch, { kind: "research_room_choice", budget: 6, continuousCosts: [2, 3, 4], stopKind: "choice" });
});

test("room programs bind excavation legality, execution, ordering, and final restriction", () => {
  assert.deepEqual(execute("unexcavated-placement-legality", {
    "event.dieValue": 4, "excavation.pathDistance": 3, "round.usedUnexcavatedPlacement": false,
  }).patch, {
    kind: "excavation_placement_legality", dieValue: 4, pathDistance: 3,
    otherUnexcavatedAlreadyUsed: false, legal: true, stopKind: "automatic",
  });
  assert.equal(execute("unexcavated-placement-legality", {
    "event.dieValue": 4, "excavation.pathDistance": 3, "round.usedUnexcavatedPlacement": true,
  }).patch.legal, false);
  assert.deepEqual(execute("excavation-resolution", {
    "event.dieId": "D4", "excavation.targetIndex": 5, "excavation.pathIndicesBehind": [3, 4],
  }).patch, {
    kind: "excavation_result", energyDelta: -1, removeDieId: "D4", excavatorTargetIndex: 5,
    newlyExcavatedIndices: [3, 4], stopKind: "automatic",
  });
  assert.deepEqual(execute("research-room-order-choice", {
    "research.pendingRoomIds": ["R2", "R1"], "research.room:R2.value": 6,
    "research.room:R1.value": 4, "research.costsAhead": [3, 4, 5],
  }).patch, {
    kind: "research_order_choice", rooms: [{ roomId: "R2", value: 6 }, { roomId: "R1", value: 4 }],
    continuousCosts: [3, 4, 5], combineValues: false, stopKind: "choice",
  });
  assert.equal(execute("final-research-room-restriction", {
    "research.targetCost": 11, "room.type": "research", "room.zone": "lower", "room.cellCount": 2,
  }).patch.currentRoomEligible, true);
  assert.equal(execute("final-research-room-restriction", {
    "research.targetCost": 11, "room.type": "research", "room.zone": "upper", "room.cellCount": 2,
  }).patch.currentRoomEligible, false);
});

test("terminal programs keep their four rule checks separate", () => {
  assert.deepEqual(execute("research-completion-before-destruction", {
    "research.complete": true, "city.destroyed": false,
  }).patch, { kind: "terminal_check", terminal: true, result: "win", reason: "research_completed_before_city_destruction", stopKind: "complete" });
  assert.equal(execute("research-completion-before-destruction", {
    "research.complete": true, "city.destroyed": true,
  }).patch.result, "ongoing");
  assert.equal(execute("damage-track-loss", { "damage.atBottom": true }).patch.result, "loss");
  assert.equal(execute("mothership-skull-loss", { "mothership.onSkullRow": true }).patch.result, "loss");
  assert.equal(execute("research-top-win", { "research.atTop": true }).patch.result, "win");
});

test("mothership programs bind descent collection and the exposed row action", () => {
  assert.deepEqual(execute("mothership-phase-descent", {
    "mothership.row": 4, "sky.row:5.shipIds": ["S7", "S8"],
  }).patch, { kind: "mothership_phase_descent", fromRow: 4, toRow: 5, collectedShipIds: ["S7", "S8"], stopKind: "automatic" });
  assert.deepEqual(execute("mothership-row-action", {
    "mothership.rowAction.type": "research_back", "mothership.rowAction.value": 2,
  }).patch, { kind: "mothership_row_action", actionType: "research_back", amount: 2, stopKind: "automatic" });
});

test("spawn programs preserve all valid ties and stop for player choice", () => {
  assert.deepEqual(execute("spawn-empty-columns", {
    "spawn.shipId": "P1", "sky.columnIds": ["C1", "C2", "C3"],
    "sky.column:C1.shipIds": [], "sky.column:C1.dropPointId": "DP1",
    "sky.column:C2.shipIds": ["S1"], "sky.column:C2.dropPointId": "DP2",
    "sky.column:C3.shipIds": [], "sky.column:C3.dropPointId": "DP3",
  }).patch, { kind: "spawn_candidates", shipId: "P1", candidateDropPointIds: ["DP1", "DP3"], stopKind: "choice" });
  assert.deepEqual(execute("spawn-farthest-drop-point", {
    "spawn.shipId": "W1", "spawn.availableDropPointIds": ["D1", "D2", "D3"],
    "spawn.dropPoint:D1.distanceFromHighestShip": 4,
    "spawn.dropPoint:D2.distanceFromHighestShip": 7,
    "spawn.dropPoint:D3.distanceFromHighestShip": 7,
  }).patch, { kind: "spawn_candidates", shipId: "W1", candidateDropPointIds: ["D2", "D3"], stopKind: "choice" });
});

test("dynamic read declarations do not authorize a different attention namespace", () => {
  const row = loadDefaultLibrary().get("spawn-farthest-drop-point");
  const program = structuredClone(row.program);
  program.bindings.maximumDistance = { op: "read_template", template: "secret:${dropPointId}.value" };
  assert.throws(() => new JsonCognitiveProgramInterpreter().execute(program, {
    attention: attention({ "spawn.shipId": "S", "spawn.availableDropPointIds": [] }),
  }), /unknown variable|undeclared attention read/);
});
