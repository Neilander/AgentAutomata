# Agent Handoff: 编队站位编辑器

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: 灰谷村网页军备编队的阵地站位编辑
- Status: complete

## User Intent

在出战成员区域增加“调整站位”，进入后把右侧变成带槽位的阵地。2单位一前一后，20单位形成方阵；出战单位按顺序初始放置，并可拖动头像移动或交换位置。

## Completed

- 出战成员标题右侧新增“调整站位”按钮。
- 站位态保留左侧编队列表，右侧独占显示阵地、敌军方向、前后排标尺和“完成站位”。
- 阵地规格为2单位1×2、4单位2×2、8单位4×2、20单位5×4。
- 老存档与新加入单位都会按现有出战顺序填入第一个空槽。
- 拖到空槽会移动，拖到占用槽会交换；操作后立即保存槽位并显示近场结果提示。
- 提供“先点头像、再点目标槽”的非拖拽替代路径；再次点击已选头像可取消。
- 超出单位上限时按钮不隐藏，而是显示红色禁用态与明确原因。
- 切换编队或离开编队页会退出站位态，防止模式状态残留。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 新增站位数据迁移、阵型规格、移动/交换逻辑、渲染与交互绑定。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 新增阵地、槽位、方向、选中、拖拽和禁用反馈。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加站位入口、规格、持久化、交换与恢复路径契约检查。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 记录站位功能。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 记录站位态层级与阵型规则。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 增加玩家任务路径审查。

## Validation

- `node --check projects\western_fantasy_continent\border_village_war_web\border-village-web.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS。
- `git diff --check`: PASS，仅有工作区既有的 CRLF 提示。
- 未启动服务器或浏览器。

## Current State

站位按每支战略单位占一个槽位保存到网页编队存档；英雄、10人民兵队、10人战士队均只占一个位置。玩家可以随时完成站位返回成员选择。

## Unresolved

- 编队与站位仍是网页侧配置，尚未替换程序核心的战斗编队和出生坐标。
- 未做浏览器视觉截图；本轮遵守既有约束，只进行程序与静态验证。

## Recommended Next Step

下一步若接入真实战斗，应让战斗准备直接读取当前编队的 `positions`，按槽位行列映射出生坐标，并继续保留空槽而不是压缩阵型。
