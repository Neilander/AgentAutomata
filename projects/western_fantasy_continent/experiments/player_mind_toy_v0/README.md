# Player Mind Toy V0

这是玩家主观思维结构的隔离实验目录。它不接入正式玩家 Agent、不修改现有 Decision 或情绪反馈链。

## 实验目标

验证一个由 AI 构建、由程序约束和运行的主观小型世界模型：

```text
玩家可见上下文
  -> buildMindStructureAI
  -> estimateAI
  -> validateAndAssemble
  -> attempt
  -> updateFromObservation
```

## 职责边界

- `buildMindStructureAI`：根据目标和上下文选择结构，识别对象、行动、关系和需要估算的位置。
- `estimateAI`：基于玩家可见信息与既有记忆形成主观收益、概率、范围、置信度和依据。
- `validateAndAssemble`：由代码检查合同、证据来源和引用关系，合并重复项并保留冲突假设。
- `attempt`：在思考预算内展开行动或计划，预测可能结果并记录计算轨迹。
- `updateFromObservation`：只使用行动后的玩家可见观察修正旧估算和结构。

## 第一案例

限时地图探索与备战：玩家拥有数天和每日行动点，需要在敌人到达前，通过强化己方、削弱敌方、改变战斗条件或混合路线提高获胜可能。

## 四种预设结构

1. `single_ranking`：每个选项被压成一个固定主观价值，直接排序。
2. `multi_ranking`：每个选项保留多个价值特征，按照玩家目标与偏好加权后排序。
3. `map`：把估算价值挂到地点上，在每日行动点、路径和前置条件约束下生成路线，再复用单值或多值排行榜给路线排序。
4. `state_transition`：为每个行动建立独立的主观状态转移分布，多步计算未来状态的价值；不能用一张不区分行动的矩阵。

AI必须选择足以覆盖问题的最低复杂度结构。高阶结构可以复用低阶结构评分，但不能仅因选项很多就自动升级。

## 当前文件

- `mind-toy-ai-loop.js`：生成两阶段 AI 请求，校验 `buildMindStructureAI` 和 `estimateAI` 的返回，并组装主观 MindToy。
- `mind-toy-runtime.js`：运行四种结构的 `attempt()`，保留路线、状态分支和计算轨迹。
- `cases/timed-defense.js`：限时地图备战的可见上下文及一组冻结 AI 合同响应。
- `cases/food-day-planning.js`：20种食物、三餐六个餐位、GI/GL、总糖、添加糖、天然糖和口味知识的闭卷状态转移案例。
- `test-mind-toy-v0.js`：合同、隐藏证据、四种模型、纯随机零有效比较等隔离测试。
- `test-food-day-planning.js`：有限知识绑定、知识缺失、三餐组合、等价方案压缩和玩家思考预算测试。
- `demo-timed-defense.js`：打印限时备战案例的主观路线排行榜。
- `demo-food-day-planning.js`：打印有限知识下的一日三餐候选方案。

运行：

```powershell
node projects\western_fantasy_continent\experiments\player_mind_toy_v0\test-mind-toy-v0.js
node projects\western_fantasy_continent\experiments\player_mind_toy_v0\test-food-day-planning.js
node projects\western_fantasy_continent\experiments\player_mind_toy_v0\demo-timed-defense.js
node projects\western_fantasy_continent\experiments\player_mind_toy_v0\demo-food-day-planning.js
```

## 有限知识模式

案例可以声明 `knowledgePolicy.mode = "closed_world"`。此时：

- AI不能使用自身常识补齐缺失信息。
- 精确知识使用 `exact_fact_or_unknown`：返回 `known` 时，每个字段必须绑定到知识卡 `facts` 中的对应值；无卡则只能返回 `unknown`。
- 主观推导使用 `derive_only_from_cited_knowledge`：例如口味适配可以由食物口味卡与玩家口味卡共同估算，但必须引用两者。
- 程序会拒绝不可见证据、被篡改的知识字段以及把缺失精确知识伪装成自由估算的响应。

三餐案例使用因子化状态转移：每次选择都更新累计卡路里、GL、糖分、GI加权量、口味和已用食物。搜索宽度来自玩家 profile；机器内部展开次数不直接等于 EDecision。当前模型认为午晚餐互换没有额外价值时，会把同一组食物的排列压成一个主观等价方案。

## 当前状态

隔离 V0 已实现两阶段 AI 合同、四种结构的程序运行器和固定案例测试。当前案例中的 AI 响应是冻结合同样本，只验证代码和结构，不代表真实 Agent 已经能够稳定构建这些模型。下一步应让真实 Agent 对相同上下文生成构建与估算响应，再与合同样本做盲对比。
