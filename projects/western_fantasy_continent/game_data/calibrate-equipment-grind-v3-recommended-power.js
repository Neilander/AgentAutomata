const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UI_FILE = path.join(ROOT, "equipment_grind_v3", "equipment-grind-simulator.js");
const OUT_DIR = path.join(ROOT, "design", "equipment_progression");
const OUT_JSON = path.join(OUT_DIR, "equipment-grind-v3-recommended-power-calibration.json");
const OUT_MD = path.join(OUT_DIR, "equipment-grind-v3-recommended-power-calibration.md");

const SKILL_DATA = require("./skill-data");
const BUILD_LAYERS = require("./build-layers");
const MECHANIC_CURVES = require("./mechanic-curves");
const { simulateTeams } = require("./combat-sim");

const TARGET_WIN_RATE = 0.7;
const BAND = 0.08;
const TEAM_POOL_SIZE = Number(process.env.TEAM_POOL_SIZE || 720);
const MAX_TEAMS_PER_BUCKET = Number(process.env.MAX_TEAMS_PER_BUCKET || 6);
const SEEDS_PER_TEAM = Number(process.env.SEEDS_PER_TEAM || 1);

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
  { role: "assassin", variant: "poison" },
  { role: "assassin", variant: "shadow" },
  { role: "ranger" },
  { role: "mage" },
  { role: "priest" },
  { role: "warlock" },
  { role: "bard" },
  { role: "alchemist" },
];

const SLOT_DATA = {
  weapon: {
    baseOptions: [["physicalPower"], ["magicPower"]],
    affixPool: ["might", "agility", "arcana", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "executeDamage", "lowHpDamage", "markPower"],
  },
  helm: {
    baseStats: ["maxHp", "armor"],
    affixPool: ["arcana", "rhythm", "resilience", "skillHaste", "effectPower", "effectResist", "healPower", "controlPower", "critChance", "fireAmp", "poisonAmp", "arcaneAmp", "markPower", "stealthDuration", "cleanseEfficiency", "auraPower"],
  },
  chest: {
    baseStats: ["maxHp", "armor"],
    affixPool: ["fortitude", "resilience", "effectResist", "receivedHealing", "shieldPower", "lowHpHealingReceived", "counterDamage", "cleanseEfficiency"],
  },
  gloves: {
    baseStats: ["physicalPower", "armor"],
    affixPool: ["might", "agility", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "markPower", "executeDamage", "lowHpDamage", "counterDamage"],
  },
  legs: {
    baseStats: ["maxHp", "armor"],
    affixPool: ["fortitude", "resilience", "agility", "effectResist", "receivedHealing", "skillHaste", "lowHpHealingReceived", "cleanseEfficiency", "counterDamage"],
  },
  boots: {
    baseStats: ["maxHp", "armor"],
    affixPool: ["agility", "rhythm", "resilience", "attackSpeed", "skillHaste", "effectResist", "initiative", "controlPower", "stealthDuration", "auraPower"],
  },
  ring: {
    baseOptions: [["physicalPower"], ["magicPower"]],
    affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "skillHaste", "effectPower", "effectResist", "dotAmp", "controlPower", "healPower", "shieldPower", "fireAmp", "poisonAmp", "shadowAmp", "markPower", "executeDamage", "lowHpDamage", "lowHpHealingReceived", "auraPower"],
  },
  charm: {
    baseOptions: [["maxHp"], ["magicPower"]],
    affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "effectPower", "receivedHealing", "dotAmp", "healPower", "shieldPower", "controlPower", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "stealthDuration", "cleanseEfficiency", "auraPower", "counterDamage"],
  },
};

const RARITIES = [
  { id: "common", affixes: 1, value: 1 },
  { id: "rare", affixes: 2, value: 1.3 },
  { id: "epic", affixes: 4, value: 1.9 },
  { id: "legendary", affixes: 7, value: 2.8 },
  { id: "mythic", affixes: 12, value: 4.2 },
];
const RARITY_BY_ID = Object.fromEntries(RARITIES.map((rarity) => [rarity.id, rarity]));
const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dungeons = loadDungeons();
  const teamPool = buildTeamPool();
  const rows = dungeons.map((dungeon) => calibrateDungeon(dungeon, teamPool));
  const updates = Object.fromEntries(rows.map((row) => [row.level, row.recommendedPower]));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), settings: settingsSnapshot(), rows }, null, 2), "utf8");
  fs.writeFileSync(OUT_MD, renderMarkdown(rows), "utf8");
  updateUiPowerValues(updates);
  printRows(rows);
}

function settingsSnapshot() {
  return {
    targetWinRate: TARGET_WIN_RATE,
    band: BAND,
    teamPoolSize: TEAM_POOL_SIZE,
    maxTeamsPerBucket: MAX_TEAMS_PER_BUCKET,
    seedsPerTeam: SEEDS_PER_TEAM,
  };
}

function loadDungeons() {
  const text = fs.readFileSync(UI_FILE, "utf8");
  const match = text.match(/const DUNGEONS = (\[[\s\S]*?\n  \]);/);
  if (!match) throw new Error("Cannot find DUNGEONS in V3 UI file.");
  return Function(`"use strict"; return ${match[1]};`)();
}

function buildTeamPool() {
  const teams = [];
  for (let i = 0; i < TEAM_POOL_SIZE; i += 1) {
    const rng = seededRandom(`v3-team-pool|${i}`);
    const equipmentLevel = rollPoolEquipmentLevel(rng);
    const rarityBias = rollPoolRarityBias(equipmentLevel, rng);
    const heroes = makeTeam(rng, equipmentLevel, rarityBias);
    const power = teamPower(heroes);
    teams.push({
      id: i,
      power,
      equipmentLevel,
      rarityBias,
      roles: heroes.map((hero) => hero.role + (hero.variant ? `:${hero.variant}` : "")),
      heroes,
    });
  }
  teams.sort((a, b) => a.power - b.power);
  return teams;
}

function rollPoolEquipmentLevel(rng) {
  const roll = rng();
  if (roll < 0.12) return 0;
  if (roll < 0.26) return Math.round(1 + rng() * 34);
  if (roll < 0.48) return Math.round(28 + rng() * 52);
  if (roll < 0.7) return Math.round(62 + rng() * 78);
  if (roll < 0.88) return Math.round(120 + rng() * 70);
  if (roll < 0.97) return Math.round(180 + rng() * 80);
  return Math.round(240 + rng() * 70);
}

function rollPoolRarityBias(equipmentLevel, rng) {
  const bias = Math.max(0, Math.min(1, equipmentLevel / 240));
  const lucky = rng() < 0.14;
  return {
    common: Math.max(0.04, 0.58 - bias * 0.52),
    rare: Math.max(0.08, 0.32 - bias * 0.12),
    epic: 0.08 + bias * (lucky ? 0.1 : 0.18),
    legendary: 0.015 + bias * (lucky ? 0.34 : 0.25),
    mythic: 0.005 + bias * (lucky ? 0.34 : 0.21),
    lucky,
  };
}

function makeTeam(rng, equipmentLevel, rarityBias) {
  const drafts = pickMany(HERO_DRAFTS, 4, rng);
  return drafts.map((draft, index) => {
    const kit = SKILL_DATA.roleKits[draft.role]?.kit || {};
    const branchKit = draft.variant === "shadow" ? SHADOW_ASSASSIN_KIT : kit;
    const hero = {
      role: draft.role,
      variant: draft.variant || "",
      name: `cal-${draft.role}-${index + 1}`,
      small1: branchKit.small1,
      small2: branchKit.small2,
      passive: branchKit.passive,
      ultimate: branchKit.ultimate,
      equipment: {},
    };
    if (equipmentLevel > 0) {
      const slotKeys = equipmentSlotsForLevel(equipmentLevel, rng);
      for (const slotKey of slotKeys) {
        hero.equipment[slotKey] = generateItem(slotKey, hero.role, equipmentLevel, rarityBias, rng);
      }
    }
    return hero;
  });
}

function equipmentSlotsForLevel(equipmentLevel, rng) {
  const slots = Object.keys(SLOT_DATA);
  if (equipmentLevel >= 60) return slots;
  const count = equipmentLevel < 12 ? 2 : equipmentLevel < 30 ? 4 : 6;
  return pickMany(slots, count, rng);
}

function generateItem(slotKey, role, equipmentLevel, rarityBias, rng) {
  const slot = SLOT_DATA[slotKey];
  const rarity = chooseRarity(rarityBias, rng);
  const baseStats = Object.fromEntries(baseStatsForRole(slot, role).map((stat) => [stat, rollDirectStatValue(stat, equipmentLevel, rng)]));
  const affixPool = slot.affixPool.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat) && usefulForRole(stat, role));
  const affixes = pickMany(affixPool.length ? affixPool : slot.affixPool, rarity.affixes, rng).map((stat) => ({
    id: stat,
    stat,
    value: rollAffixValue(stat, equipmentLevel, rng),
    level: rollAffixLevel(equipmentLevel),
  }));
  return {
    id: `cal_${slotKey}_${role}_${equipmentLevel}_${Math.floor(rng() * 1e9)}`,
    slot: slotKey,
    rarity: rarity.id,
    equipmentLevel,
    baseStats,
    affixes,
  };
}

function chooseRarity(table, rng) {
  const normalized = normalizeRarityTable(table);
  const roll = rng();
  let cursor = 0;
  for (const rarity of RARITIES) {
    cursor += normalized[rarity.id] || 0;
    if (roll <= cursor) return rarity;
  }
  return RARITY_BY_ID.common;
}

function normalizeRarityTable(table) {
  const output = {};
  let total = 0;
  for (const rarity of RARITIES) {
    const value = Math.max(0, Number(table[rarity.id]) || 0);
    output[rarity.id] = value;
    total += value;
  }
  if (!total) return { common: 1 };
  for (const key of Object.keys(output)) output[key] /= total;
  return output;
}

function calibrateDungeon(dungeon, teamPool) {
  const enemyPower = averageEnemyPower(dungeon);
  const candidates = candidatePowers(dungeon.power, enemyPower, teamPool);
  const tested = [];
  let chosen = null;
  for (const power of candidates) {
    const result = testPowerBucket(dungeon, power, teamPool);
    tested.push(result);
    if (!chosen && result.teams >= 3 && result.winRate >= TARGET_WIN_RATE) {
      chosen = result;
      break;
    }
  }
  if (!chosen) {
    chosen = tested
      .filter((row) => row.teams > 0)
      .sort((a, b) => Math.abs(a.winRate - TARGET_WIN_RATE) - Math.abs(b.winRate - TARGET_WIN_RATE))[0]
      || tested[tested.length - 1];
  }
  const recommendedPower = roundToStep(chosen.avgTeamPower || chosen.targetPower, 100);
  return {
    level: dungeon.level,
    name: dungeon.name,
    oldPower: dungeon.power,
    recommendedPower,
    enemyPower: round(enemyPower),
    targetPower: chosen.targetPower,
    avgTeamPower: round(chosen.avgTeamPower),
    winRate: round(chosen.winRate, 3),
    wins: chosen.wins,
    games: chosen.games,
    teams: chosen.teams,
    avgDuration: round(chosen.avgDuration, 1),
    tested: tested.map((row) => ({
      targetPower: row.targetPower,
      avgTeamPower: round(row.avgTeamPower),
      winRate: round(row.winRate, 3),
      games: row.games,
      teams: row.teams,
      avgDuration: round(row.avgDuration, 1),
    })),
  };
}

function averageEnemyPower(dungeon) {
  const sets = dungeon.enemySets || [];
  const powers = sets.map((roles) => {
    const team = roles.map((role, index) => buildEnemySpec(role, dungeon, index));
    return team.reduce((sum, spec) => sum + specPower(spec), 0);
  });
  return powers.reduce((sum, power) => sum + power, 0) / Math.max(1, powers.length);
}

function candidatePowers(oldPower, enemyPower, teamPool) {
  const minPool = Math.floor(teamPool[0].power / 500) * 500;
  const maxPool = Math.ceil(teamPool[teamPool.length - 1].power / 500) * 500;
  const center = Math.max(oldPower, enemyPower);
  const low = Math.max(minPool, Math.floor(center * 0.65 / 500) * 500);
  const high = Math.min(maxPool, Math.ceil(center * 2.35 / 500) * 500);
  const values = new Set();
  for (let power = low; power <= high; power += power < 12000 ? 1000 : 2000) values.add(power);
  values.add(roundToStep(oldPower, 500));
  values.add(roundToStep(enemyPower, 500));
  return [...values].filter((value) => value > 0).sort((a, b) => a - b);
}

function testPowerBucket(dungeon, targetPower, teamPool) {
  const lower = targetPower * (1 - BAND);
  const upper = targetPower * (1 + BAND);
  const candidates = teamPool
    .filter((team) => team.power >= lower && team.power <= upper)
    .sort((a, b) => Math.abs(a.power - targetPower) - Math.abs(b.power - targetPower))
    .slice(0, MAX_TEAMS_PER_BUCKET);
  let wins = 0;
  let games = 0;
  let durationSum = 0;
  let powerSum = 0;
  for (const team of candidates) {
    powerSum += team.power;
    for (let setIndex = 0; setIndex < (dungeon.enemySets || []).length; setIndex += 1) {
      for (let seed = 0; seed < SEEDS_PER_TEAM; seed += 1) {
        const roles = dungeon.enemySets[setIndex];
        const result = simulateTeams(
          team.heroes.map((hero, index) => buildHeroSpec(hero, index)),
          roles.map((role, index) => buildEnemySpec(role, dungeon, index)),
          {
            seed: `v3-rec-power|d${dungeon.level}|p${targetPower}|t${team.id}|s${setIndex}|r${seed}`,
            randomizeStats: false,
            maxTime: 70,
          },
        );
        games += 1;
        durationSum += result.duration || 70;
        if (result.winner === "left") wins += 1;
      }
    }
  }
  return {
    targetPower,
    teams: candidates.length,
    avgTeamPower: candidates.length ? powerSum / candidates.length : 0,
    wins,
    games,
    winRate: games ? wins / games : 0,
    avgDuration: games ? durationSum / games : 0,
  };
}

function buildHeroSpec(hero, index) {
  return {
    ...BUILD_LAYERS.applyBuildLayers(baseHeroSpec(hero), {
      equipmentItems: Object.values(hero.equipment || {}),
      tags: ["equipment-grind-v3-recommended-power-player"],
    }),
    slotIndex: index,
  };
}

function buildEnemySpec(role, dungeon, index) {
  return {
    ...BUILD_LAYERS.applyBuildLayers(baseEnemySpec(role, dungeon, index), {
      attributePoints: enemyAttributePoints(role, dungeon.enemyPoints || 0),
      equipmentModifiers: enemyEquipmentBundle(role, dungeon.enemyGear || 0),
      tags: ["equipment-grind-v3-recommended-power-enemy"],
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

function baseEnemySpec(role, dungeon, index) {
  const kit = SKILL_DATA.roleKits[role] || {};
  const roleKit = kit.kit || {};
  const power = kit.power || 45;
  return {
    role,
    name: `D${dungeon.level}-${role}-${index + 1}`,
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
    source: "equipment-grind-v3-enemy-gear",
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

function teamPower(heroes) {
  return heroes.reduce((sum, hero) => sum + heroPower(hero), 0);
}

function heroPower(hero) {
  const kit = SKILL_DATA.roleKits[hero.role] || {};
  const bundle = BUILD_LAYERS.buildEquipmentModifierBundle(Object.values(hero.equipment || {}));
  const bonus = equipmentBonusFromBundle(bundle);
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
    + bonus.receivedHealing * 280
    + mechanicPower(hero, bundle.mechanicModifiers || {});
}

function specPower(spec) {
  const fakeHero = { role: spec.role, equipment: {} };
  const base = (spec.maxHp || spec.hp || 300) * 0.5
    + (spec.power || spec.physicalPower || spec.magicPower || 45) * 8
    + (spec.armor || 8) * 16;
  const attackSpeed = (spec.attackSpeedMult || 1) - 1;
  const skillHaste = (spec.skillHasteMult || 1) - 1;
  const effectPower = (spec.effectPowerMult || 1) - 1;
  const receivedHealing = (spec.receivedHealingMult || 1) - 1;
  return base
    + Math.max(0, (spec.physicalPower || spec.power || 0) - (SKILL_DATA.roleKits[spec.role]?.power || 45)) * rolePhysicalWeight(spec.role) * 13
    + Math.max(0, (spec.magicPower || spec.power || 0) - (SKILL_DATA.roleKits[spec.role]?.power || 45)) * roleMagicWeight(spec.role) * 13
    + attackSpeed * rolePhysicalWeight(spec.role) * 420
    + skillHaste * roleSkillWeight(spec.role) * 410
    + effectPower * roleEffectWeight(spec.role) * 360
    + (spec.effectResistPct || 0) * 260
    + receivedHealing * 280
    + mechanicPower(fakeHero, spec.mechanicModifiers || {});
}

function equipmentBonusFromBundle(bundle) {
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

function mechanicPower(hero, modifiers = {}) {
  return Object.entries(modifiers).reduce((sum, [key, value]) => {
    const stat = key.startsWith("attribute:") ? key.slice("attribute:".length) : key;
    return sum + normalizedStatScoreForHero(stat, value, hero) * 0.42;
  }, 0);
}

function normalizedStatScoreForHero(stat, value, hero) {
  const numeric = Number(value) || 0;
  const role = hero?.role || "";
  if (BUILD_LAYERS.ATTR_ORDER?.includes(stat)) return numeric * 55 * roleAttributeWeight(role, stat);
  const curveValue = MECHANIC_CURVES?.hasMechanicCurve?.(stat) ? MECHANIC_CURVES.mechanicCurveValue(stat, numeric) * 100 : numeric;
  const weights = {
    maxHp: 0.55,
    physicalPower: 8 * rolePhysicalWeight(role),
    magicPower: 8 * roleMagicWeight(role),
    armor: 12,
    attackSpeed: 320 * rolePhysicalWeight(role),
    skillHaste: 330 * roleSkillWeight(role),
    effectPower: 285 * roleEffectWeight(role),
    effectResist: 210,
    receivedHealing: 220 * roleFrontlineWeight(role),
    healPower: 18 * roleHealWeight(role),
    shieldPower: 18 * roleShieldWeight(role),
    dotAmp: 16 * roleDotWeight(role),
    controlPower: 15 * roleControlWeight(role),
    critChance: 13 * roleCritWeight(role),
    critDamage: 13 * roleCritWeight(role),
    lifeSteal: 18 * roleLifeStealWeight(role),
    shieldBreak: 12 * rolePhysicalWeight(role),
    armorBreak: 12 * rolePhysicalWeight(role),
    initiative: 14 * roleInitiativeWeight(role),
    fireAmp: 18 * (["mage", "alchemist", "ranger"].includes(role) ? 1 : 0.35),
    poisonAmp: 18 * (["warlock", "alchemist", "assassin"].includes(role) ? 1 : 0.35),
    shadowAmp: 18 * (["assassin", "warlock"].includes(role) ? 1 : 0.35),
    arcaneAmp: 18 * (["mage", "warlock", "alchemist", "priest", "bard"].includes(role) ? 0.9 : 0.25),
    markPower: 18 * (["ranger", "assassin"].includes(role) ? 1 : 0.25),
    stealthDuration: 20 * (role === "assassin" ? 1 : role === "ranger" ? 0.82 : 0.12),
    executeDamage: 17 * (["assassin", "ranger", "warrior"].includes(role) ? 1 : 0.25),
    lowHpDamage: 18 * (["berserker", "warlock", "warrior"].includes(role) ? 1 : 0.25),
    lowHpHealingReceived: 18 * (["berserker", "knight", "warrior"].includes(role) ? 1 : 0.28),
    counterDamage: 16 * (["knight", "warrior"].includes(role) ? 1 : 0.3),
    cleanseEfficiency: 17 * (["priest", "bard", "alchemist"].includes(role) ? 1 : 0.35),
    auraPower: 18 * (["bard", "priest", "knight"].includes(role) ? 1 : 0.35),
  };
  return (weights[stat] || 2.5) * curveValue;
}

function baseStatsForRole(slot, role) {
  if (!slot.baseOptions) return slot.baseStats || [];
  const physical = ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
  if (physical) return slot.baseOptions.find((stats) => stats.includes("physicalPower")) || slot.baseOptions[0];
  return slot.baseOptions.find((stats) => stats.includes("magicPower")) || slot.baseOptions[0];
}

function rollAffixValue(stat, equipmentLevel, rng) {
  const variance = 0.88 + rng() * 0.24;
  if (BUILD_LAYERS.ATTR_ORDER?.includes(stat)) return Math.max(1, Math.round((1.1 + equipmentLevel / 45) * variance));
  if (MECHANIC_CURVES?.hasMechanicCurve?.(stat)) return Math.max(1, Math.round((2.5 + equipmentLevel / 7.5) * variance));
  if (stat === "effectResist" || stat === "receivedHealing" || stat === "effectPower") return Math.max(1, Math.round((2.5 + equipmentLevel / 8) * variance));
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

function usefulForRole(stat, role) {
  if (stat === "might") return ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
  if (stat === "arcana") return ["mage", "priest", "warlock", "bard", "alchemist"].includes(role);
  return true;
}

function rolePhysicalWeight(role) { return ["warrior", "berserker", "assassin", "ranger", "knight"].includes(role) ? 1 : 0.45; }
function roleMagicWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard"].includes(role) ? 1 : 0.35; }
function roleSkillWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard", "knight"].includes(role) ? 1 : 0.65; }
function roleEffectWeight(role) { return ["mage", "warlock", "alchemist", "priest", "bard"].includes(role) ? 1 : 0.5; }
function roleFrontlineWeight(role) { return ["knight", "warrior", "berserker"].includes(role) ? 1 : 0.55; }
function roleHealWeight(role) { return role === "priest" ? 1 : role === "bard" ? 0.7 : 0.25; }
function roleShieldWeight(role) { return ["knight", "priest"].includes(role) ? 1 : role === "bard" ? 0.7 : 0.3; }
function roleDotWeight(role) { return ["warlock", "alchemist", "mage", "assassin"].includes(role) ? 1 : 0.35; }
function roleControlWeight(role) { return ["mage", "bard", "alchemist", "warlock"].includes(role) ? 1 : 0.4; }
function roleCritWeight(role) { return ["ranger", "assassin", "warrior"].includes(role) ? 1 : 0.35; }
function roleLifeStealWeight(role) { return ["berserker", "assassin", "warrior"].includes(role) ? 1 : 0.25; }
function roleInitiativeWeight(role) { return ["assassin", "ranger", "mage", "bard"].includes(role) ? 1 : 0.55; }
function roleAttributeWeight(role, attr) {
  const [main, secondary] = BUILD_LAYERS.ROLE_ATTRS?.[role] || [];
  if (attr === main) return 1.25;
  if (attr === secondary) return 1;
  return 0.48;
}

function updateUiPowerValues(updates) {
  let text = fs.readFileSync(UI_FILE, "utf8");
  for (const [level, power] of Object.entries(updates)) {
    const pattern = new RegExp(`(\\{ level: ${level},[^\\n]*? power: )\\d+`, "m");
    if (!pattern.test(text)) throw new Error(`Cannot find power field for D${level}.`);
    text = text.replace(pattern, `$1${power}`);
  }
  fs.writeFileSync(UI_FILE, text, "utf8");
}

function renderMarkdown(rows) {
  const lines = [
    "# Equipment Grind V3 Recommended Power Calibration",
    "",
    "Goal: recommended power should be validated by teams with similar displayed power, not by enemy budget alone.",
    "",
    `Settings: target win rate ${Math.round(TARGET_WIN_RATE * 100)}%, power band +/-${Math.round(BAND * 100)}%, team pool ${TEAM_POOL_SIZE}, teams per bucket ${MAX_TEAMS_PER_BUCKET}, seeds per team ${SEEDS_PER_TEAM}.`,
    "",
    "| Dungeon | Old | New | Similar-team avg | Win rate | Games | Avg duration | Enemy power proxy |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const row of rows) {
    lines.push(`| D${row.level} | ${row.oldPower} | ${row.recommendedPower} | ${row.avgTeamPower} | ${Math.round(row.winRate * 100)}% | ${row.games} | ${row.avgDuration}s | ${row.enemyPower} |`);
  }
  lines.push("", "## Notes", "");
  lines.push("- The script builds a broad pool of random four-character teams with real equipment modifiers, then buckets them by displayed team power.");
  lines.push("- Each dungeon is tested against teams inside a +/- power band and all enemy sets.");
  lines.push("- The selected recommendation is the first tested bucket whose similar-power teams reach the target win rate.");
  return `${lines.join("\n")}\n`;
}

function printRows(rows) {
  console.log("| D | old | new | avg similar power | win | games | duration |");
  console.log("|---|---:|---:|---:|---:|---:|---:|");
  for (const row of rows) {
    console.log(`| D${row.level} | ${row.oldPower} | ${row.recommendedPower} | ${row.avgTeamPower} | ${Math.round(row.winRate * 100)}% | ${row.games} | ${row.avgDuration}s |`);
  }
}

function pickMany(items, count, rng) {
  const pool = [...items];
  const output = [];
  while (output.length < count && pool.length) output.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
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

function round(value, digits = 2) {
  return Number((Number(value) || 0).toFixed(digits));
}

function roundToStep(value, step) {
  return Math.max(step, Math.round((Number(value) || step) / step) * step);
}

if (require.main === module) main();

module.exports = { loadDungeons, buildTeamPool, calibrateDungeon };
