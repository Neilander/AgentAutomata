# Agent Handoff: 1—6 玩家设想流水线接线 v0

- Date: 2026-08-19
- Agent/thread: `/root`
- Scope: 在不修改正式玩家的前提下，把动作模式、有限注意、五槽Q、矩阵激活、对象实例化与连续设想停止接成一个可运行的单候选动作单元
- Status: complete（最小合同接线位于临时detached worktree；旧GTE/153项源码属于正式`fb2`模拟玩家worktree，尚未直接接入）

## User Intent

先把此前围绕“AI如何形成设想”分别验证的前六个问题接起来，再做程序测试，确认一条真实可执行的最小链能够运行；暂不扩展到全量正式玩家、主动候选规划和反馈学习。

## Completed

- 新建隔离的 `imagination_pipeline_v0`，未修改正式玩家或正式游戏代码。
- 实现动作模式实例化：当前只接 `place_die`，输出入口参数、空间注意展开和命名出口。
- 实现微型公开状态原子注意力场：默认、动作关系、目标、显眼特殊格、复盘调整和有限状态项预算合成连续激活。
- 实现注意结果到五槽Q的薄适配：同列多个完整对象分别形成Q；缺少必要公开字段时不补全。
- 实现严格五槽合同与预编译矩阵激活端口；Top-K轨迹仍由激活产生，关系门只排除“经过箭头/停在箭头”等当前事实矛盾。
- 复用 `blind_rule_program_micro_v0/submission/submission.js` 完成同列、冻结和参数移动的对象实例化；参数程序只接收已注意到的对象子集。
- 对每个 grounding 实际读取做注意力门控；读取未进入本次注意的公开事实会转为 `attention_stop`，不会泄漏后续答案。
- preview patch 只在控制器允许后提交到 `imaginedWorld`；`observedWorld` 全程不变。
- 实现自动继续、明确完成、随机、选择、未知、感知不足、设想注意力耗尽和重复Q保护。
- 完整演示跑通：放骰 → 同列非冻结飞船下降 → 激活箭头轨迹 → 排除“仅经过箭头”高激活干扰 → 箭头横移 → 城市受伤 → 明确完成。
- 修复首轮测试暴露的两个问题：未知边界曾被错误覆盖为 `max_iterations_reached`；PowerShell入口曾未传播中间Node失败码。

## Files Changed

- `projects/western_fantasy_continent/experiments/imagination_pipeline_v0/five-slot-activation.js`: 严格五槽合同、确定性测试编码器和预编译矩阵激活端口。
- `.../trajectory-fixtures.js`: 带来源元数据的同构已编译轨迹、五槽Q和微型公开场景。
- `.../imagination-pipeline.js`: 动作、注意、Q、激活、关系门、grounding、读取门控、imaginedWorld提交和连续设想编排。
- `.../test-imagination-pipeline.js`: 10项合同、完整链、边界、安全与消融测试。
- `.../run-validation.js`: 七个可复跑场景及机器可读验证生成器。
- `.../run-demo.js`: 输出一条完整设想链的紧凑审计记录。
- `.../run-local.ps1`: 语法、测试、验证与演示的一键入口，严格传播Node失败码。
- `.../artifacts/validation.json`: 七个场景的最新机器结果。
- `.../README.md`: 接线结构、复用边界、注意力安全、运行方式和诚实限制。
- `coop_repo/reports/2026-08-19_1909_imagination-pipeline-1-to-6-wiring-v0.md`: 本报告。
- `coop_repo/LATEST.md`: 增加本流水线入口并更新当前重点。
- `coop_repo/REPORT_INDEX.md`: 增加本报告索引。

## Validation

- `powershell -ExecutionPolicy Bypass -File projects/western_fantasy_continent/experiments/imagination_pipeline_v0/run-local.ps1`: PASS，退出码0。
- Node测试：10/10 PASS，包括严格五槽、矩阵激活、关系门、完整箭头城市链、正常/随机/选择/未知、两类注意力停止、空记忆和重复Q保护。
- 场景验证：7/7 PASS；完整链状态为`complete`，普通格`complete`，随机格`random`，选择格`choice`，陌生格`unknown`，感知与设想预算不足均为`attention_stop`。
- 完整链初始形成2条对象Q；冻结对象被参数程序排除，异列对象未进入grounding；普通飞船从B2下降到B4、横移到C4，城市生命3→2。
- 激活后关系门确实拒绝激活约1.0的“只是经过箭头”干扰轨迹，并采用同样高激活但关系符合的“停在箭头”轨迹。
- 每次grounding读取路径都属于本次注意结果；18项感知预算案例在读取未注意的箭头目标前停止，城市生命不变。
- 0.5设想注意预算案例在第一条效果提交前停止，飞船位置不变。
- 所有场景`observed_world_unchanged=true`。
- `blind_rule_program_micro_v0/run-local.ps1`: 第0/1/2轮3/3、6/6、10/10，退出码0。
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: `result: PASS`，正式玩家旧回归未受影响。
- `git diff --check`: PASS；只有已有协调记录、盲测实验和本次新隔离实验变更，正式玩家源码未改。

## Current State

现在已有一个真实可执行的“单候选动作设想单元”：候选放骰动作经过动作模式、有限公开注意、多个五槽Q、矩阵Top-K激活、激活后关系核对、当前对象/参数绑定、封闭preview与连续停止控制，最终输出可审计的设想世界、读取路径、拒绝联想和停止原因。

这次闭合的是六层之间的数据合同和运行控制，不是宣称旧模块原文件已经直接合并。`D:\GithubDesktop\AgentAutomata\logs\fb2` 本身是正式Git worktree，当前分支`codex/player-feedback-v2-trial`；外层主worktree忽略`logs`不影响fb2内部跟踪。首次普通`rg --files`因从外层搜索并遵守ignore规则漏掉了嵌套worktree。当前实验位于另一个临时detached worktree，仍使用可替换端口：grounding复用当前可执行盲测提交；五槽激活使用预编译矩阵＋确定性测试编码器；教程轨迹与注意力空间使用同构微型实现。

## Unresolved

- 必须直接在正式`fb2`模拟玩家worktree中读取真实GTE五槽编码器并接线；不应把已有模块再次迁移到第二个位置。
- 必须在`fb2`中接入已有153项UFS公开状态模块；当前临时微型参数不代表真人标定。
- 当前`fb2`状态显示`adaptive_rule_program_v0/`仍为未跟踪目录；迁入新流水线前必须保留并处理该既有工作，不能覆盖或清理。
- `trajectory-fixtures.js`代表规则阅读器的已编译输出，不是本次重新运行真实教程自然语言编译器。
- 当前只支持一类候选动作`place_die`和同构微型地图；没有覆盖挥砍、一般移动、房间阶段或完整UFS回合。
- 当前输出止于单候选设想；第7项候选生成/比较和第8项反馈修改轨迹、动作或注意力仍未接入。
- 形式上支持并行Q，但本轮重点是单条确定链和停止边界；复杂并行自动/随机分支组合仍需扩展回归。
- 新实验依赖同一工作树内尚未提交的 `blind_rule_program_micro_v0`；交付时必须与该依赖一起保留。

## Recommended Next Step

不要直接接正式玩家。先保持这10项与7场景回归冻结，按端口逐个替换同构件：第一步接回真实GTE五槽编码器和真实已编译规则轨迹；第二步接真实UFS公开快照与153项注意力输出；每替换一层都必须维持未注意读取为0、观察世界不变和全部停止边界。全部通过后再作为影子设想结果挂到正式玩家决策旁边，不影响实际行为。
