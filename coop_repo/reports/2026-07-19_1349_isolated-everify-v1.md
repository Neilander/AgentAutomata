# Agent Handoff：隔离版EVerify V1

- Date: 2026-07-19
- Agent/thread: root
- Scope: 在不接入正式模拟的前提下，开发并测试只负责因果确认与学习的EVerify候选模块
- Status: partial

## User Intent

用户要求先做一个小的、隔离的EVerify开发与测试。当前阶段只验证EVerify是否能把“结果好坏”和“玩家猜的原因是否成立”分开；novelty与closure继续保持0，不直接接入正式Agent。

## Completed

- 新增纯函数 `evaluateEVerify`，输入只包含玩家实际可获得的语义证据：
  - 是否真的有验证机会；
  - 假设中的机制是否发生；
  - 假设中的预期效果是否出现；
  - 该机制是主因、共因、辅助还是无关；
  - 是否存在强竞争解释；
  - 玩家看得是否清楚；
  - 玩家能否把效果归因到该机制。
- EVerify不读取结果价值R。测试把同一组因果证据的R从`+0.8`改为`-0.8`，EVerify输出完全一致。
- 区分两类假设：
  - `outcome_cause`：某机制是不是造成整个结果的原因；
  - `mechanism_effect`：某个局部机制是否真的产生了其局部效果。
- 输出支持：
  - `confirmed`
  - `partially_confirmed`
  - `inconclusive`
  - `partially_refuted`
  - `refuted`
- 保留当前约定的二层产出：
  - `knowledgeEvidence`
  - `strategySatisfaction`
- 负知识证据不会因为“实际贡献为0”被乘没。一个假设明确失败、因此对结果无贡献时，仍然必须形成负因果知识。
- novelty、closure固定为0；隔离模块明确标记`readsResultR: false`。

## Files Changed

- `projects/western_fantasy_continent/game_data/everify-isolated-v1.js`：隔离版EVerify候选计算。
- `projects/western_fantasy_continent/game_data/test-everify-isolated-v1.js`：7类确定性小案例和R独立性断言。
- `projects/western_fantasy_continent/design/task-budget-board.json`：记录隔离结果和正式接线前的下一步。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`：记录该候选模块尚未进入正式运行时。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：补充隔离测试入口和边界。

## Validation

- `test-everify-isolated-v1.js`：PASS。
  - 相同R=0.8，明确由玩家策略促成：策略确认`0.8784`，状态`confirmed`。
  - 相同R=0.8，主要由其他原因促成：策略确认`0.0925`，状态`inconclusive`。
  - R=-0.8，但局部机制清楚发生：局部机制假设`confirmed`，正知识证据`0.4623`。
  - 局部机制相同但画面与归因不清：证据可信度降到`0.1732`，状态`inconclusive`。
  - 赢了但预测效果缺失：策略确认`0`，状态`partially_refuted`，负知识证据`-0.2774`。
  - 机制和效果都明确失败：策略确认`0`，状态`refuted`，负知识证据`-0.9247`。
  - 根本没有验证机会：不比较、不学习、无策略确认。
  - 相同可见因果证据只改变R正负：EVerify深度相等。
- `test-player-feedback-model.js`：PASS。
- `test-player-cognition-v3-player-hypothesis.js`：PASS。
- `test-target-condition-contract.js`：PASS。
- `verify-causal-loop.js`：PASS。
- 任务板JSON解析：PASS。
- `git diff --check`：PASS。
- `independent_review`：not_run；用户要求的是确定性隔离小案例，没有启动多Agent玩法评审。

## Current State

隔离版已经验证了当前最核心的职责划分：

- R回答“结果对我好不好”；
- EVerify回答“我原来猜的机制或原因，是否被玩家可见证据支持”；
- 输了也可能学到局部机制；
- 赢了也可能证伪原先的原因；
- 看不清或没有验证机会时不会硬学。

正式运行时没有接入本模块，也没有升级版本。现有正式EVerify和因果知识线路保持原状。

## Unresolved

- 目前测试直接传入整理后的玩家语义证据；真实战斗事件如何自动翻译为机制发生、效果出现、竞争解释和归因清晰度，尚未开发。
- 机制权重`0.35`、效果权重`0.65`，以及`0.2/0.65`的部分/强确认阈值只是可解释的程序工作值，尚未经过真人校准。
- 正贡献知识会受因果贡献权重折扣；负证据故意不受该权重抹除。这一非对称关系需要用户确认。
- 同环境重复执行已经被强证伪行为时，EDecision掌控反馈仍未折扣。
- novelty、closure和发现爽感继续延后。

## Recommended Next Step

先由用户确认这7种关系是否符合体验直觉。确认后只做一层小接线：把固定战斗中的玩家可见事件翻译成隔离模块需要的语义证据，再与现有正式`causalEvidence`做并排对比；仍不直接跑完整两章。
