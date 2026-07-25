# Agent Handoff: MindToy 四模型隔离运行器

- Date: 2026-07-23
- Agent/thread: Codex `/root`
- Scope: 实现 AI 构建/估算合同及四种预设 MindToy 数学结构
- Status: partial

## User Intent

在隔离目录开发由 AI 构建和估算、由程序校验和计算的玩家主观 MindToy，并预先适配单值排行榜、多价值排行榜、地图和状态转移四种复杂度模型。

## Completed

- 实现两阶段 AI 合同：`buildMindStructureAI` 选择最低充分结构并声明估算缺口，`estimateAI` 只根据玩家可见上下文与记忆填写主观估算。
- 实现代码校验：模型与结构必须一致，估算引用必须存在，证据只能引用玩家可见 ID，概率必须归一，地图边和状态引用必须合法。
- 实现单值排行榜：对可执行选项的固定主观价值排序。
- 实现多价值排行榜：保留多个价值维度并按玩家权重合并，同时输出每维贡献和覆盖率。
- 实现地图模型：在每日行动点、位置、前置条件和未确认地点限制下展开路线，再复用排行榜评分。
- 实现状态转移模型：每种行动有独立的主观转移分布，通过有限步递归计算当前行动的未来价值，并输出行动转移矩阵。
- 增加纯随机等值选项案例：保留三个点击选项，但有效比较和决策相关分支为 0。
- 增加限时备战案例：两天、每日2行动点下，“瞭望塔→破坏补给”主观价值7.9，高于“矿洞→锻造”6.5；模型能够选择削弱敌方路线。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/mind-toy-ai-loop.js`: AI请求、返回合同、校验和MindToy组装。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/mind-toy-runtime.js`: 四模型 `attempt()` 运行器。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/cases/timed-defense.js`: 限时备战可见上下文和冻结AI合同响应。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/test-mind-toy-v0.js`: 八个隔离测试。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/demo-timed-defense.js`: 中文路线排行榜演示。
- `projects/western_fantasy_continent/experiments/player_mind_toy_v0/README.md`: 模块边界、模型说明和运行方法。
- `projects/western_fantasy_continent/design/MIND_STRUCTURE_TOY_FEASIBILITY_V0.md`: 将旧的三视图建议更新为四级模型与AI估算管线。

## Validation

- `node projects/western_fantasy_continent/experiments/player_mind_toy_v0/test-mind-toy-v0.js`: 8/8通过。
- 覆盖：两阶段AI请求、不可见证据拒绝、坏估算引用拒绝、单值排行、全随机零有效比较、多价值加权、限时地图路线、概率状态转移。
- `node projects/western_fantasy_continent/experiments/player_mind_toy_v0/demo-timed-defense.js`: 成功输出4条主观路线；削弱敌方路线7.9，强化路线6.5。
- 四个新增JS文件执行 `node --check`：通过。
- `git diff --check`: 通过，仅有工作区既有的LF/CRLF提醒。

## Current State

隔离 V0 已能接收两次结构化 AI 响应、组装主观 MindToy 并运行四种模型。地图高阶模型复用排行榜；状态转移按行动分别建立矩阵。正式玩家模拟没有被修改。

## Unresolved

- 当前案例的 AI 响应是冻结样本，只证明合同、校验和计算器工作；尚未证明真实 Agent 能稳定选对模型、识别估算缺口或做出可信估算。
- `updateFromObservation` 尚未实现，错误认知的跨轮修正还未验证。
- 思考预算目前由 `attempt` 参数控制，尚未和玩家 profile、精神状态相连。
- `trace` 只输出可测事实，还没有转换为 EDecision、QDecision、Ordering；纯随机零有效比较已保留，不能直接把原始分支数当思考量。
- 多价值权重目前来自 AI 构建结构，下一步需要检查权重是否忠实引用玩家 profile，而不是临时迎合选项。

## Recommended Next Step

先让真实 Agent 对四个盲案例分别执行 `buildMindStructureAI` 和 `estimateAI`，不告诉期望模型；检查模型选择、隐藏信息隔离、估算可信度和选项压缩。通过后再实现 `updateFromObservation`，最后才把运行轨迹接到 Decision 特征。

