# Agent Handoff: 地图单位方块去框与换列

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war_web` 主地图单位表现修正
- Status: complete

## User Intent

修正第一版单位头像列：方块缩小约10%，高度放不下时换到第二列，不使用滚动条，也不要用一个大框包住全部单位。

## Completed

- 单位方块由44px缩小到40px。
- 删除头像列的标题、总数徽章、整体边框、整体底色、整体阴影和滚动条。
- 方块直接浮在地图左侧，从上到下排列；当前高度放不下时自动向右换列。
- 单个方块保留自己的类型边框、状态角标和小阴影，仍可区分玩家、主将、候补、民兵和战士。
- 战争牌继续向右让位，避免正常两列时重叠。
- 单位方块现在只是地图表现，不再形成阻断地图拖拽或缩放的整条透明操作区。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 删除头像列标题容器，并恢复头像区域上的地图输入。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 40px方块、纵向自动换列、去除大框与滚动。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 换列、尺寸和无大框/无滚动契约。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 更新单位表现规范。

## Validation

- `node --check border-village-web.js`: PASS。
- `node verify-static-web.js`: PASS。
- `git diff --check`: PASS。
- 未启动服务器或浏览器。

## Current State

单位不再被一个面板包住，而是以40px独立方块直接叠在地图左侧；垂直空间用完后自动换列。

## Unresolved

- 当前仍使用汉字徽记代替正式头像美术。
- 未启动浏览器人工检查用户当前窗口中的实际换列位置。

## Recommended Next Step

刷新试玩检查方块大小、列间距和战争牌位置；确认后再继续下一项UI改造。
