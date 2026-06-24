#!/usr/bin/env node
const {
  createTask,
  readTaskBoard,
  recordAttempt,
  taskSummary,
  updateTask,
} = require("./task-board-store.js");

function usage() {
  console.log(`Task board updater

Usage:
  node game_data/update-task-board.js list
  node game_data/update-task-board.js attempt <task-id> --decision <accept|reject|inconclusive|note> --evidence "text" [--status active|queued|blocked|done|postponed]
  node game_data/update-task-board.js set <task-id> [--status value] [--priority value] [--budget n] [--used n] [--evidence "text"]
  node game_data/update-task-board.js create <task-id> --name "text" --detail "text" --priority high --budget 5

Agents should use this updater instead of editing design/task-budget-board.json directly.`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item.startsWith("--")) {
      const key = item.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    } else {
      args._.push(item);
    }
  }
  return args;
}

function printBoard(board) {
  const rows = board.tasks.map(taskSummary);
  console.table(rows);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const id = args._[1];

  if (!command || command === "help" || command === "--help") {
    usage();
    return;
  }

  if (command === "list") {
    printBoard(readTaskBoard());
    return;
  }

  if (!id) {
    throw new Error(`Missing task id for command: ${command}`);
  }

  if (command === "attempt") {
    const board = recordAttempt(id, {
      decision: args.decision || "note",
      evidence: args.evidence || "",
      status: args.status,
      increment: args.increment || 1,
      allowOverBudget: Boolean(args["allow-over-budget"]),
    });
    printBoard(board);
    return;
  }

  if (command === "set") {
    const patch = {};
    if (args.name) patch.name = args.name;
    if (args.detail) patch.detail = args.detail;
    if (args.status) patch.status = args.status;
    if (args.priority) patch.priority = args.priority;
    if (args.importance) patch.importance = args.importance;
    if (args.uncertainty) patch.uncertainty = args.uncertainty;
    if (args["blast-radius"]) patch.blastRadius = args["blast-radius"];
    if (args.budget !== undefined) patch.attemptBudget = args.budget;
    if (args.used !== undefined) patch.attemptsUsed = args.used;
    if (args.evidence !== undefined) patch.lastEvidence = args.evidence;
    if (args.skills !== undefined) {
      patch.skillFlow = String(args.skills)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (args.criteria !== undefined) {
      patch.successCriteria = String(args.criteria)
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    const board = updateTask(id, patch);
    printBoard(board);
    return;
  }

  if (command === "create") {
    const board = createTask({
      id,
      name: args.name,
      detail: args.detail,
      priority: args.priority,
      importance: args.importance || args.priority,
      uncertainty: args.uncertainty,
      blastRadius: args["blast-radius"],
      attemptBudget: args.budget,
      attemptsUsed: 0,
      status: args.status || "queued",
      skillFlow: String(args.skills || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      successCriteria: String(args.criteria || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean),
      lastEvidence: args.evidence || "",
    });
    printBoard(board);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
