# Agent Handoff: 十五日地图优先交互重构

- Date: 2026-07-25
- Agent/thread: `/root`
- Scope: 将十五日网页版从地图/描述/选项三栏改为可拖拽大地图与点位就地事件浮窗
- Status: complete

## User Intent

玩家不应在左侧找事件、到中间读描述、再去右侧选行动，随后又返回左侧。整个主体应该是一张可拖动地图；点击地点后，描述和选项直接浮在该点附近。底部队伍、选中角色和背包结构可以保留。

## Completed

- 删除旧地图列表、中央场景和右侧行动栏三栏结构，地图成为唯一主操作表面。
- 接入 `shared/game_camera_2d/camera-core.js`；支持拖动平移、滚轮锚点缩放、加减按钮与“全图”复位。
- 每个当前地点改为独立地图点位，直接显示标题、区域、事项数量；战斗、旧事回响、锁态和普通行动使用不同信号。
- 点击点位会轻微聚焦镜头，并在点位附近打开局部浮窗；浮窗内包含地点状态、描述、当前选项、行动消耗和旧事回响。
- 同一区域多个地点采用确定性错列布局，避免随机散点互相遮挡或抢点击。
- 增加完整退出路径：点关闭、按 Esc、点地图空白均可收起浮窗；结束本日会自动关闭旧地点浮窗。
- 去掉资源栏中重复的行动数，只保留顶栏独立“行动力 X/3”。
- 保留底部队伍、候补、选中角色、技能、背包和记录；进入正式战斗时地图与底栏收起，结算后返回地图。
- 更新玩家路径审查与 README；浏览器截图改写入系统临时目录，避免污染仓库。

## Files Changed

- `projects/western_fantasy_continent/five_day_guard_raid/index.html`: 单地图主体、地图图层、事件浮窗、镜头控制与共享 camera 脚本。
- `projects/western_fantasy_continent/five_day_guard_raid/five-day-raid-web.js`: 地点布局、camera 投影、拖动/缩放/聚焦、浮窗渲染与恢复路径。
- `projects/western_fantasy_continent/five_day_guard_raid/styles.css`: 大地图、地点信号、锚定浮窗、镜头 HUD 与响应式样式。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-browser-web.js`: 地图主路径、浮窗锚定、拖动、缩放、空白关闭、刷装与战斗回归。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-smith-inner-browser.js`: 铁匠/内环回归适配地图点位交互。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-static-web.js`: 新地图结构与共享 camera 接线合同。
- `projects/western_fantasy_continent/five_day_guard_raid/README.md`: 新交互说明。
- `projects/western_fantasy_continent/five_day_guard_raid/USER_REVIEW.md`: 新用户任务路径与恢复性审查。

## Validation

- `verify-browser-web.js`: PASS（1440x1000）；首屏六个地图点、浮窗默认关闭、点位就地描述/选项、滚轮缩放、拖动、全图复位、空白关闭、免费十连、河畔正式战斗、战后返回地图与 20v10 三十单位均通过，页面无运行错误。
- `verify-smith-inner-browser.js`: PASS；铁匠交付、结果反馈、内环即时开放、免费刷取、刷新持久化和旧档迁移均通过且无未来泄漏。
- `verify-static-web.js`: PASS；旧三栏结构不存在，共享 camera 与点位浮窗接线存在。
- `verify-real-combat-integration.js`: PASS。
- `verify-fifteen-day-demo.js`、`verify-fifteen-day-input-boundary.js`: PASS。
- `tests/game_camera_2d.test.js`: PASS。
- `git diff --check`: PASS。
- 工作台服务：`/api/health` 与 `/five_day_guard_raid/` 均返回 HTTP 200。

## Current State

当前玩家路径为“扫地图点位 → 点击点位 → 原地阅读描述并选择 → 看结果 → 继续扫地图”。地图承担主要注意力，队伍和背包留在底栏；战斗仍走共享正式战场。玩家观察与隐藏信息边界没有改变。

## Unresolved

- 地图美术仍是代码绘制的可玩底图，不是最终手绘大地图资产；当前重点是验证交互动线。
- 20v10 开战后单位会按战斗逻辑向同一目标聚集，浏览器早期帧可能出现少量卡片矩形相交；初始阵线截图可读，未在本轮扩大到共享战斗表现重构。
- 仓库 `.git/index.lock` 仍无写权限；本轮及前序文件已保存但未提交。

## Recommended Next Step

让真人在当前工作台里连续切换同一区域的多个事件，确认地图点位密度和浮窗尺寸；下一轮只针对实际感到拥挤的区域调整地图坐标或缩短点位标题，不恢复三栏结构。
