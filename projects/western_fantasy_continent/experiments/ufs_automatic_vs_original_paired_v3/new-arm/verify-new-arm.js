"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..");
const CORE = path.resolve(ROOT, "../ufs_first_action_imagination_v0");
const V2 = path.resolve(ROOT, "../ufs_live_ai_automatic_multicutpoint_three_round_v2");
const protocol = JSON.parse(fs.readFileSync(path.join(ROOT, "PAIR_PROTOCOL.json"), "utf8"));
const evidence = JSON.parse(fs.readFileSync(path.join(HERE, "evidence", "machine-evidence.json"), "utf8"));
const tapeFile = JSON.parse(fs.readFileSync(path.join(HERE, "evidence", "random-draw-tape.json"), "utf8"));
const checkpoint = JSON.parse(fs.readFileSync(path.join(HERE, "evidence", "final-checkpoint.json"), "utf8"));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

assert.equal(evidence.arm, "new");
assert.equal(evidence.protocolHash, sha256(path.join(ROOT, "PAIR_PROTOCOL.json")));
assert.equal(evidence.protocolHash, fs.readFileSync(path.join(ROOT, "PAIR_PROTOCOL.sha256"), "utf8").trim().split(/\s+/u)[0]);
assert.equal(evidence.frozenHashes.publicInitialState, sha256(path.join(CORE, "public_initial_state.json")));
assert.equal(evidence.frozenHashes.publicInitialState, protocol.assets.publicInitialState.sha256);
assert.equal(evidence.frozenHashes.publicMap, sha256(path.join(CORE, "public-map.js")));
assert.equal(evidence.frozenHashes.publicMap, protocol.assets.publicMap.sha256);
assert.equal(evidence.controllerHash, sha256(path.join(V2, "automatic-multicutpoint-controller.js")));
assert.equal(evidence.controllerHash, protocol.arms.new.controllerSha256);
assert.equal(evidence.attentionSeed, protocol.attentionSeed);
assert.equal(evidence.threeRoundRunCompleted, true);
assert.equal(evidence.rounds.length, protocol.roundsToComplete);
assert.ok(evidence.rounds.every((round) => round.gate.pass));
assert.ok(evidence.rounds.every((round) => round.boundaryAudit.inspectedAtSafeBoundary));
assert.ok(evidence.rounds.every((round) => round.endResponse.reason === "waiting_for_next_round_roll"));
assert.ok(evidence.rounds.every((round) => round.endResponse.availableOperations.includes("submit_round_roll")));

const plans = evidence.rounds.flatMap((round) => round.planningEvents);
const liveActions = evidence.rounds.flatMap((round) => round.actions);
const controlledActions = liveActions.filter((action) => action.source === "automatic_multicutpoint_controller");
const rerolls = liveActions.filter((action) => action.source === "live_environment_random_provider");
assert.ok(plans.length > 0);
assert.ok(controlledActions.length > 0);
assert.ok(plans.every((plan) => plan.candidates.every((candidate) => candidate.manualQPresent === false)));
assert.ok(plans.every((plan) => plan.candidates.every((candidate) => candidate.imagination.formalOracleUsed === false)));
assert.ok(plans.every((plan) => plan.candidates.every((candidate) => candidate.candidate.steps.every((step) => ![
  "submit_random_observation", "submit_round_roll",
].includes(step.operation.type)))));
assert.ok(liveActions.every((action) => action.response.status !== "rejected"));

const plansById = new Map(plans.map((plan) => [plan.id, plan]));
assert.equal(new Set(controlledActions.map((action) => action.planningEventId)).size, controlledActions.length);
for (const action of controlledActions) {
  const plan = plansById.get(action.planningEventId);
  assert.ok(plan, `missing plan ${action.planningEventId}`);
  assert.equal(action.executedStepIndex, 0);
  assert.equal(action.qRevision, plan.qRevision);
  assert.deepEqual(action.operation, plan.selectedCandidate.steps[0].operation);
  assert.equal(action.imaginationEvidence.imagined, true);
  assert.deepEqual(action.imaginationEvidence.operation, action.operation);
  assert.ok(["complete", "paused_random"].includes(action.selectedImaginationStatus));
}

for (const round of evidence.rounds) {
  for (const replan of round.randomReplans) {
    assert.ok(replan.oldPlanningEventId);
    const priorPlan = plansById.get(replan.oldPlanningEventId);
    assert.equal(priorPlan.selectedImaginationStatus, "paused_random");
    assert.deepEqual(replan.discardedOldSuffix, priorPlan.selectedCandidate.steps.slice(1));
    const nextPlan = round.planningEvents.find((plan) => plan.qRevision >= replan.nextQRevision);
    assert.ok(nextPlan, `no new-Q plan after random operation ${replan.randomOperationOrdinal}`);
    assert.ok(nextPlan.ordinal > priorPlan.ordinal);
  }
}
assert.equal(rerolls.length, evidence.rounds.reduce((sum, round) => sum + round.randomReplans.length, 0));

const randomGroups = [];
for (let roundIndex = 0; roundIndex < evidence.rounds.length; roundIndex += 1) {
  if (roundIndex > 0) {
    const transition = evidence.roundTransitions.find((row) => row.targetRound === roundIndex + 1);
    assert.ok(transition);
    randomGroups.push({ round: roundIndex + 1, ids: transition.ids, operation: transition.operation });
  }
  for (const action of evidence.rounds[roundIndex].actions) {
    if (action.source === "live_environment_random_provider") {
      randomGroups.push({ round: roundIndex + 1, ids: action.ids, operation: action.operation });
    }
  }
}

assert.deepEqual(tapeFile, evidence.randomTape);
assert.equal(tapeFile.algorithm, protocol.random.algorithm);
assert.equal(tapeFile.initialSeedUnsigned, protocol.random.initialSeedUnsigned);
assert.equal(tapeFile.drawCount, tapeFile.draws.length);
let state = protocol.random.initialSeedUnsigned >>> 0;
let cursor = 0;
for (const group of randomGroups) {
  assert.deepEqual(Object.keys(group.operation.values), group.ids);
  for (const id of group.ids) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    const expectedValue = (state % 6) + 1;
    const draw = tapeFile.draws[cursor];
    assert.equal(draw.ordinal, cursor + 1);
    assert.equal(draw.id, id);
    assert.equal(draw.value, expectedValue);
    assert.equal(draw.value, group.operation.values[id]);
    assert.equal(draw.stateAfter, state);
    assert.equal(draw.round, group.round);
    cursor += 1;
  }
}
assert.equal(cursor, tapeFile.drawCount);
assert.equal(tapeFile.currentState, state);

assert.equal(checkpoint.schema, "ufs_full_game_attention_checkpoint_v2");
assert.equal(checkpoint.completedRounds.length, 3);
assert.equal(checkpoint.completedRounds[2].round, 3);
assert.equal(checkpoint.lastPlayerResponse.reason, "waiting_for_next_round_roll");
assert.equal(checkpoint.lastPlayerResponse.observation.phase, "new_round");
assert.deepEqual(evidence.final, evidence.rounds[2].boundaryAudit.formal);
assert.equal(evidence.claims.advantageEstablished, false);

process.stdout.write(`${JSON.stringify({
  status: "PASS",
  protocolHash: evidence.protocolHash,
  controllerHash: evidence.controllerHash,
  rounds: evidence.rounds.length,
  planningEvents: plans.length,
  candidatesImagined: plans.reduce((sum, plan) => sum + plan.candidates.length, 0),
  controlledActions: controlledActions.length,
  randomReplans: rerolls.length,
  randomDraws: tapeFile.drawCount,
  liveRejected: liveActions.filter((action) => action.response.status === "rejected").length,
  manualIntermediateQ: plans.flatMap((plan) => plan.candidates).filter((candidate) => candidate.manualQPresent).length,
  plannedRandomOperations: plans.flatMap((plan) => plan.candidates).flatMap((candidate) => candidate.candidate.steps)
    .filter((step) => ["submit_random_observation", "submit_round_roll"].includes(step.operation.type)).length,
}, null, 2)}\n`);
