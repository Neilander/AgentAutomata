# Agent Handoff：解析器因果辅助证据通道

- Date: 2026-07-19
- Scope: 修正“原始战斗信号缺少击杀者/目标”的错误归因，并在现有解析器内增加不进入知识的因果辅助证据通道

## 用户目标

用户指出战斗原始信号本来应该包含“谁击杀了谁”，并提出在解析器中增加一个专门记录因果辅助判定信息、但不用于知识总结的部分。

## 关键纠正

上一份报告把“整理后的聚合信号缺少主体和目标”错误归因为“原始战斗信号缺少细节”。

真实`battle_information_real_event_fixture_v1`证明：

- 原始`death`事件已经保存`subject`、`result.target`、`time`和`behavior`。
- `presentation.hasSource=true`、`presentation.hasTarget=true`，这些细节属于玩家可见画面，不是后台诊断真值。
- 细节实际在`battle-information-parser.js::buildDeathSignals`中被四条击杀合并为“我方在本场击倒了4个敌方单位”时丢失。

因此不需要战斗引擎新增击杀信号，也不需要另造一套原始事件系统。

## 本次实现

### 两条并行输出

`battle-information-parser.js`现在输出：

1. `signals`
   - 保持原来的玩家语言摘要。
   - 继续供普通观察、知识整理和决策解释使用。
2. `causalEvidence`
   - 只保存当前战斗中玩家实际接收到的逐事件因果证据。
   - 不生成自然语言知识，不进入长期知识库。

### 当前白名单

- `combat_won`
- `combat_lost`
- `target_defeated`
- `ally_defeated`
- `skill_cast`
- `damage_dealt`
- `shield_applied`
- 明确标签支持的`control_applied`
- 明确标签支持的`damage_increased`

每条证据只包含：

- 公开语义ID
- 时间
- 谓词
- 公开主体引用
- 公开目标引用
- 白名单限定词
- 关卡环境
- 冻结后的信息档位

### 感知与隐私边界

- 每条辅助证据独立经过现有低/普通/高三档感知概率，不因为“击杀总数摘要被看到”就自动认为每一次击杀都被看到。
- `presentation.visible=false`的事件绝不会进入辅助证据。
- `left-4`、`right-2`、原始role、killerRole、targetRole等内部字段不会输出。
- 我方角色、敌方概念和本场敌方实体被转换为稳定或本场稳定的公开哈希引用。

### 与知识隔离

`received-information-organizer.js`携带`causalEvidence`，但：

- 不放进`receivedObservations`
- 不生成`routes.causalKnowledge`
- 不进入概率台账
- 审计字段固定记录`causalEvidenceRoutedToKnowledge=false`

`player-agent-loop.js`只把该通道保存在本场`receivedInformation`中。正式EVerify尚未消费它。

## 真实案例结果

固定真实fixture与种子`causal-real:6`：

| 感知档 | 收到辅助证据数 | 11.6秒游侠击杀 |
|---|---:|---|
| 低 | 8 | 未看到 |
| 普通 | 21 | 看到 |
| 高 | 45 | 看到 |

三档保持严格包含关系：低档收到的证据全部存在于普通档，普通档全部存在于高档。

把11.6秒击杀事件改成`visible=false`后，三档全部不再收到它。

使用另一固定种子`causal-chain:2`，普通感知实际收到：

1. 10.88秒林地游侠对边垒斧卫2造成伤害
2. 11.6秒林地游侠击杀同一目标
3. 49.6秒队伍获胜

这三条真实辅助证据直接进入结构化匹配器后：

- EVerify状态：`confirmed`
- support：`+1`
- strength：`0.4`
- 三步全部按时间顺序匹配

聚合摘要仍然只是“我方击倒4人”，但它不再承担细因果验证职责。

## 验证

以下全部PASS：

- `test-causal-evidence-channel.js`
- `test-causal-chain-event-matcher.js`
- `test-received-information-organizer.js`
- `test-battle-information-parser.js`

结构化匹配器现共16例：

- 6确认
- 3证伪
- 5证据不足
- 1部分确认
- 1非法输入

## 当前未完成

1. 正式Agent战前`causalChain`合同还没有使用解析器生成的同一套公开角色/目标引用。
2. 正式EVerify结算还没有读取`record.receivedInformation.causalEvidence`。
3. 当前辅助通道保存了所有通过感知的白名单事件；正式接线时可以根据待验证假设缩小读取范围，但不能删除反义事件和“其他角色完成同一击杀”等反证候选。
4. novelty与closure仍保持0，不在本次范围内。

## 下一步建议

先做一个小型正式合同接线：

1. 战前请求向Agent暴露当前可使用的公开角色与敌方目标引用。
2. Agent用这些引用写3到5步因果链。
3. 战后程序只从本场`causalEvidence`匹配正证、反证和顺序。
4. 仍不把原始辅助证据写成长期知识；只有EVerify确认或证伪后的假设结论才能进入现有因果知识更新。
