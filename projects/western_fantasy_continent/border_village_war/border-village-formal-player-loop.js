"use strict";

const crypto = require("node:crypto");
const GAME = require("./border-village-core");
const RUNTIME = require("../game_data/player-cognition-v3-event-runtime");
const INTERPRETER = require("../experiments/player_agent_api_loop_v1/signal-concept-interpreter");
const RETRIEVAL = require("../experiments/player_agent_api_loop_v1/knowledge-retrieval");
const AGENT_CONTEXT = require("../experiments/player_agent_api_loop_v1/persistent-agent-context");
const PROFILES = require("../experiments/player_agent_api_loop_v1/player-profiles");

const SCHEMA = "border_village_war_formal_player_loop_v1";

function createSession(seed = "border-village-formal-player", maxCycles = 100, options = {}) {
  return {
    schema: SCHEMA,
    seed: String(seed),
    maxCycles: Math.max(1, Number(maxCycles) || 100),
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

function createFinalReplaySession(input) {
  const prior = validate(input);
  const finalIndex = prior.history.findIndex((row) => row.action?.kind === "combat" && row.afterObservation?.result);
  if (finalIndex < 0 || !prior.gameState?.result || prior.gameState.phase !== "complete") throw new Error("source session has no completed final battle to replay");
  const finalRecord = prior.history[finalIndex];
  const session = clone(prior);
  const committedFood = Number(session.gameState.lastCombat?.foodCommitted || 0);
  session.gameState.resources.food += committedFood;
  session.gameState.phase = "final";
  session.gameState.result = null;
  session.gameState.stats.combats = Math.max(0, session.gameState.stats.combats - 1);
  session.gameState.lastCombat = clone(finalRecord.beforeObservation.lastCombat);
  session.gameState.recent = clone(finalRecord.beforeObservation.recentSignals || []);
  session.cycle = finalRecord.cycle - 1;
  session.phase = "decision";
  session.pendingAttribution = null;
  session.history = session.history.slice(0, finalIndex);
  session.apiCalls = session.apiCalls.filter((row) => row.cycle < finalRecord.cycle);
  session.knowledgeBase = session.knowledgeBase.filter((row) => row.behavior?.label !== finalRecord.action.label);
  session.cognitionState = RUNTIME.createState(`${session.seed}:final-replay:cognition`);
  session.conceptState = INTERPRETER.createConceptState();
  session.agentContext = AGENT_CONTEXT.create(`${session.seed}:final-replay:agent`);
  return session;
}

function getPendingRequest(input) {
  const session = validate(input);
  if (session.phase === "complete") return { type: "complete", cycle: session.cycle, result: compactObservation(GAME.getPlayerObservation(session.gameState)).result };
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
  if (!selected || !request.observation.actions.some((action) => action.id === response.action)) throw new Error("action is not visible in this request");

  const cognitionAfterDecision = RUNTIME.applyDecision(session.cognitionState, {
    id: `border-village-decision:${session.cycle + 1}`,
    time: session.cycle + 1,
    action: response.action,
    goalId: response.goalId,
    choiceMode: "formal_external_player",
    environment: { region: "灰谷村", day: before.time.day, phase: before.time.phase },
    alternatives: response.alternatives,
    reasoningChain: response.reasoningChain,
    hypothesis: null,
  });

  let afterState;
  let combatAudit = null;
  if (["combat", "grind"].includes(selected.kind)) {
    const plan = GAME.preparePlayerCombat(session.gameState, response.action);
    if (!plan) throw new Error("visible combat action did not produce a combat plan");
    const result = GAME.simulatePlan(plan);
    if (!result.signals?.length) throw new Error("combat process produced no timeline");
    afterState = GAME.applyPlayerCombatResult(session.gameState, response.action, result);
    combatAudit = { fingerprint: GAME.combatResultFingerprint(result), signalCount: result.signals.length };
  } else {
    afterState = GAME.applyPlayerAction(session.gameState, response.action);
  }

  const after = GAME.getPlayerObservation(afterState);
  const rawVisibleEvents = buildVisibleEvents(session.cycle + 1, selected, before, after);
  const interpreted = INTERPRETER.interpretEventLog(rawVisibleEvents, session.conceptState, { region: "灰谷村", day: after.time.day });
  const cognitionAfterEvents = RUNTIME.ingestEvents(cognitionAfterDecision, interpreted.events);
  const knowledge = updateKnowledge(session.knowledgeBase, selected, after, interpreted.events[0]);
  const record = {
    cycle: session.cycle + 1,
    decisionInput: clone(request),
    action: { id: selected.id, label: selected.label, kind: selected.kind },
    decisionResponse: response,
    beforeObservation: before,
    afterObservation: after,
    eventLog: interpreted.events,
    combatAudit,
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
    id: `border-village-attribution:${pending.cycle}`,
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
  const fullObservation = GAME.getPlayerObservation(session.gameState);
  const observation = compactObservation(fullObservation);
  const goals = session.cognitionState.goals.filter((goal) => goal.id !== "discover_new_capabilities");
  const activeGoalId = goals.some((goal) => goal.id === session.cognitionState.activeGoalId) ? session.cognitionState.activeGoalId : goals[0]?.id;
  const retrieval = RETRIEVAL.retrieveKnowledge({
    knowledgeBase: session.knowledgeBase,
    observation: {
      region: "灰谷村",
      currentGoal: fullObservation.story?.text || `第${fullObservation.time.day}日，准备抵抗第${fullObservation.time.finalDay}日的进攻`,
      allowedActions: observation.actions.map((action) => action.id),
      visibleNodes: observation.buildings.map((row) => ({ id: `plot_${row.slot + 1}`, title: row.siteTitle === "灰谷村" ? row.name : `${row.siteTitle}·${row.name}`, status: row.yieldStatus, actionCount: fullObservation.actions.filter((action) => action.targetSlot === row.slot).length })),
      inventory: observation.inventory.visibleItems,
      teamSlots: observation.party.heroes.filter((hero) => hero.active).map((hero) => hero.name),
    },
    goals,
    failureMemories: session.cognitionState.failureMemories,
    hypotheses: session.cognitionState.hypotheses,
    history: session.history,
  });
  return {
    type: "decision",
    schema: "border_village_war_player_decision_request_v1",
    cycle: session.cycle + 1,
    agentSession: { mode: session.agentContext.mode, turn: session.agentContext.turn, reuseRequired: true },
    playerProfile: {
      label: session.playerProfile.label,
      summary: session.playerProfile.summary,
      decisionBias: clone(session.playerProfile.decisionBias),
      priorBeliefs: stripTechnical(session.playerProfile.priorBeliefs),
    },
    instruction: "你是第一次玩这个游戏的玩家。只依据本请求里的当前画面、自己此前看到的结果和检索出的记忆选择一个available为true的行动；available为false的行动仍显示，是为了让你看见缺少的条件。不要读取或猜测请求之外的规则。",
    playerState: {
      activeGoalId,
      goals: clone(goals),
      knowledge: stripTechnical(retrieval.knowledge),
      failureMemories: stripTechnical(session.cognitionState.failureMemories),
      hypotheses: stripTechnical(session.cognitionState.hypotheses),
      knowledgeStoreCount: session.knowledgeBase.length,
    },
    observation,
    responseContract: {
      action: "one exact id with available=true from observation.actions",
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
    schema: "border_village_war_player_attribution_request_v1",
    cycle: pending.cycle,
    agentSession: { mode: session.agentContext.mode, turn: session.agentContext.turn, reuseRequired: true },
    instruction: "只根据这里列出的可见现象解释刚才发生了什么。不要补写隐藏规则；证据不足时降低置信度，并提出可验证的下一步。",
    action: record.action,
    existingKnowledge: [{ knowledgeId: pending.knowledgeId, ...stripTechnical(knowledge) }],
    visibleEvents: record.eventLog.map((event, index) => ({ id: `evidence_${index + 1}`, type: event.type, action: event.behavior.name, summary: event.result.summary })),
    responseContract: {
      knowledgeId: "knowledge_current",
      primaryCause: "short inference grounded in visibleEvents",
      confidence: "number from 0 to 1",
      evidenceEventIds: ["one or more exact ids from visibleEvents"],
      alternativeCauses: ["optional alternatives"],
      nextTest: "one falsifiable follow-up or empty string",
    },
  };
}

function compactObservation(view) {
  const rarityRank = Object.fromEntries(GAME.RARITY_DATA.map((row, index) => [row.label, index]));
  const equippedIds = new Set(view.party.heroes.flatMap((hero) => hero.equipment.map((slot) => slot.item?.id).filter(Boolean)));
  const visibleItems = view.inventory.slice().sort((a, b) => Number(equippedIds.has(b.id)) - Number(equippedIds.has(a.id)) || (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0) || b.power - a.power).slice(0, 60);
  const rarityCounts = {};
  for (const item of view.inventory) rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
  return {
    time: clone(view.time),
    story: clone(view.story),
    war: clone(view.war),
    resources: clone(view.resources),
    buildings: clone(view.buildings),
    productionForecasts: clone(view.productionForecasts),
    economy: clone(view.economy),
    market: { sellRemaining: view.market.sellRemaining, priceRule: view.market.priceRule, stock: view.market.stock.map(({ id, item, ...row }) => ({ ...row, item: item ? publicItem(item) : null })) },
    party: {
      activeLimit: view.party.activeLimit,
      finalBattleRule: view.party.finalBattleRule,
      selectedHero: view.party.heroes.find((hero) => hero.id === view.party.selectedHeroId)?.name || "未知",
      heroes: view.party.heroes.map((hero) => ({ name: hero.name, role: hero.role, preferredAffixes: clone(hero.preferredAffixes), active: hero.active, equipment: hero.equipment.map((slot) => ({ slot: slot.slotLabel, item: slot.item ? publicItem(slot.item) : null })) })),
    },
    inventory: { total: view.inventory.length, limit: view.inventoryLimit, rarityCounts, visibleItems: visibleItems.map(publicItem) },
    raids: view.raids.map(({ id, ...row }) => row),
    outposts: view.outposts.map(({ id, ...row }) => row),
    event: view.event ? { title: view.event.title, scene: view.event.scene } : null,
    recentSignals: clone(view.recentSignals),
    lastCombat: clone(view.lastCombat),
    actions: view.actions.map(({ targetSlot, targetHeroId, targetItemId, targetStockId, targetEquipmentSlot, operation, ...action }) => clone(action)),
    result: clone(view.result),
  };
}

function buildVisibleEvents(cycle, selected, before, after) {
  const newSignals = newRecentTexts(before.recentSignals, after.recentSignals);
  const beforeItemIds = new Set(before.inventory.map((item) => item.id));
  const afterItemIds = new Set(after.inventory.map((item) => item.id));
  const addedItems = after.inventory.filter((item) => !beforeItemIds.has(item.id)).map(publicItem);
  const removedItems = before.inventory.filter((item) => !afterItemIds.has(item.id)).map(publicItem);
  const beforeHeroes = new Set(before.party.heroes.map((hero) => hero.name));
  const newAllies = after.party.heroes.filter((hero) => !beforeHeroes.has(hero.name)).map((hero) => ({ name: hero.name, role: hero.role }));
  const resourceChanges = Object.keys(after.resources).map((key) => ({ key, label: resourceLabel(key), before: before.resources[key], after: after.resources[key] })).filter((row) => row.before !== row.after);
  const structuralBuilding = (row) => row ? { slot: row.slot, site: row.site, type: row.type || null, name: row.name, level: row.level, complete: row.complete } : null;
  const buildingChanges = after.buildings.map((row) => ({ before: before.buildings.find((old) => old.slot === row.slot), after: row })).filter((pair) => JSON.stringify(structuralBuilding(pair.before)) !== JSON.stringify(structuralBuilding(pair.after))).map((pair) => ({ slot: pair.after.slot + 1, before: pair.before?.name || "尚未发现", after: pair.after.name, level: pair.after.level, complete: pair.after.complete }));
  const combatChanged = JSON.stringify(before.lastCombat) !== JSON.stringify(after.lastCombat) ? after.lastCombat : null;
  const warChanges = ["knownEnemyUnits", "knownBosses", "militiaUnits"].map((key) => ({ key, before: before.war[key], after: after.war[key] })).filter((row) => row.before !== row.after);
  const parts = [];
  if (newSignals.length) parts.push(newSignals.slice(0, 6).map((row) => row.text).join(" "));
  else parts.push(`完成了“${selected.label}”。`);
  if (addedItems.length) parts.push(`背包新增：${addedItems.slice(0, 8).map((item) => item.name).join("、")}。`);
  if (removedItems.length) parts.push(`背包减少：${removedItems.slice(0, 6).map((item) => item.name).join("、")}。`);
  if (resourceChanges.length) parts.push(`资源变化：${resourceChanges.map((row) => `${row.label}${row.before}→${row.after}`).join("、")}。`);
  if (buildingChanges.length) parts.push(`建筑变化：${buildingChanges.map((row) => `${row.slot}号地${row.before}→${row.after}${row.complete ? `（等级${row.level}，立即生效）` : ""}`).join("、")}。`);
  if (newAllies.length) parts.push(`新队员：${newAllies.map((hero) => `${hero.name}（${hero.role}）`).join("、")}。`);
  if (warChanges.length) parts.push(`战局变化：${warChanges.map((row) => `${warLabel(row.key)}${row.before}→${row.after}`).join("、")}。`);
  if (combatChanged) parts.push(`“${combatChanged.title}”${combatChanged.win ? "获胜" : "失利"}：我方${combatChanged.alliesAlive}/${combatChanged.alliesStarted}、敌方${combatChanged.enemiesAlive}/${combatChanged.enemiesStarted}仍能战斗${combatChanged.fallenAllies?.length ? `；我方倒下：${combatChanged.fallenAllies.join("、")}` : ""}，用时${combatChanged.duration}秒；我方造成${combatChanged.alliesDamage}伤害、治疗${combatChanged.alliesHealing}、获得${combatChanged.alliesShield}护盾；固定消耗粮食${combatChanged.foodCommitted}${combatChanged.totalArmy ? `，${combatChanged.deployedArmy}/${combatChanged.totalArmy}支军队实际出战` : ""}。`);
  if (after.time.day !== before.time.day) parts.push(`日期推进到第${after.time.day}日，行动力刷新为${after.time.actionsRemaining}。`);
  else if (after.time.actionsRemaining !== before.time.actionsRemaining) parts.push(`今日剩余行动${before.time.actionsRemaining}→${after.time.actionsRemaining}。`);
  return [{
    id: `visible:${cycle}:action-summary`,
    time: cycle,
    type: "action_summary",
    subject: { id: "player_village", name: "你的村庄与队伍", side: "left", role: "player_party" },
    environment: { region: "灰谷村", node: inferNode(selected), phase: after.time.phase, day: after.time.day },
    behavior: { kind: selected.kind, key: `${selected.kind}:${shortHash(selected.label)}`, name: selected.label },
    result: { kind: "action_summary", occurred: true, summary: parts.join(" "), components: addedItems.length ? [{ kind: "loot", rarity: "mixed", amount: addedItems.length }] : [], addedItems, removedItems, resourceChanges, buildingChanges, newAllies, warChanges, combat: combatChanged, result: after.result },
    presentation: { visible: true, informationTier: "prominent", hasSource: true, hasTarget: Boolean(combatChanged || buildingChanges.length || warChanges.length), hasNumber: true, attentionZone: "action-result" },
  }];
}

function updateKnowledge(base, selected, after, event) {
  const key = `player_village|${event.environment.node}|${event.behavior.key}`;
  let row = base.find((entry) => entry.key === key);
  const added = !row;
  if (!row) {
    row = {
      id: `border-village-knowledge:${shortHash(key)}`,
      key,
      subject: { id: "player_village", label: "你的村庄与队伍" },
      environment: { region: "灰谷村", node: event.environment.node, dayFirstSeen: after.time.day },
      behavior: { kind: selected.kind, key: event.behavior.key, label: selected.label },
      result: { sampleCount: 0, outcomeDistribution: {}, observations: [] },
      evidenceEventIds: [],
      attributions: [],
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
    schema: "border_village_war_visible_trace_v1",
    runId: shortHash(session.seed),
    profile: { profileId: session.playerProfile.profileId, label: session.playerProfile.label, summary: session.playerProfile.summary },
    phase: session.phase,
    completedCycles: session.cycle,
    finalObservation: compactObservation(GAME.getPlayerObservation(session.gameState)),
    knowledge: session.knowledgeBase.map((row) => ({ behavior: row.behavior.label, node: row.environment.node, sampleCount: row.result.sampleCount, observations: clone(row.result.observations), attributions: row.attributions.map((item) => ({ cause: item.cause, confidence: item.confidence, evidenceEventIds: item.evidenceEventIds, alternativeCauses: item.alternativeCauses, nextTest: item.nextTest })) })),
    cycles: session.history.map((row) => ({
      cycle: row.cycle,
      decisionInput: clone(row.decisionInput),
      selectedActionId: row.action.id,
      action: { label: row.action.label, kind: row.action.kind },
      reasoningChain: row.decisionResponse.reasoningChain,
      visibleResult: row.eventLog.map((event) => ({ id: event.id, summary: event.result.summary })),
      attribution: row.attribution ? { cause: row.attribution.cause, confidence: row.attribution.confidence, evidenceEventIds: row.attribution.evidenceEventIds, alternativeCauses: row.attribution.alternativeCauses, nextTest: row.attribution.nextTest } : null,
      cognitionEvidence: clone(row.cognitionEvidence || []),
      combatProcess: row.combatAudit ? { ran: true, signalCount: row.combatAudit.signalCount } : null,
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

function publicItem(item) { return { name: item.name, rarity: item.rarity, slot: item.slotLabel, power: item.power, baseStats: clone(item.baseStats), affixes: item.affixes.map((affix) => ({ label: affix.label, value: affix.value, percent: affix.percent })) }; }
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
function resourceLabel(key) { return ({ gold: "金币", food: "粮食", population: "实际人口", populationCap: "人口上限" })[key] || key; }
function warLabel(key) { return ({ knownEnemyUnits: "敌军单位", knownBosses: "敌方主将", militiaUnits: "民兵单位" })[key] || key; }
function inferNode(selected) { return selected.kind === "grind" ? "边林讨伐" : selected.kind === "combat" ? "战场" : selected.kind === "build" ? "领地建设" : selected.kind === "recruit" ? "征召所" : selected.kind === "market" ? "集市" : selected.kind === "equipment" || selected.kind === "selection" || selected.kind === "party" ? "队伍与装备" : selected.kind === "event" ? "当日事件" : selected.kind === "time" ? "日程" : "灰谷村"; }
function shortHash(value) { return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12); }
function validate(input) { const session = clone(input); if (!session || session.schema !== SCHEMA) throw new Error(`expected ${SCHEMA}`); return session; }
function clone(value) { return structuredClone(value); }

module.exports = { SCHEMA, createSession, createFinalReplaySession, getPendingRequest, applyDecisionResponse, applyAttributionResponse, exportVisibleTrace };
