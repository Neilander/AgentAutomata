"use strict";

const assert = require("assert");
const GAME = require("./five-day-raid-core.js");

function act(state, id) {
  assert(GAME.getAllowedActions(state).some((row) => row.id === id), `非法动作 ${id}`);
  return GAME.applyAction(state, id);
}

function grind(state, dungeon, count) {
  let next = state;
  for (let i = 0; i < Math.floor(count / 10); i += 1) next = act(next, `grind:${dungeon}:10`);
  for (let i = 0; i < count % 10; i += 1) next = act(next, `grind:${dungeon}:1`);
  return next;
}

function forceFinal(state) {
  let next = state;
  while (next.phase === "planning") next = act(next, "end_day");
  return next;
}

function addBasicParty(state) {
  let next = act(state, "event:injured_shield:carry");
  next = act(next, "event:apothecary:patients");
  next = act(next, "event:thief_trial:thief");
  next = act(next, "party:add:shield");
  next = act(next, "party:add:apothecary");
  next = act(next, "party:add:thief");
  return next;
}

function sharedPoliticalSetup(seed) {
  let state = addBasicParty(GAME.createInitialState(seed));
  state = grind(state, "outer", 30);
  state = act(state, "auto_equip");
  state = act(state, "event:quartermaster:thief");
  state = act(state, "event:exile:evidence");
  state = act(state, "event:ledger:steal");
  state = grind(state, "inner", 30);
  state = act(state, "auto_equip");
  return state;
}

function runCollapse(seed) {
  let state = sharedPoliticalSetup(seed);
  state = act(state, "event:militia:proof");
  state = act(state, "event:chapel:history");
  state = act(state, "event:duelist:evidence");
  state = act(state, "event:night_raid:scout");
  state = act(state, "event:wall:armor");
  state = act(state, "event:envoy:letter");
  state = forceFinal(state);
  return act(state, "final:collapse").result;
}

function runDuel(seed) {
  let state = sharedPoliticalSetup(seed);
  state = act(state, "event:duelist:evidence");
  state = act(state, "event:night_raid:scout");
  state = act(state, "event:wall:armor");
  state = act(state, "event:envoy:duel");
  state = forceFinal(state);
  return act(state, "final:duel").result;
}

function runAmbush(seed) {
  let state = sharedPoliticalSetup(seed);
  state = act(state, "event:militia:proof");
  state = act(state, "event:chapel:history");
  state = act(state, "event:night_raid:scout");
  state = act(state, "event:wall:armor");
  state = act(state, "event:envoy:letter");
  state = forceFinal(state);
  return act(state, "final:ambush").result;
}

function runDefend(seed) {
  let state = sharedPoliticalSetup(seed);
  state = act(state, "event:militia:proof");
  state = act(state, "event:chapel:history");
  state = act(state, "event:wall:armor");
  state = act(state, "event:evacuation:stores");
  state = forceFinal(state);
  return act(state, "final:defend").result;
}

function basicPartyResult(seed, outerRuns) {
  let state = addBasicParty(GAME.createInitialState(seed));
  state = grind(state, "outer", outerRuns);
  state = act(state, "auto_equip");
  state = forceFinal(state);
  return act(state, "final:field").result;
}

function eventCountsByDay() {
  let state = GAME.createInitialState("day-counts");
  const counts = [];
  while (state.phase === "planning") {
    const nodes = GAME.getVisibleNodes(state);
    counts.push({ day: state.day, openEvents: nodes.filter((node) => node.kind === "event" && node.status === "available").length, legalEventOptions: GAME.getAllowedActions(state).filter((row) => row.id.startsWith("event:")).length });
    state = act(state, "end_day");
  }
  return counts;
}

function run() {
  const seeds = Array.from({ length: 40 }, (_, i) => `matrix-${i + 1}`);
  const routes = { collapse: runCollapse, duel: runDuel, ambush: runAmbush, defend: runDefend };
  const matrix = {};
  for (const [name, route] of Object.entries(routes)) {
    const results = seeds.map((seed) => route(`${name}-${seed}`));
    const combatResults = results.filter((row) => row.combat);
    const durations = combatResults.map((row) => row.combat.duration);
    const survivors = combatResults.map((row) => row.combat.allies.filter((unit) => unit.alive).length);
    matrix[name] = {
      wins: results.filter((row) => row.win).length,
      total: results.length,
      resolution: combatResults.length ? "real_combat" : "political_collapse",
      combatDurationRange: durations.length ? [Math.min(...durations), Math.max(...durations)] : null,
      alliedSurvivorRange: survivors.length ? [Math.min(...survivors), Math.max(...survivors)] : null,
    };
    assert.strictEqual(matrix[name].wins, seeds.length, `${name} 路线必须在配对种子中稳定可行`);
  }
  const weak = seeds.map((seed) => basicPartyResult(`weak-${seed}`, 30));
  const extreme = seeds.map((seed) => basicPartyResult(`extreme-${seed}`, 1000));
  const dayCounts = eventCountsByDay();
  assert.strictEqual(weak.filter((row) => row.win).length, 0, "基础队+30次外环不得乱通");
  assert.strictEqual(extreme.filter((row) => row.win).length, seeds.length, "基础队+1000次外环应保留硬刷胜路");
  assert(dayCounts.every((row) => row.openEvents >= 6), `未处理事件时每天至少6个开放节点：${JSON.stringify(dayCounts)}`);
  const report = {
    result: "PASS",
    pairedSeeds: seeds.length,
    distinctPreparedRoutes: matrix,
    bruteForceBackstops: { basicPartyOuter30Wins: weak.filter((row) => row.win).length, basicPartyOuter1000Wins: extreme.filter((row) => row.win).length },
    eventChoiceFloorWhenUnresolved: dayCounts
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
}

if (require.main === module) run();
module.exports = { run };
