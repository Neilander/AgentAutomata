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
  assert.equal(observation.places.filter((place) => place.id.startsWith("place_event_")).length, 4, "day one should expose four events in addition to the locked gate");
  assert(new Set(observation.actions.filter((action) => action.actionPointMark).map((action) => action.placeId)).size > 3, "opening needs more actionable nodes than available action points");
  assert(observation.actions.length <= 17, "opening should stay readable despite adding real tradeoffs and two guild quests");
  for (const place of observation.places) assert.equal(place.actionCount, observation.actions.filter((action) => action.placeId === place.id).length, `actionCount mismatch at ${place.title}`);
  assert(!observation.places.some((place) => place.title.includes("铁匠")), "smith event should not crowd day one");
}

function verifyFreeGrindAndEquipment() {
  let state = GAME.createInitialState("grind");
  const day = state.day;
  const ap = state.ap;
  const action = actionByLabel(state, "LV1 · 煤灰废道");
  const plan = GAME.preparePlayerGrindCombat(state, action.id);
  assert(plan, "visible grind action should prepare a real combat");
  const result = GAME.simulatePlan(plan);
  const resolved = GAME.applyPlayerGrindCombatResult(state, action.id, result);
  assert(resolved.outcome.win, "灰炉LV1 should be a reliable solo opening encounter");
  state = resolved.state;
  assert.equal(state.day, day);
  assert.equal(state.ap, ap);
  assert.equal(state.inventory.length, 2);
  const item = resolved.outcome.loot[0];
  state = GAME.equipPlayerItem(state, "player", item.id);
  assert.equal(state.equipment.player[item.slot], item.id, "manual equipment should place the selected item in its exact slot");
  assert.equal(Object.keys(state.equipment.player).length, 8, "every hero should expose eight equipment slots");
}

function verifyQuestLinksAndGuild() {
  let state = GAME.createInitialState("quest-guild");
  let observation = GAME.getPlayerObservation(state);
  assert.equal(observation.guild.quests.length, 2, "the guild should expose both easy and hard quests");
  assert(observation.guild.quests.some((quest) => quest.difficulty === "简单委托"));
  assert(observation.guild.quests.some((quest) => quest.difficulty === "困难委托"));
  const easy = observation.actions.find((action) => action.kind === "guild" && action.label.includes("旧路鼠患"));
  const plan = GAME.preparePlayerGuildCombat(state, easy.id, ["player"], ["guild_guard", "guild_medic"]);
  assert.equal(plan.leftTeam.length, 3);
  assert.equal(plan.rightTeam.length, 3);
  assert.throws(() => GAME.preparePlayerGuildCombat(state, easy.id, ["player"], ["guild_guard", "guild_medic", "guild_scout"]), /最多借用|最多出战/);
  assert(!observation.actions.some((action) => action.label.includes("晋级试炼") || action.label.includes("择优穿戴")), "title trials and auto-equip must be removed");

  observation = GAME.getPlayerObservation(state);
  const evidenceAction = observation.actions.find((action) => action.placeId === "place_event_market_toll" && action.knownEffects.some((effect) => effect.resource === "evidence"));
  state = GAME.applyPlayerAction(state, evidenceAction.id);
  observation = GAME.getPlayerObservation(state);
  state = GAME.applyPlayerAction(state, observation.actions.find((action) => action.endsCurrentDay).id);
  observation = GAME.getPlayerObservation(state);
  assert(observation.quests.some((quest) => quest.id === "three_witnesses"), "the witness task should appear after the player finds the first lead");
  assert(observation.places.some((place) => place.questLinks.length >= 2), "one visible event should be able to affect multiple active quest lines");
}

function verifyActEventCapacity() {
  for (let act = 1; act <= 3; act += 1) {
    const events = GAME.EVENTS.filter((event) => Math.floor((event.start - 1) / 5) + 1 === act);
    assert(events.length > GAME.AP_PER_DAY * 5, `act ${act} needs more event nodes than its fifteen action points`);
    assert.equal(events.length, 18, `act ${act} event pool changed unexpectedly`);
  }

  for (let day = 1; day <= GAME.FINAL_DAY; day += 1) {
    const state = GAME.createInitialState(`daily-choice-${day}`);
    state.day = day;
    state.ap = GAME.AP_PER_DAY;
    const observation = GAME.getPlayerObservation(state);
    const actionPointNodes = new Set(observation.actions.filter((action) => action.actionPointMark).map((action) => action.placeId));
    assert(actionPointNodes.size > GAME.AP_PER_DAY, `day ${day} does not offer more current nodes than the player can clear`);
  }

  for (const event of GAME.EVENTS) {
    for (const option of event.options) {
      const key = `${event.id}:${option.id}`;
      if (!GAME.COMBAT_OPTIONS.has(key)) assert(GAME.EVENT_OUTCOMES[key], `noncombat option lacks specific result feedback: ${key}`);
    }
  }
}

function verifyChoiceSurplusDuringPlayedCampaign() {
  let state = GAME.createInitialState("played-choice-surplus");
  let guard = 0;
  while (!state.result && guard < 200) {
    guard += 1;
    const observation = GAME.getPlayerObservation(state);
    if (state.phase === "showdown") {
      const fight = observation.actions.find((action) => action.kind === "combat");
      assert(fight, `showdown on day ${state.day} lacks a playable combat action`);
      state = GAME.applyPlayerAction(state, fight.id);
      continue;
    }
    if (state.ap === GAME.AP_PER_DAY) {
      const actionPointNodes = new Set(observation.actions.filter((action) => action.actionPointMark).map((action) => action.placeId));
      assert(actionPointNodes.size > GAME.AP_PER_DAY, `played campaign starts day ${state.day} without a real choice surplus`);
    }
    if (state.ap > 0) {
      const action = observation.actions.find((row) => row.actionPointMark);
      assert(action, `played campaign cannot spend action point on day ${state.day}`);
      state = GAME.applyPlayerAction(state, action.id);
    } else {
      const endDay = observation.actions.find((action) => action.endsCurrentDay);
      assert(endDay, `played campaign cannot end day ${state.day}`);
      state = GAME.applyPlayerAction(state, endDay.id);
    }
  }
  assert(state.result, "played choice-surplus route did not finish the fifteen-day campaign");
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
  assert(observation.actions.some((action) => action.kind === "grind" && action.placeId === "place_zone_inner"), "灰炉内环没有可刷行动");

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
  const slots = Object.keys(GAME.SLOT_DATA);
  for (const [heroIndex, hero] of state.activeParty.entries()) {
    for (const [slotIndex, slot] of slots.entries()) {
      const index = heroIndex * slots.length + slotIndex;
      const defensive = ["helm", "chest", "legs", "boots"].includes(slot);
      const item = { id: `prepared_${index}`, name: `准备装备${index}`, slot, slotLabel: GAME.SLOT_DATA[slot].label, rarity: "史诗", power: 22, equipmentLevel: 50, baseStats: defensive ? { maxHp: 120, armor: 5 } : { physicalPower: 28 }, affixes: [{ stat: defensive ? "fortitude" : "might", value: 4, level: 3, category: "major" }], identityTags: [], source: "测试" };
      state.inventory.push(item);
      state.equipment[hero][slot] = item.id;
    }
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

function verifySpecificOutcomeFeedback() {
  let rescued = GAME.createInitialState("feedback-rescue");
  rescued = GAME.applyPlayerAction(rescued, actionByLabel(rescued, "亲自把他背回镇里").id);
  assert(rescued.recent[0].text.includes("赫恩") && rescued.recent[0].text.includes("加入了队伍"), "rescue feedback should state the immediate consequence");
  assert(!rescued.recent[0].text.includes("你处理了"), "specific rescue feedback was covered by a generic event log");

  let smith = GAME.createInitialState("feedback-smith");
  smith.day = 2;
  smith = GAME.applyPlayerAction(smith, actionByLabel(smith, "答应替她收集").id);
  assert(smith.recent[0].text.includes("三把普通武器") && smith.recent[0].text.includes("第四日"), "smith promise should leave the actual task in the newest visible signal");
  assert(!smith.recent[0].text.includes("你处理了"), "smith task feedback was covered by a generic event log");

  let tanner = GAME.createInitialState("feedback-well-tanner");
  tanner = GAME.applyPlayerAction(tanner, actionByLabel(tanner, "支持染匠").id);
  let grower = GAME.createInitialState("feedback-well-grower");
  grower = GAME.applyPlayerAction(grower, actionByLabel(grower, "支持菜农").id);
  assert.notEqual(tanner.recent[0].text, grower.recent[0].text, "different choices at the well should not collapse into the same feedback");
}

function verifyInventoryCapAndSalvage() {
  let state = GAME.createInitialState("inventory-cap");
  for (let index = 0; index < 210; index += 1) {
    const action = actionByLabel(state, "LV1 · 煤灰废道");
    const plan = GAME.preparePlayerGrindCombat(state, action.id);
    const resolved = GAME.applyPlayerGrindCombatResult(state, action.id, GAME.simulatePlan(plan));
    assert(resolved.outcome.win, `灰炉LV1第${index + 1}轮意外战败`);
    state = resolved.state;
  }
  const observation = GAME.getPlayerObservation(state);
  assert.equal(observation.inventoryLimit, 200);
  assert.equal(observation.inventory.length, 200, "inventory should never exceed the playable UI cap");
  assert(observation.salvagedCount > 0, "overflow equipment was not salvaged");
  assert(state.inventory.some((item) => item.id === "starter_knife"), "equipped starter weapon was incorrectly salvaged");
  assert(observation.recentSignals[0].includes("自动分解"), "overflow salvage did not produce visible feedback");
}

function verifyPersistentChoicesAndCallbacks() {
  const actOne = GAME.createInitialState("persistent-act-one");
  actOne.day = 5;
  let observation = GAME.getPlayerObservation(actOne);
  assert(observation.places.some((place) => place.title === "燃烧的驮车"), "multi-day caravan event disappeared before the first showdown");
  assert(observation.actions.filter((action) => ["event", "combat", "inspect"].includes(action.kind)).length > 3, "three action points should compete with more than three current choices");

  const callbackState = GAME.createInitialState("callback-route");
  callbackState.day = 3;
  callbackState.roster.push("thief");
  observation = GAME.getPlayerObservation(callbackState);
  const callback = observation.actions.find((action) => action.label.includes("小偷从排水沟潜入"));
  assert(callback?.callback.includes("鸦指"), "prior recruitment did not mark the newly opened action as a callback");

  const failureCallback = GAME.createInitialState("callback-after-failure");
  failureCallback.day = 7;
  failureCallback.flags.arenaFailed = true;
  observation = GAME.getPlayerObservation(failureCallback);
  assert(observation.actions.find((action) => action.label.includes("卸甲重赛"))?.callback.includes("败战"), "failure-created rematch was not marked as a callback");

  const actTwo = GAME.createInitialState("persistent-act-two");
  actTwo.day = 10;
  observation = GAME.getPlayerObservation(actTwo);
  assert(observation.places.some((place) => place.title === "拒绝下井的矿工"), "act-two event did not remain available through its showdown day");

  const actThree = GAME.createInitialState("persistent-act-three");
  actThree.day = 15;
  observation = GAME.getPlayerObservation(actThree);
  assert(observation.places.some((place) => place.title === "三方争吵的战前会议"), "act-three event did not remain available through the final day");
}

function verifySingleBossPressure() {
  const guardianState = GAME.createInitialState("guardian-pressure");
  guardianState.day = 4;
  guardianState.flags.gateInspected = true;
  const guardian = GAME.eventCombatPlan(guardianState, "furnace_clue", "force");
  assert(guardian.rightTeam[0].maxHp > guardian.leftTeam.reduce((sum, unit) => sum + unit.maxHp, 0), "solo guardian lacks whole-party durability");

  const beastState = GAME.createInitialState("beast-pressure");
  beastState.day = 9;
  beastState.roster = ["player", "shield", "apothecary", "thief", "duelist", "exile", "champion", "priest", "engineer", "mage"];
  beastState.activeParty = beastState.roster.slice();
  beastState.formation = Object.fromEntries(beastState.activeParty.map((id, index) => [id, index]));
  const beast = GAME.eventCombatPlan(beastState, "hunter", "hunt");
  assert(beast.rightTeam[0].maxHp > beast.leftTeam.reduce((sum, unit) => sum + unit.maxHp, 0), "solo act-two beast lacks ten-person durability");
}

verifyObservationCounts();
verifyQuestLinksAndGuild();
verifyActEventCapacity();
verifyChoiceSurplusDuringPlayedCampaign();
verifyFreeGrindAndEquipment();
verifySmithUnlocksInnerRing();
verifyActsAndMassCombat();
verifyFallbackIsOncePerDay();
verifyLearnableFirstShowdown();
verifyTimeAndDefeatContinuation();
verifyNoFutureEventsInOpening();
verifySpecificOutcomeFeedback();
verifyInventoryCapAndSalvage();
verifyPersistentChoicesAndCallbacks();
verifySingleBossPressure();
console.log("fifteen-day demo verification passed");
