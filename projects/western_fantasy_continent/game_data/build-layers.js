const SKILL_DATA = typeof require === "function" ? require("./skill-data") : window.GAME_SKILL_DATA;
const EQUIPMENT_SETS = typeof require === "function" ? require("./equipment-sets") : window.GAME_EQUIPMENT_SETS;
const BUILD_LAYER_MECHANIC_CURVES = (typeof require === "function" ? require("./mechanic-curves") : window.GAME_MECHANIC_CURVES) || {
  hasMechanicCurve: () => false,
  mechanicCurveValue: (_id, value) => Number(value) || 0,
};

const ATTR_ORDER = ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "warding"];

const ATTRS = {
  might: "武力",
  fortitude: "坚韧",
  agility: "敏捷",
  arcana: "奥术",
  rhythm: "节律",
  resilience: "韧性",
  warding: "灵御",
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
  warding: { magicResist: 0.5, hp: 3 },
};

function createModifierBundle(source = "unknown") {
  return {
    source,
    maxHpAdd: 0,
    physicalPowerAdd: 0,
    magicPowerAdd: 0,
    armorAdd: 0,
    magicResistAdd: 0,
    rangeAdd: 0,
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
  for (const [key, value] of Object.entries(EQUIPMENT_SETS?.buildSetMechanicModifiers?.(items) || {})) {
    addMechanicModifier(bundle, key, value);
  }
  for (const [stat, value] of Object.entries(EQUIPMENT_SETS?.buildSetStatBonuses?.(items) || {})) {
    applyStatValue(bundle, stat, Number(value) || 0, "equipment-set");
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
  bundle.magicResistAdd += (row.magicResist || 0) * yieldValue;
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
    case "magicResist":
      bundle.magicResistAdd += value * 0.8;
      break;
    case "range":
      bundle.rangeAdd += value;
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
    case "receivedHealing":
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
  if (BUILD_LAYER_MECHANIC_CURVES.hasMechanicCurve(id)) {
    applyCurvedMechanicValue(bundle, id, value, source);
    return;
  }

  applyStatValue(bundle, id, value, source);
}

function applyCurvedMechanicValue(bundle, id, points, source = "affix") {
  const effect = BUILD_LAYER_MECHANIC_CURVES.mechanicCurveValue(id, points);
  addMechanicModifier(bundle, id, points);
  bundle.debug.curvedMechanics = bundle.debug.curvedMechanics || {};
  bundle.debug.curvedMechanics[id] = {
    rawPoints: round((bundle.debug.curvedMechanics[id]?.rawPoints || 0) + points, 4),
    effect: round((bundle.debug.curvedMechanics[id]?.effect || 0) + effect, 4),
  };
  bundle.notes.push(`${source}:curve:${id}`);

  if (id === "attackSpeed") {
    bundle.attackSpeedMult *= 1 + effect;
  } else if (id === "skillHaste") {
    bundle.skillHasteMult *= 1 + effect;
  } else if (id === "effectPower") {
    bundle.effectPowerMult *= 1 + effect;
  } else if (id === "effectResist") {
    bundle.effectResistPct += effect;
  } else if (id === "receivedHealing" || id === "cleanseEfficiency" || id === "lowHpHealingReceived") {
    bundle.receivedHealingMult *= 1 + effect;
  } else if (id === "healPower" || id === "shieldPower") {
    bundle.magicPowerAdd += effect * 18;
  } else if (["dotAmp", "fireAmp", "poisonAmp", "controlPower", "auraPower"].includes(id)) {
    bundle.effectPowerMult *= 1 + effect;
  } else if (id === "arcaneAmp") {
    bundle.effectPowerMult *= 1 + effect;
    bundle.magicPowerAdd += effect * 20;
    bundle.skillHasteMult *= 1 + effect * 0.25;
  } else if (["critChance", "critDamage", "shieldBreak", "armorBreak", "markPower", "executeDamage"].includes(id)) {
    bundle.physicalPowerAdd += effect * 25;
  } else if (id === "lifeSteal") {
    bundle.attackSpeedMult *= 1 + effect * 0.35;
    bundle.physicalPowerAdd += effect * 18;
  } else if (id === "lowHpDamage") {
    bundle.attackSpeedMult *= 1 + effect * 0.45;
    bundle.physicalPowerAdd += effect * 22;
  } else if (id === "initiative") {
    bundle.attackSpeedMult *= 1 + effect;
  } else if (id === "stealthDuration") {
    bundle.effectResistPct += effect * 0.35;
  } else if (id === "shadowAmp") {
    bundle.physicalPowerAdd += effect * 22;
    bundle.effectResistPct += effect * 0.2;
  } else if (id === "counterDamage") {
    bundle.armorAdd += effect * 20;
    bundle.physicalPowerAdd += effect * 14;
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
    merged.magicResistAdd += bundle.magicResistAdd || 0;
    merged.rangeAdd += bundle.rangeAdd || 0;
    merged.attackSpeedMult *= bundle.attackSpeedMult || 1;
    merged.skillHasteMult *= bundle.skillHasteMult || 1;
    merged.effectPowerMult *= bundle.effectPowerMult || 1;
    merged.effectResistPct += bundle.effectResistPct || 0;
    merged.receivedHealingMult *= bundle.receivedHealingMult || 1;
    for (const [key, value] of Object.entries(bundle.mechanicModifiers || {})) {
      addMechanicModifier(merged, key, value);
    }
    merged.debug.curvedMechanics = mergeCurvedMechanicsDebug(merged.debug.curvedMechanics, bundle.debug?.curvedMechanics);
    merged.notes.push(...(bundle.notes || []));
  }
  return finalizeBundle(merged);
}

function mergeCurvedMechanicsDebug(left = {}, right = {}) {
  const output = { ...(left || {}) };
  for (const [key, value] of Object.entries(right || {})) {
    output[key] = {
      rawPoints: round((output[key]?.rawPoints || 0) + (value.rawPoints || 0), 4),
      effect: round((output[key]?.effect || 0) + (value.effect || 0), 4),
    };
  }
  return output;
}

function applyCombatModifiers(baseSpec, bundle) {
  const next = structuredClone(baseSpec || {});
  const roleBase = SKILL_DATA.roleKits[next.role] || {};
  const baseHp = next.maxHp ?? next.hp ?? roleBase.hp ?? 0;
  const basePower = next.power ?? roleBase.power ?? 0;
  const basePhysical = next.physicalPower ?? basePower;
  const baseMagic = next.magicPower ?? basePower;
  const baseArmor = next.armor ?? roleBase.armor ?? 0;
  const baseMagicResist = next.magicResist ?? roleBase.magicResist ?? 0;

  next.maxHp = Math.max(1, Math.round(baseHp + (bundle.maxHpAdd || 0)));
  next.hp = next.maxHp;
  next.physicalPower = round(basePhysical + (bundle.physicalPowerAdd || 0), 2);
  next.magicPower = round(baseMagic + (bundle.magicPowerAdd || 0), 2);
  next.power = Math.round(Math.max(next.power || basePower, next.physicalPower, next.magicPower));
  next.armor = round(baseArmor + (bundle.armorAdd || 0), 2);
  next.magicResist = round(baseMagicResist + (bundle.magicResistAdd || 0), 2);
  next.range = round((next.range ?? roleBase.range ?? 0) + (bundle.rangeAdd || 0), 2);
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
  bundle.magicResistAdd = round(bundle.magicResistAdd, 3);
  bundle.rangeAdd = round(bundle.rangeAdd, 3);
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

const BUILD_LAYER_API = {
  ATTR_ORDER,
  ATTRS,
  ROLE_ATTRS,
  ATTRIBUTE_STAT_WEIGHTS,
  MECHANIC_CURVES: BUILD_LAYER_MECHANIC_CURVES,
  attributePointYield,
  normalizeAttributePoints,
  buildAttributeModifierBundle,
  buildEquipmentModifierBundle,
  mergeModifierBundles,
  applyCombatModifiers,
  applyBuildLayers,
};

if (typeof module !== "undefined" && module.exports) module.exports = BUILD_LAYER_API;
if (typeof window !== "undefined") window.GAME_BUILD_LAYERS = BUILD_LAYER_API;
