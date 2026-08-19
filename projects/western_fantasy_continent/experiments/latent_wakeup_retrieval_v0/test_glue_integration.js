"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  createImaginationWorld,
  imagine,
} = require("../action_attention_chain_v0/imagination_v2/imagination-runtime-v2");

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "artifacts", "glue_recall_manifest.json"), "utf8"),
);
const decisions = new Map(manifest.cases.map((row) => [row.id, row.verified_glue]));

const ACTIONS = [
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
    id: "trigger_bomb",
    operator: "damage",
    tags: ["bomb_trigger"],
    outputPort: "triggered",
  },
  {
    id: "damage_city",
    operator: "damage",
    tags: ["explosion_consequence"],
    outputPort: "damaged",
  },
];

const CONTINUATION_LINKS = [
  {
    id: "triggered-bomb-glues-city-damage",
    from: { actionId: "trigger_bomb", port: "triggered" },
    invoke: { actionId: "damage_city", input: { targetId: "city", amount: 1 } },
  },
];

function buildWorld({ landing = "bomb", bombOnPath = false } = {}) {
  const units = [];
  const connections = [];
  for (let row = 0; row <= 2; row += 1) {
    for (let column = 0; column <= 1; column += 1) {
      const tags = ["sky"];
      if (row === 1 && column === 0 && landing === "bomb") tags.push("bomb");
      if (row === 1 && column === 0 && landing === "arrow") tags.push("arrow_right");
      if (row === 1 && column === 0 && landing === "rune") tags.push("unknown_rune");
      if (row === 1 && column === 0 && bombOnPath) tags.push("bomb");
      units.push({ id: `sky-c${column}-r${row}`, kind: "sky_cell", tags, row, column });
      if (row < 2) connections.push({
        from: `sky-c${column}-r${row}`,
        to: `sky-c${column}-r${row + 1}`,
        kind: "sky_down",
        direction: "down",
      });
    }
    connections.push({
      from: `sky-c0-r${row}`,
      to: `sky-c1-r${row}`,
      kind: "sky_horizontal",
      direction: "right",
    });
  }
  return createImaginationWorld({
    units,
    connections,
    entities: [
      { id: "ship", type: "ship", unitId: "sky-c0-r0" },
      { id: "bomb", type: "bomb", unitId: "sky-c0-r1", state: { hp: 1 } },
      { id: "city", type: "city", unitId: "sky-c1-r2", state: { hp: 3 } },
    ],
  });
}

function recalledLink(decision) {
  if (decision === "bomb_contacted") {
    return {
      id: "latent-wakeup-glues-bomb-trigger",
      from: { actionId: "ship_descend", port: "landed" },
      condition: { "focusUnit.tags": { includes: "bomb" } },
      invoke: { actionId: "trigger_bomb", input: { targetId: "bomb", amount: 1 } },
    };
  }
  if (decision === "arrow_tile_entered") {
    return {
      id: "latent-wakeup-glues-arrow-shift",
      from: { actionId: "ship_descend", port: "landed" },
      condition: { "focusUnit.tags": { includes: "arrow_right" } },
      invoke: {
        actionId: "ship_shift_right",
        input: { actorId: "$port.actorId", distance: 1, cause: "arrow" },
      },
    };
  }
  return null;
}

function runCase({ id, landing, distance = 1, cause = "placed_die", bombOnPath = false, withRecall = true }) {
  const link = withRecall ? recalledLink(decisions.get(id)) : null;
  return imagine({
    world: buildWorld({ landing, bombOnPath }),
    actionDefinitions: ACTIONS,
    glueLinks: [...CONTINUATION_LINKS, ...(link ? [link] : [])],
    startInvocation: {
      actionId: "ship_descend",
      input: { actorId: "ship", distance, cause },
    },
  });
}

function ids(result) {
  return result.trace.map((row) => row.actionId);
}

// Ablation: without latent recall the learned continuation is unavailable.
const noRecall = runCase({ id: "bomb_from_die_placement", landing: "bomb", withRecall: false });
assert.deepEqual(ids(noRecall), ["ship_descend"]);

// Learned local change wakes the link; the ordinary V2 glue runtime then composes onward.
const bomb = runCase({ id: "bomb_from_die_placement", landing: "bomb" });
assert.deepEqual(ids(bomb), ["ship_descend", "trigger_bomb", "damage_city"]);
assert.equal(bomb.imaginedWorld.entities.find((row) => row.id === "city").state.hp, 2);

// The same action and same recalled glue work under a different upstream cause and wording.
const randomBomb = runCase({
  id: "bomb_from_random_extra_move",
  landing: "bomb",
  cause: "random_extra",
});
assert.deepEqual(ids(randomBomb), ["ship_descend", "trigger_bomb", "damage_city"]);

// A different local trend selects a different continuation without changing ship_descend.
const arrow = runCase({ id: "arrow_from_ship_landing", landing: "arrow" });
assert.deepEqual(ids(arrow), ["ship_descend", "ship_shift_right"]);
assert.equal(arrow.imaginedWorld.entities.find((row) => row.id === "ship").unitId, "sky-c1-r1");

// Seeing a bomb along the path is not endpoint contact, so no consequence is glued.
const pathOnly = runCase({
  id: "bomb_visible_on_path_not_endpoint",
  landing: "empty",
  distance: 2,
  bombOnPath: true,
});
assert.deepEqual(ids(pathOnly), ["ship_descend"]);

// Unknown object has no learned continuation and remains unresolved.
const unknown = runCase({ id: "unknown_rune_landing", landing: "rune" });
assert.deepEqual(ids(unknown), ["ship_descend"]);

console.log(JSON.stringify({
  pass: true,
  cases: 6,
  ablationWithoutRecall: ids(noRecall),
  bombChain: ids(bomb),
  reusedUnderRandomCause: ids(randomBomb),
  arrowChain: ids(arrow),
  pathOnly: ids(pathOnly),
  unknown: ids(unknown),
}, null, 2));
