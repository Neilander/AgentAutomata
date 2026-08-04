# Agent Handoff: 刷关解锁改为共享总胜场

- Date: 2026-08-02
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 五档刷关解锁计数
- Status: complete

## User Intent

解锁难度只看全部刷关的累计胜利场数，不要求在指定难度获胜；玩家一直刷难度1也应当能解锁难度5。

## Completed

- 5/10/30/50解锁阈值改为共享总胜场，而非难度1/2/3/4各自胜场。
- 每档胜场仍单独记录供统计，但不再参与解锁判断。
- 锁定档位明确显示“任意难度胜利都计数”和当前总胜场/目标。
- 地图节点、进度条、连续战斗HUD和战后日志统一显示总胜场。
- 旧v3存档直接使用已有 `stats.grindWins` 重新计算已解锁难度。
- 增加真实流程回归：全程停留难度1刷到50个总胜场，必须解锁难度5，且难度5自身胜场仍为0。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 总胜场解锁计算、锁定原因、结算日志和公开观察。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 全程难度1解锁难度5回归。
- `projects/western_fantasy_continent/border_village_war/README.md`: 共享总胜场规则。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 总胜场进度与提示。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: UI共享进度契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 页面说明。

## Validation

- 核心与前端 `node --check`: PASS。
- 核心和静态前端回归：PASS。
- 核心回归实际完成50次难度1胜利，难度5成功解锁，难度5自身胜场为0。
- 未启动服务器或浏览器。

## Current State

玩家选择刷哪个难度只影响战斗与掉落，不影响胜场是否计入解锁；所有胜利共同推进5/10/30/50进度。

## Unresolved

- 难度4稀有度表缺少10个百分点的问题仍沿用上一报告的暂定方案：史诗19%。

## Recommended Next Step

刷新现有页面，用难度1连续刷到5胜，确认难度2自动解锁但当前选择仍停留在难度1。
