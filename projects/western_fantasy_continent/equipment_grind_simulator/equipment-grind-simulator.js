(() => {
  const SKILL_DATA = window.GAME_SKILL_DATA;
  const BATTLE = window.GAME_BATTLE_VIEW;
  if (!SKILL_DATA) throw new Error("Equipment grind simulator requires skill data.");

  const SAVE_KEY = "agent_automata_equipment_grind_v2";
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
  const SLOT_DATA = {
    weapon: { label: "武器", icon: "⚔️", stats: ["physicalPower", "magicPower", "attackSpeed"] },
    helm: { label: "头盔", icon: "🎩", stats: ["maxHp", "armor", "skillHaste"] },
    chest: { label: "胸甲", icon: "🛡️", stats: ["maxHp", "armor", "receivedHealing"] },
    boots: { label: "靴子", icon: "🥾", stats: ["attackSpeed", "effectResist", "skillHaste"] },
    ring: { label: "戒指", icon: "💍", stats: ["magicPower", "effectPower", "skillHaste"] },
    charm: { label: "护符", icon: "🔮", stats: ["effectPower", "receivedHealing", "physicalPower"] },
  };
  const STAT_LABELS = {
    maxHp: "生命",
    physicalPower: "物攻",
    magicPower: "法强",
    armor: "护甲",
    attackSpeed: "攻速",
    skillHaste: "技能急速",
    effectPower: "效果强度",
    effectResist: "效果抗性",
    receivedHealing: "受治愈增幅",
  };
  const RARITIES = [
    { id: "common", label: "普通", affixes: 1, value: 1 },
    { id: "rare", label: "稀有", affixes: 1, value: 1.34 },
    { id: "epic", label: "史诗", affixes: 2, value: 1.58 },
    { id: "legendary", label: "传说", affixes: 2, value: 1.92 },
    { id: "mythic", label: "神话", affixes: 3, value: 2.25 },
  ];
  const DUNGEONS = [
    { level: 1, name: "旧路鼠窟", icon: "●", power: 980, rewardTier: 1, rarity: { common: 0.62, rare: 0.28, epic: 0.1 }, enemySets: [["warrior", "warrior", "ranger", "priest"], ["knight", "warrior", "mage", "ranger"], ["berserker", "warrior", "priest", "bard"]] },
    { level: 2, name: "黑松哨站", icon: "◆", power: 1250, rewardTier: 2, rarity: { rare: 0.52, epic: 0.34, legendary: 0.14 }, enemySets: [["knight", "warrior", "mage", "priest"], ["warrior", "berserker", "ranger", "bard"], ["assassin", "knight", "warlock", "priest"]] },
    { level: 3, name: "腐火地窟", icon: "●", power: 1550, rewardTier: 3, rarity: { rare: 0.22, epic: 0.46, legendary: 0.25, mythic: 0.07 }, enemySets: [["knight", "mage", "mage", "priest"], ["warrior", "alchemist", "warlock", "bard"], ["assassin", "assassin", "knight", "ranger"]] },
    { level: 4, name: "王墓外环", icon: "◆", power: 1900, rewardTier: 4, rarity: { epic: 0.48, legendary: 0.36, mythic: 0.16 }, enemySets: [["knight", "knight", "priest", "ranger"], ["warrior", "berserker", "mage", "bard"], ["assassin", "warlock", "alchemist", "priest"]] },
    { level: 5, name: "龙骨深层", icon: "●", power: 2350, rewardTier: 5, rarity: { epic: 0.22, legendary: 0.48, mythic: 0.3 }, enemySets: [["knight", "warrior", "mage", "priest"], ["berserker", "assassin", "ranger", "bard"], ["warlock", "alchemist", "mage", "knight"]] },
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
    modalHeroId: "",
    modalMode: "skills",
    battleView: null,
    runCount: 0,
  };

  const ids = [
    "teamPower", "bestClear", "rerollBtn", "dungeonName", "dungeonList", "enemyPreview",
    "combatStatus", "combatTitle", "fightBtn", "battleMount", "teamPreview", "lootCount", "lootCountPanel",
    "rewardBurst", "lootLog", "rosterList", "selectedHero", "equippedSlots", "bagCount",
    "bagCountPanel", "bagGrid", "detailTitle", "detailBody", "equipBtn",
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
      runCount: state.runCount,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function normalizeState() {
    if (!state.heroes.length) createRoster(false);
    if (!heroById(state.selectedHeroId)) state.selectedHeroId = state.heroes[0]?.id || "";
    if (!state.currentEnemyRoles.length) chooseDungeon(state.selectedDungeon, false);
    sortAndTrimBag();
    saveState();
  }

  function createRoster(shouldSave = true) {
    const roles = pickMany(["warrior", "knight", "berserker", "assassin", "ranger", "mage", "priest", "warlock", "bard", "alchemist"], 6);
    state.heroes = roles.map((role, index) => {
      const kit = SKILL_DATA.roleKits[role]?.kit || {};
      return {
        id: `hero_${Date.now()}_${index}`,
        role,
        name: `${ROLE_LABELS[role] || role}${index + 1}`,
        active: index < 4,
        equipment: {},
        small1: kit.small1,
        small2: kit.small2,
        passive: kit.passive,
        ultimate: kit.ultimate,
      };
    });
    state.selectedHeroId = state.heroes[0]?.id || "";
    state.selectedItemId = "";
    state.inventory = Array.from({ length: 8 }, () => generateItem(1));
    state.bestClear = 0;
    state.lastLoot = [];
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
    els.equipBtn?.addEventListener("click", equipSelectedItem);
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
      const card = event.target.closest("[data-hero]");
      if (!card) return;
      state.selectedHeroId = card.dataset.hero;
      state.selectedItemId = "";
      openCharacterModal(card.dataset.hero);
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
    state.selectedHeroId = id;
    saveState();
    renderAll();
    previewBattle();
  }

  function fight() {
    if (!BATTLE || !els.battleMount) return;
    if (activeHeroes().length !== 4) {
      setCombatStatus("需要 4 人", "loss");
      return;
    }
    const dungeon = currentDungeon();
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
    const win = result.winner === "left" || result.passed;
    const dungeon = currentDungeon();
    setCombatStatus(win ? "胜利" : "失败", win ? "win" : "loss");
    if (win) {
      state.bestClear = Math.max(state.bestClear, dungeon.level);
      const count = 2 + Math.floor(state.rng() * 3);
      const loot = Array.from({ length: count }, () => generateItem(dungeon.rewardTier, dungeon.rarity));
      state.lastLoot = loot;
      state.inventory.push(...loot);
      sortAndTrimBag();
      flashReward(`+${loot.length} 件装备`);
    } else {
      state.lastLoot = [];
      flashReward("失败无惩罚，换装再来");
    }
    saveState();
    renderAll();
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
    const kit = SKILL_DATA.roleKits[hero.role] || {};
    const bonus = equipmentBonus(hero);
    const baseHp = kit.hp || 300;
    const basePower = kit.power || 45;
    return {
      role: hero.role,
      name: hero.name,
      small1: hero.small1,
      small2: hero.small2,
      passive: hero.passive,
      ultimate: hero.ultimate,
      hp: Math.round(baseHp + bonus.maxHp),
      power: Math.round(basePower + Math.max(bonus.physicalPower, bonus.magicPower) * 0.35),
      physicalPower: round(basePower + bonus.physicalPower, 2),
      magicPower: round(basePower + bonus.magicPower, 2),
      armor: round((kit.armor || 0) + bonus.armor, 2),
      range: kit.range || 14,
      attackSpeedMult: round(1 + bonus.attackSpeed, 3),
      skillHasteMult: round(1 + bonus.skillHaste, 3),
      effectPowerMult: round(1 + bonus.effectPower, 3),
      effectResistPct: clamp(bonus.effectResist, 0, 0.5),
      receivedHealingMult: round(1 + bonus.receivedHealing, 3),
      slotIndex: index,
    };
  }

  function buildEnemyTeam(dungeon) {
    const scale = 0.82 + dungeon.level * 0.12;
    return state.currentEnemyRoles.map((role, index) => {
      const kit = SKILL_DATA.roleKits[role] || {};
      const roleKit = kit.kit || {};
      const power = Math.round((kit.power || 45) * scale);
      return {
        role,
        name: `${dungeon.level}级${ROLE_LABELS[role] || role}`,
        small1: roleKit.small1,
        small2: roleKit.small2,
        passive: roleKit.passive,
        ultimate: roleKit.ultimate,
        hp: Math.round((kit.hp || 300) * scale),
        power,
        physicalPower: power,
        magicPower: power,
        armor: round((kit.armor || 8) * (0.82 + dungeon.level * 0.08), 1),
        range: kit.range || 14,
        slotIndex: index,
      };
    });
  }

  function generateItem(tier = 1, rarityTable) {
    const slotKey = pick(Object.keys(SLOT_DATA));
    const slot = SLOT_DATA[slotKey];
    const rarity = chooseRarity(rarityTable || { common: 0.6, rare: 0.28, epic: 0.1, legendary: 0.02 });
    const affixes = pickMany(slot.stats, rarity.affixes).map((stat) => ({ stat, value: rollStatValue(stat, tier, rarity.value) }));
    return {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      slot: slotKey,
      tier,
      rarity: rarity.id,
      rarityLabel: rarity.label,
      icon: slot.icon,
      name: `${rarity.label}${slot.label}+${tier}`,
      affixes,
    };
  }

  function rollStatValue(stat, tier, rarityValue) {
    const base = { maxHp: 18, physicalPower: 3.2, magicPower: 3.2, armor: 1.4, attackSpeed: 0.018, skillHaste: 0.014, effectPower: 0.022, effectResist: 0.012, receivedHealing: 0.016 }[stat] || 1;
    const value = base * (0.8 + tier * 0.42) * rarityValue * (0.78 + state.rng() * 0.44);
    return percentStats().includes(stat) ? round(value, 3) : Math.round(value);
  }

  function equipmentBonus(hero) {
    const bonus = { maxHp: 0, physicalPower: 0, magicPower: 0, armor: 0, attackSpeed: 0, skillHaste: 0, effectPower: 0, effectResist: 0, receivedHealing: 0 };
    for (const item of Object.values(hero.equipment || {})) {
      for (const affix of item.affixes || []) bonus[affix.stat] += Number(affix.value) || 0;
    }
    return bonus;
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

  function sortAndTrimBag() {
    const equippedIds = new Set(state.heroes.flatMap((hero) => Object.values(hero.equipment || {}).map((item) => item.id)));
    state.inventory = state.inventory.filter((item) => !equippedIds.has(item.id)).sort((a, b) => itemScore(b) - itemScore(a)).slice(0, 42);
  }

  function renderAll() {
    renderTop();
    renderDungeon();
    renderTeamPreview();
    renderRoster();
    renderEquipment();
    renderBag();
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
    const leftSlots = ["weapon", "helm", "chest"].map((slotKey) => modalEquipmentSlot(hero, slotKey)).join("");
    const rightSlots = ["boots", "ring", "charm"].map((slotKey) => modalEquipmentSlot(hero, slotKey)).join("");
    root.innerHTML = `<div class="character-modal-backdrop">
      <section class="character-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(hero.name)}">
        <header class="character-modal-head">
          <div>
            <span>${ROLE_LABELS[hero.role] || hero.role}</span>
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
            <em>${skillSummary(hero.role)}</em>
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
      <small>${item ? `${escapeHtml(item.name)} · T${item.tier}` : "空"}</small>
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
    if (els.fightBtn) els.fightBtn.disabled = activeHeroes().length !== 4;
  }

  function renderDungeon() {
    const current = currentDungeon();
    if (els.dungeonName) els.dungeonName.textContent = `Lv.${current.level} ${current.name}`;
    if (els.dungeonList) {
      els.dungeonList.innerHTML = DUNGEONS.map((dungeon) => {
        const unlocked = dungeon.level <= Math.max(1, state.bestClear + 1);
        return `<button class="dungeon-card ${dungeon.level === state.selectedDungeon ? "active" : ""} ${unlocked ? "" : "locked"}" type="button" data-dungeon="${dungeon.level}" ${unlocked ? "" : "disabled"}>
          <span class="dungeon-icon">${dungeon.icon}</span>
          <span><strong>${escapeHtml(dungeon.name)}</strong><small>建议 ${dungeon.power} · Tier ${dungeon.rewardTier}</small></span>
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
      <strong>${ROLE_ICONS[hero.role] || "●"} ${escapeHtml(hero.name)}</strong>
      <span><b>被动</b>${skillName(hero.passive)}</span>
      <span><b>小技</b>${skillName(hero.small1)} / ${skillName(hero.small2)}</span>
      <span><b>大招</b>${skillName(hero.ultimate)}</span>
    </div>`).join("");
  }

  function renderRoster() {
    if (!els.rosterList) return;
    els.rosterList.innerHTML = state.heroes.map((hero) => `<div class="hero-card ${hero.active ? "active" : ""} ${hero.id === state.selectedHeroId ? "selected" : ""}" role="button" tabindex="0" data-hero="${hero.id}">
      ${hero.active ? '<span class="team-mark">上阵</span>' : ""}
      <span class="hero-avatar">${ROLE_ICONS[hero.role] || "●"}</span>
      <span>
        <strong>${escapeHtml(hero.name)}</strong>
        <span>${ROLE_LABELS[hero.role] || hero.role} · 战力 ${Math.round(heroPower(hero))}</span>
        <span>${skillSummary(hero.role)}</span>
        <button type="button" data-toggle-hero="${hero.id}">${hero.active ? "下阵" : "上阵"}</button>
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
      els.selectedHero.innerHTML = `<strong>${ROLE_ICONS[hero.role] || "●"} ${escapeHtml(hero.name)}</strong><span>${ROLE_LABELS[hero.role] || hero.role} · 战力 ${Math.round(heroPower(hero))}</span><span>生命 +${Math.round(bonus.maxHp)} / 物攻 +${round(bonus.physicalPower, 1)} / 法强 +${round(bonus.magicPower, 1)} / 护甲 +${round(bonus.armor, 1)}</span>`;
    }
    if (els.equippedSlots) {
      els.equippedSlots.innerHTML = Object.entries(SLOT_DATA).map(([slotKey, slot]) => {
        const item = hero.equipment[slotKey];
        return `<button class="slot-cell ${item ? `rarity-${item.rarity}` : ""} ${item?.id === state.selectedItemId ? "selected" : ""}" type="button" ${item ? `data-equipped-item="${item.id}"` : ""}>
          <small>${slot.label}</small><span>${item?.icon || slot.icon}</span><small>${item ? `T${item.tier} ${item.rarityLabel}` : "空"}</small>
        </button>`;
      }).join("");
    }
  }

  function renderBag() {
    const bagText = `${state.inventory.length}/42`;
    if (els.bagCount) els.bagCount.textContent = bagText;
    if (els.bagCountPanel) els.bagCountPanel.textContent = bagText;
    if (els.bagGrid) {
      const bagItems = bagItemsForDisplay();
      els.bagGrid.innerHTML = Array.from({ length: 42 }, (_, i) => {
        const item = bagItems[i];
        const owner = item ? itemOwner(item.id) : null;
        return item ? `<button class="bag-cell rarity-${item.rarity} ${owner ? "equipped" : ""} ${item.id === state.selectedItemId ? "selected" : ""}" type="button" data-item="${item.id}" title="${escapeHtml(item.name)}${owner ? ` · ${owner.name}` : ""}"><span>${item.icon}</span><small>T${item.tier}</small>${owner ? `<em>${escapeHtml(owner.name)}</em>` : ""}</button>` : `<div class="bag-cell"></div>`;
      }).join("");
    }
    const lootText = `${state.lastLoot.length} 件`;
    if (els.lootCount) els.lootCount.textContent = lootText;
    if (els.lootCountPanel) els.lootCountPanel.textContent = lootText;
    if (els.lootLog) {
      els.lootLog.innerHTML = state.lastLoot.length ? state.lastLoot.map((item) => `<div class="loot-row rarity-${item.rarity}"><span class="item-icon">${item.icon}</span><span><strong>${escapeHtml(item.name)}</strong><span>${formatAffixes(item)}</span></span></div>`).join("") : `<div class="loot-row"><span class="item-icon">◇</span><span><strong>暂无掉落</strong><span>打赢副本后显示</span></span></div>`;
    }
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
    const delta = hero ? itemScore(item) - itemScore(current) : 0;
    els.detailTitle.textContent = item.name;
    els.detailBody.innerHTML = `<div class="detail-name">${item.icon} ${escapeHtml(item.name)}</div>
      <div>部位：${SLOT_DATA[item.slot].label} · Tier ${item.tier} · ${item.rarityLabel}</div>
      <div class="owner-line">${owner ? `已装备：${escapeHtml(owner.name)}` : "未装备"}</div>
      ${hero ? `<div>对 ${escapeHtml(hero.name)}：${delta >= 0 ? "+" : ""}${Math.round(delta)} 装备评分</div>` : ""}
      <div class="affix-list">${(item.affixes || []).map((affix) => `<div class="affix"><span>${STAT_LABELS[affix.stat] || affix.stat}</span><b>${formatValue(affix.stat, affix.value)}</b></div>`).join("")}</div>`;
    if (els.equipBtn) els.equipBtn.disabled = !hero || !state.inventory.some((bagItem) => bagItem.id === item.id);
  }

  function heroDetail(hero) {
    return `<div class="detail-name">${ROLE_ICONS[hero.role] || "●"} ${escapeHtml(hero.name)}</div>
      <div>${ROLE_LABELS[hero.role] || hero.role} · 当前战力 ${Math.round(heroPower(hero))}</div>
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
  function activeHeroes() { return state.heroes.filter((hero) => hero.active).slice(0, 4); }
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
      + bonus.receivedHealing * 280;
  }
  function itemScore(item) {
    if (!item) return 0;
    const rarityValue = { common: 1, rare: 1.35, epic: 1.7, legendary: 2.15, mythic: 2.65 }[item.rarity] || 1;
    return Math.round(item.tier * 35 + rarityValue * 24 + (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScore(affix.stat, affix.value), 0));
  }
  function normalizedStatScore(stat, value) {
    return ({ maxHp: 0.55, physicalPower: 8, magicPower: 8, armor: 12, attackSpeed: 320, skillHaste: 330, effectPower: 285, effectResist: 210, receivedHealing: 220 }[stat] || 1) * value;
  }
  function rolePhysicalWeight(role) { return ["warrior", "berserker", "assassin", "ranger", "knight"].includes(role) ? 1 : 0.45; }
  function roleMagicWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard"].includes(role) ? 1 : 0.35; }
  function roleSkillWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard", "knight"].includes(role) ? 1 : 0.65; }
  function roleEffectWeight(role) { return ["mage", "warlock", "alchemist", "priest", "bard"].includes(role) ? 1 : 0.5; }
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
  function skillSummary(role) {
    const kit = SKILL_DATA.roleKits[role]?.kit || {};
    return [kit.small1, kit.passive, kit.ultimate].map(skillName).join(" · ");
  }
  function enemySkillRows(role) {
    const kit = SKILL_DATA.roleKits[role]?.kit || {};
    return `<span><b>被动</b>${skillName(kit.passive)}</span><span><b>小技</b>${skillName(kit.small1)} / ${skillName(kit.small2)}</span><span><b>大招</b>${skillName(kit.ultimate)}</span>`;
  }
  function skillName(key) { return SKILL_DATA.skills?.[key]?.name || key || "-"; }
  function enemyNames(roles) { return roles.map((role) => ROLE_LABELS[role] || role).join(" / "); }
  function formatAffixes(item) { return (item.affixes || []).map((affix) => `${STAT_LABELS[affix.stat]} ${formatValue(affix.stat, affix.value)}`).join(" · "); }
  function formatValue(stat, value) { return percentStats().includes(stat) ? `+${Math.round(value * 100)}%` : `+${value}`; }
  function percentStats() { return ["attackSpeed", "skillHaste", "effectPower", "effectResist", "receivedHealing"]; }
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

  window.EquipmentGrindSimulator = { state, DUNGEONS, generateItem, chooseDungeon, fight, equipSelectedItem, buildHeroSpec, buildEnemyTeam, saveState };
  init();
})();
