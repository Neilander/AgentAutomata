# Agent Handoff: 编队容量统一为单位

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: 灰谷村网页军备编队页的容量语义与校验
- Status: complete

## User Intent

编队规格按“单位”计算，而不是按单位内部的人数计算。一名英雄是一单位，一支由10人组成的民兵队或战士队也各是一单位。

## Completed

- 编队成员数据从 `headcount` 改为 `unitCount`。
- 英雄、10人民兵队、10人战士队全部固定占1个编队单位。
- 2/4/8/20可用规格与40/100/200锁定规格全部改成单位上限。
- 超编校验、当前容量、候选数量、成员卡片和锁定项文案统一显示单位数。
- 保留兵种角色行中的“10人单位”，它只说明单位内部规模，不参与编队容量计算。
- 删除容易误读为人数容量的“ 双人侦察组 / 百人军阵”命名。
- 静态契约新增检查，防止10人队伍再次按10个编队名额计算。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 修改编队数据、容量校验和显示文案。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 增加单位容量回归检查。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 记录编队单位规则。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 固化单位语义与信息层级。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 补充原歧义与修正后的用户路径。

## Validation

- `node --check projects\western_fantasy_continent\border_village_war_web\border-village-web.js`: PASS。
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS。
- `git diff --check`: PASS，仅有工作区既有的 CRLF 提示。
- 未启动服务器或浏览器。

## Current State

玩家把主角与一支10人民兵队拖进2单位编队时，显示2/2单位且合法；再加入任何英雄或军队单位才会成为3/2单位并整队标红。

## Unresolved

- 编队仍是网页侧保存的配置，尚未替换程序核心的实际战斗组队逻辑。
- 第一章当前成员都位于灰谷村，多城混编仍需第二章数据做真实交互验证。

## Recommended Next Step

继续设计编队页时始终区分“战略单位数”和“单位内部人数”；接入战斗核心时应直接消费单位ID列表，不要再从人数反推槽位。
