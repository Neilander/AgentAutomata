"use strict";

const assert = require("node:assert/strict");
const GAME = require("../fifteen_day_demo/fifteen-day-core.js");

function run() {
  let state = GAME.createInitialState("real-combat-contract");
  state.day = 5;
  state.phase = "showdown";
  state.showdownAct = 1;
  state.roster = ["player", "shield", "thief", "apothecary"];
  state.activeParty = state.roster.slice();
  state.formation = { player: 0, shield: 1, thief: 2, apothecary: 3 };
  const action = GAME.getPlayerObservation(state).actions.find((row) => row.kind === "combat");
  assert(action, "第五日玩家观察缺少真实战斗入口");
  const plan = GAME.preparePlayerCombat(state, action.id);
  assert.equal(plan.leftTeam.length, 4);
  assert.equal(plan.rightTeam.length, 6);
  for (const unit of [...plan.leftTeam, ...plan.rightTeam]) {
    assert(unit.role && unit.small1 && unit.small2 && unit.passive && unit.ultimate, `单位缺少正式战斗配置：${unit.name}`);
  }
  const result = GAME.simulatePlan(plan);
  state = GAME.applyPlayerCombatResult(state, action.id, result);
  assert.equal(state.day, 6, "第五日战果没有推进到第二幕");
  assert.equal(state.phase, "planning", "第五日战果没有恢复规划阶段");
  assert.equal(state.stats.combats, 1, "真实战斗次数没有计入统计");

  const playerView = GAME.getPlayerObservation(state);
  const sealedText = JSON.stringify(playerView);
  for (const forbidden of ["playerScore", "enemyScore", "建议战力", "threshold", "hpScale", "powerScale"]) {
    assert(!sealedText.includes(forbidden), `玩家观察泄露设计侧字段：${forbidden}`);
  }
  assert(playerView.recentSignals.some((line) => line.includes("第五日")), "玩家没有收到第五日战后变化");

  console.log(JSON.stringify({
    result: "PASS",
    engine: "shared_combat_sim",
    showdownUnits: [plan.leftTeam.length, plan.rightTeam.length],
    worldAdvancedAfterCombat: true,
    sealedObservation: true,
  }, null, 2));
}

run();
