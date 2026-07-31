(function () {
  "use strict";

  const GAME = window.BORDER_VILLAGE_WAR;
  const SAVE_KEY = "infinite_loot_border_village_war_v2";
  const MAP_WIDTH = 1400;
  const MAP_HEIGHT = 860;
  const MAP_PAN_MARGIN_X = 520;
  const MAP_PAN_MARGIN_Y = 340;
  const INVENTORY_PAGE_SIZE = 24;
  const RARITY_ORDER = { "神话": 5, "传说": 4, "史诗": 3, "稀有": 2, "普通": 1 };
  const SLOT_ICONS = { "武器": "⚔", "头盔": "⌃", "胸甲": "⬡", "护手": "✦", "腿甲": "▥", "靴子": "⌄", "戒指": "○", "护符": "◇" };
  const RESOURCE_LABELS = { gold: "金币", food: "粮食", iron: "铁料", steel: "精钢", population: "实际人口", populationCap: "人口上限" };
  const STAT_LABELS = { physicalPower: "物理威力", magicPower: "魔法威力", maxHp: "生命", armor: "护甲" };
  const PLOT_POSITIONS = [[420, 510], [270, 645], [585, 680], [820, 650], [1015, 610], [1105, 445]];
  const RAID_POSITIONS = [[245, 240], [620, 125], [1050, 225]];
  const BUILDING_SIGILS = { house: "舍", farm: "田", conscription: "征", smithy: "锻", market: "市" };

  let state = loadState();
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
  let battleView = null;
  let grindSession = null;
  let toastTimer = null;
  let mapCamera = null;
  let mapDrag = null;
  let resizeObserver = null;
  let mapInputBound = false;
  let locations = [];
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

  function view() { return GAME.getPlayerObservation(state); }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch])); }

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
    if (action.foodCost) costs.push(`粮食-${action.foodCost}`);
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
      for (const raid of unlocked) newlyUnlocked.add(`raid:${raid.title}`);
      if (action.kind === "selection") selectedHeroId = action.targetHeroId;
      if (action.kind === "equipment") selectedItemId = action.targetItemId;
      if (action.kind === "time") selectedNodeId = null;
      ensureSelections(after);
      render();
      const resultLines = signals.slice(0, 5).map((row) => row.text);
      if (unlocked.length) resultLines.push(`新情报：${unlocked.map((raid) => raid.title).join("、")}已经标在地图上。`);
      if (recruited) showRecruit(recruited, resultLines.join(" "));
      else if ((["build", "upgrade", "recruit", "smith", "event", "time"].includes(action.kind) || action.operation === "auto_equip") && !options.quiet) showResult(action.label, resultLines);
      else showToast(resultLines[0] || `${action.label}完成`);
    } catch (error) {
      showToast(error.message || String(error));
    }
  }

  function runAction(action) {
    if (!action) return;
    if (action.available === false) return showToast(action.disabledReason || "当前无法执行这个行动。");
    if (["combat", "grind"].includes(action.kind)) {
      const plan = GAME.preparePlayerCombat(state, action.id);
      if (!plan) return showToast("这个战斗入口已经失效。");
      return openCombatPreview(plan, action.kind === "grind" ? "grind" : "combat");
    }
    applyVisibleAction(action);
  }

  function openCombatPreview(plan, launchKind) {
    pendingPreview = { plan, launchKind };
    document.querySelector("#preview-title").textContent = plan.title;
    document.querySelector("#preview-supply").innerHTML = plan.kind === "hunt"
      ? `<span>行动 <b>0</b></span><span>粮食 <b>0</b></span><span>当前队伍 <b>${plan.leftTeam.length}人</b></span>`
      : `<span>投入粮食 <b>${plan.foodCommitted}/${plan.fullFood}</b></span><span>预计发挥 <b>${Math.round(plan.supplyEffectiveness * 100)}%</b></span><span>规模 <b>${plan.leftTeam.length} 对 ${plan.rightTeam.length}</b></span>`;
    const team = (rows) => rows.map((unit) => `<li><span>${esc(unit.name)}</span><small>${esc(unit.roleName || unit.role || unit.unitKind || "战斗成员")}</small></li>`).join("");
    document.querySelector("#preview-teams").innerHTML = `<section><h3>我方 · ${plan.leftTeam.length}</h3><ul>${team(plan.leftTeam)}</ul></section><section><h3>敌方 · ${plan.rightTeam.length}</h3><ul>${team(plan.rightTeam)}</ul></section>`;
    const dialog = document.querySelector("#combat-preview-dialog");
    if (dialog.open) dialog.close();
    dialog.showModal();
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
        battleView = window.GAME_BATTLE_VIEW.mount({ container: mount, maxTime: plan.maxTime || 150, speed: 2.5, camera: false, gameTime: false, postProcessing: false, onFinish: finishCombat });
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
    box.classList.toggle("loss", !win);
    box.innerHTML = `<h3>${win ? "我方获胜" : "我方失利"}</h3><div class="combat-result-metrics"><span>我方存活<b>${result.metrics.leftAlive}/${pendingCombat.leftTeam.length}</b></span><span>敌方存活<b>${result.metrics.rightAlive}/${pendingCombat.rightTeam.length}</b></span><span>伤害<b>${Math.round(result.metrics.leftDamage || 0)}</b></span><span>用时<b>${Number(result.duration || 0).toFixed(1)}s</b></span></div><p>${fallen.length ? `倒下：${esc(fallen.join("、"))}<br>` : ""}主要输出：${top.map((unit) => `${esc(unit.name)} ${Math.round(unit.damageDone || 0)}`).join(" · ") || "暂无"}</p><button id="commit-combat" class="button ${win ? "primary" : "danger"}">查看战后变化</button>`;
    document.querySelector("#commit-combat").addEventListener("click", commitCombat);
  }

  function commitCombat() {
    if (!pendingCombat || !pendingCombatResult) return;
    try {
      const before = view();
      const beforeRaids = new Set(before.raids.map((raid) => raid.title));
      const plan = pendingCombat;
      state = GAME.applyPlayerCombatResult(state, plan.publicActionId, pendingCombatResult);
      saveState();
      battleView?.destroy?.(); battleView = null; pendingCombat = null; pendingCombatResult = null; mode = "campaign";
      const after = view();
      const unlocked = after.raids.filter((raid) => !beforeRaids.has(raid.title));
      for (const raid of unlocked) newlyUnlocked.add(`raid:${raid.title}`);
      const lines = recentAdded(before, after).slice(0, 5).map((row) => row.text);
      if (unlocked.length) lines.push(`新情报：${unlocked.map((raid) => raid.title).join("、")}已经标在地图上。`);
      ensureSelections(after);
      render();
      showResult(plan.title, lines);
    } catch (error) {
      showToast(error.message || String(error));
    }
  }

  function startGrind(plan) {
    grindSession = { rounds: 0, wins: 0, loot: [], auto: true, fighting: false, timer: null, plan: null, lastWin: null };
    mode = "grind";
    render();
    requestAnimationFrame(() => startGrindRound(plan));
  }

  function currentGrindPlan() {
    const action = view().actions.find((row) => row.kind === "grind");
    return action ? GAME.preparePlayerCombat(state, action.id) : null;
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
      state = GAME.applyPlayerCombatResult(state, grindSession.plan.publicActionId, result);
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
      if (grindSession.auto && grindSession.lastWin) grindSession.timer = setTimeout(() => startGrindRound(), 800);
      else grindSession.auto = false;
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
    document.querySelector("#grind-title").textContent = grindSession.plan?.title || "边林讨伐";
    document.querySelector("#grind-stats").innerHTML = `<span>轮次 <b>${grindSession.rounds + (grindSession.fighting ? 1 : 0)}</b></span><span>胜利 <b>${grindSession.wins}</b></span><span>掉落 <b>${grindSession.loot.length}</b></span>`;
    document.querySelector("#grind-status").textContent = grindSession.fighting ? "当前轮战斗中" : grindSession.lastWin === false ? "本轮战败，没有掉落" : grindSession.auto ? "下一批敌人正在接近" : "连续讨伐已经停止";
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

    for (const building of current.buildings) {
      const local = current.actions.filter((action) => action.targetSlot === building.slot);
      if (building.type === "conscription") local.push(...current.actions.filter((action) => action.kind === "recruit"));
      if (building.type === "smithy") local.push(...current.actions.filter((action) => action.kind === "smith"));
      if (building.type === "market") local.push(...current.actions.filter((action) => action.kind === "market" && action.targetStockId));
      const forecast = current.productionForecasts.find((row) => row.slot === building.slot);
      const extra = forecast ? `明晨预计收获 ${forecast.nextYieldRange[0]}—${forecast.nextYieldRange[1]} 粮食。` : building.type === "market" ? `今日购买力 ${current.market.liquidity}。` : building.type === "house" ? `当前实际人口 ${current.resources.population}/${current.resources.populationCap}。` : building.type === "conscription" ? "可用行动接纳流民，投入金币会提高效率。" : "";
      rows.push({ id: `plot:${building.slot}`, title: building.name, kicker: building.type ? `${building.level || 0}级建筑` : `${building.slot + 1}号建设用地`, description: building.description, status: building.complete ? extra : building.readyDay ? `正在修建，第${building.readyDay}日清晨完工。` : "选择一种建筑；修建后次日清晨完工。", actions: [...new Map(local.map((action) => [action.id, action])).values()], x: PLOT_POSITIONS[building.slot][0], y: PLOT_POSITIONS[building.slot][1], sigil: building.type ? BUILDING_SIGILS[building.type] || "筑" : "+", type: building.type ? "building" : "empty" });
    }

    const grind = current.actions.filter((action) => action.kind === "grind");
    if (grind.length) rows.push({ id: "grind", title: "边林讨伐", kicker: "无限刷装", description: "魔物会不断从边林深处涌出。每一轮都运行完整战斗；获胜后掉落一件装备。", status: `不消耗行动力与粮食 · 当前第${current.time.day >= 6 ? 3 : current.time.day >= 5 ? 2 : 1}层`, actions: grind, x: 1190, y: 275, sigil: "猎", type: "grind" });

    current.raids.forEach((raid, index) => {
      const raidActions = current.actions.filter((action) => action.kind === "combat" && action.label.includes(raid.title));
      rows.push({ id: `raid:${raid.title}`, title: raid.title, kicker: "已侦察敌方据点", description: raid.description, status: raid.visibleEffectOnVictory, actions: raidActions, x: RAID_POSITIONS[index % RAID_POSITIONS.length][0], y: RAID_POSITIONS[index % RAID_POSITIONS.length][1], sigil: "敌", type: "raid" });
    });

    if (current.time.phase === "final") rows.push({ id: "final", title: "灰谷村北门", kicker: "最终决战", description: `${current.war.knownEnemyUnits}支兽人军团与${current.war.knownBosses}名主将已经抵达。`, status: `${current.party.heroes.length}名英雄与${current.war.militiaUnits}支民兵已自动集结。`, actions: current.actions.filter((action) => action.kind === "combat"), x: 700, y: 115, sigil: "战", type: "final" });
    return rows;
  }

  function renderHeader(current) {
    document.querySelector("#day-rail").innerHTML = Array.from({ length: 7 }, (_, index) => { const day = index + 1; const cls = day < current.time.day || current.result ? "past" : day === current.time.day ? "current" : ""; return `<span class="day-tick ${cls} ${day === 7 ? "final" : ""}"><b>${day}</b>${day === 7 ? "总攻" : "日"}</span>`; }).join("");
    document.querySelector("#gold-value").textContent = current.resources.gold;
    document.querySelector("#food-value").textContent = current.resources.food;
    document.querySelector("#iron-value").textContent = current.resources.iron;
    document.querySelector("#steel-value").textContent = current.resources.steel;
    document.querySelector("#population-value").textContent = `${current.resources.population}/${current.resources.populationCap}`;
    document.querySelector("#ap-value").textContent = current.time.actionsRemaining;
    document.querySelector("#ap-capacity").textContent = current.time.actionCapacity;
    document.querySelector("#enemy-units").textContent = current.war.knownEnemyUnits;
    document.querySelector("#enemy-bosses").textContent = current.war.knownBosses;
    document.querySelector("#militia-units").textContent = current.war.militiaUnits;
    document.querySelector("#war-rule").textContent = current.war.publicRule;
    document.querySelector("#final-rules").textContent = `${current.war.finalMorningRule} ${current.party.finalBattleRule}`;
    const end = current.actions.find((action) => action.kind === "time");
    const button = document.querySelector("#end-day-button");
    button.disabled = !end || mode !== "campaign";
    button.dataset.actionId = end?.id || "";
    button.textContent = current.time.phase === "final" ? "决战已经开始" : end ? "结束本日" : "先处理当前剧情";
    document.querySelector("#inventory-count").textContent = current.inventory.length;
  }

  function renderMap(current) {
    locations = buildLocations(current);
    const layer = document.querySelector("#map-node-layer");
    layer.innerHTML = locations.map((location) => `<button class="map-node ${esc(location.type)} ${selectedNodeId === location.id ? "selected" : ""} ${newlyUnlocked.has(location.id) ? "newly-unlocked" : ""}" data-node-id="${esc(location.id)}" style="left:${location.x}px;top:${location.y}px"><span class="sigil">${esc(location.sigil)}</span><strong>${esc(location.title)}</strong><small>${esc(location.kicker)}</small>${location.actions.length ? `<b class="count">${location.actions.length}</b>` : ""}</button>`).join("");
    layer.querySelectorAll("[data-node-id]").forEach((node) => node.addEventListener("click", (event) => { event.stopPropagation(); selectedNodeId = node.dataset.nodeId; newlyUnlocked.delete(selectedNodeId); renderMap(view()); }));
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
    document.querySelector("#node-action-count").textContent = `${location.actions.filter((action) => action.available !== false).length}/${location.actions.length}`;
    const forge = location.actions.filter((action) => action.kind === "smith" && action.label.startsWith("打造"));
    const regular = location.actions.filter((action) => !forge.includes(action));
    const actionHtml = regular.map((action) => `<button class="action-card ${action.available === false ? "unavailable" : ""}" data-action-id="${esc(action.id)}" ${action.available === false ? "disabled" : ""}><strong>${esc(action.label)}</strong><em>${esc(costText(action))}</em>${action.description ? `<small>${esc(action.description)}</small>` : ""}${action.disabledReason ? `<small class="disabled-reason">${esc(action.disabledReason)}</small>` : ""}</button>`).join("");
    const forgeHtml = forge.length ? `<div class="forge-control"><label>定向打造史诗装备</label><select id="forge-select">${forge.map((action) => `<option value="${esc(action.id)}">${esc(action.label)}${action.available === false ? "（不可用）" : ""}</option>`).join("")}</select><button id="forge-confirm" class="mini-button">打造</button><small id="forge-disabled-reason" class="disabled-reason"></small></div>` : "";
    document.querySelector("#node-actions").innerHTML = actionHtml + forgeHtml || `<div class="empty-actions">这里暂时没有可执行行动。</div>`;
    document.querySelectorAll("#node-actions [data-action-id]").forEach((button) => button.addEventListener("click", () => runAction(view().actions.find((action) => action.id === button.dataset.actionId))));
    const syncForge = () => {
      const id = document.querySelector("#forge-select")?.value;
      const action = view().actions.find((row) => row.id === id);
      const confirm = document.querySelector("#forge-confirm");
      const reason = document.querySelector("#forge-disabled-reason");
      if (confirm) { confirm.disabled = !action || action.available === false; confirm.classList.toggle("unavailable", action?.available === false); }
      if (reason) reason.textContent = action?.disabledReason || "";
    };
    document.querySelector("#forge-select")?.addEventListener("change", syncForge);
    document.querySelector("#forge-confirm")?.addEventListener("click", () => { const id = document.querySelector("#forge-select").value; runAction(view().actions.find((action) => action.id === id)); });
    syncForge();
    requestAnimationFrame(positionPopover);
  }

  function ensureSelections(current) {
    if (!current.party.heroes.some((hero) => hero.id === selectedHeroId)) selectedHeroId = current.party.selectedHeroId || current.party.heroes[0]?.id || null;
    if (!current.inventory.some((item) => item.id === selectedItemId)) {
      selectedItemId = sortItems(current.inventory)[0]?.id || null;
      inventoryPage = 0;
    }
    if (current.time.phase === "prologue") selectedNodeId = "command";
    if (current.time.phase === "final") selectedNodeId = "final";
  }

  function selectHero(heroId) {
    const current = view();
    if (current.party.selectedHeroId !== heroId) {
      const action = current.actions.find((row) => row.kind === "selection" && row.targetHeroId === heroId);
      if (action) { state = GAME.applyPlayerAction(state, action.id); saveState(); }
    }
    selectedHeroId = heroId;
    renderDock(view());
  }

  function sortItems(items) { return items.slice().sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0) || b.power - a.power || String(a.id).localeCompare(String(b.id))); }

  function renderDock(current) {
    document.querySelectorAll(".dock-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === activeTab));
    const dock = document.querySelector("#dock-content");
    if (activeTab === "inventory") return renderInventory(current, dock);
    if (activeTab === "journal") return renderJournal(current, dock);
    const hero = current.party.heroes.find((row) => row.id === selectedHeroId) || current.party.heroes[0];
    if (!hero) { dock.innerHTML = `<div class="empty-actions">还没有可查看的角色。</div>`; return; }
    const equipmentPower = hero.equipment.reduce((sum, slot) => sum + Number(slot.item?.power || 0), 0);
    dock.innerHTML = `<div class="party-layout"><div class="hero-roster">${current.party.heroes.map((row) => `<button class="hero-card ${row.id === hero.id ? "selected" : ""} ${row.active ? "" : "inactive"}" data-hero-id="${esc(row.id)}"><strong>${esc(row.name)}</strong><small>${esc(row.role)}</small>${row.active ? "<em>出战</em>" : ""}</button>`).join("")}</div><div class="hero-detail"><section class="hero-summary"><span class="eyebrow">当前角色</span><h3>${esc(hero.name)}</h3><p>${esc(hero.role)} · 装备战力${equipmentPower}</p><p>擅长词条</p><div class="affix-tags">${hero.preferredAffixes.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div><p>${esc(current.party.finalBattleRule)}</p><div class="hero-quick-actions"><button id="auto-equip" class="button primary">一键最高战力</button><div id="party-toggle"></div></div></section><section class="equipment-slots">${hero.equipment.map((slot) => `<div class="equipment-slot"><span>${SLOT_ICONS[slot.slotLabel] || "◆"} ${esc(slot.slotLabel)}</span><strong class="${slot.item ? `rarity-${esc(slot.item.rarity)}` : ""}">${slot.item ? esc(slot.item.name) : "空"}</strong><small>${slot.item ? `${esc(slot.item.rarity)} · +${slot.item.power}` : "从背包手动装备"}</small></div>`).join("")}</section></div></div>`;
    dock.querySelectorAll("[data-hero-id]").forEach((button) => button.addEventListener("click", () => selectHero(button.dataset.heroId)));
    const partyAction = current.actions.find((action) => action.kind === "party" && action.targetHeroId === hero.id);
    const autoEquipAction = current.actions.find((action) => action.operation === "auto_equip" && action.targetHeroId === hero.id);
    const autoEquipButton = document.querySelector("#auto-equip");
    autoEquipButton.disabled = !autoEquipAction || autoEquipAction.available === false;
    autoEquipButton.title = autoEquipAction?.disabledReason || autoEquipAction?.description || "当前阶段不能整理装备";
    autoEquipButton.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === autoEquipAction?.id)));
    document.querySelector("#party-toggle").innerHTML = partyAction ? `<button class="mini-button ${partyAction.available === false ? "unavailable" : ""}" data-party-action="${esc(partyAction.id)}" ${partyAction.available === false ? "disabled" : ""}>${esc(partyAction.label)}</button>${partyAction.disabledReason ? `<small class="disabled-reason">${esc(partyAction.disabledReason)}</small>` : ""}` : `<small>${hero.active ? "当前在经营期出战队伍中" : "当前为候补；第7日仍会自动集结"}</small>`;
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
    const selectedHero = current.party.heroes.find((hero) => hero.id === selectedHeroId) || current.party.heroes[0];
    const pageCount = Math.max(1, Math.ceil(items.length / INVENTORY_PAGE_SIZE));
    inventoryPage = Math.min(Math.max(0, inventoryPage), pageCount - 1);
    const pageItems = items.slice(inventoryPage * INVENTORY_PAGE_SIZE, (inventoryPage + 1) * INVENTORY_PAGE_SIZE);
    dock.innerHTML = `<div class="inventory-layout"><section class="inventory-browser"><div class="inventory-toolbar"><span>背包 ${items.length}/200 · 按稀有度与战力排序</span><div class="inventory-pager"><button class="mini-button" id="inventory-prev" ${inventoryPage === 0 ? "disabled" : ""}>上一页</button><span>${inventoryPage + 1}/${pageCount}</span><button class="mini-button" id="inventory-next" ${inventoryPage >= pageCount - 1 ? "disabled" : ""}>下一页</button></div></div><div class="inventory-grid">${pageItems.map((row) => `<button class="item-cell ${row.id === item?.id ? "selected" : ""} rarity-${esc(row.rarity)}" data-item-id="${esc(row.id)}"><i>${SLOT_ICONS[row.slotLabel] || "◆"}</i><strong>${esc(row.name)}</strong><small>${esc(row.rarity)} · +${row.power}</small></button>`).join("") || `<div class="empty-actions">背包是空的。</div>`}</div></section><aside id="item-detail" class="item-detail"></aside></div>`;
    document.querySelector("#inventory-prev")?.addEventListener("click", () => { inventoryPage -= 1; selectedItemId = items[inventoryPage * INVENTORY_PAGE_SIZE]?.id || selectedItemId; renderDock(view()); });
    document.querySelector("#inventory-next")?.addEventListener("click", () => { inventoryPage += 1; selectedItemId = items[inventoryPage * INVENTORY_PAGE_SIZE]?.id || selectedItemId; renderDock(view()); });
    dock.querySelectorAll("[data-item-id]").forEach((button) => button.addEventListener("click", () => { selectedItemId = button.dataset.itemId; renderDock(view()); }));
    if (!item) return;
    const equippedBy = current.party.heroes.find((hero) => hero.equipment.some((slot) => slot.item?.id === item.id));
    const equipAction = current.actions.find((action) => action.kind === "equipment" && action.targetItemId === item.id && action.targetHeroId === selectedHero?.id && action.operation !== "unequip");
    const unequipAction = current.actions.find((action) => action.kind === "equipment" && action.targetItemId === item.id && action.targetHeroId === selectedHero?.id && action.operation === "unequip");
    const sellAction = current.actions.find((action) => action.kind === "market" && action.targetItemId === item.id);
    const stats = Object.entries(item.baseStats || {}).map(([key, value]) => `<div class="stat-row"><span>${esc(STAT_LABELS[key] || key)}</span><b>+${value}</b></div>`).join("");
    const affixes = item.affixes.map((affix) => `<div class="stat-row"><span>${esc(affix.label)}</span><b>+${affix.value}${affix.percent ? "%" : ""}</b></div>`).join("");
    const marketReason = equippedBy ? "已装备物品不能直接出售；先由使用者卸下。" : sellAction?.disabledReason || (!sellAction && current.market.liquidity <= 0 ? "集市今日已经没有购买力。" : !sellAction ? "集市剩余购买力不足以买下这件装备。" : "");
    const transferReason = equippedBy && equippedBy.id !== selectedHero?.id ? `要转交装备，请先选择${equippedBy.name}并卸下。` : "";
    document.querySelector("#item-detail").innerHTML = `<span class="eyebrow">${esc(item.slotLabel)} · 装备等级${item.equipmentLevel}</span><h3 class="rarity-${esc(item.rarity)}">${esc(item.name)}</h3><p>${esc(item.rarity)} · 显示战力 +${item.power}</p><div class="base-stats">${stats || `<div class="stat-row"><span>无基础属性</span></div>`}</div><div class="affixes">${affixes}</div><p>${equippedBy ? `当前由${esc(equippedBy.name)}使用` : `未装备 · 当前配装角色：${esc(selectedHero?.name || "无")}`}</p>${transferReason ? `<p>${esc(transferReason)}</p>` : ""}${marketReason ? `<p class="disabled-reason">${esc(marketReason)}</p>` : ""}<div class="item-actions">${equipAction ? `<button class="button primary" data-equip-action="${esc(equipAction.id)}">装备给${esc(selectedHero.name)}</button>` : ""}${unequipAction ? `<button class="button quiet" data-unequip-action="${esc(unequipAction.id)}">从${esc(selectedHero.name)}身上卸下</button>` : ""}${sellAction ? `<button class="button quiet ${sellAction.available === false ? "unavailable" : ""}" data-sell-action="${esc(sellAction.id)}" ${sellAction.available === false ? "disabled" : ""}>${esc(sellAction.label)}</button>` : ""}</div>`;
    document.querySelector("[data-equip-action]")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === document.querySelector("[data-equip-action]").dataset.equipAction), { quiet: true }));
    document.querySelector("[data-unequip-action]")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === document.querySelector("[data-unequip-action]").dataset.unequipAction), { quiet: true }));
    document.querySelector("[data-sell-action]")?.addEventListener("click", () => applyVisibleAction(view().actions.find((action) => action.id === document.querySelector("[data-sell-action]").dataset.sellAction), { quiet: true }));
  }

  function renderJournal(current, dock) {
    const last = current.lastCombat;
    dock.innerHTML = `<div class="journal"><section class="journal-summary"><span class="eyebrow">当前备战</span><p>敌军：${current.war.knownEnemyUnits}支军团 + ${current.war.knownBosses}名主将</p><p>我方：${current.party.heroes.length}名英雄 + ${current.war.militiaUnits}支民兵</p><p>粮食：${current.resources.food} · 决战全员约需${Math.max(12, (current.party.heroes.length + current.war.militiaUnits) * 3)}粮</p>${last ? `<p>上一战：${esc(last.title)} · ${last.win ? "胜" : "败"} · 我方${last.alliesAlive}/${last.alliesStarted}</p>` : ""}</section><section class="journal-log">${current.recentSignals.slice(0, 6).map((row) => `<div class="log-row"><b>第${row.day}日</b><span>${esc(row.kind)}</span><p>${esc(row.text)}</p></div>`).join("")}</section></div>`;
  }

  function render() {
    const current = view();
    ensureSelections(current);
    document.querySelector(".game-shell").classList.toggle("combat-mode", mode === "combat");
    renderHeader(current);
    document.querySelector("#map-view").hidden = mode !== "campaign";
    document.querySelector("#combat-view").hidden = mode !== "combat";
    document.querySelector("#grind-view").hidden = mode !== "grind";
    if (mode !== "campaign" && dockExpanded) setDockExpanded(false);
    document.querySelector(".command-dock").hidden = mode !== "campaign";
    if (mode === "campaign") renderMap(current);
    if (mode === "combat") {
      document.querySelector("#combat-title").textContent = pendingCombat?.title || "战斗";
      document.querySelector("#combat-supply").innerHTML = pendingCombat ? `<span>粮食 <b>${pendingCombat.foodCommitted}/${pendingCombat.fullFood}</b></span><span>发挥 <b>${Math.round(pendingCombat.supplyEffectiveness * 100)}%</b></span>` : "";
      document.querySelector("#combat-result").hidden = !pendingCombatResult;
    }
    if (mode === "grind") renderGrindHud();
    renderDock(current);
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
      viewport.addEventListener("pointerdown", (event) => { if (event.target.closest(".map-node,.node-popover,.war-board,.map-camera-controls")) return; event.preventDefault(); mapDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; viewport.setPointerCapture(event.pointerId); viewport.classList.add("dragging"); });
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
    document.querySelector("#dock-toggle").addEventListener("click", () => setDockExpanded(!dockExpanded));
    document.querySelectorAll(".dock-tab").forEach((tab) => tab.addEventListener("click", () => { activeTab = tab.dataset.tab; renderDock(view()); }));
    document.querySelector("#preview-confirm").addEventListener("click", () => { if (!pendingPreview) return; const current = pendingPreview; pendingPreview = null; current.launchKind === "grind" ? startGrind(current.plan) : startCombat(current.plan); });
    document.querySelector("#stop-grind").addEventListener("click", stopGrind);
    document.querySelector("#recruit-confirm").addEventListener("click", () => { document.querySelector("#recruit-overlay").hidden = true; });
    document.querySelector("#restart-open").addEventListener("click", () => document.querySelector("#restart-dialog").showModal());
    document.querySelector("#restart-confirm").addEventListener("click", () => { const seed = document.querySelector("#restart-seed").value.trim() || "browser-border-village"; battleView?.destroy?.(); battleView = null; clearTimeout(grindSession?.timer); grindSession = null; pendingCombat = null; pendingCombatResult = null; mode = "campaign"; state = GAME.createInitialState(seed); selectedNodeId = "command"; selectedHeroId = "player"; selectedItemId = null; newlyUnlocked.clear(); saveState(); render(); });
    window.addEventListener("keydown", (event) => { if (event.key !== "Escape" || mode !== "campaign") return; if (dockExpanded) { setDockExpanded(false); return; } if (selectedNodeId) { selectedNodeId = null; renderMap(view()); } });
  }

  if (!GAME) throw new Error("边陲村程序核心没有加载");
  bindStaticControls();
  setupCamera();
  render();
})();
