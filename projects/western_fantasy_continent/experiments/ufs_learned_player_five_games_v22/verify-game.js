"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const { validatePlayerProfile } = require("../ufs_first_action_imagination_v0/ufs-player-generator");
const { valueFor } = require("./materialize-random-observation");
const { pathsFor, readRecords, sha256 } = require("./record-game-step");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonLines(file) {
  const raw = fs.readFileSync(file, "utf8").trim();
  return raw ? raw.split(/\r?\n/u).map(JSON.parse) : [];
}

function dispositionCounts(ledger) {
  const counts = { confirmed: 0, contradicted: 0, unresolved: 0, ambiguous: 0 };
  for (const entry of ledger) {
    if (Object.hasOwn(counts, entry.status)) counts[entry.status] += 1;
  }
  return counts;
}

function diffCounts(after, before) {
  return Object.fromEntries(Object.keys(after).map((key) => [key, after[key] - (before[key] ?? 0)]));
}

function transitionEvents(records, feedbackAudit) {
  const result = {
    zeroEnergyEntries: new Set(),
    minimumEnergy: Infinity,
    incompleteEnergyPlacementMoments: new Set(),
    incompleteEnergyRoomExposures: new Set(),
    researchRollbacks: new Set(),
    mothershipDangerEndRooms: new Set(),
  };
  const knownRooms = new Map();
  const knownCells = new Map();
  for (const record of records) {
    for (const room of record.public?.mapView?.rooms ?? []) knownRooms.set(room.id, room);
    for (const cell of record.public?.mapView?.baseCells ?? []) knownCells.set(cell.id, cell);
  }
  const placedEnergyCounts = new Map();
  for (const record of records) {
    const view = record.public;
    const observation = view?.observation ?? {};
    if (record.command === "advance" && view?.status !== "rejected"
      && view?.lastAction?.type === "place_die") {
      const cell = knownCells.get(view.lastAction.cellId);
      const room = cell ? knownRooms.get(cell.roomId) : null;
      if (room?.type === "energy" && room.cellIds.length > 1) {
        const key = `${view.game?.round}:${room.id}`;
        const count = (placedEnergyCounts.get(key) ?? 0) + 1;
        placedEnergyCounts.set(key, count);
        if (count < room.cellIds.length) result.incompleteEnergyPlacementMoments.add(`${key}:${count}`);
      }
    }
    const rooms = new Map((view?.mapView?.rooms ?? []).map((room) => [room.id, room]));
    const placementsByRoom = new Map();
    for (const placement of observation.placements ?? []) {
      if (!placement.resolved) {
        placementsByRoom.set(placement.roomId, (placementsByRoom.get(placement.roomId) ?? 0) + 1);
      }
    }
    for (const [roomId, count] of placementsByRoom) {
      const room = rooms.get(roomId);
      if (room?.type === "energy" && count > 0 && count < room.cellIds.length
        && !(view.pending?.candidates?.resolvableRoomIds ?? []).includes(roomId)) {
        result.incompleteEnergyRoomExposures.add(`${view.game?.round}:${roomId}`);
      }
    }
  }
  for (const entry of feedbackAudit) {
    const formal = entry.audit?.formalStep;
    if (!formal?.before || !formal?.after) continue;
    result.minimumEnergy = Math.min(result.minimumEnergy, formal.before.energy, formal.after.energy);
    const transitionKey = `${entry.round}:${formal.before.phase}:${formal.before.energy}:${formal.before.researchIndex}:${formal.before.mothershipRow}->${formal.after.phase}:${formal.after.energy}:${formal.after.researchIndex}:${formal.after.mothershipRow}`;
    if (formal.before.energy > 0 && formal.after.energy === 0) result.zeroEnergyEntries.add(transitionKey);
    if (entry.operation?.type === "end_rooms"
      && formal.before.researchIndex > formal.after.researchIndex) result.researchRollbacks.add(transitionKey);
    if (entry.operation?.type === "end_rooms" && formal.before.mothershipRow >= 6) {
      result.mothershipDangerEndRooms.add(transitionKey);
    }
  }
  return {
    zeroEnergyEntries: result.zeroEnergyEntries.size,
    minimumEnergy: Number.isFinite(result.minimumEnergy) ? result.minimumEnergy : null,
    incompleteEnergyPlacementMoments: result.incompleteEnergyPlacementMoments.size,
    incompleteEnergyRoomExposures: result.incompleteEnergyRoomExposures.size,
    researchRollbacks: result.researchRollbacks.size,
    mothershipDangerEndRooms: result.mothershipDangerEndRooms.size,
  };
}

function verify(game, mode = "pre-capture") {
  assert.match(mode, /^(pre|post)-capture$/u);
  const paths = pathsFor(game);
  const records = readRecords(paths.ledger);
  assert.ok(records.length > 1, "game needs more than its initial player-start record");
  assert.equal(records[0].command, "player-start");
  const tape = readJson(path.join(paths.root, "random-tape.json"));
  const inputProfile = readJson(paths.inputProfile);
  const baseProfile = readJson(path.join(paths.stateDir, "player-profile-base.json"));
  const decisionLog = fs.readFileSync(paths.decisions, "utf8");
  assert.equal((decisionLog.match(/^## Step \d{4} - /gmu) ?? []).length, records.length,
    "every record needs one pre-operation decision entry");
  assert.equal(inputProfile.playerId, "ufs-v20-fresh-player");
  assert.equal(inputProfile.progress.revision, game);
  assert.equal(inputProfile.progress.episodesCaptured, game);
  assert.deepEqual(baseProfile, validatePlayerProfile(inputProfile));

  let deliberate = 0;
  let predictionActions = 0;
  let rejected = 0;
  const operationCounts = {};
  const randomOccurrences = new Map();
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    assert.equal(record.game, game);
    assert.equal(record.sequence, String(index + 1).padStart(4, "0"));
    assert.equal(record.exitCode, 0, `nonzero CLI exit at ${record.sequence}`);
    assert.ok(record.public, `missing public JSON at ${record.sequence}`);
    assert.equal(fs.existsSync(path.join(paths.root, record.stdoutFile)), true,
      `missing stdout evidence at ${record.sequence}`);
    assert.equal(fs.existsSync(path.join(paths.root, record.stderrFile)), true,
      `missing stderr evidence at ${record.sequence}`);
    assert.equal(record.public.game?.playerId, "ufs-v20-fresh-player");
    assert.equal(record.public.game?.playerProfileRevision, game);
    if (record.public.status === "rejected") rejected += 1;
    if (index === 0) continue;
    const previous = records[index - 1].public;
    const payload = readJson(path.join(paths.root, record.payloadFile));
    assert.ok(previous.availableOperations.includes(payload.type),
      `${payload.type} was not public before ${record.sequence}`);
    operationCounts[payload.type] = (operationCounts[payload.type] ?? 0) + 1;
    if (record.command === "advance") {
      deliberate += 1;
      assert.ok(Array.isArray(payload.predictions) && payload.predictions.length >= 1
        && payload.predictions.length <= 3, `prediction coverage failure at ${record.sequence}`);
      predictionActions += 1;
    } else {
      assert.equal(record.command, "random");
      const pendingType = record.randomMeta.pendingType;
      const occurrence = (randomOccurrences.get(pendingType) ?? 0) + 1;
      randomOccurrences.set(pendingType, occurrence);
      assert.equal(record.randomMeta.occurrence, occurrence);
      const dieIds = [...previous.pending.dieIds].sort();
      assert.deepEqual(record.randomMeta.dieIds, dieIds);
      assert.deepEqual(Object.keys(payload.values).sort(), dieIds);
      for (let ordinal = 0; ordinal < dieIds.length; ordinal += 1) {
        assert.equal(payload.values[dieIds[ordinal]],
          valueFor(tape.seed, pendingType, occurrence, ordinal + 1));
      }
    }
  }
  assert.equal(predictionActions, deliberate);
  const final = records.at(-1).public;
  assert.equal(final.status, "complete");
  assert.ok(["win", "loss"].includes(final.observation?.outcome?.result));
  assert.equal(records.slice(0, -1).some((record) => record.public.status === "complete"), false);
  assert.deepEqual(readJson(path.join(paths.stateDir, "current-player-view.json")), final);

  const machineTranscript = readJsonLines(path.join(paths.stateDir, "machine-transcript.jsonl"));
  const attentionAudit = readJsonLines(path.join(paths.stateDir, "attention-audit-transcript.jsonl"));
  const feedbackAudit = readJsonLines(path.join(paths.stateDir, "feedback-audit-transcript.jsonl"));
  assert.equal(machineTranscript.length, records.length);
  assert.equal(attentionAudit.length, records.length);
  assert.equal(feedbackAudit.length, records.length);

  const checkpoint = readJson(path.join(paths.stateDir, "full-game-host-checkpoint.json"));
  const restored = UfsFullGameAttentionSession.restore(checkpoint);
  const host = restored.inspectHostState().observation;
  assert.deepEqual(host.outcome, final.observation.outcome);
  for (const field of ["energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow"]) {
    if (final.observation[field] !== undefined) assert.equal(host[field], final.observation[field]);
  }
  assert.equal(restored.feedbackBridge.pendingPredictionTickets.length, 0);
  const identity = restored.inspectPlayerIdentity();
  assert.equal(identity.baseProfileRevision, game);
  assert.equal(identity.episodeId, `ufs-v20-fresh-player-episode-${String(game + 1).padStart(4, "0")}`);

  const inputLearning = inputProfile.cognition.feedbackLearningState;
  const inputLedger = inputProfile.cognition.predictionLedger;
  const finalFeedback = restored.inspectFeedbackState();
  const finalLearning = finalFeedback.learning;
  const finalLedger = finalFeedback.predictionLedger;
  const inputDispositions = dispositionCounts(inputLedger);
  const finalDispositions = dispositionCounts(finalLedger);
  const feedbackTickets = feedbackAudit.flatMap((entry) => entry.audit?.tickets ?? [])
    .filter((ticket) => ticket.source === "awakened_five_slot_trajectory"
      && String(ticket.trajectoryId).startsWith("feedback-"));
  const feedbackActivationKeys = new Set(feedbackTickets.map((ticket) =>
    `${ticket.ticketId}|${ticket.trajectoryId}`));
  const feedbackIds = [...new Set(feedbackTickets.map((ticket) => ticket.trajectoryId))].sort();
  const transitions = transitionEvents(records, feedbackAudit);

  const receiptFile = path.join(paths.stateDir, "player-capture-receipt.json");
  const captureRecordFile = path.join(paths.recordDir, "capture-record.json");
  if (mode === "pre-capture") {
    assert.equal(fs.existsSync(receiptFile), false, "capture already exists before pre-capture audit");
    assert.equal(fs.existsSync(paths.outputProfile), false, "output profile already exists before capture");
  } else {
    assert.equal(fs.existsSync(receiptFile), true, "missing capture receipt");
    assert.equal(fs.existsSync(captureRecordFile), true, "missing capture record");
    const outputProfile = readJson(paths.outputProfile);
    const receipt = readJson(receiptFile);
    assert.equal(receipt.fromRevision, game);
    assert.equal(receipt.toRevision, game + 1);
    assert.equal(outputProfile.progress.revision, game + 1);
    assert.equal(outputProfile.progress.episodesCaptured, game + 1);
    assert.equal(outputProfile.episodeHistory.length, game + 1);
    assert.equal(outputProfile.episodeHistory.at(-1).episodeId, identity.episodeId);
    assert.equal(JSON.stringify(outputProfile).includes("formalFeedbackOracle"), false);
    assert.equal(JSON.stringify(outputProfile).includes("full-game-host-checkpoint"), false);
  }

  const output = {
    schema: "ufs_v22_game_audit_v1",
    passed: true,
    mode,
    game,
    player: {
      playerId: identity.playerId,
      inputRevision: game,
      episodeId: identity.episodeId,
      attentionSeed: final.game.attentionSeed,
      inputProfileSha256: sha256(paths.inputProfile),
      normalizedStateBaseProfileSha256: sha256(path.join(paths.stateDir, "player-profile-base.json")),
    },
    outcome: {
      ...host.outcome,
      terminalRound: host.outcome.round,
      damage: host.damage,
      energy: host.energy,
      researchIndex: host.researchIndex,
      excavatorIndex: host.excavatorIndex,
      mothershipRow: host.mothershipRow,
    },
    operations: {
      records: records.length,
      actionCount: final.actionCount,
      deliberate,
      random: records.filter((record) => record.command === "random").length,
      rejected,
      invalid: rejected,
      operationCounts,
      explicitPredictionActions: predictionActions,
      predictionCoverage: deliberate ? predictionActions / deliberate : 0,
    },
    predictionDispositionDelta: diffCounts(finalDispositions, inputDispositions),
    learning: {
      inputTrajectories: inputLearning.trajectories.length,
      finalTrajectories: finalLearning.trajectories.length,
      newTrajectories: finalLearning.trajectories.length - inputLearning.trajectories.length,
      inputConnections: inputLearning.connectionUpdates.length,
      finalConnections: finalLearning.connectionUpdates.length,
      newConnections: finalLearning.connectionUpdates.length - inputLearning.connectionUpdates.length,
      inputAttentionAdjustments: inputLearning.attentionAdjustments.length,
      finalAttentionAdjustments: finalLearning.attentionAdjustments.length,
      newAttentionAdjustments: finalLearning.attentionAdjustments.length - inputLearning.attentionAdjustments.length,
      quarantinedFeedbackDelta: finalLearning.quarantinedFeedback.length - inputLearning.quarantinedFeedback.length,
      inputLedger: inputLedger.length,
      finalLedger: finalLedger.length,
      newLedger: finalLedger.length - inputLedger.length,
      pendingTickets: restored.feedbackBridge.pendingPredictionTickets.length,
    },
    feedbackActivation: {
      actualTicketActivations: feedbackActivationKeys.size,
      uniqueTrajectoryIds: feedbackIds,
      publicDecisionMentions: records.reduce((count, record) =>
        count + ((JSON.stringify(record.public).match(/feedback-[A-Za-z0-9._:-]+/gu) ?? []).length), 0),
    },
    hazards: transitions,
    evidence: {
      machineTranscriptRecords: machineTranscript.length,
      attentionAuditRecords: attentionAudit.length,
      feedbackAuditRecords: feedbackAudit.length,
      randomStreams: Object.fromEntries(randomOccurrences),
      captureReceiptCount: fs.existsSync(receiptFile) ? 1 : 0,
    },
  };
  const auditDir = path.join(paths.recordDir, "audit");
  fs.mkdirSync(auditDir, { recursive: true });
  fs.writeFileSync(path.join(auditDir, `${mode}.json`), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  return output;
}

if (require.main === module) {
  const [gameRaw, mode = "pre-capture"] = process.argv.slice(2);
  if (!/^[1-5]$/u.test(gameRaw ?? "")) throw new Error("Usage: node verify-game.js <game 1..5> [pre-capture|post-capture]");
  process.stdout.write(`${JSON.stringify(verify(Number(gameRaw), mode), null, 2)}\n`);
}

module.exports = { verify };
