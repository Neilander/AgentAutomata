const fs = require("fs");
const CORE = require("../map_progression_lab/map-progression-cognition-core");
const BATCH = require("./analyze-map-cognition-batch");
const FEEDBACK = require("./feedback-cognition-model");

const PROFILES = {
  tolerant: { initialValue: 42, decayPer5s: 3 },
  baseline: { initialValue: 38, decayPer5s: 4.5 },
  strict: { initialValue: 38, decayPer5s: 6 },
};

function createSession(seed = "feedback-player", profile = "baseline", overrides = {}) {
  const config = FEEDBACK.normalizeConfig({ ...(PROFILES[profile] || PROFILES.baseline), ...overrides });
  const gameState = CORE.initialState(seed);
  return {
    schema: "map_feedback_session_v1",
    seed,
    profile,
    config,
    gameState,
    feedbackState: FEEDBACK.createState(config, seed),
    cognitionEmotionLog: [],
  };
}

function observeSession(session) {
  const game = CORE.observe(session.gameState);
  if (game.lastEvent?.feedbackSignals) {
    game.lastEvent = { ...game.lastEvent, feedbackSignalCount: game.lastEvent.feedbackSignals.length };
    delete game.lastEvent.feedbackSignals;
  }
  return {
    game,
    feedback: FEEDBACK.diagnostics(session.feedbackState, session.config),
  };
}

function applySessionAction(sessionInput, action) {
  const session = structuredClone(sessionInput);
  const before = observeSession(session);
  if (!before.game.allowedActions.includes(action)) return { ok: false, session, error: `Action not allowed: ${action}`, observation: before };

  const decisionStart = session.feedbackState.gameTime;
  const decisionDuration = decisionDurationFor(action, before.game);
  const decisionKey = decisionEventKey(action, before.game, session.gameState);
  FEEDBACK.advanceTo(session.feedbackState, decisionStart + decisionDuration * 0.45, session.config, { phase: "world_decision", action });
  if (decisionKey) FEEDBACK.triggerEvent(session.feedbackState, decisionKey, { time: session.feedbackState.gameTime, metadata: { action } }, session.config);
  const visibleNode = before.game.visibleNodes.find((node) => action === `challenge:${node.id}`);
  const expectationKey = visibleNode?.rewardHint?.includes("可能出现蓝装") ? `blue_drop:${visibleNode.id}:${session.gameState.step + 1}` : null;
  if (expectationKey) {
    FEEDBACK.createExpectation(session.feedbackState, expectationKey, {
      time: session.feedbackState.gameTime,
      strength: 0.4,
      expectedEvent: "loot:rare_equipment",
      metadata: { node: visibleNode.id, rewardHint: visibleNode.rewardHint },
    }, session.config);
  }
  FEEDBACK.advanceTo(session.feedbackState, decisionStart + decisionDuration, session.config, { phase: "world_decision", action });

  const result = CORE.applyAction(session.gameState, action);
  if (!result.ok) return { ok: false, session, error: result.error, observation: observeSession(session) };
  session.gameState = result.state;
  const combatStart = session.feedbackState.gameTime;
  const event = result.event;
  for (const signal of [...(event.feedbackSignals || [])].sort((a, b) => a.time - b.time)) {
    const eventKey = signal.type === "enemy_kill" ? killEventKey(event.node) : `cast:${signal.skillKey}`;
    FEEDBACK.triggerEvent(session.feedbackState, eventKey, {
      time: combatStart + Math.max(0, signal.time || 0),
      metadata: signal,
      context: { phase: "combat", node: event.node },
    }, session.config);
  }
  const actionEnd = combatStart + Math.max(0, Number(event.duration) || nonCombatDuration(action));
  FEEDBACK.advanceTo(session.feedbackState, actionEnd, session.config, { phase: "action_end", action });
  if (expectationKey && event.outcome === "win") {
    const fulfilled = (event.loot || []).some((item) => item.rarity && item.rarity !== "common");
    FEEDBACK.resolveExpectation(session.feedbackState, expectationKey, fulfilled, { time: actionEnd, metadata: { node: event.node } }, session.config);
  }

  if (event.outcome === "win") applySuccessEvents(session, before.game, result.observation, event);
  else if (event.outcome === "loss") applyFailureEvent(session, before.game, event);
  else if (event.outcome === "team_changed") {
    FEEDBACK.triggerEvent(session.feedbackState, "decision:change_team", { time: session.feedbackState.gameTime, metadata: { action } }, session.config);
  }

  const after = observeSession(session);
  const cognitionDelta = diffCognition(before.game.cognition, after.game.cognition);
  const logEntry = {
    step: session.gameState.step,
    action,
    outcome: event.outcome,
    node: event.node || null,
    gameTime: after.feedback.gameTime,
    feedbackBefore: before.feedback.value,
    feedbackAfter: after.feedback.value,
    emotionBefore: before.feedback.emotion,
    emotionAfter: after.feedback.emotion,
    cognitionDelta,
    localFailureCount: event.node ? session.feedbackState.localFailures[event.node] || 0 : 0,
    preAbandonEmotion: event.outcome === "loss" && session.feedbackState.lastAbandonDecision?.failedObject === event.node
      ? session.feedbackState.lastAbandonDecision.preAbandonEmotion
      : null,
    abandonProbability: event.outcome === "loss" && session.feedbackState.lastAbandonDecision?.failedObject === event.node
      ? Math.round(session.feedbackState.lastAbandonDecision.probability * 1000) / 1000
      : null,
    abandonRoll: event.outcome === "loss" && session.feedbackState.lastAbandonDecision?.failedObject === event.node
      ? Math.round(session.feedbackState.lastAbandonDecision.roll * 1000) / 1000
      : null,
    abandoned: after.feedback.abandoned,
  };
  session.cognitionEmotionLog.push(logEntry);
  return { ok: true, session, event, observation: after, transition: logEntry };
}

function applySuccessEvents(session, beforeObservation, afterObservation, event) {
  const now = session.feedbackState.gameTime;
  FEEDBACK.resolveFailure(session.feedbackState, event.node, { time: now }, session.config);
  const itemCountBefore = ownedItemCountFromObservation(beforeObservation);
  for (const item of event.loot || []) {
    const rare = item.rarity && item.rarity !== "common";
    const desire = equipmentDesire(itemCountBefore, event.gearAfter - event.gearBefore, rare);
    FEEDBACK.triggerEvent(session.feedbackState, rare ? "loot:rare_equipment" : "loot:equipment", {
      time: now,
      desireMultiplier: desire,
      metadata: { item: item.name, rarity: item.rarity },
    }, session.config);
  }
  const gearDelta = Math.max(0, (event.gearAfter || event.gearBefore || 0) - (event.gearBefore || 0));
  if (gearDelta > 0) {
    FEEDBACK.triggerEvent(session.feedbackState, "equip:power_upgrade", {
      time: now,
      desireMultiplier: Math.min(1.4, 0.55 + gearDelta / 220),
      magnitudeMultiplier: Math.min(1.8, 0.75 + gearDelta / 180),
      metadata: { gearDelta },
    }, session.config);
  }

  if ((event.survivors?.player || 0) <= 2) {
    FEEDBACK.triggerEvent(session.feedbackState, "survive:danger_window", {
      time: now,
      magnitudeMultiplier: event.survivors?.player === 1 ? 1.25 : 1,
      metadata: { node: event.node, survivors: event.survivors?.player || 0 },
    }, session.config);
  }
  if (event.teamExperiment) FEEDBACK.triggerEvent(session.feedbackState, "verify:team_change", { time: now, metadata: event.teamExperiment }, session.config);
  if (event.roleProof) FEEDBACK.triggerEvent(session.feedbackState, "proof:role_contribution", { time: now, metadata: event.roleProof }, session.config);

  const item = CORE.nodes.find((node) => node.id === event.node);
  if (item) {
    const clearKey = item.type === "boss" ? "clear:boss" : item.type === "branch" ? "clear:side_branch" : "clear:main_level";
    FEEDBACK.triggerEvent(session.feedbackState, clearKey, {
      time: now,
      desireMultiplier: event.firstClear ? 1 : 0.3,
      metadata: { node: event.node, firstClear: event.firstClear },
    }, session.config);
  }
  if (event.reward?.includes("游侠")) FEEDBACK.triggerEvent(session.feedbackState, "unlock:character", { time: now, metadata: { reward: event.reward } }, session.config);

  const beforeNodes = new Map(beforeObservation.visibleNodes.map((node) => [node.id, node.status]));
  for (const node of afterObservation.visibleNodes) {
    if (beforeNodes.has(node.id) || !["available", "repeatable"].includes(node.status)) continue;
    FEEDBACK.triggerEvent(session.feedbackState, discoveryEventKey(node), { time: now, metadata: { node: node.id, type: node.type } }, session.config);
  }
}

function applyFailureEvent(session, beforeObservation, event) {
  const relatedEvents = relatedEventsForFailure(session, beforeObservation, event);
  const attribution = event.failureMemory?.attributionPrompt || "使用当前已知概念解释失败";
  FEEDBACK.recordFailure(session.feedbackState, event.node, relatedEvents, {
    time: session.feedbackState.gameTime,
    attribution,
    context: { phase: "failure", node: event.node },
  }, session.config);
}

function relatedEventsForFailure(session, observation, event) {
  const related = new Set(["kill:normal_enemy", "clear:main_level"]);
  const known = [...observation.cognition.concepts, ...observation.cognition.knowledge, ...observation.cognition.behaviors].join("|");
  if (/装备|战力|掉落/.test(known)) {
    ["loot:equipment", "loot:rare_equipment", "equip:power_upgrade", "decision:farm_after_failure"].forEach((key) => related.add(key));
  }
  if (event.node === "r1_prison" && observation.visibleNodes.some((node) => node.id === "r1_bandit")) related.add("decision:side_branch");
  if (/调整队伍|角色搭配|角色名单/.test(known)) related.add("decision:change_team");
  return [...related];
}

function runPolicy(seed = "feedback-run", profile = "baseline", policy = "explorer", maxSteps = 36, overrides = {}) {
  let session = createSession(seed, profile, overrides);
  while (session.gameState.step < maxSteps && !session.gameState.cleared.r1_boss && !session.feedbackState.abandoned) {
    const observation = observeSession(session).game;
    const action = policy === "mainline" ? BATCH.chooseMainlineAction(observation) : BATCH.chooseAction(observation, "explorer");
    if (!action) break;
    const result = applySessionAction(session, action);
    if (!result.ok) break;
    session = result.session;
  }
  return summarizeSession(session);
}

function runBatch(count = 40, profile = "baseline", policy = "explorer", overrides = {}) {
  const runs = Array.from({ length: count }, (_, index) => runPolicy(`feedback-${policy}-${index + 1}`, profile, policy, 36, overrides));
  return {
    count,
    profile,
    policy,
    completionRate: ratio(runs.filter((run) => run.completed).length, count),
    abandonmentRate: ratio(runs.filter((run) => run.feedback.abandoned).length, count),
    averageSteps: average(runs.map((run) => run.steps)),
    averageFinalFeedback: average(runs.map((run) => run.feedback.value)),
    averageMinimumFeedback: average(runs.map((run) => run.feedback.minValue)),
    averageLowFeedbackSeconds: average(runs.map((run) => run.feedback.lowFeedbackSeconds)),
    averageLongestNoGainSeconds: average(runs.map((run) => run.feedback.longestNoGainSeconds)),
    emotionCounts: countBy(runs.map((run) => run.feedback.emotion)),
    averageContributions: averageObjects(runs.map((run) => run.feedback.contributionByCategory)),
    runs,
  };
}

function summarizeSession(session) {
  return {
    seed: session.seed,
    profile: session.profile,
    completed: Boolean(session.gameState.cleared.r1_boss),
    steps: session.gameState.step,
    stoppedGoal: CORE.observe(session.gameState).currentGoal,
    feedback: FEEDBACK.diagnostics(session.feedbackState, session.config),
    cognitionEmotionLog: session.cognitionEmotionLog,
    finalCognition: CORE.observe(session.gameState).cognition,
    trace: session.feedbackState.trace,
    session,
  };
}

function decisionEventKey(action, observation, state) {
  if (action.startsWith("swap:")) return "decision:change_team";
  const nodeId = action.split(":")[1];
  const node = CORE.nodes.find((item) => item.id === nodeId);
  if (!node) return "";
  if ((state.failures[nodeId] || 0) > 0) return "decision:retry_after_failure";
  if (observation.cognition.failureMemories.some((memory) => !memory.resolved) && node.type === "main" && state.cleared[nodeId]) return "decision:farm_after_failure";
  if (node.type === "branch") return "decision:side_branch";
  if (node.id === "r1_main_1") return "decision:first_main_route";
  if (!state.cleared[node.id]) return "decision:new_main_challenge";
  return "";
}

function decisionDurationFor(action, observation) {
  if (action.startsWith("swap:")) return 4;
  const decisionCount = observation.allowedActions.length;
  return 2 + Math.min(5, Math.max(0, decisionCount - 1) * 0.8);
}

function nonCombatDuration(action) {
  return action.startsWith("swap:") ? 2 : 0;
}

function killEventKey(nodeId) {
  return nodeId === "r1_boss" ? "kill:elite_enemy" : "kill:normal_enemy";
}

function discoveryEventKey(node) {
  if (node.type === "boss") return "discover:boss";
  if (node.type === "branch") return "discover:side_branch";
  return "discover:main_node";
}

function equipmentDesire(itemCountBefore, gearDelta, rare) {
  const saturation = Math.max(0.2, 1 - itemCountBefore / 28);
  const improvement = gearDelta > 0 ? Math.min(1.4, 0.75 + gearDelta / 220) : 0.25;
  return Math.min(1.5, saturation * improvement + (rare ? 0.18 : 0));
}

function ownedItemCountFromObservation(observation) {
  return observation.gear.active.reduce((sum, unit) => sum + unit.slots, 0);
}

function diffCognition(before, after) {
  return {
    concepts: after.concepts.filter((value) => !before.concepts.includes(value)),
    knowledge: after.knowledge.filter((value) => !before.knowledge.includes(value)),
    behaviors: after.behaviors.filter((value) => !before.behaviors.includes(value)),
    failureMemoriesAdded: Math.max(0, after.failureMemories.length - before.failureMemories.length),
  };
}

function average(values) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 1000) / 1000 : 0;
}

function ratio(value, total) {
  return total ? Math.round(value / total * 1000) / 1000 : 0;
}

function countBy(values) {
  return values.reduce((result, value) => ({ ...result, [value]: (result[value] || 0) + 1 }), {});
}

function averageObjects(values) {
  const keys = [...new Set(values.flatMap((value) => Object.keys(value || {})))];
  return Object.fromEntries(keys.map((key) => [key, average(values.map((value) => value?.[key] || 0))]));
}

function readSession(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeSession(path, session) {
  fs.writeFileSync(path, `${JSON.stringify(session, null, 2)}\n`);
}

function cli(argv) {
  const [command = "batch", ...args] = argv;
  if (command === "init") {
    const [path, seed = "agent-player", profile = "baseline"] = args;
    if (!path) throw new Error("init requires a session path");
    const session = createSession(seed, profile);
    writeSession(path, session);
    return observeSession(session);
  }
  if (command === "observe") return observeSession(readSession(args[0]));
  if (command === "act") {
    const [path, action] = args;
    const result = applySessionAction(readSession(path), action);
    if (result.ok) writeSession(path, result.session);
    return { ok: result.ok, transition: result.transition, error: result.error, observation: result.observation };
  }
  if (command === "summary") return summarizeSession(readSession(args[0]));
  if (command === "run") return runPolicy(args[2] || "feedback-run", args[0] || "baseline", args[1] || "explorer");
  const batch = runBatch(Number(args[0] || 40), args[1] || "baseline", args[2] || "explorer");
  return Object.fromEntries(Object.entries(batch).filter(([key]) => key !== "runs"));
}

if (require.main === module) console.log(JSON.stringify(cli(process.argv.slice(2)), null, 2));

module.exports = { PROFILES, applySessionAction, createSession, observeSession, runBatch, runPolicy, summarizeSession };
