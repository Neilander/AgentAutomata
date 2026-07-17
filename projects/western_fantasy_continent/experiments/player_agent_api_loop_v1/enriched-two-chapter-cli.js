const fs = require("node:fs");
const path = require("node:path");
const RUNNER = require("./enriched-two-chapter-run");

const [, , command, runPathInput, firstInput, secondInput, thirdInput] = process.argv;
if (!command || !runPathInput) usage();
const runPath = path.resolve(runPathInput);

if (command === "init") {
  const seed = firstInput || "enriched-two-chapter";
  const profileId = secondInput || "open_novice";
  const perceptionProfile = thirdInput || "ordinary";
  writeJson(runPath, RUNNER.createRun({ seed, profileId, perceptionProfile }));
  print(RUNNER.status(readJson(runPath)));
} else if (command === "request") {
  const run = readJson(runPath);
  const request = RUNNER.getPendingRequest(run);
  const archivePath = artifactPath(runPath, request, "request");
  writeJson(archivePath, request);
  if (firstInput) writeJson(path.resolve(firstInput), request);
  else print({ requestPath: archivePath, request });
} else if (command === "decision" || command === "attribution") {
  if (!firstInput) usage();
  const run = readJson(runPath);
  const response = readJson(path.resolve(firstInput));
  const request = RUNNER.getPendingRequest(run);
  if (request.type !== command) throw new Error(`expected ${command} request, got ${request.type}`);
  writeJson(artifactPath(runPath, request, "response"), response);
  const next = command === "decision"
    ? RUNNER.applyDecisionResponse(run, response)
    : RUNNER.applyAttributionResponse(run, response);
  writeJson(runPath, next);
  print(RUNNER.status(next));
} else if (command === "advance") {
  const next = RUNNER.advanceToChapter2(readJson(runPath));
  writeJson(runPath, next);
  print(RUNNER.status(next));
} else if (command === "status") {
  print(RUNNER.status(readJson(runPath)));
} else if (command === "summary") {
  const summary = RUNNER.summarize(readJson(runPath));
  if (firstInput) writeJson(path.resolve(firstInput), summary);
  else print(summary);
} else {
  usage();
}

function artifactPath(sessionPath, request, kind) {
  const run = readJson(sessionPath);
  const chapter = run.activeChapter;
  const type = request.type || "unknown";
  const cycle = String(request.cycle || (chapter === 2 ? run.chapter2?.cycle + 1 : run.chapter1?.cycle + 1) || 0).padStart(3, "0");
  return path.join(path.dirname(sessionPath), "artifacts", `chapter-${chapter}-${type}-${cycle}-${kind}.json`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage() {
  throw new Error("usage: node enriched-two-chapter-cli.js <init|request|decision|attribution|advance|status|summary> <session.json> [seed|response.json|output.json] [profileId] [perceptionProfile]");
}
