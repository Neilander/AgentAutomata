# Skill Pool Red-Team Report

Generated random 4-unit teams from default role kits plus newly tagged role/common skills, then tested them against every current standard preset.

## Summary

- Candidates tested: 32
- Standard presets tested per candidate: 17
- Seeds per matchup: 5
- Risky candidates: 2

## Top Breaker Candidates

| Candidate | Avg Win | Presets Beaten | New Skills | Team | Most Lopsided Wins |
| --- | ---: | ---: | ---: | --- | --- |
| 14 | 84.7% | 15/17 | 5 | 狂战士(破甲重砍/痛楚锚定) + 骑士(枪骑冲锋/守望誓约) + 术士 + 吟游诗人(安魂守拍) | bloodRage 100%, bulwarkMarks 100%, cavalryBreak 100%, crownCarry 100% |
| 32 | 68.2% | 12/17 | 8 | 骑士(枪骑冲锋) + 游侠(缚足箭/陷阱嗅觉) + 战士(破甲重砍/终结本能) + 狂战士(血盾冲顶/前线操典/赤血旋风) | bloodRage 100%, bulwarkMarks 100%, cavalryBreak 100%, crownCarry 100% |
| 20 | 52.9% | 8/17 | 9 | 游侠(陷阱嗅觉/猎杀禁区) + 骑士(守拍) + 炼金师(咒血渗漏/异常猎手/完美反应) + 术士(咒血渗漏/赤契术式/破灭彗星) | bloodRage 100%, bulwarkMarks 100%, duelChampion 100%, ironWall 100% |
| 2 | 50.6% | 9/17 | 10 | 术士(血咒蚀刻/异常猎手/禁忌献祭) + 游侠(缚足箭/终结本能) + 战士(破甲重砍/决斗誓约/誓约集结) + 狂战士(破甲重砍/前线操典) | bloodRage 80%, duelChampion 100%, holySustain 100%, ironWall 100% |
| 10 | 47.1% | 8/17 | 10 | 炼金师(咒血渗漏/蒸馏循环) + 牧师(守拍/辉光拦截/誓约集结) + 狂战士(血盾冲顶/赤血旋风) + 战士(老兵稳切/前线操典/单挑裁决) | bloodRage 100%, cavalryBreak 100%, duelChampion 100%, frostTrapField 100% |
| 5 | 40.0% | 6/17 | 10 | 狂战士(血盾冲顶/前线操典/赤血旋风) + 术士(咒血渗漏/异常猎手) + 骑士(守拍/前线操典/誓约壁垒) + 游侠(终结本能/猎杀禁区) | alchemyChaos 80%, bulwarkMarks 100%, frostControl 80%, ironWall 80% |
| 12 | 34.1% | 7/17 | 9 | 战士(盾击/孤胆老兵/单挑裁决) + 术士(血咒蚀刻/咒血渗漏/赤契术式/禁忌献祭) + 骑士(枪骑冲锋/誓约壁垒) + 刺客 | bloodRage 80%, cavalryBreak 80%, martyrFrontline 80%, scarletVanguard 100% |
| 8 | 31.8% | 5/17 | 9 | 牧师(殉道圣盾/堡垒圣域) + 术士(血咒蚀刻/咒血渗漏/赤契术式/禁忌献祭) + 狂战士(血盾冲顶/前线操典) + 吟游诗人(誓约集结) | duelChampion 100%, frostTrapField 80%, lightningTempo 100%, martyrFrontline 100% |

## Interpretation

- At least one candidate crossed the breaker risk line; inspect the top candidate before adding more power to shared skills.
- Risk line requires either 65%+ average win rate, or very broad matchup coverage plus 64%+ average win rate. Broad but shallow 55%-63% candidates are watch-list items, not automatic nerf triggers.
- This is a batch gate, not a final balance proof. Archetype signal contracts still decide whether existing streams keep their intended shape.
- If a new skill appears in multiple top breaker teams, tune that skill first before changing class baselines.

