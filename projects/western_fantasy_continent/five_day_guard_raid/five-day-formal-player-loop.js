const crypto = require("node:crypto");
const GAME = require("./five-day-raid-core");
const RUNTIME = require("../game_data/player-cognition-v3-event-runtime");
const SIGNAL_INTERPRETER = require("../experiments/player_agent_api_loop_v1/signal-concept-interpreter");
const KNOWLEDGE_RETRIEVAL = require("../experiments/player_agent_api_loop_v1/knowledge-retrieval");
const PERSISTENT_AGENT = require("../experiments/player_agent_api_loop_v1/persistent-agent-context");
const PLAYER_PROFILES = require("../experiments/player_agent_api_loop_v1/player-profiles");

const SCHEMA = "five_day_guard_raid_formal_player_loop_v1";

function createSession(seed = "five-day-formal-player", maxCycles = 40, options = {}) {
  return {
    schema: SCHEMA,
    seed: String(seed),
    maxCycles: Math.max(1, Number(maxCycles) || 40),
    cycle: 0,
    phase: "decision",
    gameState: GAME.createInitialState(seed),
    cognitionState: RUNTIME.createState(`${seed}:cognition`),
    conceptState: SIGNAL_INTERPRETER.createConceptState(),
    agentContext: PERSISTENT_AGENT.create(`${seed}:agent`),
    playerProfile: PLAYER_PROFILES.createProfileState(options.profileId || "open_novice"),
    knowledgeBase: [],
    history: [],
    pendingAttribution: null,
    apiCalls: [],
  };
}

function getPendingRequest(sessionInput) {
  const session = validateSession(sessionInput);
  if (session.phase === "complete") return { type: "complete", cycle: session.cycle, result: publicResult(session.gameState) };
  if (session.phase === "decision") return buildDecisionRequest(session);
  if (session.phase === "attribution") return buildAttributionRequest(session);
  throw new Error(`unknown phase: ${session.phase}`);
}

function applyDecisionResponse(sessionInput, responseInput) {
  const session = validateSession(sessionInput);
  if (session.phase !== "decision") throw new Error(`expected decision phase, got ${session.phase}`);
  const request = buildDecisionRequest(session);
  const response = normalizeDecisionResponse(responseInput);
  const visibleGoalIds = new Set(request.playerState.goals.map((goal) => goal.id));
  if (!visibleGoalIds.has(response.goalId)) {
    throw new Error(`decision agent returned evaluator-only or unavailable goal: ${response.goalId}`);
  }
  const observation = GAME.getPlayerObservation(session.gameState);
  const selected = observation.actions.find((row) => row.id === response.action);
  if (!selected) throw new Error(`decision agent returned unavailable action: ${response.action}`);

  const decision = {
    id: `five-day-decision:${session.cycle + 1}`,
    time: session.cycle + 1,
    action: response.action,
    goalId: response.goalId,
    choiceMode: "formal_external_player",
    environment: { region: "煤灰镇", day: observation.time.day, phase: observation.time.phase },
    alternatives: response.alternatives,
    reasoningChain: response.reasoningChain,
    hypothesis: null,
  };
  const cognitionAfterDecision = RUNTIME.applyDecision(session.cognitionState, decision);
  const beforeState = clone(session.gameState);
  const beforeObservation = observation;
  const afterState = GAME.applyPlayerAction(session.gameState, response.action);
  const afterObservation = GAME.getPlayerObservation(afterState);
  const rawEvents = buildVisibleEvents({
    cycle: session.cycle + 1,
    selected,
    beforeState,
    afterState,
    beforeObservation,
    afterObservation,
  });
  const interpreted = SIGNAL_INTERPRETER.interpretEventLog(rawEvents, session.conceptState, {
    region: "煤灰镇",
    day: afterObservation.time.day,
  });
  const cognitionAfterEvents = RUNTIME.ingestEvents(cognitionAfterDecision, interpreted.events);
  const knowledgeUpdate = updateKnowledgeBase(session.knowledgeBase, {
    selected,
    beforeObservation,
    afterObservation,
    visibleEvents: interpreted.events,
  });

  const record = {
    cycle: session.cycle + 1,
    decisionRequest: request,
    decisionResponse: response,
    action: { id: selected.id, label: selected.label, kind: selected.kind },
    beforeObservation,
    afterObservation,
    rawEventLog: rawEvents,
    eventLog: interpreted.events,
    conceptInterpretation: interpreted.interpretation,
    learningDelta: knowledgeUpdate.delta,
    attribution: null,
  };
  session.gameState = afterState;
  session.cognitionState = cognitionAfterEvents;
  session.conceptState = interpreted.state;
  session.history.push(record);
  session.pendingAttribution = {
    cycle: session.cycle + 1,
    historyIndex: session.history.length - 1,
    action: record.action,
    knowledgeId: knowledgeUpdate.row.id,
    eventIds: interpreted.events.map((row) => row.id),
  };
  session.phase = "attribution";
  session.apiCalls.push({ type: "decision", cycle: session.cycle + 1, response });
  session.agentContext = PERSISTENT_AGENT.completeTurn(session.agentContext);
  return session;
}

function applyAttributionResponse(sessionInput, responseInput) {
  const session = validateSession(sessionInput);
  if (session.phase !== "attribution" || !session.pendingAttribution) {
    throw new Error(`expected attribution phase, got ${session.phase}`);
  }
  const response = normalizeAttributionResponse(responseInput);
  const pending = session.pendingAttribution;
  if (response.knowledgeId !== pending.knowledgeId) throw new Error("attribution selected knowledge outside this action");
  if (!response.evidenceEventIds.length) throw new Error("attribution must cite at least one visible event id");
  const invalid = response.evidenceEventIds.filter((id) => !pending.eventIds.includes(id));
  if (invalid.length) throw new Error(`attribution used unknown evidence: ${invalid.join(", ")}`);
  const knowledge = session.knowledgeBase.find((row) => row.id === pending.knowledgeId);
  if (!knowledge) throw new Error(`unknown knowledge row: ${pending.knowledgeId}`);
  const attribution = {
    id: `five-day-attribution:${pending.cycle}`,
    cause: response.primaryCause,
    confidence: response.confidence,
    evidenceEventIds: response.evidenceEventIds,
    alternativeCauses: response.alternativeCauses,
    nextTest: response.nextTest,
    learnedAfterFeedback: true,
  };
  knowledge.attributions.push(attribution);
  session.history[pending.historyIndex].attribution = attribution;
  session.apiCalls.push({ type: "attribution", cycle: pending.cycle, response });
  session.agentContext = PERSISTENT_AGENT.completeTurn(session.agentContext);
  session.cycle += 1;
  session.pendingAttribution = null;
  session.phase = session.gameState.result || session.cycle >= session.maxCycles ? "complete" : "decision";
  return session;
}

function buildDecisionRequest(session) {
  const observation = GAME.getPlayerObservation(session.gameState);
  const goals = session.cognitionState.goals.filter((goal) => goal.id !== "discover_new_capabilities");
  const activeGoalId = goals.some((goal) => goal.id === session.cognitionState.activeGoalId)
    ? session.cognitionState.activeGoalId
    : goals[0]?.id || "grow_and_progress";
  const retrievalObservation = {
    region: "煤灰镇",
    currentGoal: "在白鹿家的人抵达前自行决定如何准备",
    allowedActions: observation.actions.map((row) => row.id),
    visibleNodes: observation.places.map((row) => ({ id: row.id, title: row.title, status: row.status })),
    inventory: observation.inventory,
    teamSlots: observation.party.active.map((row) => row.id),
  };
  const retrieval = KNOWLEDGE_RETRIEVAL.retrieveKnowledge({
    knowledgeBase: session.knowledgeBase,
    observation: retrievalObservation,
    goals,
    failureMemories: session.cognitionState.failureMemories,
    hypotheses: session.cognitionState.hypotheses,
    history: session.history,
  });
  return {
    type: "decision",
    schema: "five_day_guard_raid_player_decision_request_v1",
    cycle: session.cycle + 1,
    agentSession: PERSISTENT_AGENT.requestMetadata(session.agentContext, "decision"),
    playerProfile: clone(session.playerProfile),
    instruction: "你是第一次玩这个章节的玩家。只依据本请求里的当前画面、过去亲自观察到的结果和检索出的记忆，选择一个此刻存在的行动；请求之外的信息一律视为未知。",
    playerState: {
      activeGoalId,
      goals: clone(goals),
      knowledge: retrieval.knowledge,
      failureMemories: clone(session.cognitionState.failureMemories),
      hypotheses: clone(session.cognitionState.hypotheses),
      knowledgeStoreCount: session.knowledgeBase.length,
    },
    observation: compactObservation(observation),
    responseContract: {
      action: "one exact id from observation.actions",
      goalId: "one visible goal id",
      reasoningChain: [{ kind: "intent|evidence|comparison", evidence: "short factual evidence from this request" }],
      alternatives: ["zero or more exact action ids from observation.actions"],
    },
  };
}

function buildAttributionRequest(session) {
  const pending = session.pendingAttribution;
  const record = session.history[pending.historyIndex];
  const knowledge = session.knowledgeBase.find((row) => row.id === pending.knowledgeId);
  return {
    type: "attribution",
    schema: "five_day_guard_raid_player_attribution_request_v1",
    cycle: pending.cycle,
    agentSession: PERSISTENT_AGENT.requestMetadata(session.agentContext, "attribution"),
    instruction: "只根据下面列出的可见现象解释刚才发生了什么。不要补写隐藏规则；不确定时降低置信度并提出可检验的下一步。",
    action: record.action,
    existingKnowledge: [clone(knowledge)],
    visibleEvents: record.eventLog.map(publicEvent),
    responseContract: {
      knowledgeId: knowledge.id,
      primaryCause: "short inference grounded in the visible events",
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
  const strongest = observation.inventory.slice().sort((a, b) => b.power - a.power).slice(0, 12);
  const identityItems = observation.inventory.filter((row) => row.identityTags.length).slice(-18);
  const items = [...new Map([...strongest, ...identityItems].map((row) => [row.id, row])).values()];
  return {
    schema: observation.schema,
    time: observation.time,
    situation: observation.situation,
    party: observation.party,
    resources: observation.resources,
    inventory: { total: observation.inventory.length, rarityCounts, identityTagCounts, visibleItems: items },
    places: observation.places,
    threatSignals: observation.threatSignals,
    recentSignals: observation.recentSignals,
    actions: observation.actions,
    result: observation.result,
  };
}

function buildVisibleEvents({ cycle, selected, beforeState, afterState, beforeObservation, afterObservation }) {
  const newSignals = newRecentTexts(beforeState.recent, afterState.recent);
  const newAllies = partyNames(afterObservation).filter((name) => !partyNames(beforeObservation).includes(name));
  const newThreatSignals = afterObservation.threatSignals.filter((row) => !beforeObservation.threatSignals.includes(row));
  const changedPlaces = afterObservation.places.filter((place) => {
    const before = beforeObservation.places.find((row) => row.title === place.title);
    return !before || before.status !== place.status || before.scene !== place.scene;
  }).map((row) => ({ title: row.title, status: row.status, scene: row.scene }));
  const inventoryDelta = afterObservation.inventory.length - beforeObservation.inventory.length;
  const beforeItemIds = new Set(beforeObservation.inventory.map((row) => row.id));
  const afterItemIds = new Set(afterObservation.inventory.map((row) => row.id));
  const addedItems = afterObservation.inventory.filter((row) => !beforeItemIds.has(row.id)).map((row) => ({ name: row.name, rarity: row.rarity, slot: row.slot, power: row.power, identityTags: row.identityTags }));
  const removedItems = beforeObservation.inventory.filter((row) => !afterItemIds.has(row.id)).map((row) => ({ name: row.name, rarity: row.rarity, slot: row.slot }));
  const resourceChanges = Object.keys(afterObservation.resources).map((key) => ({ key, before: beforeObservation.resources[key], after: afterObservation.resources[key] })).filter((row) => row.before !== row.after);
  const powerBefore = beforeObservation.party.active.reduce((sum, row) => sum + row.visiblePower, 0);
  const powerAfter = afterObservation.party.active.reduce((sum, row) => sum + row.visiblePower, 0);
  const summaryParts = [newSignals.length ? newSignals.slice(0, 4).join(" ") : `完成了“${selected.label}”。`];
  if (addedItems.length) summaryParts.push(`背包新增：${addedItems.slice(0, 6).map((row) => `${row.rarity}${row.name}`).join("、")}${addedItems.length > 6 ? `等${addedItems.length}件` : ""}。`);
  if (removedItems.length) summaryParts.push(`背包减少：${removedItems.slice(0, 6).map((row) => row.name).join("、")}${removedItems.length > 6 ? `等${removedItems.length}件` : ""}。`);
  if (resourceChanges.length) summaryParts.push(`资源变化：${resourceChanges.map((row) => `${resourceLabel(row.key)}${row.before}→${row.after}`).join("、")}。`);
  if (powerAfter !== powerBefore) summaryParts.push(`当前出战成员显示战力合计${powerBefore}→${powerAfter}。`);
  if (newAllies.length) summaryParts.push(`新出现的队伍成员：${newAllies.join("、")}。`);
  if (newThreatSignals.length) summaryParts.push(`态势变化：${newThreatSignals.join("；")}`);
  if (changedPlaces.length) summaryParts.push(`地点变化：${changedPlaces.map((row) => `${row.title}(${row.status})`).join("、")}。`);
  if (afterObservation.time.day !== beforeObservation.time.day) summaryParts.push(`日期推进到第${afterObservation.time.day}日。`);
  if (afterObservation.time.actionsRemainingToday !== beforeObservation.time.actionsRemainingToday) {
    summaryParts.push(`今日剩余行动${beforeObservation.time.actionsRemainingToday}→${afterObservation.time.actionsRemainingToday}。`);
  }
  const components = [];
  if (inventoryDelta > 0) components.push({ kind: "loot", rarity: "common", amount: inventoryDelta });
  for (const name of newAllies) components.push({ kind: "character_unlock", character: name });
  if (afterObservation.result) components.push({ kind: afterObservation.result.win ? "combat_win" : "combat_loss", firstClear: true });
  return [{
    id: `visible:${cycle}:action-summary`,
    time: cycle,
    type: "action_summary",
    subject: { id: "player_party", name: "你的队伍", side: "left", role: "player_party" },
    environment: { region: "煤灰镇", node: inferPublicNode(selected.label), phase: afterObservation.time.phase, day: afterObservation.time.day },
    behavior: { kind: selected.kind, key: stableBehaviorKey(selected), name: selected.label },
    result: {
      kind: "action_summary",
      occurred: true,
      summary: summaryParts.join(" "),
      components,
      inventoryDelta,
      addedItems,
      removedItems,
      resourceChanges,
      activePowerBefore: powerBefore,
      activePowerAfter: powerAfter,
      newAllies,
      newThreatSignals,
      changedPlaces,
      result: afterObservation.result,
    },
    presentation: {
      visible: true,
      informationTier: "prominent",
      hasSource: true,
      hasTarget: changedPlaces.length > 0 || newThreatSignals.length > 0,
      hasNumber: inventoryDelta !== 0 || powerAfter !== powerBefore || resourceChanges.length > 0,
      attentionZone: "action-result",
    },
  }];
}

function updateKnowledgeBase(knowledgeBase, { selected, afterObservation, visibleEvents }) {
  const event = visibleEvents[0];
  const key = `player_party|${event.environment.node}|${stableBehaviorKey(selected)}`;
  let row = knowledgeBase.find((entry) => entry.key === key);
  const added = !row;
  if (!row) {
    row = {
      id: `five-day-knowledge:${shortHash(key)}`,
      key,
      subject: { id: "player_party", label: "你的队伍" },
      environment: { region: "煤灰镇", node: event.environment.node, dayFirstSeen: afterObservation.time.day },
      behavior: { kind: selected.kind, key: stableBehaviorKey(selected), label: selected.label },
      result: { sampleCount: 0, outcomeDistribution: {}, observations: [] },
      evidenceEventIds: [],
      attributions: [],
    };
    knowledgeBase.push(row);
  }
  row.result.sampleCount += 1;
  row.result.outcomeDistribution.observed = (row.result.outcomeDistribution.observed || 0) + 1;
  row.result.observations.push({
    eventId: event.id,
    day: afterObservation.time.day,
    summary: event.result.summary,
    inventoryDelta: event.result.inventoryDelta,
    addedItems: event.result.addedItems,
    removedItems: event.result.removedItems,
    resourceChanges: event.result.resourceChanges,
    activePowerBefore: event.result.activePowerBefore,
    activePowerAfter: event.result.activePowerAfter,
    newAllies: event.result.newAllies,
    newThreatSignals: event.result.newThreatSignals,
    changedPlaces: event.result.changedPlaces,
  });
  row.result.observations = row.result.observations.slice(-8);
  row.evidenceEventIds.push(event.id);
  return { row, delta: { addedKnowledge: added ? [clone(row)] : [], updatedKnowledge: added ? [] : [clone(row)] } };
}

function publicEvent(event) {
  return { id: event.id, type: event.type, action: event.behavior.name, summary: event.result.summary };
}

function newRecentTexts(beforeRows, afterRows) {
  const before = beforeRows || [];
  const after = afterRows || [];
  for (let index = 0; index <= after.length; index += 1) {
    const tail = after.slice(index);
    const length = Math.min(tail.length, before.length);
    if (JSON.stringify(tail.slice(0, length)) === JSON.stringify(before.slice(0, length))) {
      return after.slice(0, index).map((row) => row.text);
    }
  }
  return after.map((row) => row.text);
}

function resourceLabel(key) {
  return ({ gold: "金币", medicine: "药品", townFavor: "镇民支持", evidence: "证据" })[key] || key;
}

function normalizeDecisionResponse(input) {
  const response = typeof input === "string" ? JSON.parse(input) : clone(input);
  if (!response || typeof response.action !== "string") throw new Error("decision response requires action");
  const reasoningChain = Array.isArray(response.reasoningChain)
    ? response.reasoningChain.filter((row) => row && typeof row.kind === "string" && typeof row.evidence === "string")
    : [];
  if (!reasoningChain.length) throw new Error("decision response requires a structured reasoningChain");
  return {
    action: response.action,
    goalId: typeof response.goalId === "string" ? response.goalId : "grow_and_progress",
    reasoningChain,
    alternatives: Array.isArray(response.alternatives) ? response.alternatives.map(String) : [],
  };
}

function normalizeAttributionResponse(input) {
  const response = typeof input === "string" ? JSON.parse(input) : clone(input);
  if (!response || typeof response.knowledgeId !== "string") throw new Error("attribution response requires knowledgeId");
  return {
    knowledgeId: response.knowledgeId,
    primaryCause: String(response.primaryCause || "无法确定"),
    confidence: Math.max(0, Math.min(1, Number(response.confidence) || 0)),
    evidenceEventIds: Array.isArray(response.evidenceEventIds) ? response.evidenceEventIds.map(String) : [],
    alternativeCauses: Array.isArray(response.alternativeCauses) ? response.alternativeCauses.map(String) : [],
    nextTest: String(response.nextTest || ""),
  };
}

function partyNames(observation) {
  return [...observation.party.active, ...observation.party.reserve].map((row) => row.name);
}

function stableBehaviorKey(selected) {
  return `${selected.kind}:${shortHash(selected.label)}`;
}

function inferPublicNode(label) {
  const event = GAME.EVENTS.find((row) => row.options.some((option) => label.includes(option.label) || option.label.includes(label)));
  if (event) return event.title;
  if (label.includes("刷") || label.includes("灰炉")) return "灰炉外环";
  if (label.includes("门锁") || label.includes("王炉")) return "王炉门";
  if (label.includes("穿戴") || label.includes("装备")) return "队伍装备";
  if (label.includes("出战") || label.includes("候补")) return "队伍编成";
  if (label.includes("结束本日")) return "日程";
  return "煤灰镇";
}

function publicResult(state) {
  const observation = GAME.getPlayerObservation(state);
  return observation.result;
}

function shortHash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function validateSession(input) {
  const session = clone(input);
  if (!session || session.schema !== SCHEMA) throw new Error(`expected ${SCHEMA}`);
  return session;
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  SCHEMA,
  createSession,
  getPendingRequest,
  applyDecisionResponse,
  applyAttributionResponse,
};
