const fs = require("node:fs");
const path = require("node:path");
const LOOP = require("./five-day-formal-player-loop");

const [, , command, sessionInput, payloadInput, optionInput] = process.argv;
if (!command || !sessionInput) usage();
const sessionPath = path.resolve(sessionInput);

if (command === "init") {
  const seed = payloadInput || "five-day-formal-player";
  const maxCycles = Math.max(1, Number(optionInput) || 40);
  writeJson(sessionPath, LOOP.createSession(seed, maxCycles));
  printStatus();
} else if (command === "request") {
  const request = LOOP.getPendingRequest(readJson(sessionPath));
  if (payloadInput) writeJson(path.resolve(payloadInput), request);
  else process.stdout.write(`${JSON.stringify(request, null, 2)}\n`);
} else if (command === "decision") {
  if (!payloadInput) usage();
  writeJson(sessionPath, LOOP.applyDecisionResponse(readJson(sessionPath), readJson(path.resolve(payloadInput))));
  printStatus();
} else if (command === "attribution") {
  if (!payloadInput) usage();
  writeJson(sessionPath, LOOP.applyAttributionResponse(readJson(sessionPath), readJson(path.resolve(payloadInput))));
  printStatus();
} else if (command === "summary") {
  const session = readJson(sessionPath);
  const summary = {
    schema: session.schema,
    seed: session.seed,
    phase: session.phase,
    completedCycles: session.cycle,
    finalObservation: require("./five-day-raid-core").getPlayerObservation(session.gameState),
    knowledgeBase: session.knowledgeBase,
    apiCalls: session.apiCalls,
    cycles: session.history.map((row) => ({
      cycle: row.cycle,
      action: row.action,
      visibleResult: row.eventLog.map((event) => ({ id: event.id, summary: event.result.summary })),
      attribution: row.attribution,
      learningDelta: row.learningDelta,
    })),
  };
  if (payloadInput) writeJson(path.resolve(payloadInput), summary);
  else process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  usage();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function printStatus() {
  const session = readJson(sessionPath);
  process.stdout.write(`${JSON.stringify({ phase: session.phase, completedCycles: session.cycle, sessionPath })}\n`);
}

function usage() {
  throw new Error("usage: node five-day-formal-player-cli.js <init|request|decision|attribution|summary> <session.json> [payload.json|seed] [maxCycles]");
}
