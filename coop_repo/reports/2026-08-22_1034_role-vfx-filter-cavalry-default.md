# Agent Handoff: 共享战斗职业特效过滤

- Date: 2026-08-22
- Agent/thread: Codex `/root`
- Scope: 为共享战斗增加按职业开关特效，并令马骑兵演武默认只显示骑兵特效
- Status: complete

## User Intent

用户希望统一战斗可以按不同职业开关特效，当前马骑兵演武只观看骑兵产生的视觉特效。

## Completed

- 共享`BattleView`新增运行时职业特效过滤，可设置全部、空集合或任意职业组合。
- 过滤发生在战斗信号转为技能名、飘字、斩击、光束、光环等视觉节点之前；权威模拟、单位移动、血条、伤害和结算不受影响。
- 灰谷战斗标题区新增紧凑“特效”选择器，提供“全部”“关闭”和当前战场实际出现的各职业按钮，支持多选。
- 点击单个职业时从“全部”切换为仅该职业；再次点击可关闭，多职业可组合。
- 切换过滤时立即移除屏幕上已有的旧特效节点，避免残留干扰观察。
- 马骑兵4v4、8v8、20v20演武默认过滤为`cavalry`，即进入战斗时只显示马骑兵特效；其他战斗默认全部显示。

## Files Changed

- `projects/western_fantasy_continent/battle_view/battle-view.js`: 新增`effectRoleFilter`、信号可见性判断及`setEffectRoles/getEffectRoles`公共接口。
- `projects/western_fantasy_continent/border_village_war_web/index.html`: 战斗标题区新增职业特效过滤容器。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 新增紧凑下拉选择器、职业按钮和选中状态。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 构建当前战场职业选项、处理选择状态，并为马骑兵演武设置默认过滤。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加共享过滤接口、HUD接线、默认骑兵过滤和样式断言。

## Validation

- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS。
- `node projects/western_fantasy_continent/game_data/verify-cavalry-role.js`: PASS。
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: PASS。
- 4v4、8v8、20v20演武各重复运行两次并比较权威战斗指纹：三档结果完全一致，证明UI过滤未进入战斗模拟。
- `node --check`检查共享战斗视图和灰谷网页脚本：PASS。
- `git diff --check`: PASS，仅有现存Windows行尾提示。
- 按用户要求未进行浏览器打开、点击或视觉验证。

## Current State

马骑兵演武进入时，战斗标题右侧显示“特效 马骑兵”。用户可以在战斗进行中改为全部、关闭或任意职业组合。该能力位于共享战斗视图，其他页面也可通过挂载参数`effectRoles`或运行时`setEffectRoles`复用。

## Unresolved

- 页面实际布局和点击体验尚待用户自行验证。
- 当前过滤以视觉信号的施法者/来源职业归属；没有来源的信号退回目标职业。它不会隐藏单位本体移动和血条变化，因为这些是战况而非特效。

## Recommended Next Step

用户在灰谷演武台打开任一马骑兵规模战斗，确认默认只显示骑兵特效，并按需测试“全部”“关闭”和多职业组合。
