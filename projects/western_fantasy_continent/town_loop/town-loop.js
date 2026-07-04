(() => {
  const SKILL_DATA = window.GAME_SKILL_DATA || {};
  const BUILD_LAYERS = window.GAME_BUILD_LAYERS || {};
  const MECHANIC_CURVES = window.GAME_MECHANIC_CURVES || {};
  const BATTLE = window.GAME_BATTLE_VIEW || {};
  const COMBAT = window.GAME_COMBAT_SIM || {};
  const SAVE_KEY = "agent_automata_town_loop_v2_team_slots";
  const BAG_CAPACITY = 500;
  let currentPage = document.body.dataset.page || "town";
  let page = currentPage;

  const ROLE_LABELS = {
    warrior: "战士", knight: "骑士", berserker: "狂战士", assassin: "刺客", ranger: "游侠",
    mage: "法师", priest: "牧师", warlock: "术士", bard: "诗人", alchemist: "炼金师",
  };
  const ROLE_ICONS = {
    warrior: "W", knight: "K", berserker: "B", assassin: "A", ranger: "R",
    mage: "M", priest: "P", warlock: "L", bard: "D", alchemist: "C",
  };
  const HERO_DRAFTS = [
    { role: "warrior" }, { role: "knight" }, { role: "berserker" },
    { role: "assassin", variant: "poison", label: "毒刃刺客" },
    { role: "assassin", variant: "shadow", label: "暗影刺客" },
    { role: "ranger" }, { role: "mage" }, { role: "priest" },
    { role: "warlock" }, { role: "bard" }, { role: "alchemist" },
  ];
  const SHADOW_ASSASSIN_KIT = {
    small1: "shadowBurstAmbush",
    small2: "throatCut",
    passive: "shadowMomentum",
    ultimate: "midnightBloom",
  };

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
    shadowAmp: { label: "暗影增幅", category: "archetype", scale: 1 },
    arcaneAmp: { label: "奥术增幅", category: "archetype", scale: 1 },
    markPower: { label: "标记强度", category: "archetype", scale: 1 },
    stealthDuration: { label: "隐身持续", category: "archetype", scale: 1 },
    executeDamage: { label: "处决伤害", category: "archetype", scale: 1 },
    lowHpDamage: { label: "低血伤害", category: "archetype", scale: 1 },
    lowHpHealingReceived: { label: "低血受治愈", category: "archetype", scale: 1 },
    counterDamage: { label: "反击伤害", category: "archetype", scale: 1 },
    cleanseEfficiency: { label: "净化效率", category: "archetype", scale: 1 },
    auraPower: { label: "光环强度", category: "archetype", scale: 1 },
  };
  const SLOT_DATA = {
    weapon: { label: "武器", baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "agility", "arcana", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "executeDamage", "lowHpDamage", "markPower"] },
    helm: { label: "头盔", baseStats: ["maxHp", "armor"], affixPool: ["arcana", "rhythm", "resilience", "skillHaste", "effectPower", "effectResist", "healPower", "controlPower", "critChance", "fireAmp", "poisonAmp", "arcaneAmp", "markPower", "stealthDuration", "cleanseEfficiency", "auraPower"] },
    chest: { label: "胸甲", baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "effectResist", "receivedHealing", "shieldPower", "lowHpHealingReceived", "counterDamage", "cleanseEfficiency"] },
    gloves: { label: "护手", baseStats: ["physicalPower", "armor"], affixPool: ["might", "agility", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "markPower", "executeDamage", "lowHpDamage", "counterDamage"] },
    legs: { label: "腿甲", baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "agility", "effectResist", "receivedHealing", "skillHaste", "lowHpHealingReceived", "cleanseEfficiency", "counterDamage"] },
    boots: { label: "靴子", baseStats: ["maxHp", "armor"], affixPool: ["agility", "rhythm", "resilience", "attackSpeed", "skillHaste", "effectResist", "initiative", "controlPower", "stealthDuration", "auraPower"] },
    ring: { label: "戒指", baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "skillHaste", "effectPower", "effectResist", "dotAmp", "controlPower", "healPower", "shieldPower", "fireAmp", "poisonAmp", "shadowAmp", "markPower", "executeDamage", "lowHpDamage", "lowHpHealingReceived", "auraPower"] },
    charm: { label: "护符", baseOptions: [["maxHp"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "effectPower", "receivedHealing", "dotAmp", "healPower", "shieldPower", "controlPower", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "stealthDuration", "cleanseEfficiency", "auraPower", "counterDamage"] },
  };
  const RARITIES = [
    { id: "common", label: "普通", affixes: 1, value: 1 },
    { id: "rare", label: "稀有", affixes: 2, value: 1.3 },
    { id: "epic", label: "史诗", affixes: 4, value: 1.9 },
    { id: "legendary", label: "传说", affixes: 7, value: 2.8 },
    { id: "mythic", label: "神话", affixes: 12, value: 4.2 },
  ];
  const RARITY_BY_ID = Object.fromEntries(RARITIES.map((rarity, index) => [rarity.id, { ...rarity, rank: index }]));
  const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);

  const REGIONS = [
    { level: 1, name: "旧路鼠窟", power: 4000, enemyPoints: 0, enemyGear: 0, rewardTier: "18-28", itemLevelRange: [18, 28], rarity: { common: 0.9, rare: 0.1 }, dropCount: 5, enemySets: [["warrior", "warrior", "ranger", "priest"], ["knight", "warrior", "mage", "ranger"], ["berserker", "warrior", "priest", "bard"]] },
    { level: 2, name: "黑松哨站", power: 9600, enemyPoints: 4, enemyGear: 28, rewardTier: "26-42", itemLevelRange: [26, 42], rarity: { common: 0.62, rare: 0.35, epic: 0.03 }, dropCount: 5, enemySets: [["knight", "warrior", "mage", "priest"], ["warrior", "berserker", "ranger", "bard"], ["assassin", "knight", "warlock", "priest"]] },
    { level: 3, name: "腐火地窟", power: 16000, enemyPoints: 8, enemyGear: 60, rewardTier: "38-64", itemLevelRange: [38, 64], rarity: { common: 0.3, rare: 0.55, epic: 0.14, legendary: 0.01 }, dropCount: 6, enemySets: [["knight", "mage", "mage", "priest"], ["warrior", "alchemist", "warlock", "bard"], ["assassin", "assassin", "knight", "ranger"]] },
    { level: 4, name: "王墓外环", power: 21900, enemyPoints: 12, enemyGear: 100, rewardTier: "58-84", itemLevelRange: [58, 84], rarity: { rare: 0.5, epic: 0.44, legendary: 0.06 }, dropCount: 5, enemySets: [["knight", "knight", "priest", "ranger"], ["warrior", "berserker", "mage", "bard"], ["assassin", "warlock", "alchemist", "priest"]] },
    { level: 5, name: "龙骨浅层", power: 38900, enemyPoints: 18, enemyGear: 155, rewardTier: "80-120", itemLevelRange: [80, 120], rarity: { rare: 0.175, epic: 0.595, legendary: 0.225, mythic: 0.005 }, dropCount: 6, enemySets: [["knight", "warrior", "mage", "priest"], ["berserker", "assassin", "ranger", "bard"], ["warlock", "alchemist", "mage", "knight"]] },
    { level: 6, name: "灰冠深井", power: 52500, enemyPoints: 26, enemyGear: 225, rewardTier: "102-136", itemLevelRange: [102, 136], rarity: { epic: 0.64, legendary: 0.335, mythic: 0.025 }, dropCount: 5, enemySets: [["knight", "warrior", "warlock", "priest"], ["berserker", "knight", "mage", "bard"], ["assassin", "ranger", "alchemist", "priest"]] },
  ];

  const FACILITY_DEFS = {
    kitchen: { name: "厨房", daily: 1, text: "每天稳定提供 +1 繁荣。" },
    field: { name: "农田", daily: 2, text: "有厨房时每天 +2 繁荣。" },
    stage: { name: "大舞台", daily: 5, text: "每天演出，提供 +5 繁荣。" },
    training: { name: "训练场", daily: 1, text: "每天 +1 繁荣，战士系更常来访。" },
    lecture: { name: "魔法讲堂", daily: 1, text: "每天 +1 繁荣，施法者更常来访。" },
  };
  const EVENT_POOL = [
    { name: "学院演武", due: 3, reward: "stage", enemyRoles: ["mage", "mage", "priest", "ranger"], powerOffset: 1, text: "远方学院要借小镇场地比试。" },
    { name: "护粮车队", due: 3, reward: "field", enemyRoles: ["warrior", "ranger", "assassin", "bard"], powerOffset: 0, text: "商队请求护送，成功后愿意留下农田契约。" },
    { name: "旧矿清剿", due: 4, reward: "training", enemyRoles: ["knight", "warrior", "berserker", "priest"], powerOffset: 1, text: "矿工被怪物逼退，清剿后能改成训练场。" },
    { name: "秘社来访", due: 4, reward: "lecture", enemyRoles: ["warlock", "alchemist", "mage", "knight"], powerOffset: 2, text: "神秘学者提出危险试炼，成功后建立讲堂。" },
  ];

  const state = {
    rng: seededRandom(`town-loop|${Date.now()}`),
    day: 1,
    prosperity: 8,
    facilities: ["kitchen"],
    events: [],
    heroes: [],
    inventory: [],
    selectedHeroId: "",
    selectedItemId: "",
    selectedRegion: 1,
    dailyRegionRuns: {},
    activeGrind: null,
    lastGrindResult: "",
    recruits: [],
    log: [],
    battleView: null,
    isFighting: false,
  };

  const els = {};
  const ELEMENT_IDS = [
    "dayValue", "prosperityValue", "prosperityDelta", "teamPower", "grindState", "eventCount",
    "eventCards", "facilityCount", "facilityCards", "activityLog", "nextDayBtn", "resetTownBtn",
    "dropRateValue", "selectedRegionName", "regionList", "combatStatus", "combatTitle",
    "toggleGrindBtn", "fightOnceBtn", "battleMount", "inventoryCount", "regionDetail",
    "heroCount", "activeTeamBoard", "rosterGrid", "selectedHeroName", "heroDetail",
    "candidateCount", "equipCandidates", "autoEquipTeamBtn", "equippedCount", "rarityFilter",
    "sortMode", "dustCommonBtn", "dustRareBtn", "visibleItemCount", "itemGrid", "itemDetailTitle",
    "itemDetail", "recruitQuality", "qualityBand", "recruitCards", "recruitRules",
  ];

  init();

  function init() {
    refreshEls();
    if (!loadState()) createNewTown(false);
    normalizeState();
    bindShellNavigation();
    bindEvents();
    startBackgroundGrindTicker();
    renderAll();
    if (currentPage === "regions" && !state.activeGrind) previewRegionBattle();
    if (state.activeGrind) window.setTimeout(() => runRegionBattle(true), 250);
  }

  function refreshEls() {
    ELEMENT_IDS.forEach((id) => { els[id] = document.querySelector(`#${id}`); });
  }

  function bindShellNavigation() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link || !isTownRoute(link.href) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigateShell(link.href);
    });
    window.addEventListener("popstate", () => navigateShell(location.href, { push: false }));
  }

  async function navigateShell(href, options = {}) {
    const url = new URL(href, location.origin);
    if (!isTownRoute(url.href)) {
      location.href = url.href;
      return;
    }
    const nextPage = pageFromPath(url.pathname);
    const currentMain = document.querySelector(".town-shell");
    if (!currentMain) {
      location.href = url.href;
      return;
    }
    try {
      const response = await fetch(url.pathname, { cache: "no-cache" });
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const nextMain = doc.querySelector(".town-shell");
      if (!response.ok || !nextMain) throw new Error("Town shell target not found");

      stopDetachedPreviewBattle();
      currentMain.replaceWith(nextMain);
      document.body.dataset.page = nextPage;
      document.title = doc.title || document.title;
      currentPage = nextPage;
      page = currentPage;
      if (options.push !== false && location.pathname !== url.pathname) history.pushState({ page: nextPage }, "", url.pathname);
      refreshEls();
      bindEvents();
      renderAll();
      if (currentPage === "regions" && !state.activeGrind) previewRegionBattle();
    } catch (error) {
      console.warn("Town shell navigation fell back to full load:", error);
      location.href = url.href;
    }
  }

  function isTownRoute(href) {
    try {
      const url = new URL(href, location.origin);
      return url.origin === location.origin && /^\/town_loop\/(?:$|(?:regions|team|warehouse|recruit)\.html$)/.test(url.pathname);
    } catch {
      return false;
    }
  }

  function pageFromPath(pathname) {
    if (pathname.endsWith("/regions.html")) return "regions";
    if (pathname.endsWith("/team.html")) return "team";
    if (pathname.endsWith("/warehouse.html")) return "warehouse";
    if (pathname.endsWith("/recruit.html")) return "recruit";
    return "town";
  }

  function stopDetachedPreviewBattle() {
    if (!state.battleView || state.activeGrind) return;
    state.battleView.stop?.(false);
    state.battleView = null;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      Object.assign(state, saved, {
        rng: seededRandom(`town-loop|${Date.now()}`),
        battleView: null,
        isFighting: false,
      });
      return Array.isArray(state.heroes) && state.heroes.length > 0;
    } catch {
      return false;
    }
  }

  function saveState() {
    const data = {
      day: state.day,
      prosperity: state.prosperity,
      facilities: state.facilities,
      events: state.events,
      heroes: state.heroes,
      inventory: state.inventory,
      selectedHeroId: state.selectedHeroId,
      selectedItemId: state.selectedItemId,
      selectedRegion: state.selectedRegion,
      dailyRegionRuns: state.dailyRegionRuns,
      activeGrind: state.activeGrind,
      lastGrindResult: state.lastGrindResult,
      recruits: state.recruits,
      log: state.log,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function createNewTown(shouldSave = true) {
    state.day = 1;
    state.prosperity = 8;
    state.facilities = ["kitchen"];
    state.events = [makeEvent(0)];
    state.heroes = [];
    state.inventory = [];
    state.selectedRegion = 1;
    state.dailyRegionRuns = {};
    state.activeGrind = null;
    state.lastGrindResult = "";
    state.recruits = [];
    state.log = [];
    for (let i = 0; i < 6; i += 1) state.heroes.push(makeHero(pick(HERO_DRAFTS), { active: i < 4, initial: true, teamSlot: i < 4 ? i : null }));
    state.selectedHeroId = state.heroes[0]?.id || "";
    refreshRecruits(false);
    addLog("小镇建立，六名佣兵在酒馆集合。");
    if (shouldSave) saveState();
  }

  function normalizeState() {
    if (!state.events?.length) state.events = [makeEvent(0)];
    if (!state.recruits?.length) refreshRecruits(false);
    state.heroes.forEach((hero, index) => {
      if (!hero.formation) hero.formation = index < 2 ? "front" : "back";
      if (!hero.skillLevels) hero.skillLevels = defaultSkillLevels(1, state.rng);
      if (!hero.equipment) hero.equipment = {};
    });
    normalizeTeamSlots();
    if (!heroById(state.selectedHeroId)) state.selectedHeroId = state.heroes[0]?.id || "";
    sortInventory();
    saveState();
  }

  function bindEvents() {
    els.nextDayBtn?.addEventListener("click", nextDay);
    els.resetTownBtn?.addEventListener("click", () => {
      if (!window.confirm("重开佣兵小镇？")) return;
      createNewTown(true);
      renderAll();
    });
    els.fightOnceBtn?.addEventListener("click", () => runRegionBattle(true));
    els.toggleGrindBtn?.addEventListener("click", toggleGrind);
    els.autoEquipTeamBtn?.addEventListener("click", () => {
      autoEquipTeam();
      renderAll();
    });
    els.rarityFilter?.addEventListener("change", renderWarehouse);
    els.sortMode?.addEventListener("change", renderWarehouse);
    els.dustCommonBtn?.addEventListener("click", () => dustByRarity("common"));
    els.dustRareBtn?.addEventListener("click", () => dustByRarity("rare"));
  }

  function renderAll() {
    renderStatus();
    if (currentPage === "town") renderTown();
    if (currentPage === "regions") renderRegions();
    if (currentPage === "team") renderTeam();
    if (currentPage === "warehouse") renderWarehouse();
    if (currentPage === "recruit") renderRecruit();
  }

  function renderStatus() {
    setText(els.dayValue, `${state.day} 天`);
    setText(els.prosperityValue, Math.round(state.prosperity));
    setText(els.prosperityDelta, signed(dailyProsperity()));
    setText(els.teamPower, Math.round(teamPower()));
    setText(els.grindState, grindStatusText());
    setText(els.dropRateValue, `${Math.round(dropMultiplier(currentRegion()) * 100)}%`);
    setText(els.inventoryCount, page === "warehouse" ? `${state.inventory.length}/${BAG_CAPACITY}` : `${state.inventory.length} 件`);
    setText(els.equippedCount, equippedItems().length);
    setText(els.heroCount, state.heroes.length);
    renderGlobalBattleDock();
  }

  function grindStatusText() {
    if (!state.activeGrind) return state.lastGrindResult || "待命";
    const name = regionByLevel(state.activeGrind.region)?.name || "地区";
    return state.lastGrindResult ? `${name}中 · ${state.lastGrindResult}` : `${name}中`;
  }

  function renderTown() {
    setText(els.eventCount, state.events.length);
    setText(els.facilityCount, state.facilities.length);
    if (els.eventCards) {
      els.eventCards.innerHTML = state.events.map((event) => `
        <article class="event-card">
          <strong>${escapeHtml(event.name)} · ${event.dueIn} 天后</strong>
          <small>${escapeHtml(event.text)}</small>
          <small>敌人：${event.enemyRoles.map(roleLabel).join(" / ")}</small>
          <small>奖励设施：${facilityName(event.reward)}</small>
        </article>
      `).join("");
    }
    if (els.facilityCards) {
      els.facilityCards.innerHTML = state.facilities.map((id) => {
        const facility = FACILITY_DEFS[id] || FACILITY_DEFS.kitchen;
        return `<article class="facility-card"><strong>${facility.name}</strong><small>${facility.text}</small></article>`;
      }).join("");
    }
    renderLog();
  }

  function renderRegions() {
    const selected = currentRegion();
    setText(els.selectedRegionName, selected.name);
    if (state.activeGrind && els.battleMount && state.battleView?.container !== els.battleMount) {
      els.battleMount.innerHTML = `<section class="battle-placeholder"><strong>挂机战斗正在浮窗中播放</strong><span>你可以继续选择地区、看掉落和调整刷级目标。</span></section>`;
    }
    if (els.regionList) {
      els.regionList.innerHTML = REGIONS.map((region) => {
        const runCount = state.dailyRegionRuns[region.level] || 0;
        const rate = Math.round(dropMultiplier(region) * 100);
        return `<button class="region-card ${region.level === state.selectedRegion ? "active" : ""}" data-region="${region.level}" type="button">
          <strong>D${region.level} ${escapeHtml(region.name)}</strong>
          <small>推荐 ${region.power} · 掉落 Lv.${region.rewardTier}</small>
          <small>今日已刷 ${runCount} 次 · 当前掉率 ${rate}%</small>
        </button>`;
      }).join("");
      els.regionList.querySelectorAll("[data-region]").forEach((node) => {
        node.addEventListener("click", () => {
          state.selectedRegion = Number(node.dataset.region);
          saveState();
          renderAll();
          if (!state.activeGrind) previewRegionBattle();
        });
      });
    }
    if (els.regionDetail) {
      els.regionDetail.innerHTML = `
        <strong>D${selected.level} ${escapeHtml(selected.name)}</strong><br>
        推荐战力 ${selected.power}<br>
        敌人组合 ${selected.enemySets[0].map(roleLabel).join(" / ")}<br>
        掉落等级 Lv.${selected.rewardTier}<br>
        每次基础掉落 ${selected.dropCount} 件，今日最低衰减到 75%`;
    }
    setText(els.toggleGrindBtn, state.activeGrind ? "停止挂机" : "开始挂机");
    renderLog();
  }

  function renderTeam() {
    if (els.activeTeamBoard) {
      els.activeTeamBoard.innerHTML = teamSlots().map((slot) => teamSlotHtml(slot)).join("");
    }
    if (els.rosterGrid) {
      els.rosterGrid.innerHTML = state.heroes.map((hero) => heroCardHtml(hero, false)).join("");
      bindHeroCards(els.rosterGrid);
    }
    bindTeamSlots();
    renderSelectedHero();
  }

  function teamSlotHtml(slot) {
    const hero = slot.hero;
    if (!hero) {
      return `<button class="team-slot empty" data-slot="${slot.index}" type="button">
        <span class="slot-label">${slot.label}</span>
        <strong>空位</strong>
        <small>先在下方选择角色，再点这里放入。</small>
      </button>`;
    }
    return `<button class="team-slot filled ${hero.id === state.selectedHeroId ? "selected" : ""}" data-slot="${slot.index}" type="button">
      <span class="slot-label">${slot.label}</span>
      <strong>${ROLE_ICONS[hero.role] || ""} ${escapeHtml(hero.name)}</strong>
      <small>${roleLabel(hero.role)} · ${heroRarity(hero).label} · 战力 ${Math.round(heroPower(hero))}</small>
      <small>技能均级 ${skillAverage(hero).toFixed(1)} · 总和 ${skillTotal(hero)}</small>
    </button>`;
  }

  function heroCardHtml(hero, compact) {
    return `<article class="hero-card ${hero.active ? "active" : ""} ${hero.id === state.selectedHeroId ? "selected" : ""}" data-hero="${hero.id}">
      <strong>${ROLE_ICONS[hero.role] || ""} ${escapeHtml(hero.name)}</strong>
      <small>${roleLabel(hero.role)} · ${heroRarity(hero).label} · 战力 ${Math.round(heroPower(hero))}</small>
      <small>技能均级 ${skillAverage(hero).toFixed(1)} · 总和 ${skillTotal(hero)} · ${hero.formation === "front" ? "前排" : "后排"}</small>
      ${compact ? "" : `<div class="hero-actions">
        <button data-select-hero="${hero.id}" type="button">选择</button>
        ${hero.active ? `<button data-remove-hero="${hero.id}" type="button">移出小队</button>` : ""}
      </div>`}
    </article>`;
  }

  function bindTeamSlots() {
    if (!els.activeTeamBoard) return;
    els.activeTeamBoard.querySelectorAll("[data-slot]").forEach((node) => {
      node.addEventListener("click", () => assignSelectedHeroToSlot(Number(node.dataset.slot)));
    });
  }

  function bindHeroCards(root) {
    if (!root) return;
    root.querySelectorAll("[data-hero]").forEach((node) => {
      node.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        state.selectedHeroId = node.dataset.hero;
        saveState();
        renderTeam();
      });
    });
    root.querySelectorAll("[data-toggle-active]").forEach((node) => {
      node.addEventListener("click", () => toggleHeroActive(node.dataset.toggleActive));
    });
    root.querySelectorAll("[data-select-hero]").forEach((node) => {
      node.addEventListener("click", () => {
        state.selectedHeroId = node.dataset.selectHero;
        saveState();
        renderTeam();
      });
    });
    root.querySelectorAll("[data-remove-hero]").forEach((node) => {
      node.addEventListener("click", () => removeHeroFromTeam(node.dataset.removeHero));
    });
    root.querySelectorAll("[data-front]").forEach((node) => {
      node.addEventListener("click", () => setHeroFormation(node.dataset.front, "front"));
    });
    root.querySelectorAll("[data-back]").forEach((node) => {
      node.addEventListener("click", () => setHeroFormation(node.dataset.back, "back"));
    });
  }

  function renderSelectedHero() {
    const hero = selectedHero();
    if (!hero) return;
    setText(els.selectedHeroName, hero.name);
    const kitNames = [hero.small1, hero.small2, hero.passive, hero.ultimate].map(skillName);
    if (els.heroDetail) {
      els.heroDetail.innerHTML = `
        <strong>${roleLabel(hero.role)} · ${heroRarity(hero).label}</strong><br>
        技能：${kitNames.join(" / ")}<br>
        技能等级：${Object.values(hero.skillLevels || {}).join(" / ")}<br>
        <div class="stat-grid">
          <div><span>战力</span><strong>${Math.round(heroPower(hero))}</strong></div>
          <div><span>装备</span><strong>${Object.keys(hero.equipment || {}).length}/8</strong></div>
          <div><span>位置</span><strong>${hero.formation === "front" ? "前排" : "后排"}</strong></div>
          <div><span>技能总和</span><strong>${skillTotal(hero)}</strong></div>
        </div>`;
    }
    const candidates = state.inventory
      .slice()
      .sort((a, b) => itemScoreForHero(b, hero) - itemScoreForHero(a, hero))
      .slice(0, 12);
    setText(els.candidateCount, `${candidates.length}`);
    if (els.equipCandidates) {
      els.equipCandidates.innerHTML = candidates.map((item) => `
        <button class="equip-row" data-equip="${item.id}" type="button">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${slotName(item.slot)} · ${item.rarityLabel} · Lv.${item.equipmentLevel} · 评分 ${Math.round(itemScoreForHero(item, hero))}</small>
        </button>
      `).join("") || `<div class="log-row">仓库里暂时没有可穿装备。</div>`;
      els.equipCandidates.querySelectorAll("[data-equip]").forEach((node) => {
        node.addEventListener("click", () => equipItemToHero(node.dataset.equip, hero.id));
      });
    }
  }

  function renderWarehouse() {
    const items = visibleWarehouseItems();
    setText(els.visibleItemCount, items.length);
    if (els.itemGrid) {
      els.itemGrid.innerHTML = items.map((item) => {
        const owner = itemOwner(item.id);
        return `<button class="item-card ${item.id === state.selectedItemId ? "selected" : ""}" data-item="${item.id}" type="button">
          <strong class="rarity-${item.rarity}">${escapeHtml(item.name)}</strong>
          <small>${slotName(item.slot)} · Lv.${item.equipmentLevel} · 评分 ${itemScore(item)}</small>
          <small>${owner ? `已装备：${escapeHtml(owner.name)}` : "仓库中"}</small>
        </button>`;
      }).join("") || `<div class="log-row">暂无装备。</div>`;
      els.itemGrid.querySelectorAll("[data-item]").forEach((node) => {
        node.addEventListener("click", () => {
          state.selectedItemId = node.dataset.item;
          saveState();
          renderWarehouse();
        });
      });
    }
    renderItemDetail();
  }

  function renderItemDetail() {
    const item = findItem(state.selectedItemId) || visibleWarehouseItems()[0];
    if (!item) {
      setText(els.itemDetailTitle, "未选择");
      if (els.itemDetail) els.itemDetail.innerHTML = `<div class="log-row">选择一件装备查看属性。</div>`;
      return;
    }
    setText(els.itemDetailTitle, item.name);
    const owner = itemOwner(item.id);
    if (els.itemDetail) {
      els.itemDetail.innerHTML = `
        <strong class="rarity-${item.rarity}">${item.rarityLabel} · ${slotName(item.slot)}</strong><br>
        等级 Lv.${item.equipmentLevel} · ${owner ? `已装备给 ${escapeHtml(owner.name)}` : "仓库中"}<br>
        <div class="affix-list">${itemStatRows(item).join("")}</div>`;
    }
  }

  function renderRecruit() {
    const quality = recruitQuality();
    setText(els.recruitQuality, quality.label);
    setText(els.qualityBand, `Lv.${quality.min}-${quality.max}`);
    if (els.recruitCards) {
      els.recruitCards.innerHTML = state.recruits.map((hero) => {
        const rarity = heroRarity(hero);
        return `<article class="recruit-card">
          <strong>${ROLE_ICONS[hero.role] || ""} ${escapeHtml(hero.name)}</strong>
          <small class="rarity-${rarity.id}">${rarity.label} · 技能总和 ${skillTotal(hero)}</small>
          <small>${roleLabel(hero.role)} · ${[hero.small1, hero.small2, hero.passive, hero.ultimate].map(skillName).join(" / ")}</small>
          <small>技能等级 ${Object.values(hero.skillLevels || {}).join(" / ")}</small>
          <button class="primary" data-recruit="${hero.id}" type="button">招募</button>
        </article>`;
      }).join("");
      els.recruitCards.querySelectorAll("[data-recruit]").forEach((node) => {
        node.addEventListener("click", () => recruitHero(node.dataset.recruit));
      });
    }
    if (els.recruitRules) {
      els.recruitRules.innerHTML = [
        "每 10 点繁荣提高招募池期待。",
        "技能等级当前不会通过战斗升级。",
        "设施后续会改变职业来访权重。",
      ].map((text) => `<div class="rule-row">${text}</div>`).join("");
    }
  }

  function renderLog() {
    if (!els.activityLog) return;
    els.activityLog.innerHTML = state.log.slice(-8).reverse().map((row) => `<div class="log-row">${escapeHtml(row)}</div>`).join("");
  }

  function nextDay() {
    state.day += 1;
    state.prosperity = Math.max(0, state.prosperity + dailyProsperity());
    state.dailyRegionRuns = {};
    state.events.forEach((event) => { event.dueIn -= 1; });
    const dueEvents = state.events.filter((event) => event.dueIn <= 0);
    state.events = state.events.filter((event) => event.dueIn > 0);
    dueEvents.forEach(resolveEvent);
    if (state.events.length < 1) state.events.push(makeEvent(state.day));
    refreshRecruits(false);
    addLog(`进入第 ${state.day} 天，繁荣度变为 ${Math.round(state.prosperity)}。`);
    saveState();
    renderAll();
  }

  function dailyProsperity() {
    return state.facilities.reduce((sum, id) => {
      if (id === "field" && !state.facilities.includes("kitchen")) return sum - 1;
      return sum + (FACILITY_DEFS[id]?.daily || 0);
    }, 0);
  }

  function makeEvent(seedOffset) {
    const event = pick(EVENT_POOL);
    const region = REGIONS[Math.min(REGIONS.length - 1, Math.floor((state.day + seedOffset) / 4) + event.powerOffset)];
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: event.name,
      dueIn: event.due,
      reward: event.reward,
      enemyRoles: event.enemyRoles,
      enemyPoints: region.enemyPoints + 3,
      enemyGear: region.enemyGear + 20,
      power: region.power,
      text: event.text,
    };
  }

  function resolveEvent(event) {
    const result = simulateFight(activeHeroes().map(buildHeroSpec), buildEnemyTeamFromRoles(event.enemyRoles, event));
    if (result.winner === "left") {
      if (!state.facilities.includes(event.reward)) state.facilities.push(event.reward);
      state.prosperity += 6;
      addLog(`${event.name} 胜利，获得设施：${facilityName(event.reward)}。`);
    } else {
      state.prosperity = Math.max(0, state.prosperity - 4);
      addLog(`${event.name} 失败，小镇繁荣受挫。`);
    }
  }

  function toggleGrind() {
    if (state.activeGrind) {
      state.activeGrind = null;
      state.lastGrindResult = "已停止";
      state.isFighting = false;
      state.battleView?.stop?.(false);
      state.battleView = null;
      addLog("停止地区挂机。");
      saveState();
      renderAll();
      return;
    } else {
      state.activeGrind = { region: state.selectedRegion, startedDay: state.day };
      state.lastGrindResult = "准备出发";
      state.isFighting = false;
      addLog(`开始挂机 ${currentRegion().name}。`);
    }
    saveState();
    renderAll();
    runRegionBattle(true);
  }

  function startBackgroundGrindTicker() {
    window.setInterval(() => {
      if (!state.activeGrind || state.isFighting) return;
      backgroundGrindTick();
    }, 8500);
  }

  function backgroundGrindTick() {
    const region = regionByLevel(state.activeGrind.region) || currentRegion();
    const result = resolveRegionFight(region);
    state.lastGrindResult = `${result.won ? "胜利" : "失败"} · ${result.loot.length} 件`;
    addLog(`${region.name} 后台刷怪${result.won ? "胜利" : "失败"}，获得 ${result.loot.length} 件装备。`);
    saveState();
    renderAll();
  }

  function runRegionBattle(visual) {
    if (state.isFighting) return;
    const region = state.activeGrind ? regionByLevel(state.activeGrind.region) || currentRegion() : currentRegion();
    const leftTeam = activeHeroes().map(buildHeroSpec);
    const rightTeam = buildEnemyTeam(region);
    state.isFighting = true;
    setCombatStatus("战斗中", "");
    setText(els.combatTitle, `${region.name} · ${enemyNames(rightTeam)}`);
    const mount = visual ? battleMountForVisual() : null;
    if (visual && BATTLE.mount && mount) {
      if (state.battleView?.container && state.battleView.container !== mount) {
        state.battleView.stop?.(false);
        state.battleView = null;
      }
      if (!state.battleView) {
        state.battleView = createBattleView(region, mount);
      } else {
        state.battleView.onFinish = (result) => finishVisualRegionBattle(region, result);
      }
      state.battleView.start({
        leftTeam,
        rightTeam,
        title: region.name,
        seed: `town-loop|${state.day}|${region.level}|${Date.now()}`,
        randomizeStats: false,
      });
    } else {
      finishVisualRegionBattle(region, simulateFight(leftTeam, rightTeam));
    }
  }

  function finishVisualRegionBattle(region, result) {
    const won = (result?.winner || result?.winningSide) === "left";
    const loot = won ? grantRegionLoot(region) : [];
    state.lastGrindResult = `${won ? "胜利" : "失败"} · ${loot.length} 件`;
    state.isFighting = false;
    setCombatStatus(won ? "胜利" : "失败", won ? "win" : "loss");
    setText(els.combatTitle, won ? `获得 ${loot.length} 件装备` : "队伍被击退");
    addLog(`${region.name} 手动战斗${won ? "胜利" : "失败"}，获得 ${loot.length} 件装备。`);
    saveState();
    renderAll();
    if (state.activeGrind) {
      window.setTimeout(() => runRegionBattle(true), 900);
    }
  }

  function resolveRegionFight(region) {
    const result = simulateFight(activeHeroes().map(buildHeroSpec), buildEnemyTeam(region));
    const won = result.winner === "left";
    const loot = won ? grantRegionLoot(region) : [];
    return { won, loot };
  }

  function simulateFight(leftTeam, rightTeam) {
    if (COMBAT.simulateTeams) {
      return COMBAT.simulateTeams(leftTeam, rightTeam, {
        seed: `town-loop-sim|${Date.now()}|${Math.random()}`,
        maxTime: 70,
        randomizeStats: false,
      });
    }
    return { winner: teamPower() >= currentRegion().power ? "left" : "right" };
  }

  function previewRegionBattle() {
    if (!BATTLE.mount || !els.battleMount) return;
    if (!state.battleView) {
      state.battleView = createBattleView(currentRegion(), els.battleMount);
    }
    const region = currentRegion();
    state.battleView.preview({
      leftTeam: activeHeroes().map(buildHeroSpec),
      rightTeam: buildEnemyTeam(region),
      title: region.name,
    });
  }

  function createBattleView(region, container) {
    return BATTLE.mount({
      container,
      maxTime: 70,
      speed: 1.15,
      onFinish: (result) => finishVisualRegionBattle(region, result),
    });
  }

  function battleMountForVisual() {
    return ensureGlobalBattleDock();
  }

  function renderGlobalBattleDock() {
    const existing = document.querySelector("#globalBattleDock");
    if (!state.activeGrind) {
      existing?.remove();
      return;
    }
    const dock = ensureGlobalBattleDock();
    const title = dock.querySelector("[data-global-battle-title]");
    if (title) title.textContent = grindStatusText();
  }

  function ensureGlobalBattleDock() {
    let dock = document.querySelector("#globalBattleDock");
    if (dock) return dock.querySelector("[data-global-battle-mount]");
    dock = document.createElement("section");
    dock.id = "globalBattleDock";
    dock.className = "global-battle-dock";
    dock.innerHTML = `
      <div class="global-battle-head">
        <div><span>挂机战斗</span><strong data-global-battle-title>${escapeHtml(grindStatusText())}</strong></div>
        <button type="button" data-stop-global-grind>停止</button>
      </div>
      <div class="global-battle-mount" data-global-battle-mount></div>
    `;
    document.body.appendChild(dock);
    dock.querySelector("[data-stop-global-grind]")?.addEventListener("click", () => {
      state.activeGrind = null;
      state.lastGrindResult = "已停止";
      state.isFighting = false;
      state.battleView?.stop?.(false);
      state.battleView = null;
      saveState();
      renderAll();
    });
    return dock.querySelector("[data-global-battle-mount]");
  }

  function grantRegionLoot(region) {
    const runCount = state.dailyRegionRuns[region.level] || 0;
    state.dailyRegionRuns[region.level] = runCount + 1;
    const multiplier = dropMultiplier(region);
    const exactCount = (region.dropCount || 5) * multiplier;
    const count = Math.max(1, Math.floor(exactCount + (state.rng() < exactCount % 1 ? 1 : 0)));
    const loot = [];
    for (let i = 0; i < count; i += 1) {
      if (state.inventory.length >= BAG_CAPACITY) break;
      const item = generateItem(region);
      state.inventory.push(item);
      loot.push(item);
    }
    sortInventory();
    return loot;
  }

  function dropMultiplier(region) {
    const runs = state.dailyRegionRuns[region.level] || 0;
    return Math.max(0.75, 1 - runs * 0.025);
  }

  function makeHero(draft, options = {}) {
    const active = Boolean(typeof options === "boolean" ? options : options.active);
    const initial = Boolean(typeof options === "object" && options.initial);
    const teamSlot = typeof options === "object" && Number.isInteger(options.teamSlot) ? options.teamSlot : null;
    const role = draft.role;
    const kit = SKILL_DATA.roleKits?.[role]?.kit || {};
    const branchKit = draft.variant === "shadow" ? SHADOW_ASSASSIN_KIT : kit;
    const quality = initial ? { min: 1, max: 1 } : recruitQuality();
    const skillLevels = defaultSkillLevels(quality, state.rng);
    const label = draft.label || roleLabel(role);
    return {
      id: `hero_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role,
      variant: draft.variant || "",
      name: `${label}${state.heroes.length + 1}`,
      active,
      teamSlot,
      formation: state.heroes.filter((hero) => hero.active && hero.formation === "front").length < 2 ? "front" : "back",
      equipment: {},
      small1: branchKit.small1,
      small2: branchKit.small2,
      passive: branchKit.passive,
      ultimate: branchKit.ultimate,
      skillLevels,
    };
  }

  function defaultSkillLevels(quality, rng) {
    const q = typeof quality === "object" ? quality : recruitQuality();
    const min = q.min || 1;
    const max = q.max || Math.max(2, min);
    return {
      small1: rollInt(min, max, rng),
      small2: rollInt(min, max, rng),
      passive: rollInt(min, max, rng),
      ultimate: rollInt(min, max, rng),
    };
  }

  function recruitQuality() {
    const p = state.prosperity || 0;
    if (p >= 120) return { label: "传奇", min: 6, max: 10 };
    if (p >= 70) return { label: "精锐", min: 4, max: 7 };
    if (p >= 35) return { label: "熟练", min: 2, max: 5 };
    return { label: "入门", min: 1, max: 3 };
  }

  function refreshRecruits(shouldSave = true) {
    state.recruits = Array.from({ length: 3 }, () => makeHero(pick(weightedRecruitDrafts()), { active: false }));
    if (shouldSave) saveState();
  }

  function weightedRecruitDrafts() {
    const drafts = [...HERO_DRAFTS];
    if (state.facilities.includes("training")) drafts.push({ role: "warrior" }, { role: "knight" }, { role: "berserker" });
    if (state.facilities.includes("lecture")) drafts.push({ role: "mage" }, { role: "warlock" }, { role: "alchemist" });
    return drafts;
  }

  function recruitHero(heroId) {
    const hero = state.recruits.find((item) => item.id === heroId);
    if (!hero) return;
    hero.active = activeHeroes().length < 4;
    hero.teamSlot = hero.active ? firstOpenTeamSlot() : null;
    syncHeroFormationWithSlot(hero);
    state.heroes.push(hero);
    state.selectedHeroId = hero.id;
    state.recruits = state.recruits.filter((item) => item.id !== heroId);
    if (!state.recruits.length) refreshRecruits(false);
    addLog(`招募 ${hero.name}，技能总和 ${skillTotal(hero)}。`);
    saveState();
    renderAll();
  }

  function toggleHeroActive(heroId) {
    const hero = heroById(heroId);
    if (!hero) return;
    if (!hero.active && activeHeroes().length >= 4) {
      addLog("当前小队已满，需要先让一名角色下阵。");
      renderAll();
      return;
    }
    hero.active = !hero.active;
    if (!hero.active) hero.teamSlot = null;
    if (hero.active && !Number.isInteger(hero.teamSlot)) hero.teamSlot = firstOpenTeamSlot();
    syncHeroFormationWithSlot(hero);
    saveState();
    renderAll();
  }

  function assignSelectedHeroToSlot(slotIndex) {
    const hero = selectedHero();
    if (!hero) return;
    const slot = teamSlots()[slotIndex];
    if (!slot) return;
    if (slot.hero && slot.hero.id !== hero.id) slot.hero.active = false;
    if (slot.hero && slot.hero.id !== hero.id) slot.hero.teamSlot = null;
    hero.active = true;
    hero.teamSlot = slotIndex;
    hero.formation = slot.formation;
    saveState();
    renderAll();
  }

  function removeHeroFromTeam(heroId) {
    const hero = heroById(heroId);
    if (!hero) return;
    hero.active = false;
    hero.teamSlot = null;
    saveState();
    renderAll();
  }

  function setHeroFormation(heroId, formation) {
    const hero = heroById(heroId);
    if (!hero) return;
    hero.formation = formation;
    saveState();
    renderAll();
  }

  function buildHeroSpec(hero) {
    const base = baseHeroSpec(hero);
    const scaledBase = applySkillLevelMultiplier(base, skillLevelMultiplier(hero));
    return BUILD_LAYERS.applyBuildLayers ? BUILD_LAYERS.applyBuildLayers(scaledBase, {
      attributePoints: {},
      equipmentModifiers: BUILD_LAYERS.buildEquipmentModifierBundle ? BUILD_LAYERS.buildEquipmentModifierBundle(heroEquipmentItemsForBuildLayer(hero)) : {},
      tags: ["town-loop-hero"],
    }) : scaledBase;
  }

  function baseHeroSpec(hero) {
    const kit = SKILL_DATA.roleKits?.[hero.role] || {};
    const roleKit = kit.kit || {};
    const basePower = kit.power || 45;
    return {
      role: hero.role,
      name: hero.name,
      small1: hero.small1 || roleKit.small1,
      small2: hero.small2 || roleKit.small2,
      passive: hero.passive || roleKit.passive,
      ultimate: hero.ultimate || roleKit.ultimate,
      hp: kit.hp || 300,
      maxHp: kit.hp || 300,
      power: basePower,
      physicalPower: basePower,
      magicPower: basePower,
      armor: kit.armor || 8,
      range: kit.range || 14,
      slotIndex: activeHeroes().indexOf(hero),
    };
  }

  function buildEnemyTeam(region) {
    return buildEnemyTeamFromRoles(pick(region.enemySets), region);
  }

  function buildEnemyTeamFromRoles(roles, region) {
    return roles.map((role, index) => {
      const base = baseEnemySpec(role, region, index);
      return BUILD_LAYERS.applyBuildLayers ? BUILD_LAYERS.applyBuildLayers(base, {
        attributePoints: enemyAttributePoints(role, region.enemyPoints || 0),
        equipmentModifiers: enemyEquipmentBundle(role, region.enemyGear || 0),
        tags: ["town-loop-enemy"],
      }) : base;
    });
  }

  function baseEnemySpec(role, region, index) {
    const kit = SKILL_DATA.roleKits?.[role] || {};
    const roleKit = kit.kit || {};
    const power = kit.power || 45;
    return {
      role,
      name: `${region.level || "E"}级${roleLabel(role)}`,
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
    return { [main]: mainPoints, [secondary]: Math.max(0, totalPoints - mainPoints) };
  }

  function enemyEquipmentBundle(role, budget) {
    const physical = ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
    const magic = ["mage", "priest", "warlock", "bard", "alchemist"].includes(role);
    return {
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
    };
  }

  function generateItem(region) {
    const slotKey = pick(Object.keys(SLOT_DATA));
    const slot = SLOT_DATA[slotKey];
    const rarity = chooseRarity(region.rarity);
    const equipmentLevel = rollEquipmentLevel(region.itemLevelRange);
    const affixes = pickAffixStats(slot.affixPool, rarity.affixes).map((stat) => rollAffix(stat, equipmentLevel));
    const baseStats = rollBaseStats(slot, equipmentLevel);
    return {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      slot: slotKey,
      regionLevel: region.level,
      equipmentLevel,
      rarity: rarity.id,
      rarityLabel: rarity.label,
      name: `${rarity.label}${slot.label} Lv.${equipmentLevel}`,
      baseStats,
      affixes,
    };
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

  function rollBaseStats(slot, equipmentLevel) {
    const baseStats = slot.baseOptions ? pick(slot.baseOptions) : (slot.baseStats || []);
    return Object.fromEntries(baseStats.map((stat) => [stat, rollDirectStatValue(stat, equipmentLevel)]));
  }

  function pickAffixStats(list, count) {
    const pool = list.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
    const focusStats = pickMany(pool, Math.min(2, pool.length));
    const focusSlots = focusStats.length ? Math.floor(count * 0.5) : 0;
    const result = [];
    for (let i = 0; i < count; i += 1) result.push(i < focusSlots ? focusStats[i % focusStats.length] : pick(pool));
    return result;
  }

  function rollAffix(stat, equipmentLevel) {
    return {
      stat,
      value: rollAffixValue(stat, equipmentLevel),
      level: rollAffixLevel(equipmentLevel),
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
    const def = AFFIX_DEFS[stat] || {};
    const variance = 0.88 + state.rng() * 0.24;
    if (def.category === "major") return Math.max(1, Math.round((1.1 + equipmentLevel / 45) * variance));
    if (def.percent || MECHANIC_CURVES.hasMechanicCurve?.(stat)) return Math.max(1, Math.round((2.5 + equipmentLevel / 7.5) * variance));
    return Math.max(1, Math.round((2 + equipmentLevel / 9) * variance));
  }

  function rollDirectStatValue(stat, equipmentLevel) {
    const variance = 0.92 + state.rng() * 0.16;
    const rows = { physicalPower: 0.5, magicPower: 0.5, maxHp: 2.8, armor: 0.08 };
    const value = equipmentLevel * (rows[stat] || 0.12) * variance;
    return percentStats().includes(stat) ? round(value, 3) : Math.max(1, Math.round(value));
  }

  function equipItemToHero(itemId, heroId) {
    const hero = heroById(heroId);
    const item = state.inventory.find((candidate) => candidate.id === itemId);
    if (!hero || !item) return;
    const old = hero.equipment[item.slot];
    if (old) state.inventory.push(old);
    hero.equipment[item.slot] = item;
    state.inventory = state.inventory.filter((candidate) => candidate.id !== itemId);
    state.selectedItemId = "";
    sortInventory();
    saveState();
    renderAll();
  }

  function autoEquipTeam() {
    const heroes = activeHeroes();
    const available = [...state.inventory];
    heroes.forEach((hero) => {
      Object.values(hero.equipment || {}).forEach((item) => available.push(item));
      hero.equipment = {};
    });
    const used = new Set();
    heroes.forEach((hero) => {
      Object.keys(SLOT_DATA).forEach((slot) => {
        const best = available
          .filter((item) => item.slot === slot && !used.has(item.id))
          .sort((a, b) => itemScoreForHero(b, hero) - itemScoreForHero(a, hero))[0];
        if (!best) return;
        hero.equipment[slot] = best;
        used.add(best.id);
      });
    });
    state.inventory = available.filter((item) => !used.has(item.id));
    addLog("已为当前小队自动穿装。");
    sortInventory();
    saveState();
  }

  function dustByRarity(maxRarity) {
    const maxRank = RARITY_BY_ID[maxRarity]?.rank || 0;
    const before = state.inventory.length;
    state.inventory = state.inventory.filter((item) => (RARITY_BY_ID[item.rarity]?.rank || 0) > maxRank);
    const dusted = before - state.inventory.length;
    addLog(`分解 ${dusted} 件装备。`);
    saveState();
    renderAll();
  }

  function visibleWarehouseItems() {
    const min = els.rarityFilter?.value || "all";
    const minRank = min === "all" ? 0 : RARITY_BY_ID[min]?.rank || 0;
    const sort = els.sortMode?.value || "score";
    const items = [...state.inventory, ...equippedItems()].filter((item) => min === "all" || (RARITY_BY_ID[item.rarity]?.rank || 0) >= minRank);
    return items.sort((a, b) => {
      if (sort === "level") return b.equipmentLevel - a.equipmentLevel;
      if (sort === "rarity") return (RARITY_BY_ID[b.rarity]?.rank || 0) - (RARITY_BY_ID[a.rarity]?.rank || 0);
      return itemScore(b) - itemScore(a);
    });
  }

  function heroPower(hero) {
    const kit = SKILL_DATA.roleKits?.[hero.role] || {};
    const bonus = equipmentBonus(hero);
    const basePower = (kit.hp || 300) * 0.5
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
    return basePower * skillLevelMultiplier(hero);
  }

  function itemScoreForHero(item, hero) {
    const rarityValue = RARITY_BY_ID[item.rarity]?.value || 1;
    const baseScore = Object.entries(item.baseStats || {}).reduce((sum, [stat, value]) => sum + normalizedStatScoreForHero(stat, value, hero), 0);
    const affixScore = (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScoreForHero(affix.stat, affix.value, hero), 0);
    return Math.round(item.equipmentLevel * 1.1 + rarityValue * 18 + baseScore + affixScore);
  }

  function itemScore(item) {
    const rarityValue = RARITY_BY_ID[item.rarity]?.value || 1;
    const baseScore = Object.entries(item.baseStats || {}).reduce((sum, [stat, value]) => sum + normalizedStatScoreForHero(stat, value, null), 0);
    const affixScore = (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScoreForHero(affix.stat, affix.value, null), 0);
    return Math.round(item.equipmentLevel * 1.4 + rarityValue * 22 + baseScore + affixScore);
  }

  function normalizedStatScoreForHero(stat, value, hero) {
    const numeric = Number(value) || 0;
    const role = hero?.role || "";
    if (BUILD_LAYERS.ATTR_ORDER?.includes(stat)) return numeric * 55 * roleAttributeWeight(role, stat);
    const curveValue = MECHANIC_CURVES.hasMechanicCurve?.(stat) ? MECHANIC_CURVES.mechanicCurveValue(stat, numeric) * 100 : numeric;
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

  function equipmentBonus(hero) {
    const bundle = BUILD_LAYERS.buildEquipmentModifierBundle ? BUILD_LAYERS.buildEquipmentModifierBundle(heroEquipmentItemsForBuildLayer(hero)) : {};
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
      baseStats: Object.fromEntries(Object.entries(item.baseStats || {}).map(([stat, value]) => [stat, buildLayerAffixValue(stat, value)])),
      affixes: (item.affixes || []).map((affix) => ({ ...affix, id: affix.stat, value: buildLayerAffixValue(affix.stat, affix.value, true) })),
    }));
  }

  function buildLayerAffixValue(stat, value, isAffix = false) {
    const numeric = Number(value) || 0;
    if (isAffix && MECHANIC_CURVES.hasMechanicCurve?.(stat)) return numeric;
    return percentStats().includes(stat) ? numeric * 100 : numeric;
  }

  function itemStatRows(item) {
    const baseRows = Object.entries(item.baseStats || {}).map(([stat, value]) => `<div class="affix"><span>基础 · ${statLabel(stat)}</span><b>${formatValue(stat, value)}</b></div>`);
    const affixRows = mergedAffixes(item).map((affix) => `<div class="affix"><span>${statLabel(affix.stat)}${affix.count > 1 ? ` x${affix.count}` : ""}</span><b>${formatValue(affix.stat, affix.value)}</b></div>`);
    return [...baseRows, ...affixRows];
  }

  function mergedAffixes(item) {
    const map = new Map();
    for (const affix of item.affixes || []) {
      const current = map.get(affix.stat) || { stat: affix.stat, value: 0, count: 0 };
      current.value += Number(affix.value) || 0;
      current.count += 1;
      map.set(affix.stat, current);
    }
    return [...map.values()];
  }

  function activeHeroes() {
    return state.heroes
      .filter((hero) => hero.active)
      .sort((a, b) => teamSlotRank(a) - teamSlotRank(b) || state.heroes.indexOf(a) - state.heroes.indexOf(b))
      .slice(0, 4);
  }

  function teamSlots() {
    return [
      { index: 0, label: "前排 1", formation: "front", hero: heroInTeamSlot(0) },
      { index: 1, label: "前排 2", formation: "front", hero: heroInTeamSlot(1) },
      { index: 2, label: "后排 1", formation: "back", hero: heroInTeamSlot(2) },
      { index: 3, label: "后排 2", formation: "back", hero: heroInTeamSlot(3) },
    ];
  }

  function normalizeTeamSlots() {
    const used = new Set();
    const active = state.heroes.filter((hero) => hero.active);
    active.forEach((hero) => {
      if (!Number.isInteger(hero.teamSlot) || hero.teamSlot < 0 || hero.teamSlot > 3 || used.has(hero.teamSlot)) {
        hero.teamSlot = null;
      } else {
        used.add(hero.teamSlot);
      }
    });
    active.forEach((hero) => {
      if (Number.isInteger(hero.teamSlot)) return;
      const slot = [0, 1, 2, 3].find((index) => !used.has(index));
      if (slot === undefined) {
        hero.active = false;
        hero.teamSlot = null;
        return;
      }
      hero.teamSlot = slot;
      used.add(slot);
    });
    state.heroes.forEach(syncHeroFormationWithSlot);
  }

  function heroInTeamSlot(slotIndex) {
    return state.heroes.find((hero) => hero.active && hero.teamSlot === slotIndex) || null;
  }

  function teamSlotRank(hero) {
    return Number.isInteger(hero.teamSlot) ? hero.teamSlot : 99;
  }

  function firstOpenTeamSlot() {
    return [0, 1, 2, 3].find((slot) => !heroInTeamSlot(slot)) ?? null;
  }

  function syncHeroFormationWithSlot(hero) {
    if (!hero?.active || !Number.isInteger(hero.teamSlot)) return;
    hero.formation = hero.teamSlot < 2 ? "front" : "back";
  }

  function skillAverage(hero) {
    const values = Object.values(hero.skillLevels || {});
    return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 1;
  }

  function skillLevelMultiplier(hero) {
    return 1 + Math.max(0, skillAverage(hero) - 1) * 0.1;
  }

  function applySkillLevelMultiplier(spec, multiplier) {
    if (multiplier <= 1) return spec;
    return {
      ...spec,
      hp: Math.round((spec.hp || spec.maxHp || 300) * multiplier),
      maxHp: Math.round((spec.maxHp || spec.hp || 300) * multiplier),
      power: Math.round((spec.power || 45) * multiplier),
      physicalPower: round((spec.physicalPower || spec.power || 45) * multiplier, 2),
      magicPower: round((spec.magicPower || spec.power || 45) * multiplier, 2),
      armor: round((spec.armor || 0) * multiplier, 2),
      skillLevelMultiplier: multiplier,
    };
  }

  function teamPower() { return activeHeroes().reduce((sum, hero) => sum + heroPower(hero), 0); }
  function selectedHero() { return heroById(state.selectedHeroId); }
  function heroById(id) { return state.heroes.find((hero) => hero.id === id); }
  function currentRegion() { return regionByLevel(state.selectedRegion) || REGIONS[0]; }
  function regionByLevel(level) { return REGIONS.find((region) => region.level === Number(level)); }
  function equippedItems() { return state.heroes.flatMap((hero) => Object.values(hero.equipment || {})); }
  function findItem(id) { return [...state.inventory, ...equippedItems()].find((item) => item.id === id); }
  function itemOwner(itemId) { return state.heroes.find((hero) => Object.values(hero.equipment || {}).some((item) => item.id === itemId)); }
  function formationRank(hero) { return hero.formation === "front" ? 0 : 1; }
  function roleLabel(role) { return ROLE_LABELS[role] || role || "-"; }
  function enemyNames(team) { return team.map((unit) => roleLabel(unit.role)).join(" / "); }
  function skillTotal(hero) { return Object.values(hero.skillLevels || {}).reduce((sum, value) => sum + Number(value || 0), 0); }
  function heroRarity(hero) {
    const total = skillTotal(hero);
    if (total >= 24) return { id: "mythic", label: "传说" };
    if (total >= 18) return { id: "legendary", label: "史诗" };
    if (total >= 12) return { id: "epic", label: "精英" };
    if (total >= 7) return { id: "rare", label: "稀有" };
    return { id: "common", label: "普通" };
  }
  function skillName(key) { return SKILL_DATA.skills?.[key]?.name || key || "-"; }
  function facilityName(id) { return FACILITY_DEFS[id]?.name || id || "-"; }
  function slotName(slot) { return SLOT_DATA[slot]?.label || slot || "-"; }
  function statLabel(stat) { return AFFIX_DEFS[stat]?.label || stat; }
  function formatValue(stat, value) { return percentStats().includes(stat) ? `+${Math.round(value * 100)}%` : `+${round(value, 2)}`; }
  function percentStats() { return Object.entries(AFFIX_DEFS).filter(([, def]) => def.percent).map(([id]) => id); }
  function sortInventory() { state.inventory.sort((a, b) => itemScore(b) - itemScore(a)); }
  function addLog(text) { state.log.push(`D${state.day} ${text}`); state.log = state.log.slice(-40); }
  function setText(node, text) { if (node) node.textContent = text; }
  function setCombatStatus(text, tone) { if (els.combatStatus) { els.combatStatus.textContent = text; els.combatStatus.className = `status-pill ${tone || ""}`.trim(); } }
  function signed(value) { return value >= 0 ? `+${value}` : String(value); }
  function round(value, digits = 2) { return Number((Number(value) || 0).toFixed(digits)); }
  function rollInt(min, max, rng = state.rng) { return min + Math.floor(rng() * (max - min + 1)); }
  function rollEquipmentLevel(range) { return rollInt(Math.round(range[0]), Math.round(range[1]), state.rng); }
  function pick(list) { return list[Math.floor(state.rng() * list.length)]; }
  function pickMany(list, count) {
    const pool = [...list];
    const result = [];
    while (pool.length && result.length < count) result.push(pool.splice(Math.floor(state.rng() * pool.length), 1)[0]);
    return result;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
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

  window.TownLoop = { state, REGIONS, runRegionBattle, nextDay, autoEquipTeam };
})();
