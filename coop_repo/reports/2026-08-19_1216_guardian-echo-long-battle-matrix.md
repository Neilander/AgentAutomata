# Agent Handoff: 护佑回响强化与长战矩阵

- Date: 2026-08-19
- Agent/thread: Codex `/root`
- Scope: 共享 combat 护佑回响强化、有限范围验证及 4v4/8v8/20v20 对局分析
- Status: complete

## User Intent

不增加护盾上限、不做全图治疗；先强化当前治疗套，再用长于一分钟的真实共享战斗测试其面对骑兵、法师、狙击、战士套装及不同我方配队时，对累计承伤、存活时间和死亡分布的影响。

## Completed

- 护佑回响从 `35%触发 / 14半径 / 50%复制量` 调整为 `50%触发 / 18半径 / 70%复制量`。
- 保持回响只复制实际治疗、护盾和净化；不复制伤害、不全图生效、不增加护盾上限。
- 新增长战矩阵脚本：3 个规模 × 4 种敌方套装阵 × 3 种我方配队 × A/B × 3 种子，共 216 场，最长 180 秒。
- 记录累计承伤、平均/首次/中位/末次死亡时间、核心角色寿命、60/120/180 秒存活人数、回响次数及平均覆盖人数。
- 形成设计分析：当前套装属于局部群体续航，不是单核保护；对可恢复的范围/阶段伤害强，对万夫持续成长压力较弱；20v20 多治疗者重叠是主要规模风险。

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-sim.js`: 护佑回响触发率、半径与复制量。
- `projects/western_fantasy_continent/game_data/verify-guardian-echo.js`: 固定半径 18 的边界断言与输出。
- `projects/western_fantasy_continent/game_data/analyze-guardian-echo-matchups.js`: 共享战斗长战 A/B 矩阵。
- `projects/western_fantasy_continent/design/guardian_echo_matchup_analysis_v0.md`: 方法、结果、特征和风险。

## Validation

- `node projects/western_fantasy_continent/game_data/verify-guardian-echo.js`: PASS；治疗、护盾、净化回响均触发，远处友军不受影响，半径固定为 18，伤害不复制。
- `node projects/western_fantasy_continent/game_data/analyze-guardian-echo-matchups.js --compact`: PASS；216 场全部跑完，最长 180 秒。
- 六套装独立验证：PASS。
- 六套装共享战斗综合回归：PASS。
- 繁生之环、边陲村庄、技能资产和战斗信号回归：PASS。

## Current State

按三个我方配队汇总，密集均衡阵平均寿命 `+35.39%`，护卫保核阵 `+33.45%`，分散单奶阵 `+21.99%`。配队差异证明 18 半径对站位和治疗者数量形成真实约束。

4v4/8v8 火雨场平均寿命分别 `+33.52%/+44.98%`；4v4/8v8 万夫战士场只有 `+10.04%/+13.01%`。20v20 鹰眼场升至 `+58.20%`，显示多名回响治疗者在密集大队中的重叠放大。

## Unresolved

- 20v20 部分骑兵、火雨样本撑满 180 秒；这些格只能证明达到测试上限，累计承伤与寿命百分比存在右删失。
- 每格只有 3 个种子，足够识别大方向，不足以当最终平衡置信区间。
- 战斗移动会让原本分散的单位后期重新汇聚，因此“分散单奶”仍可能在后半程覆盖多名友军。
- 多名六件套治疗者在 20v20 密集阵中存在随治疗者数量和局部人数共同放大的风险，当前未加入重叠衰减。

## Recommended Next Step

先冻结这轮单人/小队强度；若下一轮继续平衡，重点用 20v20 测试“同一目标受到多名护佑回响”的重叠曲线，再决定是否做回响重叠衰减或同源短冷却，不要先砍单奶配队。
