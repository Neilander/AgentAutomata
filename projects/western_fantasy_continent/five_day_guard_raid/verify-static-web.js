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
  "../battle_view/battle-view.js",
  "../fifteen_day_demo/fifteen-day-core.js",
  "five-day-raid-web.js",
]) {
  assert(html.includes(ref), `index.html 缺少静态引用：${ref}`);
  assert(fs.existsSync(path.join(root, ref)), `静态文件不存在：${ref}`);
}
for (const id of ["day-rail", "area-markers", "place-list", "scene-view", "combat-view", "battle-mount", "action-list", "dock-content"]) {
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
assert.equal(view.places.filter((place) => place.id.startsWith("place_event_")).length, 2, "首日不应塞满事件");
assert(view.places.find((node) => node.id === "place_gate").status === "locked");
for (const place of view.places) assert.equal(place.actionCount, view.actions.filter((action) => action.placeId === place.id).length, `地点事项数不一致：${place.title}`);
assert(!web.includes("getPlayerView"), "网页仍在调用泄露设计信息的旧视图");
assert(web.includes("getPlayerObservation") && web.includes("applyPlayerAction"), "网页没有使用封口后的玩家接口");
assert(web.includes("preparePlayerCombat") && web.includes("applyPlayerCombatResult"), "网页没有通过正式战斗接口结算战斗");
assert(web.includes("GAME_BATTLE_VIEW.mount") && web.includes("battleView.start"), "网页没有启动共享战斗视图");
assert(!web.includes("跳过战斗") && !web.includes("skipCombat"), "正式战斗不应提供跳过入口");
assert(web.includes("Array.from({ length: 15 }") && web.includes("view.party.maxActive"), "网页没有接入十五日或动态编队");
assert(!html.includes("未来") && !html.includes("条件不足") && !html.includes("锁定节点"), "静态页面文案仍在预告隐藏节点或条件");
for (const forbidden of ["执法官的宴会", "围剿联盟的无旗使者", "三方争吵的战前会议", "失去军籍的断旗队", "politicalRouteAvailable", "volunteerCount"]) {
  assert(!JSON.stringify(view).includes(forbidden), `首屏玩家观察泄露未来事件：${forbidden}`);
}

console.log(JSON.stringify({ result: "PASS", mode: "static_file_no_server", campaignDays: 15, visiblePlaces: view.places.length, openingEvents: 2, initialParty: view.party.active.map((hero) => hero.name) }, null, 2));
