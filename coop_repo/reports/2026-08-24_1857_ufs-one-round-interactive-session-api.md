# Agent Handoff: UFS逐choice交互会话操作口

- Date: 2026-08-24
- Agent/thread: `/root`
- Scope: `simulatePlayer` worktree；一回合脑内设想控制接口
- Status: complete

## User Intent

把“一次提交整回合选择表”改成真正暴露给AI的逐步操作口：AI每次根据当前环境规划并执行一个动作，程序结算自动后果、返回新的玩家脑内环境，AI再规划下一步；随机、未知和玩家选择必须形成真实暂停边界。

## Completed

- 新增`UfsOneRoundSession`，外部合同为`start(initialState) → advance(operation) → response`。
- 当前操作口：`place_die`、`submit_random_observation`、`resolve_room`、`excavate`、`skip_worker`、`end_rooms`、`choose_spawn`。
- `start`只返回当前脑内环境和`place_die`；每次放骰只执行该动作及确定自动后果，然后回到下一选择。
- 白骰边界只开放`submit_random_observation`；此时调用放骰会返回`rejected`且checkpoint不变。随机值仍必须由外部公开观察提供。
- 五骰完成后自动切换为房间操作口；`resolve_room`要求显式`pay:true`，不支付必须走独立的`skip_worker`。
- 母舰自动阶段会连续运行；生成存在并列时只开放`choose_spawn`，选择后继续到下一并列或回合完成。
- 每次响应包含新的玩家脑内`observation`、`status/reason`、`pending`、`availableOperations`、`traceDelta`、动作计数和纯JSON checkpoint。
- checkpoint包含公开初始状态、地图、已执行操作与已观察随机值，可JSON序列化后跨进程恢复；专项从第一次白骰暂停点恢复并继续成功。
- 错误阶段操作、缺参数、非法对象和非法生成点被拒绝，拒绝不提交动作、不改变checkpoint。
- 原批量`UfsOneRoundImagination.run`保持兼容；新增`allowPartialScript`只供会话内部在下个choice处暂停。旧固定回归仍使用原标签和结果。
- 隔离Agent实验driver已改为13次真实逐步调用：5次放骰、2次随机观察、5次房间操作、1次生成选择。每次收到新响应后才提交下一操作，不再把完整选择表一次传给控制器。
- 重新生成机器trace；正式引擎仍只在单独事后oracle审计中使用。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-session.js`: 会话、操作口、拒绝原子性、环境响应和checkpoint恢复。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-imagination.js`: 可选partial边界和交互来源标签，同时保持批量兼容。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-session.js`: 单操作推进、随机门、checkpoint、拒绝不变性、支付与依赖隔离。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 会话API、操作口和内部边界。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/run-autonomous-round.js`: 从整表编译复放改为逐次`start/advance`。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/test-autonomous-round.js`: 逐操作与两次随机暂停审计。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/machine-trace.json`: 新会话运行trace。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/README.md`: 更新当前已逐步化的事实与剩余脚手架。

## Validation

- 会话专项：6/6 PASS。
- 更新后的隔离Agent逐步driver：7/7 PASS。
- 相关完整Node回归：97/97 PASS。
- Python完整注意回归：14/14 PASS。
- 13次操作顺序：5放置 + 2外部随机观察 + 5房间操作 + 1生成选择，最终`complete/new_round`。
- 随机门：2/2必须先停在`random`，其他操作被拒绝。
- JSON checkpoint：随机边界序列化/恢复后骰值3与5正确进入新环境。
- 拒绝原子性：错误阶段、非法对象和`pay:false`均不改变checkpoint或动作计数。
- 事后formal oracle：5/5放置、5/5房间动作、2/2随机观察匹配，最终状态一致。
- 会话核心依赖审计：不导入`standard-engine`、`scenario-fixtures`、`one-round-fixture`或`ROUND_ONE_SCRIPT`。
- `git diff --check`: PASS（仅既有LF/CRLF提示）。
- 基线：`53367a4`仍是`simulatePlayer` HEAD `8895f8c`祖先；未使用旧fb2或fifteen-day-web。

## Current State

现在程序已经按用户要求暴露“AI决定一个操作→程序返回新环境→AI再决定”的接口。旧子Agent选择被用于接口复放验证，但不再一次性提交给认知控制器；随机和生成选择都是真实暂停。

## Unresolved

- 当前driver的决定仍来自冻结的11张判断卡，并未在每个响应处实时调用新的AI模型；接口已经准备好，策略回调尚未接入。
- 会话V0内部从checkpoint确定性复放历史再推进一步，以复用已验证控制器；外部语义正确，但长回合性能为重复计算。后续可优化成原地状态机而不改变API。
- 操作口提供动作类型与拒绝校验，尚未提供通用的认知候选枚举；AI仍需自己从地图/知识提出参数，非法参数会被拒绝。
- 返回的是持续的玩家脑内世界，不是正式引擎真值；下一次实时AI实验还需明确如何结合该脑内世界、当前noticed集合与判断知识，避免策略层绕过注意。

## Recommended Next Step

用新的session接口重新派一个隔离Agent：每次只给它当前response，让它现场返回一个operation，再把新response发回，直到`complete/unknown/attention_stop`。不要再给整回合判断表；保留本次13操作序列作为接口回归对照。
