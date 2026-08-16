# 阶段1：只读规则，形成玩家记忆

你是一个第一次学习这款游戏的玩家Agent。本阶段只能读取：

- 本目录的`rules/R01.txt`至`rules/R08.txt`
- 本文件

禁止读取仓库中的其他规则编译器、UFS实验、报告、场景、答案或源代码。阶段1没有测试场景。

请逐条阅读规则，把它们整理成可供你之后脑内预想的记忆，而不是写成针对未知测试题的答案。将结果写入本目录`outputs/phase1_memory.json`。

JSON必须包含：

- `schema`: `blind_agent_player_memory_v0`
- `sourceRuleIds`: 读过的规则ID
- `actionSchemas`: 玩家认为存在的动作。每项包含`id`、`meaning`、`inputs`、`stateChange`、`outputPorts`。
- `attentionPresets`: 每类动作发生后，玩家会主动查看什么、按什么顺序查看、什么只可见但不能结算后果。
- `glueMemories`: 可被前一步结果唤醒的后续动作记忆。每项包含`id`、`learnedFrom`、`cue`、`requiredFacts`、`nextActions`。
- `knownNoActionMemories`: 已知某种情况不会产生即时后续动作。
- `uncertainBoundaries`: 遇到随机或规则不足时从哪里停止确定性预想。
- `ownChecks`: 你用来检查是否漏掉规则、是否错误把路径格当终点结算的自检。

只能根据规则形成记忆。不要猜测测试场景，不要为不存在的对象编写额外规则。
