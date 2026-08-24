# UFS 受限注意现场试玩 V2 协议

- 唯一 Attempt；遇到 `unknown`、`attention_stop`、`complete` 或无操作口立即封卷。
- 玩家只从 `attention-player-cli.js` 的标准输出和 `current-player-view.json`读取当前视图。
- 严禁读取 `runtime/host-checkpoint.json`；宿主 checkpoint 与玩家处于同一 worktree，这不是 OS 级隔离。
- 长期知识仅限首局规则第1—9页的五个阶段 JSON 与策略阅读综合报告。
- 回合完成前不读取旧试玩、旧答卷、固定场景、正式引擎或审计材料。
- 严格执行“读当前视图→追加本步思路→写单个 operation→推进→重新规划”，不预写后续动作。
- 具体对象、位置和值只能来自当前 `noticedItems` 支持的裁剪视图；长期规则知识不得补全未注意到的当前地图事实。
- 随机不是玩家选择，只在 CLI 返回 `status=random` 时让 CLI 产生观察并记录前后视图。

