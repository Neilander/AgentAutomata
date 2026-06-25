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
};

const els = {
  levelStrip: document.querySelector("#levelStrip"),
  rosterGrid: document.querySelector("#rosterGrid"),
  pickCounter: document.querySelector("#pickCounter"),
  runBtn: document.querySelector("#runBtn"),
  autoBtn: document.querySelector("#autoBtn"),
  battlefield: document.querySelector("#battlefield"),
  battleTitle: document.querySelector("#battleTitle"),
  battleState: document.querySelector("#battleState"),
  leftHp: document.querySelector("#leftHp"),
  rightHp: document.querySelector("#rightHp"),
  duration: document.querySelector("#duration"),
  solverSummary: document.querySelector("#solverSummary"),
  resultBox: document.querySelector("#resultBox"),
  winnerList: document.querySelector("#winnerList"),
  failList: document.querySelector("#failList"),
};

function init() {
  renderLevels();
  selectLevel(0);
  els.runBtn.addEventListener("click", runCurrent);
  els.autoBtn.addEventListener("click", pickRecommended);
}

function currentLevel() {
  return DATA.ENCOUNTER_LEVELS[state.levelIndex];
}

function renderLevels() {
  els.levelStrip.innerHTML = DATA.ENCOUNTER_LEVELS.map((level, index) => `
    <button class="level-card ${index === state.levelIndex ? "active" : ""}" type="button" data-level="${index}">
      <em>选择 ${level.chooseCount} 人</em>
      <strong>${level.name}</strong>
      <span>${level.fantasy}</span>
    </button>
  `).join("");
  els.levelStrip.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => selectLevel(Number(button.dataset.level)));
  });
}

function selectLevel(index) {
  state.levelIndex = index;
  const level = currentLevel();
  state.selected = recommendedIds(level).slice(0, level.chooseCount);
  state.lastResult = null;
  renderLevels();
  renderRoster();
  renderBattlefield(null);
  renderSolver(level);
  renderResult(null);
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
        <div class="hero-head">
          <span class="icon"><img src="${ICON_BASE}/${role.icon || "crossed-swords"}.svg" alt=""></span>
          <span><strong>${unit.name}</strong><small>${role.role || unit.role}</small></span>
        </div>
        <div class="tag-line">${(unit.tags || []).slice(0, 4).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        <div class="skill-line">${skillName(unit.small1)} / ${skillName(unit.small2)} / ${skillName(unit.ultimate)}</div>
      </button>
    `;
  }).join("");
  els.rosterGrid.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => toggleRoster(button.dataset.id));
  });
}

function toggleRoster(id) {
  const level = currentLevel();
  if (state.selected.includes(id)) {
    state.selected = state.selected.filter((item) => item !== id);
  } else if (state.selected.length < level.chooseCount) {
    state.selected = [...state.selected, id];
  }
  state.lastResult = null;
  renderRoster();
  renderBattlefield(null);
  renderResult(null);
}

function runCurrent() {
  const level = currentLevel();
  if (state.selected.length !== level.chooseCount) {
    renderResult({ error: `需要选择 ${level.chooseCount} 人。` });
    return;
  }
  const result = SIM.simulateTeams(DATA.rosterTeam(state.selected), cloneTeam(level.enemyTeam), {
    seed: `${level.id}|ui|${state.selected.join("+")}`,
    randomizeStats: false,
    maxTime: 75,
  });
  const passed = result.metrics.rightAlive === 0 && result.metrics.leftAlive > 0;
  state.lastResult = { ...result, passed };
  renderBattlefield(state.lastResult);
  renderResult(state.lastResult);
}

function pickRecommended() {
  const level = currentLevel();
  state.selected = recommendedIds(level).slice(0, level.chooseCount);
  state.lastResult = null;
  renderRoster();
  runCurrent();
}

function renderBattlefield(result) {
  const level = currentLevel();
  els.battleTitle.textContent = level.name;
  els.battleState.textContent = result ? (result.passed ? "通关" : "失败") : "待命";
  els.leftHp.textContent = result ? formatNumber(result.leftHp) : "0";
  els.rightHp.textContent = result ? formatNumber(result.rightHp) : "0";
  els.duration.textContent = result ? `${result.duration.toFixed(1)}s` : "0s";

  const leftSpecs = DATA.rosterTeam(state.selected);
  const rightSpecs = cloneTeam(level.enemyTeam);
  const resultUnits = result?.units || [];
  const units = [
    ...leftSpecs.map((unit, index) => previewUnit("left", unit, index, resultUnits)),
    ...rightSpecs.map((unit, index) => previewUnit("right", unit, index, resultUnits)),
  ];
  els.battlefield.innerHTML = units.map(renderUnit).join("");
}

function previewUnit(side, spec, index, resultUnits) {
  const role = SKILLS.roleKits[spec.role] || spec;
  const resolved = resultUnits.find((unit) => unit.side === side && unit.index === index);
  const positions = side === "left"
    ? [{ x: 30, y: 32 }, { x: 30, y: 68 }, { x: 16, y: 30 }, { x: 16, y: 70 }, { x: 22, y: 50 }, { x: 10, y: 50 }]
    : [{ x: 70, y: 35 }, { x: 70, y: 65 }, { x: 84, y: 35 }, { x: 84, y: 65 }];
  const slot = positions[index % positions.length];
  return {
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
    <div class="unit ${unit.side === "right" ? "enemy" : ""} ${unit.alive ? "" : "dead"}" style="left:${unit.x}%;top:${unit.y}%">
      <span class="icon"><img src="${ICON_BASE}/${unit.icon}.svg" alt=""></span>
      <span class="unit-name">${unit.name}</span>
      <div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, Math.min(100, unit.hpRatio * 100))}%"></div></div>
      <div class="unit-meta">${unit.roleName} · ${formatNumber(unit.hp)}</div>
    </div>
  `;
}

function renderSolver(level) {
  const combos = choose(level.rosterIds, level.chooseCount).map((ids) => solveCombo(level, ids));
  const winners = combos.filter((combo) => combo.passed).sort(rankCombo);
  const fails = combos.filter((combo) => !combo.passed).sort((a, b) => a.rightHp - b.rightHp || b.leftHp - a.leftHp);
  els.solverSummary.textContent = `${winners.length}/${combos.length} 可过`;
  els.winnerList.innerHTML = winners.slice(0, 8).map((combo) => comboButton(combo, "winner")).join("") || `<p>暂无。</p>`;
  els.failList.innerHTML = fails.slice(0, 8).map((combo) => comboButton(combo, "fail")).join("") || `<p>暂无。</p>`;
  document.querySelectorAll("[data-combo]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected = button.dataset.combo.split(",");
      renderRoster();
      runCurrent();
    });
  });
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
    els.resultBox.innerHTML = `<div class="result-status"><strong>未开始</strong><span>选择队伍后开始挑战</span></div><p>推荐组合会自动选择当前关卡的一条可过路线。</p>`;
    return;
  }
  if (result.error) {
    els.resultBox.innerHTML = `<div class="result-status fail"><strong>无法开始</strong><span>${result.error}</span></div>`;
    return;
  }
  const damage = result.metrics || {};
  els.resultBox.innerHTML = `
    <div class="result-status ${result.passed ? "pass" : "fail"}">
      <strong>${result.passed ? "通关" : "失败"}</strong>
      <span>${result.metrics.leftAlive} - ${result.metrics.rightAlive} 存活</span>
    </div>
    <p>我方伤害 ${formatNumber(damage.leftDamage)}，敌方伤害 ${formatNumber(damage.rightDamage)}；我方治疗 ${formatNumber(damage.leftHealing)}，护盾 ${formatNumber(damage.leftShield)}。</p>
  `;
}

function recommendedIds(level) {
  const combos = choose(level.rosterIds, level.chooseCount).map((ids) => solveCombo(level, ids));
  const winner = combos.filter((combo) => combo.passed).sort(rankCombo)[0];
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
  return SKILLS.skills[key]?.name || key;
}

function formatNumber(value) {
  return String(Math.round(Number(value || 0)));
}

init();
