# Agent Handoff: 初始负伤盾骑削弱

- Date: 2026-08-01
- Agent/thread: Codex `/root`
- Scope: `border_village_war` v3 初始角色与最终战伤亡平衡
- Status: complete

## User Intent

削弱开场可救援的盾骑马库斯，并确认盾兵数据是临时随写还是继承项目统一战斗体系。

## Completed

- 确认马库斯原本并非独立手写技能：他与伊莎贝拉都继承共享 `skill-data` 的标准 `knight` 职业模板、护盾、嘲讽、堡垒被动与大招。
- 查明两个局部人工参数：马库斯角色基准53；救马库斯还会给伊莎贝拉隐藏增加16%的生命、攻击和护甲倍率。
- 单独移除伊莎贝拉隐藏加成的对照测试几乎没有改变路线伤亡，说明双标准骑士前排才是主要强度来源。
- 保留马库斯的共享骑士技能，但基于“伤势更重”的公开剧情给他负伤倍率：生命82%、攻击80%、护甲82%。裸装战斗数据由365生命/34攻击/12护甲降为299/27/10。
- 救马库斯不再顺带赋予伊莎贝拉隐藏全属性强化；拒绝女巫分支中公开叙述的伊莎贝拉盾甲强化仍然保留。
- 公开选择结果明确说明马库斯是负伤盾骑、当前战力低于伊莎贝拉。
- 三据点全清、普通稀有混装对照中，盾骑+7民兵平均死亡3.13→3.63，中位死亡3→4；盾骑+7战士平均死亡2.60→2.82，中位仍为3。削弱生存但保留盾骑路线特色。

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: 马库斯负伤倍率、公开角色定位、移除开场隐藏队长强化。
- `projects/western_fantasy_continent/border_village_war/analyze-final-battle-winrate.js`: 默认按削弱后的真实盾骑分支模拟；保留显式参数用于旧隐藏强化对照。
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: 锁定马库斯继续使用共享骑士技能、数值低于健康队长且无隐藏队长加成。

## Validation

- 核心与分析脚本 `node --check`: PASS。
- `node projects\western_fantasy_continent\border_village_war\analyze-final-battle-winrate.js 100 '普通稀有混装' cleared`: PASS；新盾骑伤亡结果如上。
- 核心、输入边界、全日密封面、完整可胜路线、静态前端五类验证：全部PASS。
- `git diff --check`: PASS。

## Current State

马库斯仍属于统一骑士职业，不存在另一套临时战斗逻辑；差异只来自公开可解释的负伤角色倍率。他仍能作为第二前排降低伤亡，但已不再接近健康队长的完整属性，也不再附带隐藏强化伊莎贝拉。

## Unresolved

- 盾骑路线平均伤亡仍低于斥候路线，这是职业功能差异的一部分；是否继续削弱应由玩家实战判断，而不是强行把两条路线死亡数做成一致。

## Recommended Next Step

直接试玩开场二选一和最终战，观察马库斯是否仍有明确但不过强的保护价值；若仍偏强，下一步应调整他共享骑士技能的个人效果倍率，而不是修改全局 `knight` 模板。
