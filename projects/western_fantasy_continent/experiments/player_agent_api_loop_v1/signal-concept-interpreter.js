const SCHEMA = "player_signal_concept_interpreter_v1";

const DEFAULT_CONCEPTS = [
  {
    id: "enemy_minion_ranged",
    label: "远程小怪",
    category: "enemy_archetype",
    definition: {
      description: "普通敌人，战斗中反复表现出箭矢、射击或其他远程攻击。",
      requiredVisibleTags: ["enemy", "ordinary", "ranged"],
    },
    priority: 30,
  },
  {
    id: "enemy_minion_melee",
    label: "近战小怪",
    category: "enemy_archetype",
    definition: {
      description: "普通敌人，战斗中反复表现出重击、顺劈或其他近身攻击。",
      requiredVisibleTags: ["enemy", "ordinary", "melee"],
    },
    priority: 20,
  },
  {
    id: "enemy_minion_generic",
    label: "普通小怪",
    category: "enemy_archetype",
    definition: {
      description: "已经看见，但尚未形成更细分类的普通敌人。",
      requiredVisibleTags: ["enemy", "ordinary"],
    },
    priority: 1,
  },
];

const RANGED_VISIBLE_PATTERN = /(箭|射击|射击|投射|飞弹|弹丸|弩|标枪|火球|冰矛|闪电链)/;
const MELEE_VISIBLE_PATTERN = /(重击|顺劈|斩|劈|猛击|突刺|拳|爪|撕咬|冲撞)/;

function createConceptState() {
  return {
    schema: SCHEMA,
    concepts: clone(DEFAULT_CONCEPTS),
    candidates: {},
    encounterCount: 0,
  };
}

function interpretEventLog(rawEventsInput, stateInput, context = {}) {
  const state = stateInput ? clone(stateInput) : createConceptState();
  const rawEvents = clone(rawEventsInput || []);
  const profiles = buildVisibleEnemyProfiles(rawEvents);
  const entityConcepts = {};
  const decisions = [];

  for (const profile of profiles.values()) {
    const decision = resolveEnemyConcept(profile, state, context);
    entityConcepts[profile.id] = decision.conceptId;
    decisions.push(decision);
  }

  const events = rawEvents.map((event) => conceptizeEvent(event, entityConcepts, state.concepts));
  state.encounterCount += 1;
  updateConceptCandidates(state, profiles, entityConcepts, context);

  const entityCounts = {};
  for (const conceptId of Object.values(entityConcepts)) {
    entityCounts[conceptId] = (entityCounts[conceptId] || 0) + 1;
  }

  return {
    schema: SCHEMA,
    events,
    state,
    interpretation: {
      conceptsUsed: [...new Set(Object.values(entityConcepts))],
      entityCounts,
      decisions,
      candidates: Object.values(state.candidates),
    },
  };
}

function buildVisibleEnemyProfiles(events) {
  const profiles = new Map();
  for (const event of events) {
    collectEnemyRef(event.subject, event, profiles, "subject");
    collectEnemyRef(event.result?.target, event, profiles, "target");
  }
  return profiles;
}

function collectEnemyRef(ref, event, profiles, position) {
  if (!ref || ref.side !== "right" || !ref.id) return;
  const profile = profiles.get(ref.id) || {
    id: ref.id,
    visibleTags: new Set(["enemy", "ordinary"]),
    visibleEvidence: [],
    eventIds: new Set(),
  };
  profile.eventIds.add(event.id);

  if (position === "subject") {
    const visibleText = [event.behavior?.name, ...(event.behavior?.tags || [])].filter(Boolean).join(" ");
    if (RANGED_VISIBLE_PATTERN.test(visibleText)) {
      profile.visibleTags.add("ranged");
      profile.visibleEvidence.push({ eventId: event.id, observation: "远程攻击表现" });
    }
    if (MELEE_VISIBLE_PATTERN.test(visibleText)) {
      profile.visibleTags.add("melee");
      profile.visibleEvidence.push({ eventId: event.id, observation: "近身攻击表现" });
    }
    if (event.type === "heal") profile.visibleTags.add("healing");
    if (event.type === "shield") profile.visibleTags.add("shielding");
    if ((event.behavior?.tags || []).some((tag) => ["stun", "slow", "control"].includes(tag))) {
      profile.visibleTags.add("control");
    }
  }
  profiles.set(ref.id, profile);
}

function resolveEnemyConcept(profile, state, context) {
  const tags = profile.visibleTags;
  let conceptId = "enemy_minion_generic";
  if (tags.has("ranged") && !tags.has("melee")) conceptId = "enemy_minion_ranged";
  else if (tags.has("melee") && !tags.has("ranged")) conceptId = "enemy_minion_melee";
  else if (tags.has("ranged")) conceptId = "enemy_minion_ranged";

  const concept = state.concepts.find((row) => row.id === conceptId);
  return {
    sourceEntityAuditId: profile.id,
    conceptId,
    conceptLabel: concept?.label || "普通小怪",
    visibleTags: [...tags],
    visibleEvidence: profile.visibleEvidence.slice(0, 6),
    environment: context.node || context.environment || "unknown",
    decision: conceptId === "enemy_minion_generic" ? "matched_fallback" : "matched_existing",
  };
}

function updateConceptCandidates(state, profiles, entityConcepts, context) {
  const encounterKey = String(context.node || context.environment || `encounter_${state.encounterCount + 1}`);
  for (const profile of profiles.values()) {
    if (entityConcepts[profile.id] !== "enemy_minion_generic") continue;
    const distinctive = [...profile.visibleTags].filter((tag) => ["healing", "shielding", "control"].includes(tag));
    if (!distinctive.length) continue;
    const signature = distinctive.sort().join("+");
    const candidate = state.candidates[signature] || {
      id: `candidate:${signature}`,
      visibleSignature: signature,
      evidenceCount: 0,
      encounterKeys: [],
      status: "observe_more",
      reason: "可见行为有差异，但尚不足以证明玩家需要一个新概念。",
    };
    candidate.evidenceCount += profile.visibleEvidence.length || 1;
    if (!candidate.encounterKeys.includes(encounterKey)) candidate.encounterKeys.push(encounterKey);
    if (candidate.evidenceCount >= 3 && candidate.encounterKeys.length >= 2) {
      candidate.status = "eligible_for_review";
      candidate.reason = "至少两个不同遭遇重复出现可见差异，可以由认知节点判断是否创建新概念。";
    }
    state.candidates[signature] = candidate;
  }
}

function conceptizeEvent(rawEvent, entityConcepts, concepts) {
  const event = clone(rawEvent);
  const enemyActorConceptId = event.subject?.side === "right" ? entityConcepts[event.subject.id] : null;
  event.subject = conceptizeRef(event.subject, entityConcepts, concepts);
  if (event.result?.target) event.result.target = conceptizeRef(event.result.target, entityConcepts, concepts);
  if (enemyActorConceptId && event.behavior) {
    event.behavior.key = `observed:${enemyActorConceptId}:${visibleBehaviorKind(event)}`;
  }
  if (event.result?.meta && "role" in event.result.meta) delete event.result.meta.role;
  if (event.presentation?.attentionZone && entityConcepts[event.presentation.attentionZone]) {
    event.presentation.attentionZone = `concept:${entityConcepts[event.presentation.attentionZone]}`;
  }
  event.signalLayer = "player_semantic";
  return event;
}

function visibleBehaviorKind(event) {
  if (event.type === "heal") return "healing";
  if (event.type === "shield") return "shielding";
  if (event.type === "status") return "status_effect";
  if (event.type === "death") return "defeated_or_defeating";
  if (event.type === "damage" && (event.behavior?.tags || []).includes("basic")) return "basic_attack";
  if (event.type === "damage") return "damaging_skill";
  if (event.type === "skill") return "skill_cast";
  return event.behavior?.kind || event.type || "action";
}

function conceptizeRef(ref, entityConcepts, concepts) {
  if (!ref || ref.side !== "right" || !entityConcepts[ref.id]) return ref;
  const conceptId = entityConcepts[ref.id];
  const concept = concepts.find((row) => row.id === conceptId);
  return {
    id: `concept:${conceptId}`,
    name: concept?.label || "普通小怪",
    side: "right",
    role: conceptId,
    conceptId,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  SCHEMA,
  createConceptState,
  interpretEventLog,
};
