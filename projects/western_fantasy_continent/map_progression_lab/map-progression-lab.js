(function initMapProgressionLab() {
  const SAVE_KEY = "agent_automata_map_progression_lab_v2";
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
  let drag = null;
  let autoTimer = 0;
  let battleView = null;
  let waveTimers = [];

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
      index === 0 ? "地区内部第一关。" : "沿地区主线推进。",
      index % 3 === 2 ? ["蓝装"] : ["白装", "金币"],
      index === 0 ? [] : [`${regionId}_main_${index}`],
    ));
    const branches = [
      node(`${regionId}_bandit`, regionId, "branch", "强盗营地", extras.bandit, "支线营地", "固定品质装备奖励。先打主线第 4 关解锁。", ["1 紫装", "2 蓝装"], [`${regionId}_main_4`]),
      node(`${regionId}_prison`, regionId, "branch", "监狱", extras.prison, "支线救援", "固定救出一个角色。先打主线第 5 关解锁。", [regionIndex === 0 ? "林地游侠" : regionIndex === 1 ? "破盾战士" : "晨祷牧师"], [`${regionId}_main_5`]),
      node(`${regionId}_boss`, regionId, "boss", "地区 Boss", extras.boss, "Boss 关", "第 10 关之后的收束战。", ["大量金币", "稀有装备"], [`${regionId}_main_10`]),
    ];
    return [...gates, ...line, ...branches];
  }

  function node(id, regionId, type, name, pos, label, desc, rewards, requires = []) {
    return { id, regionId, type, name, x: pos[0], y: pos[1], label, desc, rewards, requires };
  }

  function initialState() {
    return {
      cleared: {},
      rewards: [],
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
      drag = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      els.mapStage.classList.add("dragging");
      els.mapStage.setPointerCapture(event.pointerId);
    });
    els.mapStage.addEventListener("pointermove", (event) => {
      if (!drag) return;
      pan = clampPan({
        x: drag.panX + event.clientX - drag.x,
        y: drag.panY + event.clientY - drag.y,
      });
      applyPan();
    });
    els.mapStage.addEventListener("pointerup", finishDrag);
    els.mapStage.addEventListener("pointercancel", finishDrag);
    els.nodeLayer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-node-id]");
      if (!button) return;
      selectedId = button.dataset.nodeId;
      state.selectedId = selectedId;
      saveState();
      render();
    });
    els.fightBtn.addEventListener("click", () => {
      const current = findNode(selectedId);
      if (!current || !isAvailable(current) || state.cleared[current.id]) return;
      clearNode(current);
    });
    els.autoFiveBtn.addEventListener("click", () => autoChallenge(5));
    els.previewBattleBtn.addEventListener("click", previewBattle);
    els.playBattleBtn.addEventListener("click", playBattleWaves);
    window.addEventListener("resize", () => {
      pan = clampPan(pan);
      applyPan();
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
    state.pan = pan;
    saveState();
  }

  function render() {
    const selected = findNode(selectedId) || allNodes()[0];
    selectedId = selected.id;
    state.selectedId = selectedId;
    const selectedRegion = regions.find((region) => region.id === selected.regionId) || regions[0];
    applyPan();
    renderRegions(selectedRegion.id);
    renderLinks();
    renderNodes();
    renderRegionPanel(selectedRegion);
    renderNodePanel(selected);
    renderRewards();
    renderAutoButton();
  }

  function applyPan() {
    pan = clampPan(pan);
    els.mapCanvas.style.transform = `translate(${Math.round(pan.x)}px, ${Math.round(pan.y)}px)`;
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
    els.nodeTitle.textContent = item.name;
    els.nodeDesc.textContent = item.desc;
    els.nodeMeta.innerHTML = `
      <div class="meta-chip">类型<strong>${item.label}</strong></div>
      <div class="meta-chip">状态<strong>${statusName(status)}</strong></div>
      <div class="meta-chip">奖励<strong>${item.rewards.join("、")}</strong></div>
      <div class="meta-chip">敌人结构<strong>${enemyPreview(item)}</strong></div>
    `;
    els.fightBtn.disabled = !available;
    els.fightBtn.textContent = state.cleared[item.id] ? "已胜利" : available ? "自动胜利" : "尚未解锁";
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
        pairs.push({ from: `${region.id}_main_${index}`, to: `${region.id}_main_${index + 1}`, kind: "main", bend: index % 2 ? 10 : -10 });
      }
      pairs.push({ from: `${region.id}_main_4`, to: `${region.id}_bandit`, kind: "branch", bend: -34 });
      pairs.push({ from: `${region.id}_main_5`, to: `${region.id}_prison`, kind: "branch", bend: 34 });
      pairs.push({ from: `${region.id}_main_10`, to: `${region.id}_boss`, kind: "boss", bend: 10 });
    }
    pairs.push({ from: "r1_boss", to: "r2_gate_north", kind: "region", bend: -12 });
    pairs.push({ from: "r2_boss", to: "r3_gate_pass", kind: "region", bend: 12 });
    return pairs;
  }

  function linkStatus(from, to) {
    if (state.cleared[to.id]) return "cleared";
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
    if (item.type === "gate") return true;
    if (!regionInteriorUnlocked(region)) return false;
    return (item.requires || []).every((id) => state.cleared[id]);
  }

  function clearNode(item) {
    state.cleared[item.id] = true;
    selectedId = item.id;
    state.selectedId = selectedId;
    state.rewards.unshift(`${item.name}：${item.rewards.join("、")}`);
    saveState();
    render();
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
      clearNode(next);
      remaining -= 1;
      if (remaining <= 0) {
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
    if (isAvailable(item)) return "available";
    return "locked";
  }

  function statusName(status) {
    return { cleared: "已完成", available: "可挑战", locked: "锁定" }[status] || status;
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
      onFinish: () => {},
    });
    return battleView;
  }

  function previewBattle() {
    stopBattleWaves();
    els.waveStatus.textContent = "预览";
    mountBattle()?.preview({
      title: "敌群增援模拟",
      leftTeam: playerTeam(),
      rightTeam: waveOne(),
    });
  }

  function playBattleWaves() {
    stopBattleWaves();
    const view = mountBattle();
    if (!view) return;
    els.waveStatus.textContent = "第一段：4 个近战小怪";
    view.start({
      title: "固定时间敌潮开始：第一段 4 个近战小怪",
      seed: `map-wave-fixed-${Date.now()}`,
      leftTeam: playerTeam(),
      rightTeam: waveOne().map((unit, index) => spawnSpec(unit, index, 4)),
      randomizeStats: false,
    });
    const waves = [
      { title: "第二段：追加 3 近战 + 4 远程", rightTeam: waveTwo(), delay: 2400 },
      { title: "终段：追加标准敌队", rightTeam: standardEnemyTeam(), delay: 7600 },
    ];
    for (const wave of waves) {
      const timer = window.setTimeout(() => {
        els.waveStatus.textContent = wave.title;
        addEnemyWave(wave.rightTeam, wave.title);
      }, wave.delay);
      waveTimers.push(timer);
    }
  }

  function stopBattleWaves() {
    for (const timer of waveTimers) window.clearTimeout(timer);
    waveTimers = [];
  }

  function addEnemyWave(specs, title) {
    const view = mountBattle();
    if (!view || !view.state) return;
    const enemyOffset = view.state.units.filter((unit) => unit.side === "enemy").length;
    const incoming = view.makeUnits("enemy", specs.map((spec, index) => spawnSpec(spec, index, specs.length)));
    incoming.forEach((unit, index) => {
      unit.unitId = `enemy_wave_${enemyOffset + index}`;
      unit.id = unit.unitId;
      unit.x = 96;
      unit.y = 18 + ((index + 1) / (incoming.length + 1)) * 64;
      unit.attackCd = 1.1 + index * 0.05;
    });
    view.state.units.push(...incoming);
    view.state.logs.unshift(`${title}进场，当前敌人 ${view.state.units.filter((unit) => unit.side === "enemy" && view.alive(unit)).length}。`);
    view.state.result = null;
    if (!view.state.running && view.state.units.some((unit) => unit.side === "ally" && view.alive(unit))) {
      view.state.running = true;
      view.state.lastFrame = performance.now();
      view.state.raf = setInterval(() => view.tick(performance.now()), 33);
    }
    view.render();
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

  function waveOne() {
    return Array.from({ length: 4 }, (_, index) => weakMelee(index));
  }

  function waveTwo() {
    return [
      ...Array.from({ length: 3 }, (_, index) => weakMelee(index)),
      ...Array.from({ length: 4 }, (_, index) => weakRanged(index)),
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
