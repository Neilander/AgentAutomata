# 玩家情绪模型程序合同 V1

- 日期：2026-07-20
- 状态：隔离实验合同；不接正式V27
- 目标：固定“物理化学 + 精神认知 + 长期背景 → 共存情绪序列”的输入输出边界，并防止案例标注者从标准答案反推输入。

## 1. 当前正式系统审计

### 可直接复用

- 玩家实际接收到的事件和H感知过滤；
- 主体、环境、行为、结果组成的事件知识；
- 带belief、confidence和evidenceCount的因果知识；
- 活动目标及主观价值；
- 待验证假设及EVerify证据；
- 失败事件、次数和是否已经被后续成功解决；
- R、A、C、EVerify产生的结构化评价分量；
- 角色输出、保护、增益三套认知标尺。

### 不能直接沿用

- `emotion.value`只是0至100总值，无法表示共存情绪、对象或行为方向；
- `failureMemories.fear`把恐惧直接存成单值，跳过了威胁、控制和生理动力学；
- 当前Profile只有风险、探索、换方案厌恶、证据门槛和玩法偏好；
- Profile没有个体生理基线、释放敏感度、清除速度、受体敏感度、跨游戏经验或关系历史；
- 当前R/A/C/EVerify直接相加，未来接入生理层时会有双算风险。

## 2. 输入分四层

### A. 事件前可观察事实

只记录情绪发生前或发生过程中的可观察内容：

- 发生了什么；
- 谁对谁做了什么；
- 时间顺序；
- 玩家能看到什么；
- 心率、皮肤电、激素等是否真的被测量；
- 玩家当时说了什么、做了什么。

不能把“他很害怕”作为威胁或皮质醇输入。

### B. 明确物理与化学状态

第一版显式保存：

```text
centralNorepinephrine
epinephrine
cortisol
dopamine
serotonin
acetylcholine
endogenousOpioid
endocannabinoid
oxytocin
vasopressin
testosterone
inflammatoryLoad
```

每个状态保存：

```text
level         0..1归一化水平
baseline      此人物的0..1个人基线
confidence    此输入证据有多强
provenance    measured | profile_baseline | unknown
```

文学、影视和大多数新闻案例没有化学测量。此时必须使用个人基线或unknown，让模型依据事件和评价生成变化，不能由标注者事后填写“恐惧所以肾上腺素0.9”。

### C. 精神与认知评价

第一版评价轴：

```text
threatMagnitude
threatImmediacy
controllability
escapeAvailability
obstruction
blameCertainty
goalRelevance
rewardPredictionError
rewardConsumption
expectedUncertainty
unexpectedChange
socialSafety
statusChallenge
selfAttribution
lossGap
irreversibility
normViolation
```

每个值也必须带依据引用和置信度。未知不能默认填0.5。

对象和归因不能压成数值：

```text
attentionTarget
threatSource
blameTarget
rewardSource
lossObject
socialObject
```

### D. 长期背景

至少允许保存：

- 个人价值权重；
- 常态思考量、风险偏好、失败耐受；
- 生理基线、释放敏感度和清除速度；
- 关系历史和依恋安全；
- 自我评价与领域自我效能；
- 跨游戏形成的机制先验；
- 相似事件记忆、次数、强度、时间和是否解决；
- 长期疲劳、压力和恢复状态。

长期背景必须发生在目标场景之前。不能用目标场景之后的解释污染输入。

## 3. 动力学合同

每个化学状态有个人基线、事件释放和时间衰减：

```text
dx_i / dt =
  release_i(事件, 认知评价, 长期背景)
  - (x_i - baseline_i) / tau_i
  + interaction_i(其他生理状态)
```

第一版只要求：

- 秒级系统先变化；
-皮质醇等持续压力系统延迟变化；
- 慢性炎症不能由单场事件瞬间产生；
- 状态不会在事件结束的一帧全部清零；
- 不同玩家允许不同baseline、sensitivity和tau。

## 4. 输出不是单一情绪

模型输出有序、可共存的情绪序列：

```text
emotionFamily
intensity
target
cause
confidence
onset
expectedDuration
actionBias[]
supportingPhysiology[]
supportingAppraisals[]
supportingMemories[]
```

例如：

```text
恐惧 0.72，指向Boss，偏向逃避与冻结
愤怒 0.38，指向自己的连续失误，偏向强行修正
希望 0.31，指向尚未尝试的电系方案，偏向继续实验
```

第一版封闭情绪族用于验证：

```text
fear, anxiety, anger, frustration,
sadness, disappointment, disgust,
joy, excitement, satisfaction, relief, hope,
pride, shame, guilt, regret,
attachment, gratitude, envy, jealousy,
surprise, curiosity, confusion, boredom
```

封闭集合只是测试标签，不表示人类只有这些情绪。

## 5. 案例标准答案

情绪标准答案分三级：

### A级

- 当事人的直接自述；
- 文学中的明确内心叙述；
- 影视中明确台词并有情境支持；
- 实验中的即时自我报告。

### B级

- 多项行为、生理和情境证据一致；
- 没有直接情绪命名，但指向较明确。

### C级

- 新闻作者、旁观者或标注者推测；
- 只能作为软标签，不能当绝对真值。

情绪强度只有来源明确给出或有预先确定的标注量表时才作硬比较，否则只评价排序和区间。

## 6. 防止循环证明

每个案例必须满足：

1. 输入编码在查看标准答案情绪前冻结；
2. 输入来源只能是目标情绪发生前的事实、人物既有背景和直接测量；
3. 禁止从标准答案倒推多巴胺、血清素、皮质醇、控制感等输入；
4. 化学未知就保持unknown；
5. 输入标注者和标准答案标注者最好分开；
6. 同一作品、同一真实人物或同一实验不能跨训练/开发/测试集；
7. 独立留出集不能参与变量新增、阈值调整或规则修改。

## 7. 数据分割

按`sourceGroup`整体分割：

- 文学：同一作品或系列；
- 影视：同一作品或系列；
- 新闻纪实：同一真实人物/同一事件；
- 实验：同一研究或同一受试者批次。

不允许从同一电影抽一幕放训练集、另一幕放测试集。

阶段目标：

```text
合同校准：30-50个案例
第一轮开发：200个多来源案例
稳定性验证：至少1000个案例
```

最终比例暂定：

```text
60% train
20% development
20% sealed test
```

## 8. 评价指标

- 多标签情绪macro/micro F1；
- Top-k召回；
- 主要情绪排序正确率；
- 情绪对象准确率；
- 证据充分案例中的强度误差；
- 预测置信度校准；
- 行为倾向一致率；
- 情绪出现顺序和持续轨迹；
- 按来源类型、人物、文化背景和情绪族的分组误差；
- 消融某一化学轴、评价轴或长期记忆后的性能变化。

不能只报告总准确率。一个模型可以靠永远猜“焦虑”获得看似不错的数字，却无法区分恐惧、愤怒、羞耻和宽慰。

## 9. 与正式V27的边界

隔离实验阶段：

- 不修改`emotion.value`；
- 不改变Agent行为；
- 不改变R/A/C/EVerify；
- 不把模型输出写回玩家知识；
- 只读取V27事件、评价、Profile和记忆的副本；
- 先证明时间顺序、共存情绪、对象和行为方向合理。

未来接线时：

- R/A/C/EVerify作为生理释放和认知更新的上游；
- 新模型产生行为偏置和情绪输出；
- 旧数值不能再额外直接相加一次。
