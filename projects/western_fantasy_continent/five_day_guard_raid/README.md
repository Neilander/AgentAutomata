# 《我的超能力是无限刷装》十五日网页版

这是十五日程序 Demo 的无服务器网页入口。每天有 3 个行动点，刷副本与整理装备不消耗行动；第 5、10、15 日会进入真实团队战斗或已经在游戏内达成的其他解决方式。

## 网页试玩

直接用浏览器打开 `index.html`，不需要单独启动服务器。

地图是主要操作界面：可以拖动、滚轮缩放或按“全图”复位。每个当前地点都是独立点位；点击点位后，地点描述和当前选项会在点位附近的局部浮窗中出现，不再跨左中右三栏操作。点击空白、关闭按钮或按 Esc 可以收起浮窗。

界面只展示当前已知地点、事项数量和行动后的可观察变化，不会列出尚未发现的事件和隐藏解法。进入战斗后，地图和底部管理面板会收起，必须看完正式战斗，再确认战后变化。

刷装也使用同一套正式战场，不再点击后直接结算。每个装备区提供 LV1/LV2/LV3 三组不同敌阵；点击任意一层后整页进入连续战斗，胜利一轮掉落一件装备，短暂停顿后自动开始下一轮。下方战利品架按稀有度和战力排序，顶端“本轮后停止”会在当前战斗完整结束后退出；战败没有掉落并停止连刷。所有层级的掉率只做小幅递增，不展示隐藏概率。

首日地图有四个事件、一个副本和王炉门，三点行动无法清空所有事项；队伍从主角一人逐步扩张。第一幕最多 4 人，第二幕起最多 10 名具名角色；最终战还可能加入事件中争取到的盟友，战场支持 20 对 10。

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

验证覆盖共享地图镜头、点位浮窗、拖动/缩放/复位、空白关闭、静态网页接线、逐轮真实刷装战斗、免费连续刷装、战败无掉落、停止与返回、真实任务战斗写回、10 对 10、20 对 10，以及未来事件封口。
