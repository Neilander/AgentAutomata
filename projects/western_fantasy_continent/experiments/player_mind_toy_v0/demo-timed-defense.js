"use strict";

const {
  applyBuildResponse,
  applyEstimateResponse,
  createSession,
} = require("./mind-toy-ai-loop");
const { attempt } = require("./mind-toy-runtime");
const fixture = require("./cases/timed-defense");

let session = createSession(fixture.input);
session = applyBuildResponse(session, fixture.buildResponse);
session = applyEstimateResponse(session, fixture.estimateResponse);

const result = attempt(session.mindToy, { maxPlans: 50, maxDepth: 4 });

console.log(`模型：${session.mindToy.model}`);
console.log(`选择原因：${session.mindToy.provenance.selectionReason}`);
console.log("\n主观路线排行榜：");
for (const [index, plan] of result.ranking.entries()) {
  const route = plan.steps.map((step) => step.to).join(" → ");
  console.log(`${index + 1}. ${route} | 主观价值=${plan.score} | 置信度=${plan.confidence} | 结束于第${plan.day}天，剩余行动点=${plan.actionPointsRemaining}`);
}
console.log("\n规划轨迹：");
console.log(JSON.stringify(result.trace, null, 2));

