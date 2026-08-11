# Agent Handoff: Building-To-Building Units

- Date: 2026-08-10
- Agent/thread: Codex `/root`
- Scope: 将英雄与民兵从小范围巡逻改为建筑间移动
- Status: complete

## User Intent

英雄与民兵不应只在岗位附近小范围晃动，而应真正从一座建筑移动到另一座建筑。

## Completed

- 删除上一版8类英雄局部动画和4类民兵集结区局部动画。
- 以7个真实建筑节点坐标为来源，在每座建筑朝向村庄内圈的一侧计算停靠点，不维护第二套脱节位置。
- 增加西区、南区、东区、工坊、跨村、西北串联、正环村和反环村8种建筑组合。
- 主角、女骑士、侦察者等英雄按身份分配不同路线；民兵按队伍序号分配西区、南区、东区或工坊路线。
- 单位在建筑旁停留后再移动到下一座建筑；动画时长与出发进度错开。
- 动画作用于真实可点击按钮；鼠标悬停或键盘聚焦会暂停，离开后继续，确保玩家能点中移动单位。
- 普通繁荣居民保持原来的氛围短路线，不混入真实单位逻辑。
- 更新静态契约，明确必须由建筑坐标派生并至少连接多个建筑。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 用建筑坐标、停靠偏移、路线帧生成和可暂停Web Animation替换局部CSS巡逻。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 删除全部英雄/民兵局部巡逻关键帧，保留单位视觉和轻量待机。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 锁定建筑间路线、真实坐标派生和移动点击按钮契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更正为建筑间移动。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化建筑停靠点与交互要求。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 将小范围巡逻列为禁止回退项。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 记录建筑间路线设计。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `rg`检查旧`unit-patrol`、`MILITIA_WORLD_POSITIONS`、`HERO_WORLD_POSITIONS`: 源码无残留；仅设计文档保留“禁止小范围巡逻”的新规则。
- `git diff --check -- projects/western_fantasy_continent/border_village_war_web projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: PASS；仅输出仓库既有LF/CRLF警告。
- 未启动服务器，未打开浏览器。

## Current State

英雄与民兵会在建筑节点的内侧停靠点之间长距离移动，并在每站停留。路线直接依赖当前建筑坐标，移动点击区域与头像一致；普通繁荣居民仍是独立的低层级氛围单位。

## Unresolved

- 尚需真人刷新页面确认各路线穿越村庄内圈时的视觉密度。
- 当前为直线段移动和停留，不含复杂避障；如果出现穿越浮窗或节点的问题，应调整路线组合或停靠偏移，不应退回小范围晃动。

## Recommended Next Step

刷新静态页面观察英雄与民兵是否确实能被感知为“去往另一座建筑”；重点检查正反环村路线和高民兵数量下的交叉密度。
