# Agent Handoff: targetCondition假设字段合同修复

- Date: 2026-07-19
- Agent/thread: root
- Scope: 统一正式Agent请求、压缩请求、响应归一化和假设验证的可测条件字段
- Status: complete

## User Intent

用户要求修复任务板中的 `agent-hypothesis-target-condition-contract` Bug，并在完成后说明具体修改。

## Completed

- 确认Bug只存在于正式请求合同：
  - 运行时一直读取和保存 `hypothesis.targetCondition`；
  - 正式 `responseContract` 却误写为 `hypothesis.nextCombatTargetCondition`；
  - Agent严格按错误合同作答时，运行时因缺少 `targetCondition` 拒绝假设。
- 将 `targetCondition` 设为唯一正式字段，结构固定为：

```text
targetCondition = {
  metric,
  operator,
  value
}
```

- 明确字段要求：
  - `verificationScope: "next_combat"` 时必填；
  - `verificationScope: "current_action"` 时可选；
  - 两种验证范围使用完全相同的字段名和结构。
- 正式决策指令也加入同一说明，避免Agent从自然语言中推断出第二种名字。
- `compact-request.js` 本来逐字保留正式 `responseContract`，新增回归证明完整请求与压缩请求完全一致。
- 旧错误字段 `nextCombatTargetCondition` 不做静默兼容；运行时给出明确错误：使用 `targetCondition`。
- 新增聚焦回归，覆盖：
  - 完全按正式合同提交的 `next_combat` 确认；
  - 完全按正式合同提交的 `next_combat` 证伪；
  - `current_action` 使用同一字段结构并确认；
  - 完整与压缩合同一致；
  - 旧错误字段明确拒绝。
- 更新运行时文档、实验README、运行时版本和任务板，将该任务标记完成。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：修正正式合同、决策指令和旧字段错误提示。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-target-condition-contract.js`：新增正式/压缩合同及确认/证伪聚焦回归。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：记录唯一字段和验证范围要求。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：记录合同、错误字段边界和测试入口。
- `projects/western_fantasy_continent/player_model_runtime.json`：更新V22并注册假设合同回归。
- `projects/western_fantasy_continent/design/task-budget-board.json`：任务改为done并记录验证证据。

## Validation

- `test-target-condition-contract.js`：PASS。
  - 正式合同只包含 `targetCondition`。
  - 压缩合同与完整合同逐字一致。
  - `next_combat` 的 `damage > 0` 正常确认为 `confirmed`。
  - `next_combat` 的 `damage < 0` 在实际正伤害下正常证伪为 `refuted`。
  - `current_action` 使用相同 `targetCondition` 结构并正常确认。
  - `nextCombatTargetCondition` 被明确拒绝并提示使用 `targetCondition`。
- 底层玩家假设运行时确认、证伪和证据不足专项：PASS。
- 当前正式入口 `verify-causal-loop.js`：PASS。
- 换人预测与A正式接线：PASS。
- JavaScript语法、任务板JSON、运行时JSON和最终合同探针：PASS。
- `independent_review`：未运行；本次是确定性字段合同修复，不是新的玩家行为轨迹。

## Current State

Agent现在看到什么就能按什么填写：

```text
正式请求：hypothesis.targetCondition
压缩请求：hypothesis.targetCondition
响应归一化：读取 hypothesis.targetCondition
持久化假设：保存 targetCondition
事件验证：用 targetCondition 做确认或证伪
```

不存在请求教Agent写A字段、运行时却读取B字段的情况。

## Unresolved

- 当前可测指标白名单仍是 `damage`、`heal`、`shield`、`skillCount`、`damageShare` 和 `damageRank`；以后新增指标要显式扩展白名单和事件证据，不应接受任意字符串。
- 本次只修字段合同，没有扩大通用EVerify在更多玩法事件中的覆盖。

## Recommended Next Step

按任务板继续 `expectation-probability-distribution`，先做神话后普通、普通后神话和整批换序的概率预期顺序不变性测试。
