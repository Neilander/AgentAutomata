# Agent Handoff: 边陲村全地图与底部装备抽屉

- Date: 2026-07-29 23:09
- Agent/thread: Codex primary
- Scope: 七日边陲村静态前端主结构重排
- Status: complete

## User Intent

废弃地图与角色装备底栏并排分配高度的结构。默认界面以地图为主，底部只显示一个按钮；点击后角色装备信息从底部浮起，覆盖地图下部，而不是挤压地图。

## Completed

- 主界面网格改为标题栏加全高地图两行，删除永久占据300px的底栏行。
- 新增底部“队伍与装备”按钮；默认只露出42px按钮，点击后展开330px覆盖式抽屉，矮屏为300px。
- 抽屉保留队伍、背包、记录三页；八部位手动配装、24件背包分页和装备详情功能不变。
- 抽屉展开/收起不触发地图尺寸变化；Esc优先收起抽屉。进入正式战斗或连续刷装时抽屉自动收起并隐藏。
- 左上战况牌恢复成230px紧凑竖卡；全高地图下不再需要用横条压缩信息。
- Toast在抽屉关闭时靠近底部按钮，抽屉打开时自动抬到抽屉上方。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/index.html`: 增加抽屉按钮和抽屉内容容器。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 全高地图、覆盖式抽屉与竖版战况牌。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 抽屉状态、按钮、Esc和战斗自动隐藏逻辑。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 更新全地图与覆盖式抽屉静态契约。
- `coop_repo/LATEST.md`: 指向本报告。
- `coop_repo/REPORT_INDEX.md`: 登记本报告。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；确认全高地图、覆盖式抽屉、战斗隐藏和背包分页；未启动服务器或浏览器。
- CSS滚动审查：底部抽屉、队伍、背包、装备详情和日志均无`auto/scroll`；仅事件长浮窗、连续掉落横排和超大阵容预览保留必要滚动。

## Current State

经营状态下，标题栏以下只有地图，底部中央浮着“队伍与装备”按钮。打开抽屉时地图保持原尺寸，抽屉覆盖其下部；关闭后立即恢复完整地图视野。战斗和连续讨伐不会显示抽屉。

## Unresolved

- 遵守用户此前要求，没有启动服务器或浏览器；实际像素观感仍由用户当前窗口确认。
- 页面仍以最小1080×720桌面试玩为目标。

## Recommended Next Step

用户刷新页面，确认默认只见地图与底部按钮，并测试展开、切换背包、收起及进入战斗四条路径；之后再根据真人感受微调抽屉高度，不再改变地图布局。
