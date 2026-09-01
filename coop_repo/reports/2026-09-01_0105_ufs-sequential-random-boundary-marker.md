# Agent Handoff: UFS多步设想随机边界标记

- Date: 2026-09-01
- Agent/thread: Codex `/root`
- Scope: 修正自动逐步Q规划遇到白骰重投时的停止语义
- Status: complete

## User Intent

多步规划遇到重投时必须明确暂停，不能误报计划完成，也不能在规划阶段预先编造随机点数。

## Completed

- 逐步滚动器支持一步设想完成后返回显式停止边界。
- 自动UFS适配器在认知响应为`random`时返回`paused_random`，保存`waiting_for_actual_reroll`原因和公开`pending`合同。
- 随机暂停结果明确设置`deterministicBenefitClaimAllowed: false`。
- 若后续仍有计划动作，返回`stoppedAfterStep`和`stoppedBeforeStep`，后续动作不进入认知设想。
- 若计划恰好结束在重投动作，仍返回`paused_random`，不再误报`complete`。
- 禁止`steps[]`包含`submit_random_observation`；随机观察只能由live环境产生，提交后再从新Q启动新一轮规划。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-sequential-q-rollout.js`: 新增设想后停止边界合同。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-automatic-sequential-imagination.js`: 将认知random响应映射为`paused_random`并拒绝预填随机观察。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-automatic-sequential-imagination.js`: 新增真实白骰重投、序列末尾重投及伪造随机值三项测试。

## Validation

- 聚焦自动Q链与V1逐步回放：10/10通过。
- 完整UFS认知、玩家、反馈、程序库及V1回归：185/185通过。
- `git diff --check`: 通过；仅有仓库既有LF/CRLF提示。

## Current State

当前随机流程为：`规划并设想到白骰放置 → paused_random → live环境给出真实重投值 → 形成新Q → 重新调用规划`。规划器不会跨未知点数继续做确定性推演，也不能自己填写随机结果。

## Unresolved

- 尚未实现随机结果的概率分支树或期望/风险规划；当前策略是保守暂停。
- 上层规划器仍需在收到真实随机观察后主动重新调用多步规划。

## Recommended Next Step

在上层多切入口控制器中识别`paused_random`，持久化尚未执行的宏观意图而不是具体动作；真实随机观察到达后，用新Q重新生成候选锚点和`steps[]`，不要原样续跑旧动作列表。
