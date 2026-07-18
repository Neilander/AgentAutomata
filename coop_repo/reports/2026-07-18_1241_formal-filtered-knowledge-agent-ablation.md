# Agent Handoff: 过滤知识正式接线与真实Agent对照

- Date: 2026-07-18
- Agent/thread: root
- Scope: 将类型1 V7接入正式旧知识库，并验证Agent是否真正看到和使用历史角色认知坐标
- Status: complete

## User Intent

保持旧角色认知、非角色信息过滤、换人预期三块各管各的；把已经确认的过滤后类型1知识接入正式玩家Agent流程，再用真实Agent模拟检查它是否会读取历史站位和角色认知坐标进行推理。

## Completed

- 正式战斗现在先更新旧角色认知，再把更新后的四人矩阵位置、当时前30%标尺、相对标尺距离、认知等级和证据数按真实站位交给非角色过滤器。
- 过滤后的类型1关系直接复用旧 `mergeKnowledgeObservation`、旧 `knowledgeBase`、旧检索和旧归因入口，没有建立第二套通用知识库。
- 类型1合并键加入阵容顺序指纹；同四人换位会进入不同知识，同阵型重复战斗仍正常累计。
- 角色详细伤害、治疗、护盾和特点证据仍只进入旧角色认知，不会被类型1重复学习。
- 正式归因改用公开语义哈希信号ID；原始战斗事件ID和内部诊断只留在审计记录。
- 决策检索新增可读历史事实，完整请求和压缩请求都保留历史阵型、四人认知坐标与表现结果。
- 修正决策响应合同：选择 `next_combat` 验证时，说明文本现在与运行时一致，明确要求 `nextCombatTargetCondition`。
- 添加正式Agent对照夹具和验证器。完整组与删除历史坐标组保持当前状态、历史胜负和可选行动一致。
- 更新运行时说明、中文设计文档和任务板；`player-signal-visibility-filter` 已完成当前范围。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：正式接入过滤器、旧知识合并、公开归因证据和历史认知说明。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/knowledge-retrieval.js`：生成Agent可读的历史阵型与认知坐标事实。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/compact-request.js`：压缩请求保留可读历史事实。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`：正式因果循环按过滤后知识边界验收。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/build-formal-cognition-agent-validation.js`：建立正式接线与删除历史坐标的受控Agent请求。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/validate-formal-cognition-agent-responses.js`：验证两个独立Agent回答并交给正式运行时执行。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：更新正式接线状态与验证方法。
- `projects/western_fantasy_continent/design/TYPE1_FILTERED_CAUSAL_KNOWLEDGE_V1.md`：记录正式接线、公开证据和Agent对照。
- `projects/western_fantasy_continent/design/ISOLATED_PLAYER_COGNITION_COMPOSITION_V1.md`：更新三块职责隔离但正式组合的状态。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：更新持久运行时架构。
- `projects/western_fantasy_continent/design/task-budget-board.json`：完成玩家信息语义筛选任务并记录证据。

## Validation

- `test-battle-information-parser.js`：PASS；固定、重复、注意竞争、敌人改名和真实归档战斗均无内部身份或原始事件泄漏。
- `verify-causal-loop.js`：PASS；正式首场知识为过滤后的4条，九次重复挑战仍合并为4条。
- `test-player-agent-roster-a-integration.js`：PASS；换人预测和A结算未被新接线破坏。
- `test-received-information-organizer.js`：PASS；角色、类型1、概率和换人边界保持隔离。
- `test-isolated-player-cognition-composition.js`：PASS；22场、88/88角色、22/22关卡认知快照和全部持久事实通过。
- `test-entity-impression-model.js`：PASS；旧角色强度矩阵和特点复核未回归。
- 两个独立真实Agent对照：完整组选择 `challenge:r1_main_2`，准确引用历史相对标尺 `-2.2` 与当前 `+3.951`；删除历史坐标组选择 `swap:0:militia_drum`，明确表示缺少判断队伍是否变强的依据，且未编造坐标。
- `validate-formal-cognition-agent-responses.js`：PASS；两个回答均被正式运行时接受，行为在消融后发生翻转。
- `task-budget-board.json` 解析：PASS。
- `git diff --check`：PASS，仅有工作区既存换行符提示。

## Current State

新过滤层已经不是影子程序。它与旧系统的关系是：旧角色认知负责视觉战斗表现预处理；新过滤器负责非角色垃圾信息筛选并形成类型1因果事实；旧通用知识库负责合并、检索和交给Agent；换人预期继续读取更新后的角色认知。三块共享一次正式战斗流程，但不互相重算状态。

真实Agent对照证明历史角色认知坐标已经进入决策，而且删除这部分信息会在同一受控问题上改变行为。它证明的是“接线有效、信息会被使用”，不是“当前数学模型已经等同真人”。

## Unresolved

- 真实Agent行为对照目前只有一个精确受控场景，尚未覆盖不同玩家类型、多个关卡、顺序变化和长流程噪声。
- 对照使用了人工构造但合同真实的历史失败，用于因果消融；不是完整两章自主游玩。
- `learnFromChallengeLegacy` 暂留为不被运行时调用的回归参考，稳定一段时间后可单独删除。
- Agent是否“像真人一样”使用认知坐标仍需更广的行为校准；本次不能证明人类心理有效性。

## Recommended Next Step

先做小规模多场行为矩阵，不再改结构：用三类玩家分别测试“历史弱→当前强”“历史强→当前弱”“坐标几乎不变”“换位”“未知新角色”五类对照，统计重试、换人和证据引用是否符合预期。通过后再进入完整两章自主Agent长跑。
