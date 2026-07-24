# Agent Handoff: 十五日可玩网页版

- Date: 2026-07-24
- Agent/thread: `/root`
- Scope: 将既有五日静态网页升级为十五日三幕 Demo，并做真实浏览器与大规模战场验证
- Status: complete

## User Intent

把已完成的十五日程序 Demo 接回之前的网页版供真人直接试玩；保留真实战斗、玩家信息封口和逐步扩编，并避免地图、战场或面板重叠。

## Completed

- 网页改接 `fifteen-day-core.js`，核心同时兼容 Node 与浏览器，不复制第二套游戏规则。
- 顶部升级为 15 日时间轴，明确第 5/10/15 日三次来袭；资源栏增加影响力。
- 地图区域徽标和地点行分别显示当前可做事项数；首日仍仅有两个事件，未把后续内容一次铺开。
- 队伍面板从固定 4 人升级为动态 4/10 人、5×2 稳定槽位；显示前后排、候补、已穿装备、技能和满员原因。
- 保留免费刷装、背包身份词条与显式择优穿戴；所有行为继续只经封口后的 public action ID 执行。
- 真实战斗时收起地图、行动栏和底部管理栏；没有跳过按钮；结束后显示存活、伤害、治疗、护盾和主要输出，再由玩家确认写回世界。
- 修复常驻“结束本日”按钮重复绑定、可能单击跳多日的问题。
- 修复共享战斗运行时大于 4 人时按旧 4 人槽循环而导致 20v10 重叠的问题；5 人以上现在使用每侧最多 4 列×5 行的动态编队。
- 增加静态接线测试、浏览器点击测试、20v10 单位重叠几何检查，以及玩家路径审查文档。

## Files Changed

- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-core.js`: 增加 UMD 浏览器出口，Node 接口保持不变。
- `projects/western_fantasy_continent/five_day_guard_raid/index.html`: 十五日页面结构、资源栏和新核心引用。
- `projects/western_fantasy_continent/five_day_guard_raid/five-day-raid-web.js`: 十五日 UI 适配、真实战斗呈现、动态队伍与背包交互。
- `projects/western_fantasy_continent/five_day_guard_raid/styles.css`: 十五日时间轴、10 人管理面板、战斗结果和响应式布局。
- `projects/western_fantasy_continent/five_day_guard_raid/UI_PLAN.md`: 十五日信息层级与泄漏边界。
- `projects/western_fantasy_continent/five_day_guard_raid/USER_REVIEW.md`: 玩家目标路径、发现和最小修正。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-static-web.js`: 十五日静态契约与首屏封口验证。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-real-combat-integration.js`: 第五日 4v6 真实战斗写回验证。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-browser-web.js`: 无服务器浏览器点击、河畔战斗和 20v10 视觉验证。
- `projects/western_fantasy_continent/game_data/combat-sim.js`: 5 人以上动态战场出生编队。
- `projects/western_fantasy_continent/battle_view/battle-view.js`: 与运行时一致的大规模单位显示编队。

## Validation

- `node verify-static-web.js`: PASS；15 日、首屏 2 事件、6 个已知地点、事项数与封口均通过。
- `node verify-real-combat-integration.js`: PASS；第五日 4v6 通过共享战斗模拟并推进到第 6 日。
- `node verify-fifteen-day-demo.js`: PASS；免费刷装、第一幕、失败继续、10v10 与 20v10 回归通过。
- `node verify-fifteen-day-input-boundary.js`: PASS；正式玩家输入边界通过。
- `node verify-browser-web.js`: PASS；1440×1000 下十连背包 11 件、逐日推进无跳日、河畔真实战斗可见且结算返回地图、20v10 完整渲染 30 单位、同侧单位卡片重叠数为 0、page error 为 0。
- 人工查看 `fifteen-day-web-preview.png`、`fifteen-day-river-combat.png`、`fifteen-day-20v10-combat.png`：首屏、河畔战斗与 20v10 布局均可读。

## Current State

直接打开 `projects/western_fantasy_continent/five_day_guard_raid/index.html` 即可离线试玩十五日版本。网页和程序版共用同一权威状态机；地图只呈现当前已知地点和可执行行动，不展示未来事件、隐藏阈值或完整锁钥答案。

## Unresolved

- 自动浏览器回归以 1440×1000 桌面视口为主；CSS 已提供 1180 与 760 像素断点，但本轮没有逐台手机设备做触控体验验证。
- `five_day_guard_raid` 目录名和脚本名为兼容旧入口暂时保留，页面内容已经是十五日版。
- 大规模战场会把过长单位名截断以保证不重叠；完整名字目前需从战斗之外的队伍信息确认。

## Recommended Next Step

先由真人从第 1 日完整玩到第 5 日，重点记录“每天愿不愿意结束”“地图事项数是否足以驱动探索”和第一次扩编后的队伍管理负担；不要先根据设计文档解释隐藏路线。
