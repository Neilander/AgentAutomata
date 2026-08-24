# UFS 受注意限制现场试玩 V4

这是一个全新隔离 Agent 执行的一次性现场试玩。策略 Agent 只收到 `attention-player-cli.js` 的 41/153+ 概率注意裁剪 response，并按单 response 做一次 choice；遇到 random 交回 CLI，遇到 unknown、attention_stop 或 complete 立即封卷。

## 结果入口

- `EXPERIMENT_PROTOCOL.md`：冻结范围、闭卷边界与停止条件。
- `RESULTS.md`：唯一 Attempt 的完整结论和逐步摘要。
- `machine-transcript.json`：机器命令、choice、响应文件、status 与 actionCount 的时序。
- `thought-log.jsonl`：每步 noticed、显式 unknown、宏观需要、合法候选、成本/条件/收益、反事实、最终操作与工作记忆。
- `choices/`：逐操作 JSON；random 文件明确没有玩家伪造数值。
- `views/`：step1—6 为 CLI stdout 逐字 JSON；step0 是标明非逐字的当场重建记录。
- `test-isolation-contract.js`、`test-temporal-contract.js`、`TEST_RESULTS.md`：封卷后合同测试。

私有 CLI state 位于被 `.gitignore` 排除的 `.private-host-state/`；实验过程中从未打开其 checkpoint。

## 验证

```powershell
node --test projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v4/test-isolation-contract.js projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v4/test-temporal-contract.js
```

当前结果：8/8 PASS。
