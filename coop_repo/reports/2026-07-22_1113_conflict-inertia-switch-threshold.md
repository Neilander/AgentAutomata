# Agent Handoff：矛盾惯性与转向阈值

- Date: 2026-07-22
- Agent/thread: Codex / root
- Scope: 将人物与势力惯性加入权谋矛盾模型
- Status: partial

## User Intent

用户补充：人存在惯性，因此新方案的收益可能需要远超当前第一优先级，例如高出50%，才能让人物或势力改变立场。

## Completed

- 将“惯性与转向阈值”加入矛盾的正式构成。
- 区分需求优先级、限制与惯性：分别回答想要什么、能不能做、是否值得改变现状。
- 记录“新方案净价值至少达到当前方案1.5倍”作为待验证的50%候选门槛，不将其冒充统一定值。
- 记录公开承诺、沉没投入、不确定性、身份认同、不信任和组织协调六类惯性来源。
- 记录失败、公开宣誓、担保、保留颜面和个人/组织转向对惯性门槛的动态影响。
- 用收买B放弃杀A的例子说明：略高报价不足以转向，玩家需要组合金钱、信誉、安全和可验证承诺跨越门槛。

## Files Changed

- `projects/western_fantasy_continent/design/infinite_loot_stage_event_framework_v0.md`：新增惯性与转向阈值章节。
- `coop_repo/reports/2026-07-22_1113_conflict-inertia-switch-threshold.md`：新增本次协作报告。
- `coop_repo/LATEST.md`：更新最新协作入口。
- `coop_repo/REPORT_INDEX.md`：登记本次报告。

## Validation

- Markdown 人工检查：PASS；已将前文“新方案价值超过旧方案”修正为仍需跨越惯性门槛，避免模型自相矛盾。
- `git diff --check`：PASS；仅出现 Windows 换行提示，无空白错误。

## Current State

权谋矛盾模型现在包含多方需求、需求价值、限制和惯性。50%仅为候选转向尺度，尚未冻结计算基准与个体差异。

## Unresolved

- 惯性使用当前方案总价值还是第一优先级价值作为基准未定。
- 50%门槛是否通用、按人物变化或按状态变化未定。
- 个人与组织的惯性聚合规则未定。
- 当前 worktree 仍为 detached HEAD，修改尚未提交。

## Recommended Next Step

继续记录用户补充的权谋原则；之后用同一矛盾分别测试无惯性、低惯性和高惯性人物，检查转向是否符合直觉。
