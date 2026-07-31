"use strict";

const assert = require("assert");
const GAME = require("./border-village-core");

function observation(state) { return GAME.getPlayerObservation(state); }

function findAction(state, predicate, message = "action") {
  const action = observation(state).actions.find(predicate);
  assert(action, `Missing ${message}`);
  return action;
}

function apply(state, predicate, message) {
  const action = findAction(state, predicate, message);
  assert(!["combat", "grind"].includes(action.kind), "Combat must use runCombat");
  return GAME.applyPlayerAction(state, action.id);
}

function runCombat(state, predicate, message) {
  const action = findAction(state, predicate, message);
  assert(["combat", "grind"].includes(action.kind), "Expected a combat action");
  const plan = GAME.preparePlayerCombat(state, action.id);
  assert(plan && plan.leftTeam.length && plan.rightTeam.length, "Combat plan must contain both teams");
  const result = GAME.simulatePlan(plan);
  assert(result.signals.length > 0, "A battle must produce a signal timeline");
  return { state: GAME.applyPlayerCombatResult(state, action.id, result), action, plan, result };
}

function reachManagement(seed = "verify") {
  let state = GAME.createInitialState(seed);
  state = apply(state, (action) => action.kind === "story", "day-one story");
  state = apply(state, (action) => action.kind === "decision", "day-two survivor decision");
  return state;
}

function endDay(state) { return apply(state, (action) => action.kind === "time", "end day"); }

function verifyIntroAndManagement() {
  let state = GAME.createInitialState("intro");
  let view = observation(state);
  assert.equal(view.time.day, 1);
  assert.deepEqual(view.actions.map((action) => action.kind), ["story"]);
  assert.equal(view.buildings.filter((row) => row.complete).length, 4);
  assert.equal(view.buildings.filter((row) => !row.type).length, 2);
  assert(!JSON.stringify(view).includes("血鼓萨满"), "Day one must not leak future event or raid names");

  state = apply(state, (action) => action.kind === "story");
  view = observation(state);
  assert.equal(view.time.day, 2);
  assert.equal(view.actions.filter((action) => action.kind === "decision").length, 2);

  state = apply(state, (action) => action.kind === "decision");
  view = observation(state);
  assert.equal(view.time.day, 3);
  assert(view.actions.some((action) => action.kind === "build"));
  assert(view.actions.some((action) => action.kind === "upgrade"));
  assert(view.actions.some((action) => action.kind === "event"));
  assert(view.actions.some((action) => action.kind === "grind"));
  assert(view.actions.some((action) => action.kind === "combat"));
  assert(!JSON.stringify(view).includes("防御工事"), "Removed fortification system must not reappear");
}

function verifyEconomyRules() {
  assert.equal(GAME.actionPointsForPopulation(39), 3);
  assert.equal(GAME.actionPointsForPopulation(40), 4);
  assert.equal(GAME.actionPointsForPopulation(70), 5);
  assert.equal(GAME.actionPointsForPopulation(100), 6);
  assert.equal(GAME.supplyEffect(0, 10), 0.2);
  assert.equal(GAME.supplyEffect(5, 10), 0.6);
  assert.equal(GAME.supplyEffect(10, 10), 1);

  const a = reachManagement("same-seed");
  const b = reachManagement("same-seed");
  assert.deepEqual(a.resources, b.resources, "Same seed must reproduce morning production");
  assert.deepEqual(a.market, b.market, "Same seed must reproduce market stock and liquidity");
  assert(a.resources.food >= 8 && a.resources.food <= 14, "Level-one farm yield outside public range");
  assert(a.market.liquidity >= 12 && a.market.liquidity <= 20, "Level-one market liquidity outside range");
  const foodStock = a.market.stock.find((row) => row.type === "food");
  assert(foodStock && foodStock.price === 5, "Market food price must be fixed");

  let state = reachManagement("construction");
  const build = findAction(state, (action) => action.kind === "build" && action.label.includes("征召所"), "conscription construction");
  state = GAME.applyPlayerAction(state, build.id);
  let built = observation(state).buildings.find((row) => row.type === "conscription");
  assert(built && !built.complete && built.readyDay === 4, "Construction should complete next morning");
  state = endDay(state);
  built = observation(state).buildings.find((row) => row.type === "conscription");
  assert(built.complete && built.level === 1, "Construction did not complete after one day");

  const beforeUpgrade = observation(state).buildings.find((row) => row.type === "farm").level;
  const upgrade = findAction(state, (action) => action.kind === "upgrade" && action.label.includes("农田"), "farm upgrade");
  state = GAME.applyPlayerAction(state, upgrade.id);
  assert.equal(observation(state).buildings.find((row) => row.type === "farm").level, beforeUpgrade + 1, "Upgrade must apply immediately");
}

function verifyCombatBoundaryAndFood() {
  let state = reachManagement("combat-boundary");
  const hunt = findAction(state, (action) => action.kind === "grind");
  assert.throws(() => GAME.applyPlayerAction(state, hunt.id), /战斗必须先完整运行实际战斗过程/);
  const plan = GAME.preparePlayerCombat(state, hunt.id);
  const real = GAME.simulatePlan(plan);
  assert.throws(() => GAME.applyPlayerCombatResult(state, hunt.id, { metrics: { leftAlive: 1, rightAlive: 0 }, units: [], events: [] }), /拒绝结算/);
  const afterHunt = GAME.applyPlayerCombatResult(state, hunt.id, real);
  assert(afterHunt.inventory.length > state.inventory.length, "Successful free hunt should produce loot");
  assert.equal(afterHunt.ap, state.ap, "Free hunt must not consume action points");

  state = afterHunt;
  const raidActions = observation(state).actions.filter((action) => action.kind === "combat");
  assert(raidActions.length >= 2, "Raid should expose distinct supply commitments");
  const outcomes = raidActions.map((action) => {
    const raidPlan = GAME.preparePlayerCombat(state, action.id);
    const result = GAME.simulatePlan(raidPlan);
    return { food: action.foodCost, effect: raidPlan.supplyEffectiveness, enemiesAlive: result.metrics.rightAlive, win: result.metrics.leftAlive > 0 && result.metrics.rightAlive === 0 };
  }).sort((x, y) => x.food - y.food);
  assert(outcomes[0].effect === 0.2, "Zero food must retain the 20% floor");
  assert(outcomes.at(-1).effect > outcomes[0].effect, "More food must visibly improve combat effectiveness");
  assert(outcomes.at(-1).enemiesAlive <= outcomes[0].enemiesAlive, "Fuller supply should not perform worse in deterministic comparison");
}

function verifyOneClickEquipment() {
  let state = reachManagement("one-click-equipment");
  const starter = structuredClone(state.inventory.find((item) => item.id === "starter_sword"));
  const freeWeapon = { ...structuredClone(starter), id: "test_free_weapon", name: "可用强剑", power: 50, equipmentLevel: 60 };
  const freeHelmet = { ...structuredClone(starter), id: "test_free_helmet", name: "可用头盔", slot: "helm", slotLabel: "头盔", power: 30, equipmentLevel: 50 };
  const lockedWeapon = { ...structuredClone(starter), id: "test_locked_weapon", name: "队友神剑", power: 100, equipmentLevel: 100 };
  state.inventory.push(freeWeapon, freeHelmet, lockedWeapon);
  state.equipment.captain.weapon = lockedWeapon.id;
  const auto = findAction(state, (action) => action.operation === "auto_equip" && action.targetHeroId === "player", "one-click equipment");
  assert.equal(auto.actionPointCost, 0);
  state = GAME.applyPlayerAction(state, auto.id);
  assert.equal(state.equipment.player.weapon, freeWeapon.id, "One-click equipment did not choose the best available weapon");
  assert.equal(state.equipment.player.helm, freeHelmet.id, "One-click equipment did not fill an empty slot");
  assert.equal(state.equipment.captain.weapon, lockedWeapon.id, "One-click equipment stole another hero's gear");
  assert(state.recent[0].text.includes("装备战力7→80（+73）"), "One-click equipment did not report its concrete improvement");
  const repeat = findAction(state, (action) => action.operation === "auto_equip" && action.targetHeroId === "player", "repeat one-click equipment");
  state = GAME.applyPlayerAction(state, repeat.id);
  assert(state.recent[0].text.includes("已经穿着当前可用的最高战力装备"), "Repeated one-click equipment should explain that there is no upgrade");
}

function verifyUnavailableActionsRemainVisible() {
  const state = reachManagement("visible-disabled-actions");
  state.ap = 0;
  state.resources.gold = 0;
  state.resources.iron = 0;
  state.resources.steel = 0;
  state.market.liquidity = 0;
  let view = observation(state);
  const blockedBuild = view.actions.find((action) => action.kind === "build" && action.available === false);
  assert(blockedBuild, "Unaffordable construction disappeared instead of remaining visible");
  assert(blockedBuild.disabledReason.includes("行动力") && blockedBuild.disabledReason.includes("资源不足"), "Blocked construction must explain every current shortage");
  assert(view.actions.some((action) => action.kind === "upgrade" && action.available === false && action.disabledReason.includes("精钢")), "Unaffordable upgrade disappeared or lacks a steel reason");
  assert(view.actions.some((action) => action.kind === "event" && action.available === false && action.disabledReason.includes("行动力")), "Current event choices must remain visible after action points run out");
  const blockedRaid = view.actions.find((action) => action.kind === "combat" && action.available === false);
  assert(blockedRaid?.disabledReason.includes("行动力"), "Known raid must remain visible and explain missing action points");
  assert(view.actions.some((action) => action.kind === "market" && action.targetStockId && action.available === false && action.disabledReason.includes("金币")), "Unaffordable market stock must remain visible");
  assert.throws(() => GAME.applyPlayerAction(state, blockedBuild.id), /行动力|资源不足/, "Core accepted an unavailable action");
  assert.equal(GAME.preparePlayerCombat(state, blockedRaid.id), null, "Core prepared an unavailable raid");
  assert(!JSON.stringify(view).includes("血鼓萨满祭坛"), "Visible disabled actions must not reveal a future locked raid");

  state.day = 5;
  state.ap = 3;
  view = observation(state);
  const hunterRecruit = view.actions.find((action) => action.kind === "event" && action.label.includes("八份铁料"));
  const hunterGuide = view.actions.find((action) => action.kind === "event" && action.label.includes("安全山路"));
  assert(hunterRecruit && hunterRecruit.available === false && hunterRecruit.disabledReason.includes("8份铁料"), "Resource-gated event option must remain visible with its exact requirement");
  assert(hunterGuide?.available === true, "Available sibling event option must remain actionable");
}

function verifySmithAndFinalScale() {
  let state = reachManagement("smith-final");
  state.resources.iron = 100;
  state.resources.steel = 20;
  const steelBeforeRefine = state.resources.steel;
  const refine = findAction(state, (action) => action.kind === "smith" && action.knownGain.steel === 1, "steel refining");
  state = GAME.applyPlayerAction(state, refine.id);
  assert.equal(state.resources.steel, steelBeforeRefine + 1, "Smith must provide a deterministic route from iron to steel");
  const forge = findAction(state, (action) => action.kind === "smith" && action.label.includes("打造史诗武器"), "epic forge");
  state = GAME.applyPlayerAction(state, forge.id);
  const forged = state.inventory.at(-1);
  assert(["史诗", "神话"].includes(forged.rarity));
  assert.equal(forged.affixes.length, forged.rarity === "神话" ? 12 : 4, "Forge must retain Mercenary Town affix counts");
  assert.equal(Object.keys(GAME.SLOT_DATA).length, 8, "Characters must use eight equipment slots");

  while (state.day < 6) state = endDay(state);
  const foodBeforeFinalMorning = state.resources.food;
  const farmLevel = observation(state).buildings.find((row) => row.type === "farm").level;
  state = endDay(state);
  const expectedRange = { 1: [8, 14], 2: [14, 20], 3: [21, 27] }[farmLevel];
  assert(state.resources.food - foodBeforeFinalMorning >= expectedRange[0] && state.resources.food - foodBeforeFinalMorning <= expectedRange[1], "Final morning must still harvest the farm");
  assert.equal(state.ap, 0, "Final morning must not grant management actions");
  const finalAction = findAction(state, (action) => action.kind === "combat", "final battle");
  const finalPlan = GAME.preparePlayerCombat(state, finalAction.id);
  assert.equal(finalPlan.kind, "final");
  assert.equal(finalPlan.rightTeam.length, 23, "Untouched final army must contain 20 units and 3 commanders");
  const militiaNames = finalPlan.leftTeam.filter((unit) => unit.unitKind === "militia").map((unit) => unit.name);
  assert.deepEqual(militiaNames, Array.from({ length: GAME.militiaUnits(state) }, (_, index) => `灰谷村民兵第${index + 1}队`), "Militia labels must count from one independently of heroes");
}

verifyIntroAndManagement();
verifyEconomyRules();
verifyCombatBoundaryAndFood();
verifyOneClickEquipment();
verifyUnavailableActionsRemainVisible();
verifySmithAndFinalScale();

console.log(JSON.stringify({
  status: "PASS",
  version: GAME.VERSION,
  checks: [
    "two-day story introduction",
    "four initial buildings plus two player plots",
    "day-three simultaneous management choices",
    "actual-population action points",
    "deterministic random production and market",
    "one-day construction and immediate upgrades",
    "food effectiveness floor and gradient",
    "real-combat-only settlement boundary",
    "free hunt loot without action cost",
    "one-click highest-power equipment without stealing ally gear",
    "visible red-state contract for currently unavailable actions",
    "eight-slot epic/mythic smithing",
    "20-unit plus 3-commander final army",
  ],
}, null, 2));
