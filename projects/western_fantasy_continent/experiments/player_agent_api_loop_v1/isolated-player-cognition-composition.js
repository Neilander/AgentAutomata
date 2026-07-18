const ENTITY_IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");
const OTHER_EVENT_ROUTER = require("./received-information-organizer");
const ROSTER_EXPECTATIONS = require("./roster-change-expectation");
const CHARACTER_EVENT_ADAPTER = require("./stable-character-event-adapter");

const SCHEMA = "isolated_player_cognition_composition_v1";

function processBattleInIsolation(input = {}) {
  const characterState = clone(input.entityImpressionState
    || ENTITY_IMPRESSIONS.createImpressionState({ profile: input.perceptionProfile }));
  const rosterState = clone(input.rosterExpectationState || ROSTER_EXPECTATIONS.createState());
  const normalized = CHARACTER_EVENT_ADAPTER.normalizeCharacterCognitionReport({
    id: input.reportId || input.characterReport?.id || "isolated-battle",
    environment: clone(input.environment || input.characterReport?.environment || {}),
    playerTeam: clone(input.playerTeam || input.characterReport?.playerTeam || []),
    gameEvent: clone(input.gameEvent || input.characterReport?.gameEvent || {}),
    eventLog: clone(input.eventLog || input.characterReport?.eventLog || []),
  });
  const analysis = ENTITY_IMPRESSIONS.analyzeBattleReport(normalized.report, {
    profile: input.perceptionProfile || characterState.profile || "ordinary",
  });
  const characterTrace = ENTITY_IMPRESSIONS.ingestBattleAnalysis(characterState, analysis);
  const formationTeamIds = clone(
    input.teamIds || normalized.report.playerTeam.map((unit) => unit.id),
  );
  const teamMembersWithCurrentCognition = attachCurrentCognitionToTeam(
    normalized.report.playerTeam,
    characterState,
    formationTeamIds,
  );

  const otherEvents = OTHER_EVENT_ROUTER.organizeReceivedBattleInformation(
    input.rawEventLog || input.eventLog || [],
    {
      seed: input.seed || analysis.reportId,
      episodeId: input.episodeId || analysis.reportId,
      perceptionLevel: input.informationPerceptionLevel || "ordinary",
      causalContext: {
        action: input.action,
        node: input.gameEvent?.node || normalized.report.environment?.id,
        region: input.region || normalized.report.environment?.region,
        encounterBand: input.encounterBand,
        teamIds: formationTeamIds,
        teamMembers: teamMembersWithCurrentCognition,
        gameEvent: input.gameEvent,
        performanceScore: input.performanceScore,
      },
    },
  );

  const record = {
    action: input.action || `challenge:${input.gameEvent?.node || "unknown"}`,
    outcome: input.outcome || input.gameEvent?.outcome || analysis.outcome,
    gameEvent: clone(input.gameEvent || {}),
    entityImpressionUpdate: { reportId: analysis.reportId },
  };
  const rosterUpdate = ROSTER_EXPECTATIONS.recordChallenge(rosterState, {
    record,
    gameStateBefore: clone(input.gameStateBefore || {}),
    teamIds: clone(input.teamIds || normalized.report.playerTeam.map((unit) => unit.id)),
    equippedPower: input.equippedPower,
    equipmentFingerprint: input.equipmentFingerprint,
    entityImpressionState: characterState,
    region: input.region || normalized.report.environment?.region,
  });

  const temporaryIdsInCharacterKnowledge = collectTemporaryCharacterIds(
    characterState,
    analysis,
  );
  return {
    schema: SCHEMA,
    states: {
      entityImpressionState: characterState,
      rosterExpectationState: rosterUpdate.state,
    },
    branches: {
      characterCognition: {
        owner: "旧角色认知模型",
        input: "玩家可见的详细战斗表现",
        stableIdentityAudit: normalized.audit,
        analysis,
        updateTrace: characterTrace,
        knowledge: compactCharacterKnowledge(characterState),
      },
      otherEventKnowledge: {
        owner: "非角色事件筛选器",
        input: "胜负、敌方表现、场地、掉落、地图、解锁和概率机会",
        receivedObservations: otherEvents.receivedObservations,
        routes: otherEvents.routes,
        audit: otherEvents.audit,
      },
      rosterExpectation: {
        owner: "换人预期模型",
        input: "更新后的角色认知、当前四人队伍、装备和本场结果",
        observation: rosterUpdate.observation,
      },
    },
    audit: {
      characterBranchUsesExistingMatrix: true,
      otherBranchTouchesCharacterCognition: otherEvents.audit.touchesCharacterCognition,
      otherBranchTouchesRosterPrediction: otherEvents.audit.touchesRosterPrediction,
      rosterBranchReadsUpdatedCharacterState: true,
      teamMemberCount: normalized.report.playerTeam.length,
      analyzedCharacterCount: analysis.units.length,
      allTeamMembersCovered: normalized.report.playerTeam.length === analysis.units.length,
      temporaryIdsInCharacterKnowledge,
      stableCharacterKnowledgeOnly: temporaryIdsInCharacterKnowledge.length === 0,
    },
  };
}

function attachCurrentCognitionToTeam(teamMembers, state, formationTeamIds) {
  const teamById = new Map((teamMembers || []).map((unit) => [unit.id, unit]));
  const strengthById = new Map(
    ENTITY_IMPRESSIONS.listCurrentStrengthCognition(state)
      .map((row) => [row.subject?.id, row]),
  );
  return (formationTeamIds || []).map((id, index) => {
    const unit = teamById.get(id) || { id };
    const cognition = strengthById.get(id);
    return {
      ...clone(unit),
      formationSlot: index + 1,
      cognitionMatrixPosition: cognition?.position ?? null,
      cognitionScaleBoundaryPosition: cognition?.scaleBoundaryPosition ?? null,
      cognitionRelativeToScale: cognition?.relativeToScale ?? null,
      cognitionLevel: cognition?.level ?? null,
      cognitionLabel: cognition?.label ?? null,
      cognitionInTopThirtyPercent: cognition?.inTopThirtyPercent ?? null,
      cognitionEvidenceCount: cognition?.evidenceCount ?? null,
    };
  });
}

function compactCharacterKnowledge(state) {
  const strength = ENTITY_IMPRESSIONS.listCurrentStrengthCognition(state).map((row) => ({
    character: row.subject,
    currentStrengthPosition: row.position,
    scaleBoundaryPosition: row.scaleBoundaryPosition,
    relativeToTopThirtyScale: row.relativeToScale,
    level: row.level,
    label: row.label,
    inTopThirtyPercent: row.inTopThirtyPercent,
    evidenceCount: row.evidenceCount,
  }));
  const impressions = (state.knowledge || []).map((row) => ({
    id: row.id,
    kind: row.kind,
    character: clone(row.subject),
    claim: {
      domain: row.claim?.domain || null,
      level: row.claim?.level ?? null,
      label: row.claim?.label || null,
    },
    scope: clone(row.scope),
    relation: row.relation,
    confidence: row.confidence,
    evidenceCount: row.evidenceCount,
  }));
  return { strength, impressions };
}

function collectTemporaryCharacterIds(state, analysis) {
  const ids = [
    ...(analysis.units || []).map((row) => row.id),
    ...(state.knowledge || []).map((row) => row.subject?.id),
    ...(state.strengthObservations || []).map((row) => row.subject?.id),
    ...(state.traitObservations || []).map((row) => row.subject?.id),
  ].filter(Boolean);
  return [...new Set(ids.filter((id) => /^left-\d+$/.test(String(id))))];
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  SCHEMA,
  processBattleInIsolation,
};
