# Agent Handoff: 基于玩家已学知识的猜角色 V1

- Date: 2026-08-01
- Agent/thread: Codex 主任务，独立 worktree `logs/fb2`
- Scope: 冻结22场角色认知、GTE模糊问题理解与13候选猜角色
- Status: complete with limits

## User Intent

先不做庞大的队伍组合和明日方舟外部验证。使用此前完成的角色强度富集、前30%标尺和特点知识，验证玩家能否通过简单文本知识快速调取候选，并用“比牧师更擅长治疗吗”等相对线索缩小猜测范围。

## Completed

- 只读复查并重新运行旧同步矩阵与三独立标尺；确认当前代码仍保持顺序无关的全局求解、前30%边界以及输出/保护/增益独立更新。
- 确认旧22场冻结数据包含10名英雄、3类民兵、88个角色战斗样本和2219条可见事件。
- 新增导出器，在认知worktree中重放冻结战斗，只抽取玩家已学知识；不复制巨大session，不读取设计师隐藏数值。
- 为13个候选导出32条粗能力认知和16条细特点认知；角色名、职业不进入GTE检索文本。
- 建立七类自然语言方向：总体输出、总体保护、增益、治疗、护盾、群体输出、持续输出。
- GTE对21种问法Top-1方向正确15条、Top-2包含正确方向19条、Top-3包含20条；20条落在正确语义家族。
- 在强制只取Top-1方向的压力条件下，最多6条相对线索后13个目标Top-3/Top-5召回100%，Top-1为8/13，平均名次1.46。
- 治疗知识缺失的9个角色保持未知和中性权重，没有被当作零删除。

## Files Changed

- `projects/western_fantasy_continent/experiments/learned_role_guess_v1/export-learned-role-memory.js`：从冻结22场重放并导出玩家知识。
- `projects/western_fantasy_continent/experiments/learned_role_guess_v1/run_experiment.py`：GTE方向理解、相对线索更新和13目标测试。
- `projects/western_fantasy_continent/experiments/learned_role_guess_v1/test_role_guess.py`：数据边界、去名称先验、未知保留和治疗/保护分离回归。
- `projects/western_fantasy_continent/experiments/learned_role_guess_v1/run-local.ps1`：完全离线运行入口。
- `projects/western_fantasy_continent/experiments/learned_role_guess_v1/artifacts/`：冻结玩家知识与完整结果。
- `projects/western_fantasy_continent/experiments/learned_role_guess_v1/README.md`、`RESULTS.md`：实验边界、结果和下一步。

## Validation

- `node test-strength-cognition-matrix.js`：PASS；20人边界6，加3强者边界8，加10弱者边界4，旧角色认知3→1/5，反转证据顺序最大差0。
- `node test-independent-capability-cognition.js`：PASS；输出、保护、增益独立更新。
- `powershell -ExecutionPolicy Bypass -File .\run-local.ps1`：PASS。
- Python专项：4项通过。
- GTE完全离线加载；问题Top-3方向召回20/21，角色Top-3召回13/13。
- 根main与另一个agent的游戏文件没有被修改。

## Current State

GTE现已从“直接给角色算最终答案”收束为快速知识方向检索器：自然语言问题匹配角色认知中的粗能力或细特点，旧代码拥有的连续认知位置负责大小关系，未知信息保持未知。它可以把候选压到少数几个，再交给详细记忆和MindToy。

## Unresolved

- 当前问法与方向文本由本实验编写，不是独立人类语料盲测。
- 总体输出/持续输出、总体保护/治疗/护盾存在合理的粗细重叠；当前硬Top-1解释不应直接成为正式实现。
- 线索答案和候选坐标来自同一份玩家认知，只验证内部一致性，不验证对未见战斗的真实效用。
- 13个候选规模较小；队伍组合将产生足够大的后续空间，但需要单独建模组合关系和未发挥特点。

## Recommended Next Step

开发隔离的真实换人实验：冻结历史知识，固定三人和一个换人槽，在未见敌队/种子上让知识库提出需求、GTE召回Top-3，再由真实战斗判定是否存在可行解。首先比较随机、旧三标尺、GTE+旧认知三条基线；不要先扩到完整队伍枚举。
