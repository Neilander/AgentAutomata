const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UI_FILE = path.join(ROOT, "equipment_grind_v2", "equipment-grind-simulator.js");
const SKILL_DATA = require("./skill-data");
const BUILD_LAYERS = require("./build-layers");
const { simulateTeams } = require("./combat-sim");

const ROLE_LABELS = {
  warrior: "战士",
  knight: "骑士",
  berserker: "狂战士",
  assassin: "刺客",
  ranger: "游侠",
  mage: "法师",
  priest: "牧师",
  warlock: "术士",
  bard: "诗人",
  alchemist: "炼金师",
};

const SHADOW_ASSASSIN_KIT = {
  small1: "shadowBurstAmbush",
  small2: "throatCut",
  passive: "shadowMomentum",
  ultimate: "midnightBloom",
};

const HERO_DRAFTS = [
  { role: "warrior" },
  { role: "knight" },
  { role: "berserker" },
  { role: "assassin", variant: "poison", label: "毒刃刺客" },
  { role: "assassin", variant: "shadow", label: "暗影刺客" },
  { role: "ranger" },
  { role: "mage" },
  { role: "priest" },
  { role: "warlock" },
  { role: "bard" },
  { role: "alchemist" },
];

const SLOT_DATA = {
  weapon: { baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "agility", "arcana", "physicalPower", "magicPower", "attackSpeed", "critChance", "critDamage", "lifeSteal"] },
  helm: { baseStats: ["maxHp", "armor"], affixPool: ["arcana", "rhythm", "resilience", "magicPower", "skillHaste", "effectPower", "effectResist", "healPower"] },
  chest: { baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "maxHp", "armor", "effectResist", "receivedHealing", "shieldPower"] },
  gloves: { baseStats: ["physicalPower", "armor"], affixPool: ["might", "agility", "physicalPower", "attackSpeed", "critChance", "critDamage", "lifeSteal"] },
  legs: { baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "agility", "maxHp", "armor", "effectResist", "receivedHealing"] },
  boots: { baseStats: ["maxHp", "armor"], affixPool: ["agility", "rhythm", "resilience", "attackSpeed", "skillHaste", "effectResist", "initiative"] },
  ring: { baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "skillHaste", "effectPower"] },
  charm: { baseOptions: [["maxHp"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "effectPower", "receivedHealing"] },
};

const AFFIX_DEFS = {
  might: { category: "major" },
  fortitude: { category: "major" },
  agility: { category: "major" },
  arcana: { category: "major" },
  rhythm: { category: "major" },
  resilience: { category: "major" },
  attackSpeed: { percent: true },
  skillHaste: { percent: true },
  effectPower: { percent: true },
  effectResist: { percent: true },
  receivedHealing: { percent: true },
};

const COMMON_GEAR_LEVELS = [24, 34, 48, 70, 95, 120, 142, 165, 185];

function loadDungeons() {
  const text = fs.readFileSync(UI_FILE, "utf8");
  const match = text.match(/const DUNGEONS = (\[[\s\S]*?\n  \]);/);
  if (!match) throw new Error("Cannot find DUNGEONS in equipment_grind_v2 UI file.");
  return Function(`"use strict"; return ${match[1]};`)();
}

function runCalibration(options = {}) {
  const dungeons = loadDungeons();
  const rosters = Number(options.rosters || 12);
  const seeds = Number(options.seeds || 3);
  const gearMode = options.gearMode || "common";
  const fixedGearLevel = Number(options.fixedGearLevel || 0);
  const rows = dungeons.map((dungeon, dungeonIndex) => {
    let wins = 0;
    let games = 0;
    let powerSum = 0;
    for (let rosterIndex = 0; rosterIndex < rosters; rosterIndex += 1) {
      const rng = seededRandom(`calibrate-v2|${gearMode}|d${dungeon.level}|r${rosterIndex}`);
      const heroes = makeRoster(rng, dungeonIndex, gearMode, fixedGearLevel);
      const teamPower = heroes.reduce((sum, hero) => sum + heroPower(hero), 0);
      powerSum += teamPower;
      for (let seed = 0; seed < seeds; seed += 1) {
        const enemyRoles = dungeon.enemySets[(rosterIndex + seed) % dungeon.enemySets.length];
        const leftTeam = heroes.map((hero, index) => buildHeroSpec(hero, index));
        const rightTeam = enemyRoles.map((role, index) => buildEnemySpec(role, dungeon, index));
        const result = simulateTeams(leftTeam, rightTeam, {
          seed: `calibrate-v2|${gearMode}|${dungeon.level}|${rosterIndex}|${seed}`,
          randomizeStats: false,
          maxTime: 70,
        });
        games += 1;
        if (result.winner === "left") wins += 1;
      }
    }
    return {
      level: dungeon.level,
      name: dungeon.name,
      suggestedPower: dungeon.power,
      enemyPoints: dungeon.enemyPoints,
      enemyGear: dungeon.enemyGear,
      gearMode,
      avgTeamPower: round(powerSum / rosters),
      wins,
      games,
      winRate: round(wins / Math.max(1, games), 3),
    };
  });
  return rows;
}

function makeRoster(rng, dungeonIndex, gearMode, fixedGearLevel = 0) {
  const drafts = pickMany(HERO_DRAFTS, 6, rng).slice(0, 4);
  return drafts.map((draft, index) => {
    const kit = SKILL_DATA.roleKits[draft.role]?.kit || {};
    const branchKit = draft.variant === "shadow" ? SHADOW_ASSASSIN_KIT : kit;
    const hero = {
      role: draft.role,
      variant: draft.variant || "",
      name: `${draft.label || ROLE_LABELS[draft.role] || draft.role}${index + 1}`,
      small1: branchKit.small1,
      small2: branchKit.small2,
      passive: branchKit.passive,
      ultimate: branchKit.ultimate,
      equipment: {},
    };
    const level = gearMode === "none" ? 0 : fixedGearLevel || COMMON_GEAR_LEVELS[dungeonIndex] || COMMON_GEAR_LEVELS[0];
    if (level > 0) {
      for (const slotKey of Object.keys(SLOT_DATA)) {
        hero.equipment[slotKey] = generateCommonItem(slotKey, hero.role, level, rng);
      }
    }
    return hero;
  });
}

function buildHeroSpec(hero, index) {
  return {
    ...BUILD_LAYERS.applyBuildLayers(baseHeroSpec(hero), {
      equipmentItems: Object.values(hero.equipment || {}),
      tags: ["equipment-grind-v2-calibration"],
    }),
    slotIndex: index,
  };
}

function baseHeroSpec(hero) {
  const kit = SKILL_DATA.roleKits[hero.role] || {};
  const basePower = kit.power || 45;
  return {
    role: hero.role,
    name: hero.name,
    small1: hero.small1,
    small2: hero.small2,
    passive: hero.passive,
    ultimate: hero.ultimate,
    hp: kit.hp || 300,
    maxHp: kit.hp || 300,
    power: basePower,
    physicalPower: basePower,
    magicPower: basePower,
    armor: kit.armor || 0,
    range: kit.range || 14,
  };
}

function buildEnemySpec(role, dungeon, index) {
  return {
    ...BUILD_LAYERS.applyBuildLayers(baseEnemySpec(role, dungeon, index), {
      attributePoints: enemyAttributePoints(role, dungeon.enemyPoints || 0),
      equipmentModifiers: enemyEquipmentBundle(role, dungeon.enemyGear || 0),
      tags: ["equipment-grind-v2-calibration-enemy"],
    }),
    slotIndex: index,
  };
}

function baseEnemySpec(role, dungeon, index) {
  const kit = SKILL_DATA.roleKits[role] || {};
  const roleKit = kit.kit || {};
  const power = kit.power || 45;
  return {
    role,
    name: `${dungeon.level}级${ROLE_LABELS[role] || role}`,
    small1: roleKit.small1,
    small2: roleKit.small2,
    passive: roleKit.passive,
    ultimate: roleKit.ultimate,
    hp: kit.hp || 300,
    maxHp: kit.hp || 300,
    power,
    physicalPower: power,
    magicPower: power,
    armor: kit.armor || 8,
    range: kit.range || 14,
    slotIndex: index,
  };
}

function enemyAttributePoints(role, totalPoints) {
  const [main, secondary] = BUILD_LAYERS.ROLE_ATTRS?.[role] || ["fortitude", "might"];
  const mainPoints = Math.ceil(totalPoints * 0.65);
  const secondaryPoints = Math.max(0, totalPoints - mainPoints);
  return { [main]: mainPoints, [secondary]: secondaryPoints };
}

function enemyEquipmentBundle(role, budget) {
  const physical = ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
  const magic = ["mage", "priest", "warlock", "bard", "alchemist"].includes(role);
  return {
    source: "equipment-grind-enemy-gear",
    maxHpAdd: budget * 5.5,
    physicalPowerAdd: budget * (physical ? 0.72 : 0.2),
    magicPowerAdd: budget * (magic ? 0.72 : 0.2),
    armorAdd: budget * 0.16,
    attackSpeedMult: 1 + budget * (physical ? 0.0032 : 0.0012),
    skillHasteMult: 1 + budget * (magic ? 0.0032 : 0.0014),
    effectPowerMult: 1 + budget * (magic ? 0.0022 : 0.001),
    effectResistPct: budget * 0.0008,
    receivedHealingMult: 1 + budget * 0.001,
    mechanicModifiers: {},
    notes: ["enemy equipment budget"],
    debug: { role, budget },
  };
}

function generateCommonItem(slotKey, role, equipmentLevel, rng) {
  const slot = SLOT_DATA[slotKey];
  const physical = ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
  const baseStats = Object.fromEntries(baseStatsForRole(slot, physical).map((stat) => [stat, rollDirectStatValue(stat, equipmentLevel, rng)]));
  const affixPool = slot.affixPool.filter((stat) => usefulForRole(stat, role));
  const stat = affixPool[Math.floor(rng() * affixPool.length)] || slot.affixPool[0];
  return {
    id: `cal_${slotKey}_${role}_${equipmentLevel}_${Math.floor(rng() * 999999)}`,
    slot: slotKey,
    rarity: "common",
    equipmentLevel,
    baseStats,
    affixes: [{ stat, value: rollAffixValue(stat, equipmentLevel, rng), level: rollAffixLevel(equipmentLevel) }],
  };
}

function baseStatsForRole(slot, physical) {
  if (!slot.baseOptions) return slot.baseStats || [];
  if (physical) return slot.baseOptions.find((stats) => stats.includes("physicalPower")) || slot.baseOptions[0];
  return slot.baseOptions.find((stats) => stats.includes("magicPower")) || slot.baseOptions[0];
}

function usefulForRole(stat, role) {
  const physical = ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
  const magic = ["mage", "priest", "warlock", "bard", "alchemist"].includes(role);
  if (stat === "physicalPower" || stat === "might") return physical;
  if (stat === "magicPower" || stat === "arcana") return magic;
  return true;
}

function rollAffixValue(stat, equipmentLevel, rng) {
  const def = AFFIX_DEFS[stat] || {};
  const variance = 0.88 + rng() * 0.24;
  if (def.category === "major") return Math.max(1, Math.round((1.1 + equipmentLevel / 45) * variance));
  if (def.percent || BUILD_LAYERS.MECHANIC_CURVES?.hasMechanicCurve?.(stat)) return Math.max(1, Math.round((2.5 + equipmentLevel / 7.5) * variance));
  return Math.max(1, Math.round((2 + equipmentLevel / 9) * variance));
}

function rollDirectStatValue(stat, equipmentLevel, rng) {
  const variance = 0.92 + rng() * 0.16;
  const rows = {
    physicalPower: 0.5,
    magicPower: 0.5,
    maxHp: 2.8,
    armor: 0.08,
  };
  return Math.max(1, Math.round(equipmentLevel * (rows[stat] || 0.12) * variance));
}

function rollAffixLevel(equipmentLevel) {
  if (equipmentLevel >= 120) return 5;
  if (equipmentLevel >= 80) return 4;
  if (equipmentLevel >= 50) return 3;
  if (equipmentLevel >= 30) return 2;
  return 1;
}

function heroPower(hero) {
  const kit = SKILL_DATA.roleKits[hero.role] || {};
  const bonus = equipmentBonus(hero);
  return (kit.hp || 300) * 0.5
    + (kit.power || 45) * 8
    + (kit.armor || 8) * 16
    + bonus.maxHp * 0.62
    + bonus.physicalPower * rolePhysicalWeight(hero.role) * 13
    + bonus.magicPower * roleMagicWeight(hero.role) * 13
    + bonus.armor * 18
    + bonus.attackSpeed * rolePhysicalWeight(hero.role) * 420
    + bonus.skillHaste * roleSkillWeight(hero.role) * 410
    + bonus.effectPower * roleEffectWeight(hero.role) * 360
    + bonus.effectResist * 260
    + bonus.receivedHealing * 280;
}

function equipmentBonus(hero) {
  const bundle = BUILD_LAYERS.buildEquipmentModifierBundle(Object.values(hero.equipment || {}));
  return {
    maxHp: bundle.maxHpAdd || 0,
    physicalPower: bundle.physicalPowerAdd || 0,
    magicPower: bundle.magicPowerAdd || 0,
    armor: bundle.armorAdd || 0,
    attackSpeed: (bundle.attackSpeedMult || 1) - 1,
    skillHaste: (bundle.skillHasteMult || 1) - 1,
    effectPower: (bundle.effectPowerMult || 1) - 1,
    effectResist: bundle.effectResistPct || 0,
    receivedHealing: (bundle.receivedHealingMult || 1) - 1,
  };
}

function rolePhysicalWeight(role) { return ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role) ? 1 : 0.25; }
function roleMagicWeight(role) { return ["mage", "priest", "warlock", "bard", "alchemist"].includes(role) ? 1 : 0.25; }
function roleSkillWeight(role) { return ["mage", "priest", "warlock", "bard", "alchemist"].includes(role) ? 1 : 0.55; }
function roleEffectWeight(role) { return ["priest", "warlock", "bard", "alchemist", "mage"].includes(role) ? 1 : 0.45; }

function pickMany(items, count, rng) {
  const pool = [...items];
  const output = [];
  while (output.length < count && pool.length) {
    output.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return output;
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value, digits = 3) {
  return Number((Number(value) || 0).toFixed(digits));
}

function printRows(rows) {
  console.log("| D | 推荐 | 点数 | 敌装 | 测试队均战 | 胜率 |");
  console.log("|---|---:|---:|---:|---:|---:|");
  for (const row of rows) {
    console.log(`| D${row.level} ${row.name} | ${row.suggestedPower} | ${row.enemyPoints} | ${row.enemyGear} | ${row.avgTeamPower} | ${Math.round(row.winRate * 100)}% (${row.wins}/${row.games}) |`);
  }
}

if (require.main === module) {
  const rows = runCalibration({
    rosters: Number(process.env.ROSTERS || 12),
    seeds: Number(process.env.SEEDS || 3),
    gearMode: process.env.GEAR_MODE || "common",
    fixedGearLevel: process.env.GEAR_LEVEL || 0,
  });
  printRows(rows);
}

module.exports = { runCalibration };
