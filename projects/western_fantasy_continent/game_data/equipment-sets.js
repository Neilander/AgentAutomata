const GAME_EQUIPMENT_SETS = (() => {
  const SETS = Object.freeze({
    verdantCircle: Object.freeze({
      id: "verdantCircle",
      name: "繁生之环",
      school: "nature",
      threePieceKey: "set:verdantCircle:sowing",
      sixPieceKey: "set:verdantCircle:propagation",
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

  return { SETS, countSetPieces, buildSetMechanicModifiers, mockSetItems };
})();

if (typeof window !== "undefined") window.GAME_EQUIPMENT_SETS = GAME_EQUIPMENT_SETS;
if (typeof module !== "undefined") module.exports = GAME_EQUIPMENT_SETS;
