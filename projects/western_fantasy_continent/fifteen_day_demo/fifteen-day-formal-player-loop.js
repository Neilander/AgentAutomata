"use strict";

const crypto = require("node:crypto");
const GAME = require("./fifteen-day-core");
const RUNTIME = require("../game_data/player-cognition-v3-event-runtime");
const INTERPRETER = require("../experiments/player_agent_api_loop_v1/signal-concept-interpreter");
const RETRIEVAL = require("../experiments/player_agent_api_loop_v1/knowledge-retrieval");
const AGENT_CONTEXT = require("../experiments/player_agent_api_loop_v1/persistent-agent-context");
const PROFILES = require("../experiments/player_agent_api_loop_v1/player-profiles");

const SCHEMA = "fifteen_day_demo_formal_player_loop_v2";

function createSession(seed = "fifteen-day-formal-player", maxCycles = 90, options = {}) {
  return {
    schema: SCHEMA,
    seed: String(seed),
    maxCycles: Math.max(1, Number(maxCycles) || 90),
    cycle: 0,
    phase: "decision",
    gameState: GAME.createInitialState(seed),
    cognitionState: RUNTIME.createState(`${seed}:cognition`),
    conceptState: INTERPRETER.createConceptState(),
    agentContext: AGENT_CONTEXT.create(`${seed}:agent`),
    playerProfile: PROFILES.createProfileState(options.profileId || "open_novice"),
    knowledgeBase: [],
    history: [],
    pendingAttribution: null,
    apiCalls: [],
  };
}

function getPendingRequest(input) {
  const session = validate(input);
  if (session.phase === "complete") return { type: "complete", cycle: session.cycle, result: GAME.getPlayerObservation(session.gameState).result };
  return session.phase === "decision" ? buildDecisionRequest(session) : buildAttributionRequest(session);
}

function applyDecisionResponse(input, responseInput) {
  const session = validate(input);
  if (session.phase !== "decision") throw new Error(`expected decision phase, got ${session.phase}`);
  const request = buildDecisionRequest(session);
  const response = normalizeDecision(responseInput);
  if (!request.playerState.goals.some((goal) => goal.id === response.goalId)) throw new Error("goalId is not visible in this request");
  const before = GAME.getPlayerObservation(session.gameState);
  const selected = before.actions.find((action) => action.id === response.action);
  if (!selected) throw new Error("action is not visible in this request");

  const cognitionAfterDecision = RUNTIME.applyDecision(session.cognitionState, {
    id: `fifteen-day-decision:${session.cycle + 1}`,
    time: session.cycle + 1,
    action: response.action,
    goalId: response.goalId,
    choiceMode: "formal_external_player",
    environment: { region: "煤灰镇", day: before.time.day, phase: before.time.phase },
    alternatives: response.alternatives,
    reasoningChain: response.reasoningChain,
    hypothesis: null,
  });
  const afterState = GAME.applyPlayerAction(session.gameState, response.action);
  const after = GAME.getPlayerObservation(afterState);
  const rawEvents = buildVisibleEvents(session.cycle + 1, selected, before, after);
  const interpreted = INTERPRETER.interpretEventLog(rawEvents, session.conceptState, {
    region: "煤灰镇",
    day: after.time.day,
  });
  const cognitionAfterEvents = RUNTIME.ingestEvents(cognitionAfterDecision, interpreted.events);
  const knowledge = updateKnowledge(session.knowledgeBase, selected, after, interpreted.events[0]);
  const record = {
    cycle: session.cycle + 1,
    decisionInput: {
      instruction: request.instruction,
      playerProfile: request.playerProfile,
      playerState: request.playerState,
      observation: request.observation,
      responseContract: request.responseContract,
    },
    action: { id: selected.id, label: selected.label, kind: selected.kind },
    decisionResponse: response,
    beforeObservation: before,
    afterObservation: after,
    eventLog: interpreted.events,
    cognitionEvidence: compactCognitionEvidence(cognitionAfterEvents.trace.filter((row) => row.time === session.cycle + 1)),
    learningDelta: knowledge.delta,
    attribution: null,
  };

  session.gameState = afterState;
  session.cognitionState = cognitionAfterEvents;
  session.conceptState = interpreted.state;
  session.history.push(record);
  session.pendingAttribution = {
    cycle: record.cycle,
    historyIndex: session.history.length - 1,
    knowledgeId: "knowledge_current",
    internalKnowledgeId: knowledge.row.id,
    eventIds: interpreted.events.map((event, index) => `evidence_${index + 1}`),
  };
  session.phase = "attribution";
  session.apiCalls.push({ type: "decision", cycle: record.cycle, response });
  session.agentContext = AGENT_CONTEXT.completeTurn(session.agentContext);
  return session;
}

function applyAttributionResponse(input, responseInput) {
  const session = validate(input);
  if (session.phase !== "attribution" || !session.pendingAttribution) throw new Error(`expected attribution phase, got ${session.phase}`);
  const response = normalizeAttribution(responseInput);
  const pending = session.pendingAttribution;
  if (response.knowledgeId !== pending.knowledgeId) throw new Error("knowledgeId is outside this action");
  if (!response.evidenceEventIds.length || response.evidenceEventIds.some((id) => !pending.eventIds.includes(id))) throw new Error("attribution must cite visible event ids only");
  const row = session.knowledgeBase.find((entry) => entry.id === pending.internalKnowledgeId);
  const attribution = {
    id: `fifteen-day-attribution:${pending.cycle}`,
    cause: response.primaryCause,
    confidence: response.confidence,
    evidenceEventIds: response.evidenceEventIds,
    alternativeCauses: response.alternativeCauses,
    nextTest: response.nextTest,
    learnedAfterFeedback: true,
  };
  row.attributions.push(attribution);
  session.history[pending.historyIndex].attribution = attribution;
  session.apiCalls.push({ type: "attribution", cycle: pending.cycle, response });
  session.agentContext = AGENT_CONTEXT.completeTurn(session.agentContext);
  session.cycle += 1;
  session.pendingAttribution = null;
  session.phase = session.gameState.result || session.cycle >= session.maxCycles ? "complete" : "decision";
  return session;
}

function buildDecisionRequest(session) {
  const observation = GAME.getPlayerObservation(session.gameState);
  const goals = session.cognitionState.goals.filter((goal) => goal.id !== "discover_new_capabilities");
  const activeGoalId = goals.some((goal) => goal.id === session.cognitionState.activeGoalId) ? session.cognitionState.activeGoalId : goals[0]?.id;
  const retrieval = RETRIEVAL.retrieveKnowledge({
    knowledgeBase: session.knowledgeBase,
    observation: {
      region: "煤灰镇",
      currentGoal: observation.situation,
      allowedActions: observation.actions.map((action) => action.id),
      visibleNodes: observation.places.map((place) => ({ id: place.id, title: place.title, status: place.status, actionCount: place.actionCount })),
      inventory: observation.inventory,
      teamSlots: observation.party.active.map((hero) => hero.id),
    },
    goals,
    failureMemories: session.cognitionState.failureMemories,
    hypotheses: session.cognitionState.hypotheses,
    history: session.history,
  });
  return {
    type: "decision",
    schema: "fifteen_day_demo_player_decision_request_v1",
    cycle: session.cycle + 1,
    agentSession: { mode: session.agentContext.mode, turn: session.agentContext.turn, reuseRequired: true },
    playerProfile: { label: session.playerProfile.label, summary: session.playerProfile.summary, decisionBias: clone(session.playerProfile.decisionBias), priorBeliefs: stripTechnical(session.playerProfile.priorBeliefs) },
    instruction: "你是第一次玩这个游戏的玩家。只依据本请求里的当前画面、自己此前看到的结果和检索出的记忆选择行动；不要猜测或读取请求之外的规则。刷怪不消耗行动点，但其他行动是否消耗以画面标记为准。",
    playerState: {
      activeGoalId,
      goals: clone(goals),
      knowledge: stripTechnical(retrieval.knowledge),
      failureMemories: stripTechnical(session.cognitionState.failureMemories),
      hypotheses: stripTechnical(session.cognitionState.hypotheses),
      knowledgeStoreCount: session.knowledgeBase.length,
    },
    observation: compactObservation(observation),
    responseContract: {
      action: "one exact id from observation.actions",
      goalId: "one exact id from playerState.goals",
      reasoningChain: [{ kind: "intent|evidence|comparison", evidence: "short factual evidence from this request" }],
      alternatives: ["zero or more exact action ids from observation.actions"],
    },
  };
}

function buildAttributionRequest(session) {
  const pending = session.pendingAttribution;
  const record = session.history[pending.historyIndex];
  const knowledge = session.knowledgeBase.find((row) => row.id === pending.internalKnowledgeId);
  return {
    type: "attribution",
    schema: "fifteen_day_demo_player_attribution_request_v1",
    cycle: pending.cycle,
    agentSession: { mode: session.agentContext.mode, turn: session.agentContext.turn, reuseRequired: true },
    instruction: "只根据这里列出的可见现象解释刚才发生了什么。不要补写隐藏规则；证据不足时降低置信度，并提出可验证的下一步。",
    action: record.action,
    existingKnowledge: [{ knowledgeId: pending.knowledgeId, ...stripTechnical(knowledge) }],
    visibleEvents: record.eventLog.map((event, index) => ({ id: `evidence_${index + 1}`, type: event.type, action: event.behavior.name, summary: event.result.summary })),
    responseContract: {
      knowledgeId: knowledge.id,
      primaryCause: "short inference grounded in visibleEvents",
      confidence: "number from 0 to 1",
      evidenceEventIds: ["one or more exact ids from visibleEvents"],
      alternativeCauses: ["optional alternatives"],
      nextTest: "one falsifiable follow-up or empty string",
    },
  };
}

function compactObservation(observation) {
  const rarityCounts = {};
  const identityTagCounts = {};
  for (const item of observation.inventory) {
    rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
    for (const tag of item.identityTags) identityTagCounts[tag] = (identityTagCounts[tag] || 0) + 1;
  }
  const strongest = observation.inventory.slice().sort((a, b) => b.power - a.power).slice(0, 15);
  const tagged = observation.inventory.filter((item) => item.identityTags.length).slice(-15);
  const visibleItems = [...new Map([...strongest, ...tagged].map((item) => [item.id, item])).values()];
  const placeTitles = new Map(observation.places.map((place) => [place.id, place.title]));
  const publicHero = (hero) => ({ name: hero.name, role: hero.role, visiblePower: hero.visiblePower, formation: hero.formation, visibleSkills: hero.visibleSkills });
  return {
    time: observation.time,
    situation: observation.situation,
    party: { maxActive: observation.party.maxActive, active: observation.party.active.map(publicHero), reserve: observation.party.reserve.map(publicHero) },
    resources: observation.resources,
    inventory: { total: observation.inventory.length, rarityCounts, identityTagCounts, visibleItems: visibleItems.map(publicItem) },
    places: observation.places.map(({ id, ...place }) => place),
    threatSignals: observation.threatSignals,
    recentSignals: observation.recentSignals,
    lastCombat: observation.lastCombat,
    actions: observation.actions.map(({ placeId, ...action }) => ({ ...action, place: placeTitles.get(placeId) || "当前场景" })),
    result: observation.result,
  };
}

function buildVisibleEvents(cycle, selected, before, after) {
  const newSignals = newRecentTexts(before.recentSignals, after.recentSignals);
  const beforeRoster = new Set([...before.party.active, ...before.party.reserve].map((hero) => hero.name));
  const newAllies = [...after.party.active, ...after.party.reserve].filter((hero) => !beforeRoster.has(hero.name)).map((hero) => hero.name);
  const beforeIds = new Set(before.inventory.map((item) => item.id));
  const afterIds = new Set(after.inventory.map((item) => item.id));
  const addedItems = after.inventory.filter((item) => !beforeIds.has(item.id)).map(publicItem);
  const removedItems = before.inventory.filter((item) => !afterIds.has(item.id)).map(publicItem);
  const resourceChanges = Object.keys(after.resources).map((key) => ({ key, before: before.resources[key], after: after.resources[key] })).filter((row) => row.before !== row.after);
  const beforePower = before.party.active.reduce((sum, hero) => sum + hero.visiblePower, 0);
  const afterPower = after.party.active.reduce((sum, hero) => sum + hero.visiblePower, 0);
  const changedPlaces = after.places.filter((place) => {
    const prior = before.places.find((row) => row.id === place.id);
    return !prior || prior.status !== place.status || prior.scene !== place.scene || prior.actionCount !== place.actionCount;
  }).map((place) => ({ title: place.title, status: place.status, actionCount: place.actionCount }));
  const combatChanged = JSON.stringify(before.lastCombat) !== JSON.stringify(after.lastCombat) ? after.lastCombat : null;
  const displaySignals = combatChanged ? newSignals.filter((text) => !text.includes(combatChanged.title)) : newSignals;
  const parts = [displaySignals.length ? displaySignals.slice(0, 5).join(" ") : combatChanged ? "" : `完成了“${selected.label}”。`].filter(Boolean);
  if (addedItems.length) parts.push(`背包新增：${addedItems.slice(0, 8).map((item) => `${item.rarity}${item.name}`).join("、")}${addedItems.length > 8 ? `等${addedItems.length}件` : ""}。`);
  if (removedItems.length) parts.push(`背包减少：${removedItems.slice(0, 6).map((item) => item.name).join("、")}。`);
  if (resourceChanges.length) parts.push(`资源变化：${resourceChanges.map((row) => `${resourceLabel(row.key)}${row.before}→${row.after}`).join("、")}。`);
  if (beforePower !== afterPower) parts.push(`出战队伍显示战力合计${beforePower}→${afterPower}。`);
  if (newAllies.length) parts.push(`新队员：${newAllies.join("、")}。`);
  if (combatChanged) parts.push(`在“${combatChanged.title}”中我方${combatChanged.win ? "获胜" : "失利"}，我方${combatChanged.alliesAlive}/${combatChanged.alliesStarted}、敌方${combatChanged.enemiesAlive}/${combatChanged.enemiesStarted}仍能战斗，用时${combatChanged.duration}秒；我方造成${combatChanged.alliesDamage}伤害、治疗${combatChanged.alliesHealing}、获得${combatChanged.alliesShield}护盾。`);
  if (after.time.day !== before.time.day) parts.push(`日期推进到第${after.time.day}日。`);
  if (after.time.actionsRemainingToday !== before.time.actionsRemainingToday) parts.push(`今日剩余行动${before.time.actionsRemainingToday}→${after.time.actionsRemainingToday}。`);
  const raw = {
    id: `visible:${cycle}:action-summary`,
    time: cycle,
    type: "action_summary",
    subject: { id: "player_party", name: "你的队伍", side: "left", role: "player_party" },
    environment: { region: "煤灰镇", node: inferNode(selected), phase: after.time.phase, day: after.time.day },
    behavior: { kind: selected.kind, key: `${selected.kind}:${shortHash(selected.label)}`, name: selected.label },
    result: {
      kind: "action_summary", occurred: true, summary: parts.join(" "),
      components: addedItems.length ? [{ kind: "loot", rarity: "mixed", amount: addedItems.length }] : [],
      addedItems, removedItems, resourceChanges, activePowerBefore: beforePower, activePowerAfter: afterPower,
      newAllies, changedPlaces, combat: combatChanged, result: after.result,
    },
    presentation: { visible: true, informationTier: "prominent", hasSource: true, hasTarget: Boolean(combatChanged || changedPlaces.length), hasNumber: true, attentionZone: "action-result" },
  };
  return [raw];
}

function updateKnowledge(base, selected, after, event) {
  const key = `player_party|${event.environment.node}|${event.behavior.key}`;
  let row = base.find((entry) => entry.key === key);
  const added = !row;
  if (!row) {
    row = {
      id: `fifteen-day-knowledge:${shortHash(key)}`, key,
      subject: { id: "player_party", label: "你的队伍" },
      environment: { region: "煤灰镇", node: event.environment.node, dayFirstSeen: after.time.day },
      behavior: { kind: selected.kind, key: event.behavior.key, label: selected.label },
      result: { sampleCount: 0, outcomeDistribution: {}, observations: [] }, evidenceEventIds: [], attributions: [],
    };
    base.push(row);
  }
  row.result.sampleCount += 1;
  row.result.outcomeDistribution.observed = row.result.sampleCount;
  row.result.observations.push({ eventId: event.id, day: after.time.day, summary: event.result.summary });
  row.result.observations = row.result.observations.slice(-8);
  row.evidenceEventIds.push(event.id);
  return { row, delta: { addedKnowledge: added ? [clone(row)] : [], updatedKnowledge: added ? [] : [clone(row)] } };
}

function exportVisibleTrace(input) {
  const session = validate(input);
  return {
    schema: "fifteen_day_demo_visible_trace_v2",
    runId: shortHash(session.seed),
    profile: { profileId: session.playerProfile.profileId, label: session.playerProfile.label, summary: session.playerProfile.summary },
    phase: session.phase,
    completedCycles: session.cycle,
    finalObservation: compactObservation(GAME.getPlayerObservation(session.gameState)),
    cycles: session.history.map((row) => ({
      cycle: row.cycle,
      decisionInput: clone(row.decisionInput || null),
      selectedActionId: row.action.id,
      action: { label: row.action.label, kind: row.action.kind },
      reasoningChain: row.decisionResponse.reasoningChain,
      visibleResult: row.eventLog.map((event) => ({ id: event.id, summary: event.result.summary })),
      attribution: row.attribution ? { cause: row.attribution.cause, confidence: row.attribution.confidence, evidenceEventIds: row.attribution.evidenceEventIds, alternativeCauses: row.attribution.alternativeCauses, nextTest: row.attribution.nextTest } : null,
      cognitionEvidence: clone(row.cognitionEvidence || []),
    })),
  };
}

function compactCognitionEvidence(rows) {
  return rows.map((row) => ({
    type: row.type,
    accepted: row.accepted,
    H: row.H,
    HComponents: clone(row.HComponents),
    environment: clone(row.tuple?.environment || null),
    behavior: row.tuple?.behavior?.name || row.tuple?.behavior?.kind || null,
    resultSummary: row.tuple?.result?.summary || null,
    decisionValidation: clone(row.decisionValidation || null),
    processEmotion: row.processEmotion || 0,
    acquiredEmotion: row.acquiredEmotion || 0,
    expectationEmotion: row.expectationEmotion || 0,
    verificationEmotion: row.verificationEmotion || 0,
    EDecision: row.EDecision || 0,
    EVerify: row.EVerify || 0,
    emotionBefore: row.emotionBefore,
    emotionAfter: row.emotionAfter,
    emotionDelta: row.emotionDelta || 0,
    expectedUtility: row.expectedUtility,
    actualUtility: row.actualUtility,
    mismatchStatus: row.mismatchStatus,
    feedback: clone(row.feedback || null),
  }));
}

function normalizeDecision(input) {
  const response = clone(input);
  if (!response || typeof response.action !== "string" || typeof response.goalId !== "string") throw new Error("decision requires action and goalId");
  const reasoningChain = Array.isArray(response.reasoningChain) ? response.reasoningChain.filter((row) => row && typeof row.kind === "string" && typeof row.evidence === "string") : [];
  if (!reasoningChain.length) throw new Error("decision requires reasoningChain");
  return { action: response.action, goalId: response.goalId, reasoningChain, alternatives: Array.isArray(response.alternatives) ? response.alternatives.map(String) : [] };
}

function normalizeAttribution(input) {
  const response = clone(input);
  if (!response || typeof response.knowledgeId !== "string") throw new Error("attribution requires knowledgeId");
  return { knowledgeId: response.knowledgeId, primaryCause: String(response.primaryCause || "无法确定"), confidence: Math.max(0, Math.min(1, Number(response.confidence) || 0)), evidenceEventIds: Array.isArray(response.evidenceEventIds) ? response.evidenceEventIds.map(String) : [], alternativeCauses: Array.isArray(response.alternativeCauses) ? response.alternativeCauses.map(String) : [], nextTest: String(response.nextTest || "") };
}

function newRecentTexts(before, after) {
  for (let index = 0; index <= after.length; index += 1) {
    const tail = after.slice(index);
    const overlap = Math.min(tail.length, before.length);
    if (JSON.stringify(tail.slice(0, overlap)) === JSON.stringify(before.slice(0, overlap))) return after.slice(0, index);
  }
  return after;
}

function publicItem(item) { return { name: item.name, rarity: item.rarity, slot: item.slotLabel, power: item.power, identityTags: item.identityTags }; }
function stripTechnical(value) {
  if (Array.isArray(value)) return value.map(stripTechnical);
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (["id", "key", "eventId", "eventIds", "recentEventIds", "schema", "source"].includes(key)) continue;
    output[key] = stripTechnical(item);
  }
  return output;
}
function resourceLabel(key) { return ({ gold: "金币", medicine: "药品", townFavor: "镇民支持", evidence: "证据", influence: "影响力" })[key] || key; }
function inferNode(selected) { const event = GAME.EVENTS.find((row) => row.options.some((option) => option.label === selected.label)); return event?.title || (selected.kind === "grind" ? "装备副本" : selected.kind === "equipment" || selected.kind === "party" ? "队伍与装备" : selected.kind === "time" ? "今日日程" : selected.kind === "combat" ? "战场" : "煤灰镇"); }
function shortHash(value) { return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12); }
function validate(input) { const session = clone(input); if (!session || session.schema !== SCHEMA) throw new Error(`expected ${SCHEMA}`); return session; }
function clone(value) { return structuredClone(value); }

module.exports = { SCHEMA, createSession, getPendingRequest, applyDecisionResponse, applyAttributionResponse, exportVisibleTrace };
