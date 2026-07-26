"use strict";

const assert = require("node:assert/strict");
const { allocateAttention } = require("./attention");
const { buildGameMemoryQuery, retrieveGameMemories } = require("./memory-retrieval");
const { buildActiveCognition } = require("./active-cognition");
const { createPlayerView } = require("./game-boundary");

test("attention follows the current game goal instead of raw flashiness", () => {
  const result = allocateAttention({
    budget: 1,
    goal: { concepts: ["守住北路"] },
    signals: [
      signal("north_threat", ["守住北路", "沉默怪"], 0.55, "北路出现沉默怪"),
      signal("loot_flash", ["战利品"], 1, "角落出现高亮金币"),
    ],
  });
  assert.equal(result.received.length, 1);
  assert.equal(result.received[0].sourceSignalId, "north_threat");
});

test("deeper unit mechanism requires additional attention", () => {
  const input = {
    goal: { concepts: ["守住北路", "沉默怪"] },
    signals: [{
      id: "enemy:silencer",
      concepts: ["沉默怪", "守住北路"],
      salience: 0.7,
      layers: [
        { id: "identity", cost: 1, concepts: ["沉默怪"], text: "北路有一个特殊小怪" },
        { id: "mechanism", cost: 4, requires: ["identity"], concepts: ["死亡沉默"], text: "死亡会沉默附近防御塔" },
      ],
    }],
  };
  const shallow = allocateAttention({ ...input, budget: 1 });
  const deep = allocateAttention({ ...input, budget: 5 });
  assert.deepEqual(shallow.received.map((row) => row.layerId), ["identity"]);
  assert.deepEqual(deep.received.map((row) => row.layerId), ["identity", "mechanism"]);
});

test("game RAG retrieves the matching tower-defense episode", () => {
  const view = towerView();
  const attention = allocateAttention({
    budget: 2,
    goal: { id: "hold_north", concepts: ["守住北路", "沉默怪"] },
    signals: view.visibleSignals,
  });
  const query = buildGameMemoryQuery({ playerView: view, goal: { id: "hold_north", concepts: ["守住北路"] }, receivedAttention: attention.received });
  const result = retrieveGameMemories({ memories: memoryFixtures(), query, mode: "automatic", attentionBudget: 1, limit: 2 });
  assert.equal(result.selected[0].id, "memory:silencer_failure");
  assert.equal(result.selected.some((row) => row.id === "memory:equipment_shop"), false);
});

test("weak related memory needs deliberate retrieval", () => {
  const query = { concepts: ["防御塔"], environment: ["北路"], goalIds: ["hold_north"] };
  const automatic = retrieveGameMemories({ memories: memoryFixtures(), query, mode: "automatic", attentionBudget: 3 });
  const deliberate = retrieveGameMemories({ memories: memoryFixtures(), query, mode: "deliberate", attentionBudget: 3 });
  assert.equal(automatic.selected.some((row) => row.id === "memory:weak_lane_note"), false);
  assert.equal(deliberate.selected.some((row) => row.id === "memory:weak_lane_note"), true);
});

test("ActiveCognition contains only received and retrieved rows", () => {
  const view = towerView();
  const goal = { id: "hold_north", concepts: ["守住北路", "沉默怪"] };
  const attention = allocateAttention({ budget: 1, goal, signals: view.visibleSignals });
  const query = buildGameMemoryQuery({ playerView: view, goal, receivedAttention: attention.received });
  const retrieval = retrieveGameMemories({ memories: memoryFixtures(), query, mode: "automatic", attentionBudget: 1, limit: 1 });
  const active = buildActiveCognition({
    playerView: view,
    goal,
    attentionResult: attention,
    retrievalResult: retrieval,
    attentionCapacity: 2,
    knownRules: [{ id: "rule:tower", activated: true, text: "怪物到达终点会造成漏怪", concepts: ["漏怪"] }],
  });
  assert.equal(active.observations.length, 1);
  assert.equal(active.observations[0].provenance.sourceId, "signal:silencer");
  assert.equal(active.retrievedMemories.length, 1);
  assert.equal(active.retrievedMemories[0].memoryId, "memory:silencer_failure");
  assert.equal(JSON.stringify(active).includes("equipment_shop"), false);
  assert.equal(active.evidenceIds.length, 3);
});

function towerView() {
  return createPlayerView({
    gameId: "tower_attention_fixture",
    turn: 4,
    status: "playing",
    scene: {
      id: "north_lane_wave",
      label: "北路第五波",
      concepts: ["塔防", "守住北路", "防御塔"],
      environment: ["北路", "主力塔附近"],
      currentProblem: "特殊小怪接近主力塔",
    },
    visibleSignals: [
      {
        id: "signal:silencer",
        concepts: ["守住北路", "沉默怪"],
        salience: 0.7,
        layers: [{ id: "identity", cost: 1, text: "北路出现沉默怪", concepts: ["沉默怪"] }],
      },
      {
        id: "signal:loot",
        concepts: ["战利品"],
        salience: 1,
        layers: [{ id: "flash", cost: 1, text: "角落金币闪光", concepts: ["战利品"] }],
      },
    ],
    allowedActions: ["target:silencer", "upgrade:main_tower", "wait"],
    actionHistory: [],
  });
}

function memoryFixtures() {
  return [
    {
      id: "memory:silencer_failure",
      kind: "episode",
      concepts: ["沉默怪", "防御塔", "漏怪"],
      environment: ["北路", "主力塔附近"],
      goalIds: ["hold_north"],
      cues: ["沉默怪"],
      behavior: "在主力塔旁击杀沉默怪",
      result: "防御塔被沉默，后续怪物漏过",
      strength: 0.9,
      confidence: 0.85,
      recency: 0.7,
      automaticCost: 0.25,
      retrievalCost: 1.5,
    },
    {
      id: "memory:equipment_shop",
      kind: "episode",
      concepts: ["装备", "商店"],
      environment: ["准备界面"],
      goalIds: ["increase_damage"],
      behavior: "购买弓箭升级",
      result: "远程塔伤害提高",
      strength: 0.8,
      recency: 0.9,
    },
    {
      id: "memory:weak_lane_note",
      kind: "episode",
      concepts: ["防御塔"],
      environment: ["北路"],
      goalIds: [],
      behavior: "观察北路塔位",
      result: "没有得出明确结论",
      strength: 0.2,
      confidence: 0.2,
      recency: 0.1,
      retrievalCost: 1,
    },
  ];
}

function signal(id, concepts, salience, text) {
  return { id, concepts, salience, layers: [{ id: "gist", cost: 1, text, concepts }] };
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

console.log("active cognition tests passed: 5");
