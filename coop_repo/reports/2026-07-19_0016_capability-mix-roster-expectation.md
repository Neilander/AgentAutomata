# Agent Handoff: 三标尺配比驱动换人预期

- Date: 2026-07-19
- Agent/thread: root
- Scope: 让Agent按当前问题给出输出、保护、增益的临时配比，并用同一配比生成和结算换人预期
- Status: complete

## User Intent

用户确认换人不应该永远只看输出，也不应该要求Agent固定选择唯一标尺。一个关卡通常同时需要输出、保护和增益，只是配比不同；Agent应判断当前问题的大概配比，程序据此形成换人预期。

## Completed

- 保留三个角色能力标尺的独立状态，不新增永久综合分。
- 正式换人请求对每个已知一人替换提供输出、保护、增益三条差值和三个单轴情景。
- 一人换人缺少精确历史时，正式请求不再提前给一个综合数值预测。
- Agent为本次问题返回三个 `0–10` 粗整数权重；程序校验至少一项大于零并归一化。
- 程序用归一化权重加权三条能力差，再加已有的当前环境特点修正，形成该次换人的临时预测。
- `2:7:1` 与 `4:14:2` 这类同比例输入产生相同结果；数值表达的是比例，不是三个角色评分。
- 任一正权重能力缺少角色认知证据时，预测保持未知，不把未知当零，也不退回旧综合分。
- 已有同关卡、同队伍、同装备的精确历史仍优先于反事实配比估算。
- 选择换人时，程序把原始配比、归一化配比、加权能力差、特点修正、预测分和证据信心一起冻结到A账本。
- 后续战斗使用冻结记录结算；A、确认感C、明显失败C归零、新关惯性和换装规则本身没有修改。
- 正式接口会拒绝“已知角色的一人反事实换人但没有配比”的Agent响应，防止静默退回旧路径。
- 更新中文设计合同、运行时说明、实验README、运行时版本和任务板证据。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/roster-change-expectation.js`：新增配比校验、归一化、三维投影、单轴情景和正式数值延迟。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：向正式Agent声明配比合同，校验响应并把配比交给冻结链路。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/roster-expectation-a.js`：冻结和结算同一份配比投影及三维证据信心。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-roster-capability-mix-expectation.js`：新增纯轴、混合、同比例、缺失证据、非法输入和三感知档专项。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-player-agent-roster-a-integration.js`：验证正式请求延迟数值、缺配比拒绝、配比冻结和真实A结算。
- `projects/western_fantasy_continent/design/INDEPENDENT_CHARACTER_CAPABILITY_RULERS_V1.md`：记录临时配比与A/C边界。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`、`player_model_runtime.json`：更新当前可执行合同和版本。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：更新正式换人链路说明和验证入口。
- `projects/western_fantasy_continent/design/task-budget-board.json`：补充三标尺配比接入证据。

## Validation

- 三标尺配比专项：PASS。
  - 纯输出差值 `4`，预测分 `0.08`。
  - 纯保护差值 `8`，预测分 `0.56`。
  - `输出3 / 保护6 / 增益1` 的加权差值为 `5.8`，预测分 `0.296`。
  - 同比例缩放结果一致。
  - 正权重增益缺证据时返回 `insufficient_axis_evidence`，预测分为 `null`。
  - 全零、非整数、越界权重均被拒绝。
  - 普通、熟悉、专家三档都冻结同一个客观预测；感知档只作用于之后的认知量化。
- 正式玩家循环换人A接线：PASS。
  - 请求阶段的反事实预测为 `null`，且单轴情景可见。
  - 缺少配比的正式响应被拒绝。
  - 纯输出配比 `10/0/0` 冻结后，预期分 `0.725`、实际分 `0.76`，预期与实际都落在等级7，A为 `0.0022`。
- `verify-causal-loop.js`：PASS。
- 旧换人预测、连续边界、换人A、确认感C、换装、新关惯性、信息整理和三块认知组合回归：全部PASS。
- 三套独立能力认知专项：PASS。
- JavaScript语法、任务板JSON和运行时JSON：PASS。
- `independent_review`：未运行。本次是确定性接口与公式接线，不是新的长程真实Agent行为结论。

## Current State

正式Agent换人时已经不是只按输出，也不是按旧综合分。它先依据玩家可见问题给本次需求配比，例如 `输出2 / 保护7 / 增益1`；程序再用三个角色标尺的对应差值形成一个只属于这次换人的预期，并把同一配比锁进A账本。

角色长期认知仍是三个独立坐标。临时配比不会反写角色强度，也不会影响下一关；下一关的问题不同，Agent可以给另一套配比。

## Unresolved

- `0–10` 只是让Agent稳定表达粗比例的接口尺度，尚未用真实玩家判断记录校准配比偏差。
- 三维认知到战斗表现的映射系数仍是V1序数假设，不是胜率模型。
- 已经通过的换装重算仍复用旧的通用基础强度乘装备倍率助手。初始换人预期已完全由三标尺配比产生，但“换人后又换装”的二次重算还没有改成三维装备作用模型。
- 未知新角色没有能力证据时仍不建立数值预测，这是刻意的信息边界，不是零强度。
- `agent-hypothesis-target-condition-contract` 仍是任务板下一项Bug。

## Recommended Next Step

按任务板修复 `agent-hypothesis-target-condition-contract`。三标尺与换人配比先冻结；除非要专门研究“装备分别怎样改变输出、保护、增益”，不要顺手改动已经通过的换装重算。
