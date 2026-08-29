# Agent Handoff: 马骑兵演武台网页接入

- Date: 2026-08-22
- Agent/thread: Codex `/root`
- Scope: 将马骑兵4v4、8v8、20v20无套装测试接入灰谷村玩法网站的演武台
- Status: complete

## User Intent

在当前主玩法网站`border_village_war_web`已有演武入口中加入马骑兵4v4、8v8、20v20测试，供用户自行打开网页验收。

## Completed

- 将原“繁生之环演武场”扩为通用“灰谷演武台”，保留繁生之环A/B测试。
- 新增马骑兵4v4、8v8、20v20三个无套装按钮，均直接进入共享战斗视图，不消耗行动力、粮食或改动存档。
- 三档均沿用已评测平衡块：我方每4人为骑士/马骑兵/法师/牧师，敌方对应为骑士/战士/法师/牧师。
- 战后结果针对马骑兵显示团队输出占比、平均生存时间、亲手击杀和结束存活数，并可返回演武台重复运行。
- 为网页战斗视图和职业图标表补充马骑兵图标。
- 静态网页校验加入三档规模、骑兵人数比例、对照战士位置和结果指标断言。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 新增`cavalryMockPlan`，并让套装/骑兵演武统一返回通用演武台。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 扩展演武台入口、马骑兵三档启动分支与专项战后统计。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 校验演武台接线、三档阵容与专项指标。
- `projects/western_fantasy_continent/battle_view/battle-view.js`: 加入马骑兵角色图标。

## Validation

- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 通过`BORDER_VILLAGE_WAR.simulatePlan(cavalryMockPlan(size))`实跑4v4、8v8、20v20：三档均完成并产生骑兵输出、生存、击杀与存活统计。
- `node --check`检查核心、网页脚本和战斗视图：PASS。
- `git diff --check`: PASS，仅有现存Windows行尾提示。
- 按用户明确要求，没有继续进行浏览器打开、点击或视觉验收；页面实际观感由用户验证。

## Current State

灰谷地图下方的“灰谷演武台”现在有5个测试入口：马骑兵4v4、8v8、20v20，以及繁生之环无套装/六件套A/B。马骑兵三档是单次确定性无套装演示，不冒充此前每档50局的统计结论。

## Unresolved

- 尚未由用户实际打开网页确认演武台弹层在其窗口尺寸下的视觉布局和点击体验。
- 演武使用固定种子，重复点击同一规模会得到相同单局结果；如以后需要在网页内做多种子抽样，应单独设计轮次/汇总交互。

## Recommended Next Step

用户打开`http://localhost:3777/border_village_war_web/`，在地图下方点击“灰谷演武台”，依次验收马骑兵4v4、8v8、20v20；若界面或战斗表现有问题，再按具体反馈调整。
