# Agent Handoff: Starter Rarity Showcase

- Date: 2026-08-10
- Agent/thread: Codex `/root`
- Scope: 新档初始发放五档稀有度装备用于视觉比较
- Status: complete

## User Intent

初始直接获得每个稀有度各一件装备，以便立即查看普通到神话的格子视觉差异。

## Completed

- 保留原有普通旧民兵剑并继续默认装备给主角。
- 新档额外获得稀有头盔、史诗胸甲、传说戒指、神话护符各一件。
- 四件展示装备通过正式装备生成规则创建，词条数分别为2、4、7、12，不是纯视觉假物品。
- 展示装备命名带“初始展示”前缀，来源标记为“初始稀有度展示”。
- 增加测试，确认新档恰好包含普通、稀有、史诗、传说、神话各一件，并使用正式词条数量。
- 文档明确已有浏览器存档需要点“重开”才能获得展示装备。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 新档生成四件高稀有度展示装备。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 验证五档初始装备和正式词条数。
- `projects/western_fantasy_continent/border_village_war/README.md`: 记录程序版初始展示装备。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 记录重开要求与展示部位。

## Validation

- `node projects/western_fantasy_continent/border_village_war/verify-border-village.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-input-boundary.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war/verify-border-village-sealed-surface.js`: PASS。
- `node projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: PASS；`serverStarted: false`。
- `git diff --check`: PASS；仅输出仓库既有LF/CRLF警告。
- 未启动服务器，未打开浏览器。

## Current State

新档背包固定包含五件装备：普通武器、稀有头盔、史诗胸甲、传说戒指和神话护符。已有同版本存档保持原样，不会被静默注入测试装备。

## Unresolved

- 这些装备会真实参与一键配装和战斗，因此试玩完视觉后需要决定正式Demo是否继续保留，或改为仅测试模式发放。

## Recommended Next Step

在网页右上角点“重开”，打开队伍与装备界面比较五档格子；确认神话效果后决定展示装备是否保留。
