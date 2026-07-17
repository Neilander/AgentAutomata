const assert = require("node:assert/strict");
const EXPECTATION = require("./roster-change-expectation");
const IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");
const EQUIPMENT = require("../../game_data/equipment-runtime");
const { createSystematicSuites } = require("../entity_impression_knowledge_v1/systematic-preset-battle-suites");

const cognition = seededCognition("expert");
const story = runContinuousStory(cognition);
const mixedHistory = runMixedHistory(cognition);
const stalePile = runOldFailuresRecentSuccess(cognition);
const traitRevision = runTraitRevision(cognition);
const equalPowerDifferentBuild = runEqualPowerDifferentBuild(cognition);
const profileReplay = runSameReportsAcrossProfiles();
const richEnvironmentBoundary = runRichEnvironmentBoundary(cognition);
const candidatePowerComparison = runCandidatePowerComparison(cognition);
const simultaneousSwapBoundary = EXPECTATION.buildExpectations({
  state: story.state,
  currentTeamIds: ["a", "b", "h", "f"],
  allowedActions: ["swap2:2:c:3:e"],
  visibleNodeIds: ["story_gate"],
  entityImpressionState: cognition,
});
assert.equal(simultaneousSwapBoundary.actions.length, 0,
  "the runtime must not silently interpret an unsupported simultaneous two-slot action as a one-character counterfactual");

console.log(JSON.stringify({
  result: "PASS",
  coverage: {
    continuousFailureSwapFailureSwapSuccess: true,
    sequentialTwoSlotChanges: true,
    mixedWinsAndLosses: true,
    oldFailurePileVersusRecentSuccess: true,
    materialTraitBeliefRevision: true,
    equalPowerDifferentEquipmentBuild: true,
    candidateExactHistoryUsesCandidatePower: true,
    sameBattleReportsAcrossThreeProfiles: true,
    richEnemyContexts: "safe_non_inference_verified_but_prediction_mapping_not_implemented",
    simultaneousTwoSlotAction: "explicitly_unsupported_and_not_misread",
  },
  story: story.trace,
  mixedHistory,
  oldFailuresRecentSuccess: stalePile,
  traitRevision,
  equalPowerDifferentBuild,
  profileReplay,
  richEnvironmentBoundary,
  candidatePowerComparison,
}, null, 2));

function runContinuousStory(entityImpressionState) {
  let state = EXPECTATION.createState();
  state = record(state, ["a", "b", "c", "e"], entityImpressionState,
    challenge("story_gate", "loss", 2, 3, 8));
  const afterInitialFailure = view(state, ["a", "b", "c", "e"], ["swap:3:d", "swap:3:f"], entityImpressionState);
  const weak = incoming(afterInitialFailure, "d");
  const strong = incoming(afterInitialFailure, "f");
  assert.equal(weak.expectedOutcome, "likely_failure");
  assert.equal(strong.expectedOutcome, "plausible_success");
  const firstSelectedAction = chooseBestSwap(afterInitialFailure);
  assert.equal(firstSelectedAction, "swap:3:f");

  state = record(state, ["a", "b", "c", "f"], entityImpressionState,
    challenge("story_gate", "loss", 2.8, 3.2, 8));
  const afterFirstSwapFailed = view(state, ["a", "b", "c", "f"], ["swap:2:h"], entityImpressionState);
  const specialist = incoming(afterFirstSwapFailed, "h");
  assert.equal(specialist.expectedOutcome, "plausible_success",
    "a failed first replacement must not close a second, differently targeted roster change");
  const secondSelectedAction = chooseBestSwap(afterFirstSwapFailed);
  assert.equal(secondSelectedAction, "swap:2:h");

  state = record(state, ["a", "b", "h", "f"], entityImpressionState,
    challenge("story_gate", "win", 3.6, 0.8, 8));
  const afterSuccess = view(state, ["a", "b", "h", "f"], ["swap:2:c"], entityImpressionState);
  assert.equal(afterSuccess.baseline.outcome, "win");
  assert.equal(incoming(afterSuccess, "c").expectedOutcome, "likely_failure",
    "the successful final team and the previously failed intermediate team must remain distinct memories");

  return {
    state,
    trace: [
      step("initial team fails", afterInitialFailure.baseline,
        { weak: summarize(weak), strong: summarize(strong) }, firstSelectedAction),
      step("strong first replacement also fails", afterFirstSwapFailed.baseline,
        { secondSpecialist: summarize(specialist) }, secondSelectedAction),
      step("second slot change succeeds", afterSuccess.baseline, { returnToFailedIntermediate: summarize(incoming(afterSuccess, "c")) }),
    ],
  };
}

function runRichEnvironmentBoundary(entityImpressionState) {
  const stateWithArmorBelief = structuredClone(entityImpressionState);
  stateWithArmorBelief.strengthCognitionMatrix.entries.push(seeded("j", 1.5));
  IMPRESSIONS.STRENGTH_MATRIX.refreshStrengthScale(stateWithArmorBelief.strengthCognitionMatrix);
  stateWithArmorBelief.traitObservations.push(traitObservation("e", "armor_break", 0, "armor-e"));
  stateWithArmorBelief.traitObservations.push(traitObservation("j", "armor_break", 6, "armor-j"));
  let state = EXPECTATION.createState();
  const battle = challenge("heavy_armor_gate", "loss", 2, 3, 4);
  battle.gameEvent.visibleContextTags = ["high_armor"];
  state = record(state, ["a", "b", "c", "e"], stateWithArmorBelief, battle);
  const result = incoming(view(state, ["a", "b", "c", "e"], ["swap:3:j"], stateWithArmorBelief), "j");
  assert.equal(result.traitLevelDelta, 0);
  assert(!result.contextRelevantTraitDomains.includes("armor_break"));
  return {
    inputVisibleContext: "high_armor",
    knownIncomingTrait: "armor_break level 6",
    traitApplied: false,
    expectedOutcome: result.expectedOutcome,
    status: "unsupported_context_is_ignored_instead_of_becoming_hidden_designer_knowledge",
  };
}

function runMixedHistory(entityImpressionState) {
  let state = EXPECTATION.createState();
  state = record(state, ["a", "b", "c", "e"], entityImpressionState,
    challenge("mixed_gate", "loss", 2, 3, 8));
  const sequence = ["loss", "loss", "win", "loss", "win"];
  for (const outcome of sequence) {
    state = record(state, ["a", "b", "c", "f"], entityImpressionState,
      challenge("mixed_gate", outcome, outcome === "win" ? 3.2 : 2.4, outcome === "win" ? 1.2 : 3, 8));
  }
  const result = incoming(view(state, ["a", "b", "c", "e"], ["swap:3:f"], entityImpressionState), "f");
  assert.equal(result.expectedOutcome, "uncertain_near_boundary");
  assert.equal(result.exactObservedWinRate, 0.536);
  return { sequence, recentWeightedWinRate: result.exactObservedWinRate, expectedOutcome: result.expectedOutcome };
}

function runOldFailuresRecentSuccess(entityImpressionState) {
  let state = EXPECTATION.createState();
  state = record(state, ["a", "b", "c", "e"], entityImpressionState,
    challenge("recency_gate", "loss", 2, 3, 8));
  for (let index = 0; index < 10; index += 1) {
    state = record(state, ["a", "b", "c", "f"], entityImpressionState,
      challenge("recency_gate", "loss", 1.6, 3.2, 8));
  }
  for (const outcome of ["loss", "loss", "win", "win", "win"]) {
    state = record(state, ["a", "b", "c", "f"], entityImpressionState,
      challenge("recency_gate", outcome, outcome === "win" ? 3.4 : 2.2, outcome === "win" ? 0.8 : 3, 8));
  }
  const result = incoming(view(state, ["a", "b", "c", "e"], ["swap:3:f"], entityImpressionState), "f");
  assert.equal(result.expectedOutcome, "plausible_success",
    "a large obsolete failure pile must not dominate three consistent recent wins");
  assert.equal(result.evidenceCount, 15);
  assert.equal(result.exactObservedWinRate, 0.786);
  return {
    totalExactObservations: result.evidenceCount,
    observationsUsedByRecencyWindow: 5,
    recentWeightedWinRate: result.exactObservedWinRate,
    expectedOutcome: result.expectedOutcome,
  };
}

function runTraitRevision(entityImpressionState) {
  let state = EXPECTATION.createState();
  state = record(state, ["a", "b", "c", "e"], entityImpressionState,
    challenge("trait_revision_gate", "loss", 2, 3, 8));
  state = record(state, ["a", "b", "c", "h"], entityImpressionState,
    challenge("trait_revision_gate", "win", 3.4, 0.8, 8));
  const before = incoming(view(state, ["a", "b", "c", "e"], ["swap:3:h"], entityImpressionState), "h");
  assert.equal(before.evidenceScope, "exact_team_and_encounter");
  assert.equal(before.expectedOutcome, "plausible_success");

  const revised = structuredClone(entityImpressionState);
  revised.traitObservations = revised.traitObservations.filter((row) => !(row.subject.id === "h" && row.claim.domain === "area_damage"));
  revised.traitObservations.push(traitObservation("h", "area_damage", 0, "trait-revision"));
  const after = incoming(view(state, ["a", "b", "c", "e"], ["swap:3:h"], revised), "h");
  assert.equal(after.evidenceScope, "one_member_counterfactual_from_exact_current_team",
    "materially revised context-relevant trait cognition must invalidate the old exact-team interpretation");
  assert.equal(after.traitLevelDelta, 0,
    "the revised weak trait must stop contributing to the replacement estimate even if raw strength alone still supports it");
  assert.equal(after.exactObservedWinRate, undefined);
  return {
    oldAreaLevel: 6,
    revisedAreaLevel: 0,
    before: summarize(before),
    after: summarize(after),
  };
}

function runEqualPowerDifferentBuild(entityImpressionState) {
  const team = ["a", "b", "c", "e"];
  const buildA = equipmentState(team, "might");
  const buildB = equipmentState(team, "agility");
  let state = EXPECTATION.createState();
  state = EXPECTATION.recordChallenge(state, {
    gameStateBefore: buildA,
    teamIds: team,
    entityImpressionState,
    record: challenge("equipment_build_gate", "loss", 2, 3, 8, 100),
  }).state;
  const sameBuild = EXPECTATION.buildExpectations({
    state,
    gameState: structuredClone(buildA),
    currentTeamIds: team,
    allowedActions: ["swap:3:f"],
    visibleNodeIds: ["equipment_build_gate"],
    currentPower: 100,
    entityImpressionState,
  });
  const changedBuild = EXPECTATION.buildExpectations({
    state,
    gameState: buildB,
    currentTeamIds: team,
    allowedActions: ["swap:3:f"],
    visibleNodeIds: ["equipment_build_gate"],
    currentPower: 100,
    entityImpressionState,
  });
  assert(sameBuild.baseline);
  assert.equal(changedBuild.baseline, null,
    "equal total equipment power with a materially different visible build must not reuse the old baseline");
  assert.equal(changedBuild.actions[0].expectedOutcome, "unknown");
  return {
    visiblePowerBefore: 100,
    visiblePowerAfter: 100,
    sameBuildBaselineAccepted: Boolean(sameBuild.baseline),
    differentBuildBaselineAccepted: Boolean(changedBuild.baseline),
    changedBuildExpectedOutcome: changedBuild.actions[0].expectedOutcome,
  };
}

function runCandidatePowerComparison(entityImpressionState) {
  const currentTeam = ["a", "b", "c", "e"];
  const candidateTeam = ["a", "b", "c", "f"];
  const gameState = candidatePowerState();
  const currentPower = EQUIPMENT.teamEquipmentScore(gameState.roster, currentTeam);
  const candidatePower = EQUIPMENT.teamEquipmentScore(gameState.roster, candidateTeam);
  assert(Math.abs(candidatePower - currentPower) / Math.max(1, currentPower) > 0.1);
  let state = EXPECTATION.createState();
  state = EXPECTATION.recordChallenge(state, {
    gameStateBefore: { ...gameState, teamSlots: currentTeam },
    entityImpressionState,
    record: challenge("candidate_power_gate", "loss", 2, 3, 8, currentPower),
  }).state;
  state = EXPECTATION.recordChallenge(state, {
    gameStateBefore: { ...gameState, teamSlots: candidateTeam },
    entityImpressionState,
    record: challenge("candidate_power_gate", "win", 3.4, 0.6, 8, candidatePower),
  }).state;
  const result = EXPECTATION.buildExpectations({
    state,
    gameState: { ...gameState, teamSlots: currentTeam },
    currentTeamIds: currentTeam,
    allowedActions: ["swap:3:f"],
    visibleNodeIds: ["candidate_power_gate"],
    currentPower,
    entityImpressionState,
  });
  const replacement = incoming(result, "f");
  assert.equal(replacement.evidenceScope, "exact_team_and_encounter",
    "candidate exact history must be compared with the hypothetical candidate team's equipped power, not the current team's power");
  assert.equal(replacement.expectedOutcome, "plausible_success");
  return { currentPower, candidatePower, evidenceScope: replacement.evidenceScope, expectedOutcome: replacement.expectedOutcome };
}

function runSameReportsAcrossProfiles() {
  const reports = createSystematicSuites().flatMap((suite) => suite.reports);
  return ["ordinary", "familiar", "expert"].map((profile) => {
    const state = IMPRESSIONS.createImpressionState({ profile });
    for (const report of reports) {
      IMPRESSIONS.ingestBattleAnalysis(state, IMPRESSIONS.analyzeBattleReport(report, { profile }));
    }
    let expectationState = EXPECTATION.createState();
    expectationState = record(expectationState,
      ["hero_warrior", "hero_ranger", "hero_priest", "hero_guardian"],
      state,
      challenge("profile_replay_gate", "loss", 2, 3, 8));
    const result = incoming(view(expectationState,
      ["hero_warrior", "hero_ranger", "hero_priest", "hero_guardian"],
      ["swap:0:hero_mage"], state, "profile_replay_gate"), "hero_mage");
    assert.notEqual(result.expectedOutcome, "unknown");
    const current = new Map(IMPRESSIONS.listCurrentStrengthCognition(state).map((row) => [row.subject.id, row]));
    const mageArea = currentTrait(state, "hero_mage", "area_damage");
    const warriorArea = currentTrait(state, "hero_warrior", "area_damage");
    return {
      profile,
      sharedBattleReportCount: reports.length,
      outgoingPosition: current.get("hero_warrior")?.position,
      incomingPosition: current.get("hero_mage")?.position,
      outgoingAreaLevel: warriorArea?.claim.level ?? null,
      incomingAreaLevel: mageArea?.claim.level ?? null,
      strengthDelta: result.strengthDelta,
      traitEvidenceStatus: result.traitEvidenceStatus,
      effectiveLevelDelta: result.effectiveLevelDelta,
      expectedOutcome: result.expectedOutcome,
    };
  });
}

function currentTrait(state, subjectId, domain) {
  return IMPRESSIONS.retrieveImpressions(state, subjectId)
    .find((row) => row.kind === "trait" && row.relation === "synthesizes_trait_revalidation" && row.claim.domain === domain);
}

function seededCognition(profile) {
  const state = IMPRESSIONS.createImpressionState({ profile });
  state.strengthCognitionMatrix.entries = [
    seeded("a", 6), seeded("b", 5), seeded("c", 4), seeded("d", 1.5),
    seeded("e", 1), seeded("f", 7), seeded("h", 6),
  ];
  IMPRESSIONS.STRENGTH_MATRIX.refreshStrengthScale(state.strengthCognitionMatrix);
  state.traitObservations.push(traitObservation("c", "area_damage", 0, "trait-c"));
  state.traitObservations.push(traitObservation("e", "area_damage", 0, "trait-e"));
  state.traitObservations.push(traitObservation("h", "area_damage", 6, "trait-h"));
  return state;
}

function record(state, teamIds, entityImpressionState, recordValue) {
  return EXPECTATION.recordChallenge(state, { teamIds, entityImpressionState, record: recordValue }).state;
}

function view(state, currentTeamIds, allowedActions, entityImpressionState, node = null) {
  return EXPECTATION.buildExpectations({
    state,
    currentTeamIds,
    allowedActions,
    visibleNodeIds: [node || state.observations.at(-1).node],
    entityImpressionState,
  });
}

function incoming(result, id) { return result.actions.find((row) => row.incomingId === id); }
function summarize(row) {
  return {
    incomingId: row.incomingId,
    evidenceScope: row.evidenceScope,
    strengthDelta: row.strengthDelta,
    traitLevelDelta: row.traitLevelDelta,
    expectedOutcome: row.expectedOutcome,
    exactObservedWinRate: row.exactObservedWinRate,
  };
}
function step(event, baseline, alternatives, selectedAction = null) {
  return { event, baselineOutcome: baseline?.outcome || null, alternatives, selectedAction };
}

function chooseBestSwap(result) {
  const outcomeRank = { plausible_success: 3, uncertain_near_boundary: 2, likely_failure: 1, unknown: 0 };
  return result.actions.slice().sort((a, b) => (
    (outcomeRank[b.expectedOutcome] || 0) - (outcomeRank[a.expectedOutcome] || 0)
    || Number(b.predictedPerformanceScore ?? -Infinity) - Number(a.predictedPerformanceScore ?? -Infinity)
  ))[0]?.action || null;
}

function challenge(node, outcome, playerHp, enemyHp, enemyCount, gearBefore = null) {
  return {
    outcome,
    action: `challenge:${node}`,
    gameEvent: {
      node,
      outcome,
      gearBefore,
      teamSizes: { player: 4, enemy: 4 },
      hpScore: { player: playerHp, enemy: enemyHp },
      waveSummary: [{ unitCount: enemyCount }],
    },
  };
}

function seeded(id, position) {
  return {
    subject: { id, name: id, role: "probe" },
    position,
    stiffness: 4,
    evidenceCount: 3,
    firstObservedReportId: "seed",
    lastObservedReportId: "seed",
    lastObservedLevel: position,
    scaleView: null,
  };
}

function traitObservation(id, domain, level, reportId) {
  return {
    subject: { id, name: id, role: "probe" },
    reportId,
    observationOrder: 1,
    context: { tags: ["many_targets"] },
    basis: {},
    claim: { domain, level, rawMagnitudePercent: level * 20 },
    eligible: true,
    evidenceReliability: 1,
  };
}

function equipmentState(teamIds, affixStat) {
  return {
    teamSlots: [...teamIds],
    roster: [...new Set([...teamIds, "f"])].map((id) => ({
      id,
      role: "warrior",
      equipment: id === "e" ? {
        weapon: {
          id: `same-score-${affixStat}`,
          slot: "weapon",
          rarity: "rare",
          equipmentLevel: 10,
          baseStats: { physicalPower: 10 },
          affixes: [{ stat: affixStat, level: 2, value: 1 }],
        },
      } : {},
    })),
  };
}

function candidatePowerState() {
  return {
    roster: ["a", "b", "c", "e", "f"].map((id) => ({
      id,
      role: "warrior",
      equipment: ["e", "f"].includes(id) ? {
        weapon: {
          id: `power-${id}`,
          slot: "weapon",
          rarity: "common",
          equipmentLevel: id === "f" ? 20 : 2,
          baseStats: { physicalPower: id === "f" ? 50 : 5 },
          affixes: [],
        },
      } : {},
    })),
  };
}
