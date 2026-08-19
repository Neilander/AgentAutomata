# Agent Handoff：Decision特征所需证据与现有Agent输出审计

- Date: 2026-07-22 22:43
- Agent/thread: Codex `/root`
- Scope: 隔离worktree `logs/fb2`；只读检查当前Agent合同、运行时和一份20轮真实第一章响应
- Status: complete

## User Intent

不立即修改Agent。先列清EDecision、QDecision、Ordering、ChoiceAuthorship以及二层AhaMoment分别需要度量哪些事实，再检查当前Agent已经输出什么，判断哪些可直接使用、哪些只能间接推导、哪些完全缺失。

## Completed

- 检查正式Agent决策请求合同、响应归一化和当前EDecision运行时。
- 检查战后归因合同。
- 从已归档的惯性玩家第一章20轮真实Agent响应中抽取字段与统计，不逐个阅读全部大日志。
- 建立五个目标量的最小证据清单与现有字段覆盖表。

## 当前Agent实际输出

决策阶段固定输出：

- `action`：一个允许执行的动作；
- `goalId`：当前目标；
- `reasoningChain[]`：`goal / knowledge / evidence / affordance / comparison / hypothesis`加事实文本；
- `alternatives[]`：未选择的合法动作；
- `capabilityNeedMix`：换人时可选的输出、保护、增益需要配比；
- `hypothesis`：问题、原因、目标、验证范围、可测目标条件，以及可选的有序因果链。

战后归因阶段输出：

- `primaryCause`、`confidence`；
- 引用的可见`evidenceEventIds`；
- `alternativeCauses`；
- `nextTest`。

归档的真实第一章共有20次决策：19次有备选动作、9次含comparison、6次提出hypothesis、5次含至少三步结构化因果链；reasoningChain长度为3步7次、4步7次、5步2次、6步4次。

## 目标量与所需证据

| 目标量 | 最小需要度量的事实 | 当前覆盖 | 判断 |
|---|---|---|---|
| EDecision | 实际发生了多少主动认知操作，以及每次操作投入程度；不能用文字长度或接口耗时代替 | 有结构化推理步骤、比较、备选和假设；没有真实持续量、控制强度和内部重复/放弃分支 | 部分可用，只能先做粗粒度序数，不足以得到连续剂量 |
| QDecision | 思考前有哪些未解决问题、竞争解释和冲突；思考后解决/排除了哪些，还剩哪些 | 有单个`problem/cause`、证据、比较、假设；战后有主因、备选原因和下一次测试 | 原料较丰富，但缺明确before/after集合，当前不能可靠计算问题消解量 |
| Ordering | 思考前哪些元素无序；思考后新增了哪些时间、空间、依赖、优先级或职责关系，以及关系是否可执行 | 有解释顺序、因果链、队伍站位和单个动作 | 基本缺失。reasoningChain是解释顺序，causalChain是事件因果顺序，都不能等同多步骤行动Ordering |
| ChoiceAuthorship | 有意义备选、选项差异、理解的取舍、自愿性、选择与个人偏好关系 | 有allowedActions、alternatives、comparison、playerProfile和最终动作 | 部分可用；缺明确取舍与“为什么符合我”，也无法仅凭可选按钮数量判断是否主观被迫 |
| AhaMoment（二层） | 同一问题此前积累的困惑、瞬间前后困惑变化、变化所用时间、玩家是否真正理解 | 有跨轮失败记忆、pending hypothesis、causal knowledge、战后归因与置信度 | 基本缺失。可以看到学习结果，但没有按问题保存困惑状态，也没有标出一次大范围瞬时消解 |

## 关键边界

- 当前`reasoningChain`的顺序是“目标→证据→行为→假设”的解释格式，不是玩家把游戏元素规划成有序结构，因此不能直接当Ordering。
- 当前`causalChain`能证明Agent可以表达有序关系，但它描述预期事件如何发生，不等于一个包含多个玩家动作、资源、站位和优先级的计划。
- 当前`alternatives`主要是动作字符串；即使有comparison文本，也没有稳定记录具体放弃了什么，因此ChoiceAuthorship只能得到弱证据。
- 战后归因很适合形成下一轮的新Q证据或EVerify知识，但不能反向篡改战前Decision特征。
- 当前正式EDecision仍由comparison或完整假设链粗分为`0/1/4`；它验证的是合同完整度，不是最新定义的主观思考累计剂量。

## 最小新增信息建议

下一步不让Agent自己输出Q、Ordering或Aha分数，只增加少量事实型结构：

```text
openQuestionsBefore       思考前仍未解决的问题
competingExplanations     当前竞争解释
resolvedOrEliminated      本次真正解决或排除的项目及引用证据
orderedRelations          新建立的先后、空间、依赖、优先级或职责关系
choiceTradeoff            选择了什么，同时放弃了什么
preferenceReason          该选择是否及如何表达当前玩家偏好
```

代码根据前后集合变化计算Q和Ordering。EDecision先用经过校验的认知操作数量做粗标尺，不使用token数或API延迟。Aha所需的困惑状态由代码按问题ID跨轮保存，不能只让Agent自称“我豁然开朗”。

## Files Changed

- `coop_repo/reports/2026-07-22_2243_decision-feature-input-audit.md`：本报告。
- `coop_repo/LATEST.md`、`coop_repo/REPORT_INDEX.md`：更新协作入口。

## Validation

- 直接检查`player-agent-loop.js`的`responseContract`、`normalizeDecisionResponse`和attribution合同。
- 直接检查`player-cognition-v3-event-runtime.js`当前`0/1/4` EDecision实现。
- 从归档`2026-07-21_feedback-v2-ch1-replay/inertial_player_paired_alpha/session.json`聚合20轮真实响应；只抽取决策响应字段和统计，没有逐条读取37MB会话全文。
- 本轮无算法或正式运行时修改，未运行程序回归。

## Current State

现有Agent已经提供较好的问题、证据、选择、备选和假设材料，不需要推翻重写。真正缺的是可比较的认知前后状态，尤其是未解决问题集合和新增Ordering关系。只要补这些事实型字段，就能开始计算而不是让Agent自己打心理分。

## Unresolved

- EDecision的连续剂量仍没有直接可观测量；需先决定粗粒度认知操作标尺。
- `resolvedOrEliminated`如何防止Agent把未经证据支持的自信断言当成问题解决，需程序校验。
- Ordering关系需要限定公开实体、动作和目标标识，避免漂亮文字不可执行。
- Aha困惑状态的主题ID、积累和跨轮衰减尚未设计。

## Recommended Next Step

先只扩展隔离响应合同和3至5个固定案例，要求Agent输出事实型before/after结构；程序验证引用、动作合法性和关系可执行性。不要先加入连续分数，也不要接正式反馈。
