# EDecision、决策质量与掌控感统一设计

- Date: 2026-07-20
- Agent/thread: Codex 主任务
- Scope: EDecision、QDecision、deadRepetition、incomprehension、Agency与现有反馈模块的边界
- Status: complete（设计完成，未修改正式运行时）

## User Intent

结合此前V5 `P×Q` 的优点、当前正式EDecision、已经修好的R/A/C/EVerify，以及旧掌控感方案，形成一套完整、可开发、不会重复计算反馈的EDecision建模方案。

## Completed

- 明确EDecision只表示有效思考量，不表示正确性、掌控感或结果。
- 设计0至4步的程序验证顺序：问题、证据原因、行为比较、可验证因果假设。
- 设计QDecision，用证据贴合、行为杠杆、可验证度、区分度、有效修正，减去无意义重复和无法理解。
- 保留当前`0.04`尺度，暂定`DecisionFeedback = 0.04 × EDecision × QDecision`。
- 用`decisionIntent`和程序校验区分合理复验、探索与强反证后的原样乱试。
- 恢复旧Agency的Goal/ROI/path结构，但将其定义为分范围持续状态，不塞进EDecision。
- 增加`Stuckness = GoalPressure × (1 - Agency)`，表达“目标重要但看不到路”的真正卡住。
- 明确Agency战后只能通过EVerify更新后的知识重算，胜负不能直接提升掌控感。
- 给出20类隔离测试、影子运行、只接Q、再接Agency行为影响、最后章节测试的五阶段开发顺序。

## Files Changed

- `projects/western_fantasy_continent/design/EDECISION_PROCESS_QUALITY_AGENCY_V1.md`：完整中文设计、公式、边界、案例和开发顺序。
- `coop_repo/reports/2026-07-20_0142_edecision-process-quality-agency-design.md`：本次协调记录。
- `coop_repo/REPORT_INDEX.md`：登记新报告。
- `coop_repo/LATEST.md`：更新当前入口。

## Validation

- 设计边界逐项对照当前正式V27与旧V5：
  - 当前R/A/C/EVerify不被新EDecision重复计算；
  - 旧`deadRepetition`与`incomprehension`通过Q恢复；
  - 旧Agency的Goal/ROI/path结构被保留，但不再冒充即时情绪。
- 本轮未修改运行时代码，因此没有运行代码回归。

## Current State

现在已有一份可以直接进入隔离开发的方案。正式V27仍保持原样：EDecision仍是0/1/4并按每单位0.04产生固定过程反馈；新QDecision、Agency和Stuckness尚未接入。

## Unresolved

- Q权重和0.04尺度仍是待测试参数，不是真人常数。
- “相关变化”需要由当前角色三标尺、装备倍率、站位、环境和因果链共同判定。
- Agency是否产生极小即时缓解反馈应在影子结果后决定，第一版只记录状态。
- 不同玩家类型的复杂度与复验容忍度尚未校准。

## Recommended Next Step

按设计文档先开发隔离`decision-process-quality`计算器和20个确定性case；通过后再接正式V27旁路做影子记录，不直接改变Agent行为与情绪。
