# Team Pool Evolver Report

本报告记录预制队伍池和随机探索队伍的状态。这个流程不是 AI 训练；它是设计师先验 + 随机探索 + combat-sim 验证 + 有价值队伍追加。

## Database

- File: `game_data/team_pools/team-pool-db.json`
- Teams: 140
- Rounds recorded: 0
- Removal enabled: no

### Source Counts

- designer-logic: 140

### Pattern Counts

- 一前排三后排: 30
- 两前排两后排: 30
- 三前排一后排: 18
- 一核心三保护: 18
- 状态铺设与引爆: 18
- 控制爆发: 18
- 四前排: 8

## Last Exploration Round

- Mode: dry-run
- Round: r001
- Random candidates: 6
- Opponents per candidate: 23
- Seeds per matchup: 1
- Promoted: 2

| Candidate | Keep | Score | Avg Win | Standard Win | Hard Prey | Reasons | Team |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| random-r001-001 | yes | 116 | 48% | 41% | 11 | 11 hard prey with acceptable average; counter candidate into preset:bulwarkMarks | 狂战士(残伤怒砍/躁血快斩/血怒引擎/刃吼狂潮) + 术士(腐毒烙印/血咒蚀刻/异常猎手/禁忌献祭) + 战士(裂阵推进/点名决斗/决斗誓约/单挑裁决) + 游侠(猎标接力/绞喉/陷阱嗅觉/箭雨) |
| random-r001-002 | yes | 104 | 35% | 24% | 8 | 8 hard prey with acceptable average; counter candidate into preset:bloodRage | 骑士(枪骑冲锋/壁垒回击/冲阵余势/王骑破阵) + 法师(冰枪/余烬火球/异常猎手/破灭彗星) + 牧师(恩典转护/辉光拦截/殉道圣盾/誓约集结) + 战士(重击/顺劈/终结本能/决斗破势) |
| random-r001-003 | no | 0 | 13% | 12% | 3 | no promotion signal | 术士(毒息分红/痛苦分红/赤契术式/万毒献祭) + 炼金师(沼雾瓶/腐蚀泡沫/催化剂/破灭彗星) + 骑士(截护誓言/誓言挑衅/前线操典/王骑破阵) + 骑士(誓言挑衅/守拍/冲阵余势/誓约集结) |
| random-r001-005 | no | 0 | 4% | 0% | 1 | no promotion signal | 牧师(恩典转护/急救/殉道圣盾/誓约集结) + 吟游诗人(切分拍/急板战歌/和声守护者/誓约集结) + 术士(痛苦分红/咒血渗漏/异常猎手/禁忌献祭) + 炼金师(腐蚀泡沫/爆裂瓶/催化剂/终极混剂) |
| random-r001-006 | no | 0 | 4% | 0% | 1 | no promotion signal | 狂战士(赤血挑衅/血怒斩/痛楚锚定/赤血旋风) + 炼金师(稳定蒸汽/咒血渗漏/蒸馏循环/终极混剂) + 游侠(灼痕箭/猎标引爆/决斗专注/箭雨) + 术士(痛苦分红/血契供奉/异常猎手/禁忌献祭) |
| random-r001-004 | no | 0 | 0% | 0% | 0 | no promotion signal | 术士(痛苦分红/血契供奉/异常猎手/万毒献祭) + 骑士(壁垒回击/枪骑冲锋/坚守阵线/王骑破阵) + 法师(余烬火球/灰烬火场/异常猎手/破灭彗星) + 炼金师(沼雾瓶/火花催化/异常猎手/终极混剂) |

### Promoted Teams

- discover-r001-001: 狂战士(残伤怒砍/躁血快斩/血怒引擎/刃吼狂潮) + 术士(腐毒烙印/血咒蚀刻/异常猎手/禁忌献祭) + 战士(裂阵推进/点名决斗/决斗誓约/单挑裁决) + 游侠(猎标接力/绞喉/陷阱嗅觉/箭雨); 11 hard prey with acceptable average; counter candidate into preset:bulwarkMarks
- discover-r001-002: 骑士(枪骑冲锋/壁垒回击/冲阵余势/王骑破阵) + 法师(冰枪/余烬火球/异常猎手/破灭彗星) + 牧师(恩典转护/辉光拦截/殉道圣盾/誓约集结) + 战士(重击/顺劈/终结本能/决斗破势); 8 hard prey with acceptable average; counter candidate into preset:bloodRage

## Next Use

- Keep the 140 logic teams as the stable base.
- Run 60 random exploration teams per round when we want new candidates.
- Promote only teams with clear value: broad strength, strong standard-preset counter, or multiple hard prey.
- Do not remove weak logic teams yet; growth from 140 to 200/260/320 is acceptable at this stage.
