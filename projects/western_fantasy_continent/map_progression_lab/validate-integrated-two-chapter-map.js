const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const source = fs.readFileSync(path.join(root, "map-progression-lab.js"), "utf8");
const workbench = fs.readFileSync(path.join(root, "../workbench/index.html"), "utf8");
const chapterOne = require("./map-progression-cognition-core-phase2-midlock");
const chapterTwo = require("./map-progression-chapter2-core");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredChapterTwoNodes = [
  "r2_entry",
  "r2_knight_rescue",
  "r2_priest_rescue",
  "r2_shield_trial",
  "r2_flag_trial",
  "r2_confluence",
  "r2_boss",
];

assert(html.includes('id="battleRewardDialog"'), "missing post-battle reward dialog");
assert(html.includes("map-progression-chapter2-core.js"), "missing accepted Chapter 2 core");
assert(source.includes("agent_automata_map_progression_lab_v8_accepted_chapter_one"), "save is not isolated from the incorrect integrated map");
assert(source.includes("const CHAPTER_ONE = window.GAME_MAP_PROGRESSION_COGNITION"), "accepted Chapter 1 core is not loaded as a dependency");
assert(source.includes("nodes: makeChapterOneNodes()"), "Chapter 1 graph is still built by the generic region generator");
assert(source.includes("return CHAPTER_ONE.nodes.map"), "integrated Chapter 1 nodes are not derived from the accepted core");
assert(source.includes("CHAPTER_ONE.enemyTeam(accepted, chapterOneState())"), "integrated Chapter 1 combat does not use accepted enemy teams");
assert(source.includes("CHAPTER_ONE.fieldEffectId(accepted)"), "integrated Chapter 1 does not use accepted field effects");
assert(source.includes("CHAPTER_ONE.lootFor(chapterOneState(), acceptedChapterOneNode, firstClear)"), "integrated Chapter 1 does not use accepted loot generation");
assert(JSON.stringify(chapterOne.nodes.find((item) => item.id === "r1_main_9").requires) === JSON.stringify(["r1_main_8"]), "integrated Chapter 1 mainline still forks before Main 9");
assert(chapterOne.nodes.find((item) => item.id === "r1_main_9").requiresAny.length === 0, "integrated Chapter 1 mainline still has alternate predecessors");
assert(!source.includes('{ from: "r1_main_6", to: "r1_main_8"'), "rendered Chapter 1 still draws the old Main 6 fork");
assert(source.includes('filter((unit) => unit.id !== "hero_mage")'), "mage must not be in the fresh starting roster");
assert(source.includes('item.id === "r1_main_2"'), "Main 2 must unlock the mage");
assert(source.includes("装备已进入仓库，当前角色数值没有自动变化"), "manual-equipment feedback is missing");
assert(!/state\.inventory\.push\(\.\.\.loot\);\s*autoEquipBestItems\(\)/.test(source), "battle loot still auto-equips");

const swapStart = source.indexOf("function replaceSelectedTeamSlot");
const swapEnd = source.indexOf("function renderEquipmentPage", swapStart);
assert(swapStart >= 0 && swapEnd > swapStart, "team swap function not found");
assert(!source.slice(swapStart, swapEnd).includes("autoEquip"), "team swaps still auto-equip inventory");

const firstState = chapterOne.initialState("integrated-regression", { starterVariant: "player_agent_role_wave" });
firstState.attempts.r1_bandit = 1;
const camp = chapterOne.nodes.find((item) => item.id === "r1_bandit");
const campLoot = chapterOne.lootFor(firstState, camp, true);
assert(campLoot.length === 3, `accepted Camp should drop 3 key items, got ${campLoot.length}`);
assert(campLoot.some((item) => item.name.includes("裂盾长弓")), "accepted Camp Ranger key is missing");
const main6 = chapterOne.nodes.find((item) => item.id === "r1_main_6");
assert(chapterOne.fieldEffectId(main6) === "heavy_shield_lock", "accepted Main 6 heavy-shield field is missing");
const main7 = chapterOne.nodes.find((item) => item.id === "r1_main_7");
const main7Enemy = chapterOne.enemyTeam(main7, firstState);
assert(main7Enemy.some((unit) => unit.name.includes("熊")), "accepted Main 7 Ranger proof target is missing");

for (const id of requiredChapterTwoNodes) {
  assert(source.includes(`"${id}"`), `integrated map missing ${id}`);
  assert(chapterTwo.nodes.some((item) => item.id === id), `accepted Chapter 2 core missing ${id}`);
}

assert(source.includes('{ from: "r2_entry", to: "r2_knight_rescue"'), "knight rescue route missing");
assert(source.includes('{ from: "r2_entry", to: "r2_priest_rescue"'), "priest rescue route missing");
assert(source.includes('{ from: "r2_shield_trial", to: "r2_confluence"'), "shield route does not converge");
assert(source.includes('{ from: "r2_flag_trial", to: "r2_confluence"'), "flag route does not converge");
assert(workbench.includes("双章大地图试玩"), "workbench does not point users to the integrated map");
assert(!workbench.includes("双章人类试玩 V4"), "obsolete independent V4 is still promoted in workbench");

console.log("PASS integrated two-chapter map");
console.log(`chapter2_nodes=${requiredChapterTwoNodes.length}`);
console.log(`chapter1_nodes=${chapterOne.nodes.length}`);
console.log(`chapter1_camp_key_items=${campLoot.length}`);
console.log(`chapter1_main6_field=${chapterOne.fieldEffectId(main6)}`);
console.log("loot_auto_equip=false");
console.log("team_swap_auto_equip=false");
