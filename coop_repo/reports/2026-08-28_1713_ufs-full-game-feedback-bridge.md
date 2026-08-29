# Agent Handoff: UFS完整试玩反馈桥

- Date: 2026-08-28
- Agent/thread: root / simulatePlayer
- Scope: 把反馈学习接入现有完整试玩会话，并以正式规则结果阻止认知自我确认
- Status: partial

## User Intent

验证原7项反馈学习能否进入完整试玩：玩家每次行动前产生脑内预测，行动后只依据玩家可见的真实结果创建或强化五槽轨迹；不使用候选价值分，也不能把认知系统自己的演算结果当成真实反馈。

## Completed

- 新增认知核心之外的正式规则旁路，使用同一玩家操作增量推进正式状态，并返回正式前后变化、稳定边界和认知差异。
- 新增完整试玩反馈桥：提取本次新增的五槽预测，等待随机、研究选择和生成选择完成后再归因，只学习已提交且玩家注意到的实际变化。
- 正确预测会强化已有预编译连接的overlay，不复制矩阵轨迹；checkpoint恢复后仍保留支持度。
- 研究房真实零收益会创建具体后果轨迹。例如预算2、下一需求4、研究4、能源4，选择推进0后记录“能源4→2、研究4→4”，不写候选价值分。
- 单一可归因错误可创建更具体的新轨迹并产生动作/阶段/上下文限定的注意修正；多条预测同时错误时拒绝猜测归因，不污染学习。
- 反馈学习状态、正式旁路状态、待归因预测、去重标识和注意修正均进入完整试玩checkpoint；CLI将审计写入私有`feedback-audit-transcript.jsonl`。
- 修复完整会话每步复放旧脚本造成同一轨迹被重复强化的问题，以持久化发生标识确保一次实际发生只记一次。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-formal-feedback-oracle.js`: 正式规则增量结果旁路。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-feedback-bridge.js`: 完整试玩预测—实际反馈配对、可见性门和安全归因。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: 接入正式旁路、反馈桥、连接overlay、注意修正和checkpoint。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: 保存私有反馈审计。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-feedback-learning.js`: 已编译轨迹确认改为更新连接overlay，避免复制轨迹。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-attention-provider.js`: 消费反馈产生的情境注意修正。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-feedback-bridge.js`: 完整会话确认、真实研究零收益、单因果纠错及checkpoint测试。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-ufs-feedback-learning.js`: 已编译连接确认不复制轨迹回归。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`: 私有反馈审计文件合同。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 更新完整试玩反馈能力及边界。

## Validation

- `node --test --test-reporter=dot <ufs_first_action_imagination_v0下全部test-*.js>`: 108/108通过。
- `git diff --check`: 通过；仅有工作区既存LF→CRLF提示。
- 普通放置完整会话：正式结果与认知匹配，强化`read-rule-place-die-to-same-column-descent`和`read-rule-single-room-placement-to-room-value`，未复制轨迹。
- 研究零收益完整会话：生成带房间、预算、下一研究需求、行动前能源和研究进度上下文的新五槽后果轨迹。
- 母舰下降格现场：正式引擎收回新到达行的4架紫机，认知世界漏掉收回；桥记录`ships`、`waitingShips`差异。因同时存在3条预测，返回`multiple_predictions_make_mismatch_attribution_ambiguous`并保持学习状态不变。

## Current State

反馈自动接线已经可以在完整试玩会话中工作，能区分正式结果与脑内结果，正确强化既有轨迹、保存具体反例并安全拒绝歧义归因。认知核心仍不导入正式引擎。

当前尚不是完整的双状态游戏控制器：完整试玩下一步的环境和合法操作仍由认知世界决定，正式状态目前是校验与反馈旁路。因此它已经能发现认知错误并避免错误学习，但还不能让正式世界独立继续、再把有限可见反馈交给玩家脑内。

## Unresolved

- 需要把正式游戏状态和玩家脑内状态长期分离，由正式状态决定合法操作、随机结果和环境响应，脑内状态只保存玩家注意到并推断出的世界。
- 多条预测共同导致一个差异时目前保守拒绝学习；后续需要基于实际事件Q或因果标识进行更细归因。
- 新反馈轨迹可立即精确召回，但模糊召回仍需批量GTE编译；尚未实现在线自动重编译。
- 尚未让策略Agent在新的双状态控制器上从开局完整玩到终局，因此不能把本次接线称为终局反馈试玩完成。

## Recommended Next Step

先改完整试玩宿主为双状态控制器：正式状态负责`availableOperations`和实际响应；认知状态只通过完整161+项注意场接收可见反馈并形成/修正Q。完成后先跑3回合闸门，确认认知允许漏看且正式游戏仍能连续推进，再进行一局终局试玩。
