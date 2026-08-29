# Agent Handoff: 骑兵基础移速与冲锋状态速度

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 马骑兵基础移速降为12，冲锋就绪改为当前移速1.5倍
- Status: complete

## User Intent

骑兵起步不应过快：基础移速由18降为12；进入冲锋状态后速度变为1.5倍，并明确这是冲锋状态自身效果。

## Completed

- 正式马骑兵基础移速由18调整为12；JSON源资产与浏览器技能资产同步。
- 奔袭铁骑冲锋就绪的移速乘数由1.3提高到1.5；该乘数只在 `cavalryChargeReady` 状态生效。
- 六件套三件套层仍提供25%移速，因此全套装骑兵未冲锋为15，冲锋就绪为22.5。
- 奔跑技能自身仍为1.25倍速度、0.8秒；无套完整奔跑由18距离降为12，全套由22.5降为15，不再靠单次奔跑独立跨过16门槛，但可以与紧接着的连续走路合并。
- 演武台冲锋距离演示自动读取新速度：1.12秒走到16.8进入冲锋就绪，2.56秒完成12距离突破；木桩仍为0伤害。
- 更新移速、骑兵职业、套装连续移动与门槛分析脚本的断言和尺度数据。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/roles/cavalry.json`: 基础移速改为12。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 同步浏览器资产。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 冲锋就绪移速乘数改为1.5。
- `projects/western_fantasy_continent/game_data/verify-move-speed.js`: 直接验证正式骑兵12移速、13射程及减速结算。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 锁定新基础移速并增强二连跃距离边界测试稳定性。
- `projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: 锁定全套奔跑15距离、连续补足16和冲锋状态15×1.5=22.5。
- `projects/western_fantasy_continent/game_data/analyze-cavalry-charge-threshold.js`: 同步12/15/15的新尺度。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 更新职业和奔跑说明。
- `projects/western_fantasy_continent/GAMEPLAY_HANDOFF_2026-08-19.md`: 更新当前速度公式，并注明旧2.82x结果来自改速前。

## Validation

- `validate-skill-assets.js`、`verify-move-speed.js`、`verify-cavalry-role.js`、`verify-cavalry-charge.js`: PASS。
- `verify-combat-equipment-sets.js`、`verify-nearest-targeting.js`、`verify-static-web.js`、`validate-game-data.js`: PASS。
- 新速演武隔离样本：基础12、全套起步15；1.12秒/16.8距离蓄势，冲锋状态22.5，2.56秒执行12距离突破，木桩伤害0。
- 全套装门槛矩阵共600场：当前16门槛在4v4/8v8/20v20仍为100%骑兵至少蓄满一次；首次蓄势中位数均1.12秒；每名骑兵实际突破约0.56/0.80/0.71次。
- 无套装每规模50场：4v4/8v8/20v20骑兵输出占比11.65%/26.44%/30.12%，平均生存14.53/15.22/11.38秒。
- `git diff --check`: PASS，仅有工作区既有LF/CRLF提示。
- 按用户要求未进行浏览器验证。

## Current State

骑兵速度分成清楚的两档：常态12，只略快于刺客10和普通职业7；六件套下常态15，冲锋就绪再乘1.5到22.5。冲锋速度乘数叠在当前实际移速上，所以未来若有少量移速培养也会被冲锋状态放大。

## Unresolved

- 4v4无套装骑兵输出占比从改速前约27.69%降至11.65%，小规模表现明显变弱；8v8和20v20仍约26%—30%。本轮尊重用户只调整速度的设计，没有补伤害或生存。
- 旧的套装固定A/B约2.82x测试是早期隔离套装夹具，不代表新正式骑兵完整技能与新速度的规模输出；总交接已注明需以新测试为准。

## Recommended Next Step

由用户先在冲锋距离演示和4v4实战中确认常态15、冲锋22.5的视觉节奏；若4v4明显过弱，再单独讨论是调整接敌AI、基础生存还是技能伤害，不应自动把移速调回去。
