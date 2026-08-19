"use strict";

const assert = require("node:assert/strict");
const {
  assessCoreDecisionFeatures,
  deriveAhaMoment,
} = require("./decision-feature-model-v2");

const CORE_CASES = [
  {
    id: "forced_single_button",
    title: "只有一个按钮，直接按下",
    episode: {
      thoughtSegments: [{ durationUnits: 0.2, controlIntensity: 0.2, resolvedComplexity: 0, orderingGain: 0 }],
      choice: { meaningfulAlternativeCount: 1, meaningfulDifference: 1, tradeoffUnderstanding: 1, voluntariness: 1, preferenceExpression: 1 },
    },
  },
  {
    id: "complex_causal_problem",
    title: "逐步查明Boss狂暴的复杂原因",
    episode: {
      thoughtSegments: [
        { durationUnits: 4, controlIntensity: 0.8, resolvedComplexity: 0.7, orderingGain: 0.05 },
        { durationUnits: 4, controlIntensity: 0.85, resolvedComplexity: 0.75, orderingGain: 0.05 },
      ],
    },
  },
  {
    id: "known_tasks_ordered",
    title: "没有新难题，只把已知任务排成时间顺序",
    episode: {
      thoughtSegments: [
        { durationUnits: 3, controlIntensity: 0.7, resolvedComplexity: 0.05, orderingGain: 0.85 },
        { durationUnits: 3, controlIntensity: 0.7, resolvedComplexity: 0.05, orderingGain: 0.8 },
      ],
    },
  },
  {
    id: "solve_and_order_raid",
    title: "既解决机制冲突，又排出完整团队行动链",
    episode: {
      thoughtSegments: [
        { durationUnits: 4, controlIntensity: 0.85, resolvedComplexity: 0.75, orderingGain: 0.6 },
        { durationUnits: 4, controlIntensity: 0.85, resolvedComplexity: 0.65, orderingGain: 0.85 },
      ],
    },
  },
  {
    id: "spatial_formation_ordered",
    title: "角色能力已知，只把站位和保护关系整理清楚",
    episode: {
      thoughtSegments: [
        { durationUnits: 2, controlIntensity: 0.7, resolvedComplexity: 0.05, orderingGain: 0.8 },
        { durationUnits: 2, controlIntensity: 0.7, resolvedComplexity: 0.1, orderingGain: 0.75 },
      ],
    },
  },
  {
    id: "resource_priority_ordered",
    title: "强化方向已知，只整理资源投入优先级",
    episode: {
      thoughtSegments: [
        { durationUnits: 2, controlIntensity: 0.65, resolvedComplexity: 0.1, orderingGain: 0.85 },
        { durationUnits: 2, controlIntensity: 0.65, resolvedComplexity: 0.1, orderingGain: 0.8 },
      ],
    },
  },
  {
    id: "high_effort_dead_loop",
    title: "投入很多脑力，却让问题和计划越来越乱",
    episode: {
      thoughtSegments: [
        { durationUnits: 5, controlIntensity: 0.9, resolvedComplexity: -0.4, orderingGain: -0.2 },
        { durationUnits: 5, controlIntensity: 0.9, resolvedComplexity: -0.5, orderingGain: -0.3 },
      ],
    },
  },
  {
    id: "boss_weakness_discovered",
    title: "发现Boss关键弱点，但还没有制定顺序",
    episode: {
      thoughtSegments: [{ durationUnits: 2, controlIntensity: 0.8, resolvedComplexity: 0.95, orderingGain: 0 }],
    },
  },
  {
    id: "known_weakness_rotation",
    title: "弱点早已知道，只重新安排技能释放顺序",
    episode: {
      thoughtSegments: [
        { durationUnits: 3, controlIntensity: 0.75, resolvedComplexity: 0.1, orderingGain: 0.9 },
        { durationUnits: 2, controlIntensity: 0.75, resolvedComplexity: 0.05, orderingGain: 0.8 },
      ],
    },
  },
  {
    id: "route_search_without_plan",
    title: "排除几条错误路线，但还没有组成行动顺序",
    episode: {
      thoughtSegments: [
        { durationUnits: 3, controlIntensity: 0.7, resolvedComplexity: 0.55, orderingGain: 0.05 },
        { durationUnits: 3, controlIntensity: 0.7, resolvedComplexity: 0.5, orderingGain: 0.05 },
      ],
    },
  },
  {
    id: "backpack_self_choice",
    title: "药和武器都合理，按自己的风格选择",
    episode: {
      thoughtSegments: [{ durationUnits: 2, controlIntensity: 0.6, resolvedComplexity: 0.1, orderingGain: 0.1 }],
      choice: { meaningfulAlternativeCount: 2, meaningfulDifference: 0.95, tradeoffUnderstanding: 0.9, voluntariness: 1, preferenceExpression: 0.95 },
    },
  },
  {
    id: "coerced_choice",
    title: "选项有差异也符合偏好，但实际上被强迫",
    episode: {
      thoughtSegments: [{ durationUnits: 1, controlIntensity: 0.5, resolvedComplexity: 0, orderingGain: 0 }],
      choice: { meaningfulAlternativeCount: 2, meaningfulDifference: 1, tradeoffUnderstanding: 1, voluntariness: 0.05, preferenceExpression: 1 },
    },
  },
  {
    id: "fake_options",
    title: "五个按钮实际效果相同",
    episode: {
      thoughtSegments: [{ durationUnits: 1, controlIntensity: 0.3, resolvedComplexity: 0, orderingGain: 0 }],
      choice: { meaningfulAlternativeCount: 5, meaningfulDifference: 0.05, tradeoffUnderstanding: 0.8, voluntariness: 1, preferenceExpression: 0.8 },
    },
  },
  {
    id: "complex_random_click",
    title: "问题客观复杂，玩家却没有思考",
    episode: {
      objectiveComplexity: 1,
      thoughtSegments: [{ durationUnits: 0.2, controlIntensity: 0.1, resolvedComplexity: 0, orderingGain: 0 }],
    },
  },
  {
    id: "thoughtful_wrong_hypothesis",
    title: "形成了有推进且可验证的假设，战后却猜错",
    episode: {
      outcome: "loss",
      hypothesisVerified: false,
      thoughtSegments: [
        { durationUnits: 4, controlIntensity: 0.8, resolvedComplexity: 0.65, orderingGain: 0.2 },
        { durationUnits: 4, controlIntensity: 0.8, resolvedComplexity: 0.6, orderingGain: 0.2 },
      ],
    },
  },
  {
    id: "immediate_style_choice",
    title: "几乎没推演，立即选择符合自己的构筑",
    episode: {
      thoughtSegments: [{ durationUnits: 0.5, controlIntensity: 0.25, resolvedComplexity: 0, orderingGain: 0 }],
      choice: { meaningfulAlternativeCount: 3, meaningfulDifference: 0.9, tradeoffUnderstanding: 0.85, voluntariness: 1, preferenceExpression: 1 },
    },
  },
];

const coreRows = CORE_CASES.map((testCase) => ({
  id: testCase.id,
  title: testCase.title,
  ...assessCoreDecisionFeatures(testCase.episode).coreFeatures,
}));
const byId = Object.fromEntries(coreRows.map((row) => [row.id, row]));

assert.ok(byId.forced_single_button.EDecision < 0.05);
assert.equal(byId.forced_single_button.ChoiceAuthorship, 0);

assert.ok(byId.complex_causal_problem.QDecision > 0.7);
assert.ok(byId.complex_causal_problem.Ordering < 0.1);
assert.ok(byId.known_tasks_ordered.QDecision < 0.1);
assert.ok(byId.known_tasks_ordered.Ordering > 0.8);
assert.ok(byId.solve_and_order_raid.QDecision > 0.65);
assert.ok(byId.solve_and_order_raid.Ordering > 0.7);
assert.ok(byId.spatial_formation_ordered.QDecision < 0.1);
assert.ok(byId.spatial_formation_ordered.Ordering > 0.75);
assert.ok(byId.resource_priority_ordered.QDecision <= 0.1);
assert.ok(byId.resource_priority_ordered.Ordering > 0.8);

assert.ok(byId.high_effort_dead_loop.EDecision > byId.complex_causal_problem.EDecision);
assert.ok(byId.high_effort_dead_loop.QDecision < 0);
assert.ok(byId.high_effort_dead_loop.Ordering < 0);

assert.ok(byId.boss_weakness_discovered.QDecision > 0.9);
assert.equal(byId.boss_weakness_discovered.Ordering, 0);
assert.ok(byId.known_weakness_rotation.QDecision <= 0.1);
assert.ok(byId.known_weakness_rotation.Ordering > 0.85);
assert.ok(byId.route_search_without_plan.QDecision > 0.5);
assert.ok(byId.route_search_without_plan.Ordering < 0.1);

assert.ok(byId.backpack_self_choice.ChoiceAuthorship >= 0.9);
assert.ok(byId.coerced_choice.ChoiceAuthorship <= 0.05);
assert.ok(byId.fake_options.ChoiceAuthorship <= 0.05);
assert.ok(byId.immediate_style_choice.EDecision < 0.2);
assert.ok(byId.immediate_style_choice.ChoiceAuthorship >= 0.85);

assert.ok(byId.complex_random_click.EDecision < 0.05);
assert.ok(byId.thoughtful_wrong_hypothesis.EDecision > 6);
assert.ok(byId.thoughtful_wrong_hypothesis.QDecision > 0.6);

// 输赢、奖励、情绪和玩家偏好属于其他层，不能改变核心特征。
const baseEpisode = CORE_CASES.find((row) => row.id === "solve_and_order_raid").episode;
const base = assessCoreDecisionFeatures(baseEpisode).coreFeatures;
const withExternalContext = assessCoreDecisionFeatures({
  ...baseEpisode,
  outcome: "loss",
  reward: -100,
  emotion: "愤怒",
  playerPreference: { likesOrdering: 0, likesProblemSolving: 0 },
}).coreFeatures;
assert.deepEqual(withExternalContext, base);

// 相同思考剂量可以分别用于解题或排序，证明Q与Ordering不是同一个值。
const sameDoseProblemSolving = assessCoreDecisionFeatures({
  thoughtSegments: [{ durationUnits: 8, controlIntensity: 0.8, resolvedComplexity: 0.9, orderingGain: 0.05 }],
}).coreFeatures;
const sameDoseOrdering = assessCoreDecisionFeatures({
  thoughtSegments: [{ durationUnits: 8, controlIntensity: 0.8, resolvedComplexity: 0.05, orderingGain: 0.9 }],
}).coreFeatures;
assert.equal(sameDoseProblemSolving.EDecision, sameDoseOrdering.EDecision);
assert.ok(sameDoseProblemSolving.QDecision > sameDoseOrdering.QDecision);
assert.ok(sameDoseOrdering.Ordering > sameDoseProblemSolving.Ordering);

// 核心接口只能有四个特征，不能残留Insight或Aha。
assert.deepEqual(Object.keys(base), ["EDecision", "QDecision", "Ordering", "ChoiceAuthorship"]);
assert.equal(Object.hasOwn(base, "Insight"), false);
assert.equal(Object.hasOwn(base, "AhaMoment"), false);

const AHA_CASES = [
  {
    id: "boss_eureka",
    title: "长期困惑后突然理解Boss弱点",
    transition: { confusionBefore: 0.95, confusionAfter: 0.15, resolutionDurationUnits: 0.15, comprehension: 1 },
  },
  {
    id: "gradual_boss_learning",
    title: "同样理解幅度，但经过很长时间逐渐学会",
    transition: { confusionBefore: 0.95, confusionAfter: 0.15, resolutionDurationUnits: 6, comprehension: 1 },
  },
  {
    id: "tutorial_answer",
    title: "一开始就被教程告知答案，之前没有多少困惑",
    transition: { confusionBefore: 0.15, confusionAfter: 0.05, resolutionDurationUnits: 0.1, comprehension: 1 },
  },
  {
    id: "flashy_but_unresolved",
    title: "看到显眼线索但困惑几乎没有减少",
    transition: { confusionBefore: 0.9, confusionAfter: 0.82, resolutionDurationUnits: 0.1, comprehension: 0.8 },
  },
  {
    id: "uncomprehended_answer",
    title: "答案突然出现，但玩家没有真正理解",
    transition: { confusionBefore: 0.9, confusionAfter: 0.2, resolutionDurationUnits: 0.1, comprehension: 0.1 },
  },
  {
    id: "ordering_eureka",
    title: "突然看懂多个混乱步骤的正确先后关系",
    transition: { confusionBefore: 0.85, confusionAfter: 0.1, resolutionDurationUnits: 0.2, comprehension: 0.95 },
  },
];

const ahaRows = AHA_CASES.map((testCase) => ({
  id: testCase.id,
  title: testCase.title,
  ...deriveAhaMoment(testCase.transition).secondLayer,
}));
const ahaById = Object.fromEntries(ahaRows.map((row) => [row.id, row]));

assert.ok(ahaById.boss_eureka.AhaMoment > 0.65);
assert.ok(ahaById.gradual_boss_learning.AhaMoment < 0.15);
assert.ok(ahaById.tutorial_answer.AhaMoment < 0.1);
assert.ok(ahaById.flashy_but_unresolved.AhaMoment < 0.1);
assert.ok(ahaById.uncomprehended_answer.AhaMoment < 0.1);
assert.ok(ahaById.ordering_eureka.AhaMoment > 0.55);

console.log("core decision features");
console.table(coreRows);
console.log("second-layer AhaMoment");
console.table(ahaRows);
console.log(`decision feature v2 isolation tests passed: ${coreRows.length} core + ${ahaRows.length} aha cases`);
