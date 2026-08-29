# Agent Handoff: 演武战斗改为普通速度

- Date: 2026-08-22
- Agent/thread: Codex `/root`
- Scope: 将灰谷演武战斗的播放速度从3倍调整为1倍
- Status: complete

## User Intent

用户观察20v20骑兵战斗时不希望使用3倍速，要求按普通速度播放。

## Completed

- 所有`mock`演武战斗的表现速度由3改为1。
- 马骑兵4v4、8v8、20v20和繁生之环A/B均使用1倍普通速度。
- 正式玩法战斗原有2.5倍、连续讨伐原有2.35倍未改动。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 演武挂载共享战斗视图时使用1倍速度。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加演武1倍速静态断言。

## Validation

- 网页脚本`node --check`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS。
- `git diff --check`: PASS，仅有现存Windows行尾提示。
- 按用户约定未进行浏览器验证。

## Current State

演武中的0.6秒伤害间隔会按0.6秒现实时间播放，不再被压缩成约0.2秒；战斗模拟结果不变。

## Unresolved

- 页面实际体感由用户自行验收。

## Recommended Next Step

刷新灰谷页面后重新运行马骑兵20v20，观察奔跑切入及多名骑兵大招重叠的完整节奏。
