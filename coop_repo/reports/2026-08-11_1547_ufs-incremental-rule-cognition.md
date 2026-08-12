# Agent Handoff: UFS 分段规则认知与新玩家泄漏审查

- Date: 2026-08-11
- Agent/thread: root
- Scope: `under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0`
- Status: complete

## User Intent

让 AI 像新玩家一样分段阅读《Under Falling Skies》规则书，每段只整理当时已经获得的概念、规则知识和可执行行为；完成后审查是否混入规则书未教的新手攻略、后见知识或引擎内部信息。

## Completed

- 按页面语义分成8个追加式阶段；旧阶段不可被后续知识回写。
- 规则书第9页明确允许开始第一局，因此冻结阶段1-5、页面1-9为首局初始认知边界。
- 首局快照包含33个概念、14个环境事实、21条主体-环境-行为-结果规则知识、11个可执行行为。
- 完整规则书快照包含48个概念、23个环境事实、27条规则知识、19个行为。
- 新增可执行构建器与测试，保证首局快照不含机器人、战役知识和内部引擎字段。
- 完成中文泄漏审查，并区分“隐藏知识泄漏”和“超人枚举计算能力”。

## Files Changed

- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/stages/*.json`: 八个不可回写的分段认知快照。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/rule-knowledge-reader.js`: 构建首局或完整规则认知。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/test-rule-knowledge-reader.js`: 数量、页面边界、内部字段和后续知识泄漏测试。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/KNOWLEDGE_LEAK_AUDIT.md`: 新玩家知识审查。
- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/standard_rules_v1/rule_knowledge_reader_v0/README.md`: 隔离模块合同。

## Validation

- 使用 pypdf 按阶段提取16页规则书文字；用 Poppler 渲染全部页面并检查两张总览图，图文结构与章节边界一致。
- `node .../rule_knowledge_reader_v0/test-rule-knowledge-reader.js`: PASS；首局5阶段/9页/33概念/21知识/11行为，后续知识与内部字段泄漏均为0。
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS；原认知主线2循环与知识回归未受影响。
- `git diff --check`: PASS，仅已有换行格式警告。

## Current State

规则阅读产物目前是隔离模块，可以为之后的 Roswell 玩家提供首局初始 `concepts + rule knowledge + behaviors`，但尚未接入正式玩家 Agent。项目原知识库仍保持原状。

PDF 技能的分段抽取和视觉复核要求使本次产物按真实页面边界处理；尤其避免把第10页后的机器人和战役知识提前注入首局玩家。

## Unresolved

- 当前零规划高维符文仍含人工策略权重，不等于这份新手规则认知。
- 当前符文会把尚未填满或未付款的房间标签提前当收益，需改成真实环境变化后再评价。
- 一次枚举全部合法选项没有隐藏信息，但计算能力超过普通新玩家；后续需由注意预算和候选召回处理。
- 规则阅读置信度目前按认真阅读的新玩家处理，尚未模拟略读或漏读玩家。

## Recommended Next Step

先不要接正式玩家主线。用首局快照替换零规划符文的人工概念权重来源，并把行动评价改成“当前边际需求 + 行动后的真实环境变化”；随后做三个小用例：半填多格房、能源不足房、计划指定3个行为后剩余2个自由填充。
