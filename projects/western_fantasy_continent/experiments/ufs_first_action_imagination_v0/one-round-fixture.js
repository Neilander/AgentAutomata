"use strict";

// This is deliberately a scripted, non-strategic round. The controller under
// test receives decisions; it does not choose them.
const ROUND_ONE_SCRIPT = Object.freeze({
  placements: Object.freeze([
    Object.freeze({ dieId: "r1-gray-0", cellId: "A-r2-c2" }),
    Object.freeze({ dieId: "r1-gray-1", cellId: "A-r2-c1" }),
    Object.freeze({ dieId: "r1-gray-2", cellId: "A-r3-c3" }),
    Object.freeze({ dieId: "r1-white-3", cellId: "A-r2-c4" }),
    Object.freeze({ dieId: "r1-white-4", cellId: "A-r2-c5" }),
  ]),
  roomActions: Object.freeze([
    Object.freeze({ type: "resolve_room", roomId: "A-upper-energy", pay: true }),
    Object.freeze({ type: "resolve_room", roomId: "A-upper-fighter", pay: true }),
    Object.freeze({ type: "excavate", placementId: "r1-gray-2@A-r3-c3" }),
    Object.freeze({ type: "skip_worker", placementId: "r1-gray-0@A-r2-c2" }),
    Object.freeze({ type: "end_rooms" }),
  ]),
  spawnChoices: Object.freeze({
    "purple-0": "DP-C1",
    "white-1": "DP-C4",
  }),
});

const ROUND_ONE_RANDOM_OBSERVATIONS = Object.freeze({
  "after:r1-white-3": Object.freeze({ "r1-white-4": 3 }),
});

function MISS_PURPLE_ZERO_AT_FIGHTER_ROOM({ event, publicState }) {
  if (
    event.type === "room_resolution"
    && event.stage === "effect"
    && publicState.room?.type === "fighter"
  ) {
    return {
      mode: "injected_single_attention_omission",
      noticedState: {
        ...publicState,
        explosionShips: publicState.explosionShips.filter((ship) => ship.id !== "purple-0"),
      },
      omittedItemIds: ["ship:purple-0@explosion:E2"],
    };
  }
  return { noticedState: publicState, omittedItemIds: [] };
}

module.exports = {
  MISS_PURPLE_ZERO_AT_FIGHTER_ROOM,
  ROUND_ONE_RANDOM_OBSERVATIONS,
  ROUND_ONE_SCRIPT,
};
