"use strict";

const { BUILD_RESPONSE_SCHEMA, ESTIMATE_RESPONSE_SCHEMA, MODEL_TYPES } = require("../mind-toy-ai-loop");

const input = {
  observableContext: {
    id: "timed_defense_visible_context_v0",
    summary: "玩家有两天准备时间，每天2点行动力；第三天敌军抵达营地。玩家能看见矿洞、铁匠铺线索和瞭望塔，也听说森林深处可能还有地点。",
    visibleRules: [
      "每次沿地图边行动会消耗行动力",
      "当天行动力不足时只能等到下一天",
      "第三天敌军到达后进入战斗",
    ],
    visibleOptions: [
      "前往矿洞",
      "前往瞭望塔",
      "继续打听森林深处的地点",
    ],
    visibleEvidence: [
      { id: "ev_deadline", text: "守卫明确说敌军第三天清晨抵达" },
      { id: "ev_mine", text: "矿洞标识说明可以取得普通锻造矿石" },
      { id: "ev_forge", text: "铁匠说拿到矿石后可以强化武器" },
      { id: "ev_watchtower", text: "瞭望塔可以观察敌军补给路线" },
      { id: "ev_supply", text: "玩家过去见过破坏补给削弱敌人的事件" },
      { id: "ev_ruins_hint", text: "村民只说森林深处似乎有古老遗迹，没有说明收益" },
    ],
  },
  goal: {
    id: "survive_enemy_arrival",
    statement: "在敌军抵达后赢得战斗",
  },
  playerMemory: [
    { id: "mem_common_event", text: "过去的普通探索事件通常只提供少量资源" },
  ],
  playerProfile: {
    id: "ordinary_planner",
    planningBudget: { maxBranches: 40, maxDepth: 4 },
    preference: { reliableGain: 0.55, highUpsideDiscovery: 0.45 },
  },
};

const buildResponse = {
  schema: BUILD_RESPONSE_SCHEMA,
  selectedModel: MODEL_TYPES.MAP,
  selectionReason: "地点可达性、每日行动点和先侦察再破坏的前置关系会改变最终计划，单步排行榜不足。",
  rejectedHigherComplexity: "当前地点行动只累计备战价值和解锁标记，不需要追踪大量可重复状态。",
  structure: {
    model: MODEL_TYPES.MAP,
    startNodeId: "camp",
    calendar: { days: 2, actionPointsPerDay: 2 },
    initialFlags: [],
    routeScoring: { model: MODEL_TYPES.SINGLE_RANKING },
    nodes: [
      { id: "camp", label: "营地", availability: "available" },
      { id: "mine", label: "矿洞", availability: "available", valueEstimateId: "estimate_mine", grants: ["has_ore"] },
      { id: "forge", label: "铁匠铺", availability: "known_locked", valueEstimateId: "estimate_forge", grants: ["player_strengthened"] },
      { id: "watchtower", label: "瞭望塔", availability: "available", valueEstimateId: "estimate_scout", grants: ["supply_route_known"] },
      { id: "enemy_supply", label: "敌军补给线", availability: "known_locked", valueEstimateId: "estimate_sabotage", grants: ["enemy_weakened"] },
      { id: "ancient_ruins", label: "可能存在的古代遗迹", availability: "anticipated", valueEstimateId: "estimate_ruins" },
    ],
    edges: [
      { id: "camp_to_mine", from: "camp", to: "mine", actionCost: 1 },
      { id: "mine_to_forge", from: "mine", to: "forge", actionCost: 2, requires: ["has_ore"] },
      { id: "camp_to_watchtower", from: "camp", to: "watchtower", actionCost: 2 },
      { id: "watchtower_to_supply", from: "watchtower", to: "enemy_supply", actionCost: 1, requires: ["supply_route_known"] },
      { id: "camp_to_unconfirmed_ruins", from: "camp", to: "ancient_ruins", actionCost: 1 },
    ],
  },
  estimationRequests: [
    { id: "estimate_mine", targetKind: "map_node", targetId: "mine", field: "subjectiveValue", outputShape: "scalar", reason: "矿石收益影响强化路线" },
    { id: "estimate_forge", targetKind: "map_node", targetId: "forge", field: "subjectiveValue", outputShape: "scalar", reason: "武器强化影响最终战斗" },
    { id: "estimate_scout", targetKind: "map_node", targetId: "watchtower", field: "subjectiveValue", outputShape: "scalar", reason: "侦察本身提供信息并解锁补给线" },
    { id: "estimate_sabotage", targetKind: "map_node", targetId: "enemy_supply", field: "subjectiveValue", outputShape: "outcome_distribution", reason: "削弱敌方可能比强化自己更有效" },
    { id: "estimate_ruins", targetKind: "map_node", targetId: "ancient_ruins", field: "subjectiveValue", outputShape: "outcome_distribution", reason: "未出现地点可能有收益，但目前无法进入路线" },
  ],
};

const estimateResponse = {
  schema: ESTIMATE_RESPONSE_SCHEMA,
  estimates: [
    {
      requestId: "estimate_mine",
      status: "known",
      value: { kind: "scalar", expected: 2.5, range: [2, 3] },
      confidence: 0.9,
      evidenceIds: ["ev_mine"],
      assumptions: ["矿洞本次仍提供普通矿石"],
    },
    {
      requestId: "estimate_forge",
      status: "estimated",
      value: { kind: "scalar", expected: 4, range: [3, 5] },
      confidence: 0.75,
      evidenceIds: ["ev_forge"],
      assumptions: ["强化武器能有效影响第三天战斗"],
    },
    {
      requestId: "estimate_scout",
      status: "known",
      value: { kind: "scalar", expected: 1, range: [1, 1] },
      confidence: 1,
      evidenceIds: ["ev_watchtower"],
      assumptions: [],
    },
    {
      requestId: "estimate_sabotage",
      status: "estimated",
      value: {
        kind: "outcome_distribution",
        outcomes: [
          { label: "成功破坏补给并明显削弱敌军", probability: 0.7, scalarValue: 9 },
          { label: "只造成轻微干扰", probability: 0.2, scalarValue: 3 },
          { label: "没有形成有效削弱", probability: 0.1, scalarValue: 0 },
        ],
      },
      confidence: 0.6,
      evidenceIds: ["ev_supply"],
      assumptions: ["侦察能找到可接近的补给位置"],
    },
    {
      requestId: "estimate_ruins",
      status: "estimated",
      value: {
        kind: "outcome_distribution",
        outcomes: [
          { label: "普通小额资源", probability: 0.65, scalarValue: 1.5 },
          { label: "特殊能力或高价值道具", probability: 0.15, scalarValue: 8 },
          { label: "无有效收益或遇到风险", probability: 0.2, scalarValue: 0 },
        ],
      },
      confidence: 0.25,
      evidenceIds: ["ev_ruins_hint", "mem_common_event"],
      assumptions: ["遗迹属于普通探索事件，而不是明确主线地点"],
    },
  ],
};

module.exports = {
  buildResponse,
  estimateResponse,
  input,
};
