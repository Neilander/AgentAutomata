const assert = require("node:assert/strict");
const ROSTER_A = require("./roster-expectation-a");
const ADAPTER = require("../../game_data/map-cognition-v3-event-adapter");
const RUNTIME = require("../../game_data/player-cognition-v3-event-runtime");

const cases = [
  runCase({
    id: "negative_disappointment",
    profile: "ordinary",
    baselineScore: -0.25,
    predictedScore: 0.242,
    actualScore: -0.15,
    expectedLevel: 2,
    actualLevel: 0,
    mismatchInput: -2 / 9,
  }),
  runCase({
    id: "same_band_zero",
    profile: "ordinary",
    baselineScore: -0.15,
    predictedScore: 0.57,
    actualScore: 0.7,
    expectedLevel: 4,
    actualLevel: 4,
    mismatchInput: 0,
  }),
  runCase({
    id: "positive_surprise",
    profile: "ordinary",
    baselineScore: -0.1,
    predictedScore: 0.392,
    actualScore: 0.7,
    expectedLevel: 2,
    actualLevel: 4,
    mismatchInput: 2 / 9,
  }),
  runCase({
    id: "persistent_expert_profile",
    profile: "expert",
    baselineScore: -0.25,
    predictedScore: 0.242,
    actualScore: -0.15,
    expectedLevel: 3,
    actualLevel: 0,
    mismatchInput: -3 / 9,
  }),
];

const transitions = transitionCases();
const superseded = supersedeCase();

console.log(JSON.stringify({
  result: "PASS",
  cases,
  transitions,
  superseded,
  rule: "Agent selects a roster action; code freezes its prediction and settles A once on the next comparable combat",
}, null, 2));

function runCase(spec) {
  const teamBefore = ["a", "b", "c", "d"];
  const candidateTeam = ["a", "b", "c", "strong"];
  const gameState = { teamSlots: teamBefore, roster: [] };
  const view = expectationView(spec.baselineScore, spec.predictedScore, candidateTeam);
  const frozen = ROSTER_A.freezeSelectedPrediction(ROSTER_A.createState(), {
    action: "swap:3:strong",
    rosterChangeExpectations: view,
    gameState,
    perceptionProfile: spec.profile,
    cycle: 1,
  });
  assert(frozen.record, `${spec.id}: selected numeric prediction must freeze`);
  assert.equal(frozen.record.expectedPerception.level, spec.expectedLevel);

  const gameEvent = eventFromScore(spec.actualScore, "target_gate", 2);
  const resolved = ROSTER_A.resolveChallenge(frozen.state, {
    action: "challenge:target_gate",
    gameStateBefore: { teamSlots: candidateTeam, roster: [] },
    gameEvent,
    cycle: 2,
  });
  assert(resolved.settlement, `${spec.id}: comparable challenge must settle`);
  assert.equal(resolved.state.pending, null);
  assert.equal(resolved.state.history.length, 1);
  assert.equal(resolved.settlement.actualPerception.level, spec.actualLevel);
  assert(close(resolved.settlement.mismatchInput, spec.mismatchInput));

  let cognition = RUNTIME.createState(`roster-a:${spec.id}`);
  cognition = ingest(cognition, eventFromScore(spec.baselineScore, "target_gate", 1), null);
  cognition = ingest(cognition, gameEvent, resolved.settlement);
  const summary = cognition.trace.filter((row) => row.type === "action_summary").at(-1);
  assert.equal(summary.expectationSource, "roster_prediction");
  assert.equal(summary.mismatchStatus, "resolved_roster_prediction");
  assert.equal(summary.learningOrder, "feedback_then_update");
  assert.equal(summary.expectationDetails.id, frozen.record.id);
  assert(close(summary.expectationEmotion, summary.expectationDetails.formula.value));
  assert.equal(cognition.expectationLedger.some((row) => row.status === "pending"), false,
    `${spec.id}: the generic action ledger must close when roster A overrides it`);
  if (spec.mismatchInput < 0) assert(summary.expectationEmotion < 0);
  if (spec.mismatchInput === 0) {
    assert(summary.expectationEmotion > 0, `${spec.id}: matching the perceived band must receive confirmation C`);
    assert(summary.expectationDetails.formula.confirmation.value > 0);
  }
  if (spec.mismatchInput > 0) assert(summary.expectationEmotion > 0);

  return {
    id: spec.id,
    profile: spec.profile,
    expectedLevel: resolved.settlement.expectedPerception.level,
    actualLevel: resolved.settlement.actualPerception.level,
    mismatchInput: resolved.settlement.mismatchInput,
    A: summary.expectationEmotion,
    source: summary.expectationSource,
    status: summary.mismatchStatus,
  };
}

function transitionCases() {
  const candidateTeam = ["a", "b", "c", "strong"];
  const differentEncounter = resolveTransition({
    candidateTeam,
    challengeAction: "challenge:other_gate",
    challengeNode: "other_gate",
    challengeTeam: candidateTeam,
    gameStateAtSelection: { teamSlots: ["a", "b", "c", "d"], roster: [] },
    gameStateAtChallenge: { teamSlots: candidateTeam, roster: [] },
  });
  assert.equal(differentEncounter.status, "resolved");
  assert.equal(differentEncounter.settlement.resolutionMode, "new_encounter_inertia");
  assert.equal(differentEncounter.settlement.expectationWeight, ROSTER_A.NEW_ENCOUNTER_INERTIA_WEIGHT);

  const differentTeam = invalidate({
    candidateTeam,
    challengeAction: "challenge:target_gate",
    challengeNode: "target_gate",
    challengeTeam: ["a", "b", "c", "other"],
    gameStateAtSelection: { teamSlots: ["a", "b", "c", "d"], roster: [] },
    gameStateAtChallenge: { teamSlots: ["a", "b", "c", "other"], roster: [] },
  });
  assert.equal(differentTeam.reason, "different_team");

  const selectionRoster = rosterWithItem(candidateTeam, "blade_v1", 10);
  const challengeRoster = rosterWithItem(candidateTeam, "blade_v2", 11);
  const differentEquipment = resolveTransition({
    candidateTeam,
    challengeAction: "challenge:target_gate",
    challengeNode: "target_gate",
    challengeTeam: candidateTeam,
    gameStateAtSelection: { teamSlots: ["a", "b", "c", "d"], roster: selectionRoster },
    gameStateAtChallenge: { teamSlots: candidateTeam, roster: challengeRoster },
  });
  assert.equal(differentEquipment.status, "resolved");
  assert.equal(differentEquipment.settlement.equipmentAdjustments.length, 1);
  assert.equal(differentEquipment.settlement.equipmentAdjustments[0].status, "recalculated");
  return [differentEncounter, differentTeam, differentEquipment];
}

function resolveTransition(spec) {
  const frozen = ROSTER_A.freezeSelectedPrediction(ROSTER_A.createState(), {
    action: "swap:3:strong",
    rosterChangeExpectations: expectationView(-0.25, 0.47, spec.candidateTeam),
    gameState: spec.gameStateAtSelection,
    perceptionProfile: "ordinary",
    cycle: 1,
  });
  const resolved = ROSTER_A.resolveChallenge(frozen.state, {
    action: spec.challengeAction,
    gameStateBefore: spec.gameStateAtChallenge,
    gameEvent: eventFromScore(0.7, spec.challengeNode, 2),
    cycle: 2,
  });
  assert(resolved.settlement, "a compatible team must settle after context re-estimation");
  assert.equal(resolved.resolution.status, "resolved");
  return { status: resolved.resolution.status, settlement: resolved.settlement };
}

function invalidate(spec) {
  const frozen = ROSTER_A.freezeSelectedPrediction(ROSTER_A.createState(), {
    action: "swap:3:strong",
    rosterChangeExpectations: expectationView(-0.25, 0.47, spec.candidateTeam),
    gameState: spec.gameStateAtSelection,
    perceptionProfile: "ordinary",
    cycle: 1,
  });
  const resolved = ROSTER_A.resolveChallenge(frozen.state, {
    action: spec.challengeAction,
    gameStateBefore: spec.gameStateAtChallenge,
    gameEvent: eventFromScore(0.7, spec.challengeNode, 2),
    cycle: 2,
  });
  assert.equal(resolved.settlement, null);
  assert.equal(resolved.resolution.status, "invalidated");
  assert.equal(resolved.state.pending, null);
  return { status: resolved.resolution.status, reason: resolved.resolution.resolutionReason };
}

function supersedeCase() {
  const initial = ROSTER_A.freezeSelectedPrediction(ROSTER_A.createState(), {
    action: "swap:3:strong",
    rosterChangeExpectations: expectationView(-0.25, 0.47, ["a", "b", "c", "strong"]),
    gameState: { teamSlots: ["a", "b", "c", "d"], roster: [] },
    perceptionProfile: "ordinary",
    cycle: 1,
  });
  const secondView = {
    targetNode: "target_gate",
    baseline: { performanceScore: -0.1 },
    actions: [{
      action: "swap:2:mage",
      candidateTeamIds: ["a", "b", "mage", "strong"],
      predictedPerformanceScore: 0.4,
      evidenceScope: "one_member_counterfactual_from_exact_current_team",
    }],
  };
  const second = ROSTER_A.freezeSelectedPrediction(initial.state, {
    action: "swap:2:mage",
    rosterChangeExpectations: secondView,
    gameState: { teamSlots: ["a", "b", "c", "strong"], roster: [] },
    perceptionProfile: "ordinary",
    cycle: 2,
  });
  assert.equal(second.state.history[0].status, "superseded");
  assert.equal(second.state.pending.selectedAction, "swap:2:mage");
  const restored = ROSTER_A.ensureState(structuredClone(second.state));
  assert.equal(restored.pending.id, second.state.pending.id, "pending A must survive save/restore cloning");
  return {
    archivedStatus: second.state.history[0].status,
    pendingAction: second.state.pending.selectedAction,
    persisted: true,
  };
}

function rosterWithItem(teamIds, itemId, value) {
  return teamIds.map((id) => ({
    id,
    equipment: id === "strong" ? {
      weapon: { id: itemId, slot: "weapon", rarity: "common", equipmentLevel: 1, baseStats: { attack: value }, affixes: [] },
    } : {},
  }));
}

function expectationView(baselineScore, predictedScore, candidateTeamIds) {
  return {
    targetNode: "target_gate",
    baseline: { performanceScore: baselineScore },
    actions: [{
      action: "swap:3:strong",
      candidateTeamIds,
      predictedPerformanceScore: predictedScore,
      evidenceScope: "one_member_counterfactual_from_exact_current_team",
      confidence: 0.7,
    }],
  };
}

function ingest(cognition, gameEvent, settlement) {
  const eventLog = ADAPTER.buildMapEventLog("challenge:target_gate", gameEvent, { region: "region_1" });
  ROSTER_A.attachSettlement(eventLog, settlement);
  return RUNTIME.ingestEvents(cognition, eventLog);
}

function eventFromScore(score, node, step) {
  const playerRemaining = (score + 1) / 2;
  const enemyRemaining = (1 - score) / 2;
  return {
    node,
    step,
    outcome: score > 0.2 ? "win" : "loss",
    duration: 10,
    teamSizes: { player: 4, enemy: 4 },
    hpScore: { player: playerRemaining * 4, enemy: enemyRemaining * 4 },
    waveSummary: [{ unitCount: 8 }],
    loot: [],
  };
}

function close(a, b) { return Math.abs(Number(a) - Number(b)) < 0.0002; }
