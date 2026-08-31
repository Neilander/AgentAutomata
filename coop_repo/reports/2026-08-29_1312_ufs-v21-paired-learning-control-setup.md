# Agent Handoff: UFS V21 revision 1与fresh成对对照准备

- Date: 2026-08-29 13:12 Asia/Shanghai
- Agent/thread: root / simulatePlayer-next
- Scope: 建立V20 revision 1第二episode与全新fresh玩家的隔离对照基线；不推进长局
- Status: complete

## User Intent

验证此前捕获的反馈学习是否会改变后续预测与决策。实验组必须使用V20 revision 1开始第二个episode，对照组必须完全fresh；两组采用可比较的注意seed和正式随机序列，档案完全隔离，并重点比较零能源陷阱、不完整能源房、研究回退、母舰危险和无效选择。

## Completed

- 定位并修复跨worktree模板指纹阻塞：旧V20档案使用混合LF/CRLF原始JSON字节生成指纹，新worktree因此误判同一认知资产。现在JSON资产以LF规范化后计算模板指纹；旧指纹只有能由当前完全相同资产的换行组合严格复现时才兼容，实际资产改变仍会拒绝。
- 完整保留V20 revision 1输入档案，复制到V21实验组；SHA-256仍为`a1c3a2f13257cd89eea08581137ad1fedbd0b81addda0eff5a0ee4a4e9b8d92c`。
- 创建全新独立对照玩家`ufs-v21-fresh-control-player`：revision 0、0轨迹、0强化、0注意调整、0预测账本。
- 两组统一attention seed `2026082920`，分别启动`episode-0002`与`episode-0001`，当前均停在Round 1第一次`place_die`选择，action count 0；没有开始长局。
- 建立按`pending type + occurrence`分流的预提交正式随机带，避免两组因决策分叉和白骰重投次数不同导致随机消费错位。
- 完整试玩CLI新增可选随机观测文件输入，并严格校验公开边界、操作类型、骰子ID和值域。
- 预注册五项对比口径，并建立profile/state/payload/evidence/decision/capture全隔离目录约束。
- 成对基线审计通过：正式初始状态完全一致；公开初始视图除玩家身份、episode和revision外完全一致；实验组保留54条轨迹、9条强化和189条账本，对照组均为0。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-player-generator.js`: JSON换行规范化模板指纹与严格旧指纹兼容。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/replayable-random-observation.js`: 公开随机边界校验与可复放观测构造。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: `random`可选预提交观测文件。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-player-generator.js`: V20 revision 1跨worktree续玩回归。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-replayable-random-observation.js`: 成对随机复放与拒绝合同回归。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: 指纹规范化与成对随机接口说明。
- `projects/western_fantasy_continent/experiments/ufs_revision1_vs_fresh_control_v21/`: V21协议、manifest、随机带、两份隔离玩家档案、两个启动态、审计器和setup结果。
- `coop_repo/LATEST.md`: 指向本报告和V21 setup结果。

## Validation

- 专项player/random测试：12/12通过。
- UFS完整测试：137/137通过。
- `node projects/western_fantasy_continent/experiments/ufs_revision1_vs_fresh_control_v21/verify-pair-baseline.js`：通过。
- 两组正式初始状态：完全一致。
- 两组公开初始视图：去除身份字段后完全一致。
- 两组当前边界：`choice/waiting_for_die_placement`，action count均为0。
- `git diff --check`：通过；仅既有LF→CRLF提示。

## Current State

V21对照实验已经安全启动但未开始做玩家选择。实验组是V20 revision 1的第二episode，保留54条学习轨迹、9条连接强化和189条历史预测账本；fresh对照使用同一规范模板与attention seed，但个人学习全空。两份输入档案、episode state和未来capture目标相互独立。

正式随机带seed为`2026082921`，SHA-256为`810cf1301352b204601549c850f106d34e2e5359f13b80c80349aa99d00c30c3`。随机配对按边界类型和出现次数进行，不按总操作序号进行。

## Unresolved

- 尚未提交任何V21玩家决策，不能对学习效果作结论。
- 五项预注册现象当前均为`not_observed`；必须在真实可见局面出现后逐项记录，未出现不得推断。
- 两组策略控制器必须继续保持同一模型、设置、公开信息边界和理由记录格式；开始三回合阶段前应把本次控制器配置写入决策记录头部。
- 两组决策自然分叉后，正式世界轨迹也会分叉；结论应同时报告同局面直接对比与不同局面下的机会暴露，不能把未遭遇当成改善。
- 不得在三回合闸门前capture；后续capture也必须分别写回各自档案。

## Recommended Next Step

从两组当前第一次`place_die`边界开始，使用同一控制器配置交替推进，每遇正式随机边界就从同一预提交随机流按类型与出现次数生成观测；分别停在完成3回合后的Round 4掷骰前，运行各自闸门审计并填写五项对照日志。闸门未双双通过前不要继续终局。

