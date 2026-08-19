# Agent Handoff: UFS五槽记忆一回合接线

- Date: 2026-08-17
- Agent/thread: `/root`
- Scope: 把真实对象绑定、连续记忆唤醒和候选结果比较接到UFS一次骰子放置
- Status: complete（一次放骰MVP；非完整对局玩家）

## User Intent

在全注意假设下，把三层直接接起来：实际局面绑定到轨迹对象；候选动作沿五槽记忆连续展开后果；多个预想结果按当前目标比较并选择。

## Completed

- 建立只含玩家可见规则的6条五槽规则连接：放置→同列下降、箭头横移、母舰下降、撞城、普通/爆炸落点停止、白骰重掷。
- 新增UFS公开桥，只向玩家提供安全公开观察、全部合法动作和公开版图；隐藏seed、rngState和history没有进入玩家输入。
- 把具体骰子ID、点数、基地格、列、飞船ID、行列位置绑定进`FullyNoticedStep`。
- 每个候选先做五槽向量查询，只返回Top-3；当前公开事实只能在Top-3内二次校验，不能遍历整张规则库找答案。
- 只有被记忆唤醒的后继才会被物化到复制世界；落点会继续形成新步骤并再次唤醒，直到停止。
- 白骰重掷作为“确定会发生、具体新点数未知”的随机分支参与比较，不读取未来骰点。
- 用可替换的`SafetyGoal`比较城市伤害、母舰前进、飞船下降和不确定性，覆盖全部合法骰子位置。
- 验证器在所有预想和选择完成后才调用正式引擎取得真实后果，结果不会回流到选择过程。
- 发现并修复评分特征错误：被母舰收回而离开天空列表的飞船一度被误算为继续下降至城市；现改为由母舰前进和城市伤害特征分别计分。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/rule_trajectories.json`: 六条公开规则轨迹和物化接口。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/ufs-public-bridge.js`: 安全公开局面、合法动作和事后引擎核验桥。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/one_turn_player.py`: 对象绑定、Top-3唤醒、连续物化和结果比较。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/test_one_turn_player.py`: 事实二次校验、精确记忆召回和空记忆测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/run_validation.py`: 3个真实开局、全部合法放置和事后引擎对照。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/artifacts/validation.json`: 完整机器可读结果。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_one_turn_wiring_v0/README.md`: 架构、运行方式、结果和边界。

## Validation

- 轻量单元测试：3/3通过；Node与Python语法检查通过。
- 真实GTE，seed `334462/1/42`：分别产生71、70、67个合法放置，共208个。
- 记忆唤醒496次：同列下降208、箭头33、母舰下降18、普通/爆炸落点停止157、白骰重掷80。
- 向量候选最大为3；选中记忆位于语义Top-1共339次、Top-3共157次，没有全库扫描。
- 208个候选预想状态全部与事后正式引擎一致；3个最终选择也全部一致。
- 空记忆消融：`complete=false`、没有选中记录、世界保持原观察状态。
- 安全目标的最好候选通常是AA格上的小骰，最差候选会触发母舰下降并可能承担白骰随机成本；说明结果比较确实改变排序。

## Current State

一次骰子放置已经形成完整闭环：

`公开局面 + 合法动作 → 绑定具体对象 → 五槽Top-3唤醒 → 事实校验 → 复制世界连续展开 → 目标特征比较 → 选择 → 事后核验`

物化器仍是规则的程序执行接口，它负责把记忆中的“同列下降”“箭头横移”等抽象后继落到具体坐标；它不是策略搜索器。策略选择只读取预想结果和公开目标权重。

## Unresolved

- 当前只覆盖骰子阶段的一次放置，尚未连续玩完整回合、房间阶段和母舰阶段。
- 当前目标只强调安全，没有评价所占房间未来提供的能源、研究、战斗机和挖掘收益，因此选出的动作不是完整游戏意义上的最佳动作。
- 三个开局覆盖箭头、母舰下降、普通/爆炸格和白骰重掷，但没有覆盖飞船撞城；撞城记忆存在但未在本轮真实场景触发。
- 规则库只有6条。Top-3在小库中通过，不代表扩到数百条后仍能稳定召回，需要随规则增长测试候选覆盖率。
- 208/208主要验证接线与规则物化正确，不能证明AI已经学会规则或已经具备完整规划能力。

## Recommended Next Step

先增加“所占房间的延迟收益”轨迹，把当前安全目标扩为安全+能源+研究+战斗机+挖掘的可替换目标，再让同一记忆玩家连续放完5颗骰子。不要直接跳到完整多回合胜率优化。
