"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..");
const CORE = path.resolve(ROOT, "../ufs_first_action_imagination_v0");
const V2 = path.resolve(ROOT, "../ufs_live_ai_automatic_multicutpoint_three_round_v2");
const OUT = path.join(__dirname, "evidence");
const protocol = require(path.join(ROOT, "PAIR_PROTOCOL.json"));
const initialPublicState = require(path.join(CORE, "public_initial_state.json"));
const publicMap = require(path.join(CORE, "public-map"));
const { UfsFullGameAttentionSession } = require(path.join(CORE, "ufs-full-game-attention-session"));
const { candidatePreference, generateCandidates, macroIntent } = require(path.join(V2, "automatic-multicutpoint-controller"));
const { gateForRound, plannedInputContainsManualQ } = require(path.join(V2, "run-experiment"));

const EXPECTED_PROTOCOL_HASH = "5b84f209dd3704044bbbdf326d9ad35f2a70ecdf4e5a45b287d6b2b258f4a8eb";
const EXPECTED_CONTROLLER_HASH = protocol.arms.new.controllerSha256;

function clone(value) {
  return structuredClone(value);
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function assertFrozenInputs() {
  const actual = {
    protocol: sha256(path.join(ROOT, "PAIR_PROTOCOL.json")),
    publicInitialState: sha256(path.join(CORE, "public_initial_state.json")),
    publicMap: sha256(path.join(CORE, "public-map.js")),
    controller: sha256(path.join(V2, "automatic-multicutpoint-controller.js")),
  };
  assert.equal(actual.protocol, EXPECTED_PROTOCOL_HASH, "PAIR_PROTOCOL.json changed after freeze");
  assert.equal(actual.publicInitialState, protocol.assets.publicInitialState.sha256);
  assert.equal(actual.publicMap, protocol.assets.publicMap.sha256);
  assert.equal(actual.controller, EXPECTED_CONTROLLER_HASH);
  return actual;
}

function createTapedRandomProvider(seed) {
  let state = seed >>> 0;
  const tape = [];
  return {
    values(ids, context) {
      const values = {};
      for (const id of ids) {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        const value = (state % 6) + 1;
        tape.push({
          ordinal: tape.length + 1,
          id,
          value,
          stateAfter: state,
          contractType: context.contractType,
          round: context.round,
          publicReason: context.publicReason,
        });
        values[id] = value;
      }
      return values;
    },
    snapshot() {
      return {
        algorithm: "xorshift32",
        initialSeedHex: protocol.random.initialSeedHex,
        initialSeedUnsigned: seed >>> 0,
        currentState: state,
        drawCount: tape.length,
        draws: clone(tape),
      };
    },
  };
}

function randomOperation(response, provider, round) {
  if (response.availableOperations?.includes("submit_random_observation")) {
    const ids = clone(response.pending?.dieIds || []);
    return {
      source: "live_environment_random_provider",
      ids,
      operation: {
        type: "submit_random_observation",
        values: provider.values(ids, {
          contractType: "submit_random_observation",
          round,
          publicReason: response.reason,
        }),
      },
    };
  }
  if (response.availableOperations?.includes("submit_round_roll")) {
    const ids = clone(response.pending?.dice?.map((die) => die.id) || []);
    return {
      source: "live_environment_random_provider",
      ids,
      operation: {
        type: "submit_round_roll",
        values: provider.values(ids, {
          contractType: "submit_round_roll",
          round,
          publicReason: response.reason,
        }),
      },
    };
  }
  return null;
}

function summarizeResponse(response) {
  return {
    status: response.status,
    reason: response.reason,
    pending: clone(response.pending || null),
    availableOperations: clone(response.availableOperations || []),
    game: clone(response.game || null),
    observation: {
      phase: response.observation?.phase ?? null,
      energy: response.observation?.energy ?? null,
      damage: response.observation?.damage ?? null,
      researchIndex: response.observation?.researchIndex ?? null,
      excavatorIndex: response.observation?.excavatorIndex ?? null,
      mothershipRow: response.observation?.mothershipRow ?? null,
      dice: clone(response.observation?.dice || []),
      ships: clone(response.observation?.ships || []),
      waitingShips: clone(response.observation?.waitingShips || []),
      placements: clone(response.observation?.placements || []),
    },
  };
}

function summarizeFormal(world) {
  const rows = (world.ships || []).map((ship) => ship.row);
  return {
    round: world.round,
    phase: world.phase,
    energy: world.energy,
    damage: world.damage,
    researchIndex: world.researchIndex,
    excavatorIndex: world.excavatorIndex,
    mothershipRow: world.mothershipRow,
    outcome: clone(world.outcome),
    activeShipCount: world.ships?.length || 0,
    waitingShipCount: world.waitingShips?.length || 0,
    maxShipRow: rows.length ? Math.max(...rows) : null,
    totalShipRows: rows.reduce((sum, row) => sum + row, 0),
    ships: clone(world.ships || []),
  };
}

function compareBoundary(mental, formal) {
  const scalarFields = ["round", "phase", "energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow"];
  const scalarDifferences = scalarFields.filter((field) => mental?.[field] !== formal?.[field])
    .map((field) => ({ field, predicted: mental?.[field], formal: formal?.[field] }));
  const collectionDifferences = ["ships", "waitingShips", "placements", "robots"].filter((field) => (
    JSON.stringify(mental?.[field] || []) !== JSON.stringify(formal?.[field] || [])
  ));
  return { scalarDifferences, collectionDifferences };
}

function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const frozenHashes = assertFrozenInputs();
  const provider = createTapedRandomProvider(protocol.random.initialSeedUnsigned);
  const session = new UfsFullGameAttentionSession({ publicMap });
  let response = session.start({ initialPublicState, attentionSeed: protocol.attentionSeed });
  let globalPlanningOrdinal = 0;
  let qRevision = 0;
  let lastPausedPlanningEvent = null;
  const evidence = {
    schema: "ufs_automatic_vs_original_paired_v3_new_arm",
    arm: "new",
    protocolHash: frozenHashes.protocol,
    controllerHash: frozenHashes.controller,
    frozenHashes,
    attentionSeed: protocol.attentionSeed,
    planner: "V2 automatic-multicutpoint-controller + imagineSequentialPlan",
    invariants: {
      intermediateQ: "generated only by imagineSequentialPlan cognitive fork",
      randomInsidePlanning: false,
      formalAccess: "only after reaching waiting_for_next_round_roll; audit never enters controller input",
      controllerChangedAfterStart: false,
    },
    roundTransitions: [],
    rounds: [],
    stopped: null,
  };

  for (let targetRound = 1; targetRound <= protocol.roundsToComplete; targetRound += 1) {
    if (targetRound > 1) {
      const transition = randomOperation(response, provider, targetRound);
      assert.equal(transition?.operation.type, "submit_round_roll");
      const before = summarizeResponse(response);
      response = session.advance(transition.operation);
      assert.notEqual(response.status, "rejected");
      qRevision += 1;
      evidence.roundTransitions.push({
        targetRound,
        ids: transition.ids,
        operation: transition.operation,
        before,
        after: summarizeResponse(response),
        qRevision,
      });
    }

    const intent = macroIntent(response);
    const roundRecord = {
      round: targetRound,
      macroIntent: intent,
      startResponse: summarizeResponse(response),
      planningEvents: [],
      actions: [],
      randomReplans: [],
      boundaryAudit: null,
      gate: null,
    };
    evidence.rounds.push(roundRecord);

    let safety = 0;
    while (!(response.status === "random" && response.reason === "waiting_for_next_round_roll")) {
      safety += 1;
      if (safety > 80) throw new Error(`round ${targetRound} exceeded 80 live operations`);

      const external = randomOperation(response, provider, targetRound);
      if (external) {
        if (external.operation.type === "submit_round_roll") break;
        const randomAction = {
          ordinal: roundRecord.actions.length + 1,
          source: external.source,
          ids: external.ids,
          operation: clone(external.operation),
          causedByPlanningEventId: lastPausedPlanningEvent?.id || null,
          planningOrdinal: lastPausedPlanningEvent?.ordinal || null,
          qRevision,
        };
        response = session.advance(external.operation);
        randomAction.response = summarizeResponse(response);
        roundRecord.actions.push(randomAction);
        qRevision += 1;
        roundRecord.randomReplans.push({
          randomOperationOrdinal: randomAction.ordinal,
          preservedMacroIntentId: intent.id,
          discardedOldSuffix: clone(lastPausedPlanningEvent?.selectedCandidate?.steps?.slice(1) || []),
          oldPlanningEventId: lastPausedPlanningEvent?.id || null,
          oldQRevision: lastPausedPlanningEvent?.qRevision ?? null,
          nextQRevision: qRevision,
        });
        lastPausedPlanningEvent = null;
        continue;
      }

      const knownOccupiedColumns = roundRecord.actions
        .filter((row) => row.operation.type === "place_die")
        .map((row) => Number(String(row.operation.cellId).match(/-c(\d+)$/u)?.[1] || 1) - 1);
      const candidates = generateCandidates(response, intent, { knownOccupiedColumns });
      if (candidates.length === 0) throw new Error(`no candidates in round ${targetRound}: ${response.reason}`);
      globalPlanningOrdinal += 1;
      const planningEvent = {
        id: `r${targetRound}-plan-${String(roundRecord.planningEvents.length + 1).padStart(2, "0")}`,
        ordinal: globalPlanningOrdinal,
        qRevision,
        macroIntentId: intent.id,
        cutpoint: response.reason,
        q: summarizeResponse(response),
        candidates: [],
        selectedCandidateId: null,
        selectedCandidate: null,
        selectedImaginationStatus: null,
        selectedImagination: null,
      };
      for (const candidate of candidates) {
        const imagination = session.imagineSequentialPlan({ steps: candidate.steps });
        planningEvent.candidates.push({
          candidate: clone(candidate),
          manualQPresent: plannedInputContainsManualQ(candidate),
          imagination,
          preference: candidatePreference(candidate, imagination, response, intent),
        });
      }
      const selected = [...planningEvent.candidates]
        .sort((left, right) => right.preference - left.preference)[0];
      if (!selected || !Number.isFinite(selected.preference)) {
        throw new Error(`no executable imagined candidate: ${planningEvent.candidates.map((row) => `${row.candidate.id}:${row.imagination.status}`).join(",")}`);
      }
      Object.assign(planningEvent, {
        selectedCandidateId: selected.candidate.id,
        selectedCandidate: clone(selected.candidate),
        selectedImaginationStatus: selected.imagination.status,
        selectedImagination: clone(selected.imagination),
      });
      roundRecord.planningEvents.push(planningEvent);

      const operation = clone(selected.candidate.steps[0].operation);
      const trace = selected.imagination.trace[0];
      const action = {
        ordinal: roundRecord.actions.length + 1,
        source: "automatic_multicutpoint_controller",
        planningEventId: planningEvent.id,
        planningOrdinal: planningEvent.ordinal,
        qRevision,
        selectedImaginationStatus: selected.imagination.status,
        executedStepIndex: 0,
        operation,
        imaginationEvidence: {
          imagined: trace.imagined,
          operation: clone(trace.operation),
          anchor: clone(trace.anchor),
          qBefore: clone(trace.qBefore),
          qAfter: clone(trace.qAfter || null),
          automaticTrajectoryIds: clone(trace.automaticTrajectoryIds || []),
        },
      };
      response = session.advance(operation);
      action.response = summarizeResponse(response);
      roundRecord.actions.push(action);
      qRevision += 1;
      if (response.status === "rejected") break;
      if (selected.imagination.status === "paused_random") lastPausedPlanningEvent = planningEvent;
    }

    assert.equal(response.reason, "waiting_for_next_round_roll", "formal audit attempted outside safe boundary");
    const mental = session.inspectMentalState().observation;
    const formal = session.inspectHostState().observation;
    roundRecord.boundaryAudit = {
      inspectedAtSafeBoundary: true,
      mental: summarizeFormal(mental),
      formal: summarizeFormal(formal),
      difference: compareBoundary(mental, formal),
    };
    roundRecord.endResponse = summarizeResponse(response);
    roundRecord.gate = gateForRound(roundRecord, response);
    if (!roundRecord.gate.pass) {
      evidence.stopped = { afterRound: targetRound, reason: "round_gate_failed" };
      break;
    }
  }

  evidence.randomTape = provider.snapshot();
  evidence.threeRoundRunCompleted = evidence.rounds.length === protocol.roundsToComplete
    && evidence.rounds.every((round) => round.gate.pass)
    && evidence.rounds.at(-1).endResponse.reason === "waiting_for_next_round_roll";
  evidence.final = evidence.rounds.at(-1)?.boundaryAudit?.formal || null;
  evidence.claims = {
    armIntegrityEstablished: evidence.threeRoundRunCompleted,
    advantageEstablished: false,
    reason: "This is the sealed new arm only. No comparison is made before the independently sealed old arm exists.",
  };

  const checkpoint = session.exportCheckpoint();
  fs.writeFileSync(path.join(OUT, "machine-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(OUT, "random-draw-tape.json"), `${JSON.stringify(evidence.randomTape, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(OUT, "final-checkpoint.json"), `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    status: evidence.threeRoundRunCompleted ? "PASS" : "FAIL",
    protocolHash: evidence.protocolHash,
    controllerHash: evidence.controllerHash,
    drawCount: evidence.randomTape.drawCount,
    rounds: evidence.rounds.map((round) => ({
      round: round.round,
      gate: round.gate.pass,
      planningEvents: round.gate.counts.planningEvents,
      candidatesImagined: round.gate.counts.candidatesImagined,
      randomReplans: round.randomReplans.length,
      formal: round.boundaryAudit.formal,
    })),
  }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { assertFrozenInputs, createTapedRandomProvider, run };
