"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const [sequence, command, decision, payloadJson] = process.argv.slice(2);
if (!sequence || !command || !decision) {
  throw new Error("usage: node record-public-step.js <seq> <start|advance|random> <decision> [payload-json]");
}

const experimentDir = __dirname;
const stateDir = path.join(experimentDir, "state_attempt_2026082507_v7");
const cli = path.join(experimentDir, "..", "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js");
const evidenceDir = path.join(experimentDir, "evidence");
const payloadDir = path.join(experimentDir, "payloads");
const stamp = new Date().toISOString();

fs.appendFileSync(
  path.join(experimentDir, "DECISIONS.md"),
  `\n## Step ${sequence} — ${command}\n\n- Recorded before operation: ${stamp}\n- Judgment: ${decision}\n`,
  "utf8",
);

const args = [cli, command, stateDir];
if (command === "advance") {
  if (!payloadJson) throw new Error("advance requires payload JSON");
  const payloadPath = path.join(payloadDir, `${sequence}.json`);
  fs.writeFileSync(payloadPath, `${payloadJson}\n`, "utf8");
  args.push(payloadPath);
}

const result = spawnSync(process.execPath, args, {
  cwd: experimentDir,
  env: { ...process.env, UFS_ATTENTION_SEED: "2026082507" },
  encoding: "utf8",
});

const stdout = result.stdout || "";
const stderr = result.stderr || "";
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stdout.json`), stdout, "utf8");
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stderr.txt`), stderr, "utf8");

let publicResponse = null;
try {
  publicResponse = JSON.parse(stdout);
} catch (error) {
  // Preserve parse failure in the machine ledger without touching private state.
}

const machineRecord = {
  sequence,
  command,
  payloadFile: command === "advance" ? `payloads/${sequence}.json` : null,
  attentionSeed: "2026082507",
  exitCode: result.status,
  signal: result.signal,
  stdoutFile: `evidence/${sequence}.stdout.json`,
  stderrFile: `evidence/${sequence}.stderr.txt`,
  public: publicResponse
    ? {
        status: publicResponse.status,
        reason: publicResponse.reason,
        availableOperations: publicResponse.availableOperations,
        pending: publicResponse.pending,
        observation: publicResponse.observation,
        mapView: publicResponse.mapView,
      }
    : null,
};
fs.appendFileSync(path.join(experimentDir, "machine-records.ndjson"), `${JSON.stringify(machineRecord)}\n`, "utf8");

process.stdout.write(stdout);
process.stderr.write(stderr);
process.exitCode = result.status === null ? 1 : result.status;
