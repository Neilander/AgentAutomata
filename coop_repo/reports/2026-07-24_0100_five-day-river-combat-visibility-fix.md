# Agent Handoff: 河畔战斗被场景层遮盖修复

- Date: 2026-07-24
- Agent/thread: Codex ca39
- Scope: `projects/western_fantasy_continent/five_day_guard_raid`
- Status: complete

## User Intent

修复真实试玩中河畔战斗场景看似没有触发的问题，同时继续保持战斗不跳过、玩家信息不泄露、界面不重叠。

## Completed

- 用浏览器分别复现军需车守卫、断角兽初战、断角兽设陷阱重战、营地夜巡四个河畔战斗入口；它们都已生成真实战斗单位。
- 通过实际截图确认根因：战斗已经在后台运行，但 `.scene-view` 的作者样式覆盖了原生 `hidden` 显示规则，旧场景层继续盖住战场。
- 增加全局 `[hidden] { display: none !important; }`，确保场景、战斗和战斗结果三种互斥界面不会同时显示。
- 进入战斗时立刻展示“战场展开中”；战斗视图创建失败时不再静默，而是返回原场景并显示具体启动错误。
- 用 JSON 安全复制替代对 `structuredClone` 的硬依赖，降低本地浏览器兼容风险。
- 战斗按钮现在明确显示“进入战斗 · 1行动”。
- 进入战斗时清除上一条场景提示，避免“第N日开始”等 toast 压在战场中央。

## Files Changed

- `projects/western_fantasy_continent/five_day_guard_raid/five-day-raid-web.js`: 战斗启动反馈、异常恢复、兼容复制、战斗按钮标识和旧 toast 清理。
- `projects/western_fantasy_continent/five_day_guard_raid/styles.css`: 修正 `hidden` 层级并增加战场加载态。
- `projects/western_fantasy_continent/five_day_guard_raid/verify-static-web.js`: 防止场景层再次覆盖战斗层的静态回归断言。

## Validation

- `node --check five-day-raid-web.js`: PASS。
- `node verify-static-web.js`: PASS。
- `node verify-real-combat-integration.js`: PASS。
- Playwright 静态文件实测四个河畔战斗入口：各自显示2至5个真实单位，均无页面异常，战斗时底栏隐藏。
- 1440×1000 河畔军需车战斗截图复核：`sceneVisible=false`、`combatVisible=true`，地图、行动栏、底栏和旧 toast 均未覆盖战场；临时截图已删除。

## Current State

刷新页面后，现有本地存档会保留。点击带“进入战斗”标记的河畔行动会先显示加载态，然后进入完整战斗场景。

## Unresolved

- 用户实际遇到的是哪个河畔行动尚未明确；四个正式战斗行动现已全部浏览器验证。`让小偷从排水沟潜入`和`只侦察路线，不接战`本来就是非战斗解法，不应启动战场。

## Recommended Next Step

请用户刷新后沿原存档继续；若同一入口仍不显示，记录按钮的完整文字即可精确追踪，不需要重开存档。
