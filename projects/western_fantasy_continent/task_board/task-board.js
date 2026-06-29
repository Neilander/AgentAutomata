const TYPES = ["balance", "ui", "tooling", "design", "research", "content", "vfx", "bug", "ops"];
const STATUSES = ["active", "queued", "blocked", "done", "postponed"];
const PRIORITIES = ["critical", "high", "medium", "low"];

const TYPE_LABEL = {
  balance: "数值",
  ui: "界面",
  tooling: "工具",
  design: "设计",
  research: "调研",
  content: "内容",
  vfx: "特效",
  bug: "缺陷",
  ops: "工程",
};

const STATUS_LABEL = {
  active: "进行中",
  queued: "排队",
  blocked: "阻塞",
  done: "完成",
  postponed: "推迟",
};

const PRIORITY_LABEL = {
  critical: "关键",
  high: "高",
  medium: "中",
  low: "低",
};

const state = {
  board: null,
  filter: "all",
  selectedLineId: "",
  selectedTaskId: "",
};

const els = {
  totalTasks: document.getElementById("totalTasks"),
  totalLines: document.getElementById("totalLines"),
  activeTasks: document.getElementById("activeTasks"),
  remainingAttempts: document.getElementById("remainingAttempts"),
  workflowList: document.getElementById("workflowList"),
  updatedAt: document.getElementById("updatedAt"),
  lineList: document.getElementById("lineList"),
  taskTree: document.getElementById("taskTree"),
  currentLineTitle: document.getElementById("currentLineTitle"),
  currentLineMeta: document.getElementById("currentLineMeta"),
  selectedTaskId: document.getElementById("selectedTaskId"),
  statusLine: document.getElementById("statusLine"),
  saveButton: document.getElementById("saveButton"),
  addRootButton: document.getElementById("addRootButton"),
  addChildButton: document.getElementById("addChildButton"),
  form: document.getElementById("taskForm"),
};

function number(value) {
  return Math.max(0, Number(value || 0));
}

function remaining(task) {
  return Math.max(0, number(task.attemptBudget) - number(task.attemptsUsed));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanId(value) {
  return String(value || "task")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "task";
}

function lines() {
  return state.board?.taskLines || [];
}

function tasks() {
  return state.board?.tasks || [];
}

function selectedTask() {
  return tasks().find((task) => task.id === state.selectedTaskId) || null;
}

function shouldShow(task) {
  if (state.filter === "all") return true;
  if (state.filter === "high") return task.priority === "critical" || task.priority === "high";
  return task.status === state.filter;
}

function lineTasks(lineId) {
  return tasks().filter((task) => task.lineId === lineId && shouldShow(task));
}

function buildChildren(taskList) {
  const map = new Map();
  for (const task of taskList) map.set(task.id, []);
  for (const task of taskList) {
    if (task.parentId && map.has(task.parentId)) map.get(task.parentId).push(task);
  }
  return map;
}

function rootTasks(taskList) {
  const ids = new Set(taskList.map((task) => task.id));
  return taskList.filter((task) => !task.parentId || !ids.has(task.parentId));
}

function fillSelect(select, values, labels) {
  select.innerHTML = values.map((value) => `<option value="${value}">${labels[value] || value}</option>`).join("");
}

function ensureFormOptions() {
  fillSelect(els.form.elements.type, TYPES, TYPE_LABEL);
  fillSelect(els.form.elements.status, STATUSES, STATUS_LABEL);
  fillSelect(els.form.elements.priority, PRIORITIES, PRIORITY_LABEL);
}

function renderSummary() {
  const all = tasks();
  els.totalTasks.textContent = all.length;
  els.totalLines.textContent = lines().length;
  els.activeTasks.textContent = all.filter((task) => task.status === "active").length;
  els.remainingAttempts.textContent = all.reduce((sum, task) => sum + remaining(task), 0);
  els.updatedAt.textContent = state.board?.updatedAt ? `更新 ${state.board.updatedAt}` : "未加载";
}

function renderWorkflow() {
  const steps = state.board?.workflow || [];
  els.workflowList.innerHTML = steps.map((step, index) => `<li><b>${index + 1}</b>${escapeHtml(step)}</li>`).join("");
}

function renderLines() {
  const all = tasks().filter(shouldShow);
  els.lineList.innerHTML = lines().map((line) => {
    const count = all.filter((task) => task.lineId === line.id).length;
    const active = all.filter((task) => task.lineId === line.id && task.status === "active").length;
    return `
      <button class="line-item ${line.id === state.selectedLineId ? "selected" : ""}" type="button" data-line-id="${escapeHtml(line.id)}">
        <span>${escapeHtml(line.name)}</span>
        <strong>${count}</strong>
        <small>${active} 进行中</small>
      </button>
    `;
  }).join("");
}

function renderTaskNode(task, childMap, depth = 0) {
  const kids = childMap.get(task.id) || [];
  const budget = number(task.attemptBudget);
  const used = number(task.attemptsUsed);
  const pct = budget ? Math.min(100, Math.round((used / budget) * 100)) : 0;
  return `
    <article class="task-node ${task.id === state.selectedTaskId ? "selected" : ""} ${escapeHtml(task.status)}" data-task-id="${escapeHtml(task.id)}" style="--depth:${depth}">
      <button class="task-main" type="button" data-task-id="${escapeHtml(task.id)}">
        <span class="task-kind ${escapeHtml(task.type)}">${TYPE_LABEL[task.type] || task.type}</span>
        <span class="task-name">${escapeHtml(task.name)}</span>
        <span class="task-meta">
          <b>${PRIORITY_LABEL[task.priority] || task.priority}</b>
          <i>${STATUS_LABEL[task.status] || task.status}</i>
          <em>${used}/${budget}</em>
        </span>
        <span class="task-progress"><span style="width:${pct}%"></span></span>
        <small>${escapeHtml(task.nextAction || task.outcome || task.detail || "暂无下一步")}</small>
      </button>
    </article>
    ${kids.map((child) => renderTaskNode(child, childMap, depth + 1)).join("")}
  `;
}

function renderTree() {
  const line = lines().find((item) => item.id === state.selectedLineId);
  const list = lineTasks(state.selectedLineId);
  const childMap = buildChildren(list);
  els.currentLineTitle.textContent = line?.name || "任务树";
  els.currentLineMeta.textContent = `${list.length} 个任务`;
  els.taskTree.innerHTML = rootTasks(list).map((task) => renderTaskNode(task, childMap)).join("")
    || `<div class="empty">这条任务线暂时没有任务。</div>`;
}

function renderForm() {
  const task = selectedTask();
  els.selectedTaskId.textContent = task ? task.id : "未选择";
  els.form.classList.toggle("disabled", !task);
  for (const element of els.form.elements) {
    if (!element.name) continue;
    element.disabled = !task;
  }
  if (!task) {
    els.form.reset();
    return;
  }
  els.form.elements.name.value = task.name || "";
  els.form.elements.detail.value = task.detail || "";
  els.form.elements.outcome.value = task.outcome || "";
  els.form.elements.nextAction.value = task.nextAction || "";
  els.form.elements.type.value = task.type || "balance";
  els.form.elements.lineId.value = task.lineId || "";
  els.form.elements.parentId.value = task.parentId || "";
  els.form.elements.status.value = task.status || "queued";
  els.form.elements.priority.value = task.priority || "medium";
  els.form.elements.attemptBudget.value = number(task.attemptBudget);
  els.form.elements.attemptsUsed.value = number(task.attemptsUsed);
  els.form.elements.owner.value = task.owner || "";
  els.form.elements.successCriteria.value = (task.successCriteria || []).join("\n");
  els.form.elements.skillFlow.value = (task.skillFlow || []).join("\n");
  els.form.elements.tags.value = (task.tags || []).join(", ");
  els.form.elements.lastEvidence.value = task.lastEvidence || "";
}

function render() {
  if (!state.selectedLineId && lines()[0]) state.selectedLineId = lines()[0].id;
  if (!state.selectedTaskId) {
    const first = lineTasks(state.selectedLineId)[0] || tasks()[0];
    state.selectedTaskId = first?.id || "";
  }
  renderSummary();
  renderWorkflow();
  renderLines();
  renderTree();
  renderForm();
}

function updateTaskFromForm() {
  const task = selectedTask();
  if (!task) return;
  const form = els.form.elements;
  task.name = form.name.value.trim();
  task.detail = form.detail.value.trim();
  task.outcome = form.outcome.value.trim();
  task.nextAction = form.nextAction.value.trim();
  task.type = form.type.value;
  task.category = form.type.value;
  task.lineId = cleanId(form.lineId.value || form.type.value);
  task.parentId = form.parentId.value.trim() ? cleanId(form.parentId.value) : "";
  task.status = form.status.value;
  task.priority = form.priority.value;
  task.importance = form.priority.value;
  task.attemptBudget = number(form.attemptBudget.value);
  task.attemptsUsed = number(form.attemptsUsed.value);
  task.owner = form.owner.value.trim() || "agent";
  task.successCriteria = form.successCriteria.value.split("\n").map((item) => item.trim()).filter(Boolean);
  task.skillFlow = form.skillFlow.value.split("\n").map((item) => item.trim()).filter(Boolean);
  task.tags = form.tags.value.split(",").map((item) => item.trim()).filter(Boolean);
  task.lastEvidence = form.lastEvidence.value.trim();
  if (!lines().some((line) => line.id === task.lineId)) {
    state.board.taskLines.push({ id: task.lineId, name: task.lineId, detail: "", color: "", status: "active" });
  }
  state.selectedLineId = task.lineId;
  render();
}

function newTask(parent = null) {
  const type = parent?.type || "design";
  const lineId = parent?.lineId || state.selectedLineId || type;
  const base = parent ? `${parent.id}-branch` : `${lineId}-task`;
  let id = cleanId(`${base}-${tasks().length + 1}`);
  let suffix = 2;
  while (tasks().some((task) => task.id === id)) id = cleanId(`${base}-${suffix++}`);
  const task = {
    id,
    name: parent ? "新发散任务" : "新任务",
    detail: parent ? `由「${parent.name}」发散。` : "",
    type,
    category: type,
    lineId,
    parentId: parent?.id || "",
    sourceTaskId: parent?.id || "",
    outcome: "",
    nextAction: "补充目标、验收信号和尝试预算。",
    owner: "agent",
    priority: parent?.priority || "medium",
    importance: parent?.priority || "medium",
    uncertainty: "medium",
    blastRadius: "medium",
    attemptBudget: parent ? 4 : 3,
    attemptsUsed: 0,
    status: "queued",
    links: [],
    tags: parent ? ["branch"] : [],
    skillFlow: [],
    successCriteria: [],
    lastEvidence: "",
  };
  state.board.tasks.push(task);
  state.selectedLineId = lineId;
  state.selectedTaskId = id;
  render();
}

async function loadBoard() {
  els.statusLine.textContent = "正在读取任务线...";
  const response = await fetch("/api/task-board");
  if (!response.ok) throw new Error(`读取失败：${response.status}`);
  state.board = await response.json();
  render();
  els.statusLine.textContent = "任务线已加载。";
}

async function saveBoard() {
  updateTaskFromForm();
  els.statusLine.textContent = "正在保存...";
  const response = await fetch("/api/task-board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board: state.board }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `保存失败：${response.status}`);
  state.board = payload.board;
  render();
  els.statusLine.textContent = "已保存到 design/task-budget-board.json。";
}

ensureFormOptions();

document.addEventListener("click", (event) => {
  const lineButton = event.target.closest("[data-line-id]");
  if (lineButton) {
    state.selectedLineId = lineButton.dataset.lineId;
    const first = lineTasks(state.selectedLineId)[0];
    state.selectedTaskId = first?.id || "";
    render();
    return;
  }
  const taskButton = event.target.closest("[data-task-id]");
  if (taskButton) {
    state.selectedTaskId = taskButton.dataset.taskId;
    render();
  }
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    render();
  });
});

els.form.addEventListener("change", updateTaskFromForm);
els.form.addEventListener("input", (event) => {
  if (event.target.name === "name" || event.target.name === "nextAction") updateTaskFromForm();
});

els.addRootButton.addEventListener("click", () => newTask());
els.addChildButton.addEventListener("click", () => newTask(selectedTask()));
els.saveButton.addEventListener("click", () => saveBoard().catch((error) => {
  els.statusLine.textContent = error.message;
}));

loadBoard().catch((error) => {
  els.statusLine.textContent = error.message;
});
