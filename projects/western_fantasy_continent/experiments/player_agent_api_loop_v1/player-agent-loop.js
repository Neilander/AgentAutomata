const REGION_1_CORE = require("../../map_progression_lab/map-progression-cognition-core-phase2-midlock");
const REGION_2_CORE = require("../../map_progression_lab/map-progression-chapter2-core");
const RUNTIME = require("../../game_data/player-cognition-v3-event-runtime");
const ADAPTER = require("../../game_data/map-cognition-v3-event-adapter");
const EQUIPMENT = require("../../game_data/equipment-runtime");
const SIGNAL_INTERPRETER = require("./signal-concept-interpreter");
const KNOWLEDGE_RETRIEVAL = require("./knowledge-retrieval");
const PERSISTENT_AGENT = require("./persistent-agent-context");
const PLAYER_PROFILES = require("./player-profiles");

const SCHEMA = "player_agent_api_loop_v1";

function createSession(seed = "player-agent-api-loop", maxCycles = 2, options = {}) {
  const profileState = PLAYER_PROFILES.createProfileState(options.profileId || "open_novice");
  return {
    schema: SCHEMA,
    seed,
    maxCycles,
    cycle: 0,
    phase: "decision",
    gameState: REGION_1_CORE.initialState(seed, { starterVariant: "player_agent_role_wave" }),
    cognitionState: RUNTIME.createState(seed),
    evaluatorState: createEvaluatorState(),
    conceptState: SIGNAL_INTERPRETER.createConceptState(),
    agentContext: PERSISTENT_AGENT.create(`${seed}:profile:${profileState.profileId}`),
    playerProfile: profileState,
    knowledgeBase: [],
    history: [],
    pendingAttribution: null,
    apiCalls: [],
  };
}

function getPendingRequest(sessionInput) {
  const session = cloneAndValidate(sessionInput);
  if (session.phase === "complete") return { type: "complete", cycle: session.cycle };
  if (session.phase === "decision") return buildDecisionRequest(session);
  if (session.phase === "attribution") return buildAttributionRequest(session);
  throw new Error(`unknown phase: ${session.phase}`);
}

function applyDecisionResponse(sessionInput, responseInput) {
  const session = cloneAndValidate(sessionInput);
  if (session.phase !== "decision") throw new Error(`expected decision phase, got ${session.phase}`);

  const knowledgeBeforeAction = clone(session.knowledgeBase);
  const conceptStateBeforeAction = clone(session.conceptState);
  const observation = observeGame(session.gameState);
  const response = normalizeDecisionResponse(responseInput);
  if (!(observation.allowedActions || []).includes(response.action)) {
    throw new Error(`decision agent returned unavailable action: ${response.action}`);
  }

  const emotionBeforeDecision = Number(session.cognitionState.emotion.value);
  const gameStateBefore = clone(session.gameState);
  const decision = {
    id: `ai-decision:${session.cycle + 1}:${response.action}`,
    time: Number(session.gameState.step || 0),
    action: response.action,
    goalId: response.goalId,
    choiceMode: "ai_api_decision",
    environment: {
      region: gameRegion(session.gameState),
      step: observation.step || 0,
      goal: observation.currentGoal || "",
    },
    alternatives: response.alternatives,
    reasoningChain: response.reasoningChain,
    hypothesis: response.hypothesis,
  };

  const afterDecision = RUNTIME.applyDecision(session.cognitionState, decision);
  if (response.hypothesis) {
    const decisionTrace = afterDecision.trace.at(-1);
    if (!decisionTrace?.hypothesisId) {
      throw new Error(`decision hypothesis rejected: ${JSON.stringify(decisionTrace?.decisionValidation || {})}`);
    }
  }
  const emotionAfterDecision = Number(afterDecision.emotion.value);
  const result = runPlayerAction(session.gameState, response.action, afterDecision, session.conceptState, session.evaluatorState);
  if (!result.ok) throw new Error(`game rejected action ${response.action}: ${result.error || "unknown"}`);

  const record = {
    cycle: session.cycle + 1,
    decisionRequest: buildDecisionRequest(session),
    decisionResponse: response,
    action: response.action,
    outcome: result.event.outcome,
    emotionBeforeDecision: round(emotionBeforeDecision),
    emotionAfterDecision: round(emotionAfterDecision),
    emotionAfterEvents: round(result.cognitionState.emotion.value),
    automaticEmotionDelta: round(result.cognitionState.emotion.value - emotionAfterDecision),
    rawEventLog: result.rawEventLog,
    eventLog: result.eventLog,
    conceptInterpretation: result.conceptInterpretation,
    eventTrace: summarizeNewTrace(afterDecision, result.cognitionState),
    gameEvent: result.event,
    attribution: null,
  };

  session.gameState = result.state;
  session.cognitionState = result.cognitionState;
  session.evaluatorState = result.evaluatorState;
  session.conceptState = result.conceptState;
  session.history.push(record);
  const knowledgeIds = updateKnowledgeFromFeedback(session, record, {
    gameStateBefore,
    gameStateAfter: result.state,
  });
  compactKnowledgeBase(session.knowledgeBase);
  record.learningDelta = buildLearningDelta({
    knowledgeBefore: knowledgeBeforeAction,
    knowledgeAfter: session.knowledgeBase,
    conceptStateBefore: conceptStateBeforeAction,
    conceptStateAfter: session.conceptState,
    interpretation: result.conceptInterpretation,
  });
  session.pendingAttribution = {
    cycle: session.cycle + 1,
    historyIndex: session.history.length - 1,
    action: response.action,
    outcome: result.event.outcome,
    eventIds: result.eventLog.map((row) => row.id),
    knowledgeIds,
  };
  session.phase = "attribution";
  session.apiCalls.push({ type: "decision", cycle: session.cycle + 1, response });
  session.agentContext = PERSISTENT_AGENT.completeTurn(session.agentContext);
  return session;
}

function applyAttributionResponse(sessionInput, responseInput) {
  const session = cloneAndValidate(sessionInput);
  if (session.phase !== "attribution" || !session.pendingAttribution) {
    throw new Error(`expected attribution phase, got ${session.phase}`);
  }

  const response = normalizeAttributionResponse(responseInput);
  const pending = session.pendingAttribution;
  const invalidEvidence = response.evidenceEventIds.filter((id) => !pending.eventIds.includes(id));
  if (invalidEvidence.length) throw new Error(`attribution used unknown evidence: ${invalidEvidence.join(", ")}`);
  if (!response.evidenceEventIds.length) throw new Error("attribution must cite at least one visible event id");
  if (!pending.knowledgeIds.includes(response.knowledgeId)) {
    throw new Error(`attribution selected knowledge outside this action: ${response.knowledgeId}`);
  }
  const targetKnowledge = session.knowledgeBase.find((row) => row.id === response.knowledgeId);
  if (!targetKnowledge) throw new Error(`attribution selected unknown knowledge: ${response.knowledgeId}`);
  const unrelatedEvidence = response.evidenceEventIds.filter((id) => !targetKnowledge.evidenceEventIds.includes(id));
  if (unrelatedEvidence.length) {
    throw new Error(`attribution evidence does not support ${response.knowledgeId}: ${unrelatedEvidence.join(", ")}`);
  }

  const attribution = {
    id: `ai-attribution:${pending.cycle}`,
    knowledgeId: response.knowledgeId,
    cause: response.primaryCause,
    confidence: response.confidence,
    evidenceEventIds: response.evidenceEventIds,
    alternativeCauses: response.alternativeCauses,
    nextTest: response.nextTest,
    learnedAfterFeedback: true,
  };
  targetKnowledge.attributions.push(attribution);
  session.history[pending.historyIndex].attribution = attribution;
  session.apiCalls.push({ type: "attribution", cycle: pending.cycle, response });
  session.agentContext = PERSISTENT_AGENT.completeTurn(session.agentContext);
  session.cycle += 1;
  session.pendingAttribution = null;
  session.phase = session.cycle >= session.maxCycles ? "complete" : "decision";
  return session;
}

function buildDecisionRequest(session) {
  const observation = observeGame(session.gameState);
  const goals = session.cognitionState.goals.filter((goal) => goal.id !== "discover_new_capabilities");
  const activeGoalId = goals.some((goal) => goal.id === session.cognitionState.activeGoalId)
    ? session.cognitionState.activeGoalId
    : goals[0]?.id || "grow_and_progress";
  const visibleHypotheses = visiblePlayerHypotheses(session.cognitionState.hypotheses);
  const retrieval = KNOWLEDGE_RETRIEVAL.retrieveKnowledge({
    knowledgeBase: session.knowledgeBase,
    observation,
    goals,
    failureMemories: session.cognitionState.failureMemories,
    hypotheses: visibleHypotheses,
    history: session.history,
  });
  return {
    type: "decision",
    schema: "player_decision_request_v2",
    cycle: session.cycle + 1,
    agentSession: PERSISTENT_AGENT.requestMetadata(session.agentContext, "decision"),
    playerProfile: clone(session.playerProfile),
    instruction: "Choose exactly one allowed action. The code-owned knowledge store has already retrieved the relevant beliefs below. playerProfile contains fallible starting priors, not designer truth; compare them with learned evidence and revise behavior when contradicted. Use only supplied observations and retrieved knowledge. Do not calculate or set emotion.",
    playerState: {
      emotion: round(session.cognitionState.emotion.value),
      activeGoalId,
      goals,
      knowledge: retrieval.knowledge,
      knowledgeStoreCount: session.knowledgeBase.length,
      eventStatisticsCount: session.cognitionState.knowledge.length,
      failureMemories: session.cognitionState.failureMemories,
      hypotheses: visibleHypotheses,
    },
    knowledgeRetrieval: retrieval.audit,
    observation: {
      step: observation.step,
      currentGoal: observation.currentGoal,
      team: observation.team,
      teamSlots: observation.teamSlots,
      roster: observation.roster,
      gear: observation.gear,
      inventory: observation.inventory,
      visibleNodes: observation.visibleNodes,
      optionalOpportunities: observation.optionalOpportunities,
      allowedActions: observation.allowedActions,
    },
    responseContract: {
      action: "one exact value from observation.allowedActions",
      goalId: "one visible goal id",
      reasoningChain: {
        noHypothesis: "one or more factual steps",
        withHypothesis: "must include goal, knowledge or evidence, affordance, comparison, and hypothesis steps",
        item: { kind: "goal|knowledge|evidence|affordance|comparison|hypothesis", evidence: "short factual evidence" },
      },
      alternatives: "at least one legal alternative when hypothesis is non-null",
      hypothesis: {
        nullable: true,
        requiredFields: ["id", "problem", "cause", "resultKind", "target", "verificationScope"],
        verificationScope: "current_action|next_combat",
        nextCombatResultKind: "team_experiment_contribution",
        optionalTargetCondition: {
          metric: "damage|heal|shield|skillCount|damageShare|damageRank",
          operator: ">|>=|<|<=|==",
          value: "number",
        },
      },
    },
  };
}

function buildAttributionRequest(session) {
  const pending = session.pendingAttribution;
  const record = session.history[pending.historyIndex];
  const attributableKnowledge = session.knowledgeBase.filter((row) => pending.knowledgeIds.includes(row.id));
  return {
    type: "attribution",
    schema: "player_attribution_request_v1",
    cycle: pending.cycle,
    agentSession: PERSISTENT_AGENT.requestMetadata(session.agentContext, "attribution"),
    playerProfile: clone(session.playerProfile),
    instruction: "Explain the observed result using only cited visible event ids and existing knowledge. Do not set emotion or PQRA values.",
    action: record.action,
    outcome: record.outcome,
    emotionBeforeAction: record.emotionAfterDecision,
    emotionAfterEvents: record.emotionAfterEvents,
    existingKnowledge: attributableKnowledge,
    eventStatisticsCount: session.cognitionState.knowledge.length,
    visibleEvents: buildAttributionEvidence(record),
    responseContract: {
      knowledgeId: "one exact id from existingKnowledge created by this action",
      primaryCause: "short causal statement",
      confidence: "number from 0 to 1",
      evidenceEventIds: ["one or more exact visible event ids"],
      alternativeCauses: ["optional alternatives"],
      nextTest: "one falsifiable follow-up or empty string",
    },
  };
}

function observeGame(rawState) {
  const state = clone(rawState);
  const observation = gameCore(state).observe(state);
  const slotLabels = ["前排1", "前排2", "后排1", "后排2"];
  const teamSlotById = new Map(state.teamSlots.map((heroId, slotIndex) => [heroId, slotIndex]));
  const rosterById = new Map(state.roster.map((hero) => [hero.id, hero]));
  const roster = (observation.roster || []).map((hero) => {
    const teamSlot = teamSlotById.has(hero.id) ? teamSlotById.get(hero.id) : null;
    return {
      ...hero,
      isActive: teamSlot != null,
      teamSlot,
      slotLabel: teamSlot == null ? null : slotLabels[teamSlot],
      equippedSlots: Object.keys(rosterById.get(hero.id)?.equipment || {}),
    };
  });
  const teamSlots = state.teamSlots.map((heroId, slotIndex) => {
    const hero = roster.find((unit) => unit.id === heroId);
    return {
      slotIndex,
      slotLabel: slotLabels[slotIndex],
      heroId,
      heroName: hero?.name || heroId,
      role: hero?.role || "unknown",
      kind: hero?.kind || "unknown",
      note: hero?.note || "",
    };
  });
  const equipActions = [];
  const inventory = (state.inventory || []).map((item) => {
    const candidates = state.roster.map((hero) => {
      equipActions.push(`equip:${hero.id}:${item.id}`);
      const equippedItem = rosterById.get(hero.id)?.equipment?.[item.slot] || null;
      const fitScore = EQUIPMENT.itemScoreForRole(item, hero.role);
      const currentFitScore = equippedItem ? EQUIPMENT.itemScoreForRole(equippedItem, hero.role) : 0;
      return {
        heroId: hero.id,
        heroName: hero.name,
        role: hero.role,
        fitScore: round(fitScore),
        currentItem: equippedItem?.name || "空",
        currentFitScore: round(currentFitScore),
        fitDelta: round(fitScore - currentFitScore),
      };
    }).sort((a, b) => b.fitDelta - a.fitDelta || b.fitScore - a.fitScore);
    return {
      ...EQUIPMENT.publicItem(item),
      bestFits: candidates.slice(0, 3),
    };
  });
  return {
    ...observation,
    roster,
    teamSlots,
    inventory,
    allowedActions: [...equipActions, ...(observation.allowedActions || [])],
  };
}

function runPlayerAction(rawState, action, cognitionState, conceptState, evaluatorState) {
  if (String(action).startsWith("equip:")) return runEquipAction(rawState, action, cognitionState, conceptState, evaluatorState);
  return runCoreActionWithoutAutoEquip(rawState, action, cognitionState, conceptState, evaluatorState);
}

function runCoreActionWithoutAutoEquip(rawState, action, cognitionState, conceptState, evaluatorStateInput) {
  const before = clone(rawState);
  const core = gameCore(before);
  const evaluatorState = clone(evaluatorStateInput || createEvaluatorState());
  const evaluatorExperiment = evaluatorState.affordanceExperiments.find((row) => row.status === "awaiting_combat") || null;
  const playerHypothesis = pendingPlayerCombatHypothesis(cognitionState, action);
  const activeExperiment = playerHypothesis
    ? (evaluatorExperiment?.heroId === playerHypothesis.target
      ? evaluatorExperiment
      : { id: `player-hypothesis:${playerHypothesis.id}`, heroId: playerHypothesis.target, source: "player" })
    : evaluatorExperiment;
  const beforeItemIds = new Set(allEquipmentItems(before).map((item) => item.id));
  const result = core.applyAction(before, action, { captureVisibleSignals: true });
  if (!result.ok) return { ...result, cognitionState };

  const generatedItems = allEquipmentItems(result.state).filter((item) => !beforeItemIds.has(item.id));
  restoreManualEquipmentState(result.state, rawState, generatedItems);
  result.state.cognition.knowledge = (result.state.cognition.knowledge || [])
    .filter((row) => !String(row).includes("自动换上"));
  const gearAfter = core.gearScore(result.state);
  result.event.gearBefore = core.gearScore(rawState);
  result.event.gearAfter = gearAfter;
  if (result.analysis?.settlement) {
    result.analysis.settlement.gearBefore = core.gearScore(rawState);
    result.analysis.settlement.gearAfter = gearAfter;
    result.analysis.settlement.gearDelta = gearAfter - core.gearScore(rawState);
  }
  result.observation = observeGame(result.state);

  const nodeId = String(action).split(":")[1];
  const node = core.nodes.find((item) => item.id === nodeId);
  const experimentContribution = activeExperiment ? ADAPTER.summarizeExperimentContribution(result, activeExperiment) : null;
  const rawEventLog = ADAPTER.buildMapEventLog(action, result.event, {
    analysis: result.analysis,
    region: gameRegion(result.state),
    nodeType: node?.type || (String(action).startsWith("swap:") ? "team" : "map"),
    activeExperiment,
    heroPresent: activeExperiment ? result.state.teamSlots.includes(activeExperiment.heroId) : null,
    experimentContribution,
  });
  appendMapUnlockEvent(rawEventLog, action, result.event, rawState, result.state);
  rawEventLog.sort((a, b) => a.time - b.time || String(a.id).localeCompare(String(b.id)));
  const interpreted = SIGNAL_INTERPRETER.interpretEventLog(rawEventLog, conceptState, {
    node: nodeId,
    nodeType: node?.type || "map",
  });
  const eventLog = interpreted.events;
  const nextCognitionState = removeEvaluatorScaffolding(RUNTIME.ingestEvents(cognitionState, eventLog));
  return {
    ...result,
    cognitionState: nextCognitionState,
    evaluatorState: updateEvaluatorState(evaluatorState, rawEventLog),
    conceptState: interpreted.state,
    conceptInterpretation: interpreted.interpretation,
    rawEventLog,
    eventLog,
  };
}

function appendMapUnlockEvent(eventLog, action, event, beforeState, afterState) {
  if (!String(action).startsWith("challenge:") || event.outcome !== "win") return;
  const core = gameCore(afterState);
  const beforeIds = new Set(core.observe(beforeState).visibleNodes.map((item) => item.id));
  const unlockedNodes = core.observe(afterState).visibleNodes.filter((item) => !beforeIds.has(item.id)).map((item) => item.id);
  if (!unlockedNodes.length) return;
  eventLog.push({
    id: `map_unlock:${event.node}:${event.step}`,
    time: Math.max(0, Number(event.duration || 0)) + 0.075,
    type: "map_unlock",
    subject: { id: "player_squad", name: "player squad", side: "left", role: "player_squad" },
    environment: { region: gameRegion(afterState), node: event.node, phase: "map_progression" },
    behavior: { kind: "clear_level", key: action, target: event.node },
    result: { kind: "map_unlock", occurred: true, clearedNode: event.node, unlockedNodes },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
  });
}

function runEquipAction(rawState, action, cognitionState, conceptState, evaluatorState) {
  const state = clone(rawState);
  const core = gameCore(state);
  const [, heroId, itemId] = String(action).split(":");
  const hero = state.roster.find((unit) => unit.id === heroId);
  const itemIndex = state.inventory.findIndex((item) => item.id === itemId);
  if (!hero || itemIndex < 0) return { ok: false, state, cognitionState, error: "invalid explicit equip action" };

  const gearBefore = core.gearScore(state);
  const item = state.inventory.splice(itemIndex, 1)[0];
  hero.equipment = { ...(hero.equipment || {}) };
  const replacedItem = hero.equipment[item.slot] || null;
  if (replacedItem) state.inventory.push(replacedItem);
  hero.equipment[item.slot] = item;
  state.step += 1;
  const gearAfter = core.gearScore(state);
  const event = {
    step: state.step,
    action,
    outcome: "equipped",
    heroId,
    heroName: hero.name,
    item: EQUIPMENT.publicItem(item),
    replacedItem: replacedItem ? EQUIPMENT.publicItem(replacedItem) : null,
    gearBefore,
    gearAfter,
  };
  state.history.unshift(event);
  const rawEventLog = buildEquipEventLog(event, gameRegion(state));
  const interpreted = SIGNAL_INTERPRETER.interpretEventLog(rawEventLog, conceptState, {
    environment: "equipment",
  });
  const eventLog = interpreted.events;
  return {
    ok: true,
    state,
    event,
    observation: observeGame(state),
    rawEventLog,
    eventLog,
    conceptState: interpreted.state,
    conceptInterpretation: interpreted.interpretation,
    cognitionState: RUNTIME.ingestEvents(cognitionState, eventLog),
    evaluatorState: clone(evaluatorState || createEvaluatorState()),
  };
}

function createEvaluatorState() {
  return { affordanceExperiments: [] };
}

function updateEvaluatorState(stateInput, eventLog) {
  const state = clone(stateInput || createEvaluatorState());
  state.affordanceExperiments = state.affordanceExperiments || [];
  for (const event of eventLog || []) {
    if (event.result?.kind === "character_unlock") {
      const character = String(event.result.heroId || event.result.character || "").trim();
      if (!character) continue;
      const heroId = character.startsWith("hero_") ? character : `hero_${character}`;
      if (state.affordanceExperiments.some((row) => row.heroId === heroId)) continue;
      state.affordanceExperiments.push({
        id: `team-experiment:${heroId}`,
        kind: "new_character_swap",
        heroId,
        status: "available",
        sourceEventId: event.id,
        selectedAction: null,
        combatEvidence: null,
      });
      continue;
    }
    if (event.result?.kind === "team_changed") {
      const experiment = state.affordanceExperiments.find((row) => row.heroId === event.result.heroId && row.status === "available");
      if (!experiment) continue;
      experiment.status = "awaiting_combat";
      experiment.selectedAction = event.behavior?.key || null;
      experiment.swapEventId = event.id;
      continue;
    }
    if (event.result?.kind === "team_experiment_result") {
      const experiment = state.affordanceExperiments.find((row) => row.id === event.result.experimentId && row.status === "awaiting_combat");
      if (!experiment) continue;
      experiment.status = "resolved";
      experiment.combatEvidence = {
        eventId: event.id,
        node: event.result.node,
        outcome: event.result.outcome,
        heroPresent: event.result.heroPresent !== false,
      };
    }
  }
  return state;
}

function removeEvaluatorScaffolding(state) {
  state.affordanceExperiments = [];
  state.hypotheses = (state.hypotheses || []).filter((row) => !(
    row.action === null
    && row.resultKind === "team_experiment_contribution"
    && String(row.id || "").startsWith("verify-team-experiment:")
  ));
  return state;
}

function visiblePlayerHypotheses(rows) {
  return (rows || []).filter((row) => row.origin === "player" || row.action);
}

function pendingPlayerCombatHypothesis(state, action) {
  return (state?.hypotheses || []).find((row) => row.origin === "player"
    && row.status === "pending"
    && row.resultKind === "team_experiment_contribution"
    && ((row.verificationScope === "next_combat" && row.settleOnEventKind === "team_experiment_result")
      || (row.verificationScope === "current_action" && row.action === action))
    && row.target) || null;
}

function buildEquipEventLog(event, region = "region_1") {
  const expectationKey = `equip_action:${event.step}:${event.item.id}`;
  const subject = { id: "player", name: "player", role: "player" };
  const environment = { region, phase: "equipment", heroId: event.heroId };
  const behavior = { kind: "equip_item", key: event.action, target: event.heroId };
  return [{
    id: `${expectationKey}:start`,
    time: 0,
    type: "action_start",
    subject,
    environment,
    behavior,
    result: { kind: "action_started", occurred: true },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
    process: { decisionCount: 0, reactiveCount: 0, mechanicalSeconds: 0 },
    expectation: { phase: "open", key: expectationKey, deadline: "action_end" },
    directResult: false,
    learn: false,
  }, {
    id: `${expectationKey}:result`,
    time: 0.05,
    type: "equipment_change",
    subject,
    environment,
    behavior,
    result: {
      kind: "item_equipped",
      occurred: true,
      heroId: event.heroId,
      heroName: event.heroName,
      itemId: event.item.id,
      itemName: event.item.name,
      before: event.gearBefore,
      after: event.gearAfter,
      amount: event.gearAfter - event.gearBefore,
    },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasNumber: true, hasAnimation: true },
  }, {
    id: `${expectationKey}:summary`,
    time: 0.08,
    type: "action_summary",
    subject,
    environment,
    behavior,
    result: {
      kind: "action_summary",
      occurred: true,
      boundary: "normal_end",
      observedPower: event.gearAfter,
      components: [{ kind: "item_equipped", amount: event.gearAfter - event.gearBefore }],
    },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasNumber: true, hasAnimation: false },
    process: { decisionCount: 0, reactiveCount: 0, mechanicalSeconds: 0.08 },
    expectation: { phase: "close", key: expectationKey, deadline: "action_end" },
    directResult: false,
  }];
}

function restoreManualEquipmentState(nextState, previousState, generatedItems) {
  const previousById = new Map(previousState.roster.map((unit) => [unit.id, unit]));
  nextState.roster = nextState.roster.map((unit) => ({
    ...unit,
    equipment: clone(previousById.get(unit.id)?.equipment || {}),
  }));
  nextState.inventory = [...clone(previousState.inventory || []), ...clone(generatedItems)];
}

function allEquipmentItems(state) {
  return [
    ...(state.inventory || []),
    ...(state.roster || []).flatMap((unit) => Object.values(unit.equipment || {})),
  ];
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
    alternatives: Array.isArray(response.alternatives) ? response.alternatives : [],
    hypothesis: normalizeDecisionHypothesis(response.hypothesis),
  };
}

function createChapter2Session(seed = "player-agent-api-loop-chapter2", maxCycles = 24, priorPlayerState = null, options = {}) {
  const session = createSession(seed, maxCycles, options);
  session.gameState = REGION_2_CORE.initialState(seed);
  if (priorPlayerState) inheritPriorPlayerState(session, priorPlayerState);
  return session;
}

function createChapter2SessionFromChapter1(chapter1Input, maxCycles = 24, seed = null) {
  const source = cloneAndValidate(chapter1Input);
  if (source.phase === "attribution" || source.pendingAttribution) {
    throw new Error("cannot transition chapters while attribution is pending");
  }
  const chapter2Seed = String(seed || `${source.seed}:chapter2`);
  const session = createChapter2Session(chapter2Seed, maxCycles, null, {
    profileId: source.playerProfile.profileId,
  });
  session.cognitionState = clone(source.cognitionState);
  session.evaluatorState = createEvaluatorState();
  session.conceptState = clone(source.conceptState);
  session.agentContext = clone(source.agentContext);
  session.playerProfile = clone(source.playerProfile);
  session.knowledgeBase = clone(source.knowledgeBase);
  session.chapterTransition = {
    schema: "player_chapter_transition_v1",
    fromSessionSeed: source.seed,
    toSessionSeed: chapter2Seed,
    inheritedEmotion: round(source.cognitionState.emotion.value),
    inheritedKnowledgeCount: source.knowledgeBase.length,
    inheritedConceptCount: source.conceptState.concepts.length,
    inheritedAgentSessionId: source.agentContext.id,
  };
  return session;
}

function inheritPriorPlayerState(session, prior) {
  const emotion = Number(prior.emotion);
  if (Number.isFinite(emotion)) session.cognitionState.emotion.value = emotion;
  if (Array.isArray(prior.goals) && prior.goals.length) {
    session.cognitionState.goals = clone(prior.goals);
    session.cognitionState.activeGoalId = prior.activeGoalId || prior.goals[0].id;
  }
  session.cognitionState.failureMemories = clone(prior.failureMemories || []);
  session.cognitionState.hypotheses = clone(prior.hypotheses || []).filter((row) => row.status !== "pending");
  session.knowledgeBase = (prior.knowledge || []).map((row, index) => normalizeInheritedKnowledge(row, index));
}

function normalizeInheritedKnowledge(row, index) {
  const latest = row.result?.latestObservation || row.result?.observations?.at?.(-1) || {};
  const result = {
    sampleCount: Number(row.result?.sampleCount || 1),
    outcomeDistribution: clone(row.result?.outcomeDistribution || {}),
    observations: row.result?.observations ? clone(row.result.observations) : [clone(latest)],
  };
  const attributions = clone(row.attributions || (row.latestAttribution ? [row.latestAttribution] : []));
  return {
    id: row.id || `knowledge:${index + 1}`,
    key: row.key || `inherited|${row.id || index + 1}`,
    subject: clone(row.subject || {}),
    environment: clone(row.environment || {}),
    behavior: clone(row.behavior || {}),
    result,
    evidenceEventIds: clone(row.evidenceEventIds || []),
    attributions,
  };
}

function normalizeDecisionHypothesis(input) {
  if (input === null || input === undefined) return null;
  if (typeof input !== "object" || Array.isArray(input)) throw new Error("decision hypothesis must be an object or null");
  const requiredText = ["id", "problem", "cause", "resultKind", "target", "verificationScope"];
  for (const field of requiredText) {
    if (typeof input[field] !== "string" || !input[field].trim()) {
      throw new Error(`decision hypothesis requires ${field}`);
    }
  }
  if (!["current_action", "next_combat"].includes(input.verificationScope)) {
    throw new Error(`unsupported hypothesis verificationScope: ${input.verificationScope}`);
  }
  if (input.verificationScope === "next_combat" && input.resultKind !== "team_experiment_contribution") {
    throw new Error("next_combat hypothesis resultKind must be team_experiment_contribution");
  }
  const targetCondition = normalizeHypothesisTargetCondition(input.targetCondition);
  if (input.verificationScope === "next_combat" && !targetCondition) {
    throw new Error("next_combat hypothesis requires a measurable targetCondition");
  }
  return {
    id: input.id.trim(),
    problem: input.problem.trim(),
    cause: input.cause.trim(),
    resultKind: input.resultKind.trim(),
    target: input.target.trim(),
    verificationScope: input.verificationScope,
    targetCondition,
  };
}

function normalizeHypothesisTargetCondition(input) {
  if (input === null || input === undefined) return null;
  if (typeof input !== "object" || Array.isArray(input)) throw new Error("hypothesis targetCondition must be an object");
  const allowedMetrics = new Set(["damage", "heal", "shield", "skillCount", "damageShare", "damageRank"]);
  const allowedOperators = new Set([">", ">=", "<", "<=", "=="]);
  if (!allowedMetrics.has(input.metric)) throw new Error(`unsupported hypothesis metric: ${input.metric}`);
  if (!allowedOperators.has(input.operator)) throw new Error(`unsupported hypothesis operator: ${input.operator}`);
  const value = Number(input.value);
  if (!Number.isFinite(value)) throw new Error("hypothesis targetCondition value must be finite");
  return { metric: input.metric, operator: input.operator, value };
}

function normalizeAttributionResponse(input) {
  const response = typeof input === "string" ? JSON.parse(input) : clone(input);
  if (!response || typeof response.primaryCause !== "string" || !response.primaryCause.trim()) {
    throw new Error("attribution response requires primaryCause");
  }
  if (typeof response.knowledgeId !== "string" || !response.knowledgeId) {
    throw new Error("attribution response requires knowledgeId");
  }
  return {
    knowledgeId: response.knowledgeId,
    primaryCause: response.primaryCause.trim(),
    confidence: clamp(response.confidence, 0, 1),
    evidenceEventIds: Array.isArray(response.evidenceEventIds) ? response.evidenceEventIds.map(String) : [],
    alternativeCauses: Array.isArray(response.alternativeCauses) ? response.alternativeCauses.map(String) : [],
    nextTest: typeof response.nextTest === "string" ? response.nextTest : "",
  };
}

function summarizeNewTrace(beforeState, afterState) {
  return afterState.trace.slice(beforeState.trace.length).map((row) => ({
    eventId: row.eventId,
    type: row.type,
    accepted: row.accepted,
    H: row.H,
    result: row.tuple?.result?.kind || null,
    processEmotion: round(row.processEmotion),
    acquiredEmotion: round(row.acquiredEmotion),
    expectationEmotion: round(row.expectationEmotion),
    EVerify: Number(row.EVerify || 0),
    hypothesisId: row.hypothesisId || null,
    hypothesisEvidence: row.hypothesisEvidence || [],
    hypothesisVerification: row.hypothesisVerification || [],
    emotionDelta: round(row.emotionDelta),
    emotionBefore: round(row.emotionBefore),
    emotionAfter: round(row.emotionAfter),
    learningOrder: row.learningOrder,
  }));
}

function summarizeRuntimeKnowledge(row) {
  return {
    pattern: row.pattern,
    samples: row.samples,
    confidence: round(row.confidence),
    meanUtility: round(row.meanUtility),
    estimatedSuccess: round(row.estimatedSuccess),
  };
}

function selectRuntimeKnowledge(rows, limit) {
  return [...(rows || [])]
    .sort((a, b) => knowledgePriority(b) - knowledgePriority(a))
    .slice(0, limit)
    .map(summarizeRuntimeKnowledge);
}

function updateKnowledgeFromFeedback(session, record, context) {
  if (record.action.startsWith("challenge:")) return learnFromChallenge(session.knowledgeBase, record, context);
  if (record.action.startsWith("equip:")) return learnFromEquipment(session.knowledgeBase, record, context);
  if (record.action.startsWith("swap:")) return learnFromTeamSwap(session.knowledgeBase, record, context);
  return [];
}

function learnFromChallenge(knowledgeBase, record, context) {
  const before = context.gameStateBefore;
  const after = context.gameStateAfter;
  const core = gameCore(after);
  const region = gameRegion(after);
  const node = record.gameEvent.node || record.action.split(":")[1];
  const teamMembers = before.teamSlots.map((id) => unitRef(before.roster.find((unit) => unit.id === id))).filter(Boolean);
  const resultEventId = record.eventLog.find((row) => row.type === "combat_result")?.id;
  const summaryEventId = record.eventLog.find((row) => row.type === "action_summary")?.id;
  const unlockEventId = record.eventLog.find((row) => row.type === "map_unlock")?.id;
  const characterUnlockEventId = record.eventLog.find((row) => row.type === "character_unlock")?.id;
  const lootEventIds = record.eventLog.filter((row) => row.type === "loot").map((row) => row.id);
  const unlockedNodes = core.observe(after).visibleNodes
    .filter((item) => !core.observe(before).visibleNodes.some((old) => old.id === item.id))
    .map((item) => item.id);
  const drops = (record.gameEvent.loot || []).map((item) => ({
    id: item.id,
    name: item.name,
    slot: item.slot,
    rarity: item.rarity,
    level: item.level,
  }));
  const sharedEnvironment = { region, node, phase: "combat", team: teamMembers.map((unit) => unit.id) };
  const patternEnvironment = { region, encounterBand: encounterBand(node), phase: "combat_pattern" };
  const ids = [];

  const encounter = mergeKnowledgeObservation(knowledgeBase, {
    subject: { id: "player_squad", members: teamMembers },
    environment: { ...sharedEnvironment, phase: "encounter" },
    behavior: { kind: "challenge_level", key: record.action, target: node },
  }, {
    outcome: record.outcome,
    duration: Number(record.gameEvent.duration || 0),
    survivors: record.gameEvent.survivors || null,
    resolution: record.gameEvent.resolution || null,
    firstClear: Boolean(record.gameEvent.firstClear),
  }, [resultEventId, summaryEventId].filter(Boolean));
  ids.push(encounter.id);

  if (record.outcome === "win") {
    if (unlockEventId && unlockedNodes.length) ids.push(mergeKnowledgeObservation(knowledgeBase, {
      subject: { id: "player_squad", members: teamMembers },
      environment: { region, node, phase: "map_progression" },
      behavior: { kind: "clear_level", key: record.action, target: node },
    }, {
      outcome: "win",
      unlockedNodes,
      clearedNode: node,
    }, [unlockEventId]).id);

    ids.push(mergeKnowledgeObservation(knowledgeBase, {
      subject: { id: "player_squad", members: teamMembers },
      environment: { region, node, phase: "loot_drop" },
      behavior: { kind: "clear_level", key: record.action, target: node },
    }, {
      outcome: "loot_obtained",
      drops,
      inventoryCountBefore: before.inventory.length,
      inventoryCountAfter: after.inventory.length,
      equippedPowerBefore: core.gearScore(before),
      equippedPowerAfter: core.gearScore(after),
      powerChanged: core.gearScore(before) !== core.gearScore(after),
    }, [resultEventId, ...lootEventIds].filter(Boolean)).id);

    if (characterUnlockEventId && record.gameEvent.characterUnlock) ids.push(mergeKnowledgeObservation(knowledgeBase, {
      subject: { id: "player_squad", members: teamMembers },
      environment: { region, node, phase: "character_reward" },
      behavior: { kind: "clear_level", key: record.action, target: node },
    }, {
      outcome: "character_unlocked",
      character: record.gameEvent.characterUnlock,
      activeTeamChanged: false,
    }, [characterUnlockEventId]).id);
  }

  const totalDamage = (record.gameEvent.contributions || []).reduce((sum, row) => sum + Number(row.damage || 0), 0);

  const fieldEvents = record.eventLog.filter((row) => row.type === "field" || row.result?.kind === "field_effect");
  if (fieldEvents.length) {
    const field = record.gameEvent.fieldEffect || { id: fieldEvents[0].environment?.fieldEffect || "unknown", name: fieldEvents[0].behavior?.name || "场地效果" };
    ids.push(mergeKnowledgeObservation(knowledgeBase, {
      subject: { id: `field:${field.id || "unknown"}`, name: field.name || "场地效果" },
      environment: { region, node, phase: "field_rule" },
      behavior: { kind: "affect_battle", key: `field:${field.id || "unknown"}`, target: "both_teams" },
    }, {
      outcome: "field_effect_observed",
      rule: field.rule || "",
      signalCount: fieldEvents.length,
      visibleSignals: [...new Set(fieldEvents.map((row) => row.behavior?.name || row.result?.kind).filter(Boolean))].slice(0, 8),
    }, fieldEvents.map((row) => row.id)).id);
  }
  const playerActorEffects = aggregateActorEffects(record.eventLog, "left");
  (record.gameEvent.contributions || []).forEach((contribution) => {
    const unit = findUnitByContribution(before.roster, contribution);
    const effects = playerActorEffects.find((row) => row.name === contribution.name) || emptyActorEffects();
    const evidence = combatEvidenceForSubject(record.eventLog, unit?.id, contribution.name);
    ids.push(mergeKnowledgeObservation(knowledgeBase, {
      subject: unitRef(unit) || { id: `unit:${contribution.name}`, name: contribution.name, role: contribution.role },
      environment: patternEnvironment,
      behavior: { kind: "combat_participation", key: `fight:${unit?.id || contribution.name}`, target: "enemy_squad" },
    }, {
      outcome: "combat_contribution",
      damage: round(contribution.damage),
      damageShare: totalDamage ? round(contribution.damage / totalDamage) : 0,
      damageRank: 1 + (record.gameEvent.contributions || [])
        .filter((other) => Number(other.damage || 0) > Number(contribution.damage || 0)).length,
      teamDamage: round(totalDamage),
      healing: round(effects.healing),
      shielding: round(effects.shielding),
      kills: effects.kills,
      skillCasts: effects.skillCasts,
    }, evidence).id);
  });

  ids.push(mergeKnowledgeObservation(knowledgeBase, {
    subject: { id: "player_squad", members: teamMembers },
    environment: sharedEnvironment,
    behavior: { kind: "attack_enemy_squad", key: `team_damage:${node}` },
  }, {
    outcome: "damage_profile",
    ...(record.gameEvent.performance || {}),
    totalDamage: round(totalDamage),
  }, record.eventLog.filter((row) => row.type === "damage" && row.subject?.side === "left").map((row) => row.id)).id);

  ids.push(mergeKnowledgeObservation(knowledgeBase, {
    subject: { id: `enemy_squad:${node}`, name: "enemy squad" },
    environment: { ...sharedEnvironment, team: undefined },
    behavior: { kind: "attack_player_squad", key: `enemy_attack:${node}`, target: "player_squad" },
  }, {
    outcome: "threat_profile",
    ...(record.gameEvent.diagnosis || {}),
    enemySurvivorCount: Number(record.gameEvent.survivors?.enemy || 0),
  }, record.eventLog.filter((row) => row.type === "damage" && row.subject?.side === "right").map((row) => row.id)).id);

  const enemyConcepts = aggregateEnemyConcepts(record.eventLog, record.conceptInterpretation).sort((a, b) => b.damage - a.damage);
  const totalEnemyDamage = enemyConcepts.reduce((sum, row) => sum + row.damage, 0);
  enemyConcepts.forEach((enemy, rankIndex) => {
    const damageShare = totalEnemyDamage ? enemy.damage / totalEnemyDamage : 0;
    if (damageShare < 0.25 && enemy.kills === 0) return;
    ids.push(mergeKnowledgeObservation(knowledgeBase, {
      subject: { id: `concept:${enemy.conceptId}`, name: enemy.name, conceptId: enemy.conceptId },
      environment: patternEnvironment,
      behavior: { kind: "fight_player_squad", key: `enemy_concept_threat:${enemy.conceptId}`, target: "player_squad" },
    }, {
      outcome: "enemy_concept_threat",
      observedUnitCount: enemy.observedUnitCount,
      damage: round(enemy.damage),
      damageShare: round(damageShare),
      threatRank: rankIndex + 1,
      healing: round(enemy.healing),
      shielding: round(enemy.shielding),
      kills: enemy.kills,
      skillCasts: enemy.skillCasts,
      observedTargets: [...enemy.damageTargets],
      supportTargets: [...enemy.supportTargets],
    }, enemy.eventIds).id);
  });

  return ids;
}

function learnFromEquipment(knowledgeBase, record, context) {
  const event = record.gameEvent;
  const hero = context.gameStateAfter.roster.find((unit) => unit.id === event.heroId);
  const region = gameRegion(context.gameStateAfter);
  const row = mergeKnowledgeObservation(knowledgeBase, {
    subject: { id: "player", role: "player" },
    environment: { region, phase: "equipment", hero: unitRef(hero) },
    behavior: { kind: "equip_item", key: record.action, itemId: event.item?.id, target: event.heroId },
  }, {
    outcome: "item_equipped",
    item: event.item,
    replacedItem: event.replacedItem || null,
    equippedPowerBefore: event.gearBefore,
    equippedPowerAfter: event.gearAfter,
    powerDelta: event.gearAfter - event.gearBefore,
  }, record.eventLog.map((item) => item.id));
  return [row.id];
}

function learnFromTeamSwap(knowledgeBase, record, context) {
  const core = gameCore(context.gameStateAfter);
  const region = gameRegion(context.gameStateAfter);
  const row = mergeKnowledgeObservation(knowledgeBase, {
    subject: { id: "player", role: "player" },
    environment: { region, phase: "team_management" },
    behavior: { kind: "swap_team_member", key: record.action },
  }, {
    outcome: "team_changed",
    teamBefore: record.gameEvent.teamBefore,
    teamAfter: record.gameEvent.teamAfter,
    equippedPowerBefore: core.gearScore(context.gameStateBefore),
    equippedPowerAfter: core.gearScore(context.gameStateAfter),
  }, record.eventLog.map((item) => item.id));
  return [row.id];
}

function aggregateActorEffects(eventLog, side) {
  const rows = new Map();
  for (const event of eventLog) {
    if (event.subject?.side !== side || !event.subject?.id) continue;
    const row = rows.get(event.subject.id) || {
      id: event.subject.id,
      name: event.subject.name || event.subject.id,
      role: event.subject.role || "unknown",
      damage: 0,
      healing: 0,
      shielding: 0,
      kills: 0,
      skillCasts: 0,
      damageTargets: new Set(),
      supportTargets: new Set(),
      eventIds: [],
    };
    if (event.type === "damage") row.damage += Number(event.result?.amount || 0);
    if (event.type === "heal") row.healing += Number(event.result?.amount || 0);
    if (event.type === "shield") row.shielding += Number(event.result?.amount || 0);
    if (event.type === "death" && event.result?.target?.side !== side) row.kills += 1;
    if (event.type === "skill") row.skillCasts += 1;
    if (event.type === "damage" && event.result?.target?.name) row.damageTargets.add(event.result.target.name);
    if (["heal", "shield"].includes(event.type) && event.result?.target?.name) row.supportTargets.add(event.result.target.name);
    row.eventIds.push(event.id);
    rows.set(event.subject.id, row);
  }
  return [...rows.values()];
}

function aggregateEnemyConcepts(eventLog, interpretation = {}) {
  const concepts = new Map();
  for (const actor of aggregateActorEffects(eventLog, "right")) {
    const conceptId = actor.id.startsWith("concept:") ? actor.id.slice("concept:".length) : "enemy_minion_generic";
    const row = concepts.get(conceptId) || {
      conceptId,
      name: actor.name || "普通小怪",
      observedUnitCount: Number(interpretation.entityCounts?.[conceptId] || 0),
      damage: 0,
      healing: 0,
      shielding: 0,
      kills: 0,
      skillCasts: 0,
      damageTargets: new Set(),
      supportTargets: new Set(),
      eventIds: [],
    };
    row.damage += actor.damage;
    row.healing += actor.healing;
    row.shielding += actor.shielding;
    row.kills += actor.kills;
    row.skillCasts += actor.skillCasts;
    actor.damageTargets.forEach((target) => row.damageTargets.add(target));
    actor.supportTargets.forEach((target) => row.supportTargets.add(target));
    row.eventIds.push(...actor.eventIds);
    concepts.set(conceptId, row);
  }
  return [...concepts.values()];
}

function emptyActorEffects() {
  return { damage: 0, healing: 0, shielding: 0, kills: 0, skillCasts: 0 };
}

function mergeKnowledgeObservation(knowledgeBase, tuple, observation, evidenceEventIds) {
  const key = knowledgeKey(tuple);
  let row = knowledgeBase.find((item) => item.key === key);
  if (!row) {
    row = {
      id: `knowledge:${nextKnowledgeId(knowledgeBase)}`,
      key,
      subject: tuple.subject,
      environment: tuple.environment,
      behavior: tuple.behavior,
      result: {
        sampleCount: 0,
        outcomeDistribution: {},
        observations: [],
      },
      evidenceEventIds: [],
      attributions: [],
    };
    knowledgeBase.push(row);
  }
  row.result.sampleCount += 1;
  if (observation.outcome) {
    row.result.outcomeDistribution[observation.outcome] = (row.result.outcomeDistribution[observation.outcome] || 0) + 1;
  }
  row.result.observations.push(observation);
  if (row.result.observations.length > 8) row.result.observations.splice(0, row.result.observations.length - 8);
  row.evidenceEventIds.push(...evidenceEventIds.filter((id) => id && !row.evidenceEventIds.includes(id)));
  return row;
}

function nextKnowledgeId(knowledgeBase) {
  return knowledgeBase.reduce((max, row) => {
    const value = Number(String(row.id || "").split(":").pop());
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0) + 1;
}

function knowledgeKey(tuple) {
  return [
    tuple.subject?.id || "unknown_subject",
    tuple.environment?.region || "unknown_region",
    tuple.environment?.node || tuple.environment?.encounterBand || "unknown_environment",
    tuple.environment?.phase || "unknown_phase",
    tuple.behavior?.kind || "unknown_behavior",
    tuple.behavior?.key || "unknown_key",
  ].join("|");
}

function compactKnowledgeBase(knowledgeBase) {
  const lowLevelKinds = new Set(["skill_cast", "skill_effect", "damage"]);
  const lowLevelOutcomes = new Set(["observed_combat_effect", "enemy_threat_contribution"]);
  for (let index = knowledgeBase.length - 1; index >= 0; index -= 1) {
    const latest = knowledgeBase[index].result?.observations?.at(-1);
    if (lowLevelKinds.has(knowledgeBase[index].behavior?.kind) || lowLevelOutcomes.has(latest?.outcome)) {
      knowledgeBase.splice(index, 1);
    }
  }
}

function buildLearningDelta({ knowledgeBefore, knowledgeAfter, conceptStateBefore, conceptStateAfter, interpretation }) {
  const beforeKnowledgeByKey = new Map((knowledgeBefore || []).map((row) => [row.key, row]));
  const addedKnowledge = [];
  const updatedKnowledge = [];
  for (const row of knowledgeAfter || []) {
    const before = beforeKnowledgeByKey.get(row.key);
    if (!before) {
      addedKnowledge.push(summarizeCanonicalKnowledge(row));
      continue;
    }
    if (knowledgeRevision(before) !== knowledgeRevision(row)) {
      updatedKnowledge.push({
        ...summarizeCanonicalKnowledge(row),
        previousSampleCount: Number(before.result?.sampleCount || 0),
      });
    }
  }

  const beforeConceptIds = new Set((conceptStateBefore?.concepts || []).map((row) => row.id));
  const addedConcepts = (conceptStateAfter?.concepts || [])
    .filter((row) => !beforeConceptIds.has(row.id))
    .map((row) => ({ id: row.id, label: row.label, definition: row.definition }));
  const beforeCandidates = conceptStateBefore?.candidates || {};
  const changedCandidates = Object.entries(conceptStateAfter?.candidates || {})
    .filter(([key, value]) => JSON.stringify(beforeCandidates[key] || null) !== JSON.stringify(value))
    .map(([, value]) => clone(value));

  const matched = new Map();
  for (const decision of interpretation?.decisions || []) {
    const row = matched.get(decision.conceptId) || {
      conceptId: decision.conceptId,
      label: decision.conceptLabel,
      observedEntityCount: 0,
      evidenceEventIds: [],
    };
    row.observedEntityCount += 1;
    for (const evidence of decision.visibleEvidence || []) {
      if (evidence.eventId && !row.evidenceEventIds.includes(evidence.eventId)) row.evidenceEventIds.push(evidence.eventId);
    }
    matched.set(decision.conceptId, row);
  }

  return {
    addedKnowledge,
    updatedKnowledge,
    matchedConcepts: [...matched.values()],
    addedConcepts,
    changedConceptCandidates: changedCandidates,
    conceptLibraryChanged: addedConcepts.length > 0,
    knowledgeCountBefore: (knowledgeBefore || []).length,
    knowledgeCountAfter: (knowledgeAfter || []).length,
  };
}

function summarizeCanonicalKnowledge(row) {
  return {
    id: row.id,
    subject: clone(row.subject),
    environment: clone(row.environment),
    behavior: clone(row.behavior),
    latestResult: clone(row.result?.observations?.at(-1) || null),
    sampleCount: Number(row.result?.sampleCount || 0),
    evidenceEventIds: clone(row.evidenceEventIds || []),
  };
}

function knowledgeRevision(row) {
  return JSON.stringify({
    sampleCount: row.result?.sampleCount,
    latest: row.result?.observations?.at(-1),
    evidenceEventIds: row.evidenceEventIds,
  });
}

function encounterBand(node) {
  if (node === "r2_entry") return "region_2_entry";
  if (/^r2_(knight|priest)_rescue$/.test(node)) return "region_2_rescue";
  if (/^r2_(shield|flag)_trial$/.test(node)) return "region_2_field_trial";
  if (node === "r2_confluence") return "region_2_confluence";
  if (node === "r2_boss") return "region_2_boss";
  if (/^r1_main_[1-4]$/.test(node)) return "region_1_early_main";
  if (/^r1_main_[5-8]$/.test(node)) return "region_1_mid_main";
  if (/^r1_main_(9|10)$/.test(node)) return "region_1_late_main";
  if (node === "r1_boss") return "region_1_boss";
  return "region_1_optional_branch";
}

function gameCore(state) {
  return state?.schema === "map_cognition_chapter2_v1" ? REGION_2_CORE : REGION_1_CORE;
}

function gameRegion(state) {
  return state?.schema === "map_cognition_chapter2_v1" ? "region_2" : "region_1";
}

function unitRef(unit) {
  if (!unit) return null;
  return { id: unit.id, name: unit.name, role: unit.role, kind: unit.kind };
}

function findUnitByContribution(roster, contribution) {
  return roster.find((unit) => unit.name === contribution.name)
    || roster.find((unit) => unit.role === contribution.role);
}

function combatEvidenceForSubject(eventLog, subjectId, subjectName) {
  return eventLog.filter((row) => (
    (subjectId && row.subject?.id === subjectId)
    || (subjectName && row.subject?.name === subjectName)
  )).map((row) => row.id);
}

function knowledgePriority(row) {
  const outcomeWeight = Number(row.outcomeTrials || 0) > 0 ? 2 : 0;
  return outcomeWeight
    + Number(row.confidence || 0)
    + Math.min(1, Math.abs(Number(row.meanUtility || 0)) * 4)
    + Math.min(0.5, Number(row.count || 0) / 20);
}

function summarizeEvent(row) {
  return {
    id: row.id,
    time: row.time,
    type: row.type,
    subject: row.subject?.name || row.subject?.id || null,
    behavior: row.behavior?.name || row.behavior?.kind || null,
    result: compactResult(row.result),
  };
}

function buildAttributionEvidence(record) {
  const alwaysKeep = new Set(["combat_result", "loot_outcome", "loot", "equipment_change", "map_unlock", "character_unlock", "action_summary"]);
  const traceById = new Map(record.eventTrace.map((row) => [row.eventId, row]));
  const salient = record.eventLog.filter((event) => {
    const trace = traceById.get(event.id);
    if (alwaysKeep.has(event.type)) return true;
    if (!trace?.accepted) return false;
    return event.type === "death"
      || Number(trace.H || 0) >= 0.2
      || Math.abs(Number(trace.emotionDelta || 0)) >= 0.02;
  });
  return salient.slice(-18).map((event) => {
    const trace = traceById.get(event.id);
    return {
      ...summarizeEvent(event),
      H: round(trace?.H),
      emotionDelta: round(trace?.emotionDelta),
    };
  });
}

function compactResult(result = {}) {
  const value = {
    kind: result.kind || null,
    occurred: result.occurred !== false,
  };
  for (const key of ["amount", "before", "after", "rarity", "itemName", "equipmentLevel", "baseStats", "affixCount", "observedPower", "boundary", "firstClear", "clearedNode", "unlockedNodes", "character", "heroId", "characterName"]) {
    if (result[key] != null) value[key] = result[key];
  }
  if (result.target) value.target = result.target.name || result.target.id || null;
  if (result.survivors) value.survivors = result.survivors;
  if (Array.isArray(result.components)) value.components = result.components.map((row) => ({ kind: row.kind, amount: row.amount }));
  return value;
}

function cloneAndValidate(input) {
  const session = clone(input);
  if (!session || session.schema !== SCHEMA) throw new Error("invalid player agent loop session");
  if (!session.conceptState) session.conceptState = SIGNAL_INTERPRETER.createConceptState();
  session.playerProfile = PLAYER_PROFILES.ensureProfileState(session.playerProfile, "open_novice");
  session.agentContext = PERSISTENT_AGENT.ensure(
    session.agentContext,
    `${session.seed}:profile:${session.playerProfile.profileId}`,
  );
  if (!session.evaluatorState) {
    session.evaluatorState = {
      affordanceExperiments: clone(session.cognitionState?.affordanceExperiments || []),
    };
  }
  session.cognitionState = removeEvaluatorScaffolding(session.cognitionState);
  return session;
}

function clone(value) { return structuredClone(value); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

module.exports = {
  SCHEMA,
  applyAttributionResponse,
  applyDecisionResponse,
  createChapter2Session,
  createChapter2SessionFromChapter1,
  createSession,
  getPendingRequest,
};
