# Agent Handoff：假设定向注意与状态来源修正

- Date: 2026-07-19
- Agent/thread: Codex `/root`
- Scope: 修正状态敌我来源边界，并把玩家的待验证假设作为战斗信息整合前的限时注意力
- Status: complete

## User Intent

修复上一轮报告中的状态主体Bug，并加入“玩家有明确假设时会额外注意假设相关角色、技能和结果”的机制，让信息整合器在接收战斗证据之前有方向地关注一部分内容，同时不能直接看见答案。

## Completed

- 重新追踪开放新手 `request-024` 对应的原始战斗：
  - 猎标箭、余烬火球、烈焰扩散和钉足箭在该场确有 `right` 侧敌人施放；
  - 上一报告把敌我都存在的同名技能误判成了方向Bug；
  - 那句“敌方单位施加过……”本身有敌方来源证据。
- 找到并修复实际的方向漏洞：
  - 旧解析器把没有施放者的 `subject=null` 场地状态默认归到我方；
  - 现在角色状态只有明确 `left` 或 `right` 来源才能进入我方角色/敌方行为总结；
  - 无来源场地状态继续进入独立环境规则通道，不再猜敌我。
- 新增 `hypothesis_directed_attention_v1`：
  - 只读取当前战斗有资格结算的 `pending causalChain`；
  - 只复制已经通过正式合同校验的公开结构化 matcher；
  - 最多同时关注2条假设、6个具体步骤；
  - 战斗胜负这种必然显眼的结果步骤不加权；
  - 精确匹配到假设步骤的可见因果事件增加固定 `0.12` 接收强度；
  - 仍经过玩家原本的低/普通/高感知概率，可以继续漏看；
  - 不提高信息档位，不改变EVerify证据强度，不改变support，不影响普通类型1知识，也不影响无关事件。
- 正式循环已经接线：战斗后解析前，从当前玩家认知中的待验证假设生成本场注意目标，再由整合器筛选因果证据。
- 整合器审计新增注意力是否启用、目标数、匹配候选数、实际接收数，以及“不改档位/不碰普通知识”的边界记录。
- 运行时版本更新为V27。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/hypothesis-directed-attention.js`：从当前待验证链生成有限公开注意目标。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/battle-information-parser.js`：修正无来源状态方向；只为精确匹配的因果证据增加接收强度。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/received-information-organizer.js`：保存定向注意审计。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`：正式战斗解析前接入当前假设注意目标。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-hypothesis-directed-attention.js`：状态来源、旧真实Agent记录A/B和240种子校准。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-formal-structured-causal-agent-loop.js`：正式确认、反驳和假设技能未出现三类注意力接线回归。
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`、`player_model_runtime.json`：记录V27正式边界。
- `projects/western_fantasy_continent/design/task-budget-board.json`：关闭状态来源Bug，记录假设定向注意完成。

## Validation

- 旧场景来源复查：敌方技能候选的全部证据来源均为 `right`；我方候选全部为 `left`；无来源场地状态进入角色方向候选数为0。
- 两位真实Agent的12条旧假设与原始战斗不变，只重放接收层：
  - 基线严格复现：1 confirmed / 1 refuted / 10 inconclusive；
  - 加定向注意：1 confirmed / 2 refuted / 9 inconclusive；
  - 新接收到8条假设相关证据；
  - 没有把全部链变成确认，新增明确结算是对一条战败链补齐技能伤害后得到反驳。
- 同一真实战斗240个接收种子：
  - 完整链可比较率从 `0.0958` 提高到 `0.1875`；
  - 定向注意后仍有81.25%无法闭合；
  - 无关因果证据选择变化 `0/240`；
  - 普通知识观察完全不变；
  - 已接收证据的信息档位完全不变。
- 正式结构化循环：
  - 正确链 confirmed；
  - 错误结果链 refuted；
  - 假设备用角色技能但角色未上场，匹配候选数0，仍 inconclusive且不学习。
- 回归全部PASS：
  - `test-hypothesis-directed-attention.js`
  - `test-formal-structured-causal-agent-loop.js`
  - `test-received-information-organizer.js`
  - `test-battle-information-parser.js`
  - `game_data/test-causal-chain-event-matcher.js`
  - `verify-causal-loop.js`
  - `git diff --check`

## Current State

玩家现在如果主动提出“这个角色施放某技能、产生某效果、最后导致某结果”的待验证链，下一场会更容易注意链中对应的公开角色/技能事件，但不会因此直接获得事件、胜负答案或更高可信度。注意只发生在战斗信息接收之前；一旦接收，EVerify仍完全按原来的结构化证据和冻结档位计算。

状态主体也不再对无来源事件猜测敌我。上一报告对 `request-024` 的具体Bug判断已被本报告纠正，但由此发现的真实无来源漏洞已经修复。

## Unresolved

- `0.12` 已通过旧真实记录和240种子隔离校准，但尚未用新的长程真实Agent运行观察假设提出频率是否反过来改变。
- 正式请求仍缺一份完整合法的 `causalChain` 示例和更友好的合同形状错误提示。
- 重复证伪后的决策掌控感折扣仍未专项验证。
- novelty和closure继续固定为0，本次没有提前开发。

## Recommended Next Step

先补完整合法的结构化假设示例，再做“同一假设连续被证伪后，Agent是否仍重复选择以及掌控反馈是否衰减”的小型专项；无需立即再跑完整两章。
