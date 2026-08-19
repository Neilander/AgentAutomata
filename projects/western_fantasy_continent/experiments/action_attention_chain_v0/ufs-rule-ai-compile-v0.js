"use strict";

const {
  createWorld,
  runActionAttentionChain,
} = require("./action-attention-runtime");

/*
 * This artifact is the first manual AI compilation pass. The source below is
 * the only UFS rule knowledge used to produce the declarative program. The
 * runtime is still the game-agnostic action-attention runtime.
 */
const PLAYER_VISIBLE_RULE_TEXT = Object.freeze([
  "在骰子阶段，把一颗骰子放入基地的一列后，该列全部外星飞船同时下降骰子点数。",
  "如果骰子放入防空房，该列飞船少下降1格；1点骰因此不会让飞船移动，也不会触发飞船效果。",
  "飞船只结算最终停留格，经过的天空格不触发。",
  "飞船最终停在母舰下降格时，母舰立即下降一行，但不结算该行右侧动作；若抵达骷髅行，玩家仍然立即失败。",
  "飞船最终停在箭头格时，按箭头移动到同一行箭头所指的列，再结算新的最终停留格。",
  "爆炸格在骰子阶段没有立即效果。",
  "飞船下降到天空区域下方并击中城市时，城市受到1点伤害，飞船返回母舰等待重新生成。",
  "放置白骰后，所有尚未放置的骰子重新投掷；重投结果尚未发生，玩家此时不能继续确定地模拟它们。",
]);

/*
 * AI interpretation of the rule text, before serialization:
 *
 * - "put die in a base column" selects all ships via the same-column graph.
 * - AA is a property of the placed room, not a sky-path cell.
 * - descent is a pending parameter, so the adjustment is glued before move.
 * - only the landing unit is inspected; arrow landing glues a horizontal move,
 *   then the new landing is inspected again.
 * - a white die also glues a random boundary after its deterministic ship chain.
 */
const COMPILED_RULES = Object.freeze([
  {
    id: "placed-die-selects-same-column-ships",
    when: { "action.type": "place", "entity.type": "die", "targetUnit.kind": "base_slot" },
    attention: {
      region: {
        mode: "flood",
        seed: "$result.to",
        maxDepth: 12,
        connectionKinds: ["same_column", "sky_down"],
      },
      query: { mode: "all", keep: { type: "ship" } },
    },
    forEachMatch: true,
    then: [
      { type: "compute", key: "descent-${match.entityId}", value: "$entity.state.value" },
      { type: "notice", id: "prepare-descent-${match.entityId}", entityId: "${match.entityId}", label: "准备结算同列飞船下降" },
    ],
  },
  {
    id: "aa-room-adjusts-pending-descent",
    when: {
      "action.type": "notice",
      "action.label": "准备结算同列飞船下降",
      "memory.placedRoomTags": { includes: "aa_room" },
    },
    then: [{ type: "adjust", key: "descent-${entity.id}", delta: -1, min: 0 }],
  },
  {
    id: "prepared-descent-moves-ship",
    priority: -1,
    when: { "action.type": "notice", "action.label": "准备结算同列飞船下降" },
    then: [{
      type: "move_along",
      entityId: "$entity.id",
      distanceFrom: "descent-${entity.id}",
      connectionKind: "sky_down",
      direction: "down",
    }],
  },
  {
    id: "landing-inspection",
    when: { "action.type": "move_along", "entity.type": "ship" },
    then: [{ type: "notice", id: "inspect-landing-${entity.id}", entityId: "$entity.id", label: "只检查飞船最终停留格" }],
  },
  {
    id: "arrow-landing-moves-horizontally",
    when: {
      "action.type": "notice",
      "action.label": "只检查飞船最终停留格",
      "resultUnit.tags": { includes: "arrow_right" },
    },
    then: [{
      type: "move_along",
      entityId: "$entity.id",
      distance: 1,
      connectionKind: "sky_horizontal",
      direction: "right",
    }],
  },
  {
    id: "mothership-space-lowers-mothership",
    when: {
      "action.type": "notice",
      "action.label": "只检查飞船最终停留格",
      "resultUnit.tags": { includes: "mothership_down" },
    },
    then: [
      { type: "move_along", entityId: "mothership", distance: 1, connectionKind: "mothership_down", direction: "down" },
      { type: "notice", id: "inspect-mothership-row", entityId: "mothership", label: "只检查是否抵达骷髅行" },
    ],
  },
  {
    id: "mothership-skull-is-immediate-loss",
    when: {
      "action.id": "inspect-mothership-row",
      "resultUnit.tags": { includes: "skull" },
    },
    then: [{ type: "outcome", outcome: "loss", reason: "母舰抵达骷髅行，立即失败" }],
  },
  {
    id: "city-hit-causes-damage",
    when: {
      "action.type": "notice",
      "action.label": "只检查飞船最终停留格",
      "resultUnit.tags": { includes: "city_hit" },
    },
    then: [
      { type: "damage", entityId: "city", amount: 1 },
      { type: "relocate", entityId: "$entity.id", targetUnitId: "mothership-waiting" },
    ],
  },
  {
    id: "white-die-opens-reroll-random-boundary",
    priority: -10,
    deferUntilChainEnd: true,
    when: { "action.type": "place", "entity.tags": { includes: "white" } },
    then: [{ type: "random", reason: "重投所有尚未放置的骰子" }],
  },
]);

function buildCompiledUfsWorld({
  dieValue = 4,
  roomTags = [],
  landingTag = "mothership_down",
  whiteDie = false,
  mothershipAtSkullDoor = false,
  secondShip = false,
} = {}) {
  const units = [
    { id: "base-c0", kind: "base_slot", tags: ["base_room", ...roomTags], column: 0 },
    { id: "mothership-waiting", kind: "waiting_zone", tags: ["waiting"] },
  ];
  const connections = [{ from: "base-c0", to: "sky-c0-r0", kind: "same_column", direction: "up" }];
  for (let row = 0; row <= 5; row += 1) {
    const tags = ["sky"];
    if (row === dieValue) tags.push(landingTag);
    units.push({ id: `sky-c0-r${row}`, kind: "sky_cell", tags, column: 0, row });
    units.push({ id: `sky-c1-r${row}`, kind: "sky_cell", tags: ["sky"], column: 1, row });
    if (row < 5) {
      connections.push({ from: `sky-c0-r${row}`, to: `sky-c0-r${row + 1}`, kind: "sky_down", direction: "down" });
      connections.push({ from: `sky-c1-r${row}`, to: `sky-c1-r${row + 1}`, kind: "sky_down", direction: "down" });
    }
    connections.push({ from: `sky-c0-r${row}`, to: `sky-c1-r${row}`, kind: "sky_horizontal", direction: "right" });
  }
  units.push({ id: "mothership-r0", kind: "mothership_track", tags: mothershipAtSkullDoor ? ["skull_door"] : [] });
  units.push({ id: "mothership-r1", kind: "mothership_track", tags: mothershipAtSkullDoor ? ["skull"] : [] });
  connections.push({ from: "mothership-r0", to: "mothership-r1", kind: "mothership_down", direction: "down" });

  const entities = [
    { id: "die", type: "die", faction: "self", tags: whiteDie ? ["white"] : ["gray"], unitId: null, state: { value: dieValue } },
    { id: "ship-purple", type: "ship", faction: "other", unitId: "sky-c0-r0" },
    { id: "mothership", type: "mothership", faction: "other", unitId: "mothership-r0" },
    { id: "city", type: "city", faction: "self", unitId: "sky-c0-r5", state: { hp: 3 } },
  ];
  if (secondShip) entities.push({ id: "ship-white", type: "ship", faction: "other", unitId: "sky-c0-r1" });

  const world = createWorld({
    units,
    connections,
    entities,
  });
  return world;
}

function runCompiledUfs(options = {}) {
  const world = buildCompiledUfsWorld(options);
  const roomTags = world.units.get("base-c0").tags;
  return runActionAttentionChain({
    world,
    rules: COMPILED_RULES,
    initialActions: [
      { type: "compute", key: "placedRoomTags", value: roomTags },
      { type: "place", entityId: "die", targetUnitId: "base-c0" },
    ],
  });
}

module.exports = {
  COMPILED_RULES,
  PLAYER_VISIBLE_RULE_TEXT,
  buildCompiledUfsWorld,
  runCompiledUfs,
};
