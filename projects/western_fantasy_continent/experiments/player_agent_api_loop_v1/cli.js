const fs = require("node:fs");
const path = require("node:path");
const LOOP = require("./player-agent-loop");

const [, , command, sessionPathInput, payloadPathInput, optionInput, priorRequestInput] = process.argv;
if (!command || !sessionPathInput) usage();

const sessionPath = path.resolve(sessionPathInput);

if (command === "init") {
  const seed = payloadPathInput || "player-agent-api-loop-two-cycle";
  const maxCycles = Number.isFinite(Number(optionInput)) && Number(optionInput) > 0 ? Number(optionInput) : 2;
  writeJson(sessionPath, LOOP.createSession(seed, maxCycles));
  printStatus(sessionPath);
} else if (command === "init-chapter2") {
  const seed = payloadPathInput || "player-agent-api-loop-chapter2";
  const maxCycles = Number.isFinite(Number(optionInput)) && Number(optionInput) > 0 ? Number(optionInput) : 24;
  const priorRequest = priorRequestInput ? readJson(path.resolve(priorRequestInput)) : null;
  const priorPlayerState = priorRequest?.playerState || priorRequest;
  writeJson(sessionPath, LOOP.createChapter2Session(seed, maxCycles, priorPlayerState));
  printStatus(sessionPath);
} else if (command === "request") {
  const session = readJson(sessionPath);
  const outputPath = payloadPathInput ? path.resolve(payloadPathInput) : null;
  const request = LOOP.getPendingRequest(session);
  if (outputPath) writeJson(outputPath, request);
  else process.stdout.write(`${JSON.stringify(request, null, 2)}\n`);
} else if (command === "decision") {
  if (!payloadPathInput) usage();
  const next = LOOP.applyDecisionResponse(readJson(sessionPath), readJson(path.resolve(payloadPathInput)));
  writeJson(sessionPath, next);
  printStatus(sessionPath);
} else if (command === "attribution") {
  if (!payloadPathInput) usage();
  const next = LOOP.applyAttributionResponse(readJson(sessionPath), readJson(path.resolve(payloadPathInput)));
  writeJson(sessionPath, next);
  printStatus(sessionPath);
} else if (command === "summary") {
  const session = readJson(sessionPath);
  const summary = {
    schema: session.schema,
    seed: session.seed,
    phase: session.phase,
    completedCycles: session.cycle,
    finalEmotion: session.cognitionState.emotion,
    conceptState: session.conceptState,
    eventStatisticsCount: session.cognitionState.knowledge.length,
    knowledgeBase: session.knowledgeBase,
    apiCalls: session.apiCalls,
    cycles: session.history.map((row) => ({
      cycle: row.cycle,
      action: row.action,
      outcome: row.outcome,
      emotionBeforeDecision: row.emotionBeforeDecision,
      emotionAfterDecision: row.emotionAfterDecision,
      emotionAfterEvents: row.emotionAfterEvents,
      automaticEmotionDelta: row.automaticEmotionDelta,
      gameEvent: row.gameEvent,
      eventLog: row.eventLog,
      conceptInterpretation: row.conceptInterpretation,
      learningDelta: row.learningDelta,
      eventTrace: row.eventTrace,
      attribution: row.attribution,
    })),
  };
  if (payloadPathInput) writeJson(path.resolve(payloadPathInput), summary);
  else process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  usage();
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
function printStatus(filePath) {
  const session = readJson(filePath);
  process.stdout.write(`${JSON.stringify({ phase: session.phase, completedCycles: session.cycle, sessionPath: filePath })}\n`);
}
function usage() {
  throw new Error("usage: node cli.js <init|init-chapter2|request|decision|attribution|summary> <session.json> [payload.json|seed] [maxCycles] [prior-request.json]");
}
