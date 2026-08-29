# Agent Handoff: 短冲刺直接进入套装冲锋

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 马骑兵小技能2“奔跑”与奔袭铁骑联动
- Status: complete

## User Intent

解决奔跑持续时间过长、骑兵自己飞出很远的问题，并确认这段冲刺能够触发奔袭铁骑套装、进入冲锋状态。

## Completed

- 奔跑持续时间由2.8秒缩短为0.8秒，CD仍为10秒。
- 无套装骑兵完整冲刺约移动18，不会获得套装冲锋状态。
- 奔袭铁骑的25%移速加成现在会正确作用于奔跑，完整短冲约移动22.5。
- 穿奔袭铁骑六件套且尚未蓄势时，施放奔跑会立即进入套装“冲锋就绪”状态并发出正式套装信号。
- 奔跑结束后恢复正常AI，可对最近敌人尝试冲锋突破；冲锋就绪仍由突破消费。
- 网页“冲锋蓄势”统计改为只计算 `equipmentSet + cavalryCharge + chargeReady`，不再把击杀被动“乘胜冲锋”混入套装数据。
- 技能资产、浏览器内置资产和骑兵设计记录同步更新。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/skills/cavalryRun.json`: 奔跑改为0.8秒并声明进入套装冲锋状态。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 同步浏览器技能资产。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 奔跑接入套装移速与直接蓄势，复用正式冲锋信号。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 固定0.8秒持续时间。
- `projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: 新增无套装/六件套短冲的移动与蓄势行为回归。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 套装冲锋蓄势统计排除击杀被动。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 更新短冲与六件套联动说明。

## Validation

- combat与web `node --check`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS；奔跑持续0.8秒。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS；无套移动18且不蓄势，六件套施放时立即蓄势、完整移动22.5并产生 `skillRun` 套装信号。
- `node projects/western_fantasy_continent/game_data/verify-combat-equipment-sets.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-nearest-targeting.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 无骑士固定样本中，无套装4v4/8v8/20v20的套装蓄势均为0；全套装为1/4/8，8v8与20v20分别形成2/3次突破命中。
- `git diff --check`: PASS，仅有现有LF/CRLF提示。
- 按用户要求未进行浏览器验证。

## Current State

奔跑现在是一段短而明确的启动技能，不再横跨大半战场。六件套骑兵使用它时必定进入套装冲锋就绪；若在施法前已通过普通移动或二连跃蓄势，则保持现有冲锋状态，不重复叠加信号。

## Unresolved

- 固定演武里的骑兵常在奔跑前已由普通接敌移动完成蓄势，因此战报显示的是套装蓄势总数，不单列“由奔跑首次触发”的次数。
- 4v4固定样本虽然能够蓄势，但当前没有成功突破；8v8更适合观察完整联动。

## Recommended Next Step

由用户刷新灰谷演武台并查看全套装8v8：奔跑应明显缩短，骑兵头上出现“冲锋就绪”，随后可观察突破命中。
