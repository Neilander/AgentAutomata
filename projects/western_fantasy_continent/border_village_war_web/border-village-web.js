(function () {
  "use strict";

  const GAME = window.BORDER_VILLAGE_WAR;
  const SAVE_KEY = "infinite_loot_border_village_war_v3";
  const FORMATION_SAVE_KEY = "infinite_loot_border_village_formations_v1";
  const CURRENT_CITY = "灰谷村";
  const FORMATION_SPECS = [
    { id: "duo", name: "灰谷侦察组", capacity: 2, unlocked: true },
    { id: "squad", name: "灰谷巡逻队", capacity: 4, unlocked: true },
    { id: "company", name: "边境远征队", capacity: 8, unlocked: true },
    { id: "warband", name: "灰谷战团", capacity: 20, unlocked: true },
    { id: "host", name: "大型战团", capacity: 40, unlocked: false },
    { id: "army", name: "大型军阵", capacity: 100, unlocked: false },
    { id: "legion", name: "远征军团", capacity: 200, unlocked: false },
  ];
  const COMBAT_FORMATION_RULES = {
    hunt: { label: "小队讨伐", capacity: 4, fixedNote: "" },
    training: { label: "实战训练", capacity: 4, fixedNote: "另有1支受训民兵固定参战" },
    raid: { label: "据点突袭", capacity: 8, fixedNote: "" },
    challenge: { label: "遗迹挑战", capacity: 8, fixedNote: "" },
    final: { label: "村庄决战", capacity: 20, fixedNote: "" },
  };
  const MAP_WIDTH = 1400;
  const MAP_HEIGHT = 860;
  const MAP_PAN_MARGIN_X = 520;
  const MAP_PAN_MARGIN_Y = 340;
  const INVENTORY_PAGE_SIZE = 24;
  const RARITY_ORDER = { "炼狱": 8, "黑金": 7, "永恒": 6, "神话": 5, "传说": 4, "史诗": 3, "稀有": 2, "普通": 1 };
  const SLOT_ICONS = { "武器": "⚔", "头盔": "⌃", "胸甲": "⬡", "护手": "✦", "腿甲": "▥", "靴子": "⌄", "戒指": "○", "护符": "◇" };
  const RESOURCE_LABELS = { gold: "金币", food: "粮食", population: "实际人口", populationCap: "人口上限" };
  const STAT_LABELS = { physicalPower: "物理威力", magicPower: "魔法威力", maxHp: "生命", armor: "护甲", magicResist: "魔抗", attackSpeedPct: "攻击速度", skillHastePct: "技能急速" };
  const PLOT_POSITIONS = [[430, 520], [295, 650], [570, 690], [835, 680], [1060, 560], [1020, 405], [865, 300]];
  const RAID_POSITIONS = { foragers: [245, 240], beastPen: [620, 125], shaman: [1100, 225] };
  const CHALLENGE_POSITION = [1240, 690];
  const BUILDING_APPROACH_OFFSETS = [[70, 0], [65, -35], [15, -65], [-15, -65], [-70, -5], [-65, 20], [-25, 65]];
  const BUILDING_PATROL_ROUTES = {
    west: [0, 1, 2, 0],
    south: [2, 3, 4, 2],
    east: [4, 5, 6, 4],
    workshop: [5, 4, 3, 5],
    villageCross: [0, 2, 3, 5, 6, 0],
    westNorth: [1, 0, 6, 5, 1],
    fullRing: [0, 1, 2, 3, 4, 5, 6, 0],
    reverseRing: [6, 5, 4, 3, 2, 1, 0, 6],
  };
  const HERO_PATROL_ROUTES = {
    player: "villageCross", captain: "east", scout: "fullRing", guard: "south",
    sellsword: "west", witch: "westNorth", hunter: "reverseRing", alchemist: "workshop", heiress: "fullRing", mentor: "east",
  };
  const HERO_FALLBACK_ROUTES = ["villageCross", "south", "east", "west"];
  const MILITIA_PATROL_ROUTES = ["west", "south", "east", "workshop"];
  const CIVILIAN_ROUTES = [
    { x: 565, y: 430, route: "market", duration: 8.4, delay: -1.2 },
    { x: 820, y: 545, route: "river", duration: 10.8, delay: -6.1 },
    { x: 410, y: 605, route: "field", duration: 9.7, delay: -3.4 },
    { x: 890, y: 370, route: "gate", duration: 7.9, delay: -5.5 },
    { x: 575, y: 315, route: "river", duration: 11.6, delay: -8.3 },
    { x: 925, y: 525, route: "market", duration: 9.2, delay: -4.6 },
    { x: 475, y: 455, route: "gate", duration: 8.8, delay: -2.5 },
    { x: 830, y: 625, route: "field", duration: 12.1, delay: -9.2 },
  ];
  const BUILDING_SIGILS = { house: "舍", farm: "田", conscription: "征", smithy: "锻", market: "市" };
  const UNIT_GLYPHS = { player: "我", captain: "伊", scout: "莱", guard: "马", sellsword: "犬", witch: "盐", hunter: "苔", alchemist: "莎", heiress: "薇", mentor: "艾" };
  const ROLE_ICONS = { knight: "🛡️", warrior: "⚔️", berserker: "🪓", assassin: "🗡️", ranger: "🏹", mage: "🔥", priest: "✨", warlock: "☠️", bard: "🎵", alchemist: "⚗️" };

  let state = loadState();
  let formationState = loadFormationState();
  let mode = "campaign";
  let selectedNodeId = null;
  let selectedHeroId = null;
  let selectedItemId = null;
  let inventoryPage = 0;
  let activeTab = "party";
  let dockExpanded = false;
  let pendingPreview = null;
  let pendingCombat = null;
  let pendingCombatResult = null;
  const mockResults = {};
  let battleView = null;
  let grindSession = null;
  let toastTimer = null;
  let mapCamera = null;
  let mapDrag = null;
  let resizeObserver = null;
  let mapInputBound = false;
  let locations = [];
  let partyScrollLeft = 0;
  let partyRosterScrollTop = 0;
  let partyDetailScrollTop = 0;
  let equipmentBackpackScrollTop = 0;
  let equipmentMode = "character";
  let formationCityFilter = false;
  let formationPositioning = false;
  let selectedFormationPositionMemberId = null;
  let draggedFormationMemberId = null;
  let supplyHoldDelay = null;
  let supplyHoldInterval = null;
  let prosperityDrag = null;
  let prosperityGrowthFrame = null;
  let prosperityGrowthTimers = [];
  const newlyUnlocked = new Set();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.version === GAME.VERSION) return parsed;
    } catch (_) { /* local storage is optional */ }
    return GAME.createInitialState("browser-border-village");
  }

  function saveState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) { /* local storage is optional */ }
  }

  function defaultFormationState() {
    return {
      version: 1,
      selectedId: "warband",
      formations: FORMATION_SPECS.filter((spec) => spec.unlocked).map((spec) => ({ ...spec, members: ["player"] })),
    };
  }

  function loadFormationState() {
    try {
      const raw = localStorage.getItem(FORMATION_SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.version === 1 && Array.isArray(parsed.formations)) return parsed;
    } catch (_) { /* local storage is optional */ }
    return defaultFormationState();
  }

  function saveFormationState() {
    try { localStorage.setItem(FORMATION_SAVE_KEY, JSON.stringify(formationState)); } catch (_) { /* local storage is optional */ }
  }

  function view() { return GAME.getPlayerObservation(state); }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch])); }
  function formatCombatPower(value) { return Math.max(0, Math.round(Number(value || 0))).toLocaleString("zh-CN"); }

  function showToast(text) {
    const toast = document.querySelector("#toast");
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function recentAdded(before, after) {
    const known = new Set(before.recentSignals.map((row) => `${row.day}|${row.kind}|${row.text}`));
    return after.recentSignals.filter((row) => !known.has(`${row.day}|${row.kind}|${row.text}`));
  }

  function newHero(before, after) {
    const known = new Set(before.party.heroes.map((hero) => hero.id));
    return after.party.heroes.find((hero) => !known.has(hero.id)) || null;
  }

  function showResult(title, lines) {
    const dialog = document.querySelector("#result-dialog");
    document.querySelector("#result-title").textContent = title || "事情有了结果";
    document.querySelector("#result-body").textContent = Array.isArray(lines) ? lines.filter(Boolean).join("\n") : String(lines || "行动已经完成。");
    if (dialog.open) dialog.close();
    dialog.showModal();
  }

  function showRecruit(hero, resultText) {
    document.querySelector("#recruit-name").textContent = `${hero.name}加入了灰谷村`;
    document.querySelector("#recruit-role").textContent = `定位：${hero.role}`;
    document.querySelector("#recruit-affixes").innerHTML = hero.preferredAffixes.map((tag) => `<span>${esc(tag)}</span>`).join("");
    document.querySelector("#recruit-result").textContent = resultText || "这名同伴会在第7日自动参加决战。";
    document.querySelector("#recruit-overlay").hidden = false;
  }

  function costText(action) {
    const costs = Object.entries(action.knownCost || {}).filter(([, amount]) => amount).map(([key, amount]) => `${RESOURCE_LABELS[key] || key}-${amount}`);
    const gains = Object.entries(action.knownGain || {}).filter(([, amount]) => amount).map(([key, amount]) => `${RESOURCE_LABELS[key] || key}+${amount}`);
    if (action.actionPointCost) costs.unshift(`行动-${action.actionPointCost}`);
    if (action.foodCost && !Number(action.knownCost?.food || 0)) costs.push(`粮食-${action.foodCost}`);
    return [...costs, ...gains].join(" · ") || "不消耗行动";
  }

  function applyVisibleAction(action, options = {}) {
    if (!action) return;
    if (action.available === false) return showToast(action.disabledReason || "当前无法执行这个行动。");
    try {
      const before = view();
      const beforeRaids = new Set(before.raids.map((raid) => raid.title));
      state = GAME.applyPlayerAction(state, action.id);
      saveState();
      const after = view();
      const recruited = newHero(before, after);
      const signals = recentAdded(before, after);
      const unlocked = after.raids.filter((raid) => !beforeRaids.has(raid.title));
      for (const raid of unlocked) newlyUnlocked.add(`raid:${raid.id}`);
      if (action.kind === "selection") selectedHeroId = action.targetHeroId;
      if (action.kind === "equipment") selectedItemId = action.targetItemId;
      if (action.kind === "time") selectedNodeId = null;
      ensureSelections(after);
      render();
      const resultLines = signals.slice(0, 5).map((row) => row.text);
      if (unlocked.length) resultLines.push(`新情报：${unlocked.map((raid) => raid.title).join("、")}已经标在地图上。`);
      if (action.kind === "recruit" && after.town.population > before.town.population) showPopulationGrowth(before, after);
      else if (recruited) showRecruit(recruited, resultLines.join(" "));
      else if ((["build", "recruit", "event", "challenge", "time"].includes(action.kind) || action.operation === "auto_equip") && !options.quiet) showResult(action.label, resultLines);
      else showToast(resultLines[0] || `${action.label}完成`);
    } catch (error) {
      showToast(error.message || String(error));
    }
  }

  function runAction(action) {
    if (!action) return;
    if (action.available === false) return showToast(action.disabledReason || "当前无法执行这个行动。");
    if (action.kind === "mock_battle") return startCombat(GAME.natureSetMockPlan(action.mockVariant || "set"));
    if (["combat", "grind"].includes(action.kind)) {
      const plan = GAME.preparePlayerCombat(state, action.id);
      if (!plan) return showToast("这个战斗入口已经失效。");
      return openCombatPreview(plan, action.kind === "grind" ? "grind" : "combat");
    }
    applyVisibleAction(action);
  }

  function openCombatPreview(plan, launchKind) {
    const current = view();
    normalizeFormationState(current);
    const entries = combatFormationEntries(current, plan);
    const preferred = entries.find((entry) => entry.group === 0) || entries[0] || null;
    pendingPreview = { basePlan: plan, plan: null, launchKind, stage: "formation", foodSupplied: 0, selectedFormationId: preferred?.formation.id || null };
    document.querySelector("#preview-title").textContent = plan.title;
    document.querySelector("#preview-slide-track").classList.remove("supplying");
    renderCombatFormationPreview();
    const dialog = document.querySelector("#combat-preview-dialog");
    if (dialog.open) dialog.close();
    dialog.showModal();
  }

  function combatFormationRule(plan) {
    const base = COMBAT_FORMATION_RULES[plan?.kind] || { label: "特殊战斗", capacity: Math.max(1, Number(plan?.leftTeam?.length || 1)), fixedNote: "" };
    return { ...base, capacity: Number(plan?.formationCapacity || base.capacity), fixedNote: plan?.fixedNote || base.fixedNote };
  }

  function combatFormationEntries(current, plan) {
    normalizeFormationState(current);
    const rule = combatFormationRule(plan);
    const roster = formationRoster(current);
    return formationState.formations.map((formation, order) => {
      const status = formationStatus(formation, roster);
      const reasons = [...status.reasons];
      if (!status.unitCount) reasons.push("编队中没有成员");
      const legal = reasons.length === 0;
      const matches = formation.capacity <= rule.capacity;
      const group = matches && legal ? 0 : matches ? 1 : 2;
      return { formation, status: { ...status, valid: legal, reasons }, matches, group, order };
    }).sort((a, b) => a.group - b.group || Math.abs(rule.capacity - a.formation.capacity) - Math.abs(rule.capacity - b.formation.capacity) || a.order - b.order);
  }

  function formationDeployment(formation, foodSupplied) {
    const deployment = { formationId: formation.id, capacity: formation.capacity, memberIds: [...formation.members], positions: [...formation.positions] };
    if (foodSupplied !== undefined && foodSupplied !== null) deployment.foodSupplied = Math.max(0, Math.floor(Number(foodSupplied) || 0));
    return deployment;
  }

  function orderedFormationMembers(entry) {
    const byId = new Map(entry.status.members.map((member) => [member.id, member]));
    const ordered = entry.formation.positions.map((id, slotIndex) => ({ member: byId.get(id), slotIndex })).filter((row) => row.member);
    const used = new Set(ordered.map((row) => row.member.id));
    for (const member of entry.status.members) if (!used.has(member.id)) ordered.push({ member, slotIndex: ordered.length });
    return ordered;
  }

  function renderCombatFormationPreview() {
    if (!pendingPreview?.basePlan) return;
    const current = view();
    const basePlan = pendingPreview.basePlan;
    const rule = combatFormationRule(basePlan);
    const entries = combatFormationEntries(current, basePlan);
    let selected = entries.find((entry) => entry.formation.id === pendingPreview.selectedFormationId) || entries[0] || null;
    pendingPreview.selectedFormationId = selected?.formation.id || null;
    const groupLabels = ["容量兼容且合法", "容量兼容但不合法", "超过人数上限"];
    let previousGroup = -1;
    const formationRows = entries.map((entry) => {
      const heading = entry.group !== previousGroup ? `<p class="preview-formation-group group-${entry.group}">${groupLabels[entry.group]}</p>` : "";
      previousGroup = entry.group;
      const stateLabel = entry.group === 0 ? "可出战" : entry.group === 1 ? "不合法" : `${entry.formation.capacity}单位`;
      return `${heading}<button type="button" class="preview-formation-row group-${entry.group} ${entry.formation.id === selected?.formation.id ? "selected" : ""}" data-preview-formation="${esc(entry.formation.id)}"><i>${entry.status.unitCount}/${entry.formation.capacity}</i><span><strong>${esc(entry.formation.name)}</strong><small>${esc(entry.status.cityLabel)} · 粮${entry.status.foodCost}/战</small></span><em>${esc(stateLabel)}</em></button>`;
    }).join("");
    document.querySelector("#preview-formations").innerHTML = formationRows || `<div class="preview-formation-empty">尚未建立任何编队</div>`;
    document.querySelector("#preview-battle-rule").innerHTML = `<span>战斗类型 <b>${esc(rule.label)}</b></span><span>参战上限 <b>${rule.capacity}单位</b></span>${rule.fixedNote ? `<span class="fixed"><b>固定成员</b> ${esc(rule.fixedNote)}</span>` : ""}`;
    let selectedPlan = null;
    let blockedReason = "没有可用编队";
    if (selected) {
      if (!selected.matches) blockedReason = `本场最多允许${rule.capacity}单位编队；当前编队上限为${selected.formation.capacity}单位`;
      else if (!selected.status.valid) blockedReason = selected.status.reasons.join("；");
      else {
        selectedPlan = GAME.preparePlayerCombat(state, basePlan.publicActionId, formationDeployment(selected.formation));
        if (!selectedPlan) blockedReason = "当前资源不足，或编队成员已经无法参加这场战斗";
      }
    }
    pendingPreview.plan = selectedPlan;
    const shownPlan = selectedPlan || basePlan;
    document.querySelector("#preview-supply").innerHTML = `<span>行动 <b>${["hunt", "final"].includes(basePlan.kind) ? 0 : 1}</b></span><span>满额粮食 <b>${selectedPlan ? Number(selectedPlan.fullFood || 0) : "—"}</b></span><span>我方 <b>${selectedPlan ? selectedPlan.leftTeam.length : "—"}单位</b></span><span>敌方已知 <b>${basePlan.rightTeam.length}单位</b></span>`;
    const next = document.querySelector("#preview-to-supply");
    next.disabled = !selectedPlan;
    next.classList.toggle("blocked", !selectedPlan);
    next.textContent = selectedPlan ? "开战" : "当前编队无法出战";
    next.title = selectedPlan ? `使用${selected.formation.name}进入战前准备` : blockedReason;
    if (!selected) {
      document.querySelector("#preview-teams").innerHTML = `<div class="preview-formation-empty">没有编队可供查看</div>`;
    } else {
      const members = orderedFormationMembers(selected).map(({ member, slotIndex }) => `<li><i>${slotIndex + 1}</i><span class="preview-member-role" aria-hidden="true">${esc(member.roleIcon)}</span><span><strong>${esc(member.name)}</strong><small>${esc(member.profession)} · ${esc(member.city)}</small></span><b>${formatCombatPower(member.combatPower)}</b></li>`).join("");
      const enemies = shownPlan.rightTeam.map((unit) => `<li><span><strong>${esc(unit.name)}</strong><small>${esc(unit.roleName || unit.role || unit.unitKind || "战斗成员")}</small></span></li>`).join("");
      const stateClass = selectedPlan ? "ready" : "blocked";
      const stateText = selectedPlan ? `不超过${rule.capacity}单位参战上限，可以出战` : blockedReason;
      document.querySelector("#preview-teams").innerHTML = `<header class="preview-selected-head ${stateClass}"><div><span class="eyebrow">当前选择</span><h3>${esc(selected.formation.name)}</h3><p>${esc(stateText)}</p></div><strong>${selected.status.unitCount}/${selected.formation.capacity}</strong></header><div class="preview-formation-metrics"><span>状态<b>${selectedPlan ? "可出战" : "不可出战"}</b></span><span>驻地<b>${esc(selected.status.cityLabel)}</b></span><span>一战粮耗<b>${selectedPlan ? Number(selectedPlan.fullFood || 0) : selected.status.foodCost}</b></span><span>总战斗力<b>${formatCombatPower(selected.status.members.reduce((sum, member) => sum + member.combatPower, 0))}</b></span></div><div class="preview-lineup-columns"><section><h4>编队成员 · ${selected.status.members.length}</h4><ul>${members || `<li class="empty">尚未编入成员</li>`}</ul>${rule.fixedNote ? `<p class="preview-fixed-note">＋ ${esc(rule.fixedNote)}</p>` : ""}</section><section><h4>敌方情报 · ${shownPlan.rightTeam.length}</h4><ul>${enemies}</ul></section></div>`;
    }
    document.querySelectorAll("[data-preview-formation]").forEach((button) => button.addEventListener("click", () => {
      pendingPreview.selectedFormationId = button.dataset.previewFormation;
      formationState.selectedId = button.dataset.previewFormation;
      saveFormationState();
      renderCombatFormationPreview();
    }));
  }

  function stopSupplyHold() {
    clearTimeout(supplyHoldDelay);
    clearInterval(supplyHoldInterval);
    supplyHoldDelay = null;
    supplyHoldInterval = null;
  }

  function selectedPreviewFormation() {
    if (!pendingPreview?.basePlan) return null;
    return combatFormationEntries(view(), pendingPreview.basePlan).find((entry) => entry.formation.id === pendingPreview.selectedFormationId) || null;
  }

  function renderCombatSupplyStage() {
    const selected = selectedPreviewFormation();
    if (!pendingPreview || !selected?.matches || !selected.status.valid) return;
    const current = view();
    const probe = GAME.preparePlayerCombat(state, pendingPreview.basePlan.publicActionId, formationDeployment(selected.formation, current.resources.food));
    const fullFood = Math.max(0, Number(probe?.fullFood || 0));
    const maxFood = Math.min(fullFood, Math.max(0, Number(current.resources.food || 0)));
    pendingPreview.foodSupplied = Math.max(0, Math.min(maxFood, Math.floor(Number(pendingPreview.foodSupplied) || 0)));
    const plan = GAME.preparePlayerCombat(state, pendingPreview.basePlan.publicActionId, formationDeployment(selected.formation, pendingPreview.foodSupplied));
    pendingPreview.plan = plan;
    const supplied = Number(plan?.foodCommitted || 0);
    const performance = Number(plan?.performancePct || 100);
    const fillPct = fullFood > 0 ? Math.round(supplied / fullFood * 100) : 100;
    document.querySelector("#preview-supply-title").textContent = `${pendingPreview.basePlan.title} · 军粮准备`;
    document.querySelector("#preview-supply-formation").innerHTML = `<span>出战编队 <b>${esc(selected.formation.name)}</b></span><span>${selected.status.unitCount}/${selected.formation.capacity}单位</span><span>库存 <b>${current.resources.food}粮</b></span>`;
    document.querySelector("#preview-supply-fraction").textContent = `${supplied}/${fullFood}`;
    document.querySelector("#preview-supply-percent").textContent = `${performance}%`;
    document.querySelector("#preview-supply-percent").classList.toggle("full", performance >= 100);
    document.querySelector("#preview-supply-fill").style.setProperty("--supply-fill", `${fillPct}%`);
    const pot = document.querySelector("#preview-supply-pot");
    pot.disabled = !plan || fullFood <= 0 || supplied >= maxFood;
    pot.classList.toggle("empty-stock", fullFood > 0 && maxFood <= 0);
    pot.querySelector("strong").textContent = fullFood <= 0 ? "无需军粮" : supplied >= maxFood ? (maxFood < fullFood ? "粮仓已空" : "已经投满") : "＋1";
    document.querySelector("#preview-supply-note").textContent = fullFood <= 0 ? "这支队伍没有士兵，本场无需投入军粮。" : maxFood < fullFood ? `粮仓最多只能投入${maxFood}/${fullFood}；当前部队按${performance}%发挥。` : `0粮时按20%发挥；每投入1粮都会直接提高这场战斗的生命、攻击与护甲。`;
    const confirm = document.querySelector("#preview-confirm");
    confirm.disabled = !plan;
    confirm.textContent = plan ? `以${performance}%发挥出发` : "当前无法出发";
  }

  function openCombatSupplyStage() {
    if (!pendingPreview?.plan) return;
    pendingPreview.stage = "supply";
    pendingPreview.foodSupplied = 0;
    document.querySelector("#preview-slide-track").classList.add("supplying");
    renderCombatSupplyStage();
  }

  function addPreviewFood(amount = 1) {
    if (pendingPreview?.stage !== "supply") return;
    pendingPreview.foodSupplied = Math.max(0, Number(pendingPreview.foodSupplied || 0) + amount);
    renderCombatSupplyStage();
  }

  function startCombat(plan) {
    pendingCombat = plan;
    pendingCombatResult = null;
    mode = "combat";
    render();
    const mount = document.querySelector("#battle-mount");
    mount.innerHTML = `<div class="empty-actions">战场展开中……</div>`;
    requestAnimationFrame(() => {
      try {
        if (!window.GAME_BATTLE_VIEW?.mount) throw new Error("共享战斗视图没有加载");
        battleView?.destroy?.();
        battleView = window.GAME_BATTLE_VIEW.mount({ container: mount, maxTime: plan.maxTime || 150, speed: plan.mock ? 3 : 2.5, camera: false, gameTime: false, postProcessing: false, onFinish: finishCombat });
        battleView.start({ leftTeam: structuredClone(plan.leftTeam), rightTeam: structuredClone(plan.rightTeam), seed: plan.seed, title: plan.title, randomizeStats: false });
      } catch (error) {
        battleView?.destroy?.(); battleView = null; pendingCombat = null; mode = "campaign"; render(); showToast(`战斗无法启动：${error.message || String(error)}`);
      }
    });
  }

  function finishCombat(result) {
    pendingCombatResult = result;
    const win = result?.metrics?.leftAlive > 0 && result?.metrics?.rightAlive === 0;
    const fallen = result.units.filter((unit) => unit.side === "left" && Number(unit.hp || 0) <= 0).map((unit) => unit.name);
    const top = result.units.filter((unit) => unit.side === "left").sort((a, b) => Number(b.damageDone || 0) - Number(a.damageDone || 0)).slice(0, 3);
    const box = document.querySelector("#combat-result");
    box.hidden = false;
    box.classList.toggle("loss", !win && !pendingCombat.mock);
    const setSignals = pendingCombat.mock ? { plant: 0, grow: 0, bloom: 0, spread: 0 } : null;
    if (setSignals) for (const signal of (result.signals || []).filter((row) => row.kind === "status")) {
      if (signal.tags?.includes("seedPlant")) setSignals.plant += 1;
      if (signal.tags?.includes("seedGrow")) setSignals.grow += 1;
      if (signal.tags?.includes("seedBloom")) setSignals.bloom += 1;
      if (signal.tags?.includes("seedSpread")) setSignals.spread += 1;
    }
    let comparisonHtml = "";
    if (pendingCombat.mock) {
      const variant = pendingCombat.mockVariant || "set";
      const adaptedUnit = (result.units || []).find((unit) => unit.name === "自然术士·盐枝");
      const adaptedDps = Number(adaptedUnit?.damageDone || 0) / Math.max(0.01, Number(result.duration || 0));
      mockResults[variant] = { damage: Math.round(result.metrics.leftDamage || 0), healing: Math.round(result.metrics.leftHealing || 0), defeated: pendingCombat.rightTeam.length - result.metrics.rightAlive, duration: Number(result.duration || 0), adaptedDps };
      if (mockResults.baseline && mockResults.set) {
        const delta = { damage: mockResults.set.damage - mockResults.baseline.damage, healing: mockResults.set.healing - mockResults.baseline.healing, defeated: mockResults.set.defeated - mockResults.baseline.defeated, duration: mockResults.set.duration - mockResults.baseline.duration, adaptedDpsMultiplier: mockResults.set.adaptedDps / Math.max(0.01, mockResults.baseline.adaptedDps) };
        comparisonHtml = `<p class="mock-comparison"><strong>六件套相对无套装</strong><span>盐枝输出速度 ×${delta.adaptedDpsMultiplier.toFixed(2)}</span><span>伤害 ${delta.damage >= 0 ? "+" : ""}${delta.damage}</span><span>治疗 ${delta.healing >= 0 ? "+" : ""}${delta.healing}</span><span>击倒 ${delta.defeated >= 0 ? "+" : ""}${delta.defeated}</span><span>用时 ${delta.duration >= 0 ? "+" : ""}${delta.duration.toFixed(1)}s</span></p>`;
      }
    }
    const combatMetrics = `<div class="combat-result-metrics"><span>总伤害<b>${Math.round(result.metrics.leftDamage || 0)}</b></span><span>总治疗<b>${Math.round(result.metrics.leftHealing || 0)}</b></span><span>击倒<b>${pendingCombat.rightTeam.length - result.metrics.rightAlive}/${pendingCombat.rightTeam.length}</b></span><span>用时<b>${Number(result.duration || 0).toFixed(1)}s</b></span></div>`;
    const metrics = setSignals
      ? `${combatMetrics}${pendingCombat.mockVariant === "set" ? `<div class="combat-result-metrics set-metrics"><span>播种<b>${setSignals.plant}</b></span><span>生长<b>${setSignals.grow}</b></span><span>绽放<b>${setSignals.bloom}</b></span><span>传播<b>${setSignals.spread}</b></span></div>` : ""}`
      : `<div class="combat-result-metrics"><span>我方存活<b>${result.metrics.leftAlive}/${pendingCombat.leftTeam.length}</b></span><span>敌方存活<b>${result.metrics.rightAlive}/${pendingCombat.rightTeam.length}</b></span><span>伤害<b>${Math.round(result.metrics.leftDamage || 0)}</b></span><span>用时<b>${Number(result.duration || 0).toFixed(1)}s</b></span></div>`;
    box.innerHTML = `<h3>${pendingCombat.mock ? pendingCombat.mockVariant === "baseline" ? "无套装对照结束" : "六件套演武结束" : win ? "我方获胜" : "我方失利"}</h3>${metrics}${comparisonHtml}<p>${fallen.length ? `倒下：${esc(fallen.join("、"))}<br>` : ""}主要输出：${top.map((unit) => `${esc(unit.name)} ${Math.round(unit.damageDone || 0)}`).join(" · ") || "暂无"}${pendingCombat.mock ? `<br><strong>${mockResults.baseline && mockResults.set ? "已完成同条件对比。" : "返回演武场再运行另一组，即可显示同条件差值。"}</strong>` : win ? "" : "<br><strong>失败不消耗行动力或粮食，可以立即重试。</strong>"}</p><button id="commit-combat" class="button ${win || pendingCombat.mock ? "primary" : "danger"}">${pendingCombat.mock ? "返回演武场" : win ? "查看战后变化" : "返回地图并重试"}</button>`;
    document.querySelector("#commit-combat").addEventListener("click", commitCombat);
  }

  function commitCombat() {
    if (!pendingCombat || !pendingCombatResult) return;
    if (pendingCombat.mock) {
      battleView?.destroy?.(); battleView = null; pendingCombat = null; pendingCombatResult = null; mode = "campaign"; selectedNodeId = "mock:verdant-circle"; render();
      return;
    }
    try {
      const before = view();
      const beforeRaids = new Set(before.raids.map((raid) => raid.title));
      const beforeOutposts = new Set(before.outposts.map((outpost) => outpost.id));
      const plan = pendingCombat;
      state = GAME.applyPlayerCombatResult(state, plan.publicActionId, pendingCombatResult, plan.deployment);
      saveState();
      battleView?.destroy?.(); battleView = null; pendingCombat = null; pendingCombatResult = null; mode = "campaign";
      const after = view();
      const unlocked = after.raids.filter((raid) => !beforeRaids.has(raid.title));
      const captured = after.outposts.filter((outpost) => !beforeOutposts.has(outpost.id));
      for (const raid of unlocked) newlyUnlocked.add(`raid:${raid.id}`);
      for (const outpost of captured) newlyUnlocked.add(`outpost:${outpost.id}`);
      const lines = recentAdded(before, after).slice(0, 5).map((row) => row.text);
      if (unlocked.length) lines.push(`新情报：${unlocked.map((raid) => raid.title).join("、")}已经标在地图上。`);
      if (captured.length) lines.push(`新领地：${captured.map((outpost) => outpost.title).join("、")}已经变成可建设前哨。`);
      ensureSelections(after);
      render();
      showResult(plan.title, lines);
    } catch (error) {
      showToast(error.message || String(error));
    }
  }

  function startGrind(plan) {
    grindSession = { rounds: 0, wins: 0, loot: [], auto: true, fighting: false, timer: null, plan: null, deployment: plan.deployment, lastWin: null };
    mode = "grind";
    render();
    requestAnimationFrame(() => startGrindRound(plan));
  }

  function currentGrindPlan() {
    const action = view().actions.find((row) => row.kind === "grind");
    return action ? GAME.preparePlayerCombat(state, action.id, grindSession?.deployment || null) : null;
  }

  function startGrindRound(plan = currentGrindPlan()) {
    if (!grindSession || mode !== "grind" || !grindSession.auto || !plan) return;
    grindSession.plan = plan;
    grindSession.fighting = true;
    renderGrindHud();
    const mount = document.querySelector("#grind-battle-mount");
    mount.innerHTML = `<div class="empty-actions">第${grindSession.rounds + 1}轮敌群正在靠近……</div>`;
    requestAnimationFrame(() => {
      try {
        battleView?.destroy?.();
        battleView = window.GAME_BATTLE_VIEW.mount({ container: mount, maxTime: plan.maxTime || 80, speed: 2.35, camera: false, gameTime: false, postProcessing: false, onFinish: finishGrindRound });
        battleView.start({ leftTeam: structuredClone(plan.leftTeam), rightTeam: structuredClone(plan.rightTeam), seed: plan.seed, title: `${plan.title} · 第${grindSession.rounds + 1}轮`, randomizeStats: false });
      } catch (error) {
        grindSession.fighting = false; grindSession.auto = false; renderGrindHud(); showToast(error.message || String(error));
      }
    });
  }

  function finishGrindRound(result) {
    if (!grindSession?.plan) return;
    try {
      const beforeIds = new Set(state.inventory.map((item) => item.id));
      state = GAME.applyPlayerCombatResult(state, grindSession.plan.publicActionId, result, grindSession.plan.deployment);
      const added = state.inventory.filter((item) => !beforeIds.has(item.id));
      grindSession.rounds += 1;
      grindSession.lastWin = result.metrics.leftAlive > 0 && result.metrics.rightAlive === 0;
      if (grindSession.lastWin) grindSession.wins += 1;
      grindSession.loot.push(...added);
      grindSession.loot = sortItems(grindSession.loot).slice(0, 200);
      grindSession.fighting = false;
      saveState();
      renderHeader(view());
      renderGrindHud();
      if (grindSession.auto) grindSession.timer = setTimeout(() => startGrindRound(), 800);
    } catch (error) {
      grindSession.fighting = false; grindSession.auto = false; renderGrindHud(); showToast(error.message || String(error));
    }
  }

  function stopGrind() {
    if (!grindSession) return;
    grindSession.auto = false;
    clearTimeout(grindSession.timer);
    if (!grindSession.fighting) leaveGrind();
    else renderGrindHud();
  }

  function leaveGrind() {
    battleView?.destroy?.(); battleView = null; grindSession = null; mode = "campaign"; ensureSelections(view()); render();
  }

  function renderGrindHud() {
    if (!grindSession || mode !== "grind") return;
    const current = view();
    const level = current.grind.levels.find((row) => row.difficulty === current.grind.selectedDifficulty);
    document.querySelector("#grind-title").textContent = grindSession.plan?.title || "边林讨伐";
    const scoreProgress = current.grind.nextUnlockScore ? `${current.grind.unlockScore}/${current.grind.nextUnlockScore}` : `${current.grind.unlockScore}`;
    document.querySelector("#grind-stats").innerHTML = `<span>难度 <b>${current.grind.selectedDifficulty}</b></span><span>讨伐积分 <b>${scoreProgress}</b></span><span>总胜场 <b>${current.grind.totalWins}</b></span><span>轮次 <b>${grindSession.rounds + (grindSession.fighting ? 1 : 0)}</b></span><span>本次掉落 <b>${grindSession.loot.length}</b></span><span>今日装备 <b>${current.economy.dailyGearDrops}/20</b></span><span>铁匠收入 <b>${current.economy.smithGoldPaid}</b></span>`;
    const unlockText = current.grind.nextUnlockScore ? ` · 当前难度每胜+${current.grind.selectedWinScore}积分；${current.grind.unlockScore}/${current.grind.nextUnlockScore}解锁难度${current.grind.nextUnlockDifficulty}` : " · 已解锁全部难度";
    document.querySelector("#grind-status").textContent = (grindSession.fighting ? "当前轮战斗中" : grindSession.lastWin === false ? (grindSession.auto ? "本轮战败，没有掉落；下一批敌人正在接近" : "本轮战败，没有掉落") : grindSession.auto ? "下一批敌人正在接近" : "连续讨伐已经停止") + unlockText;
    document.querySelector("#grind-loot-count").textContent = `${grindSession.loot.length}件`;
    document.querySelector("#grind-loot-shelf").innerHTML = grindSession.loot.length ? grindSession.loot.map((item) => `<div class="loot-cell rarity-${esc(item.rarity)}"><i>${SLOT_ICONS[item.slotLabel] || "◆"}</i><b>+${item.power}</b><small>${esc(item.rarity)}${esc(item.slotLabel)}</small></div>`).join("") : `<div class="empty-actions">战胜敌人后，掉落会陈列在这里。</div>`;
    const stop = document.querySelector("#stop-grind");
    stop.textContent = grindSession.auto ? "本轮后停止" : grindSession.fighting ? "等待本轮结束" : "返回地图";
    document.querySelector("#grind-actions").innerHTML = !grindSession.fighting && !grindSession.auto ? `<button class="mini-button" data-grind-retry>再刷一轮</button><button class="mini-button" data-grind-leave>返回地图</button>` : "";
    document.querySelector("[data-grind-retry]")?.addEventListener("click", () => { grindSession.auto = true; startGrindRound(); });
    document.querySelector("[data-grind-leave]")?.addEventListener("click", leaveGrind);
  }

  function buildLocations(current) {
    const rows = [];
    const storyActions = current.actions.filter((action) => ["story", "decision", "event"].includes(action.kind));
    rows.push({ id: "command", title: current.story?.title || current.event?.title || "伊莎贝拉的议事帐", kicker: current.story ? "当前剧情" : current.event ? "今日事件" : "村庄中枢", description: current.story?.text || current.event?.scene || "女骑士伊莎贝拉在这里整理敌情与村庄名册。", status: current.event ? "一个需要当日决定的问题" : `第${current.time.day}日 · 距总攻还有${Math.max(0, current.time.finalDay - current.time.day)}日`, actions: storyActions, x: 700, y: 400, sigil: current.story ? "章" : current.event ? "!" : "帐", type: storyActions.length ? "event" : "command" });

    for (const building of current.buildings.filter((row) => row.site === "village")) {
      const local = current.actions.filter((action) => action.targetSlot === building.slot);
      if (building.type === "conscription") local.push(...current.actions.filter((action) => action.kind === "recruit"));
      if (building.type === "market") local.push(...current.actions.filter((action) => action.kind === "market" && action.targetStockId));
      rows.push({ id: `plot:${building.slot}`, title: building.name, kicker: building.type ? "灰谷村基础设施" : "村庄空建设位", description: building.description, status: building.yieldStatus, yieldLabel: building.yieldLabel, emptyText: building.type && !["market", "conscription"].includes(building.type) ? "这是自动产生持久收益的建筑，无需额外操作。" : "这里暂时没有可执行行动。", actions: [...new Map(local.map((action) => [action.id, action])).values()], x: PLOT_POSITIONS[building.slot][0], y: PLOT_POSITIONS[building.slot][1], sigil: building.type ? BUILDING_SIGILS[building.type] || "筑" : "+", type: building.type ? "building" : "empty" });
    }

    const grindBattles = current.actions.filter((action) => action.kind === "grind");
    const grindSettings = current.actions.filter((action) => action.kind === "grind_setting");
    const visibleGrind = grindBattles.length ? [...grindSettings, ...grindBattles] : [{ id: "ui:grind-unavailable", label: "前往边林免费讨伐魔物", kind: "grind", available: false, disabledReason: current.result ? "本轮战争已经结束；重开后可以再次刷装。" : "当前阶段暂时无法离开这里刷装。", actionPointCost: 0, knownCost: {}, description: "刷怪地点始终保留在地图上。" }];
    const grindLocked = grindBattles.length === 0 || grindBattles.every((action) => action.available === false);
    const selectedGrind = current.grind.levels.find((row) => row.selected);
    rows.push({ id: "grind", title: "边林讨伐", kicker: "五档无限刷装", description: "难度N获胜一次增加N点讨伐积分；累计5/20/90/200积分依次解锁新难度。解锁后不会自动切换。", status: grindLocked ? "地点已知 · 暂时不能出发" : `讨伐积分${current.grind.unlockScore} · 总胜场${current.grind.totalWins} · 当前难度${selectedGrind.difficulty}「${selectedGrind.name}」`, actions: visibleGrind, grind: current.grind, x: 1190, y: 275, sigil: "猎", type: grindLocked ? "grind locked" : "grind" });

    rows.push({ id: "mock:verdant-circle", title: "繁生之环演武场", kicker: "同条件 A/B 测试", description: "两场使用完全相同的角色、自然技能、敌人和随机种子；唯一差别是是否穿着繁生之环六件套。建议先跑无套装，再跑六件套。", status: mockResults.baseline && mockResults.set ? "两组已完成 · 战后可查看差值" : "不消耗行动力或粮食 · 不改变存档", yieldLabel: "A/B", actions: [{ id: "mock:verdant-circle:baseline", label: "A · 无套装对照", kind: "mock_battle", mockVariant: "baseline", available: true, actionPointCost: 0, knownCost: {}, description: "自然技能照常施放，但没有播种、绽放与传播。" }, { id: "mock:verdant-circle:set", label: "B · 繁生之环六件套", kind: "mock_battle", mockVariant: "set", available: true, actionPointCost: 0, knownCost: {}, description: "除套装外与A组完全相同；战后显示相对差值。" }], x: 1060, y: 760, sigil: "芽", type: "mock" });

    current.raids.forEach((raid) => {
      const raidActions = current.actions.filter((action) => action.kind === "combat" && action.label.includes(raid.title));
      const position = RAID_POSITIONS[raid.id];
      rows.push({ id: `raid:${raid.id}`, title: raid.title, kicker: "已侦察敌方据点", description: raid.description, status: raid.visibleEffectOnVictory, yieldLabel: "占领：+1建设位", actions: raidActions, x: position[0], y: position[1], sigil: "敌", type: "raid" });
    });

    current.outposts.forEach((outpost) => {
      const building = current.buildings.find((row) => row.slot === outpost.plotSlot);
      if (!building) return;
      const position = RAID_POSITIONS[outpost.id];
      const local = current.actions.filter((action) => action.targetSlot === building.slot);
      rows.push({ id: `outpost:${outpost.id}`, title: building.type ? `${outpost.title} · ${building.name}` : outpost.title, kicker: "已控制前哨", description: building.type ? building.description : outpost.description, status: building.yieldStatus, yieldLabel: building.yieldLabel, emptyText: building.type ? "这是自动产生持久收益的建筑，无需额外操作。" : "选择一种建筑，把占领转化为长期产能。", actions: local, x: position[0], y: position[1], sigil: building.type ? BUILDING_SIGILS[building.type] || "旗" : "+", type: building.type ? "outpost building" : "outpost empty" });
    });

    if (current.challenge) {
      const challengeActions = current.actions.filter((action) => action.targetChallengeId === current.challenge.id);
      rows.push({ id: `challenge:${current.challenge.id}`, title: current.challenge.title, kicker: current.challenge.kicker, description: current.challenge.description, status: current.challenge.status, yieldLabel: current.challenge.completed ? "剧情完成" : "高危挑战", emptyText: current.challenge.completed ? "两名幸存者已经回到灰谷村。" : "当前阶段无法继续探索。", actions: challengeActions, x: CHALLENGE_POSITION[0], y: CHALLENGE_POSITION[1], sigil: current.challenge.completed ? "归" : "遗", type: current.challenge.completed ? "challenge completed" : "challenge" });
    }

    if (current.time.phase === "final") rows.push({ id: "final", title: "灰谷村北门", kicker: "最终决战", description: `${current.war.knownEnemyUnits}支兽人军团与${current.war.knownBosses}名主将已经抵达。`, status: `${current.party.heroes.length}名英雄、${current.war.trainedUnits}支战士与${current.war.untrainedUnits}支民兵等待军粮。`, actions: current.actions.filter((action) => action.kind === "combat" || action.operation === "auto_equip_all"), x: 700, y: 115, sigil: "战", type: "final" });
    return rows;
  }

  function renderHeader(current) {
    document.querySelector("#day-rail").innerHTML = Array.from({ length: 7 }, (_, index) => { const day = index + 1; const cls = day < current.time.day || current.result ? "past" : day === current.time.day ? "current" : ""; return `<span class="day-tick ${cls} ${day === 7 ? "final" : ""}"><b>${day}</b>${day === 7 ? "总攻" : "日"}</span>`; }).join("");
    document.querySelector("#gold-value").textContent = current.resources.gold;
    document.querySelector("#food-value").textContent = current.resources.food;
    const town = current.town;
    document.querySelector("#town-name").textContent = town.name;
    document.querySelector("#town-prosperity").textContent = `繁荣 Lv.${town.prosperity.level}`;
    document.querySelector("#population-value").textContent = `${town.population}/${town.populationCap}`;
    document.querySelector("#ap-value").textContent = town.actionsRemaining;
    document.querySelector("#ap-capacity").textContent = town.actionCapacity;
    document.querySelector("#town-prosperity-fill").style.width = `${Math.round(town.prosperity.levelProgress * 100)}%`;
    document.querySelector("#enemy-units").textContent = current.war.knownEnemyUnits;
    document.querySelector("#enemy-bosses").textContent = current.war.knownBosses;
    document.querySelector("#militia-units").textContent = current.war.untrainedUnits;
    document.querySelector("#trained-units").textContent = current.war.trainedUnits;
    document.querySelector("#war-rule").textContent = current.war.publicRule;
    document.querySelector("#final-rules").textContent = `${current.war.finalMorningRule} ${current.party.finalBattleRule}`;
    const end = current.actions.find((action) => action.kind === "time");
    const button = document.querySelector("#end-day-button");
    button.disabled = !end || mode !== "campaign";
    button.dataset.actionId = end?.id || "";
    button.textContent = current.time.phase === "final" ? "决战已经开始" : end ? "结束本日" : "先处理当前剧情";
    document.querySelector("#inventory-count").textContent = current.inventory.length;
  }

  function clearProsperityGrowthAnimation() {
    if (prosperityGrowthFrame != null) cancelAnimationFrame(prosperityGrowthFrame);
    prosperityGrowthFrame = null;
    prosperityGrowthTimers.forEach((timer) => clearTimeout(timer));
    prosperityGrowthTimers = [];
  }

  function renderProsperitySummary(town) {
    const prosperity = town.prosperity;
    document.querySelector("#prosperity-population").textContent = `${town.population}/${town.populationCap}`;
    document.querySelector("#prosperity-current-level").textContent = `Lv.${prosperity.level} ${prosperity.name}`;
    document.querySelector("#prosperity-actions").textContent = `${town.actionsRemaining}/${town.actionCapacity}`;
    document.querySelector("#prosperity-next").textContent = prosperity.nextLevel
      ? `距离 Lv.${prosperity.nextLevel.level}「${prosperity.nextLevel.name}」还差${Math.max(0, prosperity.nextLevel.population - town.population)}人口；达到后每日行动上限${prosperity.actionCapacity}→${prosperity.nextLevel.actionCapacity}。`
      : `已达到当前章节最高繁荣等级；人口仍受房屋上限约束。`;
  }

  function setProsperityLivePopulation(population, populationCap) {
    const marker = document.querySelector("#prosperity-live-marker");
    if (!marker) return;
    const nodes = [...document.querySelectorAll("#prosperity-track [data-prosperity-population]")];
    const rows = nodes.map((node) => ({ node, population: Number(node.dataset.prosperityPopulation), center: node.offsetLeft + node.offsetWidth / 2 }));
    const lower = [...rows].reverse().find((row) => row.population <= population) || rows[0];
    const upper = rows.find((row) => row.population >= population) || rows.at(-1);
    const ratio = upper && lower && upper.population !== lower.population ? (population - lower.population) / (upper.population - lower.population) : 0;
    marker.style.left = `${Math.round((lower?.center || 104) + ((upper?.center || lower?.center || 104) - (lower?.center || 104)) * ratio)}px`;
    marker.querySelector("strong").textContent = `${Math.round(population)}/${populationCap}`;
    document.querySelector("#prosperity-population").textContent = `${Math.round(population)}/${populationCap}`;
  }

  function renderProsperityDialog(current, options = {}) {
    const town = current.town;
    const prosperity = town.prosperity;
    const displayTown = options.displayTown || town;
    const displayPopulation = Number.isFinite(options.population) ? options.population : displayTown.population;
    const reached = prosperity.milestones.filter((row) => row.population <= displayPopulation);
    const currentMilestonePopulation = reached.length ? reached.at(-1).population : 0;
    document.querySelector("#prosperity-title").textContent = `${town.name}发展轨迹`;
    renderProsperitySummary(displayTown);
    document.querySelector("#prosperity-track").innerHTML = `<div id="prosperity-live-marker" class="prosperity-live-marker"><strong>${displayPopulation}/${town.populationCap}</strong></div>${prosperity.milestones.map((milestone) => {
      const isCurrent = milestone.population === currentMilestonePopulation;
      const isPopulationCap = milestone.population === town.populationCap;
      const beyondCap = milestone.population > town.populationCap;
      const isReached = milestone.population <= displayPopulation;
      const actionReward = milestone.population === 0 ? `每日行动 ${milestone.actionCapacity}` : milestone.prosperityLevel ? "行动力 +1" : "";
      const unitReward = milestone.unitReward ? "+1 民兵单位" : "";
      const levelLabel = milestone.prosperityLevel ? `Lv.${milestone.prosperityLevel} ${milestone.prosperityName}` : "";
      const stateText = isCurrent ? "当前人口阶段" : beyondCap ? "需要提高人口上限" : "";
      return `<div class="prosperity-milestone ${isReached ? "reached" : "future"} ${isCurrent ? "current" : ""} ${isPopulationCap ? "population-cap" : ""} ${beyondCap ? "beyond-cap" : ""}" data-prosperity-population="${milestone.population}" data-prosperity-level="${milestone.prosperityLevel || ""}" data-prosperity-name="${esc(milestone.prosperityName || "")}" data-action-capacity="${milestone.actionCapacity || ""}">${isPopulationCap ? `<span class="prosperity-cap-gate">人口上限</span>` : ""}<div class="prosperity-axis-population"><strong>${milestone.population}</strong><small>人口</small></div><i class="prosperity-axis-dot" aria-hidden="true"></i><div class="prosperity-axis-rewards">${actionReward ? `<strong>${esc(actionReward)}</strong>` : ""}${unitReward ? `<em>${esc(unitReward)}</em>` : ""}${levelLabel ? `<span>${esc(levelLabel)}</span>` : ""}${stateText ? `<small>${esc(stateText)}</small>` : ""}</div></div>`;
    }).join("")}`;
    requestAnimationFrame(() => setProsperityLivePopulation(displayPopulation, town.populationCap));
  }

  function openProsperityDialog() {
    clearProsperityGrowthAnimation();
    const current = view();
    const dialog = document.querySelector("#prosperity-dialog");
    dialog.classList.remove("growth-mode");
    document.querySelector("#prosperity-growth-caption").hidden = true;
    document.querySelector("#prosperity-level-burst").hidden = true;
    document.querySelector("#prosperity-growth-return").hidden = true;
    renderProsperityDialog(current);
    if (dialog.open) dialog.close();
    dialog.showModal();
    requestAnimationFrame(() => {
      const viewport = document.querySelector("#prosperity-viewport");
      const marker = viewport.querySelector(".prosperity-milestone.current");
      if (marker) viewport.scrollLeft = Math.max(0, marker.offsetLeft - viewport.clientWidth * .3);
    });
  }

  function showPopulationGrowth(before, after) {
    clearProsperityGrowthAnimation();
    const dialog = document.querySelector("#prosperity-dialog");
    const beforeTown = before.town;
    const afterTown = after.town;
    const startPopulation = beforeTown.population;
    const endPopulation = afterTown.population;
    const gained = Math.max(0, endPopulation - startPopulation);
    dialog.classList.add("growth-mode");
    const caption = document.querySelector("#prosperity-growth-caption");
    caption.hidden = false;
    caption.textContent = `征召完成 · 人口 ${startPopulation} → ${endPopulation}（+${gained}）`;
    document.querySelector("#prosperity-level-burst").hidden = true;
    document.querySelector("#prosperity-growth-return").hidden = true;
    renderProsperityDialog(after, { displayTown: beforeTown, population: startPopulation });
    document.querySelector("#prosperity-title").textContent = `${afterTown.name}人口增长`;
    if (dialog.open) dialog.close();
    dialog.showModal();
    requestAnimationFrame(() => {
      const viewport = document.querySelector("#prosperity-viewport");
      const startNode = viewport.querySelector(`.prosperity-milestone[data-prosperity-population="${Math.floor(startPopulation / 10) * 10}"]`);
      if (startNode) viewport.scrollLeft = Math.max(0, startNode.offsetLeft - viewport.clientWidth * .25);
      setProsperityLivePopulation(startPopulation, afterTown.populationCap);
      const duration = Math.max(700, Math.min(1500, gained * 85));
      const startedAt = performance.now();
      const crossed = new Set();
      const animate = (now) => {
        const progress = Math.max(0, Math.min(1, (now - startedAt) / duration));
        const shownPopulation = Math.floor(startPopulation + gained * progress);
        setProsperityLivePopulation(shownPopulation, afterTown.populationCap);
        document.querySelectorAll("#prosperity-track [data-prosperity-population]").forEach((node) => {
          const threshold = Number(node.dataset.prosperityPopulation);
          if (threshold <= startPopulation || threshold > shownPopulation || crossed.has(threshold)) return;
          crossed.add(threshold);
          node.classList.remove("future", "current");
          node.classList.add("reached", "current", "growth-earned");
          document.querySelectorAll("#prosperity-track .prosperity-milestone.current").forEach((row) => { if (row !== node) row.classList.remove("current"); });
          if (node.dataset.prosperityLevel) {
            const burst = document.querySelector("#prosperity-level-burst");
            burst.querySelector("strong").textContent = `Lv.${node.dataset.prosperityLevel} ${node.dataset.prosperityName}`;
            burst.querySelector("span").textContent = `每日行动上限提升至 ${node.dataset.actionCapacity}`;
            burst.hidden = false;
            prosperityGrowthTimers.push(setTimeout(() => { burst.hidden = true; }, 1050));
          }
        });
        if (progress < 1) { prosperityGrowthFrame = requestAnimationFrame(animate); return; }
        prosperityGrowthFrame = null;
        setProsperityLivePopulation(endPopulation, afterTown.populationCap);
        renderProsperitySummary(afterTown);
        prosperityGrowthTimers.push(setTimeout(() => { document.querySelector("#prosperity-growth-return").hidden = false; }, beforeTown.prosperity.level < afterTown.prosperity.level ? 1100 : 350));
      };
      prosperityGrowthFrame = requestAnimationFrame(animate);
    });
  }

  function renderUnitRail(current) {
    const heroes = current.party.heroes.map((hero) => ({
      id: hero.id,
      name: hero.name,
      role: hero.role,
      kind: hero.id === "player" ? "player" : "hero",
      glyph: UNIT_GLYPHS[hero.id] || hero.name.slice(-1),
      status: hero.id === "player" ? "主角" : hero.active ? "队内" : "候补",
      active: hero.id === "player" || hero.active,
    }));
    const militia = Array.from({ length: current.war.untrainedUnits }, (_, index) => {
      const unitNumber = index + 1;
      return {
        id: `militia_${unitNumber}`,
        name: `灰谷民兵第${unitNumber}队`,
        role: "民兵 · 10人单位",
        kind: "militia",
        glyph: "民",
        status: `${unitNumber}`,
        active: true,
      };
    });
    const trained = current.party.trainedUnits.map((unit, index) => ({
      id: unit.id,
      name: unit.name,
      role: unit.role,
      kind: "trained",
      glyph: "战",
      status: `${index + 1}`,
      active: true,
    }));
    const units = [...heroes, ...militia, ...trained];
    const rail = document.querySelector("#unit-roster-rail");
    rail.innerHTML = `<div class="unit-roster-list" role="list" aria-label="我方${units.length}个单位">${units.map((unit) => `<div class="unit-avatar ${esc(unit.kind)} ${unit.active ? "active" : "reserve"}" role="listitem" data-equipment-target="${esc(unit.id)}" title="${esc(unit.name)}｜${esc(unit.role)}｜${esc(unit.status)}" aria-label="${esc(unit.name)}，${esc(unit.role)}，${esc(unit.status)}"><strong>${esc(unit.glyph)}</strong><small>${esc(unit.status)}</small></div>`).join("")}</div>`;
    rail.querySelectorAll("[data-equipment-target]").forEach((avatar) => avatar.addEventListener("click", (event) => { event.stopPropagation(); openEquipmentDialog(avatar.dataset.equipmentTarget); }));
  }

  function renderWorldUnits(current) {
    const heroes = current.party.heroes.map((hero, index) => ({
      id: hero.id,
      name: hero.name,
      icon: ROLE_ICONS[hero.roleKey] || UNIT_GLYPHS[hero.id] || "◆",
      badge: UNIT_GLYPHS[hero.id] || hero.name.slice(-1),
      detail: `${hero.role} · ${hero.id === "player" ? "主角" : hero.active ? "当前队内" : "村中待命"}`,
      kind: hero.id === "player" ? "player" : hero.id === "captain" ? "captain" : "hero",
      route: HERO_PATROL_ROUTES[hero.id] || HERO_FALLBACK_ROUTES[index % HERO_FALLBACK_ROUTES.length],
      lane: 0,
    }));
    const militiaUnits = current.party.militiaUnits.map((unit, index) => ({
      id: unit.id,
      name: unit.name,
      icon: ROLE_ICONS[unit.roleKey] || "⚔️",
      unitNumber: index + 1,
      detail: `${unit.role} · 建筑间巡行`,
      kind: "militia",
      route: MILITIA_PATROL_ROUTES[index % MILITIA_PATROL_ROUTES.length],
      lane: Math.floor(index / MILITIA_PATROL_ROUTES.length) - 1,
    }));
    const civilianCount = Math.min(CIVILIAN_ROUTES.length, Math.max(0, current.town.prosperity.level * 2));
    const civilians = CIVILIAN_ROUTES.slice(0, civilianCount).map((route, index) => `<span class="town-civilian route-${route.route}" style="left:${route.x}px;top:${route.y}px;--route-duration:${route.duration}s;--route-delay:${route.delay}s" aria-hidden="true"><i><b></b></i></span>`).join("");
    const layer = document.querySelector("#map-unit-layer");
    const heroHtml = heroes.map((hero, index) => { const start = buildingPatrolPoints(hero.route, hero.lane)[0]; return `<button type="button" class="world-unit hero ${hero.kind}" data-equipment-target="${esc(hero.id)}" data-building-route="${hero.route}" data-route-lane="${hero.lane}" data-route-duration="${30 + (index % 4) * 3.5}" data-route-delay="${1.8 + index * 2.7}" style="left:${start[0]}px;top:${start[1]}px;--idle-delay:-${(index % 5) * .43}s" title="${esc(hero.name)}｜${esc(hero.detail)}" aria-label="${esc(hero.name)}，${esc(hero.detail)}"><span class="world-unit-avatar" aria-hidden="true"><i>${esc(hero.icon)}</i><b>${esc(hero.badge)}</b></span></button>`; }).join("");
    const militiaHtml = militiaUnits.map((unit, index) => {
      const start = buildingPatrolPoints(unit.route, unit.lane)[0];
      return `<button type="button" class="world-unit militia" data-equipment-target="${esc(unit.id)}" data-building-route="${unit.route}" data-route-lane="${unit.lane}" data-route-duration="${25 + (index % 4) * 2.8}" data-route-delay="${1.2 + index * 1.9}" style="left:${start[0]}px;top:${start[1]}px;--idle-delay:-${(index % 7) * .37}s" title="${esc(unit.name)}｜${esc(unit.detail)}" aria-label="${esc(unit.name)}，${esc(unit.detail)}"><span class="world-unit-avatar" aria-hidden="true"><i>${esc(unit.icon)}</i><b>${unit.unitNumber}</b></span></button>`;
    }).join("");
    layer.innerHTML = civilians + heroHtml + militiaHtml;
    layer.querySelectorAll("[data-equipment-target]").forEach((unit) => unit.addEventListener("click", (event) => { event.stopPropagation(); openEquipmentDialog(unit.dataset.equipmentTarget); }));
    startBuildingPatrols(layer);
  }

  function buildingPatrolPoints(routeName, lane = 0) {
    const route = BUILDING_PATROL_ROUTES[routeName] || BUILDING_PATROL_ROUTES.west;
    return route.map((plotIndex) => {
      const [plotX, plotY] = PLOT_POSITIONS[plotIndex];
      const [approachX, approachY] = BUILDING_APPROACH_OFFSETS[plotIndex];
      return [plotX + approachX + lane * 8, plotY + approachY + lane * 4];
    });
  }

  function buildingPatrolFrames(points) {
    const origin = points[0];
    const segmentCount = Math.max(1, points.length - 1);
    const frames = [];
    for (let segment = 0; segment < segmentCount; segment += 1) {
      const point = points[segment];
      const next = points[segment + 1];
      const translate = `${point[0] - origin[0]}px ${point[1] - origin[1]}px`;
      frames.push({ translate, offset: segment / segmentCount });
      frames.push({ translate, offset: (segment + .24) / segmentCount });
      frames.push({ translate: `${next[0] - origin[0]}px ${next[1] - origin[1]}px`, offset: (segment + 1) / segmentCount });
    }
    return frames;
  }

  function startBuildingPatrols(layer) {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    layer.querySelectorAll("[data-building-route]").forEach((unit) => {
      if (typeof unit.animate !== "function") return;
      const points = buildingPatrolPoints(unit.dataset.buildingRoute, Number(unit.dataset.routeLane || 0));
      const animation = unit.animate(buildingPatrolFrames(points), { duration: Number(unit.dataset.routeDuration) * 1000, delay: -Number(unit.dataset.routeDelay) * 1000, iterations: Infinity, easing: "linear", fill: "both" });
      const pause = () => animation.pause();
      const resume = () => { if (!unit.matches(":hover") && document.activeElement !== unit) animation.play(); };
      unit.addEventListener("pointerenter", pause);
      unit.addEventListener("pointerleave", resume);
      unit.addEventListener("focus", pause);
      unit.addEventListener("blur", resume);
    });
  }

  function renderMap(current) {
    renderUnitRail(current);
    locations = buildLocations(current);
    const layer = document.querySelector("#map-node-layer");
    layer.innerHTML = locations.map((location) => `<button class="map-node ${esc(location.type)} ${selectedNodeId === location.id ? "selected" : ""} ${newlyUnlocked.has(location.id) ? "newly-unlocked" : ""}" data-node-id="${esc(location.id)}" style="left:${location.x}px;top:${location.y}px">${location.yieldLabel ? `<span class="yield-badge">${esc(location.yieldLabel)}</span>` : ""}<span class="sigil">${esc(location.sigil)}</span><strong>${esc(location.title)}</strong><small>${esc(location.kicker)}</small>${location.actions.length ? `<b class="count">${location.actions.length}</b>` : ""}</button>`).join("");
    layer.querySelectorAll("[data-node-id]").forEach((node) => node.addEventListener("click", (event) => { event.stopPropagation(); selectedNodeId = node.dataset.nodeId; newlyUnlocked.delete(selectedNodeId); renderMap(view()); }));
    renderWorldUnits(current);
    renderPopover();
    renderCamera();
    const ending = document.querySelector("#ending-card");
    ending.hidden = !current.result;
    if (current.result) { ending.className = `ending-card ${current.result.win ? "win" : "loss"}`; ending.innerHTML = `<span class="eyebrow">第7日 · 决战结束</span><h2>${esc(current.result.title)}</h2><p>${current.result.win ? "灰谷村仍然站着。伊莎贝拉把染血的圣殿旗交给你保管。" : "防线被突破，但幸存者记住了这次备战留下的教训。"}</p><p>${current.result.combat.alliesAlive}/${current.result.combat.alliesStarted}名我方单位存活 · 敌方${current.result.combat.enemiesAlive}/${current.result.combat.enemiesStarted}</p>`; }
  }

  function renderPopover() {
    const popover = document.querySelector("#node-popover");
    const location = locations.find((row) => row.id === selectedNodeId);
    if (!location || mode !== "campaign") { popover.hidden = true; return; }
    popover.hidden = false;
    document.querySelector("#node-kicker").textContent = location.kicker;
    document.querySelector("#node-title").textContent = location.title;
    document.querySelector("#node-description").textContent = location.description;
    document.querySelector("#node-status").textContent = location.status;
    const normalActions = location.actions.filter((action) => action.kind !== "grind_setting");
    document.querySelector("#node-action-count").textContent = `${normalActions.filter((action) => action.available !== false).length}/${normalActions.length}`;
    const grindHtml = location.grind ? renderGrindDifficultyPanel(location) : "";
    const actionHtml = normalActions.map((action) => `<button class="action-card ${action.available === false ? "unavailable" : ""}" data-action-id="${esc(action.id)}" ${action.available === false ? "disabled" : ""}><strong>${esc(action.label)}</strong><em>${esc(costText(action))}</em>${action.description ? `<small>${esc(action.description)}</small>` : ""}${action.disabledReason ? `<small class="disabled-reason">${esc(action.disabledReason)}</small>` : ""}</button>`).join("");
    document.querySelector("#node-actions").innerHTML = grindHtml + (actionHtml || `<div class="empty-actions">${esc(location.emptyText || "这里暂时没有可执行行动。")}</div>`);
    document.querySelectorAll("#node-actions [data-action-id]").forEach((button) => button.addEventListener("click", () => {
      const actionId = button.dataset.actionId;
      const action = view().actions.find((row) => row.id === actionId) || location.actions.find((row) => row.id === actionId);
      runAction(action);
    }));
    requestAnimationFrame(positionPopover);
  }

  function renderGrindDifficultyPanel(location) {
    const grind = location.grind;
    const selected = grind.levels.find((row) => row.selected) || grind.levels[0];
    const selector = grind.levels.map((level) => {
      const action = location.actions.find((row) => row.operation === "select_grind_difficulty" && row.targetDifficulty === level.difficulty);
      const cls = level.selected ? "selected" : level.unlocked ? "" : "locked";
      const interactive = Boolean(action && action.available !== false);
      return `<button class="grind-level ${cls}" ${interactive ? `data-action-id="${esc(action.id)}"` : "disabled"} title="${esc(action?.disabledReason || `${level.threat} · ${level.lootCountLabel} · ${level.rarityLabel}`)}"><b>${level.difficulty}</b><span>${level.unlocked ? level.name : "未解锁"}</span></button>`;
    }).join("");
    const remainingScore = grind.nextUnlockScore ? Math.max(0, grind.nextUnlockScore - grind.unlockScore) : 0;
    const pct = grind.nextUnlockScore ? Math.min(100, Math.round(grind.unlockScore / grind.nextUnlockScore * 100)) : 100;
    const nextText = grind.nextUnlockScore ? `还差${remainingScore}积分；按当前难度约${Math.ceil(remainingScore / selected.winScore)}胜解锁难度${grind.nextUnlockDifficulty}` : "全部难度已解锁";
    const progressLabel = grind.nextUnlockScore ? `讨伐积分 ${grind.unlockScore}/${grind.nextUnlockScore}` : `讨伐积分 ${grind.unlockScore}`;
    const progressBar = grind.nextUnlockScore ? `<div class="grind-progress"><i style="width:${pct}%"></i></div>` : "";
    return `<section class="grind-difficulty-panel"><div class="grind-levels">${selector}</div><div class="grind-progress-copy"><strong>${progressLabel}</strong><span>${esc(nextText)}</span></div>${progressBar}<small>难度N胜利一次获得N积分；当前难度每胜+${selected.winScore}<br>当前难度：${esc(selected.threat)} · ${esc(selected.lootCountLabel)}<br>${esc(selected.rarityLabel)}</small></section>`;
  }

  function ensureSelections(current) {
    const targets = characterTargets(current);
    if (!targets.some((target) => target.id === selectedHeroId)) selectedHeroId = current.party.selectedHeroId || targets[0]?.id || null;
    if (!current.inventory.some((item) => item.id === selectedItemId)) {
      selectedItemId = sortItems(current.inventory)[0]?.id || null;
      inventoryPage = 0;
    }
    if (current.time.phase === "prologue") selectedNodeId = "command";
    if (current.time.phase === "final") selectedNodeId = "final";
  }

  function selectHero(heroId) {
    const changed = selectedHeroId !== heroId;
    const current = view();
    if (current.party.selectedHeroId !== heroId) {
      const action = current.actions.find((row) => row.kind === "selection" && row.targetHeroId === heroId);
      if (action) { state = GAME.applyPlayerAction(state, action.id); saveState(); }
    }
    selectedHeroId = heroId;
    if (changed) selectedItemId = null;
    renderDock(view());
    if (document.querySelector("#equipment-dialog")?.open) {
      renderEquipmentDialog(view());
    }
  }

  function sortItems(items) { return items.slice().sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0) || b.power - a.power || String(a.id).localeCompare(String(b.id))); }

  function characterTargets(current) { return current.party.characterTargets || current.party.equipmentTargets; }

  function equipmentOwners(current) {
    const owners = new Map();
    for (const target of current.party.equipmentTargets) {
      for (const slot of target.equipment) if (slot.item) owners.set(slot.item.id, target);
    }
    return owners;
  }

  function orderedEquipmentItems(current, targetId) {
    const owners = equipmentOwners(current);
    return current.inventory.slice().sort((a, b) => {
      const ownerA = owners.get(a.id), ownerB = owners.get(b.id);
      const groupA = ownerA?.id === targetId ? 0 : ownerA ? 2 : 1;
      const groupB = ownerB?.id === targetId ? 0 : ownerB ? 2 : 1;
      return groupA - groupB || (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0) || b.power - a.power || String(a.id).localeCompare(String(b.id));
    });
  }

  function formationRoster(current) {
    return characterTargets(current).map((unit) => ({
      id: unit.id,
      name: unit.name,
      profession: String(unit.role || "未知职业").split(" · ")[0],
      roleKey: unit.roleKey || "",
      roleIcon: ROLE_ICONS[unit.roleKey] || "◆",
      kind: unit.kind,
      unitCount: 1,
      foodCost: unit.kind === "trained" ? 3 : unit.kind === "militia" ? 1 : 0,
      combatPower: Number(unit.combatPower || 0),
      city: unit.city || CURRENT_CITY,
    }));
  }

  function normalizeFormationState(current) {
    const available = new Set(formationRoster(current).map((member) => member.id));
    const byId = new Map((formationState.formations || []).map((formation) => [formation.id, formation]));
    formationState.formations = FORMATION_SPECS.filter((spec) => spec.unlocked).map((spec) => {
      const saved = byId.get(spec.id);
      const members = [...new Set((saved?.members || ["player"]).filter((id) => available.has(id)))];
      const memberSet = new Set(members);
      const positioned = new Set();
      const positions = Array.from({ length: spec.capacity }, (_, index) => {
        const id = Array.isArray(saved?.positions) ? saved.positions[index] : null;
        if (!id || !memberSet.has(id) || positioned.has(id)) return null;
        positioned.add(id);
        return id;
      });
      for (const id of members) {
        if (positioned.has(id)) continue;
        const openIndex = positions.indexOf(null);
        if (openIndex < 0) break;
        positions[openIndex] = id;
        positioned.add(id);
      }
      return { ...spec, name: saved?.name || spec.name, members, positions };
    });
    if (!formationState.formations.some((formation) => formation.id === formationState.selectedId)) formationState.selectedId = "warband";
  }

  function selectedFormation(current) {
    normalizeFormationState(current);
    return formationState.formations.find((formation) => formation.id === formationState.selectedId) || formationState.formations[0];
  }

  function formationStatus(formation, roster) {
    const byId = new Map(roster.map((member) => [member.id, member]));
    const members = formation.members.map((id) => byId.get(id)).filter(Boolean);
    const unitCount = members.reduce((sum, member) => sum + member.unitCount, 0);
    const foodCost = members.reduce((sum, member) => sum + Number(member.foodCost || 0), 0);
    const cities = [...new Set(members.map((member) => member.city))];
    const reasons = [];
    if (unitCount > formation.capacity) reasons.push(`超出${formation.capacity}单位上限（当前${unitCount}单位）`);
    if (cities.length > 1) reasons.push(`成员分处${cities.join("、")}`);
    return { members, unitCount, foodCost, cities, cityLabel: cities.length === 0 ? "未驻扎" : cities.length === 1 ? cities[0] : "跨城编队", valid: reasons.length === 0, reasons };
  }

  function formationMemberCard(member, zone) {
    const action = zone === "deployed" ? "拖到下方移出编队" : "拖到上方加入编队";
    return `<button type="button" class="formation-member ${esc(member.kind)}" draggable="true" data-formation-member="${esc(member.id)}" data-formation-zone="${esc(zone)}" title="${esc(member.profession)}｜${esc(member.name)}｜${esc(member.city)}｜战斗力${formatCombatPower(member.combatPower)}｜${action}" aria-label="${esc(member.profession)}，${esc(member.name)}，城镇${esc(member.city)}，战斗力${formatCombatPower(member.combatPower)}"><span class="formation-member-art" aria-hidden="true"></span><span class="formation-member-summary"><i class="formation-member-role" aria-hidden="true">${esc(member.roleIcon)}</i><span class="formation-member-identity"><strong>${esc(member.name)}</strong><small>${esc(member.city)}</small></span><span class="formation-member-power"><em>战斗力</em><b>${formatCombatPower(member.combatPower)}</b></span></span></button>`;
  }

  function updateFormationMember(current, memberId, operation) {
    const formation = selectedFormation(current);
    const rosterIds = new Set(formationRoster(current).map((member) => member.id));
    if (!rosterIds.has(memberId)) return;
    if (operation === "add" && !formation.members.includes(memberId)) {
      formation.members.push(memberId);
      const openIndex = formation.positions.indexOf(null);
      if (openIndex >= 0) formation.positions[openIndex] = memberId;
    }
    if (operation === "remove") {
      formation.members = formation.members.filter((id) => id !== memberId);
      formation.positions = formation.positions.map((id) => id === memberId ? null : id);
    }
    saveFormationState();
    renderFormationDialog(view());
  }

  function formationGridShape(capacity) {
    if (capacity === 2) return { columns: 1, rows: 2 };
    if (capacity === 4) return { columns: 2, rows: 2 };
    if (capacity === 8) return { columns: 4, rows: 2 };
    return { columns: 5, rows: Math.ceil(capacity / 5) };
  }

  function moveFormationPosition(current, memberId, targetIndex) {
    const formation = selectedFormation(current);
    const sourceIndex = formation.positions.indexOf(memberId);
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= formation.positions.length || sourceIndex === targetIndex) return;
    const replacedId = formation.positions[targetIndex];
    formation.positions[targetIndex] = memberId;
    formation.positions[sourceIndex] = replacedId || null;
    const positionedIds = formation.positions.filter(Boolean);
    formation.members = [...positionedIds, ...formation.members.filter((id) => !positionedIds.includes(id))];
    selectedFormationPositionMemberId = null;
    saveFormationState();
    showToast(replacedId ? "两个单位已交换站位" : `单位已移动到第${targetIndex + 1}号槽位`);
    renderFormationDialog(view());
  }

  function formationPositionSlot(member, index) {
    if (!member) return `<button type="button" class="formation-position-slot empty" data-formation-position-index="${index}" aria-label="第${index + 1}号空槽"><i>＋</i><small>${index + 1}</small></button>`;
    const selected = selectedFormationPositionMemberId === member.id;
    return `<button type="button" class="formation-position-slot occupied ${esc(member.kind)} ${selected ? "selected" : ""}" draggable="true" data-formation-position-index="${index}" data-formation-position-member="${esc(member.id)}" title="${esc(member.profession)}｜${esc(member.name)}｜${esc(member.city)}｜战斗力${formatCombatPower(member.combatPower)}" aria-label="第${index + 1}号槽位，${esc(member.profession)}，${esc(member.name)}，城镇${esc(member.city)}，战斗力${formatCombatPower(member.combatPower)}"><span class="position-member-identity"><i aria-hidden="true">${esc(member.roleIcon)}</i><span><strong>${esc(member.name)}</strong><em>${esc(member.city)}</em></span></span><span class="position-member-power"><em>战斗力</em><b>${formatCombatPower(member.combatPower)}</b></span><small>${index + 1}</small></button>`;
  }

  function bindFormationPositionDrag() {
    const editor = document.querySelector("#equipment-backpack-panel");
    editor.querySelectorAll("[data-formation-position-index]").forEach((slot) => {
      slot.addEventListener("dragstart", (event) => {
        const memberId = slot.dataset.formationPositionMember;
        if (!memberId) { event.preventDefault(); return; }
        draggedFormationMemberId = memberId;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", memberId);
        slot.classList.add("dragging");
      });
      slot.addEventListener("dragend", () => {
        draggedFormationMemberId = null;
        slot.classList.remove("dragging");
        editor.querySelectorAll(".drag-over").forEach((target) => target.classList.remove("drag-over"));
      });
      slot.addEventListener("dragover", (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; slot.classList.add("drag-over"); });
      slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        slot.classList.remove("drag-over");
        const memberId = event.dataTransfer.getData("text/plain") || draggedFormationMemberId;
        if (memberId) moveFormationPosition(view(), memberId, Number(slot.dataset.formationPositionIndex));
      });
      slot.addEventListener("click", () => {
        const memberId = slot.dataset.formationPositionMember;
        if (!selectedFormationPositionMemberId) {
          if (memberId) { selectedFormationPositionMemberId = memberId; renderFormationDialog(view()); }
          return;
        }
        if (selectedFormationPositionMemberId === memberId) {
          selectedFormationPositionMemberId = null;
          renderFormationDialog(view());
          return;
        }
        moveFormationPosition(view(), selectedFormationPositionMemberId, Number(slot.dataset.formationPositionIndex));
      });
    });
  }

  function renderFormationPositionEditor(editorPanel, formation, status, roster) {
    const byId = new Map(roster.map((member) => [member.id, member]));
    const shape = formationGridShape(formation.capacity);
    const slots = formation.positions.map((id, index) => formationPositionSlot(byId.get(id), index)).join("");
    const instruction = selectedFormationPositionMemberId ? "已选中单位，再点一个槽位即可交换或移动" : "拖动头像交换位置；也可以先点头像，再点目标槽位";
    editorPanel.classList.add("positioning");
    editorPanel.innerHTML = `<header class="formation-editor-head"><div><span class="eyebrow">调整站位</span><h3>${esc(formation.name)}</h3><p>${esc(instruction)}</p></div><div class="formation-editor-actions"><strong>${status.unitCount}/${formation.capacity}单位</strong><button type="button" class="formation-position-finish">完成站位</button></div></header><section class="formation-position-stage"><div class="formation-enemy-direction"><span>敌军方向</span><b>↑</b></div><div class="formation-position-grid" style="--formation-columns:${shape.columns};--formation-rows:${shape.rows}">${slots}</div><div class="formation-rank-guide"><span>前线</span><i></i><span>后方</span></div></section>`;
    editorPanel.querySelector(".formation-position-finish").addEventListener("click", () => { formationPositioning = false; selectedFormationPositionMemberId = null; renderFormationDialog(view()); });
    bindFormationPositionDrag();
  }

  function bindFormationDrag(current) {
    const editor = document.querySelector("#equipment-backpack-panel");
    editor.querySelectorAll("[data-formation-member]").forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        draggedFormationMemberId = card.dataset.formationMember;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedFormationMemberId);
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", () => { draggedFormationMemberId = null; card.classList.remove("dragging"); editor.querySelectorAll(".drag-over").forEach((zone) => zone.classList.remove("drag-over")); });
      card.addEventListener("click", () => updateFormationMember(view(), card.dataset.formationMember, card.dataset.formationZone === "deployed" ? "remove" : "add"));
    });
    editor.querySelectorAll("[data-formation-drop]").forEach((zone) => {
      zone.addEventListener("dragover", (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; zone.classList.add("drag-over"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("drag-over");
        const memberId = event.dataTransfer.getData("text/plain") || draggedFormationMemberId;
        if (memberId) updateFormationMember(view(), memberId, zone.dataset.formationDrop === "deployed" ? "add" : "remove");
      });
    });
  }

  function renderFormationDialog(current) {
    const workspace = document.querySelector(".equipment-workspace");
    workspace.classList.add("formation-mode");
    const listPanel = document.querySelector("#equipment-character-panel");
    const editorPanel = document.querySelector("#equipment-backpack-panel");
    listPanel.className = "formation-list-panel";
    editorPanel.className = "formation-editor-panel";
    const roster = formationRoster(current);
    const formation = selectedFormation(current);
    const status = formationStatus(formation, roster);
    const deployedIds = new Set(formation.members);
    const available = roster.filter((member) => !deployedIds.has(member.id) && (!formationCityFilter || member.city === CURRENT_CITY));
    editorPanel.classList.toggle("invalid", !status.valid);
    const formationRows = FORMATION_SPECS.map((spec) => {
      if (!spec.unlocked) return `<div class="formation-row locked" aria-label="${spec.capacity}单位编队尚未解锁"><i>锁</i><div><strong>${esc(spec.name)}</strong><span>${spec.capacity}单位编队</span></div><small>尚未解锁</small></div>`;
      const row = formationState.formations.find((item) => item.id === spec.id);
      const rowStatus = formationStatus(row, roster);
      return `<button type="button" class="formation-row ${row.id === formation.id ? "selected" : ""} ${rowStatus.valid ? "" : "invalid"}" data-formation-select="${esc(row.id)}"><i>${rowStatus.unitCount}/${row.capacity}</i><div><strong>${esc(row.name)}</strong><span>${esc(rowStatus.cityLabel)}</span></div><small>粮${rowStatus.foodCost}/战 · ${rowStatus.valid ? "合法" : "不合法"}</small></button>`;
    }).join("");
    listPanel.innerHTML = `<header><span class="eyebrow">所有编队</span><strong>${formationState.formations.length}支可用</strong></header><div class="formation-list">${formationRows}</div><p>2 / 4 / 8 / 20单位编队现已开放；更大规模需要后续权限。</p>`;
    const errorText = status.valid ? `${status.cityLabel} · 当前${status.unitCount}/${formation.capacity}单位 · 一战粮耗${status.foodCost}` : `编队不合法：${status.reasons.join("；")}；一战粮耗${status.foodCost}`;
    const deployed = status.members.map((member) => formationMemberCard(member, "deployed")).join("");
    const candidateCards = available.map((member) => formationMemberCard(member, "available")).join("");
    listPanel.querySelectorAll("[data-formation-select]").forEach((button) => button.addEventListener("click", () => { formationState.selectedId = button.dataset.formationSelect; formationPositioning = false; selectedFormationPositionMemberId = null; saveFormationState(); renderFormationDialog(view()); }));
    if (formationPositioning) {
      renderFormationPositionEditor(editorPanel, formation, status, roster);
      return;
    }
    editorPanel.classList.remove("positioning");
    const positionBlocked = status.unitCount > formation.capacity;
    editorPanel.innerHTML = `<header class="formation-editor-head ${status.valid ? "" : "invalid"}"><div><span class="eyebrow">当前编队</span><h3>${esc(formation.name)}</h3><p>${esc(errorText)}</p></div><strong>${status.unitCount}/${formation.capacity}单位</strong></header><section class="formation-zone deployed" data-formation-drop="deployed"><header><div><strong>出战成员</strong><span>拖到这里加入编队</span></div><div class="formation-zone-actions"><small>${status.members.length}个单位</small><button type="button" class="formation-position-open ${positionBlocked ? "blocked" : ""}" ${positionBlocked ? "disabled" : ""} title="${positionBlocked ? "超出编队单位上限，移出多余单位后才能调整站位" : "在阵地槽位中调整前后顺序"}">调整站位</button></div></header><div class="formation-member-strip">${deployed || `<div class="formation-empty">把下方成员拖到这里</div>`}</div></section><section class="formation-zone available" data-formation-drop="available"><header><div><strong>可选成员</strong><span>${formationCityFilter ? `只看${CURRENT_CITY} · ` : ""}${available.length}个单位可选</span></div><button type="button" class="formation-city-filter ${formationCityFilter ? "active" : ""}" aria-pressed="${formationCityFilter}">筛选 · ${CURRENT_CITY}</button></header><div class="formation-member-strip">${candidateCards || `<div class="formation-empty">${formationCityFilter ? `没有更多位于${CURRENT_CITY}的成员；关闭筛选可查看其他城池` : "所有成员都已在当前编队"}</div>`}</div></section>`;
    editorPanel.querySelector(".formation-position-open").addEventListener("click", () => { formationPositioning = true; selectedFormationPositionMemberId = null; renderFormationDialog(view()); });
    editorPanel.querySelector(".formation-city-filter").addEventListener("click", () => { formationCityFilter = !formationCityFilter; renderFormationDialog(view()); });
    bindFormationDrag(current);
  }

  function renderEquipmentModeTabs() {
    document.querySelectorAll("[data-equipment-mode]").forEach((tab) => {
      const active = tab.dataset.equipmentMode === equipmentMode;
      tab.classList.toggle("active", active);
      if (active) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current");
    });
  }

  function openEquipmentDialog(targetId = null) {
    if (mode !== "campaign") return;
    const current = view();
    if (targetId && characterTargets(current).some((target) => target.id === targetId)) { equipmentMode = "character"; selectHero(targetId); }
    const dialog = document.querySelector("#equipment-dialog");
    if (!dialog.open) dialog.showModal();
    renderEquipmentDialog(view());
  }

  function renderEquipmentDialog(current) {
    const dialog = document.querySelector("#equipment-dialog");
    if (!dialog?.open) return;
    renderEquipmentModeTabs();
    if (equipmentMode === "formation") { renderFormationDialog(current); return; }
    const workspace = document.querySelector(".equipment-workspace");
    workspace.classList.remove("formation-mode");
    document.querySelector("#equipment-character-panel").className = "equipment-character-panel";
    document.querySelector("#equipment-backpack-panel").className = "equipment-backpack-panel";
    const oldGrid = dialog.querySelector(".equipment-backpack-grid");
    if (oldGrid) equipmentBackpackScrollTop = oldGrid.scrollTop;

    const originalTargets = characterTargets(current);
    const indexedTargets = originalTargets.map((target, index) => ({ target, index }));
    const targets = indexedTargets.sort((a, b) => Number(b.target.active) - Number(a.target.active) || a.index - b.index).map((row) => row.target);
    const hero = targets.find((target) => target.id === selectedHeroId) || targets[0];
    if (!hero) return;
    selectedHeroId = hero.id;
    const owners = equipmentOwners(current);
    const items = orderedEquipmentItems(current, hero.id);
    const selectedItem = items.find((item) => item.id === selectedItemId) || items[0] || null;
    selectedItemId = selectedItem?.id || null;
    const equipmentPower = hero.equipment.reduce((sum, slot) => sum + Number(slot.item?.power || 0), 0);
    const heroIndex = targets.findIndex((target) => target.id === hero.id);
    const previousHero = heroIndex > 0 ? targets[heroIndex - 1] : null;
    const nextHero = heroIndex < targets.length - 1 ? targets[heroIndex + 1] : null;
    const stateLabel = hero.kind === "militia" ? "民兵" : hero.kind === "trained" ? "战士" : hero.active ? "队内" : "候补";

    const slotHtml = (slot) => {
      if (hero.equipmentLocked) {
        const reason = hero.equipmentLockReason || "这个单位暂时不能使用装备。";
        return `<button type="button" class="portrait-equipment-slot locked" disabled title="${esc(reason)}" aria-label="${esc(slot.slotLabel)}：装备未开放"><i>${SLOT_ICONS[slot.slotLabel] || "◆"}</i><em>锁</em><div class="equipment-slot-tooltip"><span>${esc(slot.slotLabel)}</span><strong>装备未开放</strong><p>${esc(reason)}</p></div></button>`;
      }
      const item = slot.item;
      const base = item ? Object.entries(item.baseStats || {}).map(([key, value]) => `${STAT_LABELS[key] || key}+${value}`).join(" · ") : "";
      const affixes = item ? item.affixes.map((affix) => `${affix.label}+${affix.value}${affix.percent ? "%" : ""}`).join(" · ") : "";
      const tooltip = item ? `<div class="equipment-slot-tooltip"><span>${esc(slot.slotLabel)} · ${esc(item.rarity)}</span><strong class="rarity-${esc(item.rarity)}">${esc(item.name)}</strong><p>显示评分 +${item.power}</p><p>${esc(base || "无基础属性")}</p><p>${esc(affixes || "无额外词条")}</p></div>` : `<div class="equipment-slot-tooltip"><span>${esc(slot.slotLabel)}</span><strong>空装备槽</strong><p>从右侧背包选择一件${esc(slot.slotLabel)}进行装备。</p></div>`;
      return `<button type="button" class="portrait-equipment-slot ${item ? `filled rarity-border-${esc(item.rarity)}` : "empty"}" ${item ? `data-equipment-item="${esc(item.id)}"` : ""} aria-label="${esc(slot.slotLabel)}：${item ? esc(item.name) : "空"}"><i>${SLOT_ICONS[slot.slotLabel] || "◆"}</i>${tooltip}</button>`;
    };
    const leftSlots = hero.equipment.slice(0, 4).map(slotHtml).join("");
    const rightSlots = hero.equipment.slice(4, 8).map(slotHtml).join("");
    const skills = (hero.skills || []).map((skill) => {
      const details = (skill.details?.length ? skill.details : [skill.description]).map((detail) => `<li>${esc(detail)}</li>`).join("");
      const timing = skill.cooldown ? `${skill.cooldown}秒冷却` : "持续生效";
      return `<button type="button" class="character-skill" aria-label="${esc(skill.name)}，${esc(skill.type)}，${esc(timing)}，${esc(skill.description)}，悬停查看详细数值"><strong>${esc(skill.name)}</strong><span>${esc(skill.type)}</span><small>${esc(timing)}</small><p class="skill-summary">${esc(skill.description)}</p><div class="skill-detail-tooltip"><header><span>${esc(skill.type)}</span><strong>${esc(skill.name)}</strong><b>${esc(timing)}</b></header><p>${esc(skill.description)}</p><ul>${details}</ul></div></button>`;
    }).join("");
    const stats = Object.entries(hero.stats || {}).map(([key, value]) => `<div><span>${esc(STAT_LABELS[key] || key)}</span><b>${["attackSpeedPct", "skillHastePct"].includes(key) ? `${value >= 0 ? "+" : ""}${value}%` : value}</b></div>`).join("");
    const autoEquipAction = current.actions.find((action) => action.operation === "auto_equip" && action.targetHeroId === hero.id);
    const autoEquipAllAction = current.actions.find((action) => action.operation === "auto_equip_all");
    const affixTags = hero.equipmentLocked ? `<span class="locked">装备未开放</span>` : hero.preferredAffixes.map((tag) => `<span>${esc(tag)}</span>`).join("");
    const powerLabel = hero.equipmentLocked ? "民兵不能穿戴装备" : `装备评分 ${equipmentPower}`;
    const statNote = hero.equipmentLocked ? "这是该民兵当前的基础战斗数值；装备栏尚未开放。" : "数值已经包含当前穿戴装备；这里只展示玩家可见的结果，不显示内部胜率。";
    document.querySelector("#equipment-character-panel").innerHTML = `<header class="character-page-nav"><button type="button" class="character-page-arrow" data-character-page="${previousHero ? esc(previousHero.id) : ""}" ${previousHero ? "" : "disabled"} aria-label="上一个人物">‹</button><div><span>${heroIndex + 1}/${targets.length} · ${esc(stateLabel)}</span><strong>${esc(hero.name)}</strong></div><button type="button" class="character-page-arrow" data-character-page="${nextHero ? esc(nextHero.id) : ""}" ${nextHero ? "" : "disabled"} aria-label="下一个人物">›</button></header><div class="character-stage ${hero.equipmentLocked ? "equipment-locked" : ""}"><div class="portrait-slots left">${leftSlots}</div><div class="character-portrait"><span class="portrait-placeholder" aria-hidden="true"></span><h3>${esc(hero.name)}</h3><p>${esc(hero.role)}</p><div class="affix-tags">${affixTags}</div><strong class="portrait-power ${hero.equipmentLocked ? "locked" : ""}">${esc(powerLabel)}</strong></div><div class="portrait-slots right">${rightSlots}</div></div><div class="character-skills"><header><span>技能</span><div><button type="button" class="mini-button ${hero.equipmentLocked ? "equipment-locked" : ""}" id="modal-auto-equip" ${!autoEquipAction || autoEquipAction.available === false ? "disabled" : ""} title="${hero.equipmentLocked ? esc(hero.equipmentLockReason) : "一键为当前单位配装"}">${hero.equipmentLocked ? "装备锁定" : "一键当前"}</button><button type="button" class="mini-button" id="modal-auto-equip-all" ${!autoEquipAllAction || autoEquipAllAction.available === false ? "disabled" : ""}>一键全队</button><button type="button" class="mini-button character-stat-toggle" aria-label="悬停查看完整数值">数值</button><aside class="character-stat-overlay"><span class="eyebrow">当前战斗数值</span><h3>${esc(hero.name)}</h3><div class="character-stat-grid">${stats}</div><p>${esc(statNote)}</p></aside></div></header><div class="character-skill-grid">${skills}</div></div>`;

    const itemCells = items.map((item) => { const owner = owners.get(item.id); const ownerState = owner?.id === hero.id ? "current" : owner ? "other" : "free"; const ownerLabel = owner?.id === hero.id ? "当前" : owner ? "他人" : ""; return `<button type="button" class="equipment-item-cell ${item.id === selectedItem?.id ? "selected" : ""} ${ownerState} rarity-border-${esc(item.rarity)}" data-backpack-item="${esc(item.id)}" title="${esc(item.name)}｜${esc(item.rarity)}｜评分+${item.power}${owner ? `｜${esc(owner.name)}已装备` : ""}"><i>${SLOT_ICONS[item.slotLabel] || "◆"}</i><strong class="rarity-${esc(item.rarity)}">${esc(item.name)}</strong><small>${esc(item.slotLabel)} · +${item.power}</small>${ownerLabel ? `<em>${ownerLabel}</em>` : ""}</button>`; }).join("");
    let detailHtml = `<div class="equipment-item-detail empty">背包是空的。</div>`;
    if (selectedItem) {
      const equippedBy = owners.get(selectedItem.id);
      const equipAction = current.actions.find((action) => action.kind === "equipment" && action.targetItemId === selectedItem.id && action.targetHeroId === hero.id && action.operation !== "unequip");
      const unequipAction = current.actions.find((action) => action.kind === "equipment" && action.targetItemId === selectedItem.id && action.targetHeroId === hero.id && action.operation === "unequip");
      const itemStats = Object.entries(selectedItem.baseStats || {}).map(([key, value]) => `${STAT_LABELS[key] || key}+${value}`).join(" · ");
      const itemAffixes = selectedItem.affixes.map((affix) => `${affix.label}+${affix.value}${affix.percent ? "%" : ""}`).join(" · ");
      const transfer = equippedBy && equippedBy.id !== hero.id ? `由${equippedBy.name}穿戴；需要先由该单位卸下。` : equippedBy ? `当前由${hero.name}穿戴。` : "当前未被任何单位穿戴。";
      detailHtml = `<div class="equipment-item-detail"><div><span class="eyebrow">${esc(selectedItem.slotLabel)} · ${esc(selectedItem.rarity)}</span><h3 class="rarity-${esc(selectedItem.rarity)}">${esc(selectedItem.name)}</h3><p>评分+${selectedItem.power} · ${esc(itemStats || "无基础属性")}</p><p>${esc(itemAffixes || "无额外词条")}</p><small class="${equippedBy && equippedBy.id !== hero.id ? "disabled-reason" : ""}">${esc(transfer)}</small></div><div class="equipment-item-actions">${equipAction ? `<button type="button" class="button primary" data-modal-equip="${esc(equipAction.id)}">装备</button>` : ""}${unequipAction ? `<button type="button" class="button quiet" data-modal-unequip="${esc(unequipAction.id)}">卸下</button>` : ""}</div></div>`;
    }
    const backpackNote = hero.equipmentLocked ? `<p class="equipment-lock-note">装备未开放 · 这里只能查看物品</p>` : `<p><i class="current"></i>当前穿戴在前　<i class="free"></i>未穿戴居中　<i class="other"></i>他人穿戴在后</p>`;
    document.querySelector("#equipment-backpack-panel").innerHTML = `<header><div><span class="eyebrow">背包</span><strong>${items.length}/200</strong></div>${backpackNote}</header><div class="equipment-backpack-grid">${itemCells || `<div class="empty-actions">还没有装备。</div>`}</div>${detailHtml}`;

    const grid = dialog.querySelector(".equipment-backpack-grid");
    grid.scrollTop = equipmentBackpackScrollTop;
    grid.addEventListener("scroll", () => { equipmentBackpackScrollTop = grid.scrollTop; }, { passive: true });
    dialog.querySelectorAll("[data-character-page]").forEach((button) => button.addEventListener("click", () => { if (button.dataset.characterPage) selectHero(button.dataset.characterPage); }));
    dialog.querySelectorAll("[data-equipment-item],[data-backpack-item]").forEach((button) => button.addEventListener("click", () => { selectedItemId = button.dataset.equipmentItem || button.dataset.backpackItem; renderEquipmentDialog(view()); }));
    dialog.querySelector("#modal-auto-equip")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === autoEquipAction?.id), { quiet: true }));
    dialog.querySelector("#modal-auto-equip-all")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === autoEquipAllAction?.id), { quiet: true }));
    dialog.querySelector("[data-modal-equip]")?.addEventListener("click", (event) => applyVisibleAction(view().actions.find((action) => action.id === event.currentTarget.dataset.modalEquip), { quiet: true }));
    dialog.querySelector("[data-modal-unequip]")?.addEventListener("click", (event) => applyVisibleAction(view().actions.find((action) => action.id === event.currentTarget.dataset.modalUnequip), { quiet: true }));
  }

  function rememberPartyScroll() {
    const layout = document.querySelector(".party-layout");
    const roster = document.querySelector(".hero-roster");
    const detail = document.querySelector(".hero-detail");
    if (layout) partyScrollLeft = layout.scrollLeft;
    if (roster) partyRosterScrollTop = roster.scrollTop;
    if (detail) partyDetailScrollTop = detail.scrollTop;
  }

  function bindPartyScroll(dock) {
    const layout = dock.querySelector(".party-layout");
    const roster = dock.querySelector(".hero-roster");
    const detail = dock.querySelector(".hero-detail");
    if (!layout || !roster || !detail) return;
    layout.scrollLeft = partyScrollLeft;
    roster.scrollTop = partyRosterScrollTop;
    detail.scrollTop = partyDetailScrollTop;
    layout.addEventListener("scroll", () => { partyScrollLeft = layout.scrollLeft; }, { passive: true });
    roster.addEventListener("scroll", () => { partyRosterScrollTop = roster.scrollTop; }, { passive: true });
    detail.addEventListener("scroll", () => { partyDetailScrollTop = detail.scrollTop; }, { passive: true });
  }

  function renderDock(current) {
    rememberPartyScroll();
    document.querySelectorAll(".dock-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === activeTab));
    const dock = document.querySelector("#dock-content");
    if (activeTab === "inventory") return renderInventory(current, dock);
    if (activeTab === "journal") return renderJournal(current, dock);
    const targets = current.party.equipmentTargets;
    const hero = targets.find((row) => row.id === selectedHeroId) || targets[0];
    if (!hero) { dock.innerHTML = `<div class="empty-actions">还没有可查看的角色。</div>`; return; }
    const equipmentPower = hero.equipment.reduce((sum, slot) => sum + Number(slot.item?.power || 0), 0);
    dock.innerHTML = `<div class="party-layout"><div class="hero-roster">${targets.map((row) => `<button class="hero-card ${row.id === hero.id ? "selected" : ""} ${row.active ? "" : "inactive"} ${row.kind === "trained" ? "trained" : ""}" data-hero-id="${esc(row.id)}"><strong>${esc(row.name)}</strong><small>${esc(row.role)}</small>${row.kind === "trained" ? "<em>战士</em>" : row.active ? "<em>出战</em>" : ""}</button>`).join("")}</div><div class="hero-detail"><section class="hero-summary"><span class="eyebrow">当前配装单位</span><h3>${esc(hero.name)}</h3><p>${esc(hero.role)} · 装备评分${equipmentPower}</p><p>擅长词条</p><div class="affix-tags">${hero.preferredAffixes.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div><p>${esc(current.party.finalBattleRule)}</p><div class="hero-quick-actions"><button id="auto-equip-all" class="button primary">一键英雄与战士配装</button><button id="auto-equip" class="button quiet">只配当前单位</button><div id="party-toggle"></div></div></section><section class="equipment-slots">${hero.equipment.map((slot) => `<div class="equipment-slot"><span>${SLOT_ICONS[slot.slotLabel] || "◆"} ${esc(slot.slotLabel)}</span><strong class="${slot.item ? `rarity-${esc(slot.item.rarity)}` : ""}">${slot.item ? esc(slot.item.name) : "空"}</strong><small>${slot.item ? `${esc(slot.item.rarity)} · 评分+${slot.item.power}` : "从背包手动装备"}</small></div>`).join("")}</section></div></div>`;
    bindPartyScroll(dock);
    dock.querySelectorAll("[data-hero-id]").forEach((button) => button.addEventListener("click", () => selectHero(button.dataset.heroId)));
    const partyAction = current.actions.find((action) => action.kind === "party" && action.targetHeroId === hero.id);
    const autoEquipAction = current.actions.find((action) => action.operation === "auto_equip" && action.targetHeroId === hero.id);
    const autoEquipButton = document.querySelector("#auto-equip");
    autoEquipButton.disabled = !autoEquipAction || autoEquipAction.available === false;
    autoEquipButton.title = autoEquipAction?.disabledReason || autoEquipAction?.description || "当前阶段不能整理装备";
    autoEquipButton.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === autoEquipAction?.id)));
    const autoEquipAllAction = current.actions.find((action) => action.operation === "auto_equip_all");
    const autoEquipAllButton = document.querySelector("#auto-equip-all");
    autoEquipAllButton.disabled = !autoEquipAllAction || autoEquipAllAction.available === false;
    autoEquipAllButton.title = autoEquipAllAction?.disabledReason || autoEquipAllAction?.description || "当前阶段不能整理装备";
    autoEquipAllButton.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === autoEquipAllAction?.id)));
    document.querySelector("#party-toggle").innerHTML = partyAction ? `<button class="mini-button ${partyAction.available === false ? "unavailable" : ""}" data-party-action="${esc(partyAction.id)}" ${partyAction.available === false ? "disabled" : ""}>${esc(partyAction.label)}</button>${partyAction.disabledReason ? `<small class="disabled-reason">${esc(partyAction.disabledReason)}</small>` : ""}` : hero.kind === "trained" ? `<small>训练完成的战士单位；突袭和决战出战时使用这套装备。</small>` : `<small>${hero.active ? "当前在经营期出战队伍中" : "当前为候补；第7日仍会自动集结"}</small>`;
    document.querySelector("[data-party-action]")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === document.querySelector("[data-party-action]").dataset.partyAction), { quiet: true }));
  }

  function setDockExpanded(expanded) {
    dockExpanded = Boolean(expanded) && mode === "campaign";
    const dock = document.querySelector("#command-dock");
    const toggle = document.querySelector("#dock-toggle");
    dock.classList.toggle("expanded", dockExpanded);
    toggle.setAttribute("aria-expanded", String(dockExpanded));
    toggle.querySelector("small").textContent = dockExpanded ? "▼ 收起" : "▲ 展开";
    document.querySelector(".game-shell").classList.toggle("drawer-open", dockExpanded);
  }

  function renderInventory(current, dock) {
    const items = sortItems(current.inventory);
    const item = items.find((row) => row.id === selectedItemId) || items[0] || null;
    const selectedHero = current.party.equipmentTargets.find((hero) => hero.id === selectedHeroId) || current.party.equipmentTargets[0];
    const pageCount = Math.max(1, Math.ceil(items.length / INVENTORY_PAGE_SIZE));
    inventoryPage = Math.min(Math.max(0, inventoryPage), pageCount - 1);
    const pageItems = items.slice(inventoryPage * INVENTORY_PAGE_SIZE, (inventoryPage + 1) * INVENTORY_PAGE_SIZE);
    dock.innerHTML = `<div class="inventory-layout"><section class="inventory-browser"><div class="inventory-toolbar"><span>背包 ${items.length}/200 · 按稀有度与评分排序</span><div class="inventory-pager"><button class="mini-button" id="inventory-prev" ${inventoryPage === 0 ? "disabled" : ""}>上一页</button><span>${inventoryPage + 1}/${pageCount}</span><button class="mini-button" id="inventory-next" ${inventoryPage >= pageCount - 1 ? "disabled" : ""}>下一页</button></div></div><div class="inventory-grid">${pageItems.map((row) => `<button class="item-cell ${row.id === item?.id ? "selected" : ""} rarity-${esc(row.rarity)}" data-item-id="${esc(row.id)}"><i>${SLOT_ICONS[row.slotLabel] || "◆"}</i><strong>${esc(row.name)}</strong><small>${esc(row.rarity)} · 评分+${row.power}</small></button>`).join("") || `<div class="empty-actions">背包是空的。</div>`}</div></section><aside id="item-detail" class="item-detail"></aside></div>`;
    document.querySelector("#inventory-prev")?.addEventListener("click", () => { inventoryPage -= 1; selectedItemId = items[inventoryPage * INVENTORY_PAGE_SIZE]?.id || selectedItemId; renderDock(view()); });
    document.querySelector("#inventory-next")?.addEventListener("click", () => { inventoryPage += 1; selectedItemId = items[inventoryPage * INVENTORY_PAGE_SIZE]?.id || selectedItemId; renderDock(view()); });
    dock.querySelectorAll("[data-item-id]").forEach((button) => button.addEventListener("click", () => { selectedItemId = button.dataset.itemId; renderDock(view()); }));
    if (!item) return;
    const equippedBy = current.party.equipmentTargets.find((hero) => hero.equipment.some((slot) => slot.item?.id === item.id));
    const equipAction = current.actions.find((action) => action.kind === "equipment" && action.targetItemId === item.id && action.targetHeroId === selectedHero?.id && action.operation !== "unequip");
    const unequipAction = current.actions.find((action) => action.kind === "equipment" && action.targetItemId === item.id && action.targetHeroId === selectedHero?.id && action.operation === "unequip");
    const sellAction = current.actions.find((action) => action.kind === "market" && action.targetItemId === item.id);
    const stats = Object.entries(item.baseStats || {}).map(([key, value]) => `<div class="stat-row"><span>${esc(STAT_LABELS[key] || key)}</span><b>+${value}</b></div>`).join("");
    const affixes = item.affixes.map((affix) => `<div class="stat-row"><span>${esc(affix.label)}</span><b>+${affix.value}${affix.percent ? "%" : ""}</b></div>`).join("");
    const marketReason = equippedBy ? "已装备物品不能直接出售；先由使用者卸下。" : sellAction?.disabledReason || (!sellAction ? "这件装备当前不能出售。" : "");
    const transferReason = equippedBy && equippedBy.id !== selectedHero?.id ? `要转交装备，请先选择${equippedBy.name}并卸下。` : "";
    document.querySelector("#item-detail").innerHTML = `<span class="eyebrow">${esc(item.slotLabel)} · 装备等级${item.equipmentLevel}</span><h3 class="rarity-${esc(item.rarity)}">${esc(item.name)}</h3><p>${esc(item.rarity)} · 显示评分 +${item.power}</p><div class="base-stats">${stats || `<div class="stat-row"><span>无基础属性</span></div>`}</div><div class="affixes">${affixes}</div><p>${equippedBy ? `当前由${esc(equippedBy.name)}使用` : `未装备 · 当前配装角色：${esc(selectedHero?.name || "无")}`}</p>${transferReason ? `<p>${esc(transferReason)}</p>` : ""}${marketReason ? `<p class="disabled-reason">${esc(marketReason)}</p>` : ""}<div class="item-actions">${equipAction ? `<button class="button primary" data-equip-action="${esc(equipAction.id)}">装备给${esc(selectedHero.name)}</button>` : ""}${unequipAction ? `<button class="button quiet" data-unequip-action="${esc(unequipAction.id)}">从${esc(selectedHero.name)}身上卸下</button>` : ""}${sellAction ? `<button class="button quiet ${sellAction.available === false ? "unavailable" : ""}" data-sell-action="${esc(sellAction.id)}" ${sellAction.available === false ? "disabled" : ""}>${esc(sellAction.label)}</button>` : ""}</div>`;
    document.querySelector("[data-equip-action]")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === document.querySelector("[data-equip-action]").dataset.equipAction), { quiet: true }));
    document.querySelector("[data-unequip-action]")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === document.querySelector("[data-unequip-action]").dataset.unequipAction), { quiet: true }));
    document.querySelector("[data-sell-action]")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === document.querySelector("[data-sell-action]").dataset.sellAction), { quiet: true }));
  }

  function renderJournal(current, dock) {
    const last = current.lastCombat;
    const finalFood = current.war.trainedUnits * 3 + current.war.untrainedUnits;
    dock.innerHTML = `<div class="journal"><section class="journal-summary"><span class="eyebrow">当前备战</span><p>敌军：${current.war.knownEnemyUnits}支军团 + ${current.war.knownBosses}名主将</p><p>我方：${current.party.heroes.length}名英雄 + ${current.war.trainedUnits}支战士 + ${current.war.untrainedUnits}支民兵</p><p>粮食：${current.resources.food} · 全部军队出战需要${finalFood}粮</p><p>今日刷装：${current.economy.dailyGearDrops}/20 · 铁匠铺收入${current.economy.smithGoldPaid}金币</p>${last ? `<p>上一战：${esc(last.title)} · ${last.win ? "胜" : "败"} · 我方${last.alliesAlive}/${last.alliesStarted}</p>` : ""}</section><section class="journal-log">${current.recentSignals.slice(0, 6).map((row) => `<div class="log-row"><b>第${row.day}日</b><span>${esc(row.kind)}</span><p>${esc(row.text)}</p></div>`).join("")}</section></div>`;
  }

  function render() {
    const current = view();
    ensureSelections(current);
    document.querySelector(".game-shell").classList.toggle("combat-mode", mode === "combat");
    renderHeader(current);
    document.querySelector("#map-view").hidden = mode !== "campaign";
    document.querySelector("#combat-view").hidden = mode !== "combat";
    document.querySelector("#grind-view").hidden = mode !== "grind";
    const equipmentDialog = document.querySelector("#equipment-dialog");
    if (mode !== "campaign" && equipmentDialog.open) equipmentDialog.close();
    if (mode !== "campaign" && dockExpanded) setDockExpanded(false);
    document.querySelector(".command-dock").hidden = mode !== "campaign";
    if (mode === "campaign") renderMap(current);
    if (mode === "combat") {
      document.querySelector("#combat-title").textContent = pendingCombat?.title || "战斗";
      document.querySelector("#combat-supply").innerHTML = pendingCombat?.mock ? `<span>演武测试 <b>不改存档</b></span><span>共享战斗 <b>完整运行</b></span>` : pendingCombat ? `<span>粮食消耗 <b>${pendingCombat.foodCommitted || 0}</b></span>${pendingCombat.totalArmy != null ? `<span>军队出战 <b>${pendingCombat.deployedArmy}/${pendingCombat.totalArmy}</b></span>` : ""}` : "";
      document.querySelector("#combat-result").hidden = !pendingCombatResult;
    }
    if (mode === "grind") renderGrindHud();
    renderDock(current);
    if (equipmentDialog.open) renderEquipmentDialog(current);
  }

  function positionPopover() {
    const popover = document.querySelector("#node-popover");
    const viewport = document.querySelector("#map-viewport");
    const location = locations.find((row) => row.id === selectedNodeId);
    if (!mapCamera || !location || popover.hidden) return;
    const screen = mapCamera.worldToScreen({ x: location.x, y: location.y });
    const width = popover.offsetWidth || 342;
    const height = popover.offsetHeight || 320;
    const right = screen.x + width + 38 < viewport.clientWidth;
    const left = right ? screen.x + 32 : screen.x - width - 32;
    popover.style.left = `${Math.max(14, Math.min(viewport.clientWidth - width - 14, left))}px`;
    popover.style.top = `${Math.max(14, Math.min(viewport.clientHeight - height - 14, screen.y - Math.min(95, height * .3)))}px`;
  }

  function renderCamera() {
    if (!mapCamera) return;
    const snapshot = mapCamera.snapshot();
    document.querySelector("#map-world").style.transform = `translate(${snapshot.viewportWidth / 2}px, ${snapshot.viewportHeight / 2}px) scale(${snapshot.zoom}) translate(${-snapshot.x}px, ${-snapshot.y}px)`;
    positionPopover();
  }

  function setupCamera() {
    const viewport = document.querySelector("#map-viewport");
    if (!window.AgentAutomataCamera2D?.createCamera2D || !viewport) return;
    mapCamera = window.AgentAutomataCamera2D.createCamera2D({ viewportWidth: viewport.clientWidth, viewportHeight: viewport.clientHeight, x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2, zoom: .7, minZoom: .26, maxZoom: 1.35, worldBounds: { minX: -MAP_PAN_MARGIN_X, minY: -MAP_PAN_MARGIN_Y, maxX: MAP_WIDTH + MAP_PAN_MARGIN_X, maxY: MAP_HEIGHT + MAP_PAN_MARGIN_Y } });
    const fit = () => { mapCamera.fitBounds({ minX: 0, minY: 0, maxX: MAP_WIDTH, maxY: MAP_HEIGHT }, { padding: 28, minZoom: .26, maxZoom: .92 }); renderCamera(); };
    fit();
    if (!mapInputBound) {
      mapInputBound = true;
      viewport.addEventListener("pointerdown", (event) => { if (event.target.closest(".map-node,.node-popover,.war-board,[data-equipment-target],.map-camera-controls")) return; event.preventDefault(); mapDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; viewport.setPointerCapture(event.pointerId); viewport.classList.add("dragging"); });
      viewport.addEventListener("pointermove", (event) => { if (!mapDrag || mapDrag.id !== event.pointerId) return; const dx = event.clientX - mapDrag.x, dy = event.clientY - mapDrag.y; if (Math.abs(dx) + Math.abs(dy) > 4) mapDrag.moved = true; mapCamera.panByScreen(dx, dy); mapDrag.x = event.clientX; mapDrag.y = event.clientY; renderCamera(); });
      const endDrag = (event) => { if (!mapDrag || mapDrag.id !== event.pointerId) return; const close = !mapDrag.moved; mapDrag = null; viewport.classList.remove("dragging"); if (close) { selectedNodeId = null; renderMap(view()); } };
      viewport.addEventListener("pointerup", endDrag); viewport.addEventListener("pointercancel", endDrag);
      viewport.addEventListener("wheel", (event) => { if (event.target.closest(".node-popover,.war-board")) return; event.preventDefault(); const rect = viewport.getBoundingClientRect(); mapCamera.setZoom(mapCamera.snapshot().zoom * (event.deltaY < 0 ? 1.12 : .88), { x: event.clientX - rect.left, y: event.clientY - rect.top }); renderCamera(); }, { passive: false });
      document.querySelector("#map-zoom-in").addEventListener("click", () => { mapCamera.setZoom(mapCamera.snapshot().zoom * 1.16); renderCamera(); });
      document.querySelector("#map-zoom-out").addEventListener("click", () => { mapCamera.setZoom(mapCamera.snapshot().zoom * .86); renderCamera(); });
      document.querySelector("#map-reset-camera").addEventListener("click", fit);
      document.querySelector("#node-popover-close").addEventListener("click", () => { selectedNodeId = null; renderMap(view()); });
      if (window.ResizeObserver) { resizeObserver = new ResizeObserver(() => { mapCamera.setViewport(viewport.clientWidth, viewport.clientHeight); renderCamera(); }); resizeObserver.observe(viewport); }
    }
  }

  function bindStaticControls() {
    document.querySelector("#end-day-button").addEventListener("click", () => { const id = document.querySelector("#end-day-button").dataset.actionId; runAction(view().actions.find((action) => action.id === id)); });
    document.querySelector("#town-status-open").addEventListener("click", openProsperityDialog);
    const prosperityDialog = document.querySelector("#prosperity-dialog");
    prosperityDialog.addEventListener("cancel", (event) => {
      if (prosperityDialog.classList.contains("growth-mode") && document.querySelector("#prosperity-growth-return").hidden) event.preventDefault();
    });
    prosperityDialog.addEventListener("close", () => {
      clearProsperityGrowthAnimation();
      prosperityDialog.classList.remove("growth-mode");
      document.querySelector("#prosperity-level-burst").hidden = true;
    });
    const prosperityViewport = document.querySelector("#prosperity-viewport");
    prosperityViewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      prosperityDrag = { id: event.pointerId, x: event.clientX, scrollLeft: prosperityViewport.scrollLeft };
      prosperityViewport.setPointerCapture(event.pointerId);
      prosperityViewport.classList.add("dragging");
    });
    prosperityViewport.addEventListener("pointermove", (event) => {
      if (!prosperityDrag || prosperityDrag.id !== event.pointerId) return;
      prosperityViewport.scrollLeft = prosperityDrag.scrollLeft - (event.clientX - prosperityDrag.x);
    });
    const endProsperityDrag = (event) => {
      if (!prosperityDrag || prosperityDrag.id !== event.pointerId) return;
      prosperityDrag = null;
      prosperityViewport.classList.remove("dragging");
    };
    prosperityViewport.addEventListener("pointerup", endProsperityDrag);
    prosperityViewport.addEventListener("pointercancel", endProsperityDrag);
    prosperityViewport.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      prosperityViewport.scrollLeft += event.deltaY;
    }, { passive: false });
    prosperityViewport.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      prosperityViewport.scrollBy({ left: event.key === "ArrowLeft" ? -180 : 180, behavior: "smooth" });
    });
    document.querySelector("#dock-toggle").addEventListener("click", () => openEquipmentDialog());
    document.querySelectorAll("[data-equipment-mode]").forEach((tab) => tab.addEventListener("click", () => { equipmentMode = tab.dataset.equipmentMode; if (equipmentMode !== "formation") { formationPositioning = false; selectedFormationPositionMemberId = null; } renderEquipmentDialog(view()); }));
    document.querySelectorAll(".dock-tab").forEach((tab) => tab.addEventListener("click", () => { activeTab = tab.dataset.tab; renderDock(view()); }));
    document.querySelector("#preview-to-supply").addEventListener("click", openCombatSupplyStage);
    document.querySelector("#preview-back").addEventListener("click", () => {
      if (!pendingPreview) return;
      stopSupplyHold();
      pendingPreview.stage = "formation";
      document.querySelector("#preview-slide-track").classList.remove("supplying");
    });
    document.querySelector("#preview-supply-reset").addEventListener("click", () => { if (!pendingPreview) return; pendingPreview.foodSupplied = 0; renderCombatSupplyStage(); });
    const supplyPot = document.querySelector("#preview-supply-pot");
    supplyPot.addEventListener("pointerdown", (event) => {
      if (supplyPot.disabled) return;
      event.preventDefault();
      stopSupplyHold();
      addPreviewFood(1);
      supplyHoldDelay = setTimeout(() => {
        supplyHoldInterval = setInterval(() => {
          addPreviewFood(1);
          if (supplyPot.disabled) stopSupplyHold();
        }, 85);
      }, 320);
    });
    supplyPot.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat) { event.preventDefault(); addPreviewFood(1); }
    });
    window.addEventListener("pointerup", stopSupplyHold);
    window.addEventListener("pointercancel", stopSupplyHold);
    window.addEventListener("blur", stopSupplyHold);
    document.querySelector("#combat-preview-dialog").addEventListener("close", stopSupplyHold);
    document.querySelector("#preview-confirm").addEventListener("click", (event) => {
      if (!pendingPreview?.plan) { event.preventDefault(); return; }
      stopSupplyHold();
      const current = pendingPreview;
      pendingPreview = null;
      current.launchKind === "grind" ? startGrind(current.plan) : startCombat(current.plan);
    });
    document.querySelector("#stop-grind").addEventListener("click", stopGrind);
    document.querySelector("#recruit-confirm").addEventListener("click", () => { document.querySelector("#recruit-overlay").hidden = true; });
    document.querySelector("#restart-open").addEventListener("click", () => document.querySelector("#restart-dialog").showModal());
    document.querySelector("#restart-confirm").addEventListener("click", () => { const seed = document.querySelector("#restart-seed").value.trim() || "browser-border-village"; battleView?.destroy?.(); battleView = null; clearTimeout(grindSession?.timer); grindSession = null; pendingCombat = null; pendingCombatResult = null; delete mockResults.baseline; delete mockResults.set; document.querySelector("#equipment-dialog")?.close(); mode = "campaign"; state = GAME.createInitialState(seed); formationState = defaultFormationState(); equipmentMode = "character"; formationCityFilter = false; formationPositioning = false; selectedFormationPositionMemberId = null; selectedNodeId = "command"; selectedHeroId = "player"; selectedItemId = null; partyScrollLeft = 0; partyRosterScrollTop = 0; partyDetailScrollTop = 0; equipmentBackpackScrollTop = 0; newlyUnlocked.clear(); saveState(); saveFormationState(); render(); });
    window.addEventListener("keydown", (event) => { if (event.key !== "Escape" || mode !== "campaign") return; if (dockExpanded) { setDockExpanded(false); return; } if (selectedNodeId) { selectedNodeId = null; renderMap(view()); } });
  }

  if (!GAME) throw new Error("边陲村程序核心没有加载");
  bindStaticControls();
  setupCamera();
  render();
})();
