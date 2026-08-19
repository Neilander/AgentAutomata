# Agent Handoff: 五槽向量轨迹记忆 V0

- Date: 2026-08-16
- Agent/thread: `/root`
- Scope: 把玩家记住的一次变化正式实现为五个连续语义槽位，并提供可新建、保存、恢复的轨迹记忆类
- Status: complete（隔离模块）；未接玩家Agent

## User Intent

玩家记住的不是“放骰子后飞机移动”这样的动作字符串，而是一个由受影响对象、变化趋势、原因关系、时间状态、上下文组成的连续坐标。需要把它开发成独立小模块：每次可以初始化全新空实例，也可以保存并重新加载以前用过的实例。

## Completed

- 新建独立实验目录`five_slot_trajectory_memory_v0`，没有修改旧的1536维对象+趋势唤醒器或硬轨迹实验。
- 固定一条感知坐标为五个语义槽位：`affected_object / change_trend / cause_relation / temporal_state / context`。
- 每个槽位单独编码并归一化，再按槽位权重拼接；使用当前768维GTE时，完整坐标为3840维。
- 实现`FiveSlotTrajectoryMemory.new(encoder)`创建完全独立的空实例。
- 实现`remember(q, q_next)`、`remember_trajectory([q1,q2,...])`、`query(q)`、`save(path)`与`load(path, encoder)`。
- 所有已记住的起始坐标预编译为矩阵，查询是一次矩阵乘法；只对取回的Top-K后继做连续空间聚合。
- 同一条精确连接反复出现时不复制矩阵行，而是累计`observations`和`support`；措辞不同但相近的经历仍保留为独立证据。
- 保存文件只持久化五槽文本、权重、连接强度和元数据，不固化模型向量；加载后用传入编码器重建矩阵。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/five_slot_memory.py`: 可复用五槽坐标、轨迹连接、矩阵查询、保存与恢复实现。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/gte_encoder.py`: 复用本地离线GTE的最小适配器。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/test_five_slot_memory.py`: 空实例和生命周期单元测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/run_semantic_demo.py`: 从全新空实例开始的真实GTE语义验证。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/run-local.ps1`: 一键运行全部验证。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/README.md`: 中文接口和使用边界。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/stores/.gitignore`: 隔离用户保存的具体记忆实例。

## Validation

- 生命周期单元测试5/5：新实例为空且相互独立、精确`q→q_next`、重复经历增强、两段连续轨迹、保存后重新加载全部通过。
- 真实GTE坐标维数：`5×768=3840`。
- 全新空实例查询正确返回`empty_memory`，没有默认知识。
- 从空实例加入3条记忆后，三种改写查询全部正确：
  - 真实矿车压住地雷 → 唤醒碰撞后爆炸；Top-1相似度0.7396。
  - 只阅读说明并假设爆炸 → 唤醒现实状态不变；Top-1相似度0.8127。
  - 只看见远处爆炸物但没有接触 → 唤醒保持安静；Top-1相似度0.7834。
- 保存、建立新对象、重新加载后，真实碰撞仍唤醒同一个后继，持久化测试通过。

## Current State

现在已有可被其他实验直接实例化的五槽记忆类。自然语言只是各槽位进入编码器前的输入；实际查询使用五段连续向量拼成的坐标，轨迹保存为`q→q_next`连接。不同玩家、不同游戏或不同隔离实验可以各自新建实例，也可以加载过去积累的实例继续使用。

## Unresolved

- 当前模块不负责自动从原始战报、画面或规则中抽取五个槽位；这仍应由注意力/感知整理层完成。
- 3/3只是结构性烟测，不能证明跨大量游戏的泛化准确率。
- 默认槽位权重和置信度公式尚未接玩家感知幅度，也没有独立大样本定参。
- 聚合后的真正输出是连续`prediction_vector`；为调试显示的`following`只是离聚合中心最近的一条记忆坐标。
- 该模块返回联想候选，不替代游戏规则的正式结算与二次校验。

## Recommended Next Step

先冻结这个模块，不继续调三个烟测案例。下一步在注意力出口建立统一的五槽抽取合同：给同一个公开局部变化，让AI输出五槽文本，再检查不同措辞、不同Agent和重复观察能否生成稳定相近的`q`；通过后再把该类作为正式动作粘连记忆接到一条UFS短链。
