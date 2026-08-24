"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const publicMap = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-threat-0-map");
const initialPublicState = require("../ufs_autonomous_round_agent_v0/public_initial_state.json");
const decisions = require("../ufs_autonomous_round_agent_v0/agent_decisions.json");
const random = require("../ufs_autonomous_round_agent_v0/external_random_observations.json");
const { UfsOneRoundSession } = require("./ufs-one-round-session");

function begin() {
  const session = new UfsOneRoundSession({ publicMap });
  const response = session.start({
    initialPublicState,
    attentionSeed: decisions.attentionSeed,
  });
  return { session, response };
}

function placeThroughFirstRandom(session) {
  session.advance({ type: "place_die", ...decisions.placements[0] });
  session.advance({ type: "place_die", ...decisions.placements[1] });
  return session.advance({ type: "place_die", ...decisions.placements[2] });
}

test("session exposes one operation port and returns a new observation after every action", () => {
  const { session } = begin();
  let response = session.lastResponse;
  assert.equal(response.status, "choice");
  assert.deepEqual(response.availableOperations, ["place_die"]);
  assert.equal(response.observation.phase, "dice");
  assert.equal(response.actionCount, 0);

  for (const selected of decisions.placements) {
    response = session.advance({ type: "place_die", dieId: selected.dieId, cellId: selected.cellId });
    assert.notEqual(response.status, "rejected");
    if (response.status === "random") {
      assert.deepEqual(response.availableOperations, ["submit_random_observation"]);
      response = session.advance({
        type: "submit_random_observation",
        values: random.observations[`after:${response.pending.afterDieId}`],
      });
    }
  }
  assert.equal(response.status, "choice");
  assert.equal(response.observation.phase, "rooms");
  assert.deepEqual(response.availableOperations, [
    "resolve_room", "excavate", "skip_worker", "end_rooms",
  ]);

  for (const { cardId: _cardId, ...action } of decisions.roomActions) {
    response = session.advance(action);
    assert.notEqual(response.status, "rejected");
  }
  assert.equal(response.status, "choice");
  assert.equal(response.pending.type, "spawn");
  assert.deepEqual(response.availableOperations, ["choose_spawn"]);

  const spawn = decisions.spawnChoices[response.pending.shipId];
  response = session.advance({
    type: "choose_spawn",
    shipId: response.pending.shipId,
    dropPointId: spawn.dropPointId,
  });
  assert.equal(response.status, "complete");
  assert.deepEqual(response.availableOperations, []);
  assert.equal(response.observation.phase, "new_round");
  assert.equal(response.actionCount, 13);
});

test("random boundary rejects other operations until external values arrive", () => {
  const { session } = begin();
  const randomResponse = placeThroughFirstRandom(session);
  const before = JSON.stringify(randomResponse.checkpoint);
  const rejected = session.advance({ type: "place_die", dieId: "r1-gray-0", cellId: "A-r1-c2" });

  assert.equal(randomResponse.status, "random");
  assert.equal(rejected.status, "rejected");
  assert.match(rejected.reason, /operation_not_available/);
  assert.equal(JSON.stringify(rejected.checkpoint), before);
  assert.deepEqual(rejected.availableOperations, ["submit_random_observation"]);
});

test("a JSON checkpoint restores the exact random boundary and can continue", () => {
  const { session } = begin();
  const randomResponse = placeThroughFirstRandom(session);
  const serialized = JSON.parse(JSON.stringify(randomResponse.checkpoint));
  const restored = UfsOneRoundSession.restore(serialized);

  assert.equal(restored.lastResponse.status, "random");
  assert.deepEqual(restored.lastResponse.pending, randomResponse.pending);
  const continued = restored.advance({
    type: "submit_random_observation",
    values: random.observations[`after:${randomResponse.pending.afterDieId}`],
  });
  assert.equal(continued.status, "choice");
  assert.equal(continued.observation.dice.find((die) => die.id === "r1-gray-0").value, 3);
  assert.equal(continued.observation.dice.find((die) => die.id === "r1-white-4").value, 5);
});

test("invalid action is rejected without changing the session checkpoint", () => {
  const { session, response } = begin();
  const before = JSON.stringify(response.checkpoint);
  const rejected = session.advance({ type: "place_die", dieId: "missing", cellId: "missing" });
  assert.equal(rejected.status, "rejected");
  assert.match(rejected.reason, /invalid_action/);
  assert.equal(JSON.stringify(rejected.checkpoint), before);
  assert.equal(rejected.actionCount, 0);
});

test("room resolution requires explicit payment while skip remains a separate port", () => {
  const { session } = begin();
  let response;
  for (const selected of decisions.placements) {
    response = session.advance({ type: "place_die", dieId: selected.dieId, cellId: selected.cellId });
    if (response.status === "random") {
      response = session.advance({
        type: "submit_random_observation",
        values: random.observations[`after:${response.pending.afterDieId}`],
      });
    }
  }
  const before = JSON.stringify(response.checkpoint);
  const rejected = session.advance({ type: "resolve_room", roomId: "A-upper-energy", pay: false });
  assert.equal(rejected.status, "rejected");
  assert.match(rejected.reason, /explicit_pay_true_or_skip/);
  assert.equal(JSON.stringify(rejected.checkpoint), before);
  assert.ok(rejected.availableOperations.includes("skip_worker"));
});

test("research effect exposes a legal advance choice and resumes without a half-resolved worker", () => {
  const session = new UfsOneRoundSession({ publicMap });
  let response = session.start({ initialPublicState, attentionSeed: 20260824 });
  const placements = [
    ["r1-gray-2", "A-r2-c5"],
    ["r1-gray-1", "A-r2-c4"],
    ["r1-gray-0", "A-r2-c2"],
    ["r1-white-3", "A-r3-c1"],
  ];
  for (const [dieId, cellId] of placements) response = session.advance({ type: "place_die", dieId, cellId });
  assert.equal(response.status, "random");
  response = session.advance({ type: "submit_random_observation", values: { "r1-white-4": 5 } });
  response = session.advance({ type: "place_die", dieId: "r1-white-4", cellId: "A-r1-c3" });
  assert.equal(response.observation.phase, "rooms");
  response = session.advance({ type: "resolve_room", roomId: "A-upper-energy", pay: true });
  assert.equal(response.observation.energy, 6);
  response = session.advance({ type: "resolve_room", roomId: "A-upper-research", pay: true });

  assert.equal(response.status, "choice");
  assert.equal(response.pending.effectKind, "research_room_choice");
  assert.equal(response.pending.budget, 2);
  assert.equal(response.pending.continuousCosts[0], 3);
  assert.equal(response.pending.maxAdvanceSteps, 0);
  assert.deepEqual(response.availableOperations, ["choose_research_advance"]);
  assert.equal(response.observation.energy, 4);
  assert.equal(response.observation.researchIndex, 0);

  const before = JSON.stringify(response.checkpoint);
  const rejected = session.advance({
    type: "choose_research_advance", roomId: "A-upper-research", advanceSteps: 1,
  });
  assert.equal(rejected.status, "rejected");
  assert.equal(JSON.stringify(rejected.checkpoint), before);

  response = session.advance({
    type: "choose_research_advance", roomId: "A-upper-research", advanceSteps: 0,
  });
  assert.equal(response.status, "choice");
  assert.equal(response.pending.type, "room_action");
  assert.ok(response.availableOperations.includes("excavate"));
  assert.equal(response.observation.energy, 4);
  assert.equal(response.observation.researchIndex, 0);
  assert.equal(response.observation.placements.find(
    (row) => row.roomId === "A-upper-research",
  ).resolved, true);
});

test("session core has no formal engine or old fixed fixture dependency", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "ufs-one-round-session.js"), "utf8");
  assert.doesNotMatch(source, /standard-engine|scenario-fixtures|one-round-fixture|ROUND_ONE_SCRIPT/);
});
