# Agent Handoff: UFS自动逐步Q轨迹接入

- Date: 2026-09-01
- Agent/thread: Codex `/root`
- Scope: 把隔离实验中的逐步Q滚动接入真实认知会话，并修复母舰下降后的认知状态缺口
- Status: complete

## User Intent

把此前手工编写`predicted Q1`的逐步规划实验改成自动轨迹：每一步由当前玩家认知会话真实执行GTE唤醒和JSON认知程序，自动形成新Q，再用新Q校验下一步锚点；不能继续拿旧Q0评价后续动作。

## Completed

- 将逐步滚动器提升为认知核心可复用模块；旧V1实验改为复用该模块，避免两份实现漂移。
- 新增自动适配器：在隔离的认知checkpoint fork里执行操作，收集本步真实唤醒的五槽Q前/Q后轨迹、认知补丁、公开状态摘要和指定观察；不调用正式规则oracle，也不修改真实会话。
- `UfsFullGameAttentionSession.imagineSequentialPlan()`提供只读调用入口；CLI新增`imagine-sequence <state-dir> <sequence.json>`。
- 修复即时母舰下降的认知状态转移：母舰到达新行后，通用地收回该行全部飞船到等待区，并在认知trace中记录`transitionConsequences.collectedShipIds`。此前只改变`mothershipRow`，导致研究分支脑内错误保留`purple-2`。
- 在真实UFS post-reroll检查点（attention seed `2026082504`，公开随机灰5/白6）完成两路验收：
  - `研究→防空`：第一步自动唤醒3条轨迹；Q1中`purple-2`已离开`ships`并进入`waitingShips`，第二步锚点自动失效，状态为`invalidated`，不会设想或执行无效防空。
  - `防空→研究`：第一步自动把`purple-2`预测为第4行，第二步继承该Q1并继续研究；两步共自动收集4条真实GTE轨迹，状态为`complete`。
- 两路关键预测都逐步提交到正式host核对：研究后紫船确实进入等待区且母舰到0；防空后紫船确实到第4行。
- 更新旧反馈测试：原先故意记录的母舰收船认知/正式不一致现已变为一致。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-sequential-q-rollout.js`: 可复用的`Q0→A1→Q1→A2`滚动与锚点校验器。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-automatic-sequential-imagination.js`: 真实认知fork、自动轨迹收集、Q链和只读结果封装。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: 新增会话级只读自动序列设想入口。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: 新增`imagine-sequence`命令。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-first-action-imagination.js`: 补齐母舰落行收船的通用认知状态转移。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-automatic-sequential-imagination.js`: 真实检查点两路自动Q链、只读性和正式逐步对照。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-feedback-bridge.js`: 将旧的已知认知不一致断言更新为修复后的匹配断言。
- `projects/western_fantasy_continent/experiments/ufs_live_ai_sequential_rollout_round_v1/sequential-q-rollout.js`: 复用核心滚动器。

## Validation

- 聚焦自动链、反馈桥与旧V1滚动器：14/14通过。
- 完整UFS认知、玩家、反馈、程序库及V1回归：182/182通过。
- 真实检查点只读断言：`imagineSequentialPlan()`前后完整live checkpoint逐字段相同。
- 正式对照：研究优先分支预测/正式均为`purple-2`不在活动飞船、存在等待区、母舰行0；防空优先分支预测/正式均为`purple-2`第4行。

## Current State

逐步设想已不再依赖手写Q1：候选操作序列中的每一步都会在真实认知fork中唤醒GTE/程序、产生新的脑内世界和五槽轨迹，并以这个新Q校验下一步。旧的“研究之后仍拿Q0里的紫船评价防空”会被自动截断。

这次没有改初始化玩家生成器、玩家档案格式或正式游戏引擎；fresh玩家隔离与冻结资产指纹测试仍通过。正式oracle只用于测试阶段事后核对，不进入自动设想结果。

## Unresolved

- 当前入口自动生成每一步的Q与轨迹，但`steps[]`候选序列仍由上层规划/Agent提供；尚未自动生成切入口、候选动作或替换默认`planCurrentChoice()`。
- 母舰落行收船作为认知状态转移的通用后果执行，并记录在`transitionConsequences`；即时下降的原五槽轨迹补丁本身仍只描述母舰移动，没有单独增加一条“收船”五槽轨迹。
- 这里只验证一个真实回合切点的两条两步分支；尚未证明更长序列、随机边界后的恢复或整局胜率提升。

## Recommended Next Step

把上层切入口生成器给出的少量高价值动作锚点转换成`steps[]`候选，对每个候选调用`imagineSequentialPlan()`；候选一旦`invalidated/paused_uncertain`就重规划，只有`complete`分支进入跨切入口比较。先在同一post-reroll检查点做2—3个自动候选序列，不要立即接管整局默认planner。
