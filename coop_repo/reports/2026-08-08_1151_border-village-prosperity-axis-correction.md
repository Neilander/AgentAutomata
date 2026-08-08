# Agent Handoff: Border Village Prosperity Axis Correction

- Date: 2026-08-08
- Agent/thread: Codex `/root`
- Scope: 当前城镇框定位与繁荣收益信息层级纠正
- Status: complete

## User Intent

纠正上一版对“右上角”和人口收益轨迹的误解：当前城镇框应位于顶部栏下方的地图右上角；繁荣界面不应为每个收益建立大卡片，而应是一条人口轴，人口在轴上，奖励在轴下，并突出行动力、弱化民兵奖励。

## Completed

- 将当前城镇框从顶部栏移到地图右上角，明确位于顶部栏下方；地图隐藏进入战斗时，城镇框一起隐藏。
- 顶部栏恢复为标题、七日时间轴、金币/粮食、结束本日与重开，不再被城镇框挤占。
- 删除繁荣轨迹中的全部里程碑卡片、卡片背景、边框、标题段和等权奖励块。
- 重构为单一连续人口轴：人口数字在轴上，节点在轴中，奖励在轴下。
- 繁荣节点用较大字号显示“行动力 +1”；每10人口的“+1 民兵单位”使用更小字号。
- 当前节点使用金色圆点，已达节点使用绿色，未来节点灰色；超过当前人口上限的轴下区域用虚线弱化。
- 保留左右拖拽、滚轮横移、方向键和打开时定位当前节点。
- 更新静态契约，明确禁止城镇框回到顶部栏、禁止收益恢复为卡片。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/index.html`: 城镇框移动到地图层。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 单轴布局及奖励字号层级。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 轴节点的精简渲染。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 位置与非卡片轴契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 玩家说明纠正。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 信息层级纠正。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 审查路径纠正。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 设计结论纠正。

## Validation

- `node --check .../border-village-web.js`: PASS.
- `node .../verify-border-village.js`: PASS.
- `node .../verify-border-village-input-boundary.js`: PASS.
- `node .../verify-border-village-sealed-surface.js`: PASS.
- `node .../verify-border-village-winning-route.js`: PASS（74场战斗，最终战15v16获胜）。
- `node .../verify-static-web.js`: PASS，`serverStarted: false`。
- `git diff --check`: PASS（仅已有LF/CRLF提示）。

## Current State

地图是主表面，当前城镇框作为地图HUD位于其右上角。繁荣窗口只使用一条人口轴表达门槛和收益，行动力与民兵奖励具有明确主次。

## Unresolved

- 遵守当前约束，未启动服务器或浏览器；视觉结果由静态结构和CSS契约验证，仍需要用户在实际窗口判断间距。
- 顶部摘要仍保留当前人口、当前繁荣和行动三项纯文本，但已取消各自边框和卡片底板。

## Recommended Next Step

真人检查人口轴：重点看行动力字号是否足够突出、十一个刻度的横向间距是否合适，以及地图右上角城镇框会不会遮挡附近节点。只针对这三项继续微调，不再增加面板或卡片。
