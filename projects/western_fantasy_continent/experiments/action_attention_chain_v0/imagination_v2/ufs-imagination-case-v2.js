"use strict";

const { createImaginationWorld, imagine } = require("./imagination-runtime-v2");

const ACTION_DEFINITIONS = [
  {
    id: "place_die",
    operator: "point_relocate",
    tags: ["placement"],
    outputPort: "placed",
  },
  {
    id: "ship_descend",
    operator: "directed_move",
    tags: ["ship_motion"],
    connectionKind: "sky_down",
    direction: "down",
    consequenceFocus: "endpoint",
    outputPort: "landed",
  },
  {
    id: "ship_shift_right",
    operator: "directed_move",
    tags: ["ship_motion"],
    connectionKind: "sky_horizontal",
    direction: "right",
    consequenceFocus: "endpoint",
    outputPort: "landed",
  },
  {
    id: "pick_random_other_ship",
    operator: "select_entity",
    tags: ["attention_selection"],
    attention: {
      region: {
        mode: "flood",
        seed: "$input.seedUnitId",
        maxDepth: 20,
        connectionKinds: ["sky_down", "sky_horizontal"],
      },
      query: {
        mode: "random_one",
        seed: "$input.seed",
        keep: { type: "ship", idNot: "$input.excludedId" },
      },
    },
    outputPort: "selected",
  },
  {
    id: "damage_city",
    operator: "damage",
    tags: ["state_change"],
    outputPort: "damaged",
  },
  {
    id: "return_ship_to_waiting",
    operator: "point_relocate",
    tags: ["ship_motion"],
    outputPort: "returned",
  },
];

const BASE_GLUE_LINKS = [
  {
    id: "placed-die-glues-column-ship-descents",
    from: { actionId: "place_die", port: "placed" },
    attention: {
      region: {
        mode: "flood",
        seed: "$port.to",
        maxDepth: 12,
        connectionKinds: ["same_column", "sky_down"],
      },
      query: { mode: "all", keep: { type: "ship" } },
    },
    forEachMatch: true,
    invoke: {
      actionId: "ship_descend",
      input: {
        actorId: "$match.entityId",
        distance: "$port.dieValue",
        cause: "placed_die",
        searchOrigin: "$port.to",
      },
    },
  },
  {
    id: "arrow-landing-glues-horizontal-motion",
    from: { actionTag: "ship_motion", port: "landed" },
    condition: { "focusUnit.tags": { includes: "arrow_right" } },
    invoke: {
      actionId: "ship_shift_right",
      input: { actorId: "$port.actorId", distance: 1, cause: "arrow" },
    },
  },
  {
    id: "city-landing-glues-damage-and-return",
    from: { actionTag: "ship_motion", port: "landed" },
    condition: { "focusUnit.tags": { includes: "city_hit" } },
    invoke: [
      { actionId: "damage_city", input: { targetId: "city", amount: 1 } },
      { actionId: "return_ship_to_waiting", input: { actorId: "$port.actorId", targetUnitId: "mothership-waiting" } },
    ],
  },
  {
    id: "selected-random-ship-glues-same-descend-action",
    from: { actionId: "pick_random_other_ship", port: "selected" },
    invoke: {
      actionId: "ship_descend",
      input: { actorId: "$port.entityId", distance: "$port.distance", cause: "$port.cause" },
    },
  },
];

const RANDOM_EXTRA_LINK = {
  id: "primary-landing-glues-random-extra-selection",
  from: { actionId: "ship_descend", port: "landed" },
  condition: { "port.cause": "placed_die" },
  invoke: {
    actionId: "pick_random_other_ship",
    input: {
      seedUnitId: "sky-c0-r0",
      seed: 19,
      excludedId: "$port.actorId",
      portPayload: { distance: 1, cause: "random_extra" },
    },
  },
};

function buildWorld() {
  const units = [
    { id: "base-c0", kind: "base_slot", tags: ["base"] },
    { id: "base-c1", kind: "base_slot", tags: ["base"] },
    { id: "mothership-waiting", kind: "waiting_zone", tags: ["waiting"] },
  ];
  const connections = [];
  for (let row = 0; row <= 4; row += 1) {
    for (let column = 0; column <= 1; column += 1) {
      const tags = ["sky"];
      if (row === 2 && column === 0) tags.push("arrow_right");
      if (row === 2 && column === 1) tags.push("city_hit");
      units.push({ id: `sky-c${column}-r${row}`, kind: "sky_cell", tags, row, column });
      if (row < 4) connections.push({
        from: `sky-c${column}-r${row}`,
        to: `sky-c${column}-r${row + 1}`,
        kind: "sky_down",
        direction: "down",
      });
    }
    connections.push({ from: `sky-c0-r${row}`, to: `sky-c1-r${row}`, kind: "sky_horizontal", direction: "right" });
    connections.push({ from: `sky-c1-r${row}`, to: `sky-c0-r${row}`, kind: "sky_horizontal", direction: "left" });
  }
  connections.push({ from: "base-c0", to: "sky-c0-r0", kind: "same_column", direction: "up" });
  connections.push({ from: "base-c1", to: "sky-c1-r0", kind: "same_column", direction: "up" });

  return createImaginationWorld({
    units,
    connections,
    entities: [
      { id: "die", type: "die", unitId: null, state: { value: 2 } },
      { id: "ship-a", type: "ship", unitId: "sky-c0-r0" },
      { id: "ship-b", type: "ship", unitId: "sky-c1-r0" },
      { id: "city", type: "city", unitId: "sky-c1-r4", state: { hp: 3 } },
    ],
  });
}

function imaginePlacement({ withRandomExtra = false, dieValue = 2 } = {}) {
  const world = buildWorld();
  world.entities.get("die").state.value = dieValue;
  return imagine({
    world,
    actionDefinitions: ACTION_DEFINITIONS,
    glueLinks: withRandomExtra ? [...BASE_GLUE_LINKS, RANDOM_EXTRA_LINK] : BASE_GLUE_LINKS,
    startInvocation: {
      actionId: "place_die",
      input: {
        actorId: "die",
        targetUnitId: "base-c0",
        portPayload: { dieValue },
      },
    },
    goal: { type: "entity_state_at_least", entityId: "city", field: "hp", value: 3 },
  });
}

function imagineDirectRandomDescent() {
  return imagine({
    world: buildWorld(),
    actionDefinitions: ACTION_DEFINITIONS,
    glueLinks: BASE_GLUE_LINKS,
    startInvocation: {
      actionId: "pick_random_other_ship",
      input: {
        seedUnitId: "sky-c0-r0",
        seed: 19,
        excludedId: "ship-a",
        portPayload: { distance: 1, cause: "random_extra" },
      },
    },
  });
}

module.exports = {
  ACTION_DEFINITIONS,
  BASE_GLUE_LINKS,
  RANDOM_EXTRA_LINK,
  buildWorld,
  imagineDirectRandomDescent,
  imaginePlacement,
};

