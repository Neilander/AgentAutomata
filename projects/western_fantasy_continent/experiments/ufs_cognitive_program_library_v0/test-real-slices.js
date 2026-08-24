"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { executeActivatedRule } = require("./cognitive-program-runtime");

function attention(values) {
  return {
    read(readPath) {
      if (!Object.prototype.hasOwnProperty.call(values, readPath)) throw new Error(`state did not expose: ${readPath}`);
      return structuredClone(values[readPath]);
    },
  };
}

function run(qKind, sourceRuleId, values) {
  return executeActivatedRule({ qKind, sourceRuleId, attention: attention(values) });
}

test("real slice: placing the white die stops at unknown reroll instead of inventing dice", () => {
  const observedWorld = {
    dice: [{ id: "white", placed: true, value: 5 }, { id: "grey", placed: false, value: 2 }, { id: "black", placed: false, value: 6 }],
  };
  const before = structuredClone(observedWorld);
  const result = run("white_die_placed", "white_die_rerolls_remaining", {
    "dice.ids": observedWorld.dice.map((die) => die.id),
    ...Object.fromEntries(observedWorld.dice.map((die) => [`dice:${die.id}.placed`, die.placed])),
  });
  assert.equal(result.status, "executed");
  assert.equal(result.programId, "white-die-reroll");
  assert.equal(result.patch.stopKind, "random");
  assert.deepEqual(result.patch.dieIds, ["grey", "black"]);
  assert.equal(result.patch.valueState, "random_unknown");
  assert.deepEqual(observedWorld, before);
});

test("real slice: mothership phase reaches a tied spawn choice through three rule programs", () => {
  const observedWorld = {
    mothershipRow: 4,
    shipsByRow: { 5: ["purple-2", "white-1"] },
    rowAction: { type: "city_damage", value: 1 },
    pendingSpawn: { shipId: "purple-3", dropPoints: [{ id: "D1", distance: 3 }, { id: "D2", distance: 6 }, { id: "D3", distance: 6 }] },
  };
  const before = structuredClone(observedWorld);
  const descent = run("mothership_phase_start", "mothership_descends_each_round", {
    "mothership.row": 4, "sky.row:5.shipIds": observedWorld.shipsByRow[5],
  });
  const action = run("mothership_row_action", "mothership_action_applies_row_effect", {
    "mothership.rowAction.type": observedWorld.rowAction.type,
    "mothership.rowAction.value": observedWorld.rowAction.value,
  });
  const spawn = run("spawn_priority_farthest", "spawn_farthest_from_highest_ship", {
    "spawn.shipId": observedWorld.pendingSpawn.shipId,
    "spawn.availableDropPointIds": observedWorld.pendingSpawn.dropPoints.map((row) => row.id),
    ...Object.fromEntries(observedWorld.pendingSpawn.dropPoints.map((row) => [
      `spawn.dropPoint:${row.id}.distanceFromHighestShip`, row.distance,
    ])),
  });
  assert.deepEqual([descent.programId, action.programId, spawn.programId], [
    "mothership-phase-descent", "mothership-row-action", "spawn-farthest-drop-point",
  ]);
  assert.deepEqual(descent.patch.collectedShipIds, ["purple-2", "white-1"]);
  assert.deepEqual(action.patch, { kind: "mothership_row_action", actionType: "city_damage", amount: 1, stopKind: "automatic" });
  assert.deepEqual(spawn.patch.candidateDropPointIds, ["D2", "D3"]);
  assert.equal(spawn.patch.stopKind, "choice");
  assert.deepEqual(observedWorld, before);
});

test("real slice: capped energy gain is imagined only after the player has chosen resolution", () => {
  const result = run("energy_room_resolution", "energy_room_generates_energy", {
    "room.value": 4, "player.energy": 8, "player.energyCap": 10,
  });
  assert.deepEqual(result.patch, {
    kind: "energy_room_result", energyBefore: 8, gain: 2, energyAfter: 10,
    removeDie: true, stopKind: "automatic",
  });
});

test("real slice: immediate terminal memory ends imagination", () => {
  const result = run("research_top", "research_top_is_immediate_win", { "research.atTop": true });
  assert.deepEqual(result.patch, {
    kind: "terminal_check", terminal: true, result: "win", reason: "research_reached_top", stopKind: "complete",
  });
});

test("runtime is conservative when no learned program matches", () => {
  const result = executeActivatedRule({
    qKind: "ship_final_arrow", sourceRuleId: "rule_not_learned", attention: attention({}),
  });
  assert.deepEqual(result, { status: "unknown", candidates: [], patch: null, reads: [] });
});
