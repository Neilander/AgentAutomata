# Agent Handoff: 刷怪地点永久显示修复

- Date: 2026-08-01
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 核心与地图前端
- Status: complete

## User Intent

修复新版网页中“刷怪位置搞没了”的问题，并继续遵守已知但暂时不可用的操作不能直接隐藏、应显示禁用原因的规则。

## Completed

- 查明根因：地图刷怪节点的存在错误地依赖当前动作列表中是否有可执行 `grind`；第一、二日剧情期、最终战和结局状态因此会把整个地点移除。
- 开场剧情期现在仍公开“边林讨伐”地点与刷怪动作，但按钮标红并说明需先完成开场、组织第一支队伍。
- 进入经营期后，同一地图节点原地转为可用，不需要玩家重新寻找位置。
- 最终战到来后，刷怪地点继续显示并标红说明当前只能组织决战。
- 结局状态前端仍保留刷怪节点，并说明重开后可以再次刷装。
- 核心继续拒绝对禁用刷怪动作生成或结算战斗计划。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 在开场与最终战公开禁用的已知刷怪动作。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 刷怪地图节点永久生成及结局状态兜底。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 验证开场节点可见、禁用原因与经营期解锁。
- `projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: 更新开场公开面合同并确认没有未来内容泄露。
- `projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: 验证最终战只额外保留禁用的已知刷怪地点。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 验证地图存在永久刷怪节点兜底。

## Validation

- `node projects\western_fantasy_continent\border_village_war\verify-border-village.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-input-boundary.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-sealed-surface.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-winning-route.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS；未启动服务器。
- 尝试用内置浏览器直接打开本地 `file:` 页面被浏览器安全策略拒绝；没有绕过策略或切换到其他自动化表面。

## Current State

刷怪系统没有被移除。边林讨伐现在从开场到结局始终保留在地图右侧；不能刷时显示红色原因，经营阶段正常点击后进入完整战斗。

## Unresolved

- 本轮没有新的实际截图验证；本地 `file:` 页面被浏览器安全策略阻止，验证来自核心、输入边界、完整路线与静态前端合同。

## Recommended Next Step

用户刷新页面或点击右上角重开，从第一日确认地图右侧能看见标红的边林讨伐；完成两段开场剧情后，该节点应原地变为可用。
