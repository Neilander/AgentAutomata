"use strict";

const assert = require("node:assert/strict");
const {
  COMPILED_RULES,
  PLAYER_VISIBLE_RULE_TEXT,
  runCompiledUfs,
} = require("./ufs-rule-ai-compile-v0");

function entity(run, id) {
  return run.world.entities.find((item) => item.id === id);
}

function testNormalRoomUsesFullDieValue() {
  const run = runCompiledUfs({ dieValue: 4, roomTags: [], landingTag: "explosion" });
  assert.equal(run.memory["descent-ship-purple"], 4);
  assert.equal(entity(run, "ship-purple").unitId, "sky-c0-r4");
  assert.equal(entity(run, "city").state.hp, 3, "爆炸格在骰子阶段没有立即伤害");
  assert.equal(run.terminal.kind, "chain_complete");
}

function testAaRoomAdjustsWithoutSkyPathHack() {
  const run = runCompiledUfs({ dieValue: 4, roomTags: ["aa_room"], landingTag: "explosion" });
  assert.equal(run.memory["descent-ship-purple"], 3);
  assert.equal(entity(run, "ship-purple").unitId, "sky-c0-r3");
  assert.equal(run.trace.some((row) => row.action.type === "adjust" && row.worldChanged === false), true);
}

function testSameColumnSelectorMovesEveryShipWithoutIdSpecificRules() {
  const run = runCompiledUfs({ dieValue: 2, roomTags: [], landingTag: "explosion", secondShip: true });
  assert.equal(entity(run, "ship-purple").unitId, "sky-c0-r2");
  assert.equal(entity(run, "ship-white").unitId, "sky-c0-r3");
  assert.equal(run.memory["descent-ship-purple"], 2);
  assert.equal(run.memory["descent-ship-white"], 2);
}

function testOneDieAaClampsToZeroAndDoesNotTriggerLanding() {
  const run = runCompiledUfs({ dieValue: 1, roomTags: ["aa_room"], landingTag: "mothership_down" });
  assert.equal(run.memory["descent-ship-purple"], 0);
  assert.equal(entity(run, "ship-purple").unitId, "sky-c0-r0");
  assert.equal(entity(run, "mothership").unitId, "mothership-r0");
}

function testMothershipLandingGluesMothershipDescentButNotRowAction() {
  const run = runCompiledUfs({ dieValue: 3, roomTags: [], landingTag: "mothership_down" });
  assert.equal(entity(run, "ship-purple").unitId, "sky-c0-r3");
  assert.equal(entity(run, "mothership").unitId, "mothership-r1");
  assert.equal(run.trace.some((row) => row.action.id === "inspect-mothership-row"), true);
  assert.equal(run.trace.some((row) => row.action.id === "resolve-mothership-row-action"), false);
}

function testMothershipSkullEndsInKnownLossNotKnowledgeGap() {
  const run = runCompiledUfs({
    dieValue: 3,
    roomTags: [],
    landingTag: "mothership_down",
    mothershipAtSkullDoor: true,
  });
  assert.equal(run.terminal.kind, "known_outcome");
  assert.equal(run.terminal.outcome, "loss");
}

function testArrowLandingCreatesSecondLandingInspection() {
  const run = runCompiledUfs({ dieValue: 2, roomTags: [], landingTag: "arrow_right" });
  assert.equal(entity(run, "ship-purple").unitId, "sky-c1-r2");
  assert.equal(run.trace.filter((row) => row.action.id === "inspect-landing-ship-purple").length, 2);
}

function testCityHitDamagesAndReturnsShip() {
  const run = runCompiledUfs({ dieValue: 5, roomTags: [], landingTag: "city_hit" });
  assert.equal(entity(run, "city").state.hp, 2);
  assert.equal(entity(run, "ship-purple").unitId, "mothership-waiting");
}

function testWhiteDieStopsAtRandomBoundaryAfterDeterministicConsequences() {
  const run = runCompiledUfs({ dieValue: 2, whiteDie: true, landingTag: "explosion" });
  assert.equal(entity(run, "ship-purple").unitId, "sky-c0-r2");
  assert.equal(run.terminal.kind, "random_outcome");
}

function testCompileIsGroundedInVisibleText() {
  assert.equal(PLAYER_VISIBLE_RULE_TEXT.length, 8);
  assert.equal(COMPILED_RULES.length, 9);
  const serialized = JSON.stringify(COMPILED_RULES);
  assert.equal(serialized.includes("room_value"), false, "不能把未使用的房间阶段规则偷进来");
  assert.equal(serialized.includes("research"), false);
}

const tests = [
  testNormalRoomUsesFullDieValue,
  testAaRoomAdjustsWithoutSkyPathHack,
  testSameColumnSelectorMovesEveryShipWithoutIdSpecificRules,
  testOneDieAaClampsToZeroAndDoesNotTriggerLanding,
  testMothershipLandingGluesMothershipDescentButNotRowAction,
  testMothershipSkullEndsInKnownLossNotKnowledgeGap,
  testArrowLandingCreatesSecondLandingInspection,
  testCityHitDamagesAndReturnsShip,
  testWhiteDieStopsAtRandomBoundaryAfterDeterministicConsequences,
  testCompileIsGroundedInVisibleText,
];

for (const test of tests) test();

console.log(JSON.stringify({
  status: "PASS",
  tests: tests.length,
  sourceRuleSentences: PLAYER_VISIBLE_RULE_TEXT.length,
  compiledRules: COMPILED_RULES.length,
}, null, 2));
