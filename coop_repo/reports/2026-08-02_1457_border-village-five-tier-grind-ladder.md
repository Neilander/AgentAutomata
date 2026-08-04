# Agent Handoff: 边林五档刷关进度阶梯

- Date: 2026-08-02
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 刷关成长、战斗校准与静态前端
- Status: complete

## User Intent

把原先随日期变化、开局偏难的边林刷装改成玩家可控的1—5档难度：刷关次数推进解锁，新档解锁时不保证能打过，玩家可继续刷旧档；当前档中后段装备应足以跨入下一档，高难度必须提供更好的掉落。

## Completed

- 新增独立于天数的五档讨伐：林缘、兽径、腐沼、血林、魔潮腹地。
- 每档胜利3次解锁下一档，进度条继续记录到10胜；失败不推进进度。
- 解锁不自动切换。玩家可随时手动选择任意已解锁档位，也可在失败后退回旧档。
- 五档分别配置敌群数量、职业构成和数值，不再用一个全局倍率粗暴抬升。
- 掉落随难度提高：装备等级和稀有度表上升，每轮件数由1/1/2/2/3递增。
- 地图边林节点增加五档选择器、红色锁定状态、具体解锁条件、当前档3胜解锁标线、10胜毕业进度和掉落摘要。
- 连续讨伐战斗页显示当前难度、本档胜利进度、解锁进度、当次掉落与铁匠收入。
- 老v3存档缺少新字段时会在读取/结算时安全归一化，不强制清档。
- 增加核心和静态契约测试：锁定档位不隐藏、核心拒绝绕过、失败不加进度、解锁不自动切换、可切回旧档、高档掉落更高。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 五档状态、选择行动、解锁/毕业进度、战斗配置、掉落与旧存档兼容。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 五档进度与结算边界回归。
- `projects/western_fantasy_continent/border_village_war/README.md`: 规则说明。
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: 地图难度面板和连续讨伐进度反馈。
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: 五档、锁定态、进度条样式。
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: 五档UI静态契约。
- `projects/western_fantasy_continent/border_village_war_web/README.md`: 试玩界面说明。

## Validation

- `node --check border-village-core.js`: PASS。
- 核心、输入边界、全日密封面、完整可胜路线、静态前端五类验证：全部PASS。
- `git diff --check`: PASS。
- 真实共享战斗模拟校准，斥候开局三英雄、每胜后整队配装；深层测试先把更早档刷到10胜以隔离当前跨档：
  - 难度1裸开：100/100胜。
  - 难度2：难度1为3胜时4/50胜；6胜时39/50；8胜时49/50。
  - 难度3：难度2为3胜时12/20胜；6胜时19/20；8胜时20/20。
  - 难度4：难度3为3胜时0/10胜；6胜时9/10；8胜时10/10。
  - 难度5：难度4为3胜时5/15胜；6胜时12/15；8胜时15/15。
- 未启动服务器或浏览器；本轮只做程序、真实战斗模拟和静态契约验证。

## Current State

刷关已经形成“低档稳定产出 → 提前解锁下一档 → 新档撞墙 → 继续刷旧档 → 中后段装备跨档”的可控节奏。所有战斗仍完整运行共享模拟，界面不提供胜率、推荐配装或隐藏解法。

## Unresolved

- 校准基线是开局斥候路线三英雄。之后招到第四名英雄会提高通关速度，实际试玩可能需要对后两档再做小幅增强。
- 10胜目前是可视毕业线，不提供额外一次性奖励；若玩家认为刷满缺少高潮，可以后续增加首个满档宝箱，但不应影响3胜解锁规则。
- 尚未做浏览器人工视觉检查，五档面板只通过静态布局与交互契约验证。

## Recommended Next Step

直接在工作台试玩边林节点，重点感受三件事：难度2初见是否够有压力、失败后退回难度1是否自然、进度刷到6—8胜时跨档是否有明显装备成长感。
