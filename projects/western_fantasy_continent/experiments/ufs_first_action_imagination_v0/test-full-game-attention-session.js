"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { ROUND_ONE_RANDOM_OBSERVATIONS, ROUND_ONE_SCRIPT } = require("./one-round-fixture");
const { compactAttentionResponse } = require("./compact-attention-response");
const {
  UfsFullGameAttentionSession,
  buildOperationContracts,
  roundAttentionSeed,
} = require("./ufs-full-game-attention-session");

function begin(state = initialPublicState) {
  const session = new UfsFullGameAttentionSession({ publicMap });
  const response = session.start({ initialPublicState: state, attentionSeed: 2026082504 });
  return { session, response };
}

function finishFixtureRound(session) {
  let response = session.lastPlayerResponse;
  for (const placement of ROUND_ONE_SCRIPT.placements) {
    response = session.advance({ type: "place_die", ...placement });
    if (response.status === "random" && response.pending.type === "white_reroll") {
      response = session.advance({
        type: "submit_random_observation",
        values: ROUND_ONE_RANDOM_OBSERVATIONS[`after:${response.pending.afterDieId}`],
      });
    }
  }
  for (const action of ROUND_ONE_SCRIPT.roomActions) response = session.advance(action);
  while (response.status === "choice" && response.pending?.type === "spawn") {
    response = session.advance({
      type: "choose_spawn",
      shipId: response.pending.shipId,
      dropPointId: response.pending.candidates[0],
    });
  }
  return response;
}

test("public operation contracts expose every required research-choice field including zero advance", () => {
  const contracts = buildOperationContracts({
    availableOperations: ["choose_research_advance"],
    pending: {
      type: "room_effect",
      effectKind: "research_room_choice",
      roomId: "A-upper-research",
      maxAdvanceSteps: 0,
    },
  });

  assert.deepEqual(contracts, [{
    schema: "ufs_public_operation_contract_v1",
    type: "choose_research_advance",
    requiredFields: ["type", "roomId", "advanceSteps"],
    fields: {
      type: { kind: "fixed", value: "choose_research_advance" },
      roomId: { kind: "fixed", value: "A-upper-research" },
      advanceSteps: { kind: "integer", minimum: 0, maximum: 0 },
    },
    optionalFields: ["predictions"],
  }]);
});

test("every public operation name has a matching self-describing contract", () => {
  const { response } = begin();
  assert.deepEqual(
    response.operationContracts.map((contract) => contract.type),
    response.availableOperations,
  );
  assert.deepEqual(response.operationContracts[0].requiredFields, ["type", "dieId", "cellId"]);
});

test("a completed round becomes an external next-round roll instead of a terminal game", () => {
  const { session } = begin();
  const response = finishFixtureRound(session);
  assert.equal(response.status, "random");
  assert.equal(response.reason, "waiting_for_next_round_roll");
  assert.equal(response.pending.type, "next_round_roll");
  assert.equal(response.pending.round, 2);
  assert.equal(response.pending.dice.length, 5);
  assert.deepEqual(response.availableOperations, ["submit_round_roll"]);
  assert.equal(response.game.completedRoundCount, 1);
});

test("an external round roll preserves tracks and starts the next cognitive round", () => {
  const { session } = begin();
  const boundary = finishFixtureRound(session);
  const before = session.inspectHostState().observation;
  const values = Object.fromEntries(boundary.pending.dieIds.map((dieId, index) => [dieId, index + 1]));
  const response = session.advance({ type: "submit_round_roll", values });
  const after = session.inspectHostState().observation;

  assert.equal(response.status, "choice");
  assert.equal(response.pending.type, "place_die");
  assert.equal(after.round, 2);
  assert.equal(after.phase, "dice");
  assert.equal(after.energy, before.energy);
  assert.equal(after.damage, before.damage);
  assert.equal(after.researchIndex, before.researchIndex);
  assert.equal(after.excavatorIndex, before.excavatorIndex);
  assert.equal(after.mothershipRow, before.mothershipRow);
  assert.equal(after.nextWhiteId, before.nextWhiteId);
  assert.equal(after.nextRobotId, before.nextRobotId);
  assert.deepEqual(after.placements, []);
  assert.deepEqual(after.dice.map((die) => die.value), [1, 2, 3, 4, 5]);
  assert.equal(response.game.roundAttentionSeed, roundAttentionSeed(2026082504, 2));
  assert.equal(response.actionCount, boundary.actionCount + 1);
  assert.equal(response.roundActionCount, 0);
});

test("invalid next-round dice are atomically rejected and checkpoint restores the boundary", () => {
  const { session } = begin();
  const boundary = finishFixtureRound(session);
  const before = JSON.stringify(session.exportCheckpoint());
  const rejected = session.advance({ type: "submit_round_roll", values: { missing: 6 } });
  assert.equal(rejected.status, "rejected");
  assert.equal(JSON.stringify(session.exportCheckpoint()), before);

  const restored = UfsFullGameAttentionSession.restore(JSON.parse(before));
  assert.equal(restored.lastPlayerResponse.status, "random");
  assert.equal(restored.lastPlayerResponse.pending.type, "next_round_roll");
  assert.equal(restored.lastPlayerResponse.actionCount, boundary.actionCount);
});

test("a real loss remains terminal and does not request another round roll", () => {
  const nearLoss = structuredClone(initialPublicState);
  nearLoss.mothershipRow = publicMap.sky.skullRow - 1;
  const { session } = begin(nearLoss);
  const response = finishFixtureRound(session);
  assert.equal(response.status, "complete");
  assert.equal(response.game.outcome.result, "loss");
  assert.equal(response.game.outcome.reason, "mothership_reached_skull_row");
  assert.deepEqual(response.availableOperations, []);
});

test("the V9 seed queries the omitted mothership row and returns to player choice", () => {
  const session = new UfsFullGameAttentionSession({ publicMap });
  session.start({ initialPublicState, attentionSeed: 2026082509 });
  const response = session.advance({
    type: "place_die",
    dieId: "r1-gray-2",
    cellId: "A-r2-c1",
  });

  assert.equal(response.status, "choice");
  assert.equal(response.reason, "waiting_for_die_placement");
  assert.deepEqual(response.availableOperations, ["place_die"]);
  assert.equal(response.observation.mothershipRow, 0);
  const placementTrace = session.inspectLastCognitiveTrial().trace.placements[0].cognitiveTrace;
  const recovery = placementTrace.landingEvents[0].cognitiveTrace.informationRecovery;
  assert.deepEqual(recovery.resolved[0], {
    slot: "mothership.row",
    value: -1,
    source: "knowledge_directed_lookup",
  });
  assert.equal(recovery.attempts[0].exploration.attempted, false);
});

test("full-game CLI exposes a compact view and stores complete attention evidence privately", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "ufs-full-game-cli-test-"));
  try {
    const result = spawnSync(
      process.execPath,
      [path.resolve(__dirname, "full-game-attention-player-cli.js"), "start", stateDir],
      {
        encoding: "utf8",
        env: { ...process.env, UFS_ATTENTION_SEED: "2026082507" },
      },
    );
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    const publicResponse = JSON.parse(result.stdout);
    assert.equal(publicResponse.attention.detail, "summary");
    assert.equal(publicResponse.attention.seed, 2026082507);
    assert.equal(Object.hasOwn(publicResponse, "noticedItems"), false);
    assert.equal(Object.hasOwn(publicResponse.attention, "traceAfter"), false);

    const auditRecord = JSON.parse(
      fs.readFileSync(path.join(stateDir, "attention-audit-transcript.jsonl"), "utf8").trim(),
    );
    assert.ok(auditRecord.response.noticedItems.length > 0);
    assert.ok(auditRecord.response.attention.traceAfter.length > 0);
    const feedbackRecord = JSON.parse(
      fs.readFileSync(path.join(stateDir, "feedback-audit-transcript.jsonl"), "utf8").trim(),
    );
    assert.equal(feedbackRecord.learningSummary.learnedTrajectories, 0);
    assert.equal(feedbackRecord.learningSummary.reinforcedConnections, 0);
    assert.ok(Buffer.byteLength(result.stdout) < Buffer.byteLength(JSON.stringify(auditRecord.response, null, 2)));
  } finally {
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test("full-game CLI random recovers after an invalid random payload was rejected", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "ufs-full-game-random-recovery-"));
  const payloadFile = path.join(stateDir, "invalid-roll.json");
  const cli = path.resolve(__dirname, "full-game-attention-player-cli.js");
  try {
    const { session } = begin();
    const boundary = finishFixtureRound(session);
    fs.writeFileSync(
      path.join(stateDir, "full-game-host-checkpoint.json"),
      `${JSON.stringify(session.exportCheckpoint(), null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(stateDir, "current-player-view.json"),
      `${JSON.stringify(compactAttentionResponse(boundary), null, 2)}\n`,
    );
    fs.writeFileSync(payloadFile, `${JSON.stringify({
      type: "submit_round_roll",
      values: { missing: 6 },
    })}\n`);

    const rejected = spawnSync(process.execPath, [cli, "advance", stateDir, payloadFile], { encoding: "utf8" });
    assert.equal(rejected.status, 0);
    assert.equal(JSON.parse(rejected.stdout).status, "rejected");

    const recovered = spawnSync(process.execPath, [cli, "random", stateDir], { encoding: "utf8" });
    assert.equal(recovered.status, 0, recovered.stderr);
    const response = JSON.parse(recovered.stdout);
    assert.equal(response.status, "choice");
    assert.equal(response.game.round, 2);
    assert.equal(response.pending.type, "place_die");
  } finally {
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test("full-game CLI accepts prediction tickets and keeps their evaluation private", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "ufs-full-game-prediction-ticket-"));
  const payloadFile = path.join(stateDir, "choice.json");
  const cli = path.resolve(__dirname, "full-game-attention-player-cli.js");
  try {
    const started = spawnSync(process.execPath, [cli, "start", stateDir], {
      encoding: "utf8",
      env: { ...process.env, UFS_ATTENTION_SEED: "2026082814" },
    });
    assert.equal(started.status, 0, started.stderr);
    fs.writeFileSync(payloadFile, `${JSON.stringify({
      type: "place_die",
      dieId: "r1-gray-0",
      cellId: "A-r2-c2",
      predictions: [{
        because: "测试显式预测票据",
        expectations: [{ itemId: "track:energy", change: "unchanged" }],
      }],
    })}\n`);
    const advanced = spawnSync(process.execPath, [cli, "advance", stateDir, payloadFile], { encoding: "utf8" });
    assert.equal(advanced.status, 0, advanced.stderr);
    const publicResponse = JSON.parse(advanced.stdout);
    assert.equal(Object.hasOwn(publicResponse, "tickets"), false);
    const records = fs.readFileSync(path.join(stateDir, "feedback-audit-transcript.jsonl"), "utf8")
      .trim().split(/\r?\n/u).map((line) => JSON.parse(line));
    const ticket = records.at(-1).audit.tickets.find((row) => (
      row.source === "deliberate_action_prediction"
    ));
    assert.ok(ticket);
    assert.equal(ticket.issuedForOperation, "place_die");
  } finally {
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});
