(function initMapProgressionRoster(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("../game_data/skill-data") : root.GAME_SKILL_DATA,
    typeof module !== "undefined" ? require("../game_data/equipment-runtime") : root.GAME_EQUIPMENT_RUNTIME,
  );
  if (typeof module !== "undefined" && module.exports) module.exports = value;
  else root.GAME_MAP_PROGRESSION_ROSTER = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRosterApi(SKILL_DATA, EQUIPMENT) {
  const ROSTER_SEED = [
    hero("hero_warrior", "灰鸦战士", "warrior", "完整近战英雄，能打能扛，但没有骑士的守护能力。"),
    hero("hero_mage", "烬火法师", "mage", "完整输出英雄，负责清怪与爆发。"),
    militia("militia_barricade", "拒马民兵", "warrior", "只有血量和自救，几乎没有伤害，也不能保护队友。", {
      hp: 390, power: 3, physicalPower: 3, magicPower: 3, armor: 8, range: 12,
      small1: "heal", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
    militia("militia_spear", "短矛民兵", "warrior", "慢速单体近战，能补伤害但没有完整战士的作战能力。", {
      hp: 220, power: 18, physicalPower: 20, magicPower: 5, armor: 5, range: 15,
      attackSpeedMult: 0.82, small1: "powerStrike", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
    militia("militia_herb", "草药民兵", "priest", "低配治疗，只能延缓崩线。", {
      hp: 155, power: 8, physicalPower: 6, magicPower: 18, armor: 3, range: 36,
      small1: "heal", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
    militia("militia_drum", "皮鼓民兵", "bard", "偶尔敲响战鼓，自己几乎没有输出。", {
      hp: 145, power: 6, physicalPower: 5, magicPower: 10, armor: 2, range: 34,
      small1: "tempoSong", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop",
    }),
  ];

  const HERO_REWARDS = {
    ranger: hero("hero_ranger", "林地游侠", "ranger", "完整远程物理英雄，持续盯住当前目标并累积猎标。"),
  };

  const INITIAL_TEAM_SLOTS = ["hero_warrior", "militia_barricade", "hero_mage", "militia_herb"];

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
