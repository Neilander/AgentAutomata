# Agent Handoff：EVerify输入边界纠正

- Date: 2026-07-19
- Agent/thread: root
- Scope: 删除隔离EVerify中凭空新增的画面清晰度与归因清晰度输入，改用现有冻结信息档位
- Status: partial

## User Intent

用户指出当前模拟没有画面输入，只有已经设计并冻结的若干信息等级；EVerify不能自行编造`perceptualClarity`和`attributionClarity`连续数值。

## Completed

- 明确认错：上一版隔离测试手填`0.95/0.9`和`0.15/0.2`作为画面/归因清晰度，越过了现有信息接收合同。
- 删除隔离EVerify的：
  - `perceptualClarity`
  - `attributionClarity`
  - 手填连续`competingExplanationStrength`
- 新边界分为两步：
  1. 现有`low / ordinary / high`玩家模型在上游决定事件是否被玩家收到。
  2. EVerify只读取已收到机制/效果事件原有的`information_presentation_tier_v2`档位。
- EVerify不重复计算接收概率，也不接收自定义清晰度小数。
- 证据strength直接使用唯一冻结数值源`game_data/combat-signals.js`中的档位强度：
  - `background=0.25`
  - `ambient=0.40`
  - `standard_low=0.50`
  - `standard=0.60`
  - `standard_high=0.70`
  - `prominent=0.80`
  - `highlight=0.90`
  - `blocking=1.00`
- 因果归因当前只使用已有分类：`primary / joint / supporting / irrelevant / unknown`。
- 新增硬断言：传入`0.63`或`0.77`这类自定义呈现数值时，EVerify拒绝比较，strength为0。

## Files Changed

- `projects/western_fantasy_continent/game_data/everify-isolated-v1.js`：删除两类自造清晰度输入，接入冻结信息档位常量。
- `projects/western_fantasy_continent/game_data/test-everify-isolated-v1.js`：全部案例改用现有档位，并加入自定义数值拒绝测试。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：纠正隔离候选输入合同。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：纠正测试说明。
- `projects/western_fantasy_continent/design/task-budget-board.json`：替换错误证据与下一步。

## Validation

- `test-information-presentation-tiers.js`：PASS。
- `test-battle-information-parser.js`：PASS。
- `test-everify-isolated-v1.js`：PASS。
  - 自定义连续呈现值被拒绝。
  - `readsPerceptualClarity=false`。
  - `readsAttributionClarity=false`。
  - `readsResultR=false`。
  - 同一局部机制使用`standard_high + prominent`时strength为`0.765`。
  - 同一局部机制使用`ambient + standard_low`时strength为`0.465`。
  - 明确由策略促成的胜利：策略确认`0.965`。
  - 胜利但该策略对结果无关：策略确认`0`。
  - 明确证伪：负知识证据`-0.965`。
- `test-player-feedback-model.js`：PASS。
- `test-player-cognition-v3-player-hypothesis.js`：PASS。
- `test-target-condition-contract.js`：PASS。
- `verify-causal-loop.js`：PASS。
- 任务板JSON解析与`git diff --check`：PASS。
- `independent_review`：not_run；本轮是输入合同纠错与确定性回归，不是完整玩家轨迹。

## Current State

上一份`2026-07-19_1349_isolated-everify-v1.md`中关于“画面/归因清晰度”的描述已经被本报告纠正，不应继续使用。

当前隔离版不需要游戏提交任何新画面参数。前端仍然只选择八档信息呈现等级；三类玩家的接收模型仍然只在现有信息解析层运行一次。EVerify位于接收之后，处理已经进入玩家认知的证据。

## Unresolved

- 当前尚未把真实已接收事件自动组合成“机制发生/效果出现/因果贡献”。
- `MECHANISM_WEIGHT=0.35`、`EFFECT_WEIGHT=0.65`及确认阈值仍是隔离候选参数，尚未正式确认或接线。
- 因果贡献分类怎样由多条玩家可见事件产生，仍需下一个小模块验证。
- novelty、closure与重复强证伪行为的EDecision折扣仍未完成。

## Recommended Next Step

先确认纠正后的输入边界。下一步若继续，只构造一个小型“已接收事件组合器”：输入是现有解析器真正交给某档玩家的事件及其informationTier，输出是机制状态、效果状态和分类贡献；禁止新增任何前端清晰度参数。
