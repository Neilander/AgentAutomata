# UFS 逐操作口现场试玩 V1 协议

本实验让一个未读取旧答案的 Agent 现场玩完一回合。玩家每次只看到当前
`UfsOneRoundSession` response，然后写下本步判断并提交一个 operation；程序返回
新的脑内环境后，玩家才允许规划下一步。

## 阅读白名单

回合结束前只阅读：根协作说明、当前会话 API 报告与 README、会话入口、公开地图
入口、公开初始状态，以及 UFS 第 1—8 页分段规则知识。没有读取旧 scenario、fixture、
decision、judgment card、trace、driver、audit、oracle 或正式 engine。会话入口自身会在
运行时调用已有认知系统，这不等于玩家读取其实现。

## 时序约束

1. `session-cli.js start` 只产生第 0 个当前 response。
2. 玩家立即把当前 response 摘要、候选比较、反事实和唯一选择追加到
   `thought-log.jsonl`，并创建一个只含当步 operation 的 choice 文件。
3. `session-cli.js advance <choice>` 只消费该 operation，追加机器 transcript，并返回
   新 response。
4. 重复 2—3，禁止在 driver 中保存未来动作数组。
5. 只有 response 为 `random` 时才调用 `random-gateway.js`；它只依据当前 checkpoint
   和 `afterDieId` 使用系统随机源生成当前未放骰子的观察值，不生成或保存未来值。
6. 回合完成前不运行 formal audit。完成后对照输出单独保存，不能修改思路日志。

## 解释边界

- `thought-log.jsonl` 是模型生成的策略解释，不是隐式推理的逐字转录。
- “必输”“风险”“未知”严格区分；没有证据时不写成必输。
- 这不是 OS 级盲测。同一 worktree 可见，但通过白名单、单步 choice 文件、只追加日志
  和完成后才允许审计，降低旧答案污染。

