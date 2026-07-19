# Agent Handoff：正式结构化EVerify接线

- Date: 2026-07-19
- Agent/thread: Codex `/root`
- Scope: 把战前Agent技能因果链、战后玩家已接收证据、EVerify反馈和因果学习接成正式闭环
- Status: complete

## User Intent

在血量和跨职业证据已经验证后，接通正式运行时并测试：Agent能在战前引用具体公开技能，战后由真实战斗证据验证完整因果链，确认、证伪和证据不足不能混淆。

## Completed

- 新增共享公开因果标识模块。战前技能目录和战后证据解析器现在使用同一个哈希入口。
- 正式决策请求为每个角色增加：
  - `causalRef`：稳定、不透明的公开角色引用；
  - `visibleSkills`：玩家可见技能名称、说明、槽位和 `visible_action:<hash>`；
  - 不提供内部技能键。
- 正式假设合同支持至少三步的 `causalChain`，每步只允许既有的 predicate/ref/qualifier/environment DSL；自然语言说明不参与程序匹配。
- 结构化假设不再被旧 `targetCondition` 代理提前结算；旧假设路径仍兼容。
- 战斗结束后，正式循环把独立因果证据送入匹配器和EVerify：
  - 完整顺序链确认；
  - 显式相反结果或时序错误证伪；
  - 缺步骤保持无法判断；
  - support和strength完全由程序生成。
- EVerify输出进入已有反馈模块，和R、A保持分离。
- 整条链及已经确认/证伪的相邻局部链更新为上下文相关因果知识；证据不足不更新。
- novelty和closure继续固定为0，没有顺带开发延期模块。

## Files Changed

- `projects/western_fantasy_continent/game_data/public-causal-identifiers.js`：共享公开角色/技能标识。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：战后证据复用共享标识。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：战前公开技能合同、结构化假设验证和战后正式结算。
- `projects/western_fantasy_continent/game_data/player-cognition-v3-event-runtime.js`：结构化EVerify反馈、情绪轨迹和因果知识更新。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-formal-structured-causal-agent-loop.js`：确认、证伪、证据不足三种正式端到端案例。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-target-condition-contract.js`：旧合同与新结构化例外并存。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`：角色公开技能字段回归。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`、`player_model_runtime.json`：当前可执行合同升级到V26。
- `projects/western_fantasy_continent/design/task-budget-board.json`：记录正式接入结果和下一步。

## Validation

- 正式端到端专项：PASS。
  - “重击施放→重击伤害→胜利”：三步均 observed，整链 confirmed。
  - 战前与战后的重击 `visible_action` 完全一致，战前请求中不存在内部 `powerStrike`。
  - 确认链产生 `0.024` EVerify策略反馈，并更新整链及两条局部因果知识。
  - 把末步故意写成“失败”：前两步 observed、末步 contradicted，整链 refuted，策略反馈为0。
  - 引用未上场鼓手技能：前两步 unknown、胜利 observed，整链 inconclusive，知识更新为0。
- 旧 `targetCondition` 正式合同：PASS。
- 正式两周期循环与显式装备：PASS。
- 因果证据通道和接收信息整理器：PASS。
- 75%/50%/25%血量证据专项：PASS。
- 跨职业7场正反例：PASS。
- 16例结构化匹配器：PASS。
- JSON解析与 `git diff --check`：PASS。

## Current State

正式运行时已经完成“战前可引用→战后同标识匹配→EVerify结算→反馈与学习”的程序闭环。旧目标条件路径没有删除，结构化链是更强的新路径。

## Unresolved

- 本轮使用的是严格按正式请求生成的确定性Agent格式响应，用来验证程序闭环；尚未调用外部真实模型检查它是否会自然、稳定地提出高质量因果链。
- 当前正式专项用战士重击覆盖正/反/缺证据；骑士、牧师、游侠、狂战等已在真实存档的匹配器层验证，但还没有各自跑一次正式Agent决策层。
- 重复提出已证伪假设后的决策折扣仍是主任务中的后续项。
- novelty和closure按用户决定继续为0。

## Recommended Next Step

用2到3个不同玩家档和不同角色，让真实Agent读取新请求并自行决定是否提出因果链；统计合法率、链条质量、确认/证伪/无法判断比例，以及下一次决策是否实际引用新因果知识。
