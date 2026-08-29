# UFS 受注意限制现场试玩 V5

本目录保存一次全新的、严格单 Attempt 的 41 / 153+ 注意裁剪现场试玩。固定 attention seed 注入值为 `2026082451`；CLI 没有公开回显实际采用的 seed，因此这里只证明命令环境固定，不把宿主消费情况写成已验证事实。

## 文件导航

- `EXPERIMENT_PROTOCOL.md`：预先建立的隔离、捕获和停止协议。
- `raw-stdout/`：从 `start` 起的 24 份 CLI stdout 逐字捕获。
- `views/`：与对应 raw stdout 字节完全相同的逐步玩家视图副本。
- `raw-stderr/`、`exit-codes/`：每条 CLI 命令的独立 stderr 与退出码。
- `choices/`：22 份实际提交的玩家 choice；`start` 与唯一一次 `random` 没有 choice 文件。
- `thought-log.jsonl`：23 个决策或封卷边界的注意内容、未知项、候选、反事实、最终操作与工作记忆。
- `machine-transcript.json`：命令 / choice / response 的严格顺序、状态与 stdout SHA-256。
- `RESULTS.md`：本 Attempt 的过程和结论。
- `validate-contract.ps1`、`TEST_RESULTS.md`：隔离与时序合同检查及实测输出摘要。

私有宿主状态位于 `.private-host-state/`，已被 `.gitignore` 排除，且从未由玩家打开、搜索、列举或解释。封卷响应是 `complete / new_round`；其后没有任何 CLI 命令。
