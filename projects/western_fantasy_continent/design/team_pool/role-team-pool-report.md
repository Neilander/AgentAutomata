# Role Team Pool Report

每个职业维护一个小型队伍池，用来测试该职业或该职业新技能。默认每职业 10 队：7 个设计逻辑队 + 3 个随机种子队。

## Simulation Budget

- 单职业测试：10 role teams x 200 main teams = 2,000 matchup pairs before seeds.
- 十职业全量测试：100 role teams x 200 main teams = 20,000 matchup pairs before seeds.
- 如果 seeds=2，全职业就是 40,000 场战斗。

## Database

- File: `game_data/team_pools/role-team-pool-db.json`
- Roles: 10
- Total teams: 100
- Rounds recorded: 0
- Removal enabled: no

| Role | Teams | Sources | Patterns |
| --- | ---: | --- | --- |
| 炼金师 `alchemist` | 10 | role-designer-logic:4, role-fixed-preset:3, role-random-seed:3 | 职业随机探索:3, 固定流派:炼金异常:1, 固定流派:霜控拖延:1, 固定流派:净化消耗:1, 均衡壳:1, 双前排壳:1, 核心保护:1, 异常搭档:1 |
| 刺客 `assassin` | 10 | role-designer-logic:5, role-random-seed:3, role-fixed-preset:2 | 职业随机探索:3, 固定流派:毒巢滚雪球:1, 固定流派:暗影处决:1, 均衡壳:1, 双前排壳:1, 核心保护:1, 异常搭档:1, 控制窗口:1 |
| 吟游诗人 `bard` | 10 | role-fixed-preset:7, role-random-seed:3 | 职业随机探索:3, 固定流派:低血狂怒:1, 固定流派:壁垒猎标:1, 固定流派:王冠核心:1, 固定流派:决斗冠军:1, 固定流派:霜陷猎场:1, 固定流派:铁壁反击:1, 固定流派:急速节奏:1 |
| 狂战士 `berserker` | 10 | role-fixed-preset:4, role-designer-logic:3, role-random-seed:3 | 职业随机探索:3, 固定流派:低血狂怒:1, 固定流派:王骑破阵:1, 固定流派:王冠核心:1, 固定流派:赤血先锋:1, 均衡壳:1, 双前排壳:1, 核心保护:1 |
| 骑士 `knight` | 10 | role-fixed-preset:7, role-random-seed:3 | 职业随机探索:3, 固定流派:炼金异常:1, 固定流派:壁垒猎标:1, 固定流派:王骑破阵:1, 固定流派:王冠核心:1, 固定流派:决斗冠军:1, 固定流派:余烬爆燃:1, 固定流派:霜控拖延:1 |
| 法师 `mage` | 10 | role-fixed-preset:5, role-random-seed:3, role-designer-logic:2 | 职业随机探索:3, 固定流派:炼金异常:1, 固定流派:余烬爆燃:1, 固定流派:霜控拖延:1, 固定流派:霜陷猎场:1, 固定流派:赤血先锋:1, 均衡壳:1, 双前排壳:1 |
| 牧师 `priest` | 10 | role-fixed-preset:7, role-random-seed:3 | 职业随机探索:3, 固定流派:低血狂怒:1, 固定流派:王骑破阵:1, 固定流派:王冠核心:1, 固定流派:决斗冠军:1, 固定流派:霜控拖延:1, 固定流派:圣盾续航:1, 固定流派:铁壁反击:1 |
| 游侠 `ranger` | 10 | role-fixed-preset:4, role-designer-logic:3, role-random-seed:3 | 职业随机探索:3, 固定流派:壁垒猎标:1, 固定流派:霜陷猎场:1, 固定流派:急速节奏:1, 固定流派:殉道前线:1, 均衡壳:1, 双前排壳:1, 核心保护:1 |
| 术士 `warlock` | 10 | role-fixed-preset:4, role-designer-logic:3, role-random-seed:3 | 职业随机探索:3, 固定流派:殉道前线:1, 固定流派:毒巢滚雪球:1, 固定流派:净化消耗:1, 固定流派:暗影处决:1, 均衡壳:1, 双前排壳:1, 核心保护:1 |
| 战士 `warrior` | 10 | role-fixed-preset:7, role-random-seed:3 | 职业随机探索:3, 固定流派:低血狂怒:1, 固定流派:王骑破阵:1, 固定流派:决斗冠军:1, 固定流派:余烬爆燃:1, 固定流派:圣盾续航:1, 固定流派:铁壁反击:1, 固定流派:急速节奏:1 |

## Usage

初始化：

```bash
node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=init
```

测试某个职业新技能，但先不写库：

```bash
node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=evolve --role=priest --focus-skill=purifyingWard --dry-run
```
