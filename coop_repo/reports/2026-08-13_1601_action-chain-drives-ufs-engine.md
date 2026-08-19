# Agent Handoff: 动作—注意力链驱动程序版 UFS

- Date: 2026-08-13
- Agent/thread: Codex root
- Scope: 将隔离注意力链接入正式 UFS 引擎，并验证怪规则的粘连、拆卸和重组
- Status: complete

## User Intent

确认此前搭建的动作—注意力结构不只是静态案例，而能操作程序版 UFS；加入“移动一架飞机后随机移动另一架”等临时规则，验证规则能够粘接、拆开和重新组合。

## Completed

- 新增正式引擎适配器：工人骰放置始终调用`standard-engine.js`，结算后才把飞船状态同步给注意力运行器。
- 通用运行器新增初始记忆、自定义原子动作处理器、查询模板解析、确定性随机单选与实体排除条件；没有写入 UFS 专用分支。
- 新增可插拔规则“正式移动后随机移动另一架飞机”。
- 新增二级规则“额外移动落到爆炸格后，移动相邻列飞机”。
- 验证规则数组颠倒顺序仍得到相同结果：执行顺序由动作结果触发，而非配置文件先后位置。
- 验证拆掉随机移动规则后，爆炸连锁不会凭空发生；修改移动行数时同一规则结构可复用。
- 在已录入的 Roswell A+B / threat 0 地图上执行真实开局放置与扩展移动。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/action-attention-runtime.js`: 增加自定义动作、初始记忆、模板化查询和确定性随机筛选等通用接口。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/ufs-engine-chain-adapter-v0.js`: 正式 UFS 引擎与注意力链之间的隔离适配器及两条实验规则。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/test-ufs-engine-chain-adapter-v0.js`: 五项正式引擎、Roswell、粘接、重组和参数复用测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/README.md`: 补充程序版接入方式与边界。

## Validation

- `test-ufs-engine-chain-adapter-v0.js`: PASS，5 tests。
- 无扩展规则时，适配器结果与直接调用正式引擎逐字段完全相等。
- Roswell 已录入地图：正式放置与直接引擎一致，随后随机另一架飞机从 row 0 移到 row 1。
- 可控爆炸案例：正式放置 → 指定候选中的确定性随机飞机移动 → 落入爆炸格 → 相邻列移动；2 个扩展动作均执行。
- 颠倒两条扩展规则的声明顺序：最终状态完全一致。
- 仅保留下游爆炸规则：0 个扩展动作，证明中间动作是实际粘接接口。
- `test-action-attention-chain.js`: PASS，5 tests。
- `test-ufs-rule-ai-compile-v0.js`: PASS，10 tests。
- `test-standard-engine.js`: PASS，13 tests。
- `test-roswell-threat-0-map.js`: PASS，68 个合法开局放置。
- 三个修改文件`node --check`及目标目录`git diff --check`: PASS。
- independent_review: not_run（用户未要求子 agent，且本轮是隔离、小范围程序验证）。

## Current State

当前已得到一个真实的“一回合可玩切片”：程序版 UFS 提供权威世界结算，注意力链读取结算结果并执行可组合的局部规则。它证明了粘接结构可以驱动正式程序状态，而不是只能在自建玩具世界里演示。

## Unresolved

- 目前没有替玩家选择放置位置；还不是完整自动试玩玩家。
- 扩展规则的额外飞船移动由隔离适配器执行，不会自动套用正式引擎未公开的全部落点副作用；需要的副作用应继续作为显式粘接规则加入。
- 确定性随机用于可复现测试，尚未接入正式游戏 RNG 状态。
- 尚未加入玩家注意力预算、漏粘步骤或知识不足造成的错误链。

## Recommended Next Step

先用现有一回合接口实现最小玩家选择：给定当前目标与可见状态，只展开少量候选放置，各自通过动作—注意力链向前模拟一回合，再选择一个执行；不要立即扩展成整局规划。
