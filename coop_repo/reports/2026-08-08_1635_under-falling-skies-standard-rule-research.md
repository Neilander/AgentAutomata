# Agent Handoff: 正式独立游戏规则研究

- Date: 2026-08-08
- Agent/thread: `/root`
- Scope: 研究《Under Falling Skies》正式独立游戏规则及模拟数据边界
- Status: complete

## User Intent

研究正式版本规则书，判断能否用正式游戏替代过于简单的教学 MindToy，并厘清精确胜率模拟需要哪些规则与组件数据。

## Completed

- 下载并完整核对官方英文规则书第 1-11 页，同时检查页面图、组件布置和图标说明。
- 区分首局核心规则与正式独立游戏新增的城市、威胁等级、基地组合、受损城市和机器人。
- 整理骰子、房间、母舰三个阶段及落点触发、研究轨成本、多格房间、出生规则等精确状态转移。
- 对照当前 V0，确认其缺少十类正式规则，因此当前胜率不能称为正式游戏胜率。
- 识别规则书的数据边界：状态机规则充分，但所有组件正反面的精确格数据展示不完整。
- 给出 Roswell 正式规则基线、威胁泛化、机器人规划和经验学习四阶段验证顺序。

## Files Changed

- `projects/western_fantasy_continent/experiments/under_falling_skies_planning_mind_toy_v0/STANDARD_GAME_RULE_RESEARCH.md`: 中文正式规则与模拟边界说明。
- `coop_repo/LATEST.md`: 更新最新协作入口。
- `coop_repo/REPORT_INDEX.md`: 增加本报告索引。

## Validation

- `pdfinfo`: 官方 PDF 16 页，无表单和脚本。
- `pdftoppm`: 已渲染并人工检查第 1-11 页。
- 文本规则与版面图交叉核对：骰子阶段、房间阶段、母舰阶段、结束条件、城市、威胁等级和机器人均已覆盖。

## Current State

正式规则已经足以建立正确的程序状态机合同。当前最合理的第一目标是 Roswell A+B 的正式规则基线，而不是直接声称覆盖全部城市；若要精确跑威胁 0-4 和所有城市，需要补齐官方组件正反面的格数据。

## Unresolved

- 规则书没有清晰列出 4 块天空板所有危险面和所有城市/基地面的机器可读数据。
- 尚未开发正式规则引擎或产生正式胜率。
- 当前高维语义坐标仍为固定先验，游戏结果尚未形成带环境和置信度的经验偏移。

## Recommended Next Step

先精确录入规则书能核对的 Roswell A+B 与一套天空配置，开发正式规则状态机并做逐条单测；再补组件数据和威胁等级，不要在数据不完整时报告“正式游戏胜率”。

