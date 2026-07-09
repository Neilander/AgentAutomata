(function initMilitiaProgressionLab() {
  const CORE = window.MILITIA_PROGRESSION_CORE;
  const BATTLE = window.GAME_BATTLE_VIEW;
  const SAVE_KEY = "agent_automata_militia_progression_lab_v1";
  let state = loadState() || CORE.createInitialState();
  let battleView = null;
  let pendingEncounterId = "";
  let mapCamera = null;
  let mapFocus = null;
  let mapRaf = 0;
  const MAP_WORLD = { width: 980, height: 560 };

  const $ = (id) => document.getElementById(id);
  const els = {
    resetBtn: $("resetBtn"),
    autoBtn: $("autoBtn"),
    grindBtn: $("grindBtn"),
    fightBtn: $("fightBtn"),
    autoEquipBtn: $("autoEquipBtn"),
    stageName: $("stageName"),
    stageList: $("stageList"),
    statusPill: $("statusPill"),
    encounterTitle: $("encounterTitle"),
    encounterHint: $("encounterHint"),
    battleMount: $("battleMount"),
    lootSummary: $("lootSummary"),
    lootGrid: $("lootGrid"),
    rosterList: $("rosterList"),
    teamPower: $("teamPower"),
    militiaSignal: $("militiaSignal"),
    militiaSignalDetail: $("militiaSignalDetail"),
    growthSignal: $("growthSignal"),
    growthSignalDetail: $("growthSignalDetail"),
    gateSignal: $("gateSignal"),
    gateSignalDetail: $("gateSignalDetail"),
    runLog: $("runLog"),
  };

  bind();
  render();
  preview();

  function bind() {
    els.resetBtn.addEventListener("click", () => {
      state = CORE.createInitialState();
      saveState();
      render();
      preview();
    });
    els.autoBtn.addEventListener("click", () => {
      const run = CORE.runAutoPlay(18);
      state = run.state;
      state.logs.unshift(`自动试玩：${run.summary.verdict}，${run.summary.rounds} 轮 ${run.summary.wins} 胜，最终战力 ${run.summary.finalPower}`);
      saveState();
      render();
      preview();
    });
    els.grindBtn.addEventListener("click", () => {
      const filler = CORE.currentStage(state).encounters.find((item) => item.type === "充水关");
      state.selectedEncounter = filler.id;
      fight(false);
    });
    els.fightBtn.addEventListener("click", () => fight(true));
    els.autoEquipBtn.addEventListener("click", () => {
      const before = CORE.teamPower(state);
      CORE.autoEquip(state);
      const after = CORE.teamPower(state);
      state.logs.unshift(`自动配装：${before} -> ${after}`);
      saveState();
      render();
      preview();
    });
    els.stageList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-encounter]");
      if (!button) return;
      const stageIndex = Number(button.dataset.stage);
      if (stageIndex > unlockedStageIndex()) return;
      state.selectedStage = stageIndex;
      state.selectedEncounter = button.dataset.encounter;
      saveState();
      render();
      preview();
      focusMapEncounter(state.selectedEncounter);
    });
    els.stageList.addEventListener("wheel", (event) => {
      if (!mapCamera) return;
      event.preventDefault();
      const rect = els.stageList.getBoundingClientRect();
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const nextZoom = mapCamera.snapshot().zoom * (event.deltaY > 0 ? 0.88 : 1.14);
      mapCamera.setZoom(nextZoom, anchor);
      mapFocus = null;
      renderMapCamera();
    }, { passive: false });
  }

  function fight(visual) {
    const encounter = CORE.findEncounter(state);
    if (visual && BATTLE) {
      setStatus("挑战中", "");
      mountBattle().start({
        leftTeam: CORE.activeTeam(state).map((unit, index) => CORE.buildSpec(unit, index)),
        rightTeam: encounter.enemy.map((role, index) => CORE.buildEnemy(role, index, encounter)),
        fieldEffectId: encounter.field || "",
        title: encounter.name,
        seed: `militia-visual-${Date.now()}`,
      });
      pendingEncounterId = encounter.id;
    } else {
      finishAfterVisual(encounter);
    }
  }

  function finishAfterVisual(encounter) {
    const result = CORE.completeEncounter(state, encounter.id);
    if (result.win && encounter.type === "卡点关" && state.selectedStage < CORE.STAGES.length - 1) {
      state.selectedStage += 1;
      state.selectedEncounter = CORE.STAGES[state.selectedStage].encounters[0].id;
    }
    saveState();
    render();
    preview();
  }

  function mountBattle() {
    if (!battleView) {
      battleView = BATTLE.mount({
        container: els.battleMount,
        maxTime: 70,
        speed: 1.45,
        cameraMode: "fitUnits",
        cameraSmoothing: 0.055,
        onFinish: () => {
          if (!pendingEncounterId) return;
          const encounter = CORE.findEncounter(state, pendingEncounterId);
          pendingEncounterId = "";
          finishAfterVisual(encounter);
        },
      });
    }
    return battleView;
  }

  function preview() {
    if (!BATTLE || !els.battleMount) return;
    const encounter = CORE.findEncounter(state);
    mountBattle().preview({
      leftTeam: CORE.activeTeam(state).map((unit, index) => CORE.buildSpec(unit, index)),
      rightTeam: encounter.enemy.map((role, index) => CORE.buildEnemy(role, index, encounter)),
      title: encounter.name,
    });
  }

  function render() {
    const stage = CORE.currentStage(state);
    const encounter = CORE.findEncounter(state);
    els.stageName.textContent = stage.name.replace("：", " ");
    els.encounterTitle.textContent = encounter.name;
    els.encounterHint.textContent = `${encounter.type} · ${encounter.note}${encounter.field ? ` · 场地 ${encounter.field}` : ""}`;
    els.teamPower.textContent = CORE.teamPower(state);
    setStatus(state.lastResult ? (state.lastResult.win ? "胜利" : "失败") : "待命", state.lastResult ? (state.lastResult.win ? "win" : "loss") : "");
    renderStages();
    renderRoster();
    renderLoot();
    renderSignals();
  }

  function renderStages() {
    const unlocked = unlockedStageIndex();
    const nodes = mapNodes();
    const hadCamera = Boolean(mapCamera);
    els.stageList.innerHTML = `
      <div class="map-world" data-map-world>
        <svg class="map-links" viewBox="0 0 ${MAP_WORLD.width} ${MAP_WORLD.height}" aria-hidden="true">
          ${mapLinks(nodes).map((link) => `<line x1="${link.from.x}" y1="${link.from.y}" x2="${link.to.x}" y2="${link.to.y}"></line>`).join("")}
        </svg>
        ${nodes.map((node) => `
          <button type="button" class="map-node ${node.stageIndex === state.selectedStage ? "stage-active" : ""} ${state.selectedEncounter === node.encounter.id ? "primary" : ""} ${node.stageIndex > unlocked ? "locked" : ""}"
            data-map-node="${node.encounter.id}" data-stage="${node.stageIndex}" data-encounter="${node.encounter.id}"
            style="left:${node.x}px;top:${node.y}px">
            <span>${node.encounter.type}</span>
            <strong>${node.encounter.name}</strong>
            <small>${node.stage.name} · ${node.encounter.scale || 1}x</small>
          </button>
        `).join("")}
      </div>
    `;
    setupMapCamera();
    focusMapEncounter(state.selectedEncounter, !hadCamera);
  }

  function mapNodes() {
    return CORE.STAGES.flatMap((stage, stageIndex) => {
      const baseX = 150 + stageIndex * 330;
      return stage.encounters.map((encounter, encounterIndex) => ({
        stage,
        stageIndex,
        encounter,
        x: baseX + encounterIndex * 58,
        y: 116 + encounterIndex * 146 + (stageIndex % 2 ? 34 : 0),
      }));
    });
  }

  function mapLinks(nodes) {
    const links = [];
    for (let i = 1; i < nodes.length; i += 1) links.push({ from: nodes[i - 1], to: nodes[i] });
    return links;
  }

  function setupMapCamera() {
    if (!window.AgentAutomataCamera2D?.createCamera2D || !els.stageList) return;
    const rect = els.stageList.getBoundingClientRect();
    const width = Math.max(1, rect.width || 280);
    const height = Math.max(1, rect.height || 390);
    if (!mapCamera) {
      mapCamera = window.AgentAutomataCamera2D.createCamera2D({
        x: 150,
        y: 230,
        zoom: 0.82,
        minZoom: 0.55,
        maxZoom: 1.55,
        viewportWidth: width,
        viewportHeight: height,
        worldBounds: { minX: 0, minY: 0, maxX: MAP_WORLD.width, maxY: MAP_WORLD.height },
      });
      startMapCameraLoop();
    } else {
      mapCamera.setViewport(width, height);
    }
  }

  function focusMapEncounter(encounterId, instant = false) {
    if (!mapCamera) return;
    const node = mapNodes().find((item) => item.encounter.id === encounterId);
    if (!node) return;
    mapFocus = { x: node.x, y: node.y, zoom: Math.max(0.78, mapCamera.snapshot().zoom) };
    if (instant) {
      mapCamera.setPosition(mapFocus.x, mapFocus.y).setZoom(mapFocus.zoom);
      renderMapCamera();
    }
  }

  function startMapCameraLoop() {
    if (mapRaf) return;
    const step = () => {
      if (mapCamera && mapFocus) {
        mapCamera.moveToward(mapFocus, 0.1);
        renderMapCamera();
      }
      mapRaf = requestAnimationFrame(step);
    };
    mapRaf = requestAnimationFrame(step);
  }

  function renderMapCamera() {
    if (!mapCamera || !els.stageList) return;
    const world = els.stageList.querySelector("[data-map-world]");
    if (!world) return;
    const snapshot = mapCamera.snapshot();
    world.style.transform = `translate(${snapshot.viewportWidth / 2}px, ${snapshot.viewportHeight / 2}px) scale(${snapshot.zoom}) translate(${-snapshot.x}px, ${-snapshot.y}px)`;
  }

  function renderStagesOld() {
    const unlocked = unlockedStageIndex();
    els.stageList.innerHTML = CORE.STAGES.map((stage, stageIndex) => `
      <div class="stage-card ${stageIndex === state.selectedStage ? "active" : ""} ${stageIndex > unlocked ? "locked" : ""}">
        <div class="stage-row"><h3>${stage.name}</h3><span class="tag">${stage.levelRange[0]}-${stage.levelRange[1]}</span></div>
        <p>掉率：白 ${pct(stage.drop.common)} / 蓝 ${pct(stage.drop.blue)} / 稀有 ${pct(stage.drop.rare)} / 紫 ${pct(stage.drop.epic)}</p>
        <div class="tag-row">
          ${stage.encounters.map((encounter) => `<button type="button" class="${state.selectedEncounter === encounter.id ? "primary" : ""}" data-stage="${stageIndex}" data-encounter="${encounter.id}">${encounter.type}</button>`).join("")}
        </div>
      </div>
    `).join("");
  }

  function renderRoster() {
    const active = CORE.activeTeam(state);
    els.rosterList.innerHTML = state.roster.map((unit) => {
      const index = active.findIndex((item) => item.id === unit.id);
      const spec = CORE.buildSpec(unit, Math.max(0, index));
      return `
        <article class="hero-card ${index >= 0 ? "active" : ""}">
          <div class="portrait">${unit.icon || "⚔"}</div>
          <div>
            <div class="hero-meta">
              <div>
                <h3>${unit.name}</h3>
                <div class="hero-kind">${unit.kind === "militia" ? "民兵" : "英雄"} · ${unit.role}</div>
              </div>
              <div class="power">${Math.round(CORE.specPower(spec))}</div>
            </div>
            <p>${unit.note}</p>
          </div>
          <div class="equip-line">
            ${Object.keys(CORE.SLOTS).map((slot) => `<div class="mini-equip">${unit.equipment?.[slot]?.icon || "空"} ${unit.equipment?.[slot]?.level ? `L${unit.equipment[slot].level}` : ""}</div>`).join("")}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderLoot() {
    const loot = state.lastLoot || [];
    els.lootSummary.textContent = loot.length ? `${loot.length} 件` : "无";
    els.lootGrid.innerHTML = loot.map((item) => `<div class="item-cell rarity-${item.rarity}" data-level="L${item.level}" title="${item.name}">${item.icon}</div>`).join("");
  }

  function renderSignals() {
    const last = state.lastResult;
    if (last) {
      els.militiaSignal.textContent = `${last.topTaken.name} 承伤最高`;
      els.militiaSignalDetail.textContent = `输出最高：${last.topDamage.name} ${last.topDamage.amount}；治疗最高：${last.topHeal.name} ${last.topHeal.amount}；阵亡 ${last.deadAllies} 人。`;
      els.gateSignal.textContent = last.type === "卡点关" ? (last.win ? "卡点通过" : "卡点未过") : "非卡点";
      els.gateSignalDetail.textContent = last.field ? `场地 ${last.field}，观察是否需要换 1 个角色或先救英雄。` : "普通战斗主要观察数值成长。";
    }
    const epics = state.bag.filter((item) => item.rarity === "epic").length;
    const blues = state.bag.filter((item) => item.rarity === "blue").length;
    els.growthSignal.textContent = `${state.bag.length} 件装备`;
    els.growthSignalDetail.textContent = `蓝装 ${blues}，紫装 ${epics}，当前战力 ${CORE.teamPower(state)}。`;
    els.runLog.innerHTML = state.logs.slice(0, 10).map((line) => `<div>${line}</div>`).join("");
  }

  function unlockedStageIndex() {
    if (state.cleared.s2_gate) return 2;
    if (state.cleared.s1_gate) return 1;
    return 0;
  }

  function setStatus(text, tone) {
    els.statusPill.textContent = text;
    els.statusPill.className = `status-pill ${tone || ""}`.trim();
  }

  function pct(value) { return `${Math.round((value || 0) * 100)}%`; }

  function saveState() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || "");
    } catch {
      return null;
    }
  }
})();
