# Agent Handoff: 全职业默认攻击最近目标

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 共享战斗默认选敌规则
- Status: complete

## User Intent

默认攻击最近敌人应当是所有单位的共同规则，而不是马骑兵独有特例。

## Completed

- 删除共享战斗中近战单位“优先敌方前排”的默认选敌规则。
- 删除刺客普通AI“默认选择最低血敌人”的特例。
- 11个正式职业现在统一从可见敌人中按实际距离选择最近者，用于普通接敌、普攻和未声明特殊目标的技能。
- 保留强制目标、嘲讽与刺客技能建立的专属锁定优先级。
- 明确写有最低血、后排或其他目标规则的技能仍使用各自技能逻辑，不受默认最近目标规则覆盖。
- 新增全职业专项回归，覆盖更近后排与更远前排、刺客面对远处残血、隐身、强制目标和嘲讽。

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-sim.js`: 将权威默认选敌统一为最近可见敌人。
- `projects/western_fantasy_continent/game_data/verify-nearest-targeting.js`: 新增11职业及覆盖优先级专项校验。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 将骑兵断言文案调整为全局最近目标规则。

## Validation

- `node --check projects/western_fantasy_continent/game_data/combat-sim.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-nearest-targeting.js`: PASS；11个正式职业均选择最近可见敌人，强制目标、嘲讽等覆盖正常。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-combat-equipment-sets.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 无套装和全套装4v4/8v8/20v20固定演武共六场均正常结束。
- `git diff --check`: PASS，仅有现有LF/CRLF提示。
- 按用户要求未进行浏览器验证。

## Current State

共享战斗默认规则已统一为最近可见敌人。职业差异不再偷偷藏在基础选敌中；需要越过最近目标的行为必须由嘲讽、强制锁定或技能本身明确声明。

## Unresolved

- `advanced_battle_demo`、`genre_arena`、`team_simulator`等旧独立原型拥有各自模拟器，本次未改；当前灰谷网站与正式数据使用的是共享 `game_data/combat-sim.js`。
- 全局选敌改变会影响旧固定种子战局结果，当前完成机制与稳定性回归，未重新做大样本平衡统计。

## Recommended Next Step

由用户在灰谷演武台确认所有职业的接敌方向；如果某个技能仍越过最近目标，需要先判断它是有意的技能目标规则还是遗漏的施法门槛。
