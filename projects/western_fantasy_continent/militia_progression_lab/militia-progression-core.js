(function initMilitiaProgressionCore(root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory({
      combat: require("../game_data/combat-sim.js"),
      skillData: require("../game_data/skill-data.js"),
    });
  } else {
    root.MILITIA_PROGRESSION_CORE = factory({
      combat: root.GAME_COMBAT_SIM,
      skillData: root.GAME_SKILL_DATA,
    });
  }
})(typeof window !== "undefined" ? window : globalThis, ({ combat, skillData }) => {
  const RARITIES = {
    common: { id: "common", name: "白装", icon: "⚪", score: 1 },
    blue: { id: "blue", name: "蓝装", icon: "🔵", score: 2 },
    rare: { id: "rare", name: "稀有", icon: "🟢", score: 3 },
    epic: { id: "epic", name: "紫装", icon: "🟣", score: 5 },
  };

  const SLOTS = {
    weapon: { name: "武器", icon: "⚔", stats: ["physicalPowerAdd", "magicPowerAdd"] },
    armor: { name: "胸甲", icon: "🛡", stats: ["maxHpAdd", "armorAdd"] },
    charm: { name: "护符", icon: "🔮", stats: ["magicPowerAdd", "receivedHealingMult"] },
    boots: { name: "靴子", icon: "🥾", stats: ["maxHpAdd", "attackSpeedMult"] },
  };

  const ROSTER_SEED = [
    {
      id: "hero_knight",
      name: "银盾骑士",
      role: "knight",
      kind: "hero",
      icon: "🛡️",
      note: "完整前排英雄，有守护和大招。",
      slots: [0],
    },
    {
      id: "hero_mage",
      name: "烬火法师",
      role: "mage",
      kind: "hero",
      icon: "🔥",
      note: "完整输出英雄，负责清怪和爆发。",
      slots: [2],
    },
    {
      id: "militia_shield",
      name: "盾民兵",
      role: "warrior",
      kind: "militia",
      icon: "🪵",
      note: "能临时挡线，但远不如正式骑士可靠。",
      override: { hp: 330, power: 8, physicalPower: 8, magicPower: 8, armor: 8, range: 12, small1: "heal", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop" },
      slots: [1],
    },
    {
      id: "militia_bow",
      name: "弓民兵",
      role: "ranger",
      kind: "militia",
      icon: "🏹",
      note: "脆弱后排，能补一点远程压力。",
      override: { hp: 160, power: 16, physicalPower: 18, magicPower: 8, armor: 3, range: 42, small1: "markShot", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop" },
      slots: [3],
    },
    {
      id: "militia_spark",
      name: "火花学徒",
      role: "mage",
      kind: "militia",
      icon: "🕯️",
      note: "极脆，只能补一点法术伤害。",
      override: { hp: 125, power: 8, physicalPower: 6, magicPower: 28, armor: 2, range: 40, small1: "fireball", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop" },
      slots: [],
    },
    {
      id: "militia_herb",
      name: "草药民兵",
      role: "priest",
      kind: "militia",
      icon: "🌿",
      note: "低配治疗，能续一点命但不能逆转战局。",
      override: { hp: 155, power: 8, physicalPower: 6, magicPower: 18, armor: 3, range: 36, small1: "heal", small2: "enemyNoop", passive: "enemyDormantPassive", ultimate: "enemyNoop" },
      slots: [],
    },
  ];

  const HERO_REWARDS = {
    ranger: { id: "hero_ranger", name: "林地游侠", role: "ranger", kind: "hero", icon: "🏹", note: "真正的后排点杀英雄，替代弓民兵。" },
    warrior: { id: "hero_warrior", name: "破盾战士", role: "warrior", kind: "hero", icon: "🪓", note: "稳定近战输出，能处理重盾。" },
    priest: { id: "hero_priest", name: "晨祷牧师", role: "priest", kind: "hero", icon: "✚", note: "完整续航英雄，明显强于草药民兵。" },
  };

  const REWARD_SLOTS = { ranger: 3, warrior: 1, priest: 1 };

  const STAGES = [
    {
      id: "s1",
      name: "阶段 1：盗匪外围",
      drop: { common: 0.82, blue: 0.17, rare: 0.01, epic: 0 },
      levelRange: [1, 8],
      encounters: [
        { id: "s1_filler", type: "充水关", name: "流民巡逻", enemy: ["warrior", "warrior", "ranger", "priest"], scale: 0.58, drops: 3, note: "低质量小怪，用来熟悉站位和白蓝装。" },
        { id: "s1_quality", type: "质量关", name: "盾匪和弓手", enemy: ["warrior", "warrior", "ranger", "ranger"], scale: 0.75, drops: 3, note: "开始要求前排能站住，后排能活下来。" },
        { id: "s1_gate", type: "卡点关", name: "哨塔监狱", enemy: ["warrior", "knight", "ranger", "ranger"], scale: 1.05, drops: 4, field: "sentry_suppression", rewardHero: "ranger", note: "场地：后排在被近战接触前更危险。首通救出林地游侠。" },
      ],
    },
    {
      id: "s2",
      name: "阶段 2：重盾营地",
      drop: { common: 0.62, blue: 0.3, rare: 0.07, epic: 0.01 },
      levelRange: [6, 18],
      encounters: [
        { id: "s2_filler", type: "充水关", name: "训练兵营", enemy: ["warrior", "warrior", "ranger", "mage"], scale: 1.18, drops: 3, note: "蓝装开始稳定出现，偶尔见到紫装。" },
        { id: "s2_quality", type: "质量关", name: "双盾草药队", enemy: ["knight", "warrior", "priest", "ranger"], scale: 1.55, drops: 3, guaranteedEpic: true, note: "质量怪开始考输出效率。首通固定掉落一件紫装。" },
        { id: "s2_gate", type: "卡点关", name: "重盾营地", enemy: ["knight", "knight", "priest", "ranger"], scale: 2.35, drops: 4, field: "heavy_shield_line", rewardHero: "warrior", note: "场地：前排开局重盾。首通救出破盾战士。" },
      ],
    },
    {
      id: "s3",
      name: "阶段 3：腐化矿洞",
      drop: { common: 0.45, blue: 0.36, rare: 0.15, epic: 0.04 },
      levelRange: [14, 30],
      encounters: [
        { id: "s3_filler", type: "充水关", name: "矿洞杂兵", enemy: ["warrior", "warlock", "alchemist", "mage"], scale: 1.8, drops: 3, note: "紫装开始成为明确追求，但还不泛滥。" },
        { id: "s3_quality", type: "质量关", name: "毒火学徒", enemy: ["knight", "warlock", "alchemist", "mage"], scale: 2.1, drops: 4, note: "异常和远程压力变明显。" },
        { id: "s3_gate", type: "卡点关", name: "余火矿井", enemy: ["knight", "priest", "warlock", "alchemist"], scale: 3.15, drops: 4, field: "ember_contagion", rewardHero: "priest", note: "场地：阵亡后余火传染。首通救出晨祷牧师。" },
      ],
    },
  ];

  function createInitialState(seed = "default") {
    return {
      day: 1,
      seed,
      selectedStage: 0,
      selectedEncounter: "s1_filler",
      roster: ROSTER_SEED.map((unit) => ({ ...unit, equipment: {}, unlocked: true })),
      bag: [],
      cleared: {},
      logs: ["实验开始：2 个英雄，4 个极端民兵。"],
      lastResult: null,
      lastLoot: [],
      autoSummary: null,
    };
  }

  function activeTeam(state) {
    const slotted = [];
    state.roster.forEach((unit) => (unit.slots || []).forEach((slot) => { slotted[slot] = unit; }));
    const unlocked = state.roster.filter((unit) => unit.unlocked && !slotted.includes(unit));
    for (let i = 0; i < 4; i += 1) if (!slotted[i]) slotted[i] = unlocked.shift();
    return slotted.filter(Boolean).slice(0, 4);
  }

  function currentStage(state) {
    return STAGES[state.selectedStage] || STAGES[0];
  }

  function findEncounter(state, id = state.selectedEncounter) {
    return STAGES.flatMap((stage, stageIndex) => stage.encounters.map((encounter) => ({ ...encounter, stageIndex, stage }))).find((item) => item.id === id) || STAGES[0].encounters[0];
  }

  function buildSpec(unit, slotIndex, side = "left", scale = 1) {
    const kit = skillData.roleKits[unit.role] || {};
    const roleKit = kit.kit || {};
    const base = {
      role: unit.role,
      name: unit.name,
      unitKind: unit.kind || "",
      roleName: unit.kind === "militia" ? "民兵" : (kit.role || unit.role),
      hp: kit.hp || 300,
      maxHp: kit.hp || 300,
      power: kit.power || 45,
      physicalPower: kit.power || 45,
      magicPower: kit.power || 45,
      armor: kit.armor || 8,
      range: kit.range || 14,
      small1: roleKit.small1,
      small2: roleKit.small2,
      passive: roleKit.passive,
      ultimate: roleKit.ultimate,
      slotIndex,
    };
    const spec = { ...base, ...(unit.override || {}) };
    if (unit.override?.hp && !unit.override.maxHp) spec.maxHp = unit.override.hp;
    Object.values(unit.equipment || {}).forEach((item) => applyItem(spec, item));
    if (scale !== 1) {
      spec.hp = Math.round(spec.hp * scale);
      spec.maxHp = Math.round((spec.maxHp || spec.hp) * scale);
      spec.power = Math.round(spec.power * scale);
      spec.physicalPower = Math.round(spec.physicalPower * scale);
      spec.magicPower = Math.round(spec.magicPower * scale);
      spec.armor = Math.round(spec.armor * (0.85 + scale * 0.15));
    }
    if (side === "right") spec.name = `${unit.name}`;
    return spec;
  }

  function buildEnemy(role, index, encounter) {
    const militiaNames = {
      warrior: index < 2 ? "盗匪盾手" : "盗匪枪兵",
      ranger: "流民弓手",
      mage: "火把学徒",
      priest: "草药盗匪",
      knight: "重盾盗匪",
      warlock: "毒咒矿工",
      alchemist: "炼金矿徒",
    };
    const unit = {
      id: `enemy_${role}_${index}`,
      name: militiaNames[role] || "杂兵",
      role,
      kind: "enemy",
      equipment: {},
      override: enemyOverride(role, encounter.scale || 1),
    };
    return buildSpec(unit, index, "right", 1);
  }

  function enemyOverride(role, scale) {
    const base = {
      warrior: { hp: 230, power: 24, physicalPower: 26, magicPower: 8, armor: 10, range: 13 },
      knight: { hp: 310, power: 22, physicalPower: 22, magicPower: 8, armor: 18, range: 12 },
      ranger: { hp: 150, power: 24, physicalPower: 27, magicPower: 8, armor: 4, range: 42 },
      mage: { hp: 135, power: 8, physicalPower: 6, magicPower: 34, armor: 3, range: 42 },
      priest: { hp: 165, power: 8, physicalPower: 6, magicPower: 22, armor: 4, range: 38 },
      warlock: { hp: 170, power: 8, physicalPower: 6, magicPower: 30, armor: 5, range: 40 },
      alchemist: { hp: 175, power: 8, physicalPower: 6, magicPower: 28, armor: 5, range: 39 },
    }[role] || { hp: 200, power: 20, physicalPower: 20, magicPower: 8, armor: 6, range: 14 };
    return {
      ...base,
      hp: Math.round(base.hp * scale),
      maxHp: Math.round(base.hp * scale),
      power: Math.round(base.power * scale),
      physicalPower: Math.round(base.physicalPower * scale),
      magicPower: Math.round(base.magicPower * scale),
      armor: Math.round(base.armor * (0.8 + scale * 0.2)),
      small2: "enemyNoop",
      passive: "enemyDormantPassive",
      ultimate: "enemyNoop",
    };
  }

  function applyItem(spec, item) {
    for (const [key, value] of Object.entries(item.stats || {})) {
      if (key.endsWith("Mult")) spec[key] = (spec[key] || 1) * value;
      else if (key.endsWith("Add")) {
        const target = key.slice(0, -"Add".length);
        spec[target] = (spec[target] || 0) + value;
      } else spec[key] = (spec[key] || 0) + value;
    }
    spec.maxHp = spec.maxHp || spec.hp;
    spec.hp = spec.maxHp;
  }

  function teamPower(state) {
    return Math.round(activeTeam(state).reduce((sum, unit, index) => sum + specPower(buildSpec(unit, index)), 0));
  }

  function specPower(spec) {
    return (spec.maxHp || spec.hp) * 1.8 + spec.armor * 18 + Math.max(spec.physicalPower || 0, spec.magicPower || 0) * 12 + (spec.range > 30 ? 35 : 0);
  }

  function simulateEncounter(state, encounterId = state.selectedEncounter, seed = "militia-lab") {
    const encounter = findEncounter(state, encounterId);
    const leftTeam = activeTeam(state).map((unit, index) => buildSpec(unit, index));
    const rightTeam = encounter.enemy.map((role, index) => buildEnemy(role, index, encounter));
    return combat.simulateTeams(leftTeam, rightTeam, {
      seed: `${seed}|${encounter.id}|${state.day}|${teamPower(state)}`,
      randomizeStats: false,
      fieldEffectId: encounter.field || "",
      maxTime: 70,
    });
  }

  function completeEncounter(state, encounterId = state.selectedEncounter) {
    const encounter = findEncounter(state, encounterId);
    const result = simulateEncounter(state, encounter.id, `play-${state.seed || "default"}-${state.day}`);
    const win = result.winner === "left";
    state.day += 1;
    state.lastResult = analyzeResult(result, encounter);
    state.logs.unshift(`${win ? "胜利" : "失败"} · ${encounter.name} · ${result.duration}s`);
    if (win) {
      state.cleared[encounter.id] = true;
      const loot = rollLoot(encounter.stage, encounter.drops || 3, `${state.seed}|${encounter.id}|${state.day}`);
      if (encounter.guaranteedEpic && !state.cleared[`${encounter.id}_epicRewarded`]) {
        loot.push(makeGuaranteedEpicReward(encounter.stage, encounter.id));
        state.cleared[`${encounter.id}_epicRewarded`] = true;
      }
      if (encounter.type === "卡点关" && !state.cleared[`${encounter.id}_rewarded`]) {
        loot.push(makeDirectedReward(encounter.stage, encounter.rewardHero));
        state.cleared[`${encounter.id}_rewarded`] = true;
      }
      state.lastLoot = loot;
      state.bag.push(...loot);
      if (encounter.rewardHero && !state.roster.some((unit) => unit.id === HERO_REWARDS[encounter.rewardHero].id)) {
        const reward = { ...HERO_REWARDS[encounter.rewardHero], equipment: {}, unlocked: true, slots: [] };
        const rewardSlot = REWARD_SLOTS[encounter.rewardHero];
        if (Number.isFinite(rewardSlot)) {
          state.roster.forEach((unit) => { unit.slots = (unit.slots || []).filter((slot) => slot !== rewardSlot); });
          reward.slots = [rewardSlot];
        }
        state.roster.push(reward);
        state.logs.unshift(`救出新英雄：${reward.name}`);
      }
      autoEquip(state);
    } else {
      state.lastLoot = [];
    }
    return state.lastResult;
  }

  function analyzeResult(result, encounter) {
    const allySignals = result.signals.filter((signal) => signal.source?.side === "left" || signal.target?.side === "left");
    const damageByUnit = byUnitAmount(result.signals.filter((signal) => signal.kind === "damage" && signal.source?.side === "left"), "source");
    const takenByUnit = byUnitAmount(result.signals.filter((signal) => signal.kind === "damage" && signal.target?.side === "left"), "target");
    const healByUnit = byUnitAmount(result.signals.filter((signal) => signal.kind === "heal" && signal.source?.side === "left"), "source");
    const deadAllies = result.units.filter((unit) => unit.side === "left" && !unit.alive).length;
    return {
      encounter: encounter.name,
      type: encounter.type,
      field: encounter.field || "",
      win: result.winner === "left",
      duration: result.duration,
      leftDamage: result.metrics.leftDamage,
      leftHealing: result.metrics.leftHealing,
      deadAllies,
      topDamage: topPair(damageByUnit),
      topTaken: topPair(takenByUnit),
      topHeal: topPair(healByUnit),
      signalCount: allySignals.length,
    };
  }

  function byUnitAmount(signals, ref) {
    const map = {};
    signals.forEach((signal) => {
      const name = signal[ref]?.name || signal[ref]?.role || "unknown";
      map[name] = (map[name] || 0) + (signal.amount || 0);
    });
    return map;
  }

  function topPair(map) {
    const entry = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return entry ? { name: entry[0], amount: Math.round(entry[1]) } : { name: "无", amount: 0 };
  }

  function rollLoot(stage, count, seedText) {
    const rng = seededRandom(seedText);
    return Array.from({ length: count }, (_, index) => generateItem(stage, rng, index));
  }

  function generateItem(stage, rng, index = 0) {
    const rarity = chooseRarity(stage.drop, rng);
    const [min, max] = stage.levelRange;
    const level = min + Math.floor(rng() * (max - min + 1));
    const slotKey = Object.keys(SLOTS)[Math.floor(rng() * Object.keys(SLOTS).length)];
    const slot = SLOTS[slotKey];
    const budget = level * (0.8 + RARITIES[rarity].score * 0.45);
    const stats = {};
    if (slot.stats.includes("maxHpAdd")) stats.maxHpAdd = Math.round(budget * (7 + rng() * 3));
    if (slot.stats.includes("armorAdd")) stats.armorAdd = Math.round(budget * (0.25 + rng() * 0.2));
    if (slot.stats.includes("physicalPowerAdd")) stats.physicalPowerAdd = Math.round(budget * (0.75 + rng() * 0.35));
    if (slot.stats.includes("magicPowerAdd")) stats.magicPowerAdd = Math.round(budget * (0.75 + rng() * 0.35));
    if (slot.stats.includes("receivedHealingMult")) stats.receivedHealingMult = 1 + Math.round(budget * 0.08) / 100;
    if (slot.stats.includes("attackSpeedMult")) stats.attackSpeedMult = 1 + Math.round(budget * 0.06) / 100;
    return {
      id: `militia_item_${Date.now()}_${index}_${Math.floor(rng() * 99999)}`,
      name: `${RARITIES[rarity].name} Lv.${level} ${slot.name}`,
      slot: slotKey,
      icon: slot.icon,
      rarity,
      level,
      stats,
      score: itemScore({ rarity, level, stats }),
    };
  }

  function makeDirectedReward(stage, rewardHero) {
    const item = generateItem({ ...stage, drop: { blue: 0.75, rare: 0.23, epic: 0.02 } }, seededRandom(`reward-${stage.id}-${rewardHero}`), 99);
    item.name = `首通奖励 · ${item.name}`;
    return item;
  }

  function makeGuaranteedEpicReward(stage, encounterId) {
    const item = generateItem({ ...stage, drop: { epic: 1 } }, seededRandom(`epic-reward-${stage.id}-${encounterId}`), 88);
    item.name = `紫装首通 · ${item.name}`;
    return item;
  }

  function chooseRarity(table, rng) {
    let roll = rng();
    for (const id of ["common", "blue", "rare", "epic"]) {
      roll -= table[id] || 0;
      if (roll <= 0) return id;
    }
    return "common";
  }

  function itemScore(item) {
    return Object.entries(item.stats || {}).reduce((sum, [key, value]) => {
      if (key.endsWith("Mult")) return sum + (value - 1) * 900;
      return sum + value;
    }, 0) + item.level * RARITIES[item.rarity].score;
  }

  function autoEquip(state) {
    state.roster.forEach((unit) => { if (!unit.equipment) unit.equipment = {}; });
    const sorted = [...state.bag].sort((a, b) => b.score - a.score);
    for (const item of sorted) {
      const candidates = activeTeam(state).map((unit) => ({ unit, gain: itemFit(unit, item) - itemFit(unit, unit.equipment?.[item.slot]) })).sort((a, b) => b.gain - a.gain);
      const best = candidates[0];
      if (best && best.gain > 0) best.unit.equipment[item.slot] = item;
    }
  }

  function itemFit(unit, item) {
    if (!item) return 0;
    const stats = item.stats || {};
    let value = item.score * (unit.kind === "hero" ? 1.08 : 0.92);
    if (unit.role === "mage" || unit.role === "priest" || unit.role === "warlock" || unit.role === "alchemist") value += (stats.magicPowerAdd || 0) * 1.3;
    if (unit.role === "warrior" || unit.role === "knight" || unit.role === "ranger" || unit.role === "assassin") value += (stats.physicalPowerAdd || 0) * 1.25;
    if (unit.kind === "militia" && unit.id.includes("shield")) value += (stats.maxHpAdd || 0) * 1.25 + (stats.armorAdd || 0) * 18;
    if (unit.role === "priest") value += ((stats.receivedHealingMult || 1) - 1) * 500;
    return value;
  }

  function runAutoPlay(rounds = 18, seed = "auto") {
    const state = createInitialState(seed);
    const checkpoints = [];
    const stageRuns = {};
    for (let i = 0; i < rounds; i += 1) {
      const stage = currentStage(state);
      const gate = stage.encounters.find((item) => item.id.endsWith("_gate"));
      const quality = stage.encounters.find((item) => item.id.endsWith("_quality"));
      const filler = stage.encounters.find((item) => item.id.endsWith("_filler"));
      const previous = checkpoints[checkpoints.length - 1];
      stageRuns[stage.id] = stageRuns[stage.id] || 0;
      const target = previous && !previous.win ? filler
        : stageRuns[stage.id] < 2 ? filler
        : !state.cleared[quality.id] ? quality
        : !state.cleared[gate.id] ? gate
        : filler;
      stageRuns[stage.id] += 1;
      state.selectedEncounter = target.id;
      const before = teamPower(state);
      const result = completeEncounter(state, target.id);
      const after = teamPower(state);
      checkpoints.push({ round: i + 1, encounter: target.name, win: result.win, powerBefore: before, powerAfter: after, loot: state.lastLoot.map((item) => item.rarity), result });
      if (result.win && target.id.endsWith("_gate") && state.selectedStage < STAGES.length - 1) {
        state.selectedStage += 1;
        state.selectedEncounter = STAGES[state.selectedStage].encounters[0].id;
      }
    }
    state.autoSummary = summarizeAutoPlay(checkpoints, state);
    return { state, checkpoints, summary: state.autoSummary };
  }

  function summarizeAutoPlay(checkpoints, state) {
    const wins = checkpoints.filter((item) => item.win).length;
    const epics = checkpoints.flatMap((item) => item.loot).filter((rarity) => rarity === "epic").length;
    const gates = checkpoints.filter((item) => item.encounter.includes("监狱") || item.encounter.includes("营地") || item.encounter.includes("矿井"));
    const firstEpic = checkpoints.find((item) => item.loot.includes("epic"));
    return {
      rounds: checkpoints.length,
      wins,
      finalPower: teamPower(state),
      roster: state.roster.length,
      epics,
      firstEpicRound: firstEpic?.round || 0,
      gateAttempts: gates.length,
      clearedGates: gates.filter((item) => item.win).length,
      verdict: wins >= Math.ceil(checkpoints.length * 0.55) && state.roster.length >= 7 ? "前期闭环可试玩" : "节奏仍需调参",
    };
  }

  function seededRandom(seedText) {
    let seed = 2166136261;
    for (let i = 0; i < String(seedText).length; i += 1) {
      seed ^= String(seedText).charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }
    return () => {
      seed += 0x6D2B79F5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  return {
    STAGES,
    RARITIES,
    SLOTS,
    createInitialState,
    activeTeam,
    currentStage,
    findEncounter,
    buildSpec,
    buildEnemy,
    simulateEncounter,
    completeEncounter,
    rollLoot,
    autoEquip,
    teamPower,
    specPower,
    runAutoPlay,
  };
});
