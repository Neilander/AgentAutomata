# Agent Handoff: 民兵进入人物页并锁定装备

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: 灰谷村程序观察面与网页人物/装备界面
- Status: complete

## User Intent

人物换装备界面也要显示每支民兵，供玩家查看技能；民兵不能穿装备，因此装备槽与相关操作必须明确锁定。

## Completed

- 程序观察面新增 `party.characterTargets`，包含英雄、已训练战士和未训练民兵。
- 保留 `party.equipmentTargets` 只包含英雄与战士，防止民兵获得装备所有权或配装动作。
- 每支民兵从正式 `militiaSpec` 生成4个技能、数值详情和当前基础战斗数值。
- 民兵人物记录提供8个可见锁定装备槽与明确训练解锁原因。
- 人物翻页改用 `characterTargets`；地图左侧民兵头像现在也可直接打开对应人物页。
- 民兵页八槽显示锁标记，中央显示“民兵不能穿戴装备”，“一键当前”改为红色“装备锁定”，背包标明只能查看。
- 民兵页物品详情不会出现装备或卸下动作；“一键全队”仍只为英雄与战士分配。
- 补充程序与静态回归，防止民兵技能缺失或配装权限泄漏。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 增加民兵人物公开数据，并分离可查看人物与可配装目标。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 验证民兵技能、锁槽和无装备动作。
- `projects/western_fantasy_continent/border_village_war/README.md`: 记录程序观察面权限边界。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 人物翻页、地图头像入口和锁定装备表现。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 民兵锁槽、锁定按钮和背包提示样式。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加人物列表与装备权限静态契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 更新玩家可见行为。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化人物/装备数据分层。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 增加民兵人物页任务路径审查。

## Validation

- `node --check projects\western_fantasy_continent\border_village_war\border-village-core.js`: PASS。
- `node --check projects\western_fantasy_continent\border_village_war_web\border-village-web.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war\verify-border-village.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS。
- 定向观察检查：开局3支民兵全部含4技能、`equipmentLocked=true`，可配装列表无民兵，民兵装备动作数为0。
- `git diff --check`: PASS，仅有工作区既有的 CRLF 提示。
- 未启动服务器或浏览器。

## Current State

玩家可以点击地图民兵头像或通过人物页翻页查看每支民兵。技能与数值来自真实战斗模板；装备槽只是成长目标展示，不能交互配装。

## Unresolved

- 民兵目前没有个体化持久成长，人数变化后公开人物按当前未训练单位重新生成。
- 未做浏览器视觉截图；本轮只进行程序与静态验证。

## Recommended Next Step

后续训练某支民兵时，应明确处理“该民兵记录转化为战士记录”的身份延续；在此之前不要为民兵增加独立装备存档。
