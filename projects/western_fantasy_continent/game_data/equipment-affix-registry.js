const SLOTS = ["head", "chest", "gloves", "legs", "boots", "trinket", "rightHand", "leftHand", "twoHand"];

const SLOT_LABELS = {
  head: "头",
  chest: "胸",
  gloves: "护手",
  legs: "腿",
  boots: "鞋",
  trinket: "挂饰",
  rightHand: "右手",
  leftHand: "左手",
  twoHand: "双手",
};

const RARITIES = [
  { id: "rough", label: "粗糙", affixCount: 0, maxLevel: 1, baseMult: 0.85, weight: 36 },
  { id: "common", label: "普通", affixCount: 1, maxLevel: 2, baseMult: 1, weight: 30 },
  { id: "fine", label: "优质", affixCount: 2, maxLevel: 3, baseMult: 1.15, weight: 20 },
  { id: "rare", label: "稀有", affixCount: 3, maxLevel: 4, baseMult: 1.35, weight: 10 },
  { id: "epic", label: "史诗", affixCount: 4, maxLevel: 5, baseMult: 1.65, weight: 4 },
];

const AFFIX_LEVEL_VALUES = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 12 };

const SCORE_BUCKETS = {
  output: "输出",
  survival: "生存",
  tempo: "节奏",
  mechanic: "机制",
};

const AFFIXES = [
  major("might", "武力", ["rightHand", "gloves", "twoHand", "trinket"], { output: 1.2, survival: 0.25 }),
  major("fortitude", "坚韧", ["chest", "legs", "leftHand", "trinket"], { survival: 1.25 }),
  major("agility", "敏捷", ["gloves", "boots", "rightHand", "twoHand", "trinket"], { tempo: 1.05, output: 0.35 }),
  major("arcana", "奥术", ["head", "rightHand", "leftHand", "twoHand", "trinket"], { output: 0.9, mechanic: 0.35 }),
  major("rhythm", "节律", ["head", "boots", "leftHand", "twoHand", "trinket"], { tempo: 1.15, mechanic: 0.25 }),
  major("resilience", "韧性", ["head", "chest", "legs", "leftHand", "boots", "trinket"], { survival: 0.9, mechanic: 0.35 }),

  basic("attack", "攻击", ["rightHand", "twoHand", "gloves"], { output: 1 }),
  basic("magicPower", "法强", ["rightHand", "twoHand", "head", "leftHand"], { output: 0.85, mechanic: 0.2 }),
  basic("hp", "生命", ["chest", "legs", "leftHand", "head"], { survival: 1 }),
  basic("defense", "防御", ["chest", "legs", "leftHand"], { survival: 1 }),
  basic("attackSpeed", "攻速", ["gloves", "boots", "rightHand"], { tempo: 0.75, output: 0.45 }, ["multiplicative"]),
  basic("skillHaste", "技能急速", ["head", "boots", "leftHand", "trinket"], { tempo: 1 }, ["multiplicative"]),
  basic("effectResist", "效果抗性", ["head", "chest", "legs", "boots", "leftHand"], { survival: 0.55, mechanic: 0.45 }),

  secondary("effectPower", "效果强度", ["head", "leftHand", "trinket", "twoHand"], { mechanic: 1, output: 0.25 }, ["multiplicative"]),
  secondary("healPower", "治疗强度", ["head", "leftHand", "trinket"], { mechanic: 0.75, survival: 0.45 }),
  secondary("shieldPower", "护盾强度", ["chest", "leftHand", "trinket"], { survival: 0.7, mechanic: 0.45 }),
  secondary("healingReceived", "受治愈增幅", ["chest", "legs", "leftHand"], { survival: 0.8, mechanic: 0.25 }),
  secondary("critChance", "暴击率", ["head", "gloves", "rightHand"], { output: 0.75 }, ["multiplicative"]),
  secondary("critDamage", "暴击伤害", ["gloves", "rightHand", "twoHand"], { output: 0.95 }, ["multiplicative"]),
  secondary("lifeSteal", "吸血", ["gloves", "rightHand", "twoHand"], { survival: 0.45, mechanic: 0.75 }, ["multiplicative", "sustainRisk"]),
  secondary("dotAmp", "DOT 增幅", ["head", "rightHand", "twoHand", "trinket"], { output: 0.45, mechanic: 0.9 }, ["multiplicative", "dotRisk"]),
  secondary("controlPower", "控制强度", ["head", "boots", "leftHand", "trinket"], { mechanic: 0.85, tempo: 0.25 }, ["controlRisk"]),
  secondary("shieldBreak", "破盾", ["gloves", "rightHand", "twoHand"], { output: 0.45, mechanic: 0.45 }),
  secondary("armorBreak", "破甲", ["gloves", "rightHand", "twoHand"], { output: 0.55, mechanic: 0.35 }),
  secondary("initiative", "先手", ["boots", "head", "trinket"], { tempo: 0.9, mechanic: 0.3 }),
  secondary("martialTempo", "战斗节奏", ["gloves", "boots", "rightHand", "head"], { output: 0.45, tempo: 0.65 }, ["bridge"]),
  secondary("ritualFocus", "术式专注", ["head", "leftHand", "rightHand", "twoHand", "trinket"], { tempo: 0.45, mechanic: 0.65 }, ["bridge"]),
  secondary("sustainFlow", "续航流转", ["chest", "legs", "leftHand", "trinket"], { survival: 0.6, mechanic: 0.45 }, ["bridge"]),
  secondary("focusFire", "集火强度", ["head", "gloves", "rightHand", "trinket"], { output: 0.5, mechanic: 0.55 }, ["bridge"]),

  archetype("fireAmp", "火焰增幅", ["head", "rightHand", "twoHand", "trinket"], { output: 0.45, mechanic: 0.8 }, ["dotRisk"]),
  archetype("poisonAmp", "剧毒增幅", ["head", "rightHand", "twoHand", "trinket"], { output: 0.35, mechanic: 0.9 }, ["dotRisk"]),
  archetype("markPower", "标记强度", ["head", "gloves", "rightHand", "trinket"], { output: 0.45, mechanic: 0.75 }),
  archetype("stealthDuration", "隐身持续", ["boots", "head", "trinket"], { survival: 0.25, tempo: 0.25, mechanic: 0.85 }),
  archetype("executeDamage", "处决伤害", ["rightHand", "twoHand", "gloves", "trinket"], { output: 0.8, mechanic: 0.55 }, ["executeRisk"]),
  archetype("lowHpDamage", "低血伤害", ["gloves", "rightHand", "twoHand", "trinket"], { output: 0.65, mechanic: 0.65 }, ["sustainRisk"]),
  archetype("lowHpHealingReceived", "低血受治愈增幅", ["chest", "legs", "leftHand", "trinket"], { survival: 0.65, mechanic: 0.55 }),
  archetype("counterDamage", "反击伤害", ["leftHand", "chest", "gloves", "trinket"], { output: 0.35, survival: 0.25, mechanic: 0.75 }),
  archetype("cleanseEfficiency", "净化效率", ["head", "leftHand", "trinket"], { survival: 0.25, mechanic: 0.85 }),
  archetype("auraPower", "光环强度", ["head", "leftHand", "trinket", "boots"], { tempo: 0.3, mechanic: 0.85 }),
];

const SLOT_BASES = {
  head: [
    baseType("sage_hood", "术式头冠", { magicPower: 5, skillHaste: 0.8 }),
    baseType("tactician_helm", "战术头盔", { defense: 3, effectResist: 0.8 }),
  ],
  chest: [
    baseType("plate_chest", "板甲胸甲", { hp: 36, defense: 8 }),
    baseType("ritual_mail", "仪式锁甲", { hp: 28, effectResist: 1.2 }),
  ],
  gloves: [
    baseType("duelist_gloves", "决斗护手", { attack: 5, critChance: 0.6 }),
    baseType("frenzy_wraps", "狂怒缠手", { attackSpeed: 1.1, attack: 3 }),
  ],
  legs: [
    baseType("guard_greaves", "守卫腿甲", { hp: 28, defense: 5 }),
    baseType("steady_leggings", "稳步护腿", { hp: 22, effectResist: 1 }),
  ],
  boots: [
    baseType("swift_boots", "迅捷长靴", { attackSpeed: 0.8, initiative: 0.8 }),
    baseType("ritual_boots", "节律短靴", { skillHaste: 0.9, effectResist: 0.5 }),
  ],
  trinket: [
    baseType("focus_charm", "专注挂饰", { skillHaste: 0.7, effectPower: 0.5 }),
    baseType("ward_token", "护佑挂饰", { effectResist: 0.7, shieldPower: 0.5 }),
  ],
  rightHand: [
    baseType("steel_blade", "钢刃", { attack: 11 }),
    baseType("ember_focus", "余烬法器", { magicPower: 10 }),
  ],
  leftHand: [
    baseType("round_shield", "圆盾", { defense: 7, shieldPower: 0.7 }),
    baseType("prayer_book", "祈祷书", { magicPower: 5, healPower: 0.8 }),
  ],
  twoHand: [
    baseType("greatsword", "巨剑", { attack: 18 }),
    baseType("battle_staff", "战斗法杖", { magicPower: 17, skillHaste: 0.8 }),
  ],
};

const ARCHETYPES = {
  lowHealthBerserker: {
    label: "低血狂战",
    role: "berserker",
    desired: {
      agility: 1.1,
      might: 0.8,
      attackSpeed: 1.2,
      lifeSteal: 1.25,
      lowHpDamage: 1.25,
      lowHpHealingReceived: 1.05,
      martialTempo: 0.85,
      sustainFlow: 0.7,
      hp: 0.35,
      defense: 0.25,
    },
    required: ["attackSpeed", "lifeSteal", "lowHpDamage", "lowHpHealingReceived"],
    requiredGroups: [
      group("攻击频率", ["attackSpeed", "martialTempo", "agility"]),
      group("续航来源", ["lifeSteal", "sustainFlow", "lowHpHealingReceived"]),
      group("低血兑现", ["lowHpDamage", "martialTempo", "might"]),
      group("低血承载", ["lowHpHealingReceived", "sustainFlow", "fortitude"]),
    ],
    riskCombos: [["attackSpeed", "lifeSteal", "lowHpDamage"]],
  },
  fireMage: {
    label: "火法燃烧",
    role: "mage",
    desired: {
      arcana: 1,
      rhythm: 0.9,
      magicPower: 1,
      skillHaste: 0.9,
      effectPower: 0.8,
      dotAmp: 1,
      fireAmp: 1.25,
      ritualFocus: 0.9,
    },
    required: ["magicPower", "skillHaste", "fireAmp", "dotAmp"],
    requiredGroups: [
      group("法术基础", ["magicPower", "arcana", "ritualFocus"]),
      group("技能循环", ["skillHaste", "rhythm", "ritualFocus"]),
      group("火焰兑现", ["fireAmp"]),
      group("持续伤害", ["dotAmp", "effectPower", "ritualFocus"]),
    ],
    riskCombos: [["dotAmp", "effectPower", "fireAmp"]],
  },
  poisonBloom: {
    label: "剧毒绽放",
    role: "warlock",
    desired: {
      arcana: 0.8,
      rhythm: 1,
      effectPower: 1.1,
      dotAmp: 1.15,
      poisonAmp: 1.25,
      skillHaste: 0.75,
      effectResist: 0.25,
      ritualFocus: 0.95,
    },
    required: ["effectPower", "dotAmp", "poisonAmp", "skillHaste"],
    requiredGroups: [
      group("效果基础", ["effectPower", "ritualFocus", "rhythm"]),
      group("DOT 兑现", ["dotAmp", "poisonAmp"]),
      group("剧毒方向", ["poisonAmp"]),
      group("循环", ["skillHaste", "rhythm", "ritualFocus"]),
    ],
    riskCombos: [["dotAmp", "effectPower", "poisonAmp"]],
  },
  shadowAssassin: {
    label: "暗影刺客",
    role: "assassin",
    desired: {
      agility: 1.1,
      might: 0.7,
      attack: 0.75,
      attackSpeed: 0.75,
      initiative: 1.1,
      stealthDuration: 1.25,
      executeDamage: 1.1,
      markPower: 0.8,
      martialTempo: 0.8,
      focusFire: 0.75,
    },
    required: ["initiative", "stealthDuration", "executeDamage"],
    requiredGroups: [
      group("开场切入", ["initiative", "martialTempo", "agility"]),
      group("隐藏窗口", ["stealthDuration"]),
      group("收割兑现", ["executeDamage", "focusFire", "markPower"]),
    ],
    riskCombos: [["initiative", "stealthDuration", "executeDamage"]],
  },
  ironKnight: {
    label: "铁壁骑士",
    role: "knight",
    desired: {
      fortitude: 1,
      resilience: 1,
      hp: 0.8,
      defense: 1.1,
      shieldPower: 1.05,
      counterDamage: 0.9,
      effectResist: 0.65,
      sustainFlow: 0.8,
    },
    required: ["defense", "shieldPower", "counterDamage"],
    requiredGroups: [
      group("承伤基础", ["defense", "fortitude", "resilience"]),
      group("护盾承载", ["shieldPower", "sustainFlow"]),
      group("反击兑现", ["counterDamage", "sustainFlow"]),
    ],
    riskCombos: [["shieldPower", "healingReceived", "effectResist"]],
  },
  holySustain: {
    label: "圣光续航",
    role: "priest",
    desired: {
      arcana: 0.9,
      resilience: 0.8,
      magicPower: 0.65,
      healPower: 1.2,
      shieldPower: 0.85,
      cleanseEfficiency: 1,
      skillHaste: 0.75,
      effectResist: 0.35,
      ritualFocus: 0.75,
      sustainFlow: 0.75,
    },
    required: ["healPower", "shieldPower", "cleanseEfficiency", "skillHaste"],
    requiredGroups: [
      group("治疗量", ["healPower", "magicPower", "arcana", "ritualFocus"]),
      group("护盾量", ["shieldPower", "sustainFlow"]),
      group("净化反制", ["cleanseEfficiency", "ritualFocus"]),
      group("循环", ["skillHaste", "rhythm", "ritualFocus"]),
    ],
    riskCombos: [["healPower", "shieldPower", "cleanseEfficiency"]],
  },
};

function major(id, label, slots, budget, flags = []) {
  return affix(id, label, "major", slots, budget, 2, flags);
}

function basic(id, label, slots, budget, flags = []) {
  return affix(id, label, "basic", slots, budget, 1, flags);
}

function secondary(id, label, slots, budget, flags = []) {
  return affix(id, label, "secondary", slots, budget, 2, flags);
}

function archetype(id, label, slots, budget, flags = []) {
  return affix(id, label, "archetype", slots, budget, 3, flags);
}

function affix(id, label, tier, slots, budget, rarityFloor, flags = []) {
  return { id, label, tier, slots, budget, rarityFloor, flags };
}

function baseType(id, label, stats) {
  return { id, label, stats };
}

function group(label, ids) {
  return { label, ids };
}

module.exports = {
  AFFIXES,
  AFFIX_LEVEL_VALUES,
  ARCHETYPES,
  RARITIES,
  SCORE_BUCKETS,
  SLOTS,
  SLOT_BASES,
  SLOT_LABELS,
};
