# Agent Handoff: 硬轨迹记忆的矩阵检索与冻结验证

- Date: 2026-08-16
- Agent/thread: root
- Scope: 隔离验证“只保存状态轨迹，用矩阵相似度唤醒后续”的可行性
- Status: partial

## User Intent

不要把动作唤醒写成对象条件、KV或逐条硬编码查询。玩家看过规则或经历后，只保存局部状态轨迹；新场景出现时，根据当前状态和来向在整库中一次性计算相似度，多条类似经历共同佐证下一步。需要用较多案例验证改写、换位置、困难负例、冲突、多步、跨轨迹、陌生概念和规模增长，暂不接正式玩家模拟。

## Completed

- 建立73条硬轨迹、102个可续接片段；每个片段预编译为矩阵一行，运行时全库检索为一次矩阵乘法。
- 开发集自动选择`当前状态0.5 + 来向箭头0.5`，没有炸弹、护盾、卡牌等对象分支。
- Top-K后继只在小集合内按连续坐标聚合；相近结果互相佐证，冲突结果保留支配度和不确定性。
- V0先冻结63个开发案例，再一次性运行58个新案例；失败后保留原结果，另建V1而没有覆盖或重跑V0。
- V1只增加低确定度拒绝与标签无关的矛盾证据分群，再用121个旧案例定参数，一次性运行37个新案例。
- 两版最终案例共95个；另有102次精确重放、13条两步链、跨轨迹组合、冲突比例、证据累积和最高50,082片段规模测试。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/trajectory_memory.py`: V0矩阵轨迹索引、Top-K后继聚合和证据强度。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/trajectory_memory_v1.py`: 低确定度拒绝、矛盾证据支配度。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/fixtures.py`: 规则经历、普通无后续经历和同终点不同来向经历。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/final_holdout.py`: V0冻结58例。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/final_holdout_v1.py`: V1冻结37例。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/calibrate_and_freeze.py`: V0开发集定参和源文件哈希冻结。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/evaluate_frozen.py`: V0一次性综合评测。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/run_v1.py`: V1定参与一次性评测。
- `logs/fb2/projects/western_fantasy_continent/experiments/hard_trajectory_memory_v0/artifacts/`: 不可覆盖的配置和完整逐例结果。

## Validation

- V0单步冻结集：42/58（72.4%）；其中已知规则40/48（83.3%），陌生规则拒绝2/10。
- V1单步冻结集：32/37（86.5%）；已知正例11/15（73.3%），已知无后续10/10，陌生规则拒绝11/12（91.7%）。
- 同一终点、不同来向：V0 4/4，V1 4/4，说明系统确实使用来向而非只认最后画面。
- 精确轨迹重放：V0 102/102，V1 102/102。
- 多步补全：V0 6/7，V1 6/6；跨不同轨迹的`压开关→开关激活→门打开`组合通过。
- 冲突佐证：8:0、6:2、4:4的V1支配度分别为1.00、0.75、0.50，置信度依次下降，冲突测试通过。
- 多条佐证：一条爆炸经历证据分0.439/0.441；五条提高到0.505/0.532。V0因此唤醒，V1因防陌生规则的0.02执行门槛仍拒绝，说明证据可累积但是否执行存在真实取舍。
- 矩阵实现等价检查：102行向量化得分与逐行点积最大误差`4.44e-16`。
- 规模：50,082片段的一次矩阵查询中位数约9.7–9.9ms。

## Current State

已经证明可行的是：用连续坐标检索硬轨迹片段，再沿取回轨迹续接；多条相似经历会增加证据，多个片段可以连续和跨轨迹粘合。没有证明的是“任意语义变化箭头可以直接平移到新物体上并代数地产生未来”：V0的几何未来解码只有46.6%。因此正式接线时应把它定位为记忆唤醒器，而不是物理/规则预言机。

V1解决了V0最严重的陌生规则乱猜和冲突不降信心，但代价是较保守：部分真实已知正例会因低确定度不唤醒。它适合作为玩家“没想起来”的建模基础，而不是高召回规则执行器。

## Unresolved

- V1已知正例仍只有11/15，主要失败在爆炸改写、脆墙/硬墙区分和数字破产；GTE对精确数值和相反语义不是可靠计算器。
- V1五条较弱相似经历虽然提高证据，但仍未越过执行门槛；需要以后让玩家感知幅度/注意力状态调节门槛，而不是继续用同一最终集调常数。
- 4:4冲突的支配度已经是0.5，但当前接口仍返回一个并列候选；正式接入时应向Agent暴露候选分布并允许主动查规则。
- 尚未接入UFS公开观察、注意力选择或Agent实际决策；本实验不能代表AI已会玩UFS。

## Recommended Next Step

先不要继续优化离线分数。把V1作为隔离的`trajectoryWakeup`模块接到一个很小的UFS公开场景：注意力层提供`上一局部状态、当前局部状态`，模块返回`Top-K轨迹、证据分、支配度、是否拒绝`；Agent自行决定继续推演、查规则或停止。用3到5条真实规则链验证“放骰子→飞机下降→落点效果”的实际粘连，再决定是否扩大到完整游戏。
