# Agent Handoff: 队伍与装备栏滚动

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war_web` 底部队伍与装备栏
- Status: complete

## User Intent

窗口较窄或单位较多时，队伍与装备栏右侧内容不能被裁掉，需要可以用滚轮查看。

## Completed

- 队伍与装备的整体内容区在宽度不足时出现横向滚动条。
- 鼠标位于右侧角色/装备区时，纵向滚轮会转换为横向移动，能够直接看到右侧8个装备部位。
- 左侧单位名单独立支持纵向滚动，英雄和战士数量增加后不会被裁掉。
- 选择其他单位或切换底部页签后保留横向与纵向滚动位置；重开游戏时清零。
- 滚动只放在队伍页内部，没有改变地图、背包分页和底部抽屉结构。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 滚轮映射与滚动位置持久化。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 队伍页横向滚动、单位列表纵向滚动和滚动条样式。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 滚动行为静态契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 验证范围说明。

## Validation

- `node --check border-village-web.js`: PASS。
- `node verify-static-web.js`: PASS。
- 核心规则、输入边界、全日密封面、完整可胜路线：PASS。
- `git diff --check`: PASS。
- 未启动服务器或浏览器。

## Current State

底部队伍与装备栏在较窄窗口中不再永久裁掉右侧装备；右侧区域可滚轮横移，左侧单位名单可滚轮纵移。

## Unresolved

- 已做程序与静态契约验证，未在浏览器内人工检查不同窗口尺寸下的滚动手感。

## Recommended Next Step

刷新试玩页，展开“队伍与装备”，把鼠标放在右侧装备区滚动；单位很多时在左侧名单内滚动。
