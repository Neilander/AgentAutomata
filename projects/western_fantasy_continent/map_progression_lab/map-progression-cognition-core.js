(function initMapProgressionCognitionCore(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM,
    typeof module !== "undefined" ? require("../game_data/skill-data") : root.GAME_SKILL_DATA,
    typeof module !== "undefined" ? require("./map-progression-roster") : root.GAME_MAP_PROGRESSION_ROSTER,
    typeof module !== "undefined" ? require("../game_data/equipment-runtime") : root.GAME_EQUIPMENT_RUNTIME,
  );
  if (typeof module !== "undefined") module.exports = value;
  else root.GAME_MAP_PROGRESSION_COGNITION = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore(COMBAT_SIM, SKILL_DATA, ROSTER, EQUIPMENT) {

  const nodes = makeNodes();
  const nodesById = Object.fromEntries(nodes.map((item) => [item.id, item]));
  function makeNodes() {
    const result = [];
    for (let index = 1; index <= 10; index += 1) {
      let requires = index === 1 ? [] : [`r1_main_${index - 1}`];
      if (index === 6) requires = ["r1_main_5", "r1_prison"];
      result.push({
        id: `r1_main_${index}`,
        name: `灰带郊野 ${index}`,
        type: "main",
        requires,
        rewardHint: index % 3 === 0 ? "可能出现蓝装" : "白装",
        enemyHint: index === 7 ? "重盾前排与后排支援" : index <= 3 ? "两名近战和一名远程" : index <= 6 ? "近战、远程与治疗" : "完整四人敌队",
      });
    }
    result.push(
      {
        id: "r1_bandit",
        name: "旧塔军械营地",
        type: "branch",
        requires: ["r1_main_5"],
        rewardHint: "较高等级装备，可能出现蓝装",
        enemyHint: "重甲前排、战士、游侠和法师",
      },
      {
        id: "r1_prison",
        name: "旧塔监狱",
        type: "branch",
        requires: ["r1_main_3"],
        rewardHint: "营救一名新角色",
        enemyHint: "战士、重甲前排和两名游侠",
      },
      {
        id: "r1_boss",
        name: "灰带首领",
        type: "boss",
        requires: ["r1_main_10"],
        rewardHint: "高品质装备与地区通关",
        enemyHint: "完整首领队伍",
      },
    );
    return result;
  }

  function initialState(seed = "player") {
    return {
      schema: "map_cognition_session_v1",
      seed,
      step: 0,
      cleared: {},
      attempts: {},
      failures: {},
      inventory: [],
      equipped: {},
      roster: ROSTER.createInitialRoster(),
      teamSlots: [...ROSTER.INITIAL_TEAM_SLOTS],
      flags: { prisonFailed: false, rangerRescued: false, pendingTeamExperiment: false },
      cognition: {
        concepts: ["关卡", "战斗", "装备", "战力", "监狱", "营地"],
        knowledge: ["胜利可以推进地图", "装备能够提高队伍强度", "监狱里可能关着新角色"],
        behaviors: ["挑战可用关卡", "查看奖励提示"],
        failureMemories: [],
      },
      history: [],
    };
  }

  function normalizeState(raw) {
    const base = initialState(raw?.seed || "player");
    return {
      ...base,
      ...(raw || {}),
      cleared: raw?.cleared || {},
      attempts: raw?.attempts || {},
      failures: raw?.failures || {},
      inventory: raw?.inventory || [],
      equipped: raw?.equipped || {},
      roster: ROSTER.normalizeRoster(raw?.roster),
      teamSlots: ROSTER.normalizeTeamSlots(raw?.teamSlots, raw?.roster),
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

  function nodeStatus(state, item) {
    if (state.cleared[item.id]) return item.type === "main" ? "farmable" : "cleared";
    if (item.id === "r1_bandit" && state.cleared.r1_main_5 && !state.flags.prisonFailed && !state.cleared.r1_prison) return "preview";
    if ((item.requires || []).every((id) => state.cleared[id])) return "available";
    return "locked";
  }

  function observe(rawState) {
    const state = normalizeState(rawState);
    const visibleNodes = nodes
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: nodeStatus(state, item),
        rewardHint: item.rewardHint,
        enemyHint: item.enemyHint,
      }))
      .filter((item) => item.status !== "locked");
    const challengeActions = visibleNodes.filter((item) => ["available", "farmable"].includes(item.status)).map((item) => `challenge:${item.id}`);
    const activeIds = new Set(state.teamSlots);
    const reserveIds = state.roster.filter((unit) => !activeIds.has(unit.id)).map((unit) => unit.id);
    const swapActions = state.flags.rangerRescued
      ? reserveIds.flatMap((heroId) => state.teamSlots.map((_, slotIndex) => `swap:${slotIndex}:${heroId}`))
      : [];
    return {
      step: state.step,
      currentGoal: state.cleared.r1_boss ? "第一地区已完成" : nextGoal(state),
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

  function nextGoal(state) {
    if (!state.cleared.r1_main_3) return "继续推进灰带郊野";
    if (state.cleared.r1_prison && !state.teamSlots.includes("hero_ranger")) return "决定是否让新救出的游侠出战";
    if (state.cleared.r1_prison) {
      if (!state.cleared.r1_main_10) return "带着新队伍继续推进";
      const bossFailure = state.cognition.failureMemories.find((memory) => memory.node === "r1_boss" && !memory.resolved);
      if (bossFailure && gearScore(state) <= bossFailure.gearScore) return "刷取最近主线，获得可见装备提升后再挑战首领";
      return "击败地区首领";
    }
    if (!state.flags.prisonFailed && !state.cleared.r1_prison) return "监狱中有一名可营救角色";
    if (!state.cleared.r1_main_5) return "继续推进，寻找更好的装备来源";
    if (!state.cleared.r1_bandit) return "军械营地可能提供攻坚装备";
    if (!state.cleared.r1_prison) return "再次挑战监狱";
    if (!state.cleared.r1_main_10) return "带着新队伍继续推进";
    const bossFailure = state.cognition.failureMemories.find((memory) => memory.node === "r1_boss" && !memory.resolved);
    if (bossFailure && gearScore(state) <= bossFailure.gearScore) return "刷取最近主线，获得可见装备提升后再挑战首领";
    return "击败地区首领";
  }

  function applyAction(rawState, actionText) {
    const state = normalizeState(structuredClone(rawState));
    const [kind, id, value] = String(actionText || "").split(":");
    if (kind === "swap") return applySwapAction(state, actionText, id, value);
    if (kind !== "challenge" || !nodesById[id]) return actionError(state, actionText, "未知行动");
    const item = nodesById[id];
    if (!["available", "farmable"].includes(nodeStatus(state, item))) return actionError(state, actionText, "该关卡当前不可挑战");

    state.step += 1;
    state.attempts[id] = (state.attempts[id] || 0) + 1;
    const combat = resolveCombat(state, item);
    const event = {
      step: state.step,
      action: actionText,
      node: id,
      outcome: combat.win ? "win" : "loss",
      duration: combat.duration,
      survivors: { player: combat.metrics?.leftAlive || 0, enemy: combat.metrics?.rightAlive || 0 },
      hpScore: { player: combat.leftHp, enemy: combat.rightHp },
      gearBefore: gearScore(state),
      resolution: combat.resolution,
      contributions: (combat.units || []).filter((unit) => unit.side === "left").map((unit) => ({ name: unit.name, role: unit.role, damage: unit.damageDone })).sort((a, b) => b.damage - a.damage),
    };

    if (combat.win) {
      const firstClear = !state.cleared[id];
      state.cleared[id] = true;
      state.cognition.failureMemories.forEach((memory) => {
        if (memory.node === id) memory.resolved = true;
      });
      const loot = rollLoot(state, item);
      state.inventory.push(...loot);
      autoEquip(state);
      event.loot = loot.map(publicLoot);
      event.gearAfter = gearScore(state);
      event.firstClear = firstClear;
      if (id === "r1_prison") {
        state.flags.rangerRescued = true;
        state.roster = ROSTER.rescueHero(state.roster, "ranger");
        if (!state.cognition.concepts.includes("角色名单")) state.cognition.concepts.push("角色名单");
        if (!state.cognition.behaviors.includes("调整队伍")) state.cognition.behaviors.push("调整队伍");
        event.reward = "营救游侠；游侠加入角色名单，当前队伍没有自动改变";
      }
      learn(state, "掉落", "胜利后获得的装备会自动换上更强的部件", "观察装备变化");
    } else {
      state.failures[id] = (state.failures[id] || 0) + 1;
      if (id === "r1_prison") state.flags.prisonFailed = true;
      const memory = {
        node: id,
        attempt: state.failures[id],
        gearScore: gearScore(state),
        attributionPrompt: "只能使用当前已知概念解释失败",
        wakeCondition: id === "r1_prison" && !state.cleared.r1_bandit
          ? "继续推进到主线 5，完成一次性军械营地后再尝试"
          : "发生可见的装备提升或学会新的队伍知识后再尝试",
      };
      state.cognition.failureMemories.unshift(memory);
      event.failureMemory = memory;
    }
    if (state.flags.pendingTeamExperiment) {
      learn(state, "角色搭配", "亲自更换出战角色会改变真实战斗结果", "根据战斗结果继续调整队伍");
      event.teamExperiment = { team: ROSTER.teamLabel(state.roster, state.teamSlots), outcome: event.outcome, node: id };
      state.flags.pendingTeamExperiment = false;
    }
    if (id === "r1_main_7" && state.teamSlots.includes("hero_ranger") && combat.win) {
      const ranger = event.contributions.find((unit) => unit.name === "林地游侠");
      const totalDamage = event.contributions.reduce((sum, unit) => sum + (unit.damage || 0), 0);
      const share = totalDamage ? (ranger?.damage || 0) / totalDamage : 0;
      if (share >= 0.22) {
        learn(state, "角色观察", `林地游侠在本次重盾战贡献了${Math.round(share * 100)}%伤害`, "在相似重盾关继续观察游侠");
        event.roleProof = { rangerDamageShare: Math.round(share * 1000) / 1000, evidence: "本次战斗伤害占比" };
      }
    }
    state.history.unshift(event);
    return { ok: true, state, observation: observe(state), event };
  }

  function applySwapAction(state, actionText, slotText, heroId) {
    if (!state.flags.rangerRescued) return actionError(state, actionText, "尚未开放队伍整备");
    const slotIndex = Number(slotText);
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 3 || !state.roster.some((unit) => unit.id === heroId)) return actionError(state, actionText, "无效的队伍替换");
    const before = [...state.teamSlots];
    state.teamSlots = ROSTER.assignTeamSlot(state.roster, state.teamSlots, slotIndex, heroId);
    if (before.join("|") === state.teamSlots.join("|")) return actionError(state, actionText, "队伍没有变化");
    const equipResult = EQUIPMENT.autoEquip(state.roster, state.teamSlots, state.inventory);
    state.roster = equipResult.roster;
    state.inventory = equipResult.inventory;
    state.step += 1;
    state.flags.pendingTeamExperiment = true;
    const event = { step: state.step, action: actionText, outcome: "team_changed", teamBefore: before, teamAfter: [...state.teamSlots], gearAfter: gearScore(state) };
    state.history.unshift(event);
    return { ok: true, state, observation: observe(state), event };
  }

  function actionError(state, action, reason) {
    return { ok: false, state, observation: observe(state), error: { action, reason } };
  }

  function learn(state, concept, knowledge, behavior) {
    if (!state.cognition.concepts.includes(concept)) state.cognition.concepts.push(concept);
    if (!state.cognition.knowledge.includes(knowledge)) state.cognition.knowledge.push(knowledge);
    if (!state.cognition.behaviors.includes(behavior)) state.cognition.behaviors.push(behavior);
  }

  function resolveCombat(state, item) {
    const leftTeam = playerTeam(state);
    const rightTeam = enemyTeam(item);
    const result = COMBAT_SIM.simulateTeams(leftTeam, rightTeam, {
      seed: `map-node|${item.id}|${state.attempts[item.id] || 0}|${gearScore(state)}|${state.seed}`,
      randomizeStats: false,
      fieldEffectId: fieldEffect(item),
      maxTime: 70,
    });
    const leftAlive = result.metrics?.leftAlive || 0;
    const rightAlive = result.metrics?.rightAlive || 0;
    const resolution = result.duration >= 69.8 && leftAlive > 0 && rightAlive > 0 ? "time_limit" : "elimination";
    return {
      ...result,
      win: result.winner === "left" && !(item.type === "boss" && resolution === "time_limit"),
      resolution,
    };
  }

  function playerTeam(state) {
    return ROSTER.buildTeam(state.roster, state.teamSlots, 1);
  }

  function enemyTeam(item) {
    if (item.id === "r1_prison") return prisonMilitiaTeam();
    const roles = enemyRoles(item);
    const mult = enemyScale(item);
    return roles.map((role, index) => scaleSpec(enemySpec(role, index, item), mult));
  }

  function enemyRoles(item) {
    if (item.type === "boss") return ["knight", "warrior", "mage", "priest"];
    if (item.id.includes("bandit")) return ["knight", "warrior", "ranger", "mage"];
    if (item.id.includes("prison")) return ["warrior", "knight", "ranger", "ranger"];
    const mainNo = Number(item.id.split("_").pop() || 1);
    if (mainNo <= 3) return ["warrior", "warrior", "ranger"];
    if (mainNo <= 6) return ["warrior", "warrior", "ranger", "priest"];
    return ["knight", "warrior", "ranger", "mage"];
  }

  function enemyScale(item) {
    const mainNo = item.type === "main" ? Number(item.id.split("_").pop() || 1) : 7;
    const typeBonus = { main: 0, branch: 0.28, boss: 0.62 }[item.type] || 0;
    const prisonBump = item.id.includes("prison") ? 0.24 : 0;
    const scale = 0.62 + mainNo * 0.055 + typeBonus + prisonBump;
    if (item.type === "boss") return scale * 1.22;
    return item.id.includes("prison") ? scale * 2.05 : scale;
  }

  function enemySpec(role, index, item) {
    const base = {
      warrior: { name: "盗匪盾手", hp: 230, power: 24, physicalPower: 26, magicPower: 8, armor: 10, range: 13 },
      knight: { name: "重甲盗匪", hp: 310, power: 22, physicalPower: 22, magicPower: 8, armor: 18, range: 12 },
      ranger: { name: "路匪弓手", hp: 150, power: 24, physicalPower: 27, magicPower: 8, armor: 4, range: 42 },
      mage: { name: "火把学徒", hp: 135, power: 8, physicalPower: 6, magicPower: 34, armor: 3, range: 42 },
      priest: { name: "草药匪徒", hp: 165, power: 8, physicalPower: 6, magicPower: 22, armor: 4, range: 38 },
    }[role];
    const kit = roleKit(role);
    const fullKit = item.type === "boss" || item.id.includes("prison");
    const passiveKit = fullKit || item.id.includes("bandit");
    return {
      ...base,
      ...kit,
      name: `${base.name}${index + 1}`,
      role,
      roleKey: role,
      roleName: base.name,
      maxHp: base.hp,
      passive: passiveKit ? kit.passive : "enemyDormantPassive",
      ultimate: fullKit ? kit.ultimate : "enemyNoop",
      slotIndex: index,
    };
  }

  function withRoleKit(unit) {
    return { ...roleKit(unit.role), ...unit, roleKey: unit.role, roleName: unit.name };
  }

  function roleKit(role) {
    const kit = SKILL_DATA?.roleKits?.[role]?.kit || {};
    return { small1: kit.small1, small2: kit.small2, passive: kit.passive, ultimate: kit.ultimate };
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

  function fieldEffect(item) {
    if (item.id.includes("prison")) return "sentry_suppression";
    if (item.id.includes("bandit")) return "heavy_shield_line";
    if (item.id === "r1_main_7") return "heavy_shield_line";
    if (item.type === "boss") return "pressure_corridor";
    return "";
  }

  function rollLoot(state, item) {
    const rule = dropRuleForNode(item);
    return EQUIPMENT.generateItems(rule, `${state.seed}|${item.id}|${state.attempts[item.id]}|${state.inventory.length}`, `${item.id}_${state.attempts[item.id]}`);
  }

  function autoEquip(state) {
    const result = EQUIPMENT.autoEquip(state.roster, state.teamSlots, state.inventory);
    state.roster = result.roster;
    state.inventory = result.inventory;
  }

  function gearScore(state) {
    return EQUIPMENT.teamEquipmentScore(state.roster, state.teamSlots);
  }

  function dropRuleForNode(item) {
    if (item.id === "r1_bandit") return { level: [10, 16], rates: { common: 0.4, rare: 0.58, epic: 0.02 }, count: 2 };
    if (item.id === "r1_prison") return { level: [9, 15], rates: { common: 0.55, rare: 0.43, epic: 0.02 }, count: 2 };
    if (item.type === "boss") return { level: [14, 22], rates: { common: 0.3, rare: 0.65, epic: 0.05 }, count: 4 };
    const mainNo = Number(item.id.split("_").pop() || 1);
    if (mainNo <= 2) return { level: [1, 4], rates: { common: 0.98, rare: 0.02 }, count: 2 };
    if (mainNo <= 4) return { level: [3, 7], rates: { common: 0.94, rare: 0.06 }, count: 2 };
    if (mainNo <= 6) return { level: [5, 10], rates: { common: 0.9, rare: 0.1 }, count: 2 };
    if (mainNo <= 8) return { level: [7, 12], rates: { common: 0.86, rare: 0.14 }, count: 2 };
    return { level: [9, 15], rates: { common: 0.82, rare: 0.17, epic: 0.01 }, count: 2 };
  }

  function publicLoot(item) {
    return EQUIPMENT.publicItem(item);
  }

  function seededRandom(seedText) {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i += 1) {
      seed ^= seedText.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }
    return () => {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function prisonMilitiaTeam() {
    const noop = "enemyNoop";
    const dormant = "enemyDormantPassive";
    const scale = 3.2;
    const units = [
      { name: "狱门盾兵", role: "warrior", hp: 300, physicalPower: 8, magicPower: 8, armor: 9, range: 12, small1: "heal" },
      { name: "狱卒弓兵1", role: "ranger", hp: 155, physicalPower: 18, magicPower: 8, armor: 3, range: 42, small1: "markShot" },
      { name: "狱卒弓兵2", role: "ranger", hp: 155, physicalPower: 18, magicPower: 8, armor: 3, range: 42, small1: "markShot" },
      { name: "狱医", role: "priest", hp: 150, physicalPower: 6, magicPower: 18, armor: 3, range: 36, small1: "heal" },
    ];
    return units.map((unit, slotIndex) => scaleSpec({ ...unit, power: Math.max(unit.physicalPower, unit.magicPower), small2: noop, passive: dormant, ultimate: noop, slotIndex }, scale));
  }

  return {
    nodes,
    initialState,
    normalizeState,
    observe,
    applyAction,
    resolveCombat,
    playerTeam,
    enemyTeam,
    gearScore,
  };
});
