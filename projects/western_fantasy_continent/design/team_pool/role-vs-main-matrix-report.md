# Role Team Pool vs Main Team Pool Matrix

每个格子只存一场确定性对局的 summary，不保存完整 signals / replay。需要看具体对局时，用对应 roleTeamId 和 mainTeamId 重新跑。

## Scope

- Roles: 10
- Role teams: 100
- Opponent source: main
- Opponent teams: 140
- Cells / battles: 14000
- Seed policy: single deterministic seed per cell; rerun specific cells manually when deeper evidence is needed

## Role Summary

| Role | Win Rate | Wins | Avg Focus Damage | Avg Focus Sustain | Focus Alive | Hard Wins | Hard Losses | Best Role Teams | Weak Role Teams |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 骑士 `knight` | 83% | 1167/1400 | 127.1 | 382.2 | 53% | 1105 | 161 | knight-preset-06 97%<br>knight-preset-04 96%<br>knight-preset-01 95% | knight-seed-01 57%<br>knight-preset-02 73%<br>knight-seed-02 74% |
| 狂战士 `berserker` | 80% | 1125/1400 | 683.1 | 124.1 | 61% | 1046 | 217 | berserker-preset-03 96%<br>berserker-seed-02 96%<br>berserker-preset-04 92% | berserker-seed-03 59%<br>berserker-seed-01 64%<br>berserker-logic-07 69% |
| 战士 `warrior` | 79% | 1100/1400 | 500.6 | 12.3 | 50% | 1049 | 244 | warrior-preset-04 96%<br>warrior-seed-01 92%<br>warrior-preset-05 87% | warrior-seed-02 40%<br>warrior-seed-03 46%<br>warrior-preset-03 84% |
| 法师 `mage` | 76% | 1059/1400 | 478.5 | 0 | 61% | 981 | 279 | mage-preset-02 98%<br>mage-preset-01 94%<br>mage-preset-03 92% | mage-logic-06 15%<br>mage-logic-07 63%<br>mage-seed-01 63% |
| 牧师 `priest` | 75% | 1045/1400 | 180.7 | 548.5 | 68% | 998 | 312 | priest-preset-03 96%<br>priest-preset-05 91%<br>priest-preset-06 86% | priest-seed-03 40%<br>priest-seed-02 41%<br>priest-seed-01 62% |
| 吟游诗人 `bard` | 72% | 1001/1400 | 238.8 | 176.5 | 68% | 949 | 315 | bard-preset-03 96%<br>bard-preset-05 90%<br>bard-preset-04 87% | bard-seed-02 12%<br>bard-seed-01 48%<br>bard-seed-03 54% |
| 游侠 `ranger` | 65% | 903/1400 | 522.6 | 0 | 53% | 783 | 383 | ranger-preset-02 92%<br>ranger-preset-03 84%<br>ranger-logic-07 83% | ranger-logic-05 19%<br>ranger-seed-02 39%<br>ranger-seed-03 44% |
| 术士 `warlock` | 61% | 853/1400 | 471.3 | 0 | 49% | 707 | 416 | warlock-preset-02 98%<br>warlock-preset-04 88%<br>warlock-preset-03 79% | warlock-seed-01 20%<br>warlock-seed-02 38%<br>warlock-logic-07 44% |
| 炼金师 `alchemist` | 60% | 836/1400 | 426.2 | 0 | 41% | 734 | 458 | alchemist-preset-01 95%<br>alchemist-preset-02 93%<br>alchemist-preset-03 79% | alchemist-logic-05 17%<br>alchemist-logic-04 43%<br>alchemist-logic-06 48% |
| 刺客 `assassin` | 31% | 427/1400 | 98.8 | 0 | 7% | 389 | 941 | assassin-preset-01 98%<br>assassin-preset-02 87%<br>assassin-logic-03 46% | assassin-seed-02 1%<br>assassin-logic-06 3%<br>assassin-seed-03 7% |

## Opponent Pool Pressure

下面是最容易被职业小池打穿的对手队伍，以及最难打的对手队伍。

### Most Beaten Opponent Teams

- 状态铺设与引爆 logic-115 `logic-115`: role-pool win 100%; vulnerable to 炼金师 100%, 刺客 100%, 吟游诗人 100%
- 状态铺设与引爆 logic-118 `logic-118`: role-pool win 99%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%
- 一前排三后排 logic-026 `logic-026`: role-pool win 98%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%
- 两前排两后排 logic-054 `logic-054`: role-pool win 98%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%
- 一核心三保护 logic-089 `logic-089`: role-pool win 98%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%
- 一前排三后排 logic-027 `logic-027`: role-pool win 97%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%
- 一前排三后排 logic-013 `logic-013`: role-pool win 96%; vulnerable to 炼金师 100%, 狂战士 100%, 骑士 100%
- 一前排三后排 logic-016 `logic-016`: role-pool win 96%; vulnerable to 炼金师 100%, 狂战士 100%, 骑士 100%
- 两前排两后排 logic-059 `logic-059`: role-pool win 96%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%
- 一前排三后排 logic-006 `logic-006`: role-pool win 95%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%

### Hardest Opponent Teams

- 三前排一后排 logic-077 `logic-077`: role-pool win 0%; best into it 炼金师 0%, 刺客 0%, 吟游诗人 0%
- 状态铺设与引爆 logic-106 `logic-106`: role-pool win 5%; best into it 游侠 20%, 刺客 10%, 狂战士 10%
- 一核心三保护 logic-099 `logic-099`: role-pool win 6%; best into it 战士 20%, 吟游诗人 10%, 狂战士 10%
- 四前排 logic-084 `logic-084`: role-pool win 8%; best into it 法师 30%, 刺客 10%, 狂战士 10%
- 三前排一后排 logic-074 `logic-074`: role-pool win 10%; best into it 狂战士 30%, 战士 20%, 吟游诗人 10%
- 三前排一后排 logic-070 `logic-070`: role-pool win 21%; best into it 骑士 40%, 狂战士 30%, 法师 30%
- 三前排一后排 logic-068 `logic-068`: role-pool win 23%; best into it 狂战士 40%, 法师 40%, 吟游诗人 30%
- 控制爆发 logic-123 `logic-123`: role-pool win 31%; best into it 骑士 60%, 吟游诗人 50%, 法师 40%
- 四前排 logic-080 `logic-080`: role-pool win 34%; best into it 狂战士 60%, 骑士 50%, 法师 50%
- 三前排一后排 logic-067 `logic-067`: role-pool win 36%; best into it 狂战士 50%, 骑士 50%, 法师 50%

## Initial Interpretation

- 当前最高职业小池：骑士 83%。
- 当前最低职业小池：刺客 31%。
- 这不是职业单体强度结论，而是“该职业的 10 个测试队伍进入当前主池环境”的结果。
- 如果某职业偏高，先看 best role teams 是否集中在 1-2 个队伍；如果集中，可能是队伍壳或技能组合问题，不一定是职业整体问题。
- 如果某职业偏低，先看 focus damage / focus sustain / focus alive，判断是焦点没贡献、站不住，还是队伍模板不适合它。
