const {
  selectReceivedCandidatesForOrganizer,
} = require("./battle-information-parser");

const SCHEMA = "other_event_to_type1_router_v8";

const ROUTE_TARGETS = Object.freeze({
  causalKnowledge: "canonical_causal_knowledge",
  probabilityLedger: "player_cognition_probability_ledger",
});

const CHARACTER_COGNITION_SIGNAL_TYPES = new Set([
  "ally_damage_contribution",
  "ally_heal",
  "ally_shield",
  "ally_shieldBreak",
  "ally_visible_status",
  "ally_visible_skill",
  "ally_defeated",
]);

const PERSISTENT_FACT_TYPES = new Set([
  "visible_field_effect",
  "visible_loot",
  "visible_map_unlock",
  "visible_character_unlock",
]);

const INTERNAL_ONLY_TYPES = new Set([
  "action_summary",
  "team_experiment_result",
]);

const ENEMY_BEHAVIOR_TYPES = new Set([
  "enemy_heal",
  "enemy_shield",
  "enemy_shieldBreak",
  "enemy_visible_status",
  "enemy_visible_skill",
]);

function organizeReceivedBattleInformation(rawEventsInput, options = {}) {
  const rawEvents = clone(rawEventsInput || []);
  const reception = selectReceivedCandidatesForOrganizer(rawEvents, options);
  const episodeId = String(options.episodeId || options.seed || "battle_episode");
  const selectedIds = new Set(reception.selected.map((candidate) => candidate.publicId));
  const selectedWithPersistentFacts = uniqueCandidates([
    ...reception.selected,
    ...reception.candidates.filter((candidate) => PERSISTENT_FACT_TYPES.has(candidate.type)),
  ]);
  const selectedOtherEvents = selectedWithPersistentFacts.filter((candidate) => (
    !CHARACTER_COGNITION_SIGNAL_TYPES.has(candidate.type)
  ));
  const divertedCharacterSignals = reception.selected.filter((candidate) => (
    CHARACTER_COGNITION_SIGNAL_TYPES.has(candidate.type)
  ));
  const persistentFactsPromoted = selectedOtherEvents.filter((candidate) => (
    PERSISTENT_FACT_TYPES.has(candidate.type) && !selectedIds.has(candidate.publicId)
  ));
  const receivedObservations = selectedOtherEvents.map((candidate) => (
    organizeCandidate(candidate, episodeId)
  ));
  const routes = {
    causalKnowledge: buildCausalRoutes(
      selectedOtherEvents,
      options.causalContext || {},
    ),
    probabilityLedger: buildProbabilityRoutes(selectedOtherEvents, episodeId),
  };
  const receivedIds = new Set(receivedObservations.map((row) => row.sourceSignalId));
  const routedIds = collectRoutedSignalIds(routes);
  const routedCausalTypes = new Set(routes.causalKnowledge.flatMap((row) => row.sourceSignalTypes || []));
  const serialized = JSON.stringify({ receivedObservations, routes });
  const causalEvidence = reception.selectedCausalEvidence.map((candidate) => ({
    id: candidate.publicId,
    ...clone(candidate.semanticEvent),
    informationTier: candidate.features.informationTier,
  }));

  return {
    schema: SCHEMA,
    episodeId,
    perceptionLevel: reception.perceptionLevel,
    receivedSignalCount: selectedOtherEvents.length,
    excludedSignalCount: reception.candidates.length - selectedOtherEvents.length,
    receivedObservations,
    causalEvidence,
    routes,
    audit: {
      candidateSignalCount: reception.candidates.length,
      divertedCharacterSignalCount: divertedCharacterSignals.length,
      persistentFactsPromotedCount: persistentFactsPromoted.length,
      causalEvidenceCandidateCount: reception.causalEvidenceCandidates.length,
      receivedCausalEvidenceCount: causalEvidence.length,
      hypothesisAttention: clone(reception.hypothesisAttentionAudit),
      causalEvidenceRoutedToKnowledge: false,
      routeCounts: Object.fromEntries(
        Object.entries(routes).map(([name, rows]) => [name, rows.length]),
      ),
      everyObservationWasReceived: receivedObservations.every((row) => receivedIds.has(row.sourceSignalId)),
      everyRoutedSignalWasReceived: [...routedIds].every((id) => receivedIds.has(id)),
      typeOneContractComplete: routes.causalKnowledge.every(validTypeOneRoute),
      nonCausalObservationBehaviorCount: routes.causalKnowledge.filter((row) => (
        /^(?:observe|receive)_/.test(String(row.tuple?.behavior?.kind || ""))
      )).length,
      standaloneStatementKnowledgeCount: routes.causalKnowledge.filter((row) => (
        Object.hasOwn(row.observation || {}, "statement")
      )).length,
      unroutedReceivedSignalTypes: unique(
        selectedOtherEvents
          .map((candidate) => candidate.type)
          .filter((type) => type !== "visible_probability_outcome" && !routedCausalTypes.has(type)),
      ),
      createsGenericKnowledgeStore: false,
      updatesLegacyKnowledge: false,
      touchesCharacterCognition: false,
      touchesRosterPrediction: false,
      blockedInternalSignalCount: rawEvents.filter((event) => INTERNAL_ONLY_TYPES.has(event?.type)).length,
      exposesRawEventIds: /(?:combat|event|attempt):\d+/i.test(serialized),
      exposesDiagnosis: serialized.includes("diagnosis"),
    },
  };
}

function organizeCandidate(candidate, episodeId) {
  return {
    sourceSignalId: candidate.publicId,
    sourceSignalType: candidate.type,
    subject: safeObservationSubject(candidate),
    environment: safeEnvironment(candidate.evidence),
    statement: candidate.statement,
    evidenceWeight: evidenceWeight(candidate),
    episodeId,
    persistentFact: PERSISTENT_FACT_TYPES.has(candidate.type),
  };
}

function buildCausalRoutes(candidates, contextInput) {
  const context = normalizeCausalContext(contextInput, candidates);
  const routes = [];
  const byType = groupBy(candidates, (candidate) => candidate.type);
  const outcome = first(byType.get("combat_outcome"));
  if (outcome) routes.push(buildEncounterRoute(outcome, context));

  const mapUnlock = first(byType.get("visible_map_unlock"));
  if (mapUnlock) routes.push(buildMapProgressionRoute(mapUnlock, context));

  const loot = byType.get("visible_loot") || [];
  if (loot.length) routes.push(buildLootRoute(loot, context));

  const characterUnlocks = byType.get("visible_character_unlock") || [];
  if (characterUnlocks.length) routes.push(buildCharacterUnlockRoute(characterUnlocks, context));

  const field = first(byType.get("visible_field_effect"));
  if (field) routes.push(buildFieldRoute(field, context));

  for (const candidate of candidates.filter((row) => row.type.startsWith("incoming_damage_"))) {
    routes.push(buildEnemyDamagePatternRoute(candidate, context));
  }
  for (const candidate of candidates.filter((row) => ENEMY_BEHAVIOR_TYPES.has(row.type))) {
    routes.push(buildEnemyBehaviorRoute(candidate, context));
  }
  return routes.filter(Boolean);
}

function buildEncounterRoute(candidate, context) {
  const event = candidate.evidence?.[0] || {};
  const gameEvent = context.gameEvent;
  const outcome = normalizeOutcome(
    event.result?.outcome
      || event.result?.kind
      || gameEvent.outcome,
  );
  return causalRoute({
    subject: squadSubject(context),
    environment: {
      region: context.region,
      node: context.node,
      phase: "encounter",
      team: context.teamIds,
      teamFingerprint: context.teamFingerprint,
    },
    behavior: {
      kind: "challenge_level",
      key: context.action,
      target: context.node,
    },
  }, compactDefined({
    outcome,
    duration: finiteOrNull(gameEvent.duration),
    survivors: safeSurvivors(event.result?.survivors || gameEvent.survivors),
    resolution: safeToken(gameEvent.resolution),
    firstClear: gameEvent.firstClear == null ? null : Boolean(gameEvent.firstClear),
    performanceScore: finiteOrNull(context.performanceScore),
    teamCognitionSnapshot: context.teamMembers.map(encounterCognitionSnapshot),
    evidenceWeight: evidenceWeight(candidate),
  }), [candidate], "供Agent结合当时站位、角色认知与关卡环境理解这次胜负");
}

function buildMapProgressionRoute(candidate, context) {
  const events = candidate.evidence || [];
  const unlockedNodes = unique(events.flatMap((event) => (
    event.result?.unlockedNodes
      || event.result?.nodes
      || [event.result?.unlockedNode || event.result?.node]
  )).map(safeToken));
  return causalRoute({
    subject: progressionSubject(),
    environment: {
      region: context.region,
      node: context.node,
      phase: "map_progression",
    },
    behavior: {
      kind: "clear_level",
      key: context.action,
      target: context.node,
    },
  }, {
    outcome: "map_progressed",
    clearedNode: context.node,
    unlockedNodes,
    evidenceWeight: evidenceWeight(candidate),
  }, [candidate], "判断通关会开放哪些后续行动");
}

function buildLootRoute(candidates, context) {
  const drops = candidates.flatMap((candidate) => candidate.evidence || [])
    .map(safeVisibleDrop)
    .filter(Boolean);
  return causalRoute({
    subject: progressionSubject(),
    environment: {
      region: context.region,
      node: context.node,
      phase: "loot_drop",
    },
    behavior: {
      kind: "clear_level",
      key: context.action,
      target: context.node,
    },
  }, compactDefined({
    outcome: "loot_obtained",
    drops,
    dropCount: drops.length,
    equippedPowerBefore: finiteOrNull(context.gameEvent.gearBefore),
    equippedPowerAfter: finiteOrNull(context.gameEvent.gearAfter),
    powerChanged: comparableNumbers(context.gameEvent.gearBefore, context.gameEvent.gearAfter)
      ? Number(context.gameEvent.gearBefore) !== Number(context.gameEvent.gearAfter)
      : null,
    evidenceWeight: average(candidates.map(evidenceWeight)),
  }), candidates, "判断该关卡能获得什么，以及掉落是否会直接改变战力");
}

function buildCharacterUnlockRoute(candidates, context) {
  const characters = candidates.flatMap((candidate) => candidate.evidence || [])
    .map((event) => compactDefined({
      id: safeToken(event.result?.characterId || event.result?.heroId),
      name: safeToken(event.result?.characterName || event.result?.name),
      kind: safeToken(event.result?.character),
    }))
    .filter((row) => Object.keys(row).length);
  return causalRoute({
    subject: progressionSubject(),
    environment: {
      region: context.region,
      node: context.node,
      phase: "character_reward",
    },
    behavior: {
      kind: "clear_level",
      key: context.action,
      target: context.node,
    },
  }, {
    outcome: "character_unlocked",
    characters,
    activeTeamChanged: false,
    evidenceWeight: average(candidates.map(evidenceWeight)),
  }, candidates, "判断通关会提供哪些新换人选项");
}

function buildFieldRoute(candidate, context) {
  const events = candidate.evidence || [];
  const fieldId = safeToken(
    context.gameEvent.fieldEffect?.id
      || events.find((event) => event.environment?.fieldEffect)?.environment?.fieldEffect
      || stripPrefix(events.find((event) => event.behavior?.key)?.behavior?.key, "field:")
      || stableTextId(candidate.statement),
  );
  const fieldName = safeToken(
    context.gameEvent.fieldEffect?.name
      || events.find((event) => event.behavior?.name)?.behavior?.name
      || "可见场地效果",
  );
  return causalRoute({
    subject: { id: `field:${fieldId}`, name: fieldName },
    environment: {
      region: context.region,
      node: context.node,
      phase: "field_rule",
      fieldEffect: fieldId,
    },
    behavior: {
      kind: "affect_battle",
      key: `field:${fieldId}`,
      target: "both_teams",
    },
  }, compactDefined({
    outcome: "field_effect_observed",
    visibleSignals: unique(events.map((event) => safeToken(event.behavior?.name)).filter(Boolean)),
    signalCount: events.length,
    concurrentEncounterOutcome: normalizeOutcome(context.gameEvent.outcome),
    concurrentPerformanceScore: finiteOrNull(context.performanceScore),
    causalStatus: "visible_rule_with_battle_association",
    evidenceWeight: evidenceWeight(candidate),
  }), [candidate], "判断当前关卡的场地规则和过去伴随的战斗表现");
}

function buildEnemyDamagePatternRoute(candidate, context) {
  const events = candidate.evidence || [];
  const mode = safeToken(candidate.type.slice("incoming_damage_".length)) || "unclear";
  const targets = mostFrequentNames(events
    .map((event) => event.result?.target)
    .filter((target) => target?.side === "left")
    .map((target) => safeToken(target.name))
    .filter(Boolean));
  return causalRoute({
    subject: {
      id: `enemy_pattern:${mode}`,
      name: enemyPatternLabel(mode),
    },
    environment: {
      region: context.region,
      encounterBand: context.encounterBand,
      phase: "combat_pattern",
    },
    behavior: {
      kind: "attack_player_squad",
      key: `enemy_attack_pattern:${mode}`,
      target: "player_squad",
    },
  }, {
    outcome: "visible_damage_pattern",
    attackMode: mode,
    relativeDamageBand: magnitudeBand(candidate.features?.magnitude),
    observedHitCount: events.length,
    mainTargets: targets,
    evidenceWeight: evidenceWeight(candidate),
  }, [candidate], "判断这一类敌方攻击通常有多危险、主要打谁");
}

function buildEnemyBehaviorRoute(candidate, context) {
  const events = candidate.evidence || [];
  const behaviorKind = enemyBehaviorKind(candidate.type);
  return causalRoute({
    subject: {
      id: `enemy_pattern:${candidate.type}`,
      name: "表现出该行为的敌方单位",
    },
    environment: {
      region: context.region,
      encounterBand: context.encounterBand,
      phase: "combat_pattern",
    },
    behavior: {
      kind: behaviorKind,
      key: `enemy_behavior:${candidate.type}`,
      target: enemyBehaviorTarget(candidate.type),
    },
  }, {
    outcome: "visible_enemy_behavior",
    behaviorType: candidate.type,
    visibleEffects: unique(events.map((event) => safeToken(event.behavior?.name)).filter(Boolean)),
    observedCount: events.length,
    evidenceWeight: evidenceWeight(candidate),
  }, [candidate], "判断敌人是否具有需要针对的治疗、护盾、状态或额外技能");
}

function buildProbabilityRoutes(candidates, episodeId) {
  return candidates
    .filter((candidate) => candidate.type === "visible_probability_outcome")
    .map((candidate) => {
      const event = candidate.evidence?.[0] || {};
      return {
        target: ROUTE_TARGETS.probabilityLedger,
        operation: "ingestProbabilityOpportunity",
        episodeId,
        family: safeProbabilityFamily(event),
        opportunity: event.probability?.opportunity === true,
        success: event.probability?.success === true,
        environment: safeEnvironment([event]),
        sourceSignalIds: [candidate.publicId],
      };
    })
    .filter((row) => row.opportunity);
}

function causalRoute(tuple, observation, candidates, decisionUse) {
  const sourceSignalIds = unique(candidates.map((candidate) => candidate.publicId));
  return {
    target: ROUTE_TARGETS.causalKnowledge,
    operation: "mergeKnowledgeObservation",
    knowledgeKeyPreview: knowledgeKey(tuple),
    tuple,
    observation,
    evidencePublicSignalIds: sourceSignalIds,
    sourceSignalTypes: unique(candidates.map((candidate) => candidate.type)),
    decisionUse,
  };
}

function validTypeOneRoute(route) {
  return Boolean(
    route?.tuple?.subject?.id
      && route?.tuple?.environment
      && route?.tuple?.behavior?.kind
      && route?.observation?.outcome
      && route?.evidencePublicSignalIds?.length,
  );
}

function normalizeCausalContext(input, candidates) {
  const evidenceEnvironment = candidates
    .flatMap((candidate) => candidate.evidence || [])
    .map((event) => event.environment)
    .find(Boolean) || {};
  const gameEvent = clone(input.gameEvent || {});
  const node = safeToken(input.node || gameEvent.node || evidenceEnvironment.node) || "unknown_node";
  const region = safeToken(input.region || evidenceEnvironment.region) || inferRegion(node);
  const unorderedTeamMembers = (input.teamMembers || []).map(safeTeamMember).filter(Boolean);
  const teamIds = unique([
    ...(input.teamIds || []).map(safeToken),
    ...unorderedTeamMembers.map((row) => row.id),
  ]);
  const teamMembers = orderTeamMembersByFormation(teamIds, unorderedTeamMembers);
  const teamFingerprint = teamFingerprintOf(teamIds.map((id) => ({ id })));
  return {
    action: safeToken(input.action || gameEvent.action || `challenge:${node}`),
    node,
    region,
    encounterBand: safeToken(input.encounterBand) || encounterBand(node),
    teamMembers,
    teamIds,
    teamFingerprint,
    gameEvent,
    performanceScore: finiteOrNull(input.performanceScore),
  };
}

function squadSubject(context) {
  return {
    id: "player_squad",
    members: context.teamMembers.length
      ? context.teamMembers
      : context.teamIds.map((id) => ({ id })),
  };
}

function progressionSubject() {
  return {
    id: "player_progress",
    name: "玩家进度",
  };
}

function safeTeamMember(row) {
  if (!row?.id) return null;
  return compactDefined({
    id: safeToken(row.id),
    name: safeToken(row.name || row.label),
    role: safeToken(row.role),
    kind: safeToken(row.kind),
    cognitionMatrixPosition: optionalFiniteNumber(row.cognitionMatrixPosition),
    cognitionScaleBoundaryPosition: optionalFiniteNumber(row.cognitionScaleBoundaryPosition),
    cognitionRelativeToScale: optionalFiniteNumber(row.cognitionRelativeToScale),
    cognitionLevel: optionalFiniteNumber(row.cognitionLevel),
    cognitionLabel: safeToken(row.cognitionLabel),
    cognitionInTopThirtyPercent: row.cognitionInTopThirtyPercent == null
      ? null
      : Boolean(row.cognitionInTopThirtyPercent),
    cognitionEvidenceCount: optionalFiniteNumber(row.cognitionEvidenceCount),
    cognitionAxes: safeCognitionAxes(row.cognitionAxes),
  });
}

function orderTeamMembersByFormation(teamIds, teamMembers) {
  const byId = new Map(teamMembers.map((row) => [row.id, row]));
  return teamIds.map((id, index) => ({
    ...(byId.get(id) || { id }),
    formationSlot: index + 1,
  }));
}

function encounterCognitionSnapshot(row) {
  return compactDefined({
    id: row.id,
    name: row.name,
    formationSlot: optionalFiniteNumber(row.formationSlot),
    cognitionMatrixPosition: optionalFiniteNumber(row.cognitionMatrixPosition),
    cognitionScaleBoundaryPosition: optionalFiniteNumber(row.cognitionScaleBoundaryPosition),
    cognitionRelativeToScale: optionalFiniteNumber(row.cognitionRelativeToScale),
    cognitionLevel: optionalFiniteNumber(row.cognitionLevel),
    cognitionLabel: row.cognitionLabel,
    cognitionInTopThirtyPercent: row.cognitionInTopThirtyPercent,
    cognitionEvidenceCount: optionalFiniteNumber(row.cognitionEvidenceCount),
    cognitionAxes: safeCognitionAxes(row.cognitionAxes),
  });
}

function safeCognitionAxes(input) {
  if (!input || typeof input !== "object") return undefined;
  const result = {};
  for (const axis of ["output", "protection", "buff"]) {
    const row = input[axis];
    if (!row || typeof row !== "object") continue;
    result[axis] = compactDefined({
      axis,
      label: safeToken(row.label),
      position: optionalFiniteNumber(row.position),
      scaleBoundaryPosition: optionalFiniteNumber(row.scaleBoundaryPosition),
      relativeToScale: optionalFiniteNumber(row.relativeToScale),
      level: optionalFiniteNumber(row.level),
      cognitionLabel: safeToken(row.cognitionLabel),
      evidenceCount: optionalFiniteNumber(row.evidenceCount),
      inTopThirtyPercent: row.inTopThirtyPercent == null
        ? null
        : Boolean(row.inTopThirtyPercent),
    });
  }
  return Object.keys(result).length ? result : undefined;
}

function teamFingerprintOf(members) {
  return members
    .map((row) => safeToken(row.id))
    .filter(Boolean)
    .join(">");
}

function safeVisibleDrop(event) {
  const item = event.result?.item || {};
  const name = safeToken(event.result?.itemName || event.result?.name || item.name);
  const rarity = safeToken(event.result?.rarity || item.rarity);
  const slot = safeToken(event.result?.slot || item.slot);
  const level = finiteOrNull(event.result?.level || event.result?.equipmentLevel || item.level);
  if (!name && !rarity && !slot && level == null) return null;
  return compactDefined({ name, rarity, slot, level });
}

function safeObservationSubject(candidate) {
  const type = candidate.type;
  if (type.startsWith("incoming_damage_") || type.startsWith("enemy_")) {
    return { id: "enemy_group", label: "敌方单位" };
  }
  if (type === "visible_field_effect") return { id: "battlefield", label: "战场环境" };
  if (type === "visible_loot" || type === "visible_probability_outcome") {
    return { id: "player_rewards", label: "战斗奖励" };
  }
  if (type.includes("unlock")) return { id: "player_progress", label: "玩家进度" };
  return { id: "player_squad", label: "玩家队伍" };
}

function evidenceWeight(candidate) {
  return round(clamp(
    0.35
      + Number(candidate.features?.magnitude || 0) * 0.25
      + Number(candidate.features?.presentationStrength || 0) * 0.2
      + Math.min(1, Number(candidate.evidence?.length || 0) / 4) * 0.2,
    0.2,
    1,
  ));
}

function safeProbabilityFamily(event) {
  const family = safeToken(event.probability?.family);
  if (family) return family;
  const environment = safeEnvironment([event]);
  return `reward:${environment.region || "unknown_region"}:${environment.node || "unknown_node"}`;
}

function safeEnvironment(evidenceInput) {
  const environment = (evidenceInput || []).map((event) => event.environment).find(Boolean) || {};
  return compactDefined({
    region: safeToken(environment.region),
    node: safeToken(environment.node),
    phase: safeToken(environment.phase),
  });
}

function safeSurvivors(input) {
  if (!input || typeof input !== "object") return null;
  return compactDefined({
    player: finiteOrNull(input.player ?? input.ally),
    enemy: finiteOrNull(input.enemy),
  });
}

function normalizeOutcome(value) {
  const text = String(value || "").toLowerCase();
  if (["win", "victory", "combat_win"].includes(text)) return "win";
  if (["loss", "defeat", "combat_loss"].includes(text)) return "loss";
  return text ? safeToken(text) : "unknown";
}

function enemyBehaviorKind(type) {
  if (type === "enemy_heal") return "heal_enemy_squad";
  if (type === "enemy_shield") return "protect_enemy_squad";
  if (type === "enemy_shieldBreak") return "break_player_shield";
  if (type === "enemy_visible_status") return "apply_visible_status";
  return "use_visible_skill";
}

function enemyBehaviorTarget(type) {
  if (["enemy_heal", "enemy_shield"].includes(type)) return "enemy_squad";
  return "player_squad";
}

function enemyPatternLabel(mode) {
  if (mode === "ranged") return "表现出远程攻击的敌方单位";
  if (mode === "melee") return "表现出近身攻击的敌方单位";
  return "攻击方式尚不明确的敌方单位";
}

function magnitudeBand(value) {
  const number = Number(value || 0);
  if (number >= 0.67) return "major";
  if (number >= 0.34) return "moderate";
  return "minor";
}

function mostFrequentNames(names) {
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) || 0) + 1);
  if (!counts.size) return [];
  const maximum = Math.max(...counts.values());
  return [...counts.entries()]
    .filter(([, count]) => count === maximum)
    .map(([name]) => name)
    .slice(0, 3);
}

function encounterBand(node) {
  if (node === "r2_entry") return "region_2_entry";
  if (/^r2_(knight|priest)_rescue$/.test(node)) return "region_2_rescue";
  if (/^r2_(shield|flag)_trial$/.test(node)) return "region_2_field_trial";
  if (node === "r2_confluence") return "region_2_confluence";
  if (node === "r2_boss") return "region_2_boss";
  if (/^r1_main_[1-4]$/.test(node)) return "region_1_early_main";
  if (/^r1_main_[5-8]$/.test(node)) return "region_1_mid_main";
  if (node === "r1_boss") return "region_1_boss";
  return String(node).startsWith("r2_") ? "region_2_other" : "region_1_optional_branch";
}

function inferRegion(node) {
  return String(node).startsWith("r2_") ? "region_2" : "region_1";
}

function knowledgeKey(tuple) {
  return [
    tuple.subject?.id || "unknown_subject",
    tuple.environment?.region || "unknown_region",
    tuple.environment?.node || tuple.environment?.encounterBand || "unknown_environment",
    tuple.environment?.phase || "unknown_phase",
    tuple.environment?.teamFingerprint || "no_exact_team",
    tuple.behavior?.kind || "unknown_behavior",
    tuple.behavior?.key || "unknown_key",
  ].join("|");
}

function collectRoutedSignalIds(routes) {
  const ids = [];
  for (const row of Object.values(routes).flat()) {
    ids.push(...(row.sourceSignalIds || row.evidencePublicSignalIds || []));
  }
  return new Set(ids.filter(Boolean));
}

function uniqueCandidates(candidates) {
  const byId = new Map();
  for (const candidate of candidates) {
    if (candidate?.publicId && !byId.has(candidate.publicId)) byId.set(candidate.publicId, candidate);
  }
  return [...byId.values()];
}

function groupBy(rows, keyOf) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function first(rows) {
  return rows?.[0] || null;
}

function stripPrefix(value, prefix) {
  const text = String(value || "");
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}

function stableTextId(value) {
  return `visible:${hash32(String(value)).toString(16).padStart(8, "0")}`;
}

function hash32(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function compactDefined(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => (
    value !== null && value !== undefined
  )));
}

function safeToken(value) {
  if (value == null || value === "") return null;
  return String(value).slice(0, 120);
}

function comparableNumbers(a, b) {
  return Number.isFinite(Number(a)) && Number.isFinite(Number(b));
}

function finiteOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function optionalFiniteNumber(value) {
  if (value == null || value === "") return null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function average(values) {
  const finite = values.filter((value) => Number.isFinite(Number(value)));
  return finite.length
    ? round(finite.reduce((sum, value) => sum + Number(value), 0) / finite.length)
    : 0;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  SCHEMA,
  ROUTE_TARGETS,
  organizeReceivedBattleInformation,
};
