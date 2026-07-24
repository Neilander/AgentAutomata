const assert = require("node:assert/strict");
const LOOP = require("./five-day-formal-player-loop");

const FORBIDDEN_INITIAL_TEXT = [
  "建议战力",
  "锻造钥匙",
  "流放者符文",
  "战胜守炉",
  "不消耗行动点",
  "不推进时间",
  "身份词条不是纯战斗属性",
  "玩家由此学到",
];

function decide(request, labelFragment) {
  const action = request.observation.actions.find((row) => row.label.includes(labelFragment));
  assert(action, `missing decision action: ${labelFragment}`);
  const alternative = request.observation.actions.find((row) => row.id !== action.id);
  return {
    action: action.id,
    goalId: "grow_and_progress",
    reasoningChain: [{ kind: "evidence", evidence: `当前画面里存在“${action.label}”` }],
    alternatives: alternative ? [alternative.id] : [],
  };
}

function attribute(request) {
  return {
    knowledgeId: request.existingKnowledge[0].id,
    primaryCause: "所选行动之后出现了列出的可见变化",
    confidence: 0.55,
    evidenceEventIds: [request.visibleEvents[0].id],
    alternativeCauses: [],
    nextTest: "在后续场景比较是否再次出现相同变化",
  };
}

function fullTurn(session, labelFragment) {
  const decisionRequest = LOOP.getPendingRequest(session);
  session = LOOP.applyDecisionResponse(session, decide(decisionRequest, labelFragment));
  const attributionRequest = LOOP.getPendingRequest(session);
  assert.equal(attributionRequest.type, "attribution");
  return LOOP.applyAttributionResponse(session, attribute(attributionRequest));
}

function run() {
  let session = LOOP.createSession("formal-boundary-regression", 8);
  const initialRequest = LOOP.getPendingRequest(session);
  const initialText = JSON.stringify(initialRequest);
  for (const phrase of FORBIDDEN_INITIAL_TEXT) assert(!initialText.includes(phrase), `initial request leaked: ${phrase}`);
  assert(!initialText.includes("internalId"), "initial request leaked internal action ids");
  assert(!initialText.includes('"outcome"'), "initial request leaked action outcomes");
  assert(initialRequest.observation.actions.every((row) => /^choice_[a-z0-9]+$/.test(row.id)), "decision request did not use opaque actions");

  session = fullTurn(session, "刷1次");
  let request = LOOP.getPendingRequest(session);
  assert.equal(request.playerState.knowledge.length, 1, "observed action did not enter the code-owned retrieved knowledge channel");
  assert(request.playerState.knowledge[0].result.latestObservation.summary.includes("带回1件装备"), "retrieved memory lost the observed result");

  session = fullTurn(session, "仔细检查门锁");
  request = LOOP.getPendingRequest(session);
  const requestText = JSON.stringify(request);
  assert(requestText.includes("熔毁") && requestText.includes("断裂旧纹") && requestText.includes("铜线"), "physical door evidence did not reach the next decision");
  assert(!requestText.includes("锻造钥匙") && !requestText.includes("流放者符文") && !requestText.includes("战胜守炉"), "door evidence was converted into a designer answer");

  session = fullTurn(session, "拓印拿给铁匠");
  request = LOOP.getPendingRequest(session);
  assert(request.playerState.knowledge.some((row) => row.result.latestObservation.summary.includes("普通钥匙无用")), "discovered smith clue did not persist through formal retrieval");
  assert(session.apiCalls.filter((row) => row.type === "decision").length === 3, "decision boundary calls were not archived");
  assert(session.apiCalls.filter((row) => row.type === "attribution").length === 3, "attribution boundary calls were not archived");

  let resourceSession = LOOP.createSession("formal-resource-regression", 2);
  resourceSession = fullTurn(resourceSession, "替她还债");
  assert(resourceSession.history[0].eventLog[0].result.summary.includes("金币6→1"), "visible resource delta did not enter the formal feedback event");

  let repeatedFailure = LOOP.createSession("formal-repeat-failure", 8);
  repeatedFailure = fullTurn(repeatedFailure, "亲自把他背回镇里");
  repeatedFailure = fullTurn(repeatedFailure, "加入出战");
  repeatedFailure = fullTurn(repeatedFailure, "仔细检查门锁");
  repeatedFailure = fullTurn(repeatedFailure, "挑战守炉甲胄");
  repeatedFailure = fullTurn(repeatedFailure, "卡死冷却阀");
  repeatedFailure = fullTurn(repeatedFailure, "挑战守炉甲胄");
  const repeatSummary = repeatedFailure.history.at(-1).eventLog[0].result.summary;
  assert(repeatSummary.includes("守炉甲胄把队伍逼退"), "a repeated identical failure was swallowed by text de-duplication");
  assert(!repeatSummary.includes("当前战力") && !repeatSummary.includes("尚不足"), "formal feedback restored a scalar gate explanation");

  process.stdout.write(`${JSON.stringify({ ok: true, cycles: session.cycle, apiCalls: session.apiCalls.length, knowledgeRows: session.knowledgeBase.length, resourceDelta: true, repeatedFailureVisible: true }, null, 2)}\n`);
}

run();
