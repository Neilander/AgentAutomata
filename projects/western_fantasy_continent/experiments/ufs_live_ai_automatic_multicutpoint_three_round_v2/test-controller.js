"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const {
  UfsFullGameAttentionSession,
} = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const {
  UfsOneRoundSession,
} = require("../ufs_first_action_imagination_v0/ufs-one-round-session");
const {
  generateCandidates,
  macroIntent,
} = require("./automatic-multicutpoint-controller");
const {
  createRandomProvider,
  pendingRandomOperation,
  plannedInputContainsManualQ,
} = require("./run-experiment");

test("candidate generator emits at most three anchored sequences without authored Q", () => {
  const session = new UfsFullGameAttentionSession({ publicMap });
  const response = session.start({ initialPublicState, attentionSeed: 2026090102 });
  const candidates = generateCandidates(response, macroIntent(response));
  assert.ok(candidates.length >= 2 && candidates.length <= 3);
  assert.ok(candidates.every((candidate) => candidate.steps.length > 0));
  assert.ok(candidates.every((candidate) => !plannedInputContainsManualQ(candidate)));
  assert.ok(candidates.every((candidate) => candidate.steps.every((step) => (
    step.operation.type === "place_die" && step.anchor
  ))));
});

test("white-die plan pauses and the live random provider uses only pending keys", () => {
  const session = new UfsFullGameAttentionSession({ publicMap });
  let response = session.start({ initialPublicState, attentionSeed: 2026090102 });
  const candidate = generateCandidates(response, macroIntent(response))[0];
  const imagination = session.imagineSequentialPlan({ steps: candidate.steps });
  assert.equal(imagination.status, "paused_random");
  assert.equal(imagination.trace[0].operation.dieId, "r1-white-3");
  response = session.advance(imagination.trace[0].operation);
  const external = pendingRandomOperation(response, createRandomProvider());
  assert.equal(external.source, "live_environment_random_provider");
  assert.deepEqual(
    Object.keys(external.operation.values).sort(),
    [...response.pending.dieIds].sort(),
  );
  assert.ok(Object.values(external.operation.values).every((value) => value >= 1 && value <= 6));
});

test("a public spawning boundary remains an explicit cognitive choice", () => {
  const spawnState = {
    ...structuredClone(initialPublicState),
    phase: "spawning",
    dice: [],
    ships: initialPublicState.ships.filter((ship) => ship.id !== "purple-4"),
    waitingShips: [{ id: "purple-4", color: "purple" }],
  };
  const session = new UfsOneRoundSession({ publicMap });
  const response = session.start({ initialPublicState: spawnState, attentionSeed: 2026090102 });
  assert.equal(response.status, "choice");
  assert.equal(response.reason, "waiting_for_spawn_choice");
  assert.deepEqual(response.availableOperations, ["choose_spawn"]);
  assert.equal(response.pending.shipId, "purple-4");
  const resumed = session.advance({
    type: "choose_spawn",
    shipId: "purple-4",
    dropPointId: response.pending.candidates[0],
  });
  assert.equal(resumed.status, "complete");
  assert.equal(resumed.observation.waitingShips.length, 0);
  assert.ok(resumed.observation.ships.some((ship) => ship.id === "purple-4"));
});
