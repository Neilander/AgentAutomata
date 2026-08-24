# UFS 候选成本—条件—收益判断闭卷实验 V0

- 日期：2026-08-21
- 目的：验证一个只拥有第1—9页规则知识的阅读者，能否把知识绑定到当前公开局面，对候选动作逐项判断并主动选择下一步。
- 性质：知识受限的单次决策实验；不是完整对局、最优规划或胜率评测。

## 已有知识

项目已有 AI 读规则生成的知识，位于：

1. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/01-goal-and-setup.json`
2. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/02-round-and-placement.json`
3. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/03-ship-effects-and-rooms.json`
4. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/04-excavation-and-mothership.json`
5. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/05-first-game-complete.json`

答题者把这五份文件视为读完第9页后已经形成的全部规则认知，不再读取原规则书。

## 答题者允许输入

- 本协议。
- `EXAM.md`。
- 上述五份规则知识 JSON。
- 项目玩家认知模拟 skill 及其必读引用，仅用于遵守知识边界与行为选择规范。

禁止读取：

- `EVALUATION_RUBRIC.md`；
- 本实验其他提交或评审文件；
- `ufs_page9_strategy_reading_v0` 的三份策略报告与总结；
- 旧 UFS 策略研究、规划器、引擎、测试、地图实例、完整规则书；
- 第10页以后知识或网络资料。

## 答题规则

- 只使用公开状态和已有知识，不补充隐藏地图、未来骰子或最优路线。
- 每个场景先列实际引用的知识 ID，再逐项判断全部候选。
- 区分基础骰子成本、额外能源成本、机会成本和天空副作用。
- 生效条件不满足时写“不生效/当前无对象”，不能把条件工具永久判成无用。
- 宏观需要必须由当前状态和资源依赖推出，不允许写固定资源权重。
- 若两个选择无法可靠区分，允许保留不确定或并列，不得为完成答卷虚构精确分数。

## 沟通隔离

- 主 Agent 先冻结试卷和评分标准，再派答题者。
- 答题者只写 `submissions/agent_01.md`，不修改其他文件。
- 答题者完成后只回复“已写完：报告路径”，不得直接返回答案内容。
- 主 Agent收到完成消息后再从磁盘读取答卷并评审。

