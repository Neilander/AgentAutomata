const { EMPTY_STATS, mergeStats } = require("./stat-schema");
const { EQUIPMENT_SETS } = require("./equipment");
const { MAX_RELICS_PER_UNIT, RELICS } = require("./relics");

const CLASS_BASE_STATS = {
  tank: {
    hp: 260,
    attack: 18,
    defense: 22,
    magicPower: 4,
    magicResist: 16,
    attackSpeed: 0.75,
    critChance: 0.03,
    critDamage: 1.5,
    moveSpeed: 44,
    accuracy: 80,
    evasion: 4,
  },
  warrior: {
    hp: 190,
    attack: 30,
    defense: 14,
    magicPower: 6,
    magicResist: 10,
    attackSpeed: 0.95,
    critChance: 0.07,
    critDamage: 1.6,
    moveSpeed: 56,
    accuracy: 84,
    evasion: 8,
  },
  assassin: {
    hp: 135,
    attack: 38,
    defense: 8,
    magicPower: 8,
    magicResist: 8,
    attackSpeed: 1.25,
    critChance: 0.16,
    critDamage: 1.85,
    moveSpeed: 78,
    accuracy: 88,
    evasion: 18,
  },
  mage: {
    hp: 125,
    attack: 10,
    defense: 6,
    magicPower: 42,
    magicResist: 18,
    attackSpeed: 0.82,
    critChance: 0.05,
    critDamage: 1.5,
    moveSpeed: 46,
    accuracy: 82,
    evasion: 6,
  },
};

function getEquipmentSet(id) {
  return EQUIPMENT_SETS.find((set) => set.id === id);
}

function getRelic(id) {
  return RELICS.find((relic) => relic.id === id);
}

function getPassiveRelicStats(relicIds) {
  return relicIds
    .map(getRelic)
    .filter(Boolean)
    .filter((relic) => relic.trigger === "passive")
    .map((relic) => relic.effect.stats || {});
}

function buildUnitStats({ classKey, equipmentSetId, relicIds = [] }) {
  if (relicIds.length > MAX_RELICS_PER_UNIT) {
    throw new Error(`A unit can equip at most ${MAX_RELICS_PER_UNIT} relics.`);
  }

  const classStats = CLASS_BASE_STATS[classKey];
  if (!classStats) {
    throw new Error(`Unknown class: ${classKey}`);
  }

  const equipmentSet = getEquipmentSet(equipmentSetId);
  const equipmentStats = equipmentSet ? equipmentSet.stats : {};
  return mergeStats(EMPTY_STATS, classStats, equipmentStats, ...getPassiveRelicStats(relicIds));
}

function createBasicDamagePacket(unitStats, tags = ["attack", "singleTarget"]) {
  const physicalAmount = Math.max(1, unitStats.attack);
  const entries = [{ type: "physical", amount: physicalAmount }];
  if (unitStats.fireDamage) entries.push({ type: "fire", amount: unitStats.fireDamage, duration: 3 });
  if (unitStats.poisonDamage) entries.push({ type: "poison", amount: unitStats.poisonDamage, duration: 4 });
  if (unitStats.lightningDamage) entries.push({ type: "lightning", amount: unitStats.lightningDamage });
  if (unitStats.iceDamage) entries.push({ type: "ice", amount: unitStats.iceDamage, slow: unitStats.iceSlowAmp });
  return {
    tags,
    entries,
    canCrit: true,
    isArea: tags.includes("area"),
  };
}

module.exports = {
  CLASS_BASE_STATS,
  buildUnitStats,
  createBasicDamagePacket,
  getEquipmentSet,
  getRelic,
};

