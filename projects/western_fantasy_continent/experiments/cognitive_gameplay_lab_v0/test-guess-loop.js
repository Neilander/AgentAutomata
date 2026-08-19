"use strict";

const assert = require("node:assert/strict");
const { createGuessGame, toGuessPlayerView } = require("./guess-game");
const { runGuessCognitiveLoop } = require("./guess-cognitive-loop");
const { createDeterministicGuessAi } = require("./guess-ai-fixture");
const { assertSentinelAbsent } = require("./game-boundary");

test("engine target and sentinel never enter player view", () => {
  const engine = createGuessGame({ target: 6, sentinel: "NEVER_SHOW_THIS_TRUTH" });
  const view = toGuessPlayerView(engine);
  assertSentinelAbsent(view, engine.engineOnlySentinel);
  assert.equal(JSON.stringify(view).includes("engineOnlyTarget"), false);
});

test("isolated cognition player completes Guess through replaceable AI ports", () => {
  const engine = createGuessGame({ target: 6, sentinel: "NEVER_SHOW_THIS_TRUTH" });
  const run = runGuessCognitiveLoop({
    engine, ai: createDeterministicGuessAi(), attentionBudget: 2,
    memoryStore: [{
      id: "memory:ordered_midpoint", concepts: ["符文探测", "候选范围"], environment: ["符文实验"],
      behavior: "候选有序时探测中间附近", result: "通常能让高低反馈缩小较多范围", strength: 0.8, confidence: 0.75, recency: 0.6,
    }],
  });
  assert.equal(run.status, "won");
  assert.deepEqual(run.cycles.map((row) => row.actionId), ["probe:rune_4", "probe:rune_6"]);
  assert.equal(run.cycles.every((row) => row.evaluation.useful), true);
  assert.equal(run.trace.events.filter((row) => row.type === "proposed").length, 2);
  assertSentinelAbsent(run.cycles, engine.engineOnlySentinel);
});

test("AI cannot smuggle an engine-only evidence id into its idea", () => {
  const ai = createDeterministicGuessAi();
  ai.proposeIdea = (request) => ({
    schema: "cognitive_idea_v0", id: "bad", actionId: request.allowedActions[0], claim: "作弊", rationale: "读取答案",
    evidenceIds: ["engine:target"], estimateIds: [],
  });
  assert.throws(() => runGuessCognitiveLoop({ engine: createGuessGame({ target: 6 }), ai }), /inactive evidence/);
});

test("all eight engine-only targets are solvable without special-case access", () => {
  for (let target = 1; target <= 8; target += 1) {
    const run = runGuessCognitiveLoop({ engine: createGuessGame({ target }), ai: createDeterministicGuessAi(), attentionBudget: 2 });
    assert.equal(run.status, "won", `target ${target}`);
    assert.ok(run.turns <= 4, `target ${target} took ${run.turns} turns`);
    assert.equal(run.cycles.every((row) => row.evaluation.useful), true, `target ${target}`);
  }
});

function test(name, fn) { try { fn(); console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; } }
console.log("Guess end-to-end tests passed: 4");
