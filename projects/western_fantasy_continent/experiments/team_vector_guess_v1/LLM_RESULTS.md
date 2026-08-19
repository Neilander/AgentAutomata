# 大语言模型需求方向选队实验

## 结论

- 独立、无上文继承的Codex子任务根据8个失败后的玩家知识输出九维连续需求方向；候选队伍和验证战斗对模型不可见。
- 第二随机种子中，所选Top-1需求向量表现优于原失败队：8/8。
- 所选Top-1需求向量表现优于50队平均：8/8。
- Top-5真实胜率高于该敌队的全池胜率：8/8。
- Top-1把原失败变成第二随机种子胜利：6/8。

## 明细

| 场景 | LLM主要方向 | 选择队伍 | 原队验证 | 新队验证 | Top5/全池胜率 |
| --- | --- | --- | --- | --- | ---: |
| survive_fire_burst | damage=0.23、protection=0.69、tempo=0.18、burst=0.50、control=0.09、execution=0.41 | 狂战士 / 牧师 / 狂战士 / 牧师 | loss | loss | 60%/14% |
| break_frost_control | damage=0.38、protection=0.14、tempo=0.29、burst=0.55、control=0.19、execution=0.62 | 狂战士 / 游侠 / 炼金师 / 游侠 | loss | win | 80%/30% |
| break_holy_sustain | damage=0.37、protection=0.28、tempo=0.19、burst=0.58、control=0.12、execution=0.63 | 狂战士 / 游侠 / 炼金师 / 游侠 | loss | win | 100%/56% |
| survive_fast_pressure | damage=0.53、protection=0.26、tempo=0.60、burst=0.48、control=0.14、execution=0.19 | 法师 / 法师 / 法师 / 法师 | loss | win | 80%/38% |
| counter_poison_snowball | damage=0.33、protection=0.12、tempo=0.57、burst=0.48、control=0.17、execution=0.53 | 狂战士 / 游侠 / 炼金师 / 游侠 | loss | win | 80%/20% |
| survive_fire_without_healer | damage=0.38、protection=0.67、tempo=0.50、burst=0.29、control=0.14、execution=0.19 | 狂战士 / 游侠 / 炼金师 / 游侠 | loss | win | 40%/14% |
| escape_control_lock | damage=0.48、protection=0.17、tempo=0.60、burst=0.53、control=0.19、execution=0.24 | 法师 / 法师 / 法师 / 法师 | loss | loss | 80%/30% |
| stabilize_poison_glass_team | damage=0.42、protection=0.74、tempo=0.19、burst=0.28、control=0.12、execution=0.37 | 狂战士 / 牧师 / 狂战士 / 牧师 | loss | win | 100%/20% |

## 边界

- 模型只输出方向权重，不能读取候选队向量，也不能直接选队。
- 这是独立、无上文继承的Codex大语言模型的一次冻结输出，不是多模型、多次采样统计。
- 验证换了随机种子但没有换敌队；未见敌队迁移仍待测试。
- 点积选择使用已冻结的50队玩家知识向量，没有重新训练或按结果调权。
