# 合同测试结果

命令：

```powershell
node --test projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v4/test-isolation-contract.js projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v4/test-temporal-contract.js
```

结果：8/8 PASS，0 fail，耗时约 190 ms。

- 3 个隔离合同：公开裁剪 schema、单一 start/无宿主 checkpoint 泄漏、初始非逐字捕获限制显式标记。
- 5 个时序合同：actionCount 0→6 单调、random 只在显式边界调用、每个 advance 与单步 choice 对齐、terminal 后无命令、thought log 覆盖所有边界。

测试只读取 V4 已落盘的玩家响应、choice、transcript 和 thought log；没有读取私有 state/checkpoint、宿主实现、fixtures、正式引擎或旧试玩材料。
