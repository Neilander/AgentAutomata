# UFS 多注意种子三回合 V6：验证结果

验证日期：2026-08-25（Asia/Shanghai）

## 自动证据审计

命令：

```powershell
node --test projects/western_fantasy_continent/experiments/ufs_attention_multiseed_three_rounds_v6/test-v6-evidence.js
```

结果：`7 passed, 0 failed`。

通过项目：

1. 三个请求 seed 唯一，且分别等于所有相关公开响应的实际回显 seed。
2. 每份 stdout 保留原始字节、可解析为 JSON，并与机器元数据的字节数一致。
3. 每个命令都属于上一步公开 `availableOperations`，没有跨越公开操作边界。
4. 三个白骰随机边界都调用 CLI `random`，且没有拒绝或 unknown 停止。
5. 三个唯一 attempt 都抵达公开完整回合/下一回合边界，state 目录互不相同。
6. 每个捕获命令都有前置决策小节，每个 advance 都有 payload 证据。
7. 成功生成全部公开 stdout 的 SHA-256 清单。

原始测试输出：

```text
✔ three unique requested and echoed attention seeds
✔ all raw stdout is intact, parseable, and paired with machine metadata
✔ every command follows the previous public operation boundary
✔ white-die boundaries used CLI random and no attempt was rejected or stopped unknown
✔ all three unique attempts complete at the next-round boundary
✔ each captured command has a prior decision section and each advance has a payload
✔ write public stdout SHA-256 audit manifest
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

## 验证边界

测试只读取 V6 的 `stdout/`、`machine/`、`choices/`、`decisions.md` 并写入哈希清单；它不读取
任何 `round-*/state/` 内容，也不加载宿主检查接口、宿主 checkpoint、正式引擎、fixture 或旧实验
报告/操作序列。为了保持本次玩家实验的隔离性，没有用隐藏 oracle 做“答案正确性”回放。
