# Agent Handoff: 演武台骑兵冲锋距离演示

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 灰谷演武台新增1v1冲锋演示与实时距离标尺
- Status: complete

## User Intent

保留按距离计算的奔袭铁骑冲锋，在演武台增加只有一名马骑兵和一个木桩的独立演示，并加入距离标尺，直观看清16距离到底多长。

## Completed

- 保留正式六件套16连续移动距离，未改为24或28。
- 新增“冲锋距离演示 · 骑兵对木桩”入口：一名正式六件套马骑兵对一名静止、零攻击、高生命木桩。
- 演示骑兵暂时关闭主动技能与被动，只隔离展示普通移动蓄势、冲锋就绪和套装突破，避免二连跃与奔跑干扰标尺读数。
- 战场下沿新增仅在配置演示时出现的距离标尺：从骑兵出生点为0，每4距离一个刻度、每8距离显示数字，16位置以金色“六件套门槛”强调。
- 标尺上方实时显示“连续移动 x/16”，进度线随实际套装距离增长；蓄满时切换为金色“冲锋就绪”。
- 演示继续使用普通1倍速度与仅显示骑兵特效；战后沿用冲锋蓄势、突破、命中和伤害指标。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 新增1v1隔离演示计划和无行为木桩。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 增加演武入口、计划路由、标尺参数传递与演示战报。
- `projects/western_fantasy_continent/battle_view/battle-view.js`: 增加可选距离标尺、连续距离/冲锋状态同步与实时渲染。
- `projects/western_fantasy_continent/battle_view/battle-view.css`: 增加贴近战场下沿的刻度、进度线和冲锋就绪视觉状态。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 验证1骑兵/1木桩、六件套、木桩静止零伤害、16标尺、蓄势与突破均实际发生。
- `projects/western_fantasy_continent/GAMEPLAY_HANDOFF_2026-08-19.md`: 记录演武入口与标尺规则。

## Validation

- core、battle view、web `node --check`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- 隔离演示权威共享战斗：0.72秒、连续移动16.2时进入冲锋就绪；1.92秒执行12距离突破；木桩总伤害0。
- `verify-cavalry-charge.js`、`verify-cavalry-role.js`、`verify-combat-equipment-sets.js`、`verify-nearest-targeting.js`、`validate-game-data.js`: PASS。
- `git diff --check`: PASS，仅有工作区既有LF/CRLF提示。
- 按用户此前要求未进行浏览器验证。

## Current State

演武台最上方增加专用冲锋演示入口。打开后战场仍为主要视觉区域，标尺作为底部工具覆盖层显示，不增加侧栏或压缩战场；实时进度来自权威共享模拟器的 `cavalryDistance` 与 `cavalryChargeReady`，不是独立动画假数据。

## Unresolved

- 尚待用户自行在网页检查标尺文字大小、遮挡和普通速度下的观感。
- 此演示刻意关闭骑兵四技能；规模演武仍保留完整四技能，可用于观察技能位移与六件套的实战联动。

## Recommended Next Step

由用户进入灰谷演武台点击“冲锋距离演示 · 骑兵对木桩”，观察16刻度、实时进度和突破12距离是否直观；若希望再比较门槛，可后续增加16/24的演示切换，但本轮不预设该设计。
