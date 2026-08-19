# Agent Handoff: UFS 矩阵规划玩家冻结评测

- Date: 2026-08-16
- Agent/thread: `/root`；独立审查：`/root/matrix_row_audit`、`/root/ufs_research_strategist`、`/root/ufs_survival_strategist`
- Scope: 接通矩阵行唤醒的公开/私有边界，建立不读隐藏随机数的 UFS 程序玩家，并将冻结最终胜率提升到至少 30%
- Status: complete

## User Intent

让 AI 真正玩程序版 UFS，在不接触玩家不该知道的信息的前提下，通过可审计迭代把胜率提升到至少 30%，并尝试 50%；多个子 Agent 可以并行审查或试玩，但完成后必须关闭。

## Completed

- 建立稳定知识行 `W001–W008`：Agent 只返回“矩阵行号＋当前事实举证”，隐藏 payload 才保存下一动作；禁止 Agent 返回 `action/emit/nextAction`。
- 建立公开试玩 API：玩家只见公开状态和合法动作；隐藏种子、RNG、历史内部事件、未来骰子、候选未来状态和标准答案。
- 建立回合内 beam 规划玩家；白骰落下后按真实公开结果重新规划，但预想阶段不调用该局 RNG。
- 统一规划和实战的飞船出生列策略，消除“计划世界”和“执行世界”不一致。
- 把研究 15/16 改成尚欠最后 11 点的终局状态；价值取决于多格研究室是否解锁、能源是否够、房间是否真能完成、母舰还剩多少安全阶段。
- 冻结后只运行一次最终 100 局：58 胜、42 负，胜率 58%。
- 三个子 Agent 均已完成；当前没有遗留运行中的子 Agent。

## Files Changed

- `.../action_attention_chain_v0/row_wakeup_v1/`: 稳定矩阵知识行、公开触发/私有动作拆分、举证校验及 12 项测试。
- `.../standard_rules_v1/matrix_planning_player_v0/player-api.js`: 玩家公开观察与合法动作边界。
- `.../standard_rules_v1/matrix_planning_player_v0/beam-player.js`: 回合规划、统一出生策略和终局可兑现度。
- `.../matrix_planning_player_v0/test-planner-structure.js`: 最后 11 点、深层三格房、能源和安全回合定义测试。
- `.../matrix_planning_player_v0/FROZEN_FINAL_EVAL.md`: 最终评测前冻结哈希与信息边界。
- `.../matrix_planning_player_v0/artifacts/final-100-results.json`: 冻结 100 局结果。
- `.../matrix_planning_player_v0/README.md`: 中文结果与风险说明。

## Validation

- 矩阵行唤醒：12/12 通过，8 个稳定知识行；公开行哈希 `f6f8d47f5307cc1b7a4e9514d492f53b32a85b4db21aca42b7d537b21c50e0fc`。
- 公开 API：通过；开局 66 个公开合法动作，观察中无 seed/RNG 字段。
- 规划结构测试：通过；研究 15 尚欠 11，挖掘 18 解锁三格研究室，母舰第 8 行有 2 个安全阶段。
- 小样本 8 局：4/8，50%。
- 训练 30 局：22/30，73.3%。
- 独立开发 30 局：19/30，63.3%；旧版为 9/30，30%。
- 冻结最终 100 局：58/100，58%；失败原因：母舰骷髅 28、城市毁灭 14。
- 最终策略哈希在评测后保持为 `6681eebdf16b7709d176bc3bc839d3f6215bfea69b4497c6be313de09ad1fd0d`。

## Current State

目标已超过：最终冻结胜率不只是 30%，而是 58%。本轮最重要的成果不是单一数字，而是证明了一个只读取玩家可见信息、会把“终局条件能否兑现”纳入当前选择的规划 MindToy 可以实际跑完整局 UFS。

## Unresolved

- 白骰未来仍用固定 `3/4` 近似，不是正式 chance node；存在顺序偏差与风险低估。
- 当前主要是一回合搜索，尚未加入下一回合随机 afterstate。
- 防空、战机与批量出生尚未按精确反事实统一估值。
- 最终 42 局失败中仍有 28 局母舰骷髅，说明时间风险没有完全解决。
- 地图是用户录入的可运行版，未逐格独立核对官方材料。
- 当前胜率验证的是程序规划玩家；矩阵“行号＋举证→隐藏动作”的完整 LLM 在线回合循环已做隔离测试，但还未成为 100 局主策略的每步决策器。

## Recommended Next Step

先停在这个可验收版本。若继续提高拟真度，优先把白骰改为与 episode seed 无关的分层 chance node，并为前 16–32 个回合末状态增加一回合风险 afterstate；不要先继续微调固定分数。
