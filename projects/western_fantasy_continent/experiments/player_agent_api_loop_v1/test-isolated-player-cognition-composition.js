const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const COMPOSITION = require("./isolated-player-cognition-composition");

const sessionPath = path.join(
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
const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
const challenges = [
  ...(session.chapter1?.history || []),
  ...(session.chapter2?.history || []),
].filter((record) => (
  String(record.action || "").startsWith("challenge:")
  && Array.isArray(record.rawEventLog)
  && Array.isArray(record.eventLog)
));

let entityImpressionState = null;
let rosterExpectationState = null;
let analyzedCharacters = 0;
let detailedEventMatches = 0;
let eligibleTraitObservations = 0;
let highReliabilityTraitObservations = 0;
const eligibleDomains = {};
const causalRelationCounts = {};
const causalKeyCounts = new Map();
let typeOneRouteCount = 0;
let encounterCognitionSnapshotCount = 0;
const persistentFactCoverage = {
  field: { required: 0, preserved: 0 },
  loot: { required: 0, preserved: 0 },
  mapUnlock: { required: 0, preserved: 0 },
  characterUnlock: { required: 0, preserved: 0 },
};
const outputs = [];

for (const record of challenges) {
  const movedIds = new Set(
    (record.entityImpressionUpdate?.movements || []).map((row) => row.id),
  );
  const playerTeam = (record.entityImpressionUpdate?.currentStrengthCognition || [])
    .filter((row) => movedIds.has(row.subject?.id))
    .map((row) => row.subject);
  assert.equal(playerTeam.length, 4);
  const teamIds = record.rosterExpectationUpdate?.teamIds || playerTeam.map((unit) => unit.id);
  const output = COMPOSITION.processBattleInIsolation({
    reportId: `isolated:${record.cycle}:${record.action}`,
    seed: `isolated:${record.cycle}:${record.action}`,
    episodeId: `isolated:${record.cycle}`,
    action: record.action,
    outcome: record.outcome,
    environment: {
      id: record.gameEvent?.node,
      label: record.gameEvent?.node,
      region: record.rosterExpectationUpdate?.region,
      tags: record.rosterExpectationUpdate?.contextTags || [],
    },
    playerTeam,
    teamIds,
    gameEvent: record.gameEvent,
    eventLog: record.eventLog,
    rawEventLog: record.rawEventLog,
    entityImpressionState,
    rosterExpectationState,
    perceptionProfile: session.perceptionProfile || "ordinary",
    informationPerceptionLevel: "ordinary",
    region: record.rosterExpectationUpdate?.region,
    performanceScore: record.rosterExpectationUpdate?.performanceScore,
    equippedPower: record.rosterExpectationUpdate?.equippedPower,
    equipmentFingerprint: record.rosterExpectationUpdate?.equipmentFingerprint,
  });
  entityImpressionState = output.states.entityImpressionState;
  rosterExpectationState = output.states.rosterExpectationState;
  outputs.push(output);

  assert.equal(output.audit.allTeamMembersCovered, true);
  assert.equal(output.audit.stableCharacterKnowledgeOnly, true);
  assert.equal(output.audit.otherBranchTouchesCharacterCognition, false);
  assert.equal(output.audit.otherBranchTouchesRosterPrediction, false);
  assert.equal(output.branches.otherEventKnowledge.audit.typeOneContractComplete, true);
  assert.equal(output.branches.otherEventKnowledge.audit.nonCausalObservationBehaviorCount, 0);
  assert.equal(output.branches.otherEventKnowledge.audit.standaloneStatementKnowledgeCount, 0);
  assert.equal(
    output.branches.characterCognition.stableIdentityAudit.allTemporaryFriendlyActorsMapped,
    true,
  );
  assert.equal(
    Object.keys(output.branches.otherEventKnowledge.routes).includes("entityImpressions"),
    false,
  );
  assert.equal(
    Object.keys(output.branches.otherEventKnowledge.routes).includes("rosterHistory"),
    false,
  );
  const sourceTypes = new Set(
    output.branches.otherEventKnowledge.routes.causalKnowledge
      .flatMap((route) => route.sourceSignalTypes || []),
  );
  checkPersistent("field", record.rawEventLog.some((event) => event.type === "field"), "visible_field_effect");
  checkPersistent("loot", record.rawEventLog.some((event) => event.type === "loot"), "visible_loot");
  checkPersistent("mapUnlock", record.rawEventLog.some((event) => event.type === "map_unlock"), "visible_map_unlock");
  checkPersistent(
    "characterUnlock",
    record.rawEventLog.some((event) => event.type === "character_unlock"),
    "visible_character_unlock",
  );
  for (const route of output.branches.otherEventKnowledge.routes.causalKnowledge) {
    typeOneRouteCount += 1;
    const kind = route.tuple.behavior.kind;
    causalRelationCounts[kind] = (causalRelationCounts[kind] || 0) + 1;
    causalKeyCounts.set(
      route.knowledgeKeyPreview,
      (causalKeyCounts.get(route.knowledgeKeyPreview) || 0) + 1,
    );
    assert(route.decisionUse);
    assert(!/^(?:observe|receive)_/.test(kind));
    assert.equal(Object.hasOwn(route.observation, "statement"), false);
    if (kind === "challenge_level") {
      assert.equal(route.observation.teamCognitionSnapshot.length, 4);
      assert(route.observation.teamCognitionSnapshot.every((member) => (
        Number.isFinite(member.cognitionMatrixPosition)
        && Number.isFinite(member.cognitionScaleBoundaryPosition)
        && Number.isFinite(member.cognitionRelativeToScale)
        && Number.isFinite(member.cognitionLevel)
        && Number.isFinite(member.cognitionEvidenceCount)
        && Math.abs(
          member.cognitionMatrixPosition
            - member.cognitionScaleBoundaryPosition
            - member.cognitionRelativeToScale
        ) <= 0.002
      )));
      assert.deepEqual(
        route.observation.teamCognitionSnapshot.map((member) => member.id),
        route.tuple.environment.team,
      );
      assert.deepEqual(
        route.observation.teamCognitionSnapshot.map((member) => member.formationSlot),
        [1, 2, 3, 4],
      );
      encounterCognitionSnapshotCount += 1;
    }
  }

  analyzedCharacters += output.branches.characterCognition.analysis.units.length;
  for (const unit of output.branches.characterCognition.analysis.units) {
    detailedEventMatches += unit.eventCount;
    for (const [domain, evidence] of Object.entries(unit.domainEvidence || {})) {
      if (Number(evidence.reliability || 0) >= 0.5) {
        eligibleTraitObservations += 1;
        eligibleDomains[domain] = (eligibleDomains[domain] || 0) + 1;
      }
      if (Number(evidence.reliability || 0) >= 0.8) {
        highReliabilityTraitObservations += 1;
      }
    }
  }

  function checkPersistent(key, required, sourceType) {
    if (!required) return;
    persistentFactCoverage[key].required += 1;
    if (sourceTypes.has(sourceType)) persistentFactCoverage[key].preserved += 1;
  }
}

assert.equal(challenges.length, 22);
assert.equal(analyzedCharacters, 88);
assert(detailedEventMatches > 2000);
assert(eligibleTraitObservations > 50);
assert(highReliabilityTraitObservations > 30);
assert(eligibleDomains.area_damage > 0);
assert(eligibleDomains.sustained_damage > 0);
assert(eligibleDomains.healing > 0);
assert.equal(rosterExpectationState.observations.length, 22);
assert(rosterExpectationState.observations.every((row) => row.characterSnapshot.length === 4));
assert.equal(causalRelationCounts.challenge_level, 22);
assert.equal(encounterCognitionSnapshotCount, 22);
assert(causalRelationCounts.clear_level > 20);
assert(causalRelationCounts.affect_battle > 0);
assert(causalRelationCounts.attack_player_squad > 0);
assert([...causalKeyCounts.values()].some((count) => count > 1));
assert(Object.values(persistentFactCoverage).every((row) => row.required === row.preserved));

const first = outputs[0];
const last = outputs.at(-1);
const result = {
  result: "PASS",
  battles: challenges.length,
  branchIsolation: {
    characterCognition: "旧矩阵、前30%标尺、特点复核",
    otherEventKnowledge: "类型1事件知识、概率机会",
    rosterExpectation: "四人阵容、装备、本场表现和更新后的角色认知快照",
  },
  stableIdentity: {
    analyzedCharacterBattles: analyzedCharacters,
    temporaryCharacterIdsRemaining: 0,
    detailedVisibleEventsMatched: detailedEventMatches,
    firstBattleIdentityMap: first.branches.characterCognition.stableIdentityAudit.identityMap,
  },
  traitEvidence: {
    eligibleTraitObservations,
    highReliabilityTraitObservations,
    eligibleDomains,
  },
  causalKnowledge: {
    routeCount: typeOneRouteCount,
    uniqueKnowledgeKeyCount: causalKeyCounts.size,
    relationCounts: causalRelationCounts,
    repeatableKnowledgeKeyCount: [...causalKeyCounts.values()].filter((count) => count > 1).length,
    encounterCognitionSnapshotCoverage: `${encounterCognitionSnapshotCount}/${challenges.length}`,
    persistentFactCoverage,
    contract: "主体 + 环境 + 行为 -> 结构化结果",
  },
  knowledgeExamples: {
    characterStrength: last.branches.characterCognition.knowledge.strength.slice(0, 6),
    characterImpressions: last.branches.characterCognition.knowledge.impressions
      .filter((row) => row.kind === "trait")
      .slice(-6),
    typeOneRelations: last.branches.otherEventKnowledge.routes.causalKnowledge
      .map(compactCausalKnowledge)
      .slice(0, 8),
    rosterEvidence: compactRosterEvidence(last.branches.rosterExpectation.observation),
  },
};

console.log(JSON.stringify(result, null, 2));

function compactCausalKnowledge(row) {
  return {
    subject: row.tuple.subject,
    environment: row.tuple.environment,
    behavior: row.tuple.behavior,
    result: row.observation,
    decisionUse: row.decisionUse,
    knowledgeKeyPreview: row.knowledgeKeyPreview,
  };
}

function compactRosterEvidence(row) {
  return {
    id: row.id,
    node: row.node,
    region: row.region,
    outcome: row.outcome,
    performanceScore: row.performanceScore,
    equippedPower: row.equippedPower,
    contextTags: row.contextTags,
    teamIds: row.teamIds,
    characterSnapshot: row.characterSnapshot,
  };
}
