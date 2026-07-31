# 边陲村魔物战争：程序版

这是无前端的规则核心与正式模拟玩家接口。当前流程为第1—2日剧情引入、第3—6日村庄经营与真实战斗、第7日大规模决战。

## 本地验证

```powershell
node verify-border-village.js
node verify-border-village-input-boundary.js
node verify-border-village-winning-route.js
```

三项分别验证核心规则、玩家输入封口，以及一条包含反复刷装、手动配装、建设、征召、突袭和最终真实战斗的可胜路线。所有战斗必须先由共享战斗模拟器生成完整 `signals` 时间线，核心才接受结算。

## 正式模拟玩家

```powershell
node border-village-formal-player-cli.js init playtest\session.json <seed> 100 open_novice
node border-village-formal-player-cli.js request playtest\session.json playtest\request.json
```

之后交替提交一次 `decision` 和一次 `attribution`。模拟玩家只能看到 `request` 输出，不能读取会话存档、核心源码或设计文档。
