# Agent Handoff: Circular Militia Avatars

- Date: 2026-08-08
- Agent/thread: Codex `/root`
- Scope: 灰谷村世界地图民兵视觉降噪
- Status: complete

## User Intent

地图里的民兵三人剪影过于杂乱；每支民兵改为与战斗场景一致的单个圆形头像。

## Completed

- 每支10人民兵从三人剪影改成一个34px圆形职业头像。
- 圆形头像读取正式 `roleKey` 对应的职业图标，与战斗场景的单位识别方式一致。
- 右下角保留小号单位编号，常态下不再显示“民兵1”等文字标签；完整名称、职业与驻点信息保留在悬停标题和无障碍标签中。
- 点击圆形头像仍打开对应民兵人物页，真实单位数据与站位不变。
- 英雄单人剪影和战士列队暂不调整。
- 增加静态契约并同步相关说明文档。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 民兵地图标记改为单圆形职业头像。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 增加战斗风格圆形民兵头像和编号样式。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 验证一支民兵只渲染一个圆形头像。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新地图单位表现说明。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化民兵视觉降噪规则。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 更新空间化地图验收路径。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 同步试稿结论。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `git diff --check`: PASS；仅输出仓库既有 LF/CRLF 警告。
- 未启动服务器、未打开浏览器。

## Current State

地图上每支民兵只占一个紧凑圆形头像，建筑、道路和英雄更容易辨认；民兵仍位于房屋与征召所附近并保留人物页入口。

## Unresolved

- 真人试玩需要确认34px头像与当前地图缩放是否合适。
- 战士仍使用三人剪影；若民兵新样式通过，可再决定战士是否也统一为圆形头像。

## Recommended Next Step

刷新页面查看民兵密度；若通过，再决定英雄和战士是否继续保留当前表现。
