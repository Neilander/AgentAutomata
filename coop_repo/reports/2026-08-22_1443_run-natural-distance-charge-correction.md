# Agent Handoff: 奔跑按真实距离自然触发冲锋

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 纠正马骑兵奔跑与奔袭铁骑六件套联动
- Status: complete

## User Intent

奔跑不应在施放瞬间硬授予冲锋状态；它应像其他移动一样，由奔袭铁骑套装按原本的移动距离规则自然累计并触发。

## Completed

- 撤销上一版错误的 `entersChargeState` 技能特殊字段及施放瞬间蓄势逻辑。
- 保留用户要求的短冲：奔跑仍由2.8秒缩短为0.8秒。
- 奔跑继续正确应用自身25%加速和奔袭铁骑三件套25%移速加成；六件套骑兵完整短冲约移动22.5。
- 奔跑每帧产生的真实位移进入套装通用累计器，与普通走路、二连跃等移动完全一致。
- 奔袭铁骑六件套的真实规则保持为：累计移动达到16距离后进入“冲锋就绪”，不是按时间，也不是按技能按钮触发。
- 网页冲锋蓄势统计仍只计算正式套装信号，继续排除击杀被动。
- 更新设计文档，明确施放奔跑本身不会直接授予冲锋状态。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/skills/cavalryRun.json`: 删除直接蓄势字段，描述改为真实位移累计。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 同步浏览器技能资产。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 删除奔跑施放瞬间蓄势；保留通用距离累计与套装移速。
- `projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: 锁定15.75距离未触发、跨过16才触发的自然累计行为。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 记录正确的套装距离规则。

## Validation

- combat与assets `node --check`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS；施放瞬间未蓄势，移动15.75仍未蓄势，下一帧跨过16后自然蓄势，完整短冲22.5。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS；奔跑持续0.8秒。
- `node projects/western_fantasy_continent/game_data/verify-combat-equipment-sets.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-nearest-targeting.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 无骑士固定样本中无套装三档的套装蓄势均为0；全套装4v4/8v8/20v20为1/4/8，突破为0/2/3。
- `git diff --check`: PASS，仅有现有LF/CRLF提示。
- 按用户要求未进行浏览器验证。

## Current State

奔跑只是0.8秒真实移动技能，不含直接套装开关。奔袭铁骑六件套统一读取累计真实移动距离：普通走路、二连跃或奔跑合计达到16才进入冲锋就绪。此前 `2026-08-22_1435_short-run-arms-cavalry-charge.md` 中“施放即蓄势”的描述已被本报告纠正并取代。

## Unresolved

- 网页固定演武的骑兵常在第一次奔跑前已靠普通接敌或二连跃累计满16，因此该场景不保证由奔跑完成最后一段蓄势；隔离测试已覆盖由奔跑跨过门槛。

## Recommended Next Step

由用户刷新查看短冲手感；战斗中“冲锋就绪”出现的准确时机应取决于此前累计移动距离，而不是固定出现在奔跑施法瞬间。
