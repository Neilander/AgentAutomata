# UFS 多注意种子三回合 V6

本目录记录一个全新隔离玩家仅依据公开 `attention-player-cli.js` 返回的
`noticed view`、`pending`、`availableOperations` 以及公开 README/help，亲自完成的三个
彼此独立回合。每局使用新的 state 目录和不同 `UFS_ATTENTION_SEED`，不重开、不复放固定
动作脚本；白骰只通过 CLI `random` 获取外部结果。

实验结论、完成率、停止原因、拒绝和跨种子策略差异见 [RESULTS.md](./RESULTS.md)；
验证命令与结果见 [TEST_RESULTS.md](./TEST_RESULTS.md)。

## 证据布局

- `round-*/decisions.md`：每次行动前的简短判断。
- `round-*/choices/*.json`：实际提交的公开操作 payload。
- `round-*/stdout/*.stdout.json`：CLI 原始 stdout 字节，不经重新序列化。
- `round-*/stdout/*.stderr.txt`：逐命令 stderr 原文。
- `round-*/machine/*.record.json`：命令、种子、时间、退出码、字节数及解析后的公开响应。
- `round-*/state/`：CLI 私有状态目录；策略玩家不读取其中内容。
- `PUBLIC_STDOUT_SHA256.json`：每份公开 stdout 的字节数与 SHA-256 审计清单。

`capture-player-command.js` 只负责调用公开 CLI 并逐字落盘 stdout/stderr 和机器元数据，
不读取 state 内容，也不向策略补充任何宿主信息。

## 隔离边界

- 三局各用一个从未启动过的新 state 目录，三个请求种子均不同；同一 seed 没有重开。
- 决策只消费此前已捕获的公开 stdout；`state/` 仅作为 CLI 参数存在。
- 白骰边界只执行公开 CLI 的 `random` 命令，真实结果原样保存在相应 stdout 中。
- 未读取宿主检查接口、宿主 checkpoint、正式引擎、固定 fixture 或旧实验报告/序列。
