"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathsFor, sha256 } = require("./record-game-step");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function capture(game) {
  const paths = pathsFor(game);
  const preAuditFile = path.join(paths.recordDir, "audit", "pre-capture.json");
  assert.equal(readJson(preAuditFile).passed, true, "pre-capture audit must pass first");
  assert.equal(fs.existsSync(paths.outputProfile), false, "refusing a second/overwriting capture");
  assert.equal(fs.existsSync(path.join(paths.stateDir, "player-capture-receipt.json")), false,
    "state already captured");
  const inputShaBefore = sha256(paths.inputProfile);
  const result = spawnSync(process.execPath, [paths.cli, "player-capture", paths.stateDir, paths.outputProfile], {
    cwd: paths.root,
    encoding: "utf8",
  });
  const record = {
    schema: "ufs_v22_capture_record_v1",
    game,
    exitCode: result.status,
    signal: result.signal,
    inputProfile: path.relative(paths.root, paths.inputProfile).replaceAll("\\", "/"),
    inputProfileSha256Before: inputShaBefore,
    inputProfileSha256After: sha256(paths.inputProfile),
    outputProfile: path.relative(paths.root, paths.outputProfile).replaceAll("\\", "/"),
    outputProfileSha256: fs.existsSync(paths.outputProfile) ? sha256(paths.outputProfile) : null,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
  fs.writeFileSync(path.join(paths.recordDir, "capture.stdout.json"), record.stdout, "utf8");
  fs.writeFileSync(path.join(paths.recordDir, "capture.stderr.txt"), record.stderr, "utf8");
  fs.writeFileSync(path.join(paths.recordDir, "capture-record.json"), `${JSON.stringify(record, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  assert.equal(result.status, 0, record.stderr);
  assert.equal(record.inputProfileSha256After, inputShaBefore, "capture mutated the input profile");
  const output = readJson(paths.outputProfile);
  assert.equal(output.progress.revision, game + 1);
  assert.equal(output.progress.episodesCaptured, game + 1);
  process.stdout.write(record.stdout);
  return record;
}

if (require.main === module) {
  const gameRaw = process.argv[2];
  if (!/^[1-5]$/u.test(gameRaw ?? "")) throw new Error("Usage: node capture-game.js <game 1..5>");
  capture(Number(gameRaw));
}

module.exports = { capture };

