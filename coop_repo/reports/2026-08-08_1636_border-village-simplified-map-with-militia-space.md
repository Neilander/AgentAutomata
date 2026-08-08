# Agent Handoff: Simplified Map With Militia Space

- Date: 2026-08-08
- Agent/thread: Codex `/root`
- Scope: 回退过度空间化地图并保留圆形民兵表现
- Status: complete

## User Intent

上一版的房屋、道路细节和人物剪影太乱。地图恢复成接近最初的简洁节点图，只需要更注意排布并为已经通过的圆形民兵头像留下空间。

## Completed

- 撤除详细空间化试稿中的聚落地表、装饰房屋、内部道路、水井、农地、篝火和村名。
- 撤除五类实体建筑轮廓，房屋、农田、铁匠铺、集市、征召所和建设位恢复统一节点卡片。
- 建筑节点恢复接近初版的外围位置，中央不再放置功能节点。
- 地图世界层只保留真实民兵；英雄和战士不再重复渲染，继续由左侧单位列统一总览。
- 最多10支民兵在中央预留区域按整齐网格分布，每支仍使用单个圆形职业头像和小号编号。
- 地图民兵继续读取真实队伍数据，并保留点击人物页入口与轻量待机。
- 更新静态契约，明确详细聚落装饰、实体建筑和世界英雄/战士不得重新出现。
- 同步 README、UI计划、用户审查和方向设计记录。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/index.html`: 删除详细聚落SVG，只保留初版地形与民兵世界层。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 删除实体建筑与多人物剪影样式，保留简洁圆形民兵。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 恢复初版节点位置，世界层只渲染真实民兵并使用中央网格。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 锁定简化地图和民兵预留区契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新简化地图说明。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化节点与民兵的空间分工。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 将空间化审查改为简化排布审查。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 记录详细空间化版本被否决及保留内容。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: PASS；17个请求、2场真实战斗、最终战可重试。
- `git diff --check`: PASS；仅输出仓库既有 LF/CRLF 警告。
- 未启动服务器、未打开浏览器。

## Current State

地图视觉已经回到初版附近：统一功能节点沿外围分布，中央只显示真实民兵圆形头像。之前通过的人口轴、征召反馈、军备、战前粮食和战斗流程均未改动。

## Unresolved

- 中央民兵网格的实际间距和节点避让仍需真人试玩确认。
- 当前民兵只有待机表现，还没有巡逻或真实收益。

## Recommended Next Step

刷新页面查看不同民兵数量下中央集结区是否清楚；若通过，再讨论巡逻时圆形头像如何离开集结区。
