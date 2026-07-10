(function initMapProgressionRoster(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("../game_data/skill-data") : root.GAME_SKILL_DATA,
    typeof module !== "undefined" ? require("../game_data/equipment-runtime") : root.GAME_EQUIPMENT_RUNTIME,
  );
  if (typeof module !== "undefined" && module.exports) module.exports = value;
  else root.GAME_MAP_PROGRESSION_ROSTER = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRosterApi(SKILL_DATA, EQUIPMENT) {
  const ROSTER_SEED = [
    hero("hero_knight", "银盾骑士", "knight", "完整前排英雄，有守护与大招。"),
    hero("hero_mage", "烬火法师", "mage", "完整输出英雄，负责清怪与爆发。"),
    militia("militia_shield", "盾民兵", "warrior", "只能挡线，几乎没有输出。", {
      hp: 330, power: 8, physicalPower: 8, magicPower: 8, armor: 8, range: 12,
      small1: "heal", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
    militia("militia_bow", "弓民兵", "ranger", "脆弱后排，只能补充基础远程伤害。", {
      hp: 160, power: 16, physicalPower: 18, magicPower: 8, armor: 3, range: 42,
      small1: "markShot", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
    militia("militia_spark", "火花学徒", "mage", "法强尚可但极脆，适合赌输出。", {
      hp: 125, power: 8, physicalPower: 6, magicPower: 28, armor: 2, range: 40,
      small1: "fireball", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
    militia("militia_herb", "草药民兵", "priest", "低配治疗，只能延缓崩线。", {
      hp: 155, power: 8, physicalPower: 6, magicPower: 18, armor: 3, range: 36,
      small1: "heal", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
  ];

  const HERO_REWARDS = {
    ranger: hero("hero_ranger", "林地游侠", "ranger", "完整后排点杀英雄，适合替代弓民兵。"),
  };

  const INITIAL_TEAM_SLOTS = ["hero_knight", "militia_shield", "hero_mage", "militia_bow"];

  function hero(id, name, role, note) {
    return { id, name, role, kind: "hero", note, unlocked: true, equipment: {} };
  }

  function militia(id, name, role, note, override) {
    return { id, name, role, kind: "militia", note, override, unlocked: true, equipment: {} };
  }

  function createInitialRoster() {
    return ROSTER_SEED.map(cloneUnit);
  }

  function normalizeRoster(roster) {
    const source = Array.isArray(roster) && roster.length ? roster : createInitialRoster();
    return source.map(cloneUnit);
  }

  function normalizeTeamSlots(teamSlots, roster) {
    const valid = new Set(normalizeRoster(roster).map((unit) => unit.id));
    const source = Array.isArray(teamSlots) ? teamSlots : INITIAL_TEAM_SLOTS;
    const unique = [];
    for (const id of source) {
      if (valid.has(id) && !unique.includes(id)) unique.push(id);
    }
    for (const id of INITIAL_TEAM_SLOTS) {
      if (unique.length >= 4) break;
      if (valid.has(id) && !unique.includes(id)) unique.push(id);
    }
    return unique.slice(0, 4);
  }

  function rescueHero(roster, rewardId) {
    const next = normalizeRoster(roster);
    const reward = HERO_REWARDS[rewardId];
    if (reward && !next.some((unit) => unit.id === reward.id)) next.push(cloneUnit(reward));
    return next;
  }

  function activeUnits(roster, teamSlots) {
    const units = normalizeRoster(roster);
    const byId = Object.fromEntries(units.map((unit) => [unit.id, unit]));
    return normalizeTeamSlots(teamSlots, units).map((id) => byId[id]).filter(Boolean);
  }

  function assignTeamSlot(roster, teamSlots, slotIndex, heroId) {
    const units = normalizeRoster(roster);
    if (!units.some((unit) => unit.id === heroId)) return normalizeTeamSlots(teamSlots, units);
    const next = normalizeTeamSlots(teamSlots, units);
    const index = Math.max(0, Math.min(3, Number(slotIndex) || 0));
    const existing = next.indexOf(heroId);
    if (existing >= 0 && existing !== index) [next[existing], next[index]] = [next[index], next[existing]];
    else next[index] = heroId;
    return normalizeTeamSlots(next, units);
  }

  function buildTeam(roster, teamSlots, scale = 1) {
    return activeUnits(roster, teamSlots).map((unit, slotIndex) => scaleSpec(buildSpec(unit, slotIndex), scale));
  }

  function buildSpec(unit, slotIndex) {
    const role = SKILL_DATA?.roleKits?.[unit.role] || {};
    const kit = role.kit || {};
    const base = {
      name: unit.name,
      role: unit.role,
      roleKey: unit.role,
      roleName: unit.kind === "militia" ? "民兵" : (role.role || unit.role),
      unitKind: unit.kind,
      hp: role.hp || 300,
      maxHp: role.hp || 300,
      power: role.power || 45,
      physicalPower: role.power || 45,
      magicPower: role.power || 45,
      armor: role.armor || 8,
      range: role.range || 14,
      small1: kit.small1,
      small2: kit.small2,
      passive: kit.passive,
      ultimate: kit.ultimate,
      slotIndex,
    };
    let spec = { ...base, ...(unit.override || {}) };
    if (unit.override?.hp && !unit.override.maxHp) spec.maxHp = unit.override.hp;
    spec = EQUIPMENT.applyEquipment(spec, unit.equipment);
    return spec;
  }

  function scaleSpec(spec, mult) {
    const hp = Math.max(1, Math.round((spec.hp || spec.maxHp || 1) * mult));
    return {
      ...spec,
      hp,
      maxHp: hp,
      power: Math.max(1, Math.round((spec.power || 1) * mult)),
      physicalPower: Math.max(1, Math.round((spec.physicalPower || spec.power || 1) * mult)),
      magicPower: Math.max(1, Math.round((spec.magicPower || spec.power || 1) * mult)),
      armor: Math.max(0, Math.round((spec.armor || 0) * (0.85 + mult * 0.15))),
    };
  }

  function teamLabel(roster, teamSlots) {
    return activeUnits(roster, teamSlots).map((unit) => `${unit.name}${unit.kind === "militia" ? "（民兵）" : ""}`).join("、");
  }

  function cloneUnit(unit) {
    return { ...unit, override: unit.override ? { ...unit.override } : undefined, equipment: { ...(unit.equipment || {}) } };
  }

  return {
    HERO_REWARDS,
    INITIAL_TEAM_SLOTS,
    ROSTER_SEED,
    activeUnits,
    assignTeamSlot,
    buildTeam,
    createInitialRoster,
    normalizeRoster,
    normalizeTeamSlots,
    rescueHero,
    teamLabel,
  };
});
