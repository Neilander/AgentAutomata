# Agent Handoff: 15 日程序 Demo 与两轮密封试玩

- Date: 2026-07-24
- Agent/thread: Codex `/root`
- Scope: 《我的超能力是无限刷装》15 日纯程序 Demo、正式玩家 Agent 循环与两轮修订
- Status: complete

## User Intent

在不制作网页的前提下，把五日原型扩展为 15 日可玩程序：降低开局拥挤、让节点显示当前事项数、继续少爷之后的局势、逐步扩编角色，并实际跑通 10v10/20v10。每轮 Agent 试玩前审查输入泄露，第一轮后按反馈修订，再用全新密封玩家复测。

## Completed

- 新建三幕 15 日程序核心：第 5 日家兵、第 10 日执法联军、第 15 日围剿联盟。
- 开局压到 2 个事件节点；当前地点显示 `actionCount`，事件时间窗错开，未来节点和锁的完整解法不进入玩家输入。
- 增加约 30 个事件、13 名总角色、4→10 人出战上限、三档刷装区、身份装备主动换装与最低价值材料消耗。
- 接入现有共享团队战斗模拟器；两轮自然路线实际产生 4v6、10v10、20v10，不使用标量战力判定。
- 失败继续改变局势；政治准备满足后才出现撤军行动。
- 修复第一轮发现的首幕难度悬崖、战斗胜负措辞、重复战斗摘要、技能空描述、空行动点、终局 AP、身份换装与材料误吞。
- 最终战现在提前显示交战人数与盟友来源；战后显示伤害、治疗、护盾和最高伤害成员。
- 正式循环 v2 保存每回合选择前完整可见 observation/actions 和认知证据；最终输入进一步移除非必要角色/物品/地点/知识内部 ID，并保留 exact selected action ID 审计字段。
- Round 1 `open_novice`：75 cycles，第一幕战败，第二/三幕政治胜利；独立审查因 v1 trace 不可审计而 `REJECT`。
- Round 2 `damage_absolutist`：79 cycles，三幕正面胜利；4v6 为 3/4 存活，10v10 为 10/10，20v10 为 20/20。v2 边界审查确认 79/79 选择前输入齐全且未见未来事件泄露，但因细粒度认知/情绪结算不完整仍 `REJECT`。

## Files Changed

- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-core.js`: 15 日权威游戏状态、事件、掉落、编队和真实战斗。
- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-formal-player-loop.js`: 密封决策/归因循环与可审计可见 trace。
- `projects/western_fantasy_continent/fifteen_day_demo/fifteen-day-formal-player-cli.js`: Agent 试玩 CLI。
- `projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-demo.js`: 程序、密度、战斗规模与平衡回归。
- `projects/western_fantasy_continent/fifteen_day_demo/verify-fifteen-day-input-boundary.js`: 正式输入边界与 trace 完整性回归。
- `projects/western_fantasy_continent/fifteen_day_demo/playtests/round1_final/`: 第一轮权威 session 与玩家可见 trace。
- `projects/western_fantasy_continent/fifteen_day_demo/playtests/round2_combat/`: 第二轮权威 session、初始请求与 v2 玩家可见 trace。
- `projects/western_fantasy_continent/fifteen_day_demo/README.md`: 程序范围、入口、验证和试玩结论。

## Validation

- `node --check .../fifteen-day-core.js`: PASS。
- `node --check .../fifteen-day-formal-player-loop.js`: PASS。
- `node --check .../fifteen-day-formal-player-cli.js`: PASS。
- `node .../verify-fifteen-day-demo.js`: PASS。
- `node .../verify-fifteen-day-input-boundary.js`: PASS。
- `node .../experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS。
- Round 1/2 均由不继承设计对话的独立持久 Agent 逐回合完成；独立 reviewer 与玩家分离。

## Current State

纯程序 Demo 可完整推进到第 15 日；政治和正面战斗两条自然路线均已跑通。最新源码在第二轮后补充了战斗贡献与援军来源呈现，并通过机械回归，但没有再开第三轮长程 Agent 试玩。

## Unresolved

- 玩家认知模拟的十连刷装和完整战斗仍被压成单条 `action_summary`；W/P/Q/k、Agency、逐段性能基线和可验证 EVerify 未接通，因此不能用现有分数证明情绪或单一角色因果。
- Round 2 的 10v10/20v10 在高投入刷装路线中明显碾压；这可能是“无限刷装”的预期回报，也可能需要后续按目标通过率再调。
- 部分承诺型招募仍在承诺当刻入队，没有第二段履约事件。
- 最后加入的战斗贡献/援军来源呈现仅做机械验证，尚未由第三名密封玩家复测。

## Recommended Next Step

先由真人直接试玩本程序节奏，确认 15 日长度和后期碾压是否符合预期；若继续自动认知验证，应先把正式战斗/十连拆成玩家可见过程事件，并把 Agent 的 `nextTest` 接成程序可结算 hypothesis/EVerify，而不是再增加剧情事件。
