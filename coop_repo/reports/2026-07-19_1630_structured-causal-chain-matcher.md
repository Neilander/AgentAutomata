# Agent Handoff：结构化因果链匹配器与多案例测试

- Date: 2026-07-19
- Agent/thread: root
- Scope: 开发不依赖战后Agent自评的结构化因果链匹配器，并用多组真实风格案例验证
- Status: partial

## User Intent

用户希望实际开发并测试“程序如何逐条匹配Agent写出的完整因果链”，要求增加较多实际案例，以判断这条路线是否可行。

## Completed

- 新增隔离`causal_chain_event_matcher_v1`。
- Agent假设步骤必须使用白名单结构：
  - `predicate`
  - `subject`
  - `object`
  - `qualifiersAll`
  - `environment`
  - 可选`exclusiveSubject`
- 自然语言`statement`只用于展示，不参与计算。
- 当前白名单覆盖：
  - 增伤、伤害、击败目标；
  - 控制、护盾、存活检查；
  - 技能/大招；
  - 破阵/阵型未破；
  - 战斗胜负；
  - 队伍聚合击杀。
- 程序只接收：
  - 公开语义事件ID；
  - 稳定角色引用；
  - 玩家已知概念；
  - 玩家可见局部实体引用；
  - 冻结`informationTier`；
  - 时间与环境。
- 程序拒绝：
  - `left-4/right-2`等原始位置ID；
  - 内部名字、role、diagnosis；
  - 自定义support/strength；
  - 非白名单谓词或字段；
  - 仅凭观察数据声称`primary_cause`。
- 匹配过程：
  1. 对每个假设步骤做字段精确匹配；
  2. 多次重复事件中寻找时间有序、最弱档位最高的完整路径；
  3. 没有正匹配时检查明确反义谓词；
  4. 对独占结果检查主体是否被其他角色替代；
  5. 把步骤`observed/contradicted/unknown`交给EVerify因果链V2。
- 支持玩家可见局部实体引用，例如`visible_entity:protected_anchor`。它用于区分两个同为“高血量敌人”的具体目标，但不会暴露引擎ID。
- 匹配器明确只证明`contributing_path`发生，不证明这条路径是唯一或首要原因。

## Files Changed

- `projects/western_fantasy_continent/game_data/causal-chain-event-matcher.js`：结构化合同、事件校验、有序路径匹配、反义/主体反证。
- `projects/western_fantasy_continent/game_data/test-causal-chain-event-matcher.js`：15个多类型案例和真实fixture审计。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：记录隔离匹配器及正式接线缺口。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：记录测试入口。
- `projects/western_fantasy_continent/design/task-budget-board.json`：更新证据、链接和下一步。

## Validation

`test-causal-chain-event-matcher.js`：PASS，共15个案例：

| 案例 | 结果 | 关键判断 |
|---|---|---|
| 游侠完整增伤→击杀护阵目标→破阵→胜利 | confirmed | support `+1`，strength `0.7` |
| 高血量护阵目标被法师击杀 | refuted | 独占主体不符，support `-1` |
| 法师击杀另一个同类高血量敌人 | inconclusive | 公开局部实体不同，不误反证游侠 |
| 没收到破阵信号但最终胜利 | partially_confirmed | 整链support `0`，前缀知识保留 |
| 低感知玩家漏掉游侠增伤 | inconclusive | 不从后续胜利倒推前置步骤 |
| 破阵发生在护阵目标死亡之前 | refuted | 时间顺序与假设相反 |
| 同样事件发生在另一关 | inconclusive | 环境不匹配 |
| 牧师护盾→坦克存活→法师开大→胜利 | confirmed | strength `0.6` |
| 坦克在大招前死亡且最终失败 | refuted | 同时识别存活和胜利的反义事件 |
| 游侠减速→法师开大→后排被击败→胜利 | confirmed | 完整控制链成立 |
| 大招噪声重复 | confirmed | 选择减速之后的正确大招，不选过早噪声 |
| 游侠完整链同时出现法师大招 | confirmed path | 只证明游侠路径发生，不证明唯一主因 |
| 真实fixture的当前聚合信号 | inconclusive | 只能看到“我方击倒4人”，不能确认游侠击杀谁 |
| Agent声称primary_cause | invalid_input | 观察匹配器拒绝首要因果声明 |
| 输入left-4原始位置ID | rejected event | 不让原始身份进入认知匹配 |

状态分布：

- confirmed：5
- refuted：3
- partially_confirmed：1
- inconclusive：5
- invalid_input：1

真实数据审计使用：

- `battle_information_real_event_fixture_v1`
- 普通感知玩家确实接收`enemy_defeated`
- 当前句子为：`我方在本场击倒了4个敌方单位。`
- 该信号没有林地游侠、击杀归属、目标概念或公开局部目标引用
- 因此程序正确拒绝确认细粒度游侠因果链

回归：

- `test-everify-isolated-v1.js`：PASS。
- `test-information-presentation-tiers.js`：PASS。
- `test-battle-information-parser.js`：PASS。
- `test-player-feedback-model.js`：PASS。
- `test-player-cognition-v3-player-hypothesis.js`：PASS。
- `test-target-condition-contract.js`：PASS。
- `verify-causal-loop.js`：PASS。
- `git diff --check`与任务板JSON解析：PASS。
- `independent_review`：not_run；本轮是确定性程序匹配和现有fixture审计，没有运行完整玩家轨迹。

## Current State

结论分成两部分：

1. **匹配算法可行。**  
   不需要让战后Agent直接判断support。Agent只写白名单结构化链，程序可以处理精确匹配、顺序、漏信号、明确反义、错误击杀者、错误目标和错误环境。

2. **当前正式信息层供数不够。**  
   现有聚合玩家语言为了过滤垃圾信息，把细因果匹配需要的“公开主体—谓词—公开目标”压掉了。不能偷偷从聚合句子背后的原始event证据读取，因为那会让模拟玩家获得他没有接收到的细节。

所以现在不能直接正式接线。需要在现有聚合句子旁边增加一条结构化但仍然玩家可见的语义事件通道；它不是增加新画面输入，而是保留玩家已经看到的主体、目标、动作和时间。

## Unresolved

- 正式战斗信息层尚未输出结构化公开语义事件。
- 当前敌人概念解释器只有普通/近战/远程小怪等基础概念，没有“高血量敌人”“护阵目标”等本次链条需要的玩家概念。
- 当前没有生成`visible_entity:*`局部可见目标引用。
- 程序只能确认贡献路径发生；多个原因同时出现时不能确认首要原因。
- 分支链、共同原因矩阵和跨多场积累尚未开发。
- Agent是否能稳定使用白名单DSL写出正确链条尚未用真实Agent测试。

## Recommended Next Step

先单独开发“结构化玩家可见事件层”，不要动EVerify：

```text
现有接收筛选
-> 聚合玩家语言（继续给Agent阅读）
-> 同步保留结构化公开语义事件
   subjectRef + predicate + objectConcept/publicEntityId
   + qualifiers + environment + time + informationTier
```

用同一个真实fixture验证结构化事件不能超出聚合语言/画面实际提供的信息。通过后，再让真实Agent尝试写3到5条白名单因果链，检查它是否稳定，不应现在就接完整模拟。
