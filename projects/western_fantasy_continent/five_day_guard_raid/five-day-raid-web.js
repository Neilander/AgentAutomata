(function () {
  "use strict";

  const GAME = window.FIFTEEN_DAY_DEMO;
  const SAVE_KEY = "infinite_loot_fifteen_day_web_v1";
  const STATUS_LABEL = { present: "在场", open: "已开放", locked: "锁着", settled: "已处理", gone: "已离开", closed: "已结束" };
  const AREA_POSITIONS = {
    "镇中心": [50, 49], "灰炉遗址": [82, 34], "河畔营地": [62, 13], "西门商道": [16, 46],
    "旧礼拜堂": [75, 79], "旧城墙": [29, 82], "北部矿区": [31, 19], "黑石采坑": [18, 23],
    "南部沼泽": [70, 91], "王炉地底": [91, 58], "煤灰镇": [50, 61], "营地": [40, 67],
  };
  const AREA_SIGILS = {
    "镇中心": "镇", "灰炉遗址": "炉", "河畔营地": "营", "西门商道": "门", "旧礼拜堂": "祷",
    "旧城墙": "墙", "北部矿区": "矿", "黑石采坑": "坑", "南部沼泽": "沼", "王炉地底": "心", "煤灰镇": "战", "营地": "队",
  };
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

  function runAction(publicActionId) {
    try {
      const combat = GAME.preparePlayerCombat(state, publicActionId);
      if (combat) return startCombat(combat);
      const before = currentView();
      state = GAME.applyPlayerAction(state, publicActionId);
      saveState();
      const after = currentView();
      const newest = after.recentSignals.find((row) => !before.recentSignals.includes(row));
      showToast(newest || "行动完成");
      ensureSelection(after);
      render();
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
    if (!view.places.some((place) => place.id === selectedPlaceId)) {
      const first = view.places.find((place) => place.status === "present" || place.status === "open") || view.places[0];
      selectedPlaceId = first?.id || null;
      selectedArea = first?.area || selectedArea;
    }
    const heroes = [...view.party.active, ...view.party.reserve];
    if (!heroes.some((hero) => hero.id === selectedHeroId)) selectedHeroId = view.party.active[0]?.id || heroes[0]?.id || null;
    if (!view.inventory.some((item) => item.id === selectedGearId)) selectedGearId = view.inventory[0]?.id || null;
  }

  function renderHeader(view) {
    const deadlines = { 5: "家兵", 10: "联军", 15: "围剿" };
    document.querySelector("#day-rail").innerHTML = Array.from({ length: 15 }, (_, index) => {
      const day = index + 1;
      const cls = day < view.time.day || view.result ? "past" : day === view.time.day ? "current" : "";
      return `<span class="day-step ${cls} ${deadlines[day] ? "raid" : ""}"><i>${day}</i><b>${deadlines[day] || "日"}</b></span>`;
    }).join("");
    document.querySelector("#ap-value").textContent = view.time.actionsRemainingToday;
    document.querySelector("#gold-value").textContent = view.resources.gold;
    document.querySelector("#medicine-value").textContent = view.resources.medicine;
    document.querySelector("#favor-value").textContent = view.resources.townFavor;
    document.querySelector("#evidence-value").textContent = view.resources.evidence;
    document.querySelector("#influence-value").textContent = view.resources.influence;
    const endAction = view.actions.find((action) => action.endsCurrentDay);
    const button = document.querySelector("#end-day-button");
    button.disabled = !endAction || mode === "combat";
    button.dataset.action = endAction?.id || "";
    button.textContent = view.time.phase === "showdown" ? "大战已经开始" : endAction?.label || "结束本日";
  }

  function renderWorld(view) {
    const areas = [...new Set(view.places.map((place) => place.area))];
    if (!areas.includes(selectedArea)) selectedArea = view.places[0]?.area || selectedArea;
    document.querySelector("#known-place-count").textContent = `${view.places.length}处`;
    document.querySelector("#area-markers").innerHTML = areas.map((area) => {
      const [x, y] = AREA_POSITIONS[area] || [50, 50];
      const count = view.places.filter((place) => place.area === area).reduce((sum, place) => sum + place.actionCount, 0);
      return `<button class="area-marker ${area === selectedArea ? "selected" : ""}" style="left:${x}%;top:${y}%" data-area="${esc(area)}"><span>${esc(AREA_SIGILS[area] || area.slice(0, 1))}</span><b>${esc(area)}</b>${count ? `<em>${count}</em>` : ""}</button>`;
    }).join("");
    const places = view.places.filter((place) => place.area === selectedArea);
    document.querySelector("#place-list").innerHTML = places.map((place) => `<button class="place-row ${place.id === selectedPlaceId ? "selected" : ""}" data-place="${esc(place.id)}"><span><i class="place-state ${esc(place.status)}"></i>${esc(place.title)}</span><b class="${place.actionCount ? "has-actions" : ""}">${place.actionCount}</b></button>`).join("") || `<p class="empty-note">这里还没有发现具体地点。</p>`;
  }

  function resultExplanation(view) {
    const chapters = view.result?.chapters || [];
    return chapters.map((row) => `第${row.day}日 · ${row.strategy === "political" ? "化解围攻" : row.combat?.title || "迎战"} · ${row.win ? "成功" : "失利"}`).join("<br>");
  }

  function renderScene(view) {
    const scene = document.querySelector("#scene-view");
    const combat = document.querySelector("#combat-view");
    const grid = document.querySelector("#campaign-grid");
    if (mode === "combat") {
      scene.hidden = true;
      combat.hidden = false;
      grid.classList.add("combat-mode");
      document.querySelector("#combat-title").textContent = pendingCombat.title;
      document.querySelector("#combat-preparation").innerHTML = `<span>我方 ${pendingCombat.leftTeam.length}</span><span>敌方 ${pendingCombat.rightTeam.length}</span><span>必须完整看完</span>`;
      document.querySelector("#combat-result").hidden = true;
      document.querySelector("#battle-mount").innerHTML = "";
      return;
    }
    scene.hidden = false;
    combat.hidden = true;
    grid.classList.remove("combat-mode");
    if (view.result) {
      document.querySelector("#scene-area").textContent = "十五日结算";
      document.querySelector("#scene-title").textContent = view.result.ending;
      document.querySelector("#scene-status").textContent = view.result.win ? "胜利" : "失败";
      document.querySelector("#scene-description").textContent = view.result.win ? "你活过了三次围攻，煤灰镇的局势已经彻底改变。" : "围剿军进入煤灰镇，但此前的选择仍然改变了各方位置。";
      document.querySelector("#scene-change").innerHTML = `<div class="chapter-results">${resultExplanation(view)}</div><button class="button quiet" data-restart-open>重新开始</button>`;
      return;
    }
    const place = view.places.find((row) => row.id === selectedPlaceId) || view.places[0];
    if (!place) return;
    document.querySelector("#scene-area").textContent = place.area;
    document.querySelector("#scene-title").textContent = place.title;
    document.querySelector("#scene-status").textContent = view.time.phase === "showdown" ? "决战" : STATUS_LABEL[place.status] || place.status;
    document.querySelector("#scene-description").textContent = place.scene;
    document.querySelector("#scene-art").dataset.area = place.area;
    document.querySelector("#scene-change").textContent = view.recentSignals[0] || "";
  }

  function visibleSceneActions(view) {
    return view.actions.filter((action) => action.placeId === selectedPlaceId && !["equipment", "party", "time"].includes(action.kind));
  }

  function renderActions(view) {
    const actions = visibleSceneActions(view);
    document.querySelector("#action-count").textContent = `${actions.length}项`;
    document.querySelector("#action-heading").textContent = view.time.phase === "showdown" ? "选择迎战方式" : "这里能做什么";
    document.querySelector("#action-list").innerHTML = actions.map((action) => {
      const cost = action.kind === "combat" ? `真实战斗${action.actionPointMark ? " · 1行动" : ""}` : action.actionPointMark ? "消耗1行动" : action.kind === "grind" ? "不耗行动" : "";
      return `<button class="action-button ${action.kind === "combat" ? "combat-action" : ""}" data-action="${action.id}"><span>${esc(action.label)}</span><b>${esc(cost)}</b></button>`;
    }).join("") || `<div class="empty-action"><strong>这里暂时没有可做的事</strong><span>可以看别的地点、整理队伍或结束本日。</span></div>`;
    document.querySelector("#threat-list").innerHTML = view.threatSignals.slice(0, 7).map((row) => `<p>${esc(row)}</p>`).join("") || `<p>镇外暂时没有新的明确迹象。</p>`;
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
    document.querySelector("#inventory-count").textContent = view.inventory.length;
    document.querySelectorAll(".dock-tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === activeTab));
    document.querySelector("#dock-content").innerHTML = activeTab === "inventory" ? renderInventoryDock(view) : activeTab === "journal" ? renderJournalDock(view) : renderPartyDock(view);
  }

  function bindInteractions() {
    document.querySelectorAll("[data-action]:not(#end-day-button)").forEach((node) => node.addEventListener("click", (event) => {
      event.stopPropagation();
      if (node.dataset.action) runAction(node.dataset.action);
    }));
    document.querySelectorAll("[data-area]").forEach((node) => node.addEventListener("click", () => {
      selectedArea = node.dataset.area;
      const first = currentView().places.find((place) => place.area === selectedArea);
      if (first) selectedPlaceId = first.id;
      render();
    }));
    document.querySelectorAll("[data-place]").forEach((node) => node.addEventListener("click", () => {
      selectedPlaceId = node.dataset.place;
      const place = currentView().places.find((row) => row.id === selectedPlaceId);
      if (place) selectedArea = place.area;
      render();
    }));
    document.querySelectorAll("[data-hero]").forEach((node) => node.addEventListener("click", () => { selectedHeroId = node.dataset.hero; render(); }));
    document.querySelectorAll("[data-gear]").forEach((node) => node.addEventListener("click", () => { selectedGearId = node.dataset.gear; render(); }));
    document.querySelectorAll("[data-restart-open]").forEach((node) => node.addEventListener("click", openRestart));
  }

  function render() {
    const view = currentView();
    document.querySelector(".game-shell").classList.toggle("combat-active", mode === "combat");
    ensureSelection(view);
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
    state = GAME.createInitialState(seed);
    selectedPlaceId = null;
    selectedArea = "灰炉遗址";
    selectedHeroId = null;
    selectedGearId = null;
    activeTab = "party";
    mode = "campaign";
    pendingCombat = null;
    pendingCombatResult = null;
    saveState();
    render();
  });

  render();
})();
