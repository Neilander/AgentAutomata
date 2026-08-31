"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { revalidateNextStep } = require("./sequential-q-rollout");

const HERE = __dirname;
const decision = JSON.parse(fs.readFileSync(
  path.join(HERE, "decisions", "cutpoint-02-post-reroll-sequential.json"),
  "utf8",
));
const view = JSON.parse(fs.readFileSync(
  path.join(HERE, "state", "rolling", "current-player-view.json"),
  "utf8",
));
const whiteDie = view.observation.dice.find((die) => die.id === "r1-white-4" && !die.placed);
const researchCell = view.mapView.baseCells.find((cell) => cell.id === "A-r2-c2");
const anchors = [];
if (whiteDie?.value === 6 && researchCell?.roomId === "A-upper-research") {
  anchors.push({
    id: "research-white-6-c2",
    supportedBy: "current player view exposes unplaced white-6 and callable A-r2-c2",
  });
}
const actualQ = {
  world: {
    ships: view.observation.ships,
    anchors,
  },
  epistemic: {
    source: "observed_after_real_aa_step",
    omittedCollections: view.attention.mode === "probabilistic" && view.attention.omittedCount > 0
      ? ["ships"]
      : [],
  },
};
const nextStep = decision.steps[1];
const result = {
  schema: "ufs_live_step_revalidation_v1",
  decisionId: decision.decisionId,
  completedStep: decision.steps[0].id,
  predictedQ1: decision.steps[0].predictedQAfter,
  actualQ1: actualQ,
  predictedAaTargetObservation: actualQ.world.ships.some((ship) => ship.id === "purple-2")
    ? "supported_by_current_view"
    : "uncertain_due_to_probabilistic_omission",
  nextStep: nextStep.id,
  revalidation: revalidateNextStep({ actualQ, step: nextStep }),
};
fs.mkdirSync(path.join(HERE, "evidence"), { recursive: true });
fs.copyFileSync(
  path.join(HERE, "state", "rolling", "current-player-view.json"),
  path.join(HERE, "evidence", "post-aa-player-view.json"),
);
fs.writeFileSync(
  path.join(HERE, "evidence", "post-aa-revalidation.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
