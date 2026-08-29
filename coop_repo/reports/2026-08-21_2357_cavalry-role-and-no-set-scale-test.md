# Agent Handoff: 马骑兵职业与无套装规模测试

- Date: 2026-08-21
- Agent/thread: Codex `/root`
- Scope: 实装马骑兵基础值与四技能，并各跑50局4v4、8v8、20v20无套装评测
- Status: complete

## User Intent

按用户确认的技能概念与18/10/35秒CD完成马骑兵；技能应该低频但强。无需300局，每种规模50局即可，重点观察骑兵生存时间、团队输出占比和击杀次数，且全程不带套装。

## Completed

- 新增正式`cavalry`职业：320生命、50物攻、0法强、9护甲、9魔抗、18移速、20射程、0.8倍攻速、0.85倍技能急速。
- 被动“乘胜冲锋”：亲手击杀后获得6秒冲锋状态，可向下一目标突进最多24距离；下一次普攻额外`18 + 0.8×物攻`物理伤害。
- 小技能1“二连跃”：18秒CD，1.6秒内在0.24/1.0秒各向前移动10；每次落地对11半径造成`32 + 0.95×物攻`物理伤害。全过程80%减伤，可以普攻，不可释放其他技能。
- 小技能2“奔跑”：10秒CD，锁定方向奔跑2.8秒、移速提高25%；期间可普攻20距离内敌人，不可释放技能，自身不附伤也不减伤。
- 大招“风卷残云”：35秒CD，只有14半径内有敌人才释放；持续4.8秒，每0.6秒对14半径所有敌人造成`10 + 0.24×物攻`物理伤害，共8次；持续时不移动、普攻或放其他技能。
- 共享战斗结果新增通用`kills`和`survivalTime`，便于职业评测。
- 第一轮发现骑兵会先奔跑到敌阵深处，4v4平均约17秒死亡且大招几乎无法施放。最终版改为二连跃优先入场、每跳10距离，奔跑缩为2.8秒，并保持只有二连跃拥有减伤。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/roles/cavalry.json`: 马骑兵正式角色资产。
- `projects/western_fantasy_continent/game_data/skill_assets/skills/cavalry*.json`: 四个正式技能资产。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 骑兵持续动作、技能锁、落地AOE、奔跑普攻、近敌大招、击杀冲锋、80%减伤，以及击杀/生存统计。
- `projects/western_fantasy_continent/game_data/skill-data.js`、`validate-skill-assets.js`: 新效果类型接线与校验。
- `projects/western_fantasy_continent/game_data/build-layers.js`: 角色基础物攻/法强、攻速、技能急速正式进入构筑规格，保证骑兵0法强和低频属性不被默认值覆盖。
- `projects/western_fantasy_continent/game_data/equipment-runtime.js`: 马骑兵按物理前排职业参与装备评分。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 从源资产重建。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 骑兵专项规则验证。
- `projects/western_fantasy_continent/game_data/analyze-cavalry-scale.js`: 固定50局三规模无套装评测脚本。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 更新为第一版完整职业设计与显式倍率。

## Validation

评测使用重复平衡块：我方`骑士/马骑兵/法师/牧师`，敌方`骑士/战士/法师/牧师`。8v8和20v20按相同比例复制，因此骑兵固定占我方单位数25%；双方都不传装备或套装机制。每种规模50个确定性种子，开启现有的小幅基础属性波动，最大75秒。

| 规模 | 平均生存时间 | 结束存活率 | 团队输出占比 | 每名骑兵击杀 | 全队击杀占比 | 我方胜率 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4v4 | 27.71秒 | 30.0% | 27.69% | 0.300 | 18.29% | 48% |
| 8v8 | 31.70秒 | 40.0% | 25.56% | 0.640 | 23.27% | 62% |
| 20v20 | 12.61秒 | 42.0% | 25.14% | 0.244 | 7.14% | 78% |

平均每名骑兵施法次数（小1/小2/大招）：4v4为`1.68 / 2.56 / 1.00`，8v8为`1.81 / 2.74 / 0.89`，20v20为`1.00 / 1.01 / 0.51`。结果符合“技能少但强”，尤其大招通常一局不超过一次。

- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS；基础值、0法强、低攻速/急速、CD、二连跃位移与80%减伤、击杀冲锋、大招近敌门槛均通过。
- `node projects/western_fantasy_continent/game_data/analyze-cavalry-scale.js`: 完成150局最终无套装评测并输出上表。
- `verify-cavalry-charge.js`: PASS；原奔袭铁骑套仍为2.82x，未混入本次无套装基线。
- `verify-move-speed.js`、`verify-magic-resistance.js`、`validate-skill-assets.js`、`validate-game-data.js`: PASS。
- 灰谷核心与静态Web验证：PASS。
- `git diff --check`: PASS；仅有现存Windows行尾提示。

## Current State

马骑兵作为物理输出已经可用：当它占队伍25%人数时，三种规模贡献约25%的团队输出，4v4没有胜率优势，8v8温和增强，20v20因落点/旋风AOE与高速扰阵明显强于用战士占同一位置，但输出占比没有失控。

二连跃的80%减伤现在是关键生存窗口；奔跑没有偷偷获得减伤。持续站桩输出仍弱，实际伤害集中于二连跃与一局约一次的风卷残云，符合定位。

## Unresolved

- 20v20中骑兵虽有25.14%输出，但只拿到7.14%全队击杀；短局里法师更容易收尾，因此“亲手击杀触发”的被动在大规模战斗利用率较低。这是明确的规模差异，不应擅自改成助攻触发。
- 20v20替换战士后的胜率达到78%，说明群体战适性很强；当前50局足够看方向，但还没有跨多种敌方阵容验证是否普遍偏强。
- 马骑兵尚未确认七大属性中的主副属性，不在本轮擅自指定。
- 本轮只验证规则和数值，没有制作专属视觉资源。

## Recommended Next Step

由用户先验收当前三规模结果，尤其决定是否接受“20v20输出正常但亲手击杀少”的特征；若接受，再把骑兵加入正式可招募/可掉落内容入口并做套装组合测试。
