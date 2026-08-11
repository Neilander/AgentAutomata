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
  "day-rail", "town-status-open", "town-name", "town-prosperity", "population-value", "ap-value", "ap-capacity", "town-prosperity-fill", "prosperity-dialog", "prosperity-viewport", "prosperity-track", "prosperity-growth-caption", "prosperity-level-burst", "prosperity-growth-return", "end-day-button", "map-view", "map-viewport", "map-world", "map-node-layer", "map-unit-layer",
  "node-popover", "node-actions", "combat-view", "battle-mount", "combat-result", "grind-view",
  "grind-battle-mount", "grind-loot-shelf", "stop-grind", "command-dock", "dock-toggle", "dock-drawer", "dock-content", "combat-preview-dialog",
  "unit-roster-rail", "equipment-dialog", "equipment-character-panel", "equipment-backpack-panel", "equipment-close", "preview-slide-track", "preview-battle-rule", "preview-formations", "preview-teams", "preview-to-supply", "preview-supply-pot", "preview-supply-fraction", "preview-supply-percent", "preview-back", "preview-supply-reset", "preview-confirm", "result-dialog", "recruit-overlay", "restart-dialog",
]) assert(html.includes(`id="${id}"`), `Missing required UI element #${id}`);

assert(html.includes("../../../shared/game_camera_2d/camera-core.js"), "Shared camera module is not loaded");
assert(html.indexOf("../fifteen_day_demo/fifteen-day-core.js") < html.indexOf("../border_village_war/border-village-core.js"), "Gear rule dependency must load before border village core");
assert(web.includes("AgentAutomataCamera2D.createCamera2D") && web.includes("fitBounds") && web.includes("panByScreen"), "Map does not use the shared camera");
assert(!html.includes('class="village-ground"') && !html.includes('class="decorative-cottage"') && !css.includes(".map-building-art"), "Rejected detailed town scenery or physical building art still clutters the simplified map");
assert(web.includes("function renderWorldUnits") && web.includes("current.party.heroes.map") && web.includes("current.party.militiaUnits.map") && web.includes("BUILDING_PATROL_ROUTES") && !web.includes("TRAINED_WORLD_POSITIONS"), "Simplified world layer should show owned heroes and militia without duplicating trained-unit scenery");
assert(web.includes('class="world-unit hero ${hero.kind}"') && web.includes('class="world-unit militia"') && web.includes('data-equipment-target="${esc(unit.id)}"') && web.includes("ROLE_ICONS[unit.roleKey]") && css.includes(".map-unit-layer") && css.includes(".world-unit-avatar") && css.includes("@keyframes world-unit-idle"), "Map heroes or militia lack compact clickable battle-style avatars");
assert(web.includes("const HERO_PATROL_ROUTES") && web.includes("const MILITIA_PATROL_ROUTES") && web.includes("function buildingPatrolPoints") && web.includes("PLOT_POSITIONS[plotIndex]") && web.includes("function startBuildingPatrols") && web.includes("unit.animate(buildingPatrolFrames(points)") && web.includes('data-building-route="${hero.route}"') && web.includes('data-building-route="${unit.route}"') && web.includes('fullRing: [0, 1, 2, 3, 4, 5, 6, 0]') && web.includes('east: [4, 5, 6, 4]'), "Heroes and militia must move along distinct building-to-building routes derived from plot positions");
assert(web.includes("current.town.prosperity.level * 2") && web.includes("const CIVILIAN_ROUTES") && web.includes('class="town-civilian route-${route.route}"') && css.includes("@keyframes civilian-route-market") && css.includes("@keyframes civilian-route-river") && css.includes("@keyframes civilian-route-field") && css.includes("@keyframes civilian-route-gate"), "Prosperity residents are missing or all share one route");
assert(web.includes("const PLOT_POSITIONS = [[430, 520], [295, 650], [570, 690], [835, 680], [1060, 560], [1020, 405], [865, 300]]") && web.includes("const BUILDING_APPROACH_OFFSETS = [[70, 0], [65, -35], [15, -65]"), "Building patrol stops no longer remain visibly offset from the simplified node cards");
assert(web.includes("current.town") && web.includes("town.prosperity.level") && web.includes('`${town.population}/${town.populationCap}`'), "Top-right town status does not show current town, population/cap, actions, and prosperity");
const resourceStripStart = html.indexOf('class="resource-strip"');
const resourceStripSource = html.slice(resourceStripStart, html.indexOf("</div>", resourceStripStart));
const topbarSource = html.slice(html.indexOf('<header class="topbar">'), html.indexOf("</header>"));
const mapViewSource = html.slice(html.indexOf('<section id="map-view"'), html.indexOf('<div id="map-viewport"'));
assert(html.includes('class="town-status-card"') && !resourceStripSource.includes('id="population-value"'), "Population remains mixed into global resources instead of the current-town status card");
assert(!topbarSource.includes('id="town-status-open"') && mapViewSource.includes('class="map-town-status"') && mapViewSource.includes('id="town-status-open"'), "Current-town status is still inside the top bar instead of below it at the map's upper-right corner");
assert(web.includes("renderProsperityDialog") && web.includes("prosperity.milestones.map") && web.includes("prosperity.nextLevel"), "Prosperity modal does not expose current and future population rewards");
assert(web.includes('prosperityViewport.addEventListener("pointerdown"') && web.includes('prosperityViewport.addEventListener("pointermove"') && web.includes("prosperityViewport.scrollLeft"), "Prosperity timeline cannot be dragged horizontally");
assert(css.includes(".map-town-status") && /\.prosperity-viewport\s*\{[^}]*overflow-x:\s*auto/.test(css) && css.includes(".prosperity-milestone.current") && css.includes(".prosperity-milestone.beyond-cap"), "Town status or prosperity timeline lacks the required visual states");
assert(web.includes("prosperity-axis-population") && web.includes("prosperity-axis-dot") && web.includes("prosperity-axis-rewards") && !web.includes("prosperity-milestone-body"), "Prosperity rewards still render as equal-weight cards instead of a single population axis");
assert(web.includes('"行动力 +1"') && web.includes('"+1 民兵单位"') && /\.prosperity-axis-rewards\s+strong\s*\{[^}]*13px/.test(css) && /\.prosperity-axis-rewards\s+em\s*\{[^}]*8px/.test(css), "Prosperity reward hierarchy does not emphasize action points above the smaller militia reward");
assert(web.includes("isPopulationCap") && web.includes('class="prosperity-cap-gate">人口上限') && css.includes(".prosperity-milestone.population-cap::after") && css.includes(".prosperity-cap-gate"), "Population cap lacks a visible labeled gate across the prosperity axis");
assert(web.includes('action.kind === "recruit"') && web.includes("showPopulationGrowth(before, after)") && web.includes("after.town.population > before.town.population"), "Recruitment still falls through to a generic result instead of the population-axis growth sequence");
assert(web.includes("setProsperityLivePopulation") && web.includes("requestAnimationFrame(animate)") && web.includes("growth-earned") && web.includes("prosperity-growth-return"), "Population growth does not animate along the existing axis or delay the return action until completion");
assert(web.includes("beforeTown.prosperity.level < afterTown.prosperity.level") && web.includes("prosperity-level-burst") && css.includes("@keyframes prosperityLevelBurst"), "Prosperity-level gains lack a distinct emphasized presentation");
assert(css.includes(".prosperity-dialog::backdrop") && css.includes("grayscale(1)") && css.includes(".prosperity-live-marker") && css.includes("@keyframes prosperityRewardEarned"), "Recruitment growth lacks the greyed surroundings, moving population marker, or earned-reward reveal");
assert(/\.prosperity-dialog\.growth-mode::backdrop\s*\{[^}]*rgba\(0,\s*0,\s*0,\s*\.8\)[^}]*backdrop-filter:\s*none/.test(css), "Recruitment growth backdrop is not the requested clean 80% black overlay");
assert(/\.prosperity-dialog\.growth-mode\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/.test(css) && css.includes(".prosperity-dialog.growth-mode .prosperity-window-head") && css.includes(".prosperity-dialog.growth-mode .prosperity-current-summary") && /\.prosperity-dialog\.growth-mode \.prosperity-viewport\s*\{[^}]*border:\s*0[^}]*background:\s*transparent/.test(css), "Recruitment growth still opens the full framed prosperity window instead of the isolated population axis");
assert(web.includes("MAP_PAN_MARGIN_X = 520") && web.includes("MAP_PAN_MARGIN_Y = 340") && web.includes("event.preventDefault()"), "Map drag bounds or pointer handling are missing");
assert(web.includes("GAME.preparePlayerCombat") && web.includes("GAME_BATTLE_VIEW.mount") && web.includes("battleView.start"), "Real combat view integration is incomplete");
assert(web.includes("GAME.applyPlayerCombatResult") && web.includes("commitCombat"), "Battle result is not committed through the game core");
assert(web.includes("COMBAT_FORMATION_RULES") && web.includes('hunt: { label: "小队讨伐", capacity: 4') && web.includes('raid: { label: "据点突袭", capacity: 8') && web.includes('final: { label: "村庄决战", capacity: 20'), "Combat types do not expose their required formation capacities");
assert(web.includes("combatFormationEntries") && web.includes("formation.capacity <= rule.capacity") && web.includes("matches && legal ? 0 : matches ? 1 : 2") && web.includes('["容量兼容且合法", "容量兼容但不合法", "超过人数上限"]'), "Combat formations are not downward-compatible or sorted into the three requested eligibility groups");
assert(web.includes('data-preview-formation') && web.includes("renderCombatFormationPreview") && web.includes("formationDeployment(selected.formation)"), "Combat preview cannot switch between player formations");
assert(web.includes("selected.status.members.reduce") && web.includes("总战斗力") && web.includes("当前选择") && web.includes("敌方情报"), "Selected formation lacks a persistent information area");
assert(web.includes("next.disabled = !selectedPlan") && web.includes("当前编队无法出战") && web.includes("当前资源不足，或编队成员已经无法参加这场战斗"), "Illegal, mismatched, or resource-blocked formations do not remain visible with a reason");
assert(web.includes("plan.deployment") && web.includes("grindSession?.deployment") && web.includes("grindSession.plan.deployment"), "Selected formations do not survive combat settlement or continuous grind rounds");
assert(/\.preview-formation-workspace\s*\{[^}]*grid-template-columns:\s*246px\s+minmax\(0,\s*1fr\)/.test(css) && css.includes(".preview-formation-row.group-1") && css.includes(".preview-formation-row.group-2"), "Combat preview lacks the formation picker and selected-formation detail hierarchy");
assert(html.includes('id="preview-slide-track"') && html.includes('id="preview-to-supply"') && /\.preview-slide-track\.supplying\s*\{[^}]*translateX\(-50%\)/.test(css), "Battle confirmation does not slide from formation selection into supply preparation");
assert(web.includes("openCombatSupplyStage") && web.includes("foodSupplied") && web.includes("performancePct") && web.includes("fullFood"), "Supply preparation is not connected to the authoritative combat plan");
assert(web.includes('addEventListener("pointerdown"') && web.includes("supplyHoldDelay = setTimeout") && web.includes("supplyHoldInterval = setInterval"), "Supply pot lacks click-and-hold food input");
assert(css.includes(".supply-pot") && css.includes("--supply-fill") && css.includes(".preview-supply-counter"), "Supply preparation lacks a readable cauldron, fill state, or x/X and percentage counter");
assert(web.includes("foodCost: unit.kind === \"trained\" ? 3") && web.includes("一战粮耗") && web.includes("粮${rowStatus.foodCost}/战"), "Formation UI does not show per-battle food consumption");
assert(battleViewSource.includes("const authoritativeResult = sim.buildResult()") && !battleViewSource.includes("units: this.state.units,\n        signals: sim.signalBus.signals"), "Battle view still submits display-only units instead of the authoritative simulation result");
assert(!html.includes("跳过战斗") && !web.includes("skipCombat"), "Frontend must not offer combat skipping");
assert(web.includes("一键英雄与战士配装") && web.includes('operation === "auto_equip_all"') && web.includes("autoEquipAllAction"), "Frontend whole-party one-click equipment path is missing");
assert(web.includes("只配当前单位") && web.includes('operation === "auto_equip"') && web.includes("autoEquipAction"), "Frontend single-unit equipment fallback is missing");
assert(web.includes("current.party.equipmentTargets") && web.includes('row.kind === "trained"') && css.includes(".hero-card.trained"), "Trained soldiers are not exposed as distinct equipment targets in the party dock");
assert(!html.includes("胜率") || html.includes("不提供胜率"), "Frontend must not expose a win probability");
assert(!web.includes("successChance") && !web.includes("intendedLesson"), "Frontend contains hidden-solution vocabulary");
assert(web.includes("targetSlot") && web.includes("current.outposts") && web.includes("outpost.plotSlot"), "Building-local actions or captured-outpost construction nodes are missing");
assert(web.includes("CHALLENGE_POSITION") && web.includes("current.challenge") && web.includes("targetChallengeId === current.challenge.id") && web.includes("formationCapacity") && web.includes("fixedNote"), "Ancient-ruins challenge lacks a dedicated map node or stage-specific formation contract");
assert(css.includes(".map-node.challenge") && css.includes(".map-node.challenge.completed") && css.includes("#8f6fa8"), "High-risk challenge node lacks a distinct active and completed visual state");
assert(web.includes("action.available === false") && web.includes("disabledReason"), "Frontend hides or fails to explain unavailable actions");
assert(css.includes(".action-card.unavailable") && css.includes(".disabled-reason") && css.includes("#ef8e7e"), "Unavailable actions lack a persistent red visual treatment");
assert(css.includes(".rarity-border-神话") && css.includes(".loot-cell.rarity-神话") && css.includes("@keyframes mythic-cell-sweep") && css.includes("@keyframes mythic-cell-pulse") && css.includes("linear-gradient(112deg") && css.includes("radial-gradient(circle at 18% 16%") && web.includes('rarity-border-${esc(item.rarity)}'), "Mythic equipment cells lack full-cell red iridescence, shimmer, or shared inventory/equipped-slot treatment");
assert(["永恒", "黑金", "炼狱"].every((rarity) => css.includes(`.rarity-border-${rarity}`) && css.includes(`.loot-cell.rarity-${rarity}`) && css.includes(`.rarity-${rarity}`)), "Eternal, black-gold, or infernal rarity visuals are missing from loot, inventory, or equipped cells");
assert(css.includes("@keyframes eternal-cell-sweep") && css.includes("@keyframes blackgold-cell-sweep") && css.includes("@keyframes infernal-cell-flame") && css.includes("#dff8ff") && css.includes("#e8c76c") && css.includes("#ff6a31"), "High-rarity cells do not preserve their distinct blue-white, black-gold, and infernal visual identities");
assert(css.includes("#4f9ec8 51%") && css.includes("animation: eternal-cell-sweep 4.4s") && css.includes("50% { opacity: .72; }") && !css.includes("#d9f5ff 51%"), "Eternal cells still contain a fixed white center stripe instead of a restrained moving highlight");
assert(css.includes(".portrait-equipment-slot.rarity-border-永恒 > i") && css.includes(".portrait-equipment-slot.rarity-border-黑金 > i") && css.includes(".portrait-equipment-slot.rarity-border-炼狱 > i") && !web.includes('<small>${esc(slot.slotLabel)}</small>') && !css.includes(".portrait-equipment-slot > small"), "Portrait equipment slots still render permanent text instead of icon-only slots with hover details");
assert(web.includes("yield-badge") && css.includes(".map-node .yield-badge"), "Resource buildings lack compact on-map yield signals");
assert(web.includes("visibleGrind") && web.includes("ui:grind-unavailable") && web.includes("地点已知 · 暂时不能出发"), "Known grind location can disappear when its action is temporarily unavailable");
assert(web.includes("renderGrindDifficultyPanel") && web.includes("select_grind_difficulty") && web.includes("全部难度已解锁"), "Grind node lacks the visible manual five-difficulty progression panel");
assert(web.includes("lootCountLabel") && web.includes("rarityLabel") && web.includes("grind.nextUnlockScore") && web.includes("难度N胜利一次获得N积分") && web.includes("5/20/90/200积分"), "Grind panel does not expose exact drop odds and weighted shared unlock score");
assert(css.includes(".grind-level.locked") && css.includes(".grind-progress") && css.includes("#78463e"), "Locked grind difficulties or their progress bar lack persistent visual treatment");
assert(web.includes("今日装备") && web.includes("铁匠收入") && web.includes("current.economy.dailyGearDrops"), "Continuous equipment combat does not show its smithy gold loop nearby");
assert(!html.includes('id="iron-value"') && !html.includes('id="steel-value"'), "Removed material resources remain in the top-level UI");
assert(web.includes("targetItemId") && web.includes("data-unequip-action"), "Manual equip/unequip recovery path is missing");
assert(web.includes("openEquipmentDialog") && web.includes('dialog.showModal()') && web.includes('dock-toggle").addEventListener("click", () => openEquipmentDialog()'), "Equipment launcher does not open a modal from the map UI");
assert(html.includes('class="equipment-mode-tabs"') && html.includes('data-equipment-mode="formation"') && html.includes('data-equipment-mode="character"') && !html.includes(">编队<small>后续</small>") && /\.equipment-window\s*\{[^}]*grid-template-rows:\s*58px\s+minmax\(0,\s*1fr\)/.test(css), "Equipment modal lacks the working formation/character page switch");
assert(web.includes("FORMATION_SPECS") && [2, 4, 8, 20, 40, 100, 200].every((capacity) => web.includes(`capacity: ${capacity}`)), "Formation size ladder is incomplete");
assert(web.includes('unlocked: false') && web.includes("大型战团") && web.includes("大型军阵") && web.includes("远征军团"), "40/100/200-unit formations are not visibly locked");
assert(web.includes("return characterTargets(current).map") && web.includes("unitCount: 1") && !web.includes("headcount: 10"), "Formation roster does not count each browsable hero or ten-person squad as one unit");
assert(web.includes('unitCount > formation.capacity') && web.includes('cities.length > 1') && web.includes('formation-row ${row.id === formation.id ? "selected" : ""} ${rowStatus.valid ? "" : "invalid"}'), "Formation over-capacity or mixed-city invalid states are missing");
assert(web.includes('editorPanel.classList.toggle("invalid", !status.valid)') && css.includes(".formation-editor-panel.invalid"), "Invalid formation does not turn the whole editor red");
assert(web.includes('draggable="true"') && web.includes('data-formation-drop="deployed"') && web.includes('data-formation-drop="available"') && web.includes('addEventListener("dragstart"') && web.includes('addEventListener("drop"'), "Formation members cannot be dragged between deployed and available strips");
assert(web.includes("formationCityFilter") && web.includes("formation-city-filter") && web.includes("member.city === CURRENT_CITY"), "Available-member city filter is missing");
assert(web.includes('${available.length}个单位可选') && web.includes("关闭筛选可查看其他城池"), "City filter does not explain hidden candidates or expose the filtered unit count");
assert(web.includes('class="formation-position-open') && web.includes(">调整站位</button>") && web.includes('positionBlocked ? "disabled"') && web.includes("超出编队单位上限"), "Deployed roster lacks a visible positioning action or its blocked reason");
assert(web.includes("formationGridShape") && web.includes('capacity === 2') && web.includes('columns: 1, rows: 2') && web.includes('capacity === 8') && web.includes('columns: 4, rows: 2') && web.includes('columns: 5, rows: Math.ceil(capacity / 5)'), "Formation sizes do not expand from front/back slots into the twenty-unit square formation");
assert(web.includes("formation.positions") && web.includes("saved?.positions") && web.includes("positions[openIndex] = id"), "Formation positions are not persisted or initialized from member order");
assert(web.includes("moveFormationPosition") && web.includes("formation.positions[targetIndex] = memberId") && web.includes("formation.positions[sourceIndex] = replacedId || null"), "Dropping a formation unit does not move to an empty slot or swap occupied slots");
assert(web.includes("formation-position-finish") && web.includes("敌军方向") && web.includes("前线") && web.includes("后方") && web.includes("selectedFormationPositionMemberId"), "Position editor lacks orientation, completion, or click-based recovery controls");
assert(/\.formation-position-grid\s*\{[^}]*grid-template-columns:\s*repeat\(var\(--formation-columns\)/.test(css) && css.includes(".formation-position-slot.drag-over") && css.includes(".formation-position-slot.selected"), "Position field does not render a responsive slot grid with drag and selected feedback");
const formationCardSource = web.slice(web.indexOf("function formationMemberCard"), web.indexOf("function updateFormationMember"));
const formationSlotSource = web.slice(web.indexOf("function formationPositionSlot"), web.indexOf("function bindFormationPositionDrag"));
assert(formationCardSource.includes("member.name") && formationCardSource.includes("member.roleIcon") && formationCardSource.includes("member.city") && formationCardSource.includes("formatCombatPower(member.combatPower)"), "Formation member cards do not show profession icon, name, city, and formatted combat power");
assert(formationCardSource.includes('class="formation-member-art" aria-hidden="true"></span>') && formationCardSource.includes('class="formation-member-role"'), "Formation cards do not keep the portrait area empty while placing the profession icon at the information boundary");
assert(formationSlotSource.includes("member.name") && formationSlotSource.includes("member.roleIcon") && formationSlotSource.includes("member.city") && formationSlotSource.includes("formatCombatPower(member.combatPower)"), "Position slots do not preserve the same profession icon, name, city, and combat-power hierarchy");
assert(!formationCardSource.includes("member.glyph") && !formationSlotSource.includes("member.glyph"), "Formation cards or position slots still use the old identity glyphs");
assert(web.includes('const ROLE_ICONS = { knight: "🛡️", warrior: "⚔️"') && web.includes('roleIcon: ROLE_ICONS[unit.roleKey]') && web.includes('toLocaleString("zh-CN")'), "Formation cards do not reuse canonical role icons or support full million-scale combat-power formatting");
assert(/\.formation-member-strip\s*\{[^}]*grid-auto-columns:\s*162px/.test(css) && css.includes(".formation-member-summary") && css.includes(".formation-member-power") && css.includes("border-top: 1px solid #4e493a"), "Formation cards are not wide portrait-and-summary rectangles with a separated information footer");
assert(/\.formation-member\s*\{[^}]*grid-template-rows:\s*minmax\(56px,\s*1fr\)\s+60px/.test(css) && css.includes(".formation-member-art > img"), "Formation cards do not preserve a dedicated empty upper portrait layer for future artwork");
assert(/\.formation-member-role\s*\{[^}]*left:\s*50%[^}]*top:\s*0[^}]*border:\s*0[^}]*font-size:\s*17px[^}]*translate\(-50%,\s*-52%\)/.test(css), "Profession icon is not a small unframed bridge centered on the portrait-information boundary");
assert(/\.position-member-identity\s*>\s*i\s*\{[^}]*border:\s*0[^}]*background:\s*transparent/.test(css), "Position profession icons still use unnecessary framed boxes");
assert(formationCardSource.indexOf("member.name") < formationCardSource.indexOf("formatCombatPower(member.combatPower)") && /\.formation-member-power\s+b\s*\{[^}]*13px/.test(css), "Formation name is not above the compact combat-power row");
assert(css.includes(".position-member-identity") && css.includes(".position-member-power"), "Position slots lack the icon/name/city header and separated combat-power footer");
assert(/\.equipment-workspace\.formation-mode\s*\{[^}]*grid-template-columns:\s*285px\s+minmax\(0,\s*1fr\)/.test(css) && /\.formation-editor-panel\s*\{[^}]*grid-template-rows:\s*72px\s+minmax\(0,\s*\.94fr\)\s+minmax\(0,\s*1\.06fr\)/.test(css), "Formation page does not preserve the left roster and right deployed/available hierarchy");
assert(web.includes("Number(b.target.active) - Number(a.target.active)") && web.includes("character-page-nav") && web.includes("data-character-page"), "Character page does not paginate through party-first equipment targets");
assert(web.includes("function characterTargets(current)") && web.includes("current.party.characterTargets") && web.includes('hero.kind === "militia" ? "民兵"'), "Character pagination does not include read-only militia records");
assert(web.includes("hero.equipmentLocked") && web.includes('class="portrait-equipment-slot locked" disabled') && web.includes("装备锁定") && web.includes("装备未开放 · 这里只能查看物品"), "Militia equipment is not visibly locked across slots, controls, and backpack");
assert(css.includes(".portrait-equipment-slot.locked:disabled") && css.includes(".mini-button.equipment-locked:disabled") && css.includes(".equipment-lock-note"), "Militia equipment lock lacks persistent visual treatment");
assert(!html.includes('id="equipment-unit-axis"') && !css.includes(".equipment-unit-axis-track"), "Removed two-row character axis still consumes vertical space");
assert(web.includes("hero.equipment.slice(0, 4)") && web.includes("hero.equipment.slice(4, 8)"), "Character portrait does not have four equipment slots on each side");
assert(/\.equipment-workspace\s*\{[^}]*grid-template-columns:[^}]+/.test(css) && /\.character-stage\s*\{[^}]*grid-template-columns:\s*62px\s+minmax\(180px,\s*1fr\)\s+62px/.test(css), "Equipment modal does not preserve the requested character/backpack and portrait/slot hierarchy");
assert(web.includes("portrait-placeholder") && !web.includes('class="portrait-glyph"') && !css.includes(".portrait-glyph"), "Character art placeholder still renders a giant identity glyph");
assert(/\.portrait-equipment-slot\s*\{[^}]*width:\s*56px[^}]*height:\s*56px/.test(css) && web.includes("equipment-slot-tooltip") && /\.portrait-equipment-slot:hover\s+\.equipment-slot-tooltip/.test(css), "Equipment slots are not compact squares with hover details");
assert(web.includes('id="modal-auto-equip-all"') && web.includes('class="mini-button character-stat-toggle"') && web.indexOf('id="modal-auto-equip-all"') < web.indexOf('class="mini-button character-stat-toggle"'), "Stats button is not placed immediately after whole-party auto-equip");
assert(web.includes("character-stat-overlay") && /\.character-stat-toggle:hover\s*\+\s*\.character-stat-overlay/.test(css) && !/\.character-stat-toggle\s*\{[^}]*position:\s*absolute/.test(css), "Inline stats button no longer opens the character stat overlay correctly");
assert(web.includes("skill.details?.length") && web.includes("skill-detail-tooltip") && /\.character-skill:hover\s+\.skill-detail-tooltip/.test(css), "Character skills do not expose numeric hover details");
assert(web.includes('<strong>${esc(skill.name)}</strong><span>${esc(skill.type)}</span><small>${esc(timing)}</small>'), "Skill cards do not place the name above the skill type");
assert(web.includes('class="skill-summary">${esc(skill.description)}</p>') && /\.character-skill\s*\{[^}]*min-height:\s*64px/.test(css), "Skill cards do not reserve a taller row for the one-line effect summary");
assert(/\.character-skills\s*\{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent/.test(css), "Skill area still has an unnecessary outer frame");
assert(/\.equipment-character-panel\s*\{[^}]*grid-template-rows:\s*44px\s+minmax\(270px,\s*1fr\)\s+auto/.test(css), "Portrait stage did not yield roughly five percent of its minimum height to skills");
assert(web.includes("groupA = ownerA?.id === targetId ? 0 : ownerA ? 2 : 1") && web.includes("current.party.equipmentTargets"), "Backpack is not ordered as current equipment, free items, then other characters' equipment");
assert(web.includes("data-modal-equip") && web.includes("data-modal-unequip"), "New equipment modal lacks equip or unequip recovery actions");
assert(web.includes("if (changed) selectedItemId = null") && web.includes("previousHero") && web.includes("nextHero"), "Character pagination does not reset stale item selection or expose both directions");
assert(web.includes("renderUnitRail(current)") && web.includes("current.party.heroes.map") && web.includes("current.war.untrainedUnits") && web.includes("current.party.trainedUnits.map"), "Main-map unit rail does not render every hero, militia unit, and trained unit");
assert(web.includes('hero.active ? "队内" : "候补"') && web.includes('hero.id === "player" ? "主角"'), "Unit rail does not distinguish the player, active heroes, and reserve heroes");
assert(/\.unit-roster-rail\s*\{[^}]*position:\s*absolute[^}]*left:\s*14px[^}]*width:\s*84px[^}]*user-select:\s*none/.test(css), "Unit blocks are not positioned directly on the left side of the map");
assert(/\.unit-roster-list\s*\{[^}]*flex-flow:\s*column\s+wrap[^}]*overflow:\s*visible/.test(css), "Unit blocks must wrap into a second column instead of scrolling");
assert(/\.unit-avatar\s*\{[^}]*width:\s*40px[^}]*height:\s*40px/.test(css), "Unit blocks were not reduced to the requested compact size");
assert(!/\.unit-roster-rail\s*\{[^}]*(?:border|background|box-shadow):/.test(css) && !/\.unit-roster-list\s*\{[^}]*overflow-y:\s*auto/.test(css), "Unit blocks are still enclosed by a large framed scrolling panel");
assert(css.includes(".game-shell.combat-mode") && css.includes(".battle-mount .battle-view-field"), "Combat state does not reclaim the screen for the battlefield");
assert(web.includes("INVENTORY_PAGE_SIZE = 24") && web.includes("inventory-prev") && web.includes("inventory-next"), "Inventory pagination is missing");
assert(/\.dock-content\s*\{[^}]*overflow:\s*hidden/.test(css), "Bottom command dock must not become a nested scrolling surface");
assert(/\.party-layout\s*\{[^}]*overflow-x:\s*auto/.test(css), "Party layout must horizontally scroll when equipment is clipped");
assert(/\.hero-roster\s*\{[^}]*overflow-y:\s*auto/.test(css), "Unit roster must vertically scroll when many units are present");
assert(/\.hero-detail\s*\{[^}]*overflow-y:\s*auto/.test(css), "Equipment detail must vertically scroll to reveal the lower equipment row");
assert(web.includes("partyScrollLeft") && web.includes("partyRosterScrollTop") && web.includes("partyDetailScrollTop"), "Party scroll positions must be preserved");
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
assert(observation.party.equipmentTargets.every((target) => target.equipment.length === 8 && target.skills.length === 4 && Number.isFinite(target.stats.maxHp)), "Equipment modal observation lacks slots, skills, or current combat stats");
assert(observation.party.equipmentTargets.every((target) => target.skills.every((skill) => Array.isArray(skill.details) && skill.details.length)), "Character skill observation lacks concrete numeric details");
assert(observation.party.equipmentTargets[0].skills.some((skill) => skill.details.some((detail) => detail.includes("物理攻击") && detail.includes("物理伤害"))), "Damage skill details do not expose attack scaling and damage type");
assert.equal(observation.party.characterTargets.length, observation.party.equipmentTargets.length + observation.war.untrainedUnits, "Character modal observation omits militia");
assert(observation.party.militiaUnits.every((unit) => unit.equipmentLocked && unit.equipment.every((slot) => slot.locked) && unit.skills.length === 4), "Militia observation does not combine locked equipment with real skills");
assert(!observation.party.equipmentTargets.some((unit) => unit.kind === "militia"), "Militia leaked into the equipable target list");
assert(observation.party.characterTargets.every((unit) => Number.isInteger(unit.combatPower) && unit.combatPower > 0), "Formation roster observation lacks public combat power");
assert(observation.party.characterTargets.every((unit) => unit.roleKey), "Formation roster observation lacks canonical role keys for profession icons");
assert.equal(observation.buildings.length, 7);
assert.equal(observation.buildings.filter((building) => building.complete).length, 5);
assert.equal(observation.buildings.filter((building) => !building.type).length, 2);
assert(observation.actions.some((action) => action.kind === "build" && Number.isInteger(action.targetSlot)), "Build action lacks safe plot metadata");
assert(observation.buildings.filter((building) => ["house", "farm", "smithy"].includes(building.type)).every((building) => building.yieldLabel), "Base resource building lacks a visible yield label");
assert(observation.actions.some((action) => action.kind === "grind"));
assert.equal(observation.grind.levels.length, 5);
assert.equal(observation.actions.filter((action) => action.kind === "grind_setting").length, 5);
assert(observation.actions.some((action) => action.kind === "grind_setting" && action.available === false && action.disabledReason), "Locked difficulty controls are hidden or unexplained");
assert(observation.actions.some((action) => action.kind === "combat"));
assert(observation.actions.some((action) => action.kind === "event"));

const unequip = observation.actions.find((action) => action.kind === "equipment" && action.operation === "unequip" && action.targetItemId === "starter_sword");
assert(unequip, "Equipped starter item cannot be manually removed");
state = GAME.applyPlayerAction(state, unequip.id);
assert.equal(state.equipment.player.weapon, null, "Unequip action did not free the slot");

const combatAction = GAME.getPlayerObservation(state).actions.find((action) => action.kind === "grind");
assert.throws(() => GAME.applyPlayerAction(state, combatAction.id), /战斗必须先完整运行实际战斗过程/);
const deploymentMembers = observation.party.characterTargets.slice(0, 4);
const deployment = { formationId: "verify_squad", capacity: 4, memberIds: deploymentMembers.map((member) => member.id), positions: deploymentMembers.map((member) => member.id) };
assert.equal(GAME.preparePlayerCombat(state, combatAction.id, { ...deployment, capacity: 8 }), null, "Mismatched formation capacity produced a combat plan");
const duoDeployment = { formationId: "verify_duo", capacity: 2, memberIds: deployment.memberIds.slice(0, 2), positions: deployment.positions.slice(0, 2) };
assert.equal(GAME.preparePlayerCombat(state, combatAction.id, duoDeployment).leftTeam.length, 2, "Smaller formation did not enter a larger-capacity battle");
const plan = GAME.preparePlayerCombat(state, combatAction.id, deployment);
assert.equal(plan.leftTeam.length, deploymentMembers.length, "Selected formation member count did not become the actual combat team");
assert(deploymentMembers.filter((member) => member.kind === "hero").every((member) => plan.leftTeam.some((unit) => unit.name === member.name && unit.unitKind === "hero")), "Selected formation heroes did not become the actual combat team");
assert.equal(plan.leftTeam.filter((unit) => unit.unitKind === "militia").length, deploymentMembers.filter((member) => member.kind === "militia").length, "Selected formation militia did not become the actual combat team");
assert.deepEqual(plan.leftTeam.map((unit) => unit.slotIndex), deploymentMembers.map((_, index) => index), "Selected formation positions did not reach the battle plan");
const militiaMember = observation.party.characterTargets.find((member) => member.kind === "militia");
assert(militiaMember, "Static supply contract needs one militia unit");
const supplyDeployment = { formationId: "verify_supply", capacity: 2, memberIds: [deploymentMembers[0].id, militiaMember.id], positions: [deploymentMembers[0].id, militiaMember.id] };
const emptySupplyPlan = GAME.preparePlayerCombat(state, combatAction.id, { ...supplyDeployment, foodSupplied: 0 });
const fullSupplyPlan = GAME.preparePlayerCombat(state, combatAction.id, { ...supplyDeployment, foodSupplied: 1 });
assert.equal(emptySupplyPlan.performancePct, 20, "Empty supply did not reach the real 20% combat plan");
assert.equal(fullSupplyPlan.performancePct, 100, "Full supply did not reach the real 100% combat plan");
assert(emptySupplyPlan.leftTeam[0].maxHp < fullSupplyPlan.leftTeam[0].maxHp, "Supply performance is only cosmetic and did not scale real combat stats");
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
state = GAME.applyPlayerCombatResult(state, combatAction.id, result, deployment);
let retryRounds = 0;
while (state.inventory.length < 2 && retryRounds < 30) {
  const retryAction = GAME.getPlayerObservation(state).actions.find((action) => action.kind === "grind" && action.available);
  const retryPlan = GAME.preparePlayerCombat(state, retryAction.id);
  state = GAME.applyPlayerCombatResult(state, retryAction.id, GAME.simulatePlan(retryPlan));
  retryRounds += 1;
}
assert(state.stats.combats >= 1 && state.inventory.length >= 2, "Real battle result did not reach persistent game state through retryable combat");
assert(web.includes("返回地图并重试") && web.includes("失败不消耗行动力或粮食"), "Loss UI does not explain the retry path");
assert(web.includes("if (grindSession.auto) grindSession.timer"), "Continuous grind still stops automatically after a defeat");

console.log(JSON.stringify({
  status: "PASS",
  files: ["index.html", "styles.css", "border-village-web.js"],
  map: "shared camera + node-local actions",
  combat: "shared battle view + verified result settlement",
  equipment: "eight slots for heroes and trained soldiers + whole-force one-click loadout + manual override",
  layout: "full-height map + modal three-region equipment workspace",
  serverStarted: false,
}, null, 2));
