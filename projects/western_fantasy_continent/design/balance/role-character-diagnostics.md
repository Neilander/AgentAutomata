# Role Character Diagnostics

Generated with 12 seeds per ordered preset matchup, 1080 games total.

This report checks whether each role behaves like its intended fantasy. Every issue links to a game id, seed, unit, metrics, and a short reason when the analyzer can find one.

## Role Risk Summary

| Role | Samples | Avg damage share | Avg sustain share | Avg taken share | Avg survival | Anomalies | Unexplained | Top issues |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 牧师 `priest` | 1512 | 13% | 47% | 18% | 91% | 213 | 30 | 牧师输出过高 127; 牧师治疗/护盾没有存在感 86 |
| 诗人 `bard` | 864 | 16% | 0% | 15% | 95% | 118 | 15 | 诗人输出过高 118 |
| 游侠 `ranger` | 432 | 34% | 0% | 24% | 78% | 28 | 14 | 游侠承伤生存过强 28 |
| 刺客 `assassin` | 648 | 23% | 0% | 33% | 47% | 80 | 4 | 刺客生存过强 49; 刺客承伤过高但仍存活 31 |
| 法师 `mage` | 864 | 41% | 0% | 13% | 96% | 5 | 4 | 法师承伤生存过强 5 |
| 狂战士 `berserker` | 432 | 64% | 22% | 37% | 84% | 178 | 3 | 狂战高输出但过于安全 178 |
| 战士 `warrior` | 1080 | 32% | 0% | 36% | 60% | 3 | 3 | 战士爆发过高 3 |
| 术士 `warlock` | 432 | 56% | 0% | 16% | 92% | 1 | 1 | 术士持续伤害占比低 1 |
| 炼金术士 `alchemist` | 648 | 32% | 0% | 24% | 79% | 34 | 0 | 炼金状态参与低 34 |
| 骑士 `knight` | 1728 | 6% | 49% | 32% | 80% | 0 | 0 | - |

## Interpretation Notes

- `priest`: the top issue is high damage share, but the evidence usually shows basic attacks, not burst. Treat this as a support downtime/basic-attack tuning problem or a team-low-damage context, not as a priest burst problem.
- `alchemist`: low status share is only treated as suspicious when absolute status output is also low. This avoids false alarms in teams where multiple characters create status.
- `bard`: average direct damage is low, but some games cross the direct-damage threshold. Check whether this is harmless long-fight basic damage before nerfing.
- `assassin`: unexplained high survival / high taken cases remain the most suspicious role-shape issue, but short losing games are now separated from true over-tankiness.
- `berserker`: high-output high-survival cases are currently reasoned as supported by healing/shields. This may be acceptable for carry comps, but it should remain watched.
- `knight` and `warrior`: no current contract violations in this run.

## Highest Priority Unexplained Issues

- [法师] 法师承伤生存过强: `alchemyChaos__vs__ironWall__seed_0`, 烬火法师 `left-4`, damage 42%, sustain 0%, taken 24%, survival 100%, peak2s 5%. Reason: none.
- [刺客] 刺客承伤过高但仍存活: `shadowExecute__vs__poisonBloom__seed_0`, 毒刃刺客 `left-3`, damage 44%, sustain 0%, taken 24%, survival 77%, peak2s 17%. Reason: none.
- [刺客] 刺客生存过强: `poisonBloom__vs__shadowExecute__seed_7`, 毒刃刺客 `right-3`, damage 42%, sustain 0%, taken 24%, survival 95%, peak2s 13%. Reason: none.
- [法师] 法师承伤生存过强: `frostControl__vs__bloodRage__seed_2`, 烬火法师 `left-3`, damage 54%, sustain 0%, taken 26%, survival 100%, peak2s 23%. Reason: none.
- [法师] 法师承伤生存过强: `shadowExecute__vs__frostControl__seed_2`, 烬火法师 `right-3`, damage 51%, sustain 0%, taken 26%, survival 100%, peak2s 19%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `bloodRage__vs__frostControl__seed_6`, 赤狮狂战 `left-1`, damage 47%, sustain 20%, taken 32%, survival 89%, peak2s 24%. Reason: none.
- [刺客] 刺客生存过强: `lightningTempo__vs__shadowExecute__seed_1`, 毒刃刺客 `right-3`, damage 70%, sustain 0%, taken 22%, survival 100%, peak2s 18%. Reason: none.
- [刺客] 刺客生存过强: `poisonBloom__vs__shadowExecute__seed_1`, 毒刃刺客 `right-3`, damage 41%, sustain 0%, taken 24%, survival 92%, peak2s 10%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `bloodRage__vs__frostControl__seed_8`, 赤狮狂战 `left-1`, damage 48%, sustain 21%, taken 32%, survival 100%, peak2s 19%. Reason: none.
- [法师] 法师承伤生存过强: `bloodRage__vs__frostControl__seed_8`, 烬火法师 `right-3`, damage 49%, sustain 0%, taken 26%, survival 85%, peak2s 14%. Reason: none.
- [狂战士] 狂战高输出但过于安全: `bloodRage__vs__frostControl__seed_9`, 赤狮狂战 `left-1`, damage 46%, sustain 22%, taken 37%, survival 97%, peak2s 19%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_10`, 银誓牧师 `right-2`, damage 6%, sustain 5%, taken 30%, survival 10%, peak2s 2%. Reason: none.
- [诗人] 诗人输出过高: `alchemyChaos__vs__ironWall__seed_7`, 晨歌诗人 `right-4`, damage 49%, sustain 0%, taken 17%, survival 37%, peak2s 8%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_11`, 银誓牧师 `left-2`, damage 7%, sustain 12%, taken 45%, survival 19%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_5`, 银誓牧师 `left-2`, damage 7%, sustain 12%, taken 46%, survival 19%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_4`, 银誓牧师 `left-2`, damage 5%, sustain 9%, taken 30%, survival 16%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_0`, 银誓牧师 `left-2`, damage 6%, sustain 7%, taken 35%, survival 17%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_5`, 银誓牧师 `right-2`, damage 6%, sustain 7%, taken 38%, survival 15%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_1`, 银誓牧师 `left-2`, damage 8%, sustain 13%, taken 40%, survival 20%, peak2s 2%. Reason: none.
- [战士] 战士爆发过高: `crownCarry__vs__holySustain__seed_6`, 前锋战士 `right-2`, damage 70%, sustain 0%, taken 25%, survival 28%, peak2s 43%. Reason: none.
- [游侠] 游侠承伤生存过强: `lightningTempo__vs__holySustain__seed_4`, 月弦游侠 `left-4`, damage 42%, sustain 0%, taken 25%, survival 100%, peak2s 8%. Reason: none.
- [战士] 战士爆发过高: `crownCarry__vs__holySustain__seed_1`, 前锋战士 `right-2`, damage 57%, sustain 0%, taken 21%, survival 25%, peak2s 57%. Reason: none.
- [战士] 战士爆发过高: `holySustain__vs__crownCarry__seed_4`, 前锋战士 `left-2`, damage 52%, sustain 0%, taken 23%, survival 30%, peak2s 50%. Reason: none.
- [游侠] 游侠承伤生存过强: `holySustain__vs__lightningTempo__seed_2`, 月弦游侠 `right-4`, damage 65%, sustain 0%, taken 25%, survival 100%, peak2s 11%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_7`, 银誓牧师 `left-2`, damage 4%, sustain 17%, taken 31%, survival 17%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `poisonBloom__vs__crownCarry__seed_3`, 银誓牧师 `right-2`, damage 5%, sustain 18%, taken 34%, survival 31%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_9`, 银誓牧师 `right-2`, damage 5%, sustain 17%, taken 35%, survival 23%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_0`, 银誓牧师 `right-2`, damage 7%, sustain 17%, taken 44%, survival 33%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_6`, 银誓牧师 `right-2`, damage 5%, sustain 17%, taken 32%, survival 23%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_3`, 银誓牧师 `right-2`, damage 7%, sustain 17%, taken 47%, survival 34%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_10`, 银誓牧师 `left-2`, damage 6%, sustain 18%, taken 34%, survival 27%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_9`, 银誓牧师 `left-2`, damage 5%, sustain 17%, taken 31%, survival 26%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_8`, 银誓牧师 `right-2`, damage 7%, sustain 18%, taken 37%, survival 30%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `shadowExecute__vs__frostControl__seed_11`, 银誓牧师 `right-2`, damage 8%, sustain 17%, taken 52%, survival 38%, peak2s 2%. Reason: none.
- [牧师] 牧师治疗/护盾没有存在感: `frostControl__vs__shadowExecute__seed_3`, 银誓牧师 `left-2`, damage 5%, sustain 10%, taken 38%, survival 28%, peak2s 2%. Reason: none.
- [游侠] 游侠承伤生存过强: `ironWall__vs__lightningTempo__seed_8`, 月弦游侠 `right-4`, damage 49%, sustain 0%, taken 25%, survival 100%, peak2s 13%. Reason: none.
- [游侠] 游侠承伤生存过强: `frostControl__vs__lightningTempo__seed_10`, 月弦游侠 `right-4`, damage 48%, sustain 0%, taken 24%, survival 100%, peak2s 11%. Reason: none.
- [游侠] 游侠承伤生存过强: `ironWall__vs__lightningTempo__seed_1`, 月弦游侠 `right-4`, damage 55%, sustain 0%, taken 24%, survival 95%, peak2s 14%. Reason: none.
- [游侠] 游侠承伤生存过强: `ironWall__vs__lightningTempo__seed_7`, 月弦游侠 `right-4`, damage 46%, sustain 0%, taken 24%, survival 96%, peak2s 14%. Reason: none.
- [诗人] 诗人输出过高: `ironWall__vs__crownCarry__seed_2`, 晨歌诗人 `left-4`, damage 29%, sustain 0%, taken 19%, survival 100%, peak2s 8%. Reason: none.

## Reasoned Issues

- [牧师] 牧师输出过高: `alchemyChaos__vs__holySustain__seed_3`, 银誓牧师 `right-4`, damage 69%, sustain 30%, taken 45%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `alchemyChaos__vs__holySustain__seed_8`, 银誓牧师 `right-4`, damage 29%, sustain 28%, taken 48%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_1`, 银誓牧师 `right-4`, damage 44%, sustain 29%, taken 30%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_2`, 银誓牧师 `right-4`, damage 32%, sustain 29%, taken 15%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_3`, 银誓牧师 `right-4`, damage 26%, sustain 29%, taken 17%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_4`, 银誓牧师 `right-4`, damage 25%, sustain 32%, taken 3%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_5`, 银誓牧师 `right-4`, damage 33%, sustain 29%, taken 15%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_7`, 银誓牧师 `right-4`, damage 30%, sustain 28%, taken 20%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_9`, 银誓牧师 `right-4`, damage 30%, sustain 30%, taken 19%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_10`, 银誓牧师 `right-4`, damage 35%, sustain 29%, taken 18%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `frostControl__vs__holySustain__seed_11`, 银誓牧师 `right-4`, damage 27%, sustain 31%, taken 12%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__alchemyChaos__seed_2`, 银誓牧师 `left-4`, damage 31%, sustain 28%, taken 52%, survival 94%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__alchemyChaos__seed_8`, 银誓牧师 `left-4`, damage 27%, sustain 7%, taken 17%, survival 30%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_0`, 银誓牧师 `left-4`, damage 33%, sustain 30%, taken 19%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_2`, 银誓牧师 `left-4`, damage 35%, sustain 31%, taken 16%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_3`, 银誓牧师 `left-4`, damage 25%, sustain 32%, taken 2%, survival 100%, peak2s 2%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_4`, 银誓牧师 `left-4`, damage 24%, sustain 33%, taken 14%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_5`, 银誓牧师 `left-4`, damage 41%, sustain 28%, taken 16%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_6`, 银誓牧师 `left-4`, damage 29%, sustain 32%, taken 3%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_7`, 银誓牧师 `left-4`, damage 32%, sustain 30%, taken 15%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_9`, 银誓牧师 `left-4`, damage 36%, sustain 28%, taken 16%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_10`, 银誓牧师 `left-4`, damage 35%, sustain 33%, taken 21%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__frostControl__seed_11`, 银誓牧师 `left-4`, damage 31%, sustain 29%, taken 16%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__ironWall__seed_3`, 银誓牧师 `left-4`, damage 25%, sustain 33%, taken 0%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__ironWall__seed_11`, 银誓牧师 `left-3`, damage 26%, sustain 37%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__poisonBloom__seed_11`, 银誓牧师 `left-3`, damage 24%, sustain 40%, taken 9%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__poisonBloom__seed_11`, 银誓牧师 `left-4`, damage 28%, sustain 32%, taken 8%, survival 100%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__shadowExecute__seed_0`, 银誓牧师 `left-3`, damage 31%, sustain 37%, taken 0%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__shadowExecute__seed_0`, 银誓牧师 `left-4`, damage 32%, sustain 30%, taken 0%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__shadowExecute__seed_7`, 银誓牧师 `left-3`, damage 30%, sustain 49%, taken 14%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__shadowExecute__seed_7`, 银誓牧师 `left-4`, damage 34%, sustain 28%, taken 28%, survival 74%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `ironWall__vs__holySustain__seed_2`, 银誓牧师 `right-4`, damage 30%, sustain 31%, taken 0%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_2`, 银誓牧师 `right-3`, damage 34%, sustain 39%, taken 1%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_2`, 银誓牧师 `right-4`, damage 31%, sustain 28%, taken 1%, survival 100%, peak2s 4%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_6`, 银誓牧师 `right-3`, damage 37%, sustain 38%, taken 0%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_6`, 银誓牧师 `right-4`, damage 35%, sustain 30%, taken 0%, survival 100%, peak2s 5%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_9`, 银誓牧师 `right-4`, damage 50%, sustain 29%, taken 0%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `shadowExecute__vs__holySustain__seed_11`, 银誓牧师 `right-4`, damage 33%, sustain 29%, taken 0%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `ironWall__vs__shadowExecute__seed_8`, 银誓牧师 `left-3`, damage 28%, sustain 64%, taken 19%, survival 100%, peak2s 3%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。
- [牧师] 牧师输出过高: `holySustain__vs__poisonBloom__seed_1`, 银誓牧师 `left-3`, damage 27%, sustain 37%, taken 14%, survival 81%, peak2s 6%. Reason: 牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。

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

