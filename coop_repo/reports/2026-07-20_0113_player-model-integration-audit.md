# Agent Handoff：历史玩家模型成果接线审计

- Date: 2026-07-20
- Agent/thread: Codex `/root`
- Scope: 对照历史报告、任务板、隔离模型和当前V27正式入口，检查哪些已完成机制实际接入、哪些仍是孤立代码、哪些被新架构替代、哪些从未完成
- Status: complete audit; no runtime code changed

## User Intent

用户发现此前已经修过EDecision和“卡住乱试”相关体验，但当前正式运行时似乎没有对应数值，要求系统检查此前完成的各种玩家模型成果中还有哪些没有进入当前正式Agent模拟。

## Executive Conclusion

最近一周完成的角色认知、信息过滤、换人预期、A/C、结构化EVerify和假设定向注意都已进入正式V27，并有正式入口回归。

真正形成旧成果孤岛的是更早的三组模型：

1. `feedback-cognition-model.js` 的V4反馈存量/习惯化/失败恢复/疲劳/概率放弃没有进入正式V27。
2. `player-cognition-v5-sandbox.js` 的完整 `P×Q`、`deadRepetition`、`incomprehension`、`kP`、progression/growth R、Agency和放弃没有进入正式V27。
3. V1–V3的代码自选行动策略没有进入正式Agent入口；其中的重复惩罚、30%成长唤醒、终局防刷和单一实验守卫被“真实Agent根据知识自行选择”替代，但原来的确定性策略公式并未迁移。

这些代码均仍保留且测试通过，因此不是文件丢失；问题是历史上建立了多个平行运行时，后来正式Agent循环选择V3事件运行时加外部Agent决策时，没有把V4/V5的过程质量和长期行为层合并进去。

## Audit Method

- 读取当前 `player_model_runtime.json`、`PLAYER_MODEL_RUNTIME.md`、任务板玩家情绪任务线和2026-07-10至2026-07-19相关报告。
- 从当前正式入口 `experiments/player_agent_api_loop_v1/player-agent-loop.js` 递归解析本地 `require()`：
  - 当前可达源文件35个；
  - `player-cognition-v3-event-runtime.js`、`player-feedback-model.js`、换人预期/A、信息整合器、假设注意和结构化匹配器可达；
  - `feedback-cognition-model.js`、`player-cognition-v5-sandbox.js`、`player-cognition-v3-action-policy.js`不可达。
- 运行当前正式回归和旧隔离回归，确认是“代码仍可运行但没有接线”，不是代码已经损坏。

## Already Integrated In Formal V27

### 感知与知识

- 八档信息呈现与低/普通/高感知；
- 显眼度、幅度、目标相关、注意竞争和重复机会；
- 原始事件到玩家可见语义过滤；
- 类型1主体—环境—行为—结果知识；
- 角色详细认知独立分支；
- 假设相关因果证据独立通道；
- 75%/50%/25%血条跨档证据；
- 假设定向注意。

### 角色与换人

- 输出、保护、增益三套独立角色矩阵及前30%标尺；
- 环境化角色认知和特点复验；
- 精确队伍、装备、站位和历史认知坐标；
- Agent按问题给三轴需求配比；
- 换人预测冻结、装备倍率重算；
- 新关弱惯性预期；
- A偏差与确认感C。

### 假设与反馈

- EDecision不再允许Agent直接填写；
- 完整决策链由程序验证并得到0/1/4；
- `targetCondition`统一合同；
- 当前行动与下一场战斗假设；
- 正式结构化因果链、公开角色/技能标识、战后逐步匹配；
- confirmed/refuted/inconclusive；
- EVerify支持度、证据强度、局部链知识和因果认知更新；
- Process/R/A/EVerify独立反馈封装。

以上正式回归全部PASS。

## Preserved But Not Integrated

### 1. Feedback Cognition V4

历史状态：2026-07-10报告标记complete，独立审查接受，当前测试仍PASS。

旧机制包括：

- 独立feedback stock；
- 每类事件习惯化；
- 失败只恢复相关事件族、至少40个百分点的新鲜度；
- fatigue、frustration和expectation分账；
- 放弃前状态、放弃概率、随机roll和终局放弃分离。

当前正式V27没有导入这个模块。V27只有持续累加的emotion、简化freshness和失败记忆，不等价于V4的反馈存量和概率放弃。

判定：**真正未合并的旧完成成果**。

### 2. Player Cognition V5 Sandbox

历史状态：2026-07-12三轮校准和独立审查通过；参数敏感性/顶点测试通过；报告明确说明它是隔离沙盒，不是正式接线。当前测试仍PASS。

旧机制包括：

- `P = cognitiveProcessWeight × E + wProcessWeight × W`；
- `processFeedback = P × Q`；
- `deadRepetition`降低Q；
- `incomprehension`降低Q；
- 画面清晰、因果清晰和进度可读性提高Q；
- progression R和growth R；
- `expectedResult = k × P`；
- Agency/ROI行动排序；
- balanced/impatient/analytical参数；
- feedback阈值触发continue/switch/abandon。

当前V27只保留了EDecision产生固定过程正反馈、机械时间衰减、普通R/A和新版EVerify；没有Q，也没有deadRepetition/incomprehension。因此“已有强反证、原样乱试”的旧正确表达没有进入正式运行时。

判定：**最关键的未合并旧成果，也是本轮对话发现的直接缺口**。

### 3. V1–V3 Code-Owned Action Policies

历史状态：V1、V2、V3分别冻结并通过独立审查；当前旧测试仍PASS。

策略中包含：

- 连续重复行动惩罚；
- 失败目标休眠；
- 可见战力成长30%后重新唤醒；
- 未达到唤醒线时优先准备；
- 防止通关后终局刷取；
- 新角色一次只开一个待验证实验；
- 基于知识、目标、成本和成功信念的代码排序。

当前正式循环让外部Agent读取玩家知识、失败记忆、角色认知和允许行动后自行选择，不调用 `player-cognition-v3-action-policy.js`。失败基线等部分状态仍在V3事件运行时并暴露给Agent，但原来的确定性惩罚/唤醒/终局排序公式不再执行。

判定：**架构替代，不是简单丢失**。如果目标是自然Agent玩家，这不应整模块恢复；但其中重复、卡点和实验边界需要以代码合同重新约束，不能只依赖Agent自觉。

## Never Completed Or Explicitly Deferred

以下不能叫“修好了但没接入”：

- 概率型掉落预期与同批顺序冻结：任务板queued，尚未开发。
- 失败体验中的完整P×Q、progression R、growth R和learned kP：2026-07-15任务板明确queued。
- EVerify novelty和closure：用户明确暂缓，当前固定0。
- 重复强证伪如何进入正式Q：旧V5有隔离公式，但从未用新版结构化因果知识完成接线。
- 完整合法的causalChain请求示例：仍未补。

## Partial Or Superseded Areas

- H/感知：旧V1渲染H没有原样保留，但已被更完善的呈现档位、阈值接收、注意竞争和假设注意替代，不是缺失。
- 玩家profile：旧V5的心理系数profile未接入；当前十类profile改为可错的初始认知/行为倾向并交给Agent使用，是另一种实现。
- Agency：旧V5能计算诊断数和简单ROI选择，但顶点审计已指出它没有完整进入学习行为；当前也没有独立Agency数值。不能把它记为已完成后丢失。
- EDecision：完整链验证、延迟假设和0/1/4已接入；缺失的是Q对这次思考质量的评价，不应重做EDecision。

## Validation

当前正式接线回归PASS：

- expectation repair trio；
- targetCondition contract；
- formal structured EVerify；
- hypothesis-directed attention；
- received-information organizer；
- independent capability cognition；
- capability-mix roster expectation；
- roster A integration and edge cases；
- modular player feedback；
- formal causal loop。

旧孤立模型仍可运行：

- feedback cognition V4：PASS；
- V1 event/action policy：PASS；
- V2 long-horizon policy：PASS；
- V3 character-affordance policy：PASS；
- V5 sandbox：PASS；
- V5 vertex audit：PASS。

## Current State

当前正式V27不是“以前所有玩家模型的全集”。它是后来围绕真实Agent、可见信息、角色认知、换人预期和结构化因果学习重新形成的一条正式主线。较新的认知与预期成果接线完整；较早的全局情绪/过程质量/放弃模型仍在旁路。

此前把下一步写成“重复证伪降低EDecision掌控感”不准确。正确的旧模型表达应是：

```text
EDecision仍表示玩家确实完成了思考
strong refutation + no meaningful change -> deadRepetition上升
deadRepetition降低Q
P × Q过程反馈下降或转负
```

## Unresolved Risks

- 当前正式Agent可以在强反证后重新写一条完整链并再次获得固定EDecision过程正反馈。
- 正式模拟没有代码级卡住/放弃边界，长跑主要依赖Agent自行换路或cycle上限。
- V4、V5与当前R/A/EVerify包含重叠概念，不能整模块直接导入，否则会重复计算结果、预期和情绪。
- `skills/player-cognition-simulation/SKILL.md`仍写“production-facing runtime is feedback-v4”，与当前V27 source of truth不一致，容易继续制造误读。

## Recommended Next Step

不要恢复整个V5。先抽取一个很小的正式 `processQuality` 模块：

- 输入：当前结构化假设、同环境因果belief/confidence/evidence、上次结算、阵容/装备/站位/环境变化、是否明确做随机性复验；
- 输出：`deadRepetition`、`incomprehension`、`meaningfulChange`和Q；
- EDecision仍按现有0/1/4计算；
- 过程反馈改成当前过程量乘Q；
- R、A、C、EVerify和因果学习保持现有实现，不重复计算。

然后用“原样强反证重复、弱证据复验、换装备、换角色、换环境、修改局部因果链”六类小案例验证。V4的feedback stock/习惯化恢复/概率放弃应另开一项，不与这次小修混在一起。
