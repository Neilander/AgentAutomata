# Agent Handoff: 三标尺换人后的换装重算修复

- Date: 2026-07-19
- Agent/thread: root
- Scope: 清除三标尺配比换人记录在后续换装时对旧综合强度的依赖
- Status: complete

## User Intent

用户确认上轮最小案例暴露的问题需要直接修复，并要求继续使用小案例验证，不跑完整多玩家或两章模拟。

## Completed

- 只修改换装重算的分流点。
- 如果待结算换人预期来自三标尺配比：
  - 保留冻结的输出/保护/增益配比；
  - 从冻结的混合战斗预测换算成战斗进度；
  - 用装备总强度比例缩放该进度；
  - 再换回战斗表现分；
  - 完全忽略旧综合角色强度。
- 如果记录来自旧的非配比兼容路径，原来的基础强度或战斗进度重算保持不变。
- 换装审计记录新增重算依据、冻结配比、换装前后进度和换装前后表现分，后续可以直接判断走了哪条路径。
- A、确认感C、感知分档和新关惯性均未修改。
- 更新运行时合同、中文设计说明、实验README、运行时版本和任务板证据。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/roster-expectation-a.js`：配比预测换装重算改用冻结混合进度，禁止读取旧综合强度。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/audit-capability-mix-equipment-rebase.js`：把诊断案例升级为修复回归。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：记录配比换装路径与旧兼容路径边界。
- `projects/western_fantasy_continent/design/INDEPENDENT_CHARACTER_CAPABILITY_RULERS_V1.md`：补充换装继续沿用冻结配比。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：更新正式接线与验证命令。
- `projects/western_fantasy_continent/player_model_runtime.json`：版本更新为V21。
- `projects/western_fantasy_continent/design/task-budget-board.json`：记录偏差归零证据。

## Validation

- 没有运行完整地图、多玩家或两章模拟。
- 配比换装最小案例：PASS。
  - 两例的需求均为 `输出2 / 保护7 / 增益1`。
  - 三维加权差均为 `6.2`，初始换人预测均为 `0.344`。
  - 两例只让旧综合强度分别为 `2` 和 `8`。
  - 相同25%装备提升后，两例都从 `0.344` 变为 `0.68`。
  - 原来的 `0.18` 无关偏差变为 `0`。
  - 审计明确记录 `rebaseBasis = frozen_capability_mix_prediction_progress`。
- 原确认感、换装与新关惯性公式专项：PASS。
  - 旧兼容案例仍保持基础强度 `5 × 2 = 10`，预测分 `0 → 0.6`。
- 原换人A公式专项：PASS。
- JavaScript语法、任务板JSON和运行时JSON：PASS。
- `independent_review`：未运行；本次是确定性公式修复，不是玩法或真实Agent轨迹。

## Current State

正式三标尺链路现在完整一致：

```text
Agent给当前需求配比
→ 程序形成并冻结混合换人预测
→ 如果随后换装，装备倍率作用于这份冻结的混合预测
→ 同一份预测进入A结算
```

旧综合强度不再进入正式配比换人的初始预测，也不再进入其后续换装重算。

## Unresolved

- 当前装备系统只提供一个装备总强度比例，所以本次是在冻结的混合战斗进度上整体缩放。
- 装备词条尚未拆成输出、保护、增益三种独立作用；如果以后前端和装备系统能提供这类可见信息，可以再做更细的三维换装认知。
- 本轮按用户要求没有跑完整模拟；如果以后修改正式玩家循环其他部分，再运行入口全回归。

## Recommended Next Step

这条问题可以关闭。继续任务板下一项 `agent-hypothesis-target-condition-contract`；不要为当前没有的数据虚构装备三维词条效果。
