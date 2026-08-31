"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const { allocateFullAttention } = require("./ufs-full-attention-provider");

const q = (affected_object, change_trend, cause_relation = "cause", temporal_state = "after", context = "experienced") => ({
  affected_object,
  change_trend,
  cause_relation,
  temporal_state,
  context,
});

const VALID = Object.freeze({
  evidenceId: "public-step-1",
  playerVisible: true,
  transition: "committed",
  systemIntegrity: "passed",
});

const SOURCE = Object.freeze({ kind: "single_experience", ref: "public-step-1" });

function clock() {
  let tick = 0;
  return () => `2026-08-28T15:30:${String(tick++).padStart(2, "0")}+08:00`;
}

function minimalPublicInput() {
  return {
    observation: {
      round: 1, phase: "dice", energy: 3, damage: 0, researchIndex: 2,
      excavatorIndex: 0, mothershipRow: 0, outcome: null,
      dice: [], ships: [], waitingShips: [], placements: [], robots: [], uncertainties: [],
    },
    publicMap: {
      id: "feedback-attention-map", columns: 1, city: {}, research: {},
      base: {
        rooms: [{ id: "R", type: "research", cellIds: ["C"] }],
        cells: [{ id: "C", roomId: "R", column: 0, tile: "research", unlockIndex: 0 }],
      },
      sky: { dropRow: 0, rows: [{ index: 0, cells: [{}], mothershipActions: [] }] },
    },
  };
}

test("normal visible transition is created, then reinforced instead of duplicated", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const currentQ = q("research room", "ready to resolve");
  const followingQ = q("research and energy", "energy decreases by 1; research stays unchanged");
  const first = learner.learnObservedTransition({
    evidence: VALID, currentQ, actualFollowingQ: followingQ, source: SOURCE,
  });
  const second = learner.learnObservedTransition({
    evidence: { ...VALID, evidenceId: "public-step-2" }, currentQ,
    actualFollowingQ: followingQ,
    source: { kind: "repeated_experience", ref: "public-step-2" },
  });
  assert.equal(first.learned, true);
  assert.equal(second.trajectory.trajectoryId, first.trajectory.trajectoryId);
  assert.equal(learner.exportState().trajectories.length, 1);
  assert.equal(learner.exportState().memories.length, 2);
  assert.equal(second.trajectory.supportingMemoryIds.length, 2);
  assert.equal(second.trajectory.observations, 2);
  assert.equal(second.trajectory.support, 2);
  assert.ok(second.trajectory.lastSeenAt > second.trajectory.firstSeenAt);
  assert.ok(second.trajectory.confidence > first.trajectory.confidence);
  assert.equal(learner.pendingMatrixRecords().length, 1);
  learner.markMatrixCompiled({
    trajectoryIds: [second.trajectory.trajectoryId],
    manifestRef: "feedback-matrix-v1.json",
  });
  assert.equal(learner.pendingMatrixRecords().length, 0);
  const restored = new UfsFeedbackLearner({ state: learner.exportState(), now: clock() });
  assert.equal(restored.recall(currentQ).candidates[0].compileStatus, "compiled_matrix");
});

test("Q-before and Q-after trace back to every explicit supporting memory", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const currentQ = q("closed metal box", "opening attempt pending");
  const followingQ = q("metal box", "opens after repeated strikes");
  const operations = [
    { type: "strike", tool: "hammer", target: "box" },
    { type: "strike", tool: "hammer", target: "box" },
  ];
  for (const evidenceId of ["box-attempt-1", "box-attempt-2"]) {
    learner.learnObservedTransition({
      evidence: { ...VALID, evidenceId },
      currentQ,
      actualFollowingQ: followingQ,
      operations,
      source: { kind: "single_experience", ref: evidenceId },
      applicability: { location: "workshop" },
    });
  }
  const traced = learner.traceTransition(currentQ, followingQ, {
    operations,
    context: { location: "workshop" },
  });
  assert.equal(traced.trajectories.length, 1);
  assert.equal(traced.memoryIds.length, 2);
  assert.deepEqual(
    traced.memories.map((row) => row.evidence.evidenceId),
    ["box-attempt-1", "box-attempt-2"],
  );
  assert.deepEqual(
    learner.recallMemory(traced.memoryIds[0]).operations,
    operations,
  );
});

test("ordered operation sequences remain distinct for the same Q pair", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const currentQ = q("locked door", "two controls available");
  const followingQ = q("door", "opens");
  const insertThenTurn = [{ type: "insert_key" }, { type: "turn_key" }];
  const turnThenInsert = [{ type: "turn_key" }, { type: "insert_key" }];
  learner.learnObservedTransition({
    evidence: { ...VALID, evidenceId: "ordered-1" },
    currentQ,
    actualFollowingQ: followingQ,
    operations: insertThenTurn,
    source: { kind: "single_experience", ref: "ordered-1" },
  });
  learner.learnObservedTransition({
    evidence: { ...VALID, evidenceId: "ordered-2" },
    currentQ,
    actualFollowingQ: followingQ,
    operations: turnThenInsert,
    source: { kind: "single_experience", ref: "ordered-2" },
  });
  const state = learner.exportState();
  assert.equal(state.trajectories.length, 2);
  assert.notEqual(state.trajectories[0].operationSequenceKey, state.trajectories[1].operationSequenceKey);
  assert.equal(learner.recall(currentQ, { operations: insertThenTurn }).candidates.length, 1);
  assert.equal(learner.traceTransition(currentQ, followingQ, {
    operations: turnThenInsert,
  }).memoryIds.length, 1);
});

test("the same audited evidence is idempotent and cannot create duplicate memory", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const input = {
    evidence: VALID,
    currentQ: q("jar", "strike pending"),
    actualFollowingQ: q("jar", "broken"),
    operations: [{ type: "strike", tool: "machete" }],
    source: SOURCE,
  };
  const first = learner.learnObservedTransition(input);
  const second = learner.learnObservedTransition(input);
  assert.equal(first.learned, true);
  assert.equal(second.duplicate, true);
  assert.equal(learner.exportState().memories.length, 1);
  assert.equal(learner.exportState().trajectories[0].supportingMemoryIds.length, 1);
});

test("a confirmed precompiled trajectory updates its connection overlay without a duplicate edge", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const currentQ = q("same-column ships", "descent pending");
  const followingQ = q("same-column ships", "descend by die value");
  const result = learner.learnObservedTransition({
    evidence: VALID,
    currentQ,
    actualFollowingQ: followingQ,
    source: SOURCE,
    predictionCandidates: [{
      trajectoryId: "read-rule-place-die-to-same-column-descent",
      activation: 0.98,
      predictedFollowingQ: followingQ,
    }],
  });
  const state = learner.exportState();
  assert.equal(result.trajectory, null);
  assert.match(result.memory.memoryId, /^memory-/u);
  assert.equal(state.trajectories.length, 0);
  assert.equal(state.memories.length, 1);
  assert.equal(state.connectionUpdates.length, 1);
  assert.equal(state.connectionUpdates[0].addedSupport, 1);
  assert.equal(state.connectionUpdates[0].addedObservations, 1);
  assert.deepEqual(state.connectionUpdates[0].supportingMemoryIds, [result.memory.memoryId]);
  const traced = learner.traceTransition(currentQ, followingQ);
  assert.deepEqual(traced.trajectoryIds, ["read-rule-place-die-to-same-column-descent"]);
  assert.deepEqual(traced.memoryIds, [result.memory.memoryId]);
});

test("high-activation error keeps old trajectory and adds a contextual correction", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const currentQ = q("research room", "resolution pending");
  const oldFollowingQ = q("research", "research advances");
  const actualFollowingQ = q("research and energy", "energy decreases by 1; research does not advance");
  const old = learner.learnObservedTransition({
    evidence: VALID, currentQ, actualFollowingQ: oldFollowingQ,
    source: { kind: "tutorial", ref: "tutorial-research-room" },
  }).trajectory;
  const oldBefore = learner.exportState().trajectories.find((row) => row.trajectoryId === old.trajectoryId);
  const correction = learner.learnObservedTransition({
    evidence: { ...VALID, evidenceId: "public-zero-yield" }, currentQ, actualFollowingQ,
    source: { kind: "single_experience", ref: "public-zero-yield" },
    applicability: { roomBudget: 2, nextResearchCost: 4, energyCost: 1 },
    predictionCandidates: [{
      trajectoryId: old.trajectoryId,
      activation: 0.94,
      predictedFollowingQ: oldFollowingQ,
    }],
  });
  const oldAfter = learner.exportState().trajectories.find((row) => row.trajectoryId === old.trajectoryId);
  assert.deepEqual(oldAfter, oldBefore);
  assert.deepEqual(correction.trajectory.correctsTrajectoryIds, [old.trajectoryId]);
  assert.ok(correction.trajectory.mismatchSlots.includes("change_trend"));
  const recalled = learner.recall(currentQ, {
    context: { roomBudget: 2, nextResearchCost: 4, energyCost: 1 },
  });
  assert.equal(recalled.candidates[0].trajectoryId, correction.trajectory.trajectoryId);
  assert.equal(recalled.candidates.length, 2);
});

test("high-activation correction refuses a context-free global exception", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  assert.throws(() => learner.learnObservedTransition({
    evidence: VALID,
    currentQ: q("ship", "arrow effect pending"),
    actualFollowingQ: q("ship", "continues to final space"),
    source: SOURCE,
    predictionCandidates: [{
      trajectoryId: "old-arrow-rule",
      activation: 0.9,
      predictedFollowingQ: q("ship", "moves sideways on passed arrow"),
    }],
  }), /distinguishing context/);
});

test("random feedback keeps multiple successors and moving numeric ranges", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const currentQ = q("treasure", "opening");
  const outcomes = [1, 3, 2, 3, 1, 2];
  outcomes.forEach((value, index) => learner.learnObservedTransition({
    evidence: { ...VALID, evidenceId: `random-${index}` },
    currentQ,
    actualFollowingQ: q("gold", `increases by ${value}`),
    source: { kind: index === 0 ? "single_experience" : "repeated_experience", ref: `random-${index}` },
    randomOutcome: { numericValue: value },
  }));
  const recalled = learner.recall(currentQ);
  assert.equal(recalled.candidates.length, 3);
  assert.equal(recalled.randomModel.observations, 6);
  assert.equal(recalled.randomModel.outcomeCounts.length, 3);
  assert.equal(recalled.randomModel.center, 2);
  assert.deepEqual(recalled.randomModel.commonRange, [1, 3]);
  assert.deepEqual(recalled.randomModel.historicalRange, [1, 3]);
  assert.notEqual(recalled.randomModel.recentShift, null);
});

test("unresolved query exit remains after a concrete rule answer is learned", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const currentQ = q("unknown icon", "effect unknown");
  const queryQ = q("rule source", "query icon consequence");
  const unresolved = learner.learnUnresolved({
    evidence: { ...VALID, transition: "knowledge_query" }, currentQ, queryQ,
    source: { kind: "single_experience", ref: "unknown-icon-visit" },
    unresolvedNeed: "find the icon's actual consequence",
  });
  const resolved = learner.resolveUnresolved({
    evidence: {
      evidenceId: "rule-page-icon", playerVisible: true,
      transition: "knowledge_query", systemIntegrity: "passed",
    },
    unresolvedId: unresolved.unresolved.unresolvedId,
    currentQ,
    resolvedFollowingQ: q("mothership", "moves down one row"),
    source: { kind: "rule_query", ref: "rule-page-icon" },
    applicability: { icon: "mothership_down" },
  });
  const state = learner.exportState();
  assert.equal(state.trajectories.length, 2);
  assert.equal(state.trajectories.find((row) => row.unresolved).followingQ.change_trend, "query icon consequence");
  assert.equal(resolved.unresolved.status, "resolved_but_query_exit_retained");
  assert.deepEqual(resolved.unresolved.resolutions, [resolved.trajectory.trajectoryId]);
});

test("repeated consecutive transitions strengthen chaining and reduce recall costs", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const first = learner.learnObservedTransition({
    evidence: VALID,
    currentQ: q("die", "placed"),
    actualFollowingQ: q("ship", "descends"),
    source: SOURCE,
  }).trajectory;
  let last;
  for (let index = 0; index < 4; index += 1) {
    last = learner.learnObservedTransition({
      evidence: { ...VALID, evidenceId: `chain-${index}` },
      currentQ: q("ship", "stops on arrow"),
      actualFollowingQ: q("ship", "moves sideways"),
      source: { kind: "repeated_experience", ref: `chain-${index}` },
      previousTrajectoryId: first.trajectoryId,
    });
  }
  assert.equal(last.chain.consecutiveCount, 4);
  assert.ok(last.chain.chainingStrength > 0.5);
  assert.ok(last.chain.automaticity > 0);
  assert.ok(last.chain.attentionCost < 0.5);
  assert.ok(last.chain.ruleQueryCost < 0.5);
});

test("miss feedback changes only scoped full-field activation; background remains available", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  learner.learnObservedTransition({
    evidence: VALID,
    currentQ: q("research room", "considered"),
    actualFollowingQ: q("research", "did not advance"),
    source: SOURCE,
    missedAttention: [{
      selector: { itemIds: ["track:researchIndex"] },
      scope: { action: "choose:place_die", phase: "dice" },
      amount: 0.2,
      reason: "漏看下一研究门槛",
    }],
  });
  const input = minimalPublicInput();
  const base = allocateFullAttention({
    publicInput: input,
    context: { action: "choose:place_die", phase: "dice", goal: "select_next_operation", tags: ["decision"], focus: {} },
    attentionLevel: 0.8, randomSeed: 1, mode: "probabilistic",
  });
  const learned = allocateFullAttention({
    publicInput: input,
    context: { action: "choose:place_die", phase: "dice", goal: "select_next_operation", tags: ["decision"], focus: {} },
    attentionLevel: 0.8, randomSeed: 1, mode: "probabilistic",
    learnedAttentionAdjustments: learner.exportAttentionAdjustments(),
  });
  const find = (allocation, id) => allocation.field.find((row) => row.itemId === id);
  assert.ok(Math.abs(
    find(learned, "track:researchIndex").activation
    - find(base, "track:researchIndex").activation
    - 0.2,
  ) < 1e-9);
  assert.equal(find(learned, "sky_cell:0:0").activation, find(base, "sky_cell:0:0").activation);
  assert.ok(find(learned, "sky_cell:0:0").activation > 0);
  const otherScope = allocateFullAttention({
    publicInput: input,
    context: { action: "resolve_research", phase: "rooms", goal: "continue", tags: [], focus: {} },
    attentionLevel: 0.8, randomSeed: 1, mode: "probabilistic",
    learnedAttentionAdjustments: learner.exportAttentionAdjustments(),
  });
  assert.equal(find(otherScope, "track:researchIndex").learnedAttentionAdjustment, 0);
});

test("provenance controls initial confidence while repeated evidence raises it", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const guessed = learner.learnObservedTransition({
    evidence: VALID,
    currentQ: q("icon A", "seen"), actualFollowingQ: q("ship", "moves"),
    source: { kind: "player_guess", ref: "guess-1" },
  }).trajectory;
  const queried = learner.learnObservedTransition({
    evidence: { ...VALID, evidenceId: "rule-query" },
    currentQ: q("icon B", "seen"), actualFollowingQ: q("ship", "moves"),
    source: { kind: "rule_query", ref: "rule-query" },
  }).trajectory;
  const repeated = learner.learnObservedTransition({
    evidence: { ...VALID, evidenceId: "repeat-guess" },
    currentQ: guessed.currentQ, actualFollowingQ: guessed.followingQ,
    source: { kind: "repeated_experience", ref: "repeat-guess" },
  }).trajectory;
  assert.ok(queried.confidence > guessed.confidence);
  assert.ok(repeated.confidence > guessed.confidence);
  assert.deepEqual(repeated.provenance.map((row) => row.kind), ["player_guess", "repeated_experience"]);
});

test("invalid, rejected, hidden, or system-corrupted feedback is quarantined without learning", () => {
  const learner = new UfsFeedbackLearner({ now: clock() });
  const cases = [
    { ...VALID, evidenceId: "hidden", playerVisible: false },
    { ...VALID, evidenceId: "rejected", transition: "rejected" },
    { ...VALID, evidenceId: "buggy", systemIntegrity: "failed" },
    { ...VALID, evidenceId: "unaudited", systemIntegrity: "unknown" },
  ];
  for (const evidence of cases) {
    const result = learner.learnObservedTransition({
      evidence,
      currentQ: q("excavation", "selected"),
      actualFollowingQ: q("energy", "becomes negative"),
      source: SOURCE,
    });
    assert.equal(result.learned, false);
  }
  const state = learner.exportState();
  assert.equal(state.trajectories.length, 0);
  assert.equal(state.quarantinedFeedback.length, 4);
});
