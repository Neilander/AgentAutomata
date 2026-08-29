# Agent Handoff: 移速一级属性与骑兵基础草案

- Date: 2026-08-21
- Agent/thread: Codex `/root`
- Scope: 将共享战斗写死的移动速度升级为职业基础属性，并记录用户确认的骑兵基础定位
- Status: complete

## User Intent

用户确认骑兵攻击距离20、基础移动速度18；移动速度应成为正式属性，但培养来源必须保持稀少。骑兵四技能仍由用户设计，不能擅自补完。

## Completed

- 十个现有职业资产全部补充基础`moveSpeed`：普通职业保持原有7，刺客保持原有特殊值10。
- 共享战斗单位正式读取`spec.moveSpeed / role.moveSpeed`，移动公式不再按普通7、刺客10写死。
- 减速仍按普通单位原规则将移动速度乘0.6；刺客原有减速边界不在本轮改动。
- 构筑层会把职业基础移速带入最终战斗规格；灰谷村公开人物面板增加“移动速度”。
- 属性文档把移动速度列为一级基础小属性，同时明确它不进入七大属性换算和常规通用装备词条池。
- 新增骑兵草案，仅记录已确认内容：中生命、中物攻、0法强、中护甲、高魔抗、低攻速、低技能急速、移速18、射程20，以及“持续作战弱、拉开后冲锋强”的循环。
- 核对正式角色源后纠正口径：当前法师射程为38，不是此前误报的35。

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/roles/*.json`、`skill-assets.js`: 为现有职业增加基础移速并重建生成资产。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 使用单位移速属性计算移动距离。
- `projects/western_fantasy_continent/game_data/build-layers.js`: 将职业基础移速带入战斗规格。
- `projects/western_fantasy_continent/game_data/validate-skill-assets.js`、`verify-move-speed.js`: 校验角色移速字段和18移速/20射程草案的实际移动。
- `projects/western_fantasy_continent/game_data/skill-data.js`: 补齐狂战竞技场公开基础移速。
- `projects/western_fantasy_continent/border_village_war/border-village-core.js`、`border_village_war_web/border-village-web.js`: 公开人物数值加入移速。
- `projects/western_fantasy_continent/design/attribute_system_v2_candidate.md`: 将移速升级为培养来源受控的一级属性。
- `projects/western_fantasy_continent/design/cavalry_role_draft.md`: 记录骑兵已确认设计，不补写技能。

## Validation

- `node projects/western_fantasy_continent/game_data/verify-move-speed.js`: PASS；普通7、刺客10保持，移速18单位一秒实际前进18，普通减速后为10.8，射程20进入战斗单位。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-charge.js`: PASS；原奔袭铁骑套固定验证仍为2.82x，路径突破、障碍打断和移动减伤通过。
- `node projects/western_fantasy_continent/game_data/verify-magic-resistance.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-skill-assets.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `git diff --check`: PASS；仅有现存Windows行尾提示。

## Current State

移动速度现在是共享正式战斗中的职业基础属性。现有职业无站位速度回归；骑兵18/20可由战斗规格直接承载，但正式骑兵角色尚未建立，因为四技能和其余“中/低”档位的精确数值仍未由用户确认。

目前移速的成长入口仅保留已有专属/套装机制，没有加入常规大属性或普通装备池，符合“属性存在但不能大量培养”的约束。

## Unresolved

- 骑兵中生命、中物攻、中护甲、低攻速、低技能急速尚未映射为最终精确数值。
- 两个小技能、一个被动、一个大招尚未设计。
- “如何主动拉开”“移动多远充能”“冲锋倍率与受阻代价”必须由后续技能设计确定。
- 本轮没有创建不完整的骑兵职业资产，也没有把骑兵加入预设或随机职业池。

## Recommended Next Step

继续由用户设计骑兵四技能；四技能确认后再一次性创建正式职业资产、确定精确基础数值并进行队伍平衡测试。
