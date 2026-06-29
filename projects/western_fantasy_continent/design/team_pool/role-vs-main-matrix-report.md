# Role Team Pool vs Main Team Pool Matrix

每个格子只存一场确定性对局的 summary，不保存完整 signals / replay。需要看具体对局时，用对应 roleTeamId 和 mainTeamId 重新跑。

## Scope

- Roles: 10
- Role teams: 100
- Main teams: 140
- Cells / battles: 14000
- Seed policy: single deterministic seed per cell; rerun specific cells manually when deeper evidence is needed

## Role Summary

| Role | Win Rate | Wins | Avg Focus Damage | Avg Focus Sustain | Focus Alive | Hard Wins | Hard Losses | Best Role Teams | Weak Role Teams |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 骑士 `knight` | 74% | 1040/1400 | 124.1 | 228.8 | 34% | 926 | 257 | knight-logic-02 93%<br>knight-logic-07 93%<br>knight-logic-06 89% | knight-seed-03 38%<br>knight-logic-04 47%<br>knight-seed-01 66% |
| 狂战士 `berserker` | 59% | 822/1400 | 455.8 | 58.5 | 25% | 659 | 484 | berserker-seed-02 84%<br>berserker-seed-01 81%<br>berserker-logic-05 77% | berserker-seed-03 19%<br>berserker-logic-06 37%<br>berserker-logic-04 39% |
| 战士 `warrior` | 56% | 781/1400 | 386.1 | 42.3 | 30% | 655 | 516 | warrior-logic-06 84%<br>warrior-seed-01 83%<br>warrior-logic-01 79% | warrior-logic-04 11%<br>warrior-logic-03 27%<br>warrior-seed-02 37% |
| 游侠 `ranger` | 55% | 765/1400 | 428.3 | 0 | 42% | 661 | 522 | ranger-logic-06 91%<br>ranger-seed-03 73%<br>ranger-seed-01 70% | ranger-logic-01 9%<br>ranger-seed-02 27%<br>ranger-logic-04 38% |
| 术士 `warlock` | 43% | 601/1400 | 376.1 | 0 | 24% | 461 | 671 | warlock-logic-06 88%<br>warlock-logic-05 68%<br>warlock-logic-04 63% | warlock-logic-07 7%<br>warlock-seed-01 19%<br>warlock-logic-03 27% |
| 牧师 `priest` | 42% | 584/1400 | 82.6 | 271.9 | 22% | 487 | 705 | priest-logic-05 83%<br>priest-logic-03 62%<br>priest-seed-02 56% | priest-seed-01 11%<br>priest-logic-04 19%<br>priest-logic-06 21% |
| 吟游诗人 `bard` | 40% | 562/1400 | 178.4 | 103 | 26% | 480 | 734 | bard-logic-05 81%<br>bard-logic-02 77%<br>bard-seed-03 65% | bard-logic-07 17%<br>bard-logic-04 20%<br>bard-logic-01 21% |
| 法师 `mage` | 38% | 529/1400 | 350.1 | 0 | 24% | 438 | 779 | mage-logic-07 86%<br>mage-logic-06 67%<br>mage-logic-03 54% | mage-logic-04 1%<br>mage-logic-05 3%<br>mage-logic-01 6% |
| 刺客 `assassin` | 37% | 518/1400 | 222.5 | 4.5 | 5% | 412 | 786 | assassin-logic-01 69%<br>assassin-seed-01 57%<br>assassin-logic-04 49% | assassin-seed-02 11%<br>assassin-logic-03 16%<br>assassin-seed-03 17% |
| 炼金师 `alchemist` | 34% | 472/1400 | 373.3 | 0 | 19% | 353 | 767 | alchemist-seed-01 65%<br>alchemist-seed-03 64%<br>alchemist-logic-01 42% | alchemist-logic-02 8%<br>alchemist-logic-05 14%<br>alchemist-logic-03 26% |

## Main Pool Pressure

下面是最容易被职业小池打穿的主池队伍，以及最难打的主池队伍。

### Most Beaten Main Teams

- 一前排三后排 logic-013 `logic-013`: role-pool win 99%; vulnerable to 炼金师 100%, 吟游诗人 100%, 狂战士 100%
- 一前排三后排 logic-009 `logic-009`: role-pool win 97%; vulnerable to 炼金师 100%, 刺客 100%, 吟游诗人 100%
- 一前排三后排 logic-016 `logic-016`: role-pool win 96%; vulnerable to 刺客 100%, 吟游诗人 100%, 狂战士 100%
- 状态铺设与引爆 logic-114 `logic-114`: role-pool win 96%; vulnerable to 炼金师 100%, 刺客 100%, 狂战士 100%
- 状态铺设与引爆 logic-119 `logic-119`: role-pool win 90%; vulnerable to 刺客 100%, 吟游诗人 100%, 狂战士 100%
- 状态铺设与引爆 logic-121 `logic-121`: role-pool win 90%; vulnerable to 狂战士 100%, 骑士 100%, 游侠 100%
- 控制爆发 logic-127 `logic-127`: role-pool win 88%; vulnerable to 狂战士 100%, 骑士 100%, 牧师 100%
- 一前排三后排 logic-030 `logic-030`: role-pool win 87%; vulnerable to 刺客 100%, 狂战士 100%, 骑士 100%
- 控制爆发 logic-140 `logic-140`: role-pool win 87%; vulnerable to 吟游诗人 100%, 骑士 100%, 牧师 100%
- 状态铺设与引爆 logic-117 `logic-117`: role-pool win 86%; vulnerable to 炼金师 100%, 骑士 100%, 游侠 100%

### Hardest Main Teams

- 三前排一后排 logic-077 `logic-077`: role-pool win 4%; best into it 骑士 20%, 刺客 10%, 战士 10%
- 一核心三保护 logic-099 `logic-099`: role-pool win 6%; best into it 吟游诗人 20%, 法师 20%, 游侠 10%
- 状态铺设与引爆 logic-106 `logic-106`: role-pool win 6%; best into it 游侠 30%, 骑士 20%, 术士 10%
- 四前排 logic-084 `logic-084`: role-pool win 7%; best into it 骑士 20%, 游侠 20%, 狂战士 10%
- 三前排一后排 logic-074 `logic-074`: role-pool win 9%; best into it 骑士 30%, 狂战士 20%, 刺客 10%
- 三前排一后排 logic-070 `logic-070`: role-pool win 12%; best into it 骑士 40%, 刺客 20%, 狂战士 20%
- 四前排 logic-080 `logic-080`: role-pool win 13%; best into it 骑士 40%, 狂战士 30%, 刺客 20%
- 一前排三后排 logic-014 `logic-014`: role-pool win 15%; best into it 骑士 50%, 游侠 30%, 狂战士 20%
- 一前排三后排 logic-004 `logic-004`: role-pool win 17%; best into it 狂战士 40%, 骑士 30%, 法师 20%
- 一核心三保护 logic-103 `logic-103`: role-pool win 18%; best into it 骑士 60%, 游侠 30%, 狂战士 20%

## Initial Interpretation

- 当前最高职业小池：骑士 74%。
- 当前最低职业小池：炼金师 34%。
- 这不是职业单体强度结论，而是“该职业的 10 个测试队伍进入当前主池环境”的结果。
- 如果某职业偏高，先看 best role teams 是否集中在 1-2 个队伍；如果集中，可能是队伍壳或技能组合问题，不一定是职业整体问题。
- 如果某职业偏低，先看 focus damage / focus sustain / focus alive，判断是焦点没贡献、站不住，还是队伍模板不适合它。
