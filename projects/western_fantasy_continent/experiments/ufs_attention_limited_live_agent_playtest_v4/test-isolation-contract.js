"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const transcript = JSON.parse(fs.readFileSync(path.join(root, "machine-transcript.json"), "utf8"));

function readResponse(entry) {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, entry.responseFile), "utf8"));
  return artifact.response || artifact;
}

function hasForbiddenKey(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, child] of Object.entries(value)) {
    if (["checkpoint", "hostCheckpoint", "traceDelta", "inspectHostState"].includes(key)) return true;
    if (hasForbiddenKey(child)) return true;
  }
  return false;
}

test("all recorded player responses stay on the public cropped schema", () => {
  for (const entry of transcript.entries) {
    const response = readResponse(entry);
    assert.equal(response.schema, "ufs_attention_limited_player_response_v0");
    assert.equal(hasForbiddenKey(response), false, entry.responseFile);
    assert.ok(response.attention.noticedCount <= response.attention.capacity, entry.responseFile);
    assert.equal(response.attention.noticedCount + response.attention.omittedCount, response.attention.spaceItemCount, entry.responseFile);
  }
});

test("the experiment contains exactly one start and no host-state artifact in the transcript", () => {
  assert.equal(transcript.attemptCount, 1);
  assert.equal(transcript.entries.filter((entry) => entry.command === "start").length, 1);
  assert.equal(transcript.entries.some((entry) => /checkpoint|host-state/i.test(entry.responseFile)), false);
});

test("the initial nonverbatim capture limitation is explicit", () => {
  assert.equal(transcript.entries[0].responseCapture, "reconstructed_nonverbatim");
  const artifact = JSON.parse(fs.readFileSync(path.join(root, transcript.entries[0].responseFile), "utf8"));
  assert.equal(artifact.verbatim, false);
  assert.match(artifact.provenanceNote, /one-Attempt protocol/);
});
