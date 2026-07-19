# Agent Handoff: 双Agent长跑结论纠错

- Date: 2026-07-18
- Agent/thread: root
- Scope: 重新核对双Agent两章长跑中的随机误导、换人A结算和通用EVerify解释
- Status: complete

## User Intent

用户指出上一份长跑报告混淆了三件事：真实玩家被随机结果误导本来就是理想模拟；换人A此前已经专项修好，不应因为本轮未触发就重新判错；通用假设验证反馈从未在这轮修改。要求回查历史报告和实际记录，纠正问题清单。

## Completed

- 回查换人A、确认感C、换装预期和新关惯性的四份历史修复报告。
- 重跑三组现行专项回归，负A、同档、正A、明显失败C归零、换装重算、新关弱惯性和强信号覆盖全部通过。
- 逐条检查本轮12次换人请求：
  - 惯性玩家4次换人都面对没有已接收角色认知的新角色，系统明确输出 `unknown`，不建立虚假的数值预测，因此不产生A是正确行为。
  - 开放新手前6次同样属于未知新角色；后来2次换回已有认知的游侠，均建立数值反事实预测，并在新关弱惯性条件下正常结算。
- 将“同配置随机翻盘误导玩家”从缺陷清单中移除。玩家无法看到随机种子，根据有限经历形成错误归因符合真实玩家模拟目标。
- 将通用 `EVerify=1/+0.06` 与换人A/C彻底分开：它只是现有的“完成一次可读验证”的过程反馈，用户尚未修改，留待以后决定是否细分确认和证伪。
- 修正中文对比报告、实验README和任务板，只保留本轮两个真实问题：支援/坦克贡献低估、`targetCondition` 字段合同不一致。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/controlled_runs/2026-07-18_post_cognition_two_agents/COMPARISON_REPORT.md`：纠正随机误导、A结算和EVerify解释。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：同步纠正实验摘要。
- `projects/western_fantasy_continent/design/task-budget-board.json`：删除随机误导伪问题，记录A健康状态和通用EVerify边界。
- `coop_repo/reports/2026-07-18_2101_two-agent-interpretation-correction.md`：本纠错记录。
- `coop_repo/REPORT_INDEX.md`：登记本报告，并标明其取代上一份报告的相关解释。
- `coop_repo/LATEST.md`：把当前入口切换到本纠错报告。

## Validation

- `node test-roster-expectation-a.js`：PASS；覆盖负A、同档、正A、专家明显失败、新关惯性和换装重算。
- `node test-player-agent-roster-a-integration.js`：PASS；真实正式换人链路产生并结算 `A=0.0044`。
- `node test-expectation-repair-trio.js`：PASS；精确命中、同档略低/略高、向下跨档 `C=0`、向上跨档、装备强度 `5×2=10`、新关弱惯性和Boss强信号均通过。
- 逐条读取本轮换人request：惯性玩家4次均为 `insufficient_player_knowledge`；开放新手2次已知游侠换人均成功结算。
- `task-budget-board.json` 解析：PASS。

## Current State

换人预测和A结算没有发现回归。本轮“没有A”的记录来自未知角色不生成数值预测，这是防止系统伪造玩家知识的保护；一旦角色已有认知，真实Agent轨迹已经证明预测和跨关结算会工作。

本轮可确认的问题只有两个：

1. 支援和坦克的治疗、护盾、生存贡献没有充分进入角色整体强度。
2. 正式请求要求 `nextCombatTargetCondition`，运行时却只读取 `targetCondition`。

随机结果误导玩家是保留项，不修。通用EVerify、概率预期、失败体验和Progress属于以后优化，不影响本轮A通过结论。

## Unresolved

- 需要专项校准治疗、护盾和输出对胜负贡献的共同强度口径。
- 需要统一假设条件字段合同，并添加严格按正式合同作答的回归。
- 通用EVerify是否区分确认和证伪，用户尚未决定修改。
- 概率预期、失败体验和分层Progress留待后续。
- 上一份 `2026-07-18_1449_two-agent-cognition-improvement-run.md` 是不可覆盖的历史记录；其中“随机污染”和“A/C覆盖不足”的判断已由本报告明确撤回。

## Recommended Next Step

先修 `targetCondition` 合同Bug；随后为支援/坦克贡献建立最小配对测试。概率、失败体验和Progress按用户要求以后再优化。
