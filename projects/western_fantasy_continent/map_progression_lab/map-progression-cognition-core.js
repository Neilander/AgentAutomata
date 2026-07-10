(function initMapProgressionCognitionCore(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM,
    typeof module !== "undefined" ? require("../game_data/skill-data") : root.GAME_SKILL_DATA,
  );
  if (typeof module !== "undefined") module.exports = value;
  else root.GAME_MAP_PROGRESSION_COGNITION = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore(COMBAT_SIM, SKILL_DATA) {
  const rarityTable = {
    common: { name: "白装", score: 1, mult: 1 },
    blue: { name: "蓝装", score: 2, mult: 1.55 },
    rare: { name: "稀有", score: 3, mult: 2.35 },
    epic: { name: "紫装", score: 5, mult: 3.8 },
  };

  const dropRules = {
    main: { level: [1, 8], rates: { common: 0.82, blue: 0.17, rare: 0.01, epic: 0 }, count: 2 },
    branch: { level: [5, 12], rates: { common: 0.62, blue: 0.32, rare: 0.06, epic: 0 }, count: 3 },
    boss: { level: [10, 16], rates: { common: 0.5, blue: 0.38, rare: 0.1, epic: 0.02 }, count: 4 },
  };

  const nodes = makeNodes();
  const nodesById = Object.fromEntries(nodes.map((item) => [item.id, item]));
  const gearSlots = ["weapon", "armor", "focus", "boots"];

  function makeNodes() {
    const result = [];
    for (let index = 1; index <= 10; index += 1) {
      let requires = index === 1 ? [] : [`r1_main_${index - 1}`];
      if (index === 5) requires = ["r1_prison"];
      result.push({
        id: `r1_main_${index}`,
        name: `灰带郊野 ${index}`,
        type: "main",
        requires,
        rewardHint: index % 3 === 0 ? "可能出现蓝装" : "白装",
        enemyHint: index <= 3 ? "两名近战和一名远程" : index <= 6 ? "近战、远程与治疗" : "完整四人敌队",
      });
    }
    result.push(
      {
        id: "r1_bandit",
        name: "旧塔军械营地",
        type: "branch",
        requires: ["r1_main_4"],
        rewardHint: "较高等级装备，可能出现蓝装",
        enemyHint: "重甲前排、战士、游侠和法师",
      },
      {
        id: "r1_prison",
        name: "旧塔监狱",
        type: "branch",
        requires: ["r1_main_4"],
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
      flags: { prisonFailed: false, rangerRescued: false },
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
    if (item.id === "r1_bandit" && state.cleared.r1_main_4 && !state.flags.prisonFailed && !state.cleared.r1_prison) return "preview";
    if (item.id === "r1_prison" && state.flags.prisonFailed && !state.cleared.r1_bandit) return "waiting_for_camp";
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
    return {
      step: state.step,
      currentGoal: state.cleared.r1_boss ? "第一地区已完成" : nextGoal(state),
      team: state.flags.rangerRescued ? "骑士、狂战士、游侠、牧师" : "骑士、狂战士、法师、牧师",
      gear: {
        score: gearScore(state),
        equipped: gearSlots.map((slot) => state.equipped[slot] ? publicLoot(state.equipped[slot]) : { slot, empty: true }),
      },
      cognition: state.cognition,
      visibleNodes,
      allowedActions: visibleNodes.filter((item) => ["available", "farmable"].includes(item.status)).map((item) => `challenge:${item.id}`),
      lastEvent: state.history[0] || null,
    };
  }

  function nextGoal(state) {
    if (!state.cleared.r1_main_4) return "继续推进灰带郊野";
    if (state.cleared.r1_prison) return state.cleared.r1_main_10 ? "击败地区首领" : "带着新队伍继续推进";
    if (!state.flags.prisonFailed && !state.cleared.r1_prison) return "监狱中有一名可营救角色";
    if (!state.cleared.r1_bandit) return "寻找能帮助再次挑战监狱的办法";
    if (!state.cleared.r1_prison) return "再次挑战监狱";
    if (!state.cleared.r1_main_10) return "带着新队伍继续推进";
    return "击败地区首领";
  }

  function applyAction(rawState, actionText) {
    const state = normalizeState(structuredClone(rawState));
    const [kind, id] = String(actionText || "").split(":");
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
    };

    if (combat.win) {
      const firstClear = !state.cleared[id];
      state.cleared[id] = true;
      const loot = rollLoot(state, item);
      state.inventory.push(...loot);
      autoEquip(state);
      event.loot = loot.map(publicLoot);
      event.gearAfter = gearScore(state);
      event.firstClear = firstClear;
      if (id === "r1_prison") {
        state.flags.rangerRescued = true;
        learn(state, "角色搭配", "新角色可能改变队伍处理敌人的方式", "调整队伍");
        event.reward = "营救游侠；法师位置自动替换为游侠";
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
        wakeCondition: "发生可见的装备提升或学会新的队伍知识后再尝试",
      };
      state.cognition.failureMemories.unshift(memory);
      event.failureMemory = memory;
    }
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
    return { ...result, win: result.winner === "left" };
  }

  function playerTeam(state) {
    const mult = 1 + gearScore(state) / 260;
    const hasRanger = Boolean(state.cleared.r1_prison);
    return [
      { name: "银盾骑士", role: "knight", hp: 520, power: 46, armor: 18, range: 9, slotIndex: 0 },
      { name: "狂战士", role: "berserker", hp: 430, power: 58, armor: 10, range: 9, slotIndex: 1 },
      { name: hasRanger ? "林地游侠" : "烬火法师", role: hasRanger ? "ranger" : "mage", hp: hasRanger ? 340 : 310, power: hasRanger ? 58 : 64, armor: hasRanger ? 7 : 5, range: hasRanger ? 34 : 28, slotIndex: 2 },
      { name: "晨祷牧师", role: "priest", hp: 340, power: 42, armor: 6, range: 25, slotIndex: 3 },
    ].map((unit) => scaleSpec(withRoleKit(unit), mult));
  }

  function enemyTeam(item) {
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
    if (item.id === "r1_main_5") return "heavy_shield_line";
    if (item.type === "boss") return "pressure_corridor";
    return "";
  }

  function rollLoot(state, item) {
    const rule = dropRules[item.type] || dropRules.main;
    const rng = seededRandom(`${state.seed}|${item.id}|${state.attempts[item.id]}|${state.inventory.length}`);
    return Array.from({ length: rule.count }, (_, index) => {
      const rarity = rollRarity(rule.rates, rng());
      const info = rarityTable[rarity];
      const level = Math.round(rule.level[0] + (rule.level[1] - rule.level[0]) * rng());
      const slot = gearSlots[Math.floor(rng() * gearSlots.length) % gearSlots.length];
      const power = Math.max(1, Math.round((level * 0.72 + info.score * 2.5) * info.mult));
      return { id: `${item.id}_${state.attempts[item.id]}_${index}_${rarity}`, name: `${info.name}${slotName(slot)} Lv${level}`, rarity, level, slot, power, source: item.id };
    });
  }

  function autoEquip(state) {
    for (const item of state.inventory) {
      const current = state.equipped[item.slot];
      if (!current || item.power > current.power) state.equipped[item.slot] = item;
    }
  }

  function gearScore(state) {
    return Object.values(state.equipped || {}).reduce((sum, item) => sum + (item.power || 0), 0);
  }

  function rollRarity(rates, value) {
    let cursor = 0;
    for (const rarity of ["common", "blue", "rare", "epic"]) {
      cursor += rates[rarity] || 0;
      if (value <= cursor) return rarity;
    }
    return "common";
  }

  function publicLoot(item) {
    return { name: item.name, rarity: item.rarity, level: item.level, slot: item.slot, power: item.power };
  }

  function slotName(slot) {
    return { weapon: "武器", armor: "护甲", focus: "法器", boots: "靴子" }[slot] || slot;
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
