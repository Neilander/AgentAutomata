# Agent Handoff: 信息呈现八档连续标尺 V2

- Date: 2026-07-17
- Agent/thread: Codex `/root`
- Scope: 将四档信息呈现扩展为适合复杂界面的连续档位，并重新校准完整玩家认知
- Status: complete

## User Intent

旧四档跨度太大，复杂界面难以表达多个普通信息之间的层级。需要增加常规信息档位，使前端能使用更连续的标尺，同时保证现有玩家感知模型仍符合低/普通/高感知差异。

## Completed

- 契约升级为 `information_presentation_tier_v2`。
- 冻结八档标尺：
  - `background = 0.25`
  - `ambient = 0.40`
  - `standard_low = 0.50`
  - `standard = 0.60`
  - `standard_high = 0.70`
  - `prominent = 0.80`
  - `highlight = 0.90`
  - `blocking = 1.00`，强制接收
- 主界面七档从 `0.40` 到 `1.00` 每 `0.10` 等距；`0.25` 单独保留给允许明显错过的纯背景信息。
- 战斗默认映射覆盖全部层级：动作残影/持续小反馈、普通技能、普通伤害、治疗护盾、重要状态、角色倒下、焦点机制、强制结算逐级上升。
- 掉落、装备成长、队伍变化和地图入口也改用新档位。
- 修复解析器“寻找最强档位”时以旧 `ambient` 为最低值的问题，最低初始值改为 `background`。
- 中文前端契约已重写为 V2，明确每档用途、容量限制和禁止私调小数规则。

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-signals.js`：八档唯一数值源、V2 schema 和战斗默认映射。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：新层级语义映射与最低档修复。
- `projects/western_fantasy_continent/game_data/map-cognition-v1-event-adapter.js`：奖励和内部摘要映射。
- `projects/western_fantasy_continent/game_data/map-cognition-v2-event-adapter.js`：装备成长映射并引用唯一 schema。
- `projects/western_fantasy_continent/game_data/map-cognition-v3-event-adapter.js`：队伍变化映射并引用唯一 schema。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：地图、装备操作与摘要映射。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-information-presentation-tiers.js`：八档连续性、扫参与完整校准测试。
- `projects/western_fantasy_continent/design/INFORMATION_PRESENTATION_TIER_CONTRACT.md`：V2 中文程序/前端共同契约。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`、`experiments/player_agent_api_loop_v1/README.md`、`design/task-budget-board.json`：登记 V2 当前状态。

## Validation

- 同一条信息逐档测试时，低/普通/高感知玩家的接收概率均严格单调上升，相邻档没有超过 `0.06` 的概率突跳。
- 普通玩家同一条信息的各档基础接收概率依次为：
  - `18.21% / 20.86% / 22.78% / 24.82% / 26.97% / 29.25% / 31.63%`
  - `blocking` 最终强制为 `100%`
- 真实 355 事件战斗的非强制长期均值为低/普通/高感知 `24.23% / 48.48% / 75.32%`，继续对齐 `25% / 50% / 75%` 目标。
- 等距冻结方案目标误差 `0.000301`。
- 针对单一样本优化到不规则数值 `0.44 / 0.5333 / 0.6267 ...` 可把误差降到 `0.000161`，但收益很小且难供前端稳定执行，因此明确拒绝过拟合方案。
- `standard` 单次与六次重复、分散与拥挤测试维持原行为：重复六次为 `37.70% / 70.91% / 94.37%`，拥挤使注意可用度从 `1.0000` 降至 `0.4126`。
- 完整回归全部通过：
  - 信息档位与战斗解析器
  - 玩家认知 V1/V2/V3
  - 角色尝试和玩家假设
  - 换人预期 A、确认感 C
  - 装备预期、关卡惯性
  - 两章富化、因果闭环和游戏数据
- JavaScript 语法、任务板 JSON 和 `git diff --check` 通过。

## Current State

复杂界面可以在“普通信息”内部使用 `standard_low / standard / standard_high` 三档，在其上下还有 `ambient`、`prominent` 和 `highlight`。人类设计师无需计算感知概率，只需按照八档契约维护视觉相对关系。

选择等距十进制档位是有意的工程取舍：它不是对单场战斗的最小数学误差，但误差已经足够低，并且比不规则小数更容易被程序、策划和前端长期一致执行。

## Unresolved

- 信息解析器仍未正式接到真实 Agent 请求入口，原始 diagnosis 入口尚未移除。
- 尚未对一个实际复杂前端逐元素标注八档并做视觉拥挤验收。
- 高档位滥用仍会破坏界面层级；模型会惩罚拥挤，但不能替代前端设计纪律。

## Recommended Next Step

选取信息最复杂的一张真实战斗界面，按 V2 八档给所有可见元素标注并检查同屏容量；通过后再把解析器接入真实 Agent 请求。
