# 《我的超能力是无限刷装》十五日网页版

这是十五日程序 Demo 的无服务器网页入口。每天有 3 个行动点，刷副本与整理装备不消耗行动；第 5、10、15 日会进入真实团队战斗或已经在游戏内达成的其他解决方式。

## 网页试玩

直接用浏览器打开 `index.html`，不需要单独启动服务器。

界面只展示当前已知地点、每个地点当前能做的事项数量，以及行动后的可观察变化。地图不会列出尚未发现的事件和隐藏解法。进入战斗后，地图、行动栏和底部管理面板会收起，必须看完正式战斗，再确认战后变化。

首日只投放两个事件；队伍从主角一人逐步扩张。第一幕最多 4 人，第二幕起最多 10 名具名角色；最终战还可能加入事件中争取到的盟友，战场支持 20 对 10。

## 程序版与模拟玩家

```powershell
cd ..\fifteen_day_demo
node fifteen-day-formal-player-cli.js init playtests\manual\session.json my-seed 110 open_novice
node fifteen-day-formal-player-cli.js request playtests\manual\session.json
```

正式模拟玩家仍只接收封口后的玩家观察；网页版使用相同接口和相同权威状态机。

## 验证

```powershell
node verify-sealed-player-observation.js
node verify-real-combat-integration.js
node verify-static-web.js
cd ..\fifteen_day_demo
node verify-fifteen-day-demo.js
node verify-fifteen-day-input-boundary.js
```

验证覆盖静态网页接线、真实 4 对 6 战斗写回、首屏密度与事项计数、免费刷装、失败后继续、10 对 10、20 对 10，以及未来事件封口。
