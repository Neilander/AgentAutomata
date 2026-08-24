# Agent Handoff: UFS第1—9页初始轨迹与真实GTE矩阵

- Date: 2026-08-22 16:15 +08:00
- Agent/thread: Codex `/root`
- Scope: 扩展首局初始五槽轨迹，并编译成可激活的真实GTE矩阵
- Status: complete（初始不完全集；尚未全部接入Node一步运行）

## User Intent

初始规则轨迹可以不完整，之后按新规则和经验补充；但读规则生成后必须编译成矩阵，否则当前注意形成的五槽Q不能通过矩阵激活这些轨迹。

## Completed

- 读取既有首局规则认知第1—5阶段（规则书第1—9页），把冻结来源从12条扩展到24条。
- AI五槽轨迹从13条扩展到25条；防空规则拆成“下降减一”和“房间阶段无产出”两条边，因此边数比来源规则多1。
- 新轨迹补入目标与失败、未挖掘格合法性、支付能源挖掘、研究房顺序、母舰逐回合下降、母舰行行动、研究到顶获胜、最终11点研究房限制与两层飞船生成优先级。
- 复用已有 `RuleTrajectoryCompiler` 正式校验所有草稿：严格五槽、来源ID、原句引用、唯一边ID和禁止补入原句没有的具体数字。
- 使用离线真实 `gte-multilingual-base`，把每个槽编码为768维；五槽Q为3840维。
- 生成25×3840 current激活矩阵、25×3840 following矩阵和25×768 coarse粗筛矩阵，并和25条可恢复轨迹记忆一起落盘。
- 添加5条不同措辞的激活烟测：白骰、挖掘、母舰下降、研究到顶、空列生成均把正确轨迹放进Top-K候选。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/rule_reading_trajectory_v0/source_rules.json`: 第1—9页24条冻结来源及原知识位置。
- `.../ai_compiled_trajectories.json`: 25条初始 `q当前→q后续`。
- `.../compile_gte_matrix.py`: 结构编译、真实GTE矩阵生成、落盘和激活烟测。
- `.../run-gte-compile.ps1`: 从Git公共目录定位原仓库离线共享模型和依赖并运行编译。
- `.../artifacts/initial_rule_memory.json`: 25条可恢复轨迹记忆。
- `.../artifacts/initial_rule_memory.json.vectors.npz`: current/following/coarse矩阵缓存。
- `.../artifacts/gte_matrix_validation.json`: 输入哈希、矩阵形状与激活结果。
- `.../README.md`: 更新完整初始库、矩阵与诚实边界。
- `.../test-first-action-imagination.js`: 更新生成集数量断言。
- `coop_repo/LATEST.md`、`coop_repo/REPORT_INDEX.md`: 增加本报告入口。

## Validation

- 结构编译：24条来源、25条草稿、25条ready边全部安装，严格五槽/来源引用/禁止补数通过。
- 真实GTE矩阵：current `[25,3840]`、following `[25,3840]`、coarse `[25,768]`。
- 原始current头召回：25/25正确边进入候选。
- 五条自然语言改写烟测：5/5正确边进入候选；最佳激活约0.776—0.890。
- 矩阵缓存约851,912 bytes；本次CPU离线编译约7.74秒。
- 第一步真实A/B/C回归：9/9 PASS；仍在下一玩家选择停止，observedWorld不变。

## Current State

首局初始规则现在同时存在三种产物：可追溯的规则来源、严格的文字五槽边、真实GTE编译矩阵。矩阵能够提出Top-K候选；例如“挖掘”同时唤醒未挖掘格合法性与支付能源执行，“母舰阶段”同时唤醒下降与行行动，这是合理候选，不应由向量独自裁决。

## Unresolved

- 当前Node版一步设想仍通过轻量确定性矩阵端口运行，尚未直接加载Python生成的NPZ；真实GTE矩阵已经可由Python五槽记忆加载和查询。
- 25条是读第1—9页形成的初始记忆，不声称穷尽所有组合、隐含中间状态或例外。
- 除5条放置相关轨迹外，其余20条尚未全部接入对应真实阶段的grounding与停止控制器。
- AI轨迹由当前Codex一次生成，尚未做另一个隔离模型的重复生成稳定性盲测。

## Recommended Next Step

给Node模拟玩家增加真实GTE矩阵查询端口，先在白骰随机、箭头、母舰下降格和撞城四类一步场景中逐条替换确定性查询；关系门、未注意读取阻断和停止条件保持不变。
