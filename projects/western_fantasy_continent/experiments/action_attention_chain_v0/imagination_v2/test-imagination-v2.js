"use strict";

const assert = require("node:assert/strict");
const {
  imagineDirectRandomDescent,
  imaginePlacement,
} = require("./ufs-imagination-case-v2");

function entity(world, id) {
  return world.entities.find((candidate) => candidate.id === id);
}

function testObservedWorldNeverChanges() {
  const result = imaginePlacement();
  assert.equal(entity(result.observedWorld, "die").unitId, null);
  assert.equal(entity(result.observedWorld, "ship-a").unitId, "sky-c0-r0");
  assert.equal(entity(result.observedWorld, "city").state.hp, 3);
  assert.notDeepEqual(result.imaginedWorld, result.observedWorld);
}

function testDescentBuildsPathAttentionBeforeConsequences() {
  const result = imaginePlacement();
  const descent = result.trace.find((row) => row.actionId === "ship_descend");
  assert.deepEqual(descent.attention.anchors, {
    actor: { entityId: "ship-a", unitId: "sky-c0-r0" },
    origin: "sky-c0-r0",
    path: ["sky-c0-r1"],
    endpoint: "sky-c0-r2",
  });
  assert.deepEqual(descent.attention.observationPolicy.visibleUnitIds, ["sky-c0-r0", "sky-c0-r1", "sky-c0-r2"]);
  assert.deepEqual(descent.attention.observationPolicy.consequenceEligibleUnitIds, ["sky-c0-r2"]);
}

function testEndpointGluesArrowThenCityConsequences() {
  const result = imaginePlacement();
  assert.deepEqual(result.trace.map((row) => row.actionId), [
    "place_die",
    "ship_descend",
    "ship_shift_right",
    "damage_city",
    "return_ship_to_waiting",
  ]);
  assert.equal(entity(result.imaginedWorld, "city").state.hp, 2);
  assert.equal(entity(result.imaginedWorld, "ship-a").unitId, "mothership-waiting");
  assert.equal(result.goalMatch.matched, false, "预想结果没有匹配保持城市满血的目标");
}

function testSameDescentActionCanBeGluedFromAnotherUpstream() {
  const placement = imaginePlacement({ withRandomExtra: true });
  const randomDescent = placement.trace.find((row) => (
    row.actionId === "ship_descend" && row.input.cause === "random_extra"
  ));
  assert.ok(randomDescent);
  assert.equal(randomDescent.gluedFrom.linkId, "selected-random-ship-glues-same-descend-action");

  const direct = imagineDirectRandomDescent();
  const directDescent = direct.trace.find((row) => row.actionId === "ship_descend");
  assert.ok(directDescent);
  assert.equal(directDescent.input.actorId, "ship-b");
  assert.equal(directDescent.attention.shape, "directed_path");
}

function testRemovingGlueStopsOnlyThatConsequence() {
  const result = imaginePlacement({ withRandomExtra: false });
  assert.equal(result.trace.filter((row) => row.actionId === "ship_descend").length, 1);
  assert.equal(entity(result.imaginedWorld, "ship-b").unitId, "sky-c1-r0");
}

const tests = [
  testObservedWorldNeverChanges,
  testDescentBuildsPathAttentionBeforeConsequences,
  testEndpointGluesArrowThenCityConsequences,
  testSameDescentActionCanBeGluedFromAnotherUpstream,
  testRemovingGlueStopsOnlyThatConsequence,
];

for (const test of tests) test();

console.log(JSON.stringify({
  status: "PASS",
  tests: tests.length,
  model: "imagined action expansion with reusable glue ports",
}, null, 2));

