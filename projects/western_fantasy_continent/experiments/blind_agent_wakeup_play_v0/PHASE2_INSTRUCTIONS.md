# 阶段2：只看初始动作，自行唤醒后续链

阶段1记忆已经冻结。你现在只能读取：

- `outputs/phase1_memory.json`
- `scenarios.json`
- 本文件

禁止读取仓库其他UFS文件、编译器、报告、答案或测试代码。不得修改`phase1_memory.json`。

对`scenarios.json`中的每一局：

1. 从给出的`initialAction`开始；
2. 按阶段1中你自己形成的注意力预设，手动决定每一步看哪里；
3. 每完成一个动作，检查这个结果是否会唤醒记忆中的后续动作；
4. 场景不会告诉你任何潜在后续动作，必须由你自己回忆规则并继续；
5. 一直执行到动作链自然结束、立即胜负、已知无即时效果或随机结果尚未出现；
6. 不得编造规则没有提供的后果。

将结果写入`outputs/phase2_predictions.json`，JSON必须包含：

- `schema`: `blind_agent_wakeup_predictions_v0`
- `memorySchema`: 使用的阶段1记忆schema
- `cases`: 每个场景一项，必须包含：
  - `id`
  - `actionTrace`: 按实际执行顺序记录动作；每步包含`step`、`action`、`actor`、`stateChange`
  - `attentionTrace`: 按顺序记录每次主动查看的对象或区域、为什么看、看到了什么、是否唤醒后续记忆
  - `activatedRuleIds`: 实际参与推演的规则ID，去重即可
  - `activatedMemoryIds`: 实际被唤醒的阶段1 glue/无动作/停止边界记忆ID
  - `finalState`：必须包含`shipPositions`对象、`cityHp`、`mothershipPosition`、`outcome`、`unplacedDiceState`
  - `stopReason`
  - `uncertainties`

字段约定：

- 未变化且场景未提供的状态写`null`。
- `outcome`只能是`null`或`loss`。
- `unplacedDiceState`只能是`none`、`unchanged`或`rerolled_result_unknown`。
- 位置必须沿用场景中的位置ID，等待区写`mothership-waiting`。

完成后验证JSON有效、场景ID无缺失或多余，再回复完成。
