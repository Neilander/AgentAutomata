# Agent Handoff: UFS可调注意力空间v0

- Date: 2026-08-18
- Agent/thread: `/root`
- Scope: 封装UFS完整公开状态、动作初始注意、AI复盘调整和有限注意预算
- Status: complete（隔离模块；尚未接入玩家策略）

## User Intent

把UFS的最大公开状态空间封装成可调注意力模块：每个动作先有较窄初始注意，AI可依据复盘增加、降低或沿关系扩展注意，有限注意力等级决定本次真正注意到哪些事实。模块必须可复用、可审计，并且不能给玩家泄漏隐藏状态或最佳动作。

## Completed

- 新建隔离的 `ufs_attention_space_v0`，未修改现有五槽轨迹记忆和选策略代码。
- 将真实Roswell公开快照拆为153个稳定状态项：80个天空格、30个基地格，以及骰子、飞船、房间和公开轨道等。
- 内置首个 `place_die` 窄注意样例：直接骰子、目标格/房间、同列飞船及预计经过的天空格高激活，其他公开状态保留低背景激活。
- 提供规则阅读阶段的 `define_initial_attention`，可为其他阶段/动作建立新初始预设，不必继续把动作写死进模块。
- 提供AI复盘接口：增加、降低、沿公开关系扩展、撤销和检查；每条调整带阶段/动作/目标作用域、原因与贡献审计。
- 有限预算把连续的 `0..1` 注意力等级映射为可进入后续设想的状态项数量，并输出 `gist/clear/precise` 清晰度。
- 严格拒绝隐藏键、答案式字段、未知关系和非法选择器；模块只做注意力分配，不选动作、不预测结果。
- 严苛复测发现并修正多标签选择器的并/交错误：`第2列 + 爆炸格`现在必须两项同时满足，避免污染整列或全图爆炸格。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_attention_space_v0/ufs_attention_space.py`: 注意力空间、预设、复盘调整、激活场、预算分配和统一门面。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_attention_space_v0/test_ufs_attention_space.py`: 真实快照、隔离、作用域、撤销、多标签和随机序列测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_attention_space_v0/run_validation.py`: 一键验证和机器可读成果生成。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_attention_space_v0/run-local.ps1`: 本地运行入口。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_attention_space_v0/README.md`: 中文接口、边界和运行说明。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_attention_space_v0/artifacts/validation.json`: 最新验证结果。

## Validation

- `python -m py_compile ufs_attention_space.py test_ufs_attention_space.py`: PASS。
- `python run_validation.py`: 12/12 PASS；真实 `roswell-ab-threat-0` 快照成功形成153项公开空间。
- 随机性质测试：20组、每组30次随机增加/降低，共600次调整；所有激活保持在`0..1`、状态ID无重复、状态项总数不变。
- 示例复盘：未放置白骰激活从0.04升至0.39；目标列远处天空格从0.28升至0.48；非目标列保持0.04。
- 注意力等级0.15/0.5/0.9分别分配13/28/46项；高等级结果严格包含中等级，中等级严格包含低等级。
- 现有 `ufs_one_turn_wiring_v0/run-local.ps1` 回归：轻量测试3/3 PASS；3个真实开局208个即时与208个延迟投影仍全部匹配引擎。

## Current State

现在已经有一个能单独实例化的UFS注意力空间。规则阅读可生成动作初始预设，复盘可对特定作用域进行可撤销调整，具体动作设想只接收预算后真正注意到的公开事实。现有玩家尚未读取这个输出，因此本次没有把“注意力模块正确”夸大为“AI玩家已经因此会玩”。

## Unresolved

- `place_die`的初始激活常数、预算容量和三档清晰度阈值是明确可调的工程参数，尚未通过真人数据标定。
- 当前预算是确定性排序截取，没有模拟疲劳、眼动和随机漏看。
- AI如何根据一场失败自动决定“增加哪里、减少哪里”尚未接线；当前只完成可安全调用的接口。
- 下一步接入时仍需验证：预算后的注意结果能否稳定生成五槽轨迹查询，并导致合理的想象差异，而不只是漂亮的激活数字。

## Recommended Next Step

先做一个很小的接线对照：同一放骰候选分别用初始预设与“复盘后增加剩余骰子/远处同列标志”预设，把两组实际注意到的事实送进五槽轨迹查询；验证被新增注意的事实会唤醒相应轨迹，而未注意到的事实不会凭空进入设想。

