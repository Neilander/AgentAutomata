# Agent Handoff: Heroes And Prosperity Residents

- Date: 2026-08-08
- Agent/thread: Codex `/root`
- Scope: 在简化地图上补回真实英雄，并用繁荣居民增加城镇人气
- Status: complete

## User Intent

英雄与民兵都应出现在地图上，直观反映玩家实际拥有的单位。繁荣等级还应带来额外普通小人；这些小人不能全部沿相同路线行动。

## Completed

- 保留中央真实民兵圆形头像集结区。
- 将全部已拥有英雄以略醒目的圆形职业头像分散到村内稳定位置；主角、女骑士队长和其他英雄有不同视觉层级。
- 地图英雄与民兵均来自当前真实队伍数据，点击进入同一人物页。
- 每个繁荣等级额外生成2名普通村民，当前最多8名；普通村民不代表战斗单位、不响应点击、不提供挂机收益。
- 普通村民采用集市、河岸、田边、村口四类不同短路线，并错开持续时间与起步时间，避免同步巡逻。
- 普通村民尺寸、对比度和层级均低于英雄、民兵和功能节点；保留简化地图结构，没有恢复被否决的装饰房屋与实体建筑。
- 增加减少动态偏好支持。
- 更新静态契约与设计记录。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 增加英雄语义站位、繁荣村民数量规则、四类路线配置与世界层渲染。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 增加英雄头像层级、普通村民剪影与四类差异化路线动画。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 锁定真实英雄/民兵、繁荣等级派生居民和多路线契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新当前地图表现说明。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 记录真实单位与氛围居民的信息层级。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 更新简化地图用户路径和不做事项。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 记录繁荣居民只做人气表现、不做挂机收益。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `git diff --check -- projects/western_fantasy_continent/border_village_war_web projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: PASS；仅输出仓库既有 LF/CRLF 警告。
- 未启动服务器，未打开浏览器。

## Current State

地图同时表现真实英雄、真实民兵与繁荣带来的普通居民。英雄和民兵可交互；普通居民仅提供城镇活力，使用不同短路线且不会遮挡节点交互。战士仍只在左侧完整单位列显示，避免地图重新拥挤。

## Unresolved

- 英雄语义站位与普通居民路线的实际观感仍需真人刷新试玩确认。
- 当前每繁荣等级2名居民是第一版密度，后续可仅调密度、路径锚点和速度，不应增加新的系统含义。

## Recommended Next Step

刷新静态页面，重点观察繁荣Lv.1与更高等级下英雄、民兵、普通居民是否能一眼区分，以及普通居民是否会穿过功能节点。
