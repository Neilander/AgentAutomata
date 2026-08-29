# Agent Handoff: 骑兵六件套连续移动蓄势

- Date: 2026-08-22
- Agent/thread: `/root`
- Scope: 奔袭铁骑六件套距离进度改为连续移动判定
- Status: complete

## User Intent

六件套不能把分散的走路距离永久累计起来；骑兵停止移动一段时间后应丢失尚未蓄满的距离，不能靠“走一步—普攻一会—再走”拼出冲锋。二连跃的两段位移必须算同一次连续移动。

## Completed

- 六件套仍需16真实移动距离，但改为同一段连续移动累计。
- 每次产生真实位移时刷新0.4秒连续移动容错；停步达到0.4秒后，未蓄满的距离归零并产生 `chargeProgressReset` 信号。
- 二连跃和奔跑动作进行期间不会因技能内部的位移间隔清空进度；二连跃两次落点合并计算，当前每跳10距离，可自然跨过16门槛。
- 已经进入冲锋就绪后不再受停步重置影响，仍由突破、障碍或叹息之墙消费。
- 套装设计稿与总玩法交接同步明确连续移动规则。

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-sim.js`: 新增连续移动容错计时、未完成进度重置和重置信号；二连跃/奔跑动作保持续接。
- `projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: 锁定0.4秒边界、分段移动不能拼接、蓄满状态不因停步消失和二连跃两跳连续累计。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 记录六件套连续移动语义。
- `projects/western_fantasy_continent/GAMEPLAY_HANDOFF_2026-08-19.md`: 更新奔袭铁骑当前规则。

## Validation

- `node --check projects/western_fantasy_continent/game_data/combat-sim.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS；0.39秒未重置，累计停步0.41秒后重置；停步前10距离与停步后6距离未拼接；新的6+10连续移动正常蓄满；二连跃两跳正常蓄满；固定 A/B 输出仍为2.82x。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-combat-equipment-sets.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-nearest-targeting.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `git diff --check`: PASS，仅有工作区既有LF/CRLF提示。
- 按用户要求未进行浏览器验证。

## Current State

奔袭铁骑六件套现在读取连续真实位移：普通移动或不同移动段之间若停满0.4秒，未完成的16距离进度归零；二连跃的整个1.6秒动作是一个连续链，两次落点之间不会断档。蓄满后的冲锋就绪稳定保留，直到突破或被阻挡时消费。

## Unresolved

- 0.4秒是当前手感参数，代码级行为已锁定，但尚待用户在网页普通速度下判断视觉与操作观感。

## Recommended Next Step

由用户在全套装4v4/8v8/20v20演武中观察：站桩普攻后不应继承旧距离，二连跃两跳则应稳定产生一次六件套冲锋蓄势。
