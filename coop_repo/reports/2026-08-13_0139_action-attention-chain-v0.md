# Agent Handoff: 动作—注意力链最小原型

- Date: 2026-08-13
- Agent/thread: Codex root
- Scope: 隔离验证“注意力区域→筛选→粘接动作→新区域/终点”流程模拟单元
- Status: complete

## User Intent

把近期讨论的流程模拟结构做成最小程序案例：注意力区域继续沿用“空间单位、内部连接、外部连接”；补充区域筛选条件；把所谓世界变化倾向还原为自然粘接的一系列动作；在自己决策、他人决策、随机结果或知识缺口处停止。用车吃子、UFS放骰和打牌触发事件验证同一结构。

## Completed

- 新建与正式玩家 Agent 隔离的通用运行器；运行器不知道车、飞机、骰子或卡牌，只处理图空间、注意力区域、筛选器、原子动作、粘接规则和终点。
- 注意力区域保留空间单位、区域内部连接、通往区域外部的连接，并支持单格、射线和有限深度扩散。
- 筛选器支持选择实体或空间单元；车案例沿四向射线只检查每个方向遇到的第一个对象，友军正确阻断后方敌人。
- 原子动作支持世界动作，以及只改变待执行参数而不改变世界的计算/调整动作。
- UFS对照中，完整链把4格下降经AA修正为3格；禁用这条无显眼世界变化的规则后，主链仍正常运行，但飞船多走一格、触发爆炸、城市生命从3降到2。
- UFS另测1格移动时注意力路径达不到AA格，因此不会错误套用修正。
- 卡牌案例中，“打出牌”自然粘出“翻开事件”和“放置指示物”两个动作；翻开事件后在他人决策点停止。
- 明确支持链条自然结束、自己决策、他人决策、随机结果、知识缺口和注意力预算耗尽。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/action-attention-runtime.js`: 通用图空间、区域筛选和动作链运行器。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/cases.js`: 车、UFS、卡牌三个声明式案例。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/test-action-attention-chain.js`: 五组结构与对照测试。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/demo.js`: 输出四条紧凑执行轨迹。
- `logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/README.md`: 中文边界与运行说明。

## Validation

- `node logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/test-action-attention-chain.js`: PASS，5组测试、3类游戏案例。
- `node logs/fb2/projects/western_fantasy_continent/experiments/action_attention_chain_v0/demo.js`: PASS，输出车、完整UFS、漏AA修正UFS、卡牌四条轨迹。
- 通用运行器游戏特判审查：除文件头声明“不知道chess/cards/UFS”外，没有这些游戏词或专用分支。
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS，现行正式玩家模型回归未受影响。
- `node --check` 与 `git diff --check`: PASS。
- independent_review: not_run；本轮没有另启子agent。

## Current State

最小程序证明同一套结构能够表达空间关系筛选、动作自然粘接、无世界变化的参数修正、后续注意力展开与不可继续推演的终点。尤其UFS对照支持当前认知假设：新手可以保持主行为链流畅，却因为少粘一个不显眼的修正步骤而稳定得到错误结果。

## Unresolved

- 当前规则与动作链由测试数据预先声明，尚未验证AI能否从自然语言规则稳定编译成这些结构。
- 尚未模拟读规则时的漏粘概率、执行时的注意力遗漏、熟练后动作块压缩。
- 多条规则仅按优先级追加动作；取消待执行动作、冲突消解和真正并行时序仍未建模。
- UFS案例是结构小例，不是完整正式规则引擎。
- 车案例为了验证链条终点，案例数据固定选择已发现的北侧目标；目标偏好不属于本运行器职责。

## Recommended Next Step

先给AI一小段自然语言规则，让它只生成这个原型要求的声明式“区域筛选＋粘接动作”结构，再由程序运行同一批案例。重点比较：完整编译、稳定漏掉无显眼状态变化的修正规则，以及是否凭空添加规则。不要立刻接入正式玩家Agent。
