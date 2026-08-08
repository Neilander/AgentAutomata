# Agent Handoff: Border Village Prebattle Food Supply

- Date: 2026-08-08
- Agent/thread: Codex `/root`
- Scope: 编队一战粮耗、两段式战前军粮准备、真实战力倍率与结算
- Status: complete

## User Intent

让粮食从不直观的后台成本变成一次可操作的战前决策：编队页先显示一战粮耗；玩家点开战后，界面左滑进入军粮准备，通过点击或长按大锅逐份投入，并同时看到`x/X`与发挥百分比。

## Completed

- 编队成员按英雄0粮、民兵1粮、战士3粮汇总一战粮耗；编队列表、当前编队详情与战前选队均常显该数字。
- 战前窗口拆为选队页和军粮页；按“开战”后整体左滑，返回选队时右滑恢复。
- 军粮页加入可交互大锅：按下立即投入1粮，长按320ms后每85ms连续投入；投满或库存耗尽自动停止，并提供清空恢复路径。
- 右下角显示实际投入/满额与发挥百分比；0粮为20%，投入比例线性提升，满额100%。无士兵的纯英雄队显示0/0与100%。
- 发挥倍率真实作用于全队生命、物理/魔法攻击与护甲；投入量进入确定性战斗种子、真实战斗与权威结算，不是前端装饰值。
- 粮食不足不再隐藏训练或突袭入口；玩家可低补给出发。胜利按实际投入扣粮，失败仍返还。
- 连续刷关保留选定编队与目标投入；库存下降后下一轮按实际可投入粮食重新生成战斗计划。
- 更新程序、静态契约测试及相关设计/试玩说明。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 军粮解析、20%—100%真实战力缩放、入口与结算规则。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 增加零粮/满粮真实数值与低粮入口测试。
- `projects/western_fantasy_continent/border_village_war_web/index.html`: 两页战前结构和军粮大锅控件。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 左滑动效、大锅、填充和计数视觉层级。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 编队粮耗、准备阶段、点击/长按、计划传参与恢复路径。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 两段式界面、长按和真实倍率契约。
- `projects/western_fantasy_continent/border_village_war/README.md`: 核心军粮规则。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 玩家操作和验证说明。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 军粮视觉动线与注意力预算。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 战前军粮审查路径。
- `projects/western_fantasy_continent/design/infinite_loot_town_direction_notes.md`: 第一章军粮注入当前实现。

## Validation

- `node --check .../border-village-core.js`: PASS.
- `node --check .../border-village-web.js`: PASS.
- `node .../verify-border-village.js`: PASS.
- `node .../verify-border-village-input-boundary.js`: PASS.
- `node .../verify-border-village-sealed-surface.js`: PASS.
- `node .../verify-border-village-winning-route.js`: PASS（74场真实战斗，最终15v16获胜）。
- `node .../verify-border-village-formal-playtest.js`: PASS（22轮决策、6场有时间线战斗、17条知识记录）。
- `node .../verify-static-web.js`: PASS，`serverStarted: false`。
- `git diff --check`: PASS（仅已有LF/CRLF提示）。

## Current State

现在玩家先做“谁出战”，再做“给多少粮”的单一决策。军粮不再是不可见门槛；低粮允许冒险，界面反馈与核心战斗数值、结算保持一致。页面仍是可直接双击打开的静态网页。

## Unresolved

- 遵守本轮约束，没有启动服务器或浏览器，因此没有做真实窗口下的视觉截图；静态结构、CSS契约和程序行为已验证。
- 当前倍率线性作用于生命、攻击和护甲，不缩放攻速、技能急速或技能机制；是否需要非线性曲线应由真人试玩判断。
- 训练的固定满额军需为6粮，并叠加所选编队中的士兵粮耗；界面会显示最终总额，但数值平衡尚未真人试玩。

## Recommended Next Step

直接双击 `projects/western_fantasy_continent/border_village_war_web/index.html`，重点试玩三种队伍：纯英雄0/0、带1支民兵的1粮梯度、带多支战士且库存不足。优先判断大锅长按速度、20%低补给是否过于极端，以及训练固定6粮加编队粮耗是否直观。
