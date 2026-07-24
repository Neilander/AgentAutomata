# Agent Handoff: 五日程序封口与正式盲测纠正

- Date: 2026-07-23
- Agent/thread: Codex `/root`
- Scope: `projects/western_fantasy_continent/five_day_guard_raid/`
- Status: complete

## User Intent

把“五日护卫队来袭”做成真正可玩的程序，并使用项目正式玩家模拟体系循环测试。玩家输入不得包含目标概念、规则总结、未来节点、锁定条件、行动结果、推荐战力或设计者路线；只有在玩家从可见证据形成理解并跨情境复用时，才能记为学习。

## Correction To Previous Report

`2026-07-23_1136_five-day-guard-raid-loop.md` 中“四轮模拟玩家已经学会目标概念”的结论无效。那四轮使用普通子 Agent 和泄露设计信息的旧 CLI，没有经过正式 `player_agent_api_loop_v1` 决策/归因边界。旧 `playtests/round1`—`round4` 的 12 个污染文件及旧截图已移除；旧报告只保留为历史记录，不能再作为认知证据。

机械结论仍有效，并已在本轮重新验证：五日/15 行动点、免费刷装、显式穿戴、三类开门、队伍招募、多种终局路线和硬刷红线。

## Completed

- 新增玩家封口接口：`getPlayerObservation`、`getPlayerActionCatalog`、`applyPlayerAction`。
  - 只返回当前/已发现地点、现场描述、当前合法行动、玩家资源、队伍、背包和行动后的可见现象。
  - 行动 ID 为不透明 `choice_*`；玩家请求不含 `internalId`、`outcome`、锁因、未来节点、推荐战力或隐藏态势数值。
- 王炉门改为探索式发现：先观察熔毁锁芯、断纹和铜线，再由玩家决定找铁匠、流放者或接近守卫；开门后不再提供无意义的查门行动。
- 新增五日环境的正式玩家循环适配器，复用项目既有：
  - `player-cognition-v3-event-runtime`
  - `signal-concept-interpreter`
  - `knowledge-retrieval`
  - `persistent-agent-context`
  - `player-profiles`
  - 固定“决策请求 → 程序执行 → 可见事件 → 归因请求”边界。
- 修复真实盲测发现的问题：
  - 重复的同文失败不再被文本去重吞掉。
  - 金币、药品、镇民支持、证据、装备增减进入正式可见反馈。
  - 礼拜堂、城墙、狩猎、夜巡、使者、撤离、决斗等隐藏 flag 变为场景内可观察结果或 NPC 承诺。
  - 身份事件行动后的通用日志不再恢复内部条件名。
  - 决斗资格明确为“主角本人对队长”，但不预告队长数值和胜负。
- 荣誉决斗队长阈值由 132 调为 125：第一局 109 仍失败；第二局同一最终状态 128 可胜。
- 提供人类 CLI 和正式 Agent CLI；未启动服务器。

## Formal Blind Runs

### Run 1

- 目录：`playtests/formal_blind_run_2026-07-23/`
- 23 次决策 + 23 次归因，原始请求/回复全部保存。
- 玩家自行走出：招盾手并编队、查门、守卫失败、冷却井、向流放者询问拓印、符文开门、内环刷装和装备、证据/贵族会谈、荣誉决斗。
- 原始结局：主角准备 109 对队长 132，失败。
- 暴露问题：资源变化缺失、部分事件只写“已解决”、开门后铁匠查门仍可浪费行动、决斗参与者不清楚。

### Run 2

- 目录：`playtests/formal_blind_run2_2026-07-23/`
- 29 次决策 + 29 次归因，原始请求/回复全部保存。
- 有效跨情境行为证据：
  - 招募盾手/药师并加入出战 → 翻车事件出现并选择“三人同时处理” → 获得镇民支持 → 下一日用镇民支持换护卫消息。
  - 两次与旁支剑士交涉失败并听见“勇气不能证明真相” → 从圣物与盖章文书累积证据 → 三份证据行动出现 → 剑士加入。
  - 得知决斗是一对一后，明确以此为理由把新稀有饰品给主角，并继续刷内环。
- 原始结局：主角准备 128 对旧阈值 132，失败。
- 调整后以相同最终状态和相同决斗选择回放：128 对 125，胜利。
- 不计为已证明：身份词条的一般化学习。第二局第 11 次决策后的旧通用日志仍写出了“穿戴[恐怖]”，因此该条归因被污染；现已封口并有回归测试，但没有第三次全新盲局证明跨场景身份迁移。

## Files Changed

- `five-day-raid-core.js`: 五日状态机、玩家封口观察、探索式门锁、场景反馈、决斗平衡。
- `five-day-raid-cli.js`: 人类玩家只通过不透明行动 ID 操作。
- `five-day-formal-player-loop.js`: 五日环境的正式决策/反馈/归因适配器。
- `five-day-formal-player-cli.js`: 会话、请求、决策、归因和摘要存档命令。
- `verify-sealed-player-observation.js`: 初始/探索/身份结果泄漏回归。
- `verify-formal-player-loop.js`: 正式边界、资源变化、重复失败回归。
- `verify-five-day-raid.js`, `analyze-core-loop.js`: 机械路线与数值红线。
- `README.md`: 人类 CLI 和正式模拟循环入口。
- `index.html`, `five-day-raid-web.js`, `verify-static-web.js`, `UI_PLAN.md`: 旧静态入口停止读取设计师视图；本轮没有启动服务器，网页不是测试主线。
- `playtests/formal_blind_run*/`: 两轮正式原始请求、回复、session 和 summary。

## Validation

- `node verify-sealed-player-observation.js`: PASS；5 阶段，初始无答案泄漏，身份行动后不恢复内部条件名。
- `node verify-formal-player-loop.js`: PASS；决策/归因各 3 个基础周期，资源差分与重复失败均进入可见事件。
- `node verify-five-day-raid.js`: PASS；21 个事件、开局 9 个已遇见地点、20 个当前行动；三类开门与最终路线可达。
- `node analyze-core-loop.js`: PASS；40 配对种子中 collapse/duel/ambush/defend 均 40/40；基础队外环 30 次 0/40，外环 1000 次 40/40。
- 两个正式盲测目录审计：Run 1 为 47 个 request 文件，Run 2 为 59 个；所有 decision request 的 action 均无 `outcome`、`internalId`、`reasons`，初始请求无目标概念和设计者答案短语。
- 第二局最终状态精确回放：同状态、同决斗选择，128:125 胜。
- `node verify-static-web.js`: PASS，静态文件模式，无服务器。

## Current State

可玩主程序已经成立，人类玩家可用 `five-day-raid-cli.js` 完整推进；正式模拟玩家可用 `five-day-formal-player-cli.js` 逐 request 决策。正式盲测证明了队伍/资源跨节点传递、失败后收集证据修正路径，以及世界内的一对一信息能改变装备策略。没有证据支持的概念不会写成“已学会”。

## Unresolved

- 身份词条的一般化学习仍未由新的全程盲局证明；目前只有边界回归，不应宣称成立。
- 第二轮在运行中修复了身份日志和决斗承诺：原始档案完整保留，受污染片段已明确排除。若要做严格版本冻结实验，应从当前 commit 再跑一局。
- 静态网页仅保证不再读取设计师视图；本轮重点是程序和正式 tester，不应把 UI 验证替代游戏循环验证。

## Recommended Next Step

先由用户直接玩 CLI 或阅读 Run 2 的原始决策链，判断五日事件内容是否有趣。若继续自动验证，只需再做一轮“当前版本冻结后的全新盲局”，重点看身份词条能否在两个不同事件间迁移；不要扩地图或继续做网页。
