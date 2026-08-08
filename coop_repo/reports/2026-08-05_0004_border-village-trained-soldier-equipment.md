# Agent Handoff: 已训练战士八部位配装

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 战士配装、战斗接入与静态前端
- Status: complete

## User Intent

已训练的战士也应该能够穿装备，而不是只有英雄能配装。

## Completed

- 每支训练完成的灰谷战士成为独立配装单位，拥有武器、头盔、胸甲、护手、腿甲、靴子、戒指、护符8个部位。
- 新战士成军时立即创建装备槽；旧v3存档已有战士但没有槽位时按空8槽兼容，无需清档。
- 底部“队伍与装备”在英雄后显示每支战士，使用单独的绿色军队视觉状态；点击后沿用现有手动装备、卸下和单体一键配装流程。
- “一键整队配装”改为英雄与战士共同参与分配，英雄优先、战士随后使用剩余装备。
- 战士装备通过共享装备属性层进入突袭和最终战的真实生命、攻击、护甲、攻速、技能急速与机制词条，不是只记录评分。
- 最终战准备描述同时统计英雄与出战战士的装备覆盖和占用部位。
- 民兵仍不能装备；完成实战训练成为战士后才开放装备槽。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 战士装备目标、8槽、装备动作、自动分配、真实战斗属性与观察面。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 新战士8槽、可选择、可装备、最终战真实属性提升回归。
- `projects/western_fantasy_continent/border_village_war/README.md`: 战士配装规则。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 底部装备栏显示并操作战士。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 战士卡片状态。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 战士配装UI契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 试玩说明。

## Validation

- 核心与前端 `node --check`: PASS。
- 核心规则、输入边界、全日密封面、完整可胜路线、静态前端：全部PASS。
- 真实规则回归：训练第1支战士后公开面出现 `trained_1` 和8个装备槽；手动装备测试重刃成功持久化；最终战中该战士物理攻击实际增加超过150。
- 完整路线仍以15v16守住灰谷村。
- `git diff --check`: PASS。
- 未启动服务器或浏览器。

## Current State

英雄与战士统一使用同一套装备数据和战斗属性构建层。玩家可在同一个底部面板完成全部配装，不新增独立军队管理页面。

## Unresolved

- 一支战士代表10人，但当前以一个战斗单位共享8件装备；这是现有军队抽象的延续，尚未拆分到单兵。
- 最多10支战士加多名英雄时，底部名单会更密集；静态布局契约通过，但尚未做浏览器人工视觉检查。

## Recommended Next Step

刷新试玩，在征召所完成一次实战训练；展开底部装备栏，选择“灰谷战士第1队”并给它装备武器，再查看突袭或决战预览。
