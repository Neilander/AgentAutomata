# UFS 真实状态候选发现与判断实验 V0

- 日期：2026-08-22
- 地图：用户核对过的 `Roswell · 基地 A+B · 威胁0`
- 状态来源：正式规则状态机、固定 seed 1、可复现公开操作前序
- 目的：撤掉“直接给候选和落点”的脚手架，验证答题者能否从真实公开版图、骰子和飞机位置自行发现候选、计算直接后果并选择下一步。

## 允许的规则知识

答题者只把以下五份文件视为读完第9页后已有的规则知识：

1. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/01-goal-and-setup.json`
2. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/02-round-and-placement.json`
3. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/03-ship-effects-and-rooms.json`
4. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/04-excavation-and-mothership.json`
5. `../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/05-first-game-complete.json`

## 答题者允许输入

- 本协议；
- `PUBLIC_MAP_AND_STATES.md`；
- `EXAM.md`；
- 上述五份规则知识；
- 项目 `player-cognition-simulation` skill 及必读引用，仅用于遵守知识、状态和行为边界。

禁止读取：

- `EVALUATION_RUBRIC.md`；
- `scenario-fixtures.js`、测试和正式引擎/地图源文件；
- 本实验其他提交与评审；
- 上一轮候选判断答卷、UFS策略报告、旧规划器、旧评测；
- 第10页后规则、未来骰子、隐藏随机数或网络资料。

## 输入边界

- `PUBLIC_MAP_AND_STATES.md` 等价于玩家当前能看到的版图、轨道、骰子、已放骰和飞机位置。
- 不直接提供合法候选列表，不直接提供放置后的落点。
- 答题者只锁定“下一次放置”；可以写本回合意图，但不得假定白骰重投结果。
- 不要求找到数学最优动作；要求选择能从知识、公开状态和候选比较中推出。

## 沟通隔离

- 主 Agent 在答题前冻结状态、试卷和评审标准。
- 答题者只写 `submissions/agent_01.md`，不修改其他文件。
- 完成后只回复“已写完：报告路径”，不得在消息中返回答案。
- 主 Agent收到完成消息后才读取答卷，并用正式状态机核验选中动作是否合法及即时预测是否一致。

