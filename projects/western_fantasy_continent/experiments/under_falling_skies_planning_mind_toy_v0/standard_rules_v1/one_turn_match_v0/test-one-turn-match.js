"use strict";

const assert = require("node:assert/strict");
const ENGINE = require("../standard-engine");
const MAP = require("../fixtures/roswell-threat-0-map");
const { matchOneTurn } = require("./one-turn-match");
const {
  avoidMothershipAdvanceGoal,
  matchCurrentPlacements,
} = require("./ufs-placement-match");

function bomberGoal() {
  return {
    id: "destroy_bomber",
    label: "在这一步摧毁轰炸机",
    assess({ before, after }) {
      const removedHp = before.bomberHp - after.bomberHp;
      return {
        satisfied: after.bomberHp <= 0,
        progress: removedHp / before.bomberHp,
        evidence: [{ type: "bomber_hp_change", before: before.bomberHp, after: after.bomberHp }],
      };
    },
  };
}

function toyActions() {
  return [
    { id: "heavy_attack", label: "重击", damage: 5 },
    { id: "light_attack", label: "轻击", damage: 2 },
    { id: "shield", label: "开盾", damage: 0 },
    { id: "repair_enemy", label: "误修敌机", damage: -1 },
  ];
}

function simulateToy(state, action) {
  return { ...state, bomberHp: Math.max(0, state.bomberHp - action.damage) };
}

function testCompletePartialNoneAndHarmful() {
  const result = matchOneTurn({
    goal: bomberGoal(),
    state: { bomberHp: 4 },
    actions: toyActions(),
    simulate: simulateToy,
  });
  assert.equal(result.exhaustiveOverSuppliedActions, true);
  assert.equal(result.suppliedActionCount, 4);
  assert.equal(result.examinedActionCount, 4);
  assert.deepEqual(result.counts, { complete: 1, partial: 1, none: 1, harmful: 1, invalid: 0 });
  assert.equal(result.best.actionKey, "heavy_attack");
  assert.equal(result.hasDirectMatch, true);
}

function testPartialIsNotPromotedToSuccess() {
  const result = matchOneTurn({
    goal: bomberGoal(),
    state: { bomberHp: 4 },
    actions: toyActions().slice(1, 3),
    simulate: simulateToy,
  });
  assert.equal(result.hasDirectMatch, false);
  assert.equal(result.hasPartialMatch, true);
  assert.equal(result.best.status, "partial");
}

function testNoMatchIsExplicit() {
  const result = matchOneTurn({
    goal: bomberGoal(),
    state: { bomberHp: 4 },
    actions: [toyActions()[2]],
    simulate: simulateToy,
  });
  assert.equal(result.hasDirectMatch, false);
  assert.equal(result.hasPartialMatch, false);
  assert.equal(result.best.status, "none");
}

function testBrokenActionRemainsInAudit() {
  const result = matchOneTurn({
    goal: bomberGoal(),
    state: { bomberHp: 4 },
    actions: [{ id: "broken", label: "不可执行动作" }],
    simulate() { throw new Error("missing target"); },
  });
  assert.equal(result.examinedActionCount, 1);
  assert.equal(result.counts.invalid, 1);
  assert.equal(result.best, null);
  assert.match(result.results[0].error, /missing target/);
}

function testRoswellPlacementEnumerationAndGrounding() {
  const state = ENGINE.createGame(MAP, 301);
  state.mothershipRow = -1;
  state.ships = [{ id: "audit-visible-ship", color: "purple", column: 0, row: 0 }];
  state.dice.forEach((die, index) => {
    die.placed = index >= 2;
    die.value = index === 0 ? 2 : 1;
  });
  state.placements = [
    { id: "prior-c3", column: 2, resolved: false },
    { id: "prior-c4", column: 3, resolved: false },
    { id: "prior-c5", column: 4, resolved: false },
  ];

  const legal = ENGINE.allLegalWorkerPlacements(MAP, state);
  const result = matchCurrentPlacements({ map: MAP, state, goal: avoidMothershipAdvanceGoal() });
  assert.equal(result.suppliedActionCount, legal.length);
  assert.equal(result.examinedActionCount, legal.length);
  assert.equal(new Set(result.results.map((row) => row.actionKey)).size, legal.length);
  assert.equal(result.results.some((row) => row.status === "complete"), true);
  assert.equal(result.results.some((row) => row.status === "harmful"), true);

  const die2 = state.dice[0].id;
  const dangerous = result.results.find((row) => {
    const action = legal[row.inputIndex];
    return action.dieId === die2 && action.column === 0 && action.roomType !== "aa";
  });
  const aaSafe = result.results.find((row) => {
    const action = legal[row.inputIndex];
    return action.dieId === die2 && action.column === 0 && action.roomType === "aa";
  });
  assert.equal(dangerous.status, "harmful", "2点下降落到母舰触发格，必须被识别");
  assert.equal(aaSafe.status, "complete", "AA使下降减1，应避开母舰触发格");
}

function testDuplicateActionsAreRejectedInsteadOfSilentlySkipped() {
  assert.throws(() => matchOneTurn({
    goal: bomberGoal(),
    state: { bomberHp: 4 },
    actions: [{ id: "same", damage: 1 }, { id: "same", damage: 4 }],
    simulate: simulateToy,
  }), /duplicate action key/);
}

const tests = [
  testCompletePartialNoneAndHarmful,
  testPartialIsNotPromotedToSuccess,
  testNoMatchIsExplicit,
  testBrokenActionRemainsInAudit,
  testRoswellPlacementEnumerationAndGrounding,
  testDuplicateActionsAreRejectedInsteadOfSilentlySkipped,
];

for (const test of tests) test();

console.log(JSON.stringify({
  status: "PASS",
  tests: tests.length,
  scope: "single current decision; exhaustive over supplied legal actions; no recursion",
}, null, 2));
