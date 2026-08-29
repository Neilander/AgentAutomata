(function initEquipmentRuntime(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("./build-layers") : root.GAME_BUILD_LAYERS,
    typeof module !== "undefined" ? require("./mechanic-curves") : root.GAME_MECHANIC_CURVES,
  );
  if (typeof module !== "undefined" && module.exports) module.exports = value;
  else root.GAME_EQUIPMENT_RUNTIME = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createEquipmentRuntime(BUILD_LAYERS, MECHANIC_CURVES) {
  const AFFIX_DEFS = {
    might: { label: "武力", category: "major" }, fortitude: { label: "坚韧", category: "major" },
    agility: { label: "敏捷", category: "major" }, arcana: { label: "奥术", category: "major" },
    rhythm: { label: "节律", category: "major" }, resilience: { label: "韧性", category: "major" }, warding: { label: "灵御", category: "major" },
    magicResist: { label: "魔抗", category: "basic" },
    attackSpeed: { label: "攻速", category: "basic" }, skillHaste: { label: "技能急速", category: "basic" },
    effectPower: { label: "效果强度", category: "specialist" }, effectResist: { label: "效果抗性", category: "basic" },
    receivedHealing: { label: "受治愈增幅", category: "specialist" }, healPower: { label: "治疗强度", category: "specialist" },
    shieldPower: { label: "护盾强度", category: "specialist" }, dotAmp: { label: "DOT增幅", category: "specialist" },
    controlPower: { label: "控制强度", category: "specialist" }, critChance: { label: "暴击率", category: "specialist" },
    critDamage: { label: "暴击伤害", category: "specialist" }, lifeSteal: { label: "吸血", category: "specialist" },
    shieldBreak: { label: "破盾", category: "specialist" }, armorBreak: { label: "破甲", category: "specialist" },
    initiative: { label: "先手", category: "specialist" }, fireAmp: { label: "火焰增幅", category: "archetype" },
    poisonAmp: { label: "剧毒增幅", category: "archetype" }, shadowAmp: { label: "暗影增幅", category: "archetype" },
    arcaneAmp: { label: "奥术增幅", category: "archetype" }, markPower: { label: "标记强度", category: "archetype" },
    stealthDuration: { label: "隐身持续", category: "archetype" }, executeDamage: { label: "处决伤害", category: "archetype" },
    lowHpDamage: { label: "低血伤害", category: "archetype" }, lowHpHealingReceived: { label: "低血受治愈", category: "archetype" },
    counterDamage: { label: "反击伤害", category: "archetype" }, cleanseEfficiency: { label: "净化效率", category: "archetype" },
    auraPower: { label: "光环强度", category: "archetype" },
  };

  const SLOT_DATA = {
    weapon: { label: "武器", baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "agility", "arcana", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "executeDamage", "lowHpDamage", "markPower"] },
    helm: { label: "头盔", baseStats: ["maxHp", "armor"], affixPool: ["arcana", "rhythm", "resilience", "warding", "magicResist", "skillHaste", "effectPower", "effectResist", "healPower", "controlPower", "critChance", "fireAmp", "poisonAmp", "arcaneAmp", "markPower", "stealthDuration", "cleanseEfficiency", "auraPower"] },
    chest: { label: "胸甲", baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "warding", "magicResist", "effectResist", "receivedHealing", "shieldPower", "lowHpHealingReceived", "counterDamage", "cleanseEfficiency"] },
    gloves: { label: "护手", baseStats: ["physicalPower", "armor"], affixPool: ["might", "agility", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "markPower", "executeDamage", "lowHpDamage", "counterDamage"] },
    legs: { label: "腿甲", baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "warding", "agility", "magicResist", "effectResist", "receivedHealing", "skillHaste", "lowHpHealingReceived", "cleanseEfficiency", "counterDamage"] },
    boots: { label: "靴子", baseStats: ["maxHp", "armor"], affixPool: ["agility", "rhythm", "resilience", "attackSpeed", "skillHaste", "effectResist", "initiative", "controlPower", "stealthDuration", "auraPower"] },
    ring: { label: "戒指", baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "warding", "magicResist", "skillHaste", "effectPower", "effectResist", "dotAmp", "controlPower", "healPower", "shieldPower", "fireAmp", "poisonAmp", "shadowAmp", "markPower", "executeDamage", "lowHpDamage", "lowHpHealingReceived", "auraPower"] },
    charm: { label: "护符", baseOptions: [["maxHp"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "warding", "magicResist", "effectPower", "receivedHealing", "dotAmp", "healPower", "shieldPower", "controlPower", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "stealthDuration", "cleanseEfficiency", "auraPower", "counterDamage"] },
  };

  const RARITIES = [
    { id: "common", label: "普通", affixes: 1, value: 1 },
    { id: "rare", label: "稀有", affixes: 2, value: 1.3 },
    { id: "epic", label: "史诗", affixes: 4, value: 1.9 },
    { id: "legendary", label: "传说", affixes: 7, value: 2.8 },
    { id: "mythic", label: "神话", affixes: 12, value: 4.2 },
  ];
  const RARITY_BY_ID = Object.fromEntries(RARITIES.map((rarity, rank) => [rarity.id, { ...rarity, rank }]));
  const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);

  function generateItems(rule, seedText, idPrefix = "loot") {
    const rng = seededRandom(seedText);
    return Array.from({ length: rule.count || 1 }, (_, index) => generateItem(rule, rng, `${idPrefix}_${index}`));
  }

  function generateItem(rule, rng, id) {
    const slotKey = pick(Object.keys(SLOT_DATA), rng);
    const slot = SLOT_DATA[slotKey];
    const rarity = rollRarity(rule.rates || { common: 1 }, rng());
    const equipmentLevel = rollLevel(rule.level || [1, 1], rng());
    const affixes = pickAffixStats(slot.affixPool, rarity.affixes, rng).map((stat) => rollAffix(stat, equipmentLevel, rng));
    const baseStats = rollBaseStats(slot, equipmentLevel, rng);
    return {
      id, slot: slotKey, slotLabel: slot.label, equipmentLevel,
      rarity: rarity.id, rarityLabel: rarity.label,
      name: `${rarity.label}${slot.label} Lv.${equipmentLevel}`,
      baseStats, affixes,
    };
  }

  function rollRarity(rates, value) {
    let cursor = 0;
    for (const rarity of RARITIES) {
      cursor += Number(rates[rarity.id]) || 0;
      if (value <= cursor) return rarity;
    }
    return RARITIES.find((rarity) => rates[rarity.id]) || RARITIES[0];
  }

  function rollLevel(range, value) {
    return Math.max(1, Math.round(range[0] + (range[1] - range[0]) * value));
  }

  function rollBaseStats(slot, level, rng) {
    const stats = slot.baseOptions ? pick(slot.baseOptions, rng) : slot.baseStats;
    return Object.fromEntries(stats.map((stat) => [stat, rollDirectStatValue(stat, level, rng)]));
  }

  function pickAffixStats(list, count, rng) {
    const pool = list.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
    const focus = pickMany(pool, Math.min(2, pool.length), rng);
    const focusSlots = focus.length ? Math.floor(count * 0.5) : 0;
    const result = [];
    for (let index = 0; index < count; index += 1) result.push(index < focusSlots ? focus[index % focus.length] : pick(pool, rng));
    return result;
  }

  function rollAffix(stat, level, rng) {
    return { id: stat, stat, label: AFFIX_DEFS[stat]?.label || stat, category: AFFIX_DEFS[stat]?.category || "mechanic", level: rollAffixLevel(level), value: rollAffixValue(stat, level, rng) };
  }

  function rollAffixLevel(level) {
    if (level >= 120) return 5;
    if (level >= 80) return 4;
    if (level >= 50) return 3;
    if (level >= 30) return 2;
    return 1;
  }

  function rollAffixValue(stat, level, rng) {
    const variance = 0.88 + rng() * 0.24;
    if (AFFIX_DEFS[stat]?.category === "major") return Math.max(1, Math.round((1.1 + level / 45) * variance));
    if (MECHANIC_CURVES?.hasMechanicCurve?.(stat)) return Math.max(1, Math.round((2.5 + level / 7.5) * variance));
    return Math.max(1, Math.round((2 + level / 9) * variance));
  }

  function rollDirectStatValue(stat, level, rng) {
    const variance = 0.92 + rng() * 0.16;
    const rows = { physicalPower: 0.5, magicPower: 0.5, maxHp: 2.8, armor: 0.08, magicResist: 0.08 };
    return Math.max(1, Math.round(level * (rows[stat] || 0.12) * variance));
  }

  function applyEquipment(spec, equipment) {
    const items = Object.values(equipment || {});
    return BUILD_LAYERS?.applyBuildLayers ? BUILD_LAYERS.applyBuildLayers(spec, { equipmentItems: items }) : spec;
  }

  function autoEquip(roster, teamSlots, inventory) {
    const units = roster.map((unit) => ({ ...unit, equipment: { ...(unit.equipment || {}) } }));
    const byId = Object.fromEntries(units.map((unit) => [unit.id, unit]));
    const active = teamSlots.map((id) => byId[id]).filter(Boolean);
    const available = [...inventory];
    for (const unit of units) {
      available.push(...Object.values(unit.equipment || {}));
      unit.equipment = {};
    }
    const used = new Set();
    const changes = [];
    for (const unit of active) {
      for (const slot of Object.keys(SLOT_DATA)) {
        const best = available.filter((item) => item.slot === slot && !used.has(item.id)).sort((a, b) => itemScoreForRole(b, unit.role) - itemScoreForRole(a, unit.role))[0];
        if (!best) continue;
        unit.equipment[slot] = best;
        used.add(best.id);
        changes.push({ heroId: unit.id, itemId: best.id, slot });
      }
    }
    return { roster: units, inventory: available.filter((item) => !used.has(item.id)), changes };
  }

  function itemScoreForRole(item, role) {
    const base = Object.entries(item.baseStats || {}).reduce((sum, [stat, value]) => sum + statWeight(stat, role) * value, 0);
    const affixes = (item.affixes || []).reduce((sum, affix) => sum + statWeight(affix.stat || affix.id, role) * affix.value, 0);
    return base + affixes + (RARITY_BY_ID[item.rarity]?.value || 1) * 6;
  }

  function statWeight(stat, role) {
    const physical = ["warrior", "knight", "berserker", "assassin", "ranger", "cavalry"].includes(role) ? 1 : 0.25;
    const magic = ["mage", "priest", "warlock", "bard", "alchemist"].includes(role) ? 1 : 0.25;
    const front = ["warrior", "knight", "berserker", "cavalry"].includes(role) ? 1 : 0.45;
    const map = {
      physicalPower: 8 * physical, magicPower: 8 * magic, maxHp: 0.55 * front, armor: 12 * front, magicResist: 12 * front,
      might: 7 * physical, agility: 7 * physical, arcana: 7 * magic, rhythm: 6 * magic,
      fortitude: 7 * front, resilience: 6 * front, warding: 6 * front, attackSpeed: 5 * physical, skillHaste: 5 * magic,
      healPower: role === "priest" ? 8 : 1, shieldPower: ["knight", "priest"].includes(role) ? 7 : 1,
      fireAmp: role === "mage" ? 7 : 1, markPower: role === "ranger" ? 7 : 1,
    };
    return map[stat] || 2;
  }

  function teamEquipmentScore(roster, teamSlots) {
    const byId = Object.fromEntries(roster.map((unit) => [unit.id, unit]));
    return Math.round(teamSlots.reduce((sum, id) => {
      const unit = byId[id];
      return sum + Object.values(unit?.equipment || {}).reduce((itemSum, item) => itemSum + itemScoreForRole(item, unit.role), 0);
    }, 0));
  }

  function equipmentSummary(roster, teamSlots) {
    const byId = Object.fromEntries(roster.map((unit) => [unit.id, unit]));
    const items = teamSlots.flatMap((id) => Object.values(byId[id]?.equipment || {}));
    const best = items.sort((a, b) => (RARITY_BY_ID[b.rarity]?.rank || 0) - (RARITY_BY_ID[a.rarity]?.rank || 0))[0];
    return `${items.length}/${teamSlots.length * Object.keys(SLOT_DATA).length}件 · 最高${best?.rarityLabel || "无"}`;
  }

  function publicItem(item) {
    return { id: item.id, name: item.name, slot: item.slot, slotLabel: item.slotLabel, rarity: item.rarity, rarityLabel: item.rarityLabel, level: item.equipmentLevel, baseStats: item.baseStats, affixes: item.affixes };
  }

  function pick(list, rng) { return list[Math.floor(rng() * list.length) % list.length]; }
  function pickMany(list, count, rng) {
    const pool = [...list];
    const result = [];
    while (pool.length && result.length < count) result.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return result;
  }
  function seededRandom(seedText) {
    let seed = 2166136261;
    for (let index = 0; index < String(seedText).length; index += 1) { seed ^= String(seedText).charCodeAt(index); seed = Math.imul(seed, 16777619); }
    return () => { seed += 0x6D2B79F5; let value = seed; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; };
  }

  return { AFFIX_DEFS, RARITIES, RARITY_BY_ID, SLOT_DATA, applyEquipment, autoEquip, equipmentSummary, generateItem, generateItems, itemScoreForRole, publicItem, seededRandom, teamEquipmentScore };
});
