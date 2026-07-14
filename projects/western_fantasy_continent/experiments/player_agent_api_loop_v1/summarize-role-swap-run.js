const fs = require("node:fs");
const path = require("node:path");

const sessionArg = process.argv[2];
const sessionPath = sessionArg ? path.resolve(sessionArg) : "";
if (!sessionPath || !fs.existsSync(sessionPath) || !fs.statSync(sessionPath).isFile()) {
  throw new Error("usage: node summarize-role-swap-run.js <session.json>");
}

const runDir = path.dirname(sessionPath);
const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
const history = session.history || [];
const emotions = history.flatMap((row) => [
  Number(row.emotionBeforeDecision),
  Number(row.emotionAfterDecision),
  Number(row.emotionAfterEvents),
]).filter(Number.isFinite);
const trajectory = history.map((row) => ({
  cycle: row.cycle,
  action: row.action,
  outcome: row.outcome,
  beforeDecision: row.emotionBeforeDecision,
  afterDecision: row.emotionAfterDecision,
  afterEvents: row.emotionAfterEvents,
  automaticDelta: row.automaticEmotionDelta,
}));
const unlocks = history.flatMap((row) => (row.eventLog || [])
  .filter((event) => event.type === "character_unlock")
  .map((event) => ({ cycle: row.cycle, heroId: event.result?.heroId, character: event.result?.character })));
const swaps = history.filter((row) => row.action?.startsWith("swap:")).map((row) => ({
  cycle: row.cycle,
  action: row.action,
  reasoningChain: row.decisionResponse?.reasoningChain || [],
  alternatives: row.decisionResponse?.alternatives || [],
  hypothesis: row.decisionResponse?.hypothesis || null,
}));
const combatProofs = history.flatMap((row) => (row.eventLog || [])
  .filter((event) => event.type === "team_experiment_result")
  .map((event) => ({ cycle: row.cycle, ...event.result })));
const decisionRequests = fs.readdirSync(runDir).filter((name) => /^decision-\d+-request\.json$/.test(name)).sort();
const boundaryLeaks = decisionRequests.flatMap((name) => auditRequest(name, JSON.parse(fs.readFileSync(path.join(runDir, name), "utf8"))));
const automaticDeltas = trajectory.map((row) => Number(row.automaticDelta)).filter(Number.isFinite);
const audit = {
  schema: "role_swap_iteration_audit_v1",
  runDir,
  seed: session.seed,
  phase: session.phase,
  completedCycles: session.cycle,
  recordedActions: history.length,
  finalTeam: session.gameState?.teamSlots || [],
  clearedNodes: Object.entries(session.gameState?.cleared || {}).filter(([, value]) => value).map(([id]) => id),
  unlocks,
  swaps,
  combatProofs,
  privateEvaluator: session.evaluatorState || null,
  playerExperimentState: session.cognitionState?.affordanceExperiments || [],
  playerHypotheses: session.cognitionState?.hypotheses || [],
  knowledgeCount: session.knowledgeBase?.length || 0,
  knowledgeAddedByCycle: history.map((row) => ({
    cycle: row.cycle,
    added: row.learningDelta?.addedKnowledge?.length || 0,
    matchedConcepts: row.learningDelta?.matchedConcepts?.map((concept) => concept.label) || [],
  })),
  emotion: {
    initial: emotions[0] ?? null,
    final: emotions.at(-1) ?? null,
    minimum: emotions.length ? Math.min(...emotions) : null,
    maximum: emotions.length ? Math.max(...emotions) : null,
    largestAutomaticDrop: automaticDeltas.length ? Math.min(0, ...automaticDeltas) : null,
    largestAutomaticGain: automaticDeltas.length ? Math.max(0, ...automaticDeltas) : null,
    trajectory,
  },
  informationBoundary: {
    checkedRequestCount: decisionRequests.length,
    leaks: boundaryLeaks,
    pass: boundaryLeaks.length === 0,
  },
};

fs.writeFileSync(path.join(runDir, "ROLE_SWAP_AUDIT.json"), `${JSON.stringify(audit, null, 2)}\n`);
fs.writeFileSync(path.join(runDir, "ROLE_SWAP_AUDIT.md"), `${toMarkdown(audit)}\n`);
process.stdout.write(`${JSON.stringify({
  phase: audit.phase,
  completedCycles: audit.completedCycles,
  swaps: audit.swaps.map((row) => row.action),
  unlocks: audit.unlocks,
  minimumEmotion: audit.emotion.minimum,
  largestAutomaticDrop: audit.emotion.largestAutomaticDrop,
  boundaryPass: audit.informationBoundary.pass,
}, null, 2)}\n`);

function auditRequest(name, request) {
  const leaks = [];
  if (Object.prototype.hasOwnProperty.call(request.playerState || {}, "affordanceExperiments")) leaks.push("affordanceExperiments");
  if ((request.playerState?.goals || []).some((goal) => goal.id === "discover_new_capabilities")) leaks.push("discover_new_capabilities goal");
  if ((request.playerState?.hypotheses || []).some((row) => String(row.id || "").includes("team-experiment"))) leaks.push("evaluator hypothesis");
  const text = JSON.stringify(request);
  for (const token of ["new_character_swap", "verify-team-experiment"]) {
    if (text.includes(token)) leaks.push(token);
  }
  return [...new Set(leaks)].map((leak) => ({ request: name, leak }));
}

function toMarkdown(audit) {
  const lines = [
    "# Role Swap Iteration Audit",
    "",
    `- Phase: \`${audit.phase}\``,
    `- Completed cycles: ${audit.completedCycles}`,
    `- Final team: ${audit.finalTeam.join(", ")}`,
    `- Information boundary: ${audit.informationBoundary.pass ? "PASS" : "FAIL"}`,
    `- Emotion: ${audit.emotion.initial} -> ${audit.emotion.final}; min ${audit.emotion.minimum}; largest automatic drop ${audit.emotion.largestAutomaticDrop}`,
    "",
    "## Unlocks",
    "",
    ...(audit.unlocks.length ? audit.unlocks.map((row) => `- Cycle ${row.cycle}: ${row.heroId || row.character}`) : ["- None"]),
    "",
    "## Team Changes",
    "",
    ...(audit.swaps.length ? audit.swaps.map((row) => `- Cycle ${row.cycle}: \`${row.action}\` - ${row.reasoningChain.map((step) => step.evidence).join(" | ")}`) : ["- None"]),
    "",
    "## Combat Proofs",
    "",
    ...(audit.combatProofs.length ? audit.combatProofs.map((row) => `- Cycle ${row.cycle}: ${row.heroId} at ${row.node}, ${row.outcome}, contribution ${JSON.stringify(row.contribution || {})}`) : ["- None"]),
    "",
    "## Emotion Trajectory",
    "",
    "| Cycle | Action | Outcome | Before | After decision | After events | Automatic delta |",
    "|---:|---|---|---:|---:|---:|---:|",
    ...audit.emotion.trajectory.map((row) => `| ${row.cycle} | \`${row.action}\` | ${row.outcome} | ${row.beforeDecision} | ${row.afterDecision} | ${row.afterEvents} | ${row.automaticDelta} |`),
  ];
  if (!audit.informationBoundary.pass) {
    lines.push("", "## Boundary Leaks", "", ...audit.informationBoundary.leaks.map((row) => `- ${row.request}: ${row.leak}`));
  }
  return lines.join("\n");
}
