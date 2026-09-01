# Agent Handoff: UFS自动多切入口真实单回合闸门与连续三回合

- Date: 2026-09-01
- Agent/thread: Codex `/root/automatic_round_gate`
- Scope: 将上层候选生成、自动逐步Q、随机暂停—观察—重规划接成真实单回合；通过后在同一玩家/host连续完成三回合
- Status: complete

## User Intent

先验证一次真实单回合闭环：上层从当前玩家可见Q生成宏观意图、少量锚点和候选序列；所有候选必须走`imagineSequentialPlan()`自动Q链；每一步都基于最新Q；白骰重投必须暂停、接受live随机、丢弃旧后缀并重规划。单回合只有满足全部安全闸门才允许在同一隔离玩家/host继续到三回合。

## Completed

- 新建独立实验`ufs_live_ai_automatic_multicutpoint_three_round_v2`，未复用或覆盖旧实验输出。
- 实验控制器只读当前玩家响应中的observation、mapView、pending合同和availableOperations：
  - 每回合从能源、研究和可见飞船行数形成一个宏观意图；
  - 从宏观意图和可见房间/飞船锚点形成最多3个候选，不枚举骰子×格子笛卡尔积；
  - 每个候选都调用真实`UfsFullGameAttentionSession.imagineSequentialPlan()`；
  - 禁止候选输入出现手写`QBefore/QAfter/currentQ/predictedFollowingQ`；
  - 每次只执行刚刚设想过的第0步，然后丢弃后缀并从新Q重建候选。
- 控制器保留本回合自己已经执行过的放置列，避免概率注意遗漏旧placement后再次选择同列；这是玩家自身短期动作记忆，不读取host。
- 六次白骰放置均返回`paused_random`；live xorshift32随机提供器仅按pending合同提交真实值；每次旧后缀均记录为discarded，并保留宏观意图从更高Q revision重规划。计划内随机提交为0。
- 单回合闸门先独立判定为PASS，之后才在同一session继续第二、第三回合。
- 三个回合均抵达可恢复的`waiting_for_next_round_roll`安全边界；0个live operation被拒绝。
- 为真实spawn边界补了最小认知运行时缺口：one-round cognition允许从显式`spawning`边界启动；正式公共合同仍要求单候选`choose_spawn`时，认知不再自动吞掉选择；full-game认知在公共spawn边界重基并从公开pending shipId恢复等待token身份。
- 未替换默认`planCurrentChoice()`，未修改玩家初始化器和冻结玩家资产。

## Gate Results

单回合与三回合均为PASS。每回合以下断言全部为true：无手写中间Q；规划不使用正式oracle；无live拒绝；每个已执行非随机动作有自动设想trace；每次只执行最新Q候选的第0步；计划中没有随机操作；live随机都来自外部provider；随机暂停标记正确；重投后提高Q revision并重规划；抵达下一回合可恢复边界；`invalidated/paused_uncertain/rejected`候选没有执行。

| 回合 | 宏观意图 | planning events | candidates imagined | 非随机动作 | 白骰重规划 | 自动轨迹预测 |
|---|---|---:|---:|---:|---:|---:|
| 1 | restore-energy-before-expensive-progress | 12 | 27 | 12 | 2 | 32 |
| 2 | research-with-energy-support | 11 | 29 | 11 | 2 | 28 |
| 3 | restore-energy-before-expensive-progress | 7 | 16 | 7 | 2 | 22 |

## Formal Boundary Outcomes

正式状态只在每回合`waiting_for_next_round_roll`安全边界读取，审计结果不回流给后续规划。

| 回合 | 能源 | 研究 | 伤害 | 母舰行 | 最高飞船行 | 飞船总行 |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 5 | 1 | 0 | 1 | 5 | 7 |
| 2 | 2 | 4 | 0 | 2 | 9 | 19 |
| 3 | 1 | 4 | 0 | 3 | 10 | 37 |

- 回合1自动形成并结算两格能源房，随后结算研究并选择+1。
- 回合2结算研究并选择+3，随后结算战斗机。
- 回合3结算战斗机。
- 三个边界的round/phase/energy/damage/research/excavator/mothership标量预测均与正式状态一致。
- 集合仍不完全一致：回合1、2为`ships/placements`，回合3为`placements`；这是概率注意下认知集合成员遗漏/保留差异，不能宣称完整世界模型一致。

## Failures Found Before Sealing The Final Attempt

- 初版候选把尚未挖掘的path cell当作合法格；加入公开`unlockIndex <= excavatorIndex`过滤。
- 第二回合概率注意遗漏己方旧placement，导致候选设想发现同列重复；加入控制器自己的本回合放置列短期记忆。
- 正式host公开`choose_spawn`时，认知已自动通过唯一出生点，导致无法为真实spawn动作生成自动设想；按上文修复显式spawn边界。
- 初版评分把“轨迹数量更多”的`end_rooms`排在能源/研究结算之前；加入与宏观意图一致的房间价值优先级。最终封存运行回合1能源2→5、研究0→1，回合2研究1→4。

这些失败均发生在封存证据前；最终`machine-replay.json`是修复后从初始状态重跑的最终证据，里面live拒绝为0。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_live_ai_automatic_multicutpoint_three_round_v2/automatic-multicutpoint-controller.js`: 宏观意图、少量候选、可见合法性、短期己方放置记忆和候选选择。
- `projects/western_fantasy_continent/experiments/ufs_live_ai_automatic_multicutpoint_three_round_v2/run-experiment.js`: 单回合先闸门、通过后三回合、live随机、逐步自动设想、边界审计和机器证据。
- `projects/western_fantasy_continent/experiments/ufs_live_ai_automatic_multicutpoint_three_round_v2/verify-evidence.js`: 封存证据断言。
- `projects/western_fantasy_continent/experiments/ufs_live_ai_automatic_multicutpoint_three_round_v2/test-controller.js`: 候选上限/无手写Q、随机pending键、显式spawn认知选择测试。
- `projects/western_fantasy_continent/experiments/ufs_live_ai_automatic_multicutpoint_three_round_v2/{README.md,PROTOCOL.md,RESULTS.md}`: 协议、运行方法与结论边界。
- `projects/western_fantasy_continent/experiments/ufs_live_ai_automatic_multicutpoint_three_round_v2/evidence/machine-replay.json`: 30个切点、72个候选、自动Q/GTE trace、所有动作与六次随机重规划。
- `projects/western_fantasy_continent/experiments/ufs_live_ai_automatic_multicutpoint_three_round_v2/evidence/final-host-checkpoint.json`: 第三回合后的可恢复checkpoint。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-imagination.js`: 支持从显式spawning边界恢复认知选择。
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: 公共spawn边界的认知重基与pending token恢复。

## Validation

- `node run-experiment.js`: 单回合PASS；允许继续后同session三回合PASS。
- `node verify-evidence.js`: PASS。
- `node --test test-controller.js`: 3/3通过。
- UFS完整相关回归（first-action、cognitive-program-library、V1 sequential、V2 controller）：188/188通过。
- `git diff --check`: 通过；只有仓库既有LF/CRLF提示。

## Current State

自动多步规划已经完成“上层少量候选→自动逐步Q/GTE设想→只执行最新Q第一步→随机暂停→live观察→丢弃后缀→新Q重规划→真实三回合”的闭环。机制完整性闸门通过，而且产生了真实能源与研究进展；但这仍是隔离实验控制器，没有接管默认planner。

## Unresolved

- 没有对照臂、只有一个玩家和一条随机流，不能由本实验推断胜率或相对收益。
- 威胁仍明显累积：飞船总行`7→19→37`，说明当前候选价值排序对长期威胁权重不足。
- 认知与正式状态在attention-limited collections上仍有差异，虽然关键标量在三个边界一致。
- 候选生成器是可审计的确定性实验控制器，不是通用LLM意图模块，也未调用个人反馈学习轨迹来改变宏观价值。
- spawn边界同步改变了认知运行时的公共决策恢复能力，但尚未做更多地图/多等待token专项样本；现有完整回归通过。

## Recommended Next Step

在不接管默认planner的前提下，为同一checkpoint建立冻结旧策略或无多步策略的配对控制臂，共享所有随机观察，比较三回合研究/能源进度与母舰、最高行、总行威胁；同时在候选价值中加入未来母舰/飞船总行，而不是只按当前房间类型排序。只有配对结果后才能讨论多步规划是否带来净收益。
