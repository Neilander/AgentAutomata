# Agent Handoff: 无骑士骑兵演武编队

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 灰谷演武台骑兵4v4/8v8/20v20编队
- Status: complete

## User Intent

将骑兵演武调整为没有骑士的队伍，避免骑士嘲讽与叹息之墙影响对最近目标和骑兵冲锋的观察。

## Completed

- 六档骑兵演武（无套装与全套装各4v4/8v8/20v20）双方全部移除骑士。
- 每4人我方改为战士、马骑兵、法师、牧师；敌方改为双战士、法师、牧师。
- 全套装场中新增的战士正常穿“万夫之勇”六件套，不再出现“叹息之墙”。
- 演武台地点和六个行动说明明确标注“双方无骑士”。
- 静态校验对六档计划直接断言骑士数为0，并校验敌方战士比例为一半。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 调整骑兵演武双方编队与正式套装映射。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 更新演武台及六档行动说明。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加无骑士、双战士及六件套机制校验。

## Validation

- core与web `node --check`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-nearest-targeting.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 六档固定样本的骑士、嘲讽和叹息之墙截断数均为0。
- 全套装8v8：蓄势5、突破4、命中4、冲锋伤害565.6。
- 全套装20v20：蓄势8、突破3、命中3、冲锋伤害490.3。
- 全套装4v4：蓄势1但未形成突破。
- `git diff --check`: PASS，仅有现有LF/CRLF提示。
- 按用户要求未进行浏览器验证。

## Current State

骑兵演武现在是纯粹的骑兵对战士对照，不再有骑士技能影响目标或截断冲锋。8v8和20v20固定样本能够稳定展示成功突破；4v4仍可能因战斗短或站位不足只完成蓄势。

## Unresolved

- 该无骑士编队专用于观察骑兵，不代表正式玩法必须排除骑士。
- 固定样本不是胜率统计；编队更换后旧的骑兵规模平衡数据不再直接对应网页演武。

## Recommended Next Step

由用户优先查看全套装8v8；该固定样本没有嘲讽和墙套干扰，并有4次成功冲锋命中。
