# Agent Handoff: 骑兵克制因素拆解

- Date: 2026-08-24 13:24
- Agent/thread: Codex `/root`
- Scope: 拆解无套装盾牧法克制骑兵究竟依赖盾兵、牧师还是法师
- Status: complete

## User Intent

确认无套装阵容为何也能克制骑兵，以及骑兵是否只擅长攻击没有治疗的阵容。

## Completed

- 在20v20骑兵克制矩阵中增加无治疗、无输出和盾兵替换为战士的消融阵容。
- 证明治疗不是克制成立的必要条件：无套装`10盾10法`与`8盾12法`均以90%胜率击败当前骑兵队。
- 证明单纯续航不能克制骑兵：无套装`10盾10牧`与`8盾12牧`均为0%胜率。
- 证明盾兵职业本身是关键结构件：`8盾2牧10法`胜率96%，将盾兵原位替换为战士的`8战2牧10法`仅38%。
- 结合权威战斗机制确认：无套装骑士仍有自身护盾、5秒嘲讽与28%减伤、全队护盾和短暂全队减伤；这些技能让骑兵停留在法师火力区。骑兵奔跑本身没有减伤，320基础生命会被高密度法师快速击杀。

## Files Changed

- `projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js`: 增加六套因素拆解阵容。
- `coop_repo/reports/2026-08-24_1324_cavalry-counter-factor-ablation.md`: 记录本轮消融测试。
- `coop_repo/LATEST.md`: 增加本报告入口。
- `coop_repo/REPORT_INDEX.md`: 增加本报告索引。

## Validation

- `node projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js 50`: PASS；17套阵容、无套装/全套装、每档50局完成。
- `node --check projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js`: PASS。
- `git diff --check -- projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js`: PASS。

### 关键无套装结果

| 阵容 | 克制队胜率 | 单骑平均生存 |
| --- | ---: | ---: |
| 8盾2牧10法 | 96% | 7.3秒 |
| 10盾10法 | 90% | 7.4秒 |
| 8盾12法 | 90% | 6.5秒 |
| 8战2牧10法 | 38% | 6.3秒 |
| 10战10法 | 32% | 6.0秒 |
| 10盾10牧 | 0% | 14.3秒 |
| 8盾12牧 | 0% | 14.4秒 |

## Current State

无套装克制链条是“骑士基础控制与防护维持阵线→法师密集输出在约6—8秒内击杀深入的骑兵”。牧师的作用是提高容错与剩余存活人数，不是克制的根源。只有盾和治疗会把战斗延长，却因缺少击杀压力被骑兵持续AOE和其队友击穿。

## Unresolved

- 当前牧师治疗最低生命比例友军且没有距离限制，因此远离牧师的骑兵仍可被治疗；这会影响“深入敌阵”的风险表达。
- 固定阵型下前10名单位占据前两列，结论没有覆盖不同站位和治疗距离规则。

## Recommended Next Step

若继续调平衡，先决定牧师治疗是否应有距离限制；它比单纯调整骑兵数值更直接影响骑兵深入敌阵后的风险与反制关系。
