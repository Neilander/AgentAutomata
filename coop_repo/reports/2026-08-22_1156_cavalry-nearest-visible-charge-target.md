# Agent Handoff: 骑兵冲刺改为最近可见目标

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 马骑兵移动类动作选敌
- Status: complete

## User Intent

修正骑兵冲刺没有朝最近敌人前进、方向看起来反常的问题。

## Completed

- 确认根因是马骑兵继承普通近战“优先敌方前排”的选敌规则；更近的侧边或后排敌人会被忽略。
- 马骑兵改为从所有可见敌人中按实际距离选择最近目标，不再先筛前排。
- 奔跑施法会重新锁定最近可见敌人的方向；起步后保持原设计的直线奔跑，避免途中左右折返。
- 击杀后的乘胜冲锋也在执行瞬间重新取得最近可见目标。
- 二连跃朝向、常规接敌与奔袭铁骑突破因使用骑兵权威选敌，同步取得最近目标。
- 嘲讽和强制目标仍优先于最近目标，隐身敌人不作为移动类技能锁定对象。
- 奔跑技能资产与设计说明同步更新。

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-sim.js`: 增加骑兵最近可见目标选择并接入奔跑与乘胜冲锋。
- `projects/western_fantasy_continent/game_data/skill_assets/skills/cavalryRun.json`: 明确奔跑锁定最近可见敌人。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 同步浏览器资产。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 覆盖“更近后排 vs 更远前排”和强制目标优先级。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 更新奔跑选敌规则。

## Validation

- `node --check projects/western_fantasy_continent/game_data/combat-sim.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS；骑兵选择更近后排，奔跑方向不再朝更远前排，强制目标仍能覆盖。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-combat-equipment-sets.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 全套装4v4/8v8/20v20固定样本均正常结束；8v8和20v20仍各有1次突破，截断分别为3和8。
- `git diff --check`: PASS，仅有现有LF/CRLF提示。
- 按用户要求未进行浏览器验证。

## Current State

骑兵的移动与冲锋目标现在是最近可见敌人，而普通战士等近战单位仍保留前排优先。奔跑只在起步时瞄准，随后沿该方向直跑2.8秒，符合“持续朝前移动”的原始技能定义。

## Unresolved

- 如果用户希望奔跑途中持续追踪移动目标，需要重新定义为可转向追击；当前刻意避免这种行为，以免骑兵在敌群中反复折返。

## Recommended Next Step

由用户在灰谷演武台观察奔跑和乘胜冲锋的朝向；若起步目标正确但途中直线轨迹仍不符合预期，再单独讨论转向能力。
