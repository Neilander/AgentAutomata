# Agent Handoff: 技能卡标题层级修正

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war_web`人物技能卡常态排版
- Status: complete

## User Intent

技能卡左上角应直接显示技能名，下一行显示技能类型；旧版左上是槽位、技能名落在下方，视觉上像标题位置空着。

## Completed

- 技能卡第一行左侧改为技能名。
- 第二行改为正式技能类型，例如“小技能”“被动”“大招”。
- 冷却仍位于右上角，作为次级信息。
- 悬停和键盘聚焦的精确数值浮层保持不变。
- 无障碍标签同步加入技能类型。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 调整技能卡名称、类型、冷却的DOM顺序。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 调整技能名与类型的字号、间距和主次色。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 固定技能名在类型之前的契约。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 记录技能卡阅读顺序。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 记录错误层级及修复。

## Validation

- 前端`node --check`: PASS。
- 静态前端验证：PASS。
- `git diff --check`: PASS，仅有既存LF/CRLF提示。
- 未启动服务器或浏览器。

## Current State

技能卡常态从左上开始依次读取技能名、技能类型；冷却位于右上，精确数值继续按悬停或键盘聚焦显示。

## Unresolved

- 尚未在用户当前窗口进行真人视觉确认。

## Recommended Next Step

刷新人物页确认技能名、类型和冷却的相对字号；如无问题，再继续下一项人物页调整。
