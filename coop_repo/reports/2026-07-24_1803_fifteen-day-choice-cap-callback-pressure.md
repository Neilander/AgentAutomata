# Agent Handoff: 十五日选择密度、背包上限、回响与敌压

- Date: 2026-07-24
- Agent/thread: `/root`
- Scope: 处理行动力、每日选择、背包卡顿、前因回响、敌人压迫感和事件持续时间六项试玩反馈
- Status: complete

## User Intent

行动力必须在主界面外层清楚显示；每天三点行动要产生真实取舍；背包最多保留 200 件并分解最差装备；过去选择打开的新机会要特殊显示；敌人尤其单体首领不能被少量好装备秒杀；并非所有事件都只能当天处理。

## Completed

- 在顶栏操作区增加独立“行动力 X/3”显示，不再只把行动点混在六项资源中。
- 将燃烧驮车提前到首日并持续到第五日：首日现在有三件事件加王炉门，共四个消耗行动力的节点争夺三点行动。
- 将第二、三幕多批事件延长到各幕决战日；紧急事件仍可保留较短期限，普通事件可以延期处理。
- 增加 200 件背包硬上限。溢出时绝不分解已装备物，优先保留身份词条，再按稀有度和战力从低到高自动分解；旧存档也会迁移清理。
- 玩家观察增加 `inventoryLimit` 与累计分解数；背包标签显示当前数量/200，十连日志明确本轮自动分解数量。
- 为由此前承诺、同伴、身份装备、证据、失败或世界状态打开的行动增加 `callback`，界面用金色“旧事回响”与原因单独显示。
- 修复敌人等级成长被场景修正覆盖的计算错误；现在等级成长与场景修正相乘。
- 大幅提高守门甲胄、激流穴兽、擂台冠军、食铁兽等单体首领的整队耐久和攻击；守门甲胄增加范围横扫与石肤。

## Files Changed

- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-core.js`: 事件期限、回响字段、200 件上限、旧档迁移、敌人等级修正与单体首领数值。
- `projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-demo.js`: 增加首日节点取舍、持续事件、回响、失败后回响、背包上限与单体首领整队耐久回归。
- `projects/western_fantasy_continent/fifteen_day_demo/README.md`: 更新网页核心、事件持续、回响与背包规则。
- `projects/western_fantasy_continent/five_day_guard_raid/index.html`: 增加独立行动力显示。
- `projects/western_fantasy_continent/five_day_guard_raid/five-day-raid-web.js`: 显示行动力、背包容量与回响行动。
- `projects/western_fantasy_continent/five_day_guard_raid/styles.css`: 增加行动力徽记和回响行动层级。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-static-web.js`: 更新首日三事件、行动力、背包容量与回响合同。

## Validation

- `verify-fifteen-day-demo.js`: PASS；覆盖 240 次掉落后背包仍为 200、已装备初始武器保留、自动分解可见。
- `verify-fifteen-day-input-boundary.js`: PASS；新增回响没有恢复内部状态或未来事件泄漏。
- `verify-static-web.js`: PASS；首屏 7 个地点、3 个事件，独立行动力与回响/容量接线存在。
- `verify-real-combat-integration.js`: PASS；4v6 正式战斗继续通过共享战斗运行时。
- 旧五日程序、正式玩家输入边界：PASS。
- 单体首领矩阵：普通十人队对激流穴兽/冠军/食铁兽正面路线失败；失败后卸甲重赛与陷阱路线可胜；稀有整队能过穴兽和冠军但仍可能输给食铁兽；史诗整队可正面胜但有明显伤亡。
- `git diff --check`: PASS。

## Current State

三点行动不变，但首日和后续幕均有超出行动容量的当前节点；玩家可以延期普通事件。回响只在对应条件已经成立后出现，并说明来自哪段已发生经历。装备库存不会超过 200。敌人等级成长已恢复，单体首领按整队目标配耐久，失败解锁的削弱路线有明确价值。

## Unresolved

- 本轮没有启动浏览器；工作台依赖仍缺少 `playwright-core`，未为此安装依赖或请求权限。
- 守门甲胄对四人普通装备队能打到约 74 秒，但当前治疗组合可能保持全员存活；真人观感是否足够压迫仍需试玩。
- 自动分解将身份词条视为额外价值，因此可能保留低战力有词条装备而分解略强的无词条装备；这是为保护任务/身份路线作出的规则选择。
- 仓库 `.git/index.lock` 无写权限，本轮与前两轮文件已保存但未提交。

## Recommended Next Step

真人刷新后从首日试玩：确认四节点争三行动的取舍、行动力徽记、200 件背包、旧事回响和守门甲胄/矿区单体首领的压迫感；优先根据实际战斗时长和减员情况微调首领攻击，而不是再次提高纯生命。
