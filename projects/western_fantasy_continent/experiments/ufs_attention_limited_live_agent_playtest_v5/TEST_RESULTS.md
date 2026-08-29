# UFS 受注意限制现场试玩 V5：合同测试

## 运行结果

- 命令：`powershell -File validate-contract.ps1`
- 日期：2026-08-24
- 退出码：0
- 硬性检查：14 / 14 通过
- transcript 事件：24（1 start、22 advance、1 random）
- 实际 actionCount：0 → 13
- 原子拒绝响应：10（1 次缺少显式 `pay:true`，9 次未公开 `choose_spawn` 字段猜测）

## 通过项

1. 必需公共产物齐全。
2. 事件序号严格为 0..23，每条 operation 都在前一份 stdout 落盘后提交。
3. 只有一个 Attempt、一个 `start`，且 `start` 是首事件。
4. transcript 固定记录 attention seed 注入 `2026082451`；CLI 未公开回显实际消费值，未越界宣称。
5. 24 份 raw stdout 均为合法单 JSON，SHA-256 与 transcript 全部一致。
6. 24 份 `views/` 与对应 `raw-stdout/` 字节完全相同；因此 start 与以后响应没有事后重建。
7. 24 个 CLI 子进程退出码均为 0，stderr 均为空。
8. 每个 advance 的 operation type 都由前一响应 `availableOperations` 明示；所有 rejected 响应 actionCount 均不变。
9. 所有提交的对象 ID / 候选值都能在紧邻的前一份裁剪响应中找到；研究 `advanceSteps=1` 不超过公开 `maxAdvanceSteps=1`。
10. 唯一 `random` 紧随唯一 `status=random`，且没有伪造 choice 文件。
11. 最后一份响应是 `complete / new_round`、pending null、availableOperations 空；transcript 没有后续事件。
12. 只扫描公共响应 / choice 目录后，没有发现 checkpoint 或私有状态标记；`.gitignore` 明确排除 `.private-host-state/`，测试没有枚举该目录。
13. 24 条 thought-log 均为合法 JSONL，并包含 `noticed`、`explicitUnknowns`、`macroNeed`、`legalCandidates`、`counterfactual`、`finalOperation`、`workingMemoryAfter`。

## choice 合法性的诚实分层

- 阶段与对象合法性：通过。所有 operation type 均在当前阶段公开，所有对象 / 候选来自当前裁剪响应，random 与研究推进均满足公开 pending 条件。
- payload schema 接受性：并非全部通过。10 个 payload 被 CLI 原子拒绝，完整保留在 transcript 中；其中能量房缺少 `pay:true` 是玩家规则遗漏，spawn 的九次拒绝暴露了公开 README / help 只列操作名、未给必需 `dropPointId` 的文档缺口。
- 状态安全性：通过。10 次拒绝均未推进 actionCount，spawn pending 候选也未改变；最后以公开合同字段 `dropPointId=DP-C3` 成功到达边界。

## 可重复命令

在仓库根目录运行：

```powershell
& 'projects\western_fantasy_continent\experiments\ufs_attention_limited_live_agent_playtest_v5\validate-contract.ps1'
```

预期输出 `hardChecksPassed: true`、`eventCount: 24`、`rejectedPayloadCount: 10`，退出码 0。该验证只读取公共实验产物，不读取或列举 `.private-host-state/`。
