"use strict";

const assert = require("node:assert/strict");
const GAME = require("./border-village-core");

let state = GAME.createInitialState("verified-winning-route");
let combatCount = 0;
const rarityRank = Object.fromEntries(GAME.RARITY_DATA.map((row, index) => [row.label, index]));

function view() { return GAME.getPlayerObservation(state); }
function actions(kind) { return view().actions.filter((action) => action.kind === kind && action.available !== false); }
function take(action) {
  assert(action, "Missing scripted action");
  if (["combat", "grind"].includes(action.kind)) {
    const plan = GAME.preparePlayerCombat(state, action.id);
    const result = GAME.simulatePlan(plan);
    assert(result.signals.length > 0, "Scripted battle skipped its timeline");
    state = GAME.applyPlayerCombatResult(state, action.id, result);
    combatCount += 1;
    return;
  }
  state = GAME.applyPlayerAction(state, action.id);
}
function takeKind(kind, index = 0) { take(actions(kind)[index]); }
function grind(count) { for (let index = 0; index < count; index += 1) takeKind("grind"); }
function endDay() { takeKind("time"); }
function fullSupplyCombat() { take(actions("combat").sort((a, b) => b.foodCost - a.foodCost)[0]); }

function selectHero(heroId) {
  if (state.selectedHeroId === heroId) return;
  const candidates = state.roster.filter((id) => id !== state.selectedHeroId);
  take(actions("selection")[candidates.indexOf(heroId)]);
}

function equipBestAvailable() {
  for (const heroId of state.roster) {
    selectHero(heroId);
    for (const slot of Object.keys(GAME.SLOT_DATA)) {
      const equipped = new Set(Object.values(state.equipment).flatMap((slots) => Object.values(slots).filter(Boolean)));
      const available = state.inventory.filter((item) => !equipped.has(item.id));
      const best = available.filter((item) => item.slot === slot).sort((a, b) => rarityRank[b.rarity] - rarityRank[a.rarity] || b.power - a.power)[0];
      if (best) take(actions("equipment")[available.findIndex((item) => item.id === best.id)]);
    }
  }
}

takeKind("story");
takeKind("decision");

grind(12);
equipBestAvailable();
takeKind("event", 1);
take(actions("build").find((action) => action.knownCost.gold === 10 && action.knownCost.iron === 5));
fullSupplyCombat();
endDay();

grind(8);
equipBestAvailable();
takeKind("event", 0);
if (actions("recruit").length) takeKind("recruit", Math.min(1, actions("recruit").length - 1));
if (actions("upgrade").length) takeKind("upgrade", 1);
endDay();

grind(15);
equipBestAvailable();
takeKind("event", 0);
fullSupplyCombat();
endDay();

grind(20);
equipBestAvailable();
const foodPurchase = actions("market").find((action) => action.knownCost.gold === 5);
if (foodPurchase) take(foodPurchase);
if (actions("event").length) takeKind("event", Math.min(1, actions("event").length - 1));
while (actions("recruit").length) takeKind("recruit");
endDay();

fullSupplyCombat();
const final = view();
assert(final.result, "Scripted route did not reach a final result");
assert.equal(final.result.win, true, "A deliberate grind/build/recruit route should be able to win");
assert(final.result.combat.enemiesStarted >= 15, "Final battle must remain a large battle after partial raids");
assert(combatCount >= 50, "Route should exercise repeated real equipment-grind battles");

console.log(JSON.stringify({
  status: "PASS",
  result: final.result.title,
  combatsRun: combatCount,
  finalBattle: `${final.result.combat.alliesStarted}v${final.result.combat.enemiesStarted}`,
  survivors: final.result.combat.alliesAlive,
  population: final.result.population,
  militiaUnits: final.result.militiaUnits,
}, null, 2));
