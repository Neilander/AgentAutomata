const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TASK_BOARD_FILE = path.join(PROJECT_ROOT, "design", "task-budget-board.json");
const SCHEMA = "agent_automata_task_budget_board_v2";

const VALID_STATUS = new Set(["active", "queued", "blocked", "done", "postponed"]);
const VALID_PRIORITY = new Set(["critical", "high", "medium", "low"]);
const VALID_UNCERTAINTY = new Set(["high", "medium", "low"]);
const VALID_BLAST_RADIUS = new Set(["high", "medium", "low"]);
const VALID_TASK_TYPE = new Set(["balance", "ui", "tooling", "design", "research", "content", "vfx", "bug", "ops"]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asText(item)).filter(Boolean);
}

function asNonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function cleanId(value, fallback) {
  const id = asText(value, fallback).replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
  return id || fallback;
}

function pickEnum(value, allowed, fallback) {
  const normalized = asText(value, fallback);
  return allowed.has(normalized) ? normalized : fallback;
}

function defaultLineName(lineId, type) {
  const labels = {
    balance: "数值与流派",
    ui: "界面与交互",
    tooling: "工具与自动化",
    design: "设计模型",
    research: "调研",
    content: "内容生产",
    vfx: "特效表现",
    bug: "缺陷修复",
    ops: "工程运维",
  };
  return labels[type] || lineId;
}

function normalizeTask(task = {}, index = 0) {
  const id = cleanId(task.id, `task-${index + 1}`);
  const parentId = task.parentId ? cleanId(task.parentId, "") : "";
  const type = pickEnum(task.type || task.category, VALID_TASK_TYPE, "balance");
  const lineId = cleanId(task.lineId || parentId || type, type);
  const attemptBudget = asNonNegativeNumber(task.attemptBudget, 0);
  const attemptsUsed = asNonNegativeNumber(task.attemptsUsed, 0);

  return {
    id,
    name: asText(task.name, "未命名任务"),
    detail: asText(task.detail),
    type,
    category: type,
    lineId,
    parentId,
    sourceTaskId: task.sourceTaskId ? cleanId(task.sourceTaskId, parentId || "") : parentId,
    outcome: asText(task.outcome || task.goal),
    nextAction: asText(task.nextAction),
    owner: asText(task.owner, "agent"),
    priority: pickEnum(task.priority || task.importance, VALID_PRIORITY, "medium"),
    importance: pickEnum(task.importance || task.priority, VALID_PRIORITY, "medium"),
    uncertainty: pickEnum(task.uncertainty, VALID_UNCERTAINTY, "medium"),
    blastRadius: pickEnum(task.blastRadius, VALID_BLAST_RADIUS, "medium"),
    attemptBudget,
    attemptsUsed,
    status: pickEnum(task.status, VALID_STATUS, "queued"),
    links: asList(task.links),
    tags: asList(task.tags),
    skillFlow: asList(task.skillFlow),
    successCriteria: asList(task.successCriteria),
    lastEvidence: asText(task.lastEvidence),
  };
}

function normalizeTaskLines(lines, tasks) {
  const byId = new Map();
  const input = Array.isArray(lines) ? lines : [];
  for (const line of input) {
    const id = cleanId(line.id, "");
    if (!id) continue;
    byId.set(id, {
      id,
      name: asText(line.name, id),
      detail: asText(line.detail),
      color: asText(line.color),
      status: pickEnum(line.status, VALID_STATUS, "active"),
    });
  }

  for (const task of tasks) {
    if (byId.has(task.lineId)) continue;
    byId.set(task.lineId, {
      id: task.lineId,
      name: defaultLineName(task.lineId, task.type),
      detail: "",
      color: "",
      status: "active",
    });
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function normalizeBoard(input) {
  const board = input && typeof input === "object" ? input : {};
  const tasks = Array.isArray(board.tasks) ? board.tasks.map(normalizeTask) : [];
  return {
    schema: SCHEMA,
    updatedAt: today(),
    workflow: Array.isArray(board.workflow) ? board.workflow.map((item) => asText(item)).filter(Boolean).slice(0, 8) : [],
    taskLines: normalizeTaskLines(board.taskLines, tasks),
    tasks,
  };
}

function readTaskBoard() {
  if (!fs.existsSync(TASK_BOARD_FILE)) {
    return normalizeBoard({ workflow: [], taskLines: [], tasks: [] });
  }
  return normalizeBoard(JSON.parse(fs.readFileSync(TASK_BOARD_FILE, "utf8")));
}

function writeTaskBoard(board) {
  const normalized = normalizeBoard(board);
  fs.mkdirSync(path.dirname(TASK_BOARD_FILE), { recursive: true });
  fs.writeFileSync(TASK_BOARD_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

function findTask(board, id) {
  const task = board.tasks.find((item) => item.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  return task;
}

function updateTask(id, patch) {
  const board = readTaskBoard();
  const task = findTask(board, id);
  const next = normalizeTask({ ...task, ...patch }, board.tasks.indexOf(task));
  Object.assign(task, next);
  return writeTaskBoard(board);
}

function createTask(task) {
  const board = readTaskBoard();
  const next = normalizeTask(task, board.tasks.length);
  if (board.tasks.some((item) => item.id === next.id)) {
    throw new Error(`Task already exists: ${next.id}`);
  }
  board.tasks.push(next);
  return writeTaskBoard(board);
}

function recordAttempt(id, options = {}) {
  const board = readTaskBoard();
  const task = findTask(board, id);
  const increment = asNonNegativeNumber(options.increment, 1);
  const nextUsed = task.attemptsUsed + increment;
  if (nextUsed > task.attemptBudget && !options.allowOverBudget) {
    throw new Error(`Task ${id} would exceed budget: ${nextUsed}/${task.attemptBudget}`);
  }
  task.attemptsUsed = nextUsed;
  if (options.status) task.status = pickEnum(options.status, VALID_STATUS, task.status);
  const decision = asText(options.decision, "record");
  const evidence = asText(options.evidence, "No evidence provided.");
  task.lastEvidence = `${today()} ${decision}: ${evidence}`;
  return writeTaskBoard(board);
}

function taskSummary(task) {
  const remaining = Math.max(0, task.attemptBudget - task.attemptsUsed);
  return {
    id: task.id,
    name: task.name,
    type: task.type,
    lineId: task.lineId,
    parentId: task.parentId,
    priority: task.priority,
    status: task.status,
    attemptsUsed: task.attemptsUsed,
    attemptBudget: task.attemptBudget,
    remaining,
    overBudget: task.attemptsUsed > task.attemptBudget,
  };
}

module.exports = {
  TASK_BOARD_FILE,
  normalizeBoard,
  readTaskBoard,
  writeTaskBoard,
  updateTask,
  createTask,
  recordAttempt,
  taskSummary,
};
