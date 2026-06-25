const SKILL_DATA = window.GAME_SKILL_DATA;
const SIM = window.GAME_COMBAT_SIM;

if (!SKILL_DATA?.presets || !SIM?.simulateTeams) {
  throw new Error("Genre Arena V2 requires skill data and combat sim.");
}

const state = {
  left: "poisonBloom",
  right: "ironWall",
  phase: "setup",
  result: null,
};

const els = {
  app: document.querySelector(".arena-v2"),
  stateChip: document.querySelector("#stateChip"),
  leftPresetList: document.querySelector("#leftPresetList"),
  rightPresetList: document.querySelector("#rightPresetList"),
  leftPickName: document.querySelector("#leftPickName"),
  rightPickName: document.querySelector("#rightPickName"),
  leftTitle: document.querySelector("#leftTitle"),
  rightTitle: document.querySelector("#rightTitle"),
  leftDesc: document.querySelector("#leftDesc"),
  rightDesc: document.querySelector("#rightDesc"),
  startBtn: document.querySelector("#startBtn"),
  topStartBtn: document.querySelector("#topStartBtn"),
  backSetupBtn: document.querySelector("#backSetupBtn"),
  rerunBtn: document.querySelector("#rerunBtn"),
  legacyArenaFrame: document.querySelector("#legacyArenaFrame"),
  battlePair: document.querySelector("#battlePair"),
  battleState: document.querySelector("#battleState"),
  battlefield: document.querySelector("#battlefield"),
  winnerText: document.querySelector("#winnerText"),
  leftHp: document.querySelector("#leftHp"),
  rightHp: document.querySelector("#rightHp"),
  eventList: document.querySelector("#eventList"),
};

function init() {
  renderAll();
  els.startBtn.addEventListener("click", runBattle);
  els.topStartBtn.addEventListener("click", runBattle);
  els.rerunBtn.addEventListener("click", runBattle);
  els.backSetupBtn.addEventListener("click", () => {
    state.phase = "setup";
    state.result = null;
    renderAll();
  });
}

function presetEntries() {
  return Object.entries(SKILL_DATA.presets);
}

function presetName(key) {
  return SKILL_DATA.presets[key]?.name || key;
}

function presetDesc(key) {
  return SKILL_DATA.presets[key]?.desc || SKILL_DATA.presets[key]?.fantasy || "";
}

function renderAll() {
  els.app.classList.toggle("is-combat", state.phase === "combat");
  els.stateChip.textContent = state.phase === "combat" ? "战斗中" : "准备中";
  renderPresetLists();
  renderSelected();
  renderBattle();
}

function renderPresetLists() {
  renderPresetList("left", els.leftPresetList, state.left);
  renderPresetList("right", els.rightPresetList, state.right);
  els.leftPickName.textContent = presetName(state.left);
  els.rightPickName.textContent = presetName(state.right);
}

function renderPresetList(side, container, selectedKey) {
  container.innerHTML = presetEntries().map(([key, preset]) => `
    <button class="preset-row ${selectedKey === key ? "active" : ""}" type="button" data-side="${side}" data-key="${key}">
      <span>
        <strong>${preset.name}</strong>
        <span>${preset.desc || preset.fantasy || ""}</span>
      </span>
      <em>${selectedKey === key ? "选中" : "选择"}</em>
    </button>
  `).join("");
  container.querySelectorAll("[data-key]").forEach((button) => {
    button.addEventListener("click", () => {
      state[button.dataset.side] = button.dataset.key;
      state.result = null;
      renderAll();
    });
  });
}

function renderSelected() {
  els.leftTitle.textContent = presetName(state.left);
  els.rightTitle.textContent = presetName(state.right);
  els.leftDesc.textContent = presetDesc(state.left);
  els.rightDesc.textContent = presetDesc(state.right);
  els.battlePair.textContent = `${presetName(state.left)} vs ${presetName(state.right)}`;
}

function runBattle() {
  state.phase = "combat";
  state.result = null;
  renderAll();
  startLegacyArena();
  requestAnimationFrame(() => {
    document.querySelector("#battleShell")?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function startLegacyArena() {
  const frame = els.legacyArenaFrame;
  const startInside = () => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const leftButton = doc.querySelector(`[data-side="left"][data-preset="${state.left}"]`);
      const rightButton = doc.querySelector(`[data-side="right"][data-preset="${state.right}"]`);
      leftButton?.click();
      rightButton?.click();
      const start = doc.querySelector("#startBtn");
      if (start && !/暂停|Pause/i.test(start.textContent || "")) start.click();
    } catch {
      // Same-origin access should work on the local server; if it does not, the user can still press start inside the iframe.
    }
  };

  frame.onload = () => setTimeout(startInside, 250);
  frame.src = `/genre_arena/?v2=${Date.now()}`;
  setTimeout(startInside, 500);
}

function renderBattle() {
  if (!state.result) {
    els.battleState.textContent = "未开始";
    els.winnerText.textContent = "-";
    els.leftHp.textContent = "0";
    els.rightHp.textContent = "0";
    els.eventList.innerHTML = `<div class="event-item"><strong>等待开始</strong><br>先在上方选择左右流派，再点击开始战斗。</div>`;
    renderPreviewUnits();
    return;
  }

  const winnerName = state.result.winner === "left" ? presetName(state.left) : presetName(state.right);
  els.battleState.textContent = `${state.result.duration.toFixed(1)}s 结束`;
  els.winnerText.textContent = winnerName;
  els.leftHp.textContent = Math.round(state.result.leftHp);
  els.rightHp.textContent = Math.round(state.result.rightHp);
  renderResultUnits(state.result.units);
  renderEvents(state.result);
}

function renderPreviewUnits() {
  const left = SKILL_DATA.presets[state.left].team.map((unit, index) => previewUnit("left", unit, index));
  const right = SKILL_DATA.presets[state.right].team.map((unit, index) => previewUnit("right", unit, index));
  els.battlefield.innerHTML = [...left, ...right].map(renderUnit).join("");
}

function renderResultUnits(units) {
  const sparks = strongestEventPositions(units);
  els.battlefield.innerHTML = units.map((unit) => renderUnit({
    side: unit.side,
    name: unit.name,
    roleName: roleName(unit.role),
    x: unit.side === "left" ? [28, 28, 15, 15][unit.index % 4] : [72, 72, 85, 85][unit.index % 4],
    y: [35, 65, 32, 68][unit.index % 4],
    hp: unit.hp,
    hpRatio: unit.hpRatio,
    alive: unit.alive,
    damageDone: unit.damageDone,
  })).join("") + sparks;
}

function previewUnit(side, spec, index) {
  const role = SKILL_DATA.roleKits[spec.role] || {};
  return {
    side,
    name: spec.name || role.name || spec.role,
    roleName: role.role || spec.role,
    x: side === "left" ? [28, 28, 15, 15][index % 4] : [72, 72, 85, 85][index % 4],
    y: [35, 65, 32, 68][index % 4],
    hp: spec.hp || role.hp || 0,
    hpRatio: 1,
    alive: true,
    damageDone: 0,
  };
}

function renderUnit(unit) {
  return `
    <article class="unit ${unit.side} ${unit.alive ? "" : "dead"}" style="left:${unit.x}%;top:${unit.y}%">
      <strong>${unit.name}</strong>
      <span>${unit.roleName} · 伤害 ${Math.round(unit.damageDone || 0)}</span>
      <div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, Math.min(100, unit.hpRatio * 100))}%"></div></div>
      <span>HP ${Math.round(unit.hp || 0)}</span>
    </article>
  `;
}

function strongestEventPositions(units) {
  if (!units?.length) return "";
  return units
    .slice()
    .sort((a, b) => (b.damageDone || 0) - (a.damageDone || 0))
    .slice(0, 2)
    .map((unit) => {
      const x = unit.side === "left" ? [28, 28, 15, 15][unit.index % 4] : [72, 72, 85, 85][unit.index % 4];
      const y = [35, 65, 32, 68][unit.index % 4];
      return `<div class="event-spark" style="left:${x}%;top:${y}%"></div>`;
    })
    .join("");
}

function renderEvents(result) {
  const metrics = result.metrics || {};
  const summary = result.summary || {};
  const events = [
    [`胜负`, `${result.winner === "left" ? "左队" : "右队"}胜出，战斗持续 ${result.duration.toFixed(1)} 秒。`],
    [`伤害`, `左队 ${Math.round(metrics.leftDamage || 0)} / 右队 ${Math.round(metrics.rightDamage || 0)}`],
    [`治疗`, `左队 ${Math.round(metrics.leftHealing || 0)} / 右队 ${Math.round(metrics.rightHealing || 0)}`],
    [`护盾`, `左队 ${Math.round(metrics.leftShield || 0)} / 右队 ${Math.round(metrics.rightShield || 0)}`],
    [`信号`, `记录 ${result.signals?.length || 0} 条战斗信号，技能/状态摘要 ${Object.keys(summary).length} 类。`],
  ];
  els.eventList.innerHTML = events.map(([title, body]) => `
    <div class="event-item"><strong>${title}</strong><br>${body}</div>
  `).join("");
}

function roleName(roleKey) {
  return SKILL_DATA.roleKits[roleKey]?.role || roleKey || "";
}

init();
