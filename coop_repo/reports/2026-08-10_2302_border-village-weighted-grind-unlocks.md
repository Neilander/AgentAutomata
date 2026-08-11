# Agent Handoff: Weighted Grind Unlocks

- Date: 2026-08-10
- Agent/thread: Codex `/root`
- Scope: 将五档刷关解锁由总胜场改为难度加权积分
- Status: complete

## User Intent

先解决刷关解锁节奏。难度N胜利应产生N倍进度；各档原解锁局数乘以前一档难度，形成更高的后续门槛。

## Completed

- 将共享总胜场解锁改为共享讨伐积分：难度N胜利一次增加N积分。
- 累计5、20、90、200积分依次解锁难度2、3、4、5。
- 保留每档独立胜场统计与全局总胜场，但二者不再直接决定解锁。
- 解锁积分由每档真实胜场加权求和，旧存档已有的`winsByDifficulty`可直接迁移，不需要凭空补分。
- 失败不增加积分；成功日志公开本场积分增量和累计积分。
- 玩家观察面公开当前积分、当前难度单胜积分、下一门槛、每档门槛和按前一难度折算的局数。
- 网页刷关节点、连续刷关HUD和难度面板改为显示积分，并根据当前难度估算还需胜利次数。
- 增加4/5、19/20、89/90、199/200边界验证，并用真实难度2战斗验证胜利增加2积分。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 加权积分、门槛、日志、公开观察与解锁判断。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 加权积分真实战斗与全部门槛边界验证。
- `projects/western_fantasy_continent/border_village_war/README.md`: 更新程序规则。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 改造刷关HUD、节点说明和进度面板。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 锁定加权积分前端契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新网页规则说明。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 记录首版精确门槛。

## Validation

- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS；含5/20/90/200门槛边界及难度2真实胜利+2积分。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: PASS；17个审计请求、2场真实战斗、最终战可重试。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `git diff --check`: PASS；仅输出仓库既有LF/CRLF警告。
- 未启动服务器，未打开浏览器。

## Current State

难度1—5胜利分别提供1—5积分。难度2—5在累计积分达到5、20、90、200时解锁；低难度仍可持续推进，高难度推进更快。网页会明确显示当前分数、目标分数和按当前难度估算的剩余胜场。

## Unresolved

- 5/20/90/200是首版节奏，仍需真人刷关体验确认后两档是否过快或过慢。
- 本轮只处理解锁积分，尚未加入装备套组或极限挑战。

## Recommended Next Step

真人从难度1开始观察5→20积分阶段是否形成“解锁后切高难更快”的直觉；若节奏通过，再进入单套装备路线设计。
