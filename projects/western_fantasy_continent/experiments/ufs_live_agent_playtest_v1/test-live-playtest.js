"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { UfsOneRoundSession } = require("../ufs_first_action_imagination_v0/ufs-one-round-session");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");

const root = __dirname;
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const records = fs.readFileSync(path.join(root, "machine-transcript.jsonl"), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);

test("transcript proves start plus three separate live advances", () => {
  assert.equal(records.length, 4);
  assert.deepEqual(records.map((record) => record.kind), ["start", "advance", "advance", "advance"]);
  assert.deepEqual(records.map((record) => record.response.actionCount), [0, 1, 2, 3]);
  assert.deepEqual(records.map((record) => record.response.status), ["choice", "choice", "choice", "unknown"]);
  for (const record of records.slice(1)) {
    assert.equal(typeof record.operation.type, "string");
    assert.equal(Array.isArray(record.operation), false);
  }
});

test("each choice file contains exactly one operation object", () => {
  const files = fs.readdirSync(path.join(root, "choices")).filter((name) => name.endsWith(".json")).sort();
  assert.equal(files.length, 3);
  for (const file of files) {
    const choice = readJson(path.join(root, "choices", file));
    assert.equal(Array.isArray(choice), false);
    assert.equal(typeof choice.type, "string");
    assert.equal(Object.hasOwn(choice, "futureActions"), false);
  }
});

test("sealed transcript preserves the historical unknown boundary", () => {
  const sealed = records.at(-1).response;
  assert.equal(sealed.status, "unknown");
  assert.equal(sealed.reason, "no_rule_for:placement_room_state");
  assert.equal(sealed.observation.placements.length, 2);
});

test("current cognition replays the same choices through the repaired tunnel trajectory", () => {
  const initial = readJson(path.join(root, "..", "ufs_first_action_imagination_v0", "public_initial_state.json"));
  const session = new UfsOneRoundSession({ publicMap });
  let response = session.start({ initialPublicState: initial, attentionSeed: 20260824 });
  for (const record of records.slice(1)) response = session.advance(record.operation);
  assert.equal(response.status, "choice");
  assert.equal(response.reason, "waiting_for_die_placement");
  assert.equal(response.actionCount, 3);
  assert.deepEqual(response.availableOperations, ["place_die"]);
  assert.equal(response.observation.placements.length, 3);
  assert.equal(response.observation.dice.find((die) => die.id === "r1-gray-0").placed, true);
  const tunnel = response.traceDelta.placements.at(-1).cognitiveTrace.placementRules.groundings
    .find((row) => row.queryKind === "placement_room_state");
  assert.equal(tunnel.trajectoryId, "read-rule-tunnel-placement-to-no-room-output");
});

test("playtest source has no old answer, fixture, oracle, or engine import", () => {
  const sourceFiles = ["session-cli.js", "random-gateway.js", "seal-terminal.js"];
  const forbidden = [
    "ufs_autonomous_round_agent_v0", "ufs_real_state_candidate_exam_v0", "one-round-fixture",
    "standard-engine", "scenario-fixture", "agent_decisions", "JUDGMENT_CARDS", "oracle",
  ];
  for (const file of sourceFiles) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    for (const token of forbidden) assert.equal(source.includes(token), false, `${file} contains ${token}`);
  }
});
