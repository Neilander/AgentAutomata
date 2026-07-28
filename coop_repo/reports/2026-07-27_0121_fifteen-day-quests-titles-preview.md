# Agent Handoff: 十五日任务关联、称号试炼与战前预览

- Date: 2026-07-27
- Agent/thread: Codex primary
- Scope: 15 日围剿 Demo 核心与现有网页
- Status: complete

## User Intent

在现有 15 日版本上降低离散事件造成的信息过载：任务在取得线索后逐步出现，点击任务可查看当前关联事件，同一事件可以影响多条线；同时增加角色入队覆盖提示、七级冒险家称号与真实晋级试炼，并在所有战斗前预览敌方阵容和称号等级。

## Completed

- 新增六条当前可见任务关系：三幕主线与证人、王炉门、假判决、平民保障等支线按已发生状态出现。
- 任务只关联当前已经出现的地点；同一地点可以带多个 `questLinks`，不会生成或预告未来事件。
- 行动观察新增确定资源变化和当前受影响任务线；隐藏结果、精确条件、掉率与最优解仍封口。
- 新增七级冒险家称号。晋级为不耗行动力的真实战斗试炼，失败可调整队伍后重试。
- 刷装、事件战与三幕决战计划都新增敌方称号评定。
- 网页左上增加紧凑任务条；选择任务后高亮关联地图点、弱化无关地点，地点浮窗列出其所属任务线。
- 所有战斗与连续刷装首轮先进入战前预览，显示双方人数、双方称号与敌方成员；玩家可以取消或确认。
- 角色加入后显示覆盖全屏的半透明灰色提示，列出角色姓名、定位和前三项公开技能。
- 正式玩家输入同步获得当前任务、任务关联、称号、确定资源影响和当前受影响线路。

## Files Changed

- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-core.js`: 任务关系、称号、真实晋级战、敌方评定与玩家观察。
- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-formal-player-loop.js`: 密封玩家输入接入当前任务和称号。
- `projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-demo.js`: 多线事件与称号试炼回归。
- `projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-input-boundary.js`: 当前任务可见、未来任务不泄露回归。
- `projects/western_fantasy_continent/five_day_guard_raid/index.html`: 任务条、战前预览和入队覆盖层挂点。
- `projects/western_fantasy_continent/five_day_guard_raid/five-day-raid-web.js`: 任务地图镜头、战斗确认、称号入口和招募反馈。
- `projects/western_fantasy_continent/five_day_guard_raid/styles.css`: 新增任务、预览、称号和招募覆盖样式。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-static-web.js`: 新界面合同和绕过预览检查。
- `projects/western_fantasy_continent/five_day_guard_raid/UI_PLAN.md`: 更新玩家可见信息层级与禁泄露规则。
- `projects/western_fantasy_continent/five_day_guard_raid/USER_REVIEW.md`: 更新任务、战前、招募与称号玩家路径审查。

## Validation

- `node projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-demo.js`: PASS。
- `node projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-input-boundary.js`: PASS。
- `node projects/western_fantasy_continent/five_day_guard_raid/verify-static-web.js`: PASS，静态入口无 `fetch`，战斗不能绕过预览。
- `node projects/western_fantasy_continent/five_day_guard_raid/verify-formal-player-loop.js`: PASS。
- `node projects/western_fantasy_continent/five_day_guard_raid/verify-real-combat-integration.js`: PASS。
- 称号校准：单人无装备可过 2 级、不能过 3 级；第一幕四人无装备可过 4 级、不能过 5 级；十人无装备可过 6 级、不能过 7 级；十人神话装备可过 7 级。

## Current State

首屏只显示已知主线。支线在玩家先取得有效线索后出现；第二日起可见事件能同时标记主线与支线。战斗入口先产生计划，再由战前预览确认后启动共享真实战斗，称号试炼同样走完整战斗结算。

## Unresolved

- 按用户要求，本轮没有启动服务器或做真实浏览器渲染检查；程序合同、静态源码与战斗模拟均已验证，但具体分辨率下的任务条遮挡仍需玩家试玩确认。
- 称号是队伍整体实战评定，当前没有拆分为单角色称号。

## Recommended Next Step

玩家直接试玩现有页面，优先观察：左上任务条是否仍占用过多注意、跨线事件的提示是否足够但不泄露，以及战前称号是否能帮助判断而不变成绝对胜负承诺。
