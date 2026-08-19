const GAME_EQUIPMENT_SETS = (() => {
  const SETS = Object.freeze({
    verdantCircle: Object.freeze({
      id: "verdantCircle",
      name: "繁生之环",
      school: "nature",
      threePieceKey: "set:verdantCircle:sowing",
      sixPieceKey: "set:verdantCircle:propagation",
    }),
    myriadValor: Object.freeze({
      id: "myriadValor",
      name: "万夫之勇",
      roleFamily: "melee",
      rarity: "传说",
      threePieceKey: "set:myriadValor:foundation",
      sixPieceKey: "set:myriadValor:battleGrowth",
      threePieceStats: Object.freeze({ maxHp: 60, physicalPower: 12 }),
    }),
    meteorFireRain: Object.freeze({
      id: "meteorFireRain",
      name: "流星火雨",
      school: "fire",
      rarity: "传说",
      threePieceKey: "set:meteorFireRain:foundation",
      sixPieceKey: "set:meteorFireRain:skyfall",
      threePieceStats: Object.freeze({ magicPower: 15 }),
    }),
    guardianEcho: Object.freeze({
      id: "guardianEcho",
      name: "护佑回响",
      roleFamily: "protector",
      rarity: "暗金",
      threePieceKey: "set:guardianEcho:foundation",
      sixPieceKey: "set:guardianEcho:resonance",
      threePieceStats: Object.freeze({ maxHp: 60, healPower: 20 }),
    }),
    eagleEye: Object.freeze({
      id: "eagleEye",
      name: "鹰眼校准",
      roleFamily: "archer",
      rarity: "暗金",
      threePieceKey: "set:eagleEye:foundation",
      sixPieceKey: "set:eagleEye:skyArrow",
      threePieceStats: Object.freeze({ physicalPower: 10, range: 8 }),
    }),
    cavalryCharge: Object.freeze({
      id: "cavalryCharge",
      name: "奔袭铁骑",
      roleFamily: "cavalry",
      rarity: "永恒",
      threePieceKey: "set:cavalryCharge:foundation",
      sixPieceKey: "set:cavalryCharge:breakthrough",
      threePieceStats: Object.freeze({ moveSpeed: 25, moveSpeedAttackConversion: 80, movingDamageReduction: 30 }),
    }),
    sighingWall: Object.freeze({
      id: "sighingWall",
      name: "叹息之墙",
      roleFamily: "shield",
      rarity: "永恒",
      threePieceKey: "set:sighingWall:foundation",
      sixPieceKey: "set:sighingWall:unyieldingBoundary",
      threePieceStats: Object.freeze({ maxHp: 80, shieldPower: 20 }),
    }),
  });

  const MOCK_SLOTS = ["weapon", "helm", "chest", "gloves", "legs", "boots", "ring", "charm"];

  function countSetPieces(items = []) {
    const counts = {};
    for (const item of items || []) {
      if (!item?.setId) continue;
      counts[item.setId] = (counts[item.setId] || 0) + 1;
    }
    return counts;
  }

  function buildSetMechanicModifiers(items = []) {
    const counts = countSetPieces(items);
    const modifiers = {};
    for (const [setId, pieces] of Object.entries(counts)) {
      modifiers[`set:${setId}:pieces`] = pieces;
      const set = SETS[setId];
      if (!set) continue;
      if (pieces >= 3) modifiers[set.threePieceKey] = 1;
      if (pieces >= 6) modifiers[set.sixPieceKey] = 1;
    }
    return modifiers;
  }

  function buildSetStatBonuses(items = []) {
    const counts = countSetPieces(items);
    const stats = {};
    for (const [setId, pieces] of Object.entries(counts)) {
      const set = SETS[setId];
      if (!set || pieces < 3) continue;
      for (const [stat, value] of Object.entries(set.threePieceStats || {})) {
        stats[stat] = (stats[stat] || 0) + value;
      }
    }
    return stats;
  }

  function mockSetItems(setId = "verdantCircle", pieces = 6) {
    const set = SETS[setId];
    if (!set) throw new Error(`Unknown equipment set: ${setId}`);
    return MOCK_SLOTS.slice(0, Math.max(0, Math.min(MOCK_SLOTS.length, pieces))).map((slot, index) => ({
      id: `mock_${setId}_${slot}`,
      name: `${set.name}·测试件${index + 1}`,
      slot,
      setId,
      rarity: "神话",
      baseStats: {},
      affixes: [],
    }));
  }

  return { SETS, countSetPieces, buildSetMechanicModifiers, buildSetStatBonuses, mockSetItems };
})();

if (typeof window !== "undefined") window.GAME_EQUIPMENT_SETS = GAME_EQUIPMENT_SETS;
if (typeof module !== "undefined") module.exports = GAME_EQUIPMENT_SETS;
