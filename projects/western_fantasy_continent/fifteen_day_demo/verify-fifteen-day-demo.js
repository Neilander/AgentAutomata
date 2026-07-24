"use strict";

const assert = require("node:assert/strict");
const GAME = require("./fifteen-day-core");

function actionByLabel(state, fragment) {
  const observation = GAME.getPlayerObservation(state);
  const action = observation.actions.find((row) => row.label.includes(fragment));
  assert(action, `missing visible action containing: ${fragment}`);
  return action;
}

function verifyObservationCounts() {
  const state = GAME.createInitialState("counts");
  const observation = GAME.getPlayerObservation(state);
  assert.equal(observation.time.day, 1);
  assert.equal(observation.places.filter((place) => place.id.startsWith("place_event_")).length, 2, "day one should open with two events");
  assert(observation.actions.length <= 9, "opening should stay compact");
  for (const place of observation.places) assert.equal(place.actionCount, observation.actions.filter((action) => action.placeId === place.id).length, `actionCount mismatch at ${place.title}`);
  assert(!observation.places.some((place) => place.title.includes("铁匠")), "smith event should not crowd day one");
}

function verifyFreeGrindAndEquipment() {
  let state = GAME.createInitialState("grind");
  const day = state.day;
  const ap = state.ap;
  state = GAME.applyPlayerAction(state, actionByLabel(state, "连续战斗10次").id);
  assert.equal(state.day, day);
  assert.equal(state.ap, ap);
  assert.equal(state.inventory.length, 11);
  const beforePower = GAME.getPlayerObservation(state).party.active[0].visiblePower;
  state = GAME.applyPlayerAction(state, actionByLabel(state, "择优穿戴").id);
  assert(GAME.getPlayerObservation(state).party.active[0].visiblePower >= beforePower);
}

function verifySmithUnlocksInnerRing() {
  let state = GAME.createInitialState("smith-inner-ring");
  state.day = 2;
  state.flags.smithPromise = true;
  state.nodes.smith_intro = { resolved: false, option: "promise" };
  for (let index = 0; index < 3; index += 1) state.inventory.push({ id: `plain_weapon_${index}`, name: `普通武器${index + 1}`, slot: "weapon", slotLabel: "武器", rarity: "普通", power: 5, identityTags: [], source: "测试" });
  state = GAME.applyPlayerAction(state, actionByLabel(state, "把三把普通武器交给铁匠").id);
  const observation = GAME.getPlayerObservation(state);
  assert(state.flags.innerOpen, "铁匠试炉完成后没有打开灰炉内环");
  assert(observation.places.some((place) => place.title === "灰炉内环"), "开门后玩家地图没有出现高级副本");
  assert(observation.actions.some((action) => action.label.includes("在灰炉内环战斗")), "灰炉内环没有可刷行动");

  const oldSave = GAME.createInitialState("smith-old-save");
  oldSave.flags.smithForged = true;
  const migrated = GAME.migrateState(oldSave);
  assert(migrated.flags.innerOpen && GAME.getPlayerObservation(migrated).places.some((place) => place.title === "灰炉内环"), "旧存档没有补开高级副本");
}

function verifyActsAndMassCombat() {
  const state = GAME.createInitialState("mass-combat");
  state.roster = ["player", "shield", "apothecary", "thief", "duelist", "exile", "champion", "priest", "engineer", "mage"];
  state.activeParty = state.roster.slice();
  state.formation = Object.fromEntries(state.activeParty.map((id, index) => [id, index]));
  state.day = 10;
  state.phase = "showdown";
  state.showdownAct = 2;
  state.resources.townFavor = 20;
  const ten = GAME.showdownPlan(state, "hold");
  assert.equal(ten.leftTeam.length, 10);
  assert.equal(ten.rightTeam.length, 10);
  const tenResult = GAME.simulatePlan(ten);
  assert.equal(tenResult.units.length, 20);
  assert(GAME.getPlayerObservation(state).actions.some((action) => action.label.includes("10对10")));

  state.day = 15;
  state.showdownAct = 3;
  state.resources.influence = 20;
  state.flags.bannerCompany = true;
  state.flags.warCouncil = "miners";
  const twenty = GAME.showdownPlan(state, "hold");
  assert.equal(twenty.leftTeam.length, 20);
  assert.equal(twenty.rightTeam.length, 10);
  const twentyResult = GAME.simulatePlan(twenty);
  assert.equal(twentyResult.units.length, 30);
  const finalObservation = GAME.getPlayerObservation(state);
  assert(finalObservation.actions.some((action) => action.label.includes("20对10")));
  assert(finalObservation.places[0].scene.includes("断旗队") && finalObservation.places[0].scene.includes("盟友响应"));
}

function verifyFallbackIsOncePerDay() {
  let state = GAME.createInitialState("patrol-once");
  state.day = 4;
  state.ap = 2;
  state.flags.gateInspected = true;
  state.flags.innerOpen = true;
  for (const event of GAME.EVENTS.filter((row) => row.start <= 4 && row.end >= 4)) state.nodes[event.id] = { resolved: true };
  const patrol = actionByLabel(state, "走访镇民");
  state = GAME.applyPlayerAction(state, patrol.id);
  assert.equal(state.ap, 1);
  assert(!GAME.getPlayerObservation(state).actions.some((action) => action.label.includes("走访镇民")), "fallback should appear at most once per day");
}

function verifyLearnableFirstShowdown() {
  const state = GAME.createInitialState("first-showdown-balance");
  state.day = 5;
  state.phase = "showdown";
  state.showdownAct = 1;
  state.roster = ["player", "shield", "thief", "apothecary"];
  state.activeParty = state.roster.slice();
  state.formation = { player: 0, shield: 1, thief: 2, apothecary: 3 };
  state.flags.campScouted = true;
  for (let index = 0; index < 12; index += 1) {
    const slot = ["weapon", "armor", "charm"][index % 3];
    const hero = state.activeParty[Math.floor(index / 3)];
    const item = { id: `prepared_${index}`, name: `准备装备${index}`, slot, slotLabel: slot, rarity: "史诗", power: 22, identityTags: [], source: "测试" };
    state.inventory.push(item);
    state.equipment[hero][slot] = item.id;
  }
  const result = GAME.simulatePlan(GAME.showdownPlan(state, "ambush"));
  assert(result.metrics.leftAlive > 0 && result.metrics.rightAlive === 0, "a prepared four-person ambush should clear the main first showdown");
}

function verifyTimeAndDefeatContinuation() {
  let state = GAME.createInitialState("calendar");
  for (let day = 1; day <= 5; day += 1) state = GAME.applyPlayerAction(state, actionByLabel(state, "结束本日").id);
  assert.equal(state.phase, "showdown");
  assert.equal(state.showdownAct, 1);
  const fight = GAME.getPlayerObservation(state).actions.find((action) => action.kind === "combat");
  assert(fight);
  state = GAME.applyPlayerAction(state, fight.id);
  assert.equal(state.day, 6);
  assert.equal(state.phase, "planning", "chapter one loss must alter and continue the situation");
  assert(GAME.getPlayerObservation(state).places.some((place) => place.title === "黑石采坑"));
  assert.equal(GAME.getPlayerObservation(state).party.maxActive, 10);
}

function verifyNoFutureEventsInOpening() {
  const text = JSON.stringify(GAME.getPlayerObservation(GAME.createInitialState("sealed")));
  for (const forbidden of ["执法官的宴会", "围剿联盟的无旗使者", "三方争吵的战前会议", "失去军籍的断旗队", "20v10", "politicalRouteAvailable", "volunteerCount"]) assert(!text.includes(forbidden), `opening leaked: ${forbidden}`);
}

verifyObservationCounts();
verifyFreeGrindAndEquipment();
verifySmithUnlocksInnerRing();
verifyActsAndMassCombat();
verifyFallbackIsOncePerDay();
verifyLearnableFirstShowdown();
verifyTimeAndDefeatContinuation();
verifyNoFutureEventsInOpening();
console.log("fifteen-day demo verification passed");
