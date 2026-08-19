"use strict";

const assert = require("node:assert/strict");
const {
  buildAttentionRegion,
  createWorld,
  runActionAttentionChain,
  selectFromRegion,
} = require("./action-attention-runtime");
const { cardEventCase, chessRookCase, ufsPlacementCase } = require("./cases");

function entity(run, id) {
  return run.world.entities.find((item) => item.id === id);
}

function testRegionKeepsInternalAndExternalConnections() {
  const world = createWorld({
    units: [{ id: "a" }, { id: "b" }, { id: "outside" }],
    connections: [
      { from: "a", to: "b", kind: "road", direction: "east" },
      { from: "b", to: "outside", kind: "door", direction: "east" },
    ],
    entities: [],
  });
  const region = buildAttentionRegion(world, {
    mode: "flood",
    seed: "a",
    maxDepth: 1,
    connectionKinds: ["road"],
  });
  assert.deepEqual(new Set(region.unitIds), new Set(["a", "b"]));
  assert.equal(region.internalConnections.length, 1);
  assert.equal(region.externalConnections.length, 1);
  assert.equal(region.externalConnections[0].kind, "door");
}

function testRookSelectorChecksNearestObjectInEachDirection() {
  const scenario = chessRookCase();
  const world = scenario.world;
  const region = buildAttentionRegion(world, {
    mode: "rays",
    seed: "c3",
    directions: ["north", "east", "south", "west"],
    connectionKinds: ["orthogonal"],
  });
  const matches = selectFromRegion(world, region, {
    mode: "nearest_per_direction",
    stopAt: { exists: true },
    keep: { type: "piece", faction: "other" },
  });
  assert.deepEqual(matches.map((row) => row.entityId), ["enemy-north", "enemy-south", "enemy-behind-friend"]);
  assert.equal(matches.some((row) => row.direction === "east"), false, "友方棋子应阻断东侧，不应穿透");

  const run = runActionAttentionChain(scenario);
  assert.equal(entity(run, "enemy-north").removed, true);
  assert.equal(entity(run, "rook").unitId, "c5");
  assert.equal(run.terminal.kind, "other_decision");
}

function testUfsMainChainAndSilentModifier() {
  const scenario = ufsPlacementCase();
  const full = runActionAttentionChain(scenario);
  assert.equal(full.memory["move-ship-purple"], 3);
  assert.equal(entity(full, "ship-purple").unitId, "sky-c0-r3");
  assert.equal(entity(full, "city").state.hp, 3);
  assert.equal(full.terminal.kind, "chain_complete");
  assert.equal(full.trace.some((row) => row.action.type === "adjust" && row.worldChanged === false), true);

  const omitted = runActionAttentionChain({ ...scenario, disabledRuleIds: ["aa-reduces-movement"] });
  assert.equal(omitted.memory["move-ship-purple"], 4);
  assert.equal(entity(omitted, "ship-purple").unitId, "sky-c0-r4");
  assert.equal(entity(omitted, "city").state.hp, 2);
  assert.equal(omitted.terminal.kind, "self_decision");
  assert.deepEqual(omitted.skippedRules, [{ ruleId: "aa-reduces-movement", afterActionIndex: 3 }]);

  const shortMove = ufsPlacementCase();
  shortMove.world.entities.get("die-4").state.value = 1;
  const shortRun = runActionAttentionChain(shortMove);
  assert.equal(shortRun.memory["move-ship-purple"], 1, "路径未到AA格时不能错误套用修正");
  assert.equal(entity(shortRun, "ship-purple").unitId, "sky-c0-r1");
}

function testCardRuleGluesParallelConsequencesAndStopsAtDecision() {
  const run = runActionAttentionChain(cardEventCase());
  assert.equal(entity(run, "event-card-top").state.revealed, true);
  assert.ok(entity(run, "event-marker"), "指示物动作必须已执行");
  assert.equal(entity(run, "event-marker").unitId, "table");
  assert.equal(run.terminal.kind, "other_decision");
  const glue = run.trace[0].activatedRules.find((row) => row.ruleId === "playing-card-glues-two-actions");
  assert.deepEqual(glue.generatedActions.map((action) => action.type), ["reveal", "create"]);
}

function testExplicitBoundaryKinds() {
  const base = {
    world: createWorld({ units: [{ id: "u" }], connections: [], entities: [] }),
    rules: [],
  };
  assert.equal(runActionAttentionChain({ ...base, initialActions: [{ type: "random", reason: "掷骰" }] }).terminal.kind, "random_outcome");
  assert.equal(runActionAttentionChain({ ...base, initialActions: [{ type: "unknown", reason: "忘了规则" }] }).terminal.kind, "knowledge_gap");
  assert.equal(runActionAttentionChain({ ...base, initialActions: [{ type: "decision", owner: "self", reason: "选牌" }] }).terminal.kind, "self_decision");
}

const tests = [
  testRegionKeepsInternalAndExternalConnections,
  testRookSelectorChecksNearestObjectInEachDirection,
  testUfsMainChainAndSilentModifier,
  testCardRuleGluesParallelConsequencesAndStopsAtDecision,
  testExplicitBoundaryKinds,
];

for (const test of tests) test();

console.log(JSON.stringify({
  status: "PASS",
  tests: tests.length,
  cases: ["chess_rook", "ufs_placement", "card_event"],
  verified: [
    "attention region retains units, internal connections, and external connections",
    "selectors inspect graph relations instead of enumerating all actions",
    "rules glue atomic actions into an execution chain",
    "an action may change pending simulation memory without changing the world",
    "self/other/random/knowledge-gap boundaries stop the chain explicitly",
  ],
}, null, 2));
