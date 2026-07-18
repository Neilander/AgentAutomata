# Agent Handoff: 信息呈现档位 V1 冻结

- Date: 2026-07-17
- Agent/thread: Codex `/root`
- Scope: 玩家可见信息的呈现档位、感知校准、当前认知运行时接入和前端契约
- Status: complete

## User Intent

把无法可靠深入建模的“画面显眼程度、清晰度”收敛为少数几个可控制的信息档位。先用当前玩家感知模型校准并验证档位数值，再把数值冻结成程序和人类前端设计师共同遵守的接口。

## Completed

- 冻结 `information_presentation_tier_v1` 四档契约：
  - `blocking = 1.00`：必须接收，需要独占或确认。
  - `highlight = 0.95`：保留给关键变化，不保证所有玩家都接收。
  - `standard = 0.60`：普通战斗反馈。
  - `ambient = 0.25`：可错过的伴随信息。
- 档位值表示“呈现证据强度”，不是玩家接收概率；最终接收仍由玩家感知类型、目标关联、事件显著性、注意竞争和重复共同决定。
- 战斗信号、地图奖励、角色解锁、装备成长、队伍变化和玩家循环事件均开始携带同一份档位契约。
- 战斗信息解析器不再读取字体、颜色、动画等临时默认值来猜测清晰度，改为只读明确档位。
- 当前 V3 玩家认知运行时改用同一档位；`blocking` 在感知门槛之后仍强制接收。
- `action_summary` 和 `team_experiment_result` 被明确为系统内部结算语义，绕过玩家感官筛选，防止界面档位改变内部期待结算。
- 新增正式校准测试，覆盖同一信号换档、三类玩家、重复出现、信息拥挤、真实 355 事件战斗、奖励映射和当前运行时。
- 新增中文前端/程序共同契约，给出每档用途、禁用方式、事件映射和版本变更规则。

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-signals.js`：定义并导出冻结档位契约及战斗信号映射。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：以档位替代字体/颜色/动画推断。
- `projects/western_fantasy_continent/game_data/player-cognition-v3-event-runtime.js`：当前认知运行时接入档位和强制接收规则。
- `projects/western_fantasy_continent/game_data/map-cognition-v1-event-adapter.js`：战斗结果、掉落和角色解锁档位。
- `projects/western_fantasy_continent/game_data/map-cognition-v2-event-adapter.js`：装备成长档位。
- `projects/western_fantasy_continent/game_data/map-cognition-v3-event-adapter.js`：换人与实验结算档位。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：地图解锁和装备操作档位。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-information-presentation-tiers.js`：档位校准与回归测试。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-battle-information-parser.js`：更新正式解析器断言。
- `projects/western_fantasy_continent/design/INFORMATION_PRESENTATION_TIER_CONTRACT.md`：中文冻结契约和前端规则。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：登记运行时契约。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：登记解析器契约。
- `projects/western_fantasy_continent/design/task-budget-board.json`：记录档位完成证据和仍待接 Agent 的边界。

## Validation

- 四档同一信号的普通玩家单次接收概率依次为：
  - `ambient 0.1821`
  - `standard 0.2482`
  - `highlight 0.3286`
  - `blocking` 诊断概率 `0.3411`，但契约强制接收。
- 同一条 `standard` 治疗信息单次出现时，低/普通/高感知玩家分别为 `0.1035 / 0.2482 / 0.4854`；重复六次后至少接收一次的概率为 `0.3770 / 0.7091 / 0.9437`。
- 五条普通伤害信息分散出现与挤在一起时，注意可用度从 `1.0000` 降至 `0.4126`，说明前端堆叠信息确实会被模型惩罚。
- 真实 355 事件战斗的非锚点长期接收均值为低/普通/高感知 `0.2449 / 0.4875 / 0.7524`，基本对齐目标 `25% / 50% / 75%`。
- 五组候选数值横向扫描中，冻结方案目标误差为 `0.000188`，小于其余四组候选。
- 完整回归通过：档位校准、战斗信息解析、玩家认知 V1/V2/V3、角色尝试、玩家假设、换人预期 A、确认感 C、装备预期、关卡惯性、两章富化、因果闭环和游戏数据验证。
- JavaScript 语法检查、任务板 JSON 解析和 `git diff --check` 均通过。

## Current State

模型现在不再要求游戏先精确量化“这个动画有多亮、字号有多大”。游戏只需要给每条玩家可见信息标四档之一，认知模型会把档位与玩家差异、事件语义、注意拥挤和重复次数组合起来计算。

四档数值可作为 V1 冻结基准。前端可改变具体字体、颜色和动画风格，但必须保持档位之间的注意层级和容量约束，尤其不能把大量普通信息都做成 `highlight`。

## Unresolved

- 战斗信息解析器仍未正式接入真实 Agent 请求；当前任务板继续保持 active，不能宣称“玩家只收到筛选后信息”的整条产品链已经闭合。
- 旧 V1/V2 认知运行时保留历史实现；当前正式 V3 运行时和新解析器已统一档位。
- 尚未逐页审计现有前端是否真的符合四档视觉层级。契约已可供前端改造使用，但视觉实现需要另做验收。
- `blocking` 使用过多会绕过玩家差异并制造强制打断，必须保持稀缺。

## Recommended Next Step

把战斗信息解析器接到真实 Agent 请求入口，删除原始 diagnosis 直达知识的旧入口；随后选一个真实战斗前端，按四档契约做一次视觉改造和拥挤度验收。
