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
    const traits = Object.entries(actor.domains)
      .map(([domain, value]) => buildTrait(domain, value, actor.usefulContribution, expectedUnitContribution, profile, actor.domainEvidence[domain]))
      .filter((trait) => trait && trait.level >= 3 && trait.eligible)
      .sort((a, b) => b.level - a.level || b.rawMagnitudePercent - a.rawMagnitudePercent);
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
      evidenceEventIds: actor.evidenceEventIds,
      eventCount: actor.eventCount,
    };
  });

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
  return {
    schema: "entity_impression_knowledge_v1",
    profile: POSITIVE_BANDS[options.profile] ? options.profile : "ordinary",
    battleCount: 0,
    nextKnowledgeId: 1,
    knowledge: [],
    strengthObservations: [],
    observationTrace: [],
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
  for (const unit of analysis.units) {
    state.strengthObservations.push(buildStrengthObservation(analysis, unit));
    changes.push(...updateStrengthKnowledge(state, analysis, unit));
    for (const trait of unit.traits) changes.push(...updateTraitKnowledge(state, analysis, unit, trait));
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

function retrieveImpressions(state, subjectId, contextTags = []) {
  const normalizedContextTags = salientContextTags(contextTags);
  const tags = new Set(normalizedContextTags);
  const rows = state.knowledge
    .filter((row) => row.subject.id === subjectId)
    .map((row) => ({ row, score: retrievalScore(row, tags) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score || a.row.createdOrder - b.row.createdOrder)
    .map((entry) => ({ ...clone(entry.row), retrievalScore: round(entry.score) }));
  const currentBelief = buildCurrentStrengthBelief(state, subjectId);
  if (normalizedContextTags.length > 0) {
    const contextBelief = buildContextStrengthBelief(state, subjectId, normalizedContextTags);
    if (contextBelief) return [contextBelief, ...rows];
    return currentBelief ? [currentBelief, ...rows] : rows;
  }
  return currentBelief ? [currentBelief, ...rows] : rows;
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
      && Math.sign(row.claim.level) === Math.sign(unit.strength.level));
    if (sameScope) {
      supportKnowledge(sameScope, analysis, unit);
      return [{ action: "supported_context_correction", knowledgeId: sameScope.id, subject: unit.name, claim: sameScope.claim.label }];
    }
    const row = appendKnowledge(state, {
      kind: "strength",
      subject: unitRef(unit),
      scope: relevantTags.length > 0
        ? { type: "context", tags: relevantTags }
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

function updateTraitKnowledge(state, analysis, unit, trait) {
  const rows = state.knowledge.filter((row) => row.kind === "trait"
    && row.subject.id === unit.id && row.claim.domain === trait.domain);
  const existing = rows[0];
  if (existing) {
    supportKnowledge(existing, analysis, unit, trait);
    if (trait.level > existing.claim.level) existing.claim = clone(trait);
    return [{ action: "supported_trait", knowledgeId: existing.id, subject: unit.name, claim: existing.claim.label }];
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
    observedContexts: [clone(input.analysis.environment)],
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
  row.observedContexts.push(clone(analysis.environment));
  if (row.kind === "strength") {
    if (!Array.isArray(row.observations)) row.observations = [];
    row.observations.push(buildStrengthObservation(analysis, unit));
  }
  if (trait && trait.level > row.claim.level) row.claim = clone(trait);
}

function buildStrengthObservation(analysis, unit) {
  return {
    subject: unitRef(unit),
    reportId: analysis.reportId,
    observationOrder: analysis.observationOrder,
    context: clone(analysis.environment),
    claim: clone(unit.strength),
    evidenceReliability: 1,
  };
}

function buildCurrentStrengthBelief(state, subjectId) {
  const rows = state.knowledge.filter((row) => row.kind === "strength" && row.subject.id === subjectId);
  const observations = (state.strengthObservations || [])
    .filter((observation) => observation.subject?.id === subjectId);
  return synthesizeStrengthBelief(subjectId, rows, observations, {
    id: `current-belief:${subjectId}`,
    scope: { type: "general_current_belief", tags: [] },
    relation: "synthesizes_observations",
    retrievalScore: 1000,
  });
}

function buildContextStrengthBelief(state, subjectId, contextTags) {
  const tagSet = new Set(contextTags);
  const observations = (state.strengthObservations || []).filter((observation) => {
    if (observation.subject?.id !== subjectId) return false;
    const observedTags = salientContextTags(observation.context?.tags || []);
    return observedTags.length === tagSet.size && observedTags.every((tag) => tagSet.has(tag));
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
    primacyRule: "observation weight = evidence reliability * (1 + 1 / observation order)",
    sourceKnowledgeIds: rows.map((row) => row.id),
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
};
