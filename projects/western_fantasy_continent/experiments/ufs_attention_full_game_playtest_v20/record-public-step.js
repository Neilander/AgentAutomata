"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const [sequence, command, decision, payloadJson] = process.argv.slice(2);
if (!/^\d{3}$/.test(sequence || "") || !["start", "advance", "random"].includes(command) || !decision) {
  throw new Error("usage: node record-public-step.js <NNN> <start|advance|random> <decision> [payload-json]");
}
let payload = null;
if (command === "advance") {
  if (!payloadJson) throw new Error("advance requires payload JSON");
  payload = JSON.parse(payloadJson);
  if (!payload || typeof payload.type !== "string" || !payload.type) {
    throw new Error("advance payload requires a nonempty type");
  }
}

const dir = __dirname;
const stateDir = path.join(dir, "state_attempt_2026082920_v20");
const profile = path.join(dir, "player-v20-fresh.json");
const cli = path.join(dir, "..", "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js");
const evidenceDir = path.join(dir, "evidence");
const payloadDir = path.join(dir, "payloads");
const ledger = path.join(dir, "machine-records.ndjson");
const decisions = path.join(dir, "DECISIONS.md");
const seed = "2026082920";
fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(payloadDir, { recursive: true });

const records = fs.existsSync(ledger)
  ? fs.readFileSync(ledger, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
  : [];
const expected = String(records.length + 1).padStart(3, "0");
if (sequence !== expected) throw new Error(`expected sequence ${expected}, received ${sequence}`);
if (command === "start" && records.length) throw new Error("start is allowed only once");
if (command !== "start" && !records.length) throw new Error("first recorded command must be start");

fs.appendFileSync(decisions, `\n## Step ${sequence} - ${command}\n\n- Recorded before operation: ${new Date().toISOString()}\n- Judgment: ${decision}\n`, "utf8");
const cliCommand = command === "start" ? "player-start" : command;
const args = [cli, cliCommand, stateDir];
if (command === "start") args.push(profile);
let payloadFile = null;
if (payload) {
  payloadFile = path.join(payloadDir, `${sequence}.json`);
  fs.writeFileSync(payloadFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  args.push(payloadFile);
}
const result = spawnSync(process.execPath, args, {
  cwd: dir,
  env: { ...process.env, UFS_ATTENTION_SEED: seed },
  encoding: "utf8",
});
const stdout = result.stdout || "";
const stderr = result.stderr || "";
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stdout.json`), stdout, "utf8");
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stderr.txt`), stderr, "utf8");
let response = null;
try { response = JSON.parse(stdout); } catch { /* verifier rejects malformed output */ }
fs.appendFileSync(ledger, `${JSON.stringify({
  sequence,
  command,
  cliCommand,
  payloadFile: payloadFile ? `payloads/${sequence}.json` : null,
  attentionSeed: seed,
  playerProfile: "player-v20-fresh.json",
  exitCode: result.status,
  signal: result.signal,
  stdoutFile: `evidence/${sequence}.stdout.json`,
  stderrFile: `evidence/${sequence}.stderr.txt`,
  public: response,
})}\n`, "utf8");
process.stdout.write(stdout);
process.stderr.write(stderr);
process.exitCode = result.status === null ? 1 : result.status;
