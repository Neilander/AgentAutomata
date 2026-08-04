"use strict";

const GAME = require("./border-village-core");
const GEAR = require("../fifteen_day_demo/fifteen-day-core");

const TRIALS = Math.max(50, Number(process.argv[2]) || 300);
const EXTRA_ARGS = process.argv.slice(3);
const LOADOUT_FILTER = EXTRA_ARGS.find((row) => ["无装备", "全普通", "普通稀有混装", "全稀有"].includes(row)) || "";
const ENEMY_PROFILE = ["one-raid", "two-raids", "cleared"].find((row) => EXTRA_ARGS.includes(row)) || "full";
const ADD_GUARD_ROUTE_BLESSING = EXTRA_ARGS.includes("guard-blessing");
const ENEMY_STATES = {
  full: { orcUnits: 20, bosses: 3, label: "未占领据点：20支兽人军团单位+3名主将" },
  "one-raid": { orcUnits: 18, bosses: 3, label: "占领粮秣营：18支兽人军团单位+3名主将" },
  "two-raids": { orcUnits: 15, bosses: 3, label: "占领粮秣营与战兽栏：15支兽人军团单位+3名主将" },
  cleared: { orcUnits: 14, bosses: 2, label: "占领三个据点：14支兽人军团单位+2名主将" },
};
const SLOT_IDS = Object.keys(GAME.SLOT_DATA);
const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);
const RARITY_BY_LABEL = Object.fromEntries(GAME.RARITY_DATA.map((row) => [row.label, row]));
const ROUTES = {
  scout: ["player", "captain", "scout", "sellsword", "witch", "hunter", "alchemist"],
  guard: ["player", "captain", "guard", "sellsword", "witch", "hunter", "alchemist"],
};
const LOADOUTS = ["无装备", "全普通", "普通稀有混装", "全稀有"].filter((row) => !LOADOUT_FILTER || row === LOADOUT_FILTER);

function hash(text) {
  let value = 2166136261;
  for (const char of String(text)) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
  return value >>> 0;
}

function rngFor(seed) {
  let value = hash(seed) || 1;
  return () => {
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5; value >>>= 0;
    return value / 4294967296;
  };
}

function pick(random, rows) { return rows[Math.floor(random() * rows.length) % rows.length]; }
function directStat(random, stat, level) {
  const scales = { physicalPower: .5, magicPower: .5, maxHp: 2.8, armor: .08 };
  return Math.max(1, Math.round(level * (scales[stat] || .12) * (.92 + random() * .16)));
}
function affixValue(random, stat, level) {
  const def = GEAR.AFFIX_DEFS[stat] || {};
  const variance = .88 + random() * .24;
  if (def.category === "major") return Math.max(1, Math.round((1.1 + level / 45) * variance));
  if (def.percent) return Math.max(1, Math.round((2.5 + level / 7.5) * variance));
  return Math.max(1, Math.round((2 + level / 9) * variance));
}

function makeItem(random, rarityLabel, slotId, itemId) {
  const rarity = RARITY_BY_LABEL[rarityLabel];
  const slot = GAME.SLOT_DATA[slotId];
  const level = Math.max(10, Math.round(30 * (.88 + random() * .24)));
  const baseKeys = slot.baseOptions ? pick(random, slot.baseOptions) : slot.baseStats;
  const baseStats = Object.fromEntries(baseKeys.map((stat) => [stat, directStat(random, stat, level)]));
  const pool = slot.affixPool.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
  const focus = [pick(random, pool), pick(random, pool)];
  const affixes = Array.from({ length: rarity.affixes }, (_, index) => {
    const stat = index < Math.floor(rarity.affixes * .5) ? focus[index % 2] : pick(random, pool);
    const def = GEAR.AFFIX_DEFS[stat] || {};
    return { stat, label: def.label || stat, value: affixValue(random, stat, level), level: level >= 30 ? 2 : 1, category: def.category || "mechanic", percent: Boolean(def.percent) };
  });
  const power = Math.max(1, Math.round((Object.values(baseStats).reduce((sum, value) => sum + value, 0) * .25 + affixes.reduce((sum, row) => sum + row.value, 0)) * rarity.value));
  return { id: itemId, name: `${rarityLabel}${slot.label} Lv.${level}`, slot: slotId, slotLabel: slot.label, rarity: rarityLabel, rarityId: rarity.id, equipmentLevel: level, power, baseStats, affixes, identityTags: [], source: "边林讨伐 · 威胁1级" };
}

function rarityForLoadout(loadout, heroIndex, slotIndex) {
  if (loadout === "全普通") return "普通";
  if (loadout === "全稀有") return "稀有";
  if (loadout === "普通稀有混装") return (slotIndex + heroIndex) % 2 === 0 ? "稀有" : "普通";
  return null;
}

function fixture(routeId, soldierType, loadout, trial) {
  const route = ROUTES[routeId];
  const state = GAME.createInitialState(`${routeId}|paired-final|${trial}`);
  state.day = GAME.FINAL_DAY;
  state.phase = "final";
  state.storyStep = null;
  state.roster = route.slice();
  state.activeParty = route.slice();
  state.inventory = [];
  for (const heroId of Object.keys(GAME.HEROES)) state.equipment[heroId] = Object.fromEntries(SLOT_IDS.map((slot) => [slot, null]));
  route.forEach((heroId, heroIndex) => {
    SLOT_IDS.forEach((slotId, slotIndex) => {
      const rarity = rarityForLoadout(loadout, heroIndex, slotIndex);
      if (!rarity) return;
      const random = rngFor(`paired-gear|${trial}|${heroId}|${slotId}`);
      const id = `${routeId}_${soldierType}_${loadout}_${trial}_${heroId}_${slotId}`;
      state.inventory.push(makeItem(random, rarity, slotId, id));
      state.equipment[heroId][slotId] = id;
    });
  });
  state.resources.population = 70;
  state.resources.populationCap = 100;
  state.resources.food = 999;
  state.army.trainedUnits = soldierType === "战士" ? 7 : 0;
  state.enemy = { orcUnits: ENEMY_STATES[ENEMY_PROFILE].orcUnits, bosses: ENEMY_STATES[ENEMY_PROFILE].bosses };
  state.flags.captainBlessed = routeId === "guard" && ADD_GUARD_ROUTE_BLESSING;
  state.stats.combats = 0;
  return state;
}

function runScenario(routeId, soldierType, loadout) {
  let wins = 0;
  let leftAlive = 0;
  let rightAlive = 0;
  let duration = 0;
  let heroDeaths = 0;
  let soldierDeaths = 0;
  const casualtyCounts = [];
  let leftCount = 0;
  let rightCount = 0;
  for (let trial = 0; trial < TRIALS; trial += 1) {
    const state = fixture(routeId, soldierType, loadout, trial);
    const plan = GAME.finalBattlePlan(state, state.resources.food);
    const result = GAME.simulatePlan(plan);
    leftCount = plan.leftTeam.length;
    rightCount = plan.rightTeam.length;
    if (result.metrics.leftAlive > 0 && result.metrics.rightAlive === 0) wins += 1;
    const livingAllies = result.units.filter((unit) => unit.side === "left" && unit.alive);
    const livingSoldiers = livingAllies.filter((unit) => unit.name.startsWith("灰谷村民兵") || unit.name.startsWith("灰谷战士")).length;
    const livingHeroes = livingAllies.length - livingSoldiers;
    heroDeaths += ROUTES[routeId].length - livingHeroes;
    soldierDeaths += 7 - livingSoldiers;
    casualtyCounts.push(plan.leftTeam.length - result.metrics.leftAlive);
    leftAlive += result.metrics.leftAlive;
    rightAlive += result.metrics.rightAlive;
    duration += result.duration;
  }
  casualtyCounts.sort((a, b) => a - b);
  const percentile = (ratio) => casualtyCounts[Math.floor((casualtyCounts.length - 1) * ratio)];
  return {
    route: routeId === "scout" ? "斥候路线" : "盾骑路线",
    soldiers: `7支${soldierType}`,
    loadout,
    formation: `${leftCount}v${rightCount}`,
    wins,
    trials: TRIALS,
    winRatePct: Number((wins / TRIALS * 100).toFixed(1)),
    avgLeftAlive: Number((leftAlive / TRIALS).toFixed(2)),
    avgTotalDeaths: Number(((leftCount * TRIALS - leftAlive) / TRIALS).toFixed(2)),
    avgHeroDeaths: Number((heroDeaths / TRIALS).toFixed(2)),
    avgSoldierDeaths: Number((soldierDeaths / TRIALS).toFixed(2)),
    deathsP25MedianP75: [percentile(.25), percentile(.5), percentile(.75)],
    avgEnemyAlive: Number((rightAlive / TRIALS).toFixed(2)),
    avgDuration: Number((duration / TRIALS).toFixed(1)),
  };
}

const results = [];
for (const routeId of Object.keys(ROUTES)) {
  for (const soldierType of ["民兵", "战士"]) {
    for (const loadout of LOADOUTS) results.push(runScenario(routeId, soldierType, loadout));
  }
}

console.log(JSON.stringify({
  assumptions: {
    enemies: ENEMY_STATES[ENEMY_PROFILE].label,
    heroes: "一局可同时获得的最多7名英雄；斥候与盾骑为互斥路线",
    soldiers: "实际人口70提供7支军队；分别测试全民兵与全训练战士",
    gear: "每名英雄8部位；按边林威胁1级的当前装备等级和词条公式生成；混装为每人4普通+4稀有",
    food: "粮食充足，7支军队全部出战",
  },
  results,
}, null, 2));
