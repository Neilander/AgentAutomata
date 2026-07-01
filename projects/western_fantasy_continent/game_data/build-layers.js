const SKILL_DATA = require("./skill-data");

const ATTR_ORDER = ["might", "fortitude", "agility", "arcana", "rhythm", "resilience"];

const ATTRS = {
  might: "武力",
  fortitude: "坚韧",
  agility: "敏捷",
  arcana: "奥术",
  rhythm: "节律",
  resilience: "韧性",
};

const ROLE_ATTRS = {
  warrior: ["might", "fortitude"],
  berserker: ["agility", "might"],
  knight: ["fortitude", "resilience"],
  ranger: ["might", "agility"],
  mage: ["arcana", "rhythm"],
  priest: ["arcana", "resilience"],
  warlock: ["arcana", "rhythm"],
  bard: ["rhythm", "arcana"],
  assassin: ["agility", "might"],
  alchemist: ["rhythm", "arcana"],
};

const ATTRIBUTE_STAT_WEIGHTS = {
  might: { physicalPower: 2.35, hp: 3 },
  fortitude: { hp: 14, receivedHealing: 0.012 },
  agility: { attackSpeed: 0.052, effectResist: 0.005 },
  arcana: { magicPower: 2.65, skillHaste: 0.006 },
  rhythm: { skillHaste: 0.02, effectPower: 0.04 },
  resilience: { armor: 0.5, effectResist: 0.012 },
};

function createModifierBundle(source = "unknown") {
  return {
    source,
    maxHpAdd: 0,
    physicalPowerAdd: 0,
    magicPowerAdd: 0,
    armorAdd: 0,
    attackSpeedMult: 1,
    skillHasteMult: 1,
    effectPowerMult: 1,
    effectResistPct: 0,
    receivedHealingMult: 1,
    mechanicModifiers: {},
    notes: [],
    debug: {},
  };
}

function attributePointYield(points, options = {}) {
  const value = Math.max(0, Number(points) || 0);
  if (!value) return 0;
  const curve = options.curve || "soft-linear";
  if (curve === "linear") return value;
  if (curve === "sqrt") return round(Math.sqrt(value) * 3.1, 4);
  if (curve === "log") return round(Math.log1p(value) * 4.05, 4);
  return round(value * (1 + Math.log1p(value) * 0.018), 4);
}

function normalizeAttributePoints(points = {}) {
  const output = {};
  for (const attr of ATTR_ORDER) output[attr] = Math.max(0, Number(points[attr]) || 0);
  return output;
}

function buildAttributeModifierBundle(attributePoints = {}, options = {}) {
  const points = normalizeAttributePoints(attributePoints);
  const bundle = createModifierBundle("attribute-points");
  const yields = {};
  for (const attr of ATTR_ORDER) {
    const yieldValue = attributePointYield(points[attr], options);
    yields[attr] = yieldValue;
    addAttributeYield(bundle, attr, yieldValue);
  }
  bundle.debug.attributePoints = points;
  bundle.debug.attributeYields = yields;
  return finalizeBundle(bundle);
}

function buildEquipmentModifierBundle(items = []) {
  const bundle = createModifierBundle("equipment");
  for (const item of items || []) {
    for (const [stat, value] of Object.entries(item.baseStats || item.stats || {})) {
      applyStatValue(bundle, stat, Number(value) || 0, "equipment-base");
    }
    for (const affix of item.affixes || []) {
      applyAffixValue(bundle, affix, "equipment-affix");
    }
  }
  return finalizeBundle(bundle);
}

function addAttributeYield(bundle, attr, yieldValue) {
  const row = ATTRIBUTE_STAT_WEIGHTS[attr];
  if (!row || !yieldValue) return;
  bundle.maxHpAdd += (row.hp || 0) * yieldValue;
  bundle.physicalPowerAdd += (row.physicalPower || 0) * yieldValue;
  bundle.magicPowerAdd += (row.magicPower || 0) * yieldValue;
  bundle.armorAdd += (row.armor || 0) * yieldValue;
  bundle.attackSpeedMult *= 1 + (row.attackSpeed || 0) * yieldValue;
  bundle.skillHasteMult *= 1 + (row.skillHaste || 0) * yieldValue;
  bundle.effectPowerMult *= 1 + (row.effectPower || 0) * yieldValue;
  bundle.effectResistPct += (row.effectResist || 0) * yieldValue;
  bundle.receivedHealingMult *= 1 + (row.receivedHealing || 0) * yieldValue;
}

function applyStatValue(bundle, stat, value, source = "stat") {
  if (!value) return;
  switch (stat) {
    case "hp":
    case "maxHp":
      bundle.maxHpAdd += value;
      break;
    case "attack":
    case "physicalPower":
      bundle.physicalPowerAdd += value;
      break;
    case "magicPower":
      bundle.magicPowerAdd += value;
      break;
    case "defense":
    case "armor":
      bundle.armorAdd += value * 0.8;
      break;
    case "attackSpeed":
      bundle.attackSpeedMult *= 1 + value * 0.012;
      break;
    case "skillHaste":
      bundle.skillHasteMult *= 1 + value * 0.012;
      break;
    case "effectPower":
      bundle.effectPowerMult *= 1 + value * 0.012;
      break;
    case "effectResist":
      bundle.effectResistPct += value * 0.008;
      break;
    case "healPower":
    case "shieldPower":
      addMechanicModifier(bundle, stat, value);
      bundle.magicPowerAdd += value * 0.45;
      break;
    case "healingReceived":
      bundle.receivedHealingMult *= 1 + value * 0.01;
      break;
    case "initiative":
      bundle.attackSpeedMult *= 1 + value * 0.006;
      break;
    default:
      addMechanicModifier(bundle, stat, value);
      bundle.notes.push(`${source}:mechanic:${stat}`);
      break;
  }
}

function applyAffixValue(bundle, affix, source = "affix") {
  const id = affix.id || affix.stat;
  const value = Number(affix.value) || 1;
  if (!id || !value) return;
  if (ATTRIBUTE_STAT_WEIGHTS[id]) {
    addAttributeYield(bundle, id, value);
    addMechanicModifier(bundle, `attribute:${id}`, value);
    return;
  }

  applyStatValue(bundle, id, value, source);
  if (["dotAmp", "fireAmp", "poisonAmp", "ritualFocus", "controlPower", "auraPower"].includes(id)) {
    bundle.effectPowerMult *= 1 + value * 0.008;
  } else if (["cleanseEfficiency", "sustainFlow", "lowHpHealingReceived"].includes(id)) {
    bundle.receivedHealingMult *= 1 + value * 0.008;
  } else if (["critChance", "critDamage", "shieldBreak", "armorBreak", "focusFire", "markPower", "executeDamage"].includes(id)) {
    bundle.physicalPowerAdd += value * 0.25;
  } else if (["lifeSteal", "lowHpDamage", "martialTempo"].includes(id)) {
    bundle.attackSpeedMult *= 1 + value * 0.004;
    bundle.physicalPowerAdd += value * 0.18;
  } else if (["stealthDuration"].includes(id)) {
    bundle.effectResistPct += value * 0.002;
  } else if (["counterDamage"].includes(id)) {
    bundle.armorAdd += value * 0.2;
    bundle.physicalPowerAdd += value * 0.15;
  }
}

function addMechanicModifier(bundle, key, value) {
  bundle.mechanicModifiers[key] = round((bundle.mechanicModifiers[key] || 0) + value, 4);
}

function mergeModifierBundles(...bundles) {
  const merged = createModifierBundle("merged");
  for (const bundle of bundles.filter(Boolean)) {
    merged.maxHpAdd += bundle.maxHpAdd || 0;
    merged.physicalPowerAdd += bundle.physicalPowerAdd || 0;
    merged.magicPowerAdd += bundle.magicPowerAdd || 0;
    merged.armorAdd += bundle.armorAdd || 0;
    merged.attackSpeedMult *= bundle.attackSpeedMult || 1;
    merged.skillHasteMult *= bundle.skillHasteMult || 1;
    merged.effectPowerMult *= bundle.effectPowerMult || 1;
    merged.effectResistPct += bundle.effectResistPct || 0;
    merged.receivedHealingMult *= bundle.receivedHealingMult || 1;
    for (const [key, value] of Object.entries(bundle.mechanicModifiers || {})) {
      addMechanicModifier(merged, key, value);
    }
    merged.notes.push(...(bundle.notes || []));
  }
  return finalizeBundle(merged);
}

function applyCombatModifiers(baseSpec, bundle) {
  const next = structuredClone(baseSpec || {});
  const roleBase = SKILL_DATA.roleKits[next.role] || {};
  const baseHp = next.maxHp ?? next.hp ?? roleBase.hp ?? 0;
  const basePower = next.power ?? roleBase.power ?? 0;
  const basePhysical = next.physicalPower ?? basePower;
  const baseMagic = next.magicPower ?? basePower;
  const baseArmor = next.armor ?? roleBase.armor ?? 0;

  next.maxHp = Math.max(1, Math.round(baseHp + (bundle.maxHpAdd || 0)));
  next.hp = next.maxHp;
  next.physicalPower = round(basePhysical + (bundle.physicalPowerAdd || 0), 2);
  next.magicPower = round(baseMagic + (bundle.magicPowerAdd || 0), 2);
  next.power = Math.round(Math.max(next.power || basePower, next.physicalPower, next.magicPower));
  next.armor = round(baseArmor + (bundle.armorAdd || 0), 2);
  next.range = next.range ?? roleBase.range;
  next.attackSpeedMult = round((next.attackSpeedMult || 1) * (bundle.attackSpeedMult || 1), 3);
  next.skillHasteMult = round((next.skillHasteMult || 1) * (bundle.skillHasteMult || 1), 3);
  next.effectPowerMult = round((next.effectPowerMult || 1) * (bundle.effectPowerMult || 1), 3);
  next.effectResistPct = round(clamp((next.effectResistPct || 0) + (bundle.effectResistPct || 0), 0, 0.5), 3);
  next.receivedHealingMult = round((next.receivedHealingMult || 1) * (bundle.receivedHealingMult || 1), 3);
  next.mechanicModifiers = {
    ...(next.mechanicModifiers || {}),
    ...(bundle.mechanicModifiers || {}),
  };
  next.buildLayers = {
    ...(next.buildLayers || {}),
    lastApplied: bundle.source || "merged",
    notes: bundle.notes || [],
    debug: bundle.debug || {},
  };
  return next;
}

function applyBuildLayers(baseSpec, options = {}) {
  const bundles = [];
  if (options.attributePoints) bundles.push(buildAttributeModifierBundle(options.attributePoints, options.attributeOptions));
  if (options.equipmentItems) bundles.push(buildEquipmentModifierBundle(options.equipmentItems));
  if (options.equipmentModifiers) bundles.push(options.equipmentModifiers);
  const merged = mergeModifierBundles(...bundles);
  const next = applyCombatModifiers(baseSpec, merged);
  if (options.tags?.length) next.buildLayerTags = [...(next.buildLayerTags || []), ...options.tags];
  return next;
}

function finalizeBundle(bundle) {
  bundle.maxHpAdd = round(bundle.maxHpAdd, 3);
  bundle.physicalPowerAdd = round(bundle.physicalPowerAdd, 3);
  bundle.magicPowerAdd = round(bundle.magicPowerAdd, 3);
  bundle.armorAdd = round(bundle.armorAdd, 3);
  bundle.attackSpeedMult = round(clamp(bundle.attackSpeedMult, 0.2, 3), 4);
  bundle.skillHasteMult = round(clamp(bundle.skillHasteMult, 0.2, 3), 4);
  bundle.effectPowerMult = round(clamp(bundle.effectPowerMult, 0.2, 3), 4);
  bundle.effectResistPct = round(clamp(bundle.effectResistPct, 0, 0.5), 4);
  bundle.receivedHealingMult = round(clamp(bundle.receivedHealingMult, 0.2, 3), 4);
  return bundle;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  return Number((Number(value) || 0).toFixed(digits));
}

module.exports = {
  ATTR_ORDER,
  ATTRS,
  ROLE_ATTRS,
  ATTRIBUTE_STAT_WEIGHTS,
  attributePointYield,
  normalizeAttributePoints,
  buildAttributeModifierBundle,
  buildEquipmentModifierBundle,
  mergeModifierBundles,
  applyCombatModifiers,
  applyBuildLayers,
};
