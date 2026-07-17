const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const APPLY = process.argv.includes("--apply");
const BASE = path.resolve(__dirname);
const PROJECT_ROOT = path.resolve(BASE, "..", "..");
const ARCHIVE_ROOT = path.resolve(PROJECT_ROOT, ".local_run_archive", "player_agent_api_loop_v1");
const MANIFEST_PATH = path.join(ARCHIVE_ROOT, "archive-manifest.json");
const FIXTURE_PATH = path.join(BASE, "fixtures", "battle-information-real-event-log.json");

const KEEP_FULL_SESSION = new Set([
  normalize("causal_verification_v9_concept_interpreter/session.json"),
  normalize("real_main7_run_2026-07-13_170746/session.json"),
  normalize("chapter2_iterations/2026-07-14_2230/player_e/session.json"),
]);

assertInside(PROJECT_ROOT, BASE);
assertInside(PROJECT_ROOT, ARCHIVE_ROOT);

const files = walkFiles(BASE);
const transcriptFiles = files.filter((filePath) => (
  filePath.toLowerCase().endsWith(".json")
  && /(request|response)/i.test(path.basename(filePath))
));
const sessionFiles = files.filter((filePath) => path.basename(filePath) === "session.json");
const sessionsToSlim = sessionFiles.filter((filePath) => (
  !KEEP_FULL_SESSION.has(normalize(path.relative(BASE, filePath)))
));

const plan = {
  schema: "local_player_agent_archive_plan_v1",
  mode: APPLY ? "apply" : "dry_run",
  archiveRoot: ARCHIVE_ROOT,
  transcriptFiles: transcriptFiles.length,
  transcriptBytes: sumBytes(transcriptFiles),
  sessionFiles: sessionFiles.length,
  sessionsToSlim: sessionsToSlim.length,
  sessionsKeptFull: sessionFiles.length - sessionsToSlim.length,
  sessionBytesBefore: sumBytes(sessionFiles),
};

if (!APPLY) {
  process.stdout.write(`${JSON.stringify({
    ...plan,
    transcriptMB: mb(plan.transcriptBytes),
    sessionMB: mb(plan.sessionBytesBefore),
    note: "dry run only; rerun with --apply after reviewing the plan",
  }, null, 2)}\n`);
  process.exit(0);
}

fs.mkdirSync(ARCHIVE_ROOT, { recursive: true });
if (fs.existsSync(MANIFEST_PATH)) {
  throw new Error(`archive manifest already exists: ${MANIFEST_PATH}`);
}

const fixture = extractBattleFixture(sessionFiles);
if (fixture) {
  fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
  fs.writeFileSync(FIXTURE_PATH, `${JSON.stringify(fixture, null, 2)}\n`);
}

const movedTranscripts = [];
for (const sourcePath of transcriptFiles) {
  const destinationPath = archivePathFor(sourcePath);
  movePreserving(sourcePath, destinationPath);
  movedTranscripts.push(archiveRecord(sourcePath, destinationPath));
}

const slimSessions = [];
for (const sourcePath of sessionsToSlim) {
  const originalBytes = fs.statSync(sourcePath).size;
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const session = JSON.parse(sourceText);
  const destinationPath = archivePathFor(sourcePath);
  movePreserving(sourcePath, destinationPath);
  const slim = slimSession(session, normalize(path.relative(BASE, sourcePath)));
  const slimText = `${JSON.stringify(slim)}\n`;
  fs.writeFileSync(sourcePath, slimText);
  slimSessions.push({
    source: normalize(path.relative(PROJECT_ROOT, sourcePath)),
    archivedOriginal: normalize(path.relative(PROJECT_ROOT, destinationPath)),
    originalBytes,
    slimBytes: Buffer.byteLength(slimText),
    originalSha256: sha256(sourceText),
    slimSha256: sha256(slimText),
  });
}

const manifest = {
  ...plan,
  completedAt: new Date().toISOString(),
  fixture: fixture ? normalize(path.relative(PROJECT_ROOT, FIXTURE_PATH)) : null,
  movedTranscripts,
  slimSessions,
  totals: {
    movedTranscriptBytes: movedTranscripts.reduce((sum, row) => sum + row.bytes, 0),
    originalSessionBytes: slimSessions.reduce((sum, row) => sum + row.originalBytes, 0),
    slimSessionBytes: slimSessions.reduce((sum, row) => sum + row.slimBytes, 0),
  },
};
fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

process.stdout.write(`${JSON.stringify({
  result: "PASS",
  archiveRoot: ARCHIVE_ROOT,
  movedTranscriptFiles: movedTranscripts.length,
  movedTranscriptMB: mb(manifest.totals.movedTranscriptBytes),
  slimmedSessions: slimSessions.length,
  sessionsBeforeMB: mb(manifest.totals.originalSessionBytes),
  sessionsAfterMB: mb(manifest.totals.slimSessionBytes),
  sessionReductionPercent: round(
    100 * (1 - manifest.totals.slimSessionBytes / Math.max(1, manifest.totals.originalSessionBytes)),
  ),
  keptFullSessions: [...KEEP_FULL_SESSION],
  fixture: manifest.fixture,
  manifest: MANIFEST_PATH,
}, null, 2)}\n`);

function slimSession(session, sourceRelativePath) {
  const slim = structuredClone(session);
  const chapters = slim.chapter1 || slim.chapter2
    ? [slim.chapter1, slim.chapter2].filter(Boolean)
    : [slim];
  for (const chapter of chapters) {
    for (const row of chapter.history || []) {
      if (row.decisionRequest) {
        row.decisionSnapshot = decisionSnapshot(row.decisionRequest);
        delete row.decisionRequest;
      }
      delete row.rawEventLog;
      delete row.eventLog;
    }
    if (chapter.cognitionState) delete chapter.cognitionState.trace;
    delete chapter.apiCalls;
  }
  slim.localArchive = {
    schema: "slim_session_reference_v1",
    fullSession: normalize(path.join(
      ".local_run_archive",
      "player_agent_api_loop_v1",
      sourceRelativePath,
    )),
    removed: [
      "history[].decisionRequest",
      "history[].rawEventLog",
      "history[].eventLog",
      "cognitionState.trace",
      "apiCalls",
    ],
    retained: [
      "decisionSnapshot",
      "decisionResponse",
      "action/outcome/emotion",
      "eventTrace",
      "gameEvent",
      "conceptInterpretation",
      "learningDelta",
      "attribution",
      "final cognition/knowledge/impressions/expectations",
    ],
  };
  return slim;
}

function decisionSnapshot(request) {
  return {
    type: request.type,
    schema: request.schema,
    cycle: request.cycle,
    activeGoalId: request.playerState?.activeGoalId || null,
    teamSlots: request.observation?.teamSlots || [],
    allowedActions: request.observation?.allowedActions || [],
    visibleNodeIds: (request.observation?.visibleNodes || []).map((row) => row.id),
    retrievedKnowledgeIds: (request.playerState?.knowledge || []).map((row) => row.id),
  };
}

function extractBattleFixture(paths) {
  let selected = null;
  for (const sessionPath of paths) {
    if (!normalize(sessionPath).includes(normalize("open_novice/paired-alpha/session.json"))) continue;
    const run = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    const histories = run.chapter1 || run.chapter2
      ? [run.chapter1, run.chapter2].filter(Boolean).flatMap((chapter) => chapter.history || [])
      : run.history || [];
    for (const row of histories) {
      if (!Array.isArray(row.rawEventLog) || !row.rawEventLog.length) continue;
      if (!selected || row.rawEventLog.length > selected.rawEventLog.length) {
        selected = {
          schema: "battle_information_real_event_fixture_v1",
          sourceAction: row.action,
          sourceCycle: row.cycle,
          rawEventLog: row.rawEventLog,
        };
      }
    }
  }
  return selected;
}

function movePreserving(sourcePath, destinationPath) {
  assertInside(BASE, sourcePath);
  assertInside(ARCHIVE_ROOT, destinationPath);
  if (fs.existsSync(destinationPath)) {
    throw new Error(`archive destination already exists: ${destinationPath}`);
  }
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.renameSync(sourcePath, destinationPath);
}

function archivePathFor(sourcePath) {
  return path.join(ARCHIVE_ROOT, path.relative(BASE, sourcePath));
}

function archiveRecord(sourcePath, destinationPath) {
  const bytes = fs.statSync(destinationPath).size;
  return {
    source: normalize(path.relative(PROJECT_ROOT, sourcePath)),
    archivedAt: normalize(path.relative(PROJECT_ROOT, destinationPath)),
    bytes,
    sha256: sha256(fs.readFileSync(destinationPath)),
  };
}

function walkFiles(root, output = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) walkFiles(filePath, output);
    else output.push(filePath);
  }
  return output;
}

function assertInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`path escapes intended root: ${target}`);
  }
}

function sumBytes(paths) {
  return paths.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalize(value) {
  return String(value).replace(/\\/g, "/");
}

function mb(bytes) {
  return round(bytes / (1024 * 1024));
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}
