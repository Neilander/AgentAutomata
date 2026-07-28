"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const GAME = require("../fifteen_day_demo/fifteen-day-core.js");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const web = fs.readFileSync(path.join(root, "five-day-raid-web.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

for (const ref of [
  "styles.css",
  "../battle_view/battle-view.css",
  "../game_data/combat-sim.js",
  "../game_data/mechanic-curves.js",
  "../game_data/build-layers.js",
  "../battle_view/battle-view.js",
  "../fifteen_day_demo/fifteen-day-core.js",
  "five-day-raid-web.js",
]) {
  assert(html.includes(ref), `index.html 缺少静态引用：${ref}`);
  assert(fs.existsSync(path.join(root, ref)), `静态文件不存在：${ref}`);
}
assert(html.includes('../../../shared/game_camera_2d/camera-core.js'), "地图没有加载共享 camera 模块");
assert(fs.existsSync(path.resolve(root, "../../../shared/game_camera_2d/camera-core.js")), "共享 camera 模块不存在");
for (const id of ["day-rail", "ap-outside-value", "map-view", "map-viewport", "map-world", "map-node-layer", "quest-rail", "scene-quest-links", "event-popover", "event-popover-close", "combat-view", "battle-mount", "grind-view", "grind-battle-mount", "grind-loot-shelf", "stop-grind", "action-list", "dock-content", "result-dialog", "result-title", "result-body", "combat-preview-dialog", "combat-preview-ranks", "combat-preview-teams", "guild-party-dialog", "guild-party-title", "guild-own-candidates", "guild-guest-candidates", "guild-party-confirm", "recruit-overlay", "recruit-name", "recruit-specialties"]) {
  assert(html.includes(`id="${id}"`), `缺少关键界面挂点：${id}`);
  assert(web.includes(`#${id}`), `网页逻辑未使用关键挂点：${id}`);
}
assert(!/https?:\/\//.test(html), "静态入口不应依赖远程资源");
assert(!/\bfetch\s*\(/.test(web), "静态网页不应依赖服务器 fetch");
assert(css.length > 10000, "界面样式疑似未完整加载");
assert(/\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(css), "场景层可能覆盖战斗层的 hidden 状态");
assert(css.includes("repeat(15") && css.includes("--slot-columns"), "十五日时间轴或动态十人编队样式缺失");

const state = GAME.createInitialState("static-contract");
const view = GAME.getPlayerObservation(state);
assert.strictEqual(view.party.active.length, 1);
assert.equal(view.time.day, 1);
assert.equal(view.places.filter((place) => place.id.startsWith("place_event_")).length, 4, "首日必须有超过三行动点的事件选择");
assert(view.places.find((node) => node.id === "place_gate").status === "locked");
for (const place of view.places) assert.equal(place.actionCount, view.actions.filter((action) => action.placeId === place.id).length, `地点事项数不一致：${place.title}`);
assert(!web.includes("getPlayerView"), "网页仍在调用泄露设计信息的旧视图");
assert(web.includes("getPlayerObservation") && web.includes("applyPlayerAction"), "网页没有使用封口后的玩家接口");
assert(web.includes("preparePlayerCombat") && web.includes("applyPlayerCombatResult"), "网页没有通过正式战斗接口结算战斗");
assert(web.includes("preparePlayerGrindCombat") && web.includes("applyPlayerGrindCombatResult"), "刷装没有通过逐轮真实战斗接口结算");
assert(web.includes('openCombatPreview(grindCombat, "grind")') && web.includes('openCombatPreview(combat, "combat")'), "战斗行动没有先进入敌方称号与阵容预览");
assert(!web.includes("if (grindCombat) return startGrindSession") && !web.includes("if (combat) return startCombat"), "战斗仍会绕过战前预览直接开始");
assert(web.includes("GAME_BATTLE_VIEW.mount") && web.includes("battleView.start"), "网页没有启动共享战斗视图");
assert(web.includes("showActionResult") && web.includes('["event", "inspect"].includes(chosenAction?.kind)'), "非战斗事件没有接入行动结果弹窗");
assert(web.includes("AgentAutomataCamera2D") && web.includes("panByScreen") && web.includes("worldToScreen"), "地图没有通过共享 camera 模块实现拖动与投影");
assert(web.includes("positionEventPopover") && web.includes("data-map-place"), "事件描述与选项没有锚定在地图点位旁");
assert(!html.includes('class="world-panel') && !html.includes('class="action-panel') && !html.includes('class="stage-panel'), "旧三栏地图/描述/选项结构仍然存在");
assert(web.includes("callback-action") && web.includes("旧事回响"), "此前选择打开的特殊机会没有单独显示");
assert(web.includes("selectedQuestId") && web.includes("quest-related") && web.includes("quest-muted"), "任务条目没有接入地图关联视图");
assert(web.includes("knownEffects") && web.includes("futureImpacts"), "行动选项没有显示确定资源影响与受影响任务线");
assert(web.includes("showRecruitOverlay") && css.includes(".recruit-overlay"), "角色加入没有全屏覆盖提示");
assert(web.includes("preparePlayerGuildCombat") && web.includes("guildGuestSelection"), "协会委托没有接入自有/临时成员组队流程");
assert(web.includes("equipPlayerItem") && web.includes("unequipPlayerSlot"), "八部位装备没有接入手动穿脱流程");
assert(!web.includes("择优穿戴") && !web.includes("晋级试炼"), "旧的一键配装或称号试炼仍在界面中");
assert(web.includes("view.inventoryLimit || 200"), "背包页没有显示200件容量上限");
assert(!web.includes("跳过战斗") && !web.includes("skipCombat"), "正式战斗不应提供跳过入口");
assert(web.includes("Array.from({ length: 15 }") && web.includes("view.party.maxActive"), "网页没有接入十五日或动态编队");
assert(!html.includes("未来") && !html.includes("条件不足") && !html.includes("锁定节点"), "静态页面文案仍在预告隐藏节点或条件");
for (const forbidden of ["执法官的宴会", "围剿联盟的无旗使者", "三方争吵的战前会议", "失去军籍的断旗队", "politicalRouteAvailable", "volunteerCount"]) {
  assert(!JSON.stringify(view).includes(forbidden), `首屏玩家观察泄露未来事件：${forbidden}`);
}

assert.equal(view.equipmentSlots.length, 8, "角色不是八个装备部位");
assert.deepEqual(GAME.RARITY_DATA.map((row) => row.affixes), [1, 2, 4, 7, 12], "词条数量没有继承佣兵小镇规则");
assert.deepEqual(view.quests.map((quest) => quest.title), ["白鹿家的报复"], "首屏只能出现玩家已经知道的主线");
const guildActions = view.actions.filter((action) => action.kind === "guild");
assert.equal(guildActions.length, 2, "协会必须同时提供简单和困难委托");
const guildPlan = GAME.preparePlayerGuildCombat(state, guildActions[0].id, ["player"], ["guild_guard"]);
assert(guildPlan && guildPlan.leftTeam.length === 2, "协会委托没有使用玩家选定的队伍");
const linkedState = GAME.createInitialState("static-linked-quests");
linkedState.day = 2;
linkedState.flags.tollNames = true;
const linkedView = GAME.getPlayerObservation(linkedState);
assert(linkedView.quests.some((quest) => quest.id === "three_witnesses"), "取得第一条证据后没有出现关联支线");
assert(linkedView.places.some((place) => place.questLinks.length >= 2), "同一事件不能同时影响多条任务线");

console.log(JSON.stringify({ result: "PASS", mode: "static_file_no_server", campaignDays: 15, visiblePlaces: view.places.length, openingEvents: 4, initialParty: view.party.active.map((hero) => hero.name) }, null, 2));
