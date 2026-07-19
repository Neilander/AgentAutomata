# Agent Handoff：75%/50%/25%血量感知证据

- Date: 2026-07-19
- Agent/thread: Codex `/root`
- Scope: 为因果辅助证据增加玩家可见的血条跨档状态
- Status: complete

## User Intent

补充血量感知，使玩家能够感知角色血条经过 75%、50%、25% 等关键区间，从而验证狂战低血量等需要状态前因的完整因果链。

## Completed

- 第一章和第二章战斗核心保留内部血量快照，但不把连续 HP 数字直接暴露给玩家模型。
- 公共事件适配器把连续快照压缩成三种向下跨档事件：
  - 75%：`standard_low`
  - 50%：`standard_high`
  - 25%：`highlight`
- 角色停留在同一血量区间时不会重复产生证据。
- 角色回血越过某条边界后，再次跌破该边界会重新产生证据。
- 一次大伤害跨过多条边界时会保留每条跨档事实。
- 解析器把跨档事件转为 `health_dropped_below` 因果证据以及 `health_75`、`health_50`、`health_25` 限定词。
- 血量证据只进入因果辅助通道：不进入普通观察、不写入因果知识、没有直接结果情绪，也不泄漏 `hp`、`maxHp` 或战斗内部单位编号。
- 狂战案例现在可以确认完整路径：进入 25% 血量 → 血怒增伤 → 击杀目标 → 队伍胜利。
- 可执行运行时清单升级到 `player_agent_api_loop_v1_health_threshold_causal_evidence_v25`。

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`：第一章分析结果保留最小血量快照。
- `projects/western_fantasy_continent/map_progression_lab/map-progression-chapter2-core.js`：第二章使用相同快照合同。
- `projects/western_fantasy_continent/game_data/map-cognition-v1-event-adapter.js`：统一生成 75%/50%/25% 血条跨档事件。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：生成公开血量因果证据。
- `projects/western_fantasy_continent/game_data/causal-chain-event-matcher.js`：允许血量谓词和三个档位限定词。
- `projects/western_fantasy_continent/game_data/test-health-threshold-causal-evidence.js`：新增跨档、去重、回血重入、多档跳跃、三档感知、两章入口、知识隔离和狂战链测试。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`、`player_model_runtime.json`：更新当前可执行合同。
- `projects/western_fantasy_continent/design/task-budget-board.json`：关闭血量前因缺口。

## Validation

- `node projects/western_fantasy_continent/game_data/test-health-threshold-causal-evidence.js`：PASS。
  - 500 个种子中，25%事件的低/普通/高感知接收率为 0.182 / 0.388 / 0.640。
  - 所有血量档都满足高感知 > 普通感知 > 低感知。
  - 每种感知玩家都满足 25% > 50% > 75%。
  - 第一章与第二章新战斗都产生血量跨档事件。
  - 狂战完整低血量因果链为 `confirmed`。
- 跨职业真实存档测试：PASS。
- 原 16 个结构化匹配器案例：PASS。
- 因果证据通道与战斗信息解析器回归：PASS。
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`：PASS；正式两周期、知识合并和显式换装无回归。
- `git diff --check`：PASS。

## Current State

此前狂战只能证明“血怒出现后发生了什么”；现在可以把玩家实际感知到的低血量状态放在链首。血条仍然是玩家可见状态而不是知识：只有当前假设需要验证时，收到的跨档事实才供匹配器使用。

本次没有把新 EVerify 接入正式运行时。当前隔离候选只剩一个主要接入前条件：战前 Agent 必须取得与战后证据相同的公开技能指纹，才能预先写出可匹配的具体技能链。

## Unresolved

- 当前只生成向下跨档证据；回血只负责重新激活下一次向下跨档，没有单独生成“恢复到 50% 以上”等向上证据。
- 三档接收率来自当前冻结感知模型和程序种子，不是人类实验校准值。
- 一次伤害跨越多个档位会在同一时间产生多条状态事实；这能保留玩家看见的血条跨度，但不能被解释为三个互相导致的因果步骤。

## Recommended Next Step

把角色技能列表中的每个可见技能同步映射为当前 `visible_action:<hash>`，提供给战前 Agent 的 causalChain 合同。完成“战前能引用、战后能匹配”后，再接正式 EVerify。
