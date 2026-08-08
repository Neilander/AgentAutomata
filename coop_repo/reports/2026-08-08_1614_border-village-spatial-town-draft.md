# Agent Handoff: Spatial Town Draft

- Date: 2026-08-08
- Agent/thread: Codex `/root`
- Scope: 灰谷村地图空间化与真实单位在场表现试稿
- Status: complete

## User Intent

地图需要更像一座真实存在的城镇：有明确城镇范围和数座房屋，民兵集中在房屋附近，英雄根据身份站在各自的位置，让经营主界面产生人气。先做一版试玩，不合适再回退。

## Completed

- 在地图中央建立连续的灰谷村范围，加入围栏、内部道路、装饰房屋、农地、水井、篝火与村名。
- 把村庄内七个建设位重新集中到聚落范围；房屋、农田、铁匠铺、集市、征召所使用不同的地图建筑轮廓，同时保留收益标识、点击、行动数和原节点逻辑。
- 新增真实单位世界层，直接读取正式英雄、民兵和战士数据，不创建装饰性假单位。
- 为已知英雄设置语义站位：玩家在中央活动区、伊莎贝拉在北侧村口，其他英雄分布在村缘、铁匠铺等位置。
- 每支10人民兵以三人剪影聚集在房屋或征召所周围；战士使用独立颜色在北侧列队。
- 世界人物只有轻量待机动画，不做寻路；点击地图人物与左侧头像进入同一人物页。
- 左侧单位总览继续保留，承担快速计数与入口；世界人物承担存在感。
- 增加静态契约，检查聚落构成、实体建筑、真实队伍数据、地图人物点击入口和待机表现。
- 更新 README、UI 计划、用户路径审查与方向文档。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/index.html`: 增加聚落SVG场景与地图单位层。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 增加村庄场景、五类建筑轮廓、英雄/部队剪影及轻量待机样式。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 重新组织村内节点位置并渲染真实世界单位。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加空间化地图的静态契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 记录空间化地图行为。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化世界表现与左侧总览的职责分工。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 增加灰谷村空间化试玩路径。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 记录本轮试稿及后续巡逻前置关系。

## Validation

- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: PASS；17个请求、2场真实战斗、最终战可重试。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-winning-route.js`: PASS；74场战斗，最终15v16获胜。
- `git diff --check`: PASS；仅输出仓库既有 LF/CRLF 警告。
- 首次误把三个核心验证脚本写在 `border_village_war_web` 目录下，命令因模块不存在失败；随后按实际文件位置 `border_village_war` 重跑并全部通过。
- 按既定要求未启动服务器、未打开浏览器。

## Current State

地图从抽象节点散点改为具有聚落范围的试稿。核心玩法、战斗、资源、节点行动、人物页与左侧总览均未更改；本轮主要修改集中在 `index.html`、地图CSS和 `renderWorldUnits`/地图坐标，因此若用户否决，可以单独回退空间化表现而不影响之前通过的人口轴等功能。

## Unresolved

- 未进行浏览器截图验证；建筑、单位与节点在真实窗口缩放下是否拥挤，需要用户直接试玩判断。
- 当前单位只使用语义锚点和轻量上下待机，不包含巡逻、去向状态或收益。
- 世界人物使用CSS剪影而非正式美术资源，重点是先验证空间结构与在场感。
- 左侧总览与地图人物同时存在可能产生一定重复感，需根据真人观感决定是否进一步弱化总览。

## Recommended Next Step

刷新现有试玩页面，先判断村庄范围、建筑密度、人物大小和双重单位表现是否成立；如果空间感通过，再从这些驻点延伸民兵巡逻。如果整体方向不对，只回退本报告列出的空间化文件片段。
