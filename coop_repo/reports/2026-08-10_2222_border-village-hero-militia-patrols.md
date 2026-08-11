# Agent Handoff: Hero And Militia Patrols

- Date: 2026-08-10
- Agent/thread: Codex `/root`
- Scope: 让地图上的真实英雄与民兵进行差异化小范围移动
- Status: complete

## User Intent

地图上的英雄和民兵也应活动起来，并延续此前“不要所有人走同一路线”的要求。

## Completed

- 为8类已知英雄岗位配置不同的小范围巡逻：指挥、望门、侦察、警戒、绕场、林地、边缘和工坊。
- 为民兵配置横巡、纵巡、绕角和换岗4类集结区路线。
- 英雄与民兵的路线持续时间、起步时间按单位错开，避免全员同轨同步。
- 民兵移动范围限制在中央集结区，英雄移动范围限制在各自岗位附近，避免跨越功能节点。
- 动画直接作用于可点击单位按钮，头像视觉位置与装备/人物页点击热区同步移动。
- 保留原有轻微待机起伏，并继续支持系统减少动态偏好。
- 按游戏UI规范保持英雄、民兵和普通繁荣居民的视觉层级，不新增面板、按钮或挂机收益。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 增加英雄/民兵路线配置、单位路线分配和错开的动画参数。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 增加8类英雄路线和4类民兵路线动画。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加差异化可点击巡逻契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 说明真实单位移动规则。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化路线分层与点击热区要求。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 更新地图单位动态审查规则。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 记录差异化巡逻方向。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `git diff --check -- projects/western_fantasy_continent/border_village_war_web projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: PASS；仅输出仓库既有LF/CRLF警告。
- 未启动服务器，未打开浏览器。

## Current State

普通繁荣居民、真实英雄和真实民兵均有不同活动路线。英雄与民兵仍然可点击，其点击区域与画面位置一致；战士仍仅由左侧单位总览表现。

## Unresolved

- 实际观感仍需真人刷新静态页面确认，尤其是高英雄/民兵数量下是否显得过于活跃。
- 如需调整，应优先缩短位移或延长停顿，不应增加复杂寻路和碰撞系统。

## Recommended Next Step

刷新静态页面观察英雄与民兵移动；若整体太忙，先降低民兵位移幅度或延长每条路线的原地停顿比例。
