const ICON_BASE = "https://game-icons.net/icons/000000/ffffff/1x1/lorc";
const DATA = window.GAME_ENCOUNTER_DATA;
const SKILLS = window.GAME_SKILL_DATA;
const SIM = window.GAME_COMBAT_SIM;

if (!DATA || !SKILLS || !SIM) {
  throw new Error("Encounter lab requires encounter data, skill data, and combat sim.");
}

const state = {
  levelIndex: 0,
  selected: [],
  lastResult: null,
  replay: null,
  battleView: null,
  solutionCache: new Map(),
};

const els = {
  levelStrip: document.querySelector("#levelStrip"),
  rosterGrid: document.querySelector("#rosterGrid"),
  squadSlots: document.querySelector("#squadSlots"),
  teamHint: document.querySelector("#teamHint"),
  pickCounter: document.querySelector("#pickCounter"),
  runBtn: document.querySelector("#runBtn"),
  autoBtn: document.querySelector("#autoBtn"),
  battlefield: document.querySelector("#battlefield"),
  battleTitle: document.querySelector("#battleTitle"),
  battleState: document.querySelector("#battleState"),
  resultBadge: document.querySelector("#resultBadge"),
  leftHp: document.querySelector("#leftHp"),
  rightHp: document.querySelector("#rightHp"),
  duration: document.querySelector("#duration"),
  combatFeed: document.querySelector("#combatFeed"),
  solverSummary: document.querySelector("#solverSummary"),
  enemyBrief: document.querySelector("#enemyBrief"),
  resultBox: document.querySelector("#resultBox"),
  winnerList: document.querySelector("#winnerList"),
  failList: document.querySelector("#failList"),
};

function init() {
  state.battleView = window.GAME_BATTLE_VIEW.mount({
    container: els.battlefield,
    maxTime: 75,
    onFinish: onBattleFinish,
  });
  renderLevels();
  selectLevel(0);
  els.runBtn.addEventListener("click", runCurrent);
  els.autoBtn.addEventListener("click", pickRecommended);
}

function currentLevel() {
  return DATA.ENCOUNTER_LEVELS[state.levelIndex];
}

function renderLevels() {
  els.levelStrip.innerHTML = DATA.ENCOUNTER_LEVELS.map((level, index) => {
    const solution = getSolutions(level);
    return `
      <button class="level-card ${index === state.levelIndex ? "active" : ""}" type="button" data-level="${index}">
        <em>选择 ${level.chooseCount} 人 · ${solution.winners.length}/${solution.combos.length} 可过</em>
        <strong>${level.name}</strong>
        <span>${level.fantasy}</span>
      </button>
    `;
  }).join("");
  els.levelStrip.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => selectLevel(Number(button.dataset.level)));
  });
}

function selectLevel(index) {
  stopReplay();
  state.battleView?.reset();
  state.levelIndex = index;
  state.selected = [];
  state.lastResult = null;
  renderAll();
}

function renderAll() {
  const level = currentLevel();
  renderLevels();
  renderEnemyBrief(level);
  renderRoster();
  renderSquad();
  renderBattlefield(null);
  renderSolver(level);
  renderResult(null);
}

function renderEnemyBrief(level) {
  els.battleTitle.textContent = level.name;
  const enemies = level.enemyTeam.map((enemy) => {
    const tags = (enemy.tags || []).map((tag) => `<span class="tag warn">${tag}</span>`).join("");
    return `
      <article class="enemy-card danger">
        <div class="entity-head">
          ${iconMarkup(enemy.icon || "crossed-swords", enemy.name)}
          <span><strong>${enemy.name}</strong><small>${enemy.roleName || "敌人"} · 血量 ${formatNumber(enemy.hp)} · 攻击 ${formatNumber(enemy.power)}</small></span>
        </div>
        <div class="skill-line">技能：${skillName(enemy.small1)} / ${skillName(enemy.small2)} / ${skillName(enemy.ultimate)}</div>
        <div class="tag-line">${tags}</div>
      </article>
    `;
  }).join("");
  els.enemyBrief.innerHTML = `
    <div class="brief-card">
      <strong>关卡目标</strong>
      <p>${level.fantasy}</p>
      <div class="tag-line">
        <span class="tag need">选 ${level.chooseCount} 人</span>
        <span class="tag need">${level.enemyTeam.length} 个敌人</span>
        <span class="tag">通过条件：敌方全灭且我方存活</span>
      </div>
    </div>
    ${enemies}
  `;
}

function renderRoster() {
  const level = currentLevel();
  els.pickCounter.textContent = `${state.selected.length} / ${level.chooseCount}`;
  els.rosterGrid.innerHTML = level.rosterIds.map((id) => {
    const unit = DATA.ENCOUNTER_ROSTER[id];
    const role = SKILLS.roleKits[unit.role] || {};
    const selected = state.selected.includes(id);
    const disabled = !selected && state.selected.length >= level.chooseCount;
    return `
      <button class="hero-card ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}" type="button" data-id="${id}">
        <div class="entity-head">
          ${iconMarkup(role.icon || "crossed-swords", unit.name)}
          <span><strong>${unit.name}</strong><small>${role.role || unit.role} · ${formatNumber(role.hp || unit.hp)}血 / ${formatNumber(role.power || unit.power)}攻</small></span>
        </div>
        <div class="tag-line">${(unit.tags || []).slice(0, 4).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        <div class="skill-line">小技：${skillName(unit.small1)} / ${skillName(unit.small2)}<br>大招：${skillName(unit.ultimate)}</div>
      </button>
    `;
  }).join("");
  els.rosterGrid.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => toggleRoster(button.dataset.id));
  });
}

function renderSquad() {
  const level = currentLevel();
  const slots = Array.from({ length: level.chooseCount }, (_, index) => state.selected[index] || null);
  els.squadSlots.innerHTML = slots.map((id, index) => {
    if (!id) return `<div class="slot-card empty">空位 ${index + 1}</div>`;
    const unit = DATA.ENCOUNTER_ROSTER[id];
    const role = SKILLS.roleKits[unit.role] || {};
    return `
      <button class="slot-card" type="button" data-remove="${id}">
        <div class="entity-head">
          ${iconMarkup(role.icon || "crossed-swords", unit.name)}
          <span><strong>${unit.name}</strong><small>${role.role || unit.role}</small></span>
        </div>
        <div class="tag-line">${(unit.tags || []).slice(0, 3).map((tag) => `<span class="tag need">${tag}</span>`).join("")}</div>
      </button>
    `;
  }).join("");
  els.squadSlots.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => toggleRoster(button.dataset.remove));
  });

  const hint = teamHint(level);
  els.teamHint.textContent = hint.text;
  els.teamHint.className = `team-hint ${hint.kind}`;
}

function teamHint(level) {
  if (state.selected.length < level.chooseCount) {
    return { kind: "warn", text: `还差 ${level.chooseCount - state.selected.length} 人。先根据敌人威胁补前排、治疗、爆发或异常。` };
  }
  const tags = new Set(state.selected.flatMap((id) => DATA.ENCOUNTER_ROSTER[id].tags || []));
  const notes = [];
  if (level.enemyTeam.some((enemy) => (enemy.tags || []).includes("physical")) && !tags.has("shield") && !tags.has("heal")) {
    notes.push("敌人有物理压力，但队伍缺护盾/治疗");
  }
  if (level.enemyTeam.some((enemy) => (enemy.tags || []).includes("clock")) && !tags.has("burst") && !tags.has("focus")) {
    notes.push("敌人会拖时间，队伍缺爆发/集火");
  }
  if (level.enemyTeam.some((enemy) => (enemy.tags || []).includes("armor")) && !tags.has("poison") && !tags.has("burn") && !tags.has("status")) {
    notes.push("敌人高护甲，队伍缺异常绕甲");
  }
  if (notes.length) return { kind: "warn", text: notes.join("；") };
  return { kind: "ready", text: "队伍结构看起来可打，点击开始挑战验证。" };
}

function toggleRoster(id) {
  stopReplay();
  state.battleView?.reset();
  const level = currentLevel();
  if (state.selected.includes(id)) {
    state.selected = state.selected.filter((item) => item !== id);
  } else if (state.selected.length < level.chooseCount) {
    state.selected = [...state.selected, id];
  }
  state.lastResult = null;
  renderRoster();
  renderSquad();
  renderBattlefield(null);
  renderResult(null);
}

function runCurrent() {
  stopReplay();
  const level = currentLevel();
  if (state.selected.length !== level.chooseCount) {
    renderResult({ error: `需要选择 ${level.chooseCount} 人。` });
    return;
  }
  state.lastResult = null;
  els.battleState.textContent = "战斗中";
  renderResult({ playing: true });
  state.battleView.start({
    leftTeam: DATA.rosterTeam(state.selected),
    rightTeam: cloneTeam(level.enemyTeam),
    seed: `${level.id}|ui|${state.selected.join("+")}`,
    title: level.name,
  });
}

function onBattleFinish(result) {
  const passed = result.metrics.rightAlive === 0 && result.metrics.leftAlive > 0;
  state.lastResult = { ...result, passed };
  els.battleState.textContent = passed ? "通关" : "失败";
  renderResult(state.lastResult);
}

function pickRecommended() {
  stopReplay();
  const level = currentLevel();
  state.selected = recommendedIds(level).slice(0, level.chooseCount);
  state.lastResult = null;
  renderRoster();
  renderSquad();
  runCurrent();
}

function renderBattlefield(result, replayTime = null) {
  if (!state.battleView) return;
  if (!result) {
    const level = currentLevel();
    state.battleView.preview({
      leftTeam: DATA.rosterTeam(state.selected),
      rightTeam: cloneTeam(level.enemyTeam),
      title: level.name,
    });
  }
  return;
}

function renderLegacyBattlefield(result, replayTime = null) {
  const level = currentLevel();
  const playing = result && replayTime !== null && replayTime < result.duration;
  const view = result ? replayView(result, replayTime ?? result.duration) : null;
  els.battleState.textContent = result ? (playing ? "战斗中" : result.passed ? "通关" : "失败") : "待命";
  els.leftHp.textContent = view ? formatNumber(view.leftHpScore) : "0";
  els.rightHp.textContent = view ? formatNumber(view.rightHpScore) : "0";
  els.duration.textContent = result ? `${(replayTime ?? result.duration).toFixed(1)}s` : "0s";

  const leftSpecs = DATA.rosterTeam(state.selected);
  const rightSpecs = cloneTeam(level.enemyTeam);
  const resultUnits = view?.units || [];
  const units = [
    ...leftSpecs.map((unit, index) => previewUnit("left", unit, index, resultUnits)),
    ...rightSpecs.map((unit, index) => previewUnit("right", unit, index, resultUnits)),
  ];
  const floaters = view ? renderFloaters(result, replayTime ?? result.duration, units) : "";
  els.battlefield.innerHTML = `
    <div class="formation-label ally-front">前排</div>
    <div class="formation-label ally-back">后排</div>
    <div class="formation-label enemy-front">前排</div>
    <div class="formation-label enemy-back">后排</div>
    ${units.map(renderUnit).join("")}
    ${floaters}
  `;
  renderCombatFeed(result, replayTime);
}

function previewUnit(side, spec, index, resultUnits) {
  const role = SKILLS.roleKits[spec.role] || spec;
  const resolved = resultUnits.find((unit) => unit.side === side && unit.index === index);
  const positions = side === "left"
    ? [{ x: 34, y: 34 }, { x: 34, y: 66 }, { x: 20, y: 28 }, { x: 20, y: 72 }, { x: 16, y: 50 }, { x: 42, y: 50 }]
    : [{ x: 66, y: 36 }, { x: 66, y: 64 }, { x: 82, y: 36 }, { x: 82, y: 64 }];
  const slot = positions[index % positions.length];
  return {
    id: `${side}-${index + 1}`,
    side,
    name: spec.name || role.name,
    roleName: spec.roleName || role.role || "敌人",
    icon: spec.icon || role.icon || "crossed-swords",
    x: slot.x,
    y: slot.y,
    hpRatio: resolved ? resolved.hpRatio : 1,
    hp: resolved ? resolved.hp : (spec.hp || role.hp),
    alive: resolved ? resolved.alive : true,
  };
}

function renderUnit(unit) {
  return `
    <div class="unit ${unit.side === "right" ? "enemy" : ""} ${unit.alive ? "" : "dead"}" data-unit="${unit.id}" style="left:${unit.x}%;top:${unit.y}%">
      ${iconMarkup(unit.icon, unit.name)}
      <span class="unit-name">${unit.name}</span>
      <div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, Math.min(100, unit.hpRatio * 100))}%"></div></div>
      <div class="unit-meta">${unit.roleName} · ${formatNumber(unit.hp)}</div>
    </div>
  `;
}

function startReplay(result) {
  const speed = 13;
  const startedAt = performance.now();
  state.replay = { result, speed, startedAt, raf: 0 };
  renderResult({ playing: true, result });

  const tick = (now) => {
    if (!state.replay || state.replay.result !== result) return;
    const elapsed = ((now - startedAt) / 1000) * speed;
    const time = Math.min(result.duration, elapsed);
    renderBattlefield(result, time);
    if (time < result.duration) {
      state.replay.raf = requestAnimationFrame(tick);
    } else {
      state.replay = null;
      renderBattlefield(result, result.duration);
      renderResult(result);
    }
  };
  state.replay.raf = requestAnimationFrame(tick);
}

function stopReplay() {
  if (state.replay?.raf) cancelAnimationFrame(state.replay.raf);
  state.replay = null;
}

function replayView(result, time) {
  const units = new Map();
  for (const unit of result.units || []) {
    units.set(unit.id, {
      ...unit,
      hp: unit.maxHp,
      hpRatio: 1,
      alive: true,
    });
  }
  for (const signal of result.signals || []) {
    if (signal.time > time) continue;
    if (signal.kind === "health" && signal.target?.id && units.has(signal.target.id)) {
      const unit = units.get(signal.target.id);
      unit.hp = Number(signal.hp ?? unit.hp);
      unit.maxHp = Number(signal.maxHp ?? unit.maxHp);
      unit.hpRatio = unit.maxHp ? unit.hp / unit.maxHp : 0;
      unit.alive = unit.hp > 0;
    }
    if (signal.kind === "death" && signal.target?.id && units.has(signal.target.id)) {
      const unit = units.get(signal.target.id);
      unit.hp = 0;
      unit.hpRatio = 0;
      unit.alive = false;
    }
  }
  const unitList = Array.from(units.values());
  return {
    units: unitList,
    leftHpScore: unitList.filter((unit) => unit.side === "left").reduce((sum, unit) => sum + Math.max(0, unit.hpRatio), 0),
    rightHpScore: unitList.filter((unit) => unit.side === "right").reduce((sum, unit) => sum + Math.max(0, unit.hpRatio), 0),
  };
}

function renderFloaters(result, time, units) {
  const positions = Object.fromEntries(units.map((unit) => [unit.id, unit]));
  return (result.signals || [])
    .filter((signal) => signal.time <= time && time - signal.time < 0.7 && ["damage", "heal", "shield", "death"].includes(signal.kind))
    .slice(-8)
    .map((signal) => {
      const target = positions[signal.target?.id] || positions[signal.source?.id];
      if (!target) return "";
      const cls = signal.kind === "damage" || signal.kind === "death" ? "damage" : signal.kind;
      const text = signal.kind === "death" ? "倒下" : `${signal.kind === "damage" ? "-" : "+"}${formatNumber(signal.amount)}`;
      return `<span class="combat-floater ${cls}" style="left:${target.x}%;top:${Math.max(10, target.y - 12)}%">${text}</span>`;
    })
    .join("");
}

function renderCombatFeed(result, replayTime = null) {
  if (!result) {
    els.combatFeed.innerHTML = `<span>选择队伍后开始挑战，这里会播放技能、伤害、治疗和死亡事件。</span>`;
    return;
  }
  const time = replayTime ?? result.duration;
  const events = (result.signals || [])
    .filter((signal) => signal.time <= time && signal.kind !== "health")
    .slice(-7)
    .reverse();
  els.combatFeed.innerHTML = events.length
    ? events.map(formatCombatEvent).join("")
    : `<span>战斗即将开始。</span>`;
}

function formatCombatEvent(signal) {
  const source = signal.source?.name || "";
  const target = signal.target?.name || "";
  const time = signal.time.toFixed(1).padStart(4, " ");
  if (signal.kind === "skill") return `<div class="feed-line skill"><b>${time}s</b><span>${source} 释放 ${signal.skillName || "技能"}</span></div>`;
  if (signal.kind === "damage") return `<div class="feed-line damage"><b>${time}s</b><span>${source || "效果"} 对 ${target} 造成 ${formatNumber(signal.amount)} 伤害</span></div>`;
  if (signal.kind === "heal") return `<div class="feed-line heal"><b>${time}s</b><span>${target} 回复 ${formatNumber(signal.amount)}</span></div>`;
  if (signal.kind === "shield") return `<div class="feed-line shield"><b>${time}s</b><span>${target} 获得 ${formatNumber(signal.amount)} 护盾</span></div>`;
  if (signal.kind === "status") return `<div class="feed-line status"><b>${time}s</b><span>${target} 获得 ${signal.skillName || "状态"} x${formatNumber(signal.amount)}</span></div>`;
  if (signal.kind === "death") return `<div class="feed-line death"><b>${time}s</b><span>${target} 倒下</span></div>`;
  return `<div class="feed-line"><b>${time}s</b><span>${signal.skillName || signal.kind}</span></div>`;
}

function iconMarkup(icon, label) {
  const fallback = String(label || "?").trim().slice(0, 1) || "?";
  return `
    <span class="icon" aria-hidden="true">
      <span class="icon-fallback">${fallback}</span>
      <img src="${ICON_BASE}/${icon || "crossed-swords"}.svg" alt="" onerror="this.remove()">
    </span>
  `;
}

function renderSolver(level) {
  const { combos, winners, fails } = getSolutions(level);
  els.solverSummary.textContent = `${winners.length}/${combos.length} 可过`;
  els.winnerList.innerHTML = winners.slice(0, 8).map((combo) => comboButton(combo, "winner")).join("") || `<p>暂无。</p>`;
  els.failList.innerHTML = fails.slice(0, 8).map((combo) => comboButton(combo, "fail")).join("") || `<p>暂无。</p>`;
  document.querySelectorAll("[data-combo]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected = button.dataset.combo.split(",");
      renderRoster();
      renderSquad();
      runCurrent();
    });
  });
}

function getSolutions(level) {
  if (state.solutionCache.has(level.id)) return state.solutionCache.get(level.id);
  const combos = choose(level.rosterIds, level.chooseCount).map((ids) => solveCombo(level, ids));
  const winners = combos.filter((combo) => combo.passed).sort(rankCombo);
  const fails = combos.filter((combo) => !combo.passed).sort((a, b) => a.rightHp - b.rightHp || b.leftHp - a.leftHp);
  const value = { combos, winners, fails };
  state.solutionCache.set(level.id, value);
  return value;
}

function solveCombo(level, ids) {
  const result = SIM.simulateTeams(DATA.rosterTeam(ids), cloneTeam(level.enemyTeam), {
    seed: `${level.id}|solver|${ids.join("+")}`,
    randomizeStats: false,
    maxTime: 75,
  });
  return {
    ids,
    names: ids.map((id) => DATA.ENCOUNTER_ROSTER[id].name),
    passed: result.metrics.rightAlive === 0 && result.metrics.leftAlive > 0,
    leftHp: result.leftHp,
    rightHp: result.rightHp,
    duration: result.duration,
  };
}

function comboButton(combo, type) {
  return `
    <button class="combo-item" type="button" data-combo="${combo.ids.join(",")}">
      <strong>${combo.names.join(" + ")}</strong>
      <span>${type === "winner" ? "通关" : "失败"} · ${combo.duration.toFixed(1)}s · 我方 ${formatNumber(combo.leftHp)} / 敌方 ${formatNumber(combo.rightHp)}</span>
    </button>
  `;
}

function renderResult(result) {
  if (!result) {
    els.resultBadge.textContent = "未开始";
    els.resultBox.innerHTML = `
      <div class="result-status">
        <strong>未开始</strong>
        <span>先选满小队</span>
      </div>
      <p>这页现在不会默认把答案糊在脸上。你可以自己选队挑战，也可以用“填入可过队”快速验证关卡。</p>
    `;
    return;
  }
  if (result.playing) {
    els.resultBadge.textContent = "战斗中";
    els.resultBox.innerHTML = `
      <div class="result-status">
        <strong>战斗中</strong>
        <span>正在播放信号回放</span>
      </div>
      <p>血条、浮字和战斗流会按模拟时间推进；播放结束后显示最终结算。</p>
    `;
    return;
  }
  if (result.error) {
    els.resultBadge.textContent = "无法开始";
    els.resultBox.innerHTML = `<div class="result-status fail"><strong>无法开始</strong><span>${result.error}</span></div>`;
    return;
  }
  const metrics = result.metrics || {};
  els.resultBadge.textContent = result.passed ? "通关" : "失败";
  els.resultBox.innerHTML = `
    <div class="result-status ${result.passed ? "pass" : "fail"}">
      <strong>${result.passed ? "通关" : "失败"}</strong>
      <span>${metrics.leftAlive} - ${metrics.rightAlive} 存活</span>
    </div>
    <p>我方伤害 ${formatNumber(metrics.leftDamage)}，敌方伤害 ${formatNumber(metrics.rightDamage)}；我方治疗 ${formatNumber(metrics.leftHealing)}，护盾 ${formatNumber(metrics.leftShield)}。</p>
  `;
}

function recommendedIds(level) {
  const solution = getSolutions(level);
  const winner = solution.winners[0];
  return winner ? winner.ids : level.rosterIds.slice(0, level.chooseCount);
}

function rankCombo(a, b) {
  return b.leftHp - a.leftHp || a.duration - b.duration;
}

function choose(items, count) {
  if (count <= 0) return [[]];
  if (items.length < count) return [];
  if (items.length === count) return [items];
  const [head, ...tail] = items;
  return [
    ...choose(tail, count - 1).map((combo) => [head, ...combo]),
    ...choose(tail, count),
  ];
}

function cloneTeam(team) {
  return team.map((unit) => ({ ...unit }));
}

function skillName(key) {
  if (!key || key === "enemyNoop" || key === "enemyNoUltimate") return "无";
  return SKILLS.skills[key]?.name || key;
}

function formatNumber(value) {
  return String(Math.round(Number(value || 0)));
}

init();
