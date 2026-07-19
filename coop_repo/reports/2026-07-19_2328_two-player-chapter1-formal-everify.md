# Agent Handoff：两类真实Agent第一章结构化EVerify实跑

- Date: 2026-07-19
- Agent/thread: Codex `/root`，并行子任务 open_novice / inertial_player
- Scope: 用V26正式运行时让两类真实Agent并行跑第一章，检查结构化因果链、EVerify学习、换人和信息过滤
- Status: complete

## User Intent

让两个不同类型的玩家使用刚接好的正式结构化EVerify版本，并行跑之前的大地图第一章，观察新版是否在真实Agent行为中生效以及暴露什么问题。

## Run Configuration

- 共同游戏种子：`paired-alpha`
- 环境：`enriched_v1`
- 感知档：`ordinary`
- 玩家：
  - `open_novice`
  - `inertial_player`
- 停止条件：第一章正式Boss通关，或30 cycle上限
- 请求模型记录为 `5.5fast`，但当前编排器不能报告实际模型，产物中记为 `unknown_platform_default`
- 两边使用独立持久Agent会话和独立输出目录，没有预制行动

## Completed

- 开放新手严格跑到30 cycle上限：
  - 16战12胜4负；
  - 2次换人、12次主动换装；
  - 主线1到10通过；
  - Boss两次失败，第一章未通关；
  - 81条正式知识。
- 惯性玩家在20 cycle通关：
  - 16战11胜5负；
  - 2次换人、2次主动换装；
  - Boss一次通过；
  - 56条正式知识。
- 两个真实Agent都会主动提出结构化因果链，不需要强制：
  - 开放新手7条；
  - 惯性玩家5条；
  - 共12条。
- 正式结构化EVerify合计：
  - confirmed：1；
  - refuted：1；
  - partially_confirmed：0；
  - inconclusive：10。
- 开放新手的确认/反驳产生6次结构化因果知识更新，最终另有1条旧targetCondition知识；它在后续4个决策中明确引用新causalKnowledge。
- 惯性玩家5条结构化链全部信息不足，结构化知识更新0；但1条旧targetCondition知识被后续2次换人决策明确引用。
- 两类玩家都没有把一次换人失败泛化成“所有换人都会失败”：
  - 开放新手的法师阵容在主线7失败后，仍愿意测试未知游侠，并在同关获胜；
  - 惯性玩家的法师阵容在主线6失败后，仍愿意测试未知狂战，并在同关获胜。
- 新角色换入前都没有足够角色认知，因此换人A依合同保持unknown；两跑的正式数值A结算均为0。本轮只能确认行为作用域正确，不能确认A数值。

## Important Findings

### 1. 新结构化合同真实可用

Agent主动生成的链包括战士重击、法师火球、狂战技能、游侠猎标/箭雨、战士战旗和治疗急救。公开技能标识能够通过正式合同，并在战后进入正式EVerify。

开放新手第一场“重击施放→重击伤害→胜利”三步全部接收，整链confirmed；Boss“治疗发生→胜利”在收到治疗和失败后产生局部反驳。后续Agent确实读取新因果知识决定保留谁、继续验证什么。

### 2. 普通感知下技能链闭合率太低

12条真实结构化链只有2条得到明确结算，10条为inconclusive，明确结算率约16.7%。

惯性玩家的5条链中，10个“技能施放/技能效果”中间步骤只有第一次重击施放被接收，其余9个unknown。最终胜负通常能看到，但不能仅凭胜负倒推技能原因，因此程序正确地没有乱学。

这不是Agent不愿写链，也不是匹配器失效；瓶颈是普通感知对技能施放和对应效果的联合接收过低。优先候选不是全局抬高所有信息，而是当玩家已经主动提出待验证链时，对链中公开技能给予小幅、限本场的注意力加权，再做相同种子的对照。

### 3. 发现一个明确的信号主体翻译Bug

开放新手的正式请求中出现：

> 敌方单位本场施加过界面显示的“猎标箭”、“余烬火球”、“烈焰扩散”、“钉足箭”等效果。

这些是我方游侠/法师技能。`enemy_visible_status` 把我方技能状态翻译成敌方施加，可能制造错误敌人认知。实例位于开放新手 `request-024.json`。这应先于感知强度调参修复。

### 4. 合同表达仍有歧义

开放新手首次自然响应把 `causalChain` 写成包含 `claim/claimMode/steps` 的嵌套对象，并把ref/environment写成字符串，被运行时拒绝；修正为平铺 `claim`、`claimMode` 和数组 `causalChain` 后通过。说明校验有效，但合同展示缺少完整合法示例，容易让模型误读。另一次不相关归因证据被拒绝属于正确防污染。

### 5. 旧认知机制仍然有用

- 开放新手在主线6失败后，根据玩家可见的治疗/护盾问题选择军械支线，获取破盾/裂甲装备，再用同阵容从全灭变为4人生还，说明类型1知识能支持找解法。
- 两边都能把角色相对标尺、角色职责、精确阵容历史和装备预期组合使用。
- 失败后换人预期没有退化。

## Files Produced

- `projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/2026-07-19_formal_structured_everify_ch1/open_novice_paired_alpha/session.json`
- `projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/2026-07-19_formal_structured_everify_ch1/open_novice_paired_alpha/summary.json`
- `projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/2026-07-19_formal_structured_everify_ch1/open_novice_paired_alpha/agent-notes.md`
- `projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/2026-07-19_formal_structured_everify_ch1/inertial_player_paired_alpha/session.json`
- `projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/2026-07-19_formal_structured_everify_ch1/inertial_player_paired_alpha/summary.json`
- `projects/western_fantasy_continent/.local_run_archive/player_agent_api_loop_v1/2026-07-19_formal_structured_everify_ch1/inertial_player_paired_alpha/agent-notes.md`

## Validation

- 两个session均由正式CLI逐轮推进。
- 开放新手60组正式request/response保存，30 cycle严格停止；125个JSON可解析。
- 惯性玩家40组正式request/response保存，Boss cycle20通关后停止。
- Root重新从两个session独立统计：
  - 开放新手：7条结构化链，1 confirmed / 1 refuted / 5 inconclusive，6次结构化知识更新；
  - 惯性玩家：5条结构化链，0 confirmed / 0 refuted / 5 inconclusive，0次结构化知识更新。
- `git diff --check`：PASS。

## Current State

正式结构化EVerify不再只是程序专项：真实Agent能理解、提出、结算并在后续使用新因果知识。它没有产生明显错误确认，也没有破坏换人、装备、类型1知识和角色标尺行为。

当前主要限制是普通感知下技能级因果证据过难同时接收；同时存在一个独立且明确的状态主体翻译Bug。开放新手Boss未通关主要来自较多换装消耗轮次和Boss两次失败，不应解释为EVerify接线失败。

## Unresolved

- 修复 `enemy_visible_status` 把我方技能写成敌方技能的主体/方向错误。
- 为结构化合同增加完整合法示例和更清楚的形状错误提示。
- 隔离测试“待验证链的限时注意力加权”，不要全局提高所有技能信息。
- 用已有角色认知的换出/换回案例专门覆盖正式换人A数值结算。
- 重复证伪后的决策掌控感折扣仍未验证。

## Recommended Next Step

先修复信号主体翻译Bug；随后用本轮相同两个session配置做一个小型A/B，只对Agent主动提出的链中技能提供有限注意力加权，目标不是提高确认率，而是把普通感知的有效可比较率从2/12提高到一个不过度确定的区间，同时保持错误链可被反驳、无证据链不学习。
