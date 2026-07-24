const assert = require("node:assert/strict");
const GAME = require("./five-day-raid-core");
const FORMAL = require("./five-day-formal-player-loop");

function choose(state, fragment) {
  const action = GAME.getPlayerObservation(state).actions.find((row) => row.label.includes(fragment));
  assert.ok(action, `missing visible action containing: ${fragment}`);
  return GAME.applyPlayerAction(state, action.id);
}

const session = FORMAL.createSession("formal-boundary-audit", 4);
const request = FORMAL.getPendingRequest(session);
assert.equal(request.type, "decision");
assert.deepEqual(request.playerState.goals.map((row) => row.id), ["grow_and_progress"]);
assert.equal(request.playerState.activeGoalId, "grow_and_progress");
assert.ok(!JSON.stringify(request.playerState).includes("discover_new_capabilities"));
assert.ok(!("knowledgeRetrieval" in request));
assert.ok(!JSON.stringify(request.responseContract).includes("affordance"));

assert.throws(() => FORMAL.applyDecisionResponse(session, {
  action: request.observation.actions[0].id,
  goalId: "discover_new_capabilities",
  reasoningChain: [{ kind: "evidence", evidence: "当前可见行动" }],
  alternatives: [],
}), /evaluator-only or unavailable goal/);

for (const action of request.observation.actions) {
  assert.ok(!("internalId" in action));
  assert.ok(!("outcome" in action));
  assert.ok(!("reasons" in action));
}

let state = GAME.createInitialState("formal-boundary-visible-results");
state = choose(state, "仔细检查门锁");
state = choose(state, "挑战守炉甲胄");
let visibleText = GAME.getPlayerObservation(state).recentSignals.join("\n");
assert.ok(visibleText.includes("蒸汽沿铜管回流进一口冷却井"));
assert.ok(!visibleText.includes("当前战力"));
assert.ok(!visibleText.includes("尚不足"));

state = choose(state, "卡死冷却阀");
visibleText = GAME.getPlayerObservation(state).recentSignals.join("\n");
assert.ok(visibleText.includes("动作明显慢了半拍"));
assert.ok(!visibleText.includes("门槛"));

state = choose(state, "正面袭击军需守卫");
visibleText = GAME.getPlayerObservation(state).recentSignals.join("\n");
assert.ok(visibleText.includes("暗沟一直通进营地内侧"));
assert.ok(!visibleText.includes("路线门槛"));

console.log(JSON.stringify({
  result: "PASS",
  visibleGoals: request.playerState.goals.map((row) => row.id),
  sealedActionCount: request.observation.actions.length,
  evaluatorGoalRejected: true,
  evaluatorRetrievalAuditHidden: true,
  affordancePromptRemoved: true,
  physicalFailureSignalsOnly: true,
}, null, 2));
