(() => {
  const SKILL_DATA = window.GAME_SKILL_DATA;
  const BUILD_LAYERS = window.GAME_BUILD_LAYERS;
  const MECHANIC_CURVES = window.GAME_MECHANIC_CURVES;
  const BATTLE = window.GAME_BATTLE_VIEW;
  if (!SKILL_DATA) throw new Error("Equipment grind simulator requires skill data.");
  if (!BUILD_LAYERS) throw new Error("Equipment grind simulator requires build layer data.");

  const SAVE_KEY = "agent_automata_equipment_grind_v3_d10_wave";
  const page = document.body.dataset.page || "battle";

  const ROLE_LABELS = {
    warrior: "战士",
    knight: "骑士",
    berserker: "狂战士",
    assassin: "刺客",
    ranger: "游侠",
    mage: "法师",
    priest: "牧师",
    warlock: "术士",
    bard: "诗人",
    alchemist: "炼金师",
  };
  const ROLE_ICONS = {
    warrior: "⚔️",
    knight: "🛡️",
    berserker: "🪓",
    assassin: "🗡️",
    ranger: "🏹",
    mage: "🔥",
    priest: "✦",
    warlock: "☠️",
    bard: "🎵",
    alchemist: "⚗️",
  };
  const SHADOW_ASSASSIN_KIT = {
    small1: "shadowBurstAmbush",
    small2: "throatCut",
    passive: "shadowMomentum",
    ultimate: "midnightBloom",
  };
  const HERO_DRAFTS = [
    { role: "warrior" },
    { role: "knight" },
    { role: "berserker" },
    { role: "assassin", variant: "poison", label: "毒刃刺客" },
    { role: "assassin", variant: "shadow", label: "暗影刺客" },
    { role: "ranger" },
    { role: "mage" },
    { role: "priest" },
    { role: "warlock" },
    { role: "bard" },
    { role: "alchemist" },
  ];
  const AFFIX_DEFS = {
    might: { label: "武力", category: "major", scale: 0.72 },
    fortitude: { label: "坚韧", category: "major", scale: 0.72 },
    agility: { label: "敏捷", category: "major", scale: 0.72 },
    arcana: { label: "奥术", category: "major", scale: 0.72 },
    rhythm: { label: "节律", category: "major", scale: 0.72 },
    resilience: { label: "韧性", category: "major", scale: 0.72 },
    maxHp: { label: "生命", category: "basic", scale: 15 },
    physicalPower: { label: "物攻", category: "basic", scale: 2.2 },
    magicPower: { label: "法强", category: "basic", scale: 2.2 },
    armor: { label: "护甲", category: "basic", scale: 0.95 },
    attackSpeed: { label: "攻速", category: "basic", scale: 0.01, percent: true },
    skillHaste: { label: "技能急速", category: "basic", scale: 0.01, percent: true },
    effectPower: { label: "效果强度", category: "specialist", scale: 0.012, percent: true },
    effectResist: { label: "效果抗性", category: "basic", scale: 0.008, percent: true },
    receivedHealing: { label: "受治愈增幅", category: "specialist", scale: 0.01, percent: true },
    healPower: { label: "治疗强度", category: "specialist", scale: 1.2 },
    shieldPower: { label: "护盾强度", category: "specialist", scale: 1.2 },
    dotAmp: { label: "DOT 增幅", category: "specialist", scale: 1 },
    controlPower: { label: "控制强度", category: "specialist", scale: 1 },
    critChance: { label: "暴击率", category: "specialist", scale: 1 },
    critDamage: { label: "暴击伤害", category: "specialist", scale: 1 },
    lifeSteal: { label: "吸血", category: "specialist", scale: 1 },
    shieldBreak: { label: "破盾", category: "specialist", scale: 1 },
    armorBreak: { label: "破甲", category: "specialist", scale: 1 },
    initiative: { label: "先手", category: "specialist", scale: 1 },
    fireAmp: { label: "火焰增幅", category: "archetype", scale: 1 },
    poisonAmp: { label: "剧毒增幅", category: "archetype", scale: 1 },
    markPower: { label: "标记强度", category: "archetype", scale: 1 },
    stealthDuration: { label: "隐身持续", category: "archetype", scale: 1 },
    executeDamage: { label: "处决伤害", category: "archetype", scale: 1 },
    lowHpDamage: { label: "低血伤害", category: "archetype", scale: 1 },
    lowHpHealingReceived: { label: "低血受治愈", category: "archetype", scale: 1 },
    counterDamage: { label: "反击伤害", category: "archetype", scale: 1 },
    cleanseEfficiency: { label: "净化效率", category: "archetype", scale: 1 },
    auraPower: { label: "光环强度", category: "archetype", scale: 1 },
    shadowAmp: { label: "暗影增幅", category: "archetype", scale: 1 },
    arcaneAmp: { label: "奥术增幅", category: "archetype", scale: 1 },
  };
  const SLOT_DATA = {
    weapon: {
      label: "武器",
      icon: "⚔️",
      baseOptions: [["physicalPower"], ["magicPower"]],
      affixPool: ["might", "agility", "arcana", "physicalPower", "magicPower", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "executeDamage", "lowHpDamage", "markPower"],
    },
    helm: {
      label: "头盔",
      icon: "🎩",
      baseStats: ["maxHp", "armor"],
      affixPool: ["arcana", "rhythm", "resilience", "magicPower", "skillHaste", "effectPower", "effectResist", "healPower", "controlPower", "critChance", "fireAmp", "poisonAmp", "arcaneAmp", "markPower", "stealthDuration", "cleanseEfficiency", "auraPower"],
    },
    chest: {
      label: "胸甲",
      icon: "🛡️",
      baseStats: ["maxHp", "armor"],
      affixPool: ["fortitude", "resilience", "maxHp", "armor", "effectResist", "receivedHealing", "shieldPower", "lowHpHealingReceived", "counterDamage", "cleanseEfficiency"],
    },
    gloves: {
      label: "护手",
      icon: "🧤",
      baseStats: ["physicalPower", "armor"],
      affixPool: ["might", "agility", "physicalPower", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "markPower", "executeDamage", "lowHpDamage", "counterDamage"],
    },
    legs: {
      label: "腿甲",
      icon: "▰",
      baseStats: ["maxHp", "armor"],
      affixPool: ["fortitude", "resilience", "agility", "maxHp", "armor", "effectResist", "receivedHealing", "skillHaste", "lowHpHealingReceived", "cleanseEfficiency", "counterDamage"],
    },
    boots: {
      label: "靴子",
      icon: "🥾",
      baseStats: ["maxHp", "armor"],
      affixPool: ["agility", "rhythm", "resilience", "attackSpeed", "skillHaste", "effectResist", "initiative", "controlPower", "stealthDuration", "auraPower"],
    },
    ring: {
      label: "戒指",
      icon: "💍",
      baseOptions: [["physicalPower"], ["magicPower"]],
      affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "skillHaste", "effectPower", "effectResist", "dotAmp", "controlPower", "healPower", "shieldPower", "fireAmp", "poisonAmp", "shadowAmp", "markPower", "executeDamage", "lowHpDamage", "lowHpHealingReceived", "auraPower"],
    },
    charm: {
      label: "护符",
      icon: "🔮",
      baseOptions: [["maxHp"], ["magicPower"]],
      affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "effectPower", "receivedHealing", "dotAmp", "healPower", "shieldPower", "controlPower", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "stealthDuration", "cleanseEfficiency", "auraPower", "counterDamage"],
    },
  };
  const STAT_LABELS = {
    ...Object.fromEntries(Object.entries(AFFIX_DEFS).map(([id, def]) => [id, def.label])),
  };
  const RARITIES = [
    { id: "common", label: "普通", affixes: 1, value: 1 },
    { id: "rare", label: "稀有", affixes: 2, value: 1.3 },
    { id: "epic", label: "史诗", affixes: 4, value: 1.9 },
    { id: "legendary", label: "传说", affixes: 7, value: 2.8 },
    { id: "mythic", label: "神话", affixes: 12, value: 4.2 },
  ];
  const EQUIPMENT_LEVEL_BY_TIER = { 1: 20, 2: 40, 3: 60, 4: 100, 5: 150 };
  const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);
  const BAG_CAPACITY = 500;
  const RARITY_RANK = Object.fromEntries(RARITIES.map((rarity, index) => [rarity.id, index]));
  const DUNGEONS = [
    { level: 1, name: "旧路鼠窟", icon: "●", power: 4000, enemyPoints: 0, enemyGear: 0, rewardTier: "18-28", itemLevelRange: [18, 28], rarity: { common: 0.9, rare: 0.1 }, dropCount: 5, enemySets: [["warrior", "warrior", "ranger", "priest"], ["knight", "warrior", "mage", "ranger"], ["berserker", "warrior", "priest", "bard"]] },
    { level: 2, name: "黑松哨站", icon: "◆", power: 9600, enemyPoints: 4, enemyGear: 28, rewardTier: "26-42", itemLevelRange: [26, 42], rarity: { common: 0.62, rare: 0.35, epic: 0.03 }, dropCount: 5, enemySets: [["knight", "warrior", "mage", "priest"], ["warrior", "berserker", "ranger", "bard"], ["assassin", "knight", "warlock", "priest"]] },
    { level: 3, name: "腐火地窟", icon: "●", power: 16000, enemyPoints: 8, enemyGear: 60, rewardTier: "38-64", itemLevelRange: [38, 64], rarity: { common: 0.3, rare: 0.55, epic: 0.14, legendary: 0.01 }, dropCount: 6, enemySets: [["knight", "mage", "mage", "priest"], ["warrior", "alchemist", "warlock", "bard"], ["assassin", "assassin", "knight", "ranger"]] },
    { level: 4, name: "王墓外环", icon: "◆", power: 21900, enemyPoints: 12, enemyGear: 100, rewardTier: "58-84", itemLevelRange: [58, 84], rarity: { rare: 0.5, epic: 0.44, legendary: 0.06 }, dropCount: 5, enemySets: [["knight", "knight", "priest", "ranger"], ["warrior", "berserker", "mage", "bard"], ["assassin", "warlock", "alchemist", "priest"]] },
    { level: 5, name: "龙骨浅层", icon: "●", power: 38900, enemyPoints: 18, enemyGear: 155, rewardTier: "80-120", itemLevelRange: [80, 120], rarity: { rare: 0.175, epic: 0.595, legendary: 0.225, mythic: 0.005 }, dropCount: 6, enemySets: [["knight", "warrior", "mage", "priest"], ["berserker", "assassin", "ranger", "bard"], ["warlock", "alchemist", "mage", "knight"]] },
    { level: 6, name: "灰冠深井", icon: "◆", power: 52500, enemyPoints: 26, enemyGear: 225, rewardTier: "102-136", itemLevelRange: [102, 136], rarity: { epic: 0.64, legendary: 0.335, mythic: 0.025 }, dropCount: 5, enemySets: [["knight", "warrior", "warlock", "priest"], ["berserker", "knight", "mage", "bard"], ["assassin", "ranger", "alchemist", "priest"]] },
    { level: 7, name: "星坠祭坛", icon: "●", power: 64500, enemyPoints: 36, enemyGear: 310, rewardTier: "126-166", itemLevelRange: [126, 166], rarity: { epic: 0.38, legendary: 0.56, mythic: 0.06 }, dropCount: 6, enemySets: [["knight", "knight", "mage", "priest"], ["warrior", "berserker", "warlock", "bard"], ["assassin", "assassin", "ranger", "alchemist"]] },
    { level: 8, name: "夜王门厅", icon: "◆", power: 85800, enemyPoints: 48, enemyGear: 420, rewardTier: "148-178", itemLevelRange: [148, 178], rarity: { epic: 0.18, legendary: 0.7, mythic: 0.12 }, dropCount: 5, enemySets: [["knight", "warrior", "mage", "priest"], ["berserker", "assassin", "warlock", "bard"], ["knight", "alchemist", "mage", "ranger"]] },
    { level: 9, name: "无月王冠", icon: "●", power: 107700, enemyPoints: 62, enemyGear: 540, rewardTier: "170-198", itemLevelRange: [170, 198], rarity: { legendary: 0.78, mythic: 0.22 }, dropCount: 5, enemySets: [["knight", "berserker", "mage", "priest"], ["warrior", "assassin", "warlock", "bard"], ["knight", "alchemist", "mage", "ranger"]] },
    { level: 10, name: "终焉黑冠", icon: "◆", power: 107700, enemyPoints: 110, enemyGear: 1030, rewardTier: "212-250", itemLevelRange: [212, 250], rarity: { legendary: 0.55, mythic: 0.45 }, dropCount: 6, enemySets: [["knight", "berserker", "mage", "priest"], ["warrior", "assassin", "warlock", "bard"], ["knight", "alchemist", "mage", "ranger"]] },
  ];
  const state = {
    rng: seededRandom(`equipment-grind|${Date.now()}`),
    heroes: [],
    inventory: [],
    selectedHeroId: "",
    selectedItemId: "",
    selectedDungeon: 1,
    currentEnemyRoles: [],
    bestClear: 0,
    lastLoot: [],
    sessionLoot: [],
    modalHeroId: "",
    modalMode: "skills",
    battleView: null,
    autoRun: false,
    isFighting: false,
    autoDustMinRarity: "none",
    dustedCount: 0,
    runCount: 0,
  };

  const ids = [
    "teamPower", "bestClear", "rerollBtn", "dungeonName", "dungeonList", "enemyPreview",
    "combatStatus", "combatTitle", "fightBtn", "autoFightBtn", "autoDustSelect", "battleMount", "teamPreview", "lootCount", "lootCountPanel",
    "rewardBurst", "lootLog", "sessionLootCount", "sessionLootLog", "rosterList", "selectedHero", "equippedSlots", "bagCount",
    "bagCountPanel", "bagGrid", "detailTitle", "detailBody", "equipBtn", "manualDustSelect", "manualDustBtn",
    "autoEquipHeroBtn", "autoEquipTeamBtn",
  ];
  const els = Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`)]));

  function init() {
    if (!loadState()) createRoster(false);
    normalizeState();
    bindEvents();
    renderAll();
    if (page === "battle") previewBattle();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      Object.assign(state, {
        heroes: Array.isArray(saved.heroes) ? saved.heroes : [],
        inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
        selectedHeroId: saved.selectedHeroId || "",
        selectedItemId: saved.selectedItemId || "",
        selectedDungeon: Number(saved.selectedDungeon) || 1,
        currentEnemyRoles: Array.isArray(saved.currentEnemyRoles) ? saved.currentEnemyRoles : [],
        bestClear: Number(saved.bestClear) || 0,
        lastLoot: Array.isArray(saved.lastLoot) ? saved.lastLoot : [],
        sessionLoot: Array.isArray(saved.sessionLoot) ? saved.sessionLoot : [],
        autoDustMinRarity: saved.autoDustMinRarity || "none",
        dustedCount: Number(saved.dustedCount) || 0,
        runCount: Number(saved.runCount) || 0,
      });
      return state.heroes.length > 0;
    } catch {
      return false;
    }
  }

  function saveState() {
    const data = {
      heroes: state.heroes,
      inventory: state.inventory,
      selectedHeroId: state.selectedHeroId,
      selectedItemId: state.selectedItemId,
      selectedDungeon: state.selectedDungeon,
      currentEnemyRoles: state.currentEnemyRoles,
      bestClear: state.bestClear,
      lastLoot: state.lastLoot,
      sessionLoot: state.sessionLoot,
      autoDustMinRarity: state.autoDustMinRarity,
      dustedCount: state.dustedCount,
      runCount: state.runCount,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function normalizeState() {
    if (!state.heroes.length) createRoster(false);
    state.heroes.forEach((hero, index) => {
      if (!hero.formation) hero.formation = index < 2 ? "front" : "back";
    });
    if (!heroById(state.selectedHeroId)) state.selectedHeroId = state.heroes[0]?.id || "";
    if (!state.currentEnemyRoles.length) chooseDungeon(state.selectedDungeon, false);
    sortAndTrimBag();
    saveState();
  }

  function createRoster(shouldSave = true) {
    const drafts = pickMany(HERO_DRAFTS, 6);
    state.heroes = drafts.map((draft, index) => {
      const role = draft.role;
      const kit = SKILL_DATA.roleKits[role]?.kit || {};
      const branchKit = draft.variant === "shadow" ? SHADOW_ASSASSIN_KIT : kit;
      const label = draft.label || ROLE_LABELS[role] || role;
      return {
        id: `hero_${Date.now()}_${index}`,
        role,
        variant: draft.variant || "",
        name: `${label}${index + 1}`,
        active: index < 4,
        formation: index < 2 ? "front" : "back",
        equipment: {},
        small1: branchKit.small1,
        small2: branchKit.small2,
        passive: branchKit.passive,
        ultimate: branchKit.ultimate,
      };
    });
    state.selectedHeroId = state.heroes[0]?.id || "";
    state.selectedItemId = "";
    state.inventory = Array.from({ length: 6 }, () => generateItem(DUNGEONS[0]));
    state.bestClear = 0;
    state.lastLoot = [];
    state.sessionLoot = [];
    state.autoRun = false;
    state.dustedCount = 0;
    chooseDungeon(1, false);
    if (shouldSave) saveState();
  }

  function bindEvents() {
    els.rerollBtn?.addEventListener("click", () => {
      createRoster();
      renderAll();
      previewBattle();
    });
    els.fightBtn?.addEventListener("click", fight);
    els.autoFightBtn?.addEventListener("click", toggleAutoRun);
    els.autoDustSelect?.addEventListener("change", () => {
      state.autoDustMinRarity = els.autoDustSelect.value || "none";
      saveState();
      renderTop();
    });
    els.manualDustBtn?.addEventListener("click", dustInventoryByRarity);
    els.equipBtn?.addEventListener("click", equipSelectedItem);
    els.autoEquipHeroBtn?.addEventListener("click", () => autoEquipTargets([selectedHero()].filter(Boolean), "当前角色"));
    els.autoEquipTeamBtn?.addEventListener("click", () => autoEquipTargets(activeHeroes(), "上阵小队"));
    els.dungeonList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-dungeon]");
      if (!button) return;
      chooseDungeon(Number(button.dataset.dungeon));
      renderAll();
      previewBattle();
    });
    els.rosterList?.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-toggle-hero]");
      if (toggle) {
        toggleHero(toggle.dataset.toggleHero);
        return;
      }
      const formation = event.target.closest("[data-formation-hero]");
      if (formation) {
        setHeroFormation(formation.dataset.formationHero, formation.dataset.formation);
        return;
      }
      const modal = event.target.closest("[data-open-hero-modal]");
      if (modal) {
        openCharacterModal(modal.dataset.openHeroModal);
        return;
      }
      const card = event.target.closest("[data-hero]");
      if (!card) return;
      state.selectedHeroId = card.dataset.hero;
      state.selectedItemId = "";
      saveState();
      renderAll();
    });
    els.bagGrid?.addEventListener("click", (event) => {
      const cell = event.target.closest("[data-item]");
      if (!cell) return;
      state.selectedItemId = cell.dataset.item;
      saveState();
      renderAll();
    });
    els.sessionLootLog?.addEventListener("click", (event) => {
      const cell = event.target.closest("[data-session-item]");
      if (!cell) return;
      state.selectedItemId = cell.dataset.sessionItem;
      saveState();
      renderAll();
    });
    els.equippedSlots?.addEventListener("click", (event) => {
      const cell = event.target.closest("[data-equipped-item]");
      if (!cell) return;
      state.selectedItemId = cell.dataset.equippedItem;
      saveState();
      renderAll();
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-character-modal-close]") || event.target.matches(".character-modal-backdrop")) {
        closeCharacterModal();
        return;
      }
      const modeButton = event.target.closest("[data-character-modal-mode]");
      if (!modeButton) return;
      state.modalMode = modeButton.dataset.characterModalMode || "skills";
      renderCharacterModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.modalHeroId) closeCharacterModal();
    });
  }

  function chooseDungeon(level, shouldSave = true) {
    state.selectedDungeon = clamp(level, 1, DUNGEONS.length);
    state.currentEnemyRoles = [...pick(currentDungeon().enemySets)];
    if (shouldSave) saveState();
  }

  function toggleHero(id) {
    const hero = heroById(id);
    if (!hero) return;
    if (!hero.active && activeHeroes().length >= 4) return;
    hero.active = !hero.active;
    if (!activeHeroes().length) hero.active = true;
    if (hero.active && !hero.formation) hero.formation = "back";
    state.selectedHeroId = id;
    saveState();
    renderAll();
    previewBattle();
  }

  function setHeroFormation(id, formation) {
    const hero = heroById(id);
    if (!hero || !["front", "back"].includes(formation)) return;
    hero.formation = formation;
    hero.active = true;
    state.selectedHeroId = id;
    saveState();
    renderAll();
    previewBattle();
  }

  function fight() {
    if (!state.autoRun && !state.isFighting) state.sessionLoot = [];
    startFight(false);
  }

  function toggleAutoRun() {
    if (state.autoRun) {
      stopAutoRun("已停止");
      return;
    }
    if (state.isFighting) return;
    if (isBagFull()) {
      stopAutoRun("仓库已满", true);
      return;
    }
    state.autoRun = true;
    state.sessionLoot = [];
    saveState();
    renderTop();
    startFight(true);
  }

  function startFight(isAuto = false) {
    if (!BATTLE || !els.battleMount) return;
    if (state.isFighting) return;
    if (activeHeroes().length !== 4) {
      state.autoRun = false;
      setCombatStatus("需要 4 人", "loss");
      renderTop();
      return;
    }
    if (isBagFull()) {
      stopAutoRun("仓库已满", true);
      return;
    }
    const dungeon = currentDungeon();
    state.isFighting = true;
    state.runCount += 1;
    state.currentEnemyRoles = [...pick(dungeon.enemySets)];
    saveState();
    renderDungeon();
    renderTeamPreview();
    setCombatStatus("挑战中", "");
    if (els.combatTitle) els.combatTitle.textContent = `${dungeon.name} · ${enemyNames(state.currentEnemyRoles)}`;
    battleView().start({
      leftTeam: activeHeroes().map((hero, index) => buildHeroSpec(hero, index)),
      rightTeam: buildEnemyTeam(dungeon),
      title: dungeon.name,
      seed: `equipment-grind|${state.runCount}|${dungeon.level}`,
      randomizeStats: false,
    });
  }

  function handleFinish(result) {
    state.isFighting = false;
    const win = result.winner === "left" || result.passed;
    const dungeon = currentDungeon();
    setCombatStatus(win ? "胜利" : "失败", win ? "win" : "loss");
    if (win) {
      state.bestClear = Math.max(state.bestClear, dungeon.level);
      const count = dungeon.dropCount || 6;
      const loot = Array.from({ length: count }, () => generateItem(dungeon));
      const kept = loot.filter((item) => !shouldAutoDust(item));
      const dusted = loot.length - kept.length;
      state.dustedCount += dusted;
      const space = Math.max(0, BAG_CAPACITY - state.inventory.length);
      const accepted = kept.slice(0, space);
      const overflow = kept.length - accepted.length;
      state.lastLoot = accepted;
      state.sessionLoot.push(...accepted);
      state.inventory.push(...accepted);
      sortAndTrimBag();
      flashReward(`+${accepted.length} 件装备${dusted ? ` · 分解 ${dusted}` : ""}${overflow ? ` · 溢出 ${overflow}` : ""}`);
      if (overflow > 0 || isBagFull()) {
        stopAutoRun("仓库已满", true);
      }
    } else {
      state.lastLoot = [];
      flashReward(state.autoRun ? "失败无掉落，刷新下一组" : "失败无惩罚，换装再来");
    }
    saveState();
    renderAll();
    if (state.autoRun && !isBagFull()) {
      window.setTimeout(() => startFight(true), 300);
    }
  }

  function previewBattle() {
    if (!BATTLE || !els.battleMount) return;
    battleView().preview({
      leftTeam: activeHeroes().map((hero, index) => buildHeroSpec(hero, index)),
      rightTeam: buildEnemyTeam(currentDungeon()),
      title: currentDungeon().name,
    });
  }

  function battleView() {
    if (!state.battleView) {
      state.battleView = BATTLE.mount({ container: els.battleMount, maxTime: 70, speed: 1.35, onFinish: handleFinish });
    }
    return state.battleView;
  }

  function buildHeroSpec(hero, index) {
    const spec = BUILD_LAYERS.applyBuildLayers(baseHeroSpec(hero), {
      equipmentItems: heroEquipmentItemsForBuildLayer(hero),
      tags: ["equipment-grind-ui"],
    });
    return {
      ...spec,
      slotIndex: index,
    };
  }

  function baseHeroSpec(hero) {
    const kit = SKILL_DATA.roleKits[hero.role] || {};
    const basePower = kit.power || 45;
    return {
      role: hero.role,
      name: hero.name,
      small1: hero.small1,
      small2: hero.small2,
      passive: hero.passive,
      ultimate: hero.ultimate,
      hp: kit.hp || 300,
      maxHp: kit.hp || 300,
      power: basePower,
      physicalPower: basePower,
      magicPower: basePower,
      armor: kit.armor || 0,
      range: kit.range || 14,
    };
  }

  function buildEnemyTeam(dungeon) {
    return state.currentEnemyRoles.map((role, index) => {
      const spec = BUILD_LAYERS.applyBuildLayers(baseEnemySpec(role, dungeon, index), {
        attributePoints: enemyAttributePoints(role, dungeon.enemyPoints || 0),
        equipmentModifiers: enemyEquipmentBundle(role, dungeon.enemyGear || 0),
        tags: ["equipment-grind-enemy"],
      });
      return {
        ...spec,
        slotIndex: index,
      };
    });
  }

  function baseEnemySpec(role, dungeon, index) {
    const kit = SKILL_DATA.roleKits[role] || {};
    const roleKit = kit.kit || {};
    const power = kit.power || 45;
    return {
      role,
      name: `${dungeon.level}级${ROLE_LABELS[role] || role}`,
      small1: roleKit.small1,
      small2: roleKit.small2,
      passive: roleKit.passive,
      ultimate: roleKit.ultimate,
      hp: kit.hp || 300,
      maxHp: kit.hp || 300,
      power,
      physicalPower: power,
      magicPower: power,
      armor: kit.armor || 8,
      range: kit.range || 14,
      slotIndex: index,
    };
  }

  function enemyAttributePoints(role, totalPoints) {
    const [main, secondary] = BUILD_LAYERS.ROLE_ATTRS?.[role] || ["fortitude", "might"];
    const mainPoints = Math.ceil(totalPoints * 0.65);
    const secondaryPoints = Math.max(0, totalPoints - mainPoints);
    return { [main]: mainPoints, [secondary]: secondaryPoints };
  }

  function enemyEquipmentBundle(role, budget) {
    const physical = ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
    const magic = ["mage", "priest", "warlock", "bard", "alchemist"].includes(role);
    return {
      source: "equipment-grind-enemy-gear",
      maxHpAdd: budget * 5.5,
      physicalPowerAdd: budget * (physical ? 0.72 : 0.2),
      magicPowerAdd: budget * (magic ? 0.72 : 0.2),
      armorAdd: budget * 0.16,
      attackSpeedMult: 1 + budget * (physical ? 0.0032 : 0.0012),
      skillHasteMult: 1 + budget * (magic ? 0.0032 : 0.0014),
      effectPowerMult: 1 + budget * (magic ? 0.0022 : 0.001),
      effectResistPct: budget * 0.0008,
      receivedHealingMult: 1 + budget * 0.001,
      mechanicModifiers: {},
      notes: ["enemy equipment budget"],
      debug: { role, budget },
    };
  }

  function generateItem(source = 1, rarityTable) {
    const dungeon = typeof source === "object" && source ? source : null;
    const tier = dungeon ? dungeon.level : source;
    const slotKey = pick(Object.keys(SLOT_DATA));
    const slot = SLOT_DATA[slotKey];
    const rarity = chooseRarity(dungeon?.rarity || rarityTable || { common: 0.6, rare: 0.28, epic: 0.1, legendary: 0.02 });
    const equipmentLevel = dungeon ? rollEquipmentLevel(dungeon.itemLevelRange) : equipmentLevelForTier(tier);
    const affixes = pickAffixStats(slot.affixPool, rarity.affixes).map((stat) => rollAffix(stat, equipmentLevel));
    const baseStats = rollBaseStats(slot, equipmentLevel);
    return {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      slot: slotKey,
      tier,
      dungeonLevel: dungeon?.level || 0,
      equipmentLevel,
      rarity: rarity.id,
      rarityLabel: rarity.label,
      icon: slot.icon,
      name: `${rarity.label}${slot.label} Lv.${equipmentLevel}`,
      baseStats,
      affixes,
    };
  }

  function rollBaseStats(slot, equipmentLevel) {
    const baseStats = slot.baseOptions ? pick(slot.baseOptions) : (slot.baseStats || []);
    return Object.fromEntries(baseStats.map((stat) => [stat, rollDirectStatValue(stat, equipmentLevel)]));
  }

  function rollEquipmentLevel(range) {
    const [minLevel, maxLevel] = Array.isArray(range) ? range : [equipmentLevelForTier(1), equipmentLevelForTier(1)];
    const min = Math.max(1, Math.round(minLevel));
    const max = Math.max(min, Math.round(maxLevel));
    return min + Math.floor(state.rng() * (max - min + 1));
  }

  function rollAffix(stat, equipmentLevel) {
    const level = rollAffixLevel(equipmentLevel);
    return {
      stat,
      value: rollAffixValue(stat, equipmentLevel),
      level,
      category: AFFIX_DEFS[stat]?.category || "mechanic",
    };
  }

  function rollAffixLevel(equipmentLevel) {
    if (equipmentLevel >= 120) return 5;
    if (equipmentLevel >= 80) return 4;
    if (equipmentLevel >= 50) return 3;
    if (equipmentLevel >= 30) return 2;
    return 1;
  }

  function rollAffixValue(stat, equipmentLevel) {
    const def = AFFIX_DEFS[stat] || { category: "mechanic" };
    const variance = 0.88 + state.rng() * 0.24;
    if (def.category === "major") return Math.max(1, Math.round((1.1 + equipmentLevel / 45) * variance));
    if (def.percent || MECHANIC_CURVES?.hasMechanicCurve?.(stat)) return Math.max(1, Math.round((2.5 + equipmentLevel / 7.5) * variance));
    if (stat === "effectResist" || stat === "receivedHealing" || stat === "effectPower") return Math.max(1, Math.round((2.5 + equipmentLevel / 8) * variance));
    return Math.max(1, Math.round((2 + equipmentLevel / 9) * variance));
  }

  function rollDirectStatValue(stat, equipmentLevel) {
    const variance = 0.92 + state.rng() * 0.16;
    const rows = {
      physicalPower: 0.5,
      magicPower: 0.5,
      maxHp: 2.8,
      armor: 0.08,
      attackSpeed: 0.0014,
      skillHaste: 0.0014,
      effectPower: 0.0012,
      effectResist: 0.001,
      receivedHealing: 0.0012,
    };
    const value = equipmentLevel * (rows[stat] || 0.12) * variance;
    return percentStats().includes(stat) ? round(value, 3) : Math.max(1, Math.round(value));
  }

  function equipmentLevelForTier(tier) {
    return EQUIPMENT_LEVEL_BY_TIER[tier] || Math.max(1, Math.round(Number(tier) || 1));
  }

  function equipmentBonus(hero) {
    const bundle = BUILD_LAYERS.buildEquipmentModifierBundle(heroEquipmentItemsForBuildLayer(hero));
    return {
      maxHp: bundle.maxHpAdd || 0,
      physicalPower: bundle.physicalPowerAdd || 0,
      magicPower: bundle.magicPowerAdd || 0,
      armor: bundle.armorAdd || 0,
      attackSpeed: (bundle.attackSpeedMult || 1) - 1,
      skillHaste: (bundle.skillHasteMult || 1) - 1,
      effectPower: (bundle.effectPowerMult || 1) - 1,
      effectResist: bundle.effectResistPct || 0,
      receivedHealing: (bundle.receivedHealingMult || 1) - 1,
      mechanicModifiers: bundle.mechanicModifiers || {},
    };
  }

  function heroEquipmentItemsForBuildLayer(hero) {
    return Object.values(hero.equipment || {}).map((item) => ({
      ...item,
      baseStats: Object.fromEntries(Object.entries(item.baseStats || item.stats || {}).map(([stat, value]) => [
        stat,
        buildLayerAffixValue(stat, value),
      ])),
      affixes: (item.affixes || []).map((affix) => ({
        ...affix,
        id: affix.stat,
        value: buildLayerAffixValue(affix.stat, affix.value, true),
      })),
    }));
  }

  function buildLayerAffixValue(stat, value, isAffix = false) {
    const numeric = Number(value) || 0;
    if (isAffix && MECHANIC_CURVES?.hasMechanicCurve?.(stat)) return numeric;
    return percentStats().includes(stat) ? numeric * 100 : numeric;
  }

  function equipSelectedItem() {
    const hero = selectedHero();
    const item = selectedItem();
    if (!hero || !item || !state.inventory.some((bagItem) => bagItem.id === item.id)) return;
    const before = heroPower(hero);
    const old = hero.equipment[item.slot];
    if (old) state.inventory.push(old);
    hero.equipment[item.slot] = item;
    state.inventory = state.inventory.filter((bagItem) => bagItem.id !== item.id);
    const after = heroPower(hero);
    state.selectedItemId = "";
    sortAndTrimBag();
    saveState();
    renderAll();
    previewBattle();
    if (after > before) showPowerPop(`+${Math.round(after - before)} 战力`);
  }

  function autoEquipTargets(targets, label) {
    const heroes = (targets || []).filter(Boolean);
    if (!heroes.length) return;
    const before = heroes.reduce((sum, hero) => sum + heroPower(hero), 0);
    const available = [...state.inventory];
    heroes.forEach((hero) => {
      Object.values(hero.equipment || {}).forEach((item) => available.push(item));
      hero.equipment = {};
    });

    const usedIds = new Set();
    const sortedHeroes = [...heroes].sort((a, b) => formationRank(a) - formationRank(b) || heroPower(a) - heroPower(b));
    sortedHeroes.forEach((hero) => {
      Object.keys(SLOT_DATA).forEach((slotKey) => {
        const best = bestEquipCandidate(hero, slotKey, available, usedIds);
        if (!best) return;
        hero.equipment[slotKey] = best;
        usedIds.add(best.id);
      });
    });

    state.inventory = available.filter((item) => !usedIds.has(item.id));
    const after = heroes.reduce((sum, hero) => sum + heroPower(hero), 0);
    state.selectedItemId = "";
    sortAndTrimBag();
    saveState();
    renderAll();
    previewBattle();
    showPowerPop(`${label} 自动配装 ${after >= before ? "+" : ""}${Math.round(after - before)} 战力`);
  }

  function bestEquipCandidate(hero, slotKey, available, usedIds) {
    let best = null;
    let bestScore = -Infinity;
    available.forEach((item) => {
      if (!item || usedIds.has(item.id) || item.slot !== slotKey) return;
      const score = itemScoreForHero(item, hero);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    });
    return best;
  }

  function sortAndTrimBag() {
    const equippedIds = new Set(state.heroes.flatMap((hero) => Object.values(hero.equipment || {}).map((item) => item.id)));
    state.inventory = state.inventory.filter((item) => !equippedIds.has(item.id)).sort((a, b) => itemScore(b) - itemScore(a)).slice(0, BAG_CAPACITY);
  }

  function renderAll() {
    renderTop();
    renderDungeon();
    renderTeamPreview();
    renderRoster();
    renderEquipment();
    renderBag();
    renderSessionLoot();
    renderDetail();
    renderCharacterModal();
  }

  function ensureCharacterModal() {
    let root = document.querySelector("#characterModalRoot");
    if (!root) {
      root = document.createElement("div");
      root.id = "characterModalRoot";
      root.className = "character-modal-root";
      document.body.appendChild(root);
    }
    return root;
  }

  function openCharacterModal(heroId) {
    state.modalHeroId = heroId;
    state.modalMode = "skills";
    renderCharacterModal();
  }

  function closeCharacterModal() {
    state.modalHeroId = "";
    renderCharacterModal();
  }

  function renderCharacterModal() {
    const root = ensureCharacterModal();
    const hero = heroById(state.modalHeroId);
    if (!hero) {
      root.innerHTML = "";
      return;
    }
    const isStats = state.modalMode === "stats";
    const leftSlots = ["weapon", "helm", "chest", "gloves"].map((slotKey) => modalEquipmentSlot(hero, slotKey)).join("");
    const rightSlots = ["legs", "boots", "ring", "charm"].map((slotKey) => modalEquipmentSlot(hero, slotKey)).join("");
    root.innerHTML = `<div class="character-modal-backdrop">
      <section class="character-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(hero.name)}">
        <header class="character-modal-head">
          <div>
            <span>${heroRoleLabel(hero)}</span>
            <strong>${ROLE_ICONS[hero.role] || "●"} ${escapeHtml(hero.name)}</strong>
          </div>
          <div class="character-modal-actions">
            <button type="button" class="${isStats ? "" : "active"}" data-character-modal-mode="skills">技能</button>
            <button type="button" class="${isStats ? "active" : ""}" data-character-modal-mode="stats">数值详情</button>
            <button type="button" class="ghost-close" data-character-modal-close>关闭</button>
          </div>
        </header>
        <div class="character-modal-stage">
          <div class="modal-equip-column">${leftSlots}</div>
          <div class="modal-portrait">
            <div class="modal-portrait-art">${ROLE_ICONS[hero.role] || "●"}</div>
            <strong>${escapeHtml(hero.name)}</strong>
            <span>战力 ${Math.round(heroPower(hero))}</span>
            <em>${skillSummary(hero)}</em>
          </div>
          <div class="modal-equip-column">${rightSlots}</div>
        </div>
        <div class="character-modal-bottom ${isStats ? "stats-mode" : ""}">
          ${isStats ? statsGrid(hero) : skillGrid(hero)}
        </div>
      </section>
    </div>`;
  }

  function modalEquipmentSlot(hero, slotKey) {
    const slot = SLOT_DATA[slotKey];
    const item = hero.equipment?.[slotKey];
    return `<div class="modal-equip-slot ${item ? `rarity-${item.rarity}` : "empty"}">
      <span>${item?.icon || slot.icon}</span>
      <strong>${slot.label}</strong>
      <small>${item ? `${escapeHtml(item.name)} · D${item.tier}` : "空"}</small>
    </div>`;
  }

  function skillGrid(hero) {
    return [
      ["被动", hero.passive],
      ["小技能", hero.small1],
      ["小技能", hero.small2],
      ["大招", hero.ultimate],
    ].map(([label, key]) => skillCard(label, key)).join("");
  }

  function skillCard(label, key) {
    const skill = SKILL_DATA.skills?.[key] || {};
    const cooldown = Number(skill.cooldown || skill.cd || 0);
    return `<article class="modal-skill-card">
      <span>${label}</span>
      <strong>${escapeHtml(skill.name || key || "-")}</strong>
      <p>${escapeHtml(skill.desc || skill.description || "暂无描述")}</p>
      <em>${cooldown > 0 ? `CD ${round(cooldown, 1)}s` : "常驻"}</em>
    </article>`;
  }

  function statsGrid(hero) {
    return characterStats(hero).map((stat) => `<div class="modal-stat-cell">
      <span>${stat.label}</span>
      <strong>${stat.value}</strong>
      <small>${stat.note}</small>
    </div>`).join("");
  }

  function characterStats(hero) {
    const kit = SKILL_DATA.roleKits[hero.role] || {};
    const bonus = equipmentBonus(hero);
    return [
      { label: "生命", value: Math.round((kit.hp || 0) + bonus.maxHp), note: `装备 +${Math.round(bonus.maxHp)}` },
      { label: "物攻", value: round((kit.power || 0) + bonus.physicalPower, 1), note: `装备 +${round(bonus.physicalPower, 1)}` },
      { label: "法强", value: round((kit.magicPower || 0) + bonus.magicPower, 1), note: `装备 +${round(bonus.magicPower, 1)}` },
      { label: "护甲", value: round((kit.armor || 0) + bonus.armor, 1), note: `装备 +${round(bonus.armor, 1)}` },
      { label: "攻速", value: `${Math.round((1 + bonus.attackSpeed) * 100)}%`, note: `装备 +${Math.round(bonus.attackSpeed * 100)}%` },
      { label: "急速", value: `${Math.round(bonus.skillHaste * 100)}%`, note: "技能冷却收益" },
      { label: "效果", value: `${Math.round((bonus.effectPower + bonus.effectResist) * 100)}%`, note: "效果强度/抗性" },
    ];
  }

  function renderTop() {
    if (els.teamPower) els.teamPower.textContent = String(Math.round(teamPower()));
    if (els.bestClear) els.bestClear.textContent = String(state.bestClear);
    if (els.fightBtn) els.fightBtn.disabled = activeHeroes().length !== 4 || state.autoRun || state.isFighting;
    if (els.autoFightBtn) {
      els.autoFightBtn.textContent = state.autoRun ? "停止" : "持续刷";
      els.autoFightBtn.classList.toggle("active", state.autoRun);
      els.autoFightBtn.disabled = activeHeroes().length !== 4 || (!state.autoRun && state.isFighting);
    }
    if (els.autoDustSelect) els.autoDustSelect.value = state.autoDustMinRarity || "none";
  }

  function renderDungeon() {
    const current = currentDungeon();
    if (els.dungeonName) els.dungeonName.textContent = `Lv.${current.level} ${current.name}`;
    if (els.dungeonList) {
      els.dungeonList.innerHTML = DUNGEONS.map((dungeon) => {
        const unlocked = dungeon.level <= Math.max(1, state.bestClear + 1);
        return `<button class="dungeon-card ${dungeon.level === state.selectedDungeon ? "active" : ""} ${unlocked ? "" : "locked"}" type="button" data-dungeon="${dungeon.level}" ${unlocked ? "" : "disabled"}>
          <span class="dungeon-icon">${dungeon.icon}</span>
          <span><strong>${escapeHtml(dungeon.name)}</strong><small>建议 ${dungeon.power} · 掉落 Lv.${dungeon.rewardTier}</small></span>
          <span class="dungeon-lv">Lv.${dungeon.level}</span>
        </button>`;
      }).join("");
    }
    if (els.enemyPreview) {
      els.enemyPreview.innerHTML = state.currentEnemyRoles.map((role) => `<div class="enemy-chip"><strong>${ROLE_ICONS[role] || "●"} ${ROLE_LABELS[role] || role}</strong>${enemySkillRows(role)}</div>`).join("");
    }
  }

  function renderTeamPreview() {
    if (!els.teamPreview) return;
    els.teamPreview.innerHTML = activeHeroes().map((hero) => `<div class="unit-skill-card ${hero.id === state.selectedHeroId ? "selected" : ""}">
      <strong>${ROLE_ICONS[hero.role] || "●"} ${escapeHtml(hero.name)} · ${formationLabel(hero)}</strong>
      <span><b>被动</b>${skillName(hero.passive)}</span>
      <span><b>小技</b>${skillName(hero.small1)} / ${skillName(hero.small2)}</span>
      <span><b>大招</b>${skillName(hero.ultimate)}</span>
    </div>`).join("");
  }

  function renderRoster() {
    if (!els.rosterList) return;
    els.rosterList.innerHTML = state.heroes.map((hero) => `<div class="hero-card ${hero.active ? "active" : ""} ${hero.id === state.selectedHeroId ? "selected" : ""}" role="button" tabindex="0" data-hero="${hero.id}">
      ${hero.active ? `<span class="team-mark">${formationLabel(hero)}</span>` : ""}
      <span class="hero-avatar">${ROLE_ICONS[hero.role] || "●"}</span>
      <span>
        <strong>${escapeHtml(hero.name)}</strong>
        <span>${heroRoleLabel(hero)} · 战力 ${Math.round(heroPower(hero))} · ${hero.active ? formationLabel(hero) : "待命"}</span>
        <span>${skillSummary(hero)}</span>
        <span class="hero-actions">
          <button type="button" data-toggle-hero="${hero.id}">${hero.active ? "下阵" : "上阵"}</button>
          <button type="button" class="${hero.formation === "front" ? "active" : ""}" data-formation-hero="${hero.id}" data-formation="front">前排</button>
          <button type="button" class="${hero.formation === "back" ? "active" : ""}" data-formation-hero="${hero.id}" data-formation="back">后排</button>
          ${page === "team" ? `<button type="button" data-open-hero-modal="${hero.id}">详情</button>` : ""}
        </span>
      </span>
    </div>`).join("");
  }

  function renderEquipment() {
    if (!els.selectedHero && !els.equippedSlots) return;
    const hero = selectedHero();
    if (!hero) {
      if (els.selectedHero) els.selectedHero.innerHTML = "<strong>未选择角色</strong>";
      if (els.equippedSlots) els.equippedSlots.innerHTML = "";
      return;
    }
    const bonus = equipmentBonus(hero);
    if (els.selectedHero) {
      els.selectedHero.innerHTML = `<strong>${ROLE_ICONS[hero.role] || "●"} ${escapeHtml(hero.name)}</strong><span>${heroRoleLabel(hero)} · 战力 ${Math.round(heroPower(hero))}</span><span>生命 +${Math.round(bonus.maxHp)} / 物攻 +${round(bonus.physicalPower, 1)} / 法强 +${round(bonus.magicPower, 1)} / 护甲 +${round(bonus.armor, 1)}</span>`;
    }
    if (els.equippedSlots) {
      els.equippedSlots.innerHTML = Object.entries(SLOT_DATA).map(([slotKey, slot]) => {
        const item = hero.equipment[slotKey];
        return `<button class="slot-cell ${item ? `rarity-${item.rarity}` : ""} ${item?.id === state.selectedItemId ? "selected" : ""}" type="button" ${item ? `data-equipped-item="${item.id}"` : ""}>
          <small>${slot.label}</small><span>${item?.icon || slot.icon}</span><small>${item ? `D${item.tier} ${item.rarityLabel}` : "空"}</small>
        </button>`;
      }).join("");
    }
  }

  function renderBag() {
    const bagText = `${state.inventory.length}/${BAG_CAPACITY}`;
    if (els.bagCount) els.bagCount.textContent = bagText;
    if (els.bagCountPanel) els.bagCountPanel.textContent = bagText;
    if (els.bagGrid) {
      const bagItems = bagItemsForDisplay();
      els.bagGrid.innerHTML = Array.from({ length: BAG_CAPACITY }, (_, i) => {
        const item = bagItems[i];
        const owner = item ? itemOwner(item.id) : null;
        return item ? `<button class="bag-cell rarity-${item.rarity} ${owner ? "equipped" : ""} ${item.id === state.selectedItemId ? "selected" : ""}" type="button" data-item="${item.id}" title="${escapeHtml(item.name)}${owner ? ` · ${owner.name}` : ""}"><span>${item.icon}</span><small>D${item.tier}</small>${owner ? `<em>${escapeHtml(owner.name)}</em>` : ""}</button>` : `<div class="bag-cell"></div>`;
      }).join("");
    }
    const lootText = `${state.lastLoot.length} 件`;
    if (els.lootCount) els.lootCount.textContent = lootText;
    if (els.lootCountPanel) els.lootCountPanel.textContent = lootText;
    if (els.lootLog) {
      els.lootLog.innerHTML = state.lastLoot.length ? state.lastLoot.map((item) => `<div class="loot-row rarity-${item.rarity}"><span class="item-icon">${item.icon}</span><span><strong>${escapeHtml(item.name)}</strong><span>${formatAffixes(item)}</span></span></div>`).join("") : `<div class="loot-row"><span class="item-icon">◇</span><span><strong>暂无掉落</strong><span>打赢副本后显示</span></span></div>`;
    }
  }

  function renderSessionLoot() {
    if (!els.sessionLootLog) return;
    const items = state.sessionLoot || [];
    if (els.sessionLootCount) els.sessionLootCount.textContent = `${items.length} 件`;
    els.sessionLootLog.innerHTML = items.length
      ? items.map((item) => `<button class="session-loot-cell rarity-${item.rarity}" type="button" data-session-item="${item.id}" title="${escapeHtml(item.name)}"><span>${item.icon}</span><small>${item.rarityLabel || item.rarity}</small></button>`).join("")
      : `<div class="session-loot-empty">本次开刷保留的装备会显示在这里，自动分解的不计入。</div>`;
  }

  function renderDetail() {
    if (!els.detailTitle || !els.detailBody) return;
    const item = selectedItem();
    const hero = selectedHero();
    if (!item) {
      els.detailTitle.textContent = hero ? hero.name : "未选择";
      els.detailBody.innerHTML = hero ? heroDetail(hero) : "选择角色或装备。";
      if (els.equipBtn) els.equipBtn.disabled = true;
      return;
    }
    const current = hero?.equipment?.[item.slot];
    const owner = itemOwner(item.id);
    const delta = hero ? itemScoreForHero(item, hero) - itemScoreForHero(current, hero) : 0;
    els.detailTitle.textContent = item.name;
    els.detailBody.innerHTML = `<div class="detail-name">${item.icon} ${escapeHtml(item.name)}</div>
      <div>部位：${SLOT_DATA[item.slot]?.label || item.slot} · 副本 D${item.tier} · ${item.rarityLabel}</div>
      <div class="owner-line">${owner ? `已装备：${escapeHtml(owner.name)}` : "未装备"}</div>
      ${hero ? `<div>对 ${escapeHtml(hero.name)}：${delta >= 0 ? "+" : ""}${Math.round(delta)} 装备评分</div>` : ""}
      <div class="affix-list">${itemStatRows(item).join("")}</div>`;
    if (els.equipBtn) els.equipBtn.disabled = !hero || !state.inventory.some((bagItem) => bagItem.id === item.id);
  }

  function heroDetail(hero) {
    return `<div class="detail-name">${ROLE_ICONS[hero.role] || "●"} ${escapeHtml(hero.name)}</div>
      <div>${heroRoleLabel(hero)} · 当前战力 ${Math.round(heroPower(hero))}</div>
      <div class="affix-list">
        <div class="affix"><span>被动</span><b>${skillName(hero.passive)}</b></div>
        <div class="affix"><span>小技能</span><b>${skillName(hero.small1)} / ${skillName(hero.small2)}</b></div>
        <div class="affix"><span>大招</span><b>${skillName(hero.ultimate)}</b></div>
      </div>`;
  }

  function setCombatStatus(text, tone) {
    if (!els.combatStatus) return;
    els.combatStatus.textContent = text;
    els.combatStatus.className = `status-pill ${tone || ""}`.trim();
  }

  function flashReward(text) {
    if (!els.rewardBurst) return;
    els.rewardBurst.textContent = text;
    els.rewardBurst.classList.remove("flash");
    void els.rewardBurst.offsetWidth;
    els.rewardBurst.classList.add("flash");
  }

  function currentDungeon() { return DUNGEONS.find((item) => item.level === state.selectedDungeon) || DUNGEONS[0]; }
  function isBagFull() { return state.inventory.length >= BAG_CAPACITY; }
  function shouldAutoDust(item) {
    const min = state.autoDustMinRarity || "none";
    if (min === "none") return false;
    return (RARITY_RANK[item.rarity] ?? 0) < (RARITY_RANK[min] ?? 0);
  }
  function dustInventoryByRarity() {
    const maxRarity = els.manualDustSelect?.value || "common";
    const maxRank = RARITY_RANK[maxRarity] ?? 0;
    const dustedIds = new Set();
    const kept = [];
    for (const item of state.inventory) {
      if ((RARITY_RANK[item.rarity] ?? 0) <= maxRank) {
        dustedIds.add(item.id);
      } else {
        kept.push(item);
      }
    }
    if (!dustedIds.size) {
      flashReward("没有可分解装备");
      return;
    }
    state.inventory = kept;
    state.lastLoot = state.lastLoot.filter((item) => !dustedIds.has(item.id));
    state.sessionLoot = state.sessionLoot.filter((item) => !dustedIds.has(item.id));
    if (dustedIds.has(state.selectedItemId)) state.selectedItemId = "";
    state.dustedCount += dustedIds.size;
    saveState();
    renderAll();
    flashReward(`分解 ${dustedIds.size} 件装备`);
  }
  function stopAutoRun(message, showDialog = false) {
    state.autoRun = false;
    state.sessionLoot = [];
    setCombatStatus(message || "已停止", showDialog ? "loss" : "");
    saveState();
    renderAll();
    if (showDialog) window.alert(`${message || "仓库已满"}，持续刷已停止。`);
  }
  function activeHeroes() {
    return state.heroes
      .filter((hero) => hero.active)
      .sort((a, b) => formationRank(a) - formationRank(b) || state.heroes.indexOf(a) - state.heroes.indexOf(b))
      .slice(0, 4);
  }
  function formationRank(hero) { return hero.formation === "front" ? 0 : 1; }
  function formationLabel(hero) { return hero.formation === "front" ? "前排" : "后排"; }
  function heroRoleLabel(hero) {
    if (hero?.role === "assassin" && hero.variant === "shadow") return "暗影刺客";
    if (hero?.role === "assassin" && hero.variant === "poison") return "毒刃刺客";
    return ROLE_LABELS[hero?.role] || hero?.role || "-";
  }
  function selectedHero() { return heroById(state.selectedHeroId); }
  function heroById(id) { return state.heroes.find((hero) => hero.id === id); }
  function selectedItem() { return [...state.inventory, ...state.heroes.flatMap((hero) => Object.values(hero.equipment || {}))].find((item) => item.id === state.selectedItemId); }
  function equippedItems() { return state.heroes.flatMap((hero) => Object.values(hero.equipment || {})); }
  function bagItemsForDisplay() { return [...equippedItems(), ...state.inventory]; }
  function itemOwner(itemId) {
    for (const hero of state.heroes) {
      if (Object.values(hero.equipment || {}).some((item) => item.id === itemId)) return hero;
    }
    return null;
  }
  function teamPower() { return activeHeroes().reduce((sum, hero) => sum + heroPower(hero), 0); }
  function heroPower(hero) {
    const kit = SKILL_DATA.roleKits[hero.role] || {};
    const bonus = equipmentBonus(hero);
    return (kit.hp || 300) * 0.5
      + (kit.power || 45) * 8
      + (kit.armor || 8) * 16
      + bonus.maxHp * 0.62
      + bonus.physicalPower * rolePhysicalWeight(hero.role) * 13
      + bonus.magicPower * roleMagicWeight(hero.role) * 13
      + bonus.armor * 18
      + bonus.attackSpeed * rolePhysicalWeight(hero.role) * 420
      + bonus.skillHaste * roleSkillWeight(hero.role) * 410
      + bonus.effectPower * roleEffectWeight(hero.role) * 360
      + bonus.effectResist * 260
      + bonus.receivedHealing * 280
      + mechanicPower(hero, bonus.mechanicModifiers);
  }
  function itemScore(item) {
    if (!item) return 0;
    const rarityValue = { common: 1, rare: 1.35, epic: 1.7, legendary: 2.15, mythic: 2.65 }[item.rarity] || 1;
    const baseScore = Object.entries(item.baseStats || item.stats || {}).reduce((sum, [stat, value]) => sum + normalizedStatScore(stat, value), 0);
    const levelScore = Number(item.equipmentLevel || 0) * 1.6;
    return Math.round(levelScore + rarityValue * 24 + baseScore + (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScore(affix.stat, affix.value), 0));
  }
  function itemScoreForHero(item, hero) {
    if (!item || !hero) return 0;
    const rarityValue = { common: 1, rare: 1.35, epic: 1.7, legendary: 2.15, mythic: 2.65 }[item.rarity] || 1;
    const baseScore = Object.entries(item.baseStats || item.stats || {}).reduce((sum, [stat, value]) => sum + normalizedStatScoreForHero(stat, value, hero), 0);
    const affixScore = (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScoreForHero(affix.stat, affix.value, hero), 0);
    const levelScore = Number(item.equipmentLevel || 0) * 1.1;
    return Math.round(levelScore + rarityValue * 18 + baseScore + affixScore);
  }
  function normalizedStatScore(stat, value) {
    return normalizedStatScoreForHero(stat, value, null);
  }
  function normalizedStatScoreForHero(stat, value, hero) {
    const numeric = Number(value) || 0;
    const role = hero?.role || "";
    if (BUILD_LAYERS.ATTR_ORDER?.includes(stat)) return numeric * 55 * roleAttributeWeight(role, stat);
    const curvePoints = MECHANIC_CURVES?.hasMechanicCurve?.(stat) ? numeric : percentStats().includes(stat) ? numeric * 100 : numeric;
    const curveValue = MECHANIC_CURVES?.hasMechanicCurve?.(stat) ? MECHANIC_CURVES.mechanicCurveValue(stat, curvePoints) * 100 : numeric;
    const weights = {
      maxHp: 0.55,
      physicalPower: 8 * rolePhysicalWeight(role),
      magicPower: 8 * roleMagicWeight(role),
      armor: 12,
      attackSpeed: 320 * rolePhysicalWeight(role),
      skillHaste: 330 * roleSkillWeight(role),
      effectPower: 285 * roleEffectWeight(role),
      effectResist: 210,
      receivedHealing: 220 * roleFrontlineWeight(role),
      healPower: 18 * roleHealWeight(role),
      shieldPower: 18 * roleShieldWeight(role),
      dotAmp: 16 * roleDotWeight(role),
      controlPower: 15 * roleControlWeight(role),
      critChance: 13 * roleCritWeight(role),
      critDamage: 13 * roleCritWeight(role),
      lifeSteal: 18 * roleLifeStealWeight(role),
      shieldBreak: 12 * rolePhysicalWeight(role),
      armorBreak: 12 * rolePhysicalWeight(role),
      initiative: 14 * roleInitiativeWeight(role),
      fireAmp: 18 * (["mage", "alchemist", "ranger"].includes(role) ? 1 : 0.35),
      poisonAmp: 18 * (["warlock", "alchemist", "assassin"].includes(role) ? 1 : 0.35),
      shadowAmp: 18 * (["assassin", "warlock"].includes(role) ? 1 : 0.35),
      arcaneAmp: 18 * (["mage", "warlock", "alchemist", "priest", "bard"].includes(role) ? 0.9 : 0.25),
      markPower: 18 * (["ranger", "assassin"].includes(role) ? 1 : 0.25),
      stealthDuration: 20 * (role === "assassin" ? 1 : role === "ranger" ? 0.82 : 0.12),
      executeDamage: 17 * (["assassin", "ranger", "warrior"].includes(role) ? 1 : 0.25),
      lowHpDamage: 18 * (["berserker", "warlock", "warrior"].includes(role) ? 1 : 0.25),
      lowHpHealingReceived: 18 * (["berserker", "knight", "warrior"].includes(role) ? 1 : 0.28),
      counterDamage: 16 * (["knight", "warrior"].includes(role) ? 1 : 0.3),
      cleanseEfficiency: 17 * (["priest", "bard", "alchemist"].includes(role) ? 1 : 0.35),
      auraPower: 18 * (["bard", "priest", "knight"].includes(role) ? 1 : 0.35),
    };
    return (weights[stat] || 2.5) * curveValue;
  }
  function rolePhysicalWeight(role) { return ["warrior", "berserker", "assassin", "ranger", "knight"].includes(role) ? 1 : 0.45; }
  function roleMagicWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard"].includes(role) ? 1 : 0.35; }
  function roleSkillWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard", "knight"].includes(role) ? 1 : 0.65; }
  function roleEffectWeight(role) { return ["mage", "warlock", "alchemist", "priest", "bard"].includes(role) ? 1 : 0.5; }
  function roleFrontlineWeight(role) { return ["knight", "warrior", "berserker"].includes(role) ? 1 : 0.55; }
  function roleHealWeight(role) { return role === "priest" ? 1 : role === "bard" ? 0.7 : 0.25; }
  function roleShieldWeight(role) { return ["knight", "priest"].includes(role) ? 1 : role === "bard" ? 0.7 : 0.3; }
  function roleDotWeight(role) { return ["warlock", "alchemist", "mage", "assassin"].includes(role) ? 1 : 0.35; }
  function roleControlWeight(role) { return ["mage", "bard", "alchemist", "warlock"].includes(role) ? 1 : 0.4; }
  function roleCritWeight(role) { return ["ranger", "assassin", "warrior"].includes(role) ? 1 : 0.35; }
  function roleLifeStealWeight(role) { return ["berserker", "assassin", "warrior"].includes(role) ? 1 : 0.25; }
  function roleInitiativeWeight(role) { return ["assassin", "ranger", "mage", "bard"].includes(role) ? 1 : 0.55; }
  function roleAttributeWeight(role, attr) {
    const [main, secondary] = BUILD_LAYERS.ROLE_ATTRS?.[role] || [];
    if (attr === main) return 1.25;
    if (attr === secondary) return 1;
    return 0.48;
  }
  function mechanicPower(hero, modifiers = {}) {
    return Object.entries(modifiers).reduce((sum, [key, value]) => {
      const stat = key.startsWith("attribute:") ? key.slice("attribute:".length) : key;
      return sum + normalizedStatScoreForHero(stat, value, hero) * 0.42;
    }, 0);
  }
  function chooseRarity(table) {
    const roll = state.rng();
    let cursor = 0;
    for (const rarity of RARITIES) {
      cursor += table[rarity.id] || 0;
      if (roll <= cursor) return rarity;
    }
    return RARITIES.filter((rarity) => table[rarity.id]).pop() || RARITIES[0];
  }
  function pick(list) { return list[Math.floor(state.rng() * list.length)]; }
  function pickMany(list, count) {
    const pool = [...list];
    const result = [];
    while (pool.length && result.length < count) result.push(pool.splice(Math.floor(state.rng() * pool.length), 1)[0]);
    return result;
  }
  function pickAffixStats(list, count) {
    const pool = list.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
    const focusStats = pickMany(pool, Math.min(2, pool.length));
    const focusSlots = focusStats.length ? Math.floor(count * 0.5) : 0;
    const result = [];
    for (let i = 0; i < count; i += 1) {
      result.push(i < focusSlots ? focusStats[i % focusStats.length] : pick(pool));
    }
    return result;
  }
  function seededRandom(seedText) {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i += 1) {
      seed ^= seedText.charCodeAt(i);
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
  function skillSummary(roleOrHero) {
    if (typeof roleOrHero === "object" && roleOrHero) {
      return [roleOrHero.small1, roleOrHero.passive, roleOrHero.ultimate].map(skillName).join(" · ");
    }
    const kit = SKILL_DATA.roleKits[roleOrHero]?.kit || {};
    return [kit.small1, kit.passive, kit.ultimate].map(skillName).join(" · ");
  }
  function enemySkillRows(role) {
    const kit = SKILL_DATA.roleKits[role]?.kit || {};
    return `<span><b>被动</b>${skillName(kit.passive)}</span><span><b>小技</b>${skillName(kit.small1)} / ${skillName(kit.small2)}</span><span><b>大招</b>${skillName(kit.ultimate)}</span>`;
  }
  function skillName(key) { return SKILL_DATA.skills?.[key]?.name || key || "-"; }
  function enemyNames(roles) { return roles.map((role) => ROLE_LABELS[role] || role).join(" / "); }
  function itemStatRows(item) {
    const baseRows = Object.entries(item.baseStats || item.stats || {}).map(([stat, value]) => `<div class="affix base"><span>基础 · ${STAT_LABELS[stat] || stat}</span><b>${formatBaseValue(stat, value)}</b></div>`);
    const affixRows = mergedAffixes(item).map((affix) => `<div class="affix"><span>${STAT_LABELS[affix.stat] || affix.stat}${affix.level ? ` ${romanLevel(affix.level)}` : ""}${affix.count > 1 ? ` ×${affix.count}` : ""}</span><b>${formatAffixValue(affix.stat, affix.value)}</b></div>`);
    return [...baseRows, ...affixRows];
  }
  function formatAffixes(item) {
    const base = Object.entries(item.baseStats || item.stats || {}).map(([stat, value]) => `基础${STAT_LABELS[stat] || stat} ${formatBaseValue(stat, value)}`);
    const affixes = mergedAffixes(item).map((affix) => `${STAT_LABELS[affix.stat] || affix.stat}${affix.level ? romanLevel(affix.level) : ""}${affix.count > 1 ? `×${affix.count}` : ""} ${formatAffixValue(affix.stat, affix.value)}`);
    return [...base, ...affixes].join(" · ");
  }
  function mergedAffixes(item) {
    const merged = new Map();
    for (const affix of item.affixes || []) {
      const stat = affix.stat || affix.id;
      if (!stat) continue;
      const current = merged.get(stat) || { stat, value: 0, level: 0, count: 0 };
      current.value += Number(affix.value) || 0;
      current.level = Math.max(current.level || 0, Number(affix.level) || 0);
      current.count += 1;
      merged.set(stat, current);
    }
    return [...merged.values()].map((affix) => ({ ...affix, value: round(affix.value, 3) }));
  }
  function formatBaseValue(stat, value) { return percentStats().includes(stat) ? `+${Math.round(value * 100)}%` : `+${value}`; }
  function formatAffixValue(stat, value) { return MECHANIC_CURVES?.hasMechanicCurve?.(stat) ? `+${value}点` : `+${value}`; }
  function percentStats() { return Object.entries(AFFIX_DEFS).filter(([, def]) => def.percent).map(([id]) => id); }
  function romanLevel(level) { return ["", "I", "II", "III", "IV", "V"][level] || String(level); }
  function showPowerPop(text) {
    const node = document.createElement("div");
    node.className = "power-pop";
    node.textContent = text;
    node.style.left = "50%";
    node.style.top = "52%";
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1000);
  }
  function round(value, digits = 2) { return Number(Number(value || 0).toFixed(digits)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
  }

  window.EquipmentGrindSimulator = { state, DUNGEONS, generateItem, chooseDungeon, fight, equipSelectedItem, autoEquipTargets, buildHeroSpec, buildEnemyTeam, saveState };
  init();
})();
