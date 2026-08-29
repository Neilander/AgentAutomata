# Agent Handoff: 关注单位技能提示

- Date: 2026-08-22 16:22
- Agent/thread: Codex `/root`
- Scope: 灰谷共享战斗的手动开战、单位关注与阵营侧技能提示
- Status: complete

## User Intent

让玩家在战斗开始前先看清阵容、选择一个关注单位，再手动开战；战斗中只提示该单位释放的技能和少数关键效果，并按单位所属势力从对应侧边滑入/缩回。

## Completed

- 灰谷的普通战斗与演武战斗改为顶部按钮手动开始，连续刷装战斗保持原有自动流程。
- 战前和战中均可直接点击单位关注；再次点击取消，点击其他单位切换。
- 关注单位增加持续光圈，左右阵营使用不同色调。
- 关注提示按阵营从左上或右上滑入；新提示置顶、旧提示向下排列，最多保留4条并从原侧缩回。
- 提示只接收关注单位的小技能、大招与低频关键触发：冲锋就绪/突破/截断、击杀转火、繁生绽放/传播、护佑回响、叹息之墙、流星火雨、天穹之箭与濒死保命。
- 普攻、普通伤害、治疗数字、常规叠层等高频信号不进入侧边提示。
- 补充静态契约，固定手动开始、关注信号路由、关键效果白名单与左右退出动画。

## Files Changed

- `projects/western_fantasy_continent/battle_view/battle-view.js`: 手动开战状态、单位选择、关注信号过滤和提示队列。
- `projects/western_fantasy_continent/battle_view/battle-view.css`: 开战按钮、关注光圈、左右技能提示及进退场动画。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 灰谷战斗启用手动开始与关注提示；连续刷装未启用。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 新增关注系统静态契约。

## Validation

- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS；冲锋权威逻辑未回归。
- `node --check projects/western_fantasy_continent/battle_view/battle-view.js`: PASS。
- `git diff --check -- <本次4个实现文件>`: PASS，仅有现有CRLF提示。
- 按用户要求未进行浏览器/网页视觉验证。

## Current State

打开灰谷战斗后模拟器处于0秒准备态，单位已经排好且可选；点击顶部“开始战斗”才推进权威战斗。关注提示独立于职业特效过滤，即使只显示骑兵特效，关注单位的允许事件仍能进入侧栏。

## Unresolved

- 未做浏览器视觉验收，20v20时侧栏遮挡程度、实际动画节奏和关注光圈辨识度需由用户在网页中确认。
- 当前关键效果采用显式白名单；后续新增职业或套装时需要决定是否加入。

## Recommended Next Step

由用户在演武台分别关注左侧和右侧单位，确认开始按钮、切换/取消关注、提示方向、堆叠密度与消失节奏；若信息仍多，优先收窄关键效果白名单或把最大条数从4降为3。
