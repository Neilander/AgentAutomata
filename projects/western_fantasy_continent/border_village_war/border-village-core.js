(function (root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.BORDER_VILLAGE_WAR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
"use strict";

const COMBAT = typeof module !== "undefined" && module.exports ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM;
const SKILLS = typeof module !== "undefined" && module.exports ? require("../game_data/skill-data") : root.GAME_SKILL_DATA;
const BUILD_LAYERS = typeof module !== "undefined" && module.exports ? require("../game_data/build-layers") : root.GAME_BUILD_LAYERS;
const EQUIPMENT_SETS = typeof module !== "undefined" && module.exports ? require("../game_data/equipment-sets") : root.GAME_EQUIPMENT_SETS;
const GEAR_RULES = typeof module !== "undefined" && module.exports ? require("../fifteen_day_demo/fifteen-day-core") : root.FIFTEEN_DAY_DEMO;

const VERSION = "border_village_war_v3";
const FINAL_DAY = 7;
const INVENTORY_LIMIT = 200;
const GRIND_DIFFICULTY_COUNT = 5;
const SLOT_DATA = GEAR_RULES.SLOT_DATA;
const RARITY_DATA = [
  ...GEAR_RULES.RARITY_DATA.map((row) => ({ ...row })),
  { id: "eternal", label: "永恒", affixes: 15, value: 5.5 },
  { id: "blackgold", label: "黑金", affixes: 18, value: 7.0 },
  { id: "infernal", label: "炼狱", affixes: 22, value: 9.0 },
];
const AFFIX_DEFS = GEAR_RULES.AFFIX_DEFS;
const RARITIES = RARITY_DATA.map((row) => row.label);
const RARITY_BY_LABEL = Object.fromEntries(RARITY_DATA.map((row) => [row.label, row]));
const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);

const HEROES = {
  player: { name: "你", role: "近战指挥", combatRole: "warrior", base: 55, preferredAffixes: ["武力", "坚韧"] },
  captain: { name: "圣殿骑士队长·伊莎贝拉", role: "守护与号令", combatRole: "knight", base: 66, preferredAffixes: ["坚韧", "韧性"] },
  scout: { name: "圣殿斥候·莱恩", role: "远程侦察", combatRole: "ranger", base: 50, preferredAffixes: ["敏捷", "暴击率"] },
  guard: { name: "圣殿盾骑·马库斯", role: "负伤重甲保护", combatRole: "knight", base: 53, combatScale: { hp: .82, power: .8, armor: .82 }, preferredAffixes: ["坚韧", "韧性"] },
  sellsword: { name: "流民佣兵·赤犬", role: "近战爆发", combatRole: "berserker", base: 54, preferredAffixes: ["武力", "暴击伤害"] },
  witch: { name: "边林女巫·盐枝", role: "持续削弱", combatRole: "warlock", base: 58, preferredAffixes: ["奥术", "效果强度"] },
  hunter: { name: "山地猎人·苔牙", role: "猎杀大型敌人", combatRole: "ranger", base: 57, preferredAffixes: ["敏捷", "暴击率"] },
  alchemist: { name: "旅行炼金师·罗莎", role: "范围破阵", combatRole: "alchemist", base: 58, preferredAffixes: ["奥术", "节律"] },
  heiress: { name: "探险家小姐·薇奥拉", role: "遗迹学识与机关破解", combatRole: "alchemist", base: 55, preferredAffixes: ["奥术", "效果强度"] },
  mentor: { name: "魔剑导师·艾琳", role: "护卫与魔法反击", combatRole: "mage", base: 64, preferredAffixes: ["奥术", "坚韧"] },
};

const BUILDINGS = {
  house: { name: "房屋", unique: false, yieldType: "人口", yieldLabel: "人口上限 +25", description: "立即增加25人口上限；不会凭空增加实际人口。" },
  farm: { name: "农田", unique: false, yieldType: "粮食", yieldLabel: "粮食约 +8—12/日", description: "每天早晨随机收获8—12粮食。" },
  smithy: { name: "铁匠铺", unique: false, yieldType: "金币", yieldLabel: "金币约 +0—24/日", description: "今日刷到的装备越多，铁匠铺收入越高；20件达到标准满产，之后只有少量加成。" },
  conscription: { name: "征召所", unique: true, yieldType: "人口", yieldLabel: "人口 +6—20/行动", description: "花行动力接纳流民；追加金币可以一次带回更多人。" },
  market: { name: "集市", unique: true, yieldType: "装备", yieldLabel: "每日3件装备", description: "每天刷新三件属性完整可见的装备，并最多收购5件未穿戴装备。" },
};

const RAIDS = {
  foragers: { title: "兽人粮秣营", description: "侦察报告显示六名守军分守粮车、箭塔和营门。", unlock: (s) => Boolean(s.flags.foragerIntel), enemies: [["warrior", "搬运队"], ["warrior", "粮车守卫"], ["ranger", "护粮射手"], ["knight", "营门盾卫"], ["berserker", "押运蛮兵"], ["ranger", "兽人投矛手"]], combatScale: { hp: 1.01, power: .97, armor: 1.0 }, tier: 2, baseFood: 5, removedUnits: 2, reward: { food: 12 }, loot: 2, plotSlot: 7 },
  beastPen: { title: "披甲战兽栏", description: "五名战兽与驯兽兵守着准备投入总攻的兽栏。", unlock: (s) => Boolean(s.flags.beastIntel), enemies: [["berserker", "披甲战兽"], ["berserker", "披甲战兽"], ["knight", "兽栏卫士"], ["ranger", "驯兽射手"], ["berserker", "铁链战兽"]], combatScale: { hp: 1.01, power: .97, armor: 1.03 }, tier: 3, baseFood: 8, removedUnits: 3, reward: { gold: 12 }, loot: 3, plotSlot: 8 },
  shaman: { title: "血鼓萨满祭坛", description: "八名祭坛守军围绕血鼓结阵，持续强化总攻部队。", unlock: (s) => Boolean(s.flags.shamanIntel), enemies: [["knight", "祭坛守卫"], ["warrior", "祭坛守卫"], ["warlock", "血鼓萨满"], ["priest", "图腾医者"], ["warrior", "血鼓战士"], ["berserker", "献祭蛮兵"], ["ranger", "山脊射手"], ["assassin", "图腾猎手"]], combatScale: { hp: .92, power: .9, armor: 1.0 }, tier: 4, baseFood: 12, removedUnits: 1, removesBoss: true, reward: { gold: 18 }, loot: 4, plotSlot: 9 },
};

const ANCIENT_RUINS = {
  id: "ancient_ruins",
  title: "远古遗迹",
  entrance: {
    title: "远古遗迹 · 封锁回廊",
    formationCapacity: 4,
    baseFood: 8,
    tier: 6,
    combatScale: { hp: 1.24, power: 1.17, armor: 1.18 },
    enemies: [["knight", "外环石像盾卫"], ["knight", "外环石像盾卫"], ["ranger", "墓道弩机"], ["ranger", "墓道弩机"], ["assassin", "噬魔伏兽"], ["warlock", "封印残影"], ["priest", "守门祭器"]],
  },
  heart: {
    title: "远古遗迹 · 守秘者大厅",
    formationCapacity: 8,
    baseFood: 12,
    tier: 7,
    combatScale: { hp: 1.3, power: 1.23, armor: 1.22 },
    enemies: [["knight", "遗迹守心者"], ["knight", "无名重甲像"], ["warrior", "封魔执刑者"], ["warrior", "封魔执刑者"], ["ranger", "晶簇射手"], ["assassin", "镜廊追猎者"], ["warlock", "枯竭咒灵"], ["priest", "永眠祭司"], ["alchemist", "古代造物"], ["mage", "核心回响"]],
  },
};

const EVENTS = {
  refugees: {
    day: 3, title: "挤在旧桥边的流民", scene: "二十多名流民堵在旧桥边。一名带刀佣兵愿意留下作战，但要求村庄优先安置他的家人。",
    options: [
      { id: "people", label: "尽量安置整支流民队伍", description: "占用现有人口容量，实际加入人数取决于空余房屋。" },
      { id: "fighter", label: "优先留下佣兵和他的五名家人", description: "获得一名战斗角色，并增加少量实际人口。" },
    ],
  },
  witch: {
    day: 4, title: "圣殿火堆旁的女巫", scene: "盐枝知道兽人血鼓的位置。伊莎贝拉承认她的情报可能救人，但圣殿戒律不允许女巫进入营地。",
    options: [
      { id: "shelter", label: "让盐枝进入村庄", description: "盐枝加入队伍并指出血鼓祭坛；伊莎贝拉对此不满。" },
      { id: "captain", label: "支持伊莎贝拉执行戒律", description: "女巫离开；伊莎贝拉重新加固自己的盾甲。" },
    ],
  },
  hunter: {
    day: 5, title: "追着巨兽脚印而来的猎人", scene: "苔牙找到了兽人的战兽栏。他可以留下猎杀巨兽，也可以带流民从一条安全山路进村。",
    options: [
      { id: "recruit", label: "花八金币修复他的猎具", description: "苔牙加入队伍，并标出战兽栏。", cost: { gold: 8 }, req: (s) => s.resources.gold >= 8, reqText: "需要8金币修复猎具。" },
      { id: "guide", label: "让他带流民走安全山路", description: "增加实际人口，并标出战兽栏。" },
    ],
  },
  caravan: {
    day: 6, title: "最后一支南下商队", scene: "商队只愿意停留半日。旅行炼金师可以留下，车上的军粮也足够供应一场大战，但金币只够选择其中之一。",
    options: [
      { id: "food", label: "花十二金币买下三十份军粮", description: "获得30粮食。", cost: { gold: 12 }, req: (s) => s.resources.gold >= 12, reqText: "需要12金币。" },
      { id: "alchemist", label: "花十二金币雇佣旅行炼金师", description: "罗莎加入队伍。", cost: { gold: 12 }, req: (s) => s.resources.gold >= 12, reqText: "需要12金币。" },
    ],
  },
};

const GRIND_DIFFICULTIES = {
  1: { name: "林缘", threat: "入门", unlockScoreToNext: 5, winsAtCurrentDifficultyToNext: 5, lootTier: 1, lootCountTable: [[1, 1]], lootCountLabel: "必定1件", rarityTable: [["普通", .90], ["稀有", .10]], rarityLabel: "普通90% · 稀有10%", enemyTier: 1, scale: { hp: .72, power: .7, armor: .9 }, enemies: [["warrior", "林地小兽"], ["ranger", "投石小怪"]] },
  2: { name: "兽径", threat: "危险", unlockScoreToNext: 20, winsAtCurrentDifficultyToNext: 10, lootTier: 2, lootCountTable: [[1, 1]], lootCountLabel: "必定1件", rarityTable: [["普通", .75], ["稀有", .25]], rarityLabel: "普通75% · 稀有25%", enemyTier: 2, scale: { hp: 1.08, power: 1.03, armor: 1.0 }, enemies: [["knight", "披甲魔物"], ["warrior", "林地魔物"], ["ranger", "投矛魔物"], ["priest", "魔物祭徒"]] },
  3: { name: "腐沼", threat: "凶险", unlockScoreToNext: 90, winsAtCurrentDifficultyToNext: 30, lootTier: 3, lootCountTable: [[1, .25], [2, .75]], lootCountLabel: "25%掉1件 · 75%掉2件", rarityTable: [["普通", .70], ["稀有", .25], ["史诗", .05]], rarityLabel: "普通70% · 稀有25% · 史诗5%", enemyTier: 3, scale: { hp: 1.06, power: 1.02, armor: 1.04 }, enemies: [["knight", "腐沼甲兽"], ["warrior", "噬人魔"], ["ranger", "毒矢魔物"], ["assassin", "潜沼猎手"], ["warlock", "沼泽咒师"], ["priest", "魔物祭徒"]] },
  4: { name: "血林", threat: "致命", unlockScoreToNext: 200, winsAtCurrentDifficultyToNext: 50, lootTier: 4, lootCountTable: [[2, .75], [3, .25]], lootCountLabel: "75%掉2件 · 25%掉3件", rarityTable: [["普通", .50], ["稀有", .30], ["史诗", .19], ["传说", .01]], rarityLabel: "普通50% · 稀有30% · 史诗19% · 传说1%", enemyTier: 4, scale: { hp: .93, power: .92, armor: 1.0 }, enemies: [["knight", "血林巨怪"], ["berserker", "狂化战兽"], ["warrior", "血林屠夫"], ["ranger", "血羽猎手"], ["assassin", "血影猎手"], ["alchemist", "腐血投手"], ["warlock", "血咒魔物"], ["priest", "血祭司"]] },
  5: { name: "魔潮腹地", threat: "绝境", unlockScoreToNext: null, winsAtCurrentDifficultyToNext: null, lootTier: 5, lootCountTable: [[3, 1]], lootCountLabel: "必定3件", rarityTable: [["普通", .30], ["稀有", .45], ["史诗", .20], ["传说", .05]], rarityLabel: "普通30% · 稀有45% · 史诗20% · 传说5%", enemyTier: 5, scale: { hp: 1.175, power: 1.125, armor: 1.115 }, enemies: [["knight", "魔潮重甲兽"], ["knight", "深林铁卫"], ["berserker", "魔潮撕裂者"], ["warrior", "魔潮战士"], ["ranger", "腐箭猎手"], ["ranger", "夜羽猎手"], ["assassin", "无光伏击者"], ["alchemist", "腐浆投手"], ["warlock", "深林咒师"], ["priest", "魔潮祭司"]] },
};

function clone(value) { return structuredClone(value); }
function hash(text) { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function rand(state) { let x = state.rngState >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; state.rngState = x >>> 0; return state.rngState / 4294967296; }
function randomInt(state, min, max) { return min + Math.floor(rand(state) * (max - min + 1)); }
function weightedPick(state, rows) { let roll = rand(state) * rows.reduce((sum, row) => sum + row[1], 0); for (const row of rows) { roll -= row[1]; if (roll <= 0) return row[0]; } return rows.at(-1)[0]; }
function rarityIndex(label) { return RARITIES.indexOf(label); }
function emptyEquipment() { return Object.fromEntries(Object.keys(SLOT_DATA).map((slot) => [slot, null])); }
function addLog(state, text, kind = "result") { state.recent.unshift({ day: state.day, kind, text }); state.recent = state.recent.slice(0, 40); }

function ancientRuinsState(state) {
  return state.challenges?.ancientRuins || { stage: "entrance", approach: null, completed: false };
}

function ensureAncientRuinsState(state) {
  if (!state.challenges) state.challenges = {};
  if (!state.challenges.ancientRuins) state.challenges.ancientRuins = { stage: "entrance", approach: null, completed: false };
  return state.challenges.ancientRuins;
}

function createInitialState(seed = "border-village-war") {
  const state = {
    version: VERSION, seed: String(seed), rngState: parseInt(hash(seed), 36) || 1,
    day: 1, phase: "prologue", storyStep: "arrival", ap: 0,
    resources: { gold: 24, food: 0, population: 30, populationCap: 50 },
    buildings: [
      { slot: 0, type: "house", level: 1, complete: true, unlocked: true, site: "village" },
      { slot: 1, type: "farm", level: 1, complete: true, unlocked: true, site: "village" },
      { slot: 2, type: "smithy", level: 1, complete: true, unlocked: true, site: "village" },
      { slot: 3, type: "market", level: 1, complete: true, unlocked: true, site: "village" },
      { slot: 4, type: "conscription", level: 1, complete: true, unlocked: true, site: "village" },
      { slot: 5, type: null, level: 0, complete: false, unlocked: true, site: "village" },
      { slot: 6, type: null, level: 0, complete: false, unlocked: true, site: "village" },
      { slot: 7, type: null, level: 0, complete: false, unlocked: false, site: "foragers" },
      { slot: 8, type: null, level: 0, complete: false, unlocked: false, site: "beastPen" },
      { slot: 9, type: null, level: 0, complete: false, unlocked: false, site: "shaman" },
    ],
    market: { day: 0, sellRemaining: 5, stock: [] },
    economy: { dailyGearDrops: 0, smithGoldPaid: 0 },
    grind: { selectedDifficulty: 1, unlockedDifficulty: 1, winsByDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    army: { trainedUnits: 0 },
    roster: ["player"], activeParty: ["player"], selectedHeroId: "player", equipment: {}, inventory: [],
    flags: {}, resolvedEvents: {}, resolvedRaids: {}, enemy: { orcUnits: 20, bosses: 3 },
    challenges: { ancientRuins: { stage: "entrance", approach: null, completed: false } },
    recent: [], lastCombat: null, lastOutcome: null, result: null,
    stats: { actionsSpent: 0, grindAttempts: 0, grindWins: 0, combats: 0, failedCombats: 0, itemsSold: 0, soldiersTrained: 0 },
  };
  for (const heroId of Object.keys(HEROES)) state.equipment[heroId] = emptyEquipment();
  const starter = starterItem();
  state.inventory.push(starter);
  state.equipment.player.weapon = starter.id;
  addStarterRarityShowcase(state);
  addLog(state, "一队圣殿骑士来到灰谷村。女队长伊莎贝拉认为附近只有零星魔物，决定让部下明日沿边境巡逻。", "story");
  return state;
}

function starterItem() {
  return { id: "starter_sword", name: "旧民兵剑", slot: "weapon", slotLabel: "武器", rarity: "普通", rarityId: "common", equipmentLevel: 12, power: 7, baseStats: { physicalPower: 6 }, affixes: [{ stat: "might", label: "武力", value: 1, level: 1, category: "major", percent: false }], identityTags: [], source: "村庄仓库" };
}

function addStarterRarityShowcase(state) {
  const showcase = [
    ["稀有", "helm", "初始展示·稀有头盔"],
    ["史诗", "chest", "初始展示·史诗胸甲"],
    ["传说", "ring", "初始展示·传说戒指"],
    ["神话", "charm", "初始展示·神话护符"],
    ["永恒", "gloves", "初始展示·永恒手甲"],
    ["黑金", "legs", "初始展示·黑金腿甲"],
    ["炼狱", "boots", "初始展示·炼狱战靴"],
  ];
  for (const [rarity, slot, name] of showcase) {
    const item = generateItem(state, "初始稀有度展示", 1, rarity, slot);
    item.name = name;
    state.inventory.push(item);
  }
}

const PROSPERITY_LEVELS = [
  { level: 1, name: "边陲村落", population: 0, actionCapacity: 3 },
  { level: 2, name: "兴盛村庄", population: 40, actionCapacity: 4 },
  { level: 3, name: "边境镇集", population: 70, actionCapacity: 5 },
  { level: 4, name: "繁荣城镇", population: 100, actionCapacity: 6 },
];
const POPULATION_UNIT_MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function prosperityLevelForPopulation(population) {
  const value = Math.max(0, Number(population) || 0);
  return [...PROSPERITY_LEVELS].reverse().find((row) => value >= row.population) || PROSPERITY_LEVELS[0];
}

function actionPointsForPopulation(population) { return prosperityLevelForPopulation(population).actionCapacity; }

function townProsperity(state) {
  const population = Math.max(0, Number(state.resources.population) || 0);
  const current = prosperityLevelForPopulation(population);
  const next = PROSPERITY_LEVELS.find((row) => row.population > population) || null;
  const populationMilestones = [0, ...POPULATION_UNIT_MILESTONES];
  const milestones = populationMilestones.map((threshold) => {
    const prosperity = PROSPERITY_LEVELS.find((row) => row.population === threshold) || null;
    const unitReward = POPULATION_UNIT_MILESTONES.includes(threshold) ? 1 : 0;
    const rewards = [];
    if (threshold === 0) rewards.push("基础每日行动3");
    else if (prosperity) rewards.push("每日行动+1");
    if (unitReward) rewards.push("新增1个民兵单位");
    return { population: threshold, prosperityLevel: prosperity?.level || null, prosperityName: prosperity?.name || null, actionCapacity: prosperity?.actionCapacity || null, unitReward, rewards, reached: population >= threshold };
  });
  const levelEnd = next?.population ?? Math.max(population, PROSPERITY_LEVELS.at(-1).population);
  const levelSpan = Math.max(1, levelEnd - current.population);
  return {
    level: current.level,
    name: current.name,
    actionCapacity: current.actionCapacity,
    currentLevelPopulation: current.population,
    nextLevelPopulation: next?.population ?? null,
    nextLevel: next ? { level: next.level, name: next.name, population: next.population, actionCapacity: next.actionCapacity } : null,
    levelProgress: next ? Math.max(0, Math.min(1, (population - current.population) / levelSpan)) : 1,
    milestones,
  };
}

function militiaUnits(state) { return Math.min(10, Math.floor(state.resources.population / 10)); }
function trainedUnits(state) { return Math.min(militiaUnits(state), Math.max(0, Number(state.army?.trainedUnits || 0))); }
function trainedUnitId(index) { return `trained_${index + 1}`; }
function militiaUnitId(index) { return `militia_${index + 1}`; }
function trainedUnitIndex(targetId) {
  const match = /^trained_(\d+)$/.exec(String(targetId || ""));
  return match ? Number(match[1]) - 1 : -1;
}
function militiaUnitIndex(targetId) {
  const match = /^militia_(\d+)$/.exec(String(targetId || ""));
  return match ? Number(match[1]) - 1 : -1;
}
function trainedRole(index) { return ["knight", "warrior", "ranger"][index % 3]; }
function militiaRole(index) { return ["warrior", "knight", "ranger", "warrior", "ranger"][index % 5]; }
function trainedTargetInfo(index) {
  const role = trainedRole(index);
  const preferred = { knight: ["坚韧", "韧性"], warrior: ["武力", "坚韧"], ranger: ["敏捷", "暴击率"] }[role];
  const roleName = { knight: "重甲战士", warrior: "近战战士", ranger: "远程战士" }[role];
  return { id: trainedUnitId(index), name: `灰谷战士第${index + 1}队`, role: `${roleName} · 10人单位`, roleKey: role, preferredAffixes: preferred, kind: "trained" };
}
function militiaTargetInfo(index) {
  const role = militiaRole(index);
  const roleName = { knight: "持盾民兵", warrior: "近战民兵", ranger: "弓手民兵" }[role];
  return { id: militiaUnitId(index), name: `灰谷民兵第${index + 1}队`, role: `${roleName} · 10人单位`, roleKey: role, preferredAffixes: [], kind: "militia" };
}
function equipmentTargetIds(state) { return [...state.roster, ...Array.from({ length: trainedUnits(state) }, (_, index) => trainedUnitId(index))]; }
function equipmentTargetInfo(state, targetId) {
  if (HEROES[targetId] && state.roster.includes(targetId)) return { id: targetId, name: HEROES[targetId].name, role: HEROES[targetId].role, preferredAffixes: HEROES[targetId].preferredAffixes || [], kind: "hero" };
  const index = trainedUnitIndex(targetId);
  return index >= 0 && index < trainedUnits(state) ? trainedTargetInfo(index) : null;
}
function equipmentSlots(state, targetId) { return state.equipment[targetId] || emptyEquipment(); }
function ensureEquipmentSlots(state, targetId) { if (!state.equipment[targetId]) state.equipment[targetId] = emptyEquipment(); return state.equipment[targetId]; }
function unlockedGrindDifficulty(unlockScore) {
  const score = Math.max(0, Number(unlockScore) || 0);
  let unlocked = 1;
  for (let difficulty = 1; difficulty < GRIND_DIFFICULTY_COUNT; difficulty += 1) {
    if (score < GRIND_DIFFICULTIES[difficulty].unlockScoreToNext) break;
    unlocked = difficulty + 1;
  }
  return unlocked;
}
function grindProgress(state) {
  const raw = state.grind || {};
  const winsByDifficulty = Object.fromEntries(Array.from({ length: GRIND_DIFFICULTY_COUNT }, (_, index) => {
    const difficulty = index + 1;
    return [difficulty, Math.max(0, Number(raw.winsByDifficulty?.[difficulty] || 0))];
  }));
  const totalWins = Math.max(0, Number(state.stats?.grindWins) || 0);
  const unlockScore = Object.entries(winsByDifficulty).reduce((sum, [difficulty, wins]) => sum + Number(difficulty) * wins, 0);
  const unlockedDifficulty = unlockedGrindDifficulty(unlockScore);
  const selectedDifficulty = Math.max(1, Math.min(unlockedDifficulty, Number(raw.selectedDifficulty) || 1));
  return { selectedDifficulty, unlockedDifficulty, totalWins, unlockScore, winsByDifficulty };
}
function ensureGrindProgress(state) { state.grind = grindProgress(state); return state.grind; }
function buildingRows(state, type) { return state.buildings.filter((row) => row.unlocked !== false && row.type === type && row.complete); }
function hasBuilding(state, type) { return buildingRows(state, type).length > 0; }

function morning(state) {
  state.economy.dailyGearDrops = 0;
  state.economy.smithGoldPaid = 0;
  const farms = buildingRows(state, "farm");
  let food = 0;
  const yields = [];
  for (const farm of farms) {
    const ranges = [8, 12];
    const amount = randomInt(state, ranges[0], ranges[1]);
    food += amount;
    yields.push(amount);
  }
  state.resources.food += food;
  refreshMarket(state);
  state.ap = actionPointsForPopulation(state.resources.population);
  if (food) addLog(state, `${farms.length}块农田今日共收获${food}粮食（${yields.join("+")}）。`, "production");
  addLog(state, `第${state.day}日开始：实际人口${state.resources.population}，今日可用${state.ap}次行动。`, "day");
}

function refreshMarket(state) {
  if (!hasBuilding(state, "market")) { state.market = { day: state.day, sellRemaining: 0, stock: [] }; return; }
  const stock = [];
  const tier = state.day >= 6 ? 3 : state.day >= 5 ? 2 : 1;
  for (let index = 0; index < 3; index += 1) {
    const forced = index === 2 && rand(state) < .24 ? "史诗" : null;
    const item = generateItem(state, "灰谷集市", tier + 1, forced);
    const price = ({ "普通": 6, "稀有": 10, "史诗": 18, "传说": 28, "神话": 40, "永恒": 60, "黑金": 85, "炼狱": 120 })[item.rarity] || 6;
    stock.push({ id: `gear_${state.day}_${index}`, type: "gear", label: `${item.name}（评分+${item.power}）`, price, count: 1, item });
  }
  state.market = { day: state.day, sellRemaining: 5, stock };
}

function smithUtilization(drops) {
  const value = Math.max(0, Number(drops) || 0);
  return value <= 20 ? value / 20 : Math.min(1.2, 1 + (value - 20) * .01);
}

function smithIncomeTarget(state) {
  return Math.floor(buildingRows(state, "smithy").length * 20 * smithUtilization(state.economy.dailyGearDrops));
}

function settleSmithIncome(state) {
  const target = smithIncomeTarget(state);
  const gained = Math.max(0, target - state.economy.smithGoldPaid);
  if (gained > 0) {
    state.resources.gold += gained;
    state.economy.smithGoldPaid = target;
    addLog(state, `铁匠铺根据今日${state.economy.dailyGearDrops}件新装备完成订单，收入${gained}金币；今日累计${target}金币。`, "production");
  }
  return gained;
}

function registerGearDrops(state, count) {
  state.economy.dailyGearDrops += Math.max(0, Number(count) || 0);
  return settleSmithIncome(state);
}

function rollDirectStatValue(state, stat, equipmentLevel) {
  const scales = { physicalPower: .5, magicPower: .5, maxHp: 2.8, armor: .08 };
  return Math.max(1, Math.round(equipmentLevel * (scales[stat] || .12) * (.92 + rand(state) * .16)));
}

function rollAffixValue(state, stat, equipmentLevel) {
  const def = AFFIX_DEFS[stat] || {};
  const variance = .88 + rand(state) * .24;
  if (def.category === "major") return Math.max(1, Math.round((1.1 + equipmentLevel / 45) * variance));
  if (def.percent) return Math.max(1, Math.round((2.5 + equipmentLevel / 7.5) * variance));
  return Math.max(1, Math.round((2 + equipmentLevel / 9) * variance));
}

function affixLevel(equipmentLevel) { return equipmentLevel >= 120 ? 5 : equipmentLevel >= 80 ? 4 : equipmentLevel >= 50 ? 3 : equipmentLevel >= 30 ? 2 : 1; }

function generateItem(state, source = "border", tier = 1, forcedRarity = null, forcedSlot = null) {
  const rarityTables = {
    1: [["普通", .70], ["稀有", .27], ["史诗", .03]],
    2: [["普通", .42], ["稀有", .48], ["史诗", .095], ["传说", .005]],
    3: [["稀有", .60], ["史诗", .35], ["传说", .048], ["神话", .002]],
    4: [["史诗", .70], ["传说", .28], ["神话", .02]],
  };
  const rarityLabel = forcedRarity || weightedPick(state, rarityTables[Math.max(1, Math.min(4, tier))]);
  const rarity = RARITY_BY_LABEL[rarityLabel];
  const slotKey = forcedSlot || weightedPick(state, Object.keys(SLOT_DATA).map((slot) => [slot, 1]));
  const slot = SLOT_DATA[slotKey];
  const equipmentLevel = Math.max(10, Math.round((16 + tier * 14) * (.88 + rand(state) * .24)));
  const baseStatKeys = slot.baseOptions ? weightedPick(state, slot.baseOptions.map((row) => [row, 1])) : slot.baseStats;
  const baseStats = Object.fromEntries(baseStatKeys.map((stat) => [stat, rollDirectStatValue(state, stat, equipmentLevel)]));
  const pool = slot.affixPool.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
  const focus = [weightedPick(state, pool.map((row) => [row, 1])), weightedPick(state, pool.map((row) => [row, 1]))];
  const affixes = Array.from({ length: rarity.affixes }, (_, index) => {
    const stat = index < Math.floor(rarity.affixes * .5) ? focus[index % 2] : weightedPick(state, pool.map((row) => [row, 1]));
    return { stat, label: AFFIX_DEFS[stat]?.label || stat, value: rollAffixValue(state, stat, equipmentLevel), level: affixLevel(equipmentLevel), category: AFFIX_DEFS[stat]?.category || "mechanic", percent: Boolean(AFFIX_DEFS[stat]?.percent) };
  });
  const score = Math.max(1, Math.round((Object.values(baseStats).reduce((sum, value) => sum + value, 0) * .25 + affixes.reduce((sum, row) => sum + row.value, 0)) * rarity.value));
  const name = `${rarity.label}${slot.label} Lv.${equipmentLevel}`;
  return { id: `item_${state.day}_${state.stats.grindAttempts}_${state.inventory.length}_${hash(`${state.rngState}|${source}|${name}`)}`, name, slot: slotKey, slotLabel: slot.label, rarity: rarity.label, rarityId: rarity.id, equipmentLevel, power: score, baseStats, affixes, identityTags: [], source };
}

function roleSpec(role, name, slotIndex, scales = {}) {
  const kit = SKILLS.roleKits[role];
  if (!kit) throw new Error(`缺少战斗职业：${role}`);
  const magic = ["mage", "priest", "warlock", "alchemist"].includes(role);
  const power = Math.round((kit.power || 40) * (scales.power || 1));
  return {
    role, name, roleName: kit.role || role,
    hp: Math.round((kit.hp || 300) * (scales.hp || 1)), maxHp: Math.round((kit.hp || 300) * (scales.hp || 1)), power,
    physicalPower: Math.round(magic ? power * .28 : power), magicPower: Math.round(magic ? power : power * .28), armor: Math.round((kit.armor || 8) * (scales.armor || 1)),
    range: kit.range || 14, small1: scales.small1 || kit.kit.small1, small2: scales.small2 || kit.kit.small2, passive: scales.passive || kit.kit.passive, ultimate: scales.ultimate || kit.kit.ultimate,
    slotIndex, unitKind: scales.unitKind || "",
  };
}

function heroCombatSpec(state, heroId, slotIndex) {
  const hero = HEROES[heroId];
  const baseBonus = heroId === "captain" && state.flags.captainBlessed ? .16 : 0;
  const personal = hero.combatScale || {};
  const spec = roleSpec(hero.combatRole, hero.name, slotIndex, { hp: (.92 + hero.base / 430 + baseBonus) * (personal.hp || 1), power: (.86 + hero.base / 360 + baseBonus) * (personal.power || 1), armor: (.95 + baseBonus) * (personal.armor || 1), unitKind: "hero" });
  return applyEquipmentToCombatSpec(state, heroId, spec);
}

function applyEquipmentToCombatSpec(state, targetId, spec) {
  const items = Object.values(equipmentSlots(state, targetId)).map((itemId) => state.inventory.find((item) => item.id === itemId)).filter(Boolean);
  const bundle = BUILD_LAYERS.buildEquipmentModifierBundle(items);
  spec.maxHp += Math.round(bundle.maxHpAdd || 0); spec.hp = spec.maxHp;
  spec.physicalPower += Math.round(bundle.physicalPowerAdd || 0); spec.magicPower += Math.round(bundle.magicPowerAdd || 0); spec.power = Math.max(spec.physicalPower, spec.magicPower);
  spec.armor += Math.round(bundle.armorAdd || 0); spec.attackSpeedMult = bundle.attackSpeedMult || 1; spec.skillHasteMult = bundle.skillHasteMult || 1;
  spec.effectPowerMult = bundle.effectPowerMult || 1; spec.effectResistPct = Math.min(.65, bundle.effectResistPct || 0); spec.receivedHealingMult = bundle.receivedHealingMult || 1;
  spec.mechanicModifiers = clone(bundle.mechanicModifiers || {});
  return spec;
}

function enemySpec(role, name, slotIndex, tier = 1, scales = {}) {
  return roleSpec(role, name, slotIndex, { hp: (.72 + tier * .11) * (scales.hp || 1), power: (.68 + tier * .11) * (scales.power || 1), armor: scales.armor || 1, unitKind: "enemy" });
}

function militiaSpec(index, slotIndex = index) {
  return roleSpec(militiaRole(index), `灰谷村民兵第${index + 1}队`, slotIndex, { hp: .82, power: .74, armor: .9, unitKind: "militia" });
}

function trainedSpec(state, index, slotIndex = index) {
  const spec = roleSpec(trainedRole(index), `灰谷战士第${index + 1}队`, slotIndex, { hp: 1.26, power: 1.18, armor: 1.12, unitKind: "trained" });
  return applyEquipmentToCombatSpec(state, trainedUnitId(index), spec);
}

function formationDeploymentRows(state, deployment, capacity) {
  if (!deployment) return null;
  const deploymentCapacity = Number(deployment.capacity);
  if (!Number.isInteger(deploymentCapacity) || deploymentCapacity <= 0 || deploymentCapacity > capacity || !Array.isArray(deployment.memberIds)) return null;
  const memberIds = [...new Set(deployment.memberIds.map(String))];
  if (!memberIds.length || memberIds.length > deploymentCapacity) return null;
  const available = new Set([
    ...state.roster,
    ...Array.from({ length: trainedUnits(state) }, (_, index) => trainedUnitId(index)),
    ...Array.from({ length: militiaUnits(state) - trainedUnits(state) }, (_, index) => militiaUnitId(index)),
  ]);
  if (memberIds.some((id) => !available.has(id))) return null;
  const memberSet = new Set(memberIds);
  const used = new Set();
  const rows = [];
  const positions = Array.isArray(deployment.positions) ? deployment.positions.slice(0, deploymentCapacity) : [];
  positions.forEach((rawId, slotIndex) => {
    const id = String(rawId || "");
    if (!memberSet.has(id) || used.has(id)) return;
    used.add(id); rows.push({ id, slotIndex });
  });
  const openSlots = Array.from({ length: deploymentCapacity }, (_, index) => index).filter((slotIndex) => !rows.some((row) => row.slotIndex === slotIndex));
  for (const id of memberIds) {
    if (used.has(id)) continue;
    rows.push({ id, slotIndex: openSlots.shift() });
  }
  return rows.sort((a, b) => a.slotIndex - b.slotIndex);
}

function formationCombatTeam(state, deployment, capacity) {
  const rows = formationDeploymentRows(state, deployment, capacity);
  if (!rows) return null;
  return rows.map(({ id, slotIndex }) => {
    if (HEROES[id] && state.roster.includes(id)) return heroCombatSpec(state, id, slotIndex);
    const trainedIndex = trainedUnitIndex(id);
    if (trainedIndex >= 0 && trainedIndex < trainedUnits(state)) return trainedSpec(state, trainedIndex, slotIndex);
    const militiaIndex = militiaUnitIndex(id);
    if (militiaIndex >= 0 && militiaIndex < militiaUnits(state) - trainedUnits(state)) return militiaSpec(militiaIndex, slotIndex);
    return null;
  }).filter(Boolean);
}

function formationSoldierFood(team) {
  return team.reduce((sum, unit) => sum + (unit.unitKind === "trained" ? 3 : unit.unitKind === "militia" ? 1 : 0), 0);
}

function resolveFormationSupply(state, fullFood, deployment) {
  const required = Math.max(0, Math.floor(Number(fullFood) || 0));
  const hasExplicitSupply = Boolean(deployment && Object.prototype.hasOwnProperty.call(deployment, "foodSupplied"));
  const requested = hasExplicitSupply ? Math.floor(Number(deployment.foodSupplied) || 0) : required;
  const foodCommitted = Math.max(0, Math.min(required, Math.floor(Number(state.resources.food) || 0), requested));
  const supplyRatio = required > 0 ? foodCommitted / required : 1;
  const performance = required > 0 ? .2 + .8 * supplyRatio : 1;
  return { fullFood: required, foodCommitted, supplyRatio, performance, performancePct: Math.round(performance * 100) };
}

function applySupplyPerformance(team, performance) {
  if (performance >= .999) return team;
  return team.map((unit) => {
    const scaled = { ...unit };
    const basePower = Number(unit.power ?? 1);
    const basePhysicalPower = Number(unit.physicalPower ?? basePower);
    const baseMagicPower = Number(unit.magicPower ?? basePower);
    scaled.maxHp = Math.max(1, Math.round(Number(unit.maxHp ?? unit.hp ?? 1) * performance));
    scaled.hp = scaled.maxHp;
    scaled.physicalPower = Math.max(0, Math.round(basePhysicalPower * performance));
    scaled.magicPower = Math.max(0, Math.round(baseMagicPower * performance));
    scaled.power = Math.max(1, scaled.physicalPower, scaled.magicPower, Math.round(basePower * performance));
    scaled.armor = Math.max(0, Math.round(Number(unit.armor ?? 0) * performance));
    return scaled;
  });
}

function expeditionArmy(state, limit = 3) {
  const total = militiaUnits(state);
  const trained = Math.min(trainedUnits(state), limit);
  const regular = Math.min(Math.max(0, total - trainedUnits(state)), limit - trained);
  const rows = [];
  for (let index = 0; index < trained; index += 1) rows.push({ spec: trainedSpec(state, index), food: 3, trained: true });
  for (let index = 0; index < regular; index += 1) rows.push({ spec: militiaSpec(index), food: 1, trained: false });
  return rows;
}

function huntPlan(state, deployment = null) {
  if (state.phase !== "management") return null;
  const difficulty = grindProgress(state).selectedDifficulty;
  const config = GRIND_DIFFICULTIES[difficulty];
  const deployed = formationCombatTeam(state, deployment, 4);
  if (deployment && !deployed) return null;
  const unscaledLeftTeam = deployed || state.activeParty.slice(0, 4).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const supply = deployed ? resolveFormationSupply(state, formationSoldierFood(deployed), deployment) : { fullFood: 0, foodCommitted: 0, supplyRatio: 1, performance: 1, performancePct: 100 };
  const leftTeam = deployed ? applySupplyPerformance(unscaledLeftTeam, supply.performance) : unscaledLeftTeam;
  const rightTeam = config.enemies.map(([role, name], index) => enemySpec(role, name, index, config.enemyTier, config.scale));
  return { kind: "hunt", title: `边林讨伐 · 难度${difficulty}「${config.name}」`, seed: `${state.seed}|hunt|${difficulty}|${state.stats.grindAttempts}|food${supply.foodCommitted}`, leftTeam, rightTeam, maxTime: 80, ...supply, lootTier: config.lootTier, lootCountLabel: config.lootCountLabel, rarityLabel: config.rarityLabel, grindDifficulty: difficulty };
}

function raidFoodRequirement(state, raidId) {
  const raid = RAIDS[raidId];
  return raid ? raid.baseFood + expeditionArmy(state).reduce((sum, row) => sum + row.food, 0) : 0;
}

function raidPlan(state, raidId, deployment = null) {
  const raid = RAIDS[raidId];
  if (!raid || state.phase !== "management" || state.ap <= 0 || state.resolvedRaids[raidId] || !raid.unlock(state)) return null;
  const deployed = formationCombatTeam(state, deployment, 8);
  if (deployment && !deployed) return null;
  const food = deployed ? raid.baseFood + formationSoldierFood(deployed) : raidFoodRequirement(state, raidId);
  const heroes = deployed ? [] : state.activeParty.slice(0, 4).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const soldiers = deployed ? [] : expeditionArmy(state).map((row, index) => ({ ...row.spec, slotIndex: heroes.length + index }));
  const unscaledLeftTeam = deployed || [...heroes, ...soldiers];
  const supply = resolveFormationSupply(state, food, deployment);
  const leftTeam = applySupplyPerformance(unscaledLeftTeam, supply.performance);
  const rightTeam = raid.enemies.map(([role, name], index) => enemySpec(role, name, index, raid.tier, raid.combatScale));
  return { kind: "raid", raidId, title: raid.title, seed: `${state.seed}|raid|${raidId}|${state.stats.combats}|food${supply.foodCommitted}`, leftTeam, rightTeam, maxTime: 100, ...supply, deployedArmy: leftTeam.filter((unit) => unit.unitKind === "trained" || unit.unitKind === "militia").length };
}

function ancientRuinsFoodRequirement(state, stage = ancientRuinsState(state).stage) {
  const config = stage === "heart" ? ANCIENT_RUINS.heart : ANCIENT_RUINS.entrance;
  const heroes = state.activeParty.slice(0, config.formationCapacity);
  const soldiers = expeditionArmy(state, Math.max(0, config.formationCapacity - heroes.length));
  return config.baseFood + soldiers.reduce((sum, row) => sum + row.food, 0);
}

function ancientRuinsPlan(state, stage, deployment = null) {
  const progress = ancientRuinsState(state);
  if (state.phase !== "management" || state.ap <= 0 || progress.completed || progress.stage !== stage || !["entrance", "heart"].includes(stage)) return null;
  const config = stage === "heart" ? ANCIENT_RUINS.heart : ANCIENT_RUINS.entrance;
  const deployed = formationCombatTeam(state, deployment, config.formationCapacity);
  if (deployment && !deployed) return null;
  const heroes = deployed ? [] : state.activeParty.slice(0, config.formationCapacity).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const soldiers = deployed ? [] : expeditionArmy(state, Math.max(0, config.formationCapacity - heroes.length)).map((row, index) => ({ ...row.spec, slotIndex: heroes.length + index }));
  const unscaledLeftTeam = deployed || [...heroes, ...soldiers];
  if (stage === "heart" && progress.approach === "supply") {
    unscaledLeftTeam.push(roleSpec("mage", `${HEROES.mentor.name}（虚弱）`, unscaledLeftTeam.length, { hp: .58, power: .55, armor: .76, unitKind: "guest" }));
  }
  const fullFood = config.baseFood + (deployed ? formationSoldierFood(deployed) : soldiers.reduce((sum, row) => sum + row.food, 0));
  const supply = resolveFormationSupply(state, fullFood, deployment);
  const leftTeam = applySupplyPerformance(unscaledLeftTeam, supply.performance);
  const enemyRows = stage === "heart" && progress.approach === "route" ? config.enemies.slice(0, -2) : config.enemies;
  const rightTeam = enemyRows.map(([role, name], index) => enemySpec(role, name, index, config.tier, config.combatScale));
  const fixedNote = stage === "heart" && progress.approach === "supply" ? `${HEROES.mentor.name}以魔力枯竭状态固定参战，不占编队单位` : "";
  return {
    kind: "challenge", challengeId: ANCIENT_RUINS.id, challengeStage: stage, title: config.title,
    seed: `${state.seed}|challenge|${stage}|${progress.approach || "none"}|${state.stats.combats}|food${supply.foodCommitted}`,
    leftTeam, rightTeam, maxTime: stage === "heart" ? 125 : 110, ...supply,
    formationCapacity: config.formationCapacity, fixedNote,
    deployedArmy: leftTeam.filter((unit) => unit.unitKind === "trained" || unit.unitKind === "militia").length,
  };
}

function trainingPlan(state, deployment = null) {
  if (state.phase !== "management" || state.ap <= 0 || trainedUnits(state) >= militiaUnits(state)) return null;
  const deployed = formationCombatTeam(state, deployment, 4);
  if (deployment && !deployed) return null;
  const heroes = deployed || state.activeParty.slice(0, 4).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const candidate = militiaSpec(trainedUnits(state), deployment ? 4 : heroes.length);
  const rightTeam = [["warrior", "圣殿训练兵"], ["knight", "圣殿盾教官"], ["ranger", "圣殿射术教官"]].map(([role, name], index) => enemySpec(role, name, index, 2, { hp: 1.62, power: 1.3, armor: 1.08 }));
  const unscaledLeftTeam = [...heroes, candidate];
  const fullFood = 6 + (deployed ? formationSoldierFood(deployed) : 0);
  const supply = resolveFormationSupply(state, fullFood, deployment);
  const leftTeam = applySupplyPerformance(unscaledLeftTeam, supply.performance);
  return { kind: "training", title: "民兵实战训练", seed: `${state.seed}|training|${state.day}|${state.stats.soldiersTrained}|${state.stats.combats}|food${supply.foodCommitted}`, leftTeam, rightTeam, maxTime: 80, ...supply, trainedOnWin: 1 };
}

function finalBattlePlan(state, foodAvailable = state.resources.food, deployment = null) {
  if (state.phase !== "final") return null;
  const deployed = formationCombatTeam(state, deployment, 20);
  if (deployment && !deployed) return null;
  const heroes = deployed ? [] : state.activeParty.slice(0, 10).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const total = militiaUnits(state);
  const trained = trainedUnits(state);
  const regular = total - trained;
  const fullFood = deployed ? formationSoldierFood(deployed) : trained * 3 + regular;
  let food = Math.max(0, Math.min(state.resources.food, Number(foodAvailable) || 0));
  const soldiers = [];
  let deployedTrained = 0;
  let deployedMilitia = 0;
  for (let index = 0; index < trained && food >= 3; index += 1) { soldiers.push(trainedSpec(state, index, heroes.length + soldiers.length)); food -= 3; deployedTrained += 1; }
  for (let index = 0; index < regular && food >= 1; index += 1) { soldiers.push(militiaSpec(index, heroes.length + soldiers.length)); food -= 1; deployedMilitia += 1; }
  const foodCommitted = deployedTrained * 3 + deployedMilitia;
  const unscaledLeftTeam = deployed || [...heroes, ...soldiers];
  const supply = deployed ? resolveFormationSupply(state, fullFood, deployment) : null;
  const leftTeam = deployed ? applySupplyPerformance(unscaledLeftTeam, supply.performance) : unscaledLeftTeam;
  const remainingUnits = Math.max(0, state.enemy.orcUnits);
  const roles = ["warrior", "knight", "ranger", "warrior", "berserker"];
  const rightTeam = Array.from({ length: remainingUnits }, (_, index) => enemySpec(roles[index % roles.length], `兽人军团第${index + 1}队`, index, 3, { hp: 1.25, power: 1.06, armor: 1.11 }));
  const bossDefs = [["knight", "兽人铁壁主将"], ["berserker", "兽人狂战主将"], ["warlock", "兽人血鼓主将"]];
  for (let index = 0; index < state.enemy.bosses; index += 1) rightTeam.push(enemySpec(bossDefs[index][0], bossDefs[index][1], rightTeam.length, 5, { hp: 2.62, power: 1.56, armor: 1.35 }));
  const selectedSoldiers = leftTeam.filter((unit) => unit.unitKind === "trained" || unit.unitKind === "militia");
  const selectedTrained = selectedSoldiers.filter((unit) => unit.unitKind === "trained").length;
  const selectedMilitia = selectedSoldiers.filter((unit) => unit.unitKind === "militia").length;
  const supplyFields = deployed ? supply : { fullFood, foodCommitted, supplyRatio: fullFood > 0 ? foodCommitted / fullFood : 1, performance: 1, performancePct: 100 };
  return { kind: "final", title: "灰谷村决战", seed: `${state.seed}|final|${state.stats.combats}|food${supplyFields.foodCommitted}`, leftTeam, rightTeam, maxTime: 150, ...supplyFields, deployedArmy: selectedSoldiers.length, totalArmy: deployed ? selectedSoldiers.length : total, deployedTrained: deployed ? selectedTrained : deployedTrained, deployedMilitia: deployed ? selectedMilitia : deployedMilitia };
}

function finalReadiness(state, preview = finalBattlePlan(state, state.resources.food)) {
  const heroes = state.activeParty.slice(0, 10);
  const deployedSoldiers = Array.from({ length: Number(preview?.deployedTrained || 0) }, (_, index) => trainedUnitId(index));
  const equippableAllies = [...heroes, ...deployedSoldiers];
  const occupiedSlots = equippableAllies.reduce((sum, targetId) => sum + Object.values(equipmentSlots(state, targetId)).filter(Boolean).length, 0);
  const equippedHeroes = heroes.filter((heroId) => Object.values(equipmentSlots(state, heroId)).some(Boolean)).length;
  const equippedSoldiers = deployedSoldiers.filter((targetId) => Object.values(equipmentSlots(state, targetId)).some(Boolean)).length;
  const equippedAllies = equippedHeroes + equippedSoldiers;
  const allies = heroes.length + Number(preview?.deployedArmy || 0);
  const enemies = Math.max(0, state.enemy.orcUnits) + Math.max(0, state.enemy.bosses);
  let risk = "势均力敌";
  if (equippedAllies === 0 || (equippedAllies * 3 < equippableAllies.length && allies + 3 < enemies)) risk = "极度危险";
  else if (allies < enemies || equippedAllies < equippableAllies.length) risk = "危险";
  else if (allies >= enemies + 3 && equippedAllies === equippableAllies.length) risk = "占优";
  return { risk, allies, enemies, heroes: heroes.length, equippedHeroes, soldiers: deployedSoldiers.length, equippedSoldiers, occupiedSlots };
}

function simulatePlan(plan) { return COMBAT.simulateTeams(plan.leftTeam, plan.rightTeam, { seed: plan.seed, maxTime: plan.maxTime, randomizeStats: false }); }

function natureSetMockPlan(variant = "set") {
  const setEnabled = variant !== "baseline";
  const setItems = EQUIPMENT_SETS.mockSetItems("verdantCircle", 6);
  const withVerdantSet = (spec) => setEnabled ? BUILD_LAYERS.applyBuildLayers(spec, { equipmentItems: setItems, tags: ["mock", "verdantCircle"] }) : spec;
  const guardian = roleSpec("knight", "演武守卫·石墙", 0, { hp: 1.42, power: .78, armor: 1.35, unitKind: "mock" });
  const healer = withVerdantSet(roleSpec("priest", "自然祭司·青芽", 2, { hp: 1.04, power: 1.12, armor: 1.02, small1: "verdantMend", small2: "verdantMend", unitKind: "mock" }));
  const warlock = withVerdantSet(roleSpec("warlock", "自然术士·盐枝", 3, { hp: 1.03, power: 1.15, armor: 1.02, small1: "venomBrand", small2: "venomBrand", ultimate: "plagueOffering", unitKind: "mock" }));
  healer.skillHasteMult = 1.18;
  warlock.skillHasteMult = 1.16;
  const enemies = [
    ["knight", "木桩重卫"],
    ["warrior", "披甲演武傀儡"],
    ["ranger", "弩机傀儡"],
    ["mage", "法术演武傀儡"],
  ].map(([role, name], index) => enemySpec(role, name, index, 3, { hp: 1.28, power: .9, armor: 1.04 }));
  return {
    kind: "mock",
    mock: true,
    mockVariant: setEnabled ? "set" : "baseline",
    title: setEnabled ? "繁生之环 · 六件套演武" : "繁生之环 · 无套装对照",
    seed: "verdant-circle-ab-v2",
    leftTeam: [guardian, healer, warlock],
    rightTeam: enemies,
    maxTime: 40,
    foodCommitted: 0,
    fullFood: 0,
  };
}
function combatWon(result) { return result?.metrics?.leftAlive > 0 && result?.metrics?.rightAlive === 0; }
function combatResultFingerprint(result) {
  if (!result || !result.metrics || !Array.isArray(result.units) || !Array.isArray(result.signals)) return null;
  const compact = {
    duration: Math.round(Number(result.duration || 0) * 1000),
    metrics: {
      leftAlive: Number(result.metrics.leftAlive || 0),
      rightAlive: Number(result.metrics.rightAlive || 0),
      leftDamage: Math.round(Number(result.metrics.leftDamage || 0)),
      rightDamage: Math.round(Number(result.metrics.rightDamage || 0)),
    },
    units: result.units.map((unit) => [unit.id, unit.side, Math.round(Number(unit.hp || 0) * 100), Math.round(Number(unit.damageDone || 0))]),
    signalCount: result.signals.length,
  };
  return hash(JSON.stringify(compact));
}
function combatSummary(result, title) {
  return { title, win: combatWon(result), duration: Math.round(Number(result.duration || 0) * 10) / 10, alliesStarted: result.units.filter((row) => row.side === "left").length, alliesAlive: result.metrics.leftAlive, enemiesStarted: result.units.filter((row) => row.side === "right").length, enemiesAlive: result.metrics.rightAlive, fallenAllies: result.units.filter((unit) => unit.side === "left" && Number(unit.hp || 0) <= 0).map((unit) => unit.name), alliesDamage: Math.round(result.metrics.leftDamage || 0), alliesHealing: Math.round(result.metrics.leftHealing || 0), alliesShield: Math.round(result.metrics.leftShield || 0), topAllies: result.units.filter((unit) => unit.side === "left").sort((a, b) => Number(b.damageDone || 0) - Number(a.damageDone || 0)).slice(0, 5).map((unit) => ({ name: unit.name, damage: Math.round(unit.damageDone || 0), healing: Math.round(unit.healingDone || 0), shield: Math.round(unit.shieldDone || 0) })) };
}

function publicActionId(state, internalId) {
  const grind = grindProgress(state);
  const grindSignature = `${grind.selectedDifficulty}|${grind.unlockedDifficulty}|${grind.totalWins}|${grind.unlockScore}|${Object.values(grind.winsByDifficulty).join(",")}`;
  return `choice_${hash(`${state.seed}|${state.day}|${state.ap}|${state.phase}|${state.stats.actionsSpent}|${state.stats.grindAttempts}|${grindSignature}|${internalId}`)}`;
}

const RESOURCE_LABELS = { gold: "金币", food: "粮食" };
function actionPointReason(state) { return state.ap > 0 ? "" : "今日行动力已用完；结束本日后恢复。"; }
function missingCostReason(state, cost) {
  const missing = Object.entries(cost || {}).map(([key, value]) => [key, Math.max(0, value - Number(state.resources[key] || 0))]).filter(([, value]) => value > 0);
  return missing.length ? `资源不足：${missing.map(([key, value]) => `还缺${value}${RESOURCE_LABELS[key] || key}`).join("、")}。` : "";
}
function withAvailability(row, ...reasons) {
  const parts = reasons.flat().filter(Boolean).map((reason) => String(reason).trim().replace(/[。；]+$/u, ""));
  const disabledReason = parts.length ? `${parts.join("；")}。` : "";
  return { ...row, available: !disabledReason, disabledReason };
}

function internalActions(state) {
  if (state.result) return [];
  if (state.phase === "prologue") {
    const lockedHunt = withAvailability({ id: "combat:hunt", label: "前往边林免费讨伐魔物", kind: "grind", actionPointCost: 0, description: "刷怪不消耗行动力；士兵出战需要军粮，英雄不需要。" }, "先完成当前开场剧情，组织好第一支队伍");
    if (state.storyStep === "arrival") return [{ id: "story:arrival", label: "陪伊莎贝拉巡视这座安静的边陲村", kind: "story", actionPointCost: 0 }, lockedHunt, ...equipmentActions(state)];
    if (state.storyStep === "survivors") return [
      { id: "story:save_scout", label: "先救掌握敌情的圣殿斥候莱恩", kind: "decision", actionPointCost: 0, knownResult: "莱恩将成为第二名圣殿骑士，并带回粮秣营位置" },
      { id: "story:save_guard", label: "先救伤势更重的圣殿盾骑马库斯", kind: "decision", actionPointCost: 0, knownResult: "马库斯将成为负伤盾骑，提供第二道前排，但当前战力低于伊莎贝拉" },
      lockedHunt,
      ...equipmentActions(state),
    ];
    return equipmentActions(state);
  }
  if (state.phase === "final") {
    const preview = finalBattlePlan(state, state.resources.food);
    const readiness = finalReadiness(state, preview);
    const rows = [{ id: "combat:final", label: `投入${preview.foodCommitted}粮食组织决战（${preview.deployedArmy}/${preview.totalArmy}支部队可以出战）`, kind: "combat", actionPointCost: 0, foodCost: preview.foodCommitted, fullFood: preview.fullFood, description: `军需官判断：${readiness.risk}。已知阵容${readiness.allies}对${readiness.enemies}；${readiness.heroes}名英雄中${readiness.equippedHeroes}名、${readiness.soldiers}支出战战士中${readiness.equippedSoldiers}支穿有装备，共占用${readiness.occupiedSlots}个部位。你仍可立即开战。` }];
    rows.push(withAvailability({ id: "combat:hunt", label: "前往边林免费讨伐魔物", kind: "grind", actionPointCost: 0, description: "刷怪不消耗行动力；士兵出战需要军粮，英雄不需要。" }, "兽人大军已经抵达，当前只能组织决战"));
    rows.push(...equipmentActions(state));
    return rows;
  }

  const grind = grindProgress(state);
  const selectedConfig = GRIND_DIFFICULTIES[grind.selectedDifficulty];
  const rows = [{ id: "combat:hunt", label: `挑战难度${grind.selectedDifficulty}「${selectedConfig.name}」`, kind: "grind", actionPointCost: 0, description: `胜利掉落：${selectedConfig.lootCountLabel}；${selectedConfig.rarityLabel}。` }];
  for (let difficulty = 1; difficulty <= GRIND_DIFFICULTY_COUNT; difficulty += 1) {
    const config = GRIND_DIFFICULTIES[difficulty];
    const previousTarget = difficulty > 1 ? GRIND_DIFFICULTIES[difficulty - 1].unlockScoreToNext : 0;
    const lockedReason = difficulty > grind.unlockedDifficulty ? `累计讨伐积分达到${previousTarget}后解锁（当前${Math.min(grind.unlockScore, previousTarget)}/${previousTarget}；难度N胜利获得N积分）` : "";
    rows.push(withAvailability({ id: `grind:select:${difficulty}`, label: difficulty === grind.selectedDifficulty ? `难度${difficulty}「${config.name}」· 当前` : `切换难度${difficulty}「${config.name}」`, kind: "grind_setting", operation: "select_grind_difficulty", actionPointCost: 0, targetDifficulty: difficulty, description: `${config.threat} · ${config.lootCountLabel} · ${config.rarityLabel}` }, lockedReason));
  }
  const apReason = actionPointReason(state);
  for (const slot of state.buildings.filter((row) => row.unlocked !== false && !row.type)) {
    for (const type of ["house", "farm", "smithy"]) {
      const def = BUILDINGS[type];
      const siteLabel = slot.site === "village" ? `${slot.slot + 1}号空地` : `${RAIDS[slot.site].title}建设位`;
      rows.push(withAvailability({ id: `build:${slot.slot}:${type}`, label: `在${siteLabel}修建${def.name}`, kind: "build", actionPointCost: 1, knownCost: {}, knownGain: type === "house" ? { populationCap: 25 } : {}, description: def.yieldLabel, targetSlot: slot.slot }, apReason));
    }
  }
  const conscription = state.buildings.find((row) => row.type === "conscription");
  if (conscription) {
    const capacityReason = state.resources.population < state.resources.populationCap ? "" : `实际人口已达上限（${state.resources.population}/${state.resources.populationCap}）；先修建或升级房屋。`;
    rows.push(withAvailability({ id: "recruit:basic", label: "派人接纳流民（预计6—10人）", kind: "recruit", actionPointCost: 1, knownCost: {} }, apReason, capacityReason));
    rows.push(withAvailability({ id: "recruit:funded", label: "投入10金币扩大征召（预计14—20人）", kind: "recruit", actionPointCost: 1, knownCost: { gold: 10 } }, apReason, capacityReason, missingCostReason(state, { gold: 10 })));
    const untrained = Math.max(0, militiaUnits(state) - trainedUnits(state));
    rows.push(withAvailability({ id: "combat:training", label: "进行民兵实战训练（满额需6粮，胜利后1队晋升战士）", kind: "combat", actionPointCost: 1, knownCost: {}, foodCost: 6, targetSlot: conscription.slot }, apReason, untrained > 0 ? "" : "目前没有尚未训练的民兵单位。"));
  }
  for (const [raidId, raid] of Object.entries(RAIDS)) {
    if (!raid.unlock(state) || state.resolvedRaids[raidId]) continue;
    const food = raidFoodRequirement(state, raidId);
    rows.push(withAvailability({ id: `combat:raid:${raidId}`, label: `突袭${raid.title}（满额需${food}粮，占领后解锁1个建设位）`, kind: "combat", actionPointCost: 1, knownCost: {}, foodCost: food, description: `胜利后永久控制此地，并削弱最终敌军；军粮不足也能出发，但部队发挥会下降。` }, apReason));
  }
  const ruins = ancientRuinsState(state);
  if (!ruins.completed && ruins.stage === "entrance") {
    const food = ancientRuinsFoodRequirement(state, "entrance");
    rows.push(withAvailability({ id: "combat:challenge:ancient_ruins:entrance", label: `突破远古遗迹封锁回廊（高难·4单位，满额需${food}粮）`, kind: "combat", actionPointCost: 1, knownCost: {}, foodCost: food, description: "守卫强度高于魔潮腹地；胜利后才能继续深入遗迹。", targetChallengeId: ANCIENT_RUINS.id, targetChallengeStage: "entrance" }, apReason));
  } else if (!ruins.completed && ruins.stage === "secret_room") {
    rows.push(withAvailability({ id: "challenge:ancient_ruins:supply", label: "拿出12份粮食和恢复药，先让老师恢复意识", kind: "challenge", actionPointCost: 0, knownCost: { food: 12 }, description: "艾琳仍会非常虚弱，但能在下一场战斗中固定保护薇奥拉。", targetChallengeId: ANCIENT_RUINS.id, targetChallengeStage: "secret_room" }, missingCostReason(state, { food: 12 })));
    rows.push({ id: "challenge:ancient_ruins:route", label: "不强迫老师起身，听薇奥拉复盘机关并寻找密道", kind: "challenge", actionPointCost: 0, knownCost: {}, description: "薇奥拉能带队绕开一部分古代守卫；艾琳无法参加下一场战斗。", targetChallengeId: ANCIENT_RUINS.id, targetChallengeStage: "secret_room" });
  } else if (!ruins.completed && ruins.stage === "heart") {
    const food = ancientRuinsFoodRequirement(state, "heart");
    const approachText = ruins.approach === "supply" ? "艾琳会以虚弱状态固定参战" : "薇奥拉已经标出避开两组守卫的密道";
    rows.push(withAvailability({ id: "combat:challenge:ancient_ruins:heart", label: `挑战守秘者大厅（极高难·8单位，满额需${food}粮）`, kind: "combat", actionPointCost: 1, knownCost: {}, foodCost: food, description: `${approachText}；胜利后才能把两人带出遗迹。`, targetChallengeId: ANCIENT_RUINS.id, targetChallengeStage: "heart" }, apReason));
  }
  const event = Object.entries(EVENTS).find(([id, row]) => row.day === state.day && !state.resolvedEvents[id]);
  if (event) for (const option of event[1].options) rows.push(withAvailability({ id: `event:${event[0]}:${option.id}`, label: option.label, kind: "event", actionPointCost: 1, knownCost: clone(option.cost || {}), description: option.description }, apReason, option.req && !option.req(state) ? option.reqText || "尚未满足条件。" : ""));
  if (hasBuilding(state, "market")) {
    for (const stock of state.market.stock.filter((row) => row.count > 0)) rows.push(withAvailability({ id: `market:buy:${stock.id}`, label: `购买${stock.label}（${stock.price}金币，余${stock.count}份）`, kind: "market", actionPointCost: 0, knownCost: { gold: stock.price }, description: stock.item ? marketItemSummary(stock.item) : "", targetStockId: stock.id }, missingCostReason(state, { gold: stock.price })));
    for (const item of unequippedItems(state)) {
      const price = salePrice(item);
      rows.push(withAvailability({ id: `market:sell:${item.id}`, label: `向集市出售${item.name}（获得${price}金币）`, kind: "market", actionPointCost: 0, knownGain: { gold: price }, targetItemId: item.id }, state.market.sellRemaining > 0 ? "" : "集市今日已经收购5件装备；明日恢复。"));
    }
  }
  rows.push(...equipmentActions(state));
  const activeCap = state.day >= FINAL_DAY ? 10 : 4;
  for (const heroId of state.roster) {
    if (!state.activeParty.includes(heroId)) rows.push(withAvailability({ id: `party:add:${heroId}`, label: `${HEROES[heroId].name}加入出战队伍`, kind: "party", actionPointCost: 0, targetHeroId: heroId }, state.activeParty.length < activeCap ? "" : `当前出战队伍已满（${state.activeParty.length}/${activeCap}）。`));
    else rows.push(withAvailability({ id: `party:remove:${heroId}`, label: `${HEROES[heroId].name}回到候补`, kind: "party", actionPointCost: 0, targetHeroId: heroId }, heroId === "player" ? "主角不能离开出战队伍。" : "", state.activeParty.length > 1 ? "" : "出战队伍至少需要1人。"));
  }
  rows.push({ id: "time:end", label: "结束本日", kind: "time", actionPointCost: 0 });
  return rows;
}

function actionCatalog(state) { return internalActions(state).map((row) => ({ ...row, available: row.available !== false, disabledReason: row.disabledReason || "", publicId: publicActionId(state, row.id) })); }
function canPay(state, cost) { return Object.entries(cost || {}).every(([key, value]) => Number(state.resources[key] || 0) >= value); }
function pay(state, cost) { if (!canPay(state, cost)) throw new Error("资源不足。"); for (const [key, value] of Object.entries(cost || {})) state.resources[key] -= value; }
function spendAction(state) { if (state.ap <= 0) throw new Error("今日已经没有行动力。"); state.ap -= 1; state.stats.actionsSpent += 1; }
function equippedIds(state) { return new Set(equipmentTargetIds(state).flatMap((targetId) => Object.values(equipmentSlots(state, targetId)).filter(Boolean))); }
function unequippedItems(state) { const equipped = equippedIds(state); return state.inventory.filter((item) => !equipped.has(item.id)); }
function salePrice(item) { return ({ "普通": 2, "稀有": 4, "史诗": 8, "传说": 12, "神话": 18, "永恒": 26, "黑金": 38, "炼狱": 55 })[item.rarity] || 1; }
function marketItemSummary(item) {
  const bases = Object.entries(item.baseStats || {}).map(([key, value]) => `${AFFIX_DEFS[key]?.label || key}+${value}`);
  const affixes = (item.affixes || []).slice(0, 4).map((row) => `${row.label}+${row.value}${row.percent ? "%" : ""}`);
  return `${item.rarity}${item.slotLabel}，评分+${item.power}；${[...bases, ...affixes].join("、") || "无额外词条"}`;
}

function equipmentActions(state) {
  const rows = [];
  const targets = equipmentTargetIds(state);
  const selectedTarget = targets.includes(state.selectedHeroId) ? state.selectedHeroId : targets[0];
  const selectedInfo = equipmentTargetInfo(state, selectedTarget);
  if (!selectedTarget || !selectedInfo) return rows;
  rows.push({ id: "autoequip_all", label: "一键按显示评分为英雄与战士分配装备", kind: "equipment", operation: "auto_equip_all", actionPointCost: 0, knownResult: "重新分配现有装备，不消耗行动力；已训练战士也会参与分配。" });
  for (const targetId of targets) if (targetId !== selectedTarget) {
    const info = equipmentTargetInfo(state, targetId);
    rows.push({ id: `select:${targetId}`, label: `查看并为${info.name}配装`, kind: "selection", actionPointCost: 0, targetHeroId: targetId });
  }
  rows.push({ id: `autoequip:${selectedTarget}`, label: `一键为${selectedInfo.name}换上最高评分装备`, kind: "equipment", operation: "auto_equip", actionPointCost: 0, targetHeroId: selectedTarget, knownResult: "只使用无人穿戴的装备，不会抢走其他单位身上的物品。" });
  for (const item of unequippedItems(state)) rows.push({ id: `equip:${selectedTarget}:${item.id}`, label: `让${selectedInfo.name}装备${item.name}`, kind: "equipment", actionPointCost: 0, targetHeroId: selectedTarget, targetItemId: item.id });
  for (const [slot, itemId] of Object.entries(equipmentSlots(state, selectedTarget))) {
    const item = state.inventory.find((row) => row.id === itemId);
    if (item) rows.push({ id: `unequip:${selectedTarget}:${slot}`, label: `卸下${selectedInfo.name}的${item.name}`, kind: "equipment", actionPointCost: 0, targetHeroId: selectedTarget, targetItemId: item.id, targetEquipmentSlot: slot, operation: "unequip" });
  }
  return rows;
}

function equippedPower(state, targetId) {
  return Object.values(equipmentSlots(state, targetId)).reduce((sum, itemId) => sum + Number(state.inventory.find((item) => item.id === itemId)?.power || 0), 0);
}

function autoEquipTarget(state, targetId) {
  const info = equipmentTargetInfo(state, targetId);
  if (!info) throw new Error("无法为这个单位整理装备。");
  const slots = ensureEquipmentSlots(state, targetId);
  const currentIds = new Set(Object.values(slots).filter(Boolean));
  const candidates = state.inventory.filter((item) => currentIds.has(item.id) || !equippedIds(state).has(item.id));
  const beforePower = equippedPower(state, targetId);
  const changedSlots = [];
  for (const slot of Object.keys(SLOT_DATA)) {
    const currentId = slots[slot];
    const best = candidates.filter((item) => item.slot === slot).sort((a, b) => Number(b.power || 0) - Number(a.power || 0) || rarityIndex(b.rarity) - rarityIndex(a.rarity) || Number(b.equipmentLevel || 0) - Number(a.equipmentLevel || 0) || String(a.id).localeCompare(String(b.id)))[0];
    if (!best || best.id === currentId) continue;
    slots[slot] = best.id;
    changedSlots.push(SLOT_DATA[slot].label);
  }
  const afterPower = equippedPower(state, targetId);
  if (changedSlots.length) addLog(state, `${info.name}一键更换${changedSlots.length}个部位（${changedSlots.join("、")}），装备评分${beforePower}→${afterPower}（+${afterPower - beforePower}）。`, "equipment");
  else addLog(state, `${info.name}已经穿着当前可用的最高评分装备。`, "equipment");
}

function autoEquipAllTargets(state) {
  const targets = equipmentTargetIds(state);
  const before = targets.reduce((sum, targetId) => sum + Object.values(equipmentSlots(state, targetId)).filter(Boolean).length, 0);
  for (const targetId of targets) state.equipment[targetId] = emptyEquipment();
  for (const slot of Object.keys(SLOT_DATA)) {
    const items = state.inventory.filter((item) => item.slot === slot).sort((a, b) => Number(b.power || 0) - Number(a.power || 0) || rarityIndex(b.rarity) - rarityIndex(a.rarity) || String(a.id).localeCompare(String(b.id)));
    for (let index = 0; index < Math.min(targets.length, items.length); index += 1) state.equipment[targets[index]][slot] = items[index].id;
  }
  const after = targets.reduce((sum, targetId) => sum + Object.values(equipmentSlots(state, targetId)).filter(Boolean).length, 0);
  const equippedTargets = targets.filter((targetId) => Object.values(equipmentSlots(state, targetId)).some(Boolean)).length;
  addLog(state, `已按显示评分把现有装备分给英雄与战士：${equippedTargets}/${targets.length}个单位穿有装备，共占用${after}个部位${after === before ? "（装备数量不变）" : `（原${before}个）`}。`, "equipment");
}

function applyPlayerAction(stateInput, publicId) {
  const match = actionCatalog(stateInput).find((row) => row.publicId === publicId);
  if (!match) throw new Error("这个行动已经不在当前画面中。");
  if (!match.available) throw new Error(match.disabledReason || "当前无法执行这个行动。");
  if (["combat", "grind"].includes(match.kind)) throw new Error("战斗必须先完整运行实际战斗过程，不能直接结算。");
  const state = clone(stateInput);
  applyInternalAction(state, match.id);
  enforceInventoryLimit(state);
  return state;
}

function applyInternalAction(state, id) {
  if (id === "story:arrival") {
    recruitHero(state, "captain"); state.activeParty = ["player", "captain"];
    state.day = 2; state.storyStep = "survivors";
    addLog(state, "夜里没有发生袭击。第二天黄昏，巡逻队的两名幸存者跌进村口：山后不是零星魔物，而是二十支兽人军团和三名主将。药物只够优先稳定一人。", "threat");
    return;
  }
  if (id === "story:save_scout" || id === "story:save_guard") {
    const heroId = id.endsWith("scout") ? "scout" : "guard";
    recruitHero(state, heroId); state.activeParty = ["player", "captain", heroId]; state.flags.foragerIntel = true;
    state.day = 3; state.phase = "management"; state.storyStep = null;
    addLog(state, `${HEROES[heroId].name}活了下来。伊莎贝拉把敌军规模写在村口木板上：400名兽人，折算20个军团单位，另有3名主将，第7日抵达。`, "threat");
    addLog(state, "整理巡逻队沿途记录时，众人在北侧山壁发现一座远古遗迹：入口散落着昂贵的探险器材，脚印只有进去的，没有出来的。", "challenge_unlock");
    morning(state); return;
  }
  if (id.startsWith("build:")) {
    const [, slotText, type] = id.split(":"); const slot = state.buildings[Number(slotText)]; const def = BUILDINGS[type];
    if (!slot || slot.unlocked === false || slot.type || !["house", "farm", "smithy"].includes(type)) throw new Error("这块建设位当前无法使用。");
    spendAction(state); slot.type = type; slot.level = 1; slot.complete = true;
    if (type === "house") state.resources.populationCap += 25;
    if (type === "smithy") settleSmithIncome(state);
    const site = slot.site === "village" ? "村庄" : RAIDS[slot.site].title;
    addLog(state, `${site}的${def.name}立即建成。${def.yieldLabel}。`, "construction"); return;
  }
  if (id.startsWith("recruit:")) {
    const mode = id.split(":")[1]; const configs = { basic: { gold: 0, range: [6, 10] }, funded: { gold: 10, range: [14, 20] } }; const cfg = configs[mode];
    if (!cfg) throw new Error("不存在这种征召方式。");
    const oldActionCapacity = actionPointsForPopulation(state.resources.population);
    pay(state, { gold: cfg.gold }); spendAction(state); const rolled = randomInt(state, cfg.range[0], cfg.range[1]); const joined = Math.max(0, Math.min(rolled, state.resources.populationCap - state.resources.population)); state.resources.population += joined;
    addLog(state, `征召队带回${rolled}名流民，房屋容量允许其中${joined}人实际加入村庄。实际人口现为${state.resources.population}。`, "population");
    const newActionCapacity = actionPointsForPopulation(state.resources.population);
    if (newActionCapacity > oldActionCapacity) addLog(state, `实际人口跨过门槛，每日行动上限${oldActionCapacity}→${newActionCapacity}；从明日开始按新上限刷新。`, "population");
    return;
  }
  if (id.startsWith("market:buy:")) {
    const stockId = id.slice("market:buy:".length); const stock = state.market.stock.find((row) => row.id === stockId && row.count > 0); if (!stock) throw new Error("商品已经售罄。"); pay(state, { gold: stock.price }); stock.count -= 1;
    state.inventory.push({ ...clone(stock.item), id: `${stock.item.id}_bought_${state.stats.actionsSpent}` });
    addLog(state, `从集市购买了${stock.label}。`, "market"); return;
  }
  if (id.startsWith("market:sell:")) {
    const itemId = id.slice("market:sell:".length); const item = unequippedItems(state).find((row) => row.id === itemId); if (!item) throw new Error("这件装备无法出售。"); if (state.market.sellRemaining <= 0) throw new Error("集市今日已经收购5件装备。"); const price = salePrice(item);
    state.market.sellRemaining -= 1; state.resources.gold += price; state.inventory = state.inventory.filter((row) => row.id !== itemId); state.stats.itemsSold += 1; addLog(state, `集市以${price}金币买走了${item.name}，今日还能出售${state.market.sellRemaining}件装备。`, "market"); return;
  }
  if (id === "challenge:ancient_ruins:supply" || id === "challenge:ancient_ruins:route") {
    const ruins = ensureAncientRuinsState(state);
    if (ruins.stage !== "secret_room" || ruins.completed) throw new Error("密室里的选择已经过去了。");
    if (id.endsWith("supply")) {
      pay(state, { food: 12 }); ruins.approach = "supply";
      addLog(state, "你把12份粮食和恢复药交给薇奥拉。艾琳恢复了意识，却连站稳都很困难；她坚持靠着墙握住剑，要在下一场战斗中继续保护学生。", "challenge_choice");
    } else {
      ruins.approach = "route";
      addLog(state, "你没有强迫艾琳起身。薇奥拉把被困数日记下的机关变化全部画了出来，最终指出一条能绕开两组古代守卫的密道。", "challenge_choice");
    }
    ruins.stage = "heart"; return;
  }
  if (id.startsWith("event:")) { applyEvent(state, id.split(":")[1], id.split(":")[2]); spendAction(state); return; }
  if (id === "autoequip_all") { autoEquipAllTargets(state); return; }
  if (id.startsWith("select:")) { state.selectedHeroId = id.split(":")[1]; return; }
  if (id.startsWith("autoequip:")) { autoEquipTarget(state, id.split(":")[1]); return; }
  if (id.startsWith("equip:")) {
    const [, targetId, itemId] = id.split(":"); const item = unequippedItems(state).find((row) => row.id === itemId); const info = equipmentTargetInfo(state, targetId); if (!item || !info) throw new Error("无法进行这次装备操作。");
    ensureEquipmentSlots(state, targetId)[item.slot] = item.id; addLog(state, `${info.name}装备了${item.name}。`, "equipment"); return;
  }
  if (id.startsWith("unequip:")) {
    const [, targetId, slot] = id.split(":"); const itemId = equipmentSlots(state, targetId)[slot]; const item = state.inventory.find((row) => row.id === itemId); const info = equipmentTargetInfo(state, targetId);
    if (!item || !info || targetId !== state.selectedHeroId) throw new Error("无法卸下这件装备。");
    ensureEquipmentSlots(state, targetId)[slot] = null; addLog(state, `${info.name}卸下了${item.name}。`, "equipment"); return;
  }
  if (id.startsWith("party:")) {
    const [, op, heroId] = id.split(":"); if (op === "add" && !state.activeParty.includes(heroId)) state.activeParty.push(heroId); if (op === "remove") state.activeParty = state.activeParty.filter((row) => row !== heroId); return;
  }
  if (id.startsWith("grind:select:")) {
    const difficulty = Number(id.split(":")[2]);
    const grind = ensureGrindProgress(state);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > grind.unlockedDifficulty) throw new Error("这个刷关难度尚未解锁。");
    grind.selectedDifficulty = difficulty;
    addLog(state, `边林讨伐已切换到难度${difficulty}「${GRIND_DIFFICULTIES[difficulty].name}」。`, "grind"); return;
  }
  if (id === "time:end") { endDay(state); return; }
  throw new Error(`未知行动：${id}`);
}

function applyEvent(state, eventId, optionId) {
  const event = EVENTS[eventId];
  const option = event?.options.find((row) => row.id === optionId);
  if (!event || !option) throw new Error("这个事件选项已经不存在。");
  pay(state, option.cost || {});
  const oldActionCapacity = actionPointsForPopulation(state.resources.population);
  state.resolvedEvents[eventId] = optionId;
  if (eventId === "refugees") {
    if (optionId === "people") { const joined = Math.min(22, state.resources.populationCap - state.resources.population); state.resources.population += joined; addLog(state, `村庄尽量挤出住处，${joined}名流民实际加入。`, "event"); }
    else { recruitHero(state, "sellsword"); const joined = Math.min(5, state.resources.populationCap - state.resources.population); state.resources.population += joined; addLog(state, `赤犬和${joined}名家人留在村庄。`, "recruit"); }
  } else if (eventId === "witch") {
    if (optionId === "shelter") { recruitHero(state, "witch"); state.flags.shamanIntel = true; state.flags.captainTrustLow = true; addLog(state, "盐枝加入队伍，并在地图上标出血鼓萨满祭坛。伊莎贝拉没有阻止，但此后不再主动与你谈论圣殿戒律。", "recruit"); }
    else { state.flags.captainBlessed = true; addLog(state, "盐枝离开了。伊莎贝拉重新加固盾甲，并把圣殿骑士组织成更稳固的防线。", "event"); }
  } else if (eventId === "hunter") {
    state.flags.beastIntel = true;
    if (optionId === "recruit") { recruitHero(state, "hunter"); addLog(state, "支付8金币修好猎具；苔牙加入队伍，同时标出披甲战兽栏。", "recruit"); }
    else { const joined = Math.min(15, state.resources.populationCap - state.resources.population); state.resources.population += joined; addLog(state, `苔牙带${joined}名流民从安全山路进村，并标出披甲战兽栏。`, "population"); }
  } else if (eventId === "caravan") {
    if (optionId === "food") { state.resources.food += 30; addLog(state, "支付12金币后，商队卸下30份军粮，随后连夜南下。", "event"); }
    else { recruitHero(state, "alchemist"); addLog(state, "支付12金币后，旅行炼金师罗莎决定留下参加决战。", "recruit"); }
  }
  const newActionCapacity = actionPointsForPopulation(state.resources.population);
  if (newActionCapacity > oldActionCapacity) addLog(state, `实际人口跨过门槛，每日行动上限${oldActionCapacity}→${newActionCapacity}；从明日开始按新上限刷新。`, "population");
}

function recruitHero(state, heroId) {
  if (!state.roster.includes(heroId)) { state.roster.push(heroId); if (state.activeParty.length < 4) state.activeParty.push(heroId); addLog(state, `${HEROES[heroId].name}加入队伍。`, "recruit"); }
}

function endDay(state) {
  if (state.day >= 6) {
    state.day = FINAL_DAY; state.phase = "final"; state.ap = 0;
    const farms = buildingRows(state, "farm");
    let finalFood = 0;
    const yields = [];
    for (const farm of farms) {
      const amount = randomInt(state, 8, 12);
      finalFood += amount;
      yields.push(amount);
    }
    state.resources.food += finalFood;
    if (finalFood) addLog(state, `决战日清晨，${farms.length}块农田共收获${finalFood}粮食（${yields.join("+")}）。今日不再进行经营行动。`, "production");
    while (state.activeParty.length < Math.min(10, state.roster.length)) { const next = state.roster.find((heroId) => !state.activeParty.includes(heroId)); if (!next) break; state.activeParty.push(next); }
    addLog(state, `第7日清晨，剩余${state.enemy.orcUnits}个兽人军团单位和${state.enemy.bosses}名主将抵达灰谷村。村庄有${trainedUnits(state)}支战士、${militiaUnits(state) - trainedUnits(state)}支民兵和${state.activeParty.length}名英雄可供集结。`, "final"); return;
  }
  state.day += 1; morning(state);
}

function preparePlayerCombat(state, publicId, deployment = null) {
  const match = actionCatalog(state).find((row) => row.publicId === publicId);
  if (!match || !match.available || !["combat", "grind"].includes(match.kind)) return null;
  let plan = null;
  if (match.id === "combat:hunt") plan = huntPlan(state, deployment);
  else if (match.id === "combat:training") plan = trainingPlan(state, deployment);
  else if (match.id.startsWith("combat:raid:")) plan = raidPlan(state, match.id.split(":")[2], deployment);
  else if (match.id.startsWith("combat:challenge:ancient_ruins:")) plan = ancientRuinsPlan(state, match.id.split(":")[3], deployment);
  else if (match.id === "combat:final") plan = finalBattlePlan(state, state.resources.food, deployment);
  return plan ? { ...clone(plan), publicActionId: publicId, deployment: deployment ? clone(deployment) : null } : null;
}

function applyPlayerCombatResult(stateInput, publicId, result, deployment = null) {
  const match = actionCatalog(stateInput).find((row) => row.publicId === publicId);
  if (!match || !["combat", "grind"].includes(match.kind)) throw new Error("这个战斗已经不在当前画面中。");
  if (!match.available) throw new Error(match.disabledReason || "当前无法发起这个战斗。");
  const state = clone(stateInput); const plan = preparePlayerCombat(stateInput, publicId, deployment); if (!plan) throw new Error("无法重建战斗计划。");
  const verifiedResult = simulatePlan(plan);
  if (!combatResultFingerprint(result) || combatResultFingerprint(result) !== combatResultFingerprint(verifiedResult)) throw new Error("战斗结果与实际模拟过程不一致，拒绝结算。");
  result = verifiedResult;
  state.stats.combats += 1; const summary = combatSummary(result, plan.title); state.lastCombat = { ...summary, foodCommitted: plan.foodCommitted || 0, fullFood: plan.fullFood || plan.foodCommitted || 0, performancePct: Number(plan.performancePct || 100), deployedArmy: plan.deployedArmy || 0, totalArmy: plan.totalArmy || plan.deployedArmy || 0 }; if (!summary.win) state.stats.failedCombats += 1;
  if (plan.kind === "hunt") {
    const grind = ensureGrindProgress(state);
    const difficulty = Math.max(1, Math.min(GRIND_DIFFICULTY_COUNT, Number(plan.grindDifficulty) || grind.selectedDifficulty));
    state.stats.grindAttempts += 1;
    if (summary.win) {
      state.resources.food -= plan.foodCommitted;
      state.stats.grindWins += 1;
      grind.totalWins = state.stats.grindWins;
      grind.winsByDifficulty[difficulty] += 1;
      grind.unlockScore += difficulty;
      const previousUnlocked = grind.unlockedDifficulty;
      const config = GRIND_DIFFICULTIES[difficulty];
      grind.unlockedDifficulty = unlockedGrindDifficulty(grind.unlockScore);
      const lootCount = weightedPick(state, config.lootCountTable);
      const items = Array.from({ length: lootCount }, () => generateItem(state, `边林难度${difficulty}`, plan.lootTier || difficulty, weightedPick(state, config.rarityTable)));
      state.inventory.push(...items); const gold = registerGearDrops(state, items.length);
      addLog(state, `难度${difficulty}讨伐获胜（军粮${plan.foodCommitted}/${plan.fullFood || 0}，发挥${plan.performancePct || 100}%；本场+${difficulty}积分，累计${grind.unlockScore}积分，本档${grind.winsByDifficulty[difficulty]}胜），得到${items.map((item) => item.name).join("、")}；今日新装备${state.economy.dailyGearDrops}件${gold ? `，铁匠铺新增${gold}金币收入` : ""}。`, "loot");
      if (grind.unlockedDifficulty > previousUnlocked) addLog(state, `累计讨伐${grind.unlockScore}积分，难度${grind.unlockedDifficulty}「${GRIND_DIFFICULTIES[grind.unlockedDifficulty].name}」已经解锁。难度N胜利会获得N积分。`, "grind_unlock");
    } else addLog(state, `难度${difficulty}讨伐失败，讨伐积分不增加；可以立即重试或切回已解锁的低难度。`, "combat_loss");
  } else if (plan.kind === "training") {
    if (summary.win) {
      state.resources.food -= plan.foodCommitted; spendAction(state);
      const newUnitIndex = trainedUnits(state);
      state.army.trainedUnits = newUnitIndex + 1;
      ensureEquipmentSlots(state, trainedUnitId(newUnitIndex));
      state.stats.soldiersTrained += 1; addLog(state, `实战训练获胜，${trainedTargetInfo(newUnitIndex).name}正式成军并开放8个装备部位。现有${trainedUnits(state)}支战士；战士每次出战消耗3粮。`, "training");
    } else addLog(state, "实战训练失败；本次不消耗行动力和粮食，可以立即重试。", "combat_loss");
  } else if (plan.kind === "raid") {
    const raid = RAIDS[plan.raidId];
    if (summary.win) {
      state.resources.food -= plan.foodCommitted; spendAction(state);
      state.resolvedRaids[plan.raidId] = true; state.enemy.orcUnits = Math.max(0, state.enemy.orcUnits - raid.removedUnits); if (raid.removesBoss) state.enemy.bosses = Math.max(0, state.enemy.bosses - 1);
      const outpostPlot = state.buildings.find((row) => row.slot === raid.plotSlot); if (outpostPlot) outpostPlot.unlocked = true;
      for (const [key, value] of Object.entries(raid.reward)) state.resources[key] += value;
      const items = Array.from({ length: raid.loot }, () => generateItem(state, raid.title, Math.min(4, raid.tier))); state.inventory.push(...items); const smithGold = registerGearDrops(state, items.length);
      const rewardText = Object.entries(raid.reward).map(([key, value]) => `${RESOURCE_LABELS[key] || key}+${value}`).join("、") || "无额外资源";
      addLog(state, `突袭支付${plan.foodCommitted}粮；据点缴获${rewardText}；带回${items.length}件装备${smithGold ? `，并使铁匠铺追加收入${smithGold}金币` : ""}。`, "loot");
      addLog(state, `${raid.title}已被占领：最终敌军减少${raid.removedUnits}个军团单位${raid.removesBoss ? "和1名主将" : ""}，原地解锁1个建设位。`, "raid_win");
    } else addLog(state, `${raid.title}突袭失败；本次不消耗行动力和粮食，据点仍在，可以立即重试。`, "raid_loss");
  } else if (plan.kind === "challenge") {
    const ruins = ensureAncientRuinsState(state);
    if (summary.win && plan.challengeStage === "entrance") {
      state.resources.food -= plan.foodCommitted; spendAction(state); ruins.stage = "secret_room";
      const items = [generateItem(state, ANCIENT_RUINS.title, 4, "史诗"), generateItem(state, ANCIENT_RUINS.title, 4, "传说")];
      state.inventory.push(...items); const smithGold = registerGearDrops(state, items.length);
      addLog(state, `封锁回廊被突破，带回${items.map((item) => item.name).join("、")}${smithGold ? `；铁匠铺追加收入${smithGold}金币` : ""}。`, "loot");
      addLog(state, "回廊尽头的密室里，富家小姐薇奥拉抱着她的女保镖兼老师艾琳。两人已经被困数日，补给彻底耗尽；艾琳的魔力早已枯竭，虚弱地躺在学生怀里，石门外的古代守卫仍在撞击。", "challenge_story");
    } else if (summary.win && plan.challengeStage === "heart") {
      state.resources.food -= plan.foodCommitted; spendAction(state); ruins.stage = "complete"; ruins.completed = true;
      const relic = generateItem(state, ANCIENT_RUINS.title, 4, "永恒"); relic.name = `远古遗珍·${relic.slotLabel}`;
      const items = [relic, generateItem(state, ANCIENT_RUINS.title, 4), generateItem(state, ANCIENT_RUINS.title, 4)];
      state.inventory.push(...items); const smithGold = registerGearDrops(state, items.length);
      recruitHero(state, "heiress"); recruitHero(state, "mentor");
      addLog(state, `守秘者大厅被清空，队伍带回${items.map((item) => item.name).join("、")}${smithGold ? `；铁匠铺追加收入${smithGold}金币` : ""}。`, "loot");
      addLog(state, "薇奥拉和艾琳被安全带回灰谷村。艾琳需要休养才能恢复魔法，但两人都决定留下：薇奥拉负责辨认遗物，艾琳康复后继续担任她的老师与护卫。", "challenge_complete");
    } else {
      addLog(state, `${plan.title}挑战失败；本次不消耗行动力和粮食，剧情进度保持不变，可以更换编队后重试。`, "challenge_loss");
    }
  } else {
    if (summary.win) {
      state.resources.food -= plan.foodCommitted; state.phase = "complete"; state.result = { win: true, title: "灰谷村守住了", day: state.day, population: state.resources.population, militiaUnits: militiaUnits(state), trainedUnits: trainedUnits(state), deployedArmy: plan.deployedArmy, totalArmy: plan.totalArmy, remainingEnemyUnits: state.enemy.orcUnits, remainingBosses: state.enemy.bosses, combat: clone(summary) };
      addLog(state, "灰谷村守住了。伊莎贝拉把染血的圣殿旗交给你保管。", "victory");
    } else {
      state.result = null;
      addLog(state, "决战失败。本次挑战不消耗粮食；队伍已回到战前状态，可以立即重新挑战。", "defeat");
    }
  }
  enforceInventoryLimit(state); return state;
}

function enforceInventoryLimit(state) {
  const excess = Math.max(0, state.inventory.length - INVENTORY_LIMIT); if (!excess) return [];
  const equipped = equippedIds(state); const removable = state.inventory.filter((item) => !equipped.has(item.id)).sort((a, b) => rarityIndex(a.rarity) - rarityIndex(b.rarity) || a.power - b.power); const removed = removable.slice(0, excess); const ids = new Set(removed.map((item) => item.id)); state.inventory = state.inventory.filter((item) => !ids.has(item.id)); state.stats.autoDiscarded = Number(state.stats.autoDiscarded || 0) + removed.length; return removed;
}

const SKILL_DAMAGE_LABELS = { physical: "物理", fire: "火焰", poison: "毒素", arcane: "奥术", blood: "直接" };
const PASSIVE_DETAILS = {
  lineBreaker: ["对前排目标造成的伤害提高6%。"],
  fortressStance: ["自身获得的护盾提高8%；每损失1%生命，再提高0.12%，最多共提高20%。"],
  duelistFocus: ["目标每有1层标记，对其造成的伤害提高4.5%。"],
  rageEngine: ["生命越低，造成的伤害最高提高50%，攻击速度最高提高75%。", "造成伤害时吸取5.5%—19.5%生命，损失生命越多吸血越高。"],
  hotbedPact: ["中毒敌人死亡时，把其剩余毒层的18%（向上取整）扩散给其他敌人，持续6秒。"],
  catalyst: ["对带有任意异常状态的目标造成的伤害提高6%。"],
};

function skillPercent(value) { return `${Math.round(Number(value || 0) * 1000) / 10}%`; }
function skillPowerLabel(type) { return type === "physical" ? "物理攻击" : "魔法攻击"; }
function skillDamageFormula(effect, options = {}) {
  const type = options.type || effect.type || effect.scaleWith || "physical";
  const flat = Number(options.flat ?? effect.flat ?? 0);
  const ratio = Number(options.power ?? effect.power ?? 0) + .04;
  const parts = [];
  if (flat) parts.push(String(flat));
  if (ratio) parts.push(`${skillPowerLabel(effect.scaleWith || type)}×${skillPercent(ratio)}`);
  return { formula: parts.join(" + ") || "0", damage: SKILL_DAMAGE_LABELS[type] || type };
}

function describeSkillEffect(effect) {
  if (["hitTarget", "hitEnemies"].includes(effect.kind)) {
    const value = skillDamageFormula(effect);
    const target = effect.kind === "hitTarget" ? "单个敌人" : effect.count == null ? "所有敌人" : `至多${effect.count}名敌人`;
    return [`对${target}造成${value.formula}点${value.damage}伤害（护甲结算前）。`];
  }
  if (effect.kind === "hitMarkedTarget") {
    const value = skillDamageFormula(effect);
    return [`对目标造成${value.formula} + 每层标记${effect.perMark || 0}点${value.damage}伤害（护甲结算前）。${effect.consumeMark ? "随后清除标记。" : ""}`];
  }
  if (effect.kind === "hitTargetWithStatus") {
    const value = skillDamageFormula(effect);
    return [`对目标造成${value.formula} + 每层异常${effect.perStatus || 0}点${value.damage}伤害，最多计算${effect.maxStatus || 0}层（护甲结算前）。`];
  }
  if (effect.kind === "markTarget") return [`施加${effect.stacks || 0}层标记，最多叠加${effect.max || 0}层。`];
  if (effect.kind === "poisonTarget") return [`对单个敌人施加${effect.stacks || 0}层中毒，持续${effect.time || 0}秒，最高20层。`];
  if (effect.kind === "poisonEnemies") return [`对所有敌人施加${effect.stacks || 0}层中毒，持续${effect.time || 0}秒，最高20层。`];
  if (effect.kind === "selfRawDamage") return [`消耗自身最大生命的${skillPercent(effect.maxHp)}，该伤害不受护甲减免。`];
  if (effect.kind === "buffCarryPower") return [`使攻击最高的友军物理攻击与魔法攻击提高${effect.amount || 0}，持续${effect.duration || 0}秒。`];
  if (effect.kind === "targetTimer" && effect.timer === "slowTimer") return [`使目标减速${effect.duration || 0}秒：移动速度降低40%，普攻间隔增加25%。`];
  if (effect.kind === "timer" && effect.timer === "guardTimer") return [`自身受到的伤害降低28%，持续${effect.duration || 0}秒。`];
  if (effect.kind === "timer" && effect.timer === "tauntTimer") return [`嘲讽敌人${effect.duration || 0}秒，使其优先攻击自己。`];
  if (effect.kind === "timer" && effect.timer === "bloodFuryTimer") return [`进入血怒${effect.duration || 0}秒：普攻额外造成物理攻击×${skillPercent(SKILLS.berserkerModel?.ratios?.blood ?? .48)}的物理伤害。`];
  if (effect.kind === "timer" && effect.timer === "whirlwindTimer") return [`进入旋风架势${effect.duration || 0}秒：普攻主目标额外受到物理攻击×${skillPercent(SKILLS.berserkerModel?.ratios?.whirlwind ?? .26)}伤害，并溅射另外${SKILLS.berserkerModel?.splashTargets ?? 2}名敌人物理攻击×${skillPercent(SKILLS.berserkerModel?.ratios?.splash ?? .18)}。`];
  if (effect.kind === "teamTimer" && effect.timer === "bonusPowerTimer") return [`全队物理攻击与魔法攻击提高14，持续${effect.duration || 0}秒。`];
  if (effect.kind === "teamTimer" && effect.timer === "guardTimer") return [`全队受到的伤害降低28%，持续${effect.duration || 0}秒。`];
  if (effect.kind === "teamShield") {
    const target = effect.selfOnly ? "自身" : "全队每名角色";
    return [`为${target}提供${effect.flat || 0} + 魔法攻击×${skillPercent(effect.power)}点护盾。`];
  }
  if (effect.kind === "arrowStorm") return ["对所有敌人造成29 + 物理攻击×32%的物理伤害；后排目标额外受到16点伤害（护甲结算前）。"];
  if (effect.kind === "plagueOffering") return ["引爆所有中毒敌人：造成22 + 魔法攻击×26% + 每层中毒9点毒素伤害，并保留原毒层的45%（护甲结算前）。"];
  if (effect.kind === "grandMixture") return ["对所有敌人造成18 + 魔法攻击×20% + 每层异常8点奥术伤害，最多计算8层异常（护甲结算前）。"];
  if (effect.kind === "berserkerRoar") {
    const model = SKILLS.berserkerModel || {};
    return [
      `${model.durations?.immortal ?? 4.5}秒内生命不会低于1点。`,
      `${model.durations?.haste ?? 5}秒内攻击速度提高${skillPercent((model.hasteMultiplier ?? 1.35) - 1)}，并获得${skillPercent(model.passive?.roarLeech ?? .18)}吸血。`,
      `同时获得${model.durations?.roarFury ?? 5}秒血怒与旋风效果。`,
    ];
  }
  return [];
}

function skillNumericDetails(key, definition) {
  if (PASSIVE_DETAILS[key]) return clone(PASSIVE_DETAILS[key]);
  const details = (definition.effects || []).flatMap(describeSkillEffect).filter(Boolean);
  return [...new Set(details.length ? details : [definition.desc || "技能详情尚未记录。"])];
}

function combatPowerVisible(spec) {
  const mainPower = Math.max(Number(spec.physicalPower || 0), Number(spec.magicPower || 0));
  const tempoBonus = Math.max(0, Number(spec.attackSpeedMult || 1) - 1) + Math.max(0, Number(spec.skillHasteMult || 1) - 1);
  return Math.max(1, Math.round(Number(spec.maxHp || 0) + mainPower * 5 + Number(spec.armor || 0) * 10 + tempoBonus * 200));
}

function combatProfileVisible(spec) {
  const skillSlots = [["small1", "技能一"], ["small2", "技能二"], ["passive", "被动"], ["ultimate", "终极技能"]];
  return {
    combatPower: combatPowerVisible(spec),
    stats: {
      maxHp: spec.maxHp,
      physicalPower: spec.physicalPower,
      magicPower: spec.magicPower,
      armor: spec.armor,
      attackSpeedPct: Math.round(((spec.attackSpeedMult || 1) - 1) * 100),
      skillHastePct: Math.round(((spec.skillHasteMult || 1) - 1) * 100),
    },
    skills: skillSlots.map(([slot, slotLabel]) => {
      const key = spec[slot];
      const definition = SKILLS.skills[key] || {};
      return { slot, slotLabel, key, name: definition.name || key, type: definition.type || slotLabel, cooldown: Number(definition.cooldown || 0), description: definition.desc || "技能详情尚未记录。", details: skillNumericDetails(key, definition) };
    }),
  };
}

function heroVisible(state, heroId) {
  const equipment = Object.entries(equipmentSlots(state, heroId)).map(([slot, itemId]) => ({ slot, slotLabel: SLOT_DATA[slot].label, item: itemId ? clone(state.inventory.find((row) => row.id === itemId) || null) : null }));
  const profile = combatProfileVisible(heroCombatSpec(state, heroId, 0));
  return { id: heroId, name: HEROES[heroId].name, role: HEROES[heroId].role, roleKey: HEROES[heroId].combatRole, kind: "hero", preferredAffixes: clone(HEROES[heroId].preferredAffixes || []), active: state.activeParty.includes(heroId), equipment, ...profile };
}

function trainedVisible(state, index) {
  const info = trainedTargetInfo(index);
  const equipment = Object.entries(equipmentSlots(state, info.id)).map(([slot, itemId]) => ({ slot, slotLabel: SLOT_DATA[slot].label, item: itemId ? clone(state.inventory.find((row) => row.id === itemId) || null) : null }));
  const profile = combatProfileVisible(trainedSpec(state, index, 0));
  return { ...info, preferredAffixes: clone(info.preferredAffixes), active: true, equipment, ...profile };
}

function militiaVisible(index) {
  const info = militiaTargetInfo(index);
  const equipment = Object.keys(SLOT_DATA).map((slot) => ({ slot, slotLabel: SLOT_DATA[slot].label, item: null, locked: true }));
  const profile = combatProfileVisible(militiaSpec(index, 0));
  return { ...info, active: true, equipmentLocked: true, equipmentLockReason: "民兵必须经过实战训练成为战士后，才能使用装备。", equipment, ...profile };
}

function ancientRuinsVisible(state) {
  if (state.phase === "prologue") return null;
  const ruins = ancientRuinsState(state);
  if (ruins.completed) return { id: ANCIENT_RUINS.id, title: ANCIENT_RUINS.title, stage: "complete", completed: true, kicker: "高难剧情挑战 · 已完成", description: "薇奥拉与艾琳已经获救，守秘者大厅也被清空。遗迹深处仍保持封闭。", status: "救援完成 · 获得永恒遗珍 · 两名角色加入" };
  if (ruins.stage === "secret_room") return { id: ANCIENT_RUINS.id, title: ANCIENT_RUINS.title, stage: ruins.stage, completed: false, kicker: "高难剧情挑战 · 密室", description: "密室里，富家小姐薇奥拉抱着她的女保镖兼老师艾琳。两人已经被困数日，没有任何补给；艾琳魔力枯竭，虚弱地躺在学生怀里。", status: "石门外仍有守卫 · 当前需要决定如何救援" };
  if (ruins.stage === "heart") {
    const route = ruins.approach === "supply" ? "艾琳恢复意识，但只能以虚弱状态参加下一战。" : "薇奥拉已经标出能避开两组守卫的密道，艾琳仍无法起身。";
    return { id: ANCIENT_RUINS.id, title: ANCIENT_RUINS.title, stage: ruins.stage, completed: false, kicker: "高难剧情挑战 · 最深处", description: `${route}想把两人带出去，必须穿过守秘者大厅。`, status: "极高难度 · 8单位上限 · 胜利奖励包含永恒遗珍" };
  }
  return { id: ANCIENT_RUINS.id, title: ANCIENT_RUINS.title, stage: "entrance", completed: false, kicker: "高难剧情挑战 · 未探索", description: "北侧山壁嵌着一座没有记载的远古遗迹。入口散落着昂贵的探险器材，地上只有进入遗迹的脚印，没有出来的。", status: "入口守卫强度高于魔潮腹地 · 4单位上限" };
}

function currentEvent(state) { return Object.entries(EVENTS).find(([id, row]) => row.day === state.day && !state.resolvedEvents[id]) || null; }

function buildingYieldStatus(state, row) {
  if (!row.type) return "建设后立即生效";
  if (row.type === "farm") return "明晨预计收获8—12粮食";
  if (row.type === "smithy") return `今日新装备${state.economy.dailyGearDrops}/20件（${Math.round(smithUtilization(state.economy.dailyGearDrops) * 100)}%产能）；全部铁匠铺已收入${state.economy.smithGoldPaid}金币`;
  if (row.type === "house") return `当前人口${state.resources.population}/${state.resources.populationCap}`;
  if (row.type === "market") return `今日还能出售${state.market.sellRemaining}件；剩余商品${state.market.stock.reduce((sum, item) => sum + item.count, 0)}件`;
  if (row.type === "conscription") return `每次消耗1行动；可追加10金币提高人数`;
  return "";
}

function getPlayerObservation(state) {
  const catalog = actionCatalog(state);
  const grind = grindProgress(state);
  const event = currentEvent(state);
  const story = state.phase === "prologue" ? state.storyStep === "arrival" ? { title: "安静的边陲村", text: "圣殿骑士队长伊莎贝拉认为附近只有零星魔物。她准备明日派出巡逻队。" } : { title: "巡逻队覆灭", text: "两名幸存者带回敌情：约400名兽人，折算20个军团单位，另有3名主将，第7日抵达。" } : null;
  const visibleHeroes = state.roster.map((heroId) => heroVisible(state, heroId));
  const visibleTrained = Array.from({ length: trainedUnits(state) }, (_, index) => trainedVisible(state, index));
  const visibleMilitia = Array.from({ length: militiaUnits(state) - trainedUnits(state) }, (_, index) => militiaVisible(index));
  const prosperity = townProsperity(state);
  return {
    schema: "border_village_war_player_observation_v2",
    time: { day: state.day, finalDay: FINAL_DAY, phase: state.phase, actionsRemaining: state.ap, actionCapacity: actionPointsForPopulation(state.resources.population) },
    story,
    town: { id: "gray_valley", name: "灰谷村", population: state.resources.population, populationCap: state.resources.populationCap, actionsRemaining: state.ap, actionCapacity: prosperity.actionCapacity, prosperity },
    war: { knownEnemyUnits: state.enemy.orcUnits, knownBosses: state.enemy.bosses, militiaUnits: militiaUnits(state), trainedUnits: trainedUnits(state), untrainedUnits: militiaUnits(state) - trainedUnits(state), finalBattleDay: FINAL_DAY, publicRule: "前期每达到10名实际人口形成1支部队；民兵一战满额需要1粮，训练后的战士需要3粮。粮食不足仍可出战，但发挥下降。", finalMorningRule: "第7日决战前仍会收获一次农田，但不再获得经营行动力。" },
    resources: clone(state.resources),
    buildings: state.buildings.filter((row) => row.unlocked !== false).map((row) => ({ slot: row.slot, site: row.site, siteTitle: row.site === "village" ? "灰谷村" : RAIDS[row.site].title, type: row.type, name: row.type ? BUILDINGS[row.type].name : "空建设位", level: row.level, complete: row.complete, yieldType: row.type ? BUILDINGS[row.type].yieldType : "建设", yieldLabel: row.type ? BUILDINGS[row.type].yieldLabel : "可建农田 / 铁匠铺 / 房屋", yieldStatus: buildingYieldStatus(state, row), description: row.type ? BUILDINGS[row.type].description : "选择一种持久收益；建造消耗1行动力并立即完成。" })),
    productionForecasts: buildingRows(state, "farm").map((row) => ({ slot: row.slot, level: row.level, nextYieldRange: [8, 12] })),
    economy: { dailyGearDrops: state.economy.dailyGearDrops, smithGoldPaid: state.economy.smithGoldPaid, smithyCount: buildingRows(state, "smithy").length, smithyUtilization: smithUtilization(state.economy.dailyGearDrops) },
    grind: {
      selectedDifficulty: grind.selectedDifficulty,
      unlockedDifficulty: grind.unlockedDifficulty,
      totalWins: grind.totalWins,
      unlockScore: grind.unlockScore,
      selectedWinScore: grind.selectedDifficulty,
      nextUnlockDifficulty: grind.unlockedDifficulty < GRIND_DIFFICULTY_COUNT ? grind.unlockedDifficulty + 1 : null,
      nextUnlockScore: grind.unlockedDifficulty < GRIND_DIFFICULTY_COUNT ? GRIND_DIFFICULTIES[grind.unlockedDifficulty].unlockScoreToNext : null,
      levels: Array.from({ length: GRIND_DIFFICULTY_COUNT }, (_, index) => {
        const difficulty = index + 1;
        const config = GRIND_DIFFICULTIES[difficulty];
        const wins = grind.winsByDifficulty[difficulty];
        const unlocked = difficulty <= grind.unlockedDifficulty;
        const unlockAtScore = difficulty > 1 ? GRIND_DIFFICULTIES[difficulty - 1].unlockScoreToNext : 0;
        return { difficulty, name: config.name, threat: config.threat, wins, winScore: difficulty, unlockAtScore, winsAtPreviousDifficulty: difficulty > 1 ? GRIND_DIFFICULTIES[difficulty - 1].winsAtCurrentDifficultyToNext : 0, lootCountLabel: config.lootCountLabel, rarityLabel: config.rarityLabel, lootCountChances: config.lootCountTable.map(([count, chance]) => ({ count, chance })), rarityChances: config.rarityTable.map(([rarity, chance]) => ({ rarity, chance })), unlocked, selected: difficulty === grind.selectedDifficulty, lockedReason: unlocked ? "" : `累计讨伐积分${unlockAtScore}后解锁；难度N胜利获得N积分` };
      }),
    },
    market: { sellRemaining: state.market.sellRemaining, priceRule: "每天刷新3件装备；每天最多出售5件未穿戴装备", stock: state.market.stock.filter((row) => row.count > 0).map((row) => ({ id: row.id, label: row.label, type: row.type, price: row.price, count: row.count, item: row.item ? clone(row.item) : null })) },
    challenge: ancientRuinsVisible(state),
    party: { selectedHeroId: equipmentTargetIds(state).includes(state.selectedHeroId) ? state.selectedHeroId : state.roster[0], activeLimit: state.phase === "final" ? 10 : 4, finalBattleRule: "第7日决战会自动集结全部已招募英雄；已训练战士按军粮出战，并使用各自8部位装备。", heroes: visibleHeroes, trainedUnits: visibleTrained, militiaUnits: visibleMilitia, equipmentTargets: [...visibleHeroes, ...visibleTrained], characterTargets: [...visibleHeroes, ...visibleTrained, ...visibleMilitia] },
    inventory: state.inventory.map((item) => clone(item)), inventoryLimit: INVENTORY_LIMIT,
    raids: Object.entries(RAIDS).filter(([id, raid]) => raid.unlock(state) && !state.resolvedRaids[id]).map(([id, raid]) => ({ id, title: raid.title, description: raid.description, foodCost: raidFoodRequirement(state, id), visibleEffectOnVictory: `占领后解锁1个建设位；最终敌军减少${raid.removedUnits}个军团单位${raid.removesBoss ? "和1名主将" : ""}` })),
    outposts: Object.entries(RAIDS).filter(([id]) => state.resolvedRaids[id]).map(([id, raid]) => ({ id, title: raid.title, description: `已经控制的前哨；可以在原地建立持久产能。`, plotSlot: raid.plotSlot })),
    event: event ? { id: event[0], title: event[1].title, scene: event[1].scene } : null,
    recentSignals: state.recent.slice(0, 10).map((row) => ({ day: row.day, kind: row.kind, text: row.text })),
    lastCombat: clone(state.lastCombat), result: clone(state.result),
    actions: catalog.map((row) => ({ id: row.publicId, label: row.label, kind: row.kind, available: row.available, disabledReason: row.disabledReason, actionPointCost: row.actionPointCost || 0, knownCost: clone(row.knownCost || {}), knownGain: clone(row.knownGain || {}), description: row.description || row.knownResult || "", foodCost: row.foodCost || 0, fullFood: row.fullFood || 0, targetSlot: Number.isInteger(row.targetSlot) ? row.targetSlot : null, targetHeroId: row.targetHeroId || null, targetItemId: row.targetItemId || null, targetStockId: row.targetStockId || null, targetEquipmentSlot: row.targetEquipmentSlot || null, targetDifficulty: Number.isInteger(row.targetDifficulty) ? row.targetDifficulty : null, targetChallengeId: row.targetChallengeId || null, targetChallengeStage: row.targetChallengeStage || null, operation: row.operation || null })),
  };
}

return {
  VERSION, FINAL_DAY, INVENTORY_LIMIT, HEROES, BUILDINGS, RAIDS, ANCIENT_RUINS, EVENTS, SLOT_DATA, RARITY_DATA, GRIND_DIFFICULTIES, PROSPERITY_LEVELS, POPULATION_UNIT_MILESTONES,
  createInitialState, getPlayerObservation, actionPointsForPopulation, townProsperity, militiaUnits, trainedUnits, smithUtilization, internalActions,
  applyPlayerAction, preparePlayerCombat, applyPlayerCombatResult, simulatePlan, combatResultFingerprint, huntPlan, trainingPlan, raidPlan, ancientRuinsPlan, finalBattlePlan, natureSetMockPlan,
};
});
