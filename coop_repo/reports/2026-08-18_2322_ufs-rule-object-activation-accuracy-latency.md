# Agent Handoff: UFS规则驱动对象激活准确度与耗时

- Date: 2026-08-18
- Agent/thread: /root
- Scope: 五槽轨迹记忆中的规则→当前对象激活
- Status: complete

## User Intent

验证“骰子在第三列，激活同列飞船”是否能由自然语言向量直接完成，并在多种关系、不同候选范围和不同候选规模下测量准确度与耗时。

## Completed

- 建立10案例、21种查询改写的隔离数据集，覆盖等值/复合空间关系、距离、终点与经过、容器、状态/属性类别和数值阈值。
- 使用真实离线GTE编码查询和对象；程序不实现关系规则，答案只在向量打分后用于评分。
- 同时评测全局混合对象和注意力模块已经限定的同类候选池。
- 测量模型加载、对象缓存、在线查询编码、小候选矩阵和10至10万缓存候选的矩阵耗时。
- 得出明确边界：向量可做模糊候选唤醒，不可单独替代关系举证。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_rule_object_activation_v0/cases.json`: 冻结测试案例与隐藏评测标签。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_rule_object_activation_v0/run_experiment.py`: 真实GTE评测与耗时测量。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_rule_object_activation_v0/run-local.ps1`: 离线可复跑入口。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_rule_object_activation_v0/README.md`: 实验口径。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_rule_object_activation_v0/ANALYSIS.md`: 中文结果与接线判断。
- `logs/fb2/projects/western_fantasy_continent/experiments/five_slot_trajectory_memory_v0/ufs_rule_object_activation_v0/artifacts/results.json`: 完整逐查询分数与耗时。

## Validation

- `run-local.ps1`: PASS，10案例/21查询全部完成并生成结果。
- `python -m py_compile run_experiment.py`: PASS。
- 全局混合对象：成对排序79.76%，Oracle Top-K整组正确47.62%，最大断层自动选组4.76%。
- 注意力池：成对排序84.92%，Oracle Top-K整组正确66.67%，最大断层自动选组42.86%。
- 同列飞船：注意力池内3/3种改写Top-K全对；类别筛选和最近城市也全对。
- 同行、复合关系、终点/经过、阈值关系仍有明显失败。
- 耗时：模型加载2.04秒；57对象缓存3.03秒；在线查询编码中位91.16毫秒；小矩阵激活0.0087毫秒；10万缓存候选矩阵15.69毫秒。

## Current State

对象激活的能力边界已经通过真实模型确定：注意力模块先缩小扫描池后，向量能低成本地排出一批相关候选；它擅长语义类别和部分直观距离关系，但不可靠执行数值、否定、相对位置和最终状态约束。

## Unresolved

- 未实现候选后的逐槽关系举证，因此目前不能安全地让向量Top-1/Top-K直接驱动动作。
- 运行时不知道正确对象数量，最大断层法只有42.86%整组正确，不能采用。
- 耗时来自当前本机CPU单次运行；准确度确定性较强，绝对延迟会随硬件改变。

## Recommended Next Step

实现一个很薄的“候选关系举证层”：矩阵只提供Top候选，Agent或结构化事实验证列号/落点/距离等；随后用本实验21条回归，目标是保留矩阵速度并把注意力池整组正确率提升到接近100%。
