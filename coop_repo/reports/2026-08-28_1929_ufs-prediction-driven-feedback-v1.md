# Agent Handoff: UFS预测驱动反馈学习V1

- Date: 2026-08-28 19:29 Asia/Shanghai
- Agent/thread: root / simulatePlayer
- Scope: 将行动前预测变成一等票据，并以玩家实际注意到的正式结果逐项验证后再学习
- Status: complete

## User Intent

反馈学习的核心是预测：没有行动前预测，即使结果发生也不能称为验证学习。实现V1并接入完整试玩；测试发现问题或bug时修复后继续，而不是停在首次失败。

## Completed

- 新增`ufs_prediction_ticket_v1`。策略Agent可在任意主动选择payload上附带0—3张预测，每张声明理由及一个或多个验证目标；支持`increase/decrease/changed/unchanged/equals/present/absent`。
- 正式操作提交前剥离预测元数据，预测不会进入或改变正式游戏规则；非法票据原子拒绝，正式host和脑内状态均不变。
- 已有五槽轨迹产生的脑内后续也会编成自动票据，但只为能从脑内前后状态提取出公开可验证字段的预测签发票据，不把无验证目标的联想冒充预测。
- 每张票据保存签发动作、签发时脑内基线、五槽当前Q/预测后续Q、验证目标、来源和截止点。白骰、研究选择、母舰生成等多阶段边界会保留待验证票据并写入checkpoint。
- 正式结算稳定后，只核对玩家本步真正注意到的票据目标：全部看到且符合才确认；看到明确相反才纠正；没看到则标记`unresolved`；两张错误票据争夺同一反馈目标时标记`ambiguous`并拒绝归因。
- 局部预测可以独立验证，不再因同一步还有其他认知误差就全部拒绝。例如“飞船下降正确、母舰收船漏看”时，正确且独立可见的下降轨迹仍可强化，漏看部分不伪判错误。
- 没有票据时返回`no_verifiable_prediction_ticket_before_action`，不创建经历轨迹。研究零收益回归现在证明：有事前“能源下降、研究不动”预测才学习；同样结果无预测时不学习。
- 未看到的票据会进入持久化`predictionLedger`，checkpoint恢复后仍是`unresolved`，不会丢失或被误当成正确/错误。
- 修复V1测试暴露的两个实现问题：自动票据不再整对象比较脑内私有字段与正式公开字段，只比较双方共有公开字段；延迟票据使用签发时脑内基线和签发动作，不把整段多阶段结果错误归给最后一个操作。
- 新建V17集成重放：复用V16封存的41个正式操作与真实随机结果，在相同注意seed下由玩家视图和规则知识为所有主动选择添加预测，不读取正式host填预测。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-prediction-ticket.js`: 预测声明校验、五槽票据编译、公开字段验证、签发基线与重叠检测。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-feedback-bridge.js`: 逐票确认/纠正/未解决/歧义配对、跨边界待验证状态和持久化账本。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: 正式操作与预测元数据分离、行动前脑内基线捕获、checkpoint恢复及账本审计。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: 对策略Agent公开0—3张预测票据payload合同。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-prediction-ticket.js`: 正确、错误、漏看、延迟基线、重叠歧义、随机延期、checkpoint与原子拒绝测试。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-feedback-bridge.js`: 更新为预测优先语义，并验证研究零收益有/无预测对照。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`: CLI预测票据私有审计合同。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 更新反馈学习V1架构与边界。
- `projects/western_fantasy_continent/experiments/ufs_prediction_feedback_playtest_v17/`: V16三回合正式操作的预测票据集成重放器、说明和结果。

## Validation

- `node --test <ufs_first_action_imagination_v0下全部test-*.js>`：122/122通过。
- `node .../ufs_prediction_feedback_playtest_v17/replay-v16-with-predictions.js`：通过；41步、0 rejected、三回合边界保持一致。
- V17全部主动选择均提供预测；稳定边界仅2次`no_prediction`，均为系统提交下一回合随机骰，不是玩家主动决策。
- V17共37张显式票据：18 confirmed、1 contradicted、18 unresolved、0 ambiguous；错误“任何放置立即产能”假设被正式反馈纠正。
- V17最终学习19条反馈轨迹、强化4条已有连接；64条自动+显式票据进入账本，其中36条因未看到目标保持未解决。
- `git diff --check`：通过；仅工作区既有LF→CRLF提示。

## Current State

完整链路现在是：玩家/脑内轨迹在行动前签发少量预测票据 → 正式host独立执行 → 正式状态经161+项概率注意投影 → 只用真正看到的目标核对票据 → 明确确认或纠正才更新轨迹。没有预测、没有看到结果或因果目标重叠时均不强行学习。

V17说明预测覆盖问题已从V16的22次无五槽预测改善为“所有主动选择都有显式预测”；同时18/37票据因概率注意未看到验证目标而诚实保持未解决，证明系统没有为了提高学习率偷用完整正式状态。

## Unresolved

- V17是复用V16动作的集成重放，不是新策略Agent重新决策，不能用来评价策略水平。
- 策略Agent目前需要输出结构化`predictions`；自然语言规划自动编译成票据尚未开发。
- 自动五槽票据只覆盖脑内前后状态能明确映射到公开字段的变化；“预测不会发生变化”若没有显式票据，暂不自动签发。
- `unresolved`票据已持久保存，但尚未实现以后重新注意到旧结果时的安全补验证；当前只保证不丢失、不误学。
- 新建反馈轨迹仍是`pending_matrix_compile`，精确召回可用，在线GTE模糊编译仍未自动化。

## Recommended Next Step

让下一次真实策略Agent试玩在每个主动操作payload里同时提交1—3张预测，先跑三回合并审计“预测是否来自当时知识、票据目标是否过宽、未解决率是否合理”。稳定后再开发自然语言规划→结构化票据编译，以及旧`unresolved`票据的安全补验证。
