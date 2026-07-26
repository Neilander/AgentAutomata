(function () {
  "use strict";

  const GAME = window.FIFTEEN_DAY_DEMO;
  const SAVE_KEY = "infinite_loot_fifteen_day_web_v1";
  const MAP_WIDTH = 1400;
  const MAP_HEIGHT = 860;
  const STATUS_LABEL = { present: "在场", open: "已开放", locked: "锁着", settled: "已处理", gone: "已离开", closed: "已结束" };
  const AREA_POSITIONS = {
    "镇中心": [690, 430], "灰炉遗址": [1170, 300], "河畔营地": [790, 105], "西门商道": [220, 410],
    "旧礼拜堂": [1035, 700], "旧城墙": [405, 710], "北部矿区": [430, 175], "黑石采坑": [170, 235],
    "南部沼泽": [900, 795], "王炉地底": [1240, 505], "煤灰镇": [705, 545], "营地": [565, 605],
  };
  const AREA_SIGILS = {
    "镇中心": "镇", "灰炉遗址": "炉", "河畔营地": "营", "西门商道": "门", "旧礼拜堂": "祷",
    "旧城墙": "墙", "北部矿区": "矿", "黑石采坑": "坑", "南部沼泽": "沼", "王炉地底": "心", "煤灰镇": "战", "营地": "队",
  };
  const PLACE_OFFSETS = [[-110, -72], [110, -72], [-110, 8], [110, 8], [-110, 88], [110, 88], [0, -148], [0, 164]];
  const SLOT_ICONS = { "武器": "⚔", "护甲": "⬡", "饰品": "◇" };
  const RARITY_ORDER = { "永恒": 6, "神话": 5, "传说": 4, "史诗": 3, "稀有": 2, "普通": 1 };

  let state = loadState();
  let selectedPlaceId = null;
  let selectedArea = "灰炉遗址";
  let selectedHeroId = null;
  let selectedGearId = null;
  let activeTab = "party";
  let toastTimer = null;
  let mode = "campaign";
  let pendingCombat = null;
  let pendingCombatResult = null;
  let battleView = null;
  let grindSession = null;
  let mapCamera = null;
  let mapDrag = null;
  let mapFocus = null;
  let mapFrame = 0;
  let mapResizeObserver = null;
  let mapInputBound = false;
  const placePositions = new Map();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.version === GAME.VERSION) return GAME.migrateState ? GAME.migrateState(parsed) : parsed;
    } catch (_) { /* local storage is optional */ }
    return GAME.createInitialState("browser-fifteen-day");
  }

  function saveState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) { /* local storage is optional */ }
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  }

  function currentView() { return GAME.getPlayerObservation(state); }

  function showToast(text) {
    const toast = document.querySelector("#toast");
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    document.querySelector("#toast").classList.remove("show");
  }

  function showActionResult(title, text) {
    hideToast();
    const dialog = document.querySelector("#result-dialog");
    document.querySelector("#result-title").textContent = title || "事情有了结果";
    document.querySelector("#result-body").textContent = text;
    if (dialog.open) dialog.close();
    dialog.showModal();
  }

  function runAction(publicActionId) {
    try {
      const grindCombat = GAME.preparePlayerGrindCombat?.(state, publicActionId);
      if (grindCombat) return startGrindSession(grindCombat);
      const combat = GAME.preparePlayerCombat(state, publicActionId);
      if (combat) return startCombat(combat);
      const before = currentView();
      const chosenAction = before.actions.find((action) => action.id === publicActionId);
      const chosenPlace = before.places.find((place) => place.id === chosenAction?.placeId);
      state = GAME.applyPlayerAction(state, publicActionId);
      saveState();
      const after = currentView();
      const newest = after.recentSignals.find((row) => !before.recentSignals.includes(row));
      if (chosenAction?.kind === "time") selectedPlaceId = null;
      ensureSelection(after);
      render();
      if (newest && ["event", "inspect"].includes(chosenAction?.kind)) showActionResult(chosenPlace?.title || chosenAction.label, newest);
      else showToast(newest || "行动完成");
    } catch (error) {
      showToast(error.message || String(error));
    }
  }

  function startCombat(plan) {
    hideToast();
    pendingCombat = plan;
    pendingCombatResult = null;
    mode = "combat";
    render();
    const mount = document.querySelector("#battle-mount");
    if (mount) mount.innerHTML = `<div class="combat-loading"><span></span><strong>战场展开中</strong></div>`;
    requestAnimationFrame(() => {
      try {
        const battleMount = document.querySelector("#battle-mount");
        if (!battleMount || !window.GAME_BATTLE_VIEW?.mount) throw new Error("正式战斗画面没有加载");
        battleView?.destroy?.();
        battleView = window.GAME_BATTLE_VIEW.mount({
          container: battleMount,
          maxTime: plan.maxTime || 120,
          speed: 3,
          camera: false,
          gameTime: false,
          postProcessing: false,
          onFinish: finishCombatPresentation,
        });
        battleView.start({
          leftTeam: JSON.parse(JSON.stringify(plan.leftTeam)),
          rightTeam: JSON.parse(JSON.stringify(plan.rightTeam)),
          seed: plan.seed,
          title: plan.title,
          randomizeStats: false,
        });
      } catch (error) {
        battleView?.destroy?.();
        battleView = null;
        pendingCombat = null;
        pendingCombatResult = null;
        mode = "campaign";
        render();
        showToast(`战斗场景启动失败：${error.message || String(error)}`);
      }
    });
  }

  function finishCombatPresentation(result) {
    pendingCombatResult = result;
    const win = result?.metrics?.leftAlive > 0 && result?.metrics?.rightAlive === 0;
    const top = result.units.filter((unit) => unit.side === "left").sort((a, b) => Number(b.damageDone || 0) - Number(a.damageDone || 0)).slice(0, 3);
    const box = document.querySelector("#combat-result");
    box.hidden = false;
    box.innerHTML = `<div class="result-head"><span>${win ? "我方获胜" : "我方失利"}</span><strong>${Number(result.duration || 0).toFixed(1)} 秒</strong></div>
      <div class="result-metrics"><span>存活 <b>${result.metrics.leftAlive}/${pendingCombat.leftTeam.length}</b></span><span>伤害 <b>${Math.round(result.metrics.leftDamage || 0)}</b></span><span>治疗 <b>${Math.round(result.metrics.leftHealing || 0)}</b></span><span>护盾 <b>${Math.round(result.metrics.leftShield || 0)}</b></span></div>
      <p>主要输出：${top.map((unit) => `${esc(unit.name)} ${Math.round(unit.damageDone || 0)}`).join(" · ") || "暂无"}</p>
      <button id="leave-combat" class="button ${win ? "primary" : "danger"}">查看战后变化</button>`;
    document.querySelector("#leave-combat").addEventListener("click", commitCombat);
  }

  function commitCombat() {
    if (!pendingCombat || !pendingCombatResult) return;
    try {
      state = GAME.applyPlayerCombatResult(state, pendingCombat.publicActionId, pendingCombatResult);
      saveState();
      battleView?.destroy?.();
      battleView = null;
      pendingCombat = null;
      pendingCombatResult = null;
      mode = "campaign";
      ensureSelection(currentView());
      render();
    } catch (error) {
      showToast(error.message || String(error));
    }
  }

  function ensureSelection(view) {
    if (!view.places.some((place) => place.id === selectedPlaceId)) selectedPlaceId = null;
    const heroes = [...view.party.active, ...view.party.reserve];
    if (!heroes.some((hero) => hero.id === selectedHeroId)) selectedHeroId = view.party.active[0]?.id || heroes[0]?.id || null;
    if (!view.inventory.some((item) => item.id === selectedGearId)) selectedGearId = view.inventory[0]?.id || null;
  }

  function sortLoot(rows) {
    return rows.slice().sort((a, b) => (RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]) || b.power - a.power || String(a.id).localeCompare(String(b.id)));
  }

  function startGrindSession(plan) {
    hideToast();
    clearTimeout(grindSession?.timer);
    grindSession = {
      zoneId: plan.zoneId,
      level: plan.level,
      title: plan.title,
      rounds: 0,
      wins: 0,
      totalLoot: 0,
      loot: [],
      auto: true,
      fighting: false,
      timer: null,
      currentPlan: null,
      lastOutcome: null,
    };
    mode = "grind";
    render();
    requestAnimationFrame(() => startGrindRound(plan));
  }

  function findCurrentGrindPlan() {
    if (!grindSession) return null;
    const action = currentView().actions.find((row) => row.kind === "grind" && row.placeId === `place_zone_${grindSession.zoneId}` && row.grindLevel === grindSession.level);
    return action ? GAME.preparePlayerGrindCombat(state, action.id) : null;
  }

  function startGrindRound(plan = findCurrentGrindPlan()) {
    if (!grindSession || mode !== "grind" || !grindSession.auto) return;
    if (!plan) {
      grindSession.auto = false;
      grindSession.lastOutcome = { win: false, unavailable: true };
      renderGrindHud();
      return;
    }
    grindSession.currentPlan = plan;
    grindSession.fighting = true;
    grindSession.lastOutcome = null;
    renderGrindHud();
    const mount = document.querySelector("#grind-battle-mount");
    if (mount) mount.innerHTML = `<div class="combat-loading"><span></span><strong>第${grindSession.rounds + 1}轮敌群正在靠近</strong></div>`;
    requestAnimationFrame(() => {
      try {
        const battleMount = document.querySelector("#grind-battle-mount");
        if (!battleMount || !window.GAME_BATTLE_VIEW?.mount) throw new Error("正式战斗画面没有加载");
        battleView?.destroy?.();
        battleView = window.GAME_BATTLE_VIEW.mount({
          container: battleMount,
          maxTime: plan.maxTime || 80,
          speed: 2.25,
          camera: false,
          gameTime: false,
          postProcessing: false,
          onFinish: finishGrindRound,
        });
        battleView.start({
          leftTeam: JSON.parse(JSON.stringify(plan.leftTeam)),
          rightTeam: JSON.parse(JSON.stringify(plan.rightTeam)),
          seed: plan.seed,
          title: `${plan.title} · 第${grindSession.rounds + 1}轮`,
          randomizeStats: false,
        });
      } catch (error) {
        battleView?.destroy?.();
        battleView = null;
        grindSession.fighting = false;
        grindSession.auto = false;
        grindSession.lastOutcome = { win: false, error: error.message || String(error) };
        renderGrindHud();
      }
    });
  }

  function finishGrindRound(result) {
    if (!grindSession?.currentPlan || mode !== "grind") return;
    try {
      const resolved = GAME.applyPlayerGrindCombatResult(state, grindSession.currentPlan.publicActionId, result);
      state = resolved.state;
      grindSession.rounds += 1;
      grindSession.fighting = false;
      grindSession.lastOutcome = resolved.outcome;
      if (resolved.outcome.win) grindSession.wins += 1;
      const salvagedIds = new Set((resolved.outcome.salvaged || []).map((item) => item.id));
      grindSession.loot.forEach((item) => { if (salvagedIds.has(item.id)) item.salvaged = true; });
      for (const item of resolved.outcome.loot || []) {
        grindSession.totalLoot += 1;
        grindSession.loot.push({ ...item, salvaged: salvagedIds.has(item.id), newest: true });
      }
      grindSession.loot.forEach((item, index, rows) => { if (index < rows.length - (resolved.outcome.loot || []).length) item.newest = false; });
      grindSession.loot = sortLoot(grindSession.loot).slice(0, 200);
      saveState();
      renderHeader(currentView());
      renderGrindHud();
      if (resolved.outcome.win && grindSession.auto) {
        grindSession.timer = setTimeout(() => startGrindRound(), 850);
      } else {
        grindSession.auto = false;
        renderGrindHud();
      }
    } catch (error) {
      grindSession.fighting = false;
      grindSession.auto = false;
      grindSession.lastOutcome = { win: false, error: error.message || String(error) };
      renderGrindHud();
    }
  }

  function requestStopGrind() {
    if (!grindSession) return;
    grindSession.auto = false;
    clearTimeout(grindSession.timer);
    if (grindSession.fighting) renderGrindHud();
    else leaveGrind();
  }

  function retryGrind() {
    if (!grindSession || grindSession.fighting) return;
    grindSession.auto = true;
    grindSession.lastOutcome = null;
    startGrindRound();
  }

  function leaveGrind() {
    clearTimeout(grindSession?.timer);
    battleView?.destroy?.();
    battleView = null;
    grindSession = null;
    mode = "campaign";
    ensureSelection(currentView());
    render();
  }

  function lootCell(item) {
    const tags = item.identityTags?.length ? ` · ${item.identityTags.join("、")}` : "";
    return `<div class="grind-loot-cell rarity-${esc(item.rarity)} ${item.newest ? "newest" : ""} ${item.salvaged ? "salvaged" : ""}" title="${esc(`${item.rarity} ${item.name} +${item.power}${tags}${item.salvaged ? " · 已自动分解" : ""}`)}"><i>${SLOT_ICONS[item.slotLabel] || "◆"}</i><b>+${item.power}</b><small>${esc(item.rarity)}</small>${item.salvaged ? "<em>分解</em>" : ""}</div>`;
  }

  function renderGrindHud() {
    if (!grindSession || mode !== "grind") return;
    document.querySelector("#grind-title").textContent = grindSession.title;
    document.querySelector("#grind-run-stats").innerHTML = `<span>轮次 <b>${grindSession.rounds + (grindSession.fighting ? 1 : 0)}</b></span><span>胜利 <b>${grindSession.wins}</b></span><span>掉落 <b>${grindSession.totalLoot}</b></span>`;
    const stop = document.querySelector("#stop-grind");
    stop.textContent = grindSession.auto ? "本轮后停止" : grindSession.fighting ? "正在等待本轮结束" : "返回地图";
    stop.disabled = !grindSession.auto && grindSession.fighting;
    const outcome = grindSession.lastOutcome;
    const newest = grindSession.loot.find((item) => item.newest);
    document.querySelector("#grind-status").textContent = grindSession.fighting ? `第${grindSession.rounds + 1}轮交战中` : outcome?.error ? `战斗没有启动：${outcome.error}` : outcome?.unavailable ? "这个入口现在无法继续" : outcome?.win ? (grindSession.auto ? "胜利，下一批敌人正在接近" : "胜利，连续刷装已停止") : outcome ? "战败，本轮没有掉落" : "准备进入战斗";
    document.querySelector("#grind-latest-loot").innerHTML = newest ? `<span>本轮掉落</span><i class="rarity-${esc(newest.rarity)}">${SLOT_ICONS[newest.slotLabel] || "◆"}</i><strong>${esc(newest.name)}</strong><b class="rarity-${esc(newest.rarity)}">${esc(newest.rarity)} +${newest.power}</b>` : `<span>本轮掉落</span><strong>${outcome && !outcome.win ? "无" : "等待结算"}</strong>`;
    document.querySelector("#grind-loot-count").textContent = `${grindSession.totalLoot}件${grindSession.totalLoot > 200 ? " · 陈列最佳200件" : ""}`;
    document.querySelector("#grind-loot-shelf").innerHTML = grindSession.loot.length ? sortLoot(grindSession.loot).map(lootCell).join("") : `<div class="grind-loot-empty">战胜一轮敌人后，装备会落到这里。</div>`;
    const actions = document.querySelector("#grind-session-actions");
    actions.innerHTML = !grindSession.fighting && !grindSession.auto ? `<button class="mini-button" data-grind-retry>再刷一轮</button><button class="mini-button" data-grind-leave>返回地图</button>` : "";
    actions.querySelector("[data-grind-retry]")?.addEventListener("click", retryGrind);
    actions.querySelector("[data-grind-leave]")?.addEventListener("click", leaveGrind);
  }

  function mapPlaces(view) {
    return view.places.filter((place) => !["place_party", "place_calendar"].includes(place.id));
  }

  function positionForPlace(place, slot, areaCount) {
    const [baseX, baseY] = AREA_POSITIONS[place.area] || [MAP_WIDTH / 2, MAP_HEIGHT / 2];
    if (areaCount <= 1) return { x: baseX, y: baseY };
    const offset = PLACE_OFFSETS[slot % PLACE_OFFSETS.length];
    const ring = Math.floor(slot / PLACE_OFFSETS.length);
    return {
      x: Math.max(70, Math.min(MAP_WIDTH - 70, baseX + offset[0] + ring * 34)),
      y: Math.max(70, Math.min(MAP_HEIGHT - 70, baseY + offset[1] + ring * 34)),
    };
  }

  function updatePlacePositions(view) {
    placePositions.clear();
    const groups = new Map();
    mapPlaces(view).forEach((place) => {
      if (!groups.has(place.area)) groups.set(place.area, []);
      groups.get(place.area).push(place);
    });
    groups.forEach((places) => places.sort((left, right) => left.id.localeCompare(right.id)).forEach((place, index) => placePositions.set(place.id, positionForPlace(place, index, places.length))));
  }

  function fitWholeMap() {
    if (!mapCamera) return;
    mapFocus = null;
    mapCamera.fitBounds({ minX: 0, minY: 0, maxX: MAP_WIDTH, maxY: MAP_HEIGHT }, { padding: 52, minZoom: .42, maxZoom: .92 });
    renderMapCamera();
  }

  function focusMapOnPlace(placeId) {
    const point = placePositions.get(placeId);
    const viewport = document.querySelector("#map-viewport");
    if (!mapCamera || !point || !viewport) return;
    const current = mapCamera.snapshot();
    const offset = viewport.clientWidth >= 760 ? Math.min(250, viewport.clientWidth * .16) / Math.max(current.zoom, .6) : 0;
    mapFocus = { x: point.x + offset, y: point.y, zoom: Math.max(.88, Math.min(1.08, current.zoom)) };
    if (!mapFrame) mapFrame = requestAnimationFrame(animateMapFocus);
  }

  function animateMapFocus() {
    mapFrame = 0;
    if (!mapCamera || !mapFocus || mode !== "campaign") return;
    mapCamera.moveToward(mapFocus, .18);
    renderMapCamera();
    const current = mapCamera.snapshot();
    const distance = Math.abs(current.x - mapFocus.x) + Math.abs(current.y - mapFocus.y) + Math.abs(current.zoom - mapFocus.zoom) * 100;
    if (distance > .7) mapFrame = requestAnimationFrame(animateMapFocus);
    else mapFocus = null;
  }

  function positionEventPopover() {
    const popover = document.querySelector("#event-popover");
    const viewport = document.querySelector("#map-viewport");
    const point = placePositions.get(selectedPlaceId);
    if (!popover || popover.hidden || !viewport || !point || !mapCamera) return;
    const screen = mapCamera.worldToScreen(point);
    const width = popover.offsetWidth || 390;
    const height = popover.offsetHeight || 320;
    const rightSide = screen.x + 34 + width <= viewport.clientWidth - 14;
    const left = rightSide ? screen.x + 30 : screen.x - width - 30;
    const top = Math.max(62, Math.min(viewport.clientHeight - height - 16, screen.y - Math.min(118, height * .34)));
    popover.style.left = `${Math.max(14, Math.min(viewport.clientWidth - width - 14, left))}px`;
    popover.style.top = `${Math.max(14, top)}px`;
    popover.classList.toggle("points-left", rightSide);
  }

  function renderMapCamera() {
    if (!mapCamera) return;
    const world = document.querySelector("#map-world");
    const snapshot = mapCamera.snapshot();
    if (world) world.style.transform = `translate(${snapshot.viewportWidth / 2}px, ${snapshot.viewportHeight / 2}px) scale(${snapshot.zoom}) translate(${-snapshot.x}px, ${-snapshot.y}px)`;
    document.querySelectorAll("[data-map-place]").forEach((node) => {
      const point = placePositions.get(node.dataset.mapPlace);
      if (!point) return;
      const screen = mapCamera.worldToScreen(point);
      node.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%)`;
      node.classList.toggle("offscreen", screen.x < -90 || screen.y < -90 || screen.x > snapshot.viewportWidth + 90 || screen.y > snapshot.viewportHeight + 90);
    });
    positionEventPopover();
  }

  function resizeMapCamera() {
    const viewport = document.querySelector("#map-viewport");
    if (!mapCamera || !viewport) return;
    mapCamera.setViewport(viewport.clientWidth, viewport.clientHeight);
    renderMapCamera();
  }

  function setupMapCamera() {
    const viewport = document.querySelector("#map-viewport");
    const cameraApi = window.AgentAutomataCamera2D;
    if (!viewport || !cameraApi?.createCamera2D) return;
    if (!mapCamera) {
      mapCamera = cameraApi.createCamera2D({
        viewportWidth: viewport.clientWidth,
        viewportHeight: viewport.clientHeight,
        x: MAP_WIDTH / 2,
        y: MAP_HEIGHT / 2,
        zoom: .72,
        minZoom: .42,
        maxZoom: 1.45,
        worldBounds: { minX: 0, minY: 0, maxX: MAP_WIDTH, maxY: MAP_HEIGHT },
      });
      fitWholeMap();
    }
    if (!mapInputBound) {
      mapInputBound = true;
      viewport.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".map-node, .event-popover, .map-camera-controls, .map-threat, .map-overview")) return;
        mapFocus = null;
        mapDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false };
        viewport.classList.add("dragging");
        viewport.setPointerCapture(event.pointerId);
      });
      viewport.addEventListener("pointermove", (event) => {
        if (!mapDrag || mapDrag.id !== event.pointerId) return;
        if (Math.abs(event.clientX - mapDrag.startX) + Math.abs(event.clientY - mapDrag.startY) > 5) mapDrag.moved = true;
        mapCamera.panByScreen(event.clientX - mapDrag.x, event.clientY - mapDrag.y);
        mapDrag.x = event.clientX;
        mapDrag.y = event.clientY;
        renderMapCamera();
      });
      const finishDrag = (event) => {
        if (!mapDrag || mapDrag.id !== event.pointerId) return;
        const closeSelection = !mapDrag.moved && selectedPlaceId;
        mapDrag = null;
        viewport.classList.remove("dragging");
        if (closeSelection) { selectedPlaceId = null; render(); }
      };
      viewport.addEventListener("pointerup", finishDrag);
      viewport.addEventListener("pointercancel", finishDrag);
      viewport.addEventListener("wheel", (event) => {
        if (event.target.closest(".event-popover, .map-threat")) return;
        event.preventDefault();
        mapFocus = null;
        const rect = viewport.getBoundingClientRect();
        const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        mapCamera.setZoom(mapCamera.snapshot().zoom * (event.deltaY < 0 ? 1.12 : .88), anchor);
        renderMapCamera();
      }, { passive: false });
      document.querySelector("#map-zoom-in").addEventListener("click", () => { mapCamera.setZoom(mapCamera.snapshot().zoom * 1.18); renderMapCamera(); });
      document.querySelector("#map-zoom-out").addEventListener("click", () => { mapCamera.setZoom(mapCamera.snapshot().zoom * .84); renderMapCamera(); });
      document.querySelector("#map-reset-camera").addEventListener("click", fitWholeMap);
      document.querySelector("#event-popover-close").addEventListener("click", () => { selectedPlaceId = null; render(); });
      window.addEventListener("keydown", (event) => { if (event.key === "Escape" && selectedPlaceId) { selectedPlaceId = null; render(); } });
      if (window.ResizeObserver) {
        mapResizeObserver = new ResizeObserver(resizeMapCamera);
        mapResizeObserver.observe(viewport);
      } else window.addEventListener("resize", resizeMapCamera);
    }
    resizeMapCamera();
  }

  function renderHeader(view) {
    const deadlines = { 5: "家兵", 10: "联军", 15: "围剿" };
    document.querySelector("#day-rail").innerHTML = Array.from({ length: 15 }, (_, index) => {
      const day = index + 1;
      const cls = day < view.time.day || view.result ? "past" : day === view.time.day ? "current" : "";
      return `<span class="day-step ${cls} ${deadlines[day] ? "raid" : ""}"><i>${day}</i><b>${deadlines[day] || "日"}</b></span>`;
    }).join("");
    document.querySelector("#ap-outside-value").textContent = view.time.actionsRemainingToday;
    document.querySelector("#gold-value").textContent = view.resources.gold;
    document.querySelector("#medicine-value").textContent = view.resources.medicine;
    document.querySelector("#favor-value").textContent = view.resources.townFavor;
    document.querySelector("#evidence-value").textContent = view.resources.evidence;
    document.querySelector("#influence-value").textContent = view.resources.influence;
    const endAction = view.actions.find((action) => action.endsCurrentDay);
    const button = document.querySelector("#end-day-button");
    button.disabled = !endAction || mode !== "campaign";
    button.dataset.action = endAction?.id || "";
    button.textContent = view.time.phase === "showdown" ? "大战已经开始" : endAction?.label || "结束本日";
  }

  function renderWorld(view) {
    const places = mapPlaces(view);
    updatePlacePositions(view);
    document.querySelector("#known-place-count").textContent = `${places.length}处`;
    const areas = [...new Set(places.map((place) => place.area))];
    document.querySelector("#map-region-layer").innerHTML = areas.map((area) => {
      const [x, y] = AREA_POSITIONS[area] || [MAP_WIDTH / 2, MAP_HEIGHT / 2];
      return `<span class="map-region-name" style="left:${x}px;top:${y}px">${esc(area)}</span>`;
    }).join("");
    document.querySelector("#map-node-layer").innerHTML = places.map((place) => {
      const actions = view.actions.filter((action) => action.placeId === place.id && !["equipment", "party", "time"].includes(action.kind));
      const hasCombat = actions.some((action) => ["combat", "grind"].includes(action.kind));
      const hasCallback = actions.some((action) => action.callback);
      const sigil = hasCombat ? "⚔" : AREA_SIGILS[place.area] || place.area.slice(0, 1);
      const classes = [place.id === selectedPlaceId ? "selected" : "", place.status === "locked" ? "locked" : "", hasCombat ? "danger" : "", hasCallback ? "callback" : "", actions.length ? "actionable" : "dormant"].filter(Boolean).join(" ");
      return `<button type="button" class="map-node ${classes}" data-place="${esc(place.id)}" data-map-place="${esc(place.id)}"><span class="node-sigil">${esc(sigil)}</span><span class="node-copy"><strong>${esc(place.title)}</strong><small>${esc(place.area)}</small></span>${actions.length ? `<em>${actions.length}</em>` : ""}</button>`;
    }).join("");
    document.querySelector("#threat-list").innerHTML = view.threatSignals.slice(0, 5).map((row) => `<p>${esc(row)}</p>`).join("") || `<p>镇外暂时没有新的明确迹象。</p>`;
    requestAnimationFrame(renderMapCamera);
  }

  function resultExplanation(view) {
    const chapters = view.result?.chapters || [];
    return chapters.map((row) => `第${row.day}日 · ${row.strategy === "political" ? "化解围攻" : row.combat?.title || "迎战"} · ${row.win ? "成功" : "失利"}`).join("<br>");
  }

  function renderScene(view) {
    const map = document.querySelector("#map-view");
    const combat = document.querySelector("#combat-view");
    const grind = document.querySelector("#grind-view");
    const grid = document.querySelector("#campaign-grid");
    if (mode === "combat") {
      map.hidden = true;
      combat.hidden = false;
      grind.hidden = true;
      grid.classList.add("combat-mode");
      document.querySelector("#combat-title").textContent = pendingCombat.title;
      document.querySelector("#combat-preparation").innerHTML = `<span>我方 ${pendingCombat.leftTeam.length}</span><span>敌方 ${pendingCombat.rightTeam.length}</span><span>必须完整看完</span>`;
      document.querySelector("#combat-result").hidden = true;
      document.querySelector("#battle-mount").innerHTML = "";
      return;
    }
    if (mode === "grind") {
      map.hidden = true;
      combat.hidden = true;
      grind.hidden = false;
      grid.classList.remove("combat-mode");
      grid.classList.add("grind-mode");
      renderGrindHud();
      return;
    }
    map.hidden = false;
    combat.hidden = true;
    grind.hidden = true;
    grid.classList.remove("combat-mode");
    grid.classList.remove("grind-mode");
    const ending = document.querySelector("#campaign-ending");
    if (view.result) {
      document.querySelector("#event-popover").hidden = true;
      ending.hidden = false;
      ending.innerHTML = `<span class="chapter-mark">十五日结算</span><h2>${esc(view.result.ending)}</h2><p>${view.result.win ? "你活过了三次围攻，煤灰镇的局势已经彻底改变。" : "围剿军进入煤灰镇，但此前的选择仍然改变了各方位置。"}</p><div class="chapter-results">${resultExplanation(view)}</div><button class="button quiet" data-restart-open>重新开始</button>`;
      return;
    }
    ending.hidden = true;
    ending.innerHTML = "";
    const place = view.places.find((row) => row.id === selectedPlaceId) || view.places[0];
    const popover = document.querySelector("#event-popover");
    if (!selectedPlaceId || !place || ["place_party", "place_calendar"].includes(place.id)) {
      popover.hidden = true;
      return;
    }
    popover.hidden = false;
    document.querySelector("#scene-area").textContent = place.area;
    document.querySelector("#scene-title").textContent = place.title;
    document.querySelector("#scene-status").textContent = view.time.phase === "showdown" ? "决战" : STATUS_LABEL[place.status] || place.status;
    document.querySelector("#scene-description").textContent = place.scene;
    document.querySelector("#scene-change").hidden = true;
    requestAnimationFrame(positionEventPopover);
  }

  function visibleSceneActions(view) {
    return view.actions.filter((action) => action.placeId === selectedPlaceId && !["equipment", "party", "time"].includes(action.kind));
  }

  function renderActions(view) {
    const actions = visibleSceneActions(view);
    document.querySelector("#action-count").textContent = `${actions.length}项`;
    document.querySelector("#action-heading").textContent = view.time.phase === "showdown" ? "选择迎战方式" : "这里能做什么";
    document.querySelector("#action-list").innerHTML = actions.map((action) => {
      const cost = action.kind === "combat" ? `真实战斗${action.actionPointMark ? " · 1行动" : ""}` : action.actionPointMark ? "消耗1行动" : action.kind === "grind" ? "连续真实战斗 · 不耗行动" : "";
      const callback = action.callback ? `<em class="callback-mark">旧事回响</em><small class="callback-reason">${esc(action.callback)}</small>` : "";
      return `<button class="action-button ${["combat", "grind"].includes(action.kind) ? "combat-action" : ""} ${action.kind === "grind" ? "grind-action" : ""} ${action.callback ? "callback-action" : ""}" data-action="${action.id}"><span class="action-copy">${callback}<span>${esc(action.label)}</span></span><b>${esc(cost)}</b></button>`;
    }).join("") || `<div class="empty-action"><strong>这里暂时没有可做的事</strong><span>可以看别的地点、整理队伍或结束本日。</span></div>`;
  }

  function partyAction(view, hero, add) {
    return view.actions.find((action) => action.kind === "party" && action.label.includes(hero.name) && action.label.includes(add ? "加入出战" : "回到候补"));
  }

  function equipmentForHero(heroId) {
    const slots = state.equipment?.[heroId] || {};
    return Object.values(slots).map((itemId) => state.inventory.find((item) => item.id === itemId)).filter(Boolean);
  }

  function renderPartyDock(view) {
    const allHeroes = [...view.party.active, ...view.party.reserve];
    const selected = allHeroes.find((hero) => hero.id === selectedHeroId) || allHeroes[0];
    const columns = view.party.maxActive <= 4 ? 4 : 5;
    const slots = Array.from({ length: view.party.maxActive }, (_, index) => view.party.active[index]);
    const slotMarkup = slots.map((hero, index) => hero
      ? `<button class="formation-slot filled ${hero.id === selected?.id ? "selected" : ""}" data-hero="${hero.id}"><i>${index < columns ? "前" : "后"}${index % columns + 1}</i><strong>${esc(hero.name)}</strong><span>${esc(hero.role)}</span><em>${hero.visiblePower}</em></button>`
      : `<div class="formation-slot empty"><i>${index < columns ? "前" : "后"}${index % columns + 1}</i><span>空位</span></div>`).join("");
    const reserve = view.party.reserve.map((hero) => {
      const action = partyAction(view, hero, true);
      const join = action ? `<b data-action="${action.id}">加入</b>` : view.party.active.length >= view.party.maxActive ? `<b class="full">已满</b>` : "";
      return `<button class="reserve-hero ${hero.id === selected?.id ? "selected" : ""}" data-hero="${hero.id}"><span><strong>${esc(hero.name)}</strong><small>${esc(hero.role)} · ${hero.visiblePower}</small></span>${join}</button>`;
    }).join("") || `<span class="empty-note">暂无候补</span>`;
    const remove = selected && view.party.active.some((hero) => hero.id === selected.id) ? partyAction(view, selected, false) : null;
    const auto = view.actions.find((action) => action.kind === "equipment" && action.label.includes("择优穿戴"));
    const worn = selected ? equipmentForHero(selected.id) : [];
    return `<div class="party-dock">
      <div class="formation-board" style="--slot-columns:${columns}">${slotMarkup}</div>
      <div class="reserve-strip"><span class="dock-label">候补 ${view.party.reserve.length}</span>${reserve}</div>
      <div class="hero-detail">${selected ? `<div><span class="dock-label">${esc(selected.formation || "候补")}</span><h3>${esc(selected.name)} <b>${selected.visiblePower}</b></h3><p>${esc(selected.role)}</p></div><div class="worn-strip">${worn.map((item) => `<span class="rarity-${esc(item.rarity)}">${esc(item.slotLabel)} · ${esc(item.name)}</span>`).join("") || "<small>没有装备</small>"}</div><div class="skill-strip">${(selected.visibleSkills || []).map((skill) => `<span title="${esc(skill.description)}"><b>${esc(skill.name)}</b><small>${esc(skill.type)}</small></span>`).join("")}</div>${remove ? `<button class="mini-button danger" data-action="${remove.id}">回到候补</button>` : ""}` : ""}</div>
      <button class="button primary auto-equip" data-action="${auto?.id || ""}" ${auto ? "" : "disabled"} title="${auto ? "为当前出战成员分配背包中的高战力装备" : "背包中暂无可用于整理的装备"}">出战成员择优穿戴</button>
    </div>`;
  }

  function itemWearer(item) {
    for (const hero of [...currentView().party.active, ...currentView().party.reserve]) {
      if (Object.values(state.equipment?.[hero.id] || {}).includes(item.id)) return hero.name;
    }
    return "";
  }

  function renderInventoryDock(view) {
    const sorted = view.inventory.slice().sort((a, b) => (RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]) || b.power - a.power);
    const selected = sorted.find((item) => item.id === selectedGearId) || sorted[0];
    const grid = sorted.map((item) => {
      const wearer = itemWearer(item);
      return `<button class="inventory-cell rarity-${esc(item.rarity)} ${item.id === selected?.id ? "selected" : ""}" data-gear="${item.id}" title="${esc(item.name)}"><i>${SLOT_ICONS[item.slotLabel] || "◆"}</i><b>+${item.power}</b>${wearer ? `<em>${esc(wearer === "你" ? "主角" : "已穿")}</em>` : ""}</button>`;
    }).join("");
    const tagActions = selected ? view.actions.filter((action) => action.kind === "equipment" && selected.identityTags.some((tag) => action.label.includes(`[${tag}]`))) : [];
    const wearer = selected ? itemWearer(selected) : "";
    return `<div class="inventory-dock"><div class="inventory-grid">${grid}</div><div class="item-detail">${selected ? `<span class="rarity-text rarity-${esc(selected.rarity)}">${esc(selected.rarity)} · ${esc(selected.slotLabel)}</span><h3>${esc(selected.name)} <b>+${selected.power}</b></h3><p>${wearer ? `${esc(wearer)}正在使用` : `来自${esc(selected.source)}`}</p><div class="identity-tags">${selected.identityTags.map((tag) => `<span>${esc(tag)}</span>`).join("") || "<small>没有可辨认的身份印记</small>"}</div><div class="equip-targets">${tagActions.map((action) => `<button class="mini-button" data-action="${action.id}">${esc(action.label)}</button>`).join("") || "<span class=\"empty-note\">可用上方择优穿戴整理战力</span>"}</div>` : ""}</div></div>`;
  }

  function renderJournalDock(view) {
    return `<div class="journal-dock"><div><span class="dock-label">最近发生</span>${view.recentSignals.map((row) => `<p>${esc(row)}</p>`).join("")}</div><div><span class="dock-label">当前局势</span><p>${esc(view.situation)}</p>${view.threatSignals.map((row) => `<p>${esc(row)}</p>`).join("")}</div></div>`;
  }

  function renderDock(view) {
    document.querySelector("#inventory-count").textContent = `${view.inventory.length}/${view.inventoryLimit || 200}`;
    document.querySelectorAll(".dock-tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === activeTab));
    document.querySelector("#dock-content").innerHTML = activeTab === "inventory" ? renderInventoryDock(view) : activeTab === "journal" ? renderJournalDock(view) : renderPartyDock(view);
  }

  function bindInteractions() {
    document.querySelectorAll("[data-action]:not(#end-day-button)").forEach((node) => node.addEventListener("click", (event) => {
      event.stopPropagation();
      if (node.dataset.action) runAction(node.dataset.action);
    }));
    document.querySelectorAll("[data-place]").forEach((node) => node.addEventListener("click", () => {
      selectedPlaceId = node.dataset.place;
      const place = currentView().places.find((row) => row.id === selectedPlaceId);
      if (place) selectedArea = place.area;
      render();
      focusMapOnPlace(selectedPlaceId);
    }));
    document.querySelectorAll("[data-hero]").forEach((node) => node.addEventListener("click", () => { selectedHeroId = node.dataset.hero; render(); }));
    document.querySelectorAll("[data-gear]").forEach((node) => node.addEventListener("click", () => { selectedGearId = node.dataset.gear; render(); }));
    document.querySelectorAll("[data-restart-open]").forEach((node) => node.addEventListener("click", openRestart));
  }

  function render() {
    const view = currentView();
    document.querySelector(".game-shell").classList.toggle("combat-active", mode !== "campaign");
    ensureSelection(view);
    setupMapCamera();
    renderHeader(view);
    renderWorld(view);
    renderScene(view);
    renderActions(view);
    renderDock(view);
    bindInteractions();
  }

  function openRestart() { document.querySelector("#restart-dialog").showModal(); }

  document.querySelectorAll(".dock-tab").forEach((button) => button.addEventListener("click", () => { activeTab = button.dataset.tab; render(); }));
  document.querySelector("#end-day-button").addEventListener("click", (event) => {
    const actionId = event.currentTarget.dataset.action;
    if (actionId) runAction(actionId);
  });
  document.querySelector("#restart-open").addEventListener("click", openRestart);
  document.querySelector("#restart-confirm").addEventListener("click", () => {
    const seed = document.querySelector("#restart-seed").value.trim() || "browser-fifteen-day";
    battleView?.destroy?.();
    battleView = null;
    clearTimeout(grindSession?.timer);
    grindSession = null;
    state = GAME.createInitialState(seed);
    selectedPlaceId = null;
    selectedArea = "灰炉遗址";
    selectedHeroId = null;
    selectedGearId = null;
    activeTab = "party";
    mode = "campaign";
    pendingCombat = null;
    pendingCombatResult = null;
    mapFocus = null;
    saveState();
    render();
    fitWholeMap();
  });

  document.querySelector("#stop-grind").addEventListener("click", requestStopGrind);

  render();
})();
