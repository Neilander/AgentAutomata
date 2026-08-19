"use strict";

const assert = require("node:assert/strict");
const { appendTrace, createCognitiveState, stableJson, validateReplayableState } = require("./contracts");
const { assertNoForbiddenKeys, assertSentinelAbsent, createPlayerView } = require("./game-boundary");

const SECRET_SENTINEL = "SECRET_DO_NOT_LEAK_7319";

test("player view is an allowlisted projection", () => {
  const engineSnapshot = fixtureSnapshot();
  const view = createPlayerView(engineSnapshot);
  assert.equal(view.gameId, "guess_fixture");
  assert.deepEqual(view.allowedActions, ["probe:rune_2", "probe:rune_3"]);
  assert.equal(Object.hasOwn(view, "engineTruth"), false);
  assert.equal(Object.hasOwn(view, "secretRune"), false);
  assertSentinelAbsent(view, SECRET_SENTINEL);
  assertNoForbiddenKeys(view);
});

test("forbidden nested hidden-state keys fail loudly", () => {
  assert.throws(
    () => assertNoForbiddenKeys({ visibleSignals: [{ hiddenAnswer: 4 }] }),
    /forbidden hidden-state key/,
  );
});

test("cognitive state and trace are replay-stable", () => {
  const playerView = createPlayerView(fixtureSnapshot());
  const initial = createCognitiveState({
    playerView,
    goal: { id: "identify_rune", concepts: ["符文探测", "目标频率"] },
    attention: { capacity: 8, remaining: 8 },
  });
  initial.trace = appendTrace(initial.trace, {
    type: "view_received",
    module: "game_boundary",
    outputRefs: playerView.visibleSignals.map((row) => row.id),
    payload: { turn: playerView.turn },
  });
  validateReplayableState(initial);
  const restored = JSON.parse(JSON.stringify(initial));
  validateReplayableState(restored);
  assert.equal(stableJson(restored), stableJson(initial));
  assert.equal(restored.trace.events[0].sequence, 1);
  assert.equal(restored.trace.nextSequence, 2);
});

test("attention capacity invariant is enforced", () => {
  const state = createCognitiveState({
    playerView: createPlayerView(fixtureSnapshot()),
    goal: { id: "identify_rune" },
    attention: { capacity: 3, remaining: 4 },
  });
  assert.throws(() => validateReplayableState(state), /attention remaining exceeds capacity/);
});

function fixtureSnapshot() {
  return {
    gameId: "guess_fixture",
    turn: 0,
    status: "playing",
    scene: {
      id: "rune_console",
      label: "符文探测台",
      concepts: ["符文探测", "目标频率"],
      environment: ["实验室"],
      currentProblem: "找出隐藏目标符文",
    },
    publicRules: [{ id: "rule:compare", text: "探测后会显示目标频率更高、更低或一致" }],
    visibleSignals: [{ id: "signal:ready", concepts: ["探测器可用"], text: "等待第一次探测" }],
    allowedActions: ["probe:rune_2", "probe:rune_3"],
    actionHistory: [],
    engineTruth: { sentinel: SECRET_SENTINEL },
    secretRune: SECRET_SENTINEL,
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

console.log("foundation tests passed: 4");
