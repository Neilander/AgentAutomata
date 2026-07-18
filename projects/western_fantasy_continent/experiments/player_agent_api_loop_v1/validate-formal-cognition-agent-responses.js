const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const LOOP = require("./player-agent-loop");
const VALIDATION = require("./build-formal-cognition-agent-validation");

const directory = path.resolve(
  process.argv[2]
    || path.join(
      __dirname,
      "..",
      "..",
      ".local_run_archive",
      "player_agent_api_loop_v1",
      "formal-cognition-agent-validation",
    ),
);
const fullResponse = readJson("full-response.json");
const ablatedResponse = readJson("ablated-response.json");

const fullFixture = VALIDATION.buildValidationRequests();
const ablatedFixture = VALIDATION.buildValidationRequests();
validateAgainstRequest(fullFixture.full, fullResponse);
validateAgainstRequest(ablatedFixture.ablated, ablatedResponse);

assert.equal(fullResponse.action, "challenge:r1_main_2");
assert.equal(ablatedResponse.action, "swap:0:militia_drum");
assert.notEqual(fullResponse.action, ablatedResponse.action);
const fullReasoning = JSON.stringify(fullResponse.reasoningChain);
const ablatedReasoning = JSON.stringify(ablatedResponse.reasoningChain);
assert(fullReasoning.includes("-2.2"));
assert(fullReasoning.includes("3.951"));
assert(fullReasoning.includes("过去") || fullReasoning.includes("历史"));
assert(ablatedReasoning.includes("No historical cognition coordinates"));
assert(!ablatedReasoning.includes("3.951"));
assert(!ablatedReasoning.includes("-2.2"));

const appliedFull = LOOP.applyDecisionResponse(fullFixture.session, fullResponse);
const appliedAblated = LOOP.applyDecisionResponse(ablatedFixture.session, ablatedResponse);
assert.equal(appliedFull.history.at(-1).action, fullResponse.action);
assert.equal(appliedAblated.history.at(-1).action, ablatedResponse.action);
assert.equal(
  appliedFull.history.at(-1).decisionResponse.reasoningChain
    .some((row) => row.kind === "comparison" && row.evidence.includes("3.951")),
  true,
);

console.log(JSON.stringify({
  result: "PASS",
  formalResponseAccepted: true,
  fullKnowledgeAction: fullResponse.action,
  ablatedKnowledgeAction: ablatedResponse.action,
  behaviorChangedUnderAblation: fullResponse.action !== ablatedResponse.action,
  exactHistoricalRelativeScoreCited: -2.2,
  exactCurrentRelativeScoreCited: 3.951,
  ablatedAgentInventedCoordinates: false,
}, null, 2));

function validateAgainstRequest(request, response) {
  assert(request.controller.eligibleActions.includes(response.action));
  assert.equal(typeof response.goalId, "string");
  assert(Array.isArray(response.reasoningChain) && response.reasoningChain.length > 0);
  assert(response.reasoningChain.every((row) => (
    typeof row.kind === "string" && typeof row.evidence === "string"
  )));
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
}
