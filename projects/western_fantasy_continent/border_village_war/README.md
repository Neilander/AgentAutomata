# 边陲村魔物战争：程序版

这是无前端的 v3 规则核心与正式模拟玩家接口。当前只保留金币、粮食、人口与行动力：刷装推动铁匠铺金币收入，农田产粮，金币用于市场与扩大征召，粮食用于真实训练战、突袭和不同质量部队出战。敌据点被占领后会解锁原地建设位。装备可逐人调整，也可一键按显示评分分配给整队；最终战入口只汇总玩家已经知道的敌我规模与装备覆盖情况，不公开隐藏胜率或解法。

边林讨伐现在有五档独立难度。所有难度共享总胜场：累计5、10、30、50次胜利时依次解锁难度2—5，因此一直刷难度1也能解锁全部难度；解锁不会自动切换。每档都有独立且公开的掉落件数与稀有度表，高难度同时提高敌群规模、装备等级、稀有度和每轮掉落数。失败会保留战斗记录但不增加总胜场，也不消耗行动力或粮食，可以立即重试或切回低难度。

## 本地验证

```powershell
node verify-border-village.js
node verify-border-village-input-boundary.js
node verify-border-village-sealed-surface.js
node verify-border-village-winning-route.js
node verify-border-village-formal-playtest.js playtest\v3-open-novice-r2-session.json playtest\v3-open-novice-r2-visible-trace.json
```

验证覆盖核心规则、玩家输入封口、全日密封面，以及一条包含刷装产钱、即时建设、征召、训练、占领三个据点、原地建设和最终真实战斗的可胜路线。正式试玩审计还会逐轮核对：所选动作当时确实公开可用、每场战斗有时间线、每次结果都进入知识库、归因只引用公开证据、未来事件没有提前泄露。所有战斗必须先由共享战斗模拟器生成完整 `signals` 时间线，核心才接受结算。

## 正式模拟玩家

```powershell
node border-village-formal-player-cli.js init playtest\session.json <seed> 100 open_novice
node border-village-formal-player-cli.js request playtest\session.json playtest\request.json
```

之后交替提交一次 `decision` 和一次 `attribution`。模拟玩家只能看到 `request` 输出，不能读取会话存档、核心源码或设计文档。
