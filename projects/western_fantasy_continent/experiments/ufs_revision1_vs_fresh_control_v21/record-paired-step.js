"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ARM_STATE = Object.freeze({
  treatment: "states/treatment-episode2",
  control: "states/control-episode1",
});
const [arm, sequence, command, decision, payloadJson] = process.argv.slice(2);
if (!Object.hasOwn(ARM_STATE, arm)
  || !/^\d{3}$/u.test(sequence ?? "")
  || !["snapshot", "advance", "random"].includes(command)
  || !decision) {
  throw new Error("usage: node record-paired-step.js <treatment|control> <NNN> <snapshot|advance|random> <decision> [payload-json]");
}
let payload = null;
if (command === "advance") {
  if (!payloadJson) throw new Error("advance requires payload JSON");
  payload = JSON.parse(payloadJson);
  if (!payload || typeof payload.type !== "string" || !payload.type) {
    throw new Error("advance payload requires a nonempty type");
  }
}

const root = __dirname;
const recordDir = path.join(root, "records", arm);
const evidenceDir = path.join(recordDir, "evidence");
const payloadDir = path.join(recordDir, "payloads");
const ledger = path.join(recordDir, "machine-records.ndjson");
const decisions = path.join(recordDir, "DECISIONS.md");
const stateDir = path.join(root, ARM_STATE[arm]);
const viewFile = path.join(stateDir, "current-player-view.json");
const cli = path.join(root, "..", "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js");
fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(payloadDir, { recursive: true });

const records = fs.existsSync(ledger)
  ? fs.readFileSync(ledger, "utf8").trim().split(/\r?\n/u).filter(Boolean).map(JSON.parse)
  : [];
const expected = String(records.length + 1).padStart(3, "0");
if (sequence !== expected) throw new Error(`expected sequence ${expected}, received ${sequence}`);
if (command === "snapshot" && records.length) throw new Error("snapshot is allowed only once");
if (command !== "snapshot" && !records.length) throw new Error("first record must snapshot the verified setup state");

fs.appendFileSync(decisions, `\n## Step ${sequence} - ${command}\n\n- Recorded before operation: ${new Date().toISOString()}\n- Judgment: ${decision}\n`, "utf8");
let result = { status: 0, signal: null, stdout: "", stderr: "" };
let payloadFile = null;
let randomMeta = null;
if (command === "snapshot") {
  result.stdout = fs.readFileSync(viewFile, "utf8");
} else if (command === "advance") {
  payloadFile = path.join(payloadDir, `${sequence}.json`);
  fs.writeFileSync(payloadFile, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  result = spawnSync(process.execPath, [cli, "advance", stateDir, payloadFile], {
    cwd: root,
    encoding: "utf8",
  });
} else {
  const current = JSON.parse(fs.readFileSync(viewFile, "utf8"));
  const pendingType = current.pending?.type;
  const occurrence = records.filter((record) => record.randomMeta?.pendingType === pendingType).length + 1;
  const materialized = spawnSync(process.execPath, [
    path.join(root, "materialize-random-observation.js"), arm, String(occurrence),
  ], { cwd: root, encoding: "utf8" });
  if (materialized.status !== 0) {
    process.stderr.write(materialized.stderr || "");
    process.exitCode = materialized.status ?? 1;
    return;
  }
  const materializedResult = JSON.parse(materialized.stdout);
  payloadFile = materializedResult.output;
  randomMeta = { pendingType, occurrence };
  result = spawnSync(process.execPath, [cli, "random", stateDir, payloadFile], {
    cwd: root,
    encoding: "utf8",
  });
}

const stdout = result.stdout || "";
const stderr = result.stderr || "";
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stdout.json`), stdout, "utf8");
fs.writeFileSync(path.join(evidenceDir, `${sequence}.stderr.txt`), stderr, "utf8");
let response = null;
try { response = JSON.parse(stdout); } catch { /* stage verifier rejects malformed output */ }
fs.appendFileSync(ledger, `${JSON.stringify({
  arm,
  sequence,
  command,
  payloadFile: payloadFile ? path.relative(root, payloadFile).replaceAll("\\", "/") : null,
  randomMeta,
  exitCode: result.status,
  signal: result.signal,
  stdoutFile: path.relative(root, path.join(evidenceDir, `${sequence}.stdout.json`)).replaceAll("\\", "/"),
  stderrFile: path.relative(root, path.join(evidenceDir, `${sequence}.stderr.txt`)).replaceAll("\\", "/"),
  public: response,
})}\n`, "utf8");
process.stdout.write(stdout);
process.stderr.write(stderr);
process.exitCode = result.status === null ? 1 : result.status;

