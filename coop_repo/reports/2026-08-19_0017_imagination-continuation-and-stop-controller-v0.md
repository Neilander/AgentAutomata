# Agent Handoff: 连续设想与停止控制器 v0

- Date: 2026-08-19
- Agent/thread: /root
- Scope: 五槽轨迹唤醒后的连续粘连、停止边界、注意力消耗与临时目标
- Status: complete (isolated module)

## User Intent

开发连续设想的结束条件：确定后果继续粘连；随机、知识不足、玩家选择或注意力耗尽时停止；每个内部注意点都消耗注意力，熟悉轨迹成本较低。目标先保存成对象、状态、期望变化和紧急度，之后再替换完善。

## Completed

- 新增隔离的`ImaginationContinuationController`，接收上游已召回且已举证的轨迹后果，不重复承担记忆召回或游戏执行。
- 结构门支持`automatic / choice / random / unknown / complete`；并行后果分别处理，随机分支不会取消同时存在的确定分支。
- 认知门逐个消耗轨迹内部注意点；预算不足输出`attention_stop`且不生成尚未想到的后继事件。
- 熟悉度降低每个注意点成本但保留最低成本，避免熟练行为变成零注意。
- 临时`GoalSpec`保存对象概念、状态概念、期望方向、紧急度和时间范围；直接目标匹配只调整并行后果的处理顺序，机会和威胁都会获得高相关度。
- 正常结束必须有明确`complete`轨迹；完全没召回到东西被判为`unknown`，不会把记忆缺失误当作安全。
- 加入事件/后果重复保护和最大处理量技术保护，避免错误轨迹形成无限粘连。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/imagination_continuation_v0/continuation_controller.py`: 控制器、数据合同、目标匹配和注意力账本。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/imagination_continuation_v0/test_continuation_controller.py`: 10项隔离测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/imagination_continuation_v0/run_demo.py`: 六个UFS情景验证。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/imagination_continuation_v0/run-local.ps1`: 可复跑入口。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/imagination_continuation_v0/README.md`: 中文边界说明。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/imagination_continuation_v0/artifacts/validation.json`: 完整验证轨迹。

## Validation

- 新控制器测试：10/10 PASS。
- Python语法编译：PASS。
- 旧规则轨迹编译器回归：11/11 PASS，真实GTE改写10/10。
- 旧UFS注意力空间回归：12/12 PASS。
- 12注意力、熟悉度0.4：放骰→下降→箭头→城市→伤害完整设想，消耗5.328，无边界。
- 2.2注意力、熟悉度0.4：下降后在后续内部注意点停止，消耗1.924，输出`attention_stop`。
- 4注意力、熟悉度1.0：同一完整链只消耗2.52，成功想完；证明熟悉度降低成本但未归零。
- 白骰情景：随机重掷输出`random`，飞船下降分支仍继续并明确完成。
- 陌生母舰图标输出`unknown`；出生列平局输出`choice`。
- 目标优先单测：保护城市目标在有限预算下先检查较低语义激活的城市伤害威胁，再因预算不足漏掉无关资源分支。

## Current State

连续设想的控制逻辑已经隔离跑通，并且能表达一条动作同时产生多个不同边界。目标结构已保存为可替换接口，当前只做直接概念匹配，没有把临时实现误当成最终规划模型。

## Unresolved

- 尚未接入真实五槽记忆召回结果；当前UFS演示用手工构造的“已召回且已举证后果”验证控制逻辑。
- 规则阅读器还没有统一生成`kind`和内部注意点合同；现有规则数据只部分带有`outcomeKind`、`unresolved`和停止信息。
- 熟悉度尚未由真实轨迹`support/observations`换算；注意力成本参数仅为结构脚手架，未做人体标定。
- 当前`AttentionAccount`是设想阶段的消耗账本，尚未与153项状态注意力模块的“看见容量”共享总预算。
- 目标匹配目前为精确概念相等；间接目标路径和向量语义匹配留给规划模块。

## Recommended Next Step

先明确规则阅读输出如何给每条五槽边标注`kind`和内部注意点，再做一个薄适配器，把真实`RuleTrajectoryDraft/WakeupCandidate`转换为`GlueOutcome`；用放骰→飞船→箭头→城市真实链验证，而不是继续调整注意力参数。
