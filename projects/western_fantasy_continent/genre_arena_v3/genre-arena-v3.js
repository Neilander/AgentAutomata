const SKILL_DATA = window.GAME_SKILL_DATA;

if (!SKILL_DATA?.presets || !SKILL_DATA?.roleKits) {
  throw new Error("Genre Arena V3 requires GAME_SKILL_DATA.");
}

const state = {
  left: "poisonBloom",
  right: "ironWall",
  fighting: false,
  frameReady: false,
};

const els = {
  app: document.querySelector(".arena-v3"),
  leftSelect: document.querySelector("#leftSelect"),
  rightSelect: document.querySelector("#rightSelect"),
  leftStatus: document.querySelector("#leftStatus"),
  rightStatus: document.querySelector("#rightStatus"),
  leftName: document.querySelector("#leftName"),
  rightName: document.querySelector("#rightName"),
  leftDesc: document.querySelector("#leftDesc"),
  rightDesc: document.querySelector("#rightDesc"),
  leftUnits: document.querySelector("#leftUnits"),
  rightUnits: document.querySelector("#rightUnits"),
  matchupTitle: document.querySelector("#matchupTitle"),
  matchupNote: document.querySelector("#matchupNote"),
  frame: document.querySelector("#arenaFrame"),
  startBtn: document.querySelector("#startBtn"),
  centerStartBtn: document.querySelector("#centerStartBtn"),
  setupBtn: document.querySelector("#setupBtn"),
};

function init() {
  renderSelects();
  render();
  els.leftSelect.addEventListener("change", () => {
    state.left = els.leftSelect.value;
    state.fighting = false;
    render();
    syncLegacy(false);
  });
  els.rightSelect.addEventListener("change", () => {
    state.right = els.rightSelect.value;
    state.fighting = false;
    render();
    syncLegacy(false);
  });
  els.startBtn.addEventListener("click", startFight);
  els.centerStartBtn.addEventListener("click", startFight);
  els.setupBtn.addEventListener("click", () => {
    state.fighting = false;
    render();
    reloadLegacy(false);
  });
  els.frame.addEventListener("load", () => {
    state.frameReady = true;
    injectLegacyChrome();
    syncLegacy(state.fighting);
  });
}

function renderSelects() {
  const options = Object.entries(SKILL_DATA.presets).map(([key, preset]) => {
    return `<option value="${key}">${preset.name}</option>`;
  }).join("");
  els.leftSelect.innerHTML = options;
  els.rightSelect.innerHTML = options;
  els.leftSelect.value = state.left;
  els.rightSelect.value = state.right;
}

function render() {
  els.app.classList.toggle("is-fighting", state.fighting);
  els.leftSelect.value = state.left;
  els.rightSelect.value = state.right;
  renderSide("left");
  renderSide("right");
  els.matchupTitle.textContent = `${presetName(state.left)} vs ${presetName(state.right)}`;
  els.matchupNote.textContent = state.fighting
    ? "战斗中：中间窗口复用旧版实时战斗逻辑，左右选择区降为次要信息。"
    : "准备中：左右用下拉压缩大量流派，中间直接显示 4v4 本体预览。";
  els.startBtn.textContent = state.fighting ? "重新开战" : "开始战斗";
  els.centerStartBtn.textContent = state.fighting ? "重新开战" : "开始战斗";
}

function renderSide(side) {
  const key = state[side];
  const preset = SKILL_DATA.presets[key];
  const target = side === "left"
    ? { status: els.leftStatus, name: els.leftName, desc: els.leftDesc, units: els.leftUnits }
    : { status: els.rightStatus, name: els.rightName, desc: els.rightDesc, units: els.rightUnits };
  target.status.textContent = preset.name;
  target.name.textContent = preset.name;
  target.desc.textContent = preset.desc || preset.fantasy || "暂无描述";
  target.units.innerHTML = preset.team.map((unit, index) => {
    const role = SKILL_DATA.roleKits[unit.role] || {};
    return `
      <div class="unit-token">
        <div class="unit-icon">${index + 1}</div>
        <div>
          <strong>${role.name || unit.role}</strong>
          <span>${role.role || unit.role} · ${role.fantasy || ""}</span>
        </div>
      </div>
    `;
  }).join("");
}

function startFight() {
  state.fighting = true;
  render();
  reloadLegacy(true);
}

function reloadLegacy(shouldStart) {
  state.frameReady = false;
  els.frame.dataset.shouldStart = shouldStart ? "1" : "0";
  els.frame.src = `/genre_arena/?v3=${Date.now()}`;
}

function syncLegacy(shouldStart) {
  if (!state.frameReady) return;
  clickLegacyPreset("left", state.left);
  clickLegacyPreset("right", state.right);
  setTimeout(() => {
    injectLegacyChrome();
    if (shouldStart || els.frame.dataset.shouldStart === "1") clickLegacyStart();
  }, 80);
}

function clickLegacyPreset(side, key) {
  const doc = frameDoc();
  if (!doc) return;
  doc.querySelector(`[data-side="${side}"][data-preset="${key}"]`)?.click();
}

function clickLegacyStart() {
  const doc = frameDoc();
  if (!doc) return;
  const button = doc.querySelector("#startBtn");
  if (!button) return;
  if (!/暂停|Pause/i.test(button.textContent || "")) button.click();
}

function injectLegacyChrome() {
  const doc = frameDoc();
  if (!doc || doc.querySelector("#v3EmbedStyle")) return;
  const style = doc.createElement("style");
  style.id = "v3EmbedStyle";
  style.textContent = `
    body { margin: 0 !important; background: #101311 !important; overflow: hidden !important; }
    .arena-app {
      min-height: 100vh !important;
      padding: 0 !important;
      display: block !important;
      background: #101311 !important;
    }
    .topbar, .preset-dock, .layout, .bottom-grid, .balance-panel, .credits { display: none !important; }
    .battle-panel-main {
      height: 100vh !important;
      min-height: 520px !important;
      border: 0 !important;
      display: grid !important;
      grid-template-rows: 58px minmax(0, 1fr) 34px !important;
    }
    .battlefield { min-height: 0 !important; }
  `;
  doc.head.appendChild(style);
}

function frameDoc() {
  try {
    return els.frame.contentDocument;
  } catch {
    return null;
  }
}

function presetName(key) {
  return SKILL_DATA.presets[key]?.name || key;
}

init();
