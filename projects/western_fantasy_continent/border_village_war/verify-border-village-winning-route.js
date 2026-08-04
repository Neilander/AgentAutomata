"use strict";

const assert = require("node:assert/strict");
const GAME = require("./border-village-core");

let state = GAME.createInitialState("verified-winning-route-v3");
let combatCount = 0;
function view() { return GAME.getPlayerObservation(state); }
function available(kind) { return view().actions.filter((row) => row.kind === kind && row.available !== false); }
function take(row) {
  assert(row, "Missing scripted action");
  if (["combat", "grind"].includes(row.kind)) {
    const plan = GAME.preparePlayerCombat(state, row.id);
    const result = GAME.simulatePlan(plan);
    assert(result.signals.length > 0, "Scripted battle skipped its timeline");
    state = GAME.applyPlayerCombatResult(state, row.id, result);
    combatCount += 1;
    return;
  }
  state = GAME.applyPlayerAction(state, row.id);
}
function grind(count) { for (let index = 0; index < count; index += 1) take(available("grind")[0]); }
function endDay() { take(available("time")[0]); }
function equipEveryone() {
  for (const heroId of state.roster) {
    if (state.selectedHeroId !== heroId) take(available("selection").find((row) => row.targetHeroId === heroId));
    take(view().actions.find((row) => row.available && row.operation === "auto_equip" && row.targetHeroId === heroId));
  }
}
function nextRaid() { return available("combat").filter((row) => row.foodCost > 6).sort((a, b) => a.foodCost - b.foodCost)[0]; }
function training() { return available("combat").find((row) => row.foodCost === 6); }

take(available("story")[0]);
take(available("decision")[0]);

grind(15);
equipEveryone();
take(available("event")[0]);
take(available("build").find((row) => row.targetSlot === 5 && row.knownGain.populationCap === 25));
take(available("build").filter((row) => row.targetSlot === 6)[1]);
endDay();

grind(15);
equipEveryone();
take(available("event")[0]);
take(available("recruit").at(-1));
take(nextRaid());
take(available("build").find((row) => row.targetSlot === 7 && row.knownGain.populationCap === 25));
endDay();

grind(15);
equipEveryone();
take(available("event")[1]);
if (available("recruit").length) take(available("recruit").at(-1));
take(nextRaid());
if (training()) take(training());
if (state.ap > 0) take(available("build").find((row) => row.targetSlot === 8 && row.description.includes("粮食")) || available("build")[0]);
endDay();

grind(20);
equipEveryone();
if (available("event").length) take(available("event").at(-1));
while (nextRaid() && state.ap > 0) take(nextRaid());
while (training() && state.ap > 0) take(training());
while (available("recruit").length && state.ap > 0) take(available("recruit").at(-1));
endDay();

equipEveryone();
const finalAction = available("combat")[0];
assert(finalAction.label.includes("支部队可以出战"), "Final action does not explain actual food-covered deployment");
take(finalAction);

const final = view();
assert(final.result?.win, "Deliberate economy, territory, training and equipment route did not win");
assert.equal(final.outposts.length, 3, "Winning route did not control all three known sites");
assert(final.result.trainedUnits >= 1, "Winning route never converted food into troop quality");
assert.equal(final.result.deployedArmy, final.result.totalArmy, "Winning route failed to provision its whole army");
assert(combatCount >= 60, "Winning route did not exercise the unlimited equipment loop");

console.log(JSON.stringify({
  status: "PASS",
  result: final.result.title,
  combatsRun: combatCount,
  capturedOutposts: final.outposts.length,
  finalBattle: `${final.result.combat.alliesStarted}v${final.result.combat.enemiesStarted}`,
  population: final.result.population,
  soldiers: `${final.result.trainedUnits} trained / ${final.result.militiaUnits - final.result.trainedUnits} militia`,
}, null, 2));
