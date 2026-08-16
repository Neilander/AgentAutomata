"use strict";

const assert = require("node:assert/strict");
const ENGINE = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/standard-engine");
const MAP = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/synthetic-map");
const ROSWELL_MAP = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-threat-0-map");
const {
  explosionMovesAdjacentColumnRule,
  randomOtherShipRule,
  runEnginePlacementChain,
} = require("./ufs-engine-chain-adapter-v0");

function setup() {
  const state = ENGINE.createGame(MAP, 701);
  state.dice.forEach((die, index) => { die.value = [2, 3, 4, 5, 6][index]; });
  const placement = ENGINE.legalWorkerPlacements(MAP, state, state.dice[0].id)
    .find((row) => row.roomId === "aa-0");
  assert.ok(placement);
  return { state, placement };
}

function stripHistory(state) {
  const copy = structuredClone(state);
  copy.history = [];
  return copy;
}

function ship(state, id) {
  return state.ships.find((candidate) => candidate.id === id);
}

function testNoExtensionExactlyMatchesAuthoritativeEngine() {
  const { state, placement } = setup();
  const expected = ENGINE.applyWorkerPlacement(MAP, state, placement, { rerollMode: "expected" });
  const run = runEnginePlacementChain({ map: MAP, state, placement });
  assert.deepEqual(run.engineState, expected);
  assert.deepEqual(run.adapterAudit, { authoritativeActions: 1, extensionActions: 0, ruleIds: [] });
}

function testAdapterRunsOnEnteredRoswellMap() {
  const state = ENGINE.createGame(ROSWELL_MAP, 811);
  state.dice.forEach((die, index) => { die.value = [2, 3, 4, 5, 6][index]; });
  const placement = ENGINE.legalWorkerPlacements(ROSWELL_MAP, state, state.dice[0].id)
    .find((candidate) => candidate.roomType === "aa" && candidate.column === 0);
  assert.ok(placement);

  const expected = ENGINE.applyWorkerPlacement(ROSWELL_MAP, state, placement, { rerollMode: "expected" });
  const baseline = runEnginePlacementChain({ map: ROSWELL_MAP, state, placement });
  assert.deepEqual(baseline.engineState, expected, "适配器不能改变已录入 Roswell 地图的正式结算");

  const extended = runEnginePlacementChain({
    map: ROSWELL_MAP,
    state,
    placement,
    extensionRules: [randomOtherShipRule({ rows: 1, seed: 19 })],
  });
  assert.equal(extended.adapterAudit.authoritativeActions, 1);
  assert.equal(extended.adapterAudit.extensionActions, 1);
  assert.equal(extended.engineState.history.some((row) => row.type === "extension_ship_moved"), true);
}

function testRandomRuleMovesOneOtherShipAfterRealPlacement() {
  const { state, placement } = setup();
  const baseline = ENGINE.applyWorkerPlacement(MAP, state, placement, { rerollMode: "expected" });
  const run = runEnginePlacementChain({
    map: MAP,
    state,
    placement,
    extensionRules: [randomOtherShipRule({ rows: 1, seed: 19 })],
  });
  const changedOthers = baseline.ships.filter((before) => {
    const after = ship(run.engineState, before.id);
    return before.id !== "purple-0" && after && after.row !== before.row;
  });
  assert.equal(changedOthers.length, 1);
  assert.equal(ship(run.engineState, changedOthers[0].id).row, changedOthers[0].row + 1);
  assert.equal(run.adapterAudit.extensionActions, 1);
}

function testRulesGlueAndRemainOrderIndependent() {
  const { state, placement } = setup();
  // 只给 bonus-random 加候选标签，让“随机选一架”仍由通用选择器执行，
  // 同时把落点固定到 fixture 的 row2/column0 爆炸格，避免测试碰运气。
  state.ships = [
    { id: "purple-0", color: "purple", column: 0, row: 0 },
    { id: "bonus-random", color: "white", column: 0, row: 0, tags: ["random_candidate"] },
    { id: "neighbor", color: "white", column: 1, row: 0 },
  ];
  const random = randomOtherShipRule({ rows: 1, seed: 19, candidateTag: "random_candidate" });
  const adjacent = explosionMovesAdjacentColumnRule({ columnDelta: 1, rows: 1 });

  const composed = runEnginePlacementChain({ map: MAP, state, placement, extensionRules: [random, adjacent] });
  assert.equal(composed.adapterAudit.extensionActions, 2, "随机移动落入爆炸格后，应粘接相邻列移动");
  assert.equal(composed.engineState.history.some((row) => row.type === "extension_adjacent_column_moved"), true);
  assert.equal(ship(composed.engineState, "bonus-random").row, 2);
  assert.equal(ship(composed.engineState, "neighbor").row, 1);

  // 规则声明顺序不承担流程顺序；动作结果才决定下一条规则能否触发。
  const reversed = runEnginePlacementChain({ map: MAP, state, placement, extensionRules: [adjacent, random] });
  assert.deepEqual(reversed.engineState, composed.engineState);

  const withoutBridge = runEnginePlacementChain({ map: MAP, state, placement, extensionRules: [adjacent] });
  assert.equal(withoutBridge.adapterAudit.extensionActions, 0, "没有随机移动这个前置动作，爆炸连锁不能凭空触发");
}

function testRulesAreReusableWithDifferentParameters() {
  const { state, placement } = setup();
  const one = runEnginePlacementChain({
    map: MAP,
    state,
    placement,
    extensionRules: [randomOtherShipRule({ rows: 1, seed: 7 })],
  });
  const two = runEnginePlacementChain({
    map: MAP,
    state,
    placement,
    extensionRules: [randomOtherShipRule({ rows: 2, seed: 7 })],
  });
  const h1 = one.engineState.history.find((row) => row.type === "extension_ship_moved");
  const h2 = two.engineState.history.find((row) => row.type === "extension_ship_moved");
  assert.equal(h1.shipId, h2.shipId);
  assert.equal(h2.to.row - h2.from.row, 2);
  assert.notDeepEqual(stripHistory(one.engineState), stripHistory(two.engineState));
}

const tests = [
  testNoExtensionExactlyMatchesAuthoritativeEngine,
  testAdapterRunsOnEnteredRoswellMap,
  testRandomRuleMovesOneOtherShipAfterRealPlacement,
  testRulesGlueAndRemainOrderIndependent,
  testRulesAreReusableWithDifferentParameters,
];

for (const test of tests) test();

console.log(JSON.stringify({
  status: "PASS",
  tests: tests.length,
  engine: "standard-engine.js",
  validation: "authoritative placement plus composable extension rules",
}, null, 2));
