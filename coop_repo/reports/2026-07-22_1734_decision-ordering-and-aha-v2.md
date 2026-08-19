# Agent Handoff：Decision四核心特征与Aha二层重做

- Date: 2026-07-22 17:34
- Agent/thread: Codex `/root`
- Scope: 隔离worktree `logs/fb2`；重做Decision隔离模型，不接正式玩家
- Status: complete

## User Intent

纠正上一版Insight与QDecision重叠的问题：核心仍只保留四个特征，将Planning改为Ordering，表达通过思考把时间、空间、依赖、优先级等混乱内容组织起来；AhaMoment是“此前很多困惑在瞬间得到解决”的二层体验，不是核心特征。重新进行隔离实验。

## Completed

- 新建第二版隔离计算器，核心接口严格只输出EDecision、QDecision、Ordering和ChoiceAuthorship。
- QDecision改为每单位思考解决复杂、未知或冲突问题的程度。
- Ordering改为每单位思考产生的结构增益，覆盖时间顺序、空间站位、依赖关系、资源优先级和职责组织。
- 删除核心接口中的Insight；撤销“突破步骤不计入Q”的人为去重规则。
- 新增独立二层AhaMoment：此前困惑消解量乘瞬间性与真正理解程度。
- Aha既可来自发现Boss关键弱点，也可来自突然看懂多个步骤的正确顺序。
- 新增16个核心案例与6个Aha二层案例。
- 给第一版隔离代码增加历史版本提示，保留文件但避免误用。
- 新增V3中文设计说明，V2顶部标记已被取代。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_decision_features_v2/decision-feature-model-v2.js`：四核心特征与独立Aha二层计算器。
- `projects/western_fantasy_continent/experiments/player_decision_features_v2/test-decision-feature-model-v2.js`：16个核心与6个Aha案例。
- `projects/western_fantasy_continent/experiments/player_decision_features_v1/decision-feature-model-v1.js`：增加历史版本提示。
- `projects/western_fantasy_continent/design/PLAYER_DECISION_FEATURES_V3.md`：当前最新设计。
- `projects/western_fantasy_continent/design/PLAYER_DECISION_FEATURES_V2.md`：标记被V3取代。
- `coop_repo/reports/2026-07-22_1734_decision-ordering-and-aha-v2.md`：本报告。
- `coop_repo/LATEST.md`、`coop_repo/REPORT_INDEX.md`：更新协作入口。

## Validation

- `node projects/western_fantasy_continent/experiments/player_decision_features_v2/test-decision-feature-model-v2.js`：PASS，16个核心案例与6个Aha案例。
- 高Q低Ordering：Boss复杂因果`Q=0.7258/O=0.05`；发现弱点`Q=0.95/O=0`。
- 低Q高Ordering：已知任务排时间`Q=0.05/O=0.825`；空间站位`Q=0.075/O=0.775`；资源优先级`Q=0.1/O=0.825`；已知弱点排技能`Q=0.08/O=0.86`。
- 二者同时高：团队机制与行动链`Q=0.7/O=0.725`。
- 高投入但更乱：`E=9/Q=-0.45/O=-0.25`。
- Choice独立：背包自选0.9，系统强迫与伪选项均0.05。
- Aha边界：Boss突然豁然开朗0.6957，同幅度逐渐学会0.1143，教程直给0.0909，显眼但未解惑0.0582，未理解答案0.0636，突然看懂步骤顺序0.5938。
- 同一决策附加输赢、奖励、情绪和玩家偏好后，四核心特征完全不变。
- 核心输出键严格等于四项，不包含Insight或AhaMoment。

## Current State

当前Decision核心已固定为思考量、复杂问题解决、增序和自我选择四项；Aha作为认知状态突变产生的二层特殊体验。新代码完全隔离，不修改正式Agent、反馈V2和情绪运行时。

## Unresolved

- 当前夹具直接提供每段思考解决的复杂度与结构增益，尚未解决真实Agent轨迹如何可靠提取这两个证据。
- EDecision标准剂量单位尚未和真实Agent思考过程对齐。
- Aha公式是方向验证式，不是已经校准的人类常数；困惑的跨事件积累尚未接状态记忆。
- 二层如何结合玩家对解题、Ordering和自我选择的个人偏好，尚未设计。
- 同一问题解决量如何在普通Q反馈与Aha体验之间避免重复结算，需在二层反馈设计时明确非加法关系。

## Recommended Next Step

从现有真实Agent决策记录中挑选解题、纯排序、二者并存和自我选择四类片段，先人工标注四核心特征，再开发只读决策痕迹的提取器。提取稳定前不接正式反馈。
