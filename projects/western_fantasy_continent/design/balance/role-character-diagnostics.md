# Role Character Diagnostics

Generated with 12 seeds per ordered preset matchup, 3264 games total.

This report checks whether each role behaves like its intended fantasy. Every issue links to a game id, seed, unit, metrics, and a short reason when the analyzer can find one.

## Role Risk Summary

| Role | Samples | Avg damage share | Avg sustain share | Avg taken share | Avg survival | Anomalies | Unexplained | Top issues |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 游侠 `ranger` | 2304 | 38% | 0% | 23% | 87% | 394 | 148 | 游侠承伤生存过强 394 |
| 牧师 `priest` | 4224 | 13% | 53% | 21% | 91% | 385 | 51 | 牧师输出过高 275; 牧师治疗/护盾没有存在感 110 |
| 诗人 `bard` | 3072 | 18% | 17% | 17% | 94% | 461 | 45 | 诗人输出过高 461 |
| 狂战士 `berserker` | 1536 | 56% | 21% | 35% | 81% | 591 | 33 | 狂战高输出但过于安全 590; 狂战输出不像普攻流 1 |
| 法师 `mage` | 2304 | 41% | 0% | 11% | 97% | 30 | 16 | 法师承伤生存过强 30 |
| 战士 `warrior` | 3456 | 25% | 4% | 34% | 61% | 10 | 10 | 战士自带续航/护盾过高 8; 战士爆发过高 2 |
| 刺客 `assassin` | 1152 | 19% | 0% | 33% | 48% | 163 | 8 | 刺客承伤过高但仍存活 84; 刺客生存过强 79 |
| 术士 `warlock` | 1536 | 53% | 0% | 15% | 94% | 6 | 5 | 术士持续伤害占比低 6 |
| 骑士 `knight` | 4992 | 8% | 42% | 34% | 76% | 7 | 3 | 骑士输出过高 7 |
| 炼金术士 `alchemist` | 1536 | 32% | 0% | 22% | 86% | 41 | 0 | 炼金状态参与低 41 |

## Interpretation Notes

- `priest`: the top issue is high damage share, but the evidence usually shows basic attacks, not burst. Treat this as a support downtime/basic-attack tuning problem or a team-low-damage context, not as a priest burst problem.
- `alchemist`: low status share is only treated as suspicious when absolute status output is also low. This avoids false alarms in teams where multiple characters create status.
- `bard`: average direct damage is low, but some games cross the direct-damage threshold. Check whether this is harmless long-fight basic damage before nerfing.
- `assassin`: unexplained high survival / high taken cases remain the most suspicious role-shape issue, but short losing games are now separated from true over-tankiness.
- `berserker`: high-output high-survival cases are currently reasoned as supported by healing/shields. This may be acceptable for carry comps, but it should remain watched.
- `knight` and `warrior`: no current contract violations in this run.

## Highest Priority Unexplained Issues

- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_11`, 银誓牧师 `right-4`, damage 60%, sustain 30%, taken 43%, survival 100%, peak2s 10%. Reason: none.
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_0`, 银誓牧师 `left-4`, damage 63%, sustain 31%, taken 41%, survival 100%, peak2s 10%. Reason: none.
- [牧师] 牧师输出过高: `holySustain__vs__crownCarry__seed_7`, 银誓牧师 `left-4`, damage 25%, sustain 30%, taken 26%, survival 93%, peak2s 13%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `holySustain__vs__cavalryBreak__seed_3`, 赤狮狂战 `right-3`, damage 52%, sustain 10%, taken 0%, survival 100%, peak2s 9%. Reason: none.
- [牧师] 牧师输出过高: `holySustain__vs__bulwarkMarks__seed_5`, 银誓牧师 `left-4`, damage 71%, sustain 26%, taken 31%, survival 72%, peak2s 14%. Reason: none.
- [牧师] 牧师输出过高: `bulwarkMarks__vs__holySustain__seed_10`, 银誓牧师 `right-4`, damage 64%, sustain 29%, taken 32%, survival 73%, peak2s 13%. Reason: none.
- [牧师] 牧师输出过高: `holySustain__vs__bulwarkMarks__seed_0`, 银誓牧师 `left-4`, damage 72%, sustain 31%, taken 32%, survival 75%, peak2s 14%. Reason: none.
- [牧师] 牧师输出过高: `bulwarkMarks__vs__holySustain__seed_4`, 银誓牧师 `right-4`, damage 70%, sustain 29%, taken 33%, survival 72%, peak2s 15%. Reason: none.
- [牧师] 牧师输出过高: `bulwarkMarks__vs__holySustain__seed_9`, 银誓牧师 `right-4`, damage 68%, sustain 30%, taken 29%, survival 71%, peak2s 14%. Reason: none.
- [牧师] 牧师输出过高: `holySustain__vs__bulwarkMarks__seed_10`, 银誓牧师 `left-4`, damage 69%, sustain 28%, taken 33%, survival 76%, peak2s 14%. Reason: none.
- [牧师] 牧师输出过高: `bulwarkMarks__vs__holySustain__seed_11`, 银誓牧师 `right-4`, damage 70%, sustain 23%, taken 26%, survival 58%, peak2s 14%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__holySustain__seed_1`, 赤狮狂战 `left-3`, damage 44%, sustain 10%, taken 0%, survival 100%, peak2s 8%. Reason: none.
- [牧师] 牧师输出过高: `holySustain__vs__bulwarkMarks__seed_7`, 银誓牧师 `left-4`, damage 69%, sustain 29%, taken 36%, survival 77%, peak2s 14%. Reason: none.
- [牧师] 牧师输出过高: `holySustain__vs__bulwarkMarks__seed_4`, 银誓牧师 `left-4`, damage 73%, sustain 24%, taken 30%, survival 58%, peak2s 14%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__holySustain__seed_10`, 赤狮狂战 `left-3`, damage 39%, sustain 8%, taken 0%, survival 100%, peak2s 7%. Reason: none.
- [法师] 法师承伤生存过强: `ironWall__vs__frostTrapField__seed_9`, 烬火法师 `right-2`, damage 37%, sustain 0%, taken 34%, survival 92%, peak2s 9%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__holySustain__seed_5`, 赤狮狂战 `left-3`, damage 42%, sustain 8%, taken 0%, survival 100%, peak2s 7%. Reason: none.
- [法师] 法师承伤生存过强: `frostControl__vs__purgeAttrition__seed_9`, 烬火法师 `left-3`, damage 47%, sustain 0%, taken 24%, survival 96%, peak2s 10%. Reason: none.
- [牧师] 牧师输出过高: `bulwarkMarks__vs__holySustain__seed_1`, 银誓牧师 `right-4`, damage 69%, sustain 18%, taken 26%, survival 64%, peak2s 14%. Reason: none.
- [法师] 法师承伤生存过强: `frostTrapField__vs__ironWall__seed_2`, 烬火法师 `left-2`, damage 39%, sustain 0%, taken 31%, survival 94%, peak2s 8%. Reason: none.
- [牧师] 牧师输出过高: `bulwarkMarks__vs__holySustain__seed_8`, 银誓牧师 `right-4`, damage 67%, sustain 18%, taken 30%, survival 65%, peak2s 15%. Reason: none.
- [刺客] 刺客生存过强: `duelChampion__vs__shadowExecute__seed_2`, 毒刃刺客 `right-3`, damage 33%, sustain 0%, taken 28%, survival 92%, peak2s 7%. Reason: none.
- [刺客] 刺客承伤过高但仍存活: `duelChampion__vs__shadowExecute__seed_2`, 毒刃刺客 `right-3`, damage 33%, sustain 0%, taken 28%, survival 92%, peak2s 7%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `holySustain__vs__cavalryBreak__seed_0`, 赤狮狂战 `right-3`, damage 46%, sustain 6%, taken 0%, survival 100%, peak2s 7%. Reason: none.
- [牧师] 牧师输出过高: `alchemyChaos__vs__holySustain__seed_7`, 银誓牧师 `right-4`, damage 60%, sustain 22%, taken 26%, survival 68%, peak2s 10%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `purgeAttrition__vs__cavalryBreak__seed_8`, 赤狮狂战 `right-3`, damage 48%, sustain 17%, taken 30%, survival 84%, peak2s 12%. Reason: none.
- [法师] 法师承伤生存过强: `shadowExecute__vs__frostTrapField__seed_11`, 烬火法师 `right-2`, damage 51%, sustain 0%, taken 25%, survival 91%, peak2s 14%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `duelChampion__vs__cavalryBreak__seed_5`, 赤狮狂战 `right-3`, damage 40%, sustain 6%, taken 0%, survival 100%, peak2s 11%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__purgeAttrition__seed_9`, 赤狮狂战 `left-3`, damage 51%, sustain 20%, taken 29%, survival 96%, peak2s 14%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__purgeAttrition__seed_4`, 赤狮狂战 `left-3`, damage 43%, sustain 19%, taken 32%, survival 97%, peak2s 13%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__purgeAttrition__seed_8`, 赤狮狂战 `left-3`, damage 43%, sustain 20%, taken 24%, survival 100%, peak2s 12%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `purgeAttrition__vs__cavalryBreak__seed_5`, 赤狮狂战 `right-3`, damage 42%, sustain 14%, taken 35%, survival 95%, peak2s 11%. Reason: none.
- [刺客] 刺客承伤过高但仍存活: `shadowExecute__vs__alchemyChaos__seed_0`, 毒刃刺客 `left-3`, damage 44%, sustain 0%, taken 24%, survival 89%, peak2s 18%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__alchemyChaos__seed_4`, 赤狮狂战 `left-3`, damage 66%, sustain 29%, taken 28%, survival 89%, peak2s 37%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `frostControl__vs__cavalryBreak__seed_2`, 赤狮狂战 `right-3`, damage 39%, sustain 16%, taken 26%, survival 82%, peak2s 26%. Reason: none.
- [法师] 法师承伤生存过强: `frostTrapField__vs__crownCarry__seed_8`, 烬火法师 `left-2`, damage 51%, sustain 0%, taken 25%, survival 84%, peak2s 19%. Reason: none.
- [法师] 法师承伤生存过强: `frostTrapField__vs__crownCarry__seed_5`, 烬火法师 `left-2`, damage 53%, sustain 0%, taken 25%, survival 86%, peak2s 20%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `cavalryBreak__vs__fireBurst__seed_5`, 赤狮狂战 `left-3`, damage 54%, sustain 22%, taken 25%, survival 86%, peak2s 21%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `purgeAttrition__vs__cavalryBreak__seed_1`, 赤狮狂战 `right-3`, damage 45%, sustain 17%, taken 28%, survival 100%, peak2s 15%. Reason: none.
- [法师] 法师承伤生存过强: `shadowExecute__vs__frostTrapField__seed_2`, 烬火法师 `right-2`, damage 42%, sustain 0%, taken 25%, survival 73%, peak2s 15%. Reason: none.

## Reasoned Issues

- [狂战士] 狂战高输出但过于安全: `crownCarry__vs__holySustain__seed_11`, 赤狮狂战 `left-4`, damage 73%, sustain 6%, taken 34%, survival 100%, peak2s 8%. Reason: 该角色收到大量治疗/护盾，生存偏高有队友保护解释。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_0`, 银誓牧师 `right-4`, damage 41%, sustain 31%, taken 27%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_1`, 银誓牧师 `right-4`, damage 42%, sustain 30%, taken 30%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_2`, 银誓牧师 `right-4`, damage 37%, sustain 31%, taken 4%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_3`, 银誓牧师 `right-4`, damage 27%, sustain 31%, taken 10%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_4`, 银誓牧师 `right-4`, damage 44%, sustain 31%, taken 24%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_5`, 银誓牧师 `right-4`, damage 41%, sustain 31%, taken 29%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_6`, 银誓牧师 `right-4`, damage 29%, sustain 28%, taken 19%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_7`, 银誓牧师 `right-4`, damage 39%, sustain 29%, taken 24%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_8`, 银誓牧师 `right-4`, damage 39%, sustain 31%, taken 19%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_9`, 银誓牧师 `right-4`, damage 27%, sustain 30%, taken 21%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_10`, 银誓牧师 `right-4`, damage 64%, sustain 30%, taken 40%, survival 100%, peak2s 8%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_1`, 银誓牧师 `left-4`, damage 35%, sustain 30%, taken 20%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_2`, 银誓牧师 `left-4`, damage 27%, sustain 30%, taken 24%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_3`, 银誓牧师 `left-4`, damage 32%, sustain 31%, taken 21%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_4`, 银誓牧师 `left-4`, damage 56%, sustain 30%, taken 33%, survival 95%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_5`, 银誓牧师 `left-4`, damage 57%, sustain 31%, taken 32%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_6`, 银誓牧师 `left-4`, damage 43%, sustain 31%, taken 25%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_7`, 银誓牧师 `left-4`, damage 32%, sustain 30%, taken 33%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_8`, 银誓牧师 `left-4`, damage 57%, sustain 30%, taken 45%, survival 100%, peak2s 10%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_9`, 银誓牧师 `left-4`, damage 49%, sustain 31%, taken 28%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_10`, 银誓牧师 `left-4`, damage 49%, sustain 32%, taken 30%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_11`, 银誓牧师 `left-4`, damage 59%, sustain 30%, taken 29%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__purgeAttrition__seed_4`, 银誓牧师 `left-4`, damage 51%, sustain 30%, taken 35%, survival 86%, peak2s 7%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__purgeAttrition__seed_9`, 银誓牧师 `left-4`, damage 50%, sustain 30%, taken 34%, survival 94%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__shadowExecute__seed_1`, 银誓牧师 `left-3`, damage 25%, sustain 35%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__shadowExecute__seed_1`, 银誓牧师 `left-4`, damage 25%, sustain 28%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__shadowExecute__seed_11`, 银誓牧师 `left-4`, damage 54%, sustain 37%, taken 35%, survival 94%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `ironWall__vs__holySustain__seed_9`, 银誓牧师 `right-3`, damage 32%, sustain 37%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `ironWall__vs__holySustain__seed_9`, 银誓牧师 `right-4`, damage 32%, sustain 29%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `purgeAttrition__vs__holySustain__seed_1`, 银誓牧师 `right-4`, damage 43%, sustain 32%, taken 38%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `purgeAttrition__vs__holySustain__seed_6`, 银誓牧师 `right-4`, damage 52%, sustain 28%, taken 34%, survival 90%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_1`, 银誓牧师 `right-3`, damage 31%, sustain 37%, taken 0%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_1`, 银誓牧师 `right-4`, damage 38%, sustain 30%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_3`, 银誓牧师 `right-4`, damage 52%, sustain 36%, taken 31%, survival 94%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_6`, 银誓牧师 `right-4`, damage 44%, sustain 29%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_7`, 银誓牧师 `right-4`, damage 37%, sustain 35%, taken 35%, survival 95%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_9`, 银誓牧师 `right-3`, damage 34%, sustain 41%, taken 16%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_9`, 银誓牧师 `right-4`, damage 58%, sustain 34%, taken 32%, survival 82%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `purgeAttrition__vs__holySustain__seed_9`, 银誓牧师 `right-4`, damage 37%, sustain 33%, taken 36%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。

## Role Contracts Used

### 骑士 `knight`
- Expected: 承伤, 护盾, 嘲讽, 反击
- Weakness: 直接输出不应过高, 爆发不应过高

### 战士 `warrior`
- Expected: 稳定输出, 前排压制, 适中承伤
- Weakness: 不应超过刺客/法师式爆发, 不应拥有高治疗/护盾

### 狂战士 `berserker`
- Expected: 低血强化, 普攻主轴, 吸血翻盘
- Weakness: 高输出时不应过于安全, 不应脱离低血风险

### 法师 `mage`
- Expected: 技能伤害, AOE, 元素爆发
- Weakness: 承伤不应高, 生存不应强, 治疗/护盾不应高

### 牧师 `priest`
- Expected: 治疗, 护盾, 保护核心
- Weakness: 直接输出不应高, 爆发不应高

### 刺客 `assassin`
- Expected: 切后排, 收割, 短爆发
- Weakness: 生存不能太强, 承伤不能太高, 治疗/护盾不能太高

### 游侠 `ranger`
- Expected: 标记, 持续输出, 远程压制
- Weakness: 不应变成纯刺客爆发, 不应高承伤

### 诗人 `bard`
- Expected: 加速, 增益, 节奏辅助
- Weakness: 直接输出不应高, 承伤不应高

### 术士 `warlock`
- Expected: 诅咒, 持续伤害, 毒/献祭
- Weakness: 不应高护盾, 不应稳定治疗主职化

### 炼金术士 `alchemist`
- Expected: 状态混合, 异常转爆发, 区域收益
- Weakness: 不应成为纯治疗/护盾, 没有状态时不应爆发过强

