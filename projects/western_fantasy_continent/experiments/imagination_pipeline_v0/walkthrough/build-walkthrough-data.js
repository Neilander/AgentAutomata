"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  ImaginationPipeline,
  buildAttentionField,
  attentionToInitialQueries,
} = require("../imagination-pipeline");
const { createScenario, qFor, TRAJECTORIES } = require("../trajectory-fixtures");

function clone(value) {
  return structuredClone(value);
}

function applyPatches(world, patches) {
  for (const patch of patches) {
    if (patch.kind === "move_object") {
      const object = world.objects.find((candidate) => candidate.id === patch.objectId);
      if (!object) throw new Error(`unknown walkthrough object: ${patch.objectId}`);
      object.column = patch.toColumn;
      object.row = patch.toRow;
      continue;
    }
    if (patch.kind === "set_city_health") {
      world.city.health = patch.toHealth;
      continue;
    }
    throw new Error(`unknown walkthrough patch kind: ${patch.kind}`);
  }
}

function trajectorySummary(id) {
  const trajectory = TRAJECTORIES.find((row) => row.id === id);
  if (!trajectory) return null;
  return {
    id: trajectory.id,
    sourceRuleId: trajectory.sourceRuleId,
    sourceQuote: trajectory.sourceQuote,
    outcomeKind: trajectory.outcomeKind,
    internalAttentionPoints: trajectory.internalAttentionPoints,
    familiarity: trajectory.familiarity,
  };
}

function activationRows(trace, iteration) {
  return trace.activations
    .filter((row) => row.iteration === iteration)
    .map((row) => ({
      ...row,
      candidates: row.candidates.map((candidate) => ({
        ...candidate,
        trajectory: trajectorySummary(candidate.trajectoryId),
      })),
    }));
}

function buildWalkthroughData() {
  const scenario = createScenario();
  const perceptionBudget = 40;
  const imaginationBudget = 20;
  const result = new ImaginationPipeline().run({
    ...scenario,
    perceptionBudget,
    imaginationBudget,
  });

  const attention = buildAttentionField(
    scenario.world,
    scenario.action,
    result.trace.actionInstance,
    { maxItems: perceptionBudget, goal: scenario.goal },
  );
  const initialQueries = attentionToInitialQueries(
    scenario.world,
    scenario.action,
    attention,
  );

  const worlds = [clone(scenario.world)];
  let imagined = clone(scenario.world);
  for (const grounding of result.trace.groundings) {
    if (grounding.committed) applyPatches(imagined, grounding.patches);
    worlds.push(clone(imagined));
  }

  const groundings = result.trace.groundings.map((grounding) => ({
    ...grounding,
    trajectory: trajectorySummary(grounding.trajectoryId),
  }));
  const finalBoundary = result.trace.boundaries.at(-1);
  const attentionRows = attention.selected.map((atom) => ({
    id: atom.id,
    value: atom.value,
    activation: atom.activation,
    contributions: atom.contributions,
  }));

  const stages = [
    { id: "action", number: "01", label: "动作模式", output: "动作实例 + 注意计划" },
    { id: "attention", number: "02", label: "有限注意", output: "预算内公开事实" },
    { id: "query", number: "03", label: "五槽 Q", output: "局部状态坐标" },
    { id: "activation", number: "04", label: "轨迹激活", output: "联想候选 + 关系核对" },
    { id: "grounding", number: "05", label: "对象实例化", output: "受控读取 + 世界补丁" },
    { id: "continuation", number: "06", label: "连续设想", output: "新 Q 或停止边界" },
  ];

  const steps = [
    {
      id: "candidate-action",
      number: 1,
      stageId: "action",
      eyebrow: "候选动作进入",
      title: "把“B 列放置 2 点骰”整理成动作实例",
      summary: "流水线不负责发明这个候选；它从一个已经提出的动作开始，展开参数、影响关系和设想出口。",
      decision: "这次要在脑内预演什么？",
      outputHeadline: "ACTION-PLACE-DIE-V0",
      outputNote: "明确了 B 列、移动量 2、全体选择，以及“同列 → 预计终点 → 特殊格目标”的注意路线。",
      checks: ["输入只是一项候选动作", "尚未读取任何隐藏结果", "第 7 项候选生成不在本实验内"],
      detailKind: "action",
      detail: { action: scenario.action, goal: scenario.goal, actionInstance: result.trace.actionInstance },
      raw: { input: { action: scenario.action, goal: scenario.goal }, output: result.trace.actionInstance },
      world: worlds[0],
      delta: { tone: "neutral", label: "世界未改变", text: "这里只建立动作设想入口。" },
    },
    {
      id: "attention-field",
      number: 2,
      stageId: "attention",
      eyebrow: "公开信息筛选",
      title: "从公开状态中选出这次真正注意到的 34 项",
      summary: "默认注意、动作关系、保护城市目标与显眼特殊格共同提高激活；最多只让 40 项公开原子进入后续。",
      decision: "这次玩家真的看见了什么？",
      outputHeadline: `${attention.selected.length} / ${attention.totalPublicAtoms} 项进入注意`,
      outputNote: "后续 grounding 只能读取这份白名单；需要未注意事实时必须停止。",
      checks: ["感知预算上限 40", "未注意读取会抛出 AttentionAccessError", "当前参数是微型实验参数，不是真人标定"],
      detailKind: "attention",
      detail: { budget: perceptionBudget, total: attention.totalPublicAtoms, selected: attentionRows },
      raw: { input: result.trace.actionInstance.attentionPlan, output: attentionRows },
      world: worlds[0],
      delta: { tone: "info", label: "34 项已注意", text: "世界仍不改变，只形成可读取事实白名单。" },
    },
    {
      id: "initial-five-slot-q",
      number: 3,
      stageId: "query",
      eyebrow: "局部状态编码",
      title: "同列两架飞船分别形成严格五槽 Q",
      summary: "注意层只确认对象与动作关系，此时普通飞船和冻结飞船都形成 Q；冻结例外尚未在这里提前判定。",
      decision: "哪些被注意对象值得唤醒相关经验？",
      outputHeadline: `${initialQueries.length} 个五槽查询`,
      outputNote: "ship-a 与 ship-frozen 各自产生一份完整 Q；异列 ship-other 不进入。",
      checks: ["每个 Q 恰好五个槽位", "缺字段不补全", "对象分别保留，不压成一句话"],
      detailKind: "queries",
      detail: { queries: initialQueries },
      raw: { input: attentionRows, output: initialQueries },
      world: worlds[0],
      delta: { tone: "info", label: "2 个 Q", text: "形成联想查询，但没有执行规则。" },
    },
    {
      id: "column-memory-activation",
      number: 4,
      stageId: "activation",
      eyebrow: "矩阵联想",
      title: "两个 Q 都唤醒“同列飞船下降”轨迹",
      summary: "确定性测试编码器把五槽 Q 送入预编译矩阵，Top-K 负责提出候选；当前关系门选择同列移动轨迹。",
      decision: "过去哪段经验最像当前局部状态？",
      outputHeadline: "接受 RULE-PLACE-DIE-COLUMN-MOVE",
      outputNote: "激活只提出联想，不等于规则已经对所有对象生效。冻结例外留给参数程序核对。",
      checks: ["Top-K 激活不是事实证明", "激活阈值为 0.55", "编码器仍是可替换的确定性测试编码器"],
      detailKind: "activation",
      detail: { activations: activationRows(result.trace, 0), accepted: trajectorySummary(groundings[0].trajectoryId), rejections: [] },
      raw: { input: initialQueries, output: activationRows(result.trace, 0) },
      world: worlds[0],
      delta: { tone: "neutral", label: "联想已提出", text: "尚未提交任何 imaginedWorld 补丁。" },
    },
    {
      id: "column-grounding",
      number: 5,
      stageId: "grounding",
      eyebrow: "抽象规则落地",
      title: "参数程序排除冻结飞船，只预演 ship-a 下降",
      summary: "grounding 在注意白名单内读取对象状态，绑定当前骰子数值，产出一个 B2 → B4 的移动补丁。",
      decision: "这条抽象经验在当前局面具体影响谁？",
      outputHeadline: "ship-a：B2 → B4",
      outputNote: "ship-frozen 没有产生补丁；补丁只提交到 imaginedWorld，observedWorld 保持原样。",
      checks: ["冻结对象被排除", "读取路径全部受注意门控", "observedWorld 未修改"],
      detailKind: "grounding",
      detail: { grounding: groundings[0], excluded: ["ship-frozen"], accepted: ["ship-a"] },
      raw: { input: { queries: initialQueries, rule: trajectorySummary(groundings[0].trajectoryId) }, output: groundings[0] },
      world: worlds[1],
      delta: { tone: "gain", label: "想象世界更新", text: "ship-a 从 B2 下降到 B4；真实观察世界仍在 B2。" },
    },
    {
      id: "arrow-five-slot-q",
      number: 6,
      stageId: "query",
      eyebrow: "自动后果继续",
      title: "预演终点是箭头格，形成新的 landed_arrow Q",
      summary: "第一段补丁提交后，控制器读取已经注意到的终点类型，把“停在箭头上”整理成下一轮五槽查询。",
      decision: "移动结束后，还有什么自动后果值得继续想？",
      outputHeadline: "1 个 landed_arrow Q",
      outputNote: "这里保留关键关系：是“停在箭头上”，不是“经过箭头”。",
      checks: ["新 Q 来自 imaginedWorld 的局部变化", "终点类型必须已进入注意", "关系信息不能只靠语义相似度"],
      detailKind: "queries",
      detail: { queries: [{ q: qFor("landed_arrow"), metadata: { kind: "landed_arrow", objectId: "ship-a", tileKind: "arrow", tileColumn: "B", tileRow: 4 } }] },
      raw: { input: groundings[0].patches, output: qFor("landed_arrow") },
      world: worlds[1],
      delta: { tone: "info", label: "继续设想", text: "ship-a 已在 imaginedWorld 的 B4，产生下一轮查询。" },
    },
    {
      id: "arrow-relation-gate",
      number: 7,
      stageId: "activation",
      eyebrow: "高相似候选核对",
      title: "拒绝“只是经过箭头”，接受“停在箭头后横移”",
      summary: "两个候选都高度激活，但关系门用当前已注意事实核对 qKind，拒绝不符合“停在终点”的干扰轨迹。",
      decision: "语义上很像的经验，哪一条关系真的成立？",
      outputHeadline: "拒绝 1 条，接受 1 条",
      outputNote: "RULE-000-PASSING-ARROW-DOES-NOT-SHIFT 因 landed_arrow ≠ passed_arrow 被拒绝。",
      checks: ["高激活不越过事实门", "拒绝原因可审计", "否定与细微关系不交给 embedding 独断"],
      detailKind: "activation",
      detail: {
        activations: activationRows(result.trace, 1),
        accepted: trajectorySummary(groundings[1].trajectoryId),
        rejections: result.trace.relationRejections.filter((row) => row.iteration === 1),
      },
      raw: { input: qFor("landed_arrow"), output: { activations: activationRows(result.trace, 1), rejections: result.trace.relationRejections.filter((row) => row.iteration === 1) } },
      world: worlds[1],
      delta: { tone: "danger", label: "错误联想被挡住", text: "世界不变；只有关系成立的横移规则进入 grounding。" },
    },
    {
      id: "arrow-grounding",
      number: 8,
      stageId: "grounding",
      eyebrow: "特殊格实例化",
      title: "读取箭头目标，把 ship-a 从 B4 横移到 C4",
      summary: "参数程序只读取已注意的 targetColumn 与 targetRow，产出 B4 → C4 的移动补丁并提交到 imaginedWorld。",
      decision: "箭头在这个具体格子上把对象送到哪里？",
      outputHeadline: "ship-a：B4 → C4",
      outputNote: "这次实际读取两项公开事实：tile:B:4.targetColumn 与 targetRow。",
      checks: ["只读取箭头目标两项", "补丁来源位置核对通过", "observedWorld 仍在 B2"],
      detailKind: "grounding",
      detail: { grounding: groundings[1], accepted: ["ship-a"] },
      raw: { input: { query: qFor("landed_arrow"), rule: trajectorySummary(groundings[1].trajectoryId) }, output: groundings[1] },
      world: worlds[2],
      delta: { tone: "gain", label: "想象世界更新", text: "ship-a 横移到 C4；该格在公开状态中是城市。" },
    },
    {
      id: "city-five-slot-q",
      number: 9,
      stageId: "query",
      eyebrow: "第二次自动继续",
      title: "预演终点是城市，形成 landed_city Q",
      summary: "横移补丁提交后，控制器再次检查终点，形成“城市伤害待发生”的五槽状态。",
      decision: "横移完成后，城市格还会触发什么？",
      outputHeadline: "1 个 landed_city Q",
      outputNote: "新的受影响对象变为 city，原因关系是飞船移动结束在城市。",
      checks: ["受影响对象从 ship 切换为 city", "仍是 imagined consequence", "尚未直接扣除真实城市生命"],
      detailKind: "queries",
      detail: { queries: [{ q: qFor("landed_city"), metadata: { kind: "landed_city", objectId: "ship-a", tileKind: "city", tileColumn: "C", tileRow: 4 } }] },
      raw: { input: groundings[1].patches, output: qFor("landed_city") },
      world: worlds[2],
      delta: { tone: "info", label: "继续设想", text: "城市生命暂为 3，下一步才预演伤害。" },
    },
    {
      id: "city-damage-complete",
      number: 10,
      stageId: "continuation",
      eyebrow: "明确停止",
      title: "城市生命 3 → 2，设想在 complete 边界停止",
      summary: "城市伤害轨迹通过激活与关系核对，grounding 读取 city.health，提交伤害补丁；规则声明此分支已经完成。",
      decision: "这条自动后果链是否还应继续？",
      outputHeadline: "complete · city HP 3 → 2",
      outputNote: "最终 imaginedWorld 发生变化，但输入的 observedWorld 经程序校验完全未变。",
      checks: ["停止原因明确可审计", "设想注意力消耗 3.6 / 20", "observed_world_unchanged = true"],
      detailKind: "finish",
      detail: {
        activations: activationRows(result.trace, 2),
        grounding: groundings[2],
        boundary: finalBoundary,
        attentionAccount: result.attentionAccount,
      },
      raw: { input: qFor("landed_city"), output: { grounding: groundings[2], boundary: finalBoundary, result: { status: result.status, reason: result.reason } } },
      world: worlds[3],
      delta: { tone: "gain", label: "设想完成", text: "imaginedWorld 城市生命变为 2；observedWorld 仍为 3。" },
    },
  ];

  return {
    schema: "imagination_pipeline_walkthrough_v0",
    generatedAt: new Date().toISOString(),
    meta: {
      title: "模拟玩家 · 设想流水线",
      subtitle: "问题 1—6 拼接的可交互审计 walkthrough",
      baseline: "53367a4",
      sourceExperiment: "imagination_pipeline_v0",
      status: result.status,
      observedWorldUnchanged: result.observedWorldUnchanged,
      formalPlayerModified: false,
      encoder: "deterministic_test_encoder",
      scope: "单候选动作 · 微型同构案例 · 隔离实验",
    },
    scenario: {
      label: "放骰 → 下降 → 箭头横移 → 城市受伤",
      action: scenario.action,
      goal: scenario.goal,
      observedWorld: clone(scenario.world),
    },
    stages,
    steps,
    trace: result.trace,
    result: {
      status: result.status,
      reason: result.reason,
      observedWorldUnchanged: result.observedWorldUnchanged,
      imaginedWorld: result.imaginedWorld,
      attentionAccount: result.attentionAccount,
    },
  };
}

function writeWalkthroughData() {
  const data = buildWalkthroughData();
  const jsonPath = path.join(__dirname, "walkthrough-data.json");
  const jsPath = path.join(__dirname, "walkthrough-data.js");
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    jsPath,
    `"use strict";\nwindow.IMAGINATION_WALKTHROUGH_DATA = ${JSON.stringify(data, null, 2)};\n`,
    "utf8",
  );
  return { jsonPath, jsPath, data };
}

if (require.main === module) {
  const written = writeWalkthroughData();
  console.log(JSON.stringify({
    schema: written.data.schema,
    stepCount: written.data.steps.length,
    status: written.data.result.status,
    observedWorldUnchanged: written.data.result.observedWorldUnchanged,
  }));
}

module.exports = { buildWalkthroughData, writeWalkthroughData };
