# Agent Handoff: 灰谷村短窗口完整显示

- Date: 2026-07-30 23:46
- Agent/thread: Codex primary
- Scope: 独立灰谷村前端视口高度适配
- Status: complete

## User Intent

修复独立页面在当前窗口中只能显示上部、看不到底部按钮和内容的问题。

## Completed

- 定位直接原因：`html/body`与`.game-shell`同时强制`min-height:720px`，根容器又禁止滚动；窗口低于720px时页面保持720px并从底部直接被裁切。
- 移除文档与游戏壳的720px最小高度，游戏壳改为`100dvh`严格跟随实际可见窗口。
- 低于820px时顶栏由72px压缩为58px；低于620px时进一步压缩为50px，并同步缩小标题、时间轴、资源、行动力与外边距。
- 底部装备抽屉高度改为基于`100dvh`的上限；按钮始终贴在当前窗口底部，抽屉展开也不会超出窗口。
- 正式战斗布局同步应用58px/50px短窗口顶栏，避免切入战斗后再次溢出。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 去除720px强制高度并增加两档短窗口适配。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加`100dvh`、无720px下限和自适应抽屉契约。
- `coop_repo/LATEST.md`: 指向本报告。
- `coop_repo/REPORT_INDEX.md`: 登记本报告。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；确认全高地图、覆盖抽屉、短窗口高度契约及工作台接线；未启动服务器。
- 源码审查确认已不存在`min-height:720px`，并存在58px与50px两档短窗口布局。

## Current State

页面不再假设窗口至少720px高。无论独立打开还是从工作台进入，底部“队伍与装备”按钮都位于实际视口底边；地图占据顶栏与按钮之间的全部空间。

## Unresolved

- 页面宽度仍以1080px桌面为最低目标；本轮只修复用户明确反馈的垂直裁切。
- 按用户此前约束未启动服务器或浏览器做像素截图。

## Recommended Next Step

独立页面直接刷新即可获得新CSS；若通过工作台服务访问，普通刷新即可，只有尚未重启以加载昨日新增静态路由时才需要重启Start Local。
