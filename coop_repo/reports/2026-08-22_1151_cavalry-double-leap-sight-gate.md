# Agent Handoff: 二连跃可见敌人释放门槛

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 马骑兵二连跃自动施法逻辑
- Status: complete

## User Intent

修正二连跃会在尚未看见敌人时提前朝空地释放的问题；技能应当在敌人进入合理视野后才释放。

## Completed

- 确认旧逻辑只判断目标是否在普攻距离外，因此二连跃开场冷却结束后可以锁定地图另一端敌人并提前释放。
- 为二连跃增加31距离释放门槛：两段10距离位移加11落地范围，保证目标静止时至少进入第二次落地的影响范围。
- 目标超过31距离或处于隐身状态时不释放、不消耗CD，骑兵继续正常接敌。
- 目标进入31距离后才允许释放并进入18秒CD。
- 修正共享模拟近距离通用施法分支，使小技能也统一经过 `canCastSlot` 门槛。
- 技能资产、浏览器内置资产与设计说明同步更新。

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-sim.js`: 在权威模拟层接入二连跃距离/可见性施法门槛。
- `projects/western_fantasy_continent/game_data/skill_assets/skills/cavalryDoubleLeap.json`: 新增 `triggerRange: 31` 并更新描述。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 同步浏览器资产。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 增加远距离等待、CD不消耗及进入视野后施法的行为回归。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 记录二连跃释放门槛。

## Validation

- `node --check projects/western_fantasy_continent/game_data/combat-sim.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS；80距离不施法且CD为0，进入31距离后施法且CD为18。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-combat-equipment-sets.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 全套装4v4/8v8/20v20固定样本均正常结束，二连跃施法次数分别为1/2/5。
- 按用户要求未进行浏览器验证。

## Current State

二连跃不再开场对远端敌人预知施法。31距离是技能自身两段位移与落地范围推导出的机制距离，不是新增可培养属性。风卷残云原本已有14距离附近敌人门槛；奔跑仍允许用于远距离接敌。

## Unresolved

- 当前没有全局通用“视野属性”；这里只为需要敌人在场才合理的二连跃建立技能级门槛。
- 其他职业技能若也存在远距离预知施法，需要逐个依据技能意图补充门槛，不应默认共用31。

## Recommended Next Step

由用户在灰谷演武台观察二连跃是否在接近敌阵后才出现；若仍显得过早或过晚，再仅调整 `triggerRange`。
