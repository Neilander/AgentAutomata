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
const RARITIES = [
  { id: "common", label: "普通", affixes: 1, value: 1 },
  { id: "rare", label: "稀有", affixes: 2, value: 1.3 },
  { id: "epic", label: "史诗", affixes: 4, value: 1.9 },
  { id: "legendary", label: "传说", affixes: 7, value: 2.8 },
  { id: "mythic", label: "神话", affixes: 12, value: 4.2 },
];
const RARITY_BY_ID = Object.fromEntries(RARITIES.map((rarity) => [rarity.id, rarity]));
const RARITY_FEEDBACK = {
  common: 1,
  rare: 3,
  epic: 7,
  legendary: 15,
  mythic: 30,
};

function loadDungeons() {
  const text = fs.readFileSync(UI_FILE, "utf8");
  const match = text.match(/const DUNGEONS = (\[[\s\S]*?\n  \]);/);
  if (!match) throw new Error("Cannot find DUNGEONS in equipment_grind_v2 UI file.");
  return Function(`"use strict"; return ${match[1]};`)();
}

function simulateGrind(options = {}) {
  const dungeons = options.dungeons || loadDungeons();
  const seed = options.seed || "feedback-loop-v2";
  const rng = seededRandom(seed);
  const maxRuns = Number(options.maxRuns || 36);
  const useThirst = options.useThirst !== false;
  const heroes = makeRoster(rng);
  const state = {
    seed,
    heroes,
    bestClear: 0,
    targetLevel: 1,
    inventory: [],
    runRows: [],
    feedback: 0,
    thirstChances: 0,
    thirstStacks: 0,
    thirstThresholdsPaid: 0,
    boredom: 0,
    quietRuns: 0,
    bestTimeTierByDungeon: {},
    unlockedRarity: new Set(),
  };

  for (let run = 1; run <= maxRuns && state.bestClear < dungeons.length; run += 1) {
    autoEquip(state);
    const targetDungeon = dungeons[state.targetLevel - 1] || dungeons[dungeons.length - 1];
    const farmDungeon = state.bestClear > 0 ? dungeons[state.bestClear - 1] : targetDungeon;
    const isChallenge = state.bestClear + 1 === targetDungeon.level;
    const dungeon = isChallenge ? targetDungeon : farmDungeon;
    const beforePower = teamPower(activeHeroes(state));
    const enemyRoles = dungeon.enemySets[Math.floor(rng() * dungeon.enemySets.length)];
    const result = simulateTeams(
      activeHeroes(state).map((hero, index) => buildHeroSpec(hero, index)),
      enemyRoles.map((role, index) => buildEnemySpec(role, dungeon, index)),
      { seed: `${seed}|run${run}|d${dungeon.level}`, randomizeStats: false, maxTime: 70 },
    );
    const won = result.winner === "left";
    let positive = 0;
    const events = [];
    if (won) {
      const loot = Array.from({ length: dungeon.dropCount || 6 }, () => generateDungeonItem(dungeon, rng));
      const unlock = recordUnlocks(state, loot);
      if (unlock.gain > 0) {
        positive += unlock.gain;
        events.push(...unlock.events);
      }
      state.inventory.push(...loot);
      autoEquip(state);
      if (isChallenge && dungeon.level > state.bestClear) {
        state.bestClear = dungeon.level;
        state.targetLevel = Math.min(dungeons.length, state.bestClear + 1);
        positive += 10;
        events.push("首通+10");
      }
    } else if (state.bestClear > 0) {
      state.targetLevel = state.bestClear;
      events.push("挑战失败，回刷上一层");
    }

    const timeGain = recordTimeTierGain(state, dungeon, result.duration, won);
    if (timeGain > 0) {
      positive += timeGain;
      events.push(`时间档位+${timeGain}`);
    }
    const afterPower = teamPower(activeHeroes(state));
    const powerGain = Math.max(0, afterPower - beforePower);
    const powerFeedback = powerGain > 0 ? 0.2 : 0;
    if (powerFeedback > 0) {
      positive += powerFeedback;
      events.push("战力+0.2");
    }

    let multiplier = 1;
    if (positive > 0) {
      multiplier = 1 + state.thirstStacks * 2;
      if (useThirst && state.thirstStacks > 0) {
        events.push(`饥渴${state.thirstStacks}层，正反馈x${multiplier}`);
      }
      positive = round(positive * (useThirst ? multiplier : 1), 2);
      state.thirstStacks = 0;
      state.quietRuns = 0;
    } else {
      state.quietRuns += 1;
      if (useThirst && state.thirstChances > 0) {
        state.thirstChances -= 1;
        state.thirstStacks += 1;
        events.push(`无反馈，消耗饥渴机会，饥渴${state.thirstStacks}层`);
      } else if (state.quietRuns >= 2) {
        const boredomGain = (state.quietRuns - 1) * 5;
        state.boredom += boredomGain;
        events.push(`连续${state.quietRuns}轮无反馈，乏味+${boredomGain}`);
      }
    }
    state.feedback = round(state.feedback + positive, 2);
    const thresholdCount = Math.floor(state.feedback / 10);
    if (useThirst && thresholdCount > state.thirstThresholdsPaid) {
      const gained = thresholdCount - state.thirstThresholdsPaid;
      state.thirstChances += gained;
      state.thirstThresholdsPaid = thresholdCount;
      events.push(`累计正反馈跨档，饥渴机会+${gained}`);
    }
    state.runRows.push({
      run,
      dungeon: `D${dungeon.level} ${dungeon.name}`,
      mode: isChallenge ? "挑战" : "回刷",
      won,
      duration: round(result.duration, 1),
      timeTier: timeTierLabel(result.duration),
      teamPowerBefore: round(beforePower),
      teamPowerAfter: round(afterPower),
      bestClear: state.bestClear,
      positive: round(positive, 2),
      feedback: state.feedback,
      thirstChances: state.thirstChances,
      thirstStacks: state.thirstStacks,
      multiplier: round(multiplier, 2),
      boredom: state.boredom,
      events: events.join(" / ") || "-",
    });
    if (!won && state.bestClear > 0) {
      state.targetLevel = state.bestClear;
    } else if (won) {
      state.targetLevel = Math.min(dungeons.length, state.bestClear + 1);
    }
  }

  return {
    seed,
    useThirst,
    finalBestClear: state.bestClear,
    finalFeedback: state.feedback,
    finalBoredom: state.boredom,
    finalThirstChances: state.thirstChances,
    finalThirstStacks: state.thirstStacks,
    finalPower: round(teamPower(activeHeroes(state))),
    heroes: state.heroes.map((hero) => ({
      name: hero.name,
      role: hero.role,
      active: hero.active,
      power: round(heroPower(hero)),
      equipped: Object.values(hero.equipment || {}).length,
    })),
    runs: state.runRows,
    summary: summarizeRuns(state.runRows),
  };
}

function makeRoster(rng) {
  const drafts = pickMany(HERO_DRAFTS, 6, rng);
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
      active: index < 4,
      equipment: {},
    };
    return hero;
  });
}

function activeHeroes(state) {
  return state.heroes.filter((hero) => hero.active).slice(0, 4);
}

function chooseActiveHeroes(state) {
  const sorted = [...state.heroes].sort((a, b) => heroPower(b) - heroPower(a));
  const activeIds = new Set(sorted.slice(0, 4).map((hero) => hero.name));
  state.heroes.forEach((hero) => { hero.active = activeIds.has(hero.name); });
}

function teamPower(heroes) {
  return heroes.reduce((sum, hero) => sum + heroPower(hero), 0);
}

function autoEquip(state) {
  for (const hero of state.heroes) {
    let changed = true;
    while (changed) {
      changed = false;
      let best = null;
      for (const item of state.inventory) {
        const current = hero.equipment[item.slot];
        const gain = itemScoreForHero(item, hero) - itemScoreForHero(current, hero);
        if (gain > (best?.gain || 0)) best = { item, gain };
      }
      if (best && best.gain > 0) {
        const old = hero.equipment[best.item.slot];
        if (old) state.inventory.push(old);
        hero.equipment[best.item.slot] = best.item;
        state.inventory = state.inventory.filter((item) => item.id !== best.item.id);
        changed = true;
      }
    }
  }
  chooseActiveHeroes(state);
  state.inventory = state.inventory
    .sort((a, b) => itemScoreForHero(b, activeHeroes(state)[0]) - itemScoreForHero(a, activeHeroes(state)[0]))
    .slice(0, 120);
}

function generateDungeonItem(dungeon, rng) {
  const slotKey = pick(Object.keys(SLOT_DATA), rng);
  const slot = SLOT_DATA[slotKey];
  const rarity = chooseRarity(dungeon.rarity, rng);
  const equipmentLevel = rollEquipmentLevel(dungeon.itemLevelRange, rng);
  const baseStats = Object.fromEntries((slot.baseOptions ? pick(slot.baseOptions, rng) : (slot.baseStats || []))
    .map((stat) => [stat, rollDirectStatValue(stat, equipmentLevel, rng)]));
  const affixes = pickMany(slot.affixPool, rarity.affixes, rng).map((stat) => ({
    stat,
    value: rollAffixValue(stat, equipmentLevel, rng),
    level: rollAffixLevel(equipmentLevel),
  }));
  return {
    id: `loot_d${dungeon.level}_${slotKey}_${rarity.id}_${Math.floor(rng() * 999999999)}`,
    slot: slotKey,
    rarity: rarity.id,
    rarityLabel: rarity.label,
    equipmentLevel,
    sourceDungeon: dungeon.level,
    baseStats,
    affixes,
  };
}

function chooseRarity(rarityTable = { common: 1 }, rng) {
  const roll = rng();
  let acc = 0;
  for (const rarity of RARITIES) {
    acc += rarityTable[rarity.id] || 0;
    if (roll <= acc) return rarity;
  }
  const fallback = Object.keys(rarityTable).find((id) => rarityTable[id] > 0) || "common";
  return RARITY_BY_ID[fallback] || RARITY_BY_ID.common;
}

function rollEquipmentLevel(range, rng) {
  const [minLevel, maxLevel] = Array.isArray(range) ? range : [20, 20];
  const min = Math.max(1, Math.round(minLevel));
  const max = Math.max(min, Math.round(maxLevel));
  return min + Math.floor(rng() * (max - min + 1));
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

function recordUnlocks(state, loot) {
  let gain = 0;
  const events = [];
  for (const item of loot) {
    if (state.unlockedRarity.has(item.rarity)) continue;
    state.unlockedRarity.add(item.rarity);
    const feedback = RARITY_FEEDBACK[item.rarity] || 0;
    gain += feedback;
    events.push(`解锁${RARITY_BY_ID[item.rarity]?.label || item.rarity}+${feedback}`);
  }
  return { gain, events };
}

function recordTimeTierGain(state, dungeon, duration, won) {
  if (!won) return 0;
  const nextTier = timeTier(duration);
  const key = String(dungeon.level);
  const previous = state.bestTimeTierByDungeon[key];
  state.bestTimeTierByDungeon[key] = Math.min(previous ?? nextTier, nextTier);
  if (previous === undefined) return 0;
  return Math.max(0, previous - nextTier);
}

function timeTier(duration) {
  if (duration <= 15) return 0;
  if (duration <= 30) return 1;
  if (duration <= 45) return 2;
  if (duration <= 60) return 3;
  return 4;
}

function timeTierLabel(duration) {
  return ["0-15s", "15-30s", "30-45s", "45-60s", "60s+"][timeTier(duration)];
}

function itemScoreForHero(item, hero) {
  if (!item || !hero) return 0;
  const rarityValue = { common: 1, rare: 1.35, epic: 1.7, legendary: 2.15, mythic: 2.65 }[item.rarity] || 1;
  const baseScore = Object.entries(item.baseStats || {}).reduce((sum, [stat, value]) => sum + normalizedStatScoreForHero(stat, value, hero), 0);
  const affixScore = (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScoreForHero(affix.stat, affix.value, hero), 0);
  return Math.round((item.equipmentLevel || 0) * 1.1 + rarityValue * 18 + baseScore + affixScore);
}

function normalizedStatScoreForHero(stat, value, hero) {
  const numeric = Number(value) || 0;
  const role = hero?.role || "";
  if (BUILD_LAYERS.ATTR_ORDER?.includes(stat)) return numeric * 55 * roleAttributeWeight(role, stat);
  const curvePoints = BUILD_LAYERS.MECHANIC_CURVES?.hasMechanicCurve?.(stat) ? numeric : numeric;
  if (stat === "physicalPower") return numeric * 12 * rolePhysicalWeight(role);
  if (stat === "magicPower") return numeric * 12 * roleMagicWeight(role);
  if (stat === "maxHp") return numeric * 0.58;
  if (stat === "armor") return numeric * 18;
  if (stat === "attackSpeed") return curvePoints * 7 * rolePhysicalWeight(role);
  if (stat === "skillHaste") return curvePoints * 6 * roleSkillWeight(role);
  if (stat === "effectPower") return curvePoints * 5 * roleEffectWeight(role);
  if (stat === "effectResist") return curvePoints * 4;
  if (stat === "receivedHealing") return curvePoints * 4.2;
  return numeric * 3;
}

function roleAttributeWeight(role, stat) {
  const preferred = BUILD_LAYERS.ROLE_ATTRS?.[role] || [];
  if (preferred[0] === stat) return 1.18;
  if (preferred[1] === stat) return 1;
  if (["fortitude", "resilience", "agility"].includes(stat)) return 0.8;
  return 0.55;
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

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
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

function summarizeRuns(rows) {
  return {
    runs: rows.length,
    clears: Math.max(0, ...rows.map((row) => row.bestClear)),
    wins: rows.filter((row) => row.won).length,
    losses: rows.filter((row) => !row.won).length,
    totalPositive: round(rows.reduce((sum, row) => sum + row.positive, 0), 2),
    finalFeedback: rows.at(-1)?.feedback || 0,
    finalBoredom: rows.at(-1)?.boredom || 0,
    boredomEvents: rows.filter((row) => row.events.includes("乏味")).length,
  };
}

function printSimulation(result) {
  console.log(`# 刷装备V2 反馈模拟`);
  console.log(`seed: ${result.seed}`);
  console.log(`useThirst: ${result.useThirst}`);
  console.log(`finalBestClear: D${result.finalBestClear}`);
  console.log(`finalPower: ${result.finalPower}`);
  console.log(`finalFeedback: ${result.finalFeedback}`);
  console.log(`finalBoredom: ${result.finalBoredom}`);
  console.log(`finalThirst: chances ${result.finalThirstChances}, stacks ${result.finalThirstStacks}`);
  console.log("");
  console.log("## 角色");
  console.log("| 角色 | 职业 | 上阵 | 战力 | 装备数 |");
  console.log("|---|---|---:|---:|---:|");
  for (const hero of result.heroes) {
    console.log(`| ${hero.name} | ${ROLE_LABELS[hero.role] || hero.role} | ${hero.active ? "是" : "否"} | ${hero.power} | ${hero.equipped} |`);
  }
  console.log("");
  console.log("## 曲线");
  console.log("| 轮次 | 模式 | 关卡 | 胜负 | 时间 | 时间档 | 战力前 | 战力后 | 最高 | 正反馈 | 倍率 | 累计正反馈 | 饥渴机会 | 饥渴层 | 乏味 | 事件 |");
  console.log("|---:|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|");
  for (const row of result.runs) {
    console.log(`| ${row.run} | ${row.mode} | ${row.dungeon} | ${row.won ? "胜" : "败"} | ${row.duration} | ${row.timeTier} | ${row.teamPowerBefore} | ${row.teamPowerAfter} | D${row.bestClear} | ${row.positive} | ${row.multiplier} | ${row.feedback} | ${row.thirstChances} | ${row.thirstStacks} | ${row.boredom} | ${row.events} |`);
  }
}

if (require.main === module) {
  const result = simulateGrind({
    seed: process.env.SEED || "feedback-loop-v2",
    maxRuns: Number(process.env.RUNS || 36),
    useThirst: process.env.THIRST !== "0",
  });
  printSimulation(result);
}

module.exports = { simulateGrind, loadDungeons };
