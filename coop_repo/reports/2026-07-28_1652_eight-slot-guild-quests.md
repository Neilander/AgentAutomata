# Agent Handoff: 八部位装备与冒险者协会委托

- Date: 2026-07-28 16:52
- Agent/thread: Codex `/root`
- Scope: 十五日 Demo 的装备结构、佣兵小镇词条规则、协会组队委托；城镇/事件仅出方案
- Status: complete

## User Intent

把十五日版本的角色改为八个装备部位，完全继承旧佣兵小镇的稀有度词条数量，暂不提供一键配装；以同时存在的简单/困难冒险者协会委托替换称号挑战。城镇与事件只提供后续改造方案，不直接改程序。

## Completed

- 角色装备从武器/护甲/饰品扩为武器、头盔、胸甲、护手、腿甲、靴子、戒指、护符。
- 稀有度收束为佣兵小镇的普通/稀有/史诗/传说/神话，词条数严格为 1/2/4/7/12；移植同一套部位基础属性、部位词条池、词条等级和数值滚动逻辑。
- 接入佣兵小镇使用的共享 `build-layers` 与 `mechanic-curves`，基础、主属性、攻速/急速、效果类和职业专精词条按原装备构筑层进入真实战斗。
- 移除十五日 UI 与核心的一键择优穿戴入口；新增按角色、按单件装备手动替换/卸下的玩家接口和界面。
- 增加地图上的冒险者协会节点；简单“旧路鼠患”和困难“黑铁悬赏”从首日同时可见，均不消耗行动力。
- 委托先进入组队窗口：主角必须出队，玩家可混编已招募角色与有限的协会临时同行者；确认后再显示公开敌情并进入共享真实战斗。
- 简单委托胜利掉 2 件装备；困难委托胜利掉 4 件。失败不给奖励但可重新组队尝试。
- 移除旧称号晋级挑战及我方称号展示；战前仅显示敌方人数和抽象威胁，不显示胜率、推荐阵容或隐藏数值。
- 写出城镇/事件改造方案，但未修改任何现有城镇或事件数据。

## Files Changed

- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-core.js`: 八部位/词条生成、手动装备 API、协会组队与结算、威胁标签。
- `projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-demo.js`: 将自动配装/称号试炼断言替换为八部位、手动装备和协会组队断言。
- `projects/western_fantasy_continent/five_day_guard_raid/index.html`: 协会组队对话框与战前说明。
- `projects/western_fantasy_continent/five_day_guard_raid/five-day-raid-web.js`: 协会组队流程、八部位展示、装备词条详情与手动穿脱。
- `projects/western_fantasy_continent/five_day_guard_raid/styles.css`: 八部位、词条详情与协会组队样式。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-static-web.js`: 新静态契约。
- `projects/western_fantasy_continent/five_day_guard_raid/UI_PLAN.md`: 新的协会/装备信息层级与控制契约。
- `projects/western_fantasy_continent/five_day_guard_raid/USER_REVIEW.md`: 玩家任务路径与恢复路径审查。
- `projects/western_fantasy_continent/design/town_event_redesign_proposal.md`: 城镇与事件的后续方案，未接入程序。

## Validation

- `node --check .../fifteen-day-core.js`: PASS。
- `node --check .../five-day-raid-web.js`: PASS。
- `node .../verify-fifteen-day-demo.js`: PASS。
- `node .../verify-static-web.js`: PASS（纯静态、无服务器）。
- `node .../verify-real-combat-integration.js`: PASS，共享战斗结算和封口观察未断。
- 协会实跑：主角+盾卫+医师完成简单委托，3 人存活并获得 2 件装备；同阵容挑战困难委托全灭且无掉落，证明两个入口不是同一强度换皮。
- `git diff --check`: PASS（仅 Git 的 LF/CRLF 提示）。

## Current State

十五日静态页面现在可以从地图承接协会委托、选择自有/临时成员、观看真实战斗并获得八部位多词条装备；玩家必须在背包内逐件决定交给谁。城镇与原事件内容未被本轮改写。

## Unresolved

- 按用户要求没有启动服务器或做浏览器视觉点击验证；当前只有 JS、静态合同与程序战斗验证。
- 困难委托当前对开局三人是明确碾压，尚未通过多角色中期阵容做水线平衡。
- 城镇/事件方案尚未实现，避免越过用户确认直接改设计。

## Recommended Next Step

先由用户试玩协会组队和手动八部位配装，确认操作密度是否合适；之后再单独确认 `design/town_event_redesign_proposal.md` 中的资源与建筑框架，确认后才开城镇实现。
