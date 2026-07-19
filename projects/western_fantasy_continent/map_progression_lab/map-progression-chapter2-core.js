(function initChapter2Core(root, factory) {
  const value = factory(
    typeof require === "function" ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM,
    typeof require === "function" ? require("../game_data/skill-data") : root.GAME_SKILL_DATA,
    typeof require === "function" ? require("./map-progression-roster") : root.GAME_MAP_PROGRESSION_ROSTER,
    typeof require === "function" ? require("../game_data/equipment-runtime") : root.GAME_EQUIPMENT_RUNTIME,
    typeof require === "function" ? require("../game_data/combat-signals") : root.GAME_COMBAT_SIGNALS,
  );
  if (typeof module !== "undefined") module.exports = value;
  else root.GAME_MAP_PROGRESSION_CHAPTER2 = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createChapter2Core(COMBAT_SIM, SKILL_DATA, ROSTER, EQUIPMENT, SIGNAL_PRESENTATION) {

// The immutable teaching structure lives in SECOND_REGION_DESIGN_INTENT.md.
const nodes = [
  node("r2_entry", "双路驿口", "main", [], "固定 Lv.22 普通武器；普通掉落", "边境混编巡逻队"),
  node("r2_knight_rescue", "断旗堡救援", "rescue", ["r2_entry"], "首通营救白垒骑士；Lv.20-25 装备", "重甲前排与远程火力"),
  node("r2_priest_rescue", "荒井救援", "rescue", ["r2_entry"], "首通营救晨祷牧师；Lv.20-25 装备", "持续压血与远程火力"),
  node("r2_shield_trial", "鸣盾庭", "trial", ["r2_knight_rescue"], "护盾爆裂；Lv.22-27 装备", "护盾超过阈值会爆炸并清空", "shield_detonation"),
  node("r2_flag_trial", "折旗台", "trial", ["r2_priest_rescue"], "王旗落地；Lv.22-27 装备", "前排守旗、阵亡后全队反扑", "king_flag"),
  {
    ...node("r2_confluence", "双钥汇流", "main", ["r2_shield_trial", "r2_flag_trial"], "首通固定 Lv.24 史诗火印护符", "守旗前排与护盾支援组成的混合队"),
    rewardHint: "两项试炼完成后开放；首通固定获得一件四词缀 Lv.24 史诗火印护符",
  },
  node("r2_boss", "双垒督军", "boss", ["r2_confluence"], "第二地区首领装备", "能守旗也能连续普攻的完整首领队", "king_flag"),
];
const nodesById = Object.fromEntries(nodes.map((item) => [item.id, item]));

function node(id, name, type, requires, rewardHint, enemyHint, fieldEffectId = "") {
  return { id, name, type, requires, rewardHint, enemyHint, fieldEffectId };
}

function initialState(seed = "chapter-2", options = {}) {
  const enrichedV1 = options.environmentVariant === "enriched_v1";
  let roster = ROSTER.createInitialRoster();
  roster = ROSTER.rescueHero(roster, "mage");
  roster = ROSTER.rescueHero(roster, "ranger");
  roster = equipChapterOneBaseline(roster);
  return {
    schema: "map_cognition_chapter2_v1",
    region: "region_2",
    seed,
    step: 0,
    cleared: {},
    attempts: {},
    failures: {},
    inventory: [],
    roster,
    teamSlots: ["hero_warrior", "militia_barricade", "hero_mage", "hero_ranger"],
    flags: { enrichedV1, knightRescued: false, priestRescued: false, epicGranted: false, pendingTeamExperiment: false },
    cognition: {
      concepts: ["关卡", "战斗", "装备", "战力", "角色名单", "装备等级"],
      knowledge: ["装备只有手动穿上后才改变战斗", "换入不同角色可能改变战斗贡献"],
      behaviors: ["挑战可用关卡", "调整队伍", "手动装备物品"],
      failureMemories: [],
    },
    history: [],
  };
}

function normalizeState(raw) {
  const base = initialState(raw?.seed || "chapter-2");
  return {
    ...base,
    ...(raw || {}),
    cleared: raw?.cleared || {},
    attempts: raw?.attempts || {},
    failures: raw?.failures || {},
    inventory: raw?.inventory || [],
    roster: ROSTER.normalizeRoster(raw?.roster || base.roster),
    teamSlots: ROSTER.normalizeTeamSlots(raw?.teamSlots || base.teamSlots, raw?.roster || base.roster),
    flags: { ...base.flags, ...(raw?.flags || {}) },
    cognition: {
      ...base.cognition,
      ...(raw?.cognition || {}),
      concepts: raw?.cognition?.concepts || base.cognition.concepts,
      knowledge: raw?.cognition?.knowledge || base.cognition.knowledge,
      behaviors: raw?.cognition?.behaviors || base.cognition.behaviors,
      failureMemories: raw?.cognition?.failureMemories || [],
    },
    history: raw?.history || [],
  };
}

function observe(rawState) {
  const state = normalizeState(rawState);
  const visibleNodes = nodes.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    status: nodeStatus(state, item),
    rewardHint: rewardHintForNode(state, item),
    enemyHint: item.enemyHint,
    fieldEffect: fieldPublic(item.fieldEffectId),
  })).filter((item) => item.status !== "locked");
  const challengeActions = visibleNodes
    .filter((item) => ["available", "farmable", "repeatable"].includes(item.status))
    .map((item) => `challenge:${item.id}`);
  const activeIds = new Set(state.teamSlots);
  const reserveIds = state.roster.filter((unit) => !activeIds.has(unit.id)).map((unit) => unit.id);
  const swapActions = reserveIds.flatMap((heroId) => state.teamSlots.map((_, slotIndex) => `swap:${slotIndex}:${heroId}`));
  return {
    step: state.step,
    currentGoal: nextGoal(state),
    optionalOpportunities: [],
    team: ROSTER.teamLabel(state.roster, state.teamSlots),
    roster: state.roster.map((unit) => ({ id: unit.id, name: unit.name, role: unit.role, kind: unit.kind, note: unit.note })),
    gear: {
      score: gearScore(state),
      summary: EQUIPMENT.equipmentSummary(state.roster, state.teamSlots),
      active: ROSTER.activeUnits(state.roster, state.teamSlots).map((unit) => ({ name: unit.name, slots: Object.keys(unit.equipment || {}).length })),
    },
    cognition: state.cognition,
    visibleNodes,
    allowedActions: [...swapActions, ...challengeActions],
    lastEvent: state.history[0] || null,
  };
}

function nodeStatus(state, item) {
  if (state.cleared[item.id]) return item.type === "main" || item.type === "trial" ? "farmable" : item.type === "rescue" ? "repeatable" : "cleared";
  return item.requires.every((id) => state.cleared[id]) ? "available" : "locked";
}

function nextGoal(state) {
  if (!state.cleared.r2_entry) return "进入第二地区，观察更高等级装备";
  if (!state.flags.knightRescued || !state.flags.priestRescued) return "探索两条救援路线，取得新的完整英雄";
  if (!state.cleared.r2_shield_trial || !state.cleared.r2_flag_trial) return "根据场地规则调整一名角色并完成两项试炼";
  if (!state.cleared.r2_confluence) return "完成汇流战并取得第一件史诗装备";
  if (!state.cleared.r2_boss) return "用新角色、场地知识和装备击败双垒督军";
  return "第二地区已完成";
}

function applyAction(rawState, actionText, options = {}) {
  const state = normalizeState(structuredClone(rawState));
  const [kind, id, value] = String(actionText || "").split(":");
  if (kind === "swap") return applySwapAction(state, actionText, id, value);
  const item = nodesById[id];
  if (kind !== "challenge" || !item) return actionError(state, actionText, "未知行动");
  if (!["available", "farmable", "repeatable"].includes(nodeStatus(state, item))) return actionError(state, actionText, "该关卡当前不可挑战");

  state.step += 1;
  state.attempts[id] = (state.attempts[id] || 0) + 1;
  const combat = options.resolvedCombat ? normalizeResolvedCombat(options.resolvedCombat, item, 75) : resolveCombat(state, item);
  const event = {
    step: state.step,
    action: actionText,
    node: id,
    outcome: combat.win ? "win" : "loss",
    duration: combat.duration,
    survivors: { player: combat.metrics?.leftAlive || 0, enemy: combat.metrics?.rightAlive || 0 },
    teamSizes: {
      player: (combat.units || []).filter((unit) => unit.side === "left").length,
      enemy: (combat.units || []).filter((unit) => unit.side === "right").length,
    },
    hpScore: { player: combat.leftHp, enemy: combat.rightHp },
    gearBefore: gearScore(state),
    resolution: combat.resolution,
    fieldEffect: fieldPublic(item.fieldEffectId),
    contributions: (combat.units || []).filter((unit) => unit.side === "left")
      .map((unit) => ({ name: unit.name, role: unit.role, damage: unit.damageDone }))
      .sort((a, b) => b.damage - a.damage),
  };

  if (combat.win) settleWin(state, item, event);
  else settleLoss(state, item, event);
  if (state.flags.pendingTeamExperiment) {
    event.teamExperiment = { team: ROSTER.teamLabel(state.roster, state.teamSlots), outcome: event.outcome, node: id };
    state.flags.pendingTeamExperiment = false;
  }

  const analysis = options.captureVisibleSignals ? cognitionAnalysis(combat.signals, item, event, state.attempts[id]) : undefined;
  state.history.unshift(event);
  const output = { ok: true, state, observation: observe(state), event };
  if (analysis) output.analysis = analysis;
  return output;
}

function settleWin(state, item, event) {
  const firstClear = !state.cleared[item.id];
  state.cleared[item.id] = true;
  state.cognition.failureMemories.forEach((memory) => { if (memory.node === item.id) memory.resolved = true; });
  const repeatRescue = !firstClear && item.type === "rescue";
  const loot = repeatRescue ? [] : lootFor(state, item, firstClear);
  state.inventory.push(...loot);
  event.lootOpportunity = !repeatRescue;
  event.loot = loot.map((entry) => EQUIPMENT.publicItem(entry));
  event.gearAfter = gearScore(state);
  event.firstClear = firstClear;

  if (firstClear && item.id === "r2_knight_rescue") unlockHero(state, event, "knight", "白垒骑士");
  if (firstClear && item.id === "r2_priest_rescue") unlockHero(state, event, "priest", "晨祷牧师");
  if (state.flags.enrichedV1 && firstClear && item.id === "r2_entry") unlockHero(state, event, "warlock", "灰契术士");
  if (state.flags.enrichedV1 && firstClear && item.id === "r2_confluence") unlockHero(state, event, "alchemist", "星釜炼金师");
  if (firstClear && item.id === "r2_confluence") {
    state.flags.epicGranted = true;
    if (!state.cognition.concepts.includes("史诗品质")) state.cognition.concepts.push("史诗品质");
  }
  if (repeatRescue) event.reward = "复战胜利；角色首通奖励已经领取";
}

function settleLoss(state, item, event) {
  state.failures[item.id] = (state.failures[item.id] || 0) + 1;
  const memory = {
    node: item.id,
    attempt: state.failures[item.id],
    gearScore: gearScore(state),
    fieldEffect: item.fieldEffectId || "none",
    attributionPrompt: "只能使用已看到的场地信号、角色贡献与装备知识解释失败",
    wakeCondition: item.id === "r2_shield_trial"
      ? "换入能稳定制造护盾的角色，或取得可见装备提升后重试"
      : item.id === "r2_flag_trial"
        ? "换入能稳定承接守旗的角色，或取得可见装备提升后重试"
        : "获得可见装备提升或新的角色证据后重试",
  };
  state.cognition.failureMemories.unshift(memory);
  event.failureMemory = memory;
  event.lootOpportunity = false;
}

function unlockHero(state, event, rewardId, name) {
  state.roster = ROSTER.rescueHero(state.roster, rewardId);
  state.flags[`${rewardId}Rescued`] = true;
  event.characterUnlock = { id: rewardId, heroId: `hero_${rewardId}`, name };
  event.reward = `${name}加入角色名单，当前队伍没有自动改变`;
}

function applySwapAction(state, actionText, slotText, heroId) {
  const slotIndex = Number(slotText);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 3 || !state.roster.some((unit) => unit.id === heroId)) return actionError(state, actionText, "无效的队伍替换");
  const before = [...state.teamSlots];
  state.teamSlots = ROSTER.assignTeamSlot(state.roster, state.teamSlots, slotIndex, heroId);
  if (before.join("|") === state.teamSlots.join("|")) return actionError(state, actionText, "队伍没有变化");
  state.step += 1;
  state.flags.pendingTeamExperiment = true;
  const event = { step: state.step, action: actionText, outcome: "team_changed", teamBefore: before, teamAfter: [...state.teamSlots], gearAfter: gearScore(state) };
  state.history.unshift(event);
  return { ok: true, state, observation: observe(state), event };
}

function actionError(state, action, reason) {
  return { ok: false, state, observation: observe(state), error: { action, reason } };
}

function resolveCombat(state, item) {
  const result = COMBAT_SIM.simulateTeams(playerTeam(state), enemyTeam(item, state), {
    seed: `chapter2|${item.id}|${state.attempts[item.id] || 0}|${gearScore(state)}|${state.seed}`,
    randomizeStats: false,
    fieldEffectId: item.fieldEffectId || "",
    maxTime: 75,
  });
  const leftAlive = result.metrics?.leftAlive || 0;
  const rightAlive = result.metrics?.rightAlive || 0;
  const resolution = result.duration >= 74.8 && leftAlive > 0 && rightAlive > 0 ? "time_limit" : "elimination";
  return { ...result, win: result.winner === "left" && !(item.type === "boss" && resolution === "time_limit"), resolution };
}

function normalizeResolvedCombat(raw, item, maxTime) {
  const units = Array.isArray(raw?.units) ? raw.units : [];
  const leftAlive = Number(raw?.metrics?.leftAlive ?? units.filter((unit) => unit.side === "left" && unit.alive !== false && Number(unit.hp || 0) > 0).length);
  const rightAlive = Number(raw?.metrics?.rightAlive ?? units.filter((unit) => unit.side === "right" && unit.alive !== false && Number(unit.hp || 0) > 0).length);
  const duration = Number(raw?.duration || 0);
  const resolution = duration >= maxTime - 0.2 && leftAlive > 0 && rightAlive > 0 ? "time_limit" : "elimination";
  return {
    ...(raw || {}),
    metrics: { ...(raw?.metrics || {}), leftAlive, rightAlive },
    leftHp: Number(raw?.leftHp || 0),
    rightHp: Number(raw?.rightHp || 0),
    units,
    signals: raw?.signals || [],
    duration,
    resolution,
    win: raw?.winner === "left" && !(item.type === "boss" && resolution === "time_limit"),
  };
}

function playerTeam(state) {
  return ROSTER.buildTeam(state.roster, state.teamSlots, 1);
}

function enemyTeam(item, state = null) {
  const rolesByNode = {
    r2_entry: ["warrior", "ranger", "mage"],
    r2_knight_rescue: ["knight", "warrior", "ranger", "mage"],
    r2_priest_rescue: ["warrior", "berserker", "mage", "ranger"],
    r2_shield_trial: ["knight", "warrior", "mage", "priest"],
    r2_flag_trial: ["knight", "warrior", "priest", "ranger"],
    r2_confluence: ["knight", "berserker", "ranger", "bard"],
    r2_boss: ["knight", "berserker", "ranger", "bard"],
  };
  const scaleByNode = {
    r2_entry: 0.92,
    r2_knight_rescue: 1.02,
    r2_priest_rescue: 1.01,
    r2_shield_trial: 1.42,
    r2_flag_trial: 1.15,
    r2_confluence: 1.22,
    r2_boss: 1.32,
  };
  const enrichedScale = state?.flags?.enrichedV1 && item.id === "r2_confluence"
    ? 1.12
    : state?.flags?.enrichedV1 && item.id === "r2_boss"
      ? 1.08
      : 1;
  return (rolesByNode[item.id] || ["warrior", "ranger", "mage", "priest"])
    .map((role, index) => scaleSpec(enemySpec(role, index, item), (scaleByNode[item.id] || 1) * enrichedScale))
    .map((spec, index) => tuneEncounterUnit(spec, item, index));
}

function tuneEncounterUnit(spec, item, index) {
  if (item.id !== "r2_shield_trial") return spec;
  const next = { ...spec };
  next.armor = Math.max(0, Math.round(next.armor * 1.15));
  if (index < 2) {
    next.name = `裂纹${next.name}`;
    next.hp = Math.max(1, Math.round(next.hp * 0.94));
    next.maxHp = next.hp;
    return next;
  }
  next.power = Math.max(1, Math.round(next.power * 1.05));
  next.physicalPower = Math.max(1, Math.round(next.physicalPower * 1.05));
  next.magicPower = Math.max(1, Math.round(next.magicPower * 1.05));
  return next;
}

function enemySpec(role, index, item) {
  const base = {
    warrior: { name: "边垒斧卫", hp: 300, physicalPower: 34, magicPower: 8, armor: 12, range: 13 },
    knight: { name: "断旗重骑", hp: 360, physicalPower: 27, magicPower: 8, armor: 16, range: 11 },
    berserker: { name: "钟院狂徒", hp: 315, physicalPower: 39, magicPower: 8, armor: 7, range: 12 },
    ranger: { name: "高台弩手", hp: 225, physicalPower: 38, magicPower: 8, armor: 6, range: 40 },
    mage: { name: "裂响术士", hp: 205, physicalPower: 7, magicPower: 39, armor: 5, range: 39 },
    priest: { name: "垒墙医官", hp: 235, physicalPower: 6, magicPower: 27, armor: 6, range: 36 },
    bard: { name: "行军鼓手", hp: 230, physicalPower: 8, magicPower: 31, armor: 6, range: 35 },
  }[role];
  const kit = SKILL_DATA.roleKits[role]?.kit || {};
  return {
    ...base,
    hp: base.hp,
    maxHp: base.hp,
    power: Math.max(base.physicalPower, base.magicPower),
    name: `${base.name}${index + 1}`,
    role,
    roleKey: role,
    roleName: base.name,
    small1: kit.small1,
    small2: kit.small2,
    passive: item.type === "main" && item.id === "r2_entry" ? "enemyDormantPassive" : kit.passive,
    ultimate: item.type === "boss" || item.type === "trial" ? kit.ultimate : "enemyNoop",
    slotIndex: index,
  };
}

function scaleSpec(spec, mult) {
  const hp = Math.max(1, Math.round(spec.hp * mult));
  return {
    ...spec,
    hp,
    maxHp: hp,
    power: Math.max(1, Math.round(spec.power * mult)),
    physicalPower: Math.max(1, Math.round(spec.physicalPower * mult)),
    magicPower: Math.max(1, Math.round(spec.magicPower * mult)),
    armor: Math.max(0, Math.round(spec.armor * (0.85 + mult * 0.15))),
  };
}

function lootFor(state, item, firstClear) {
  if (firstClear && item.id === "r2_entry") return [fixedHighLevelCommon("r2_level_lesson")];
  if (firstClear && item.id === "r2_confluence") return [fixedEpic("r2_first_epic")];
  const seed = state.flags.enrichedV1
    ? `${state.seed}|${item.id}|${state.attempts[item.id]}`
    : `${state.seed}|${item.id}|${state.attempts[item.id]}|${state.inventory.length}`;
  return EQUIPMENT.generateItems(dropRuleForNode(state, item), seed, `${item.id}_${state.attempts[item.id]}`);
}

function dropRuleForNode(state, item) {
  if (!state.flags.enrichedV1) {
    const regular = {
      rescue: { level: [20, 25], rates: { common: 0.62, rare: 0.38 }, count: 2 },
      trial: { level: [22, 27], rates: { common: 0.48, rare: 0.52 }, count: 2 },
      main: { level: [21, 27], rates: { common: 0.55, rare: 0.45 }, count: 2 },
      boss: { level: [25, 30], rates: { common: 0.28, rare: 0.62, epic: 0.1 }, count: 4 },
    };
    return regular[item.type] || regular.main;
  }
  const enriched = {
    rescue: { level: [20, 25], rates: { common: 0.36, rare: 0.32, epic: 0.19, legendary: 0.12, mythic: 0.01 }, count: 2 },
    trial: { level: [22, 27], rates: { common: 0.28, rare: 0.32, epic: 0.23, legendary: 0.16, mythic: 0.01 }, count: 2 },
    main: { level: [21, 27], rates: { common: 0.3, rare: 0.32, epic: 0.22, legendary: 0.15, mythic: 0.01 }, count: 2 },
    boss: { level: [25, 30], rates: { common: 0.16, rare: 0.25, epic: 0.28, legendary: 0.3, mythic: 0.01 }, count: 4 },
  };
  return enriched[item.type] || enriched.main;
}

function rewardHintForNode(state, item) {
  return state.flags.enrichedV1 ? `${item.rewardHint}；装备池含极低概率神话品质` : item.rewardHint;
}

function fixedHighLevelCommon(id) {
  return {
    id,
    slot: "weapon",
    slotLabel: "武器",
    equipmentLevel: 22,
    rarity: "common",
    rarityLabel: "普通",
    name: "普通武器 Lv.22",
    baseStats: { physicalPower: 11 },
    affixes: [{ id: "might", stat: "might", label: "武力", category: "major", level: 1, value: 2 }],
  };
}

function fixedEpic(id) {
  return {
    id,
    slot: "charm",
    slotLabel: "护符",
    equipmentLevel: 24,
    rarity: "epic",
    rarityLabel: "史诗",
    name: "史诗火印护符 Lv.24",
    baseStats: { magicPower: 12 },
    affixes: [
      { id: "arcana", stat: "arcana", label: "奥术", category: "major", level: 1, value: 2 },
      { id: "rhythm", stat: "rhythm", label: "节律", category: "major", level: 1, value: 2 },
      { id: "fireAmp", stat: "fireAmp", label: "火焰增幅", category: "archetype", level: 1, value: 2 },
      { id: "critChance", stat: "critChance", label: "暴击率", category: "specialist", level: 1, value: 2 },
    ],
  };
}

function equipChapterOneBaseline(roster) {
  const next = roster.map((unit) => ({ ...unit, equipment: { ...(unit.equipment || {}) } }));
  const items = {
    hero_warrior: baselineItem("r2_start_warrior", "weapon", "武器", "rare", "稀有", 14, { physicalPower: 7 }, "might", "武力", 2),
    hero_mage: baselineItem("r2_start_mage", "weapon", "武器", "rare", "稀有", 14, { magicPower: 7 }, "arcana", "奥术", 2),
    hero_ranger: baselineItem("r2_start_ranger", "gloves", "护手", "rare", "稀有", 14, { physicalPower: 7, armor: 1 }, "markPower", "标记强度", 3),
  };
  for (const unit of next) {
    const item = items[unit.id];
    if (item) unit.equipment[item.slot] = item;
  }
  return next;
}

function baselineItem(id, slot, slotLabel, rarity, rarityLabel, equipmentLevel, baseStats, stat, label, value) {
  return { id, slot, slotLabel, rarity, rarityLabel, equipmentLevel, name: `${rarityLabel}${slotLabel} Lv.${equipmentLevel}`, baseStats, affixes: [{ id: stat, stat, label, category: "major", level: 1, value }] };
}

function fieldPublic(id) {
  const rows = {
    shield_detonation: { id, name: "护盾爆裂", rule: "双方护盾超过阈值时会爆炸、清空并伤害周围敌人" },
    king_flag: { id, name: "王旗落地", rule: "双方前排守旗；守旗者阵亡后队友获得反扑窗口" },
  };
  return rows[id] || null;
}

function gearScore(state) {
  return EQUIPMENT.teamEquipmentScore(state.roster, state.teamSlots);
}

function cognitionAnalysis(signals, item, event, attempt) {
  return {
    schema: "map_cognition_analysis_v1",
    step: event.step,
    action: event.action,
    node: { id: item.id, type: item.type, attempt: Number(attempt || 0), fieldEffect: item.fieldEffectId || "none" },
    combatSignals: cognitionSignalLog(signals, item, attempt),
    healthSnapshots: cognitionHealthSnapshots(signals),
    settlement: {
      outcome: event.outcome,
      resolution: event.resolution,
      duration: event.duration,
      survivors: event.survivors,
      hpScore: event.hpScore,
      firstClear: Boolean(event.firstClear),
      loot: event.loot || [],
      reward: event.reward || "",
      gearBefore: event.gearBefore,
      gearAfter: event.gearAfter ?? event.gearBefore,
      gearDelta: (event.gearAfter ?? event.gearBefore) - event.gearBefore,
      failureMemory: event.failureMemory || null,
    },
  };
}

function cognitionSignalLog(signals, item, attempt) {
  return (signals || []).map((signal, index) => ({ signal, index, presentation: SIGNAL_PRESENTATION.describePresentation(signal) }))
    .filter((entry) => entry.presentation.visible)
    .map(({ signal, index, presentation }) => ({
      id: `${item.id}:attempt:${Number(attempt || 0)}:combat:${index + 1}`,
      sequence: index + 1,
      time: round(signal.time),
      type: signal.kind,
      subject: unitRef(signal.source),
      environment: { region: "region_2", node: item.id, nodeType: item.type, phase: "combat", fieldEffect: item.fieldEffectId || "none" },
      behavior: {
        kind: signal.kind === "field" ? "field_effect" : signal.kind === "skill" ? "skill_cast" : signal.skillKey ? "skill_effect" : signal.kind,
        key: signal.kind === "field" ? `field:${signal.text || signal.skillName || "effect"}` : signal.skillKey || signal.kind,
        name: signal.text || signal.skillName || "",
        tags: [...(signal.tags || [])],
      },
      result: {
        kind: signal.kind === "field" ? "field_effect" : signal.kind,
        amount: round(signal.amount || 0),
        target: unitRef(signal.target),
        hpBefore: Number.isFinite(signal.hpBefore) ? round(signal.hpBefore) : null,
        hpAfter: Number.isFinite(signal.hpAfter) ? round(signal.hpAfter) : null,
        occurred: true,
        meta: { ...(signal.meta || {}) },
      },
      presentation,
    }));
}

function cognitionHealthSnapshots(signals) {
  return (signals || [])
    .filter((signal) => signal.kind === "health")
    .map((signal, index) => ({
      sequence: index + 1,
      time: round(signal.time),
      target: unitRef(signal.target),
      hp: Number.isFinite(signal.hp) ? round(signal.hp) : null,
      maxHp: Number.isFinite(signal.maxHp) ? round(signal.maxHp) : null,
    }))
    .filter((row) => row.target && row.hp != null && row.maxHp > 0);
}

function unitRef(unit) {
  if (!unit) return null;
  return { id: unit.id || "", name: unit.name || "", side: unit.side || "", role: unit.role || "" };
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

return { nodes, initialState, normalizeState, observe, applyAction, resolveCombat, playerTeam, enemyTeam, gearScore, lootFor, dropRuleForNode, fieldPublic };
});
