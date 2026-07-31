# Agent Handoff: 灰谷村不可用行动持续可见

- Date: 2026-07-31
- Agent/thread: `/root`
- Scope: 灰谷村核心动作目录、地图节点浮窗、铁匠/集市/队伍界面与回归验证
- Status: complete

## User Intent

当前已经解锁、与玩家眼前决策相关的操作不能因行动力或资源不足直接消失；应继续显示，以红色禁用状态明确说明还缺什么，同时不能借此泄露尚未发现的未来事件或敌方据点。

## Completed

- 核心动作目录现在统一输出 `available` 与 `disabledReason`，前端不再自行猜测可用性。
- 修建、升级、征召、精炼、分解、打造、已发现突袭、当日事件、集市买卖与编队操作在暂时不可用时仍保留。
- 阻塞原因会具体列出行动力、金币、铁料、精钢、人口容量、建筑完工状态、征召所等级、集市购买力或队伍人数限制；多个条件同时不足时会同时列出。
- 地图节点操作以红色禁用卡显示原因；铁匠打造下拉框保留所有八个部位，并在下方显示当前所选部位的阻塞原因；集市出售与编队按钮也使用同一红色状态。
- 核心拒绝直接执行禁用行动，也不会为禁用突袭生成战斗计划。
- 尚未触发的未来事件、未取得情报的据点继续隐藏，没有把探索答案提前公开。
- 合理胜利路线验证改为只选择 `available !== false` 的行动，避免测试器把“可见但禁用”误当作可执行项。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 建立统一动作可用性协议与具体阻塞原因，并封住禁用行动执行边界。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 增加不可用行动持续可见、精确原因、不可绕过和未来内容不泄露验证。
- `projects/western_fantasy_continent/border_village_war/verify-border-village-winning-route.js`: 路线玩家只从可执行行动中选择。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 地图、铁匠、集市、配装与编队消费统一可用性字段。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 增加不透明的红色禁用视觉与原因文本。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加禁用操作可见性和红色视觉契约。

## Validation

- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS，包含 visible red-state contract。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: PASS，17次审查请求、到达第7日、2场真实战斗。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-winning-route.js`: PASS，58场真实战斗，最终10v18、5名我方存活。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node --check` 核心与网页脚本：PASS。
- 未启动服务器或浏览器。

## Current State

玩家打开一个已经解锁的节点时，会同时看见能做和暂时不能做的选择；不可用项不会消失，而是红色显示，并直接告诉玩家补足条件。未来内容仍依赖剧情或情报解锁，不出现在动作目录中。

## Unresolved

- 未进行真实浏览器视觉检查；本轮遵循只开发并程序验证、不启动服务器的约束。
- 当前节点数量徽标仍显示该节点全部操作数；浮窗标题显示“可用数/总数”，后续可根据试玩决定地图徽标是否也改成双数字。

## Recommended Next Step

直接从工作台启动灰谷村试玩，重点观察行动力归零、铁料不足、集市购买力不足和队伍满员时的红色原因是否足够易扫读。
