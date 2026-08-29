# Agent Handoff: 灰谷骑兵入口、墙体移动分类与牧师支援范围

- Date: 2026-08-24 14:15
- Agent/thread: Codex `/root`
- Scope: 灰谷村新增骑兵招募事件；补齐叹息之墙对骑兵奔跑的拦截；为牧师增加有限支援范围
- Status: complete

## User Intent

先补三项明确规则：用一个事件把骑兵交给玩家；叹息之墙拦截奔跑和冲锋但不拦二连跃；牧师治疗范围较大但不能跨全图。套装掉落闭环本轮不擅自设计，下一步再由用户确认。

## Completed

- 新增边境骑手罗文，正式战斗职业为 `cavalry`。
- 第3天流民事件处理后，顺次出现“冲出旧驿道的骑手”；选择接纳后罗文加入 roster，并在有空位时自动进入出战队伍。
- 骑兵“奔跑”的每段位移现在检查叹息之墙边界；被截断后立刻结束奔跑并受到既有1.4秒眩晕。
- 既有技能冲锋和六件套突破继续受墙体拦截；二连跃保留独立位移，不接墙体判定。
- 牧师职业资产新增42距离 `supportRange`，进入共享战斗运行时。
- 单体治疗／护盾、最低血量状态、保核心目标、净化、团队治疗／护盾／增益统一读取有限支援范围；非牧师未配置该属性时仍维持原有全队规则。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 骑兵英雄、招募事件及事件结算。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 第3日连续事件与骑兵入队验证。
- `projects/western_fantasy_continent/game_data/skill_assets/roles/priest.json`: 牧师42距离支援范围源资产。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 由源资产重新生成。
- `projects/western_fantasy_continent/game_data/skill-data.js`: 支援技能的范围选取。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 支援范围运行时与奔跑墙体截断。
- `projects/western_fantasy_continent/game_data/validate-skill-assets.js`: 可选支援范围字段校验。
- `projects/western_fantasy_continent/game_data/verify-priest-support-range.js`: 牧师范围专项验证。
- `projects/western_fantasy_continent/game_data/verify-sighing-wall.js`: 奔跑被拦、二连跃通过的移动分类验证。
- `projects/western_fantasy_continent/GAMEPLAY_HANDOFF_2026-08-19.md`: 同步当前规则与后续顺序。

## Validation

- `node projects/western_fantasy_continent/game_data/validate-skill-assets.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-priest-support-range.js`: PASS；单奶、群奶／盾、保核心均遵守42距离。
- `node projects/western_fantasy_continent/game_data/verify-sighing-wall.js`: PASS；奔跑／技能冲锋／套装突破被拦，普通步行／二连跃通过。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS；骑兵套装输出倍率仍为2.82x，连续移动与突破无回归。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS；第3日后续事件招募正式骑兵。
- 未启动网页或浏览器；遵守用户要求，由用户自行做网页体验验证。

## Current State

灰谷流程已有一个确定的基础骑兵入口。共享战斗对“步行／奔跑／跳跃／冲锋”的墙体分类已按用户口径落实。牧师仍能照顾常规阵型，但无法为深入敌方纵深的骑兵提供跨图治疗。

## Unresolved

- 灰谷随机掉落仍没有生成正式套装 `setId`；玩家能获得骑兵，但还不能通过正常刷怪刷齐奔袭铁骑等套装。
- 第3天现在有两个顺次事件，共占两点行动力；规则验证通过，实际节奏仍需用户试玩判断。
- 关注视角与技能／关键效果表现尚未继续改造。
- 牧师42距离是本轮合理初值，尚未进行大规模胜率再平衡。

## Recommended Next Step

先与用户确定套装掉落的来源、掉率／保底和部位重复规则，再接入灰谷随机掉落完成可获取闭环；随后集中处理关注单位的技能与关键套装效果可读性。
