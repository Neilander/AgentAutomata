# Agent Handoff：决策四特征隔离计算与边界验证

- Date: 2026-07-22 16:18
- Agent/thread: Codex `/root`
- Scope: 隔离 worktree `logs/fb2`；Decision特征定义复查、隔离计算器和确定性案例
- Status: complete

## User Intent

在EDecision、QDecision、Insight和ChoiceAuthorship四个定义已经基本清晰后，再复查一次是否重叠或遗漏，并开始隔离测试；暂不接入正式玩家和情绪。

## Completed

- 复查四特征边界，确认它们分别描述思考投入量、持续推进质量、关键突破和自我选择程度。
- 将EDecision实现为主动思考持续量乘主动控制强度的累计剂量；不再用因果链步骤数代替，也不在特征层封顶。
- 将QDecision实现为普通思考过程中的加权推进质量，允许死循环为负。
- 第一轮测试发现数独突破同时获得高Q和高Insight会重复描述同一步；修正为突破步骤计入E但不再计入Q，突破的特殊问题压缩只进入Insight。
- Insight隔离版用“理解、新信息、突然性、主观问题空间压缩”四项必要证据的最弱项限制。
- ChoiceAuthorship隔离版要求至少两个有意义选项，并受选项差异、取舍理解、自愿性和偏好表达的最弱项限制。
- 新增13个跨游戏确定性案例和3组不变量检查。
- 明确计算器不会输出反馈、收益或情绪，也不会读取胜负和玩家偏好改变特征。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_decision_features_v1/decision-feature-model-v1.js`：隔离四特征计算器。
- `projects/western_fantasy_continent/experiments/player_decision_features_v1/test-decision-feature-model-v1.js`：13个确定性案例与边界断言。
- `projects/western_fantasy_continent/design/PLAYER_DECISION_FEATURES_V2.md`：补充EDecision最小构成、Q/Insight去重规则和隔离结果。
- `coop_repo/reports/2026-07-22_1618_decision-four-feature-isolation.md`：本报告。
- `coop_repo/LATEST.md`、`coop_repo/REPORT_INDEX.md`：更新协作入口。

## Validation

- `node projects/western_fantasy_continent/experiments/player_decision_features_v1/test-decision-feature-model-v1.js`：PASS，13/13。
- 路径持续推进：E=10.2、Q=0.7243、Insight=0、Choice=0。
- 高投入死循环：E=12.2、Q=-0.2631。
- 数独瞬间突破：E=0.975、Q=0、Insight=0.9。
- 先规划后突破：E=5.6、Q=0.6425、Insight=0.8。
- 背包自我选择：Choice=0.9；系统强迫和伪选项均为0.05。
- 战后猜错不篡改战前特征：E=6.4、Q=0.62。
- 同一输入附加输赢、奖励、情绪与玩家偏好后，四特征保持完全一致。
- 相同思考剂量下，良好推进和越想越乱得到相同E、相反Q。
- 输出契约中不存在feedback、emotion或reward字段。

## Current State

四特征在定义层已经可以稳定分开，且隔离程序能够表达高E低Q、低E高Insight、低E高Choice等关键组合。当前程序是定义验证工具，不是正式Agent解析器；正式玩家运行时、反馈V2和情绪实验均未修改。

## Unresolved

- 真实Agent轨迹如何可靠生成主动思考持续量、控制强度和认知变化证据，尚未设计。
- EDecision的标准剂量单位尚未和实际Agent调用或游戏时间标尺对齐。
- Insight和ChoiceAuthorship的最弱项规则只是保守的隔离测试规则，尚未经过真人或自然Agent案例校准。
- 目前只验证单个Decision episode，没有验证跨连续决策的累积、疲劳和偏好反馈；这些属于二级模型。

## Recommended Next Step

先挑选少量现有真实Agent决策记录，人工标注四特征，再让隔离解析器只读取决策前的结构化痕迹进行盲提取对比。特征提取稳定前，不进入二级反馈函数，也不接情绪。
