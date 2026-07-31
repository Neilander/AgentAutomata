"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const GAME = require("../border_village_war/border-village-core");
const CAMERA = require("../../../shared/game_camera_2d/camera-core");
const COMBAT = require("../game_data/combat-sim");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const web = fs.readFileSync(path.join(root, "border-village-web.js"), "utf8");
const server = fs.readFileSync(path.join(root, "..", "app", "server", "server.js"), "utf8");
const workbench = fs.readFileSync(path.join(root, "..", "workbench", "index.html"), "utf8");
const battleViewSource = fs.readFileSync(path.join(root, "..", "battle_view", "battle-view.js"), "utf8");

for (const source of [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((source) => !source.startsWith("http"))) {
  assert(fs.existsSync(path.resolve(root, source)), `Missing static dependency: ${source}`);
}

for (const id of [
  "day-rail", "ap-value", "end-day-button", "map-view", "map-viewport", "map-world", "map-node-layer",
  "node-popover", "node-actions", "combat-view", "battle-mount", "combat-result", "grind-view",
  "grind-battle-mount", "grind-loot-shelf", "stop-grind", "command-dock", "dock-toggle", "dock-drawer", "dock-content", "combat-preview-dialog",
  "preview-teams", "preview-confirm", "result-dialog", "recruit-overlay", "restart-dialog",
]) assert(html.includes(`id="${id}"`), `Missing required UI element #${id}`);

assert(html.includes("../../../shared/game_camera_2d/camera-core.js"), "Shared camera module is not loaded");
assert(html.indexOf("../fifteen_day_demo/fifteen-day-core.js") < html.indexOf("../border_village_war/border-village-core.js"), "Gear rule dependency must load before border village core");
assert(web.includes("AgentAutomataCamera2D.createCamera2D") && web.includes("fitBounds") && web.includes("panByScreen"), "Map does not use the shared camera");
assert(web.includes("MAP_PAN_MARGIN_X = 520") && web.includes("MAP_PAN_MARGIN_Y = 340") && web.includes("event.preventDefault()"), "Map drag bounds or pointer handling are missing");
assert(web.includes("GAME.preparePlayerCombat") && web.includes("GAME_BATTLE_VIEW.mount") && web.includes("battleView.start"), "Real combat view integration is incomplete");
assert(web.includes("GAME.applyPlayerCombatResult") && web.includes("commitCombat"), "Battle result is not committed through the game core");
assert(battleViewSource.includes("const authoritativeResult = sim.buildResult()") && !battleViewSource.includes("units: this.state.units,\n        signals: sim.signalBus.signals"), "Battle view still submits display-only units instead of the authoritative simulation result");
assert(!html.includes("跳过战斗") && !web.includes("skipCombat"), "Frontend must not offer combat skipping");
assert(web.includes("一键最高战力") && web.includes('operation === "auto_equip"') && web.includes("autoEquipAction"), "Frontend one-click equipment path is missing");
assert(!html.includes("胜率") || html.includes("不提供胜率"), "Frontend must not expose a win probability");
assert(!web.includes("successChance") && !web.includes("intendedLesson"), "Frontend contains hidden-solution vocabulary");
assert(web.includes("targetSlot") && web.includes("forge-select"), "Building-local actions and compressed forge controls are missing");
assert(web.includes("action.available === false") && web.includes("disabledReason") && web.includes("forge-disabled-reason"), "Frontend hides or fails to explain unavailable actions");
assert(css.includes(".action-card.unavailable") && css.includes(".disabled-reason") && css.includes("#ef8e7e"), "Unavailable actions lack a persistent red visual treatment");
assert(web.includes("targetItemId") && web.includes("data-unequip-action"), "Manual equip/unequip recovery path is missing");
assert(css.includes(".game-shell.combat-mode") && css.includes(".battle-mount .battle-view-field"), "Combat state does not reclaim the screen for the battlefield");
assert(web.includes("INVENTORY_PAGE_SIZE = 24") && web.includes("inventory-prev") && web.includes("inventory-next"), "Inventory pagination is missing");
assert(/\.dock-content\s*\{[^}]*overflow:\s*hidden/.test(css), "Bottom command dock must not become a nested scrolling surface");
assert(/\.inventory-grid\s*\{[^}]*overflow:\s*hidden/.test(css), "Inventory grid must page instead of scrolling");
assert(/grid-template-rows:\s*72px\s+minmax\(0,\s*1fr\)/.test(css), "Map does not own the full space below the header");
assert(/\.command-dock\s*\{[^}]*position:\s*absolute[^}]*transform:\s*translateY\(calc\(100%\s*-\s*42px\)\)/.test(css), "Character equipment panel is not an overlay drawer");
assert(/\.command-dock\.expanded\s*\{[^}]*translateY\(0\)/.test(css), "Overlay drawer has no expanded state");
assert(web.includes("setDockExpanded") && web.includes("dockExpanded") && web.includes('mode !== "campaign"'), "Overlay drawer interaction or combat hiding is missing");
assert(/\.game-shell\s*\{[^}]*height:\s*100dvh[^}]*min-height:\s*0/.test(css), "Game shell still exceeds short browser windows");
assert(!/html, body\s*\{[^}]*min-height:\s*720px/.test(css), "Document still forces a 720px minimum height");
assert(/\.command-dock\s*\{[^}]*height:\s*min\(330px,\s*calc\(100dvh\s*-\s*78px\)\)/.test(css), "Bottom drawer does not adapt to the visible viewport height");
assert(server.includes('"border_village_war"') && server.includes('"border_village_war_web"'), "Workbench server does not expose the border-village program and frontend");
assert(workbench.includes('href="/border_village_war_web/"') && workbench.includes("灰谷村魔物战争"), "Workbench still points the player only at the old raid frontend");
assert(web.includes("minZoom: .26") && web.includes("padding: 28"), "Full-map camera fit still clips the map in a shorter viewport");

const compactCamera = CAMERA.createCamera2D({ viewportWidth: 1054, viewportHeight: 330, x: 700, y: 430, zoom: .7, minZoom: .26, maxZoom: 1.35, worldBounds: { minX: 0, minY: 0, maxX: 1400, maxY: 860 } });
compactCamera.fitBounds({ minX: 0, minY: 0, maxX: 1400, maxY: 860 }, { padding: 28, minZoom: .26, maxZoom: .92 });
const compactTopLeft = compactCamera.worldToScreen({ x: 0, y: 0 });
const compactBottomRight = compactCamera.worldToScreen({ x: 1400, y: 860 });
assert(compactTopLeft.x >= 0 && compactTopLeft.y >= 0 && compactBottomRight.x <= 1054 && compactBottomRight.y <= 330, "Full map is clipped at the minimum supported map height");

const draggableCamera = CAMERA.createCamera2D({ viewportWidth: 1054, viewportHeight: 630, x: 700, y: 430, zoom: .7, minZoom: .26, maxZoom: 1.35, worldBounds: { minX: -520, minY: -340, maxX: 1920, maxY: 1200 } });
draggableCamera.fitBounds({ minX: 0, minY: 0, maxX: 1400, maxY: 860 }, { padding: 28, minZoom: .26, maxZoom: .92 });
const beforeDrag = draggableCamera.snapshot();
draggableCamera.panByScreen(120, 80);
const afterDrag = draggableCamera.snapshot();
assert.notEqual(afterDrag.x, beforeDrag.x, "Horizontal map drag is clamped in place");
assert.notEqual(afterDrag.y, beforeDrag.y, "Vertical map drag is clamped in place");

let state = GAME.createInitialState("static-web-contract");
let observation = GAME.getPlayerObservation(state);
const story = observation.actions.find((action) => action.kind === "story");
state = GAME.applyPlayerAction(state, story.id);
observation = GAME.getPlayerObservation(state);
state = GAME.applyPlayerAction(state, observation.actions.find((action) => action.kind === "decision").id);
observation = GAME.getPlayerObservation(state);
assert.equal(observation.buildings.length, 6);
assert.equal(observation.buildings.filter((building) => building.complete).length, 4);
assert.equal(observation.buildings.filter((building) => !building.type).length, 2);
assert(observation.actions.some((action) => action.kind === "build" && Number.isInteger(action.targetSlot)), "Build action lacks safe plot metadata");
assert(observation.actions.some((action) => action.kind === "grind"));
assert(observation.actions.some((action) => action.kind === "combat"));
assert(observation.actions.some((action) => action.kind === "event"));

const unequip = observation.actions.find((action) => action.kind === "equipment" && action.operation === "unequip" && action.targetItemId === "starter_sword");
assert(unequip, "Equipped starter item cannot be manually removed");
state = GAME.applyPlayerAction(state, unequip.id);
assert.equal(state.equipment.player.weapon, null, "Unequip action did not free the slot");

const combatAction = GAME.getPlayerObservation(state).actions.find((action) => action.kind === "grind");
assert.throws(() => GAME.applyPlayerAction(state, combatAction.id), /战斗必须先完整运行实际战斗过程/);
const plan = GAME.preparePlayerCombat(state, combatAction.id);
const result = GAME.simulatePlan(plan);
assert(result.signals.length > 0, "Static integration contract did not produce a real battle timeline");
const steppedSim = new COMBAT.CombatSimulation({ seed: plan.seed, maxTime: plan.maxTime, healthInterval: 0.5, randomizeStats: false });
steppedSim.time = 0;
steppedSim.nextId = 1;
steppedSim.logs = [];
steppedSim.signalBus.clear();
steppedSim.units = [...steppedSim.makeTeam("left", plan.leftTeam), ...steppedSim.makeTeam("right", plan.rightTeam)];
steppedSim.runtimeField?.setup?.();
while (steppedSim.time < plan.maxTime) {
  steppedSim.update(steppedSim.dt);
  const leftAlive = steppedSim.units.some((unit) => unit.side === "left" && steppedSim.isAlive(unit));
  const rightAlive = steppedSim.units.some((unit) => unit.side === "right" && steppedSim.isAlive(unit));
  if (!leftAlive || !rightAlive) break;
}
const steppedResult = steppedSim.buildResult();
assert.equal(GAME.combatResultFingerprint(steppedResult), GAME.combatResultFingerprint(result), "Frame-stepped battle playback diverges from authoritative settlement");
state = GAME.applyPlayerCombatResult(state, combatAction.id, result);
assert(state.stats.combats === 1 && state.inventory.length >= 2, "Real battle result did not reach persistent game state");

console.log(JSON.stringify({
  status: "PASS",
  files: ["index.html", "styles.css", "border-village-web.js"],
  map: "shared camera + node-local actions",
  combat: "shared battle view + verified result settlement",
  equipment: "eight slots + one-click highest-power loadout + manual override",
  layout: "full-height map + bottom overlay drawer + paged inventory",
  serverStarted: false,
}, null, 2));
