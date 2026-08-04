# Agent Handoff: 刷关长进度与精确掉落表

- Date: 2026-08-02
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 五档刷关阈值、掉落概率和跨档战斗
- Status: complete

## User Intent

把过短的3胜解锁改为长进度：难度1—4分别刷5、10、30、50胜解锁下一档；五档使用用户指定的掉落件数和稀有度概率。

## Completed

- 解锁阈值改为5/10/30/50胜；难度5显示累计胜利但没有伪造下一档目标。
- 删除旧的“3胜解锁、10胜毕业”双标线，进度条现在直接对应当前档真实解锁目标。
- 解锁仍不自动切换；锁定档位保持可见并显示上一档当前胜数/目标胜数。
- 掉落件数：难度1、2必定1件；难度3为25%一件/75%两件；难度4为75%两件/25%三件；难度5必定3件。
- 稀有度：难度1为90/10普通稀有；难度2为75/25；难度3为70/25/5普通稀有史诗；难度4为50/30/19/1普通稀有史诗传说；难度5为30/45/20/5。
- 用户给出的难度4概率合计90%。为保证实际概率与UI都合计100%，暂把缺少的10个百分点补入史诗，将史诗9%解释为19%；没有静默归一化其他概率。
- 刷关节点和连续战斗页同时展示真实目标、掉落件数概率和稀有度概率。
- 旧v3存档会保留各档胜数，但解锁层级按新阈值重新计算，避免保留3胜产生的错误提前解锁。
- 根据新低档掉率重新调整难度3—5敌群，避免长时间刷装后新档直接白送。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 分档阈值、件数表、稀有度表、结算与旧存档重新计算。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 精确概率、概率和、解锁阈值与失败边界回归。
- `projects/western_fantasy_continent/border_village_war/README.md`: 新进度规则。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 真实目标与概率展示。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 概率展示契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 新界面说明。

## Validation

- 核心与前端 `node --check`: PASS。
- 核心、输入边界、全日密封面、完整可胜路线、静态前端五类验证：全部PASS。
- 每档件数概率和稀有度概率均由测试断言合计100%。
- 新掉落表下，斥候开局三英雄、每胜后整队配装的跨档采样：
  - 难度2：难度1为5胜时16/30胜；8胜时29/30。
  - 难度3：难度2为10胜时12/20胜；12胜时17/20。
  - 难度4：难度3为30胜时5/10胜；40胜时8/10。
  - 难度5：难度4为50胜时5/8胜。
- `git diff --check`: PASS。
- 未启动服务器或浏览器。

## Current State

刷关进度长度和掉落均按分档表执行；玩家看到的概率就是结算使用的概率。新的跨档采样仍保留“刚解锁不一定能过、继续刷旧档会改善”的选择。

## Unresolved

- 难度4的“史诗9%”与整表少10个百分点需要用户确认。目前按史诗19%实现。
- 深层跨档样本数较小，主要用于发现必胜/必败断层；后续应以真人试玩体感决定是否微调，不应改动用户给定掉率。
- 尚未做浏览器人工视觉检查。

## Recommended Next Step

真人试玩1→2和2→3的首个跨档；若长进度体感正确，再决定难度4缺失的10%究竟放入史诗还是其他稀有度。
