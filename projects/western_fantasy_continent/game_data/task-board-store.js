const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TASK_BOARD_FILE = path.join(PROJECT_ROOT, "design", "task-budget-board.json");
const SCHEMA = "agent_automata_task_budget_board_v1";

const VALID_STATUS = new Set(["active", "queued", "blocked", "done", "postponed"]);
const VALID_PRIORITY = new Set(["critical", "high", "medium", "low"]);
const VALID_UNCERTAINTY = new Set(["high", "medium", "low"]);
const VALID_BLAST_RADIUS = new Set(["high", "medium", "low"]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asNonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function cleanId(value, fallback) {
  const id = asText(value, fallback).replace(/[^a-zA-Z0-9_-]/g, "-");
  return id || fallback;
}

function pickEnum(value, allowed, fallback) {
  const normalized = asText(value, fallback);
  return allowed.has(normalized) ? normalized : fallback;
}

function normalizeTask(task, index = 0) {
  const attemptBudget = asNonNegativeNumber(task.attemptBudget, 0);
  const attemptsUsed = asNonNegativeNumber(task.attemptsUsed, 0);
  return {
    id: cleanId(task.id, `task-${index + 1}`),
    name: asText(task.name, "未命名任务"),
    detail: asText(task.detail),
    priority: pickEnum(task.priority || task.importance, VALID_PRIORITY, "medium"),
    importance: pickEnum(task.importance || task.priority, VALID_PRIORITY, "medium"),
    uncertainty: pickEnum(task.uncertainty, VALID_UNCERTAINTY, "medium"),
    blastRadius: pickEnum(task.blastRadius, VALID_BLAST_RADIUS, "medium"),
    attemptBudget,
    attemptsUsed,
    status: pickEnum(task.status, VALID_STATUS, "queued"),
    skillFlow: Array.isArray(task.skillFlow) ? task.skillFlow.map((item) => asText(item)).filter(Boolean) : [],
    successCriteria: Array.isArray(task.successCriteria) ? task.successCriteria.map((item) => asText(item)).filter(Boolean) : [],
    lastEvidence: asText(task.lastEvidence),
  };
}

function normalizeBoard(input) {
  const board = input && typeof input === "object" ? input : {};
  const tasks = Array.isArray(board.tasks) ? board.tasks : [];
  return {
    schema: SCHEMA,
    updatedAt: today(),
    workflow: Array.isArray(board.workflow) ? board.workflow.map((item) => asText(item)).filter(Boolean).slice(0, 8) : [],
    tasks: tasks.map(normalizeTask),
  };
}

function readTaskBoard() {
  if (!fs.existsSync(TASK_BOARD_FILE)) {
    return normalizeBoard({ workflow: [], tasks: [] });
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
  if (!task) {
    throw new Error(`Task not found: ${id}`);
  }
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
