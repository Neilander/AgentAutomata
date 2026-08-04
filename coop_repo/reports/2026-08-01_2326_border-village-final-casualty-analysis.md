# Agent Handoff: 最终战伤亡率校准

- Date: 2026-08-01
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 最终战生存/死亡分析
- Status: complete

## User Intent

由于当前战斗随机性不高，最终战平衡应主要观察胜利后的生存与死亡，而不是只看重复模拟的胜率。

## Completed

- 修正上一轮仅用胜率判断“全清据点后过弱”的结论，改为统计每场总死亡、英雄死亡、士兵死亡和25%/中位数/75%死亡区间。
- 在三据点全清、14人对16人、7名英雄每人4普通+4稀有的正常终局条件下重新运行100场配对真实战斗。
- 斥候+7民兵：平均死亡6.32人，其中英雄2.89、士兵3.43；死亡四分位5/6/7。
- 斥候+7战士：平均死亡3.71人，其中英雄1.41、士兵2.30；死亡四分位3/4/4。
- 盾骑+7民兵：平均死亡3.13人，其中英雄1.16、士兵1.97；死亡四分位2/3/4。
- 盾骑+7战士：平均死亡2.60人，其中英雄0.84、士兵1.76；死亡四分位2/3/3。
- 分析脚本现在持续输出这些伤亡指标，可按装备档和据点进度重复运行。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/analyze-final-battle-winrate.js`: 增加英雄/士兵死亡拆分、平均总死亡和死亡分布统计。

## Validation

- `node --check projects\western_fantasy_continent\border_village_war\analyze-final-battle-winrate.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\analyze-final-battle-winrate.js 100 '普通稀有混装' cleared`: PASS；四组均运行100场完整战斗并输出伤亡分布。

## Current State

没有修改游戏数值。按伤亡而不是胜率看，三据点全清后的最终战并非无压力：斥候+民兵通常死亡5—7人，接近半队；盾骑+训练战士通常死亡2—3人。当前主要平衡问题从“最终战整体太弱”修正为“盾骑路线与高质量军队的生存优势可能过强”，而斥候民兵路线已经有明显代价。

## Unresolved

- 当前死亡只用于战斗结果与压力评估，尚未讨论角色永久死亡或战后损失如何进入后续系统。
- 仍需先确定设计目标：普通完成度希望中位死亡多少人，以及英雄与士兵的理想死亡比例。

## Recommended Next Step

用伤亡目标继续调平：建议先确定正常全清路线希望14人中死亡约4—6人，优秀建设/训练路线约2—4人；再单独削弱盾骑路线的生存优势，而不是仅凭100%胜率整体加强最终敌军。
