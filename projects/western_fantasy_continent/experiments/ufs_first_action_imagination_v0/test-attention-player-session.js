"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { UfsAttentionPlayerSession } = require("./ufs-attention-player-session");

function begin() {
  const session = new UfsAttentionPlayerSession({ publicMap });
  return { session, response: session.start({ initialPublicState, attentionSeed: 20260824 }) };
}

test("player response exposes only the attention-limited view and no host checkpoint", () => {
  const { response } = begin();
  assert.equal(response.schema, "ufs_attention_limited_player_response_v0");
  assert.equal(Object.hasOwn(response, "checkpoint"), false);
  assert.equal(Object.hasOwn(response, "traceDelta"), false);
  assert.equal(Object.hasOwn(response, "publicMap"), false);
  assert.equal(response.attention.spaceItemCount, 153);
  assert.equal(response.attention.capacity, 41);
  assert.equal(response.attention.noticedCount, 41);
  assert.equal(response.attention.omittedCount, 112);
  assert.ok(response.observation.dice.length > 0);
  assert.ok(response.mapView.baseCells.length > 0);
  assert.ok(response.mapView.baseCells.length < publicMap.base.cells.length);
  assert.ok(response.mapView.skyCells.length < publicMap.sky.rows.length * publicMap.columns);
});

test("every visible value is backed by a noticed item", () => {
  const { response } = begin();
  const ids = new Set(response.noticedItems.map((row) => row.itemId));
  for (const die of response.observation.dice) assert.ok(ids.has(`die:${die.id}`));
  for (const ship of response.observation.ships) assert.ok(ids.has(`ship:${ship.id}`));
  for (const room of response.mapView.rooms) assert.ok(ids.has(`room:${room.id}`));
  for (const cell of response.mapView.baseCells) assert.ok(ids.has(`base_cell:${cell.id}`));
  for (const cell of response.mapView.skyCells) assert.ok(ids.has(`sky_cell:${cell.row}:${cell.column}`));
});

test("accepted actions return a new limited view with short-term attention carryover", () => {
  const { session } = begin();
  const response = session.advance({ type: "place_die", dieId: "r1-gray-2", cellId: "A-r2-c4" });
  assert.equal(response.status, "choice");
  assert.equal(response.actionCount, 1);
  assert.ok(response.attention.carryoverAppliedItemIds.length > 0);
  assert.equal(Object.hasOwn(response, "checkpoint"), false);
  assert.equal(response.observation.placements.every(
    (row) => response.noticedItems.some((item) => item.itemId === `placement:${row.id}`),
  ), true);
});

test("host checkpoint restores privately without leaking into the player response", () => {
  const { session } = begin();
  session.advance({ type: "place_die", dieId: "r1-gray-2", cellId: "A-r2-c4" });
  const checkpoint = JSON.parse(JSON.stringify(session.exportCheckpoint()));
  const restored = UfsAttentionPlayerSession.restore(checkpoint);
  const response = restored.advance({ type: "place_die", dieId: "r1-gray-1", cellId: "A-r2-c5" });
  assert.equal(response.status, "choice");
  assert.equal(response.actionCount, 2);
  assert.equal(Object.hasOwn(response, "checkpoint"), false);
  assert.ok(response.attention.carryoverAppliedItemIds.length > 0);
});

test("rejected operations preserve the previous perception instead of resampling attention", () => {
  const { session, response: before } = begin();
  const rejected = session.advance({ type: "resolve_room", roomId: "missing", pay: true });
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.actionCount, 0);
  assert.deepEqual(rejected.noticedItems, before.noticedItems);
  assert.deepEqual(rejected.attention, before.attention);
});
