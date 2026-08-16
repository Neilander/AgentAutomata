"use strict";

const { createWorld } = require("./action-attention-runtime");

function chessRookCase() {
  const units = [];
  const connections = [];
  const files = ["a", "b", "c", "d", "e"];
  for (let rank = 1; rank <= 5; rank += 1) {
    for (const file of files) units.push({ id: `${file}${rank}`, kind: "square", tags: ["board"] });
  }
  for (let rank = 1; rank <= 5; rank += 1) {
    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const id = `${files[fileIndex]}${rank}`;
      if (rank < 5) connections.push({ from: id, to: `${files[fileIndex]}${rank + 1}`, kind: "orthogonal", direction: "north" });
      if (rank > 1) connections.push({ from: id, to: `${files[fileIndex]}${rank - 1}`, kind: "orthogonal", direction: "south" });
      if (fileIndex < files.length - 1) connections.push({ from: id, to: `${files[fileIndex + 1]}${rank}`, kind: "orthogonal", direction: "east" });
      if (fileIndex > 0) connections.push({ from: id, to: `${files[fileIndex - 1]}${rank}`, kind: "orthogonal", direction: "west" });
    }
  }

  return {
    world: createWorld({
      units,
      connections,
      entities: [
        { id: "rook", type: "piece", faction: "self", unitId: "c3" },
        { id: "enemy-north", type: "piece", faction: "other", unitId: "c5" },
        { id: "friend-east", type: "piece", faction: "self", unitId: "e3" },
        { id: "enemy-behind-friend", type: "piece", faction: "other", unitId: "a3" },
        { id: "enemy-south", type: "piece", faction: "other", unitId: "c1" },
      ],
    }),
    initialActions: [{ type: "notice", id: "consider-rook-capture", label: "考虑用车吃子", entityId: "rook" }],
    rules: [
      {
        id: "rook-find-capturable-nearest",
        when: { "action.id": "consider-rook-capture" },
        attention: {
          region: {
            mode: "rays",
            seed: "$entity.unitId",
            directions: ["north", "east", "south", "west"],
            connectionKinds: ["orthogonal"],
          },
          query: {
            mode: "nearest_per_direction",
            stopAt: { exists: true },
            keep: { type: "piece", faction: "other" },
          },
        },
        forEachMatch: true,
        then: [{ type: "notice", id: "capturable-${match.entityId}", label: "发现可吃目标", entityId: "${match.entityId}" }],
      },
      {
        id: "choose-first-capture-for-demo",
        when: { "action.id": "capturable-enemy-north" },
        then: [
          { type: "remove", entityId: "enemy-north" },
          { type: "relocate", entityId: "rook", targetUnitId: "c5" },
          { type: "decision", owner: "other", reason: "轮到对方决策" },
        ],
      },
    ],
  };
}

function ufsPlacementCase() {
  const units = [];
  const connections = [];
  for (let row = 0; row <= 5; row += 1) {
    units.push({
      id: `sky-c0-r${row}`,
      kind: "sky_cell",
      tags: row === 2 ? ["aa_field"] : row === 4 ? ["explosion"] : ["sky"],
      column: 0,
      row,
    });
    if (row < 5) connections.push({
      from: `sky-c0-r${row}`,
      to: `sky-c0-r${row + 1}`,
      kind: "sky_down",
      direction: "down",
    });
  }
  units.push({ id: "base-c0", kind: "base_slot", tags: ["column_0"], column: 0 });
  connections.push({ from: "base-c0", to: "sky-c0-r0", kind: "same_column", direction: "up" });

  return {
    world: createWorld({
      units,
      connections,
      entities: [
        { id: "die-4", type: "die", faction: "self", unitId: null, state: { value: 4 } },
        { id: "ship-purple", type: "ship", faction: "other", unitId: "sky-c0-r0" },
        { id: "city", type: "city", faction: "self", unitId: "sky-c0-r4", state: { hp: 3 } },
      ],
    }),
    initialActions: [{ type: "place", entityId: "die-4", targetUnitId: "base-c0" }],
    rules: [
      {
        id: "placed-die-attend-same-column",
        when: { "action.type": "place", "entity.type": "die", "targetUnit.kind": "base_slot" },
        attention: {
          region: {
            mode: "flood",
            seed: "$result.to",
            maxDepth: 6,
            connectionKinds: ["same_column", "sky_down"],
          },
          query: { mode: "all", keep: { type: "ship" } },
        },
        forEachMatch: true,
        then: [
          { type: "compute", key: "move-${match.entityId}", value: "$entity.state.value" },
          { type: "notice", id: "inspect-path-${match.entityId}", label: "检查飞船下降路径", entityId: "${match.entityId}" },
        ],
      },
      {
        id: "aa-reduces-movement",
        when: { "action.id": "inspect-path-ship-purple" },
        attention: {
          region: {
            mode: "rays",
            seed: "$entity.unitId",
            directions: ["down"],
            connectionKinds: ["sky_down"],
            maxDepth: "$memory.move-ship-purple",
          },
          query: { target: "unit", mode: "first", keep: { tagsAll: ["aa_field"] } },
        },
        then: [{ type: "adjust", key: "move-ship-purple", delta: -1 }],
      },
      {
        id: "after-path-inspection-move-ship",
        priority: -1,
        when: { "action.id": "inspect-path-ship-purple" },
        then: [{ type: "move_along", entityId: "ship-purple", distanceFrom: "move-ship-purple", connectionKind: "sky_down", direction: "down" }],
      },
      {
        id: "landing-attends-explosion",
        when: { "action.type": "move_along", "resultUnit.tags": { includes: "explosion" } },
        attention: {
          region: { mode: "unit", seed: "$result.to" },
          query: { mode: "all", keep: { type: "city" } },
        },
        forEachMatch: true,
        then: [{ type: "damage", entityId: "${match.entityId}", amount: 1 }],
      },
      {
        id: "city-damage-leads-to-next-choice",
        when: { "action.type": "damage", "entity.type": "city" },
        then: [{ type: "decision", owner: "self", reason: "一次放置连锁已结算，需要选择下一颗骰子" }],
      },
    ],
  };
}

function cardEventCase() {
  return {
    world: createWorld({
      units: [
        { id: "hand", kind: "card_zone", tags: ["private"] },
        { id: "play-area", kind: "card_zone", tags: ["public"] },
        { id: "event-deck", kind: "deck_zone", tags: ["hidden_stack"] },
        { id: "table", kind: "table_zone", tags: ["public"] },
      ],
      connections: [
        { from: "hand", to: "play-area", kind: "play_to", direction: "out" },
        { from: "play-area", to: "event-deck", kind: "trigger", direction: "event" },
        { from: "play-area", to: "table", kind: "trigger", direction: "marker" },
      ],
      entities: [
        { id: "action-card", type: "card", faction: "self", unitId: "hand" },
        { id: "event-card-top", type: "event_card", faction: "neutral", unitId: "event-deck", state: { revealed: false } },
      ],
    }),
    initialActions: [{ type: "relocate", entityId: "action-card", targetUnitId: "play-area" }],
    rules: [
      {
        id: "playing-card-glues-two-actions",
        when: { "action.type": "relocate", "entity.type": "card", "result.to": "play-area" },
        attention: {
          region: {
            mode: "flood",
            seed: "$result.to",
            maxDepth: 1,
            connectionKinds: ["trigger"],
          },
          query: { mode: "all", keep: {} },
        },
        then: [
          { type: "reveal", entityId: "event-card-top" },
          { type: "create", entity: { id: "event-marker", type: "marker", faction: "neutral", unitId: "table" } },
        ],
      },
      {
        id: "revealed-event-needs-unknown-decision",
        when: { "action.type": "reveal", "entity.type": "event_card" },
        then: [{ type: "decision", owner: "other", reason: "事件要求另一位玩家选择结果" }],
      },
    ],
  };
}

module.exports = {
  cardEventCase,
  chessRookCase,
  ufsPlacementCase,
};
