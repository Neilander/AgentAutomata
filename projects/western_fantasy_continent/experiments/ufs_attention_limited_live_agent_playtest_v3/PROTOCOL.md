# UFS 受注意限制现场试玩 V3 协议

- 唯一试玩；遇到 `unknown`、`attention_stop`、`complete` 或无操作口即封卷，不重试。
- 决策者只读规则知识阶段 01—05 与 `ufs_page9_strategy_reading_v0/SYNTHESIS.md`。
- 环境只来自 `attention-player-cli.js` 的标准输出；不读宿主 checkpoint、完整地图、fixture、旧试玩或正式引擎。
- 严格交替执行：读取当前裁剪视图、追加本步思考、写一个 choice、调用一次 `advance`、再读新视图。
- 具体地图事实只能来自本步 `noticedItems` 与自己已执行动作的工作记忆；遗漏项保持未知。
- `random` 只由 CLI 的 `random` 命令处理，不冒充玩家决策。
- 这是文件/流程纪律，不是 OS 级隔离。

