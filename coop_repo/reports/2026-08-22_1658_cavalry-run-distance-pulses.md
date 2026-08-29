# Agent Handoff: 马骑兵奔跑距离震击

- Date: 2026-08-22 16:58
- Agent/thread: Codex `/root`
- Scope: 延长马骑兵奔跑，并加入按真实移动距离触发的范围伤害与概率眩晕
- Status: complete

## User Intent

让目前只负责位移、容易把骑兵送进敌阵的“奔跑”更有进攻价值：持续时间稍长，移动过程中周期性对周围造成伤害并概率眩晕；触发频率必须按实际移动距离计算。

## Completed

- “奔跑”持续时间由0.8秒提高到1.2秒，10秒基础CD与25%技能移速加成不变。
- 每累计6真实移动距离触发一次“奔踏震击”，撞边界或没有产生位移不会白触发。
- 每次震击对自身周围8距离内所有敌人造成`12 + 0.3×物攻`物理伤害。
- 每个命中目标独立进行20%概率判定，成功时眩晕0.6秒。
- 奔跑期间原有普通攻击许可保留，仍不能释放其他技能，也没有额外自带减伤。
- 无套装完整奔跑约移动18并触发3次；三/六件奔袭铁骑约移动22.5并触发3次，六件套会按真实距离自然跨过16门槛进入冲锋就绪。
- 奔跑完成信号记录实际震击次数；震击伤害与眩晕进入共享战斗信号。
- 每次震击额外发出以骑兵自身为中心的范围信号，现有战斗视图会显示环形反馈，即使当次范围内没有敌人也能看见震击节奏。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/skills/cavalryRun.json`: 权威技能参数与说明。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 由拆分技能资产重新生成的浏览器/Node共享包。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 真实距离累计、范围伤害与眩晕结算。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 距离门槛、AOE和必定随机样本眩晕验证。
- `projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: 1.2秒奔跑、22.5距离、3次震击与自然蓄势验证。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 同步当前设计说明。

## Validation

- `node projects/western_fantasy_continent/game_data/build-skill-assets.js`: 成功重建共享技能包。
- `node projects/western_fantasy_continent/game_data/validate-skill-assets.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS；确认6距离前不触发、跨线造成AOE并可眩晕。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS；确认全套装奔跑22.5距离、3次震击并自然进入冲锋就绪。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- 直接读取当前网页无骑士`cavalryMockPlan`各跑50个随机种子：4v4/8v8/20v20骑兵输出占比19.56%/21.24%/26.77%，平均生存10.56/8.88/9.30秒，每骑兵平均造成1.38/2.04/2.94次震击命中并眩晕0.34/0.52/0.63次；确认强化生效，但生存问题仍然明显。
- `node --check projects/western_fantasy_continent/game_data/combat-sim.js`: PASS。
- `git diff --check -- <本次实现文件>`: PASS，仅有现有CRLF提示。
- 按用户既定要求未做网页视觉验证。

## Current State

奔跑现在是沿施放时锁定方向持续1.2秒的进攻路径技能；普通攻击与每6距离一次的震击同时存在。震击依据实际路程而不是时间触发，因此减速、撞墙和地图边界会减少触发次数。

## Unresolved

- 本轮没有添加奔跑自带减伤。无套装4v4平均生存约14秒、终局存活率4%，骑兵冲入敌阵后仍然脆弱；需用户决定是否进一步给奔跑保护或调整AI停车逻辑。
- 当前奔跑内部位移仍未应用“冲锋就绪后当前移速×1.5”的二次加速；普通追敌移动会应用。若要统一，需要单独确认这会不会让奔跑冲得过深。

## Recommended Next Step

先由用户在演武台观察震击节奏、眩晕反馈和冲入深度；如果主要问题仍是蒸发，优先在“奔跑期间减伤”“命中眩晕后短暂停车”“冲到攻击距离即结束奔跑”三种保护方向中选一种，不直接叠加全部。
