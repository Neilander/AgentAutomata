"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = __dirname;
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const ledger = read("machine-records.ndjson").trim().split(/\r?\n/).map(JSON.parse);
const decisions = read("DECISIONS.md");
const evidenceFiles = fs.readdirSync(path.join(root, "evidence")).filter((name) => name.endsWith(".stdout.json")).sort();
const payloadFiles = fs.readdirSync(path.join(root, "payloads")).filter((name) => name.endsWith(".json")).sort();
const checks = [];
const ok = (name, detail) => checks.push({ name, detail });

assert.equal(ledger.length, 90);
assert.equal(evidenceFiles.length, ledger.length);
assert.equal((decisions.match(/^## Step \d{3} — /gm) || []).length, ledger.length);
assert.deepEqual(ledger.map((entry) => entry.sequence), Array.from({ length: 90 }, (_, index) => String(index + 1).padStart(3, "0")));
ok("sequence", "90 ordered records, 90 stdout files, and 90 pre-operation decisions");

const responses = ledger.map((entry) => {
  assert.equal(entry.attentionSeed, "2026082507");
  assert.equal(entry.exitCode, 0);
  assert.equal(entry.signal, null);
  assert.ok(entry.stdoutFile.startsWith("evidence/"));
  assert.ok(entry.stderrFile.startsWith("evidence/"));
  assert.ok(fs.existsSync(path.join(root, entry.stderrFile)));
  const response = JSON.parse(read(entry.stdoutFile));
  assert.equal(response.schema, "ufs_full_game_attention_response_v0");
  assert.equal(response.attention.gameSeed, 2026082507);
  assert.equal(response.game.attentionSeed, 2026082507);
  assert.equal(response.status, entry.public.status);
  assert.equal(response.reason, entry.public.reason);
  return response;
});
ok("public-schema-seed", "every stdout parses as the public schema with game seed 2026082507");

assert.equal(ledger.filter((entry) => entry.command === "start").length, 1);
assert.equal(ledger[0].command, "start");
assert.equal(ledger.filter((entry) => entry.command === "random").length, 13);
assert.equal(ledger.filter((entry) => entry.command === "advance").length, 76);
assert.equal(payloadFiles.length, 76);
ok("single-attempt", "one start, 76 advances, 13 random calls, and no second start");

for (let index = 1; index < ledger.length; index += 1) {
  const entry = ledger[index];
  const previous = responses[index - 1];
  if (entry.command === "advance") {
    const payload = JSON.parse(read(entry.payloadFile));
    assert.ok(previous.availableOperations.includes(payload.type), `step ${entry.sequence} payload ${payload.type} not publicly available`);
  }
  if (entry.command === "random") {
    assert.equal(previous.status, "random", `step ${entry.sequence} random without public random boundary`);
    assert.ok(["white_reroll", "next_round_roll"].includes(previous.pending.type));
    assert.ok(["submit_random_observation", "submit_round_roll"].includes(responses[index].lastAction.type));
  }
}
ok("operation-contract", "every advance type was offered by the prior response; every random followed a public reroll/round-roll boundary");

const rejected = responses.map((response, index) => ({ response, index })).filter(({ response }) => response.status === "rejected");
assert.equal(rejected.length, 5);
for (const { response, index } of rejected) {
  assert.equal(response.actionCount, responses[index - 1].actionCount, `rejected step ${ledger[index].sequence} mutated actionCount`);
}
assert.deepEqual(rejected.map(({ index }) => ledger[index].sequence), ["025", "027", "028", "053", "055"]);
ok("rejections", "5 atomic rejected calls preserved at 025/027/028/053/055 with unchanged actionCount");

const last = responses.at(-1);
assert.equal(last.status, "attention_stop");
assert.equal(last.reason, "no_complete_initial_q");
assert.deepEqual(last.availableOperations, []);
assert.equal(last.pending.type, "placement");
assert.equal(last.game.round, 7);
assert.equal(last.game.completedRoundCount, 6);
assert.equal(last.observation.outcome, null);
ok("terminal", "round 7 returned attention_stop/no_complete_initial_q with zero available operations after 6 completed rounds");

const completedBoundaries = responses.filter((response) => response.pending?.type === "next_round_roll");
assert.equal(completedBoundaries.length, 6);
assert.deepEqual(completedBoundaries.map((response) => response.pending.round), [2, 3, 4, 5, 6, 7]);
ok("rounds", "six completed round boundaries and one partial seventh round");

console.log(JSON.stringify({ status: "PASS", checks }, null, 2));
