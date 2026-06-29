# Role Team Pool vs Fixed Preset Matrix

每个格子只存一场确定性对局的 summary，不保存完整 signals / replay。需要看具体对局时，用对应 roleTeamId 和 mainTeamId 重新跑。

## Scope

- Roles: 10
- Role teams: 100
- Opponent source: presets
- Opponent teams: 17
- Cells / battles: 1700
- Seed policy: single deterministic seed per cell; rerun specific cells manually when deeper evidence is needed

## Role Summary

| Role | Win Rate | Wins | Avg Focus Damage | Avg Focus Sustain | Focus Alive | Hard Wins | Hard Losses | Best Role Teams | Weak Role Teams |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 狂战士 `berserker` | 48% | 81/170 | 744 | 138.4 | 33% | 66 | 82 | berserker-preset-03 94%<br>berserker-preset-04 65%<br>berserker-preset-01 53% | berserker-seed-03 6%<br>berserker-logic-05 35%<br>berserker-logic-06 35% |
| 法师 `mage` | 43% | 73/170 | 543.2 | 0 | 38% | 61 | 86 | mage-preset-02 82%<br>mage-preset-03 77%<br>mage-preset-04 71% | mage-logic-06 0%<br>mage-seed-01 0%<br>mage-logic-07 18% |
| 骑士 `knight` | 41% | 70/170 | 116.3 | 538 | 16% | 54 | 82 | knight-preset-04 94%<br>knight-preset-06 77%<br>knight-preset-07 59% | knight-preset-05 6%<br>knight-seed-01 12%<br>knight-seed-02 12% |
| 吟游诗人 `bard` | 38% | 64/170 | 244.7 | 174 | 34% | 50 | 101 | bard-preset-03 94%<br>bard-preset-05 65%<br>bard-preset-07 65% | bard-seed-02 0%<br>bard-preset-06 12%<br>bard-seed-01 12% |
| 牧师 `priest` | 34% | 58/170 | 183.4 | 714.3 | 29% | 53 | 104 | priest-preset-03 94%<br>priest-preset-05 77%<br>priest-preset-01 53% | priest-seed-02 0%<br>priest-seed-03 0%<br>priest-preset-07 6% |
| 战士 `warrior` | 34% | 58/170 | 421.5 | 10.4 | 15% | 52 | 103 | warrior-preset-04 71%<br>warrior-seed-01 65%<br>warrior-preset-01 53% | warrior-seed-02 0%<br>warrior-seed-03 0%<br>warrior-preset-03 12% |
| 游侠 `ranger` | 22% | 38/170 | 502.2 | 0 | 16% | 29 | 119 | ranger-preset-02 65%<br>ranger-preset-03 53%<br>ranger-preset-01 29% | ranger-logic-05 0%<br>ranger-seed-02 0%<br>ranger-seed-03 0% |
| 术士 `warlock` | 20% | 34/170 | 530.8 | 0 | 16% | 25 | 123 | warlock-preset-02 82%<br>warlock-preset-03 35%<br>warlock-seed-03 24% | warlock-logic-07 0%<br>warlock-seed-01 0%<br>warlock-logic-05 6% |
| 炼金师 `alchemist` | 19% | 33/170 | 447.7 | 0 | 12% | 27 | 126 | alchemist-preset-02 65%<br>alchemist-preset-01 53%<br>alchemist-preset-03 24% | alchemist-logic-05 0%<br>alchemist-logic-04 6%<br>alchemist-logic-06 6% |
| 刺客 `assassin` | 12% | 21/170 | 72.5 | 0 | 1% | 19 | 147 | assassin-preset-01 88%<br>assassin-preset-02 24%<br>assassin-logic-03 12% | assassin-logic-04 0%<br>assassin-logic-05 0%<br>assassin-logic-06 0% |

## Opponent Pool Pressure

下面是最容易被职业小池打穿的对手队伍，以及最难打的对手队伍。

### Most Beaten Opponent Teams

- 决斗冠军 `duelChampion`: role-pool win 53%; vulnerable to 狂战士 80%, 战士 80%, 吟游诗人 70%
- 铁壁反击 `ironWall`: role-pool win 49%; vulnerable to 狂战士 70%, 骑士 70%, 法师 60%
- 殉道前线 `martyrFrontline`: role-pool win 47%; vulnerable to 狂战士 70%, 吟游诗人 60%, 骑士 60%
- 圣盾续航 `holySustain`: role-pool win 46%; vulnerable to 法师 70%, 吟游诗人 50%, 狂战士 50%
- 净化消耗 `purgeAttrition`: role-pool win 45%; vulnerable to 狂战士 70%, 法师 70%, 吟游诗人 60%
- 暗影处决 `shadowExecute`: role-pool win 45%; vulnerable to 狂战士 80%, 骑士 70%, 法师 60%
- 壁垒猎标 `bulwarkMarks`: role-pool win 44%; vulnerable to 狂战士 90%, 骑士 60%, 法师 60%
- 王骑破阵 `cavalryBreak`: role-pool win 31%; vulnerable to 狂战士 50%, 法师 50%, 吟游诗人 40%
- 低血狂怒 `bloodRage`: role-pool win 29%; vulnerable to 炼金师 40%, 吟游诗人 40%, 骑士 40%
- 急速节奏 `lightningTempo`: role-pool win 28%; vulnerable to 骑士 50%, 吟游诗人 40%, 狂战士 40%

### Hardest Opponent Teams

- 王冠核心 `crownCarry`: role-pool win 6%; best into it 牧师 20%, 吟游诗人 10%, 狂战士 10%
- 毒巢滚雪球 `poisonBloom`: role-pool win 9%; best into it 吟游诗人 20%, 战士 20%, 刺客 10%
- 余烬爆燃 `fireBurst`: role-pool win 10%; best into it 吟游诗人 20%, 战士 20%, 刺客 10%
- 霜陷猎场 `frostTrapField`: role-pool win 20%; best into it 狂战士 60%, 骑士 30%, 法师 30%
- 霜控拖延 `frostControl`: role-pool win 21%; best into it 狂战士 40%, 骑士 40%, 牧师 40%
- 赤血先锋 `scarletVanguard`: role-pool win 21%; best into it 法师 50%, 骑士 40%, 炼金师 20%
- 炼金异常 `alchemyChaos`: role-pool win 26%; best into it 吟游诗人 50%, 法师 40%, 牧师 40%
- 急速节奏 `lightningTempo`: role-pool win 28%; best into it 骑士 50%, 吟游诗人 40%, 狂战士 40%
- 低血狂怒 `bloodRage`: role-pool win 29%; best into it 炼金师 40%, 吟游诗人 40%, 骑士 40%
- 王骑破阵 `cavalryBreak`: role-pool win 31%; best into it 狂战士 50%, 法师 50%, 吟游诗人 40%

## Initial Interpretation

- 当前最高职业小池：狂战士 48%。
- 当前最低职业小池：刺客 12%。
- 这不是职业单体强度结论，而是“该职业的 10 个测试队伍进入当前主池环境”的结果。
- 如果某职业偏高，先看 best role teams 是否集中在 1-2 个队伍；如果集中，可能是队伍壳或技能组合问题，不一定是职业整体问题。
- 如果某职业偏低，先看 focus damage / focus sustain / focus alive，判断是焦点没贡献、站不住，还是队伍模板不适合它。
