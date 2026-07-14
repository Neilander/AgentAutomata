(function initMapProgressionEncounters(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("../game_data/skill-data") : root.GAME_SKILL_DATA,
  );
  if (typeof module !== "undefined" && module.exports) module.exports = value;
  else root.GAME_MAP_PROGRESSION_ENCOUNTERS = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createEncounterApi(SKILL_DATA) {
  function roleKit(role) {
    const kit = SKILL_DATA?.roleKits?.[role]?.kit || {};
    return { small1: kit.small1, small2: kit.small2, passive: kit.passive, ultimate: kit.ultimate };
  }

  function completeSpec(unit, slotIndex) {
    return {
      ...roleKit(unit.role),
      ...unit,
      roleKey: unit.role,
      roleName: unit.roleName || unit.name,
      power: unit.power || Math.max(unit.physicalPower || 1, unit.magicPower || 1),
      maxHp: unit.maxHp || unit.hp,
      slotIndex,
    };
  }

  function scaleSpec(spec, scale) {
    const hp = Math.max(1, Math.round((spec.hp || spec.maxHp || 1) * scale));
    return {
      ...spec,
      hp,
      maxHp: hp,
      power: Math.max(1, Math.round((spec.power || 1) * scale)),
      physicalPower: Math.max(1, Math.round((spec.physicalPower || spec.power || 1) * scale)),
      magicPower: Math.max(1, Math.round((spec.magicPower || spec.power || 1) * scale)),
      armor: Math.max(0, Math.round((spec.armor || 0) * (0.85 + scale * 0.15))),
    };
  }

  function prisonTeam() {
    const units = [
      { name: "狱门盾兵", role: "warrior", hp: 300, physicalPower: 8, magicPower: 8, armor: 9, range: 12, small1: "heal" },
      { name: "狱卒弓兵1", role: "ranger", hp: 155, physicalPower: 18, magicPower: 8, armor: 3, range: 42, small1: "markShot" },
      { name: "狱卒弓兵2", role: "ranger", hp: 155, physicalPower: 18, magicPower: 8, armor: 3, range: 42, small1: "markShot" },
      { name: "狱医", role: "priest", hp: 150, physicalPower: 6, magicPower: 18, armor: 3, range: 36, small1: "heal" },
    ];
    return units.map((unit, slotIndex) => scaleSpec(completeSpec({
      ...unit,
      small2: "enemyNoop",
      passive: "enemyDormantPassive",
      ultimate: "enemyNoop",
    }, slotIndex), 2.82));
  }

  function bearLockTeam() {
    const units = [
      {
        name: "牵熊盗匪",
        role: "warrior",
        hp: 180,
        physicalPower: 20,
        magicPower: 8,
        armor: 6,
        range: 13,
        small1: "powerStrike",
        small2: "enemyNoop",
        passive: "enemyDormantPassive",
        ultimate: "enemyNoop",
      },
      {
        name: "狂鬃蛮熊",
        role: "berserker",
        roleName: "蛮熊",
        hp: 570,
        physicalPower: 50,
        magicPower: 8,
        armor: 7,
        range: 12,
        attackSpeedMult: 1.28,
      },
      {
        name: "山林投石手",
        role: "ranger",
        hp: 125,
        physicalPower: 18,
        magicPower: 8,
        armor: 2,
        range: 38,
        small1: "enemyNoop",
        small2: "enemyNoop",
        passive: "enemyDormantPassive",
        ultimate: "enemyNoop",
      },
      {
        name: "粗劣兽医",
        role: "priest",
        hp: 125,
        physicalPower: 5,
        magicPower: 16,
        armor: 2,
        range: 34,
        small1: "heal",
        small2: "enemyNoop",
        passive: "enemyDormantPassive",
        ultimate: "enemyNoop",
      },
    ];
    return units.map((unit, slotIndex) => completeSpec(unit, slotIndex));
  }

  function rangerTeachingTeam() {
    const bear = bearLockTeam().find((unit) => unit.role === "berserker");
    return [{
      ...bear,
      name: "狂鬃熊王",
      hp: 1000,
      maxHp: 1000,
    }];
  }

  const FIRST_ROAD_PROFILES = {
    paper_v0: { meleeHp: 30, rangedHp: 22, armor: 0, spawnWhenRemaining: 1 },
    effort_v0: { meleeHp: 41, rangedHp: 30, armor: 0, spawnWhenRemaining: 2 },
    effort_v1: { meleeHp: 92, rangedHp: 68, armor: 2, spawnWhenRemaining: 2 },
    effort_v2: { meleeHp: 216, rangedHp: 214, armor: 2, spawnWhenRemaining: 2 },
  };

  function firstRoadWaves(profileInput = "effort_v2") {
    const profile = typeof profileInput === "string"
      ? (FIRST_ROAD_PROFILES[profileInput] || FIRST_ROAD_PROFILES.effort_v2)
      : { ...FIRST_ROAD_PROFILES.effort_v2, ...(profileInput || {}) };
    return [
      {
        title: "大波 1：路边散兵",
        regroupAfter: true,
        smallWaves: [
          { title: "大波 1-1：短刀试探", startTitle: "三名短刀散兵从路边冲来", rightTeam: weakRoadGroup(3, 0, profile), spawnWhenRemaining: profile.spawnWhenRemaining },
          { title: "大波 1-2：投石跟进", startTitle: "后续散兵排成小队跟进", rightTeam: [...weakRoadGroup(1, 3, profile), ...weakRoadRanged(2, 0, profile)] },
        ],
      },
      {
        title: "大波 2：残兵反扑",
        regroupAfter: false,
        smallWaves: [
          { title: "大波 2：残兵反扑", startTitle: "最后一队混合散兵进入战场", rightTeam: [...weakRoadGroup(2, 4, profile), ...weakRoadRanged(2, 2, profile)] },
        ],
      },
    ];
  }

  function weakRoadGroup(count, offset, profile) {
    return Array.from({ length: count }, (_, index) => ({
      name: `郊野短刀兵 ${offset + index + 1}`,
      role: "warrior",
      roleKey: "warrior",
      roleName: "短刀散兵",
      iconText: "刀",
      hp: profile.meleeHp,
      maxHp: profile.meleeHp,
      power: 9,
      physicalPower: 10,
      magicPower: 3,
      armor: profile.armor,
      range: 12,
      small1: "enemyNoop",
      small2: "enemyNoop",
      passive: "enemyDormantPassive",
      ultimate: "enemyNoop",
    }));
  }

  function weakRoadRanged(count, offset, profile) {
    return Array.from({ length: count }, (_, index) => ({
      name: `郊野投石手 ${offset + index + 1}`,
      role: "ranger",
      roleKey: "ranger",
      roleName: "投石散兵",
      iconText: "石",
      hp: profile.rangedHp,
      maxHp: profile.rangedHp,
      power: 8,
      physicalPower: 9,
      magicPower: 3,
      armor: profile.armor,
      range: 32,
      small1: "enemyNoop",
      small2: "enemyNoop",
      passive: "enemyDormantPassive",
      ultimate: "enemyNoop",
    }));
  }

  function campFirstClearLoot(idPrefix = "r1_bandit_key") {
    return [
      {
        id: `${idPrefix}_weapon`,
        slot: "weapon",
        slotLabel: "武器",
        equipmentLevel: 14,
        rarity: "rare",
        rarityLabel: "稀有",
        name: "旧塔破盾斧 Lv.14",
        baseStats: { physicalPower: 8 },
        affixes: [
          { id: "shieldBreak", stat: "shieldBreak", label: "破盾", category: "specialist", level: 1, value: 24 },
          { id: "might", stat: "might", label: "武力", category: "major", level: 1, value: 2 },
        ],
      },
      {
        id: `${idPrefix}_gloves`,
        slot: "gloves",
        slotLabel: "护手",
        equipmentLevel: 13,
        rarity: "rare",
        rarityLabel: "稀有",
        name: "裂甲铁护手 Lv.13",
        baseStats: { physicalPower: 5, armor: 1 },
        affixes: [
          { id: "armorBreak", stat: "armorBreak", label: "破甲", category: "specialist", level: 1, value: 20 },
          { id: "fortitude", stat: "fortitude", label: "坚韧", category: "major", level: 1, value: 1 },
        ],
      },
    ];
  }

  function isOneTimeBranch(item) {
    return item?.id === "r1_bandit" || item?.id === "r1_prison";
  }

  function fieldEffectId(item) {
    if (item?.id === "r1_prison") return "old_tower_prison";
    if (item?.id?.includes("bandit")) return "heavy_shield_line";
    if (item?.type === "boss") return "pressure_corridor";
    return "";
  }

  function enemyScaleOverride(item) {
    return item?.id === "r1_boss" ? 1.38 : null;
  }

  return { FIRST_ROAD_PROFILES, bearLockTeam, campFirstClearLoot, enemyScaleOverride, fieldEffectId, firstRoadWaves, isOneTimeBranch, prisonTeam, rangerTeachingTeam };
});
