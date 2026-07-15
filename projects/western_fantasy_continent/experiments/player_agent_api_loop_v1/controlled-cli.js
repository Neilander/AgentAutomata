const fs = require("node:fs");
const path = require("node:path");
const CONTROLLED = require("./controlled-two-chapter-run");
const LOOP = require("./player-agent-loop");

const [, , command, runPathInput, firstInput, secondInput] = process.argv;
if (!command || !runPathInput) usage();

const runPath = path.resolve(runPathInput);

if (command === "init") {
  writeJson(runPath, CONTROLLED.createRun({
    seed: firstInput || "controlled-two-chapter-run",
    profileId: secondInput || "open_novice",
  }));
  printStatus(runPath);
} else if (command === "pending") {
  const run = readJson(runPath);
  const request = LOOP.getPendingRequest(activeSession(run));
  output(request, firstInput);
} else if (command === "request") {
  if (!firstInput) usage();
  const run = readJson(runPath);
  const directive = readJson(path.resolve(firstInput));
  output(CONTROLLED.getPendingRequest(run, directive), secondInput);
} else if (command === "decision") {
  if (!firstInput || !secondInput) usage();
  const next = CONTROLLED.applyDecisionResponse(
    readJson(runPath),
    readJson(path.resolve(firstInput)),
    readJson(path.resolve(secondInput)),
  );
  writeJson(runPath, next);
  printStatus(runPath);
} else if (command === "attribution") {
  if (!firstInput) usage();
  const next = CONTROLLED.applyAttributionResponse(readJson(runPath), readJson(path.resolve(firstInput)));
  writeJson(runPath, next);
  printStatus(runPath);
} else if (command === "advance") {
  const maxCycles = Math.max(1, Math.floor(Number(firstInput) || 40));
  writeJson(runPath, CONTROLLED.advanceToChapter2(readJson(runPath), { maxCycles }));
  printStatus(runPath);
} else if (command === "extend") {
  const maxCycles = Math.max(1, Math.floor(Number(firstInput) || 0));
  writeJson(runPath, CONTROLLED.extendActiveChapter(readJson(runPath), maxCycles));
  printStatus(runPath);
} else if (command === "summary") {
  output(CONTROLLED.summarizeEmotion(readJson(runPath)), firstInput);
} else {
  usage();
}

function activeSession(run) {
  return run.activeChapter === 2 ? run.chapter2 : run.chapter1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function output(value, outputPathInput) {
  if (outputPathInput) writeJson(path.resolve(outputPathInput), value);
  else process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printStatus(filePath) {
  const run = readJson(filePath);
  const session = activeSession(run);
  process.stdout.write(`${JSON.stringify({
    activeChapter: run.activeChapter,
    phase: session.phase,
    completedCycles: session.cycle,
    emotion: session.cognitionState.emotion.value,
  })}\n`);
}

function usage() {
  throw new Error("usage: node controlled-cli.js <init|pending|request|decision|attribution|advance|extend|summary> <run.json> [input|output|seed|maxCycles] [response|output|profileId]");
}
