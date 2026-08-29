"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  InformationGapResolver,
  PUBLIC_SLOT_LOCATOR_KNOWLEDGE,
} = require("./information-gap-resolver");

test("known dynamic locator performs one narrow lookup instead of exposing the state space", () => {
  const resolver = new InformationGapResolver({ knowledge: PUBLIC_SLOT_LOCATOR_KNOWLEDGE });
  const result = resolver.resolve({
    missingSlots: ["mothership.row"],
    facts: [
      { path: "mothership.row", value: 3 },
      { path: "player.energy", value: 7 },
    ],
  });
  assert.deepEqual(result.resolved, [{
    slot: "mothership.row", value: 3, source: "knowledge_directed_lookup",
  }]);
  assert.equal(result.attempts[0].targetedLookup.target, "mothership.row");
  assert.equal(result.attempts[0].exploration.attempted, false);
});

test("known village-chief location is answered from learned knowledge", () => {
  const resolver = new InformationGapResolver({ knowledge: [{
    id: "knowledge:village-chief-square",
    query: { slot: "village_chief.location" },
    answer: "village_square",
  }] });
  const result = resolver.resolve({ missingSlots: ["village_chief.location"] });
  assert.equal(result.resolved[0].value, "village_square");
  assert.equal(result.resolved[0].source, "knowledge_answer");
  assert.equal(result.attempts[0].exploration.attempted, false);
});

test("knowledge miss triggers one goal-directed state exploration", () => {
  const resolver = new InformationGapResolver();
  const result = resolver.resolve({
    missingSlots: ["village_chief.location"],
    stateItems: [{
      id: "npc:village-chief",
      tags: ["village_chief", "npc"],
      values: { "village_chief.location": "east_field" },
    }, {
      id: "npc:blacksmith",
      tags: ["blacksmith", "npc"],
      values: { "blacksmith.location": "forge" },
    }],
  });
  assert.equal(result.resolved[0].value, "east_field");
  assert.equal(result.resolved[0].source, "targeted_state_exploration");
  assert.deepEqual(result.attempts[0].exploration.examinedItemIds, ["npc:village-chief"]);
});

test("knowledge and exploration miss create confusion without a terminal status", () => {
  const resolver = new InformationGapResolver();
  const result = resolver.resolve({
    missingSlots: ["village_chief.location"],
    stateItems: [{
      id: "npc:blacksmith", tags: ["blacksmith"], values: { "blacksmith.location": "forge" },
    }],
  });
  assert.equal(result.complete, false);
  assert.equal(result.confusions[0].status, "confused");
  assert.equal(result.confusions[0].value.schema, "unknown_information_v0");
  assert.equal(result.attempts[0].knowledgeQuery.attempted, true);
  assert.equal(result.attempts[0].exploration.attempted, true);
});
