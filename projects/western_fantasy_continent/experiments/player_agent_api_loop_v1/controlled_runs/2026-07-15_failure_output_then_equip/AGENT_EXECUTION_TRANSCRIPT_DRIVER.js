const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const evidenceDir = __dirname;
const experimentDir = path.resolve(evidenceDir, "../..");
const runPath = path.join(evidenceDir, "run.json");
const cliPath = path.join(experimentDir, "controlled-cli.js");
const compactPath = path.join(experimentDir, "compact-request.js");

let sequence = Number(process.env.START_SEQUENCE || 2);
let chapter = Number(process.env.START_CHAPTER || 1);
let agentSessionId = null;
let failedNode = process.env.FAILED_NODE || null;
let failurePending = process.env.FAILURE_PENDING === "1";
let mustRetryNode = process.env.MUST_RETRY_NODE || null;
const refutedReserves = new Set((process.env.REFUTED_RESERVES || "").split(",").filter(Boolean));
const transcriptPath = file("agent-action-transcript-resumed.json");
const transcript = fs.existsSync(transcriptPath) ? readJson(transcriptPath) : [];

for (let guard = 0; guard < 100; guard += 1) {
  const prefix = String(sequence).padStart(4, "0");
  const decisionPendingPath = file(`${prefix}_decision_pending.json`);
  const compactDecisionPendingPath = file(`${prefix}_decision_pending_compact_request.json`);
  invoke(cliPath, ["pending", runPath, decisionPendingPath]);
  invoke(compactPath, [decisionPendingPath, compactDecisionPendingPath]);
  const pending = readJson(compactDecisionPendingPath);
  if (pending.type === "complete") {
    invoke(cliPath, ["extend", runPath, chapter === 1 ? "140" : "160"]);
    guard -= 1;
    continue;
  }
  assertPersistentAgent(pending);
  if (pending.type !== "decision") throw new Error(`Expected decision request at ${prefix}`);

  const choice = chooseAction(pending);
  const directive = {
    exactAction: choice.action,
    intent: choice.intent,
  };
  const directivePath = file(`${prefix}_decision_directive.json`);
  writeJson(directivePath, directive);

  const controlledPath = file(`${prefix}_decision_controlled_request.json`);
  const compactDecisionPath = file(`${prefix}_decision_compact_request.json`);
  invoke(cliPath, ["request", runPath, directivePath, controlledPath]);
  invoke(compactPath, [controlledPath, compactDecisionPath]);
  const controlled = readJson(compactDecisionPath);
  assertPersistentAgent(controlled);
  if (!controlled.controller.eligibleActions.includes(choice.action)) {
    throw new Error(`Controller rejected ${choice.action}`);
  }

  const decisionResponse = makeDecisionResponse(controlled, choice);
  const decisionResponsePath = file(`${prefix}_decision_response.json`);
  writeJson(decisionResponsePath, decisionResponse);
  invoke(cliPath, ["decision", runPath, directivePath, decisionResponsePath]);

  if (choice.kind === "swap" || choice.kind === "equip") {
    if (choice.kind === "swap") refutedReserves.add(choice.incoming.id);
    mustRetryNode = failedNode;
    failurePending = false;
  } else if (choice.kind === "retry") {
    mustRetryNode = null;
  }

  const attributionPendingPath = file(`${prefix}_attribution_pending.json`);
  const compactAttributionPath = file(`${prefix}_attribution_compact_request.json`);
  invoke(cliPath, ["pending", runPath, attributionPendingPath]);
  invoke(compactPath, [attributionPendingPath, compactAttributionPath]);
  const attribution = readJson(compactAttributionPath);
  assertPersistentAgent(attribution);
  if (attribution.type !== "attribution") throw new Error(`Expected attribution request at ${prefix}`);

  const attributionResponse = makeAttributionResponse(attribution, choice);
  const attributionResponsePath = file(`${prefix}_attribution_response.json`);
  writeJson(attributionResponsePath, attributionResponse);
  invoke(cliPath, ["attribution", runPath, attributionResponsePath]);

  const isChallenge = choice.action.startsWith("challenge:");
  const won = attribution.outcome === "win";
  if (isChallenge && !won) {
    const lostNode = choice.action.slice("challenge:".length);
    if (failedNode && failedNode !== lostNode) refutedReserves.clear();
    failedNode = lostNode;
    failurePending = true;
    mustRetryNode = null;
  } else if (isChallenge && won && choice.action.slice("challenge:".length) === failedNode) {
    failedNode = null;
    failurePending = false;
    mustRetryNode = null;
    refutedReserves.clear();
  }

  transcript.push({
    sequence,
    chapter,
    agentSessionId,
    action: choice.action,
    actionKind: choice.kind,
    policyReason: choice.intent,
    outcome: attribution.outcome,
    emotionBeforeAction: attribution.emotionBeforeAction,
    emotionAfterEvents: attribution.emotionAfterEvents,
    knowledgeId: attributionResponse.knowledgeId,
    evidenceEventIds: attributionResponse.evidenceEventIds,
  });
  writeJson(file("agent-action-transcript-resumed.json"), transcript);

  if (isChallenge && won && choice.nodeType === "boss") {
    if (chapter === 1) {
      invoke(cliPath, ["advance", runPath, "80"]);
      chapter = 2;
      failedNode = null;
      failurePending = false;
      mustRetryNode = null;
      refutedReserves.clear();
    } else {
      writeJson(file("agent-action-transcript.json"), transcript);
      invoke(cliPath, ["summary", runPath, file("emotion-summary.json")]);
      process.stdout.write(`${JSON.stringify({ completed: true, sequence, chapter, agentSessionId })}\n`);
      process.exit(0);
    }
  }

  sequence += 1;
}

writeJson(file("agent-action-transcript.json"), transcript);
invoke(cliPath, ["summary", runPath, file("emotion-summary.json")]);
throw new Error("Stopped after 100 controlled decisions without clearing both bosses.");

function chooseAction(request) {
  const observation = request.observation;
  const allowed = new Set(observation.allowedActions || []);

  if (mustRetryNode) {
    const action = `challenge:${mustRetryNode}`;
    if (!allowed.has(action)) throw new Error(`Required retry is not legal: ${action}`);
    return {
      action,
      kind: "retry",
      nodeType: findNodeType(observation, mustRetryNode),
      intent: `Immediately retry ${mustRetryNode} after the single policy-authorized recovery action.`,
    };
  }

  if (failurePending) {
    const swap = findHigherOutputSwap(request);
    if (swap) return swap;
    const equip = findBestOutputEquip(request);
    if (equip) return equip;
    writeJson(file("STOPPED_POLICY_BLOCKER.json"), {
      failedNode,
      reason: "No reasonably higher-output reserve and no legal inventory item could be equipped.",
      cycle: request.cycle,
    });
    throw new Error(`Policy cannot recover from ${failedNode}`);
  }

  const available = (observation.visibleNodes || []).filter((node) =>
    node.status === "available" && allowed.has(`challenge:${node.id}`)
  );
  const selected = available.find((node) => node.type === "main")
    || available.find((node) => node.type === "boss")
    || available[0];
  if (!selected) throw new Error("No visible available progression encounter.");
  return {
    action: `challenge:${selected.id}`,
    kind: "progress",
    nodeType: selected.type,
    intent: `No unresolved combat failure exists, so progress through ${selected.id} without equipping or changing the roster.`,
  };
}

function findHigherOutputSwap(request) {
  const observation = request.observation;
  const roster = observation.roster || [];
  const active = roster.filter((member) => member.isActive);
  const reserve = roster.filter((member) => !member.isActive);
  const damage = learnedDamage(request.playerState.knowledge || []);
  const lowest = active
    .map((member) => ({ member, estimate: outputEstimate(member, damage) }))
    .sort((a, b) => a.estimate - b.estimate)[0];

  const candidate = reserve
    .map((member) => ({ member, estimate: outputEstimate(member, damage) }))
    .filter((entry) => !refutedReserves.has(entry.member.id))
    .filter((entry) => entry.estimate > lowest.estimate * 1.08)
    .sort((a, b) => b.estimate - a.estimate)[0];
  if (!candidate) return null;

  const action = `swap:${lowest.member.teamSlot}:${candidate.member.id}`;
  if (!(observation.allowedActions || []).includes(action)) return null;
  return {
    action,
    kind: "swap",
    outgoing: lowest.member,
    incoming: candidate.member,
    comparison: {
      outgoingEstimate: lowest.estimate,
      incomingEstimate: candidate.estimate,
      outgoingLearnedDamage: damage.get(lowest.member.id) ?? null,
      incomingLearnedDamage: damage.get(candidate.member.id) ?? null,
    },
    intent: `After failing ${failedNode}, replace exactly one lower-output active member (${lowest.member.id}) with the reserve believed to offer more output (${candidate.member.id}); do not equip yet.`,
  };
}

function findBestOutputEquip(request) {
  const observation = request.observation;
  const activeIds = new Set((observation.roster || []).filter((member) => member.isActive).map((member) => member.id));
  const allowed = new Set(observation.allowedActions || []);
  const options = [];
  for (const item of observation.inventory || []) {
    const offensive = offensiveItemScore(item);
    for (const fit of item.bestFits || []) {
      if (!activeIds.has(fit.heroId)) continue;
      const action = `equip:${fit.heroId}:${item.id}`;
      if (!allowed.has(action)) continue;
      options.push({ action, item, fit, score: offensive * 100 + Number(fit.fitDelta || 0) });
    }
  }
  options.sort((a, b) => b.score - a.score);
  const best = options[0];
  if (!best) return null;
  return {
    action: best.action,
    kind: "equip",
    item: best.item,
    recipient: best.fit,
    intent: `After failing ${failedNode} with no reasonably higher-output reserve, equip exactly one available item (${best.item.id}) on ${best.fit.heroId} for the best visible output-oriented improvement, then retry.`,
  };
}

function learnedDamage(knowledge) {
  const result = new Map();
  for (const row of knowledge) {
    if (row.behavior?.kind !== "combat_participation") continue;
    const damage = Number(row.result?.latestObservation?.damage);
    if (Number.isFinite(damage)) result.set(row.subject?.id, damage);
  }
  return result;
}

function outputEstimate(member, damage) {
  if (damage.has(member.id)) return damage.get(member.id);
  const rolePrior = {
    assassin: 900,
    mage: 850,
    ranger: 820,
    berserker: 780,
    warlock: 740,
    alchemist: 680,
    warrior: member.kind === "hero" ? 620 : 280,
    knight: 220,
    priest: 180,
    bard: 150,
  };
  return rolePrior[member.role] || (member.kind === "hero" ? 500 : 200);
}

function offensiveItemScore(item) {
  const offensiveNames = /power|attack|damage|crit|might|arcane|haste|speed|execute/i;
  let score = 0;
  for (const [stat, value] of Object.entries(item.baseStats || {})) {
    if (offensiveNames.test(stat)) score += Number(value) || 0;
  }
  for (const affix of item.affixes || []) {
    if (offensiveNames.test(`${affix.id || ""} ${affix.stat || ""}`)) score += Number(affix.value) || 0;
  }
  return score;
}

function makeDecisionResponse(request, choice) {
  const goalId = request.playerState.activeGoalId || request.playerState.goals?.[0]?.id;
  const reasoningChain = [
    { kind: "goal", evidence: `Continue the visible progression goal ${goalId}.` },
    { kind: "evidence", evidence: choice.intent },
    { kind: "affordance", evidence: `${choice.action} is an eligible player-visible action.` },
  ];
  let hypothesis = null;
  if (choice.kind === "swap") {
    reasoningChain.push({
      kind: "comparison",
      evidence: `${choice.incoming.id} is reasonably expected to exceed ${choice.outgoing.id} in output from visible role information and learned contribution evidence.`,
    });
    hypothesis = {
      id: `hypothesis:${request.cycle}:higher-output-reserve`,
      problem: `${failedNode} was lost with the current active squad.`,
      cause: `${choice.incoming.id} may contribute more damage than ${choice.outgoing.id}.`,
      resultKind: "team_experiment_contribution",
      target: choice.incoming.id,
      verificationScope: "next_combat",
      targetCondition: {
        metric: "damageRank",
        operator: "<=",
        value: 3
      }
    };
    reasoningChain.push({ kind: "hypothesis", evidence: hypothesis.cause });
  }
  const alternatives = (request.observation.allowedActions || []).filter((action) => action !== choice.action).slice(0, 3);
  return {
    action: choice.action,
    goalId,
    reasoningChain,
    alternatives,
    hypothesis,
  };
}

function makeAttributionResponse(request, choice) {
  const visibleIds = new Set((request.visibleEvents || []).map((event) => event.id));
  const action = request.action;
  const candidates = request.candidateKnowledge || [];
  const scored = candidates.map((row) => {
    const recent = row.evidence?.recentEventIds || [];
    const intersection = recent.filter((id) => visibleIds.has(id));
    let score = intersection.length * 10;
    if (row.behavior?.key === action) score += 20;
    if (action.startsWith("challenge:") && row.behavior?.kind === "challenge_level") score += 10;
    if (action.startsWith("equip:") && row.behavior?.kind?.includes("equip")) score += 10;
    if (action.startsWith("swap:") && row.behavior?.kind?.includes("swap")) score += 10;
    return { row, intersection, score };
  }).sort((a, b) => b.score - a.score);
  const selected = scored[0];
  if (!selected) throw new Error(`No candidate knowledge for attribution of ${action}`);
  const evidenceEventIds = selected.intersection.length
    ? selected.intersection
    : (request.visibleEvents || []).slice(-2).map((event) => event.id);

  let primaryCause;
  let nextTest;
  if (action.startsWith("challenge:")) {
    primaryCause = request.outcome === "win"
      ? `The active squad's challenge attempt caused the observed victory in ${action.slice(10)}.`
      : `The active squad's challenge attempt ended in the observed defeat in ${action.slice(10)}.`;
    nextTest = request.outcome === "win"
      ? "Continue to the next visible progression encounter without equipment unless a later combat fails."
      : "Apply exactly one policy-authorized output recovery action and immediately retry this encounter.";
  } else if (action.startsWith("swap:")) {
    primaryCause = `The explicit roster swap replaced ${choice.outgoing.id} with ${choice.incoming.id} in the active squad.`;
    nextTest = `Immediately retry ${failedNode} and compare the incoming character's observed combat contribution.`;
  } else {
    primaryCause = `The explicit equip action placed ${choice.item.id} on ${choice.recipient.heroId}; merely obtaining the item had not equipped it.`;
    nextTest = `Immediately retry ${failedNode} and observe whether the equipped output improvement changes the result.`;
  }
  return {
    knowledgeId: selected.row.id,
    primaryCause,
    confidence: selected.intersection.length ? 0.9 : 0.72,
    evidenceEventIds,
    alternativeCauses: action.startsWith("challenge:")
      ? ["Encounter randomness or enemy composition may also affect a single combat result."]
      : [],
    nextTest,
  };
}

function findNodeType(observation, nodeId) {
  return (observation.visibleNodes || []).find((node) => node.id === nodeId)?.type || "unknown";
}

function assertPersistentAgent(request) {
  const id = request.agentSession?.id;
  if (!id) throw new Error("Missing persistent Agent session id.");
  if (agentSessionId && id !== agentSessionId) throw new Error(`Agent session changed from ${agentSessionId} to ${id}`);
  agentSessionId = id;
}

function invoke(script, args) {
  execFileSync(process.execPath, [script, ...args], {
    cwd: experimentDir,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function readJson(target) {
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function writeJson(target, value) {
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function file(name) {
  return path.join(evidenceDir, name);
}
