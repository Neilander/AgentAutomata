(() => {
  const CHAPTER_ONE = window.GAME_MAP_PROGRESSION_COGNITION;
  const CHAPTER_TWO = window.GAME_MAP_PROGRESSION_CHAPTER2;
  const EQUIPMENT = window.GAME_EQUIPMENT_RUNTIME;
  const REQUESTED_CHAPTER = new URLSearchParams(location.search).get("chapter");
  const STORAGE_KEY = REQUESTED_CHAPTER === "2" ? "mercenary_town_campaign_v4_chapter2_preview" : "mercenary_town_campaign_v4_chapter1";
  const ACTIVE_STAT_LABELS = {
    maxHp: "生命", armor: "护甲", magicResist: "魔抗", physicalPower: "物攻", magicPower: "法强",
    attackSpeed: "攻速", skillHaste: "技能急速",
  };
  const layouts = {
    1: {
      region: "灰带郊野",
      positions: {
        r1_main_1: [11, 71], r1_main_2: [20, 60], r1_main_3: [29, 67], r1_main_4: [38, 55],
        r1_main_5: [47, 62], r1_main_6: [56, 49], r1_main_7: [66, 57], r1_main_8: [66, 36],
        r1_main_9: [76, 47], r1_main_10: [85, 38], r1_prison: [30, 35], r1_bandit: [47, 83], r1_boss: [93, 25],
      },
      links: [
        ["r1_main_1", "r1_main_2"], ["r1_main_2", "r1_main_3"], ["r1_main_3", "r1_main_4"],
        ["r1_main_4", "r1_main_5"], ["r1_main_5", "r1_main_6"], ["r1_main_6", "r1_main_7"],
        ["r1_main_6", "r1_main_8"], ["r1_main_7", "r1_main_9"], ["r1_main_8", "r1_main_9"],
        ["r1_main_9", "r1_main_10"], ["r1_main_10", "r1_boss"], ["r1_main_3", "r1_prison"], ["r1_main_5", "r1_bandit"],
      ],
    },
    2: {
      region: "双垒边境",
      positions: {
        r2_entry: [12, 52], r2_knight_rescue: [29, 30], r2_priest_rescue: [29, 73],
        r2_shield_trial: [51, 29], r2_flag_trial: [51, 73], r2_confluence: [73, 51], r2_boss: [91, 51],
      },
      links: [
        ["r2_entry", "r2_knight_rescue"], ["r2_entry", "r2_priest_rescue"],
        ["r2_knight_rescue", "r2_shield_trial"], ["r2_priest_rescue", "r2_flag_trial"],
        ["r2_shield_trial", "r2_confluence"], ["r2_flag_trial", "r2_confluence"], ["r2_confluence", "r2_boss"],
      ],
    },
  };
  const els = Object.fromEntries([
    "chapterLabel", "chapterProgress", "regionLabel", "goalLabel", "gearScore", "inventoryCount", "resetBtn",
    "campaignMap", "mapRegionName", "mapLinks", "mapNodes", "nodeType", "nodeName", "nodeEnemy", "nodeStatus",
    "nodeReward", "fieldFact", "nodeField", "fightBtn", "nextChapterBtn", "lastResult", "activeRoster", "reserveRoster",
    "heroTabs", "equipmentHeroName", "equippedGrid", "inventoryLabel", "inventoryGrid", "battleStatus", "battleTitle",
    "leaveBattleBtn", "battleMount", "battleReadout", "lootDialog", "lootOutcome", "lootTitle", "lootItems", "lootMessage",
    "closeLootBtn", "lootEquipmentBtn",
  ].map((id) => [id, document.getElementById(id)]));

  if (!CHAPTER_ONE || !CHAPTER_TWO || !EQUIPMENT || !window.GAME_BATTLE_VIEW?.mount) {
    document.body.innerHTML = '<div class="empty-state">双章试玩资源加载失败，请从本地服务器打开。</div>';
    return;
  }

  let save = loadSave();
  let currentPage = "map";
  let battleView = null;
  let battleRunning = false;
  let pendingBattle = null;

  bind();
  mountBattle();
  render();

  function bind() {
    document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
    els.resetBtn.addEventListener("click", resetSave);
    els.fightBtn.addEventListener("click", startSelectedBattle);
    els.nextChapterBtn.addEventListener("click", enterChapterTwo);
    els.leaveBattleBtn.addEventListener("click", () => { if (!battleRunning) showPage("map"); });
    els.closeLootBtn.addEventListener("click", () => els.lootDialog.close());
    els.lootEquipmentBtn.addEventListener("click", () => { els.lootDialog.close(); showPage("equipment"); });
  }

  function initialSave() {
    const state = {
      schema: "mercenary_town_campaign_v4",
      chapter: 1,
      chapterOne: CHAPTER_ONE.initialState("human-campaign-v4", { starterVariant: "player_agent_role_wave" }),
      chapterTwo: null,
      selectedNodeId: "r1_main_1",
      selectedHeroId: "hero_warrior",
      lootHistory: [],
    };
    if (REQUESTED_CHAPTER === "2") {
      state.chapter = 2;
      state.chapterTwo = CHAPTER_TWO.initialState("human-campaign-v4-chapter2-preview");
      state.selectedNodeId = "r2_entry";
    }
    return state;
  }

  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw || raw.schema !== "mercenary_town_campaign_v4") return initialSave();
      raw.chapterOne = CHAPTER_ONE.normalizeState(raw.chapterOne);
      if (raw.chapterTwo) raw.chapterTwo = CHAPTER_TWO.normalizeState(raw.chapterTwo);
      return raw;
    } catch (_) {
      return initialSave();
    }
  }

  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); }
  function resetSave() {
    if (battleRunning) return;
    localStorage.removeItem(STORAGE_KEY);
    save = initialSave();
    currentPage = "map";
    render();
  }

  function core() { return save.chapter === 1 ? CHAPTER_ONE : CHAPTER_TWO; }
  function gameState() { return save.chapter === 1 ? save.chapterOne : save.chapterTwo; }
  function setGameState(next) { if (save.chapter === 1) save.chapterOne = next; else save.chapterTwo = next; }
  function observation() { return core().observe(gameState()); }

  function showPage(page) {
    if (battleRunning && page !== "battle") return;
    currentPage = page;
    document.querySelectorAll("[data-view]").forEach((view) => view.classList.toggle("active", view.dataset.view === page));
    document.querySelectorAll("[data-page]").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
    if (page !== "battle") render();
  }

  function render() {
    const view = observation();
    const chapterNodes = core().nodes;
    const clearedCount = chapterNodes.filter((node) => gameState().cleared?.[node.id]).length;
    els.chapterLabel.textContent = save.chapter === 1 ? "第一章" : "第二章";
    els.chapterProgress.textContent = `${clearedCount} / ${chapterNodes.length}`;
    els.regionLabel.textContent = layouts[save.chapter].region;
    els.mapRegionName.textContent = layouts[save.chapter].region;
    els.goalLabel.textContent = view.currentGoal;
    els.gearScore.textContent = Math.round(view.gear?.score || 0);
    els.inventoryCount.textContent = gameState().inventory?.length || 0;
    renderMap(view);
    renderRoster();
    renderEquipment();
    persist();
  }

  function renderMap(view) {
    const visible = new Map(view.visibleNodes.map((node) => [node.id, node]));
    if (!visible.has(save.selectedNodeId)) save.selectedNodeId = view.visibleNodes.find((node) => node.status === "available")?.id || view.visibleNodes[0]?.id || null;
    const layout = layouts[save.chapter];
    els.mapNodes.innerHTML = core().nodes.filter((node) => visible.has(node.id)).map((node) => {
      const row = visible.get(node.id);
      const [x, y] = layout.positions[node.id] || [50, 50];
      return `<button type="button" class="map-node ${node.type} ${row.status} ${save.selectedNodeId === node.id ? "selected" : ""}" data-node="${node.id}" style="left:${x}%;top:${y}%">
        <span>${nodeGlyph(node)}</span><small>${escapeHtml(node.name)}</small>
      </button>`;
    }).join("");
    els.mapNodes.querySelectorAll("[data-node]").forEach((button) => button.addEventListener("click", () => {
      save.selectedNodeId = button.dataset.node;
      renderMap(observation());
    }));
    els.mapLinks.innerHTML = layout.links.map(([from, to]) => {
      const a = layout.positions[from], b = layout.positions[to];
      if (!a || !b || !visible.has(from) || !visible.has(to)) return "";
      const cleared = gameState().cleared?.[from] && (gameState().cleared?.[to] || visible.get(to)?.status === "available");
      return `<path class="${cleared ? "cleared" : ""}" d="M ${a[0] * 10} ${a[1] * 6.8} L ${b[0] * 10} ${b[1] * 6.8}"></path>`;
    }).join("");
    renderNodeInspector(view);
  }

  function renderNodeInspector(view) {
    const row = view.visibleNodes.find((node) => node.id === save.selectedNodeId);
    const item = core().nodes.find((node) => node.id === save.selectedNodeId);
    if (!row || !item) {
      els.nodeName.textContent = "查看边境路线";
      els.fightBtn.disabled = true;
      return;
    }
    els.nodeType.textContent = nodeTypeLabel(item.type);
    els.nodeName.textContent = row.name;
    els.nodeEnemy.textContent = row.enemyHint || "敌情未知";
    els.nodeStatus.textContent = statusLabel(row.status);
    els.nodeReward.textContent = row.rewardHint || "常规掉落";
    const field = row.fieldEffect;
    els.fieldFact.hidden = !field;
    els.nodeField.textContent = field?.rule || "";
    els.fightBtn.disabled = battleRunning || !["available", "farmable", "repeatable"].includes(row.status);
    const chapterComplete = save.chapter === 1 && gameState().cleared?.r1_boss;
    els.nextChapterBtn.hidden = !chapterComplete;
    const latest = gameState().history?.[0];
    els.lastResult.className = `last-result ${latest?.outcome || ""}`;
    els.lastResult.textContent = latest ? eventSummary(latest) : "尚无战斗记录";
  }

  function renderRoster() {
    const state = gameState();
    const activeIds = new Set(state.teamSlots);
    els.activeRoster.innerHTML = state.teamSlots.map((id, index) => unitRow(state.roster.find((unit) => unit.id === id), index, false)).join("");
    const reserves = state.roster.filter((unit) => !activeIds.has(unit.id));
    els.reserveRoster.innerHTML = reserves.length ? reserves.map((unit) => unitRow(unit, null, true)).join("") : '<div class="empty-state">尚未获得候补角色。</div>';
    els.reserveRoster.querySelectorAll("[data-swap]").forEach((button) => button.addEventListener("click", () => applySwap(button.dataset.swap)));
  }

  function unitRow(unit, slotIndex, reserve) {
    if (!unit) return "";
    return `<article class="unit-row">
      <div class="unit-slot">${reserve ? "候" : slotIndex + 1}</div>
      <div><small class="unit-kind">${unit.kind === "militia" ? "民兵" : "完整英雄"} · ${roleLabel(unit.role)}</small><strong>${escapeHtml(unit.name)}</strong><span>${escapeHtml(unit.note || "")}</span></div>
      ${reserve ? `<div class="swap-buttons">${gameState().teamSlots.map((_, index) => `<button type="button" data-swap="swap:${index}:${unit.id}" title="替换位置 ${index + 1}">${index + 1}</button>`).join("")}</div>` : ""}
    </article>`;
  }

  function applySwap(action) {
    if (battleRunning) return;
    const result = core().applyAction(gameState(), action);
    if (!result.ok) return;
    setGameState(result.state);
    render();
  }

  function renderEquipment() {
    const state = gameState();
    if (!state.roster.some((unit) => unit.id === save.selectedHeroId)) save.selectedHeroId = state.teamSlots[0];
    const hero = state.roster.find((unit) => unit.id === save.selectedHeroId);
    els.heroTabs.innerHTML = state.roster.map((unit) => `<button type="button" class="${unit.id === hero.id ? "active" : ""}" data-hero="${unit.id}">${escapeHtml(unit.name)}<small>${roleLabel(unit.role)} · ${Object.keys(unit.equipment || {}).length} 件</small></button>`).join("");
    els.heroTabs.querySelectorAll("[data-hero]").forEach((button) => button.addEventListener("click", () => { save.selectedHeroId = button.dataset.hero; renderEquipment(); persist(); }));
    els.equipmentHeroName.textContent = hero.name;
    els.inventoryLabel.textContent = `${state.inventory.length} 件`;
    els.equippedGrid.innerHTML = Object.entries(EQUIPMENT.SLOT_DATA).map(([slot, definition]) => {
      const item = hero.equipment?.[slot];
      return item ? itemCard(item, hero, false) : `<article class="slot-card empty"><span>${definition.label}</span><strong>空</strong><div class="item-stats">尚未穿戴</div></article>`;
    }).join("");
    els.inventoryGrid.innerHTML = state.inventory.length ? state.inventory.map((item) => itemCard(item, hero, true)).join("") : '<div class="empty-state">仓库为空。继续挑战关卡获得装备。</div>';
    els.inventoryGrid.querySelectorAll("[data-equip]").forEach((button) => button.addEventListener("click", () => equipItem(button.dataset.equip)));
  }

  function itemCard(item, hero, actionable) {
    const current = hero.equipment?.[item.slot] || null;
    const score = EQUIPMENT.itemScoreForRole(item, hero.role);
    const currentScore = current ? EQUIPMENT.itemScoreForRole(current, hero.role) : 0;
    const delta = Math.round((score - currentScore) * 10) / 10;
    return `<article class="${actionable ? "item-card" : "slot-card"} ${item.rarity || "common"}">
      <span>${escapeHtml(item.slotLabel || EQUIPMENT.SLOT_DATA[item.slot]?.label || item.slot)} · Lv.${item.equipmentLevel || item.level || 1}</span>
      <strong>${escapeHtml(item.name)}</strong>
      <div class="item-stats">${itemStatText(item)}</div>
      ${actionable ? `<div class="item-stats ${delta >= 0 ? "fit-positive" : "fit-negative"}">对 ${escapeHtml(hero.name)}：${delta >= 0 ? "+" : ""}${delta}</div><button type="button" data-equip="${item.id}">${current ? "替换" : "穿戴"}</button>` : ""}
    </article>`;
  }

  function equipItem(itemId) {
    if (battleRunning) return;
    const state = structuredClone(gameState());
    const hero = state.roster.find((unit) => unit.id === save.selectedHeroId);
    const itemIndex = state.inventory.findIndex((item) => item.id === itemId);
    if (!hero || itemIndex < 0) return;
    const item = state.inventory.splice(itemIndex, 1)[0];
    hero.equipment = { ...(hero.equipment || {}) };
    const replaced = hero.equipment[item.slot];
    if (replaced) state.inventory.push(replaced);
    hero.equipment[item.slot] = item;
    state.step = Number(state.step || 0) + 1;
    state.history = state.history || [];
    state.history.unshift({ step: state.step, action: `equip:${hero.id}:${item.id}`, outcome: "equipped", item, heroId: hero.id, gearAfter: core().gearScore(state) });
    setGameState(state);
    render();
  }

  function enterChapterTwo() {
    if (!save.chapterOne.cleared?.r1_boss || battleRunning) return;
    save.chapterTwo = save.chapterTwo || CHAPTER_TWO.initialState(`human-campaign-v4-chapter2-${Date.now()}`);
    save.chapter = 2;
    save.selectedNodeId = "r2_entry";
    save.selectedHeroId = "hero_warrior";
    showPage("map");
    render();
  }

  function mountBattle() {
    battleView = window.GAME_BATTLE_VIEW.mount({
      container: els.battleMount,
      maxTime: 75,
      speed: 1.6,
      cameraMode: "fitUnits",
      cameraSmoothing: 0.075,
      onFinish: finishBattle,
    });
  }

  function startSelectedBattle() {
    if (battleRunning || !save.selectedNodeId) return;
    const item = core().nodes.find((node) => node.id === save.selectedNodeId);
    const row = observation().visibleNodes.find((node) => node.id === save.selectedNodeId);
    if (!item || !row || !["available", "farmable", "repeatable"].includes(row.status)) return;
    const attempt = Number(gameState().attempts?.[item.id] || 0) + 1;
    const seed = `human-v4|chapter-${save.chapter}|${item.id}|${attempt}|${core().gearScore(gameState())}`;
    const fieldEffectId = save.chapter === 1 ? core().fieldEffectId?.(item) : item.fieldEffectId;
    pendingBattle = { item, action: `challenge:${item.id}`, isWaveOpening: save.chapter === 1 && item.id === "r1_main_1" };
    battleRunning = true;
    els.battleTitle.textContent = item.name;
    els.battleStatus.textContent = fieldEffectId ? `场地：${row.fieldEffect?.name || fieldEffectId}` : "真实战斗进行中";
    els.battleReadout.textContent = pendingBattle.isWaveOpening ? "第一关为连续小波；当前画面播放先头交战，最终结算使用完整小波战斗。" : (row.fieldEffect?.rule || "观察角色贡献、承伤顺序与技能循环。");
    els.leaveBattleBtn.disabled = true;
    showPage("battle");
    battleView.onFinish = finishBattle;
    battleView.start({
      leftTeam: core().playerTeam(gameState()),
      rightTeam: core().enemyTeam(item, gameState()),
      seed,
      title: item.name,
      randomizeStats: false,
      fieldEffectId: fieldEffectId || "",
    });
  }

  function finishBattle(renderedResult) {
    if (!battleRunning || !pendingBattle) return;
    const resolvedCombat = pendingBattle.isWaveOpening ? null : playedCombatResult(renderedResult);
    const result = applyChallengeWithoutAutoEquip(pendingBattle.action, resolvedCombat);
    battleRunning = false;
    els.leaveBattleBtn.disabled = false;
    if (!result.ok) {
      els.battleStatus.textContent = "结算失败";
      pendingBattle = null;
      return;
    }
    setGameState(result.state);
    save.lootHistory.unshift({ chapter: save.chapter, node: result.event.node, outcome: result.event.outcome, loot: result.event.loot || [] });
    els.battleStatus.textContent = result.event.outcome === "win" ? "战斗胜利" : "战斗失败";
    els.battleReadout.textContent = eventSummary(result.event);
    showLoot(result.event);
    pendingBattle = null;
    persist();
  }

  function applyChallengeWithoutAutoEquip(action, resolvedCombat) {
    const before = structuredClone(gameState());
    const beforeIds = new Set(allEquipment(before).map((item) => item.id));
    const options = { captureVisibleSignals: true };
    if (resolvedCombat) options.resolvedCombat = resolvedCombat;
    const result = core().applyAction(before, action, options);
    if (!result.ok) return result;
    const generated = allEquipment(result.state).filter((item) => !beforeIds.has(item.id));
    const beforeById = new Map(before.roster.map((unit) => [unit.id, unit]));
    result.state.roster = result.state.roster.map((unit) => ({
      ...unit,
      equipment: { ...(beforeById.get(unit.id)?.equipment || unit.equipment || {}) },
    }));
    result.state.inventory = [...before.inventory, ...generated];
    result.state.cognition.knowledge = (result.state.cognition?.knowledge || []).filter((text) => !String(text).includes("自动换上"));
    result.event.gearBefore = core().gearScore(before);
    result.event.gearAfter = core().gearScore(result.state);
    result.event.loot = generated.map((item) => EQUIPMENT.publicItem(item));
    return result;
  }

  function allEquipment(state) {
    return [...(state.inventory || []), ...state.roster.flatMap((unit) => Object.values(unit.equipment || {}))].filter(Boolean);
  }

  function playedCombatResult(fallback) {
    const sim = battleView?.state?.unifiedSim;
    if (!sim) return normalizeFallbackCombat(fallback);
    const leftHp = sim.sideHpScore("left");
    const rightHp = sim.sideHpScore("right");
    return {
      winner: leftHp >= rightHp ? "left" : "right",
      duration: sim.time,
      leftHp,
      rightHp,
      units: sim.units.map((unit) => ({
        id: unit.id, side: unit.side, index: unit.index, role: unit.role, name: unit.name,
        hp: unit.hp, maxHp: unit.maxHp, hpRatio: sim.hpRatio(unit), alive: sim.isAlive(unit),
        damageDone: unit.damageDone || 0, healingDone: unit.healingDone || 0, shieldingDone: unit.shieldingDone || 0,
      })),
      signals: [...(sim.signalBus?.signals || [])],
      summary: sim.signalBus?.summary?.() || {},
      metrics: sim.metrics(),
    };
  }

  function normalizeFallbackCombat(raw) {
    return {
      ...(raw || {}),
      units: (raw?.units || []).map((unit) => ({ ...unit, side: unit.side === "ally" ? "left" : unit.side === "enemy" ? "right" : unit.side })),
      signals: raw?.signals || [],
    };
  }

  function showLoot(event) {
    const loot = event.loot || [];
    els.lootOutcome.textContent = event.outcome === "win" ? "战斗胜利" : "挑战失败";
    els.lootTitle.textContent = event.characterUnlock ? `${event.characterUnlock.name}加入名单` : (loot.length ? `获得 ${loot.length} 件装备` : "本次没有装备掉落");
    els.lootItems.innerHTML = loot.map((item) => `<article class="item-card ${item.rarity || "common"}"><span>${escapeHtml(item.rarityLabel || "普通")} · Lv.${item.equipmentLevel || item.level || 1}</span><strong>${escapeHtml(item.name)}</strong><div class="item-stats">${itemStatText(item)}</div></article>`).join("");
    els.lootMessage.textContent = event.outcome === "loss" ? "失败没有惩罚。可以换人、配装或选择其他开放路线。" : (event.reward || "装备已进入仓库，尚未自动穿戴。");
    els.lootEquipmentBtn.hidden = !loot.length;
    els.lootDialog.showModal();
  }

  function itemStatText(item) {
    const base = Object.entries(item.baseStats || {}).map(([key, value]) => `${ACTIVE_STAT_LABELS[key] || key} +${value}`);
    const affixes = (item.affixes || []).map((row) => `${row.label || row.stat} +${row.value}`);
    return [...base, ...affixes].join(" · ") || "无额外属性";
  }

  function eventSummary(event) {
    if (event.outcome === "team_changed") return "队伍已调整，下一场战斗会验证这次替换。";
    if (event.outcome === "equipped") return `已手动穿戴 ${event.item?.name || "装备"}。`;
    const result = event.outcome === "win" ? "胜利" : "失败";
    const survivors = event.survivors ? `我方 ${event.survivors.player} 人、敌方 ${event.survivors.enemy} 人存活` : "";
    return `${result} · ${Number(event.duration || 0).toFixed(1)} 秒${survivors ? ` · ${survivors}` : ""}`;
  }

  function nodeGlyph(node) {
    if (node.type === "boss") return "王";
    if (node.type === "rescue" || node.type === "branch") return "支";
    if (node.type === "trial") return "试";
    return String(node.name).match(/\d+/)?.[0] || "战";
  }
  function nodeTypeLabel(type) { return ({ main: "主线关卡", branch: "可选支线", rescue: "角色救援", trial: "场地试炼", boss: "章节首领" })[type] || type; }
  function statusLabel(status) { return ({ available: "可以挑战", farmable: "可重复刷取", repeatable: "可重复挑战", cleared: "已完成", locked: "未开放" })[status] || status; }
  function roleLabel(role) { return ({ warrior: "战士", knight: "骑士", berserker: "狂战", assassin: "刺客", ranger: "游侠", mage: "法师", priest: "牧师" })[role] || role; }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
})();
