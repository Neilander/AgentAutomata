"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..");
const CORE = path.resolve(ROOT, "../ufs_first_action_imagination_v0");
const V2 = path.resolve(ROOT, "../ufs_live_ai_automatic_multicutpoint_three_round_v2");
const { isWaitingForNextRoundRollBoundary } = require(path.join(ROOT, "safety-boundary"));
const protocol = JSON.parse(fs.readFileSync(path.join(ROOT, "PAIR_PROTOCOL.json"), "utf8"));
const boundaryTest = JSON.parse(fs.readFileSync(path.join(ROOT, "safety-boundary-test-results.json"), "utf8"));
const evidence = JSON.parse(fs.readFileSync(path.join(HERE, "evidence", "machine-evidence.json"), "utf8"));
const tape = JSON.parse(fs.readFileSync(path.join(HERE, "evidence", "random-draw-tape.json"), "utf8"));
const checkpoint = JSON.parse(fs.readFileSync(path.join(HERE, "evidence", "final-checkpoint.json"), "utf8"));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function run() {
  const checks = [];
  const check = (name, body) => {
    try {
      body();
      checks.push({ name, pass: true });
    } catch (error) {
      checks.push({ name, pass: false, error: error.message });
    }
  };

  const plans = evidence.rounds.flatMap((round) => round.planningEvents);
  const liveActions = evidence.rounds.flatMap((round) => round.actions);
  const policyActions = liveActions.filter((action) => action.source === "automatic_multicutpoint_controller");
  const randomActions = liveActions.filter((action) => action.source === "live_environment_random_provider");

  check("frozen protocol and shared boundary artifacts", () => {
    assert.equal(evidence.protocolHash, sha256(path.join(ROOT, "PAIR_PROTOCOL.json")));
    assert.equal(evidence.protocolHash, fs.readFileSync(path.join(ROOT, "PAIR_PROTOCOL.sha256"), "utf8").trim().split(/\s+/u)[0]);
    assert.equal(sha256(path.join(ROOT, "safety-boundary.js")), protocol.safetyBoundary.helperSha256);
    assert.equal(sha256(path.join(ROOT, "test-safety-boundary.js")), protocol.safetyBoundary.contractTestSha256);
    assert.equal(sha256(path.join(ROOT, "safety-boundary-test-results.json")), protocol.safetyBoundary.preRunEvidenceSha256);
    assert.equal(sha256(path.join(CORE, "public_initial_state.json")), protocol.assets.publicInitialState.sha256);
    assert.equal(sha256(path.join(CORE, "public-map.js")), protocol.assets.publicMap.sha256);
    assert.equal(sha256(path.join(V2, "automatic-multicutpoint-controller.js")), protocol.arms.new.controllerSha256);
  });

  check("host-free boundary test passed before formal run", () => {
    assert.equal(boundaryTest.passed, true);
    assert.equal(boundaryTest.hostRuntimeImported, false);
    assert.equal(boundaryTest.randomDrawsConsumed, 0);
    assert.ok(Date.parse(boundaryTest.completedAt) < Date.parse(evidence.preRunBoundaryContract.formalRunStartedAt));
    assert.deepEqual(boundaryTest.cases.map((row) => [row.id, row.actual]), [
      ["real-public-shape", true],
      ["v3-wrong-choice-shape", false],
      ["other-random-boundary", false],
    ]);
  });

  check("exactly three completed shared-helper boundaries", () => {
    assert.equal(evidence.threeRoundRunCompleted, true);
    assert.equal(evidence.rounds.length, protocol.roundsToComplete);
    assert.equal(evidence.safetyBoundaryCount, protocol.roundsToComplete);
    assert.ok(evidence.rounds.every((round) => round.gate.pass));
    assert.ok(evidence.rounds.every((round) => isWaitingForNextRoundRollBoundary(round.endResponse)));
    assert.ok(evidence.rounds.every((round) => round.boundaryAudit.sharedPredicateReturnedTrue));
    assert.ok(evidence.rounds.every((round) => round.boundaryAudit.postHocOnly));
  });

  check("sealed controller and runtime unchanged", () => {
    assert.equal(evidence.controllerHash, protocol.arms.new.controllerSha256);
    assert.deepEqual(evidence.frozenHashesAfterRun, evidence.frozenHashesBeforeRun);
    assert.equal(evidence.invariants.controllerOrRuntimeChangedAfterStart, false);
  });

  check("zero manual Q and zero planned random operations", () => {
    assert.ok(plans.length > 0);
    assert.ok(plans.every((plan) => plan.candidates.every((candidate) => !candidate.manualQPresent)));
    assert.ok(plans.every((plan) => plan.candidates.every((candidate) => (
      candidate.imagination.formalOracleUsed === false
    ))));
    assert.ok(plans.every((plan) => plan.candidates.every((candidate) => (
      candidate.candidate.steps.every((step) => ![
        "submit_random_observation", "submit_round_roll",
      ].includes(step.operation.type))
    ))));
  });

  check("zero live rejects", () => {
    assert.ok(liveActions.length > 0);
    assert.equal(liveActions.filter((action) => action.response.status === "rejected").length, 0);
  });

  check("every policy action is newest-Q imagined step zero", () => {
    const plansById = new Map(plans.map((plan) => [plan.id, plan]));
    assert.equal(policyActions.length, plans.length);
    assert.equal(new Set(policyActions.map((action) => action.planningEventId)).size, policyActions.length);
    for (const action of policyActions) {
      const plan = plansById.get(action.planningEventId);
      assert.ok(plan, `missing plan ${action.planningEventId}`);
      assert.equal(action.executedStepIndex, 0);
      assert.equal(action.qRevision, plan.qRevision);
      assert.deepEqual(action.operation, plan.selectedCandidate.steps[0].operation);
      assert.equal(action.imaginationEvidence.imagined, true);
      assert.deepEqual(action.imaginationEvidence.operation, action.operation);
      assert.ok(["complete", "paused_random"].includes(action.selectedImaginationStatus));
    }
  });

  check("every random pause discards suffix and replans from new Q", () => {
    const plansById = new Map(plans.map((plan) => [plan.id, plan]));
    const replans = evidence.rounds.flatMap((round) => round.randomReplans);
    assert.equal(replans.length, randomActions.length);
    for (const replan of replans) {
      const prior = plansById.get(replan.oldPlanningEventId);
      assert.ok(prior);
      assert.equal(prior.selectedImaginationStatus, "paused_random");
      assert.deepEqual(replan.discardedOldSuffix, prior.selectedCandidate.steps.slice(1));
      assert.ok(plans.some((plan) => (
        plan.ordinal > prior.ordinal && plan.qRevision >= replan.nextQRevision
      )));
    }
  });

  check("random tape exactly follows public contracts and fresh xorshift32", () => {
    const groups = [];
    for (let index = 0; index < evidence.rounds.length; index += 1) {
      if (index > 0) {
        const transition = evidence.roundTransitions.find((row) => row.targetRound === index + 1);
        assert.ok(transition);
        groups.push({
          round: index + 1,
          ids: transition.ids,
          contract: transition.contract,
          operation: transition.operation,
          reason: transition.before.reason,
        });
      }
      for (const action of evidence.rounds[index].actions) {
        if (action.source === "live_environment_random_provider") {
          const triggeringAction = evidence.rounds[index].actions.find((row) => (
            row.source === "automatic_multicutpoint_controller"
              && row.planningEventId === action.causedByPlanningEventId
          ));
          assert.ok(triggeringAction, `missing public random boundary for ${action.causedByPlanningEventId}`);
          groups.push({
            round: index + 1,
            ids: action.ids,
            contract: action.contract,
            operation: action.operation,
            reason: triggeringAction.response.reason,
          });
        }
      }
    }

    assert.deepEqual(tape, evidence.randomTape);
    assert.equal(tape.algorithm, protocol.random.algorithm);
    assert.equal(tape.initialSeedUnsigned, protocol.random.initialSeedUnsigned);
    assert.equal(tape.drawCount, tape.draws.length);
    let state = protocol.random.initialSeedUnsigned >>> 0;
    let cursor = 0;
    for (const group of groups) {
      assert.deepEqual(group.contract.ids, group.ids);
      assert.deepEqual(Object.keys(group.operation.values), group.ids);
      for (const boundId of group.ids) {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        const value = (state % 6) + 1;
        const draw = tape.draws[cursor];
        assert.equal(draw.ordinal, cursor + 1);
        assert.equal(draw.rawUnsigned, state);
        assert.equal(draw.value, value);
        assert.equal(draw.value, group.operation.values[boundId]);
        assert.equal(draw.boundId, boundId);
        assert.deepEqual(draw.contract, group.contract);
        assert.equal(draw.round, group.round);
        assert.equal(draw.reason, group.reason);
        cursor += 1;
      }
    }
    assert.equal(cursor, tape.drawCount);
    assert.equal(tape.currentStateUnsigned, state);
  });

  check("final checkpoint is the third boundary", () => {
    assert.equal(checkpoint.schema, "ufs_full_game_attention_checkpoint_v2");
    assert.equal(checkpoint.completedRounds.length, 3);
    assert.equal(checkpoint.completedRounds[2].round, 3);
    assert.equal(isWaitingForNextRoundRollBoundary(checkpoint.lastPlayerResponse), true);
    assert.deepEqual(evidence.final, evidence.rounds[2].boundaryAudit.formal);
  });

  check("new arm makes no comparison or advantage claim", () => {
    assert.equal(evidence.claims.advantageEstablished, false);
    assert.match(evidence.claims.reason, /no old-arm result/u);
  });

  const result = {
    schema: "ufs_automatic_vs_original_paired_v4_new_arm_verification_v1",
    status: checks.every((row) => row.pass) ? "PASS" : "FAIL",
    passed: checks.filter((row) => row.pass).length,
    total: checks.length,
    checks,
    counts: {
      rounds: evidence.rounds.length,
      safetyBoundaries: evidence.safetyBoundaryCount,
      planningEvents: plans.length,
      candidatesImagined: plans.reduce((sum, plan) => sum + plan.candidates.length, 0),
      policyActions: policyActions.length,
      randomReplans: randomActions.length,
      randomDraws: tape.drawCount,
      manualIntermediateQ: plans.flatMap((plan) => plan.candidates)
        .filter((candidate) => candidate.manualQPresent).length,
      plannedRandomOperations: plans.flatMap((plan) => plan.candidates)
        .flatMap((candidate) => candidate.candidate.steps)
        .filter((step) => ["submit_random_observation", "submit_round_roll"].includes(step.operation.type)).length,
      liveRejected: liveActions.filter((action) => action.response.status === "rejected").length,
    },
  };
  fs.writeFileSync(path.join(HERE, "verification.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "PASS") process.exitCode = 1;
}

if (require.main === module) run();

module.exports = { run };
