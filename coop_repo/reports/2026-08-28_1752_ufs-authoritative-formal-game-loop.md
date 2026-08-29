# Agent Handoff: UFS正式游戏主循环

- Date: 2026-08-28
- Agent/thread: root / simulatePlayer
- Scope: 将完整试玩从连续`imaginedWorld`改为正式引擎权威host，并把实际反馈重新送回下一次脑内设想
- Status: complete

## User Intent

纠正完整试玩架构：AI先根据脑内状态设想并提交一个动作；正式游戏程序独立校验和结算，返回正确的新环境；注意力决定玩家看到哪些正式结果；下一次设想只能从这些反馈更新后的脑内认识开始。AI的错误预测绝不能修改真实棋盘。

## Completed

- 完整试玩的唯一host改为正式规则状态。合法操作、当前pending、随机边界、房间结算、研究选择、母舰阶段、飞船生成、下一回合与终局均由正式引擎产生。
- 认知一回合会话降为并行预测器：它可以形成正确、错误或缺失的五槽后果，但不能接受/拒绝正式操作，也不能决定下一环境。
- 玩家响应现在从正式状态经过161+项完整注意场产生，不再从`imaginedWorld`投影。
- 正式拒绝原子回滚并行脑内试算；认知预测器即使停止或拒绝，也不能否决正式引擎接受的合法操作。
- 正式结果经过注意后重建下一次脑内起点。全注意会完全纠正公开状态；概率注意只合并实际注意到的轨道和对象，允许没看到的错误认识保留。
- 认知运行时支持从`dice`或`rooms`玩家决策边界重新起步，房间阶段会从当前脑内放置重新形成房间记忆，不再要求从回合开头无限重放。
- 正式引擎新增延迟白骰随机与增量飞船生成接口，使外部随机、研究选择和逐架生成都由正式会话自行管理，而不是询问认知流程的pending。
- checkpoint升级到`ufs_full_game_attention_checkpoint_v1`，保存正式状态、认知状态、正式注意轨迹、反馈学习和最近一次行动前脑内试算；保留旧v0读取兼容。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: 正式host主循环、正式玩家响应、认知并行试算、反馈后脑内rebase、原子拒绝与checkpoint v1。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-formal-feedback-oracle.js`: 从结果旁路升级为权威正式游戏会话，独立生成pending和合法操作。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-imagination.js`: 允许从骰子或房间玩家决策边界开始下一次脑内设想。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-attention-player-session.js`: 恢复checkpoint时允许注入带学习overlay的认知runtime。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-feedback-bridge.js`: 新增正式host隔离、正式玩家环境、全注意纠正、正式拒绝回滚及认知不可否决回归。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`: rebase后使用封存的行动前认知试算审计。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/standard-engine.js`: 延迟白骰随机、延迟母舰生成、下一生成选择与增量生成提交。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/test-standard-engine.js`: 新增正式控制器接口回归。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 更新正式host与脑内预测器职责。

## Validation

- UFS目录全部`test-*.js`: 112/112通过。
- 正式引擎、Roswell地图及基地合同：3/3测试文件通过；正式引擎内部规则检查14项通过。
- 完整固定回合：5次放骰、外部白骰随机、能源/战斗机/挖掘/跳过、母舰、逐架生成和下一回合随机边界通过。
- 自然错误案例：母舰下降后脑内漏收4架飞机；正式host正确收回，下一操作仍由正式状态提供，错误预测没有污染棋盘。
- 全注意同案例：玩家响应与正式`ships/waitingShips`完全一致，随后脑内状态也被正式反馈纠正。
- 概率注意同案例：正式host仍正确；脑内只合并被注意的对象，允许未注意差异保留。
- 正式非法放置：正式与认知状态、动作计数均不变。
- 强制让认知预测器不提供操作：正式合法放置仍成功，证明认知不能否决真实游戏。
- `git diff --check`: 通过；仅有工作区既存LF→CRLF提示。

## Current State

隔离完整试玩已经符合“设想→提交动作→正式游戏结算→正确环境→注意反馈→更新脑内认识”的主循环。正式世界与脑内世界的职责分离问题已经解决：`inspectHostState()`只返回正式状态，`inspectMentalState()`只返回玩家脑内状态，两者可以不同；所有玩家可执行操作和下一环境以正式状态为准。

## Unresolved

- 尚未让新的正式host版本由策略Agent连续试玩3回合或直到终局；当前验证是固定完整回合、自然错误路径及全套自动回归。
- 多条预测共同对应一个正式差异时，反馈层仍保守拒绝归因，需要以后增加更细的实际事件因果标识。
- 新反馈轨迹的模糊语义召回仍等待批量GTE重编译；精确上下文召回已经可用。
- 文件名`ufs-formal-feedback-oracle.js`保留兼容名称，但其职责现已是权威正式游戏会话；后续可在无旧checkpoint兼容压力时改名。

## Recommended Next Step

用当前正式host版本启动一次全新3回合策略Agent试玩，先审计每步公开响应、正式host与脑内差异、非法操作恢复和反馈写入；三回合无系统bug后再继续到终局。
