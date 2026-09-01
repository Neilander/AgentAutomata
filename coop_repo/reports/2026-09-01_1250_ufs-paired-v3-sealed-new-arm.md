# Agent Handoff: UFS配对V3封存新版本臂

- Date: 2026-09-01
- Agent/thread: Codex `/root/paired_new_arm`
- Scope: 在冻结共享协议下，用现有V2自动多切入口控制器从fresh隔离session连续运行3回合，为后续原版本臂建立不可变配对输入
- Status: complete

## User Intent

新版本玩家与原版本玩家分别由独立子Agent运行并只通过报告交付。本文只封存新版本臂：相同公开初态、地图、注意seed和随机流，连续完成3回合；不得在看结果后调整控制器，也不在旧版本臂完成前声称相对优势。

## Completed

- 新建独立实验根`ufs_automatic_vs_original_paired_v3`，未修改旧V2证据或旧实验。
- 在运行前冻结共享`PAIR_PROTOCOL.json`，SHA-256为`5b84f209dd3704044bbbdf326d9ad35f2a70ecdf4e5a45b287d6b2b258f4a8eb`：
  - `public_initial_state.json` SHA-256 `584765c4b0e4a6a2e802ddfd6f7838c444a082eedf67fcaeba6ea62b4b23e8bd`；
  - `public-map.js` SHA-256 `a8d20066fc2f74aa3a94f08ba762f539231daaf4095f8b0388aae138340dc7c4`；
  - 注意seed `2026090102`；
  - xorshift32，initial seed `0x5f3759df`；
  - 每个公开pending合同严格按公开ID顺序消费随机流。
- 新臂使用封存的V2 `automatic-multicutpoint-controller`，SHA-256 `7ca4533e4fd4a69e649585e3dd7ec0deb760d7eb62942f3328eabeeac4cdef85`，所有候选仍经过真实`imagineSequentialPlan()`。
- fresh session连续完成3个`waiting_for_next_round_roll`安全边界；只在这些边界检查正式host，审计结果不回流规划。
- 生成可重放机器证据、单独随机draw tape、最终checkpoint、聚焦验证器和臂内结果说明。
- 30个规划切点、72个自动设想候选、30个真实控制器动作；每个动作均为最新Q规划的step 0并带自动Q/轨迹证据。
- 6次白骰随机边界全部为`paused_random → 外部真实draw → 丢弃旧后缀 → 更高Q revision重新规划`。
- 31个随机draw全部记录全局ordinal、value、绑定ID、合同类型、回合和stateAfter；其中包括第2、3回合的正式round-roll合同。
- 验证确认：0手写中间Q、0规划内随机、0 live拒绝、3/3安全边界。

## Formal Boundary Outcomes

| 回合 | 能源 | 研究 | 伤害 | 母舰行 | 最高飞船行 | 飞船总行 |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 5 | 1 | 0 | 1 | 5 | 7 |
| 2 | 2 | 4 | 0 | 2 | 9 | 19 |
| 3 | 1 | 4 | 0 | 3 | 10 | 37 |

这些是新臂自身的封存结果，不是对照结论。飞船威胁累积仍然明显；在旧臂独立封存前不能解释为相对好坏。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/PAIR_PROTOCOL.{json,md,sha256}`：不可变共享输入、资产/控制器身份和防调参边界。
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/new-arm/run-new-arm.js`：fresh三回合V2新臂、随机带和边界审计。
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/new-arm/verify-new-arm.js`：冻结hash、自动Q、随机消费、重规划、live接受和安全边界验证。
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/new-arm/RESULTS.md`：新臂内结论与诚实边界。
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/new-arm/evidence/{machine-evidence.json,random-draw-tape.json,final-checkpoint.json}`：封存机器证据。

## Validation

- `node projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/new-arm/run-new-arm.js`: PASS，3/3回合，31 draws。
- `node projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/new-arm/verify-new-arm.js`: PASS；30 planning events、72 candidates、30 controlled actions、6 random replans、0 rejected/manual-Q/planned-random。
- `git diff --check -- projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3`: PASS。

## Current State

新版本臂已经在冻结配对输入上封存，且臂内完整性闸门通过。它严格复现现有V2行为，没有修改控制器、评分、核心runtime、初始化器或冻结资产。

## Unresolved

- 原版本臂尚未在本文范围内完成，因此不能比较收益、威胁或声称新版本优势。
- 配对可比性最终还要求旧臂的随机tape按公开pending合同消费，并由主Agent检查两臂共享前缀和合同差异；不同策略可能产生不同pending ID，不能仅比较无绑定的裸点数序列。
- 本臂的attention-limited认知集合差异仍沿用V2已知边界；关键标量在三个安全边界一致。

## Recommended Next Step

后续旧版本臂必须严格读取`PAIR_PROTOCOL.json`、`PAIR_PROTOCOL.sha256`和冻结共享资产，先选定并封存原版本策略，再运行；**不得读取`new-arm/RESULTS.md`、`new-arm/evidence/`或本报告来调整策略**。旧臂报告完成后，主Agent再只读两份独立报告和机器证据进行配对比较。
