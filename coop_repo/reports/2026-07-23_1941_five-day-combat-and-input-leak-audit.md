# Agent Handoff: 五日战斗与模拟输入泄漏审计

- Date: 2026-07-23
- Agent/thread: Codex `/root`
- Scope: `projects/western_fantasy_continent/five_day_guard_raid/`
- Status: partial

## User Intent

核查五日程序是否错误地把战斗退化为战力比较，确认是否遗漏项目既有正式战斗运行时，并逐字段检查两轮模拟玩家输入和“学会了什么”的结论是否受泄漏或评测脚手架污染。

## Completed

- 确认五日版没有接入 `game_data/combat-sim.js`；六个事件挑战、三个战斗终局和荣誉决斗仍使用标量门槛/分数比较。
- 审计两轮共 52 次 decision request 和 52 次 attribution request。
- 确认每次 decision request 都错误暴露 `discover_new_capabilities`；Run 1/2 各有 13 次决策实际选择该评测目标。
- 区分直接答案泄漏、模拟画像/回复合同的实验诱导、合法可见成本与世界内信息。
- 撤销旧报告中免费刷图、队伍协作、资源迁移、身份词条、战斗配队等未经干净迁移验证的“已学会”结论。
- decision request 现已过滤评测目标，并拒绝 Agent 返回评测目标。
- decision request 不再发送知识检索调试审计，回复合同也不再强制 `affordance` 术语。
- 守炉、冷却阀和军需车失败文案改为可观察物理现象，删除标量门槛和设计师路线解释。
- 新增正式玩家输入边界回归。

## Files Changed

- `projects/western_fantasy_continent/five_day_guard_raid/FORMAL_PLAYER_INPUT_AUDIT.md`: 完整记录字段审计、污染证据和逐条学习结论。
- `projects/western_fantasy_continent/five_day_guard_raid/five-day-formal-player-loop.js`: 隔离并拒绝评测目标。
- `projects/western_fantasy_continent/five_day_guard_raid/five-day-raid-core.js`: 删除结果文案中的标量门槛和路线结论。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-formal-player-input-boundary.js`: 新增输入与可见结果边界回归。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-formal-player-loop.js`: 回归改为匹配物理失败信号并拒绝标量解释。

## Validation

- `node .../verify-formal-player-input-boundary.js`: PASS；仅 `grow_and_progress` 可见，评测目标被拒绝，失败仅输出物理现象。
- `node .../verify-formal-player-loop.js`: PASS；3 周期、6 个 API 边界调用、重复失败仍可见。
- `node .../verify-sealed-player-observation.js`: PASS；身份结果封口。
- `node .../verify-five-day-raid.js`: PASS；机械路线未回归。
- `node .../experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS；项目正式认知入口未回归。

## Current State

模拟输入中最严重的评测目标泄漏和三个设计师解释式文案已封住。两轮旧原始档案仍完整保留，并明确降级为污染审计证据。现有程序仍不具备可接受的战斗验证，因为五日节点尚未接入共享正式战斗运行时。

## Unresolved

- 五日战斗尚未接入 `game_data/combat-sim.js`；不得再做战斗认知或配队学习结论。
- 旧两轮使用单一高探索 `open_novice`，不满足项目多画像验证要求。
- 强制逐行动归因与 affordance 回复格式属于实验诱导；后续必须靠无提示跨情境行为验证学习。
- 情报日志声称四条弱点持续可见，但态势板只显示名单，存在反馈不一致。
- 两轮旧档里已经出现的身份/门槛泄漏不会改写或删除，只能从新版本重新跑。

## Recommended Next Step

先建立五日角色、敌军、装备和世界准备项到 `combat-sim.js` 的适配层，把守炉、军需车、擂台、剑士、断角兽、夜袭、终战和决斗全部换成真实战斗；再冻结输入合同，用多个持久玩家画像从零重跑。
