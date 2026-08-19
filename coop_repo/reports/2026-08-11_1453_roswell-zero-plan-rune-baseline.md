# Agent Handoff: Roswell 零规划高维符文基线

- Date: 2026-08-11
- Agent/thread: root
- Scope: `under_falling_skies_planning_mind_toy_v0/standard_rules_v1/no_plan_rune_v0`
- Status: complete

## User Intent

在正式 Roswell 地图上故意完全不做规划：从规则形成当前知识，把每个合法选择转成 768 维坐标，并让每一步只通过高维符文匹配决定，以验证单步语义选择能走到哪里。

## Completed

- 新增隔离的零规划玩家；明确禁止路线、里程碑、假设、跨步记忆和多步搜索。
- 当前局面形成需求向量；候选动作的即时规则结果从零点累加成不归一化的 768 维坐标。
- 最终选择只使用 `需求向量 · 选项坐标`，没有额外标量效用函数。
- 新增真实规则实验和随机对照，使用同一批种子。
- 新增专项合同测试与中文结果说明。

## Files Changed

- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/no_plan_rune_v0/no-plan-rune-player.js`: 零规划高维选择器。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/no_plan_rune_v0/run-experiment.js`: 真实 Roswell 对照实验。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/no_plan_rune_v0/test-no-plan-rune-player.js`: 768 维、纯点积、无规划合同测试。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/no_plan_rune_v0/README.md`: 架构边界。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/no_plan_rune_v0/RESULTS.md`: 中文实验结论。

## Validation

- `node --check no-plan-rune-player.js`: PASS。
- `node --check run-experiment.js`: PASS。
- `node test-no-plan-rune-player.js`: PASS；768 维、同状态确定性、无规划字段合同均通过。
- `node test-standard-engine.js`: PASS，13 项。
- `node test-roswell-threat-0-map.js`: PASS，正式地图开局 68 个合法落点。
- `UFS_RUNE_SEEDS=30 node run-experiment.js`: 零规划 0/30 胜、平均 10.30 回合/研究 2.30/挖掘 3.30；随机 0/30 胜、平均 7.83 回合/研究 0.37/挖掘 1.90。

## Current State

高维符文已能在真实规则里完成局部语义匹配，而且明显优于随机；但无法自己构造完成科技轨道所需的跨步骤依赖链。这形成了干净、可复现的零规划基线。

## Unresolved

- 规则效果到概念位移的强度仍是固定知识参数，尚未从玩家战斗经验自动学习。
- 还未把真正的规划玩家接到同一张 Roswell 地图做直接对照。
- 本实验不是完整策略强度验证；0 胜是关键边界结果，不应通过暗加规划启发式掩盖。

## Recommended Next Step

在不改动本基线的前提下新增“初始计划、执行到底、不重规划”的玩家：先由 AI/规则知识生成一条带中间目标的计划，每一步仍调用同一个高维符文选择器，然后与本报告的 30 种子结果直接比较。
