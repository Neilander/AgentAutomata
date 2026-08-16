# 五槽轨迹记忆 V0

这是一个隔离、可复用的长期经历模块。它不保存“放骰子后飞机移动”这类动作字符串作为检索条件，而把玩家感知到的一件变化拆成五个连续语义槽位：

```text
q = [
  受影响对象向量,
  变化趋势向量,
  原因关系向量,
  时间状态向量,
  上下文向量
]
```

五个槽位分别编码后按权重拼接。若底层GTE为768维，一个`q`就是3840维。记忆保存的是`q → q_next`；运行时把所有已记住的`q`编译成矩阵，一次矩阵乘法唤醒相似经历，再由相近后继共同支持下一坐标。

## 初始化新的空记忆

```python
from five_slot_memory import FiveSlotCoordinate, FiveSlotTrajectoryMemory
from gte_encoder import LocalGTEEncoder

encoder = LocalGTEEncoder()
memory = FiveSlotTrajectoryMemory.new(encoder)
assert memory.is_empty
```

不同实例完全独立。新游戏、新玩家或隔离实验都可以各自`new()`一个。

## 记住一条连接

```python
q_now = FiveSlotCoordinate(
    affected_object="可爆炸装置",
    change_trend="从完整安静变为被移动物体直接碰撞",
    cause_relation="运动物体与装置发生物理接触",
    temporal_state="碰撞正在发生，结果尚未结算",
    context="真实游戏局面的短期预想",
)

q_next = FiveSlotCoordinate(
    affected_object="同一个可爆炸装置",
    change_trend="从受到碰撞变为已经爆炸",
    cause_relation="碰撞触发内部爆炸机制",
    temporal_state="后果已经发生",
    context="真实游戏局面的后果",
)

memory.remember(q_now, q_next, strength=1.0)
result = memory.query(q_now)
print(result.following)
```

同一条精确连接再次`remember()`不会复制矩阵行，而会增加`observations`和`support`。多条措辞不同但坐标相近的经历则保留为不同记录，在查询时共同支持相近后继。

一整段轨迹可以直接加入：

```python
memory.remember_trajectory([q1, q2, q3, q4])
```

这会生成`q1→q2`、`q2→q3`、`q3→q4`三条可被重新组合的连接。

## 保存和恢复以前的记忆

```python
memory.save("stores/player_a.json")

restored = FiveSlotTrajectoryMemory.load(
    "stores/player_a.json",
    encoder,
)
```

保存文件只包含五槽文本、槽位权重、连接强度和可选元数据，不固化模型向量。加载后使用当前传入的编码器重新编译矩阵，因此同一份经历可以在以后更换编码器时重建；正式比较不同模型时应记录编码器版本。

## 边界

- 该模块只负责“当前五槽坐标唤醒哪段后续”，不负责从画面或自然语言自动抽取五槽。
- `following`是记忆中最接近聚合后继中心的一条可读坐标；`prediction_vector`才是多条后继加权后的连续坐标。
- 相似度、置信度和默认槽位权重尚未接玩家感知幅度，当前仅用于隔离验证。
- 轨迹记忆是联想候选，不替代游戏规则的真实结算。

## 运行验证

```powershell
.\run-local.ps1
```

验证包含：全新空实例、实例隔离、精确连接、重复经历增强、连续轨迹、保存/加载，以及真实GTE对“真实碰撞、规则假设、只观察未接触”三种语义的区分。

