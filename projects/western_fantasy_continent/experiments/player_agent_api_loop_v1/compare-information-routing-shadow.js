const fs = require("node:fs");
const path = require("node:path");
const ROUTER = require("./received-information-organizer");
const ENTITY_IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");

const DEFAULT_SESSION = path.join(
  __dirname,
  "..",
  "..",
  ".local_run_archive",
  "player_agent_api_loop_v1",
  "controlled_runs",
  "2026-07-17_enriched_two_chapter",
  "open_novice",
  "paired-alpha",
  "session.json",
);

function compareSession(sessionPath = DEFAULT_SESSION) {
  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  const records = [
    ...(session.chapter1?.history || []).map((record) => ({ chapter: "chapter1", record })),
    ...(session.chapter2?.history || []).map((record) => ({ chapter: "chapter2", record })),
  ].filter(({ record }) => (
    String(record.action || "").startsWith("challenge:")
    && Array.isArray(record.rawEventLog)
    && Array.isArray(record.eventLog)
  ));
  const comparisons = records.map(({ chapter, record }) => (
    compareChallenge(chapter, record, session.perceptionProfile || "ordinary")
  ));

  const legacyCategoryCounts = countValues(comparisons.flatMap((row) => row.legacy.categories));
  const routedCategoryCounts = countValues(comparisons.flatMap((row) => row.routed.categories));
  const keyCheckTotals = summarizeChecks(comparisons.flatMap((row) => row.keyChecks));
  const legacySubjects = comparisons.reduce((sum, row) => sum + row.entity.legacySubjectCount, 0);
  const routedSubjects = comparisons.reduce((sum, row) => sum + row.entity.routedSubjectCount, 0);
  const matchedStableSubjects = comparisons.reduce(
    (sum, row) => sum + row.entity.matchedStableSubjectCount,
    0,
  );
  const fineDomains = comparisons.reduce((sum, row) => sum + row.entity.legacyFineDomainCount, 0);
  const exactFineDomains = comparisons.reduce((sum, row) => sum + row.entity.exactFineDomainCount, 0);
  const coarseDomains = comparisons.reduce((sum, row) => sum + row.entity.coarseDomainCount, 0);
  const oldEvidenceIds = comparisons.reduce((sum, row) => sum + row.noise.legacyRawEvidenceIdCount, 0);
  const publicSignalIds = comparisons.reduce((sum, row) => sum + row.noise.routedPublicSignalIdCount, 0);
  const diagnosisRows = comparisons.reduce((sum, row) => sum + row.noise.legacyDiagnosisKnowledgeRows, 0);
  const internalAggregateRows = comparisons.reduce(
    (sum, row) => sum + row.noise.legacyInternalAggregateRows,
    0,
  );

  const criticalGaps = [];
  if (routedSubjects < legacySubjects) {
    criticalGaps.push({
      id: "incomplete_four_character_evidence",
      message: `旧版共更新${legacySubjects}个角色场次，新版只形成${routedSubjects}个角色证据，低贡献角色会整场缺席。`,
    });
  }
  if (matchedStableSubjects < legacySubjects) {
    criticalGaps.push({
      id: "character_identity_not_stable",
      message: `旧版${legacySubjects}个角色场次使用永久角色ID，新版只有${matchedStableSubjects}个证据能直接对回永久ID；其余使用战斗内left-*身份。`,
    });
  }
  if (fineDomains && exactFineDomains < fineDomains) {
    criticalGaps.push({
      id: "trait_domain_detail_lost",
      message: `旧版共有${fineDomains}个细粒度特点领域证据，新版精确保留${exactFineDomains}个；只在粗粒度上覆盖${coarseDomains}个。`,
    });
  }
  const rosterPerformanceMissing = comparisons.filter((row) => (
    row.legacy.rosterPerformanceScore != null
    && row.routed.rosterPerformanceScore == null
  ));
  if (rosterPerformanceMissing.length) {
    criticalGaps.push({
      id: "roster_performance_missing",
      message: `${rosterPerformanceMissing.length}/${comparisons.length}场的旧换人历史有连续表现分，新版路由没有携带。`,
    });
  }

  const importantCheckFailures = Object.entries(keyCheckTotals)
    .filter(([, value]) => value.required > value.preserved)
    .map(([id, value]) => ({
      id,
      required: value.required,
      preserved: value.preserved,
      missing: value.required - value.preserved,
    }));

  return {
    schema: "received_information_shadow_comparison_v1",
    source: {
      sessionPath,
      profile: session.perceptionProfile || "ordinary",
      challengeCount: comparisons.length,
      outcomes: countValues(comparisons.map((row) => row.outcome)),
      distinctNodes: unique(comparisons.map((row) => row.node)).length,
    },
    verdict: criticalGaps.length ? "NOT_READY_OVER_SIMPLIFIED" : "READY_FOR_SHADOW_INTEGRATION",
    criticalGaps,
    semanticCoverage: {
      legacyCategoryCounts,
      routedCategoryCounts,
      keyChecks: keyCheckTotals,
      importantCheckFailures,
    },
    entityImpressions: {
      legacyCharacterBattleEntries: legacySubjects,
      routedCharacterBattleEntries: routedSubjects,
      evidenceEntryCoverage: ratio(routedSubjects, legacySubjects),
      matchedStableCharacterEntries: matchedStableSubjects,
      stableIdentityCoverage: ratio(matchedStableSubjects, legacySubjects),
      legacyFineDomainEvidence: fineDomains,
      exactFineDomainEvidencePreserved: exactFineDomains,
      coarseDomainEvidencePreserved: coarseDomains,
      exactFineDomainCoverage: ratio(exactFineDomains, fineDomains),
      coarseDomainCoverage: ratio(coarseDomains, fineDomains),
    },
    unnecessaryInformationRemoved: {
      legacyRawEvidenceIds: oldEvidenceIds,
      routedOpaquePublicSignalIds: publicSignalIds,
      reduction: ratio(oldEvidenceIds - publicSignalIds, oldEvidenceIds),
      legacyDiagnosisKnowledgeRowsRemoved: diagnosisRows,
      legacyInternalAggregateMetricRowsRemoved: internalAggregateRows,
      internalSettlementSignalsRouted: comparisons.reduce(
        (sum, row) => sum + row.noise.routedInternalSettlementSignals,
        0,
      ),
      interpretation: [
        "原始逐帧事件ID已压缩为公开语义信号ID。",
        "diagnosis中的伤害类型答案不再直接成为玩家知识。",
        "d50、d90、命中次数和敌方精确聚合等内部统计不再单独塞进因果知识。",
        "A/C、动作汇总和内部换人实验没有进入知识路由。",
      ],
    },
    representativeGaps: {
      missingCharacters: comparisons
        .filter((row) => row.entity.missingSubjectIds.length)
        .slice(0, 5)
        .map(compactGap),
      fineTraitDomains: comparisons
        .filter((row) => row.entity.missingFineDomains.length)
        .slice(0, 5)
        .map(compactGap),
      failedKeyChecks: comparisons
        .filter((row) => row.keyChecks.some((check) => check.required && !check.preserved))
        .slice(0, 8)
        .map((row) => ({
          node: row.node,
          outcome: row.outcome,
          failed: row.keyChecks
            .filter((check) => check.required && !check.preserved)
            .map((check) => check.id),
        })),
    },
    perBattle: comparisons,
  };
}

function compareChallenge(chapter, record, perceptionProfile) {
  const legacyRows = [
    ...(record.learningDelta?.addedKnowledge || []),
    ...(record.learningDelta?.updatedKnowledge || []),
  ];
  const legacyCategories = unique(legacyRows.map(legacyKnowledgeCategory).filter(Boolean));
  const roster = record.rosterExpectationUpdate || {};
  const routed = ROUTER.organizeReceivedBattleInformation(record.rawEventLog, {
    seed: `shadow:${chapter}:${record.cycle}:${record.action}`,
    episodeId: `shadow:${chapter}:${record.cycle}`,
    perceptionLevel: normalizePerceptionProfile(perceptionProfile),
    rosterContext: {
      teamIds: roster.teamIds || [],
      equippedPower: roster.equippedPower,
      equipmentFingerprint: roster.equipmentFingerprint,
    },
  });
  const routedCategories = unique(
    routed.receivedObservations.map((row) => routedObservationCategory(row.sourceSignalType)),
  ).filter(Boolean);

  const oldAnalysis = analyzeLegacyEntity(record, roster);
  const currentStrength = record.entityImpressionUpdate?.currentStrengthCognition || [];
  const stableSubjectById = new Map(currentStrength.map((row) => [
    row.subject?.id,
    row.subject,
  ]));
  const legacySubjects = new Set(
    (record.entityImpressionUpdate?.movements || []).map((row) => row.id),
  );
  const routedPacket = routed.routes.entityImpressions?.[0] || { characterEvidence: [] };
  const routedRosterHistory = routed.routes.rosterHistory || [];
  const routedSubjects = new Set(
    routedPacket.characterEvidence.map((row) => row.subject.id),
  );
  const routedLabels = new Set(
    routedPacket.characterEvidence.map((row) => row.subject.label),
  );
  const matchedStableSubjectIds = [...legacySubjects].filter((id) => routedSubjects.has(id));
  const matchedByVisibleNameIds = [...legacySubjects].filter((id) => (
    routedLabels.has(stableSubjectById.get(id)?.name)
  ));
  const legacyDomains = collectLegacyDomains(oldAnalysis);
  const routedDomains = collectRoutedDomains(routedPacket);
  const exactFineDomains = legacyDomains.filter((row) => (
    routedDomains.byId.get(row.subjectId)?.has(row.domain)
  ));
  const coarseDomains = legacyDomains.filter((row) => (
    coarseDomainCovered(
      row.domain,
      routedDomains.byId.get(row.subjectId)
        || routedDomains.byLabel.get(row.subjectName)
        || new Set(),
    )
  ));
  const missingFineDomains = legacyDomains
    .filter((row) => !routedDomains.byId.get(row.subjectId)?.has(row.domain))
    .map((row) => `${row.subjectId}:${row.domain}`);

  const oldDropRows = legacyRows.filter((row) => legacyKnowledgeCategory(row) === "reward_observation");
  const oldDropCount = oldDropRows.reduce((sum, row) => (
    sum + Number(row.latestResult?.drops?.length || 0)
  ), 0);
  const oldCharacterUnlock = legacyCategories.includes("character_progression");
  const oldMapUnlock = legacyCategories.includes("map_progression");
  const oldField = legacyCategories.includes("field_mechanic");
  const oldProbability = record.eventLog.some((event) => (
    event.type === "loot_outcome"
    && event.probability?.opportunity === true
  ));
  const newLootCount = routed.receivedObservations.filter((row) => (
    row.sourceSignalType === "visible_loot"
  )).length;
  const keyChecks = [
    check("encounter_result", legacyCategories.includes("encounter_result"), routedCategories.includes("encounter_result")),
    check("map_progression", oldMapUnlock, routedCategories.includes("map_progression")),
    check("loot_identity", oldDropCount > 0, newLootCount >= Math.min(3, oldDropCount)),
    check("character_progression", oldCharacterUnlock, routedCategories.includes("character_progression")),
    check("field_mechanic", oldField, routedCategories.includes("field_mechanic")),
    check("probability_opportunity", oldProbability, routed.routes.probabilityLedger.length > 0),
    check("roster_history", Boolean(record.rosterExpectationUpdate), routedRosterHistory.length > 0),
    check("all_character_subjects", legacySubjects.size > 0, (
      [...legacySubjects].every((id) => routedSubjects.has(id))
    )),
    check("all_character_visible_names", legacySubjects.size > 0, (
      [...legacySubjects].every((id) => routedLabels.has(stableSubjectById.get(id)?.name))
    )),
  ];

  const oldEvidenceIds = unique(legacyRows.flatMap((row) => row.evidenceEventIds || []));
  const routedSignalIds = unique([
    ...routed.receivedObservations.map((row) => row.sourceSignalId),
    ...Object.values(routed.routes).flatMap((rows) => rows.flatMap((row) => (
      row.sourceSignalIds || row.evidencePublicSignalIds || []
    ))),
  ]);
  return {
    chapter,
    cycle: record.cycle,
    node: record.gameEvent?.node || String(record.action).split(":")[1],
    outcome: record.outcome,
    legacy: {
      knowledgeRowCount: legacyRows.length,
      categories: legacyCategories,
      rosterPerformanceScore: finiteOrNull(roster.performanceScore),
      rosterContextTags: roster.contextTags || [],
    },
    routed: {
      receivedObservationCount: routed.receivedSignalCount,
      categories: routedCategories,
      routeCounts: routed.audit.routeCounts,
      rosterPerformanceScore: routedRosterHistory[0]?.performanceScore ?? null,
      rosterContextTags: routedRosterHistory[0]?.contextTags || [],
    },
    entity: {
      legacySubjectCount: legacySubjects.size,
      routedSubjectCount: routedSubjects.size,
      matchedStableSubjectCount: matchedStableSubjectIds.length,
      matchedByVisibleNameCount: matchedByVisibleNameIds.length,
      missingSubjectIds: [...legacySubjects].filter((id) => !routedSubjects.has(id)),
      missingByVisibleNameIds: [...legacySubjects].filter((id) => (
        !routedLabels.has(stableSubjectById.get(id)?.name)
      )),
      legacyFineDomainCount: legacyDomains.length,
      exactFineDomainCount: exactFineDomains.length,
      coarseDomainCount: coarseDomains.length,
      missingFineDomains,
    },
    keyChecks,
    noise: {
      legacyRawEvidenceIdCount: oldEvidenceIds.length,
      routedPublicSignalIdCount: routedSignalIds.length,
      legacyDiagnosisKnowledgeRows: legacyRows.filter((row) => (
        row.latestResult?.dominantDamage != null
        || row.latestResult?.incomingDamage != null
        || row.latestResult?.firstAllyDeath != null
      )).length,
      legacyInternalAggregateRows: legacyRows.filter((row) => (
        ["damage_profile", "enemy_concept_threat"].includes(
          row.latestResult?.outcome,
        )
      )).length,
      routedInternalSettlementSignals: 0,
    },
  };
}

function analyzeLegacyEntity(record, roster) {
  const moved = new Set(
    (record.entityImpressionUpdate?.movements || []).map((row) => row.id),
  );
  const playerTeam = (record.entityImpressionUpdate?.currentStrengthCognition || [])
    .filter((row) => moved.has(row.subject?.id))
    .map((row) => row.subject);
  return ENTITY_IMPRESSIONS.analyzeBattleReport({
    id: `shadow-legacy:${record.cycle}:${record.action}`,
    environment: {
      id: record.gameEvent?.node,
      label: record.gameEvent?.node,
      region: roster.region,
      tags: roster.contextTags || [],
    },
    playerTeam,
    gameEvent: record.gameEvent,
    eventLog: record.eventLog,
  }, {
    profile: record.entityImpressionUpdate?.profile || "ordinary",
  });
}

function collectLegacyDomains(analysis) {
  return analysis.units.flatMap((unit) => (
    Object.entries(unit.domainEvidence || {})
      .filter(([, evidence]) => Number(evidence.reliability || 0) > 0)
      .map(([domain, evidence]) => ({
        subjectId: unit.id,
        subjectName: unit.name,
        domain,
        reliability: Number(evidence.reliability || 0),
      }))
  ));
}

function collectRoutedDomains(packet) {
  return {
    byId: new Map(packet.characterEvidence.map((row) => [
      row.subject.id,
      new Set(row.observedDomains || []),
    ])),
    byLabel: new Map(packet.characterEvidence.map((row) => [
      row.subject.label,
      new Set(row.observedDomains || []),
    ])),
  };
}

function coarseDomainCovered(domain, routedDomains) {
  if (["area_damage", "single_target_damage", "sustained_damage"].includes(domain)) {
    return routedDomains.has("damage");
  }
  if (domain === "healing") return routedDomains.has("healing");
  if (domain === "shielding") return routedDomains.has("shielding");
  if (domain === "control") return routedDomains.has("status") || routedDomains.has("visible_skill");
  if (domain === "durability") return routedDomains.has("survival");
  return false;
}

function legacyKnowledgeCategory(row) {
  const outcome = row.latestResult?.outcome;
  if (row.behavior?.kind === "challenge_level") return "encounter_result";
  if (row.environment?.phase === "map_progression") return "map_progression";
  if (outcome === "loot_obtained") return "reward_observation";
  if (outcome === "character_unlocked") return "character_progression";
  if (outcome === "field_effect_observed") return "field_mechanic";
  if (outcome === "combat_contribution") return "character_contribution";
  if (outcome === "damage_profile") return "team_performance_metrics";
  if (outcome === "threat_profile" || outcome === "enemy_concept_threat") return "enemy_threat";
  return null;
}

function routedObservationCategory(type) {
  if (type === "combat_outcome") return "encounter_result";
  if (type === "visible_map_unlock") return "map_progression";
  if (type === "visible_loot") return "reward_observation";
  if (type === "visible_character_unlock") return "character_progression";
  if (type === "visible_field_effect") return "field_mechanic";
  if (type === "visible_probability_outcome") return "probability_opportunity";
  if (type.startsWith("ally_")) return "character_contribution";
  if (type.startsWith("incoming_damage_") || type.startsWith("enemy_")) return "enemy_threat";
  return null;
}

function check(id, required, preserved) {
  return { id, required: Boolean(required), preserved: !required || Boolean(preserved) };
}

function summarizeChecks(checks) {
  const result = {};
  for (const row of checks) {
    const current = result[row.id] || { required: 0, preserved: 0 };
    if (row.required) {
      current.required += 1;
      if (row.preserved) current.preserved += 1;
    }
    result[row.id] = current;
  }
  return result;
}

function compactGap(row) {
  return {
    node: row.node,
    outcome: row.outcome,
    missingSubjectIds: row.entity.missingSubjectIds,
    missingByVisibleNameIds: row.entity.missingByVisibleNameIds,
    missingFineDomains: row.entity.missingFineDomains,
  };
}

function normalizePerceptionProfile(value) {
  if (value === "expert") return "high";
  if (value === "ordinary") return "ordinary";
  return "ordinary";
}

function countValues(values) {
  const result = {};
  for (const value of values.filter(Boolean)) result[value] = (result[value] || 0) + 1;
  return result;
}

function ratio(numerator, denominator) {
  return denominator ? round(numerator / denominator) : 1;
}

function finiteOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

if (require.main === module) {
  const compact = process.argv.includes("--compact");
  const sessionArg = process.argv.slice(2).find((value) => !value.startsWith("--"));
  const result = compareSession(sessionArg || DEFAULT_SESSION);
  console.log(JSON.stringify(compact ? {
    source: result.source,
    verdict: result.verdict,
    criticalGaps: result.criticalGaps,
    semanticCoverage: result.semanticCoverage,
    entityImpressions: result.entityImpressions,
    unnecessaryInformationRemoved: result.unnecessaryInformationRemoved,
    representativeGaps: result.representativeGaps,
  } : result, null, 2));
}

module.exports = {
  DEFAULT_SESSION,
  compareSession,
};
