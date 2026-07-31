(function (root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.BORDER_VILLAGE_WAR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
"use strict";

const COMBAT = typeof module !== "undefined" && module.exports ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM;
const SKILLS = typeof module !== "undefined" && module.exports ? require("../game_data/skill-data") : root.GAME_SKILL_DATA;
const BUILD_LAYERS = typeof module !== "undefined" && module.exports ? require("../game_data/build-layers") : root.GAME_BUILD_LAYERS;
const GEAR_RULES = typeof module !== "undefined" && module.exports ? require("../fifteen_day_demo/fifteen-day-core") : root.FIFTEEN_DAY_DEMO;

const VERSION = "border_village_war_v2";
const FINAL_DAY = 7;
const INVENTORY_LIMIT = 200;
const SLOT_DATA = GEAR_RULES.SLOT_DATA;
const RARITY_DATA = GEAR_RULES.RARITY_DATA;
const AFFIX_DEFS = GEAR_RULES.AFFIX_DEFS;
const RARITIES = RARITY_DATA.map((row) => row.label);
const RARITY_BY_LABEL = Object.fromEntries(RARITY_DATA.map((row) => [row.label, row]));
const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);

const HEROES = {
  player: { name: "你", role: "近战指挥", combatRole: "warrior", base: 55, preferredAffixes: ["武力", "坚韧"] },
  captain: { name: "圣殿骑士队长·伊莎贝拉", role: "守护与号令", combatRole: "knight", base: 66, preferredAffixes: ["坚韧", "韧性"] },
  scout: { name: "圣殿斥候·莱恩", role: "远程侦察", combatRole: "ranger", base: 50, preferredAffixes: ["敏捷", "暴击率"] },
  guard: { name: "圣殿盾骑·马库斯", role: "重甲保护", combatRole: "knight", base: 53, preferredAffixes: ["坚韧", "韧性"] },
  sellsword: { name: "流民佣兵·赤犬", role: "近战爆发", combatRole: "berserker", base: 54, preferredAffixes: ["武力", "暴击伤害"] },
  witch: { name: "边林女巫·盐枝", role: "持续削弱", combatRole: "warlock", base: 58, preferredAffixes: ["奥术", "效果强度"] },
  hunter: { name: "山地猎人·苔牙", role: "猎杀大型敌人", combatRole: "ranger", base: 57, preferredAffixes: ["敏捷", "暴击率"] },
  alchemist: { name: "旅行炼金师·罗莎", role: "范围破阵", combatRole: "alchemist", base: 58, preferredAffixes: ["奥术", "节律"] },
};

const BUILDINGS = {
  house: { name: "房屋", unique: false, buildActions: 1, cost: { gold: 8, iron: 4 }, description: "增加人口上限；不会凭空增加实际人口。" },
  farm: { name: "农田", unique: false, buildActions: 1, cost: { gold: 6, iron: 3 }, description: "每天早晨随机产出战斗军粮。" },
  conscription: { name: "征召所", unique: true, buildActions: 2, cost: { gold: 10, iron: 5 }, description: "消耗行动派人接纳流民；投入金币可以提高本次效率。" },
  smithy: { name: "铁匠铺", unique: true, buildActions: 2, cost: { gold: 12, iron: 6 }, description: "分解装备，并消耗铁料与精钢定向打造史诗装备。" },
  market: { name: "集市", unique: true, buildActions: 2, cost: { gold: 10, iron: 4 }, description: "以固定价格交易；每日购买力与库存随机刷新。" },
};

const RAIDS = {
  foragers: { title: "兽人粮秣营", description: "侦察报告显示三支搬运队守着粮车。", unlock: (s) => Boolean(s.flags.foragerIntel), enemies: [["warrior", "搬运队"], ["warrior", "搬运队"], ["ranger", "护粮射手"]], tier: 2, removedUnits: 2, reward: { food: 18 }, loot: 2 },
  beastPen: { title: "披甲战兽栏", description: "木栏里关着准备投入总攻的披甲战兽。", unlock: (s) => Boolean(s.flags.beastIntel), enemies: [["berserker", "披甲战兽"], ["berserker", "披甲战兽"], ["knight", "兽栏卫士"], ["ranger", "驯兽射手"]], tier: 3, removedUnits: 3, reward: { iron: 10 }, loot: 3 },
  shaman: { title: "血鼓萨满祭坛", description: "女巫辨认出山脊血鼓正在强化总攻部队。", unlock: (s) => Boolean(s.flags.shamanIntel), enemies: [["knight", "祭坛守卫"], ["warrior", "祭坛守卫"], ["warlock", "血鼓萨满"], ["priest", "图腾医者"]], tier: 4, removedUnits: 1, removesBoss: true, reward: { steel: 1 }, loot: 4 },
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
      { id: "captain", label: "支持伊莎贝拉执行戒律", description: "女巫离开；伊莎贝拉将圣殿遗物熔成一块精钢并强化自己的装备。" },
    ],
  },
  hunter: {
    day: 5, title: "追着巨兽脚印而来的猎人", scene: "苔牙找到了兽人的战兽栏。他可以留下猎杀巨兽，也可以带流民从一条安全山路进村。",
    options: [
      { id: "recruit", label: "交出八份铁料修复他的猎具", description: "苔牙加入队伍，并标出战兽栏。", req: (s) => s.resources.iron >= 8, reqText: "需要8份铁料修复猎具。" },
      { id: "guide", label: "让他带流民走安全山路", description: "增加实际人口，并标出战兽栏。" },
    ],
  },
  caravan: {
    day: 6, title: "最后一支南下商队", scene: "商队只愿意停留半日。旅行炼金师可以留下，车上的军粮也足够供应一场大战，但金币只够选择其中之一。",
    options: [
      { id: "food", label: "花十二金币买下三十份军粮", description: "获得30粮食。", req: (s) => s.resources.gold >= 12, reqText: "需要12金币。" },
      { id: "alchemist", label: "花十二金币雇佣旅行炼金师", description: "罗莎加入队伍。", req: (s) => s.resources.gold >= 12, reqText: "需要12金币。" },
    ],
  },
};

function clone(value) { return structuredClone(value); }
function hash(text) { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function rand(state) { let x = state.rngState >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; state.rngState = x >>> 0; return state.rngState / 4294967296; }
function randomInt(state, min, max) { return min + Math.floor(rand(state) * (max - min + 1)); }
function weightedPick(state, rows) { let roll = rand(state) * rows.reduce((sum, row) => sum + row[1], 0); for (const row of rows) { roll -= row[1]; if (roll <= 0) return row[0]; } return rows.at(-1)[0]; }
function rarityIndex(label) { return RARITIES.indexOf(label); }
function emptyEquipment() { return Object.fromEntries(Object.keys(SLOT_DATA).map((slot) => [slot, null])); }
function addLog(state, text, kind = "result") { state.recent.unshift({ day: state.day, kind, text }); state.recent = state.recent.slice(0, 40); }

function createInitialState(seed = "border-village-war") {
  const state = {
    version: VERSION, seed: String(seed), rngState: parseInt(hash(seed), 36) || 1,
    day: 1, phase: "prologue", storyStep: "arrival", ap: 0,
    resources: { gold: 24, food: 0, iron: 10, steel: 1, population: 30, populationCap: 50 },
    buildings: [
      { slot: 0, type: "house", level: 1, complete: true, progress: 1 },
      { slot: 1, type: "farm", level: 1, complete: true, progress: 1 },
      { slot: 2, type: "smithy", level: 1, complete: true, progress: 2 },
      { slot: 3, type: "market", level: 1, complete: true, progress: 2 },
      { slot: 4, type: null, level: 0, complete: false, progress: 0 },
      { slot: 5, type: null, level: 0, complete: false, progress: 0 },
    ],
    market: { day: 0, liquidity: 0, stock: [] },
    roster: ["player"], activeParty: ["player"], selectedHeroId: "player", equipment: {}, inventory: [],
    flags: {}, resolvedEvents: {}, resolvedRaids: {}, enemy: { orcUnits: 20, bosses: 3 },
    recent: [], lastCombat: null, lastOutcome: null, result: null,
    stats: { actionsSpent: 0, grindAttempts: 0, grindWins: 0, combats: 0, failedCombats: 0, salvaged: 0, forged: 0 },
  };
  for (const heroId of Object.keys(HEROES)) state.equipment[heroId] = emptyEquipment();
  const starter = starterItem();
  state.inventory.push(starter);
  state.equipment.player.weapon = starter.id;
  addLog(state, "一队圣殿骑士来到灰谷村。女队长伊莎贝拉认为附近只有零星魔物，决定让部下明日沿边境巡逻。", "story");
  return state;
}

function starterItem() {
  return { id: "starter_sword", name: "旧民兵剑", slot: "weapon", slotLabel: "武器", rarity: "普通", rarityId: "common", equipmentLevel: 12, power: 7, baseStats: { physicalPower: 6 }, affixes: [{ stat: "might", label: "武力", value: 1, level: 1, category: "major", percent: false }], identityTags: [], source: "村庄仓库" };
}

function actionPointsForPopulation(population) {
  const value = Math.max(0, Number(population) || 0);
  return value >= 100 ? 6 : value >= 70 ? 5 : value >= 40 ? 4 : 3;
}

function militiaUnits(state) { return Math.min(10, Math.floor(state.resources.population / 10)); }
function buildingRows(state, type) { return state.buildings.filter((row) => row.type === type && row.complete); }
function buildingLevel(state, type) { return Math.max(0, ...buildingRows(state, type).map((row) => row.level)); }
function hasBuilding(state, type) { return buildingRows(state, type).length > 0; }

function morning(state) {
  completeConstructions(state);
  const farms = buildingRows(state, "farm");
  let food = 0;
  const yields = [];
  for (const farm of farms) {
    const ranges = { 1: [8, 14], 2: [14, 20], 3: [21, 27] }[farm.level] || [8, 14];
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

function completeConstructions(state) {
  for (const row of state.buildings.filter((building) => building.type && !building.complete && building.readyDay <= state.day)) {
    row.complete = true;
    row.level = 1;
    row.progress = BUILDINGS[row.type].buildActions;
    delete row.readyDay;
    if (row.type === "house") state.resources.populationCap += 25;
    addLog(state, `${BUILDINGS[row.type].name}在今天早晨完工。`, "construction");
  }
}

function refreshMarket(state) {
  const level = buildingLevel(state, "market");
  if (!level) { state.market = { day: state.day, liquidity: 0, stock: [] }; return; }
  const liquidityRanges = { 1: [12, 20], 2: [20, 32], 3: [32, 48] };
  const [low, high] = liquidityRanges[level] || liquidityRanges[1];
  const stock = [];
  stock.push({ id: `food_${state.day}`, type: "food", label: "十份军粮", price: 5, amount: 10, count: randomInt(state, 1, 3) });
  stock.push({ id: `iron_${state.day}`, type: "iron", label: "六份铁料", price: 6, amount: 6, count: randomInt(state, 0, 2 + level) });
  if (level >= 2 && rand(state) < .35 + level * .15) stock.push({ id: `steel_${state.day}`, type: "steel", label: "一块精钢", price: 12, amount: 1, count: 1 });
  if (rand(state) < .45 + level * .15) {
    const item = generateItem(state, "market", Math.min(3, level + 1), level >= 3 ? "史诗" : "稀有");
    stock.push({ id: `gear_${state.day}`, type: "gear", label: `${item.rarity}${item.slotLabel}`, price: item.rarity === "史诗" ? 16 : 9, count: 1, item });
  }
  state.market = { day: state.day, liquidity: randomInt(state, low, high), stock };
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
  const spec = roleSpec(hero.combatRole, hero.name, slotIndex, { hp: .92 + hero.base / 430 + baseBonus, power: .86 + hero.base / 360 + baseBonus, armor: .95 + baseBonus, unitKind: "hero" });
  const items = Object.values(state.equipment[heroId] || {}).map((itemId) => state.inventory.find((item) => item.id === itemId)).filter(Boolean);
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
  const roles = ["warrior", "knight", "ranger", "warrior", "ranger"];
  return roleSpec(roles[index % roles.length], `灰谷村民兵第${index + 1}队`, slotIndex, { hp: .82, power: .74, armor: .9, unitKind: "militia" });
}

function applySupply(spec, effectiveness) {
  const result = clone(spec);
  result.maxHp = Math.max(1, Math.round(result.maxHp * effectiveness)); result.hp = result.maxHp;
  result.physicalPower = Math.max(1, Math.round(result.physicalPower * effectiveness)); result.magicPower = Math.max(1, Math.round(result.magicPower * effectiveness));
  result.power = Math.max(result.physicalPower, result.magicPower); result.armor = Math.max(0, Math.round(result.armor * effectiveness));
  result.supplyEffectiveness = effectiveness;
  return result;
}

function supplyEffect(foodCommitted, fullRequirement) {
  const ratio = Math.min(1, Math.max(0, Number(foodCommitted) || 0) / Math.max(1, fullRequirement));
  return Math.round((.2 + .8 * ratio) * 1000) / 1000;
}

function huntPlan(state) {
  if (state.phase !== "management") return null;
  const tier = state.day >= 6 ? 3 : state.day >= 5 ? 2 : 1;
  const leftTeam = state.activeParty.slice(0, 4).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const enemyRows = tier === 1 ? [["warrior", "林地小兽"], ["assassin", "穴居魔物"], ["ranger", "投石小怪"]]
    : tier === 2 ? [["knight", "披甲魔物"], ["warrior", "林地魔物"], ["ranger", "投矛魔物"], ["priest", "魔物祭徒"]]
      : [["knight", "边林巨怪"], ["warrior", "边林巨怪"], ["ranger", "毒矢魔物"], ["warlock", "血咒魔物"], ["priest", "魔物祭徒"]];
  const rightTeam = enemyRows.map(([role, name], index) => enemySpec(role, name, index, tier, { hp: .54, power: .50, armor: .92 }));
  return { kind: "hunt", title: `边林讨伐 · 第${tier}层`, seed: `${state.seed}|hunt|${state.day}|${state.stats.grindAttempts}`, leftTeam, rightTeam, maxTime: 80, fullFood: 0, foodCommitted: 0, supplyEffectiveness: 1 };
}

function raidPlan(state, raidId, foodCommitted) {
  const raid = RAIDS[raidId];
  if (!raid || state.phase !== "management" || state.ap <= 0 || state.resolvedRaids[raidId] || !raid.unlock(state)) return null;
  const leftTeam = state.activeParty.slice(0, 4).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const fullFood = Math.max(8, leftTeam.length * 3);
  const food = Math.max(0, Math.min(state.resources.food, Number(foodCommitted) || 0));
  const effectiveness = supplyEffect(food, fullFood);
  const supplied = leftTeam.map((spec) => applySupply(spec, effectiveness));
  const rightTeam = raid.enemies.map(([role, name], index) => enemySpec(role, name, index, raid.tier, { hp: .92, power: .9 }));
  return { kind: "raid", raidId, title: raid.title, seed: `${state.seed}|raid|${raidId}|${state.stats.combats}`, leftTeam: supplied, rightTeam, maxTime: 100, fullFood, foodCommitted: food, supplyEffectiveness: effectiveness };
}

function finalBattlePlan(state, foodCommitted) {
  if (state.phase !== "final") return null;
  const heroes = state.activeParty.slice(0, 10).map((heroId, index) => heroCombatSpec(state, heroId, index));
  const militia = Array.from({ length: militiaUnits(state) }, (_, index) => militiaSpec(index, heroes.length + index));
  const left = [...heroes, ...militia];
  const fullFood = Math.max(12, left.length * 3);
  const food = Math.max(0, Math.min(state.resources.food, Number(foodCommitted) || 0));
  const effectiveness = supplyEffect(food, fullFood);
  const leftTeam = left.map((spec) => applySupply(spec, effectiveness));
  const remainingUnits = Math.max(0, state.enemy.orcUnits);
  const roles = ["warrior", "knight", "ranger", "warrior", "berserker"];
  const rightTeam = Array.from({ length: remainingUnits }, (_, index) => enemySpec(roles[index % roles.length], `兽人军团第${index + 1}队`, index, 3, { hp: .96, power: .8832, armor: 1.03 }));
  const bossDefs = [["knight", "兽人铁壁主将"], ["berserker", "兽人狂战主将"], ["warlock", "兽人血鼓主将"]];
  for (let index = 0; index < state.enemy.bosses; index += 1) rightTeam.push(enemySpec(bossDefs[index][0], bossDefs[index][1], rightTeam.length, 5, { hp: 2.016, power: 1.296, armor: 1.25 }));
  return { kind: "final", title: "灰谷村决战", seed: `${state.seed}|final|${state.stats.combats}`, leftTeam, rightTeam, maxTime: 150, fullFood, foodCommitted: food, supplyEffectiveness: effectiveness };
}

function simulatePlan(plan) { return COMBAT.simulateTeams(plan.leftTeam, plan.rightTeam, { seed: plan.seed, maxTime: plan.maxTime, randomizeStats: false }); }
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

function publicActionId(state, internalId) { return `choice_${hash(`${state.seed}|${state.day}|${state.ap}|${state.phase}|${state.stats.actionsSpent}|${state.stats.grindAttempts}|${internalId}`)}`; }

const RESOURCE_LABELS = { gold: "金币", food: "粮食", iron: "铁料", steel: "精钢" };
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
    if (state.storyStep === "arrival") return [{ id: "story:arrival", label: "陪伊莎贝拉巡视这座安静的边陲村", kind: "story", actionPointCost: 0 }];
    if (state.storyStep === "survivors") return [
      { id: "story:save_scout", label: "先救掌握敌情的圣殿斥候莱恩", kind: "decision", actionPointCost: 0, knownResult: "莱恩将成为第二名圣殿骑士，并带回粮秣营位置" },
      { id: "story:save_guard", label: "先救伤势更重的圣殿盾骑马库斯", kind: "decision", actionPointCost: 0, knownResult: "马库斯将成为第二名圣殿骑士，并帮助伊莎贝拉稳住防线" },
    ];
    return [];
  }
  if (state.phase === "final") {
    const preview = finalBattlePlan(state, state.resources.food);
    const half = Math.min(state.resources.food, Math.ceil(preview.fullFood / 2));
    const full = Math.min(state.resources.food, preview.fullFood);
    const rows = [...new Set([0, half, full])].map((food) => ({ id: `combat:final:${food}`, label: `投入${food}粮食迎战（预计发挥${Math.round(supplyEffect(food, preview.fullFood) * 100)}%）`, kind: "combat", actionPointCost: 0, foodCost: food, fullFood: preview.fullFood }));
    rows.push(...equipmentActions(state));
    return rows;
  }

  const rows = [{ id: "combat:hunt", label: "前往边林免费讨伐魔物", kind: "grind", actionPointCost: 0 }];
  const apReason = actionPointReason(state);
  for (const slot of state.buildings.filter((row) => !row.type)) {
    for (const type of ["house", "farm", "conscription"]) {
      const def = BUILDINGS[type];
      const uniqueReason = def.unique && state.buildings.some((row) => row.type === type) ? `村里已经有一座${def.name}，不能重复建造。` : "";
      rows.push(withAvailability({ id: `build:${slot.slot}:${type}`, label: `在${slot.slot + 1}号空地修建${def.name}（次日完工）`, kind: "build", actionPointCost: 1, knownCost: clone(def.cost), targetSlot: slot.slot }, apReason, uniqueReason, missingCostReason(state, def.cost)));
    }
  }
  for (const building of state.buildings.filter((row) => row.type)) {
    const steel = Math.max(1, building.level);
    const constructionReason = building.complete ? "" : "建筑尚未完工；次日清晨完工后才能升级。";
    const maxReason = building.level >= 3 ? "这座建筑已经达到3级上限。" : "";
    const label = building.level >= 3 ? `${BUILDINGS[building.type].name}已满级` : `立即将${BUILDINGS[building.type].name}升级到${Math.max(2, building.level + 1)}级`;
    rows.push(withAvailability({ id: `upgrade:${building.slot}`, label, kind: "upgrade", actionPointCost: 1, knownCost: { steel }, targetSlot: building.slot }, apReason, constructionReason, maxReason, missingCostReason(state, { steel })));
  }
  const conscription = state.buildings.find((row) => row.type === "conscription");
  if (conscription) {
    const buildingReason = conscription.complete ? "" : "征召所尚未完工。";
    const capacityReason = state.resources.population < state.resources.populationCap ? "" : `实际人口已达上限（${state.resources.population}/${state.resources.populationCap}）；先修建或升级房屋。`;
    rows.push(withAvailability({ id: "recruit:basic", label: "派人接纳流民（预计6—10人）", kind: "recruit", actionPointCost: 1, knownCost: {} }, apReason, buildingReason, capacityReason));
    rows.push(withAvailability({ id: "recruit:funded", label: "额外投入5金币提高征召效率（预计10—14人）", kind: "recruit", actionPointCost: 1, knownCost: { gold: 5 } }, apReason, buildingReason, capacityReason, missingCostReason(state, { gold: 5 })));
    rows.push(withAvailability({ id: "recruit:chartered", label: "投入12金币组织远途征召（预计15—20人）", kind: "recruit", actionPointCost: 1, knownCost: { gold: 12 } }, apReason, buildingReason, capacityReason, conscription.level >= 2 ? "" : "需要2级征召所。", missingCostReason(state, { gold: 12 })));
  }
  if (hasBuilding(state, "smithy")) {
    rows.push(withAvailability({ id: "smith:refine", label: "将12铁料精炼成1精钢", kind: "smith", actionPointCost: 1, knownCost: { iron: 12 }, knownGain: { steel: 1 } }, apReason, missingCostReason(state, { iron: 12 })));
    let salvageActions = 0;
    for (const rarity of RARITIES) {
      const count = unequippedItems(state).filter((item) => item.rarity === rarity).length;
      if (count) { salvageActions += 1; rows.push(withAvailability({ id: `smith:salvage:${rarity}`, label: `分解最多5件${rarity}装备（当前${count}件）`, kind: "smith", actionPointCost: 1 }, apReason)); }
    }
    if (!salvageActions) rows.push(withAvailability({ id: "smith:salvage:none", label: "分解未穿戴装备", kind: "smith", actionPointCost: 1 }, apReason, "背包里没有可分解的未穿戴装备。"));
    const level = buildingLevel(state, "smithy");
    for (const [slot, data] of Object.entries(SLOT_DATA)) rows.push(withAvailability({ id: `smith:forge:${slot}`, label: `打造史诗${data.label}（18铁料、1精钢，${[2, 5, 10][level - 1]}%概率成为神话）`, kind: "smith", actionPointCost: 1, knownCost: { iron: 18, steel: 1 } }, apReason, missingCostReason(state, { iron: 18, steel: 1 })));
  }
  for (const [raidId, raid] of Object.entries(RAIDS)) {
    if (!raid.unlock(state) || state.resolvedRaids[raidId]) continue;
    const basePlan = raidPlan({ ...state, ap: Math.max(1, state.ap) }, raidId, 0);
    const half = Math.min(state.resources.food, Math.ceil(basePlan.fullFood / 2));
    const full = Math.min(state.resources.food, basePlan.fullFood);
    for (const food of [...new Set([0, half, full])]) rows.push(withAvailability({ id: `combat:raid:${raidId}:${food}`, label: `突袭${raid.title}，投入${food}粮食（预计发挥${Math.round(supplyEffect(food, basePlan.fullFood) * 100)}%）`, kind: "combat", actionPointCost: 1, foodCost: food, fullFood: basePlan.fullFood }, apReason));
  }
  const event = Object.entries(EVENTS).find(([id, row]) => row.day === state.day && !state.resolvedEvents[id]);
  if (event) for (const option of event[1].options) rows.push(withAvailability({ id: `event:${event[0]}:${option.id}`, label: option.label, kind: "event", actionPointCost: 1, description: option.description }, apReason, option.req && !option.req(state) ? option.reqText || "尚未满足条件。" : ""));
  if (hasBuilding(state, "market")) {
    for (const stock of state.market.stock.filter((row) => row.count > 0)) rows.push(withAvailability({ id: `market:buy:${stock.id}`, label: `购买${stock.label}（${stock.price}金币，余${stock.count}份）`, kind: "market", actionPointCost: 0, knownCost: { gold: stock.price }, targetStockId: stock.id }, missingCostReason(state, { gold: stock.price })));
    for (const item of unequippedItems(state)) {
      const price = salePrice(item);
      rows.push(withAvailability({ id: `market:sell:${item.id}`, label: `向集市出售${item.name}（获得${price}金币）`, kind: "market", actionPointCost: 0, knownGain: { gold: price }, targetItemId: item.id }, state.market.liquidity >= price ? "" : `集市今日购买力只剩${state.market.liquidity}，出售需要${price}。`));
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
function equippedIds(state) { return new Set(Object.values(state.equipment).flatMap((slots) => Object.values(slots || {}).filter(Boolean))); }
function unequippedItems(state) { const equipped = equippedIds(state); return state.inventory.filter((item) => !equipped.has(item.id)); }
function salePrice(item) { return ({ "普通": 2, "稀有": 4, "史诗": 8, "传说": 12, "神话": 18 })[item.rarity] || 1; }

function equipmentActions(state) {
  const rows = [];
  const selectedHero = state.roster.includes(state.selectedHeroId) ? state.selectedHeroId : state.roster[0];
  if (!selectedHero) return rows;
  for (const heroId of state.roster) if (heroId !== selectedHero) rows.push({ id: `select:${heroId}`, label: `查看并为${HEROES[heroId].name}配装`, kind: "selection", actionPointCost: 0, targetHeroId: heroId });
  rows.push({ id: `autoequip:${selectedHero}`, label: `一键为${HEROES[selectedHero].name}换上最高战力装备`, kind: "equipment", operation: "auto_equip", actionPointCost: 0, targetHeroId: selectedHero, knownResult: "只使用无人穿戴的装备，不会抢走其他角色身上的物品。" });
  for (const item of unequippedItems(state)) rows.push({ id: `equip:${selectedHero}:${item.id}`, label: `让${HEROES[selectedHero].name}装备${item.name}`, kind: "equipment", actionPointCost: 0, targetHeroId: selectedHero, targetItemId: item.id });
  for (const [slot, itemId] of Object.entries(state.equipment[selectedHero] || {})) {
    const item = state.inventory.find((row) => row.id === itemId);
    if (item) rows.push({ id: `unequip:${selectedHero}:${slot}`, label: `卸下${HEROES[selectedHero].name}的${item.name}`, kind: "equipment", actionPointCost: 0, targetHeroId: selectedHero, targetItemId: item.id, targetEquipmentSlot: slot, operation: "unequip" });
  }
  return rows;
}

function equippedPower(state, heroId) {
  return Object.values(state.equipment[heroId] || {}).reduce((sum, itemId) => sum + Number(state.inventory.find((item) => item.id === itemId)?.power || 0), 0);
}

function autoEquipHero(state, heroId) {
  if (!state.roster.includes(heroId)) throw new Error("无法为这个角色整理装备。");
  const currentIds = new Set(Object.values(state.equipment[heroId] || {}).filter(Boolean));
  const candidates = state.inventory.filter((item) => currentIds.has(item.id) || !equippedIds(state).has(item.id));
  const beforePower = equippedPower(state, heroId);
  const changedSlots = [];
  for (const slot of Object.keys(SLOT_DATA)) {
    const currentId = state.equipment[heroId][slot];
    const best = candidates.filter((item) => item.slot === slot).sort((a, b) => Number(b.power || 0) - Number(a.power || 0) || rarityIndex(b.rarity) - rarityIndex(a.rarity) || Number(b.equipmentLevel || 0) - Number(a.equipmentLevel || 0) || String(a.id).localeCompare(String(b.id)))[0];
    if (!best || best.id === currentId) continue;
    state.equipment[heroId][slot] = best.id;
    changedSlots.push(SLOT_DATA[slot].label);
  }
  const afterPower = equippedPower(state, heroId);
  if (changedSlots.length) addLog(state, `${HEROES[heroId].name}一键更换${changedSlots.length}个部位（${changedSlots.join("、")}），装备战力${beforePower}→${afterPower}（+${afterPower - beforePower}）。`, "equipment");
  else addLog(state, `${HEROES[heroId].name}已经穿着当前可用的最高战力装备。`, "equipment");
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
    if (heroId === "guard") state.flags.captainBlessed = true;
    state.day = 3; state.phase = "management"; state.storyStep = null;
    addLog(state, `${HEROES[heroId].name}活了下来。伊莎贝拉把敌军规模写在村口木板上：400名兽人，折算20个军团单位，另有3名主将，第7日抵达。`, "threat");
    morning(state); return;
  }
  if (id.startsWith("build:")) {
    const [, slotText, type] = id.split(":"); const slot = state.buildings[Number(slotText)]; const def = BUILDINGS[type];
    if (!slot || slot.type) throw new Error("这块地已经被占用。"); pay(state, def.cost); spendAction(state);
    slot.type = type; slot.level = 0; slot.complete = false; slot.progress = def.buildActions; slot.readyDay = state.day + 1;
    addLog(state, `${def.name}开始修建，将在第${state.day + 1}日早晨完工。`, "construction"); return;
  }
  if (id.startsWith("upgrade:")) {
    const slot = state.buildings[Number(id.split(":")[1])]; const steel = slot.level;
    pay(state, { steel }); spendAction(state); slot.level += 1;
    if (slot.type === "house") state.resources.populationCap += 15;
    if (slot.type === "market") refreshMarket(state);
    addLog(state, `${BUILDINGS[slot.type].name}立即升级到${slot.level}级。`, "upgrade"); return;
  }
  if (id.startsWith("recruit:")) {
    const mode = id.split(":")[1]; const configs = { basic: { gold: 0, range: [6, 10] }, funded: { gold: 5, range: [10, 14] }, chartered: { gold: 12, range: [15, 20] } }; const cfg = configs[mode];
    pay(state, { gold: cfg.gold }); spendAction(state); const rolled = randomInt(state, cfg.range[0], cfg.range[1]); const joined = Math.max(0, Math.min(rolled, state.resources.populationCap - state.resources.population)); state.resources.population += joined;
    addLog(state, `征召队带回${rolled}名流民，房屋容量允许其中${joined}人实际加入村庄。实际人口现为${state.resources.population}。`, "population"); return;
  }
  if (id.startsWith("smith:salvage:")) {
    const rarity = id.slice("smith:salvage:".length); const items = unequippedItems(state).filter((item) => item.rarity === rarity).sort((a, b) => a.power - b.power).slice(0, 5);
    if (!items.length) throw new Error("没有可分解的这类装备。"); spendAction(state);
    const yields = { "普通": [1, 0], "稀有": [2, .03], "史诗": [5, .12], "传说": [8, .35], "神话": [12, 1] }[rarity]; let steel = 0;
    for (const item of items) if (rand(state) < yields[1]) steel += 1;
    state.resources.iron += items.length * yields[0]; state.resources.steel += steel; const ids = new Set(items.map((item) => item.id)); state.inventory = state.inventory.filter((item) => !ids.has(item.id)); state.stats.salvaged += items.length;
    addLog(state, `铁匠分解${items.length}件${rarity}装备，得到${items.length * yields[0]}铁料${steel ? `和${steel}精钢` : ""}。`, "smith"); return;
  }
  if (id === "smith:refine") {
    pay(state, { iron: 12 }); spendAction(state); state.resources.steel += 1;
    addLog(state, "铁匠将12份铁料反复锻打，精炼成1块精钢。", "smith"); return;
  }
  if (id.startsWith("smith:forge:")) {
    const slot = id.split(":")[2]; const level = buildingLevel(state, "smithy"); pay(state, { iron: 18, steel: 1 }); spendAction(state);
    const rarity = rand(state) < [0.02, 0.05, 0.10][level - 1] ? "神话" : "史诗"; const item = generateItem(state, "灰谷铁匠铺", 4, rarity, slot); state.inventory.push(item); state.stats.forged += 1;
    addLog(state, `铁匠打造出${item.name}。`, "forge"); return;
  }
  if (id.startsWith("market:buy:")) {
    const stockId = id.slice("market:buy:".length); const stock = state.market.stock.find((row) => row.id === stockId && row.count > 0); if (!stock) throw new Error("商品已经售罄。"); pay(state, { gold: stock.price }); stock.count -= 1;
    if (stock.type === "gear") state.inventory.push({ ...clone(stock.item), id: `${stock.item.id}_bought` }); else state.resources[stock.type] += stock.amount;
    addLog(state, `从集市购买了${stock.label}。`, "market"); return;
  }
  if (id.startsWith("market:sell:")) {
    const itemId = id.slice("market:sell:".length); const item = unequippedItems(state).find((row) => row.id === itemId); if (!item) throw new Error("这件装备无法出售。"); const price = salePrice(item); if (state.market.liquidity < price) throw new Error("集市今日剩余购买力不足。");
    state.market.liquidity -= price; state.resources.gold += price; state.inventory = state.inventory.filter((row) => row.id !== itemId); addLog(state, `集市以固定价格${price}金币买走了${item.name}，今日剩余购买力${state.market.liquidity}。`, "market"); return;
  }
  if (id.startsWith("event:")) { applyEvent(state, id.split(":")[1], id.split(":")[2]); spendAction(state); return; }
  if (id.startsWith("select:")) { state.selectedHeroId = id.split(":")[1]; return; }
  if (id.startsWith("autoequip:")) { autoEquipHero(state, id.split(":")[1]); return; }
  if (id.startsWith("equip:")) {
    const [, heroId, itemId] = id.split(":"); const item = unequippedItems(state).find((row) => row.id === itemId); if (!item || !state.roster.includes(heroId)) throw new Error("无法进行这次装备操作。");
    state.equipment[heroId][item.slot] = item.id; addLog(state, `${HEROES[heroId].name}装备了${item.name}。`, "equipment"); return;
  }
  if (id.startsWith("unequip:")) {
    const [, heroId, slot] = id.split(":"); const itemId = state.equipment[heroId]?.[slot]; const item = state.inventory.find((row) => row.id === itemId);
    if (!item || heroId !== state.selectedHeroId) throw new Error("无法卸下这件装备。");
    state.equipment[heroId][slot] = null; addLog(state, `${HEROES[heroId].name}卸下了${item.name}。`, "equipment"); return;
  }
  if (id.startsWith("party:")) {
    const [, op, heroId] = id.split(":"); if (op === "add" && !state.activeParty.includes(heroId)) state.activeParty.push(heroId); if (op === "remove") state.activeParty = state.activeParty.filter((row) => row !== heroId); return;
  }
  if (id === "time:end") { endDay(state); return; }
  throw new Error(`未知行动：${id}`);
}

function applyEvent(state, eventId, optionId) {
  const event = EVENTS[eventId]; state.resolvedEvents[eventId] = optionId;
  if (eventId === "refugees") {
    if (optionId === "people") { const joined = Math.min(22, state.resources.populationCap - state.resources.population); state.resources.population += joined; addLog(state, `村庄尽量挤出住处，${joined}名流民实际加入。`, "event"); }
    else { recruitHero(state, "sellsword"); const joined = Math.min(5, state.resources.populationCap - state.resources.population); state.resources.population += joined; addLog(state, `赤犬和${joined}名家人留在村庄。`, "recruit"); }
  } else if (eventId === "witch") {
    if (optionId === "shelter") { recruitHero(state, "witch"); state.flags.shamanIntel = true; state.flags.captainTrustLow = true; addLog(state, "盐枝加入队伍，并在地图上标出血鼓萨满祭坛。伊莎贝拉没有阻止，但此后不再主动与你谈论圣殿戒律。", "recruit"); }
    else { state.resources.steel += 1; state.flags.captainBlessed = true; addLog(state, "盐枝离开了。伊莎贝拉把一件圣殿遗物熔成精钢，并重新加固自己的盾甲。", "event"); }
  } else if (eventId === "hunter") {
    state.flags.beastIntel = true;
    if (optionId === "recruit") { state.resources.iron -= 8; recruitHero(state, "hunter"); addLog(state, "苔牙修好猎具并加入队伍，同时标出披甲战兽栏。", "recruit"); }
    else { const joined = Math.min(15, state.resources.populationCap - state.resources.population); state.resources.population += joined; addLog(state, `苔牙带${joined}名流民从安全山路进村，并标出披甲战兽栏。`, "population"); }
  } else if (eventId === "caravan") {
    state.resources.gold -= 12;
    if (optionId === "food") { state.resources.food += 30; addLog(state, "商队卸下30份军粮，随后连夜南下。", "event"); }
    else { recruitHero(state, "alchemist"); addLog(state, "旅行炼金师罗莎收下佣金，决定留下参加决战。", "recruit"); }
  }
}

function recruitHero(state, heroId) {
  if (!state.roster.includes(heroId)) { state.roster.push(heroId); if (state.activeParty.length < 4) state.activeParty.push(heroId); addLog(state, `${HEROES[heroId].name}加入队伍。`, "recruit"); }
}

function endDay(state) {
  if (state.day >= 6) {
    state.day = FINAL_DAY; state.phase = "final"; state.ap = 0;
    completeConstructions(state);
    const farms = buildingRows(state, "farm");
    let finalFood = 0;
    const yields = [];
    for (const farm of farms) {
      const ranges = { 1: [8, 14], 2: [14, 20], 3: [21, 27] }[farm.level] || [8, 14];
      const amount = randomInt(state, ranges[0], ranges[1]);
      finalFood += amount;
      yields.push(amount);
    }
    state.resources.food += finalFood;
    if (finalFood) addLog(state, `决战日清晨，${farms.length}块农田共收获${finalFood}粮食（${yields.join("+")}）。今日不再进行经营行动。`, "production");
    while (state.activeParty.length < Math.min(10, state.roster.length)) { const next = state.roster.find((heroId) => !state.activeParty.includes(heroId)); if (!next) break; state.activeParty.push(next); }
    addLog(state, `第7日清晨，剩余${state.enemy.orcUnits}个兽人军团单位和${state.enemy.bosses}名主将抵达灰谷村。${militiaUnits(state)}支民兵队与${state.activeParty.length}名英雄集结。`, "final"); return;
  }
  state.day += 1; morning(state);
}

function preparePlayerCombat(state, publicId) {
  const match = actionCatalog(state).find((row) => row.publicId === publicId);
  if (!match || !match.available || !["combat", "grind"].includes(match.kind)) return null;
  let plan = null;
  if (match.id === "combat:hunt") plan = huntPlan(state);
  else if (match.id.startsWith("combat:raid:")) { const [, , raidId, food] = match.id.split(":"); plan = raidPlan(state, raidId, Number(food)); }
  else if (match.id.startsWith("combat:final:")) plan = finalBattlePlan(state, Number(match.id.split(":")[2]));
  return plan ? { ...clone(plan), publicActionId: publicId } : null;
}

function applyPlayerCombatResult(stateInput, publicId, result) {
  const match = actionCatalog(stateInput).find((row) => row.publicId === publicId);
  if (!match || !["combat", "grind"].includes(match.kind)) throw new Error("这个战斗已经不在当前画面中。");
  if (!match.available) throw new Error(match.disabledReason || "当前无法发起这个战斗。");
  const state = clone(stateInput); const plan = preparePlayerCombat(stateInput, publicId); if (!plan) throw new Error("无法重建战斗计划。");
  const verifiedResult = simulatePlan(plan);
  if (!combatResultFingerprint(result) || combatResultFingerprint(result) !== combatResultFingerprint(verifiedResult)) throw new Error("战斗结果与实际模拟过程不一致，拒绝结算。");
  result = verifiedResult;
  state.stats.combats += 1; const summary = combatSummary(result, plan.title); state.lastCombat = { ...summary, supplyEffectiveness: plan.supplyEffectiveness, foodCommitted: plan.foodCommitted, fullFood: plan.fullFood }; if (!summary.win) state.stats.failedCombats += 1;
  if (plan.kind === "hunt") {
    state.stats.grindAttempts += 1;
    if (summary.win) { state.stats.grindWins += 1; const item = generateItem(state, "边林讨伐", state.day >= 6 ? 3 : state.day >= 5 ? 2 : 1); state.inventory.push(item); addLog(state, `边林讨伐获胜，得到${item.name}。`, "loot"); }
    else addLog(state, "边林讨伐失败，没有带回装备。", "combat_loss");
  } else if (plan.kind === "raid") {
    state.resources.food -= plan.foodCommitted; spendAction(state);
    const raid = RAIDS[plan.raidId];
    if (summary.win) {
      state.resolvedRaids[plan.raidId] = true; state.enemy.orcUnits = Math.max(0, state.enemy.orcUnits - raid.removedUnits); if (raid.removesBoss) state.enemy.bosses = Math.max(0, state.enemy.bosses - 1);
      for (const [key, value] of Object.entries(raid.reward)) state.resources[key] += value;
      for (let i = 0; i < raid.loot; i += 1) state.inventory.push(generateItem(state, raid.title, Math.min(4, raid.tier)));
      addLog(state, `${raid.title}被摧毁：最终敌军减少${raid.removedUnits}个军团单位${raid.removesBoss ? "和1名主将" : ""}。`, "raid_win");
    } else addLog(state, `${raid.title}突袭失败，投入的${plan.foodCommitted}粮食已经消耗，但据点仍在。`, "raid_loss");
  } else {
    state.resources.food -= plan.foodCommitted; state.phase = "complete"; state.result = { win: summary.win, title: summary.win ? "灰谷村守住了" : "兽人大军攻入灰谷村", day: state.day, population: state.resources.population, militiaUnits: militiaUnits(state), remainingEnemyUnits: state.enemy.orcUnits, remainingBosses: state.enemy.bosses, supplyEffectiveness: plan.supplyEffectiveness, combat: clone(summary) };
    addLog(state, summary.win ? "灰谷村守住了。伊莎贝拉把染血的圣殿旗交给你保管。" : "兽人大军突破了村庄阵线，但幸存者记住了这次备战留下的教训。", summary.win ? "victory" : "defeat");
  }
  enforceInventoryLimit(state); return state;
}

function enforceInventoryLimit(state) {
  const excess = Math.max(0, state.inventory.length - INVENTORY_LIMIT); if (!excess) return [];
  const equipped = equippedIds(state); const removable = state.inventory.filter((item) => !equipped.has(item.id)).sort((a, b) => rarityIndex(a.rarity) - rarityIndex(b.rarity) || a.power - b.power); const removed = removable.slice(0, excess); const ids = new Set(removed.map((item) => item.id)); state.inventory = state.inventory.filter((item) => !ids.has(item.id)); state.stats.salvaged += removed.length; return removed;
}

function heroVisible(state, heroId) {
  const equipment = Object.entries(state.equipment[heroId] || {}).map(([slot, itemId]) => ({ slot, slotLabel: SLOT_DATA[slot].label, item: itemId ? clone(state.inventory.find((row) => row.id === itemId) || null) : null }));
  return { id: heroId, name: HEROES[heroId].name, role: HEROES[heroId].role, preferredAffixes: clone(HEROES[heroId].preferredAffixes || []), active: state.activeParty.includes(heroId), equipment };
}

function currentEvent(state) { return Object.entries(EVENTS).find(([id, row]) => row.day === state.day && !state.resolvedEvents[id]) || null; }

function getPlayerObservation(state) {
  const catalog = actionCatalog(state);
  const event = currentEvent(state);
  const story = state.phase === "prologue" ? state.storyStep === "arrival" ? { title: "安静的边陲村", text: "圣殿骑士队长伊莎贝拉认为附近只有零星魔物。她准备明日派出巡逻队。" } : { title: "巡逻队覆灭", text: "两名幸存者带回敌情：约400名兽人，折算20个军团单位，另有3名主将，第7日抵达。" } : null;
  return {
    schema: "border_village_war_player_observation_v1",
    time: { day: state.day, finalDay: FINAL_DAY, phase: state.phase, actionsRemaining: state.ap, actionCapacity: actionPointsForPopulation(state.resources.population) },
    story,
    war: { knownEnemyUnits: state.enemy.orcUnits, knownBosses: state.enemy.bosses, militiaUnits: militiaUnits(state), finalBattleDay: FINAL_DAY, publicRule: "每10名实际人口形成1支民兵单位；战前投入粮食决定20%—100%的战斗效能。", finalMorningRule: "第7日决战前仍会完成在建建筑并收获一次农田，但不再获得经营行动力。" },
    resources: clone(state.resources),
    buildings: state.buildings.map((row) => ({ slot: row.slot, type: row.type, name: row.type ? BUILDINGS[row.type].name : "空地", level: row.level, complete: row.complete, readyDay: row.readyDay || null, description: row.type ? BUILDINGS[row.type].description : "可以修建房屋、农田或征召所" })),
    productionForecasts: buildingRows(state, "farm").map((row) => ({ slot: row.slot, level: row.level, nextYieldRange: clone(({ 1: [8, 14], 2: [14, 20], 3: [21, 27] })[row.level]) })),
    market: { liquidity: state.market.liquidity, priceRule: "价格固定，购买力和库存每天随机刷新", stock: state.market.stock.filter((row) => row.count > 0).map((row) => ({ id: row.id, label: row.label, type: row.type, price: row.price, count: row.count })) },
    party: { selectedHeroId: state.selectedHeroId, activeLimit: state.phase === "final" ? 10 : 4, finalBattleRule: "第7日决战会自动集结全部已招募英雄，最多10人。", heroes: state.roster.map((heroId) => heroVisible(state, heroId)) },
    inventory: state.inventory.map((item) => clone(item)), inventoryLimit: INVENTORY_LIMIT,
    raids: Object.entries(RAIDS).filter(([id, raid]) => raid.unlock(state) && !state.resolvedRaids[id]).map(([id, raid]) => ({ id, title: raid.title, description: raid.description, visibleEffectOnVictory: `最终敌军减少${raid.removedUnits}个军团单位${raid.removesBoss ? "和1名主将" : ""}` })),
    event: event ? { id: event[0], title: event[1].title, scene: event[1].scene } : null,
    recentSignals: state.recent.slice(0, 10).map((row) => ({ day: row.day, kind: row.kind, text: row.text })),
    lastCombat: clone(state.lastCombat), result: clone(state.result),
    actions: catalog.map((row) => ({ id: row.publicId, label: row.label, kind: row.kind, available: row.available, disabledReason: row.disabledReason, actionPointCost: row.actionPointCost || 0, knownCost: clone(row.knownCost || {}), knownGain: clone(row.knownGain || {}), description: row.description || row.knownResult || "", foodCost: row.foodCost || 0, fullFood: row.fullFood || 0, targetSlot: Number.isInteger(row.targetSlot) ? row.targetSlot : null, targetHeroId: row.targetHeroId || null, targetItemId: row.targetItemId || null, targetStockId: row.targetStockId || null, targetEquipmentSlot: row.targetEquipmentSlot || null, operation: row.operation || null })),
  };
}

return {
  VERSION, FINAL_DAY, INVENTORY_LIMIT, HEROES, BUILDINGS, RAIDS, EVENTS, SLOT_DATA, RARITY_DATA,
  createInitialState, getPlayerObservation, actionPointsForPopulation, militiaUnits, supplyEffect, internalActions,
  applyPlayerAction, preparePlayerCombat, applyPlayerCombatResult, simulatePlan, combatResultFingerprint, huntPlan, raidPlan, finalBattlePlan,
};
});
