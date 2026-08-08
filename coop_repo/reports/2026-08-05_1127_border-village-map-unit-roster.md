# Agent Handoff: 主地图我方单位头像列

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war_web` 主地图单位表现层
- Status: complete

## User Intent

主界面左侧常驻一竖列单位头像方框，显示玩家、所有已获得主将（无论是否在当前出战队伍）、所有民兵和所有战士，让地图同时承担一定的世界与队伍表现。

## Completed

- 主地图左侧加入常驻我方单位竖列，每个单位使用一个固定方框。
- 显示玩家、所有已招募英雄、每支未训练民兵和每支已训练战士；候补英雄不会隐藏。
- 玩家、队内英雄、候补英雄、民兵和战士使用不同颜色、字形与角标；悬停可看到完整姓名、角色和状态。
- 人口形成新单位、训练完成或角色加入后，竖列随真实观察面即时更新。
- 训练后的队伍沿用原队号；未训练民兵从后续队号继续编号，避免民兵第1队与战士第1队同时出现。
- 单位较多时仅在头像列内部纵向滚动；地图尺寸不改变，滚动头像列不会误触地图缩放或拖拽。
- 战争牌向右让出头像列空间；头像为表现层，本轮不添加虚假的点击操作。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/index.html`: 单位竖列挂载点。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 从真实英雄、民兵和战士状态渲染头像列，并隔离地图输入。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 方框、状态视觉、竖列滚动和战争牌让位。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 单位完整性与地图输入隔离静态契约。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 地图表现层契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 当前前端能力说明。

## Validation

- `node --check border-village-web.js`: PASS。
- `node verify-static-web.js`: PASS。
- `git diff --check`: PASS。
- 未启动服务器或浏览器。

## Current State

主地图不再只显示可点击地点；左侧会持续表现玩家当前拥有的全部人物与军队单位，并区分队内、候补、民兵和战士。

## Unresolved

- 当前没有人物美术资源，头像暂用具有稳定身份映射的汉字徽记。
- 本轮按要求只做表现，不支持点击头像查看详情、派遣或换装。
- 尚未在浏览器内人工检查用户当前窗口中的实际视觉效果。

## Recommended Next Step

刷新第一章试玩页检查头像列的尺寸和位置；确认表现层方向后，再单独决定头像点击是否进入军备/单位详情。
