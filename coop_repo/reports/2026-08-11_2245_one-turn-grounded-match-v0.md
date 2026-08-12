# Agent Handoff: 一步 Grounded Match V0

- Date: 2026-08-11
- Agent/thread: root
- Scope: `under_falling_skies_planning_mind_toy_v0/standard_rules_v1/one_turn_match_v0`
- Status: complete

## User Intent

先实现短期规划的最小单元：给定一个目标和当前一组可选行为，穷举玩家当前骰子的所有合法落点，逐一用一次状态转移判断能否匹配目标；暂不做多个目标、递归子目标和长期规划。

## Completed

- 新增通用一步 Match：每个传入行为只模拟一次，完整保留枚举结果，不负责生成行为或替玩家选最终动作。
- Match 将结果分为直接完成、部分推进、无关、有害和无效；部分推进不会冒充目标完成。
- 新增 UFS 放骰适配器，从正式标准引擎读取当前全部合法“骰子—格子”组合并逐项验证。
- 白骰导致的后续重掷被显式标记为未知边界；目标只能判断本次放置已经结算的效果，不能读取未来随机点数。
- 使用真实 Roswell 地图验证：2点骰放普通房让敌机落到母舰下降格时判为有害；同一颗骰放 AA 后下降减1，判为完成“本次不让母舰下降”。

## Files Changed

- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/one_turn_match_v0/one-turn-match.js`: 通用一步穷举和目标落地验证。
- `.../one_turn_match_v0/ufs-placement-match.js`: 正式 UFS 合法放置适配和两个即时安全目标。
- `.../one_turn_match_v0/test-one-turn-match.js`: 6组隔离与真实地图测试。
- `.../one_turn_match_v0/README.md`: 模块边界、随机边界和后续扩展说明。

## Validation

- `node .../one_turn_match_v0/test-one-turn-match.js`: PASS，6组；覆盖完成/部分/无关/有害/无效、无直接解、重复行为保护及 Roswell 真实落子穷举。
- `node .../standard_rules_v1/test-standard-engine.js`: PASS，13组。
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS，原正式玩家循环2周期未受影响。
- `git diff --check`: PASS；仅报告既有工作树的换行提示，无新增空白错误。

## Current State

目前已经有可复用的短期规划原子：`一个数学目标 × 当前已实例化合法行为集合 → 一次机械演算后的完整匹配表`。这里的“一步”明确是当前一次工人骰放置决策，不是五颗骰子的整轮排列；合法行为集合较小，因此对玩家选择做真实穷举是合理的。

高维语义尚未进入这个机械验证核。它之后应负责从知识中提出目标、生成或召回少量可能行为；Grounded Match 负责把这些候选放回当前状态验证，不能用语义相似度代替规则结果。

## Unresolved

- 尚未从敌人状态与玩家知识中调取“摧毁、打断、移动、保护”等多个候选目标。
- 尚未把一次放置的部分匹配转成新子目标并递归调用 Match。
- 尚未穷举五骰完整回合；白骰随机分支、房间结算顺序和跨动作组合均不在 V0 范围。
- 当前目标由调用方提供数学检查函数；目标如何从高维概念和玩家知识落地，仍需单独验证。

## Recommended Next Step

先不要进入长期规划。为一个具体敌机危险状态，从玩家知识中只调取3至5个短期候选目标，逐个调用当前 Match，检查双向匹配是否能在不枚举动作组合的情况下找到真实可执行的一步解；通过后再让“部分匹配的剩余差距”生成单层子目标。
