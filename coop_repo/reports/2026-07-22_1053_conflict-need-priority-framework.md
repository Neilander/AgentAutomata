# Agent Handoff：权谋矛盾与需求优先级框架

- Date: 2026-07-22
- Agent/thread: Codex / root
- Scope: 在无限刷装阶段事件框架中记录权谋矛盾模型并给出推演样例
- Status: partial

## User Intent

用户将“矛盾”指定为权谋游戏的第一项核心设计：矛盾由多方、各方需求、需求优先级和对应的需求价值构成；玩家可以通过提供高价值替代满足改变势力行为和剧情。用户要求记录该原则并设计几个矛盾样例。

## Completed

- 在阶段事件框架中新增“权谋基础：矛盾”章节。
- 记录多方、需求集合、需求优先级、需求满足价值和可替代性五项基本构成。
- 用工作表达区分需求权重与具体结果的满足幅度，使“大量金钱可以压过较高优先级的复仇需求”在规则上成立。
- 增加底线需求、可交易需求、有上限需求和象征性需求的边界，避免无限金钱解决所有问题。
- 明确系统可以保存内部数值，但玩家应通过行为、证据、交易和试探理解需求，而不是直接读取数字。
- 新增复仇雇佣、矿脉墓地、圣物俘虏围剿、城门粮食四组非定案推演样例。

## Files Changed

- `projects/western_fantasy_continent/design/infinite_loot_stage_event_framework_v0.md`：新增矛盾模型、玩家接触方式和四组推演样例。
- `coop_repo/reports/2026-07-22_1053_conflict-need-priority-framework.md`：新增本次协作报告。
- `coop_repo/LATEST.md`：更新最新协作入口。
- `coop_repo/REPORT_INDEX.md`：登记本次报告。

## Validation

- Markdown 人工检查：PASS；已区分优先级、满足价值、风险和底线需求，四组样例均包含多方及多种可改变局势的杠杆。
- `git diff --check`：PASS；仅出现 Windows 换行提示，无空白错误。

## Current State

设计文档现在同时记录阶段事件类型和权谋矛盾的最小模型。样例明确标记为非定案事件，尚未写入第一阶段正式事件池。

## Unresolved

- 优先级、满足价值、风险与底线阈值的最终算法未定。
- 玩家可见信息层和势力伪装需求的规则未定。
- 第一阶段实际矛盾数量及其与15行动点的结合方式未定。
- 具体势力、人物和事件仍待用户继续补充。
- 当前 worktree 仍为 detached HEAD，修改尚未提交。

## Recommended Next Step

继续由用户补充权谋与事件设计原则；待矛盾模型确认后，再将其中一组转化为第一阶段可选择事件，并检查是否真正改变后续状态而非只提供数值奖励。
