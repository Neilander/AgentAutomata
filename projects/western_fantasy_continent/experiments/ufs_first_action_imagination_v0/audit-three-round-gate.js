"use strict";

const fs = require("node:fs");
const path = require("node:path");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { compactAttentionResponse } = require("./compact-attention-response");
const { UfsFullGameAttentionSession } = require("./ufs-full-game-attention-session");

function parseRecords(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`invalid JSON at machine record line ${index + 1}: ${error.message}`);
      }
    });
}

function overlap(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function auditStageRecords({ records, expectedRounds, hostObservation }) {
  const issues = [];
  const rejectionReasons = {};
  if (!Array.isArray(records) || records.length === 0) {
    issues.push("machine record ledger is empty");
  }
  records.forEach((record, index) => {
    const expectedSequence = index + 1;
    if (Number.parseInt(record.sequence, 10) !== expectedSequence) {
      issues.push(`nonsequential ledger entry at index ${index}: ${record.sequence}`);
    }
    if (record.exitCode !== 0) issues.push(`step ${record.sequence} exited with ${record.exitCode}`);
    const response = record.public;
    if (!response || typeof response !== "object") {
      issues.push(`step ${record.sequence} has no public response`);
      return;
    }
    if (response.status === "attention_stop") {
      issues.push(`step ${record.sequence} stopped on attention`);
    }
    if (response.status === "rejected") {
      rejectionReasons[response.reason] = (rejectionReasons[response.reason] || 0) + 1;
    }
    const energy = response.observation?.energy;
    if (Number.isFinite(energy) && energy < 0) {
      issues.push(`step ${record.sequence} exposed negative energy ${energy}`);
    }
    const candidates = response.pending?.candidates;
    if (candidates) {
      const duplicated = overlap(
        candidates.excavationPlacementIds,
        candidates.unaffordableExcavationPlacementIds,
      );
      if (duplicated.length > 0) {
        issues.push(`step ${record.sequence} lists excavation as both affordable and unaffordable: ${duplicated.join(",")}`);
      }
      if (Number.isFinite(energy) && energy < (candidates.excavationEnergyCost ?? 1)
        && (candidates.excavationPlacementIds || []).length > 0) {
        issues.push(`step ${record.sequence} exposes affordable excavation below its energy cost`);
      }
    }
  });

  const first = records[0];
  if (first && first.command !== "start") issues.push("first ledger command is not start");
  const last = records.at(-1)?.public;
  if (last) {
    if (last.status !== "random" || last.reason !== "waiting_for_next_round_roll") {
      issues.push(`last response is not a safe next-round boundary: ${last.status}/${last.reason}`);
    }
    if (last.pending?.type !== "next_round_roll") issues.push("last pending type is not next_round_roll");
    if (last.game?.completedRoundCount !== expectedRounds) {
      issues.push(`public completedRoundCount is ${last.game?.completedRoundCount}, expected ${expectedRounds}`);
    }
    if (!last.availableOperations?.includes("submit_round_roll")) {
      issues.push("safe boundary does not expose submit_round_roll");
    }
  }

  if (!hostObservation || typeof hostObservation !== "object") {
    issues.push("restored host observation is missing");
  } else {
    if (!Number.isFinite(hostObservation.energy) || hostObservation.energy < 0) {
      issues.push(`restored host energy violates nonnegative invariant: ${hostObservation.energy}`);
    }
    if (hostObservation.phase !== "new_round") {
      issues.push(`restored host phase is ${hostObservation.phase}, expected new_round`);
    }
    if (hostObservation.round !== expectedRounds) {
      issues.push(`restored host round is ${hostObservation.round}, expected ${expectedRounds}`);
    }
    if (hostObservation.outcome) issues.push("restored host is terminal at the audit gate");
  }

  return {
    schema: "ufs_three_round_gate_audit_v0",
    expectedRounds,
    recordCount: records.length,
    stageGatePassed: issues.length === 0,
    rejectionReasons,
    issues,
    lastPublic: last ? {
      status: last.status,
      reason: last.reason,
      completedRoundCount: last.game?.completedRoundCount,
      nextRound: last.pending?.round,
    } : null,
    restoredHost: hostObservation ? {
      round: hostObservation.round,
      phase: hostObservation.phase,
      energy: hostObservation.energy,
      damage: hostObservation.damage,
      researchIndex: hostObservation.researchIndex,
      excavatorIndex: hostObservation.excavatorIndex,
      mothershipRow: hostObservation.mothershipRow,
      outcome: hostObservation.outcome,
    } : null,
  };
}

function replayPublicRecords(records, attentionSeed) {
  const session = new UfsFullGameAttentionSession({ publicMap });
  let response = session.start({ initialPublicState, attentionSeed: Number(attentionSeed) });
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (index > 0) {
      const operation = record.public?.lastAction;
      if (!operation?.type) throw new Error(`record ${record.sequence} has no replayable public lastAction`);
      response = session.advance(operation);
    }
    const compact = compactAttentionResponse(response);
    if (JSON.stringify(compact) !== JSON.stringify(record.public)) {
      throw new Error(`public replay diverged at record ${record.sequence}`);
    }
  }
  const restored = UfsFullGameAttentionSession.restore(
    JSON.parse(JSON.stringify(session.exportCheckpoint())),
  );
  return restored.inspectHostState().observation;
}

function auditStageDirectory(experimentDirectory, expectedRounds = 3, throughSequence = null) {
  const absolute = path.resolve(experimentDirectory);
  const allRecords = parseRecords(path.join(absolute, "machine-records.ndjson"));
  const records = throughSequence == null
    ? allRecords
    : allRecords.filter((record) => Number.parseInt(record.sequence, 10) <= throughSequence);
  if (throughSequence != null) {
    if (records.length !== throughSequence) {
      const result = auditStageRecords({ records, expectedRounds, hostObservation: null });
      result.issues.push(`cannot form a complete replay prefix through sequence ${throughSequence}`);
      result.stageGatePassed = false;
      return result;
    }
    const hostObservation = replayPublicRecords(records, records[0]?.attentionSeed);
    const result = auditStageRecords({ records, expectedRounds, hostObservation });
    result.checkpointAudit = "replayed_public_prefix_and_restored_in_memory";
    result.auditedThroughSequence = throughSequence;
    return result;
  }
  const stateDirectories = fs.readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("state_attempt_"));
  if (stateDirectories.length !== 1) {
    const result = auditStageRecords({ records, expectedRounds, hostObservation: null });
    result.issues.push(`expected exactly one state_attempt directory, found ${stateDirectories.length}`);
    result.stageGatePassed = false;
    return result;
  }
  const checkpointPath = path.join(
    absolute,
    stateDirectories[0].name,
    "full-game-host-checkpoint.json",
  );
  const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
  const restored = UfsFullGameAttentionSession.restore(checkpoint);
  const hostObservation = restored.inspectHostState().observation;
  return auditStageRecords({ records, expectedRounds, hostObservation });
}

if (require.main === module) {
  const experimentDirectory = process.argv[2];
  const expectedRounds = Number.parseInt(process.argv[3] || "3", 10);
  const throughSequence = process.argv[4] == null
    ? null
    : Number.parseInt(process.argv[4], 10);
  if (!experimentDirectory || !Number.isInteger(expectedRounds) || expectedRounds < 1) {
    console.error("usage: node audit-three-round-gate.js <experiment-directory> [expected-rounds] [through-sequence]");
    process.exitCode = 2;
  } else if (throughSequence != null && (!Number.isInteger(throughSequence) || throughSequence < 1)) {
    console.error("through-sequence must be a positive integer");
    process.exitCode = 2;
  } else {
    try {
      const result = auditStageDirectory(experimentDirectory, expectedRounds, throughSequence);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (!result.stageGatePassed) process.exitCode = 1;
    } catch (error) {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    }
  }
}

module.exports = {
  auditStageDirectory,
  auditStageRecords,
  replayPublicRecords,
};
