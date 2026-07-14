const fs = require("node:fs");
const path = require("node:path");
const LOOP = require("./player-agent-loop");

const [, , sourceInput, targetInput, responseCountInput] = process.argv;
if (!sourceInput || !targetInput || !responseCountInput) {
  throw new Error("usage: node replay-recorded-prefix.js <source-dir> <target-dir> <response-count>");
}

const sourceDir = path.resolve(sourceInput);
const targetDir = path.resolve(targetInput);
const responseCount = Number(responseCountInput);
if (!Number.isInteger(responseCount) || responseCount < 0 || responseCount % 2 !== 0) {
  throw new Error("response-count must be a non-negative even integer");
}

const sourceSession = readJson(path.join(sourceDir, "session.json"));
let session = LOOP.createSession(sourceSession.seed, sourceSession.maxCycles);
fs.mkdirSync(targetDir, { recursive: true });

for (let index = 1; index <= responseCount; index += 1) {
  const request = LOOP.getPendingRequest(session);
  const response = readJson(path.join(sourceDir, `${index}-response.json`));
  const appliedResponse = stripLegacyRejectedHypothesis(response);
  writeJson(path.join(targetDir, `${index}-request.json`), request);
  writeJson(path.join(targetDir, `${index}-response.json`), response);
  if (appliedResponse !== response) writeJson(path.join(targetDir, `${index}-applied-response.json`), appliedResponse);
  session = request.type === "decision"
    ? LOOP.applyDecisionResponse(session, appliedResponse)
    : LOOP.applyAttributionResponse(session, appliedResponse);
}

writeJson(path.join(targetDir, "session.json"), session);
writeJson(path.join(targetDir, "PREFIX_REPLAY.json"), {
  sourceDir,
  responseCount,
  completedCycles: session.cycle,
  phase: session.phase,
  seed: session.seed,
  nextRequest: LOOP.getPendingRequest(session),
  note: "Recorded API responses were replayed only to reconstruct the deterministic prefix. New decisions begin after this checkpoint.",
});
process.stdout.write(`${JSON.stringify({ completedCycles: session.cycle, phase: session.phase, targetDir }, null, 2)}\n`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function stripLegacyRejectedHypothesis(response) {
  if (!response?.hypothesis || response.hypothesis.verificationScope) return response;
  const kinds = new Set((response.reasoningChain || []).map((row) => row.kind));
  const wouldHaveBeenValid = kinds.has("goal")
    && (kinds.has("knowledge") || kinds.has("evidence"))
    && kinds.has("affordance")
    && kinds.has("comparison")
    && kinds.has("hypothesis")
    && (response.alternatives || []).length >= 1;
  if (wouldHaveBeenValid) {
    throw new Error(`legacy hypothesis requires an explicit migration instead of replay stripping: ${response.hypothesis.id}`);
  }
  return { ...response, hypothesis: null };
}
