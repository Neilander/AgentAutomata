# Agent Handoff: 高维变化箭头普适性实验

- Date: 2026-08-15
- Agent/thread: Codex root
- Scope: 调研并隔离验证GTE句向量中“状态前后差向量”能否跨主体、跨游戏表示同一种变化
- Status: complete

## User Intent

判断高维空间中从一个状态点到另一个状态点的箭头是否具有自然普适性；若原始箭头不满足，尝试多组坐标、方向平均和空间校正，确定能否得到可用于动作—注意力预设唤起的变化表示。

## Completed

- 调研词向量类比、句向量类比、偏移聚集与配对一致性、多个关系对平均、BERT空间各向异性相关研究。
- 新建完全隔离的`latent_transition_arrow_v0`实验，不修改UFS引擎、玩家Agent或动作—注意力V2。
- 构建核心96条与扩展192条受控中文游戏状态变化，覆盖24个有方向关系、每类8个跨游戏语境。
- 实现两个独立实验：箭头能否跨语境识别关系；箭头能否搬到新起点并找出正确终点。
- 增加1至7条参考箭头学习曲线、2倍/3倍全局统一步长、只用训练语境调步长、ABTT 1/3/5/10公共方向移除和383候选全局检索复核。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/latent_transition_arrow_v0/transition_dataset.py`：192条受控变化数据。
- `logs/fb2/projects/western_fantasy_continent/experiments/latent_transition_arrow_v0/run_experiment.py`：箭头识别、搬运、学习曲线、轻校正与全局检索。
- `logs/fb2/projects/western_fantasy_continent/experiments/latent_transition_arrow_v0/test_experiment.py`：数据合同与矩阵变换测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/latent_transition_arrow_v0/README.md`：实验说明。
- `logs/fb2/projects/western_fantasy_continent/experiments/latent_transition_arrow_v0/RESULTS.md`：中文研究与结果解释。
- `logs/fb2/projects/western_fantasy_continent/experiments/latent_transition_arrow_v0/artifacts/latest_results.json`：完整机器结果。
- `coop_repo/reports/2026-08-15_1622_latent-transition-arrow-universality.md`：本报告。
- `coop_repo/REPORT_INDEX.md`、`coop_repo/LATEST.md`：协作入口更新。

## Validation

- `run-local.ps1`：PASS；合同测试通过，GTE完全离线运行，生成192条变化的完整结果。
- 扩展24类箭头跨语境Top-1为87.50%，随机机会4.17%；同类余弦0.3998、异类-0.0206、相反关系-0.4748。
- 四候选搬运：单箭头34.38%，7条归一化共同方向64.58%，统一2倍步长96.35%，仅训练语境调步长96.88%，随机机会25%。
- 学习曲线从1条34.38%单调上升到7条64.58%。
- 383候选全局检索：起点不动Top-1 53.13%；1倍共同箭头94.27%；ABTT-1后96.35%。
- `git diff --check -- logs/.../latent_transition_arrow_v0`：PASS。
- independent_review: not_run（本轮为隔离数学实验，未要求子Agent）。

## Current State

变化箭头的方向可以作为动作预设召回键：同类变化跨主体显著聚集，多条经历归一化平均后形成更稳定的关系原型。固定箭头长度不普适；预测具体终点仍应交给规则演算。最小运行结构可定为“局部变化箭头→关系原型召回→粘连动作—注意力预设→程序推演后果”。

## Unresolved

- 目前是受控短状态句，尚未把真实UFS注意力节点产生的前后状态接入。
- 每个关系只有8个语境，尚未测更多经历后的饱和、遗忘和错误经验污染。
- 尚未定义记忆中关系原型的在线更新率、置信度与上下文分裂条件。
- 高维箭头只能负责唤起相似变化，不能替代动作预设中的确定规则、距离和条件判断。

## Recommended Next Step

不要立刻接正式玩家Agent。先在`imagination_v2`旁新增一个最小召回适配器：把“飞机下降”等预想节点编码为局部箭头，用本实验的归一化关系原型召回已有动作预设；只验证正确召回、相反动作不召回、未知变化保持疑问三类case。

