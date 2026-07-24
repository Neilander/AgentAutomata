"use strict";

const assert = require("assert");
const GAME = require("./five-day-raid-core.js");

function act(state, id) {
  const allowed = GAME.getAllowedActions(state).map((row) => row.id);
  assert(allowed.includes(id), `动作必须合法：${id}\n当前：${allowed.join(", ")}`);
  return GAME.applyAction(state, id);
}

function forceFinal(state) {
  const copy = JSON.parse(JSON.stringify(state));
  copy.day = 5;
  copy.ap = 0;
  copy.phase = "final";
  return copy;
}

function grindOuter(state, count) {
  let next = state;
  let left = count;
  while (left >= 10) { next = act(next, "grind:outer:10"); left -= 10; }
  while (left > 0) { next = act(next, "grind:outer:1"); left -= 1; }
  return next;
}

function recruitBasicParty(seed, grindCount) {
  let state = GAME.createInitialState(seed);
  if (grindCount) state = grindOuter(state, grindCount);
  state = act(state, "event:injured_shield:carry");
  state = act(state, "event:apothecary:patients");
  state = act(state, "event:thief_trial:thief");
  state = act(state, "party:add:shield");
  state = act(state, "party:add:apothecary");
  state = act(state, "party:add:thief");
  state = act(state, "auto_equip");
  return state;
}

function run() {
  const checks = [];
  let state = GAME.createInitialState("redline");
  const initialPower = GAME.partyPower(state);
  assert.deepStrictEqual(state.roster, ["player"]);
  assert.deepStrictEqual(state.activeParty, ["player"]);
  assert.strictEqual(state.ap, 3);
  assert(GAME.enemyPower(state) > initialPower * 6, "初始单人不能接近硬通护卫队");
  checks.push("开局只有主角，护卫队战力远高于初始单人");

  const beforeAp = state.ap;
  state = act(state, "grind:outer:10");
  assert.strictEqual(state.ap, beforeAp);
  assert.strictEqual(state.day, 1);
  assert.strictEqual(GAME.partyPower(state), initialPower, "掉落未装备时不得增加战力");
  state = act(state, "auto_equip");
  assert(GAME.partyPower(state) > initialPower, "明确装备后应增加战力");
  checks.push("刷装免费且不推进时间；掉落必须显式装备才生效");

  const initialView = GAME.getPlayerObservation(GAME.createInitialState("visibility"));
  assert(GAME.EVENTS.length >= 20, "章节事件总量必须显著大于15次行动");
  assert(initialView.actions.length >= 12, "首日必须有充足选择");
  const inner = initialView.places.find((node) => node.id === "place_king_furnace_door");
  assert(inner && inner.status === "locked", "王炉门应作为看得见的阻挡存在");
  assert(!JSON.stringify(initialView).includes("第3日") && !JSON.stringify(initialView).includes("建议战力"), "初始玩家视图不得预告未来事件或推荐数值");
  assert(!initialView.actions.some((row) => row.label.includes("古代锻造物") || row.label.includes("符文交易") || row.label.includes("守炉甲胄")), "未调查炉门前不得列出答案型行动");
  checks.push("事件总量大于15，但开局只显示已遇见地点与此刻可执行行动");

  let failure = recruitBasicParty("failure-forward", 0);
  failure = act(failure, "end_day");
  failure = act(failure, "investigate:inner_door");
  failure = act(failure, "event:guardian:fight");
  assert(failure.flags.guardianFailed && failure.phase === "planning");
  const cooling = GAME.getVisibleNodes(failure).find((node) => node.id === "cooling");
  assert(cooling && cooling.status === "available", "守炉失败应开放冷却井而不是纯失败");
  checks.push("挑战失败改变局势并开放恢复路线");

  let keyRoute = GAME.createInitialState("key-route");
  keyRoute = grindOuter(keyRoute, 100);
  const ancientCount = keyRoute.inventory.filter((item) => item.identityTags.includes("古代锻造") && item.id !== "item_starter_knife").length;
  assert(ancientCount >= 3, "验证种子应刷出足够古代锻造装备");
  keyRoute = act(keyRoute, "investigate:inner_door");
  keyRoute = act(keyRoute, "event:smith:inspect_lock");
  keyRoute = act(keyRoute, "event:smith:key");
  assert(keyRoute.dungeons.inner, "锻造钥匙应开门");
  assert(!GAME.getAllowedActions(keyRoute).some((row) => row.id === "event:smith:key"), "门已开后不得重复制造钥匙");
  assert(!GAME.getAllowedActions(keyRoute).some((row) => row.id === "event:smith:inspect_lock" || row.id === "event:exile:marks"), "门已开后不得再消耗行动研究开门线索");
  assert(!GAME.getAllowedActions(keyRoute).some((row) => row.id === "event:guardian:fight"), "门已开后不得再花行动点挑战只奖励开门的守卫");
  assert(!GAME.getAllowedActions(keyRoute).some((row) => row.id === "event:exile:rune"), "门已开后不得再购买只奖励开门的符文");
  keyRoute.flags.guardianFailed = true;
  assert(!GAME.getAllowedActions(keyRoute).some((row) => row.id.startsWith("event:cooling:")), "门已开后冷却机关不得继续消耗行动点");
  checks.push("锻造钥匙路线可执行并打开高阶副本");

  let runeRoute = GAME.createInitialState("rune-route");
  runeRoute.resources.gold = 10;
  runeRoute = act(runeRoute, "investigate:inner_door");
  runeRoute = act(runeRoute, "end_day");
  runeRoute = act(runeRoute, "event:exile:marks");
  runeRoute = act(runeRoute, "event:exile:rune");
  assert(runeRoute.dungeons.inner, "流放者符文应开门");
  checks.push("流放者符文路线可执行并打开高阶副本");

  let combatRoute = recruitBasicParty("combat-route", 200);
  combatRoute = act(combatRoute, "end_day");
  combatRoute = act(combatRoute, "investigate:inner_door");
  combatRoute = act(combatRoute, "event:guardian:fight");
  assert(combatRoute.dungeons.inner, "足够强的队伍应能战胜守炉甲胄开门");
  checks.push("守炉挑战路线可执行并打开高阶副本");

  const weakParty = recruitBasicParty("probe30", 30);
  const weakResult = GAME.applyAction(forceFinal(weakParty), "final:field").result;
  assert.strictEqual(weakResult.win, false, "少量外环刷取的基础四人队不能乱通最终战");
  checks.push("基础四人队加少量外环装备仍无法正面乱通");

  let prepared = recruitBasicParty("prepared-route", 150);
  prepared = act(prepared, "end_day");
  prepared = act(prepared, "event:quartermaster:thief");
  prepared = act(prepared, "event:ledger:steal");
  prepared = act(prepared, "event:militia:proof");
  prepared = act(prepared, "end_day");
  prepared = act(prepared, "event:wall:armor");
  prepared = act(prepared, "auto_equip");
  const preparedThreat = GAME.getPlayerView(prepared).threat;
  assert(preparedThreat.removed.includes("本地盾手×2") && !preparedThreat.removed.includes("一名本地盾手"), "同类退出成员必须聚合显示");
  const preparedFinal = forceFinal(prepared);
  const preparedResult = GAME.applyAction(preparedFinal, "final:defend").result;
  assert.strictEqual(preparedResult.win, true, `组合准备路线应能获胜：${JSON.stringify(preparedResult)}`);
  checks.push("装备、队伍、补给破坏、反水和城防能够共同形成稳定胜路");

  let grindOnly = recruitBasicParty("grind-only", 1000);
  const grindResult = GAME.applyAction(forceFinal(grindOnly), "final:field").result;
  assert.strictEqual(grindResult.win, true, "极大量外环刷装应保留超能力硬刷胜路");
  checks.push("极大量免费刷装可硬过，但普通刷取量不足以取代事件准备");

  let clock = GAME.createInitialState("clock");
  for (let i = 0; i < 5; i += 1) {
    assert.strictEqual(clock.day, i + 1);
    clock = act(clock, "end_day");
  }
  assert.strictEqual(clock.phase, "final");
  assert(clock.spentActions <= 15);
  const closedDungeons = GAME.getVisibleNodes(clock).filter((node) => node.kind === "dungeon");
  assert(closedDungeons.every((node) => node.status === "closed" && node.options.every((option) => option.reasons.includes("来袭已经开始"))), "来袭后副本必须关闭并显示统一原因");
  checks.push("五天时间边界与最多15次事件行动成立");

  let intel = GAME.createInitialState("intel-contract");
  intel = act(intel, "event:rumor:pay");
  const intelView = GAME.getPlayerObservation(intel);
  assert(intelView.threatSignals.length >= 5);
  assert(!JSON.stringify(intelView).includes("shield_one") && !JSON.stringify(intelView).includes("legalClaim"), "玩家视图不得泄露护卫内部ID或隐藏态势变量");
  checks.push("付费侦察把可观察消息保留在态势板，但不暴露内部ID和隐藏变量");

  let transfer = GAME.createInitialState("identity-transfer");
  transfer.roster.push("apothecary");
  transfer.activeParty.push("apothecary");
  transfer.equipment.apothecary = { weapon: "noble_test", armor: null, charm: null };
  transfer.inventory.push({ id: "noble_test", name: "旁支礼剑", slot: "weapon", slotLabel: "武器", rarity: "史诗", power: 23, identityTags: ["贵族"], source: "验证" });
  assert(GAME.getAllowedActions(transfer).some((row) => row.id === "equip:noble_test:player" && row.label.includes("转交身份装备")), "已装备身份物品必须可转交主角");
  transfer = act(transfer, "equip:noble_test:player");
  assert.strictEqual(transfer.equipment.player.weapon, "noble_test");
  assert.strictEqual(transfer.equipment.apothecary.weapon, null);
  checks.push("自动分配到其他角色的身份装备可显式转交，不会随机堵死身份路线");

  let duelPreview = GAME.createInitialState("duel-preview");
  duelPreview.flags.duelRight = true;
  duelPreview = forceFinal(duelPreview);
  const duelOption = GAME.finalOptions(duelPreview).find((row) => row.id === "duel");
  assert(duelOption.preview && duelOption.preview.breakdown.includes("你本人对阵护卫队长"));
  assert(!Object.hasOwn(duelOption.preview, "enemyScore"), "真实决斗不得退化成隐藏分数门槛");
  assert(GAME.getAllowedActions(duelPreview).find((row) => row.id === "final:duel").outcome.includes("其他人不得插手"));
  const duelPlayerView = GAME.getPlayerObservation(duelPreview);
  assert(duelPlayerView.actions.some((row) => row.label.includes("荣誉决斗")));
  assert(duelPlayerView.threatSignals.some((row) => row.includes("你本人") && row.includes("一对一")), "决斗资格必须以角色承诺说明一对一参与者");
  assert(!JSON.stringify(duelPlayerView.actions).includes("125") && !JSON.stringify(duelPlayerView.actions).includes("outcome"), "玩家选择前不得看到结算答案");
  checks.push("设计侧可验证荣誉决斗结算，但玩家选择前只看到方案名称");

  const result = { result: "PASS", version: GAME.VERSION, checks, totalEventCount: GAME.EVENTS.length, initialVisiblePlaceCount: initialView.places.length, initialAllowedActions: initialView.actions.length };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (require.main === module) run();
module.exports = { run };
