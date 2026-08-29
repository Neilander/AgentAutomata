"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const [sequence, command, decision, payloadJson] = process.argv.slice(2);
if (!/^\d{3}$/.test(sequence || "") || !["start", "advance", "random"].includes(command) || !decision) {
  throw new Error("usage: node record-public-step.js <NNN> <start|advance|random> <decision> [payload-json]");
}

const experimentDir = __dirname;
const stateDir = path.join(experimentDir, "state_attempt_2026082815_v15");
const cli = path.join(experimentDir, "..", "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js");
const evidenceDir = path.join(experimentDir, "evidence");
const payloadDir = path.join(experimentDir, "payloads");
const ledgerFile = path.join(experimentDir, "machine-records.ndjson");
const decisionsFile = path.join(experimentDir, "DECISIONS.md");
const seed = "2026082815";

fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(payloadDir, { recursive: true });

const records = fs.existsSync(ledgerFile)
  ? fs.readFileSync(ledgerFile, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
  : [];
const expected = String(records.length + 1).padStart(3, "0");
if (sequence !== expected) throw new Error(`expected sequence ${expected}, received ${sequence}`);
if (command === "start" && records.length !== 0) throw new Error("start is allowed only at sequence 001");
if (command !== "start" && records.length === 0) throw new Error("the first command must be start");

fs.appendFileSync(
  decisionsFile,
  `\n## Step ${sequence} - ${command}\n\n- Recorded before operation: ${new Date().toISOString()}\n- Judgment: ${decision}\n`,
  "utf8",
);

const args = [cli, command, stateDir];
let payloadFile = null;
if (command === "advance") {
  if (!payloadJson) throw new Error("advance requires payload JSON");
  JSON.parse(payloadJson);
  payloadFile = path.join(payloadDir, `${sequence}.json`);
  fs.writeFileSync(payloadFile, `${payloadJson}\n`, "utf8");
  args.push(payloadFile);
}

const result = spawnSync(process.execPath, args, {
  cwd: experimentDir,
  env: { ...process.env, UFS_ATTENTION_SEED: seed },
  encoding: "utf8",
});
const stdout = result.stdout || "";
const stderr = result.stderr || "";
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stdout.json`), stdout, "utf8");
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stderr.txt`), stderr, "utf8");

let response = null;
try { response = JSON.parse(stdout); } catch { /* strict verifier will reject malformed evidence */ }
fs.appendFileSync(ledgerFile, `${JSON.stringify({
  sequence,
  command,
  payloadFile: payloadFile ? `payloads/${sequence}.json` : null,
  attentionSeed: seed,
  exitCode: result.status,
  signal: result.signal,
  stdoutFile: `evidence/${sequence}.stdout.json`,
  stderrFile: `evidence/${sequence}.stderr.txt`,
  public: response,
})}\n`, "utf8");

process.stdout.write(stdout);
process.stderr.write(stderr);
process.exitCode = result.status === null ? 1 : result.status;

