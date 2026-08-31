"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { runSequentialRollout } = require("./sequential-q-rollout");

const decisionFile = path.join(__dirname, "decisions", "cutpoint-02-post-reroll-sequential.json");
const decision = JSON.parse(fs.readFileSync(decisionFile, "utf8"));
const result = runSequentialRollout({
  initialQ: decision.q0,
  steps: decision.steps,
  imagineStep: ({ step }) => ({
    qAfter: step.predictedQAfter,
    evidence: step.imaginationEvidence,
  }),
});
const output = {
  decisionId: decision.decisionId,
  result,
  staleSnapshotPrevented: result.trace.length === 2
    && result.trace[1].qBefore.world.anchors.some((row) => row.id === "research-white-6-c2")
    && !result.trace[1].qBefore.world.anchors.some((row) => row.id === "aa-purple-2-c3"),
};
fs.mkdirSync(path.join(__dirname, "evidence"), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, "evidence", "post-reroll-sequential-rollout.json"),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
