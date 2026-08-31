"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");

const HERE = __dirname;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonl(file) {
  return fs.readFileSync(file, "utf8").trim().split(/\r?\n/u).filter(Boolean).map(JSON.parse);
}

function inspectArm(arm) {
  const stateDir = path.join(HERE, "state", arm);
  const checkpoint = readJson(path.join(stateDir, "full-game-host-checkpoint.json"));
  const session = UfsFullGameAttentionSession.restore(checkpoint);
  const formal = session.inspectHostState().observation;
  const transcript = readJsonl(path.join(stateDir, "machine-transcript.jsonl"));
  const feedbackAudit = readJsonl(path.join(stateDir, "feedback-audit-transcript.jsonl"));
  const shipRows = formal.ships.map((ship) => ({
    id: ship.id,
    column: ship.column,
    row: ship.row,
  })).sort((left, right) => left.id.localeCompare(right.id));
  return {
    arm,
    endBoundary: {
      status: checkpoint.lastPlayerResponse.status,
      reason: checkpoint.lastPlayerResponse.reason,
      pending: checkpoint.lastPlayerResponse.pending.type,
    },
    formalOutcome: {
      energy: formal.energy,
      damage: formal.damage,
      researchIndex: formal.researchIndex,
      excavatorIndex: formal.excavatorIndex,
      mothershipRow: formal.mothershipRow,
      outcome: formal.outcome,
      shipRows,
      maxShipRow: Math.max(...shipRows.map((ship) => ship.row)),
      totalShipRows: shipRows.reduce((sum, ship) => sum + ship.row, 0),
    },
    actionCount: checkpoint.actionHistory.length,
    rejectedOperations: transcript.filter((row) => row.response.status === "rejected").length,
    actionHistory: checkpoint.actionHistory,
    formalTimeline: feedbackAudit.filter((row) => row.audit?.formalStep).map((row) => {
      const step = row.audit.formalStep;
      return {
        step: row.step,
        operation: row.operation,
        after: {
          phase: step.after.phase,
          energy: step.after.energy,
          damage: step.after.damage,
          researchIndex: step.after.researchIndex,
          mothershipRow: step.after.mothershipRow,
          ships: step.after.ships.map((ship) => ({ id: ship.id, column: ship.column, row: ship.row })),
        },
      };
    }),
  };
}

const rolling = inspectArm("rolling");
const staticArm = inspectArm("static");
const result = {
  schema: "ufs_live_ai_multi_cutpoint_round_result_v1",
  comparison: {
    attentionSeed: 2026082504,
    sharedRandomObservation: readJson(path.join(HERE, "random", "paired-reroll-observation.json")),
    treatmentDifference: {
      static: "r1-white-4 -> A-r2-c3 (tunnel), frozen opening plan",
      rolling: "r1-white-4 -> A-r1-c3 (anti-air), live AI revision after public reroll",
    },
    sameResourceOutcome: rolling.formalOutcome.energy === staticArm.formalOutcome.energy
      && rolling.formalOutcome.damage === staticArm.formalOutcome.damage
      && rolling.formalOutcome.researchIndex === staticArm.formalOutcome.researchIndex,
    rollingBenefit: {
      maxShipRowReduction: staticArm.formalOutcome.maxShipRow - rolling.formalOutcome.maxShipRow,
      totalShipRowsReduction: staticArm.formalOutcome.totalShipRows - rolling.formalOutcome.totalShipRows,
    },
    postHocMechanismCheck: {
      intendedAaTarget: "purple-2 in column 2",
      targetPresentAfterResearchPlacement: rolling.formalTimeline
        .find((row) => row.step === 5)?.after.ships.some((ship) => ship.id === "purple-2") ?? null,
      aaPlacementChangedFormalShips: JSON.stringify(rolling.formalTimeline.find((row) => row.step === 5)?.after.ships)
        !== JSON.stringify(rolling.formalTimeline.find((row) => row.step === 6)?.after.ships),
      interpretation: "The intended target was already absent after the preceding research placement, so the later anti-air placement had no formal ship effect.",
    },
  },
  rolling,
  static: staticArm,
  limits: [
    "This is one paired round, not a win-rate estimate.",
    "The AI authored decisions from compact player views; formal checkpoints were inspected only after both branches reached the round boundary.",
    "The random observation was drawn once by the rolling host and replayed unchanged to the static host.",
  ],
};

const output = path.join(HERE, "evidence", "paired-round-result.json");
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
