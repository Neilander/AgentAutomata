"use strict";

const Model = window.UFSSkyCityModel;
const STORAGE_KEY = "ufs-sky-city-map-editor-v1";
const ACTION_LABELS = {
  excavator_back: "挖掘机后退",
  research_back: "研究标记后退",
  spawn_white: "生成白色飞船",
  damage: "城市受到伤害",
};

let state = Model.createState();

const elements = {
  tileTabs: document.querySelector("#tileTabs"),
  tileLabel: document.querySelector("#tileLabel"),
  tileSide: document.querySelector("#tileSide"),
  tileOrder: document.querySelector("#tileOrder"),
  skyRows: document.querySelector("#skyRows"),
  inspectorTitle: document.querySelector("#inspectorTitle"),
  selectionBadge: document.querySelector("#selectionBadge"),
  emptySelection: document.querySelector("#skyEmptySelection"),
  cellForm: document.querySelector("#skyCellForm"),
  cellType: document.querySelector("#skyCellType"),
  amountField: document.querySelector("#skyAmountField"),
  amountLabel: document.querySelector("#skyAmountLabel"),
  cellAmount: document.querySelector("#skyCellAmount"),
  railForm: document.querySelector("#railForm"),
  railSkull: document.querySelector("#railSkull"),
  railActions: document.querySelector("#railActions"),
  cityId: document.querySelector("#cityId"),
  cityLabel: document.querySelector("#cityLabel"),
  maxDamage: document.querySelector("#maxDamage"),
  startEnergy: document.querySelector("#startEnergy"),
  maxEnergy: document.querySelector("#maxEnergy"),
  robotLimit: document.querySelector("#robotLimit"),
  firstRoll: document.querySelector("#firstRoll"),
  researchCosts: document.querySelector("#researchCosts"),
  finalRequiresMultiSpace: document.querySelector("#finalRequiresMultiSpace"),
  completionBadge: document.querySelector("#completionBadge"),
  validationMessages: document.querySelector("#validationMessages"),
  jsonPreview: document.querySelector("#jsonPreview"),
  toast: document.querySelector("#toast"),
};

function activeTile() {
  return Model.findTile(state, state.activeTileId);
}

function selectedCell() {
  const selected = state.selectedCell;
  if (!selected) return null;
  return Model.findTile(state, selected.tileId).rows[selected.row]?.cells[selected.column] || null;
}

function selectedRow() {
  const selected = state.selectedRail;
  if (!selected) return null;
  return Model.findTile(state, selected.tileId).rows[selected.row] || null;
}

function render() {
  renderTileTabs();
  renderTileMeta();
  renderSkyRows();
  renderInspector();
  renderCity();
  renderOutput();
}

function renderTileTabs() {
  elements.tileTabs.innerHTML = "";
  state.tileOrder.forEach((tileId, index) => {
    const tile = Model.findTile(state, tileId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `board-tab${tile.id === state.activeTileId ? " active" : ""}`;
    button.innerHTML = `<span>${index + 1}</span> · ${escapeHtml(tile.label)}`;
    button.addEventListener("click", () => {
      state.activeTileId = tile.id;
      state.selectedCell = null;
      state.selectedRail = null;
      render();
    });
    elements.tileTabs.appendChild(button);
  });
}

function renderTileMeta() {
  const tile = activeTile();
  elements.tileLabel.value = tile.label;
  elements.tileSide.value = tile.side;
  const currentOrder = state.tileOrder.indexOf(tile.id);
  elements.tileOrder.innerHTML = state.tileOrder
    .map((_, index) => `<option value="${index}"${index === currentOrder ? " selected" : ""}>第 ${index + 1} 块（从上往下）</option>`)
    .join("");
}

function renderSkyRows() {
  const tile = activeTile();
  elements.skyRows.innerHTML = "";
  tile.rows.forEach((row, rowIndex) => {
    const rowElement = document.createElement("div");
    rowElement.className = "sky-row";
    row.cells.forEach((cell, column) => rowElement.appendChild(createSkyCell(tile, rowIndex, column, cell)));
    rowElement.appendChild(createRailCell(tile, rowIndex, row));
    elements.skyRows.appendChild(rowElement);
  });
}

function createSkyCell(tile, row, column, cell) {
  const button = document.createElement("button");
  button.type = "button";
  const selected = state.selectedCell?.tileId === tile.id && state.selectedCell?.row === row && state.selectedCell?.column === column;
  button.className = `sky-cell${selected ? " selected" : ""}`;
  button.dataset.type = cell.type;
  button.innerHTML = `<span class="coordinate">行 ${row + 1} · 列 ${column + 1}</span><span class="cell-icon">${cellIcon(cell)}</span>`;
  button.addEventListener("click", () => {
    state.selectedCell = { tileId: tile.id, row, column };
    state.selectedRail = null;
    renderSkyRows();
    renderInspector();
  });
  return button;
}

function cellIcon(cell) {
  if (cell.type === "explosion") return `✦ ${cell.amount || "?"}`;
  if (cell.type === "arrow_left") return "←";
  if (cell.type === "arrow_right") return "→";
  if (cell.type === "mothership_down") return `⌄${Number(cell.amount) > 1 ? ` ${cell.amount}` : ""}`;
  return "·";
}

function createRailCell(tile, rowIndex, row) {
  const button = document.createElement("button");
  button.type = "button";
  const selected = state.selectedRail?.tileId === tile.id && state.selectedRail?.row === rowIndex;
  button.className = `rail-cell${selected ? " selected" : ""}`;
  const tokens = [];
  if (row.rail.skull) tokens.push('<span class="rail-token skull">☠ 失败</span>');
  Model.ACTION_TYPES.forEach((type) => {
    const amount = row.rail.actions[type];
    if (amount != null && amount !== "") tokens.push(`<span class="rail-token">${ACTION_LABELS[type]} ${amount}</span>`);
  });
  button.innerHTML = `<span class="rail-label">第 ${rowIndex + 1} 行侧轨</span>${tokens.length ? `<span class="rail-summary">${tokens.join("")}</span>` : '<span class="rail-empty">没有图标</span>'}`;
  button.addEventListener("click", () => {
    state.selectedRail = { tileId: tile.id, row: rowIndex };
    state.selectedCell = null;
    renderSkyRows();
    renderInspector();
  });
  return button;
}

function renderInspector() {
  const cell = selectedCell();
  const row = selectedRow();
  elements.emptySelection.classList.toggle("hidden", Boolean(cell || row));
  elements.cellForm.classList.toggle("hidden", !cell);
  elements.railForm.classList.toggle("hidden", !row);
  if (cell) {
    const selected = state.selectedCell;
    elements.inspectorTitle.textContent = `天空格 · 行 ${selected.row + 1} 列 ${selected.column + 1}`;
    elements.selectionBadge.textContent = "中央格";
    elements.cellType.value = cell.type;
    elements.cellAmount.value = cell.amount == null ? "" : cell.amount;
    updateAmountVisibility();
  } else if (row) {
    const selected = state.selectedRail;
    elements.inspectorTitle.textContent = `母舰侧轨 · 第 ${selected.row + 1} 行`;
    elements.selectionBadge.textContent = "右侧轨道";
    elements.railSkull.checked = Boolean(row.rail.skull);
    renderRailActions(row);
  } else {
    elements.inspectorTitle.textContent = "尚未选择";
    elements.selectionBadge.textContent = "未选择";
  }
}

function updateAmountVisibility() {
  const needsAmount = elements.cellType.value === "explosion" || elements.cellType.value === "mothership_down";
  elements.amountField.classList.toggle("hidden", !needsAmount);
  elements.amountLabel.textContent = elements.cellType.value === "explosion" ? "爆炸数字" : "母舰下降几格";
  if (elements.cellType.value === "mothership_down" && elements.cellAmount.value === "") elements.cellAmount.value = "1";
}

function renderRailActions(row) {
  elements.railActions.innerHTML = "";
  Model.ACTION_TYPES.forEach((type) => {
    const amount = row.rail.actions[type];
    const item = document.createElement("label");
    item.className = "rail-action";
    item.innerHTML = `
      <input type="checkbox" data-action-check="${type}" ${amount != null && amount !== "" ? "checked" : ""}>
      <strong>${ACTION_LABELS[type]}</strong>
      <input type="number" min="1" step="1" value="${amount == null || amount === "" ? 1 : amount}" data-action-amount="${type}" aria-label="${ACTION_LABELS[type]}数值">
    `;
    elements.railActions.appendChild(item);
  });
}

function applyCell(event) {
  event.preventDefault();
  const cell = selectedCell();
  if (!cell) return;
  cell.type = elements.cellType.value;
  cell.amount = cell.type === "explosion" || cell.type === "mothership_down"
    ? Math.max(1, integer(elements.cellAmount.value, 1))
    : null;
  showToast("天空格已更新");
  renderSkyRows();
  renderInspector();
  renderOutput();
}

function applyRail(event) {
  event.preventDefault();
  const row = selectedRow();
  if (!row) return;
  row.rail.skull = elements.railSkull.checked;
  Model.ACTION_TYPES.forEach((type) => {
    const checked = elements.railActions.querySelector(`[data-action-check="${type}"]`).checked;
    const value = elements.railActions.querySelector(`[data-action-amount="${type}"]`).value;
    row.rail.actions[type] = checked ? Math.max(1, integer(value, 1)) : null;
  });
  showToast("侧轨效果已更新");
  renderSkyRows();
  renderInspector();
  renderOutput();
}

function renderCity() {
  elements.cityId.value = state.city.id ?? "";
  elements.cityLabel.value = state.city.label ?? "";
  elements.maxDamage.value = state.city.maxDamage ?? "";
  elements.startEnergy.value = state.city.startEnergy ?? "";
  elements.maxEnergy.value = state.city.maxEnergy ?? "";
  elements.robotLimit.value = state.city.robotLimit ?? "";
  elements.firstRoll.value = state.city.firstRoll ?? "";
  elements.researchCosts.value = state.research.costsText ?? "";
  elements.finalRequiresMultiSpace.checked = Boolean(state.research.finalRequiresMultiSpace);
}

function syncCityFromInputs() {
  state.city.id = elements.cityId.value;
  state.city.label = elements.cityLabel.value;
  state.city.maxDamage = nullableInput(elements.maxDamage.value);
  state.city.startEnergy = nullableInput(elements.startEnergy.value);
  state.city.maxEnergy = nullableInput(elements.maxEnergy.value);
  state.city.robotLimit = nullableInput(elements.robotLimit.value);
  state.city.firstRoll = nullableInput(elements.firstRoll.value);
  state.research.costsText = elements.researchCosts.value;
  state.research.finalRequiresMultiSpace = elements.finalRequiresMultiSpace.checked;
  renderOutput();
}

function renderOutput() {
  const { errors, warnings, result } = Model.validateState(state);
  elements.validationMessages.innerHTML = "";
  if (!errors.length && !warnings.length) addValidation("当前录入通过基础检查，可以交给程序组装正式地图。", "success");
  errors.forEach((message) => addValidation(message, "error"));
  warnings.forEach((message) => addValidation(message, "warning"));
  if (state.baseEntry) addValidation("已附带一份旧基地录入数据；导出时会一并保留。", "success");
  elements.jsonPreview.textContent = JSON.stringify(result, null, 2);
  const filled = state.tiles.flatMap((tile) => tile.rows).flatMap((row) => row.cells).filter((cell) => cell.type !== "empty").length;
  if (errors.length) setBadge(`${errors.length} 个错误`, "bad");
  else if (filled) setBadge(`${filled} 个天空图标已录`, "good");
  else setBadge("等待录入", "neutral");
}

function addValidation(message, type) {
  const item = document.createElement("div");
  item.className = `validation-item ${type}`;
  item.textContent = message;
  elements.validationMessages.appendChild(item);
}

function setBadge(text, type) {
  elements.completionBadge.textContent = text;
  elements.completionBadge.className = `status-badge ${type}`;
}

function switchSection(id) {
  document.querySelectorAll(".editor-section").forEach((section) => section.classList.toggle("active-section", section.id === id));
  document.querySelectorAll(".section-tab").forEach((button) => button.classList.toggle("active", button.dataset.section === id));
  if (id === "outputSection") renderOutput();
}

function moveActiveTile(newIndex) {
  const oldIndex = state.tileOrder.indexOf(state.activeTileId);
  if (oldIndex === newIndex) return;
  state.tileOrder.splice(oldIndex, 1);
  state.tileOrder.splice(newIndex, 0, state.activeTileId);
  render();
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Model.buildExport(state)));
  showToast("天空与城市数据已保存到浏览器");
}

async function copyJson() {
  const json = JSON.stringify(Model.buildExport(state), null, 2);
  try {
    await navigator.clipboard.writeText(json);
    showToast("JSON 已复制");
  } catch {
    showToast("浏览器阻止了复制，请在检查页手动复制");
  }
}

function exportJson() {
  const { errors, result } = Model.validateState(state);
  if (errors.length) return showToast("请先修复红色错误再导出");
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "under-falling-skies-sky-city.json";
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("天空与城市 JSON 已导出");
}

async function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.schema === "ufs_base_map_entry_v1") {
      state.baseEntry = payload;
      showToast("旧基地数据已附加；天空与城市录入不会覆盖它");
      renderOutput();
    } else {
      state = Model.restoreState(payload);
      showToast("天空与城市录入已恢复");
      render();
    }
  } catch (error) {
    showToast(`导入失败：${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function integer(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function nullableInput(value) {
  if (value === "") return null;
  return integer(value, null);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

let toastTimer = null;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

document.querySelectorAll(".section-tab").forEach((button) => button.addEventListener("click", () => switchSection(button.dataset.section)));
elements.tileLabel.addEventListener("change", () => { activeTile().label = elements.tileLabel.value.trim() || activeTile().id; render(); });
elements.tileSide.addEventListener("change", () => { activeTile().side = elements.tileSide.value; renderOutput(); });
elements.tileOrder.addEventListener("change", () => moveActiveTile(integer(elements.tileOrder.value, 0)));
elements.cellType.addEventListener("change", updateAmountVisibility);
elements.cellForm.addEventListener("submit", applyCell);
elements.railForm.addEventListener("submit", applyRail);
[elements.cityId, elements.cityLabel, elements.maxDamage, elements.startEnergy, elements.maxEnergy,
  elements.robotLimit, elements.firstRoll, elements.researchCosts, elements.finalRequiresMultiSpace]
  .forEach((input) => input.addEventListener("input", syncCityFromInputs));
document.querySelector("#saveButton").addEventListener("click", saveLocal);
document.querySelector("#copyButton").addEventListener("click", copyJson);
document.querySelector("#exportButton").addEventListener("click", exportJson);
document.querySelector("#importInput").addEventListener("change", importJson);

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  try { state = Model.restoreState(JSON.parse(saved)); }
  catch { /* keep a clean state */ }
}
render();
