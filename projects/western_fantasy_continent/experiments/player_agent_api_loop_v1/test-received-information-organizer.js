const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ORGANIZER = require("./received-information-organizer");

const fixture = JSON.parse(fs.readFileSync(
  path.join(__dirname, "fixtures", "battle-information-real-event-log.json"),
  "utf8",
));
const rawEvents = fixture.rawEventLog.map((event) => ({
  ...event,
  diagnosis: {
    designerAnswer: "internal truth must never become player knowledge",
    hiddenEnemyRole: "internal_backline_priest",
  },
}));

const byProfile = Object.fromEntries(["low", "ordinary", "high"].map((perceptionLevel) => [
  perceptionLevel,
  ORGANIZER.organizeReceivedBattleInformation(rawEvents, {
    seed: "other-event-profile-comparison",
    episodeId: `real-battle:${perceptionLevel}`,
    perceptionLevel,
    causalContext: {
      action: "challenge:r2_flag_trial",
      node: "r2_flag_trial",
      region: "region_2",
      teamIds: ["hero_warrior", "hero_mage", "hero_priest", "hero_ranger"],
      teamMembers: [
        cognitionMember("hero_warrior", "灰鸦战士", "warrior", 3.2, 0, 5),
        cognitionMember("hero_mage", "烬火法师", "mage", 6.1, 2, 7),
        cognitionMember("hero_priest", "晨祷牧师", "priest", 2.4, -1, 6),
        cognitionMember("hero_ranger", "林地游侠", "ranger", 4.8, 1, 5),
      ],
      gameEvent: fixture.gameEvent || {
        node: "r2_flag_trial",
        outcome: "win",
        duration: 20,
        survivors: { player: 4, enemy: 0 },
      },
      performanceScore: 0.6,
    },
  }),
]));

const lowIds = signalIds(byProfile.low);
const ordinaryIds = signalIds(byProfile.ordinary);
const highIds = signalIds(byProfile.high);
assert([...lowIds].every((id) => ordinaryIds.has(id)));
assert([...ordinaryIds].every((id) => highIds.has(id)));
assert(byProfile.low.receivedObservations.length < byProfile.ordinary.receivedObservations.length);
assert(byProfile.ordinary.receivedObservations.length <= byProfile.high.receivedObservations.length);

for (const result of Object.values(byProfile)) {
  assert.equal(result.schema, "other_event_to_type1_router_v8");
  assert.deepEqual(Object.keys(result.routes).sort(), [
    "causalKnowledge",
    "probabilityLedger",
  ]);
  assert.equal(result.audit.everyObservationWasReceived, true);
  assert.equal(result.audit.everyRoutedSignalWasReceived, true);
  assert.equal(result.audit.createsGenericKnowledgeStore, false);
  assert.equal(result.audit.updatesLegacyKnowledge, false);
  assert.equal(result.audit.touchesCharacterCognition, false);
  assert.equal(result.audit.touchesRosterPrediction, false);
  assert.equal(result.audit.exposesRawEventIds, false);
  assert.equal(result.audit.exposesDiagnosis, false);
  assert.equal(result.audit.typeOneContractComplete, true);
  assert.equal(result.audit.nonCausalObservationBehaviorCount, 0);
  assert.equal(result.audit.standaloneStatementKnowledgeCount, 0);
  assert(result.routes.causalKnowledge.length > 0);
  assert(result.routes.causalKnowledge.every((row) => (
    row.tuple.subject
    && row.tuple.environment
    && row.tuple.behavior
    && row.observation?.outcome
    && row.knowledgeKeyPreview
    && row.decisionUse
    && !/^(?:observe|receive)_/.test(row.tuple.behavior.kind)
    && !Object.hasOwn(row.observation, "statement")
  )));
  const text = JSON.stringify(result);
  assert(!text.includes("internal truth must never become player knowledge"));
  assert(!text.includes("internal_backline_priest"));
  assert(!text.includes("\"diagnosis\""));
  assert(!text.includes("strengthLevel"));
  assert(!text.includes("\"position\""));
  assert(!text.includes("\"scale\""));
}

const ordinaryCausal = byProfile.ordinary.routes.causalKnowledge;
const encounterKnowledge = ordinaryCausal.find((row) => row.tuple.behavior.kind === "challenge_level");
assert(encounterKnowledge);
assert.equal(encounterKnowledge.tuple.subject.id, "player_squad");
assert.equal(encounterKnowledge.tuple.environment.node, "r2_flag_trial");
assert.equal(encounterKnowledge.observation.outcome, "win");
assert.deepEqual(encounterKnowledge.observation.survivors, { player: 3, enemy: 0 });
assert.equal(encounterKnowledge.observation.performanceScore, 0.6);
assert.equal(encounterKnowledge.tuple.environment.teamFingerprint, [
  "hero_warrior",
  "hero_mage",
  "hero_priest",
  "hero_ranger",
].join(">"));
assert.deepEqual(
  encounterKnowledge.observation.teamCognitionSnapshot.map((row) => ({
    id: row.id,
    slot: row.formationSlot,
    matrixPosition: row.cognitionMatrixPosition,
    scaleBoundary: row.cognitionScaleBoundaryPosition,
    relativeToScale: row.cognitionRelativeToScale,
    level: row.cognitionLevel,
  })),
  [
    {
      id: "hero_warrior", slot: 1, matrixPosition: 3.2, scaleBoundary: 3, relativeToScale: 0.2, level: 0,
    },
    {
      id: "hero_mage", slot: 2, matrixPosition: 6.1, scaleBoundary: 3, relativeToScale: 3.1, level: 2,
    },
    {
      id: "hero_priest", slot: 3, matrixPosition: 2.4, scaleBoundary: 3, relativeToScale: -0.6, level: -1,
    },
    {
      id: "hero_ranger", slot: 4, matrixPosition: 4.8, scaleBoundary: 3, relativeToScale: 1.8, level: 1,
    },
  ],
);
assert.equal(typeof ORGANIZER.assessEncounterKnowledgeApplicability, "undefined");

const comparableTeam = encounterKnowledge.observation.teamCognitionSnapshot.map((row) => ({
  ...row,
  cognitionMatrixPosition: row.cognitionMatrixPosition + 0.15,
  cognitionRelativeToScale: row.cognitionRelativeToScale + 0.15,
}));
const improvedTeam = comparableTeam.map((row) => (
  row.id === "hero_mage"
    ? {
      ...row,
      cognitionMatrixPosition: 8.2,
      cognitionRelativeToScale: 5.2,
      cognitionLevel: 3,
      cognitionLabel: "认知等级3",
    }
    : row
));
const differentTeam = comparableTeam.map((row, index) => (
  index === 3 ? { ...row, id: "hero_knight", name: "新来的骑士" } : row
));

const fieldKnowledge = ordinaryCausal.find((row) => row.tuple.behavior.kind === "affect_battle");
assert(fieldKnowledge);
assert.equal(fieldKnowledge.tuple.environment.phase, "field_rule");
assert(fieldKnowledge.observation.visibleSignals.length > 0);
assert.equal(fieldKnowledge.observation.concurrentEncounterOutcome, "win");

const enemyKnowledge = ordinaryCausal.filter((row) => (
  ["attack_player_squad", "protect_enemy_squad", "heal_enemy_squad"].includes(
    row.tuple.behavior.kind,
  )
));
assert(enemyKnowledge.length > 0);
assert(enemyKnowledge.every((row) => row.tuple.environment.encounterBand));

const progressionKnowledge = ordinaryCausal.filter((row) => (
  row.tuple.behavior.kind === "clear_level"
));
assert(progressionKnowledge.length > 0);
assert(progressionKnowledge.every((row) => (
  row.tuple.subject.id === "player_progress"
  && !Array.isArray(row.tuple.subject.members)
)));

const changedScoreEncounter = organizerEncounterForTeam(comparableTeam);
assert.equal(
  changedScoreEncounter.knowledgeKeyPreview,
  encounterKnowledge.knowledgeKeyPreview,
);
assert.equal(
  changedScoreEncounter.observation.teamCognitionSnapshot[0].cognitionMatrixPosition,
  3.35,
);
const improvedCognitionEncounter = organizerEncounterForTeam(improvedTeam);
assert.equal(
  improvedCognitionEncounter.knowledgeKeyPreview,
  encounterKnowledge.knowledgeKeyPreview,
);
assert.equal(
  improvedCognitionEncounter.observation.teamCognitionSnapshot[1].cognitionLevel,
  3,
);
const swappedFormationEncounter = organizerEncounterForTeam([
  comparableTeam[1],
  comparableTeam[0],
  comparableTeam[2],
  comparableTeam[3],
]);
assert.notEqual(
  swappedFormationEncounter.knowledgeKeyPreview,
  encounterKnowledge.knowledgeKeyPreview,
);
assert.deepEqual(
  swappedFormationEncounter.observation.teamCognitionSnapshot.map((row) => row.id),
  ["hero_mage", "hero_warrior", "hero_priest", "hero_ranger"],
);
const differentTeamEncounter = organizerEncounterForTeam(differentTeam);
assert.notEqual(
  differentTeamEncounter.knowledgeKeyPreview,
  encounterKnowledge.knowledgeKeyPreview,
);

const probability = ORGANIZER.organizeReceivedBattleInformation([
  visibleProbabilityOutcome("probability:miss", false),
], {
  seed: "probability-route",
  episodeId: "probability-route",
  perceptionLevel: "low",
});
assert.equal(probability.routes.probabilityLedger.length, 1);
assert.equal(probability.routes.causalKnowledge.length, 0);
assert.equal(probability.routes.probabilityLedger[0].family, "rare_equipment:test_gate");
assert.equal(probability.routes.probabilityLedger[0].success, false);

const characterOnly = ORGANIZER.organizeReceivedBattleInformation([
  visibleCharacterEvent("character:damage", "damage", "hero_a", "甲", 20),
  visibleCharacterEvent("character:heal", "heal", "hero_b", "乙", 30, "left"),
], {
  seed: "character-branch-exclusion",
  episodeId: "character-branch-exclusion",
  perceptionLevel: "high",
});
assert.equal(characterOnly.routes.causalKnowledge.length, 0);
assert.equal(characterOnly.routes.probabilityLedger.length, 0);
assert.equal(characterOnly.receivedObservations.length, 0);
assert(characterOnly.audit.divertedCharacterSignalCount > 0);

const internalOnly = ORGANIZER.organizeReceivedBattleInformation([
  {
    ...visibleCombatResult("internal:summary", "win"),
    type: "action_summary",
    diagnosis: { hidden: true },
  },
  {
    ...visibleCombatResult("internal:experiment", "win"),
    type: "team_experiment_result",
  },
], {
  seed: "internal-only",
  episodeId: "internal-only",
  perceptionLevel: "high",
});
assert.equal(internalOnly.receivedSignalCount, 0);
assert.equal(internalOnly.audit.blockedInternalSignalCount, 2);
assert(Object.values(internalOnly.routes).every((rows) => rows.length === 0));

console.log(JSON.stringify({
  result: "PASS",
  architecture: "非角色事件筛选器只输出类型1和概率机会",
  profileComparison: Object.fromEntries(Object.entries(byProfile).map(([level, row]) => [
    level,
    {
      receivedSignalCount: row.receivedSignalCount,
      routeCounts: row.audit.routeCounts,
    },
  ])),
  isolation: {
    characterSignalsDivertedBeforeOtherEventObservation: true,
    characterCognitionUntouched: true,
    rosterPredictionUntouched: true,
    internalAnswersBlocked: true,
  },
  logicalTypeOneExamples: {
    encounter: encounterKnowledge,
    field: fieldKnowledge,
    enemyPattern: enemyKnowledge[0],
  },
}, null, 2));

function signalIds(result) {
  return new Set(result.receivedObservations.map((row) => row.sourceSignalId));
}

function visibleCombatResult(id, outcome) {
  return {
    id,
    time: 10,
    type: "combat_result",
    subject: { id: "player_squad", name: "玩家队伍", side: "left" },
    environment: { region: "test_region", node: "test_gate", phase: "result" },
    behavior: { kind: "challenge_level", key: "challenge:test_gate" },
    result: {
      kind: outcome === "win" ? "combat_win" : "combat_loss",
      outcome,
      occurred: true,
    },
    presentation: {
      visible: true,
      hasSource: true,
      hasTarget: true,
      informationTier: "blocking",
    },
  };
}

function visibleCharacterEvent(id, type, subjectId, subjectName, amount, targetSide = "right") {
  return {
    id,
    time: 1,
    type,
    subject: { id: subjectId, name: subjectName, side: "left" },
    environment: { region: "test_region", node: "test_gate", phase: "combat" },
    behavior: { kind: type, key: `skill:${type}`, name: "可见技能" },
    result: {
      kind: type,
      amount,
      target: {
        id: targetSide === "left" ? "hero_target" : "enemy_visible",
        name: targetSide === "left" ? "队友" : "敌方单位",
        side: targetSide,
      },
    },
    presentation: {
      visible: true,
      hasSource: true,
      hasTarget: true,
      hasNumber: true,
      informationTier: "blocking",
    },
  };
}

function visibleProbabilityOutcome(id, success) {
  return {
    id,
    time: 11,
    type: "loot_outcome",
    subject: { id: "player_squad", name: "玩家队伍", side: "left" },
    environment: { region: "test_region", node: "test_gate", phase: "reward" },
    behavior: { kind: "encounter_reward", key: "reward:test_gate" },
    result: {
      kind: "probability_outcome",
      occurred: true,
      components: success ? [{ kind: "loot", rarity: "rare" }] : [],
    },
    probability: {
      opportunity: true,
      success,
      family: "rare_equipment:test_gate",
    },
    presentation: {
      visible: true,
      hasSource: true,
      hasTarget: false,
      informationTier: "blocking",
    },
  };
}

function cognitionMember(id, name, role, matrixPosition, level, evidenceCount) {
  const scaleBoundary = 3;
  return {
    id,
    name,
    role,
    cognitionMatrixPosition: matrixPosition,
    cognitionScaleBoundaryPosition: scaleBoundary,
    cognitionRelativeToScale: Number((matrixPosition - scaleBoundary).toFixed(3)),
    cognitionLevel: level,
    cognitionLabel: `认知等级${level}`,
    cognitionInTopThirtyPercent: matrixPosition >= scaleBoundary,
    cognitionEvidenceCount: evidenceCount,
  };
}

function organizerEncounterForTeam(teamMembers) {
  const result = ORGANIZER.organizeReceivedBattleInformation([
    visibleCombatResult("encounter:applicability", "loss"),
  ], {
    seed: `team:${teamMembers.map((row) => row.id).join(">")}`,
    episodeId: "encounter-applicability",
    perceptionLevel: "high",
    causalContext: {
      action: "challenge:r2_flag_trial",
      node: "r2_flag_trial",
      region: "region_2",
      teamIds: teamMembers.map((row) => row.id),
      teamMembers,
      gameEvent: {
        node: "r2_flag_trial",
        outcome: "loss",
        duration: 25,
        survivors: { player: 0, enemy: 2 },
      },
      performanceScore: 0.2,
    },
  });
  return result.routes.causalKnowledge.find((row) => (
    row.tuple.behavior.kind === "challenge_level"
  ));
}
