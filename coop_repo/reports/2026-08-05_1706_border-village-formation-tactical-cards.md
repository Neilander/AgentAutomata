# Agent Handoff: 编队卡片改为战术信息

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: 灰谷村程序公开战斗力与网页编队成员卡
- Status: complete

## User Intent

编队界面的每个单位只显示战斗力、职业、城镇，不再显示姓名或“我/民/战”等代用字形。

## Completed

- 程序人物公开数据新增整数 `combatPower`。
- 战斗力由当前生命、物攻/法攻主值、护甲、攻速和技能急速计算，不复用装备评分。
- 英雄、战士和民兵均通过同一公开人物数据进入编队名单。
- 出战与候选成员卡删除字形和姓名，改为战斗力主数字、职业、城镇。
- 站位编辑中的已占用槽同步删除字形和姓名，并常显战斗力、职业、城镇。
- 拖拽所需单位ID继续保留在不可见数据属性中，不影响原有加入、移出、移动和交换逻辑。
- 静态回归明确禁止编队成员卡和站位槽重新渲染 `member.name` 或 `member.glyph`。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 增加公开战斗力计算。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 验证所有可查看单位都有正整数战斗力。
- `projects/western_fantasy_continent/border_village_war/README.md`: 记录战斗力来源与装备评分边界。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 统一编队名单来源并重写成员卡/站位槽内容。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 战斗力主数字、职业和城镇的视觉层级。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加字段完整性与姓名/字形禁用检查。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新玩家可见行为。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化战术卡片信息层级。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 增加编队比较路径审查。

## Validation

- `node --check` 检查程序核心和网页脚本：PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-input-boundary.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-sealed-surface.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS。
- 定向换装检查：主角卸下初始武器后战斗力从775降至732，证明显示值会随真实当前属性变化。
- `git diff --check`: PASS，仅有工作区既有的 CRLF 提示。
- 未启动服务器或浏览器。

## Current State

编队选择和站位两种状态使用同一套战术信息：战斗力为最强信号，职业次之，城镇持续可见；姓名和代用头像字形不再占据卡片空间。

## Unresolved

- 当前战斗力是便于横向比较的综合公开值，不等同于模拟胜率，也未单独衡量每个技能在具体阵容中的协同价值。
- 未做浏览器视觉截图；本轮只进行程序与静态验证。

## Recommended Next Step

后续若调整战斗公式，应同步审查 `combatPowerVisible` 的权重，使其保持方向正确；不要把战斗力解释为胜率或关卡推荐答案。
