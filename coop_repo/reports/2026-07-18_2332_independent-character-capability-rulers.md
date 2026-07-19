# Agent Handoff: 角色输出、保护、增益三套独立标尺

- Date: 2026-07-18
- Agent/thread: root
- Scope: 将角色认知从单一综合强度扩展为Agent按需求取用的三套独立标尺
- Status: complete

## User Intent

用户不希望系统把输出、保护和支援硬压成一个综合角色分。角色应分别拥有输出、保护和增益认知，三套标尺互不影响；Agent先判断当前关卡的问题，再自行选用相关标尺。

## Completed

- 在现有角色富集矩阵上新增 `output`、`protection`、`buff` 三套独立同步矩阵。
- 每套矩阵独立维护角色位置、证据数、刚度、本场相对变化、前30%标尺边界、相对位置、等级和排名。
- 一场战斗只有在该维出现玩家已接收的可见贡献时才更新；没有展示的维度完全不动。
- 输出使用有效伤害；保护使用有效治疗、可见护盾、吸收/格挡和明确防止的伤害；增益只使用角色施加给其他队友的可见正面状态。
- 敌方减益、控制和角色自我强化不混入团队增益标尺，仍由特点知识负责。
- 正式Agent请求中的 `characterImpressions` 只暴露三套独立标尺，不再暴露综合角色分；指令要求先识别问题，再选择相关维度，禁止平均或自动合成。
- 历史战斗的四人站位快照现在保存当时三套认知坐标，知识检索会用玩家可读语言交给Agent。
- 换人候选新增三条能力差，供Agent按需求选人。
- 旧综合矩阵只作为内部兼容面保留，避免改坏已经通过的换人A；本次没有修改A、C、换装重算和新关惯性算法。
- 更新可执行玩家模型文档、运行清单、实验README、任务板和中文设计说明。

## Files Changed

- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/entity-impression-model.js`：三套独立能力贡献、矩阵更新、迁移和查询接口。
- `projects/western_fantasy_continent/experiments/entity_impression_knowledge_v1/test-independent-capability-cognition.js`：独立标尺专项配对。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：正式Agent请求和历史战斗接线。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/received-information-organizer.js`：保留历史三套坐标。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/knowledge-retrieval.js`：把历史三套坐标翻译成玩家可读事实。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/roster-change-expectation.js`：向换人候选附加三维差值，不改A结算。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`：正式请求与历史知识回归。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-isolated-player-cognition-composition.js`：真实22场牧师输出/保护分离断言。
- `projects/western_fantasy_continent/design/INDEPENDENT_CHARACTER_CAPABILITY_RULERS_V1.md`：中文设计合同。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`、`player_model_runtime.json`：更新当前可执行入口和版本。
- `projects/western_fantasy_continent/design/task-budget-board.json`：将三标尺任务标记完成。

## Validation

- 独立专项：PASS。
  - 第一场中烈刃领跑输出、壁垒领跑保护、号角领跑增益。
  - 第二场只有输出信号，只更新输出矩阵；保护和增益矩阵序列化结果逐字节不变。
  - 旧状态没有三套矩阵时可自动迁移，不伪造历史证据。
- 正式两周期 `verify-causal-loop.js`：PASS。
  - 正式与压缩请求均保留三套角色认知。
  - 历史关卡知识保留四人站位及当时三套坐标。
  - Agent请求不含综合角色认知。
- 真实22场 `test-isolated-player-cognition-composition.js`：PASS。
  - 22/22场角色、非角色知识和换人预期仍保持隔离。
  - 最终晨祷牧师的保护位置和相对标尺均高于输出，低伤害不再压低保护认知。
- 旧角色认知、原同步矩阵、信息整理和三块组合回归：PASS。
- 换人预测普通/熟悉/专家、连续换人边界、真实Agent A接线：PASS。
- 换人A负/零/正、确认感C、明显失败C归零、换装重算、新关惯性：PASS。

## Current State

角色认知已经变成Agent可按需求查询的独立能力向量，而不是系统预先合成的综合排名。牧师可以同时是输出弱、保护强；坦克和支援不再因为低伤害被整体标成垃圾。新的强输出只拉动输出标尺，新的强保护只拉动保护标尺。

正式Agent会看到每个角色三套位置、标尺和证据，并被要求先识别“伤害不足、生存不足或需要放大队伍”，再选择对应角色。技能特点仍是更细的环境证据，不与三套标尺重复承担同一职责。

## Unresolved

- 保护只认玩家能够归因的治疗、护盾和明确减伤；纯粹站着承伤但没有可见保护因果时不会自动加分。
- 增益当前使用可见正面状态的幅度或持续时间作为代理，尚未做人类幅度标定。
- 旧综合矩阵仍在内部服务已经验证的换人A预测兼容路径，但不再暴露给Agent。以后若要让A也按Agent选择的需求维度预测，应另开专项，不在本次顺手重写。
- `targetCondition`正式合同与运行时字段不一致仍是下一项Bug。

## Recommended Next Step

修复 `agent-hypothesis-target-condition-contract`，统一正式请求、示例、压缩请求和运行时的条件字段。三标尺本身先冻结，不继续调参。
