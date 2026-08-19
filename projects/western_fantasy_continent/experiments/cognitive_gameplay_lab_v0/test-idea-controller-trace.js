"use strict";

const assert = require("node:assert/strict");
const { acceptIdeaResponse, attemptIdea, createIdeaRequest, evaluateIdea } = require("./idea-loop");
const { chooseNextCognitiveOperation } = require("./thought-controller");
const { recordThought, validateTraceCausality } = require("./thought-trace");
const { createTrace } = require("./contracts");

test("AI proposes exactly one legal evidence-grounded idea", () => {
  const fixture = thoughtFixture();
  const request = createIdeaRequest(fixture);
  const idea = acceptIdeaResponse(request, ideaResponse());
  assert.equal(idea.actionId, "probe:rune_4");
  assert.throws(() => acceptIdeaResponse(request, { ...ideaResponse(), actionId: "probe:secret" }), /not legal/);
  assert.throws(() => acceptIdeaResponse(request, { ...ideaResponse(), evidenceIds: ["hidden:answer"] }), /inactive evidence/);
});

test("duplicate ideas do not count as new thinking", () => {
  const fixture = thoughtFixture();
  const first = acceptIdeaResponse(createIdeaRequest(fixture), ideaResponse());
  const secondRequest = createIdeaRequest({ ...fixture, previousIdeas: [first] });
  assert.throws(() => acceptIdeaResponse(secondRequest, { ...ideaResponse(), id: "idea:2" }), /duplicate idea/);
});

test("local attempt evaluates one idea from subjective MindToy estimates", () => {
  const fixture = thoughtFixture();
  const idea = acceptIdeaResponse(createIdeaRequest(fixture), ideaResponse());
  const attempt = attemptIdea({ idea, mindToy: fixture.mindToy });
  const evaluation = evaluateIdea({ attempt });
  assert.equal(attempt.status, "simulated");
  assert.equal(attempt.outcomes.length, 3);
  assert.equal(evaluation.useful, true);
  assert.ok(evaluation.predictedProgress > 0);
});

test("unknown transition blocks inference instead of inventing a result", () => {
  const fixture = thoughtFixture();
  fixture.mindToy.estimates["estimate:transition"].status = "unknown";
  fixture.mindToy.estimates["estimate:transition"].value = null;
  const idea = acceptIdeaResponse(createIdeaRequest(fixture), ideaResponse());
  const evaluation = evaluateIdea({ attempt: attemptIdea({ idea, mindToy: fixture.mindToy }) });
  assert.equal(evaluation.verdict, "blocked");
  assert.match(evaluation.decisiveUnknown, /transition/);
});

test("controller advances one cognitive operation at a time", () => {
  assert.equal(chooseNextCognitiveOperation({}).operation, "perceive_and_retrieve");
  assert.equal(chooseNextCognitiveOperation({ activeCognition: {} }).operation, "build_mind_toy");
  assert.equal(chooseNextCognitiveOperation({ activeCognition: {}, mindToy: {}, ideas: [] }).operation, "propose_one_idea");
  assert.equal(chooseNextCognitiveOperation({ activeCognition: {}, mindToy: {}, ideas: [{ id: "i" }] }).operation, "attempt_one_idea");
  assert.equal(chooseNextCognitiveOperation({
    activeCognition: {}, mindToy: {}, attentionRemaining: 2,
    ideas: [{ id: "i", attempt: {}, evaluation: { useful: true, predictedProgress: 2, confidence: 0.8 } }],
  }).operation, "act");
});

test("ThoughtTrace rejects references to thoughts that never happened", () => {
  let trace = createTrace();
  trace = recordThought(trace, {
    cycle: 0, module: "mind_toy", type: "built", inputRefs: ["active:0"], outputRefs: ["toy:0"],
    initialEvidenceIds: ["active:0"],
  });
  trace = recordThought(trace, {
    cycle: 0, module: "idea", type: "proposed", inputRefs: ["toy:0"], outputRefs: ["idea:0"],
    initialEvidenceIds: ["active:0"],
  });
  assert.equal(validateTraceCausality(trace, ["active:0"]).valid, true);
  assert.throws(() => recordThought(trace, {
    cycle: 0, module: "attempt", type: "attempted", inputRefs: ["idea:never"], outputRefs: ["attempt:0"],
    initialEvidenceIds: ["active:0"],
  }), /was not produced/);
});

function thoughtFixture() {
  const activeCognition = {
    schema: "active_cognition_v0",
    goal: { id: "find", label: "找出符文" },
    allowedActions: ["probe:rune_1", "probe:rune_2", "probe:rune_3", "probe:rune_4"],
    evidenceIds: ["observation:range", "rule:feedback"],
  };
  const estimates = {
    "estimate:transition": estimate("state_distribution", {
      kind: "state_distribution",
      outcomes: [
        { stateId: "lower", probability: 0.375 },
        { stateId: "equal", probability: 0.125 },
        { stateId: "higher", probability: 0.5 },
      ],
    }, 0.9),
    "estimate:value:current": estimate("scalar", scalar(-8), 0.8),
    "estimate:value:lower": estimate("scalar", scalar(-3), 0.8),
    "estimate:value:equal": estimate("scalar", scalar(10), 0.8),
    "estimate:value:higher": estimate("scalar", scalar(-4), 0.8),
  };
  return {
    activeCognition,
    mindToy: {
      schema: "player_mind_toy_v0",
      model: "state_transition",
      structure: {
        initialStateId: "current",
        states: [
          { id: "current", valueEstimateId: "estimate:value:current" },
          { id: "lower", valueEstimateId: "estimate:value:lower" },
          { id: "equal", valueEstimateId: "estimate:value:equal" },
          { id: "higher", valueEstimateId: "estimate:value:higher" },
        ],
        actions: [{ id: "probe:rune_4", fromStateId: "current", transitionEstimateId: "estimate:transition" }],
      },
      estimates,
    },
  };
}

function ideaResponse() {
  return {
    schema: "cognitive_idea_v0", id: "idea:probe_4", actionId: "probe:rune_4",
    claim: "探测中间符文可以明显缩小候选范围",
    rationale: "当前候选有序，反馈会指出目标在探测点的哪一侧",
    evidenceIds: ["observation:range", "rule:feedback"], estimateIds: ["estimate:transition"],
  };
}
function scalar(value) { return { kind: "scalar", expected: value, range: [value, value] }; }
function estimate(kind, value, confidence) { return { status: "estimated", value, confidence, assumptions: [], kind }; }
function test(name, fn) { try { fn(); console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; } }

console.log("Idea/controller/trace tests passed: 6");
