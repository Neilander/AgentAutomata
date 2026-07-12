(function initMapProgressionPlayerState(root, factory) {
  const value = factory(
    typeof module !== "undefined" ? require("../game_data/feedback-cognition-model") : root.GAME_FEEDBACK_COGNITION_MODEL,
  );
  if (typeof module !== "undefined" && module.exports) module.exports = value;
  else root.GAME_MAP_PROGRESSION_PLAYER_STATE = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPlayerStateApi(FEEDBACK) {
  function createState(seed = "map-player") {
    return {
      schema: "map_expected_player_state_v1",
      feedback: FEEDBACK.createState({}, seed),
      learned: {
        ordinaryEnemyHits: null,
        ordinaryEnemySamples: 0,
        ordinaryEnemyContract: "尚未形成",
        rewardContract: "知道胜利可能获得装备",
      },
      confidence: "谨慎探索",
      processRead: "等待第一次真实战斗",
      lastEpisode: null,
      changes: [{
        kind: "initial",
        label: "进入地图",
        before: "没有本地经验",
        after: "谨慎探索",
        cause: "玩家只知道胜利能推进，装备可能提升战力",
      }],
    };
  }

  function normalizeState(raw, seed = "map-player") {
    const base = createState(seed);
    return {
      ...base,
      ...(raw || {}),
      feedback: raw?.feedback?.eventRecords ? raw.feedback : base.feedback,
      learned: { ...base.learned, ...(raw?.learned || {}) },
      changes: Array.isArray(raw?.changes) ? raw.changes.slice(0, 12) : base.changes,
    };
  }

  function recordBattle(raw, item, combat) {
    const state = normalizeState(raw);
    const feedbackBefore = FEEDBACK.diagnostics(state.feedback).value;
    const duration = Math.max(0, Number(combat?.duration) || 0);
    const endTime = state.feedback.gameTime + duration;
    FEEDBACK.advanceTo(state.feedback, endTime, {}, { phase: "combat", node: item.id });

    const enemyUnits = (combat?.units || []).filter((unit) => ["right", "enemy"].includes(unit.side));
    const enemyKills = Math.max(0, enemyUnits.length - Number(combat?.metrics?.rightAlive || 0));
    if (combat?.win) {
      const killKey = item.type === "boss" ? "kill:elite_enemy" : "kill:normal_enemy";
      for (let index = 0; index < enemyKills; index += 1) {
        FEEDBACK.triggerEvent(state.feedback, killKey, { time: endTime, metadata: { node: item.id } });
      }
      FEEDBACK.triggerEvent(state.feedback, item.type === "boss" ? "clear:boss" : item.type === "branch" ? "clear:side_branch" : "clear:main_level", {
        time: endTime,
        metadata: { node: item.id },
      });
      FEEDBACK.resolveFailure(state.feedback, item.id, { time: endTime });
    } else {
      FEEDBACK.recordFailure(state.feedback, item.id, relatedEvents(item), {
        time: endTime,
        attribution: "只能使用已经观察到的战斗、装备和队伍信息解释失败",
      });
    }

    const feedbackAfter = FEEDBACK.diagnostics(state.feedback).value;
    if (Math.abs(feedbackAfter - feedbackBefore) >= 0.1) {
      addChange(state, {
        kind: feedbackAfter >= feedbackBefore ? "gain" : "loss",
        label: "反馈储量",
        before: formatScore(feedbackBefore),
        after: formatScore(feedbackAfter),
        cause: combat?.win ? `${item.name}胜利、击杀与关卡完成抵消了过程消耗` : `${item.name}失败且没有获得预期结果`,
      });
    }

    const cadence = analyzeDamageCadence(combat?.signals || []);
    if (item.id === "r1_main_1" && cadence.enemyCount >= 8) updateOrdinaryEnemyExpectation(state, cadence);

    const confidenceBefore = state.confidence;
    const alliesAlive = Number(combat?.metrics?.leftAlive || 0);
    state.confidence = combat?.win
      ? alliesAlive >= 4 ? "安全推进" : "能够推进但有损耗"
      : state.feedback.activeFailureCount >= 2 ? "当前方案受挫" : "首次受阻";
    if (state.confidence !== confidenceBefore) {
      addChange(state, {
        kind: combat?.win ? "gain" : "loss",
        label: "推进信心",
        before: confidenceBefore,
        after: state.confidence,
        cause: combat?.win ? `战斗结束时仍有${alliesAlive}名队员存活` : `${item.name}没有通过`,
      });
    }

    state.lastEpisode = {
      node: item.id,
      name: item.name,
      outcome: combat?.win ? "胜利" : "失败",
      duration: round(duration),
      enemyCount: cadence.enemyCount,
      averageHits: cadence.averageHits,
      longestGap: cadence.longestGap,
    };
    return state;
  }

  function recordLoot(raw, item, loot, options = {}) {
    const state = normalizeState(raw);
    const before = FEEDBACK.diagnostics(state.feedback).value;
    for (const equipment of loot || []) {
      FEEDBACK.triggerEvent(state.feedback, equipment.rarity === "common" ? "loot:equipment" : "loot:rare_equipment", {
        metadata: { node: item.id, item: equipment.name },
      });
    }
    if (options.characterUnlocked) FEEDBACK.triggerEvent(state.feedback, "unlock:character", { metadata: { node: item.id } });
    const after = FEEDBACK.diagnostics(state.feedback).value;
    if ((loot || []).length || options.characterUnlocked) {
      const rareCount = (loot || []).filter((equipment) => equipment.rarity !== "common").length;
      const previous = state.learned.rewardContract;
      state.learned.rewardContract = options.characterUnlocked
        ? "支线首通可能带来新角色"
        : rareCount
          ? "困难支线可能给出明确的高价值装备"
          : "短关卡通常给出小幅、可叠加的装备成长";
      addChange(state, {
        kind: "gain",
        label: "结果预期",
        before: previous,
        after: state.learned.rewardContract,
        cause: options.characterUnlocked ? `${item.name}首通解锁了新角色` : `${item.name}掉落了${loot.length}件装备${rareCount ? `，其中${rareCount}件高于普通` : ""}`,
      });
    } else if (!options.firstClear) {
      addChange(state, {
        kind: "neutral",
        label: "支线预期",
        before: "重复挑战可能继续给首通奖励",
        after: "核心奖励只在首通出现",
        cause: `${item.name}复战没有再次发放核心奖励`,
      });
    }
    if (after > before) {
      addChange(state, {
        kind: "gain",
        label: "奖励反馈",
        before: formatScore(before),
        after: formatScore(after),
        cause: options.characterUnlocked ? "新角色具有高结果价值" : "掉落被玩家识别为可用成长",
      });
    }
    return state;
  }

  function recordEquipmentChange(raw, heroName, itemName, equipped) {
    const state = normalizeState(raw);
    const before = FEEDBACK.diagnostics(state.feedback).value;
    FEEDBACK.triggerEvent(state.feedback, "equip:power_upgrade", {
      desireMultiplier: equipped ? 1 : 0.35,
      metadata: { heroName, itemName, equipped },
    });
    const after = FEEDBACK.diagnostics(state.feedback).value;
    addChange(state, {
      kind: equipped ? "gain" : "neutral",
      label: "装备理解",
      before: equipped ? "拥有装备" : "装备已穿戴",
      after: equipped ? "主动验证装备" : "重新保留选择",
      cause: `${heroName}${equipped ? "装备" : "卸下"}了${itemName}，玩家能把战力变化归因到具体操作`,
    });
    if (after !== before) state.learned.rewardContract = "装备需要穿戴并通过战斗验证";
    return state;
  }

  function view(raw) {
    const state = normalizeState(raw);
    const diagnostics = FEEDBACK.diagnostics(state.feedback);
    return {
      feedback: diagnostics.value,
      emotion: diagnostics.emotion,
      confidence: state.confidence,
      ordinaryEnemyContract: state.learned.ordinaryEnemyContract,
      rewardContract: state.learned.rewardContract,
      processRead: state.processRead,
      lastEpisode: state.lastEpisode,
      changes: state.changes.slice(0, 5),
    };
  }

  function updateOrdinaryEnemyExpectation(state, cadence) {
    const before = state.learned.ordinaryEnemyContract;
    const previousHits = state.learned.ordinaryEnemyHits;
    const alpha = previousHits == null ? 0.65 : 0.25;
    const learnedHits = previousHits == null
      ? cadence.averageHits
      : previousHits * (1 - alpha) + cadence.averageHits * alpha;
    state.learned.ordinaryEnemyHits = round(learnedHits);
    state.learned.ordinaryEnemySamples += cadence.enemyCount;
    state.learned.ordinaryEnemyContract = learnedHits < 3
      ? "普通敌人接近免费"
      : learnedHits <= 5.4
        ? `普通敌人约需${round(learnedHits, 1)}次可见受击`
        : "普通敌人也需要长期集火";
    state.processRead = cadence.longestGap <= 1.6
      ? "交战连续，等待主要用于进场与走位"
      : "存在较长无伤害区间，需观察是否是有效移动";
    addChange(state, {
      kind: learnedHits < 3 ? "loss" : "gain",
      label: "普通怪预期",
      before,
      after: state.learned.ordinaryEnemyContract,
      cause: `1-1中${cadence.enemyCount}名散兵平均承受${round(cadence.averageHits, 1)}次可见伤害，最长伤害间隔${round(cadence.longestGap, 1)}秒`,
    });
  }

  function analyzeDamageCadence(signals) {
    const hits = new Map();
    const times = [];
    for (const signal of signals || []) {
      if (!signal?.tags?.includes("damage") || !["right", "enemy"].includes(signal.target?.side)) continue;
      hits.set(signal.target.id, (hits.get(signal.target.id) || 0) + 1);
      if (Number.isFinite(signal.time)) times.push(signal.time);
    }
    const counts = [...hits.values()];
    times.sort((a, b) => a - b);
    let longestGap = 0;
    for (let index = 1; index < times.length; index += 1) longestGap = Math.max(longestGap, times[index] - times[index - 1]);
    return {
      enemyCount: counts.length,
      averageHits: round(average(counts)),
      longestGap: round(longestGap),
    };
  }

  function relatedEvents(item) {
    const clearKey = item.type === "boss" ? "clear:boss" : item.type === "branch" ? "clear:side_branch" : "clear:main_level";
    return ["kill:normal_enemy", clearKey, "loot:equipment", "equip:power_upgrade"];
  }

  function addChange(state, change) {
    state.changes.unshift({ ...change, id: `${state.feedback.gameTime}:${state.changes.length}:${change.label}` });
    state.changes = state.changes.slice(0, 12);
  }

  function formatScore(value) {
    return `${round(value, 1)}/100`;
  }

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function round(value, digits = 3) {
    return Number.isFinite(Number(value)) ? Number(Number(value).toFixed(digits)) : 0;
  }

  return { createState, normalizeState, recordBattle, recordEquipmentChange, recordLoot, view };
});
