"use strict";

const ROOM_LABELS = {
  unused: "未使用",
  aa: "防空炮",
  energy: "能源",
  fighter: "战斗机",
  research: "研究",
  robot: "机器人",
  tunnel: "通道",
};

const STORAGE_KEY = "ufs-base-map-editor-v1";

const state = {
  activeBoard: "A",
  selected: new Set(),
  startExcavatorIndex: 0,
  boards: {
    A: createBoard("A", 3),
    B: createBoard("B", 3),
  },
};

const elements = {
  boardGrid: document.querySelector("#boardGrid"),
  selectionCount: document.querySelector("#selectionCount"),
  emptySelection: document.querySelector("#emptySelection"),
  cellForm: document.querySelector("#cellForm"),
  roomType: document.querySelector("#roomType"),
  roomId: document.querySelector("#roomId"),
  modifier: document.querySelector("#modifier"),
  energyCost: document.querySelector("#energyCost"),
  unlockIndex: document.querySelector("#unlockIndex"),
  pathOrder: document.querySelector("#pathOrder"),
  startExcavatorIndex: document.querySelector("#startExcavatorIndex"),
  validationMessages: document.querySelector("#validationMessages"),
  completionBadge: document.querySelector("#completionBadge"),
  jsonPreview: document.querySelector("#jsonPreview"),
  toast: document.querySelector("#toast"),
};

function createBoard(id, rows) {
  return {
    id,
    rows,
    cells: Array.from({ length: rows * 5 }, (_, index) => createCell(id, Math.floor(index / 5), index % 5)),
  };
}

function createCell(board, row, column) {
  return {
    id: `${board}-r${row + 1}-c${column + 1}`,
    board,
    row,
    column,
    type: "unused",
    roomId: "",
    modifier: 0,
    energyCost: 0,
    unlockIndex: 0,
    pathOrder: null,
  };
}

function render() {
  renderBoard();
  renderEditor();
  renderOutput();
}

function renderBoard() {
  const board = state.boards[state.activeBoard];
  elements.boardGrid.innerHTML = "";
  board.cells.forEach((cell) => {
    const key = cellKey(cell);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `base-cell${state.selected.has(key) ? " selected" : ""}`;
    button.dataset.key = key;
    button.dataset.type = cell.type;
    button.setAttribute("aria-pressed", state.selected.has(key) ? "true" : "false");
    const stats = cell.type === "unused"
      ? ""
      : `<span class="cell-stats"><span>解锁 ${cell.unlockIndex}</span><span>${cell.pathOrder == null ? "非路径" : `路径 ${cell.pathOrder}`}</span></span>`;
    button.innerHTML = `
      <span class="cell-coordinate">${cell.board} · 行${cell.row + 1} · 列${cell.column + 1}</span>
      <span class="cell-type ${cell.type === "unused" ? "cell-empty" : ""}">${ROOM_LABELS[cell.type]}</span>
      <span class="cell-room">${cell.roomId || "尚未填写"}${cell.type === "unused" ? "" : formatRoomStats(cell)}</span>
      ${stats}
    `;
    button.addEventListener("click", (event) => selectCell(key, event.shiftKey));
    elements.boardGrid.appendChild(button);
  });
}

function formatRoomStats(cell) {
  const parts = [];
  if (cell.modifier) parts.push(cell.modifier > 0 ? `＋${cell.modifier}` : `${cell.modifier}`);
  if (cell.energyCost) parts.push(`⚡${cell.energyCost}`);
  return parts.length ? ` · ${parts.join(" ")}` : "";
}

function selectCell(key, additive) {
  if (!additive) state.selected.clear();
  if (additive && state.selected.has(key)) state.selected.delete(key);
  else state.selected.add(key);
  render();
}

function renderEditor() {
  const selectedCells = getSelectedCells();
  elements.selectionCount.textContent = selectedCells.length ? `已选 ${selectedCells.length} 格` : "未选择";
  elements.emptySelection.classList.toggle("hidden", selectedCells.length > 0);
  elements.cellForm.classList.toggle("hidden", selectedCells.length === 0);
  if (!selectedCells.length) return;

  const first = selectedCells[0];
  elements.roomType.value = commonValue(selectedCells, "type", first.type);
  elements.roomId.value = commonValue(selectedCells, "roomId", "");
  elements.modifier.value = commonValue(selectedCells, "modifier", 0);
  elements.energyCost.value = commonValue(selectedCells, "energyCost", 0);
  elements.unlockIndex.value = commonValue(selectedCells, "unlockIndex", 0);
  elements.pathOrder.value = selectedCells.length === 1 && first.pathOrder != null ? first.pathOrder : "";
}

function commonValue(cells, field, fallback) {
  const value = cells[0][field];
  return cells.every((cell) => cell[field] === value) ? value : fallback;
}

function getSelectedCells() {
  return state.boards[state.activeBoard].cells.filter((cell) => state.selected.has(cellKey(cell)));
}

function cellKey(cell) {
  return `${cell.board}:${cell.row}:${cell.column}`;
}

function applySelection(event) {
  event.preventDefault();
  const selectedCells = getSelectedCells();
  if (!selectedCells.length) return;
  const type = elements.roomType.value;
  if (type === "unused") {
    selectedCells.forEach(resetCell);
    render();
    return;
  }

  const roomId = elements.roomId.value.trim() || nextRoomId(state.activeBoard, type);
  const modifier = toInteger(elements.modifier.value, 0);
  const energyCost = Math.max(0, toInteger(elements.energyCost.value, 0));
  const unlockIndex = Math.max(0, toInteger(elements.unlockIndex.value, 0));
  const firstPathOrder = elements.pathOrder.value === "" ? null : Math.max(0, toInteger(elements.pathOrder.value, 0));

  selectedCells
    .sort((a, b) => a.row - b.row || a.column - b.column)
    .forEach((cell, index) => {
      Object.assign(cell, {
        type,
        roomId,
        modifier,
        energyCost,
        unlockIndex,
        pathOrder: firstPathOrder == null ? null : firstPathOrder + index,
      });
    });
  showToast(`已更新 ${selectedCells.length} 个格子`);
  render();
}

function resetCell(cell) {
  Object.assign(cell, {
    type: "unused",
    roomId: "",
    modifier: 0,
    energyCost: 0,
    unlockIndex: 0,
    pathOrder: null,
  });
}

function nextRoomId(board, type) {
  const prefix = `${board}-${type}-`;
  const ids = new Set(Object.values(state.boards).flatMap((item) => item.cells.map((cell) => cell.roomId)));
  let index = 1;
  while (ids.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}

function addRow() {
  const board = state.boards[state.activeBoard];
  const row = board.rows;
  for (let column = 0; column < 5; column += 1) board.cells.push(createCell(board.id, row, column));
  board.rows += 1;
  render();
}

function removeRow() {
  const board = state.boards[state.activeBoard];
  if (board.rows <= 1) return showToast("至少保留一行");
  const lastRow = board.rows - 1;
  const hasData = board.cells.some((cell) => cell.row === lastRow && cell.type !== "unused");
  if (hasData && !window.confirm("末行已有内容，确定删除吗？")) return;
  board.cells = board.cells.filter((cell) => cell.row !== lastRow);
  board.rows -= 1;
  state.selected.clear();
  render();
}

function buildExport() {
  const activeCells = Object.values(state.boards)
    .flatMap((board) => board.cells)
    .filter((cell) => cell.type !== "unused");
  const cells = activeCells.map((cell) => ({
    id: cell.id,
    tile: cell.board,
    row: cell.row,
    column: cell.column,
    unlockIndex: cell.unlockIndex,
    roomId: cell.roomId,
  }));
  const roomGroups = new Map();
  activeCells.forEach((cell) => {
    if (!roomGroups.has(cell.roomId)) {
      roomGroups.set(cell.roomId, {
        id: cell.roomId,
        type: cell.type,
        cellIds: [],
        modifier: cell.modifier,
        energyCost: cell.energyCost,
      });
    }
    roomGroups.get(cell.roomId).cellIds.push(cell.id);
  });
  const excavatorPath = activeCells
    .filter((cell) => cell.pathOrder != null)
    .sort((a, b) => a.pathOrder - b.pathOrder)
    .map((cell) => cell.id);

  return {
    schema: "ufs_base_map_entry_v1",
    editor: {
      boardRows: { A: state.boards.A.rows, B: state.boards.B.rows },
      savedAt: new Date().toISOString(),
    },
    base: {
      cells,
      rooms: Array.from(roomGroups.values()),
      excavatorPath,
      startExcavatorIndex: state.startExcavatorIndex,
    },
    sourceCells: Object.values(state.boards).flatMap((board) => board.cells),
  };
}

function validateEditor() {
  const result = buildExport();
  const errors = [];
  const warnings = [];
  const activeCells = Object.values(state.boards).flatMap((board) => board.cells).filter((cell) => cell.type !== "unused");
  if (!activeCells.length) warnings.push("还没有录入任何格子。");

  const byRoom = new Map();
  activeCells.forEach((cell) => {
    if (!cell.roomId) errors.push(`${cell.id} 缺少房间编号。`);
    if (!byRoom.has(cell.roomId)) byRoom.set(cell.roomId, []);
    byRoom.get(cell.roomId).push(cell);
  });
  byRoom.forEach((roomCells, roomId) => {
    for (const field of ["type", "modifier", "energyCost"]) {
      if (!roomCells.every((cell) => cell[field] === roomCells[0][field])) errors.push(`房间 ${roomId} 的 ${field} 不一致。`);
    }
  });

  const pathCells = activeCells.filter((cell) => cell.pathOrder != null);
  const orders = new Map();
  pathCells.forEach((cell) => {
    if (orders.has(cell.pathOrder)) errors.push(`路径序号 ${cell.pathOrder} 同时用于 ${orders.get(cell.pathOrder)} 和 ${cell.id}。`);
    orders.set(cell.pathOrder, cell.id);
  });
  const sortedOrders = Array.from(orders.keys()).sort((a, b) => a - b);
  sortedOrders.forEach((order, index) => {
    if (order !== index) warnings.push(`挖掘路径序号不是连续的：期望 ${index}，实际出现 ${order}。`);
  });
  if (activeCells.length && !pathCells.length) warnings.push("尚未填写挖掘路径；顶部防空房可以不在路径中，但地下房间通常需要路径序号。");
  if (state.startExcavatorIndex >= result.base.excavatorPath.length && result.base.excavatorPath.length) {
    errors.push("挖掘机初始路径位置超出了当前路径长度。");
  }
  const boardsWithData = new Set(activeCells.map((cell) => cell.board));
  for (const board of ["A", "B"]) if (!boardsWithData.has(board)) warnings.push(`基地 ${board} 还没有录入。`);
  return { errors: Array.from(new Set(errors)), warnings: Array.from(new Set(warnings)), result };
}

function renderOutput() {
  state.startExcavatorIndex = Math.max(0, toInteger(elements.startExcavatorIndex.value, state.startExcavatorIndex));
  const { errors, warnings, result } = validateEditor();
  elements.validationMessages.innerHTML = "";
  if (!errors.length && !warnings.length) addValidation("当前录入通过基础检查，可以导出。", "success");
  errors.forEach((message) => addValidation(message, "error"));
  warnings.forEach((message) => addValidation(message, "warning"));
  elements.jsonPreview.textContent = JSON.stringify(result, null, 2);

  const activeCount = result.base.cells.length;
  if (errors.length) setBadge(`${errors.length} 个错误`, "bad");
  else if (activeCount) setBadge(`${activeCount} 格已录入`, "good");
  else setBadge("尚未录入", "neutral");
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

function saveLocal() {
  const payload = buildExport();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  showToast("已保存到当前浏览器");
}

async function copyJson() {
  const json = JSON.stringify(buildExport(), null, 2);
  try {
    await navigator.clipboard.writeText(json);
    showToast("JSON 已复制");
  } catch {
    showToast("浏览器阻止了复制，请展开 JSON 后手动复制");
  }
}

function exportJson() {
  const { errors, result } = validateEditor();
  if (errors.length) return showToast("请先修复红色错误再导出");
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "under-falling-skies-base-A-B.json";
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("已导出 JSON 文件");
}

async function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    restorePayload(payload);
    showToast("已导入录入文件");
  } catch (error) {
    showToast(`导入失败：${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function restorePayload(payload) {
  if (payload.schema !== "ufs_base_map_entry_v1" || !Array.isArray(payload.sourceCells)) {
    throw new Error("不是本录入器导出的 ufs_base_map_entry_v1 文件");
  }
  const rows = payload.editor?.boardRows || { A: 3, B: 3 };
  for (const boardId of ["A", "B"]) {
    const board = createBoard(boardId, Math.max(1, toInteger(rows[boardId], 3)));
    const source = payload.sourceCells.filter((cell) => cell.board === boardId);
    board.cells.forEach((cell) => {
      const saved = source.find((item) => item.row === cell.row && item.column === cell.column);
      if (saved) Object.assign(cell, saved, { id: cell.id, board: boardId, row: cell.row, column: cell.column });
    });
    state.boards[boardId] = board;
  }
  state.startExcavatorIndex = Math.max(0, toInteger(payload.base?.startExcavatorIndex, 0));
  elements.startExcavatorIndex.value = state.startExcavatorIndex;
  state.selected.clear();
  render();
}

function toInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

let toastTimer = null;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

document.querySelectorAll(".board-tab").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeBoard = button.dataset.board;
    state.selected.clear();
    document.querySelectorAll(".board-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    render();
  });
});
document.querySelector("#addRowButton").addEventListener("click", addRow);
document.querySelector("#removeRowButton").addEventListener("click", removeRow);
document.querySelector("#cellForm").addEventListener("submit", applySelection);
document.querySelector("#clearSelectedButton").addEventListener("click", () => {
  getSelectedCells().forEach(resetCell);
  render();
});
document.querySelector("#saveButton").addEventListener("click", saveLocal);
document.querySelector("#copyButton").addEventListener("click", copyJson);
document.querySelector("#exportButton").addEventListener("click", exportJson);
document.querySelector("#importInput").addEventListener("change", importJson);
elements.startExcavatorIndex.addEventListener("change", () => {
  state.startExcavatorIndex = Math.max(0, toInteger(elements.startExcavatorIndex.value, 0));
  renderOutput();
});

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  try { restorePayload(JSON.parse(saved)); }
  catch { render(); }
} else {
  render();
}
