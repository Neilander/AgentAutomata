# Skill Pool Red-Team Report

Generated random 4-unit teams from default role kits plus newly tagged role/common skills, then tested them against every current standard preset.

## Summary

- Candidates tested: 32
- Standard presets tested per candidate: 10
- Seeds per matchup: 5
- Risky candidates: 1

## Top Breaker Candidates

| Candidate | Avg Win | Presets Beaten | New Skills | Team | Most Lopsided Wins |
| --- | ---: | ---: | ---: | --- | --- |
| 5 | 68.0% | 8/10 | 5 | 狂战士 + 术士(咒血渗漏/异常猎手) + 骑士(盾击/前线操典) + 游侠(绞喉) | alchemyChaos 100%, fireBurst 80%, frostControl 80%, holySustain 100% |
| 2 | 46.0% | 4/10 | 6 | 术士(异常猎手) + 游侠(终结本能) + 战士(破甲重砍/终结本能/誓约集结) + 狂战士(破甲重砍) | bloodRage 100%, holySustain 100%, ironWall 100% |
| 14 | 38.0% | 4/10 | 4 | 狂战士(破甲重砍/前线操典) + 骑士(守拍/前线操典) + 术士 + 吟游诗人 | bloodRage 100%, holySustain 100%, ironWall 80% |
| 32 | 34.0% | 4/10 | 6 | 骑士(守拍) + 游侠(绞喉/异常猎手) + 战士(破甲重砍/终结本能) + 狂战士(赤宴) | bloodRage 80%, frostControl 80%, holySustain 80%, ironWall 100% |
| 23 | 32.0% | 3/10 | 4 | 牧师(誓约集结) + 游侠(终结本能) + 法师(冰枪/破灭彗星) + 狂战士 | frostControl 100%, holySustain 80% |
| 18 | 20.0% | 1/10 | 5 | 狂战士(破甲重砍/赤宴/前线操典) + 炼金师 + 术士(咒血渗漏) + 刺客(异常猎手) | holySustain 100% |
| 10 | 18.0% | 1/10 | 7 | 炼金师(咒血渗漏) + 牧师(守拍/复苏微光/誓约集结) + 狂战士(赤宴) + 战士(终结本能/誓约集结) | ironWall 100% |
| 22 | 18.0% | 1/10 | 6 | 游侠(灼痕箭/异常猎手) + 骑士(前线操典) + 刺客(异常猎手) + 战士(盾击/誓约集结) | bloodRage 100% |

## Interpretation

- At least one candidate crossed the breaker risk line; inspect the top candidate before adding more power to shared skills.
- Risk line requires either 65%+ average win rate, or very broad matchup coverage plus 64%+ average win rate. Broad but shallow 55%-63% candidates are watch-list items, not automatic nerf triggers.
- This is a batch gate, not a final balance proof. Archetype signal contracts still decide whether existing streams keep their intended shape.
- If a new skill appears in multiple top breaker teams, tune that skill first before changing class baselines.

