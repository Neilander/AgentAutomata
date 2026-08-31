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
  const feedback = readJsonl(path.join(stateDir, "feedback-audit-transcript.jsonl"));
  const shipRows = formal.ships.map((ship) => ({
    id: ship.id,
    color: ship.color,
    column: ship.column,
    row: ship.row,
  })).sort((left, right) => left.id.localeCompare(right.id));
  const formalTimeline = feedback.filter((row) => row.audit?.formalStep).map((row) => ({
    step: row.step,
    operation: row.operation,
    after: {
      phase: row.audit.formalStep.after.phase,
      energy: row.audit.formalStep.after.energy,
      damage: row.audit.formalStep.after.damage,
      researchIndex: row.audit.formalStep.after.researchIndex,
      mothershipRow: row.audit.formalStep.after.mothershipRow,
      ships: row.audit.formalStep.after.ships.map((ship) => ({
        id: ship.id,
        color: ship.color,
        column: ship.column,
        row: ship.row,
      })),
    },
  }));
  return {
    arm,
    boundary: {
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
      activeShipCount: shipRows.length,
      purpleShipCount: shipRows.filter((ship) => ship.color === "purple").length,
      whiteShipCount: shipRows.filter((ship) => ship.color === "white").length,
    },
    actionCount: checkpoint.actionHistory.length,
    rejectedOperations: transcript.filter((row) => row.response.status === "rejected").length,
    actionHistory: checkpoint.actionHistory,
    formalTimeline,
  };
}

const rolling = inspectArm("rolling");
const staticArm = inspectArm("static");
const beforeAa = rolling.formalTimeline.find((row) => row.step === 4)?.after;
const afterAa = rolling.formalTimeline.find((row) => row.step === 5)?.after;
const revalidation = readJson(path.join(HERE, "evidence", "post-aa-revalidation.json"));
const sequentialDecision = readJson(path.join(
  HERE,
  "decisions",
  "cutpoint-02-post-reroll-sequential.json",
));
const predictedPurple2 = sequentialDecision.steps[0].predictedQAfter.world.ships
  .find((ship) => ship.id === "purple-2");
const formalPurple2AfterAa = afterAa?.ships.find((ship) => ship.id === "purple-2");
const output = {
  schema: "ufs_live_ai_sequential_rollout_round_result_v1",
  comparison: {
    attentionSeed: 2026082504,
    sharedRandomObservation: readJson(path.join(HERE, "random", "paired-reroll-observation.json")),
    treatment: {
      static: ["gray-5 -> research", "white-6 -> tunnel"],
      rolling: ["gray-5 -> AA", "white-6 -> research"],
    },
    sameResourceOutcome: rolling.formalOutcome.energy === staticArm.formalOutcome.energy
      && rolling.formalOutcome.damage === staticArm.formalOutcome.damage
      && rolling.formalOutcome.researchIndex === staticArm.formalOutcome.researchIndex,
    rollingDelta: {
      mothershipRowsAvoided: staticArm.formalOutcome.mothershipRow - rolling.formalOutcome.mothershipRow,
      maxShipRowReduction: staticArm.formalOutcome.maxShipRow - rolling.formalOutcome.maxShipRow,
      totalShipRowsReduction: staticArm.formalOutcome.totalShipRows - rolling.formalOutcome.totalShipRows,
      activeShipCountReduction: staticArm.formalOutcome.activeShipCount - rolling.formalOutcome.activeShipCount,
      whiteShipCountReduction: staticArm.formalOutcome.whiteShipCount - rolling.formalOutcome.whiteShipCount,
    },
    sequentialRepairCheck: {
      aaTargetPresentImmediatelyBeforeAa: beforeAa?.ships.some((ship) => ship.id === "purple-2") ?? null,
      aaChangedFormalShips: JSON.stringify(beforeAa?.ships) !== JSON.stringify(afterAa?.ships),
      predictedAaTargetEndpointMatchedFormal: predictedPurple2?.column === formalPurple2AfterAa?.column
        && predictedPurple2?.row === formalPurple2AfterAa?.row,
      researchAnchorRevalidatedAfterRealAa: revalidation.revalidation.anchor.status,
      researchExecutedOnlyAfterRevalidation: revalidation.revalidation.mayExecute === true,
      staleSnapshotBenefitClaim: false,
    },
  },
  rolling,
  static: staticArm,
  limits: [
    "This is one paired round and does not estimate win rate.",
    "Formal checkpoints were opened only after both branches reached the next-round-roll boundary.",
    "The result contains a mothership benefit and an extra active white ship, so it is a trade-off rather than a scalar win unless a later utility policy resolves it.",
  ],
};

fs.mkdirSync(path.join(HERE, "evidence"), { recursive: true });
fs.writeFileSync(
  path.join(HERE, "evidence", "paired-round-result.json"),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
