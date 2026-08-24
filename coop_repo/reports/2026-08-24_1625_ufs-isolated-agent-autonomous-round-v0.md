# Agent Handoff: UFS隔离Agent自主一回合实验 v0

- Date: 2026-08-24
- Agent/thread: `/root/autonomous_ufs_round`
- Scope: `simulatePlayer` worktree；第1—9页规则知识驱动的自主选择一回合隔离实验
- Status: complete

## User Intent

让隔离子Agent从真实公开初始局面出发，不使用旧固定回合答案、不向认知路径泄漏正式引擎，在每个choice边界独立写出成本—条件—收益判断卡，并通过当前完整注意→五槽Q→真实GTE轨迹→JSON程序链完成一回合；实验结果写报告供主Agent验收。

## Completed

- 新建`ufs_autonomous_round_agent_v0`隔离实验，公开初始状态已去掉`seed/rngState/history`。
- 子Agent按当时已知状态依次完成P1—P5放骰、R1—R5房间决策和S1生成平局判断卡；不是复用`one-round-fixture.js`，实际选择序列也与其不同。
- 放骰选择为：灰4→C5能源、灰3→C4能源、白5→C1战斗机、重投后白5→路径2/C3、再次重投后灰4→C2 AA。
- 两个白骰随机边界都先由认知程序返回`random`，再以外部观察恢复：第一次灰2→3、白1→5；第二次最后灰3→4。认知driver不生成骰值。
- 房间选择为：先结算值4能源房、跳过无目标的值4战斗机、支付1能源挖到路径2、跳过AA、结束房间阶段。
- 母舰H0生成白船时，当前Q/程序给出`DP-C1`与`DP-C3`真实二选一；Agent用公开低编号破平局选择C1。
- 完成一回合到`new_round`边界；0个`attention_stop`、0个`unknown`、0个非法动作。最终脑内状态为能源5、伤害0、研究0、挖掘2、母舰H0。
- 5次放置均经`external_full_attention`，空间规模153→157、每步noticed 41；后续事件最大158项，并有短期注意痕迹。
- 完整机器trace保存注意字段、Q、真实GTE候选/激活、JSON程序grounding及patch，大小约1.4MB。
- 正式引擎隔离到单独的事后审计文件；合法性审计为5/5放置、5/5房间动作，2/2随机观察匹配，最终状态逐字段一致。

## Choice Review

本回合是“可解释、偏保守，不保证最优”：

- 强项：前两步确定完成值4能源房；随后用1能挖两格，符合已形成的“能源→挖掘→深层房间”知识链；战斗机结算时发现无目标便止损跳过；生成平局没有伪造不存在的策略依据。
- 可争论处：P3把白5放战斗机只是保留可能射击，最终没有目标；P5选择AA而非可付费的值4研究，放弃了两格研究进度。它说明Agent能形成连续选择，不说明策略已经优秀。

## Architecture / Honesty Boundary

- 真正由子Agent完成的是逐choice判断和最终选择；判断卡按顺序记录每次外部观察后的新状态。
- 现有`UfsOneRoundImagination`尚无逐choice恢复API，因此adapter把已经写好的选择表一次性编译给脚本接口复放。它不负责选择；底层trace的遗留标签`fixed_test_script`是接口标签，不是旧fixture答案来源。
- 候选发现目前仍是Agent依据地图/知识做的聚类判断，不是可复用的通用自动候选生成器。
- 认知driver不导入正式引擎、`scenario-fixtures`或`one-round-fixture.js`；单独的`audit-formal-oracle.js`只在实验trace生成之后运行。
- oracle一致仅证明本样本推断未偏离正式规则，不是认知目标，也不证明策略最优。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/README.md`: 实验结论、隔离边界、选择摘要、脚手架与风险。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/JUDGMENT_CARDS.md`: 11个玩家choice边界的完整简短判断卡。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/public_initial_state.json`: 去隐藏字段的真实初始公开状态。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/external_random_observations.json`: 两次公开随机恢复值及来源声明。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/agent_decisions.json`: 机器可复放的子Agent决定。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/run-autonomous-round.js`: 不导入正式引擎的认知复放driver。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/machine-trace.json`: 完整机器trace与摘要。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/audit-formal-oracle.js`: 独立事后合法性/oracle审计。
- `projects/western_fantasy_continent/experiments/ufs_autonomous_round_agent_v0/test-autonomous-round.js`: 6项专项测试。
- `coop_repo/REPORT_INDEX.md`、`coop_repo/LATEST.md`: append-only协作入口。

## Validation

- `node .../run-autonomous-round.js --write`: PASS，`complete`，一回合到`new_round`，0 attention_stop / 0 unknown。
- `node --test .../test-autonomous-round.js`: 6/6 PASS。
- `node .../audit-formal-oracle.js`: PASS；5/5放置与5/5房间动作合法，2/2外部随机值匹配，最终状态一致。
- `ufs_first_action_imagination_v0/test-*.js`: 51/51 PASS。
- 相关想象流水线与本实验组合：16/16 PASS。
- `git diff --check`: PASS（仅共享工作树既有LF/CRLF提示）。
- 基线：分支`simulatePlayer`，HEAD `8895f8c`；`53367a4`仍为当前HEAD祖先。未使用旧`fb2`或`fifteen-day-web`。

## Current State

现在有了一条可复放、可审计的“Agent自己判断一回合”样本：选择理由、随机观察、完整注意、Q、轨迹、程序和事后oracle都分层保存。它证明当前认知后果链可以承接连续主动选择，但尚未证明选择循环已经产品化。

## Unresolved

- 最大缺口是逐choice暂停/恢复API。当前是“Agent顺序作答后编译复放”，不是运行时每次由通用策略函数即时生成下一步。
- 候选合法性发现仍是判断卡中的规则推理；要泛化到任意局面，需要独立、非引擎的公开规则候选生成器。
- 只有一个注意种子与一个初始局面；没有覆盖自然漏看导致Agent改选、unknown或认知偏差的自主决策样本。
- 选择质量可争论；尤其P3战斗机未兑现，P5放弃研究。不要把oracle一致误写成策略最优。

## Recommended Next Step

先把`UfsOneRoundImagination`拆成可序列化的`start → advance(choice|observation) → choice/random/complete`会话接口，再把本次11张判断卡替换成一个每个边界现算的候选判断器；保留本样本作为首个逐choice回归基线。
