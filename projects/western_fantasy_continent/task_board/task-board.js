const state = {
  board: null,
  filter: "all",
};

const els = {
  totalTasks: document.getElementById("totalTasks"),
  activeTasks: document.getElementById("activeTasks"),
  usedAttempts: document.getElementById("usedAttempts"),
  remainingAttempts: document.getElementById("remainingAttempts"),
  workflowList: document.getElementById("workflowList"),
  updatedAt: document.getElementById("updatedAt"),
  taskList: document.getElementById("taskList"),
  statusLine: document.getElementById("statusLine"),
  saveButton: document.getElementById("saveButton"),
};

function clampNumber(value) {
  return Math.max(0, Number(value || 0));
}

function remaining(task) {
  return Math.max(0, clampNumber(task.attemptBudget) - clampNumber(task.attemptsUsed));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priorityLabel(priority) {
  return {
    critical: "关键",
    high: "高",
    medium: "中",
    low: "低",
  }[priority] || priority || "中";
}

function statusLabel(status) {
  return {
    active: "进行中",
    queued: "排队",
    blocked: "阻塞",
    done: "完成",
    postponed: "推迟",
  }[status] || status || "排队";
}

function shouldShow(task) {
  if (state.filter === "all") return true;
  if (state.filter === "high") return task.priority === "high" || task.importance === "high";
  return task.status === state.filter;
}

function renderSummary() {
  const tasks = state.board.tasks || [];
  const used = tasks.reduce((sum, task) => sum + clampNumber(task.attemptsUsed), 0);
  const left = tasks.reduce((sum, task) => sum + remaining(task), 0);
  els.totalTasks.textContent = tasks.length;
  els.activeTasks.textContent = tasks.filter((task) => task.status === "active").length;
  els.usedAttempts.textContent = used;
  els.remainingAttempts.textContent = left;
  els.updatedAt.textContent = `数据更新时间：${state.board.updatedAt || "未知"}`;
}

function renderWorkflow() {
  const steps = state.board.workflow || [];
  els.workflowList.innerHTML = steps.map((step, index) => `
    <li><b>${index + 1}</b>${escapeHtml(step)}</li>
  `).join("");
}

function renderTasks() {
  const tasks = (state.board.tasks || []).filter(shouldShow);
  els.taskList.innerHTML = tasks.map((task) => {
    const budget = clampNumber(task.attemptBudget);
    const used = clampNumber(task.attemptsUsed);
    const left = remaining(task);
    const pct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
    const criteria = (task.successCriteria || []).slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const flow = (task.skillFlow || []).map((item) => `<span class="skill-chip">${escapeHtml(item)}</span>`).join("");
    return `
      <article class="task-card ${escapeHtml(task.status)}" data-id="${escapeHtml(task.id)}">
        <div class="task-title">
          <h3>${escapeHtml(task.name)}</h3>
          <div class="badges">
            <span class="badge ${escapeHtml(task.priority)}">${priorityLabel(task.priority)}</span>
            <span class="badge ${escapeHtml(task.status)}">${statusLabel(task.status)}</span>
          </div>
        </div>

        <p class="detail">${escapeHtml(task.detail)}</p>

        <div>
          <div class="budget-row">
            <span class="budget-label">尝试预算</span>
            <span class="budget-count">已用 ${used} / 总 ${budget} / 剩 ${left}</span>
            <div class="budget-bar"><div class="budget-fill" style="width:${pct}%"></div></div>
          </div>

          <div class="task-body">
            <div class="mini-panel">
              <strong>验收信号</strong>
              <ul>${criteria || "<li>待补充</li>"}</ul>
            </div>
            <div class="mini-panel">
              <strong>Skill 顺序</strong>
              <div class="skill-flow">${flow || "<span class=\"skill-chip\">待选择</span>"}</div>
            </div>
          </div>
        </div>

        <div>
          <p class="evidence">${escapeHtml(task.lastEvidence || "暂无证据")}</p>
          <div class="task-edit">
            <label>
              已尝试
              <input type="number" min="0" max="99" data-field="attemptsUsed" value="${used}">
            </label>
            <label>
              总预算
              <input type="number" min="0" max="99" data-field="attemptBudget" value="${budget}">
            </label>
            <label>
              状态
              <select data-field="status">
                ${["active", "queued", "blocked", "done", "postponed"].map((status) => `
                  <option value="${status}" ${status === task.status ? "selected" : ""}>${statusLabel(status)}</option>
                `).join("")}
              </select>
            </label>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function render() {
  renderSummary();
  renderWorkflow();
  renderTasks();
}

function updateTaskFromInput(input) {
  const card = input.closest(".task-card");
  const task = state.board.tasks.find((item) => item.id === card.dataset.id);
  if (!task) return;
  const field = input.dataset.field;
  if (field === "attemptsUsed" || field === "attemptBudget") {
    task[field] = clampNumber(input.value);
  } else {
    task[field] = input.value;
  }
  renderSummary();
}

async function loadBoard() {
  els.statusLine.textContent = "正在读取任务表...";
  const response = await fetch("/api/task-board");
  if (!response.ok) throw new Error(`读取失败：${response.status}`);
  state.board = await response.json();
  render();
  els.statusLine.textContent = "任务表已加载。";
}

async function saveBoard() {
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

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-field]")) {
    updateTaskFromInput(event.target);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-field]")) {
    updateTaskFromInput(event.target);
    renderTasks();
  }
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderTasks();
  });
});

els.saveButton.addEventListener("click", () => {
  saveBoard().catch((error) => {
    els.statusLine.textContent = error.message;
  });
});

loadBoard().catch((error) => {
  els.statusLine.textContent = error.message;
});
