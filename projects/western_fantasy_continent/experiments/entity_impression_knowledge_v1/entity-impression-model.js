const STRENGTH_MATRIX = require("./strength-cognition-matrix");

const POSITIVE_BANDS = {
  ordinary: [
    [25, 0, "没有明显差别"],
    [45, 1, "有点强"],
    [70, 2, "强一些"],
    [110, 4, "强很多"],
    [151, 7, "提升爆炸"],
  ],
  familiar: [
    [25, 0, "没有明显差别"],
    [45, 1, "有点强"],
    [70, 2, "强一些"],
    [80, 4, "强很多"],
    [100, 5, "强一大截"],
    [120, 6, "强非常多"],
    [135, 7, "提升爆炸"],
    [151, 9, "质变"],
  ],
  expert: [
    [25, 0, "没有明显差别"],
    [45, 1, "有点强"],
    [60, 2, "强一些"],
    [75, 3, "明显强"],
    [90, 4, "强很多"],
    [105, 5, "强一大截"],
    [120, 6, "强非常多"],
    [135, 7, "提升爆炸"],
    [145, 8, "强得离谱"],
    [151, 9, "质变"],
  ],
};

// Negative perception is deliberately provisional. The accepted project reference only
// freezes positive improvement bands; this experiment needs a minimal signed counterpart
// so weak units can become player knowledge without pretending the thresholds are final.
const NEGATIVE_BANDS = [
  [25, 0, "没有明显差别"],
  [45, -1, "有点弱"],
  [70, -2, "明显偏弱"],
  [101, -3, "非常弱"],
];

const DOMAIN_LABELS = {
  area_damage: "擅长群体输出",
  single_target_damage: "擅长单体输出",
  sustained_damage: "擅长持续伤害",
  healing: "擅长治疗",
  shielding: "擅长护盾保护",
  control: "擅长控制",
  durability: "擅长承受并化解伤害",
};

const STRENGTH_LABELS = {
  0: "表现普通",
  1: "有点强",
  2: "偏强",
  3: "明显强",
  4: "很强",
  5: "强一大截",
  6: "强非常多",
  7: "极强",
  8: "强得离谱",
  9: "质变级强",
};

const DOMAIN_EVIDENCE_WEIGHTS = { high: 1, medium: 0.65, low: 0.2 };
const DOMAIN_EVIDENCE_THRESHOLD = 0.5;
const AGENT_INTERPRETATION_POLICY = {
  output: "hypothesis_only",
  directKnowledgePromotion: false,
  promotionRule: "later structured evidence must validate the hypothesis before code may create knowledge",
};

function analyzeBattleReport(report, options = {}) {
  const profile = POSITIVE_BANDS[options.profile] ? options.profile : "ordinary";
  const eventLog = (report.eventLog || []).filter((event) => event.presentation?.visible !== false);
  const team = report.playerTeam?.length ? report.playerTeam : derivePlayerTeam(eventLog, report.gameEvent);
  const actors = new Map(team.map((unit) => [unit.id, createActorRow(unit)]));
  const casts = new Map();

  for (const event of eventLog) {
    const subjectId = event.subject?.id;
    if (!actors.has(subjectId) || event.subject?.side !== "left") continue;
    const actor = actors.get(subjectId);
    const amount = effectiveAmount(event);
    const tags = new Set(event.behavior?.tags || []);
    actor.evidenceEventIds.push(event.id);
    actor.eventCount += 1;

    if (event.type === "damage" && event.result?.target?.side === "right") {
      actor.channels.damage += amount;
      const castId = event.result?.meta?.castId
        || `${subjectId}:${event.time}:${event.behavior?.key || "damage"}`;
      const cast = casts.get(castId) || {
        actorId: subjectId,
        events: [],
        visibleTargetCount: 0,
        tags: new Set(),
      };
      cast.events.push({ event, amount });
      cast.visibleTargetCount = Math.max(
        cast.visibleTargetCount,
        Number(event.result?.meta?.visibleTargetCount || 0),
      );
      tags.forEach((tag) => cast.tags.add(tag));
      casts.set(castId, cast);
    } else if (event.type === "heal" && event.result?.target?.side === "left") {
      actor.channels.healing += amount;
      actor.domains.healing += amount;
      addDomainEvidence(actor, "healing", amount, "high");
    } else if (["shield_absorb", "shield_block"].includes(event.type)) {
      actor.channels.shieldAbsorbed += amount;
      actor.domains.shielding += amount;
      addDomainEvidence(actor, "shielding", amount, "high");
    } else if (event.type === "damage_prevented") {
      actor.channels.damagePrevented += amount;
      actor.domains.durability += amount;
      addDomainEvidence(actor, "durability", amount, "high");
    } else if (event.type === "control_prevented_action") {
      actor.channels.controlValue += amount;
      actor.domains.control += amount;
      addDomainEvidence(actor, "control", amount, "high");
    }
  }

  for (const cast of casts.values()) {
    const actor = actors.get(cast.actorId);
    const amount = cast.events.reduce((sum, row) => sum + row.amount, 0);
    const distinctTargets = new Set(cast.events.map((row) => row.event.result?.target?.id).filter(Boolean)).size;
    const targetCount = cast.visibleTargetCount > 0 ? cast.visibleTargetCount : Math.max(1, distinctTargets);
    if (cast.tags.has("dot") || cast.tags.has("burn") || cast.tags.has("poison")) {
      actor.domains.sustained_damage += amount;
      addDomainEvidence(actor, "sustained_damage", amount, "high");
    } else if (targetCount >= 2) {
      actor.domains.area_damage += amount;
      addDomainEvidence(actor, "area_damage", amount, cast.visibleTargetCount >= 2 ? "high" : "medium");
    } else {
      actor.domains.single_target_damage += amount;
      addDomainEvidence(actor, "single_target_damage", amount, cast.visibleTargetCount === 1 ? "high" : "low");
    }
  }

  // The settled report owns total damage. Semantic events own the domain split. Their
  // totals can differ because the visible event log is compacted, so scale the observed
  // damage domains to the settled contribution rather than inventing a fifth channel.
  for (const contribution of report.gameEvent?.contributions || []) {
    const actor = [...actors.values()].find((row) => row.name === contribution.name);
    if (!actor) continue;
    const damage = Math.max(0, Number(contribution.damage || 0));
    const observedDamage = actor.channels.damage;
    if (observedDamage > 0) {
      const scale = damage / observedDamage;
      actor.domains.area_damage *= scale;
      actor.domains.single_target_damage *= scale;
      actor.domains.sustained_damage *= scale;
      scaleDomainEvidence(actor, "area_damage", scale);
      scaleDomainEvidence(actor, "single_target_damage", scale);
      scaleDomainEvidence(actor, "sustained_damage", scale);
    } else {
      actor.domains.single_target_damage = damage;
      addDomainEvidence(actor, "single_target_damage", damage, "low");
    }
    actor.channels.damage = damage;
  }

  for (const actor of actors.values()) {
    actor.usefulContribution = sum(Object.values(actor.channels));
  }
  const teamUsefulContribution = [...actors.values()]
    .reduce((sum, actor) => sum + actor.usefulContribution, 0);
  const expectedUnitContribution = team.length > 0 ? teamUsefulContribution / team.length : 0;

  const units = [...actors.values()].map((actor) => {
    const relativeStrength = expectedUnitContribution > 0
      ? actor.usefulContribution / expectedUnitContribution - 1
      : 0;
    const strength = perceiveSigned(relativeStrength * 100, profile);
    const traitObservations = Object.entries(actor.domains)
      .map(([domain, value]) => buildTrait(domain, value, actor.usefulContribution, expectedUnitContribution, profile, actor.domainEvidence[domain]))
      .filter(Boolean)
      .sort((a, b) => b.level - a.level || b.rawMagnitudePercent - a.rawMagnitudePercent);
    const traits = traitObservations.filter((trait) => trait.level >= 3 && trait.eligible);
    return {
      id: actor.id,
      name: actor.name,
      role: actor.role,
      usefulContribution: round(actor.usefulContribution),
      contributionShare: teamUsefulContribution > 0 ? round(actor.usefulContribution / teamUsefulContribution) : 0,
      relativeStrengthPercent: round(relativeStrength * 100),
      strength,
      channels: roundObject(actor.channels),
      domains: roundObject(actor.domains),
      domainEvidence: summarizeDomainEvidence(actor.domainEvidence),
      traits,
      traitObservations,
      evidenceEventIds: actor.evidenceEventIds,
      eventCount: actor.eventCount,
    };
  });

  for (const unit of units) unit.allyContext = buildAllyContext(units, unit.id, profile);

  return {
    reportId: report.id,
    profile,
    environment: clone(report.environment || {}),
    outcome: report.gameEvent?.outcome || report.outcome || "unknown",
    teamUsefulContribution: round(teamUsefulContribution),
    expectedUnitContribution: round(expectedUnitContribution),
    units,
  };
}

function createImpressionState(options = {}) {
  const profile = POSITIVE_BANDS[options.profile] ? options.profile : "ordinary";
  return {
    schema: "entity_impression_knowledge_v1",
    profile,
    battleCount: 0,
    nextKnowledgeId: 1,
    knowledge: [],
    strengthObservations: [],
    traitObservations: [],
    observationTrace: [],
    strengthCognitionMatrix: STRENGTH_MATRIX.createStrengthCognitionMatrix({ profile }),
  };
}

function ingestBattleAnalysis(state, analysis) {
  if (state.observationTrace.some((trace) => trace.reportId === analysis.reportId)) {
    return {
      battleIndex: null,
      reportId: analysis.reportId,
      environment: clone(analysis.environment),
      changes: [{ action: "ignored_duplicate_report", reportId: analysis.reportId }],
    };
  }
  state.battleCount += 1;
  analysis.observationOrder = state.battleCount;
  const changes = [];
  const matrixUpdate = STRENGTH_MATRIX.updateStrengthCognitionMatrix(
    state.strengthCognitionMatrix,
    analysis,
  );
  state.strengthCognitionMatrix = matrixUpdate.matrix;
  if (matrixUpdate.trace) {
    changes.push({
      action: "updated_strength_cognition_matrix",
      participantIds: matrixUpdate.trace.participantIds,
      movements: matrixUpdate.trace.after.map((row) => ({ id: row.id, delta: row.delta, position: row.position })),
      scale: clone(matrixUpdate.trace.scale),
    });
  }
  for (const unit of analysis.units) {
    const relatedBefore = state.knowledge.filter((row) => row.subject.id === unit.id);
    changes.push({
      action: "reviewed_existing_impressions",
      subject: unit.name,
      knowledgeIds: relatedBefore.map((row) => row.id),
      strengthCount: relatedBefore.filter((row) => row.kind === "strength").length,
      traitDomains: [...new Set(relatedBefore.filter((row) => row.kind === "trait").map((row) => row.claim.domain))],
    });
    const subjectObservationOrder = state.strengthObservations
      .filter((observation) => observation.subject?.id === unit.id).length + 1;
    unit.subjectObservationOrder = subjectObservationOrder;
    state.strengthObservations.push(buildStrengthObservation(analysis, unit));
    changes.push(...updateStrengthKnowledge(state, analysis, unit));
    const observedDomains = new Set();
    for (const trait of unit.traitObservations || unit.traits || []) {
      observedDomains.add(trait.domain);
      const priorBelief = buildCurrentTraitBelief(state, unit.id, trait.domain);
      const traitObservationOrder = state.traitObservations
        .filter((observation) => observation.subject?.id === unit.id && observation.claim?.domain === trait.domain).length + 1;
      trait.subjectObservationOrder = traitObservationOrder;
      state.traitObservations.push(buildTraitObservation(analysis, unit, trait));
      changes.push(...updateTraitKnowledge(state, analysis, unit, trait, priorBelief));
    }
    const knownTraitDomains = [...new Set(relatedBefore
      .filter((row) => row.kind === "trait")
      .map((row) => row.claim.domain))];
    for (const domain of knownTraitDomains.filter((domain) => !observedDomains.has(domain))) {
      changes.push({
        action: "trait_review_inconclusive_no_attempt",
        subject: unit.name,
        domain,
        reason: "no visible domain attempt in this battle",
      });
    }
  }
  const trace = {
    battleIndex: state.battleCount,
    reportId: analysis.reportId,
    environment: clone(analysis.environment),
    changes,
  };
  state.observationTrace.push(trace);
  return trace;
}

function retrieveImpressions(state, subjectId, contextTags = [], options = {}) {
  const normalizedContextTags = salientContextTags(contextTags);
  const tags = new Set(normalizedContextTags);
  const rows = state.knowledge
    .filter((row) => row.subject.id === subjectId)
    .map((row) => ({ row, score: retrievalScore(row, tags) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score || a.row.createdOrder - b.row.createdOrder)
    .map((entry) => ({ ...clone(entry.row), retrievalScore: round(entry.score) }));
  const currentBelief = buildCurrentStrengthBelief(state, subjectId);
  const currentTraits = buildCurrentTraitBeliefs(state, subjectId);
  if (normalizedContextTags.length > 0) {
    const contextBelief = buildContextStrengthBelief(state, subjectId, normalizedContextTags, options);
    const contextTraits = buildContextTraitBeliefs(state, subjectId, normalizedContextTags, options);
    const strength = contextBelief || currentBelief;
    return strength ? [strength, ...contextTraits, ...rows] : [...contextTraits, ...rows];
  }
  return currentBelief ? [currentBelief, ...currentTraits, ...rows] : [...currentTraits, ...rows];
}

function updateStrengthKnowledge(state, analysis, unit) {
  const rows = state.knowledge.filter((row) => row.kind === "strength" && row.subject.id === unit.id);
  const first = rows[0] || null;
  if (!first) {
    if (unit.strength.level === 0) return [];
    const row = appendKnowledge(state, {
      kind: "strength",
      subject: unitRef(unit),
      scope: { type: "general", tags: [] },
      claim: clone(unit.strength),
      relation: "first_impression",
      corrects: null,
      analysis,
      unit,
    });
    return [{ action: "added_first_impression", knowledgeId: row.id, subject: unit.name, claim: row.claim.label }];
  }

  const relevantTags = salientContextTags(analysis.environment?.tags || []);
  const signChanged = Math.sign(first.claim.level) !== Math.sign(unit.strength.level);
  const materiallyDifferent = Math.abs(first.claim.level - unit.strength.level) >= 3;
  if (signChanged || materiallyDifferent) {
    const sameScope = rows.find((row) => row.scope.type === "context" && sameTags(row.scope.tags, relevantTags)
      && sameAllyScope(row.scope, unit.allyContext)
      && Math.sign(row.claim.level) === Math.sign(unit.strength.level));
    if (sameScope) {
      supportKnowledge(sameScope, analysis, unit);
      return [{ action: "supported_context_correction", knowledgeId: sameScope.id, subject: unit.name, claim: sameScope.claim.label }];
    }
    const row = appendKnowledge(state, {
      kind: "strength",
      subject: unitRef(unit),
      scope: relevantTags.length > 0
        ? contextScope(relevantTags, unit.allyContext)
        : { type: "general_evidence", tags: [] },
      claim: clone(unit.strength),
      relation: "qualifies",
      corrects: first.id,
      analysis,
      unit,
    });
    return [{ action: "added_context_correction", knowledgeId: row.id, subject: unit.name, claim: row.claim.label, corrects: first.id }];
  }

  supportKnowledge(first, analysis, unit);
  return [{ action: "supported_existing_impression", knowledgeId: first.id, subject: unit.name, claim: first.claim.label }];
}

function updateTraitKnowledge(state, analysis, unit, trait, priorBelief = null) {
  if (!trait.eligible) {
    return [{ action: "trait_review_inconclusive_low_reliability", subject: unit.name, domain: trait.domain }];
  }
  const rows = state.knowledge.filter((row) => row.kind === "trait"
    && row.subject.id === unit.id && row.claim.domain === trait.domain);
  const existing = rows[0] || null;
  if (!existing) {
    if (trait.level < 3) {
      return [{ action: "observed_subthreshold_trait_without_prior", subject: unit.name, domain: trait.domain, level: trait.level }];
    }
    const row = appendKnowledge(state, {
      kind: "trait",
      subject: unitRef(unit),
      scope: { type: "general", tags: [] },
      claim: clone(trait),
      relation: "first_impression",
      corrects: null,
      analysis,
      unit,
      trait,
    });
    return [{ action: "added_trait", knowledgeId: row.id, subject: unit.name, claim: row.claim.label }];
  }

  const priorLevel = priorBelief?.weightedSemanticLevel ?? existing.claim.level;
  const crossedSalienceBoundary = (priorLevel >= 3) !== (trait.level >= 3);
  const materiallyDifferent = Math.abs(priorLevel - trait.level) >= 2;
  if (crossedSalienceBoundary || materiallyDifferent) {
    const relevantTags = salientContextTags(analysis.environment?.tags || []);
    const scope = relevantTags.length > 0
      ? contextScope(relevantTags, unit.allyContext)
      : { type: "general_evidence", tags: [] };
    const sameScope = rows.find((row) => row.scope.type === scope.type
      && sameTags(row.scope.tags || [], scope.tags || [])
      && sameAllyScope(row.scope, unit.allyContext)
      && (row.claim.level >= 3) === (trait.level >= 3));
    if (sameScope) {
      supportKnowledge(sameScope, analysis, unit, trait);
      return [{ action: "supported_trait_context_revision", knowledgeId: sameScope.id, subject: unit.name, domain: trait.domain, level: trait.level }];
    }
    const row = appendKnowledge(state, {
      kind: "trait",
      subject: unitRef(unit),
      scope,
      claim: clone(trait),
      relation: "qualifies",
      corrects: existing.id,
      analysis,
      unit,
      trait,
    });
    return [{
      action: trait.level >= 3 ? "added_trait_context_strengthening" : "added_trait_context_correction",
      knowledgeId: row.id,
      subject: unit.name,
      domain: trait.domain,
      previousLevel: round(priorLevel),
      observedLevel: trait.level,
      corrects: existing.id,
    }];
  }

  supportKnowledge(existing, analysis, unit, trait);
  return [{ action: "supported_trait", knowledgeId: existing.id, subject: unit.name, claim: existing.claim.label }];
}

function appendKnowledge(state, input) {
  const createdOrder = state.nextKnowledgeId++;
  const row = {
    id: `impression:${createdOrder}`,
    kind: input.kind,
    subject: clone(input.subject),
    scope: clone(input.scope),
    claim: clone(input.claim),
    relation: input.relation,
    corrects: input.corrects,
    createdOrder,
    primacyWeight: round(1 + 1 / createdOrder),
    confidence: initialConfidence(input.unit, input.trait),
    evidenceCount: 1,
    evidenceReportIds: [input.analysis.reportId],
    observedContexts: [knowledgeContext(input.analysis, input.unit)],
    observations: input.kind === "strength"
      ? [buildStrengthObservation(input.analysis, input.unit)]
      : [],
  };
  state.knowledge.push(row);
  return row;
}

function supportKnowledge(row, analysis, unit, trait = null) {
  row.evidenceCount += 1;
  row.confidence = round(Math.min(1, row.confidence + 0.12 + Math.min(0.08, unit.eventCount * 0.005)));
  if (!row.evidenceReportIds.includes(analysis.reportId)) row.evidenceReportIds.push(analysis.reportId);
  row.observedContexts.push(knowledgeContext(analysis, unit));
  if (row.kind === "strength") {
    if (!Array.isArray(row.observations)) row.observations = [];
    row.observations.push(buildStrengthObservation(analysis, unit));
  }
  // Historical trait rows remain immutable. Current trait belief is synthesized from
  // the append-only trait-observation ledger, so later evidence never rewrites memory.
}

function buildStrengthObservation(analysis, unit) {
  return {
    subject: unitRef(unit),
    reportId: analysis.reportId,
    observationOrder: unit.subjectObservationOrder || analysis.observationOrder,
    globalBattleOrder: analysis.observationOrder,
    context: knowledgeContext(analysis, unit),
    allyContext: clone(unit.allyContext || null),
    basis: buildComparisonBasis(analysis, unit),
    claim: clone(unit.strength),
    evidenceReliability: 1,
  };
}

function buildTraitObservation(analysis, unit, trait) {
  return {
    subject: unitRef(unit),
    reportId: analysis.reportId,
    observationOrder: trait.subjectObservationOrder,
    globalBattleOrder: analysis.observationOrder,
    context: knowledgeContext(analysis, unit),
    allyContext: clone(unit.allyContext || null),
    basis: buildComparisonBasis(analysis, unit),
    claim: clone(trait),
    attempted: true,
    evidenceReliability: trait.evidenceReliability,
    eligible: trait.eligible,
  };
}

function buildCurrentStrengthBelief(state, subjectId) {
  const rows = state.knowledge.filter((row) => row.kind === "strength" && row.subject.id === subjectId);
  const observations = (state.strengthObservations || [])
    .filter((observation) => observation.subject?.id === subjectId);
  const belief = synthesizeStrengthBelief(subjectId, rows, observations, {
    id: `current-belief:${subjectId}`,
    scope: { type: "general_current_belief", tags: [] },
    relation: "synthesizes_observations",
    retrievalScore: 1000,
  });
  return applyCurrentStrengthScale(state, subjectId, belief);
}

function applyCurrentStrengthScale(state, subjectId, belief) {
  if (!belief) return null;
  const entry = state.strengthCognitionMatrix?.entries?.find((row) => row.subject?.id === subjectId);
  if (!entry?.scaleView) return belief;
  const priorClaim = clone(belief.claim);
  const currentLevel = Number(entry.scaleView.level || 0);
  const scaleClaim = strengthClaimFromLevel(currentLevel, 0);
  belief.relation = "matrix_scale_current_belief";
  belief.claim = {
    ...scaleClaim,
    matrixPosition: round(entry.position),
    scaleBoundaryPosition: round(entry.scaleView.boundaryPosition),
    relativeToScale: round(entry.scaleView.relativeToScale),
    inTopThirtyPercent: Boolean(entry.scaleView.inTopThirtyPercent),
    observationSynthesis: priorClaim,
  };
  belief.observationWeightedSemanticLevel = belief.weightedSemanticLevel;
  belief.weightedSemanticLevel = round(entry.scaleView.relativeToScale);
  belief.matrixUpdateRule = "one simultaneous weighted pairwise solve, then current position minus the live top-30-percent boundary";
  belief.scale = clone(state.strengthCognitionMatrix.scale);
  belief.rank = entry.scaleView.rank;
  belief.cognitionStiffness = entry.stiffness;
  return belief;
}

function listCurrentStrengthCognition(state) {
  return (state.strengthCognitionMatrix?.entries || [])
    .filter((entry) => entry.scaleView)
    .slice()
    .sort((a, b) => a.scaleView.rank - b.scaleView.rank)
    .map((entry) => ({
      subject: clone(entry.subject),
      position: round(entry.position),
      evidenceCount: entry.evidenceCount,
      stiffness: round(entry.stiffness),
      rank: entry.scaleView.rank,
      populationSize: entry.scaleView.populationSize,
      inTopThirtyPercent: entry.scaleView.inTopThirtyPercent,
      scaleBoundaryPosition: round(entry.scaleView.boundaryPosition),
      relativeToScale: round(entry.scaleView.relativeToScale),
      level: entry.scaleView.level,
      label: strengthClaimFromLevel(entry.scaleView.level, 0).label,
    }));
}

function buildContextStrengthBelief(state, subjectId, contextTags, options = {}) {
  const tagSet = new Set(contextTags);
  const observations = (state.strengthObservations || []).filter((observation) => {
    if (observation.subject?.id !== subjectId) return false;
    const observedTags = salientContextTags(observation.context?.tags || []);
    return observedTags.length === tagSet.size && observedTags.every((tag) => tagSet.has(tag))
      && observationMatchesAllyQuery(observation, options);
  });
  const rows = state.knowledge.filter((row) => row.kind === "strength"
    && row.subject.id === subjectId && rowHasExactContext(row, tagSet));
  return synthesizeStrengthBelief(subjectId, rows, observations, {
    id: `context-belief:${subjectId}:${contextTags.join("+")}`,
    scope: { type: "exact_context_current_belief", tags: contextTags },
    relation: "synthesizes_exact_context_observations",
    retrievalScore: 2000,
  });
}

function buildCurrentTraitBeliefs(state, subjectId) {
  const domains = [...new Set((state.traitObservations || [])
    .filter((observation) => observation.subject?.id === subjectId && observation.eligible)
    .map((observation) => observation.claim.domain))];
  return domains.map((domain) => buildCurrentTraitBelief(state, subjectId, domain)).filter(Boolean);
}

function buildCurrentTraitBelief(state, subjectId, domain) {
  const rows = state.knowledge.filter((row) => row.kind === "trait"
    && row.subject.id === subjectId && row.claim.domain === domain);
  const observations = (state.traitObservations || []).filter((observation) => observation.subject?.id === subjectId
    && observation.claim?.domain === domain && observation.eligible);
  return synthesizeTraitBelief(subjectId, domain, rows, observations, {
    id: `current-trait-belief:${subjectId}:${domain}`,
    scope: { type: "general_current_trait_belief", tags: [] },
    relation: "synthesizes_trait_revalidation",
    retrievalScore: 900,
  });
}

function buildContextTraitBeliefs(state, subjectId, contextTags, options = {}) {
  const tagSet = new Set(contextTags);
  const generalBeliefs = buildCurrentTraitBeliefs(state, subjectId);
  const matching = (state.traitObservations || []).filter((observation) => {
    if (observation.subject?.id !== subjectId || !observation.eligible) return false;
    const observedTags = salientContextTags(observation.context?.tags || []);
    return observedTags.length === tagSet.size && observedTags.every((tag) => tagSet.has(tag))
      && observationMatchesAllyQuery(observation, options);
  });
  const domains = [...new Set(matching.map((observation) => observation.claim.domain))];
  if (domains.length === 0) return generalBeliefs;
  const exactBeliefs = domains.map((domain) => {
    const observations = matching.filter((observation) => observation.claim.domain === domain);
    const rows = state.knowledge.filter((row) => row.kind === "trait"
      && row.subject.id === subjectId && row.claim.domain === domain);
    return synthesizeTraitBelief(subjectId, domain, rows, observations, {
      id: `context-trait-belief:${subjectId}:${domain}:${contextTags.join("+")}`,
      scope: { type: "exact_context_current_trait_belief", tags: contextTags },
      relation: "synthesizes_exact_context_trait_revalidation",
      retrievalScore: 1900,
    });
  }).filter(Boolean);
  const generalFallbacks = generalBeliefs.filter((belief) => !domains.includes(belief.claim.domain));
  return [...exactBeliefs, ...generalFallbacks];
}

function synthesizeTraitBelief(subjectId, domain, rows, observations, metadata) {
  if (observations.length === 0) return null;
  let weightedLevel = 0;
  let weightedMagnitude = 0;
  let totalWeight = 0;
  for (const observation of observations) {
    const order = Math.max(1, Number(observation.observationOrder || 1));
    const weight = Math.max(0.1, Number(observation.evidenceReliability || 1)) * (1 + 1 / order);
    weightedLevel += Number(observation.claim.level || 0) * weight;
    weightedMagnitude += Number(observation.claim.rawMagnitudePercent || 0) * weight;
    totalWeight += weight;
  }
  const meanLevel = totalWeight > 0 ? weightedLevel / totalWeight : 0;
  const level = Math.max(0, Math.min(9, Math.round(meanLevel)));
  const firstRow = rows.slice().sort((a, b) => a.createdOrder - b.createdOrder)[0];
  return {
    id: metadata.id,
    kind: "trait",
    subject: clone(firstRow?.subject || observations[0].subject),
    scope: clone(metadata.scope),
    claim: {
      domain,
      label: DOMAIN_LABELS[domain],
      rawMagnitudePercent: round(totalWeight > 0 ? weightedMagnitude / totalWeight : 0),
      level,
      currentSalient: level >= 3,
      status: level >= 3 ? "currently_recognized_trait" : "currently_not_salient",
      synthesized: true,
    },
    relation: metadata.relation,
    corrects: null,
    firstImpressionId: firstRow?.id || null,
    observationCount: observations.length,
    weightedSemanticLevel: round(meanLevel),
    primacyRule: "trait observation weight = evidence reliability * (1 + 1 / subject-domain observation order)",
    sourceKnowledgeIds: rows.map((row) => row.id),
    evidenceBasis: observations.map((observation) => ({
      reportId: observation.reportId,
      context: clone(observation.context),
      basis: clone(observation.basis),
      observedLevel: observation.claim.level,
      evidenceReliability: observation.evidenceReliability,
    })),
    retrievalScore: metadata.retrievalScore,
  };
}

function synthesizeStrengthBelief(subjectId, rows, observations, metadata) {
  if (observations.length === 0) return null;

  let weightedLevel = 0;
  let weightedRawPercent = 0;
  let totalWeight = 0;
  for (const observation of observations) {
    const order = Math.max(1, Number(observation.observationOrder || 1));
    const primacy = 1 + 1 / order;
    const reliability = Math.max(0.1, Number(observation.evidenceReliability || 1));
    const weight = primacy * reliability;
    weightedLevel += Number(observation.claim?.level || 0) * weight;
    weightedRawPercent += Number(observation.claim?.rawPercent || 0) * weight;
    totalWeight += weight;
  }

  const meanLevel = totalWeight > 0 ? weightedLevel / totalWeight : 0;
  const level = Math.max(-3, Math.min(9, Math.round(meanLevel)));
  const firstRow = rows.slice().sort((a, b) => a.createdOrder - b.createdOrder)[0];
  return {
    id: metadata.id,
    kind: "strength",
    subject: clone(firstRow?.subject || observations[0].subject),
    scope: clone(metadata.scope),
    claim: strengthClaimFromLevel(level, totalWeight > 0 ? weightedRawPercent / totalWeight : 0),
    relation: metadata.relation,
    corrects: null,
    firstImpressionId: firstRow?.id || null,
    observationCount: observations.length,
    weightedSemanticLevel: round(meanLevel),
    primacyRule: "observation weight = evidence reliability * (1 + 1 / subject observation order)",
    sourceKnowledgeIds: rows.map((row) => row.id),
    measurementBasis: "team_relative_useful_contribution",
    evidenceBasis: observations.map((observation) => ({
      reportId: observation.reportId,
      context: clone(observation.context),
      basis: clone(observation.basis || null),
      observedLevel: observation.claim.level,
      evidenceReliability: observation.evidenceReliability,
    })),
    predictionBasisAvailable: observations.every((observation) => observation.basis
      && Number.isFinite(observation.basis.subjectUsefulContribution)
      && Number.isFinite(observation.basis.expectedUnitContribution)
      && Array.isArray(observation.basis.teamContributions)),
    retrievalScore: metadata.retrievalScore,
  };
}

function strengthClaimFromLevel(level, rawPercent) {
  const negativeLabels = { "-1": "有点弱", "-2": "明显偏弱", "-3": "非常弱" };
  return {
    rawPercent: round(rawPercent),
    cappedPercent: round(Math.max(-100, Math.min(150, rawPercent))),
    level,
    label: level < 0 ? negativeLabels[String(level)] : STRENGTH_LABELS[level],
    direction: level < 0 ? "weak" : level > 0 ? "strong" : "neutral",
    synthesized: true,
  };
}

function retrievalScore(row, contextTags) {
  if (row.scope.type === "context") {
    if (row.scope.tags.length !== contextTags.size || !row.scope.tags.every((tag) => contextTags.has(tag))) return -Infinity;
    return 100 + row.scope.tags.length * 5 + row.primacyWeight * row.confidence + Math.min(1, row.evidenceCount / 5);
  }
  if (contextTags.size > 0 && rowHasExactContext(row, contextTags)) {
    return 90 + row.primacyWeight * row.confidence + Math.min(1, row.evidenceCount / 5);
  }
  return 10 + row.primacyWeight * row.confidence + Math.min(1, row.evidenceCount / 5);
}

function rowHasExactContext(row, contextTags) {
  if (row.scope.type === "context") {
    return row.scope.tags.length === contextTags.size && row.scope.tags.every((tag) => contextTags.has(tag));
  }
  return (row.observedContexts || []).some((context) => {
    const tags = salientContextTags(context.tags || []);
    return tags.length === contextTags.size && tags.every((tag) => contextTags.has(tag));
  });
}

function buildTrait(domain, value, unitTotal, expectedUnitContribution, profile, evidence = null) {
  if (!DOMAIN_LABELS[domain] || value <= 0 || expectedUnitContribution <= 0) return null;
  const rawMagnitudePercent = value / expectedUnitContribution * 100;
  const perceived = perceivePositive(rawMagnitudePercent, profile);
  const reliability = rawDomainEvidenceReliability(evidence);
  return {
    domain,
    label: DOMAIN_LABELS[domain],
    rawMagnitudePercent: round(rawMagnitudePercent),
    cappedMagnitudePercent: round(Math.min(150, rawMagnitudePercent)),
    level: perceived.level,
    intensityLabel: perceived.label,
    purity: unitTotal > 0 ? round(value / unitTotal) : 0,
    evidenceQuality: reliability >= 0.8 ? "high" : reliability >= 0.5 ? "medium" : "low",
    evidenceReliability: round(reliability),
    eligible: domainEvidenceEligible(evidence),
  };
}

function perceiveSigned(relativePercent, profile) {
  if (relativePercent >= 0) {
    const perceived = perceivePositive(relativePercent, profile);
    return { ...perceived, label: STRENGTH_LABELS[perceived.level], direction: perceived.level === 0 ? "neutral" : "strong" };
  }
  const magnitude = Math.min(100, Math.abs(relativePercent));
  const band = NEGATIVE_BANDS.find(([upper]) => magnitude < upper) || NEGATIVE_BANDS.at(-1);
  return {
    rawPercent: round(relativePercent),
    cappedPercent: round(-magnitude),
    level: band[1],
    label: band[2],
    direction: band[1] === 0 ? "neutral" : "weak",
    provisionalNegativeBand: true,
  };
}

function perceivePositive(percent, profile) {
  const raw = Math.max(0, Number(percent || 0));
  const capped = Math.min(150, raw);
  const band = POSITIVE_BANDS[profile].find(([upper]) => capped < upper) || POSITIVE_BANDS[profile].at(-1);
  return { rawPercent: round(raw), cappedPercent: round(capped), level: band[1], label: band[2] };
}

function effectiveAmount(event) {
  const result = event.result || {};
  const before = Number(result.hpBefore);
  const after = Number(result.hpAfter);
  if (event.type === "damage" && Number.isFinite(before) && Number.isFinite(after)) return Math.max(0, before - after);
  if (event.type === "heal" && Number.isFinite(before) && Number.isFinite(after)) return Math.max(0, after - before);
  return Math.max(0, Number(result.amount || result.utility || 0));
}

function createActorRow(unit) {
  return {
    id: unit.id,
    name: unit.name,
    role: unit.role,
    channels: { damage: 0, healing: 0, shieldAbsorbed: 0, damagePrevented: 0, controlValue: 0 },
    domains: { area_damage: 0, single_target_damage: 0, sustained_damage: 0, healing: 0, shielding: 0, control: 0, durability: 0 },
    domainEvidence: Object.fromEntries(Object.keys(DOMAIN_LABELS).map((domain) => [domain, { high: 0, medium: 0, low: 0 }])),
    evidenceEventIds: [],
    eventCount: 0,
  };
}

function addDomainEvidence(actor, domain, value, quality) {
  if (!actor.domainEvidence[domain]) actor.domainEvidence[domain] = { high: 0, medium: 0, low: 0 };
  actor.domainEvidence[domain][quality] += Math.max(0, Number(value || 0));
}

function scaleDomainEvidence(actor, domain, scale) {
  const row = actor.domainEvidence[domain];
  if (!row) return;
  for (const quality of Object.keys(row)) row[quality] *= scale;
}

function summarizeDomainEvidence(input) {
  return Object.fromEntries(Object.entries(input).map(([domain, evidence]) => {
    const reliability = rawDomainEvidenceReliability(evidence);
    return [domain, {
      high: round(evidence.high),
      medium: round(evidence.medium),
      low: round(evidence.low),
      reliability: round(reliability),
      quality: reliability >= 0.8 ? "high" : reliability >= 0.5 ? "medium" : "low",
    }];
  }));
}

function scoreDomainEvidence(evidence = null) {
  return round(rawDomainEvidenceReliability(evidence));
}

function rawDomainEvidenceReliability(evidence = null) {
  const total = sum(Object.values(evidence || {}));
  if (total <= 0) return 0;
  return Object.entries(DOMAIN_EVIDENCE_WEIGHTS)
    .reduce((value, [quality, weight]) => value + Number(evidence?.[quality] || 0) * weight, 0) / total;
}

function domainEvidenceEligible(evidence = null) {
  return rawDomainEvidenceReliability(evidence) >= DOMAIN_EVIDENCE_THRESHOLD;
}

function derivePlayerTeam(eventLog, gameEvent) {
  const units = new Map();
  const combatTypes = new Set(["skill", "damage", "heal", "shield", "shield_absorb", "shield_block", "damage_prevented", "control_prevented_action", "death"]);
  for (const event of eventLog) {
    if (!combatTypes.has(event.type)) continue;
    if (event.subject?.side === "left" && event.subject?.id) {
      if (event.subject.id === "player_squad") continue;
      units.set(event.subject.id, {
        id: event.subject.id,
        name: event.subject.name || event.subject.id,
        role: event.subject.role || "unknown",
        side: "left",
      });
    }
    if (event.result?.target?.side === "left" && event.result?.target?.id) {
      if (event.result.target.id === "player_squad") continue;
      units.set(event.result.target.id, {
        id: event.result.target.id,
        name: event.result.target.name || event.result.target.id,
        role: event.result.target.role || "unknown",
        side: "left",
      });
    }
  }
  for (const contribution of gameEvent?.contributions || []) {
    if ([...units.values()].some((unit) => unit.name === contribution.name)) continue;
    const id = `visible-unit:${slug(contribution.name || contribution.role || units.size + 1)}`;
    units.set(id, { id, name: contribution.name || id, role: contribution.role || "unknown", side: "left" });
  }
  return [...units.values()];
}

function initialConfidence(unit, trait) {
  const evidence = trait ? Math.max(1, Math.round(trait.purity * unit.eventCount)) : unit.eventCount;
  return round(Math.min(0.78, 0.42 + evidence * 0.035));
}

function salientContextTags(tags) {
  const priority = ["high_armor", "low_armor", "swarm", "mixed", "elite", "boss", "ranged_pressure", "magic_pressure"];
  const selected = priority.filter((tag) => tags.includes(tag)).slice(0, 2);
  return selected.length ? selected : tags.slice(0, 2);
}

function buildAllyContext(units, subjectId, profile) {
  const subject = units.find((unit) => unit.id === subjectId);
  const teammates = units.filter((unit) => unit.id !== subjectId).map((unit) => {
    const relativeToSubjectPercent = subject?.usefulContribution > 0
      ? (unit.usefulContribution / subject.usefulContribution - 1) * 100
      : 0;
    const comparedToSubject = perceiveSigned(relativeToSubjectPercent, profile);
    return {
      id: unit.id,
      name: unit.name,
      role: unit.role,
      usefulContribution: unit.usefulContribution,
      relativeToSubjectPercent: round(relativeToSubjectPercent),
      perceivedComparedToSubjectLevel: comparedToSubject.level,
      perceivedComparedToSubjectDirection: comparedToSubject.direction,
    };
  });
  const weakCount = teammates.filter((unit) => unit.perceivedComparedToSubjectDirection === "weak").length;
  const strongCount = teammates.filter((unit) => unit.perceivedComparedToSubjectDirection === "strong").length;
  const neutralCount = teammates.length - weakCount - strongCount;
  const majority = Math.max(1, Math.ceil(teammates.length * 2 / 3));
  let performanceBand = "mixed_or_balanced";
  if (weakCount >= majority) performanceBand = "mostly_weak_teammates";
  else if (strongCount >= majority) performanceBand = "mostly_strong_teammates";
  else if (weakCount > strongCount) performanceBand = "weak_leaning_teammates";
  else if (strongCount > weakCount) performanceBand = "strong_leaning_teammates";
  const descriptions = {
    mostly_weak_teammates: "在多数队友表现偏弱的队伍中",
    mostly_strong_teammates: "在多数队友表现偏强的队伍中",
    weak_leaning_teammates: "在队友表现整体偏弱的队伍中",
    strong_leaning_teammates: "在队友表现整体偏强的队伍中",
    mixed_or_balanced: "在队友表现混合或接近平均的队伍中",
  };
  return {
    performanceBand,
    description: descriptions[performanceBand],
    weakCount,
    neutralCount,
    strongCount,
    rosterFingerprint: teammates.map((unit) => unit.id).sort().join("|"),
    teammates,
  };
}

function buildComparisonBasis(analysis, unit) {
  return {
    type: "team_relative_useful_contribution",
    subjectUsefulContribution: unit.usefulContribution,
    teamUsefulContribution: analysis.teamUsefulContribution,
    expectedUnitContribution: analysis.expectedUnitContribution,
    activeUnitCount: analysis.units.length,
    rosterFingerprint: analysis.units.map((row) => row.id).sort().join("|"),
    allyPerformanceBand: unit.allyContext?.performanceBand || "unknown",
    teamContributions: analysis.units.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      usefulContribution: row.usefulContribution,
      relativeStrengthPercent: row.relativeStrengthPercent,
      perceivedLevel: row.strength.level,
    })),
  };
}

function knowledgeContext(analysis, unit) {
  return {
    ...clone(analysis.environment || {}),
    allies: clone(unit.allyContext || null),
  };
}

function contextScope(tags, allyContext) {
  return {
    type: "context",
    tags,
    allyPerformanceBand: allyContext?.performanceBand || "unknown",
    rosterFingerprint: allyContext?.rosterFingerprint || "",
  };
}

function sameAllyScope(scope, allyContext) {
  if (!scope?.allyPerformanceBand && !scope?.rosterFingerprint) return true;
  return scope.allyPerformanceBand === (allyContext?.performanceBand || "unknown")
    && scope.rosterFingerprint === (allyContext?.rosterFingerprint || "");
}

function observationMatchesAllyQuery(observation, options = {}) {
  if (options.allyPerformanceBand
    && observation.allyContext?.performanceBand !== options.allyPerformanceBand) return false;
  if (options.rosterFingerprint
    && observation.basis?.rosterFingerprint !== options.rosterFingerprint) return false;
  return true;
}

function unitRef(unit) { return { id: unit.id, name: unit.name, role: unit.role }; }
function sameTags(a, b) { return a.length === b.length && a.every((tag) => b.includes(tag)); }
function slug(value) { return String(value).trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-"); }
function sum(values) { return values.reduce((total, value) => total + Number(value || 0), 0); }
function round(value, digits = 3) { return Number(Number(value || 0).toFixed(digits)); }
function roundObject(input) { return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, round(value)])); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

module.exports = {
  DOMAIN_LABELS,
  STRENGTH_LABELS,
  POSITIVE_BANDS,
  NEGATIVE_BANDS,
  DOMAIN_EVIDENCE_WEIGHTS,
  DOMAIN_EVIDENCE_THRESHOLD,
  AGENT_INTERPRETATION_POLICY,
  analyzeBattleReport,
  createImpressionState,
  ingestBattleAnalysis,
  retrieveImpressions,
  perceivePositive,
  perceiveSigned,
  scoreDomainEvidence,
  domainEvidenceEligible,
  listCurrentStrengthCognition,
  STRENGTH_MATRIX,
};
