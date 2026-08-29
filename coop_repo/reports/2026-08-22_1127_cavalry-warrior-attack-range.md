# Agent Handoff: 骑兵攻击距离对齐战士

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 马骑兵基础攻击距离
- Status: complete

## User Intent

将马骑兵攻击距离从此前的20调整为与战士相同，修正演武中看起来不合理的远距离普攻表现。

## Completed

- 确认战士权威基础攻击距离为13。
- 马骑兵正式职业资产与浏览器内置资产的攻击距离由20改为13。
- 奔跑技能描述中的可普攻范围同步为13；技能位移、冲锋距离、移速及其他基础数值不变。
- 专项校验改为直接断言骑兵攻击距离等于战士，避免以后两者再次漂移。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/roles/cavalry.json`: 正式骑兵射程改为13。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 同步浏览器资产。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 校验骑兵与战士同射程。
- `projects/western_fantasy_continent/game_data/verify-move-speed.js`: 同步骑兵草案运行样本。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 更新基础数值与奔跑技能说明。

## Validation

- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS，运行时 range=13。
- `node projects/western_fantasy_continent/game_data/verify-move-speed.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS，冲锋套隔离倍率仍为2.82且可形成突破。
- `node projects/western_fantasy_continent/game_data/verify-combat-equipment-sets.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 全套装固定样本：8v8与20v20仍各有1次成功突破命中；4v4骑兵仍在突破前阵亡。
- 按用户此前要求未进行浏览器验证。

## Current State

马骑兵和战士都使用13攻击距离。骑兵仍靠18移速、技能位移与冲锋机制建立差异，不再通过更长普攻射程获得额外的持续输出空间。

## Unresolved

- 射程降低会改变马骑兵接敌位置和部分固定种子战斗结果；当前只做机制回归，没有重新执行50轮规模平衡统计。

## Recommended Next Step

由用户在灰谷演武台直接观察新的贴身攻击位置；若手感正确，再决定是否需要重新跑三种规模的50轮平衡样本。
