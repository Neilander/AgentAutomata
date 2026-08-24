"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildPublicScenario } = require("./experiment-fixtures");
const { resolveSelectedAction } = require("./selection-adapter");
const { UfsFirstActionImagination } = require("./ufs-first-action-imagination");

const submissionText = fs.readFileSync(
  path.resolve(__dirname, "../ufs_real_state_candidate_exam_v0/submissions/agent_01.md"),
  "utf8",
);

const results = ["A", "B", "C"].map((scenarioLabel) => {
  const scenario = buildPublicScenario(scenarioLabel);
  const selection = resolveSelectedAction({
    submissionText,
    scenarioLabel,
    publicState: scenario.publicState,
  });
  const result = new UfsFirstActionImagination().run({
    ...scenario,
    selectedAction: selection.action,
  });
  return {
    scenario: scenarioLabel,
    selectedAction: result.selectedAction,
    imaginedMovement: result.imaginedConsequences.movement,
    imaginedRoom: result.imaginedConsequences.room,
    placementRuleGroundings: result.trace.placementRules.groundings.map((row) => ({
      trajectoryId: row.trajectoryId,
      sourceRuleId: row.sourceRuleId,
      generationOrigin: row.generationOrigin,
      currentQ: row.currentQ,
      awakenedFollowingQ: row.awakenedFollowingQ,
      reads: row.reads,
    })),
    placementMatrixActivations: result.trace.placementRules.activations.map((row) => ({
      queryKind: row.queryKind,
      candidates: row.candidates.map((candidate) => ({
        trajectoryId: candidate.trajectoryId,
        activation: candidate.activation,
        matrixKind: candidate.matrixKind,
        observations: candidate.observations,
        support: candidate.support,
      })),
    })),
    stop: { status: result.status, reason: result.reason },
    nextAction: result.nextAction,
  };
});

console.log(JSON.stringify({
  schema: "ufs_first_action_imagination_demo_v0",
  results,
}, null, 2));
