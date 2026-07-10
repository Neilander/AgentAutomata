(function initMapProgressionLab() {
  const SAVE_KEY = "agent_automata_map_progression_lab_v3";
  const MAP_WIDTH = 1400;
  const MAP_HEIGHT = 900;
  const AUTO_STEP_MS = 200;
  const LABEL_PLACEMENTS = {
    r1_gate_west: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)", align: "left" },
    r1_gate_south: { left: "50%", top: "calc(100% + 8px)", transform: "translateX(-50%)", align: "center" },
    r1_bandit: { left: "50%", top: "calc(100% + 8px)", transform: "translateX(-50%)", align: "center" },
    r1_prison: { left: "-8px", top: "50%", transform: "translate(-100%, -50%)", align: "right" },
    r1_boss: { left: "50%", top: "-10px", transform: "translate(-50%, -100%)", align: "center" },
    r2_gate_north: { left: "50%", top: "calc(100% + 10px)", transform: "translateX(-50%)", align: "center" },
    r2_gate_south: { left: "-8px", top: "50%", transform: "translate(-100%, -50%)", align: "right" },
    r2_bandit: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)", align: "left" },
    r2_prison: { left: "50%", top: "calc(100% + 8px)", transform: "translateX(-50%)", align: "center" },
    r2_boss: { left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)", align: "left" },
    r3_gate_pass: { left: "-8px", top: "50%", transform: "translate(-100%, -50%)", align: "right" },
    r3_bandit: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)", align: "left" },
    r3_prison: { left: "-8px", top: "50%", transform: "translate(-100%, -50%)", align: "right" },
    r3_boss: { left: "-8px", top: "50%", transform: "translate(-100%, -50%)", align: "right" },
  };

  const regions = [
    {
      id: "r1",
      name: "灰鸦郊野",
      desc: "盗匪巡逻、哨塔和旧路口组成的新手外圈。",
      gates: [],
      nodes: makeRegionNodes("r1", 0, [
        [160, 580], [214, 530], [268, 482], [322, 438], [376, 394],
        [430, 350], [492, 326], [538, 288], [574, 246], [596, 202],
      ], { bandit: [396, 520], prison: [420, 270], boss: [688, 172] }),
    },
    {
      id: "r2",
      name: "旧矿丘",
      desc: "废矿、补给线和矮墙营地交错，适合验证第二地区解锁。",
      gates: ["r2_gate_north", "r2_gate_south"],
      requires: ["r1_boss"],
      nodes: makeRegionNodes("r2", 1, [
        [782, 274], [820, 316], [856, 360], [892, 408], [926, 460],
        [958, 502], [982, 562], [1002, 624], [1014, 674], [1018, 714],
      ], { bandit: [910, 558], prison: [918, 312], boss: [1060, 746] }),
    },
    {
      id: "r3",
      name: "黑松边境",
      desc: "林线压迫道路，后续可放多波敌人和边境 boss。",
      gates: ["r3_gate_pass"],
      requires: ["r2_boss"],
      nodes: makeRegionNodes("r3", 2, [
        [1118, 740], [1158, 684], [1198, 628], [1238, 572], [1272, 516],
        [1292, 462], [1280, 414], [1242, 382], [1198, 360], [1152, 344],
      ], { bandit: [1284, 632], prison: [1162, 448], boss: [1094, 326] }),
    },
  ];

  let state = normalizeState(loadState() || initialState());
  let selectedId = state.selectedId || "r1_main_1";
  let pan = state.pan || { x: -34, y: -92 };
  let mapCamera = null;
  let mapFocus = null;
  let mapRaf = 0;
  let drag = null;
  let autoTimer = 0;
  let battleView = null;
  let waveTimers = [];

  const allyOpeningSlots = [
    { x: 18, y: 36, line: "前排" },
    { x: 18, y: 64, line: "前排" },
    { x: 2, y: 32, line: "后排" },
    { x: 2, y: 68, line: "后排" },
  ];

  const fixedMarchSpeed = 8;
  const marchContactRange = 22;

  const battleTerrain = {
    ground: [[-20, -12], [126, -14], [130, 112], [-22, 114]],
    rocks: [
      { tone: "light", points: [[6, 22], [11, 18], [18, 20], [20, 26], [15, 32], [8, 30]] },
      { tone: "", points: [[23, 72], [30, 67], [38, 70], [41, 78], [34, 85], [25, 82]] },
      { tone: "dark", points: [[61, 18], [67, 15], [75, 18], [78, 26], [73, 32], [64, 29]] },
      { tone: "", points: [[82, 58], [90, 54], [98, 58], [100, 67], [93, 74], [84, 71]] },
      { tone: "dark", points: [[11, 84], [17, 81], [23, 84], [25, 90], [20, 96], [12, 94]] },
      { tone: "light", points: [[45, 43], [51, 39], [59, 42], [61, 50], [55, 56], [47, 53]] },
    ],
    lines: [
      [[-4, 39], [14, 36], [32, 38], [51, 35]],
      [[53, 82], [72, 79], [91, 80], [111, 76]],
      [[34, 12], [52, 11], [70, 13], [88, 10]],
    ],
  };

  const els = {
    resetBtn: document.getElementById("resetBtn"),
    navButtons: document.querySelectorAll("[data-page]"),
    mapStage: document.getElementById("mapStage"),
    battlePage: document.getElementById("battlePage"),
    mapCanvas: document.getElementById("mapCanvas"),
    linkLayer: document.getElementById("linkLayer"),
    nodeLayer: document.getElementById("nodeLayer"),
    regionTitle: document.getElementById("regionTitle"),
    regionDesc: document.getElementById("regionDesc"),
    regionState: document.getElementById("regionState"),
    nodeTitle: document.getElementById("nodeTitle"),
    nodeDesc: document.getElementById("nodeDesc"),
    nodeMeta: document.getElementById("nodeMeta"),
    fightBtn: document.getElementById("fightBtn"),
    autoFiveBtn: document.getElementById("autoFiveBtn"),
    rewardLog: document.getElementById("rewardLog"),
    battleMount: document.getElementById("battleMount"),
    waveStatus: document.getElementById("waveStatus"),
    previewBattleBtn: document.getElementById("previewBattleBtn"),
    playBattleBtn: document.getElementById("playBattleBtn"),
  };

  bind();
  render();

  function makeRegionNodes(regionId, regionIndex, linePoints, extras) {
    const regionNo = regionIndex + 1;
    const gates = regionIndex === 0
      ? []
      : regionIndex === 1
        ? [
            node(`${regionId}_gate_north`, regionId, "gate", "北矿关口", [752, 234], "入口关口", "打过任意入口关口后，解锁旧矿丘内部关卡。", ["蓝装", "金币"]),
            node(`${regionId}_gate_south`, regionId, "gate", "南坡关口", [556, 780], "入口关口", "旧矿丘的第二个入口，奖励独立。", ["稀有装备"]),
          ]
        : [
            node(`${regionId}_gate_pass`, regionId, "gate", "黑松隘口", [1086, 780], "入口关口", "边境入口，后续可接更复杂多波战。", ["稀有装备", "金币"]),
          ];
    const line = linePoints.map((point, index) => node(
      `${regionId}_main_${index + 1}`,
      regionId,
      "main",
      `${regionNo}-${index + 1}`,
      point,
      "线性关卡",
      regionId === "r1" && index === 4 ? "救出旧塔监狱里的角色后，验证新角色带来的战斗过程变化。" : index === 0 ? "地区内部第一关。" : "沿地区主线推进。",
      index % 3 === 2 ? ["蓝装"] : ["白装", "金币"],
      mainNodeRequires(regionId, index),
    ));
    const branches = [
      node(`${regionId}_bandit`, regionId, "branch", regionId === "r1" ? "旧塔军械营地" : "强盗营地", extras.bandit, "支线营地", regionId === "r1" ? "附近的军械营地，也许有攻坚装备。" : "固定品质装备奖励。先打主线第 4 关解锁。", regionId === "r1" ? ["2 高等级白装", "1 蓝装"] : ["1 紫装", "2 蓝装"], [`${regionId}_main_4`]),
      node(`${regionId}_prison`, regionId, "branch", regionId === "r1" ? "旧塔监狱" : "监狱", extras.prison, "支线救援", regionId === "r1" ? "里面关着一名可救出的角色。先试着救人。" : "固定救出一个角色。先打主线第 5 关解锁。", [regionIndex === 0 ? "林地游侠" : regionIndex === 1 ? "破盾战士" : "晨祷牧师"], [regionId === "r1" ? `${regionId}_main_4` : `${regionId}_main_5`]),
      node(`${regionId}_boss`, regionId, "boss", "地区 Boss", extras.boss, "Boss 关", "第 10 关之后的收束战。", ["大量金币", "稀有装备"], [`${regionId}_main_10`]),
    ];
    return [...gates, ...line, ...branches];
  }

  function mainNodeRequires(regionId, index) {
    if (index === 0) return [];
    const nodeNo = index + 1;
    if (regionId === "r1" && nodeNo === 5) return ["r1_prison"];
    return [`${regionId}_main_${index}`];
  }

  function node(id, regionId, type, name, pos, label, desc, rewards, requires = []) {
    return { id, regionId, type, name, x: pos[0], y: pos[1], label, desc, rewards, requires };
  }

  function initialState() {
    return {
      cleared: {},
      rewards: [],
      flags: { r1PrisonFailed: false },
      selectedId: "r1_main_1",
      pan: { x: -34, y: -92 },
    };
  }

  function normalizeState(value) {
    return {
      ...initialState(),
      ...value,
      cleared: value.cleared || {},
      rewards: value.rewards || [],
      flags: { ...initialState().flags, ...(value.flags || {}) },
      pan: value.pan || { x: -34, y: -92 },
    };
  }

  function bind() {
    for (const button of els.navButtons) {
      button.addEventListener("click", () => {
        const page = button.dataset.page;
        if (page === "disabled") return;
        switchPage(page);
      });
    }
    els.resetBtn.addEventListener("click", () => {
      stopAutoChallenge();
      state = initialState();
      selectedId = state.selectedId;
      pan = state.pan;
      saveState();
      render();
    });
    els.mapStage.addEventListener("pointerdown", (event) => {
      if (event.target.closest("[data-node-id]")) return;
      setupMapCamera();
      drag = { x: event.clientX, y: event.clientY };
      els.mapStage.classList.add("dragging");
      els.mapStage.setPointerCapture(event.pointerId);
    });
    els.mapStage.addEventListener("pointermove", (event) => {
      if (!drag || !mapCamera) return;
      mapCamera.panByScreen(event.clientX - drag.x, event.clientY - drag.y);
      drag.x = event.clientX;
      drag.y = event.clientY;
      mapFocus = null;
      renderMapCamera();
    });
    els.mapStage.addEventListener("pointerup", finishDrag);
    els.mapStage.addEventListener("pointercancel", finishDrag);
    els.mapStage.addEventListener("wheel", (event) => {
      setupMapCamera();
      if (!mapCamera) return;
      event.preventDefault();
      const rect = els.mapStage.getBoundingClientRect();
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      mapCamera.setZoom(mapCamera.snapshot().zoom * (event.deltaY > 0 ? 0.88 : 1.14), anchor);
      mapFocus = null;
      renderMapCamera();
      saveCameraState();
      saveState();
    }, { passive: false });
    els.nodeLayer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-node-id]");
      if (!button) return;
      selectedId = button.dataset.nodeId;
      state.selectedId = selectedId;
      saveState();
      render();
      focusMapNode(selectedId);
    });
    els.fightBtn.addEventListener("click", () => {
      const current = findNode(selectedId);
      if (!current || !isAvailable(current) || state.cleared[current.id]) return;
      attemptNode(current);
    });
    els.autoFiveBtn.addEventListener("click", () => autoChallenge(5));
    els.previewBattleBtn.addEventListener("click", previewBattle);
    els.playBattleBtn.addEventListener("click", playBattleWaves);
    window.addEventListener("resize", () => {
      setupMapCamera();
      renderMapCamera();
    });
  }

  function switchPage(page) {
    for (const button of els.navButtons) button.classList.toggle("active", button.dataset.page === page);
    els.mapStage.classList.toggle("active", page === "map");
    els.battlePage.classList.toggle("active", page === "battle");
    if (page === "battle") previewBattle();
  }

  function finishDrag(event) {
    if (!drag) return;
    drag = null;
    els.mapStage.classList.remove("dragging");
    try {
      els.mapStage.releasePointerCapture(event.pointerId);
    } catch {}
    saveCameraState();
    saveState();
  }

  function render() {
    const selected = findNode(selectedId) || allNodes()[0];
    selectedId = selected.id;
    state.selectedId = selectedId;
    const selectedRegion = regions.find((region) => region.id === selected.regionId) || regions[0];
    const hadCamera = Boolean(mapCamera);
    setupMapCamera();
    renderRegions(selectedRegion.id);
    renderLinks();
    renderNodes();
    renderRegionPanel(selectedRegion);
    renderNodePanel(selected);
    renderRewards();
    renderAutoButton();
    focusMapNode(selectedId, !hadCamera);
  }

  function applyPan() {
    setupMapCamera();
    renderMapCamera();
  }

  function clampPan(value) {
    const rect = els.mapStage.getBoundingClientRect();
    const minX = Math.min(0, rect.width - MAP_WIDTH - 24);
    const minY = Math.min(0, rect.height - MAP_HEIGHT - 24);
    return {
      x: Math.max(minX, Math.min(24, value.x)),
      y: Math.max(minY, Math.min(24, value.y)),
    };
  }

  function setupMapCamera() {
    if (!window.AgentAutomataCamera2D?.createCamera2D || !els.mapStage) return;
    const rect = els.mapStage.getBoundingClientRect();
    const width = Math.max(1, rect.width || 720);
    const height = Math.max(1, rect.height || 620);
    if (!mapCamera) {
      const saved = state.camera || {};
      mapCamera = window.AgentAutomataCamera2D.createCamera2D({
        x: Number.isFinite(saved.x) ? saved.x : MAP_WIDTH / 2,
        y: Number.isFinite(saved.y) ? saved.y : MAP_HEIGHT / 2,
        zoom: Number.isFinite(saved.zoom) ? saved.zoom : Math.max(0.52, Math.min(width / MAP_WIDTH, height / MAP_HEIGHT) * 1.08),
        minZoom: 0.42,
        maxZoom: 1.65,
        viewportWidth: width,
        viewportHeight: height,
        worldBounds: { minX: 0, minY: 0, maxX: MAP_WIDTH, maxY: MAP_HEIGHT },
      });
      startMapCameraLoop();
    } else {
      mapCamera.setViewport(width, height);
      mapCamera.setWorldBounds({ minX: 0, minY: 0, maxX: MAP_WIDTH, maxY: MAP_HEIGHT });
    }
  }

  function focusMapNode(nodeId, instant = false) {
    if (!mapCamera) return;
    const item = findNode(nodeId);
    if (!item) return;
    const zoom = mapCamera.snapshot().zoom;
    mapFocus = { x: item.x, y: item.y, zoom: Math.max(0.62, zoom) };
    if (instant) {
      mapCamera.setPosition(mapFocus.x, mapFocus.y).setZoom(mapFocus.zoom);
      renderMapCamera();
      saveCameraState();
    }
  }

  function startMapCameraLoop() {
    if (mapRaf) return;
    const step = () => {
      if (mapCamera && mapFocus) {
        mapCamera.moveToward(mapFocus, 0.11);
        renderMapCamera();
      }
      mapRaf = requestAnimationFrame(step);
    };
    mapRaf = requestAnimationFrame(step);
  }

  function renderMapCamera() {
    if (!mapCamera || !els.mapCanvas) return;
    const snapshot = mapCamera.snapshot();
    els.mapCanvas.style.transform = `translate(${snapshot.viewportWidth / 2}px, ${snapshot.viewportHeight / 2}px) scale(${snapshot.zoom}) translate(${-snapshot.x}px, ${-snapshot.y}px)`;
  }

  function saveCameraState() {
    if (!mapCamera) return;
    const snapshot = mapCamera.snapshot();
    state.camera = {
      x: Math.round(snapshot.x),
      y: Math.round(snapshot.y),
      zoom: Number(snapshot.zoom.toFixed(3)),
    };
  }

  function renderRegions(selectedRegionId) {
    for (const region of regions) {
      const shape = document.querySelector(`[data-region="${region.id}"]`);
      if (!shape) continue;
      shape.classList.toggle("locked", !isRegionUnlocked(region));
      shape.classList.toggle("selected", region.id === selectedRegionId);
    }
  }

  function renderLinks() {
    els.linkLayer.innerHTML = linkPairs().map((link) => {
      const from = findNode(link.from);
      const to = findNode(link.to);
      if (!from || !to) return "";
      if (shouldHideLink(link, from, to)) return "";
      const status = linkStatus(from, to);
      const classes = ["map-link", status, link.kind === "branch" ? "branch-link" : "", link.kind === "boss" ? "boss-link" : "", link.kind === "region" ? "region-link" : ""].filter(Boolean).join(" ");
      return `<path class="${classes}" d="${curvedPath(from, to, link.bend || 0)}"></path>`;
    }).join("");
  }

  function renderNodes() {
    els.nodeLayer.innerHTML = allNodes().filter((item) => !shouldHideNode(item)).map((item) => {
      const status = nodeStatus(item);
      return `
        <button type="button" class="map-node ${item.type} ${status} ${item.id === selectedId ? "selected" : ""}" data-node-id="${item.id}" style="left:${item.x}px;top:${item.y}px">
          ${nodeIcon(item)}
          <span class="node-label" style="${labelStyle(item)}">${item.name}</span>
        </button>
      `;
    }).join("");
  }

  function labelStyle(item) {
    const placement = LABEL_PLACEMENTS[item.id];
    if (!placement) return "";
    return [
      `--label-left:${placement.left}`,
      `--label-top:${placement.top}`,
      `--label-transform:${placement.transform}`,
      `--label-align:${placement.align}`,
    ].join(";");
  }

  function renderRegionPanel(region) {
    const nodes = region.nodes;
    const cleared = nodes.filter((item) => state.cleared[item.id]).length;
    const gatesCleared = region.gates.filter((id) => state.cleared[id]).length;
    els.regionTitle.textContent = region.name;
    els.regionDesc.textContent = region.desc;
    els.regionState.innerHTML = `
      <div class="state-chip">地区状态<strong>${isRegionUnlocked(region) ? "已解锁" : "未解锁"}</strong></div>
      <div class="state-chip">入口关口<strong>${region.gates.length ? `${gatesCleared}/${region.gates.length}` : "起始地区"}</strong></div>
      <div class="state-chip">关卡进度<strong>${cleared}/${nodes.length}</strong></div>
      <div class="state-chip">Boss<strong>${state.cleared[`${region.id}_boss`] ? "已击破" : "未击破"}</strong></div>
    `;
  }

  function renderNodePanel(item) {
    const status = nodeStatus(item);
    const available = status === "available";
    const display = nodeDisplay(item);
    els.nodeTitle.textContent = item.name;
    els.nodeDesc.textContent = display.desc;
    els.nodeMeta.innerHTML = `
      <div class="meta-chip">类型<strong>${item.label}</strong></div>
      <div class="meta-chip">状态<strong>${statusName(status)}</strong></div>
      <div class="meta-chip">奖励<strong>${display.rewards.join("、")}</strong></div>
      <div class="meta-chip">敌人结构<strong>${enemyPreview(item)}</strong></div>
    `;
    els.fightBtn.disabled = !available;
    els.fightBtn.textContent = fightButtonText(item, status);
  }

  function renderAutoButton() {
    const available = nextAvailableNodes().length;
    els.autoFiveBtn.disabled = autoTimer || available <= 0;
    els.autoFiveBtn.textContent = autoTimer ? "自动挑战中..." : available ? "自动挑战 5 关" : "暂无可挑战";
  }

  function renderRewards() {
    els.rewardLog.innerHTML = state.rewards.length
      ? state.rewards.slice(0, 18).map((line) => `<div>${line}</div>`).join("")
      : "<div>暂无奖励。先点击可挑战关卡自动胜利。</div>";
  }

  function linkPairs() {
    const pairs = [];
    for (const region of regions) {
      for (const gate of region.gates) pairs.push({ from: gate, to: `${region.id}_main_1`, kind: "gate", bend: gate.endsWith("south") ? 34 : -22 });
      for (let index = 1; index < 10; index += 1) {
        if (region.id === "r1" && index === 4) continue;
        pairs.push({ from: `${region.id}_main_${index}`, to: `${region.id}_main_${index + 1}`, kind: "main", bend: index % 2 ? 10 : -10 });
      }
      pairs.push({ from: `${region.id}_main_4`, to: `${region.id}_bandit`, kind: "branch", bend: -34 });
      pairs.push({ from: region.id === "r1" ? "r1_main_4" : `${region.id}_main_5`, to: `${region.id}_prison`, kind: "branch", bend: 34 });
      if (region.id === "r1") pairs.push({ from: "r1_prison", to: "r1_main_5", kind: "main", bend: -14 });
      pairs.push({ from: `${region.id}_main_10`, to: `${region.id}_boss`, kind: "boss", bend: 10 });
    }
    pairs.push({ from: "r1_boss", to: "r2_gate_north", kind: "region", bend: -12 });
    pairs.push({ from: "r2_boss", to: "r3_gate_pass", kind: "region", bend: 12 });
    return pairs;
  }

  function linkStatus(from, to) {
    if (state.cleared[to.id]) return "cleared";
    if (nodeStatus(to) === "preview") return "preview";
    if (isR1PrisonWaitingForCamp(to)) return "locked";
    if (isAvailable(to) || state.cleared[from.id]) return "available";
    return "locked";
  }

  function shouldHideNode(item) {
    const region = regions.find((entry) => entry.id === item.regionId);
    if (!region || isRegionUnlocked(region)) return false;
    return item.type !== "gate";
  }

  function shouldHideLink(link, from, to) {
    if (link.kind === "region" && !state.cleared[from.id]) return true;
    const fromRegion = regions.find((entry) => entry.id === from.regionId);
    const toRegion = regions.find((entry) => entry.id === to.regionId);
    if (fromRegion && !isRegionUnlocked(fromRegion) && from.type !== "gate") return true;
    if (toRegion && !isRegionUnlocked(toRegion) && to.type !== "gate") return true;
    return false;
  }

  function curvedPath(from, to, bend) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const nx = -dy / length;
    const ny = dx / length;
    const cx = Math.round(midX + nx * bend);
    const cy = Math.round(midY + ny * bend);
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  }

  function isRegionUnlocked(region) {
    if (!region.requires || !region.requires.length) return true;
    return region.requires.some((id) => state.cleared[id]);
  }

  function regionInteriorUnlocked(region) {
    if (!region.gates.length) return true;
    return region.gates.some((id) => state.cleared[id]);
  }

  function isAvailable(item) {
    const region = regions.find((entry) => entry.id === item.regionId);
    if (!region || !isRegionUnlocked(region)) return false;
    if (state.cleared[item.id]) return false;
    if (isR1BanditPreview(item)) return false;
    if (isR1PrisonWaitingForCamp(item)) return false;
    if (item.type === "gate") return true;
    if (!regionInteriorUnlocked(region)) return false;
    return (item.requires || []).every((id) => state.cleared[id]);
  }

  function isR1BanditPreview(item) {
    return item.id === "r1_bandit" && state.cleared.r1_main_4 && !state.flags.r1PrisonFailed;
  }

  function shouldFirstFailPrison(item) {
    return item.id === "r1_prison" && !state.flags.r1PrisonFailed && !state.cleared.r1_bandit;
  }

  function isR1PrisonWaitingForCamp(item) {
    return item.id === "r1_prison" && state.flags.r1PrisonFailed && !state.cleared.r1_bandit;
  }

  function attemptNode(item) {
    if (shouldFirstFailPrison(item)) {
      state.flags.r1PrisonFailed = true;
      selectedId = "r1_bandit";
      state.selectedId = selectedId;
      state.rewards.unshift("旧塔监狱：战力还不够，也许附近的军械能帮助攻坚。");
      saveState();
      render();
      focusMapNode(selectedId);
      return { type: "failure", id: item.id };
    }
    clearNode(item);
    return { type: "clear", id: item.id };
  }

  function clearNode(item) {
    state.cleared[item.id] = true;
    selectedId = nextFocusAfterClear(item) || item.id;
    state.selectedId = selectedId;
    state.rewards.unshift(`${item.name}：${nodeDisplay(item).rewards.join("、")}`);
    saveState();
    render();
    focusMapNode(selectedId);
  }

  function nextFocusAfterClear(item) {
    if (item.id === "r1_main_4") return "r1_prison";
    if (item.id === "r1_bandit") return "r1_prison";
    if (item.id === "r1_prison") return "r1_main_5";
    return "";
  }

  function autoChallenge(count) {
    stopAutoChallenge();
    let remaining = count;
    const step = () => {
      const next = nextAvailableNodes()[0];
      if (!next || remaining <= 0) {
        stopAutoChallenge();
        render();
        return;
      }
      const result = attemptNode(next);
      remaining -= 1;
      if (result.type === "failure" || remaining <= 0) {
        stopAutoChallenge();
        render();
        return;
      }
      autoTimer = window.setTimeout(step, AUTO_STEP_MS);
      renderAutoButton();
    };
    step();
  }

  function stopAutoChallenge() {
    if (!autoTimer) return;
    window.clearTimeout(autoTimer);
    autoTimer = 0;
  }

  function nextAvailableNodes() {
    return allNodes().filter((item) => isAvailable(item)).sort((a, b) => nodeRank(a) - nodeRank(b));
  }

  function nodeRank(item) {
    const regionIndex = regions.findIndex((region) => region.id === item.regionId);
    const typeOrder = { gate: 0, main: 1, branch: 2, boss: 3 };
    const mainNo = item.type === "main" ? Number(item.name.split("-")[1] || 0) : 0;
    return regionIndex * 1000 + (typeOrder[item.type] ?? 9) * 100 + mainNo;
  }

  function nodeStatus(item) {
    if (state.cleared[item.id]) return "cleared";
    if (isR1BanditPreview(item)) return "preview";
    if (isAvailable(item)) return "available";
    return "locked";
  }

  function statusName(status) {
    return { cleared: "已完成", available: "可挑战", preview: "预备线索", locked: "锁定" }[status] || status;
  }

  function nodeDisplay(item) {
    if (item.id === "r1_bandit") {
      return {
        desc: state.flags.r1PrisonFailed ? "旧塔军械也许能帮你重新攻进监狱。" : "附近的军械营地，也许有攻坚装备。先确认旧塔监狱的阻力。",
        rewards: ["2 高等级白装", "1 蓝装"],
      };
    }
    if (item.id === "r1_prison" && state.flags.r1PrisonFailed && !state.cleared.r1_bandit) {
      return {
        desc: "刚才攻坚失败了。先去旧塔军械营地准备装备，再回来救人。",
        rewards: item.rewards,
      };
    }
    if (item.id === "r1_main_5") {
      return {
        desc: "救出林地游侠后，观察新角色如何更早处理后排威胁。",
        rewards: item.rewards,
      };
    }
    return { desc: item.desc, rewards: item.rewards };
  }

  function fightButtonText(item, status) {
    if (state.cleared[item.id]) return "已胜利";
    if (status === "preview") return "先试旧塔监狱";
    if (!isAvailable(item)) return "尚未解锁";
    if (shouldFirstFailPrison(item)) return "尝试救人";
    return "自动胜利";
  }

  function nodeIcon(item) {
    if (item.type === "gate") return "门";
    if (item.type === "branch") return item.id.includes("prison") ? "牢" : "营";
    if (item.type === "boss") return "王";
    return item.name.split("-")[1] || "·";
  }

  function enemyPreview(item) {
    if (item.type === "boss") return "先 4 个护卫，后 6 个援军，再 Boss";
    if (item.type === "gate") return "4 个守门敌人";
    if (item.id.includes("bandit")) return "先 4 个强盗，后 6 个营地援军";
    if (item.id.includes("prison")) return "3 个看守，救援后撤离";
    const index = Number(item.name.split("-")[1] || 1);
    return index >= 7 ? "先 4 个小怪，后 6 个增援" : "4 个小怪";
  }

  function mountBattle() {
    if (battleView || !window.GAME_BATTLE_VIEW?.mount || !els.battleMount) return battleView;
    battleView = window.GAME_BATTLE_VIEW.mount({
      container: els.battleMount,
      maxTime: 32,
      speed: 1.25,
      cameraMode: "fitUnits",
      cameraSmoothing: 0.06,
      onFinish: () => {},
    });
    installBattleCameraBounds(battleView);
    installBattleTerrain(battleView);
    installBattleMarchPatch(battleView);
    installBattleCameraModes(battleView);
    return battleView;
  }

  function installBattleCameraBounds(view) {
    if (!view || view._mapCameraBoundsPatchInstalled) return;
    view.battleWorldBounds = (width, height) => {
      const aspect = view.battleAspect(width, height);
      return {
        minX: -28 * aspect,
        minY: -12,
        maxX: 150 * aspect,
        maxY: 112,
      };
    };
    view._mapCameraBoundsPatchInstalled = true;
  }

  function installBattleMarchPatch(view) {
    if (!view || view._mapMarchPatchInstalled) return;
    const baseChooseTarget = view.chooseTarget.bind(view);
    view.chooseTarget = (unit) => {
      if (unit.side !== "ally") return baseChooseTarget(unit);
      const foes = view.enemies(unit).filter((enemy) => view.alive(enemy));
      if (!foes.length) return null;
      return foes.sort(view.byDistance(unit))[0];
    };
    view.update = (dt) => {
      view.state.time += dt;
      for (const unit of view.state.units.filter((item) => view.alive(item))) {
        view.tickStatus(unit, dt);
        unit.attackCd -= dt * (unit.haste > 0 ? 1.4 : 1);
        unit.skillCd = unit.skillCd.map((cd) => Math.max(0, cd - dt));
        unit.ultCd = Math.max(0, unit.ultCd - dt);
        for (const key of ["haste", "slow", "guard", "taunt", "immortal", "lifeSteal", "bloodFury", "whirlwind", "roarFury", "retaliationTimer", "bonusPowerTimer"]) {
          unit[key] = Math.max(0, unit[key] - dt);
        }
        for (const key of ["hiddenTimer", "hiddenRetaliateTimer", "forcedTargetTimer"]) {
          unit[key] = Math.max(0, unit[key] - dt);
        }
        if (unit.forcedTargetTimer <= 0) unit.forcedTargetId = null;
        unit.counterCd = Math.max(0, unit.counterCd - dt);

        if (unit.marchTarget) {
          const contact = view.chooseTarget(unit);
          const contactDistance = contact ? view.dist(unit, contact) : Infinity;
          if (contactDistance <= Math.max(unit.range, marchContactRange)) {
            unit.marchTarget = null;
          } else {
            moveMarchUnit(view, unit, unit.marchTarget, dt);
            if (view.dist(unit, unit.marchTarget) <= 1.1) {
              completeMarchTarget(unit);
            }
            continue;
          }
        }

        const target = view.chooseTarget(unit);
        if (!target) continue;
        const distance = view.dist(unit, target);
        if (distance > unit.range) {
          view.moveToward(unit, target, dt);
          continue;
        }
        if (unit.ultCd <= 0) view.cast(unit, target, "ult");
        else if (unit.skillCd[0] <= 0) view.cast(unit, target, 0);
        else if (unit.skillCd[1] <= 0) view.cast(unit, target, 1);
        else if (unit.attackCd <= 0) view.basic(unit, target);
      }
      view.state.signalBus?.emitHealthSnapshots(view.state.units, view.state.time);
      view.finishIfNeeded();
    };
    view._mapMarchPatchInstalled = true;
  }

  function installBattleCameraModes(view) {
    if (!view || view._mapCameraModePatchInstalled) return;
    view.updatePresentation = (dt) => {
      view.syncPresentationViewport();
      updateMapBattleCamera(view);
      view.state.postStack?.update?.(dt * 1000);
      view.updateVfxNodes(dt);
    };
    view._mapCameraModePatchInstalled = true;
  }

  function updateMapBattleCamera(view) {
    if (!view?.state?.camera || !view.els?.field) return;
    const allies = view.state.units.filter((unit) => unit.side === "ally" && view.alive(unit));
    const enemies = view.state.units.filter((unit) => unit.side === "enemy" && view.alive(unit));
    if (!allies.length) return;
    const snapshot = view.state.camera.snapshot();
    const defaultZoom = view.baseCameraZoom(snapshot.viewportWidth, snapshot.viewportHeight) * 1.04;
    const allyBounds = unitBounds(allies);
    const enemyCount = enemies.length || 1;
    const leftAlly = allies.reduce((best, unit) => unit.x < best.x ? unit : best, allies[0]);
    const rightAlly = allies.reduce((best, unit) => unit.x > best.x ? unit : best, allies[0]);
    const enemiesRightOfLeft = enemies.filter((enemy) => enemy.x >= leftAlly.x).length / enemyCount;
    const enemiesLeftOfRight = enemies.filter((enemy) => enemy.x <= rightAlly.x).length / enemyCount;
    const alliesClustered = allyBounds.width <= 34 && allyBounds.height <= 48;

    if (alliesClustered && enemies.length && enemiesRightOfLeft >= 0.8) {
      moveCameraToHalfField(view, leftAlly, 1, defaultZoom);
      return;
    }
    if (alliesClustered && enemies.length && enemiesLeftOfRight >= 0.8) {
      moveCameraToHalfField(view, rightAlly, -1, defaultZoom);
      return;
    }

    const active = [...allies, ...enemies];
    const bounds = unitBounds(active);
    const center = view.battleWorldPoint({ x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 });
    view.state.camera.moveToward({
      x: center.x,
      y: center.y,
      zoom: Math.max(snapshot.minZoom, Math.min(snapshot.maxZoom, defaultZoom * 0.66)),
    }, 0.08);
  }

  function moveCameraToHalfField(view, anchorUnit, direction, defaultZoom) {
    const snapshot = view.state.camera.snapshot();
    const zoom = Math.max(snapshot.minZoom, Math.min(snapshot.maxZoom, defaultZoom));
    const anchor = view.battleWorldPoint(anchorUnit);
    const offsetWorldX = (snapshot.viewportWidth / zoom) * (5 / 16) * direction;
    view.state.camera.moveToward({
      x: anchor.x + offsetWorldX,
      y: view.battleWorldPoint({ x: anchorUnit.x, y: 50 }).y,
      zoom,
    }, 0.08);
  }

  function unitBounds(units) {
    return {
      minX: Math.min(...units.map((unit) => unit.x)),
      maxX: Math.max(...units.map((unit) => unit.x)),
      minY: Math.min(...units.map((unit) => unit.y)),
      maxY: Math.max(...units.map((unit) => unit.y)),
      width: Math.max(...units.map((unit) => unit.x)) - Math.min(...units.map((unit) => unit.x)),
      height: Math.max(...units.map((unit) => unit.y)) - Math.min(...units.map((unit) => unit.y)),
    };
  }

  function installBattleTerrain(view) {
    if (!view?.els?.worldLayer || view._mapTerrainInstalled) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("battle-terrain-layer");
    svg.setAttribute("aria-hidden", "true");
    view.els.worldLayer.insertBefore(svg, view.els.worldLayer.firstChild);
    view._mapTerrainLayer = svg;
    view._mapTerrainInstalled = true;
    const originalRender = view.render.bind(view);
    view.render = () => {
      originalRender();
      renderBattleTerrain(view);
    };
    renderBattleTerrain(view);
  }

  function renderBattleTerrain(view) {
    const svg = view?._mapTerrainLayer;
    const field = view?.els?.field;
    if (!svg || !field) return;
    const rect = field.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = [
      terrainPolygon(battleTerrain.ground, "battle-terrain-ground", view, width, height),
      ...battleTerrain.rocks.map((rock) => terrainPolygon(rock.points, `battle-terrain-rock ${rock.tone}`.trim(), view, width, height)),
      ...battleTerrain.lines.map((line) => terrainLine(line, view, width, height)),
    ].join("");
  }

  function terrainPolygon(points, className, view, width, height) {
    return `<polygon class="${className}" points="${points.map((point) => terrainPoint(point, view, width, height)).join(" ")}"></polygon>`;
  }

  function terrainLine(points, view, width, height) {
    return `<polyline class="battle-terrain-line" points="${points.map((point) => terrainPoint(point, view, width, height)).join(" ")}"></polyline>`;
  }

  function terrainPoint(point, view, width, height) {
    const [x, y] = point;
    if (view.state?.camera?.worldToScreen && view.battleWorldPoint) {
      const screen = view.state.camera.worldToScreen(view.battleWorldPoint({ x, y }));
      return `${round(screen.x, 1)},${round(screen.y, 1)}`;
    }
    return `${round(x / 100 * width, 1)},${round(y / 100 * height, 1)}`;
  }

  function round(value, digits = 0) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function previewBattle() {
    stopBattleWaves();
    els.waveStatus.textContent = "预览";
    mountBattle()?.preview({
      title: "敌群增援模拟",
      leftTeam: playerTeam(),
      rightTeam: smallWaveOne(),
    });
  }

  function playBattleWaves() {
    stopBattleWaves();
    const view = mountBattle();
    if (!view) return;
    const waves = battleWaves();
    els.waveStatus.textContent = waves[0].smallWaves[0].title;
    view.start({
      title: waves[0].smallWaves[0].startTitle,
      seed: `map-wave-fixed-${Date.now()}`,
      leftTeam: playerTeam(),
      rightTeam: waves[0].smallWaves[0].rightTeam.map((unit, index) => spawnSpec(unit, index, waves[0].smallWaves[0].rightTeam.length)),
      randomizeStats: false,
    });
    queueExistingEnemies(view);
    waitForSmallWaveClear(view, waves, 0, 0);
  }

  function battleWaves() {
    return [
      {
        title: "大波 1：小怪试探",
        regroupAfter: true,
        smallWaves: [
          { title: "大波 1-1：近战探路", startTitle: "敌潮开始：近战探路", rightTeam: smallWaveOne(), nextDelay: 1900 },
          { title: "大波 1-2：混合骚扰", startTitle: "混合骚扰进场", rightTeam: smallWaveTwo(), nextDelay: 2400 },
        ],
      },
      {
        title: "大波 2：标准敌队",
        regroupAfter: false,
        smallWaves: [
          { title: "大波 2：标准敌队压上", startTitle: "标准敌队压上", rightTeam: standardEnemyTeam(), nextDelay: 0 },
        ],
      },
    ];
  }

  function stopBattleWaves() {
    for (const timer of waveTimers) {
      window.clearTimeout(timer);
      window.clearInterval(timer);
      window.cancelAnimationFrame(timer);
    }
    waveTimers = [];
  }

  function addEnemyWave(specs, title) {
    const view = mountBattle();
    if (!view || !view.state) return;
    const enemyOffset = view.state.units.filter((unit) => unit.side === "enemy").length;
    const incoming = view.makeUnits("enemy", specs.map((spec, index) => spawnSpec(spec, index, specs.length)));
    const formation = enemyFormation(incoming);
    incoming.forEach((unit, index) => {
      unit.unitId = `enemy_wave_${enemyOffset + index}`;
      unit.id = unit.unitId;
      const target = formation[index];
      unit.x = 118 + index * 5;
      unit.y = target.y;
      unit.marchTarget = target;
      unit.attackCd = 1.1 + index * 0.05;
    });
    view.state.units.push(...incoming);
    view.state.logs.unshift(`${title}进场，当前敌人 ${view.state.units.filter((unit) => unit.side === "enemy" && view.alive(unit)).length}。`);
    view.state.result = null;
    if (!view.state.running && view.state.units.some((unit) => unit.side === "ally" && view.alive(unit))) {
      view.state.running = true;
      if (view.resetPresentationClock) view.resetPresentationClock(performance.now());
      else view.state.lastFrame = performance.now();
      view.state.raf = setInterval(() => view.tick(performance.now()), 33);
    }
    view.render();
  }

  function queueExistingEnemies(view) {
    const enemies = view.state.units.filter((unit) => unit.side === "enemy" && view.alive(unit));
    const formation = enemyFormation(enemies);
    enemies.forEach((unit, index) => {
      const target = formation[index];
      unit.x = 118 + index * 5;
      unit.y = target.y;
      unit.marchTarget = target;
    });
    view.render();
  }

  function enemyFormation(units) {
    const frontYs = [36, 64, 50];
    const backYs = [34, 50, 66, 42, 58];
    let front = 0;
    let back = 0;
    return units.map((unit) => {
      const isBack = unit.range >= 20 || unit.line === "后排";
      if (isBack) {
        const y = backYs[back % backYs.length] + Math.floor(back / backYs.length) * 5;
        back += 1;
        return { x: 88, y, line: "后排" };
      }
      const y = frontYs[front % frontYs.length] + Math.floor(front / frontYs.length) * 5;
      front += 1;
      return { x: 74, y, line: "前排" };
    });
  }

  function waitForSmallWaveClear(view, bigWaves, bigIndex, smallIndex) {
    const bigWave = bigWaves[bigIndex];
    const smallWave = bigWave?.smallWaves?.[smallIndex];
    if (!smallWave) return;
    let checks = 0;
    const poll = window.setInterval(() => {
      checks += 1;
      const aliveEnemies = view.state.units.filter((unit) => unit.side === "enemy" && view.alive(unit));
      const aliveAllies = view.state.units.filter((unit) => unit.side === "ally" && view.alive(unit));
      const hasNextSmall = Boolean(bigWave.smallWaves[smallIndex + 1]);
      if (!aliveAllies.length) {
        window.clearInterval(poll);
        return;
      }
      if ((hasNextSmall ? aliveEnemies.length <= 2 : !aliveEnemies.length) || checks > 34) {
        window.clearInterval(poll);
        advanceWaveDirector(view, bigWaves, bigIndex, smallIndex);
      }
    }, 650);
    waveTimers.push(poll);
  }

  function advanceWaveDirector(view, bigWaves, bigIndex, smallIndex) {
    const bigWave = bigWaves[bigIndex];
    const smallWave = bigWave.smallWaves[smallIndex];
    const nextSmall = bigWave.smallWaves[smallIndex + 1];
    if (nextSmall) {
      els.waveStatus.textContent = nextSmall.title;
      addEnemyWave(nextSmall.rightTeam, nextSmall.startTitle);
      waitForSmallWaveClear(view, bigWaves, bigIndex, smallIndex + 1);
      return;
    }
    const nextBig = bigWaves[bigIndex + 1];
    if (!nextBig) return;
    const launchNextBig = () => {
      const first = nextBig.smallWaves[0];
      els.waveStatus.textContent = first.title;
      addEnemyWave(first.rightTeam, first.startTitle);
      waitForSmallWaveClear(view, bigWaves, bigIndex + 1, 0);
    };
    if (bigWave.regroupAfter) {
      regroupAllies(view, `${bigWave.title}结束，队伍重新集结`, () => {
        const regroupPause = window.setTimeout(() => {
          marchAlliesRight(view, () => {
            const timer = window.setTimeout(launchNextBig, 420);
            waveTimers.push(timer);
          });
        }, 500);
        waveTimers.push(regroupPause);
      });
      return;
    }
    launchNextBig();
  }

  function regroupAllies(view, title, onComplete) {
    if (!view?.state?.units) return;
    const allies = view.state.units.filter((unit) => unit.side === "ally" && view.alive(unit));
    if (!allies.length) return;
    const anchor = leftmostUnit(allies);
    const anchorSlot = openingSlotFor(anchor);
    const currentCenterY = allies.reduce((sum, unit) => sum + unit.y, 0) / Math.max(1, allies.length);
    const yOffset = currentCenterY - 50;
    allies.forEach((unit) => {
      unit.targetId = null;
      unit.attackAnim = 0;
      const slot = openingSlotFor(unit);
      unit.marchTarget = {
        x: anchor.x + (slot.x - anchorSlot.x),
        y: Math.max(22, Math.min(78, slot.y + yOffset)),
        line: slot.line,
      };
    });
    view.state.logs.unshift(title);
    els.waveStatus.textContent = title;
    runOutOfCombatMarch(view, allies, { cameraMode: "rightHalf", label: title }, onComplete);
  }

  function marchAlliesRight(view, onComplete) {
    const allies = view.state.units.filter((unit) => unit.side === "ally" && view.alive(unit));
    if (!allies.length) return;
    allies.forEach((unit) => {
      unit.marchTarget = {
        x: unit.x + 12,
        y: unit.y,
        line: unit.line,
      };
    });
    view.state.logs.unshift("队伍保持四方阵向右推进。");
    els.waveStatus.textContent = "队伍向右推进";
    runOutOfCombatMarch(view, allies, { cameraMode: "rightHalf", label: "队伍向右推进" }, onComplete);
  }

  function runOutOfCombatMarch(view, units, options, onComplete) {
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.2, (now - last) / 1000 || 0.016) * view.speed;
      last = now;
      let allArrived = true;
      for (const unit of units.filter((item) => view.alive(item) && item.marchTarget)) {
        moveMarchUnit(view, unit, unit.marchTarget, dt);
        if (view.dist(unit, unit.marchTarget) <= 1.1) {
          completeMarchTarget(unit);
        } else {
          allArrived = false;
        }
      }
      if (view.state.camera) {
        moveOutOfCombatCamera(view, units, options);
      }
      view.render();
      if (!allArrived) {
        const raf = requestAnimationFrame(step);
        waveTimers.push(raf);
      } else if (onComplete) {
        onComplete();
      }
    };
    const raf = requestAnimationFrame(step);
    waveTimers.push(raf);
  }

  function moveMarchUnit(view, unit, target, dt) {
    const distance = view.dist(unit, target);
    if (!distance) return;
    const step = Math.min(distance, dt * fixedMarchSpeed);
    unit.x += ((target.x - unit.x) / distance) * step;
    unit.y += ((target.y - unit.y) / distance) * step;
  }

  function completeMarchTarget(unit) {
    unit.x = unit.marchTarget.x;
    unit.y = unit.marchTarget.y;
    unit.homeX = unit.marchTarget.x;
    unit.homeY = unit.marchTarget.y;
    unit.line = unit.marchTarget.line || unit.line;
    unit.marchTarget = null;
  }

  function moveOutOfCombatCamera(view, units, options = {}) {
    const aliveUnits = units.filter((unit) => view.alive(unit));
    if (options.cameraMode === "rightHalf" && aliveUnits.length) {
      const snapshot = view.state.camera.snapshot();
      const defaultZoom = view.baseCameraZoom(snapshot.viewportWidth, snapshot.viewportHeight) * 1.04;
      moveCameraToHalfField(view, leftmostUnit(aliveUnits), 1, defaultZoom);
      return;
    }
    if (Number.isFinite(options.cameraX)) {
      const snapshot = view.state.camera.snapshot();
      const center = view.battleWorldPoint ? view.battleWorldPoint({ x: options.cameraX, y: 50 }) : { x: options.cameraX, y: 50 };
      view.state.camera.moveToward({
        x: center.x,
        y: center.y,
        zoom: Math.max(snapshot.minZoom, Math.min(snapshot.maxZoom, snapshot.zoom)),
      }, 0.12);
    }
  }

  function leftmostUnit(units) {
    return units.reduce((best, unit) => unit.x < best.x ? unit : best, units[0]);
  }

  function openingSlotFor(unit) {
    const index = Number.isFinite(unit?.slotIndex) ? unit.slotIndex : 0;
    return allyOpeningSlots[index % allyOpeningSlots.length];
  }

  function spawnSpec(spec, index, count) {
    return {
      ...spec,
      homeX: 92 + (index % 2) * 4,
      homeY: 18 + ((index + 1) / (count + 1)) * 64,
      slotIndex: index,
    };
  }

  function playerTeam() {
    return [
      { name: "骑士", roleKey: "knight", roleName: "骑士", hp: 520, power: 46, armor: 18, range: 9, slotIndex: 0 },
      { name: "狂战士", roleKey: "berserker", roleName: "狂战士", hp: 430, power: 58, armor: 10, range: 9, slotIndex: 1 },
      { name: "法师", roleKey: "mage", roleName: "法师", hp: 310, power: 64, armor: 5, range: 28, slotIndex: 2 },
      { name: "牧师", roleKey: "priest", roleName: "牧师", hp: 340, power: 42, armor: 6, range: 25, slotIndex: 3 },
    ];
  }

  function smallWaveOne() {
    return Array.from({ length: 3 }, (_, index) => weakMelee(index));
  }

  function smallWaveTwo() {
    return [
      ...Array.from({ length: 2 }, (_, index) => weakMelee(index)),
      ...Array.from({ length: 3 }, (_, index) => weakRanged(index)),
    ];
  }

  function standardEnemyTeam() {
    return [
      { name: "敌方骑士", roleKey: "knight", roleName: "敌方骑士", hp: 360, power: 34, armor: 12, range: 8, slotIndex: 0 },
      { name: "敌方战士", roleKey: "warrior", roleName: "敌方战士", hp: 330, power: 42, armor: 9, range: 9, slotIndex: 1 },
      { name: "敌方法师", roleKey: "mage", roleName: "敌方法师", hp: 230, power: 45, armor: 4, range: 26, slotIndex: 2 },
      { name: "敌方牧师", roleKey: "priest", roleName: "敌方牧师", hp: 260, power: 32, armor: 5, range: 24, slotIndex: 3 },
    ];
  }

  function weakMelee(index) {
    return { name: `近战小怪${index + 1}`, roleKey: "warrior", roleName: "近战小怪", iconText: "刀", hp: 95, power: 18, armor: 3, range: 7, slotIndex: index };
  }

  function weakRanged(index) {
    return { name: `远程小怪${index + 1}`, roleKey: "ranger", roleName: "远程小怪", iconText: "弓", hp: 72, power: 16, armor: 1, range: 25, slotIndex: index + 3 };
  }

  function allNodes() {
    return regions.flatMap((region) => region.nodes);
  }

  function findNode(id) {
    return allNodes().find((item) => item.id === id);
  }

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
