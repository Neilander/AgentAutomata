# UFS 第1—9页规则三视角阅读实验 V0

- 日期：2026-08-21
- 目的：测试认真读完首局规则的新玩家，仅依据页面1—9的规则认知，会自然形成怎样的宏观策略、资源强调与具体策略假设。
- 性质：知识受限的隔离阅读实验；不是胜率评测，不运行游戏，不读取引擎。

## 唯一允许输入

三位阅读者只能读取下列五个文件：

1. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/01-goal-and-setup.json`
2. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/02-round-and-placement.json`
3. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/03-ship-effects-and-rooms.json`
4. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/04-excavation-and-mothership.json`
5. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/05-first-game-complete.json`

这些文件对应规则书第1—9页。三位阅读者不得读取同项目的其他 README、报告、代码、测试、地图、规划器、实验产物或网络资料。

## 共同知识边界

- 只允许使用五份输入中的 `conceptsAdded`、`environmentFactsAdded`、`knowledgeAdded`、`behaviorsAdded`、`openQuestions` 与 `blockedInferences`。
- 必须区分规则直接陈述、由多条规则组合得到的推论、尚不确定的猜测。
- 不得使用固定价值权重、标准最优开局、固定胜利路线、全量合法动作枚举或后见胜率。
- 不得读取第10页后的城市能力、机器人、威胁等级细节或战役内容。
- 不得把规则未说明的内容用常识自动补全。
- 报告默认使用中文，并引用支撑结论的规则/行为/事实 ID。

## 三个独立角色

### 01 宏观策略阅读者

只回答：认真读完第9页后，玩家会形成怎样的不细分到具体格子的整体打法与回合思路。

输出：`reports/01_macro_strategy.md`

### 02 资源强调阅读者

只回答：规则最强调哪些资源、压力与约束；它们为什么重要，彼此怎样交换。资源不预先限定为数值条，目标、时间、空间和行动机会也可以被论证为资源或约束。

输出：`reports/02_resource_emphasis.md`

### 03 具体策略阅读者

只回答：仅凭第1—9页能推导出哪些带条件的具体策略假设。每条必须写清触发条件、动作、预期后果、依据、推论等级与不确定处。

输出：`reports/03_concrete_tactics.md`

## 沟通与隔离

- 三位阅读者不能互读对方报告。
- 三位阅读者只写各自报告，不修改任何其他文件。
- 完成后只向主 Agent 回复“已写完：报告路径”，不得在消息中返回报告内容。
- 主 Agent 等三份报告都完成后再读取和对照。
