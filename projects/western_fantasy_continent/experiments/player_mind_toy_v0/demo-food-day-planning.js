"use strict";

const { applyBuildResponse, applyEstimateResponse, createSession } = require("./mind-toy-ai-loop");
const { attempt } = require("./mind-toy-runtime");
const FOOD_CASE = require("./cases/food-day-planning");

let session = createSession(FOOD_CASE.createInput());
session = applyBuildResponse(session, FOOD_CASE.createBuildResponse());
session = applyEstimateResponse(session, FOOD_CASE.createEstimateResponse());
const result = attempt(session.mindToy, { resultLimit: 5 });
const foodNames = new Map(FOOD_CASE.FOODS.map((row) => [row.id, row.label]));

console.log("模型：状态转移（因子化累计状态）");
console.log("知识：20张食物卡 + 1张口味偏好卡；闭卷模式\n");
for (const [index, plan] of result.ranking.entries()) {
  console.log(`${index + 1}. ${plan.selectedActionIds.map((id) => foodNames.get(id)).join(" / ")}`);
  console.log(`   综合分=${plan.score}；卡路里=${plan.finalMetrics.calories}；日均GI=${plan.finalMetrics.dailyGI}；GL=${plan.finalMetrics.gl}`);
  console.log(`   总糖=${plan.finalMetrics.totalSugar}；添加糖=${plan.finalMetrics.addedSugar}；天然糖=${plan.finalMetrics.naturalSugar}；口味=${plan.finalMetrics.averagePreference}`);
}
console.log("\n搜索轨迹：");
console.log(JSON.stringify(result.trace, null, 2));
