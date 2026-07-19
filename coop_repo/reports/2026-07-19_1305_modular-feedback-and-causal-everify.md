# Agent Handoff：反馈模块封装与因果EVerify

- Date: 2026-07-19
- Agent/thread: root
- Scope: 将Process、R、A、EVerify产出从事件运行器中拆出，并让EVerify更新可供下一决策读取的因果知识
- Status: partial

## User Intent

用户尚未完全确定人类各类反馈的最终机制，因此要求把不同反馈产出封装成独立、可替换的函数。R继续表达结果价值；EVerify主要表达因果确认和学习，并保留支持度、证据强度、因果贡献、新颖度、闭环度五个维度。第二层至少需要显式产生 `支持度 × strength` 的策略爽感，同时能够表达发现新机制的爽感。

## Completed

- 新增独立 `player-feedback-model.js`：
  - `produceProcessFeedback`
  - `produceResultFeedback`
  - `produceExpectationFeedback`
  - `calculateMismatchFeedback`
  - `calculateConfirmationFeedback`
  - `produceVerificationFeedback`
  - `composeFeedback`
- 每个被接收的事件现在生成 `player_feedback_bundle_v1`，四个通道分别是：
  - `process`
  - `R`
  - `A`
  - `EVerify`
- EVerify第一层固定输出：
  - `support`：有符号支持度；
  - `strength`：证据强度；
  - `contribution`：主因、共因、辅助、无关或未知；
  - `novelty`：是否为新发现；
  - `closure`：因果链是否形成闭环。
- EVerify第二层透明派生：
  - `knowledgeEvidence = support × strength × contributionWeight`
  - `strategySatisfaction = max(support, 0) × strength`
  - `discoverySatisfaction = novelty × strength × closure`
- 策略爽感和发现爽感各自保留独立情绪缩放值，并进入新的 `verificationEmotion` 通道；原有R和A不被挪用。
- 保留了“实际进行了假设比较”的过程反馈。因此确认和证伪都可以有比较过程，但只有正因果支持产生策略爽感。
- 新增上下文相关的 `causalKnowledge`：
  - 强支持向正方向拉动；
  - 强证伪向负方向拉动；
  - 无法判断不更新；
  - 使用对称先验质量，单个案例不会直接形成满置信知识。
- 正式Agent下一次决策请求现在能读取 `causalKnowledge`；完整请求、压缩请求和章节继承均保留。
- 没有更丰富因果解释的旧事件明确标记为 `target_condition_proxy`，并使用未知贡献权重，避免把一次达标伪装成完整因果证明。
- 任务板 `emotion-decision-expectation-settlement` 已按新定义更新，但仍保持active。

## Files Changed

- `projects/western_fantasy_continent/game_data/player-feedback-model.js`：独立反馈计算、五维EVerify、二层体验和因果知识更新。
- `projects/western_fantasy_continent/game_data/player-cognition-v3-event-runtime.js`：接入四通道反馈包、verificationEmotion和causalKnowledge。
- `projects/western_fantasy_continent/game_data/test-player-feedback-model.js`：新增模块级配对案例。
- `projects/western_fantasy_continent/game_data/test-player-cognition-v3-player-hypothesis.js`：新增确认/证伪/不可读的策略反馈和知识方向断言。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：把因果知识暴露给下一次Agent决策并支持继承。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/compact-request.js`：压缩请求保留causalKnowledge。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-target-condition-contract.js`：验证完整/压缩请求的因果知识一致性。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/controlled-two-chapter-run.js`：汇总新增verification通道。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/enriched-two-chapter-run.js`：汇总新增verification总量。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：记录正式反馈边界和因果知识合同。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：记录模块、公式和测试入口。
- `projects/western_fantasy_continent/player_model_runtime.json`：运行时升级为V23并注册反馈模型与回归。
- `projects/western_fantasy_continent/design/task-budget-board.json`：更新EVerify任务定义、证据和下一步。

## Validation

- `test-player-feedback-model.js`：PASS。
  - 相同R下，清楚证明策略时策略爽感为0.81；强竞争解释下为0.081。
  - 明确证伪的策略爽感为0，知识证据为负。
  - 新发现案例同时产生0.4策略爽感和0.72发现爽感。
  - 单次0.81强证据只形成约0.2883 belief/confidence。
- `test-player-cognition-v3-player-hypothesis.js`：PASS。
  - 确认产生正策略反馈和正因果知识；
  - 证伪仍完成比较，但策略爽感为0并形成负因果知识；
  - 不可读不产生EVerify、策略反馈或知识更新。
- `test-expectation-repair-trio.js`：PASS，既有A/C、换装预期和新关惯性未回归。
- `test-target-condition-contract.js`：PASS，正式/压缩字段合同和因果知识可见性一致。
- `verify-causal-loop.js`：PASS，两周期正式信号—知识—决策循环未破坏。
- `validate-controlled-two-chapter-run.js`：PASS，章节继承和情绪汇总未破坏。
- `independent_review`：not_run。本轮是确定性模块封装和公式级配对，不是多玩家完整玩法轨迹；没有在用户未要求子Agent的情况下启动独立评审。

## Current State

当前已经可以单独修改R、A或EVerify公式，不需要进入战斗执行和知识主循环。EVerify既能表达“这条因果被支持多少”，也能把证据积累成下一次Agent可读的玩家认知。策略爽感和发现爽感保留为独立、可审计的中间值，当前情绪缩放常数均为0.06，只是程序级工作值，不是人类定律。

## Unresolved

- 真实战斗语义解析器尚未自动产生完整 `causalEvidence`。目前正式长跑中的旧条件验证大多仍使用保守的 `target_condition_proxy`。
- “游侠减速→敌方延迟→主C开大”这类多事件机制链尚未自动识别；反馈模块已经能接收，但上游还没有通用机制链解析器。
- 当前新颖度和竞争解释需要上游语义证据提供，不能由最终胜负反推。
- 已被强证伪的同环境重复行为尚未降低EDecision掌控反馈。
- 0.06策略/发现情绪缩放、贡献权重和因果先验质量均未经过真人校准。
- 当前EVerify额外进入总情绪后，正式长跑的总量分布尚未用多玩家重新校准；本轮只验证了确定性排序与接线。

## Recommended Next Step

先做一个很小的真实战斗语义案例：固定“游侠减速、主C开大、另一个强竞争原因”三条可见事件，让上游程序生成不同的 `causalEvidence`，验证同样胜利时R相同、EVerify因归因不同而分化。该案例通过后，再做重复强证伪行为的EDecision折扣，不要直接跑完整两章。
