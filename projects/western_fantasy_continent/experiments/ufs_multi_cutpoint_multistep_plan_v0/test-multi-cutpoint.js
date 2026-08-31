"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  chooseSecondCutpoint,
  planRoomOrder,
} = require("./multi-cutpoint-planner");

const playerResponse = {
  pending: { type: "place_die" },
  observation: {
    energy: 2,
    excavatorIndex: 0,
    dice: [{ id: "remaining-white", value: 4, placed: false }],
    placements: [
      { cellId: "c1" }, { cellId: "c2" }, { cellId: "c4" }, { cellId: "c5" },
    ],
    ships: [{ id: "s1", column: 2, row: 4 }],
  },
  mapView: {
    baseCells: [
      { id: "c1", column: 0, roomId: "used1", unlockIndex: 0 },
      { id: "c2", column: 1, roomId: "used2", unlockIndex: 0 },
      { id: "aa3", column: 2, roomId: "aa-room", unlockIndex: 0 },
      { id: "tunnel3", column: 2, roomId: "tunnel-room", unlockIndex: 0 },
      { id: "c4", column: 3, roomId: "used4", unlockIndex: 0 },
      { id: "c5", column: 4, roomId: "used5", unlockIndex: 0 },
    ],
    rooms: [
      { id: "aa-room", type: "aa", cellIds: ["aa3"] },
      { id: "tunnel-room", type: "tunnel", cellIds: ["tunnel3"] },
    ],
  },
};

test("second cut-in chooses by complete continuation rather than local AA preference", () => {
  const routeActivations = [
    { triggerSideAccepted: true, capability: { roomType: "aa" } },
    { triggerSideAccepted: true, capability: { roomType: "tunnel" } },
  ];
  const result = chooseSecondCutpoint({
    playerResponse,
    routeActivations,
    imagineCandidate: (payload) => ({
      world: payload.cellId === "aa3"
        ? { damage: 0, ships: [{ row: 7 }, { row: 5 }, { row: 5 }] }
        : { damage: 0, ships: [{ row: 5 }, { row: 4 }, { row: 2 }] },
    }),
  });
  assert.equal(result.selected.roomType, "tunnel");
  assert.equal(result.candidates.length, 2);
  assert.equal(result.searchAudit.cartesianPlacementCandidatesGenerated, 0);
});

test("room-order cut-in derives dependencies without permuting all orders", () => {
  const result = planRoomOrder({
    playerResponse: {
      pending: { candidates: { resolvableRoomIds: ["energy", "research", "fighter"] }, type: "room_action" },
      observation: { energy: 2 },
      mapView: { rooms: [{ id: "fighter", type: "fighter", energyCost: 1 }] },
    },
    anchorPackage: {
      support: { roomId: "energy", expectedEnergyGain: 2 },
      primary: { roomId: "research" },
    },
    minimumEnergy: 1,
  });
  assert.deepEqual(result.operations.map((row) => row.type), [
    "resolve_room", "resolve_room", "choose_research_advance", "resolve_room", "end_rooms",
  ]);
  assert.equal(result.operations[0].roomId, "energy");
  assert.equal(result.operations[1].roomId, "research");
  assert.equal(result.searchAudit.roomOrderPermutationsGenerated, 0);
});
