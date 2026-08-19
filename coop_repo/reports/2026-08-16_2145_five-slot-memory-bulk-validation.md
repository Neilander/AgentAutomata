# Agent Handoff: 五槽轨迹记忆5000条容量验证

- Date: 2026-08-16
- Agent/thread: `/root`
- Scope: 隔离验证五槽向量轨迹记忆是否真的能存储、召回并恢复大量既有经历
- Status: complete（已见因果的记忆功能通过；未知因果识别未通过）

## User Intent

用此前生成的大量1—3主体、1—2次互动因果条例测试五槽记忆模块，确认它不是只能跑几个自编例子，而是真能作为可重复初始化、保存和恢复的玩家经历记忆。

## Completed

- 把此前冻结的5000条学习经历机械转换成5000个不同的五槽`q → q_next`连接，没有把隐藏家族标签送入查询坐标。
- 增加批量查询：先在共享768维空间粗筛128条，再对候选使用完整3840维五槽坐标计算最终相似度。
- 向量矩阵改用`float32`，5000条起点与后继完整矩阵合计153.6MB。
- 增加可选`.vectors.npz`持久化缓存；编码器身份和记录ID一致时，恢复实例不需要重新编码整个记忆库。
- 增加7项生命周期回归，覆盖空实例隔离、写入、重复观察增强、轨迹连接、单条与批量召回一致、普通保存恢复、缓存恢复不重编码记忆库。
- 保留真实GTE三类语义烟雾测试：真实碰撞、假设讨论、仅观察未接触，3/3区分正确。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/five_slot_memory.py`: 批量编码、粗筛候选、完整五槽复核、float32矩阵和可选向量缓存。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/gte_encoder.py`: 提供稳定编码器身份，供缓存兼容性校验。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/test_five_slot_memory.py`: 7项生命周期与缓存回归。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/run_bulk_memory_validation.py`: 5000学习/1000查询批量验证和固定100条记忆消融。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/run-bulk.ps1`: 独立大测试入口，避免日常快速测试重复等待。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/artifacts/bulk_validation.json`: 完整机器可读结果。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/README.md`: 使用方式、性能结果和能力边界。

## Validation

- `run-local.ps1`: 7/7生命周期测试通过；真实GTE语义测试3/3；保存恢复通过。
- 5000条建库：成功，形成5000条不同五槽连接；冷构建430.99秒。
- 原经历抽样重放：500/500正确。
- 独立同家族评测：900条已见因果中召回855条，准确率95.00%。
- 多主体/多互动切片：三主体490/529，92.63%；两次互动574/619，92.73%。
- 记忆数量消融：只保留固定前100条时，同一900题仅492条正确，54.67%；5000条记忆比100条高40.33个百分点。
- 查询缓存：同一1000条查询重复执行结果完全一致；缓存后批量查询1.60秒，约1.6毫秒/条。
- 保存恢复：JSON 7.72MB，向量缓存169.28MB；恢复5000条后前25条预测完全一致。
- 未知因果留出：在前200题选阈值0.84后，后800题中已知因果685/720正确（95.14%），但未知因果只拒绝19/80（23.75%）。

## Current State

模块已经能承担“玩家见过一段五槽状态变化后，遇到相似起始状态时唤醒其后续”的职责。证据不仅是精确重放：记忆从100条增长到5000条后，独立同因果语言查询从54.67%升至95.00%，并且保存、恢复和批量调用可重复。

这不是自主因果发现实验。数据由共享因果家族生成，验证的是大量经历的容量、模糊召回、积累收益、持久化与运行性能，不能据此声称模块会自动理解没见过的新规则。

## Unresolved

- 未知因果拒绝率23.75%，当前相似度不能可靠判断“这件事从未学过”。记忆候选仍需规则校验或单独的新颖性机制。
- 首次把5000条文本编码建库约7.18分钟；有向量缓存后日常恢复和查询可用，但首次学习成本仍高。
- 当前五槽由结构化旧数据机械转换。真实玩家接入前仍需验证注意力/感知层能否稳定产出对象、趋势、原因、时间、上下文五槽。
- 粗筛128条候选在本批数据上达到95%，尚未对更大记忆库做召回损失曲线。

## Recommended Next Step

不要继续把记忆检索器调成规则判断器。下一步应隔离开发“局部注意事实 → 五槽坐标”的抽取与校验，再把它接到动作粘连的唤醒入口；未知规则保留为不确定，并交给规则查阅/二次验证流程。
