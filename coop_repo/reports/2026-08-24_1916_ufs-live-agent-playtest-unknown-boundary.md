# Agent Handoff: UFS现场Agent逐操作试玩真实Unknown边界

- Date: 2026-08-24
- Agent/thread: `/root/clean_live_ufs_playtest`
- Scope: `simulatePlayer` worktree；现场策略选择与逐操作会话盲测
- Status: partial（实验按真实停止边界完成；回合未完成）

## User Intent

让一个Agent不预写整回合脚本，而是每次读取当前脑内环境、比较候选和预想后果、只选择
一个操作，再根据程序返回的新环境继续；保留“想到某条路会输/有风险，所以不走”的真实
思路流程，由主Agent事后阅读分析。

## Completed

- 建立严格白名单和时序协议。封卷前未读取旧scenario、fixture、decision、judgment card、
  trace、driver、audit、oracle、正式engine或session底层实现。
- 用`UfsOneRoundSession.start/advance`真实提交三个独立operation；每步先追加思路JSONL，
  每个choice文件只含当前一个operation，没有未来动作数组。
- 第一步灰4进入双格能源房左格，第二步灰3补右格；两步均由新response确认骰子、房间与
  紫机脑内位置变化。
- 第三步灰2选择`A-upper-tunnel`后，系统返回
  `unknown: no_rule_for:placement_room_state`；灰2和紫机后果没有应用，且操作口为空。
- 把该unknown视为本次唯一Attempt的真实终止；没有回滚、改走已知路径或另开Attempt凑
  完整回合。
- 记录三处预想实际改变选择：避开灰4战斗机列的母舰下降风险；因双格房缺格确定零产出
  而补齐能源；排除灰2研究的确定零收益及灰2战斗机的母舰风险。没有把“风险”夸成“必输”。
- 保留完整机器transcript、逐response快照、最终response/checkpoint、思路日志和事后审计。
- 随机gateway已实现但本样本未进入白骰随机边界，因此没有调用，也没有提前生成随机值。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/PROTOCOL.md`: 白名单、逐步时序、随机门和解释边界。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/session-cli.js`: start/单operation advance、逐步快照与只追加机器transcript。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/random-gateway.js`: 仅当前random边界生成当前未放骰子的观察。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/thought-log.jsonl`: 三次选择前判断及unknown后的封卷解释。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/machine-transcript.jsonl`: start + 3次advance原始时序。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/choices/`: 三个独立当步operation。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/responses/`: 每一步完整机器response。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/runtime/final-response.json`: 终止response。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/runtime/final-checkpoint.json`: 终止checkpoint。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/test-live-playtest.js`: 时序、choice、重放与依赖污染合同测试。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/RESULTS.md`: 现场过程和可解释结论。
- `projects/western_fantasy_continent/experiments/ufs_live_agent_playtest_v1/posthoc-audit.json`: 封卷后审计与未运行formal oracle的原因。

## Validation

- `node --test .../test-live-playtest.js`: 4/4 PASS。
- transcript时序：`start → advance(gray4 energy-left) → advance(gray3 energy-right) → advance(gray2 tunnel)`。
- actionCount：`0 → 1 → 2 → 3`；status：`choice → choice → choice → unknown`。
- 确定性重放：再次抵达相同`no_rule_for:placement_room_state`，操作口为空，第三骰仍未应用。
- choice合同：3/3文件是单一operation对象，没有未来动作数组。
- 依赖审计：试玩runtime源码没有旧答案目录、fixture、formal engine或oracle import。
- formal oracle：未运行。该样本未完成一回合，把不完整终止态对比正式回合末真值会回答错误问题。

## Current State

逐operation接口确实能支持Agent看到新环境后再规划，并能留下事前候选比较和反事实证据。
本次样本也比“顺利完整一回合”更早暴露了一个关键现实缺口：策略层会自然提出“普通隧道
房放骰”这种合法选择，但认知链没有`placement_room_state`对应规则时，会在骰子阶段直接
unknown，不能继续到白骰、房间或母舰阶段。

最终脑内状态：能源2、伤害0、研究0、挖掘0、母舰-1；只有灰4/灰3两次能源房放置已
应用，第三次灰2操作只在历史中存在，未进入脑内observation。

## Unresolved

- `A-upper-tunnel`放置缺少`placement_room_state`规则/接线。需要先判断：隧道格是否应当
  形成一个“无房间阶段效果但放置与天空后果继续”的显式认知轨迹，还是作为控制流无操作
  类型处理；不能为了让测试过而静默跳过未知。
- 样本没有进入随机、房间、母舰、生成边界，因此不能据此评价后半回合的现场策略能力。
- 这不是OS级盲测；可信度来自封卷前白名单、只追加时序、单operation文件和事后审计。
- thought log是策略解释，不是模型隐式推理的逐字转录。

## Recommended Next Step

先补齐普通隧道房放置的认知语义与自动Q/轨迹/程序接线，并新增一个不依赖本次具体选择的
最小回归：合法隧道放置应继续到下一玩家choice，而不是`unknown`。修复后再派一个新的盲测
Agent跑唯一新Attempt；不要复用本样本做策略答案。

