(() => {
  const CORE = window.GAME_MAP_PROGRESSION_COGNITION;
  const ENCOUNTERS = window.GAME_MAP_PROGRESSION_ENCOUNTERS;
  const STORAGE_KEY = "map_progression_candidate_v3";
  const els = Object.fromEntries([
    "nodeRail", "gearScore", "teamList", "reserveList", "battleStatus", "selectedTitle",
    "fightBtn", "battleMount", "encounterRead", "stepCount", "currentGoal", "latestResult",
    "knowledgeList", "eventHistory", "resetBtn", "saveState",
  ].map((id) => [id, document.getElementById(id)]));

  let state = loadState();
  let selectedId = null;
  let battleView = null;
  let battleRunning = false;

  if (!CORE) {
    els.battleStatus.textContent = "候选核心加载失败";
    return;
  }

  els.resetBtn.addEventListener("click", () => {
    if (battleRunning) return;
    state = CORE.initialState(`human-candidate-${Date.now()}`);
    selectedId = null;
    saveState();
    render();
  });
  els.fightBtn.addEventListener("click", startSelectedBattle);

  render();
  mountBattle();

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return raw ? CORE.normalizeState(raw) : CORE.initialState("human-candidate-v3");
    } catch (_) {
      return CORE.initialState("human-candidate-v3");
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    els.saveState.textContent = `已保存 · 第 ${state.step || 0} 步`;
  }

  function mountBattle() {
    if (battleView || !window.GAME_BATTLE_VIEW?.mount) return;
    battleView = window.GAME_BATTLE_VIEW.mount({
      container: els.battleMount,
      maxTime: 70,
      speed: 1.8,
      cameraMode: "fitUnits",
      cameraSmoothing: 0.07,
      onFinish: finishBattle,
    });
  }

  function render() {
    const observation = CORE.observe(state);
    const visible = new Map(observation.visibleNodes.map((node) => [node.id, node]));
    if (selectedId && !visible.has(selectedId)) selectedId = null;
    els.nodeRail.innerHTML = CORE.nodes.filter((node) => visible.has(node.id)).map((node) => {
      const row = visible.get(node.id);
      return `<button class="node-button ${row.status} ${selectedId === node.id ? "selected" : ""}" data-node="${node.id}" type="button">
        <strong>${escapeHtml(node.name)}</strong>
        <span>${statusLabel(row.status)} · ${escapeHtml(row.rewardHint)}</span>
      </button>`;
    }).join("");
    els.nodeRail.querySelectorAll("[data-node]").forEach((button) => button.addEventListener("click", () => selectNode(button.dataset.node)));

    els.gearScore.textContent = `装备 ${observation.gear.score}`;
    renderTeam(observation);
    renderCognition(observation);
    renderSelected(observation);
    els.stepCount.textContent = `第 ${observation.step} 步`;
    els.currentGoal.textContent = observation.currentGoal;
  }

  function renderTeam(observation) {
    const active = new Set(state.teamSlots);
    els.teamList.innerHTML = state.teamSlots.map((id, index) => {
      const unit = state.roster.find((row) => row.id === id);
      return `<div class="team-unit"><span class="unit-index">${index + 1}</span><div><strong>${escapeHtml(unit?.name || id)}</strong><span>${escapeHtml(unit?.note || unit?.role || "")}</span></div></div>`;
    }).join("");
    const reserve = state.roster.filter((unit) => !active.has(unit.id));
    els.reserveList.innerHTML = reserve.length ? reserve.map((unit) => `
      <div class="reserve-unit">
        <span class="unit-index">候</span>
        <div><strong>${escapeHtml(unit.name)}</strong><span>${escapeHtml(unit.note || unit.role || "")}</span></div>
        <div class="swap-actions">${state.teamSlots.map((_, slot) => `<button type="button" data-swap="swap:${slot}:${unit.id}">换${slot + 1}</button>`).join("")}</div>
      </div>`).join("") : `<div class="result-block">尚未营救新角色</div>`;
    els.reserveList.querySelectorAll("[data-swap]").forEach((button) => button.addEventListener("click", () => applyImmediateAction(button.dataset.swap)));
  }

  function renderSelected(observation) {
    const row = observation.visibleNodes.find((node) => node.id === selectedId);
    if (!row) {
      els.selectedTitle.textContent = "尚未选择";
      els.encounterRead.textContent = "选择一个可挑战节点查看敌人与奖励。";
      els.fightBtn.disabled = true;
      return;
    }
    els.selectedTitle.textContent = row.name;
    els.encounterRead.textContent = `敌人：${row.enemyHint}　奖励：${row.rewardHint}`;
    els.fightBtn.disabled = battleRunning || !["available", "farmable", "repeatable"].includes(row.status);
  }

  function renderCognition(observation) {
    const latest = state.history[0];
    els.latestResult.className = `result-block ${latest?.outcome || ""}`;
    els.latestResult.innerHTML = latest ? latestSummary(latest) : "尚无战斗结果";
    els.knowledgeList.innerHTML = observation.cognition.knowledge.slice(-6).reverse().map((text) => `<div>${escapeHtml(text)}</div>`).join("");
    els.eventHistory.innerHTML = state.history.slice(0, 16).map((event) => `<div>第 ${event.step} 步 · ${escapeHtml(actionLabel(event.action))} · ${escapeHtml(outcomeLabel(event.outcome))}</div>`).join("") || "<div>暂无记录</div>";
  }

  function selectNode(id) {
    if (battleRunning) return;
    selectedId = id;
    els.battleStatus.textContent = "关卡已选择";
    render();
  }

  function applyImmediateAction(action) {
    if (battleRunning) return;
    const result = CORE.applyAction(state, action, { captureVisibleSignals: true });
    if (!result.ok) return;
    state = result.state;
    saveState();
    render();
  }

  function startSelectedBattle() {
    if (battleRunning || !selectedId) return;
    const item = CORE.nodes.find((node) => node.id === selectedId);
    if (!item) return;
    mountBattle();
    const attempt = (state.attempts[item.id] || 0) + 1;
    const seed = `map-node|${item.id}|${attempt}|${CORE.gearScore(state)}|${state.seed}`;
    const fieldEffectId = item.id === "r1_main_6" ? "heavy_shield_lock" : ENCOUNTERS?.fieldEffectId?.(item);
    battleRunning = true;
    els.battleStatus.textContent = "真实战斗进行中";
    els.fightBtn.disabled = true;
    battleView.onFinish = finishBattle;
    battleView.start({
      leftTeam: CORE.playerTeam(state),
      rightTeam: CORE.enemyTeam(item),
      seed,
      title: item.name,
      randomizeStats: false,
      fieldEffectId,
    });
  }

  function finishBattle(renderedResult) {
    if (!battleRunning || !selectedId) return;
    const action = `challenge:${selectedId}`;
    const resolvedCombat = playedCombatResult(renderedResult);
    const result = CORE.applyAction(state, action, { captureVisibleSignals: true, resolvedCombat });
    battleRunning = false;
    if (!result.ok) {
      els.battleStatus.textContent = "结算失败";
      render();
      return;
    }
    state = result.state;
    els.battleStatus.textContent = result.event.outcome === "win" ? "胜利，状态已更新" : "失败，可调整后重试";
    saveState();
    render();
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
        id: unit.id,
        side: unit.side,
        index: unit.index,
        role: unit.role,
        name: unit.name,
        small1: unit.small1,
        small2: unit.small2,
        passive: unit.passive,
        ultimate: unit.ultimate,
        hp: unit.hp,
        maxHp: unit.maxHp,
        hpRatio: sim.hpRatio(unit),
        alive: sim.isAlive(unit),
        damageDone: unit.damageDone || 0,
      })),
      signals: [...(sim.signalBus?.signals || [])],
      summary: sim.signalBus?.summary?.() || {},
      metrics: sim.metrics(),
    };
  }

  function normalizeFallbackCombat(raw) {
    const side = (value) => value === "ally" ? "left" : value === "enemy" ? "right" : value;
    return {
      ...(raw || {}),
      units: (raw?.units || []).map((unit) => ({ ...unit, side: side(unit.side), hp: unit.hpNow ?? unit.hp, alive: (unit.hpNow ?? unit.hp ?? 0) > 0 })),
      signals: (raw?.signals || []).map((signal) => ({
        ...signal,
        source: signal.source ? { ...signal.source, side: side(signal.source.side) } : signal.source,
        target: signal.target ? { ...signal.target, side: side(signal.target.side) } : signal.target,
      })),
    };
  }

  function latestSummary(event) {
    if (event.outcome === "team_changed") return `队伍已调整，下一场战斗会记录这次尝试的结果。`;
    const loot = event.loot?.length ? `获得 ${event.loot.length} 件装备，装备分 ${event.gearBefore} → ${event.gearAfter}` : "没有获得新装备";
    const diagnosis = event.outcome === "loss" && event.diagnosis ? `；主要承伤：${damageType(event.diagnosis.dominantDamage)}` : "";
    const proof = event.roleProof ? `；角色证据：${event.roleProof.evidence}` : "";
    return `${outcomeLabel(event.outcome)} · ${Number(event.duration || 0).toFixed(1)} 秒 · ${loot}${diagnosis}${proof}`;
  }

  function statusLabel(status) { return ({ available: "可挑战", farmable: "可重复", repeatable: "可复战" })[status] || status; }
  function outcomeLabel(outcome) { return ({ win: "胜利", loss: "失败", team_changed: "更换角色" })[outcome] || outcome || "未知"; }
  function actionLabel(action) {
    if (String(action).startsWith("challenge:")) return CORE.nodes.find((node) => node.id === action.split(":")[1])?.name || action;
    return "调整队伍";
  }
  function damageType(type) { return ({ physical: "物理", magic: "法术", effect: "持续效果" })[type] || "未知"; }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
})();
