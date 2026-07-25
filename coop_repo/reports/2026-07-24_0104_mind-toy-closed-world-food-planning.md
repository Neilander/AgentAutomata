# Agent Handoff: MindToy 闭卷三餐组合案例

- Date: 2026-07-24
- Agent/thread: Codex `/root`
- Scope: 增加有限知识估算约束和20种食物的一日三餐状态转移问题
- Status: partial

## User Intent

给 MindToy 引入包含20种食物的一日三餐组合问题，考虑卡路里、GI、GL、总糖、添加糖、天然糖和口味；`estimate` 必须只从预先提供的有限知识集中获取信息。

## Completed

- 增加闭卷知识策略 `closed_world`。
- 增加 `feature_vector` 估算，可一次承载食物的多项营养字段。
- 增加 `exact_fact_or_unknown`：精确营养字段必须逐项绑定知识卡 `facts`，篡改值会被拒绝；缺卡只能未知，不能改成自由估算。
- 增加 `derive_only_from_cited_knowledge`：口味适配可以从食物口味描述和玩家口味偏好推导，但必须引用有限知识卡。
- 建立20种标准份量食物的玩具知识集，包含卡路里、GI、GL、总糖、添加糖、天然糖、种类、适用餐位和口味描述；明确不是现实营养建议。
- 将三餐问题实现为因子化状态转移：六个餐位，每次选择更新累计营养、GI加权量、口味、种类和已使用食物。
- 增加玩家 profile 搜索预算；普通案例beam宽度30，高预算测试可覆盖400。机器展开次数不直接作为 EDecision。
- 增加主观等价方案压缩：当前没有午晚餐时段差异时，同一组食物仅交换午晚餐只保留一个方案。
- 增加完整知识、知识缺失、篡改知识和高低思考预算等递进测试。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/mind-toy-ai-loop.js`: 闭卷知识策略、特征向量、事实绑定校验和认知预算。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/mind-toy-runtime.js`: 因子化状态转移、有限beam搜索、多目标终局评分和等价方案压缩。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/cases/food-day-planning.js`: 20种食物、三餐规则、营养目标、口味知识和冻结AI响应。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/test-food-day-planning.js`: 六项闭卷与组合规划测试。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/demo-food-day-planning.js`: 中文候选三餐演示。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/README.md`: 增加闭卷模式、食物案例和运行说明。
- `projects/western_fantasy_continent/design/MIND_STRUCTURE_TOY_FEASIBILITY_V0.md`: 记录有限知识估算边界。

## Validation

- `node projects/western_fantasy_continent/experiments/player_mind_toy_v0/test-mind-toy-v0.js`: 原有8/8通过。
- `node projects/western_fantasy_continent/experiments/player_mind_toy_v0/test-food-day-planning.js`: 新增6/6通过。
- 闭卷校验覆盖：知识字段被改为999时拒绝；精确营养被伪装成estimated时拒绝；缺少三张食物卡时对应行动保持unknown且不进入可计算方案。
- 普通预算演示：展开785个机器候选、剪枝639个、压缩14个等价计划；最佳冻结样本方案为燕麦、酸奶、鸡胸、豆碗、三文鱼、沙拉，综合分0.9561。
- 新增与修改JS执行 `node --check`：通过。
- `git diff --check`: 通过，仅有既有LF/CRLF提示。

## Current State

MindToy V0 已能在有限知识下做组合规划，并区分明确事实、有限知识推导和完全未知。完整三餐使用状态转移而非把20种食物一次性静态排序；每次选择都会改变后续累计状态。正式玩家 Agent 仍未接入。

## Unresolved

- 食物知识、口味分和目标权重是测试夹具，不代表真实营养学或已经校准的人类偏好。
- 当前真实Agent尚未盲跑；冻结AI响应只证明合同和计算器能执行。
- 因子化beam搜索是近似规划，低预算可能错过全局最优；这可能符合有限认知，但还需验证不同玩家预算。
- 当前午晚餐没有时段偏好，因此允许按食物集合压缩；以后加入“晚餐不想太重”等知识后必须关闭或细化等价规则。
- 还没有把组合过程的事实轨迹翻译为 EDecision、QDecision 和 Ordering。

## Recommended Next Step

让真实Agent只看到20张知识卡、口味卡和问题文本，分别盲做 `buildMindStructureAI` 与 `estimateAI`。重点检查它是否选择状态转移、是否把缺卡食物保留为unknown、是否从有限知识正确抽取40项估算，以及是否先压缩明显无效或等价的组合。

