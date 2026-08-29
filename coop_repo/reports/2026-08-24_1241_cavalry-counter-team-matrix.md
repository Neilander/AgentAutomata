# Agent Handoff: 20v20骑兵克制阵容矩阵

- Date: 2026-08-24 12:41
- Agent/thread: Codex `/root`
- Scope: 为当前20v20骑兵队搜索明显优势阵容，并区分无套装与全员六件套
- Status: complete

## User Intent

测试盾兵、牧师、法师等组合能否稳定克制当前骑兵阵容，重点验证用户提出的重盾牧法思路。

## Completed

- 新增可重复运行的20v20阵容矩阵脚本，每套候选阵容在无套装和全员六件套下各跑50局。
- 当前被测骑兵队固定为`5骑兵+5战士+5法师+5牧师`。
- 用户举例的数量超过20人，因此按其思路归一为`8盾2牧10法`与`10盾2牧8法`等合法20人阵容。
- 找到多套明显优势阵容：无套装`8盾2牧10法`胜率96%；全套装`10盾2牧8法`胜率94%；`8盾4牧8法`两档分别88%和90%，是最稳定的折中方案。
- 验证了克制并非只来自叹息之墙：无套装盾牧法仍有明显优势。全套装时叹息之墙每场约拦截5.6—6.2次冲锋，进一步压制骑兵突破。
- 发现极端堆盾或换成游侠并不成立：`12盾4牧4法`无套装仅24%，两套盾牧游和`10盾6战4牧`均为0%。

## Files Changed

- `projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js`: 新增20v20骑兵克制阵容矩阵分析器。
- `coop_repo/reports/2026-08-24_1241_cavalry-counter-team-matrix.md`: 记录本轮测试与结论。
- `coop_repo/LATEST.md`: 增加本报告入口。
- `coop_repo/REPORT_INDEX.md`: 增加本报告索引。

## Validation

- `node projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js 50`: PASS；11套阵容、2种配装、每档50局全部完成。
- `node --check projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-nearest-targeting.js`: PASS。
- `git diff --check -- projects/western_fantasy_continent/game_data/analyze-cavalry-counter-teams.js`: PASS。

### 主要结果（右侧克制队胜率）

| 阵容 | 无套装 | 全员六件套 |
| --- | ---: | ---: |
| 8盾2牧10法 | 96% | 84% |
| 10盾2牧8法 | 90% | 94% |
| 8盾4牧8法 | 88% | 90% |
| 8盾6牧6法 | 88% | 86% |
| 6盾4牧6法4游 | 74% | 76% |
| 10盾5牧5法 | 70% | 72% |
| 12盾4牧4法 | 24% | 60% |
| 当前10战5法5牧对照 | 8% | 8% |
| 8盾2牧10游 | 0% | 0% |
| 10盾6战4牧 | 0% | 0% |

## Current State

当前骑兵存在清晰的阵容克制：盾兵把交战线撑住并限制骑兵路径，法师利用密集魔法范围伤害惩罚骑兵深入，少量牧师延长盾墙有效时间。核心是前排厚度与法术击杀压力同时存在，而不是单纯堆坦度。全套装下叹息之墙几乎清空骑兵突破次数，使这一克制更加直接。

## Unresolved

- 50局足以识别大幅差距，但不等价于精确的长期胜率。
- 本轮固定当前阵型顺序和出生编队，没有穷举单位站位、混合套装或玩家自定义装备。
- 当前脚本用随机数值波动，但战斗随机源仍较少；结果更适合判断明显克制，不宜解读为竞技匹配评级。

## Recommended Next Step

如果需要网页观察，优先把`8盾4牧8法`作为通用克制演示，把`10盾2牧8法`作为全套装强克制演示；两者比极端堆盾更能说明骑兵的合理弱点。
