# Agent Handoff: UFS放置时的多步延迟收益

- Date: 2026-08-17
- Agent/thread: `/root`
- Scope: 让一次骰子放置同时预想即时天空后果和未来房间阶段收益
- Status: complete（当前状态投影；不是完整五骰联合计划）

## User Intent

玩家放置骰子时不应只注意飞船下降，还应注意骰子留在房间后，在未来房间阶段可能获得的能源、研究、击毁、挖掘或组合准备收益。

## Completed

- 公开地图补入基地房间、房间修正/能源成本、研究轨道成本和挖掘起点。
- 五槽规则库由6条增至12条，新增能源、研究、战斗机、挖掘、多格房未完成和无延迟收益六类轨迹。
- 每个放置现在产生两条并行注意链：即时天空链与未来房间链；两条都必须经过五槽Top-3唤醒和公开事实二次校验。
- 单格完整房投影当前可兑现的能源变化、研究推进和可击毁飞船；挖掘格投影1能源成本和路径推进距离。
- 多格房只记录`setupProgress=1`以及仍需填满其他格，不提前发放房间收益。
- 白骰仍只知道会重掷，不知道未来点数。
- `PlanningGoal`在原风险特征外加入能源变化、研究推进、击毁数、挖掘推进和组合准备价值；权重为测试用显式参数，不是玩家自然学出的偏好。
- 事后验证器把每个候选放置后强制进入房间阶段，只用于核对当前投影，绝不回流给玩家选择。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/rule_trajectories.json`: 新增六类未来房间轨迹。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/ufs-public-bridge.js`: 公开房间/研究结构及房间阶段反事实核验。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/one_turn_player.py`: 未来分支绑定、房间值投影、研究/战斗/挖掘计算和扩展目标比较。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/run_validation.py`: 同时核对208个即时状态与208个延迟收益。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/README.md`: 更新运行结果与边界。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/artifacts/validation.json`: 最新机器可读验证结果。

## Validation

- 轻量单元测试3/3，真实GTE正式验证通过。
- 3个真实开局、208个合法放置，产生704次记忆唤醒。
- 未来分支实际唤醒：多格房准备30、挖掘43、战斗机15、无额外房间收益105、研究15；当前开局没有完整单格能源房，因此能源兑现轨迹未被触发。
- 208个即时公开战略状态与事后引擎一致。
- 208个延迟收益特征与“放置后立即进入房间阶段”的引擎反事实一致。
- 向量检索仍最多只给Top-3；547次选中Top-1，157次选中Top-3。
- 选择发生实质变化：旧安全目标三个开局均选最小下降的防空格；加入延迟收益后，一个开局选择6点骰挖掘6格，另两个选择研究房，以飞船下降4格和2能源换取研究推进2格。

## Current State

一次放置的预想现在是并行的：

`放置 → 同列下降 → 天空落点后果`

以及：

`放置 → 骰子占据房间 → 未来是否完整/可支付 → 能源、研究、战斗、挖掘或组合准备`

最终比较读取两条链的合并特征，因此玩家不再只追求眼前安全。

## Unresolved

- 延迟收益是“后续相关状态不变并立即结算”的当前投影；真正放完其余骰子后，飞船位置、能源、研究顺序和多格房完整性可能变化，必须重新规划。
- 多格房目前只有准备价值1，没有根据剩余骰子和可完成概率估计最终组合收益。
- `PlanningGoal`权重仍为显式测试参数：研究每步12、挖掘每格4等，不是玩家性格、稀缺度或经历自动生成。
- 初始三个场景未触发能源房兑现和撞城。
- 尚未连续执行5次放置；因此还没有验证“第一步为未来房间下注，后续是否真的完成计划”。

## Recommended Next Step

让同一个玩家连续放置5颗骰子。每次放置后重新计算：已经占据哪些房间、多格房还缺哪些格、当前能源是否足够、研究收益是否改变，并观察它会不会兑现第一步形成的房间计划。
