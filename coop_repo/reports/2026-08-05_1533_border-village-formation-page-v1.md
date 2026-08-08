# Agent Handoff: 编队页第一版

- Date: 2026-08-05
- Agent/thread: Codex `/root`
- Scope: `border_village_war_web`军备编队分页
- Status: complete

## User Intent

实现军备“编队”页：左侧长列表管理不同规模编队；右上显示出战成员，右下显示候选成员；通过上下拖拽调整。超员或混城允许存在但整队标红；候选区支持筛选当前城池。

## Completed

- “编队”从禁用的后续入口改为可用分页，与“人物”双向切换。
- 左侧列出2/4/8/20人可用编队，每行显示当前人数/上限、名称、所在城池与合法性。
- 40/100/200人编队持续可见并显示锁定，不伪装为可点击操作。
- 右侧分成上下相邻的出战成员与候选成员长条；英雄按1人、战士和民兵单位按10人计入容量。
- 成员卡支持HTML拖拽：向上加入、向下移出；点击卡片提供无拖拽设备和误操作的恢复路径。
- 超过编队人数上限时，左侧编队行、右侧整个编辑区、出战区与原因文字同步变红。
- 编队成员来自多个城池时使用同一不合法路径；第一章数据当前均在灰谷村，等待多城数据真实触发。
- 候选区右上增加“筛选·灰谷村”，激活后显示筛选数量；空结果提示关闭筛选查看其他城池。
- 编队方案独立保存在浏览器本地；重新开始游戏时同步重置。
- 使用信号式UI规划确定“选编队→看合法性→拖拽→筛选修复”的主路径，并用用户路径审查补齐整区错误态与筛选恢复提示。

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/index.html`: 启用编队分页。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 编队状态、容量/城池校验、拖拽、点击恢复、筛选与本地保存。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 左编队列表、右上下拖拽长条、锁定和整队错误态。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 编队规格、校验、拖拽、筛选和布局契约。
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: 编队页意图、层级、注意力与反馈规则。
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: 编队任务路径、恢复和反馈审查。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 当前编队操作说明。

## Validation

- 前端`node --check`: PASS。
- 静态前端验证：PASS。
- 静态契约确认2/4/8/20可用、40/100/200锁定、超员/混城校验、整区红色错误态、上下拖放、点击恢复和当前城池筛选全部存在。
- `git diff --check`: PASS，仅有既存LF/CRLF提示。
- 未启动服务器或浏览器。

## Current State

编队页已经可以选择和编辑多支队伍，错误状态不会阻止操作，玩家能通过向下拖回或点击成员恢复。编队方案在网页本地持久化。

## Unresolved

- 编队方案当前是网页侧配置状态，尚未替换程序核心现有的第一章战斗集结规则；本次没有伪称已接入真实战斗。
- 第一章所有成员都在灰谷村，混城错误只能由未来多城成员数据自然触发；当前已完成校验和视觉反馈代码。
- 按用户要求未启动浏览器，拖拽手感和横向滚动密度仍需真人试玩确认。

## Recommended Next Step

先真人试玩编队页的拖拽、超员标红和筛选；布局确认后，再把选中编队正式接入第二章跨城出战与运输规则。
