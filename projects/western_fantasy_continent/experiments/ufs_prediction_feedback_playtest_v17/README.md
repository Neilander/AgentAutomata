# UFS预测驱动反馈学习V17

本实验不重新测试策略强度，而是复用V16已经封存的41个正式操作与真实随机结果，在同一注意seed下重新运行正式host。重放器只根据当步玩家视图、当前操作和规则知识，为主动选择添加0—3张行动前预测票据；它不读取正式host状态来填写预测。

其中第一步故意加入“任何放置都会立即产能”的错误假设，用来验证：正式游戏保持正确、玩家注意到能源未变后形成纠正结果，而不是让错误预测污染环境。

运行：

```powershell
node projects/western_fantasy_continent/experiments/ufs_prediction_feedback_playtest_v17/replay-v16-with-predictions.js
```

结果写入`RESULTS.json`。验收要求：0 rejected、抵达三回合闸门、至少20张显式票据，并同时出现确认和纠正。
