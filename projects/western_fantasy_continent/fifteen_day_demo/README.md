# 《我的超能力是无限刷装》15 日程序 Demo

这是纯程序版本，不包含网页，也不会启动服务器。

## 当前循环

- 每日 3 个行动点；副本战斗与换装不消耗行动点。
- 第 5、10、15 日各有一次局势结算。
- 第一幕最多 4 人出战；第二幕开始最多 10 名具名角色出战。
- 最终战会把事件中争取到的盟友加入战场，支持 20 对 10 的真实团队战斗。
- 地点只显示当前可做事项数，不展示未来事件、隐藏条件或锁的完整解法。
- 失败会改变下一幕局势，不会把存档重置为“纯失败”。

## 程序入口

- `fifteen-day-core.js`：权威游戏状态、掉落、事件、编队、三幕结算和战斗调用。
- `fifteen-day-formal-player-loop.js`：正式模拟玩家的决策/归因边界。
- `fifteen-day-formal-player-cli.js`：密封 Agent 试玩 CLI。

初始化正式试玩：

```powershell
node fifteen-day-formal-player-cli.js init playtests\manual\session.json manual-seed 110 open_novice
node fifteen-day-formal-player-cli.js request playtests\manual\session.json
```

玩家只能从 `request` 返回的 `observation.actions` 选择当前行动。提交决策与归因时使用 `decision-json` / `attribution-json`；结束后用 `summary` 导出不含权威状态的可见 trace。

## 验证

```powershell
node verify-fifteen-day-demo.js
node verify-fifteen-day-input-boundary.js
node ..\experiments\player_agent_api_loop_v1\verify-causal-loop.js
```

验证覆盖：首屏事件密度、节点行动计数、免费刷装、显式换装、第一幕伏击平衡、失败后继续、10v10、20v10、每日一次兜底走访、未来事件封口，以及正式认知循环回归。

## 已完成的密封试玩

- Round 1：`open_novice`，75 个循环；第一幕战败，后两幕用政治路线获胜。该轮暴露了首幕难度、胜负措辞和 v1 trace 不可审计问题。
- Round 2：`damage_absolutist`，79 个循环；三幕均主动迎战并获胜，实际跑出 4v6、10v10、20v10。

Round 2 的输入边界已能逐回合审计，但认知计算仍把十连与整场战斗压成摘要，不能据此证明细粒度情绪或单一角色因果；玩家自己的这些判断仍应视为假设。
