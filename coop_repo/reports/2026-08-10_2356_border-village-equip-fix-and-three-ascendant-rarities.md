# Agent Handoff: Prologue Equip Fix And Three Ascendant Rarities

- Date: 2026-08-10
- Agent/thread: Codex `/root`
- Scope: 修复开场无法穿戴展示装备，并增加永恒、黑金、炼狱三档正式装备与整格特效
- Status: complete

## User Intent

初始展示装备必须真的能穿；在神话之上增加永恒（蓝白）、黑金和炼狱三种明显不同的高阶装备效果。

## Completed

- 定位到真实原因：开场 `prologue` 动作目录只返回剧情和锁定刷怪，漏掉了已有的正式装备动作，导致前端能看到物品却找不到穿戴按钮。
- 开场第1天和幸存者选择阶段都接入穿戴、卸下、切换配装对象与一键配装；这些操作不消耗行动力，也不跳过剧情。
- 在边陲村规则内正式扩展永恒、黑金、炼狱三档稀有度，词条数为15、18、22，评分倍率为5.5、7.0、9.0。
- 新档额外发放永恒手甲、黑金腿甲、炼狱战靴，八档展示装备刚好覆盖八个部位；它们可穿戴并会真实进入战斗属性。
- 永恒采用蓝白冰光与白色扫光，黑金采用低亮黑曜底、金脉与缓慢金光，炼狱采用焦黑暗红底、底部火焰和高频呼吸。
- 三种材质同时覆盖战后掉落格、人物背包格和已装备槽；选择态、文本层级与减少动态模式均有专门处理。
- 前端稀有度排序扩展为 `炼狱 > 黑金 > 永恒 > 神话 > 传说 > 史诗 > 稀有 > 普通`。
- 当前五档边林讨伐掉率保持原样；三档新稀有度尚未自然掉落，避免未经确认改变既定刷关平衡。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 新稀有度、初始展示装备、开场配装动作和对应价格规则。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 验证八档初始装备、正式词条数和第1天实际穿戴链路。
- `projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: 允许开场正式配装动作，同时继续禁止经营、事件和战斗结算动作越界。
- `projects/western_fantasy_continent/border_village_war/README.md`: 记录八档展示、开场可穿和自然掉落边界。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 更新高阶稀有度排序。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 新增永恒、黑金、炼狱三套整格动态材质。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 锁定三种材质在掉落、背包、装备槽中的存在与色彩身份。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 记录三套效果和重开要求。

## Validation

- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS；包含开场穿上永恒手甲的真实动作验证。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: PASS；开场只允许剧情、可见锁定刷怪和正式配装动作。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `node --check projects/western_fantasy_continent/border_village_war/border-village-core.js`: PASS。
- `node --check projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: PASS。
- 未启动服务器，未打开浏览器。

## Current State

新档第1天即可打开人物装备页，为主角手动穿上所有展示装备。已有浏览器存档会得到开场配装动作修复，但不会被静默补发新装备；查看八档完整展示仍需点击右上角“重开”。

## Unresolved

- 永恒、黑金、炼狱的自然来源、掉率和最终数值地位尚未设计；当前只作为真实可穿戴的视觉/规则预留。
- 本轮遵照要求未打开网页做人工视觉验收，三套动态材质只通过静态结构验证，最终观感需要用户试玩确认。

## Recommended Next Step

重开新档后进入“队伍与装备 → 人物”，逐件穿上永恒、黑金和炼狱装备比较材质；确认美术方向后再决定它们属于掉落稀有度、套装品质还是特殊来源装备。
