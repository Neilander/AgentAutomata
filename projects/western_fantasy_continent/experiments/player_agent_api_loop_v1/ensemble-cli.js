const fs = require("node:fs");
const path = require("node:path");
const ENSEMBLE = require("./player-profile-ensemble");

const [, , command, ensemblePathInput, firstInput, secondInput, thirdInput] = process.argv;
if (!command || !ensemblePathInput) usage();

const ensemblePath = path.resolve(ensemblePathInput);

if (command === "init") {
  const seed = firstInput || "player-profile-ensemble";
  const selection = parseSelection(secondInput || "2");
  const maxCycles = Math.max(1, Math.floor(Number(thirdInput) || 2));
  writeJson(ensemblePath, ENSEMBLE.createEnsemble({ seed, maxCycles, ...selection }));
  printStatus(ensemblePath);
} else if (command === "request") {
  const requests = ENSEMBLE.getPendingRequests(readJson(ensemblePath));
  if (firstInput) writeJson(path.resolve(firstInput), requests);
  else process.stdout.write(`${JSON.stringify(requests, null, 2)}\n`);
} else if (command === "decision" || command === "attribution") {
  if (!firstInput || !secondInput) usage();
  const ensemble = readJson(ensemblePath);
  const response = readJson(path.resolve(secondInput));
  const next = command === "decision"
    ? ENSEMBLE.applyDecisionResponse(ensemble, firstInput, response)
    : ENSEMBLE.applyAttributionResponse(ensemble, firstInput, response);
  writeJson(ensemblePath, next);
  printStatus(ensemblePath);
} else if (command === "summary") {
  const ensemble = readJson(ensemblePath);
  const summary = {
    schema: ensemble.schema,
    seed: ensemble.seed,
    selectedProfileIds: ensemble.selectedProfileIds,
    runs: ensemble.runs.map((run) => ({
      profileId: run.profileId,
      phase: run.session.phase,
      completedCycles: run.session.cycle,
      finalEmotion: run.session.cognitionState.emotion,
      knowledgeCount: run.session.knowledgeBase.length,
      actions: run.session.history.map((row) => row.action),
    })),
  };
  if (firstInput) writeJson(path.resolve(firstInput), summary);
  else process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  usage();
}

function parseSelection(value) {
  if (/^\d+$/.test(value)) return { profileCount: Number(value) };
  return { profileIds: value.split(",").map((row) => row.trim()).filter(Boolean) };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function printStatus(filePath) {
  const ensemble = readJson(filePath);
  process.stdout.write(`${JSON.stringify({
    ensemblePath: filePath,
    selectedProfileIds: ensemble.selectedProfileIds,
    phases: Object.fromEntries(ensemble.runs.map((run) => [run.profileId, run.session.phase])),
  })}\n`);
}

function usage() {
  throw new Error("usage: node ensemble-cli.js <init|request|decision|attribution|summary> <ensemble.json> [seed|profileId|output.json] [profileCount|profileIdsCsv|response.json] [maxCycles]");
}
