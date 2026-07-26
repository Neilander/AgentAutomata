# Agent Handoff: 可运行认知试玩实验室 V0

- Date: 2026-07-25
- Agent/thread: Codex 主任务，独立 worktree `logs/fb2`
- Scope: `cognitive_gameplay_lab_v0` 隔离实验
- Status: complete

## User Intent

先不接正式玩家模型，把此前讨论的注意、游戏记忆检索、ActiveCognition、AI 构建 MindToy、有来源 Estimate、逐个 Idea、局部尝试、控制器和 ThoughtTrace 做成逐模块验证的可运行链，并让它真实试玩一个最小游戏。Decision 特征、Aha 和情绪属于后续阶段。

## Completed

- 新建完全隔离的认知试玩实验室，没有修改正式玩家 Runtime。
- 建立玩家可见 allowlist、隐藏字段审计、sentinel 泄漏测试和可重放状态合同。
- 实现有限注意分配、游戏语境 RAG 检索和 ActiveCognition；修复“低强度旧记忆仅因关键词完全匹配就自动触发”的问题。
- 复用旧四类 MindToy 合同，增加 AI 证据约束和任务充分性审核。
- Estimate 只接受本轮可见事实、已检索记忆或白名单计算器；无来源为 unknown，冲突旧记忆保留范围。
- 实现一次一个 Idea、重复检测、局部状态转移推演、程序评价、单步 ThoughtController 和因果可追踪 ThoughtTrace。
- 建立 1～8 符文 Guess 游戏。目标为6时行为是探测4、收到更高、探测6并命中；遍历8个隐藏目标均不超过4步。
- 保存一个本轮 Codex 针对真实构建请求写出的受审 AI MindToy 样本，并明确区别于确定性测试替身。

## Files Changed

- `projects/western_fantasy_continent/experiments/cognitive_gameplay_lab_v0/`：全部隔离实现、测试、Guess 游戏、AI 接口和受审样本。
- `projects/western_fantasy_continent/design/COGNITIVE_GAMEPLAY_LAB_V0.md`：十一模块、职责边界、试玩过程和未完成范围的中文说明。
- `coop_repo/LATEST.md`、`coop_repo/REPORT_INDEX.md`：协作入口更新。

## Validation

- 实验室专项：4 + 5 + 6 + 6 + 4 + 1，共26项全部通过。
- `player_mind_toy_v0/test-mind-toy-v0.js`：8项通过。
- `player_mind_toy_v0/test-food-day-planning.js`：6项通过。
- `player_agent_api_loop_v1/verify-causal-loop.js`：PASS，正式两周期回归无变化。
- 1～8全部隐藏目标完成，最多4步；隐藏 sentinel 未进入玩家视图、AI请求或认知周期。

## Current State

现在已经有一条能玩的思考链，而不只是 Decision 数值的静态假输入：玩家看见有限信息，激活有限记忆，AI构造主观结构，程序填有来源估算，AI一次提一个思路，程序局部推演并决定行动，游戏反馈再进入下一轮。机器内部搜索次数没有被当成人类思考量。

## Unresolved

- 本机 `codex.exe` 即使请求额外权限仍返回“拒绝访问”，因此没有批量独立模型调用；只有当前 Codex 的单个受审输出，不能宣称跨模型稳定。
- 新 local attempt 暂只支持状态转移 MindToy；另外三类需逐个接线测试。
- 未实现跨轮长期学习、chunking、熟练化导致的注意成本下降。
- 未计算 EDecision、QDecision、Ordering、ChoiceAuthorship、Aha 或情绪收益，也未接正式玩家 Agent。
- Guess 是最小闭环；更复杂游戏的结构充分性尚未证明。

## Recommended Next Step

先用 Light Up 或小型扫雷做第二个隔离游戏，真实保存多次 AI 的 MindToy/Estimate/Idea 原始输出，检查模型选择、证据越界、无来源数字、结构过度复杂和任务不充分率；通过后再扩展对应 local attempt，不要直接接正式玩家 Agent。
