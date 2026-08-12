# Agent Handoff: 职业、魔法学派与首个套装候选

- Date: 2026-08-11
- Agent/thread: root
- Scope: 战斗技能来源、职业/学派边界与套装适配框架
- Status: complete

## User Intent

记录已讨论的整体规则：物理技能与具体职业绑定，魔法技能来自可选学派，不要求所有角色拥有学派；整体设计文档需要引用该规则，并提供一套具体套装供后续讨论。

## Completed

- 新增独立设计文档，定义职业技能、魔法学派技能和角色专属技能三种来源。
- 规划盾兵、长枪兵、骑兵、重武器战士、剑士、狂战士、弓箭手、猎人、刺客等直观物理职业。
- 记录法师、祭司、术士决定施法方式，而炼狱、自然、寒霜、圣光、暗影、风暴、奥术决定具体法术内容。
- 记录当前 Matrix 的 10 个职业底盘、17 个标准阵容与 43 种技能组合应作为机制资产迁移，而不是重新制作简化战斗。
- 明确职业套装、学派套装、通用套装和特殊散件四类构筑来源。
- 设计首个自然学派六件套候选“繁生之环”：自然法术播种、重复影响目标使其成长、成熟后绽放并有限传播。
- 更新项目总览，使其引用新文档，并澄清“普通装备保持简单”不排斥命名套装改变战斗规则。

## Files Changed

- `projects/western_fantasy_continent/design/combat_profession_magic_school_framework_v1.md`: 新的职业、学派、技能来源、套装分类和首个六件套候选文档。
- `projects/western_fantasy_continent/PROJECT_OVERVIEW.md`: 从装备与战斗章节引用新框架，并修正套装规则与旧装备原则的关系。
- `coop_repo/reports/2026-08-11_1556_combat-profession-school-framework.md`: 本报告。
- `coop_repo/LATEST.md`: 更新协作入口。
- `coop_repo/REPORT_INDEX.md`: 增加本次记录索引。

## Validation

- `git diff --check`: passed before coordination-record update.
- 确认 `PROJECT_OVERVIEW.md` 中两处相对链接均指向已存在的设计文档。
- 本次只有 Markdown 设计文档变更，没有修改或运行战斗程序。

## Current State

职业与学派现在有清晰边界：每个角色必须有职业，学派可选；物理技读取职业，魔法技读取学派。套装可以面向职业或学派设计，不再需要为每个英雄单独制作。首个候选套装用于验证跨职业学派适配，所有名称和数值仍未冻结。

## Unresolved

- 最终职业与学派数量尚未冻结。
- 长枪兵、弓箭手和猎人是否都在首个版本独立存在尚未决定。
- 六件套的部位生成规则，以及独立三件套与六件套阶段奖励的关系尚未决定。
- “繁生之环”尚未进入程序验证，当前只是设计候选。

## Recommended Next Step

先由用户评审“繁生之环”是否足够具体、是否体现自然学派的共同语法。确认表达方向后，再分别设计一套职业套装与一套三件套，对比三类装备的职责是否清楚。

