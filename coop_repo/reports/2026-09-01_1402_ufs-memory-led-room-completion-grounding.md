# Agent Handoff: UFS房间多步操作改为记忆唤醒后动态绑定

- Date: 2026-09-01
- Agent/thread: root
- Scope: 移除下一版多步候选生成中的“能源房固定需要两颗骰子”知识，建立Q前/Q后记忆唤醒到原子放置操作的边界
- Status: complete

## User Intent

游戏程序暴露给玩家的操作应只有“放置骰子（位置，骰子）”，不应直接告诉玩家某个房间必须投入两颗骰子。玩家需要从规则或经验记忆中想起完整房间条件，再把它绑定到当前看见的位置。

## Completed

- 保留V4 sealed控制器与配对证据不动，新增`ufs_memory_led_multicutpoint_v3`。
- 核实真实公开`place_die`合同只要求`type/dieId/cellId`；公开房间可以显示可见格子身份，但没有`requiredDiceCount/requiresAllCells`等语义提示。
- 新增规则规划affordance记忆：Q后保存能源/研究/战斗机结果方法，Q前保存“多格房全部可见格子占据后才完整”的操作关系。
- 使用真实本地GTE current/following矩阵分别查询Q前和Q后，非触发侧不参与召回闸门。
- 新grounder先由Q后记忆找到结果方法，再要求Q前完整房间记忆；把`each_unoccupied_visible_cell_in_same_room`绑定为若干个原子`place_die(dieId, cellId)`。
- grounder不含房间类型到骰子数量的表，也不含`energy===...`或常数2特判。
- 真实两格能源房由同一记忆生成2步；三格变体自动生成3步；删除Q前完整房间记忆后明确返回`missing_recalled_multicell_completion_relation`。
- 真实两步候选接入现有`imagineSequentialPlan()`后，自动轨迹依次预测第一步不完整、第二步完整。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_memory_led_multicutpoint_v3/planning-affordance-memory.json`: 从既有规则轨迹投影出的规划记忆及Q前/Q后查询。
- `projects/western_fantasy_continent/experiments/ufs_memory_led_multicutpoint_v3/rule-planning-recall.js`: 真实GTE双路召回。
- `projects/western_fantasy_continent/experiments/ufs_memory_led_multicutpoint_v3/memory-led-multicutpoint-controller.js`: 记忆驱动的当前格子动态绑定。
- `projects/western_fantasy_continent/experiments/ufs_memory_led_multicutpoint_v3/test-memory-led-controller.js`: 公开接口、2/3格、缺失记忆和真实逐Q设想测试。
- `projects/western_fantasy_continent/experiments/ufs_memory_led_multicutpoint_v3/{README.md,RESULTS.md}`: 使用方法、结论与限制。
- `coop_repo/reports/2026-09-01_1402_ufs-memory-led-room-completion-grounding.md`: 本报告。
- `coop_repo/LATEST.md`: 新增本单元入口。

## Validation

- `node --test .../ufs_memory_led_multicutpoint_v3/test-memory-led-controller.js`: 7/7 PASS。
- UFS完整相关回归加新测试：195/195 PASS。
- `git diff --check`: 只允许既有Windows LF/CRLF提示，待最终复核。

## Current State

当前已经证明：操作数量可以由“规则记忆里的全部格子关系 × 当前可见格子集合”动态产生，而不是由控制器知道“能源房=两颗骰子”。环境接口无需修改；此前的问题位于V2候选生成器的私有脚手架。

V3仍是隔离的下一版控制器，没有替换默认`planCurrentChoice()`、玩家初始化器或历史V4。它只完成真实放置切点的候选发现、绑定和逐Q设想，没有开始长局。

## Unresolved

- 规划affordance目前是既有规则轨迹的人工结构化投影，还没有从任意反馈学习`operations[]`自动生成。
- 宏观意图仍复用V2确定性脚手架；非骰子阶段仍委托V2。
- 尚未做单回合收益对照，不能由本单元声称结果改善。

## Recommended Next Step

下一步只做一次fresh单回合：让V3所有多格房候选必须同时携带Q后结果记忆与Q前完整房间记忆，再与V2同checkpoint比较锚点来源和正式结果；通过后才扩展到个人反馈学习轨迹。
