"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadAllTrajectories } = require("./rule_reading_trajectory_v0/compiled-trajectory-loader");
const { UfsEventRuleImagination } = require("./ufs-event-rule-imagination");

const CASES = [
  {
    name: "white die placement forms Q and awakens random reroll",
    event: { type: "die_placed", dieColor: "white" },
    state: { dice: [{ id: "W", placed: true }, { id: "G", placed: false }, { id: "B", placed: false }] },
    programId: "white-die-reroll", status: "random",
    patch: { kind: "randomize_unplaced_dice", dieIds: ["G", "B"], field: "value", valueState: "random_unknown", stopKind: "random", stopReason: "waiting_for_actual_reroll" },
  },
  {
    name: "final arrow landing forms Q and awakens arrow movement",
    event: { type: "ship_landed", shipId: "S1" },
    state: { tile: { kind: "arrow", arrow: { targetColumn: "C4", targetRow: 7 } } },
    programId: "arrow-final-landing", status: "automatic",
    patch: { kind: "move_ship", shipId: "S1", column: "C4", row: 7, stopKind: "automatic" },
  },
  {
    name: "mothership landing space forms Q and awakens descent",
    event: { type: "ship_landed" }, state: { tile: { kind: "mothership_down" }, mothership: { row: 3 } },
    programId: "mothership-down-space", status: "automatic",
    patch: { kind: "move_mothership", fromRow: 3, toRow: 4, delta: 1, stopKind: "automatic" },
  },
  {
    name: "city contact forms Q and awakens damage and return",
    event: { type: "ship_landed", shipId: "P2" }, state: { tile: { kind: "city" } },
    programId: "city-contact", status: "automatic",
    patch: { kind: "city_contact", shipId: "P2", damageDelta: 1, shipDestination: "mothership_queue", stopKind: "automatic" },
  },
  {
    name: "room cost forms Q and awakens payment choice",
    event: { type: "room_resolution", stage: "payment" }, state: { room: { type: "energy", energyCost: 3 }, player: { energy: 2 } },
    programId: "room-energy-payment", status: "choice",
    patch: { kind: "room_payment_choice", energyCost: 3, canPay: false, stopKind: "choice" },
  },
  {
    name: "energy room forms Q and awakens capped gain",
    event: { type: "room_resolution", stage: "effect" },
    state: { room: { type: "energy", value: 4 }, player: { energy: 8, energyCap: 10 } },
    programId: "energy-room-resolution", status: "automatic",
    patch: { kind: "energy_room_result", energyBefore: 8, gain: 2, energyAfter: 10, removeDie: true, stopKind: "automatic" },
  },
  {
    name: "fighter room forms Q and awakens eligible destruction",
    event: { type: "room_resolution", stage: "effect" },
    state: { room: { type: "fighter", value: 4 }, explosionShips: [{ id: "S1", threshold: 2 }, { id: "S2", threshold: 5 }, { id: "S3", threshold: 4 }] },
    programId: "fighter-room-resolution", status: "automatic",
    patch: { kind: "fighter_room_result", eligibleShipIds: ["S1", "S3"], roomValue: 4, removeDie: true, stopKind: "automatic" },
  },
  {
    name: "research room forms Q and awakens advance choice",
    event: { type: "room_resolution", stage: "effect" },
    state: { room: { type: "research", value: 6 }, research: { costsAhead: [2, 3, 4] } },
    programId: "research-room-choice", status: "choice",
    patch: { kind: "research_room_choice", budget: 6, continuousCosts: [2, 3, 4], stopKind: "choice" },
  },
  {
    name: "research completion forms Q and awakens win check",
    event: { type: "research_completed" },
    state: { research: { complete: true }, city: { destroyed: false } },
    programId: "research-completion-before-destruction", status: "complete",
    patch: { kind: "terminal_check", terminal: true, result: "win", reason: "research_completed_before_city_destruction", stopKind: "complete" },
  },
  {
    name: "damage bottom forms Q and awakens loss check",
    event: { type: "damage_changed" }, state: { damage: { atBottom: true } },
    programId: "damage-track-loss", status: "complete",
    patch: { kind: "terminal_check", terminal: true, result: "loss", reason: "damage_track_reached_bottom", stopKind: "complete" },
  },
  {
    name: "mothership skull row forms Q and awakens loss check",
    event: { type: "mothership_threshold_check" }, state: { mothership: { onSkullRow: true } },
    programId: "mothership-skull-loss", status: "complete",
    patch: { kind: "terminal_check", terminal: true, result: "loss", reason: "mothership_reached_skull_row", stopKind: "complete" },
  },
  {
    name: "unexcavated placement forms Q and awakens legality",
    event: { type: "excavation_placement_considered", dieValue: 4 },
    state: { excavation: { pathDistance: 3 }, round: { usedUnexcavatedPlacement: false } },
    programId: "unexcavated-placement-legality", status: "automatic",
    patch: { kind: "excavation_placement_legality", dieValue: 4, pathDistance: 3, otherUnexcavatedAlreadyUsed: false, legal: true, stopKind: "automatic" },
  },
  {
    name: "chosen excavation forms Q and awakens resolution",
    event: { type: "excavation_selected", dieId: "D4" },
    state: { excavation: { targetIndex: 5, pathIndicesBehind: [3, 4] } },
    programId: "excavation-resolution", status: "automatic",
    patch: { kind: "excavation_result", energyDelta: -1, removeDieId: "D4", excavatorTargetIndex: 5, newlyExcavatedIndices: [3, 4], stopKind: "automatic" },
  },
  {
    name: "multiple research rooms form Q and awaken order choice",
    event: { type: "research_rooms_ready" },
    state: { research: { pendingRooms: [{ id: "R2", value: 6 }, { id: "R1", value: 4 }], costsAhead: [3, 4, 5] } },
    programId: "research-room-order-choice", status: "choice",
    patch: { kind: "research_order_choice", rooms: [{ roomId: "R2", value: 6 }, { roomId: "R1", value: 4 }], continuousCosts: [3, 4, 5], combineValues: false, stopKind: "choice" },
  },
  {
    name: "mothership phase start forms Q and awakens descent collection",
    event: { type: "phase_started" },
    state: { phase: "mothership", mothership: { row: 4 }, sky: { shipsByRow: { 5: ["S7", "S8"] } } },
    programId: "mothership-phase-descent", status: "automatic",
    patch: { kind: "mothership_phase_descent", fromRow: 4, toRow: 5, collectedShipIds: ["S7", "S8"], stopKind: "automatic" },
  },
  {
    name: "mothership landed row forms Q and awakens row action",
    event: { type: "mothership_descent_completed" },
    state: { mothership: { rowAction: { type: "research_back", value: 2 } } },
    programId: "mothership-row-action", status: "automatic",
    patch: { kind: "mothership_row_action", actionType: "research_back", amount: 2, stopKind: "automatic" },
  },
  {
    name: "research top forms Q and awakens immediate win",
    event: { type: "research_position_changed" }, state: { research: { atTop: true } },
    programId: "research-top-win", status: "complete",
    patch: { kind: "terminal_check", terminal: true, result: "win", reason: "research_reached_top", stopKind: "complete" },
  },
  {
    name: "final research attempt forms Q and awakens room constraint",
    event: { type: "final_research_considered" },
    state: { research: { targetCost: 11 }, room: { type: "research", zone: "lower", cellCount: 2 } },
    programId: "final-research-room-restriction", status: "automatic",
    patch: { kind: "final_research_constraint", targetCost: 11, requiresRoomType: "research", requiresZone: "lower", requiresMinimumCells: 2, currentRoomEligible: true, stopKind: "automatic" },
  },
  {
    name: "spawn with empty columns forms Q and awakens first priority",
    event: { type: "spawn_started", shipId: "P1" },
    state: { sky: { columns: [{ id: "C1", shipIds: [], dropPointId: "DP1" }, { id: "C2", shipIds: ["S1"], dropPointId: "DP2" }, { id: "C3", shipIds: [], dropPointId: "DP3" }] } },
    programId: "spawn-empty-columns", status: "choice",
    patch: { kind: "spawn_candidates", shipId: "P1", candidateDropPointIds: ["DP1", "DP3"], stopKind: "choice" },
  },
  {
    name: "full columns form Q and awaken farthest spawn priority",
    event: { type: "spawn_started", shipId: "W1" },
    state: {
      sky: { columns: [{ id: "C1", shipIds: ["S1"] }, { id: "C2", shipIds: ["S2"] }] },
      spawn: { dropPoints: [{ id: "D1", distanceFromHighestShip: 4 }, { id: "D2", distanceFromHighestShip: 7 }, { id: "D3", distanceFromHighestShip: 7 }] },
    },
    programId: "spawn-farthest-drop-point", status: "choice",
    patch: { kind: "spawn_candidates", shipId: "W1", candidateDropPointIds: ["D2", "D3"], stopKind: "choice" },
  },
];

const Q_KIND_BY_PROGRAM = Object.freeze({
  "white-die-reroll": "white_die_placed",
  "arrow-final-landing": "ship_final_arrow",
  "mothership-down-space": "ship_final_mothership_space",
  "city-contact": "ship_city_contact",
  "room-energy-payment": "room_payment",
  "energy-room-resolution": "energy_room_resolution",
  "fighter-room-resolution": "fighter_room_resolution",
  "research-room-choice": "research_room_resolution",
  "research-completion-before-destruction": "research_completion",
  "damage-track-loss": "damage_threshold",
  "mothership-skull-loss": "mothership_threshold",
  "unexcavated-placement-legality": "excavation_placement",
  "excavation-resolution": "excavation_resolution",
  "research-room-order-choice": "research_order",
  "mothership-phase-descent": "mothership_phase_start",
  "mothership-row-action": "mothership_row_action",
  "research-top-win": "research_top",
  "final-research-room-restriction": "final_research_constraint",
  "spawn-empty-columns": "spawn_priority_empty",
  "spawn-farthest-drop-point": "spawn_priority_farthest",
});

assert.equal(CASES.length, 20);
assert.equal(new Set(CASES.map((row) => row.programId)).size, 20);

for (const row of CASES) {
  test(`end-to-end: ${row.name}`, () => {
    const result = new UfsEventRuleImagination().run({ event: row.event, observedState: row.state });
    assert.equal(result.status, row.status);
    assert.equal(result.trace.eventDetection.qKind, Q_KIND_BY_PROGRAM[row.programId]);
    assert.equal(result.trace.grounding.programId, row.programId);
    assert.deepEqual(result.patch, row.patch);
    assert.equal(result.observedWorldUnchanged, true);
    assert.ok(result.trace.q);
    assert.ok(result.trace.candidates.length > 0);
    assert.equal(result.trace.grounding.awakenedFollowingQ.affected_object.length > 0, true);
  });
}

test("insufficient initial attention queries the missing public facts before Q activation", () => {
  const result = new UfsEventRuleImagination().run({
    event: { type: "room_resolution", stage: "effect" },
    observedState: { room: { type: "fighter", value: 4 }, explosionShips: [{ id: "S1", threshold: 2 }] },
    perceptionBudget: 1,
  });
  assert.equal(result.status, "automatic");
  assert.equal(result.patch.kind, "fighter_room_result");
  assert.equal(result.trace.informationRecovery.complete, true);
  assert.ok(result.trace.attention.queryAcquired.length > 0);
  assert.ok(result.trace.q);
});

test("an inaccessible missing fact becomes confusion but does not stop decision flow", () => {
  const result = new UfsEventRuleImagination().run({
    event: { type: "ship_landed", shipId: "S1" },
    observedState: { tile: { kind: "mothership_down" }, mothership: { row: 3 } },
    externalAttention: { noticedPaths: ["event.type", "event.shipId", "tile.kind"], queryablePaths: [] },
  });
  assert.equal(result.status, "automatic");
  assert.equal(result.reason, "confusion_continued_without_missing_information");
  assert.equal(result.patch.kind, "uncertain_event_effect");
  assert.deepEqual(result.patch.missingSlots, ["mothership.row"]);
  assert.equal(result.trace.informationRecovery.confusions[0].status, "confused");
});

test("boundary: relation gate rejects a high-scoring wrong event trajectory", () => {
  const trajectories = loadAllTrajectories();
  const correct = trajectories.find((row) => row.relation.qKind === "energy_room_resolution");
  const wrong = trajectories.find((row) => row.relation.qKind === "fighter_room_resolution");
  const memory = {
    query() {
      return [
        { activation: 0.99, trajectory: wrong },
        { activation: 0.98, trajectory: correct },
      ];
    },
  };
  const result = new UfsEventRuleImagination({ trajectories, memory }).run({
    event: { type: "room_resolution", stage: "effect" },
    observedState: { room: { type: "energy", value: 4 }, player: { energy: 8, energyCap: 10 } },
  });
  assert.equal(result.trace.relationRejections[0].trajectoryId, wrong.id);
  assert.equal(result.trace.grounding.trajectoryId, correct.id);
  assert.equal(result.trace.grounding.programId, "energy-room-resolution");
});

test("boundary: unfamiliar event returns unknown without selecting a program", () => {
  const result = new UfsEventRuleImagination().run({ event: { type: "alien_teleport" }, observedState: {} });
  assert.equal(result.status, "unknown");
  assert.equal(result.patch, null);
  assert.equal(result.trace.q, null);
});

test("boundary: random trajectory stops before inventing a die value", () => {
  const result = new UfsEventRuleImagination().run({
    event: { type: "die_placed", dieColor: "white" },
    observedState: { dice: [{ id: "W", placed: true }, { id: "G", placed: false }] },
  });
  assert.equal(result.status, "random");
  assert.equal(result.patch.valueState, "random_unknown");
  assert.equal(Object.prototype.hasOwnProperty.call(result.patch, "values"), false);
});

test("boundary: choice trajectory stops before choosing for the player", () => {
  const result = new UfsEventRuleImagination().run({
    event: { type: "room_resolution", stage: "payment" },
    observedState: { room: { type: "energy", energyCost: 1 }, player: { energy: 4 } },
  });
  assert.equal(result.status, "choice");
  assert.equal(result.patch.canPay, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.patch, "selected"), false);
});

test("boundary: imagination never mutates a destructive-looking observed state", () => {
  const state = { tile: { kind: "city" }, city: { damage: 3 }, ships: [{ id: "S9", location: "city" }] };
  const before = structuredClone(state);
  const result = new UfsEventRuleImagination().run({
    event: { type: "ship_landed", shipId: "S9" }, observedState: state,
  });
  assert.equal(result.observedWorldUnchanged, true);
  assert.deepEqual(state, before);
  assert.equal(result.patch.damageDelta, 1);
});
