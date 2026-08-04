"use strict";

const assert = require("node:assert/strict");
const GAME = require("./border-village-core");

function view(state) { return GAME.getPlayerObservation(state); }
function action(state, predicate, message = "action", includeDisabled = false) {
  const row = view(state).actions.find((candidate) => (includeDisabled || candidate.available !== false) && predicate(candidate));
  assert(row, `Missing ${message}`);
  return row;
}
function take(state, predicate, message) {
  const row = action(state, predicate, message);
  assert(!["combat", "grind"].includes(row.kind), `${message || row.label} must run through real combat`);
  return GAME.applyPlayerAction(state, row.id);
}
function fight(state, predicate, message) {
  const row = action(state, predicate, message);
  const plan = GAME.preparePlayerCombat(state, row.id);
  assert(plan?.leftTeam.length && plan?.rightTeam.length, `Missing combat plan for ${message || row.label}`);
  const result = GAME.simulatePlan(plan);
  assert(result.signals.length > 0, "Combat process has no signal timeline");
  return { state: GAME.applyPlayerCombatResult(state, row.id, result), row, plan, result };
}
function fightUntilWin(state, predicate, message, maxAttempts = 30) {
  let latest = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    latest = fight(state, predicate, `${message} attempt ${attempt}`);
    state = latest.state;
    if (latest.result.metrics.leftAlive > 0 && latest.result.metrics.rightAlive === 0) return { ...latest, state, attempts: attempt };
  }
  assert.fail(`${message} did not produce a victory within ${maxAttempts} retryable attempts`);
}
function reachManagement(seed = "verify-v3") {
  let state = GAME.createInitialState(seed);
  state = take(state, (row) => row.kind === "story", "day-one story");
  state = take(state, (row) => row.kind === "decision", "day-two survivor choice");
  return state;
}
function endDay(state) { return take(state, (row) => row.kind === "time", "end day"); }

function verifyIntroAndInformationBoundary() {
  let state = GAME.createInitialState("intro-v3");
  let current = view(state);
  assert.deepEqual(Object.keys(current.resources).sort(), ["food", "gold", "population", "populationCap"]);
  assert.equal(current.buildings.filter((row) => row.type === "house").length, 1);
  assert.equal(current.buildings.filter((row) => row.type === "farm").length, 1);
  assert.equal(current.buildings.filter((row) => row.type === "smithy").length, 1);
  assert.equal(current.buildings.filter((row) => !row.type).length, 2);
  const lockedGrind = current.actions.find((row) => row.kind === "grind");
  assert(lockedGrind && lockedGrind.available === false && lockedGrind.disabledReason.includes("先完成当前开场剧情"), "Known grind location disappeared instead of remaining visibly locked during the prologue");
  assert.equal(GAME.preparePlayerCombat(state, lockedGrind.id), null, "Locked prologue grind produced a combat plan");
  assert(!JSON.stringify(current).includes("血鼓萨满"), "Day one leaked an undiscovered future site");
  assert(!JSON.stringify(current).includes("披甲战兽栏"), "Day one leaked the hunter's future site");

  state = take(state, (row) => row.kind === "story");
  state = take(state, (row) => row.kind === "decision");
  current = view(state);
  assert.equal(current.time.day, 3);
  assert.equal(current.market.stock.length, 3, "Market must show three fully known gear offers");
  assert.equal(current.actions.filter((row) => row.kind === "build").length, 6, "Two plots should each show house/farm/smithy");
  assert(current.actions.some((row) => row.kind === "grind" && row.available), "Grind location did not unlock after the opening story");
  assert(current.actions.some((row) => row.kind === "combat" && row.label.includes("占领后解锁1个建设位")), "Known raid does not advertise territorial reward");
  assert(current.actions.some((row) => row.kind === "combat" && row.label.includes("实战训练")), "Training battle is not visible");
  assert(!JSON.stringify(current).includes("精钢") && !JSON.stringify(current).includes("铁料"), "Removed material resources remain player-visible");

  let guardState = GAME.createInitialState("wounded-guard-v3");
  guardState = take(guardState, (row) => row.kind === "story", "guard route opening");
  guardState = take(guardState, (row) => row.kind === "decision" && row.label.includes("马库斯"), "wounded guard choice");
  assert.equal(Boolean(guardState.flags.captainBlessed), false, "Saving the wounded guard still grants the captain a hidden stat bonus");
  const guardPlan = GAME.huntPlan(guardState);
  const captain = guardPlan.leftTeam.find((unit) => unit.name.includes("伊莎贝拉"));
  const guard = guardPlan.leftTeam.find((unit) => unit.name.includes("马库斯"));
  assert.equal(guard.small1, captain.small1, "Wounded guard no longer uses the shared knight kit");
  assert(guard.hp < captain.hp && guard.armor < captain.armor, "Wounded guard is not visibly weaker than the healthy knight captain");
}

function verifyImmediateConstructionAndYieldSignals() {
  let state = reachManagement("construction-yields-v3");
  const beforeResources = structuredClone(state.resources);
  const farm = action(state, (row) => row.kind === "build" && row.targetSlot === 5 && row.description.includes("粮食"), "farm construction");
  state = GAME.applyPlayerAction(state, farm.id);
  const built = view(state).buildings.find((row) => row.slot === 5);
  assert.equal(built.type, "farm");
  assert.equal(built.complete, true, "Construction must complete immediately");
  assert.equal(built.yieldLabel, "粮食约 +8—12/日");
  assert.equal(state.ap, 2);
  assert.deepEqual(state.resources, beforeResources, "Construction should spend only action points");

  state = endDay(state);
  assert(state.resources.food - beforeResources.food >= 16 && state.resources.food - beforeResources.food <= 24, "Two farms did not produce their visible combined range");
}

function verifyGrindDifficultyLadder() {
  let state = reachManagement("grind-ladder-v3");
  let current = view(state);
  assert.equal(current.grind.selectedDifficulty, 1);
  assert.equal(current.grind.unlockedDifficulty, 1);
  assert.equal(current.grind.levels.length, 5, "All five difficulty slots must remain visible");
  const lockedTwo = current.actions.find((row) => row.operation === "select_grind_difficulty" && row.targetDifficulty === 2);
  assert(lockedTwo && lockedTwo.available === false && lockedTwo.disabledReason.includes("5场") && lockedTwo.disabledReason.includes("任意难度"), "Difficulty 2 must be visibly locked with its shared total-win requirement");
  assert.throws(() => GAME.applyPlayerAction(state, lockedTwo.id), /胜利达到5场|无法执行|尚未解锁/);

  for (let wins = 0; wins < GAME.GRIND_DIFFICULTIES[1].unlockWinsToNext;) {
    const round = fight(state, (row) => row.kind === "grind", `difficulty 1 clear ${wins + 1}`);
    state = round.state;
    if (round.result.metrics.leftAlive > 0 && round.result.metrics.rightAlive === 0) wins += 1;
  }
  current = view(state);
  assert.equal(current.grind.unlockedDifficulty, 2, "Five victories did not unlock difficulty 2");
  assert.equal(current.grind.selectedDifficulty, 1, "Unlocking a difficulty must not auto-select it");
  assert.equal(current.grind.levels[0].wins, 5);
  assert.deepEqual(current.grind.levels.map((row) => row.unlockAtTotalWins), [0, 5, 10, 30, 50]);
  assert.deepEqual(current.grind.levels[0].rarityChances, [{ rarity: "普通", chance: .9 }, { rarity: "稀有", chance: .1 }]);
  assert.deepEqual(current.grind.levels[2].lootCountChances, [{ count: 1, chance: .25 }, { count: 2, chance: .75 }]);
  assert.deepEqual(current.grind.levels[3].rarityChances, [{ rarity: "普通", chance: .5 }, { rarity: "稀有", chance: .3 }, { rarity: "史诗", chance: .19 }, { rarity: "传说", chance: .01 }]);
  assert.deepEqual(current.grind.levels[4].rarityChances, [{ rarity: "普通", chance: .3 }, { rarity: "稀有", chance: .45 }, { rarity: "史诗", chance: .2 }, { rarity: "传说", chance: .05 }]);
  for (const level of current.grind.levels) {
    assert(Math.abs(level.lootCountChances.reduce((sum, row) => sum + row.chance, 0) - 1) < 1e-9, `Difficulty ${level.difficulty} loot-count chances do not sum to 100%`);
    assert(Math.abs(level.rarityChances.reduce((sum, row) => sum + row.chance, 0) - 1) < 1e-9, `Difficulty ${level.difficulty} rarity chances do not sum to 100%`);
  }

  const selectTwo = current.actions.find((row) => row.operation === "select_grind_difficulty" && row.targetDifficulty === 2);
  state = GAME.applyPlayerAction(state, selectTwo.id);
  let plan = GAME.huntPlan(state);
  assert.equal(plan.grindDifficulty, 2);
  assert.equal(plan.lootTier, 2);
  assert(plan.rightTeam.length > GAME.GRIND_DIFFICULTIES[1].enemies.length, "Difficulty 2 did not become a materially larger encounter");

  state.activeParty = ["player"];
  const failed = fight(state, (row) => row.kind === "grind", "deliberately underpowered difficulty 2");
  assert(failed.result.metrics.rightAlive > 0, "Newly unlocked difficulty 2 is not meaningfully dangerous to an underpowered party");
  assert.equal(view(failed.state).grind.levels[1].wins, 0, "A defeat advanced clear progress");
  state = failed.state;
  const selectOne = view(state).actions.find((row) => row.operation === "select_grind_difficulty" && row.targetDifficulty === 1);
  state = GAME.applyPlayerAction(state, selectOne.id);
  plan = GAME.huntPlan(state);
  assert.equal(plan.grindDifficulty, 1, "Player could not return to an unlocked lower difficulty");
  state.activeParty = state.roster.slice(0, 4);
  let attempts = 0;
  while (state.stats.grindWins < 50 && attempts < 100) {
    const round = fight(state, (row) => row.kind === "grind", `global clear ${state.stats.grindWins + 1}`);
    state = round.state;
    attempts += 1;
  }
  current = view(state);
  assert.equal(current.grind.totalWins, 50, "Global grind victories were not counted across the selected difficulty");
  assert.equal(current.grind.unlockedDifficulty, 5, "Staying on difficulty 1 did not unlock difficulty 5 at 50 total victories");
  assert.equal(current.grind.levels[4].wins, 0, "Global unlock test unexpectedly required wins on difficulty 5");
  assert(GAME.GRIND_DIFFICULTIES[5].lootTier > GAME.GRIND_DIFFICULTIES[1].lootTier && GAME.GRIND_DIFFICULTIES[5].lootCountTable[0][0] > GAME.GRIND_DIFFICULTIES[1].lootCountTable[0][0], "Higher difficulties do not improve loot quality and quantity");
}

function verifySmithLoopAndSimpleMarket() {
  let state = reachManagement("smith-loop-v3");
  state = GAME.applyPlayerAction(state, action(state, (row) => row.kind === "build" && row.targetSlot === 5 && row.description.includes("金币"), "second smithy").id);
  const goldBefore = state.resources.gold;
  for (let wins = 0; wins < 10;) {
    const round = fight(state, (row) => row.kind === "grind", `hunt ${wins + 1}`);
    state = round.state;
    if (round.result.metrics.leftAlive > 0 && round.result.metrics.rightAlive === 0) wins += 1;
  }
  assert.equal(state.economy.dailyGearDrops, 10);
  assert.equal(state.economy.smithGoldPaid, 20, "Two smithies at ten drops should produce 50% of 40 gold");
  assert.equal(state.resources.gold, goldBefore + 20);
  assert(view(state).buildings.filter((row) => row.type === "smithy").every((row) => row.yieldLabel.includes("金币")), "Smithy lacks an approximate yield signal");

  let sold = 0;
  while (sold < 5) {
    const sell = action(state, (row) => row.kind === "market" && row.targetItemId && row.available, `sale ${sold + 1}`);
    state = GAME.applyPlayerAction(state, sell.id);
    sold += 1;
  }
  assert.equal(state.market.sellRemaining, 0);
  const blockedSale = action(state, (row) => row.kind === "market" && row.targetItemId && row.available === false, "visible blocked sixth sale", true);
  assert(blockedSale.disabledReason.includes("已经收购5件"));
  assert.throws(() => GAME.applyPlayerAction(state, blockedSale.id), /已经收购5件/);
}

function verifyTrainingAndFoodGradient() {
  let state = reachManagement("training-food-v3");
  state.resources.food = 20;
  const beforeFood = state.resources.food;
  const trained = fightUntilWin(state, (row) => row.kind === "combat" && row.label.includes("实战训练"), "training battle");
  state = trained.state;
  assert.equal(trained.plan.kind, "training");
  assert.equal(state.resources.food, beforeFood - 6);
  assert.equal(GAME.trainedUnits(state), trained.result.metrics.leftAlive > 0 && trained.result.metrics.rightAlive === 0 ? 1 : 0);

  state.phase = "final";
  state.resources.population = 50;
  state.army.trainedUnits = 2;
  state.resources.food = 5;
  const plan = GAME.finalBattlePlan(state, state.resources.food);
  assert.equal(plan.fullFood, 9, "Two warriors and three militia should require 2*3 + 3*1 food");
  assert.equal(plan.foodCommitted, 5);
  assert.equal(plan.deployedTrained, 1);
  assert.equal(plan.deployedMilitia, 2);
  assert.equal(plan.deployedArmy, 3, "Insufficient food should leave specific units behind, not apply an opaque percentage penalty");
}

function verifyTerritoryCaptureLoop() {
  let state = reachManagement("territory-capture-v3");
  state.resources.food = 100;
  const testWeapon = state.inventory.find((item) => item.id === "starter_sword");
  testWeapon.power = 500;
  testWeapon.equipmentLevel = 500;
  testWeapon.baseStats.physicalPower = 500;
  const raid = fightUntilWin(state, (row) => row.kind === "combat" && row.label.includes("兽人粮秣营"), "first territorial raid");
  state = raid.state;
  assert.equal(raid.plan.foodCommitted, GAME.RAIDS.foragers.baseFood + 3, "Raid food must include three cheap militia escorts");
  assert.equal(raid.result.metrics.rightAlive, 0, "Verification seed failed to capture the first outpost");
  assert(view(state).outposts.some((row) => row.id === "foragers"), "Captured site did not become a controlled outpost");
  const outpostPlot = view(state).buildings.find((row) => row.site === "foragers");
  assert(outpostPlot && !outpostPlot.type, "Captured site did not reveal its empty construction plot");
  const outpostFarm = action(state, (row) => row.kind === "build" && row.targetSlot === outpostPlot.slot && row.description.includes("粮食"), "outpost farm");
  state = GAME.applyPlayerAction(state, outpostFarm.id);
  assert.equal(view(state).buildings.find((row) => row.site === "foragers").type, "farm");
  assert(!JSON.stringify(view(state)).includes("血鼓萨满祭坛"), "Capturing one site leaked an unrelated undiscovered site");
}

function verifyCombatRetryContract() {
  let raidState = reachManagement("retry-contract-raid-v3");
  raidState.activeParty = ["player"];
  raidState.resources.population = 0;
  raidState.resources.food = 50;
  const raidFood = raidState.resources.food;
  const raidAp = raidState.ap;
  const firstRaid = fight(raidState, (row) => row.kind === "combat" && row.label.includes("兽人粮秣营"), "deliberately weak raid");
  assert(firstRaid.result.metrics.rightAlive > 0, "Deliberately weak raid unexpectedly won; retry contract was not exercised");
  assert.equal(firstRaid.state.resources.food, raidFood, "Failed raid consumed food");
  assert.equal(firstRaid.state.ap, raidAp, "Failed raid consumed action points");
  assert.equal(Boolean(firstRaid.state.resolvedRaids.foragers), false, "Failed raid captured the outpost");
  const retryRaid = action(firstRaid.state, (row) => row.kind === "combat" && row.label.includes("兽人粮秣营"), "raid retry");
  const retryRaidPlan = GAME.preparePlayerCombat(firstRaid.state, retryRaid.id);
  assert.notEqual(retryRaidPlan.seed, firstRaid.plan.seed, "Raid retry reused the exact same deterministic battle seed");

  let finalState = reachManagement("retry-contract-final-v3");
  finalState.phase = "final";
  finalState.day = GAME.FINAL_DAY;
  finalState.activeParty = ["player"];
  finalState.resources.population = 0;
  finalState.resources.food = 50;
  const finalFood = finalState.resources.food;
  const firstFinal = fight(finalState, (row) => row.kind === "combat" && row.label.includes("决战"), "deliberately weak final battle");
  assert(firstFinal.result.metrics.rightAlive > 0, "Deliberately weak final battle unexpectedly won; retry contract was not exercised");
  assert.equal(firstFinal.state.resources.food, finalFood, "Failed final battle consumed food");
  assert.equal(firstFinal.state.phase, "final", "Failed final battle ended the run");
  assert.equal(firstFinal.state.result, null, "Failed final battle wrote a terminal result");
  const retryFinal = action(firstFinal.state, (row) => row.kind === "combat" && row.label.includes("决战"), "final retry");
  const retryFinalPlan = GAME.preparePlayerCombat(firstFinal.state, retryFinal.id);
  assert.notEqual(retryFinalPlan.seed, firstFinal.plan.seed, "Final retry reused the exact same deterministic battle seed");
}

function verifyVisibleDisabledActions() {
  const state = reachManagement("disabled-v3");
  state.ap = 0;
  state.resources.gold = 0;
  state.resources.food = 0;
  state.resources.population = state.resources.populationCap;
  state.market.sellRemaining = 0;
  const current = view(state);
  const blockedBuild = current.actions.find((row) => row.kind === "build" && row.available === false);
  const blockedRecruit = current.actions.find((row) => row.kind === "recruit" && row.available === false);
  const blockedTraining = current.actions.find((row) => row.kind === "combat" && row.label.includes("实战训练") && row.available === false);
  const blockedRaid = current.actions.find((row) => row.kind === "combat" && row.label.includes("粮秣营") && row.available === false);
  assert(blockedBuild?.disabledReason.includes("行动力"));
  assert(blockedRecruit?.disabledReason.includes("人口已达上限"));
  assert(blockedTraining?.disabledReason.includes("粮食"));
  assert(blockedRaid?.disabledReason.includes("粮食"));
  assert.equal(GAME.preparePlayerCombat(state, blockedRaid.id), null, "Unavailable raid produced a combat plan");
  assert(!JSON.stringify(current).includes("血鼓萨满祭坛"), "Disabled-state visibility leaked future content");
}

function verifyOneClickEquipmentAndCombatBoundary() {
  let state = reachManagement("equipment-v3");
  const hunt = action(state, (row) => row.kind === "grind", "free hunt");
  assert.throws(() => GAME.applyPlayerAction(state, hunt.id), /战斗必须先完整运行实际战斗过程/);
  const starter = structuredClone(state.inventory[0]);
  state.inventory.push({ ...starter, id: "better_weapon_v3", name: "更好的武器", power: 70, equipmentLevel: 60 });
  const auto = action(state, (row) => row.operation === "auto_equip", "one-click equipment");
  state = GAME.applyPlayerAction(state, auto.id);
  assert.equal(state.equipment.player.weapon, "better_weapon_v3");

  state.inventory.push({ ...starter, id: "captain_weapon_v3", name: "队长备用武器", power: 50, equipmentLevel: 50 });
  const all = action(state, (row) => row.operation === "auto_equip_all", "whole-party one-click equipment");
  state = GAME.applyPlayerAction(state, all.id);
  assert.equal(state.equipment.player.weapon, "better_weapon_v3");
  assert.equal(state.equipment.captain.weapon, "captain_weapon_v3");
}

function verifyExplicitCostsAndFinalReadiness() {
  let recruitState = reachManagement("action-capacity-v3");
  recruitState.resources.population = 39;
  recruitState = take(recruitState, (row) => row.id && row.kind === "recruit" && row.label.includes("6—10"), "population threshold recruitment");
  assert.equal(GAME.actionPointsForPopulation(recruitState.resources.population), 4);
  assert(recruitState.recent.some((row) => row.text.includes("每日行动上限3→4") && row.text.includes("从明日开始")), "Population threshold did not explain the new action cap timing");

  let state = reachManagement("explicit-costs-v3");
  state.day = 5;
  state.flags.beastIntel = false;
  const hunter = action(state, (row) => row.kind === "event" && row.label.includes("八金币"), "hunter event with structured cost");
  assert.deepEqual(hunter.knownCost, { gold: 8 });

  state.phase = "final";
  state.resources.food = 20;
  const final = action(state, (row) => row.kind === "combat" && row.label.includes("决战"), "final readiness");
  assert(final.description.includes("军需官判断") && final.description.includes("名英雄中"), "Final action lacks visible readiness facts");
}

verifyIntroAndInformationBoundary();
verifyImmediateConstructionAndYieldSignals();
verifyGrindDifficultyLadder();
verifySmithLoopAndSimpleMarket();
verifyTrainingAndFoodGradient();
verifyTerritoryCaptureLoop();
verifyCombatRetryContract();
verifyVisibleDisabledActions();
verifyOneClickEquipmentAndCombatBoundary();
verifyExplicitCostsAndFinalReadiness();

console.log(JSON.stringify({
  status: "PASS",
  version: GAME.VERSION,
  checks: [
    "gold/food-only resource surface",
    "initial farm/smithy/house plus two visible plots",
    "permanent grind location with visible prologue lock reason",
    "wounded starter guard uses the shared knight kit at reduced stats without a hidden captain buff",
    "immediate AP-only construction with yield badges",
    "five visible manual grind difficulties unlocked by 5/10/30/50 total wins across any difficulty",
    "equipment drops drive capped smithy gold",
    "three-item market and five-sale daily limit",
    "real training battle upgrades militia to food-costly warriors",
    "captured raid node becomes an on-map construction plot",
    "failed raids and final battles refund costs and remain retryable",
    "visible disabled actions without future-site leakage",
    "real-combat settlement boundary and whole-party one-click equipment",
    "structured event costs and visible final-battle readiness facts",
  ],
}, null, 2));
