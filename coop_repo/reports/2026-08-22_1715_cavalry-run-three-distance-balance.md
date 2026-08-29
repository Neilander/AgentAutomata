# Agent Handoff: 奔跑三距离震击与胜率输出

- Date: 2026-08-22 17:15
- Agent/thread: Codex `/root`
- Scope: 将马骑兵奔跑震击间隔6→3，并对当前网页无骑士演武阵容进行50局规模评估
- Status: complete

## User Intent

把奔跑的范围伤害改为每移动3距离触发一次，并检查改动后的胜率和骑兵输出。

## Completed

- “奔踏震击”触发间隔由每6真实移动距离改为每3距离；伤害、范围、眩晕概率和持续时间不变。
- 无套装完整1.2秒奔跑约移动18，理论触发6次；奔袭铁骑套约移动22.5，理论触发7次。
- 同步权威拆分技能资产、生成技能包、专项测试与设计文档。
- 使用当前网页`cavalryMockPlan`的无骑士4v4/8v8/20v20阵容，无套装和全员六件套各跑50局。
- 另用完全相同随机种子对6距离和3距离版本做配对比较，以隔离本次改动。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/skills/cavalryRun.json`: 震击间隔改为3并同步说明。
- `projects/western_fantasy_continent/game_data/skill-assets.js`: 重建共享技能包。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 缺省震击距离同步为3。
- `projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: 三距离触发边界验证。
- `projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: 全套装奔跑7次震击验证。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 更新6/7次理论触发说明。

## Validation

- `node game_data/build-skill-assets.js`、`validate-skill-assets.js`、`verify-cavalry-role.js`、`verify-cavalry-charge.js`: PASS。
- `node border_village_war_web/verify-static-web.js`: PASS。
- `node --check game_data/combat-sim.js`: PASS。
- `git diff --check -- <本次实现文件>`: PASS，仅有现有CRLF提示。

### 当前3距离版本，各50局

| 配装 | 规模 | 胜率 | 骑兵输出占比 | 单骑平均伤害 |
| --- | ---: | ---: | ---: | ---: |
| 无套装 | 4v4 | 44% | 21.13% | 311.0 |
| 无套装 | 8v8 | 98% | 28.06% | 422.8 |
| 无套装 | 20v20 | 88% | 28.99% | 424.3 |
| 全员六件套 | 4v4 | 34% | 38.14% | 575.9 |
| 全员六件套 | 8v8 | 88% | 38.35% | 748.3 |
| 全员六件套 | 20v20 | 98% | 43.05% | 855.6 |

### 同种子6→3距离增量

- 无套装4v4/8v8/20v20单骑伤害分别提高17.7%/25.0%/17.5%，骑兵输出占比分别提高2.66/5.71/4.72个百分点。
- 全套装4v4/8v8/20v20单骑伤害分别提高20.0%/31.2%/26.5%，骑兵输出占比分别提高4.29/8.53/9.79个百分点。
- 配对胜率：无套装34→44%、96→98%、92→88%；全套装26→34%、74→88%、90→98%。50局下单档胜率仍有波动，8v8/20v20本身也受左右职业结构不对称影响。

## Current State

3距离版本已经把骑兵推成明显的路径AOE主C。全套装20v20中骑兵占队伍25%，贡献约43%伤害；强度提升主要来自更多震击命中，生存时间变化很小，不是靠变坦取得。

## Unresolved

- 演武阵容是“我方骑兵、敌方额外战士”的对照而非完全镜像，绝对胜率不能直接等价为通用平衡胜率；输出占比和同种子增量更可靠。
- 全套装8v8/20v20的38%/43%输出占比偏高，是否过强取决于用户希望骑兵是主C还是副C。
- 仍未添加奔跑自带减伤，骑兵深入敌阵后的生存问题没有被本次频率改动直接解决。

## Recommended Next Step

由用户先在网页观察3距离震击的视觉密度。如果节奏满意但输出过高，优先下调单次震击倍率，而不是把触发距离退回6；这样可以保留“奔跑一路碾过去”的手感。
