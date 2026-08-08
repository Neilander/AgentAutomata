# Agent Handoff: 编队人物牌恢复姓名并接入职业图标

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: 灰谷村编队人物牌与站位槽信息层级
- Status: complete

## User Intent

编队单位应是横向长方形人物牌：左侧职业图标，右侧姓名，姓名下方城镇；卡片底部另隔一栏显示可能增长到百万级的战斗力。姓名需要恢复，但不再使用“我/民/战”身份首字。

## Completed

- 查到并复用 `battle_view` 与旧刷装界面的正式职业图标表：骑士、战士、狂战、刺客、游侠、法师、牧师、术士、诗人、炼金师。
- 程序公开人物数据增加正式 `roleKey`；英雄、战士和民兵都从其真实战斗职业提供图标键。
- 出战/候选卡片扩大为162px横向人物牌。
- 人物牌上半区为职业图标、姓名、城镇；下半区用边线和独立底色显示战斗力。
- 战斗力使用 `zh-CN` 千位分隔完整显示，不缩写为“万/百万”，为百万级数字保留横向空间。
- 站位槽同步使用职业图标、姓名、城镇和独立战斗力底栏的紧凑结构。
- 保留拖拽、点击、加入、移出、移动与交换行为。
- 回归规则从上一版“禁止姓名”更新为“必须显示姓名与正式职业图标，同时禁止旧身份字形”。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 为公开人物增加正式职业键。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 验证所有人物都有职业键。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 复用职业图标、恢复姓名、格式化战斗力并重写卡片结构。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 横向人物牌、身份上区、战斗力底栏和紧凑站位牌。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 更新人物牌结构与百万级格式回归。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新可见卡片结构。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化图标/姓名/城镇/战斗力层级。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 修正上一版审查结论。

## Validation

- 程序核心与网页脚本 `node --check`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-input-boundary.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-sealed-surface.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS。
- `git diff --check`: PASS，仅有工作区既有的 CRLF 提示。
- 未启动服务器或浏览器。

## Current State

编队的单位识别顺序现在是职业图标→姓名→城镇，战斗力被稳定放在独立底栏；普通成员选择与站位编辑使用同一视觉语法。

## Unresolved

- 目前使用 Unicode/emoji 职业图标，与现有战斗界面一致；未来若切换为正式美术图标，应统一替换共享图标源。
- 未做浏览器截图；本轮只进行程序与静态验证。

## Recommended Next Step

真人试玩时重点检查162px卡片是否足够容纳最长姓名和七位以上战斗力；若拥挤，应优先加宽卡片或缩小姓名字号，不要压缩战斗力底栏。
