const assert = require("node:assert/strict");
const EXPECTATION = require("./roster-change-expectation");
const IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");

const impressions = IMPRESSIONS.createImpressionState({ profile: "expert" });
impressions.strengthCognitionMatrix.entries = [
  seeded("a", 6),
  seeded("b", 5),
  seeded("c", 4),
  seeded("d", 1.5),
  seeded("e", 1),
  seeded("f", 7),
  seeded("g", 5),
  seeded("h", 2),
  seeded("i", 3),
];
IMPRESSIONS.STRENGTH_MATRIX.refreshStrengthScale(impressions.strengthCognitionMatrix);
impressions.traitObservations.push(traitObservation("h", "area_damage", 6));
impressions.traitObservations.push(traitObservation("e", "area_damage", 0));

let state = EXPECTATION.createState();
state = EXPECTATION.recordChallenge(state, {
  teamIds: ["a", "b", "c", "g"],
  entityImpressionState: impressions,
  record: challenge("boss_gate", "loss", 0.4, 3.2, 8),
}).state;
state = EXPECTATION.recordChallenge(state, {
  teamIds: ["a", "b", "c", "i"],
  entityImpressionState: impressions,
  record: challenge("boss_gate", "loss", 3.6, 3.2, 8),
}).state;
state = EXPECTATION.recordChallenge(state, {
  teamIds: ["a", "b", "c", "e"],
  entityImpressionState: impressions,
  record: challenge("boss_gate", "loss", 2, 2.8, 8),
}).state;

const view = EXPECTATION.buildExpectations({
  state,
  currentTeamIds: ["a", "b", "c", "e"],
  allowedActions: [
    "swap:3:d",
    "swap:3:f",
    "swap:3:g",
    "swap:3:h",
    "swap:3:i",
    "swap:3:unknown",
  ],
  visibleNodeIds: ["boss_gate"],
  entityImpressionState: impressions,
});

assert.equal(view.baseline.evidenceScope, "exact_current_team_and_encounter");
assert.equal(view.baseline.outcome, "loss");

const marginal = byIncoming("d");
assert.equal(marginal.expectedOutcome, "likely_failure");
assert.equal(marginal.priorFailureTransfer, "failure_still_likely_but_less_certain");

const strong = byIncoming("f");
assert.equal(strong.evidenceScope, "one_member_counterfactual_from_exact_current_team");
assert.equal(strong.strengthDelta, 6);
assert.equal(strong.expectedOutcome, "plausible_success");
assert.equal(strong.priorFailureTransfer, "failure_expectation_reopened_by_material_cognition_change");

const alreadyFailed = byIncoming("g");
assert.equal(alreadyFailed.evidenceScope, "exact_team_and_encounter");
assert.equal(alreadyFailed.expectedOutcome, "likely_failure");
assert.equal(alreadyFailed.priorFailureTransfer, "exact_failure_applies");

const areaSpecialist = byIncoming("h");
assert(areaSpecialist.contextRelevantTraitDomains.includes("area_damage"));
assert(areaSpecialist.comparedTraitDomains.includes("area_damage"));
assert(areaSpecialist.unknownTraitDomains.includes("control"));
assert.equal(areaSpecialist.traitEvidenceStatus, "partial");
assert.equal(areaSpecialist.traitLevelDelta, 6);
assert.equal(areaSpecialist.expectedOutcome, "plausible_success",
  "a known area-damage trait should distinguish a many-target replacement even when raw strength alone is insufficient");

const unknown = byIncoming("unknown");
assert.equal(unknown.expectedOutcome, "unknown");
assert.equal(unknown.priorFailureTransfer, "do_not_generalize_without_character_evidence");

const favorableMarginFailure = byIncoming("i");
assert.equal(favorableMarginFailure.predictedPerformanceScore, 0.1);
assert.equal(favorableMarginFailure.expectedOutcome, "likely_failure",
  "an exact observed loss must not become success merely because the final HP margin was favorable");
assert.equal(favorableMarginFailure.performanceInterpretation, "favorable_hp_margin_did_not_produce_a_win");

let otherRosterOnlyState = EXPECTATION.createState();
otherRosterOnlyState = EXPECTATION.recordChallenge(otherRosterOnlyState, {
  teamIds: ["a", "b", "c", "g"],
  entityImpressionState: impressions,
  record: challenge("other_roster_gate", "loss", 1, 3, 8),
}).state;
const exactBaselineGuardrail = EXPECTATION.buildExpectations({
  state: otherRosterOnlyState,
  currentTeamIds: ["a", "b", "c", "e"],
  allowedActions: ["swap:3:f"],
  visibleNodeIds: ["other_roster_gate"],
  entityImpressionState: impressions,
});
assert.equal(exactBaselineGuardrail.baseline, null,
  "another roster's result must never be borrowed as the current roster baseline");
assert.equal(exactBaselineGuardrail.actions[0].expectedOutcome, "unknown");

const profileResults = [
  { profile: "ordinary", strongPosition: 5, areaTraitLevel: 4 },
  { profile: "familiar", strongPosition: 6, areaTraitLevel: 5 },
  { profile: "expert", strongPosition: 7, areaTraitLevel: 6 },
].map((profileCase) => {
  const profileImpressions = structuredClone(impressions);
  profileImpressions.profile = profileCase.profile;
  profileImpressions.strengthCognitionMatrix.profile = profileCase.profile;
  profileImpressions.strengthCognitionMatrix.entries.find((row) => row.subject.id === "f").position = profileCase.strongPosition;
  profileImpressions.traitObservations.find((row) => row.subject.id === "h").claim.level = profileCase.areaTraitLevel;
  IMPRESSIONS.STRENGTH_MATRIX.refreshStrengthScale(profileImpressions.strengthCognitionMatrix);
  const profileView = EXPECTATION.buildExpectations({
    state,
    currentTeamIds: ["a", "b", "c", "e"],
    allowedActions: ["swap:3:f", "swap:3:h"],
    visibleNodeIds: ["boss_gate"],
    entityImpressionState: profileImpressions,
  });
  const strongCase = profileView.actions.find((row) => row.incomingId === "f");
  const traitCase = profileView.actions.find((row) => row.incomingId === "h");
  assert.notEqual(strongCase.expectedOutcome, "likely_failure");
  assert.notEqual(traitCase.expectedOutcome, "likely_failure");
  return {
    profile: profileCase.profile,
    strongReplacement: { effectiveLevelDelta: strongCase.effectiveLevelDelta, expectedOutcome: strongCase.expectedOutcome },
    areaReplacement: { effectiveLevelDelta: traitCase.effectiveLevelDelta, expectedOutcome: traitCase.expectedOutcome },
  };
});

let changedPowerState = EXPECTATION.createState();
const lowPowerFailure = challenge("power_gate", "loss", 2, 2.8, 8);
lowPowerFailure.gameEvent.gearBefore = 10;
changedPowerState = EXPECTATION.recordChallenge(changedPowerState, {
  teamIds: ["a", "b", "c", "e"],
  entityImpressionState: impressions,
  record: lowPowerFailure,
}).state;
const afterPowerChange = EXPECTATION.buildExpectations({
  state: changedPowerState,
  currentTeamIds: ["a", "b", "c", "e"],
  allowedActions: ["swap:3:f"],
  visibleNodeIds: ["power_gate"],
  currentPower: 15,
  entityImpressionState: impressions,
});
assert.equal(afterPowerChange.baseline, null,
  "a material equipment change must invalidate an old roster-only failure baseline");
assert.equal(afterPowerChange.actions[0].expectedOutcome, "unknown");
const newVisibleEncounter = EXPECTATION.buildExpectations({
  state,
  currentTeamIds: ["a", "b", "c", "e"],
  allowedActions: ["swap:3:f"],
  visibleNodeIds: ["new_region_gate"],
  entityImpressionState: impressions,
});
assert.equal(newVisibleEncounter.targetNode, "new_region_gate");
assert.equal(newVisibleEncounter.baseline, null,
  "history from an encounter that is no longer visible must not become the next region's roster baseline");

const changedCognition = structuredClone(impressions);
changedCognition.strengthCognitionMatrix.entries.find((row) => row.subject.id === "g").position = 8;
IMPRESSIONS.STRENGTH_MATRIX.refreshStrengthScale(changedCognition.strengthCognitionMatrix);
const afterCharacterRevision = EXPECTATION.buildExpectations({
  state,
  currentTeamIds: ["a", "b", "c", "e"],
  allowedActions: ["swap:3:g"],
  visibleNodeIds: ["boss_gate"],
  entityImpressionState: changedCognition,
});
assert.equal(afterCharacterRevision.actions[0].evidenceScope,
  "one_member_counterfactual_from_exact_current_team",
  "an old exact-team failure must stop dominating after that character's cognition changes materially");
assert.equal(afterCharacterRevision.actions[0].expectedOutcome, "plausible_success");

console.log(JSON.stringify({
  result: "PASS",
  episode: "failed current roster, then compare several different one-character replacements",
  baseline: view.baseline,
  alternatives: view.actions.map((row) => ({
    incomingId: row.incomingId,
    evidenceScope: row.evidenceScope,
    expectedChange: row.expectedChange,
    expectedOutcome: row.expectedOutcome,
    strengthDelta: row.strengthDelta,
    traitLevelDelta: row.traitLevelDelta,
    predictedPerformanceScore: row.predictedPerformanceScore,
    exactObservedWinRate: row.exactObservedWinRate,
    performanceInterpretation: row.performanceInterpretation,
    priorFailureTransfer: row.priorFailureTransfer,
  })),
  profileResults,
  equipmentGuardrail: {
    oldPower: 10,
    currentPower: 15,
    baselineAccepted: Boolean(afterPowerChange.baseline),
    expectedOutcome: afterPowerChange.actions[0].expectedOutcome,
  },
  contextGuardrail: {
    targetNode: newVisibleEncounter.targetNode,
    oldEncounterTransferred: Boolean(newVisibleEncounter.baseline),
  },
  cognitionRevisionGuardrail: {
    oldExactFailureApplied: afterCharacterRevision.actions[0].evidenceScope === "exact_team_and_encounter",
    revisedCharacterPosition: 8,
    expectedOutcome: afterCharacterRevision.actions[0].expectedOutcome,
  },
  exactBaselineGuardrail: {
    otherRosterHistoryAvailable: true,
    currentRosterBaselineAccepted: Boolean(exactBaselineGuardrail.baseline),
    expectedOutcome: exactBaselineGuardrail.actions[0].expectedOutcome,
  },
}, null, 2));

function byIncoming(id) {
  return view.actions.find((row) => row.incomingId === id);
}

function challenge(node, outcome, playerHp, enemyHp, enemyCount) {
  return {
    outcome,
    action: `challenge:${node}`,
    gameEvent: {
      node,
      outcome,
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

function traitObservation(id, domain, level) {
  return {
    subject: { id, name: id, role: "probe" },
    reportId: "trait-seed",
    observationOrder: 1,
    context: { tags: ["many_targets"] },
    basis: {},
    claim: { domain, level, rawMagnitudePercent: 110 },
    eligible: true,
    evidenceReliability: 1,
  };
}
