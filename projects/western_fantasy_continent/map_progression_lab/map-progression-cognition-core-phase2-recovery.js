(function initMapProgressionCognitionCore(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM,
    typeof module !== "undefined" ? require("../game_data/skill-data") : root.GAME_SKILL_DATA,
    typeof module !== "undefined" ? require("./map-progression-roster") : root.GAME_MAP_PROGRESSION_ROSTER,
    typeof module !== "undefined" ? require("../game_data/equipment-runtime") : root.GAME_EQUIPMENT_RUNTIME,
    typeof module !== "undefined" ? require("./map-progression-encounters") : root.GAME_MAP_PROGRESSION_ENCOUNTERS,
    typeof module !== "undefined" ? require("../game_data/combat-signals") : root.GAME_COMBAT_SIGNALS,
  );
  if (typeof module !== "undefined") module.exports = value;
  else root.GAME_MAP_PROGRESSION_COGNITION = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore(COMBAT_SIM, SKILL_DATA, ROSTER, EQUIPMENT, ENCOUNTERS, SIGNAL_PRESENTATION) {

  const nodes = makeNodes();
  const nodesById = Object.fromEntries(nodes.map((item) => [item.id, item]));
  function makeNodes() {
    const result = [];
    for (let index = 1; index <= 10; index += 1) {
      const requires = index === 1
        ? []
        : index === 8
          ? ["r1_main_6"]
          : index === 9
            ? []
            : [`r1_main_${index - 1}`];
      result.push({
        id: `r1_main_${index}`,
        name: `灰带郊野 ${index}`,
        type: "main",
        requires,
        requiresAny: index === 9 ? ["r1_main_7", "r1_main_8"] : [],
        rewardHint: index % 3 === 0 ? "可能出现蓝装" : "白装",
        enemyHint: index === 1 ? "两大波、三次进场的弱小散兵" : index === 7 ? "高生命高攻速蛮熊与三名弱支援" : index === 8 ? "两名脆弱施法者与远程支援" : index <= 3 ? "两名近战和一名远程" : index <= 6 ? "近战、远程与治疗" : "完整四人敌队",
      });
    }
    result.push(
      {
        id: "r1_bandit",
        name: "旧塔军械营地",
        type: "branch",
        requires: ["r1_main_5"],
        rewardHint: "首通固定获得破盾斧与裂甲护手；复战无首通奖励",
        enemyHint: "持盾军械队",
      },
      {
        id: "r1_prison",
        name: "旧塔监狱",
        type: "branch",
        requires: ["r1_main_3"],
        rewardHint: "首通营救一名新角色；复战无首通奖励",
        enemyHint: "狱门护盾、后排哨手与治疗",
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
    if (item.id === "r1_main_9" && state.cleared[item.id] && isBossRecoveryActive(state)) return "available";
    if (state.cleared[item.id]) return item.type === "main" ? "farmable" : ENCOUNTERS.isOneTimeBranch(item) ? "repeatable" : "cleared";
    const requiredAll = (item.requires || []).every((id) => state.cleared[id]);
    const requiredAny = !(item.requiresAny || []).length || item.requiresAny.some((id) => state.cleared[id]);
    if (requiredAll && requiredAny) return "available";
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
        rewardHint: rewardHintForNode(state, item),
        enemyHint: item.enemyHint,
      }))
      .filter((item) => item.status !== "locked");
    const challengeActions = visibleNodes.filter((item) => ["available", "farmable", "repeatable"].includes(item.status)).map((item) => `challenge:${item.id}`);
    const activeIds = new Set(state.teamSlots);
    const reserveIds = state.roster.filter((unit) => !activeIds.has(unit.id)).map((unit) => unit.id);
    const swapActions = reserveIds.flatMap((heroId) => state.teamSlots.map((_, slotIndex) => `swap:${slotIndex}:${heroId}`));
    return {
      step: state.step,
      currentGoal: state.cleared.r1_boss ? "第一地区已完成" : nextGoal(state),
      optionalOpportunities: optionalOpportunities(state),
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
    if (!state.cleared.r1_main_10) return "继续推进灰带郊野";
    const bossFailure = state.cognition.failureMemories.find((memory) => memory.node === "r1_boss" && !memory.resolved);
    if (bossFailure && gearScore(state) <= bossFailure.gearScore) return "刷取最近主线，获得可见装备提升后再挑战首领";
    return "击败地区首领";
  }

  function optionalOpportunities(state) {
    const rows = [];
    const prison = nodesById.r1_prison;
    const camp = nodesById.r1_bandit;
    const prisonStatus = nodeStatus(state, prison);
    const campStatus = nodeStatus(state, camp);
    if (["available", "repeatable"].includes(prisonStatus)) rows.push({ node: prison.id, status: prisonStatus, reason: state.cleared.r1_prison ? "可复战，首通角色已领取" : "可选救援：首通获得新角色" });
    if (["available", "repeatable"].includes(campStatus)) rows.push({ node: camp.id, status: campStatus, reason: state.cleared.r1_bandit ? "可复战，首通军械已领取" : "可选军械：首通获得破盾与破甲装备" });
    return rows;
  }

  function applyAction(rawState, actionText, options = {}) {
    const state = normalizeState(structuredClone(rawState));
    const [kind, id, value] = String(actionText || "").split(":");
    if (kind === "swap") return applySwapAction(state, actionText, id, value);
    if (kind !== "challenge" || !nodesById[id]) return actionError(state, actionText, "未知行动");
    const item = nodesById[id];
    if (!["available", "farmable", "repeatable"].includes(nodeStatus(state, item))) return actionError(state, actionText, "该关卡当前不可挑战");

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
      feedbackSignals: visibleFeedbackSignals(combat.signals),
      performance: combatPerformance(combat),
      diagnosis: combatDiagnosis(combat),
    };
    if (combat.win) {
      const firstClear = !state.cleared[id];
      state.cleared[id] = true;
      state.cognition.failureMemories.forEach((memory) => {
        if (memory.node === id) memory.resolved = true;
      });
      const repeatOneTimeBranch = !firstClear && ENCOUNTERS.isOneTimeBranch(item);
      const loot = repeatOneTimeBranch
        ? []
        : id === "r1_bandit"
          ? ENCOUNTERS.campFirstClearLoot(`r1_bandit_key_${state.attempts[id]}`)
          : rollLoot(state, item);
      state.inventory.push(...loot);
      event.lootOpportunity = !repeatOneTimeBranch && id !== "r1_bandit";
      if (loot.length) autoEquip(state);
      event.loot = loot.map(publicLoot);
      event.gearAfter = gearScore(state);
      event.firstClear = firstClear;
      if (id === "r1_prison" && firstClear) {
        state.flags.rangerRescued = true;
        state.roster = ROSTER.rescueHero(state.roster, "ranger");
        if (!state.cognition.concepts.includes("角色名单")) state.cognition.concepts.push("角色名单");
        if (!state.cognition.behaviors.includes("调整队伍")) state.cognition.behaviors.push("调整队伍");
        event.reward = "营救游侠；游侠加入角色名单，当前队伍没有自动改变";
      }
      if (id === "r1_bandit" && firstClear) {
        learn(state, "针对性装备", "具名破盾与破甲装备可能解决可见的护盾与护甲障碍", "在相似敌情下检查针对性装备");
      }
      if (loot.length) learn(state, "掉落", "胜利后获得的装备会自动换上更强的部件", "观察装备变化");
      if (repeatOneTimeBranch) event.reward = "复战胜利；首通奖励已经领取，本次没有新的支线奖励";
    } else {
      state.failures[id] = (state.failures[id] || 0) + 1;
      if (id === "r1_prison") state.flags.prisonFailed = true;
      const memory = {
        node: id,
        attempt: state.failures[id],
        gearScore: gearScore(state),
        attributionPrompt: "只能使用当前已知概念解释失败",
        wakeCondition: id === "r1_prison" && !state.cleared.r1_bandit
          ? "可以立即重试，也可以继续主线到 5，取得军械营地首通装备后再尝试"
          : "发生可见的装备提升或学会新的队伍知识后再尝试",
      };
      state.cognition.failureMemories.unshift(memory);
      event.failureMemory = memory;
      event.lootOpportunity = false;
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
        learn(state, "角色观察", `林地游侠在蛮熊战贡献了${Math.round(share * 100)}%伤害`, "在高生命单体目标前继续观察猎标与减速");
        event.roleProof = { rangerDamageShare: Math.round(share * 1000) / 1000, evidence: "蛮熊战伤害占比" };
      }
    }
    if (id === "r1_main_8" && state.teamSlots.includes("hero_mage") && combat.win) {
      const mage = event.contributions.find((unit) => unit.role === "mage");
      const totalDamage = event.contributions.reduce((sum, unit) => sum + (unit.damage || 0), 0);
      const share = totalDamage ? (mage?.damage || 0) / totalDamage : 0;
      if (share >= 0.32) {
        learn(state, "角色观察", `法师在脆弱群体战贡献了 ${Math.round(share * 100)}% 伤害`, "面对多名脆弱敌人时继续观察范围伤害");
        event.roleProof = { mageDamageShare: Math.round(share * 1000) / 1000, evidence: "脆弱群体战伤害占比" };
      }
    }
    const analysis = options.captureVisibleSignals ? cognitionAnalysis(combat.signals, item, event, state.attempts[id]) : undefined;
    state.history.unshift(event);
    const output = { ok: true, state, observation: observe(state), event };
    if (analysis) output.analysis = analysis;
    return output;
  }

  function applySwapAction(state, actionText, slotText, heroId) {
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

  function visibleFeedbackSignals(signals) {
    return (signals || []).flatMap((signal) => {
      if (signal.kind === "skill" && signal.source?.side === "left") {
        return [{ time: signal.time, type: "skill_cast", skillKey: signal.skillKey || signal.skillName || "unknown", skillName: signal.skillName || "技能" }];
      }
      if (signal.kind === "death" && signal.target?.side === "right") {
        return [{ time: signal.time, type: "enemy_kill", targetName: signal.target.name || "敌人", sourceName: signal.source?.name || "" }];
      }
      return [];
    });
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

  function cognitionAnalysis(signals, item, event, attempt) {
    return {
      schema: "map_cognition_analysis_v1",
      step: event.step,
      action: event.action,
      node: {
        id: item.id,
        type: item.type,
        attempt: Number(attempt || 0),
        fieldEffect: fieldEffect(item) || "none",
      },
      combatSignals: cognitionSignalLog(signals, item, attempt),
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
    return (signals || [])
      .map((signal, index) => ({ signal, index, presentation: SIGNAL_PRESENTATION.describePresentation(signal) }))
      .filter((entry) => entry.presentation.visible)
      .map(({ signal, index, presentation }) => ({
        id: `${item.id}:attempt:${Number(attempt || 0)}:combat:${index + 1}`,
        sequence: index + 1,
        time: cognitionRound(signal.time),
        type: signal.kind,
        subject: cognitionUnitRef(signal.source),
        environment: {
          region: "region_1",
          node: item.id,
          nodeType: item.type,
          phase: "combat",
          fieldEffect: fieldEffect(item) || "none",
        },
        behavior: {
          kind: signal.kind === "skill" ? "skill_cast" : signal.skillKey ? "skill_effect" : signal.kind,
          key: signal.skillKey || signal.kind,
          name: signal.skillName || "",
          tags: [...(signal.tags || [])],
        },
        result: {
          kind: signal.kind,
          amount: cognitionRound(signal.amount || 0),
          target: cognitionUnitRef(signal.target),
          hpBefore: Number.isFinite(signal.hpBefore) ? cognitionRound(signal.hpBefore) : null,
          hpAfter: Number.isFinite(signal.hpAfter) ? cognitionRound(signal.hpAfter) : null,
          occurred: true,
        },
        presentation,
      }));
  }

  function cognitionRound(value, digits = 4) {
    return Number(Number(value || 0).toFixed(digits));
  }

  function cognitionUnitRef(unit) {
    if (!unit) return null;
    return {
      id: unit.id || "",
      name: unit.name || "",
      side: unit.side || "",
      role: unit.role || "",
    };
  }

  function combatPerformance(combat) {
    const damage = (combat.signals || []).filter((signal) => signal.kind === "damage" && signal.source?.side === "left" && signal.target?.side === "right" && Number(signal.amount) > 0);
    const amounts = damage.map((signal) => Number(signal.amount)).sort((a, b) => a - b);
    const relative = damage.map((signal) => Number(signal.amount) / Math.max(1, Number(signal.hpBefore) || 1));
    return {
      d50: percentile(amounts, 0.5),
      d90: percentile(amounts, 0.9),
      frequency: combat.duration > 0 ? Math.round(damage.length / combat.duration * 1000) / 1000 : 0,
      impact: relative.length ? Math.round(relative.reduce((sum, value) => sum + value, 0) / relative.length * 1000) / 1000 : 0,
      hitCount: damage.length,
      killCount: (combat.signals || []).filter((signal) => signal.kind === "death" && signal.target?.side === "right").length,
    };
  }

  function combatDiagnosis(combat) {
    const incoming = (combat.signals || []).filter((signal) => signal.kind === "damage" && signal.source?.side === "right" && signal.target?.side === "left");
    const totals = { physical: 0, magic: 0, effect: 0 };
    for (const signal of incoming) {
      const amount = Number(signal.amount) || 0;
      if ((signal.tags || []).some((tag) => tag === "dot" || tag === "burn" || tag === "poison")) totals.effect += amount;
      else if ((signal.tags || []).some((tag) => tag === "magic" || tag === "fire" || tag === "frost" || tag === "lightning")) totals.magic += amount;
      else totals.physical += amount;
    }
    const firstAllyDeath = (combat.signals || []).find((signal) => signal.kind === "death" && signal.target?.side === "left");
    const enemySurvivors = (combat.units || []).filter((unit) => unit.side === "right" && unit.alive).map((unit) => ({ name: unit.name, role: unit.role, hpRatio: Math.round((unit.hpRatio || 0) * 1000) / 1000 }));
    const dominantDamage = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";
    return {
      firstAllyDeath: firstAllyDeath ? { time: Math.round(firstAllyDeath.time * 100) / 100, name: firstAllyDeath.target?.name || "", killer: firstAllyDeath.source?.name || "" } : null,
      incomingDamage: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value * 10) / 10])),
      dominantDamage,
      enemySurvivors,
    };
  }

  function percentile(values, ratio) {
    if (!values.length) return 0;
    const index = Math.max(0, Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1));
    return Math.round(values[index] * 1000) / 1000;
  }

  function playerTeam(state) {
    return ROSTER.buildTeam(state.roster, state.teamSlots, 1);
  }

  function enemyTeam(item) {
    if (item.id === "r1_prison") return ENCOUNTERS.prisonTeam();
    if (item.id === "r1_main_7") return ENCOUNTERS.bearLockTeam();
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
    if (mainNo === 8) return ["warrior", "ranger", "mage", "mage"];
    return ["knight", "warrior", "ranger", "mage"];
  }

  function enemyScale(item) {
    const override = ENCOUNTERS.enemyScaleOverride(item);
    if (Number.isFinite(override)) return override;
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
    return ENCOUNTERS.fieldEffectId(item);
  }

  function rollLoot(state, item) {
    const rule = dropRuleForNode(item, state);
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

  function dropRuleForNode(item, state = null) {
    if (isBossRecoveryActive(state) && item.id === "r1_main_9") {
      return { level: [10, 16], rates: { common: 0.7, rare: 0.28, epic: 0.02 }, count: 3 };
    }
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

  function rewardHintForNode(state, item) {
    if (isBossRecoveryActive(state) && item.id === "r1_main_9") return "首领整备点：3件 Lv10-16 装备，稀有率提升";
    return item.rewardHint;
  }

  function isBossRecoveryActive(state) {
    const memory = state?.cognition?.failureMemories?.find((row) => row.node === "r1_boss" && !row.resolved);
    return Boolean(memory && gearScore(state) < Number(memory.gearScore || 0) * 1.3);
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
