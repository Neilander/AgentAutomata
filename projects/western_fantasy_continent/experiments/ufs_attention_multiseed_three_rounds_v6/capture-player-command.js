#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const [roundDir, stepId, seed, command, payloadPath] = process.argv.slice(2);
if (!roundDir || !stepId || !seed || !command) {
  process.stderr.write("usage: node capture-player-command.js <round-dir> <step-id> <seed> <start|advance|random> [payload-path]\n");
  process.exit(2);
}

const experimentDir = __dirname;
const cliPath = path.resolve(
  experimentDir,
  "../ufs_first_action_imagination_v0/attention-player-cli.js",
);
const resolvedRoundDir = path.resolve(roundDir);
const stateDir = path.join(resolvedRoundDir, "state");
const stdoutDir = path.join(resolvedRoundDir, "stdout");
const machineDir = path.join(resolvedRoundDir, "machine");
fs.mkdirSync(stdoutDir, { recursive: true });
fs.mkdirSync(machineDir, { recursive: true });

const args = [cliPath, command, stateDir];
if (payloadPath) args.push(path.resolve(payloadPath));

const startedAt = new Date().toISOString();
const result = spawnSync(process.execPath, args, {
  cwd: path.resolve(experimentDir, "../../../.."),
  env: { ...process.env, UFS_ATTENTION_SEED: seed },
  encoding: null,
  windowsHide: true,
});
const endedAt = new Date().toISOString();
const stdout = result.stdout || Buffer.alloc(0);
const stderr = result.stderr || Buffer.alloc(0);
const stdoutPath = path.join(stdoutDir, `${stepId}.stdout.json`);
const stderrPath = path.join(stdoutDir, `${stepId}.stderr.txt`);
fs.writeFileSync(stdoutPath, stdout);
fs.writeFileSync(stderrPath, stderr);

let parsed = null;
let parseError = null;
try {
  parsed = JSON.parse(stdout.toString("utf8"));
} catch (error) {
  parseError = String(error && error.message ? error.message : error);
}

const record = {
  schemaVersion: 1,
  stepId,
  startedAt,
  endedAt,
  requestedSeed: seed,
  command,
  payloadPath: payloadPath ? path.resolve(payloadPath) : null,
  cliPath,
  stateDir,
  argv: [process.execPath, ...args],
  exitCode: result.status,
  signal: result.signal,
  stdoutBytes: stdout.length,
  stderrBytes: stderr.length,
  stdoutPath,
  stderrPath,
  parsedPublicResponse: parsed,
  parseError,
};
fs.writeFileSync(
  path.join(machineDir, `${stepId}.record.json`),
  `${JSON.stringify(record, null, 2)}\n`,
  "utf8",
);

process.stdout.write(stdout);
process.stderr.write(stderr);
process.exit(result.status === null ? 1 : result.status);
