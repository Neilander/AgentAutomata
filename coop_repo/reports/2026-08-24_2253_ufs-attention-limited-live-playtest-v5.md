# Agent Handoff: UFS受注意限制现场试玩V5

- Date: 2026-08-24
- Agent/thread: `/root/attention_limited_ufs_playtest_v5`
- Scope: 全新固定seed、严格单Attempt的41/153+注意裁剪现场试玩；推进研究选择、母舰阶段、spawn并封卷到下一回合，同时保存逐字证据和隔离/时序合同。
- Status: complete

## User Intent

不读取旧V1—V4实验私有过程、正式引擎、fixture、测试答案、会话实现或host checkpoint，只使用公开规则/策略知识、公开CLI合同和当前裁剪视图，独立完成一次全新UFS试玩。必须一次且仅一次Attempt，start前建立逐字捕获，真实遇到研究推进和spawn时自行选择并继续到下一回合、complete、unknown或attention_stop边界；最后写齐实验产物、合同测试和coop记录。

## Completed

- 创建 `ufs_attention_limited_live_agent_playtest_v5/`，在任何 start 前建立实验协议、固定seed注入、stdout/stderr/exit code捕获器和私有状态忽略规则。
- 使用新固定attention seed注入值 `2026082451`，执行一次且仅一次 `start`；没有重开、换seed或复放旧路线。
- 只凭每步41/153+裁剪view与自身真实动作记忆，完成五次骰子放置、一次真实random、能源房、挖掘、战斗机房、研究房、研究推进、母舰阶段和spawn选择。
- 在真实 `choose_research_advance` pending 中依据可见 budget 3、首格成本3、maxAdvanceSteps 1，独立提交 `advanceSteps=1`，随后继续而未停在观察阶段。
- 在真实 spawn pending 中从公开候选 `DP-C3 / DP-C4` 独立选择 `DP-C3`。公开README/help缺少必需参数名，九次只修正字段名的请求均原子拒绝且checkpoint不变；公开合同明确 `dropPointId` 后，同一候选成功推进到 `complete / new_round`。
- 在 `complete / one_round_imagined_to_next_round_boundary` 响应后立即封卷；最终 pending null、availableOperations 空，后续没有CLI命令。
- 保存24份逐字stdout、24份字节相同views、22份choice、每步stderr/exit code、24条thought log、带SHA-256的machine transcript、结果报告与可重复合同验证脚本。
- thought log逐步记录 noticed、explicitUnknowns、macroNeed、合法候选成本/条件/收益、真正改变选择的反事实、finalOperation 与 workingMemoryAfter；未出现对象始终记为未知。

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/EXPERIMENT_PROTOCOL.md`: 预先声明并最终补记隔离、固定seed、单Attempt、捕获时序、停止边界与spawn文档缺口。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/capture-cli.ps1`: 从start起在CLI子进程返回时直接逐字写入stdout，并分离stderr/exit code。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/.gitignore`: 排除 `.private-host-state/`。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/raw-stdout/`, `raw-stderr/`, `exit-codes/`, `views/`, `choices/`: 完整逐步I/O与玩家操作证据。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/thought-log.jsonl`: 24个决策/边界的注意受限推理记录。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/machine-transcript.json`: 0..23严格事件序列、单Attempt元数据、终止位置与每份stdout SHA-256。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/README.md`: 实验入口和证据导航。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/RESULTS.md`: 完整动作、注意反事实、封卷结果与接口观察。
- `projects/western_fantasy_continent/experiments/ufs_attention_limited_live_agent_playtest_v5/validate-contract.ps1`, `TEST_RESULTS.md`: 隔离、逐字、单Attempt、时序、noticed参数、random、研究推进、原子拒绝、terminal封卷和泄漏检查。
- `coop_repo/reports/2026-08-24_2253_ufs-attention-limited-live-playtest-v5.md`: 本报告。
- `coop_repo/REPORT_INDEX.md`, `coop_repo/LATEST.md`: 追加V5入口并更新当前重点。

## Validation

- `& 'projects\western_fantasy_continent\experiments\ufs_attention_limited_live_agent_playtest_v5\validate-contract.ps1'`: PASS，退出码0，14/14硬检查通过；24个事件、24份JSON stdout、24组SHA-256、24份byte-identical views、单start、单random、terminal后无命令、24条thought log全部通过。
- 每个advance的operation type均来自上一响应的`availableOperations`；所有标识符/候选值均出现在紧邻的上一份裁剪响应中，研究步数不超过公开`maxAdvanceSteps`。
- 10次payload拒绝被诚实保留：1次缺显式`pay:true`，9次spawn字段文档缺口；全部actionCount不变，最终`dropPointId=DP-C3`成功。
- 所有24个CLI子进程退出码0且stderr为空。
- 公共产物泄漏扫描未发现host checkpoint或私有状态标记；`.private-host-state/`未被玩家打开、搜索或列举。

## Current State

V5唯一Attempt已自然抵达下一回合边界并封卷。最终公开裁剪轨道为damage 0、energy 1、excavatorIndex 2、mothershipRow 0、researchIndex 1；`outcome=null`，因此这里只声明下一回合边界，不宣称胜负终局。固定seed能证明的是命令环境注入 `2026082451`；CLI没有公开回显其实际消费值。

此局证明当前接口能够让受限玩家真实做出研究推进并继续穿过母舰与spawn阶段，同时也暴露 `choose_spawn` 公开参数合同缺失。被拒绝的编码修正没有开启新Attempt，也没有改变策略候选或checkpoint。

## Unresolved

- `ufs_first_action_imagination_v0/README.md` 与CLI help仍只列 `choose_spawn` 操作名，没有公开必需的 `dropPointId` 字段；纯公开合同玩家无法唯一构造payload。
- CLI没有在玩家响应回显采用的attention seed，因此seed实际消费不可从公共输出复核。
- 本实验只有一个预注册Attempt，不能从单局推断总体策略强度或注意模型统计表现。
- 严格payload接受性不是全通过：10次拒绝是实验事实，不应被14/14硬性隔离/时序检查掩盖。

## Recommended Next Step

优先在公开README与CLI help补充 `choose_spawn` 最小示例 `{"type":"choose_spawn","shipId":"…","dropPointId":"DP-C3"}`，最好让spawn pending同时公开参数schema；另可在玩家响应中回显实际attention seed。若要验证文档修复，应另建全新预注册实验，而不是继续或重放本次已封卷Attempt。
