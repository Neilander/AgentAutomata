"use strict";

const assert = require("node:assert/strict");
const { assessDecisionFeatures } = require("./decision-feature-model-v1");

const CASES = [
  {
    id: "forced_single_button",
    title: "只有一个按钮，玩家直接按下",
    episode: {
      thoughtSegments: [{ durationUnits: 0.2, controlIntensity: 0.2, cognitiveChange: 0, newCognitiveContent: 0 }],
      choice: { meaningfulAlternativeCount: 1, meaningfulDifference: 1, tradeoffUnderstanding: 1, voluntariness: 1, preferenceExpression: 1 },
    },
  },
  {
    id: "route_planning_progress",
    title: "路径游戏中持续比较并排除路线",
    episode: {
      thoughtSegments: [
        { durationUnits: 4, controlIntensity: 0.8, cognitiveChange: 0.75, newCognitiveContent: 1 },
        { durationUnits: 4, controlIntensity: 0.85, cognitiveChange: 0.8, newCognitiveContent: 1 },
        { durationUnits: 4, controlIntensity: 0.9, cognitiveChange: 0.7, newCognitiveContent: 0.9 },
      ],
    },
  },
  {
    id: "long_dead_loop",
    title: "投入很多脑力但一直在原思路中打转",
    episode: {
      thoughtSegments: [
        { durationUnits: 5, controlIntensity: 0.9, cognitiveChange: 0, newCognitiveContent: 0 },
        { durationUnits: 5, controlIntensity: 0.9, cognitiveChange: -0.5, newCognitiveContent: 0 },
        { durationUnits: 4, controlIntensity: 0.8, cognitiveChange: -0.3, newCognitiveContent: 0 },
      ],
    },
  },
  {
    id: "sudoku_breakthrough",
    title: "数独中很快发现关键突破口",
    episode: {
      thoughtSegments: [
        { durationUnits: 1.5, controlIntensity: 0.65, cognitiveChange: 0.95, newCognitiveContent: 1, breakthrough: true },
      ],
      insight: { keyRelationUnderstood: 1, newToPlayer: 1, suddenness: 0.95, subjectiveOptionCompression: 0.9 },
    },
  },
  {
    id: "planning_then_breakthrough",
    title: "先持续规划，随后发现一个关键约束",
    episode: {
      thoughtSegments: [
        { durationUnits: 3, controlIntensity: 0.8, cognitiveChange: 0.7, newCognitiveContent: 1 },
        { durationUnits: 3, controlIntensity: 0.8, cognitiveChange: 0.65, newCognitiveContent: 0.9 },
        { durationUnits: 1, controlIntensity: 0.8, cognitiveChange: 0.9, newCognitiveContent: 1, breakthrough: true },
      ],
      insight: { keyRelationUnderstood: 1, newToPlayer: 0.9, suddenness: 0.85, subjectiveOptionCompression: 0.8 },
    },
  },
  {
    id: "slow_incremental_solution",
    title: "逐步推导出答案但没有突然突破",
    episode: {
      thoughtSegments: [
        { durationUnits: 3, controlIntensity: 0.75, cognitiveChange: 0.7, newCognitiveContent: 1 },
        { durationUnits: 3, controlIntensity: 0.75, cognitiveChange: 0.7, newCognitiveContent: 1 },
        { durationUnits: 3, controlIntensity: 0.75, cognitiveChange: 0.7, newCognitiveContent: 1 },
      ],
      insight: { keyRelationUnderstood: 1, newToPlayer: 1, suddenness: 0.1, subjectiveOptionCompression: 0.8 },
    },
  },
  {
    id: "backpack_self_choice",
    title: "背包有限，在药和武器之间按个人风格取舍",
    episode: {
      thoughtSegments: [
        { durationUnits: 3, controlIntensity: 0.65, cognitiveChange: 0.4, newCognitiveContent: 0.8 },
        { durationUnits: 2, controlIntensity: 0.6, cognitiveChange: 0.2, newCognitiveContent: 0.6 },
      ],
      choice: { meaningfulAlternativeCount: 2, meaningfulDifference: 0.95, tradeoffUnderstanding: 0.9, voluntariness: 1, preferenceExpression: 0.95 },
    },
  },
  {
    id: "coerced_preference_choice",
    title: "选项有差异也符合偏好，但实际上被系统强迫",
    episode: {
      thoughtSegments: [{ durationUnits: 2, controlIntensity: 0.5, cognitiveChange: 0.2, newCognitiveContent: 0.5 }],
      choice: { meaningfulAlternativeCount: 2, meaningfulDifference: 1, tradeoffUnderstanding: 1, voluntariness: 0.05, preferenceExpression: 1 },
    },
  },
  {
    id: "fake_options",
    title: "界面上有很多选项，但实际效果相同",
    episode: {
      thoughtSegments: [{ durationUnits: 1, controlIntensity: 0.35, cognitiveChange: 0, newCognitiveContent: 0 }],
      choice: { meaningfulAlternativeCount: 5, meaningfulDifference: 0.05, tradeoffUnderstanding: 0.8, voluntariness: 1, preferenceExpression: 0.7 },
    },
  },
  {
    id: "known_boss_weakness",
    title: "直接使用早已知道的Boss弱点",
    episode: {
      thoughtSegments: [{ durationUnits: 1, controlIntensity: 0.4, cognitiveChange: 0.25, newCognitiveContent: 0.1 }],
      insight: { keyRelationUnderstood: 1, newToPlayer: 0, suddenness: 1, subjectiveOptionCompression: 0.9 },
    },
  },
  {
    id: "complex_game_random_click",
    title: "问题客观复杂，但玩家没有思考就随便点击",
    episode: {
      objectiveComplexity: 1,
      thoughtSegments: [{ durationUnits: 0.2, controlIntensity: 0.1, cognitiveChange: 0, newCognitiveContent: 0 }],
    },
  },
  {
    id: "thoughtful_wrong_hypothesis",
    title: "认真形成了有推进的假设，但战后证明猜错",
    episode: {
      outcome: "loss",
      hypothesisVerified: false,
      thoughtSegments: [
        { durationUnits: 4, controlIntensity: 0.8, cognitiveChange: 0.7, newCognitiveContent: 1 },
        { durationUnits: 4, controlIntensity: 0.8, cognitiveChange: 0.6, newCognitiveContent: 0.9 },
      ],
    },
  },
  {
    id: "immediate_style_choice",
    title: "几乎没推演，但立即选择很符合自己的构筑风格",
    episode: {
      thoughtSegments: [{ durationUnits: 0.5, controlIntensity: 0.25, cognitiveChange: 0.1, newCognitiveContent: 0.2 }],
      choice: { meaningfulAlternativeCount: 3, meaningfulDifference: 0.9, tradeoffUnderstanding: 0.85, voluntariness: 1, preferenceExpression: 1 },
    },
  },
];

const rows = CASES.map((testCase) => ({
  id: testCase.id,
  title: testCase.title,
  ...assessDecisionFeatures(testCase.episode).features,
}));
const byId = Object.fromEntries(rows.map((row) => [row.id, row]));

assert.ok(byId.forced_single_button.EDecision < 0.05);
assert.equal(byId.forced_single_button.ChoiceAuthorship, 0);

assert.ok(byId.route_planning_progress.EDecision > 10);
assert.ok(byId.route_planning_progress.QDecision > 0.6);
assert.equal(byId.route_planning_progress.Insight, 0);

assert.ok(byId.long_dead_loop.EDecision > byId.route_planning_progress.EDecision);
assert.ok(byId.long_dead_loop.QDecision < 0);

assert.ok(byId.sudoku_breakthrough.EDecision < 1);
assert.equal(byId.sudoku_breakthrough.QDecision, 0);
assert.ok(byId.sudoku_breakthrough.Insight >= 0.9);
assert.ok(byId.slow_incremental_solution.QDecision > 0.6);
assert.ok(byId.slow_incremental_solution.Insight <= 0.1);
assert.ok(byId.planning_then_breakthrough.QDecision > 0.6);
assert.ok(byId.planning_then_breakthrough.Insight >= 0.8);

assert.ok(byId.backpack_self_choice.ChoiceAuthorship >= 0.9);
assert.ok(byId.coerced_preference_choice.ChoiceAuthorship <= 0.05);
assert.ok(byId.fake_options.ChoiceAuthorship <= 0.05);
assert.ok(byId.immediate_style_choice.EDecision < 0.2);
assert.ok(byId.immediate_style_choice.ChoiceAuthorship >= 0.85);

assert.equal(byId.known_boss_weakness.Insight, 0);
assert.ok(byId.complex_game_random_click.EDecision < 0.05);

// 猜错属于战后EVerify，不允许反向抹掉战前的思考投入与推进质量。
assert.ok(byId.thoughtful_wrong_hypothesis.EDecision > 6);
assert.ok(byId.thoughtful_wrong_hypothesis.QDecision > 0.5);

// 同样的思考过程，无论胜负或玩家偏好如何，特征层都不改变。
const baseEpisode = CASES.find((row) => row.id === "route_planning_progress").episode;
const base = assessDecisionFeatures(baseEpisode).features;
const noisyContext = assessDecisionFeatures({
  ...baseEpisode,
  outcome: "loss",
  reward: -100,
  emotion: "愤怒",
  playerPreference: { likesPlanning: 0 },
}).features;
assert.deepEqual(noisyContext, base);

// E只看思考投入；相同投入可以有完全不同的Q。
const sameDoseGood = assessDecisionFeatures({
  thoughtSegments: [{ durationUnits: 10, controlIntensity: 0.8, cognitiveChange: 0.8, newCognitiveContent: 1 }],
}).features;
const sameDoseBad = assessDecisionFeatures({
  thoughtSegments: [{ durationUnits: 10, controlIntensity: 0.8, cognitiveChange: -0.8, newCognitiveContent: 0 }],
}).features;
assert.equal(sameDoseGood.EDecision, sameDoseBad.EDecision);
assert.ok(sameDoseGood.QDecision > 0.7);
assert.ok(sameDoseBad.QDecision < -0.7);

// 特征识别器不得偷带二级反馈结果。
const contract = assessDecisionFeatures(baseEpisode);
assert.equal(Object.hasOwn(contract, "feedback"), false);
assert.equal(Object.hasOwn(contract, "emotion"), false);
assert.equal(Object.hasOwn(contract, "reward"), false);

console.table(rows);
console.log(`decision feature isolation tests passed: ${rows.length} cases`);
