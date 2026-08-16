# 1万条顺序模糊类比学习实验

目的：验证“看过更多带结果的经历后，角色归一化轨迹记忆能否依靠连续向量检索，对新主体、新措辞和新领域预测后果”。

正式协议：

- 120个Agent创作的因果家族；
- 5000条学习流，5000条永久留出评测流；
- 每轮只新增100条记忆，再测试100条新题；
- 最多50轮；连续5轮总体不低于80%，且已知规律不低于80%、未知拒绝不低于70%才停止；
- 预测只输出结构化状态变化，不按完整句子的流畅程度计分。

文件分工：

- `family_catalog.json`：生成侧因果家族，不能给学习器；
- `materialize_dataset.py`：把Agent创作的家族做机械表面展开并冻结5000/5000；
- `episodic_learner.py`：只保存看过的原因向量和结果状态差分，不读家族标签；
- `run_learning_curve.py`：运行理想解析器上限曲线；
- `learner_design.md`：真实AI批次读入与预测契约；
- `audit_design.md`：正式实验反作弊要求。

重要边界：当前机械展开数据与理想解析器曲线只能回答“记忆检索核心是否可行”，不能冒充真实AI已经逐条读懂了原始自然语言。真实AI层必须另外保存每批原始输出和预测。

运行：

```powershell
.\run-local.ps1 validate_catalog.py
.\run-local.ps1 materialize_dataset.py
.\run-local.ps1 run_learning_curve.py
```
