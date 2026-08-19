"use strict";

const { BUILD_RESPONSE_SCHEMA, ESTIMATE_RESPONSE_SCHEMA, MODEL_TYPES } = require("../mind-toy-ai-loop");

// 这些数值只属于MindToy测试知识集，不是营养建议，也不声称是真实食品数据库。
const FOODS = [
  food("oats", "燕麦碗", 350, 55, 22, 6, 2, 4, "grain", ["breakfast_main"], "温热、坚果香、清淡", 8.2),
  food("eggs", "水煮蛋组合", 180, 0, 0, 1, 0, 1, "protein", ["breakfast_main", "breakfast_side"], "咸香、浓郁", 8.8),
  food("yogurt", "原味酸奶", 160, 35, 6, 12, 4, 8, "dairy", ["breakfast_side"], "奶香、微酸、顺滑", 7.2),
  food("banana", "香蕉", 105, 52, 12, 14, 0, 14, "fruit", ["breakfast_side"], "天然甜、柔软", 6.4),
  food("toast", "全麦吐司", 200, 50, 18, 3, 1, 2, "grain", ["breakfast_main", "breakfast_side"], "烘烤香、坚果香", 7.8),
  food("cereal", "甜味脆麦片", 380, 75, 32, 22, 18, 4, "grain", ["breakfast_main"], "很甜、酥脆", 4.2),
  food("chicken", "烤鸡胸", 420, 0, 0, 0, 0, 0, "protein", ["lunch_main", "dinner_main"], "咸香、烟熏", 9.2),
  food("brown_rice", "糙米饭", 360, 50, 25, 1, 0, 1, "grain", ["lunch_side", "dinner_side"], "谷物香、有嚼劲", 7.6),
  food("white_rice", "白米饭", 400, 73, 34, 0, 0, 0, "grain", ["lunch_side", "dinner_side"], "清淡、柔软", 6.8),
  food("broccoli", "西兰花", 90, 15, 3, 3, 0, 3, "vegetable", ["lunch_side", "dinner_side"], "清新、蔬菜味", 6.9),
  food("salmon", "烤三文鱼", 480, 0, 0, 0, 0, 0, "protein", ["lunch_main", "dinner_main"], "鲜香、油润", 8.7),
  food("tofu", "香煎豆腐", 300, 15, 3, 2, 0, 2, "protein", ["lunch_main", "dinner_main"], "豆香、咸香", 8.1),
  food("salad", "混合沙拉", 120, 20, 4, 5, 0, 5, "vegetable", ["lunch_side", "dinner_side"], "清新、爽脆", 7.4),
  food("beans", "炖豆碗", 330, 32, 12, 2, 0, 2, "legume", ["lunch_main", "dinner_main", "lunch_side", "dinner_side"], "浓郁、咸香、绵软", 8.0),
  food("noodles", "汤面", 500, 65, 38, 4, 1, 3, "grain", ["lunch_main", "dinner_main"], "咸鲜、温热", 8.5),
  food("burger", "汉堡", 650, 60, 25, 8, 6, 2, "mixed", ["lunch_main", "dinner_main"], "浓郁、咸香、油润", 7.0),
  food("fries", "薯条", 480, 75, 30, 1, 0, 1, "fried", ["lunch_side", "dinner_side"], "咸香、酥脆、油润", 5.8),
  food("cola", "可乐", 180, 63, 26, 45, 45, 0, "drink", ["lunch_side", "dinner_side"], "很甜、气泡感", 3.0),
  food("juice", "橙汁", 130, 50, 12, 24, 0, 24, "drink", ["breakfast_side", "lunch_side", "dinner_side"], "天然甜、果香", 6.0),
  food("cake", "巧克力蛋糕", 420, 70, 30, 35, 28, 7, "dessert", ["breakfast_side", "lunch_side", "dinner_side"], "很甜、浓郁、柔软", 4.8),
];

const SLOTS = [
  { id: "breakfast_main", label: "早餐主项" },
  { id: "breakfast_side", label: "早餐搭配" },
  { id: "lunch_main", label: "午餐主项" },
  { id: "lunch_side", label: "午餐搭配" },
  { id: "dinner_main", label: "晚餐主项" },
  { id: "dinner_side", label: "晚餐搭配" },
];

const TASTE_PROFILE = {
  id: "taste_profile_balanced_savory",
  text: "玩家喜欢咸香、坚果香、清新口味；能接受少量天然甜，不喜欢过甜和明显油腻。",
  facts: {
    preferenceId: "balanced_savory",
    likes: "咸香、坚果香、清新",
    accepts: "天然甜、奶香",
    dislikes: "很甜、明显油腻",
  },
};

const RULE_CARD = {
  id: "meal_rules",
  text: "一天依次选择早餐主项、早餐搭配、午餐主项、午餐搭配、晚餐主项、晚餐搭配；同一食物不能重复。",
  facts: { slotCount: 6, noRepeat: true },
};

const TARGET_CARD = {
  id: "meal_targets",
  text: "本测试目标：总卡路里1800~2200；日均GI尽量不高于55；GL尽量不高于65；总糖不高于60；添加糖不高于25；天然糖可更宽松；同时兼顾口味与种类。",
  facts: {
    caloriesMin: 1800,
    caloriesMax: 2200,
    giLimit: 55,
    glLimit: 65,
    totalSugarLimit: 60,
    addedSugarLimit: 25,
    naturalSugarLimit: 45,
  },
};

function createInput(options = {}) {
  const missingFoodIds = new Set(options.missingFoodIds || []);
  return {
    observableContext: {
      id: options.id || "food_day_planning_full_knowledge",
      summary: "从20种有标准份量的食物中，为一天的早餐、午餐和晚餐各选择主项与搭配。",
      visibleOptions: FOODS.map((row) => ({ id: row.id, label: row.label })),
      visibleEvidence: [RULE_CARD, TARGET_CARD],
    },
    goal: {
      id: "compose_one_day_meals",
      statement: "在有限营养知识和个人口味下组合一天三餐",
    },
    playerMemory: [
      ...FOODS.filter((row) => !missingFoodIds.has(row.id)).map(foodKnowledgeCard),
      TASTE_PROFILE,
    ],
    playerProfile: {
      id: "balanced_savory_player",
      planningBudget: { beamWidth: options.beamWidth || 30, resultLimit: options.resultLimit || 10 },
    },
    knowledgePolicy: {
      mode: "closed_world",
      rule: "estimate只能使用visibleEvidence和playerMemory知识卡；缺卡必须unknown",
    },
  };
}

function createBuildResponse() {
  return {
    schema: BUILD_RESPONSE_SCHEMA,
    selectedModel: MODEL_TYPES.STATE_TRANSITION,
    selectionReason: "每次选食物都会改变当天累计营养、剩余餐位和可选食物，后续选择依赖当前状态。",
    rejectedHigherComplexity: "",
    structure: {
      model: MODEL_TYPES.STATE_TRANSITION,
      representation: "factorized_additive",
      slots: SLOTS,
      noRepeat: true,
      equivalence: { mode: "selected_set", reason: "当前模型没有午晚餐时段偏好，同一组食物仅交换午晚餐属于主观等价方案" },
      initialState: {
        metrics: { calories: 0, gl: 0, totalSugar: 0, addedSugar: 0, naturalSugar: 0 },
      },
      aggregation: {
        additiveFeatures: ["calories", "gl", "totalSugar", "addedSugar", "naturalSugar"],
        giFeature: "gi",
        glFeature: "gl",
      },
      actions: FOODS.map((row) => ({
        id: row.id,
        label: row.label,
        category: row.category,
        allowedSlotIds: row.allowedSlotIds,
        featureEstimateId: `nutrition_${row.id}`,
        preferenceEstimateId: `taste_${row.id}`,
      })),
      terminalScoring: {
        dimensions: [
          { id: "calories", source: "calories", utility: "target_range", target: [1800, 2200], tolerance: 700, weight: 0.25 },
          { id: "daily_gi", source: "dailyGI", utility: "max_limit", limit: 55, tolerance: 30, weight: 0.12 },
          { id: "gl", source: "gl", utility: "max_limit", limit: 65, tolerance: 60, weight: 0.13 },
          { id: "total_sugar", source: "totalSugar", utility: "max_limit", limit: 60, tolerance: 60, weight: 0.08 },
          { id: "added_sugar", source: "addedSugar", utility: "max_limit", limit: 25, tolerance: 35, weight: 0.14 },
          { id: "natural_sugar", source: "naturalSugar", utility: "max_limit", limit: 45, tolerance: 70, weight: 0.04 },
          { id: "taste", source: "averagePreference", utility: "maximize", scale: [0, 10], weight: 0.18 },
          { id: "variety", source: "categoryVariety", utility: "maximize", scale: [0, 1], weight: 0.06 },
        ],
      },
      searchBudget: { beamWidth: 400 },
    },
    estimationRequests: FOODS.flatMap((row) => [
      {
        id: `nutrition_${row.id}`,
        targetKind: "option",
        targetId: row.id,
        field: "nutritionFeatureVector",
        outputShape: "feature_vector",
        knowledgeRule: "exact_fact_or_unknown",
        reason: "累计当天卡路里、GI/GL和糖分状态",
      },
      {
        id: `taste_${row.id}`,
        targetKind: "option",
        targetId: row.id,
        field: "subjectiveTasteFit",
        outputShape: "scalar",
        knowledgeRule: "derive_only_from_cited_knowledge",
        reason: "根据有限口味描述和玩家口味偏好估算主观适口度",
      },
    ]),
  };
}

function createEstimateResponse(options = {}) {
  const missingFoodIds = new Set(options.missingFoodIds || []);
  return {
    schema: ESTIMATE_RESPONSE_SCHEMA,
    estimates: FOODS.flatMap((row) => {
      if (missingFoodIds.has(row.id)) {
        return [
          unknownEstimate(`nutrition_${row.id}`),
          unknownEstimate(`taste_${row.id}`),
        ];
      }
      const cardId = `knowledge_food_${row.id}`;
      const nutritionFields = ["calories", "gi", "gl", "totalSugar", "addedSugar", "naturalSugar"];
      return [
        {
          requestId: `nutrition_${row.id}`,
          status: "known",
          value: {
            kind: "feature_vector",
            values: Object.fromEntries(nutritionFields.map((field) => [field, row[field]])),
          },
          confidence: 1,
          evidenceIds: [cardId],
          factBindings: Object.fromEntries(nutritionFields.map((field) => [field, { evidenceId: cardId, factKey: field }])),
          assumptions: ["使用知识卡中的标准份量"],
        },
        {
          requestId: `taste_${row.id}`,
          status: "estimated",
          value: { kind: "scalar", expected: row.tasteFit, range: [Math.max(0, row.tasteFit - 1.5), Math.min(10, row.tasteFit + 1.5)] },
          confidence: 0.7,
          evidenceIds: [cardId, TASTE_PROFILE.id],
          assumptions: ["口味描述与玩家偏好在本次选择中保持稳定"],
        },
      ];
    }),
  };
}

function food(id, label, calories, gi, gl, totalSugar, addedSugar, naturalSugar, category, allowedSlotIds, tasteDescription, tasteFit) {
  return { id, label, calories, gi, gl, totalSugar, addedSugar, naturalSugar, category, allowedSlotIds, tasteDescription, tasteFit };
}

function foodKnowledgeCard(row) {
  return {
    id: `knowledge_food_${row.id}`,
    text: `${row.label}标准份量知识：${row.calories}卡，GI ${row.gi}，GL ${row.gl}，总糖${row.totalSugar}，其中添加糖${row.addedSugar}、天然糖${row.naturalSugar}；口味为${row.tasteDescription}。`,
    facts: {
      foodId: row.id,
      calories: row.calories,
      gi: row.gi,
      gl: row.gl,
      totalSugar: row.totalSugar,
      addedSugar: row.addedSugar,
      naturalSugar: row.naturalSugar,
      category: row.category,
      tasteDescription: row.tasteDescription,
    },
  };
}

function unknownEstimate(requestId) {
  return {
    requestId,
    status: "unknown",
    value: null,
    confidence: 0,
    evidenceIds: [],
    assumptions: ["有限知识集中没有该食物的知识卡"],
  };
}

module.exports = {
  FOODS,
  SLOTS,
  createBuildResponse,
  createEstimateResponse,
  createInput,
};
