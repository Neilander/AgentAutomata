# Agent Handoff：EVerify完整因果链V2

- Date: 2026-07-19
- Agent/thread: root
- Scope: 将隔离EVerify从局部现象加权重建为Agent先写完整因果链、程序逐段验证
- Status: partial

## User Intent

用户判断EVerify的support本质上应当是因果计算。Agent在提出假设时必须写出完整行为链，例如“游侠增伤→游侠击败高血量敌人→敌方阵型被打破”；只有战后验证整条链，才能计算support。

## Completed

- 隔离模型升级为`everify_causal_chain_isolated_v2`。
- Agent侧隔离合同要求在行动前提供：
  - `claim`：整条假设；
  - `chosenBehavior`：选择的行为；
  - `causalChain`：至少3个有序语义步骤，每步包含唯一ID和玩家语言描述。
- Agent不能提交support或strength；即使提交`999`也会被忽略。
- 战后输入只允许现有认知层已经接收的步骤证据：
  - 对应哪个假设步骤；
  - `observed`或`contradicted`；
  - 现有冻结`informationTier`；
  - 事件时间；
  - 可选的玩家语义证据ID。
- 程序根据相邻步骤自行生成因果边：
  - 两步都被观察到且时间顺序正确：该边support为`+1`；
  - 任一步被明确反证，或结果发生在原因之前：该边support为`-1`；
  - 缺少任一步：该边support为`0/unknown`。
- 整条链使用合取规则，不再平均：
  - 所有边都成立：整链support=`+1`；
  - 任一边明确反证：整链support=`-1`；
  - 没有反证但链不完整：整链support=`0`。
- 已经成立的前缀不会丢失：
  - 整链未确认时不产生整链正知识与策略爽感；
  - 已成立的局部边单独输出`localLinkKnowledge`，可以更新局部机制知识。
- strength不再使用`35/65`：
  - 完整确认链取所有因果边中最弱的那一边；
  - 整链反证取明确反证步骤的冻结信息档位强度。
- R继续完全独立；相同链证据把R从正改为负时，EVerify完全相同。

## Files Changed

- `projects/western_fantasy_continent/game_data/everify-isolated-v1.js`：重建为完整因果链V2计算器。
- `projects/western_fantasy_continent/game_data/test-everify-isolated-v1.js`：重写为因果链合同和边界案例。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：记录V2隔离合同及未正式接线边界。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：记录V2测试入口。
- `projects/western_fantasy_continent/design/task-budget-board.json`：更新成功条件、证据和下一步。

## Validation

- `test-everify-isolated-v1.js`：PASS。
  - 完整链三步都被按序观察：整链support=`+1`，strength=`0.7`，知识证据与策略爽感均为`0.7`。
  - 中间“游侠击败高血量敌人”被明确反证：即使最终阵型确实破裂，整链support=`-1`，知识证据`-0.8`。
  - 只确认“增伤→击败高血量敌人”，末端没有收到证据：整链support=`0`，但局部链保留`+0.7`知识证据。
  - 前缀成立但“击败→破阵”被反证：整链support=`-1`；前缀`+0.7`与末端`-0.9`分别保留。
  - 结果时间早于原因：对应因果边反证。
  - 自定义`0.63`信息值：拒绝，不产生比较。
  - 只有两步的宽泛假设：`invalid_hypothesis`，不产生support。
  - 相同链证据只改变R正负：EVerify深度相等。
- `test-information-presentation-tiers.js`：PASS。
- `test-battle-information-parser.js`：PASS。
- `test-player-feedback-model.js`：PASS。
- `test-player-cognition-v3-player-hypothesis.js`：PASS。
- `test-target-condition-contract.js`：PASS。
- `verify-causal-loop.js`：PASS。
- 任务板JSON解析和`git diff --check`：PASS。
- `independent_review`：not_run；本轮是隔离合同和确定性公式小测试，未生成完整玩家轨迹。

## Current State

当前support已经不再表示“机制发生占35%、效果发生占65%”的混合分。它表示整条Agent假设链是否被玩家已经接收到的语义步骤完整支持。

以本次案例为例：

```text
游侠获得足够单点增伤
-> 游侠击败高血量敌人
-> 敌方保护阵型被打破
```

只有两条箭头都被玩家可见证据按时间顺序支持，整条假设才确认。后半段失败不会抹掉前半段已经学到的局部机制。

本模型仍然是隔离候选。正式Agent请求目前还没有`causalChain`字段，正式战斗解析器也没有自动把已接收事件匹配到链条步骤。

## Unresolved

- 正式Agent合同尚未要求完整`causalChain`。
- 当前步骤证据由确定性测试预设；真实玩家语义事件到步骤`observed/contradicted`的匹配器尚未开发。
- “两件事按顺序发生”只能构成因果支持，不是绝对因果证明。后续匹配器仍需检查主体、目标、行为、结果和环境是否对应，不能只看时间。
- 当前只支持线性链；分支因果、多个共同原因和替代链尚未建模。
- 完整链正证据使用最弱边原则；该原则比平均数更符合合取链，但尚未真人校准。
- novelty、closure和重复强证伪行为的EDecision折扣仍未完成。

## Recommended Next Step

先让用户确认线性因果链、整链合取和局部前缀学习这三个关系。通过后，先扩展正式Agent假设JSON合同，但仍不接反馈；用2到3个固定Agent输出验证它能稳定写出主体、环境、行为、结果明确的链条。随后再单独开发已接收语义事件到链条步骤的匹配器。
