# Agent Handoff: 双Agent两章认知提升对比

- Date: 2026-07-18
- Agent/thread: root + open_novice_two_chapter + inertial_two_chapter
- Scope: 用两个独立玩家Agent重跑丰富大地图第1～2章，并与相同类型、相同种子的旧本地轨迹对比
- Status: complete

## User Intent

最近已经完成信息过滤、角色认知、相对标尺、历史阵型坐标、换装预期、新关惯性和确认感等大量更新。用户要求两个不同子Agent重新跑完整两章，利用本地旧报告判断这些优化是否真实提升行为，并重点检查已优化的部分。

## Completed

- 开放新手与惯性玩家各由一个独立子Agent完成两章。
- 两者均使用旧对照相同的 `paired-alpha` 种子、`ordinary` 感知和 `enriched_v1` 环境。
- 两个子Agent只读取每轮正式request，没有预读旧统计、另一名玩家轨迹或设计者结论。
- 完整request、response、session、summary和中文玩家记录保存在本地忽略目录。
- 添加可复现的新旧对比程序和紧凑 `comparison.json`。
- 写入中文对比报告，并更新README和任务板。
- 任务板新增三个真实长跑问题：支援/坦克强度低估、原阵重试随机污染、假设条件字段合同不一致。
- 更新“错误决策不扣情绪”证据：确认与证伪目前都获得相同EVerify过程反馈，且换人A覆盖不足。

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/compare-post-cognition-two-agent-runs.js`：统一读取新旧四条轨迹并输出可复算对比。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/controlled_runs/2026-07-18_post_cognition_two_agents/comparison.json`：紧凑机器结果。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/controlled_runs/2026-07-18_post_cognition_two_agents/COMPARISON_REPORT.md`：完整中文结论。
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`：登记本轮双Agent证据与边界。
- `projects/western_fantasy_continent/design/task-budget-board.json`：更新现有任务证据并新增三项问题。
- `.local_run_archive/player_agent_api_loop_v1/2026-07-18_post_cognition_two_agents/`：两条完整本地运行原件，不进入Git。

## Validation

- 开放新手：两章完成；30循环；19战19胜；8换人；3换装；112条知识；情绪38→89.1786。
- 旧开放新手：49循环；22战1败；13换人；14换装；199条知识；最终情绪97.3944。
- 惯性玩家：两章完成；35循环；28战18胜10败；4换人；3换装；107条知识；情绪38→84.6826。
- 旧惯性玩家：49循环；34战20胜14败；6换人；9换装；192条知识；最终情绪99.6856。
- 原始威胁形状：旧两条各13，新两条均0。
- 非公开战斗证据知识：旧175/177，新0/0。
- 完整四人认知坐标：开放19/19、惯性22/22，数学关系全部正确。
- 实际引用角色认知的决策：开放19次、惯性21次；两者均实际引用历史坐标。
- 对比脚本语法：PASS。
- `comparison.json` 与 `task-budget-board.json` 解析：PASS。
- 两名子Agent的summary均完成；开放运行124个JSON可解析；惯性运行72个request、71个正式response，最终完成状态无需response。
- `git diff --check`：PASS，仅既存换行符提示。

## Current State

行为提升判定通过。新过滤没有把决策信息删空，角色相对标尺与历史坐标实际改变换人/回换，换人失败没有泛化成“换谁都失败”，换装预期会等待战斗复核，新关弱惯性与强场地信号覆盖都在自然轨迹里出现。知识量和无效操作显著下降，旧原始诊断泄漏消失。

不能判定完整心理模型通过。当前长跑显示支援/坦克的全局强度可能严重低估；同配置重试改变战斗随机种子，会把随机翻盘写成因果先例；惯性玩家4次换人没有进入正式A结算；确认2次与证伪2次都获得相同 `EVerify=1/+0.06` 验证过程感，猜对C与猜错A/R的分账仍需专项验证。

## Unresolved

- 开放新手中牧师治疗180.482仍被评为相对标尺-2.839/非常弱；骑士护盾288.840并帮助4人存活仍被评为-3.752/排名9。
- 惯性玩家把主线10原阵随机翻盘迁移成后续关卡的一次重试依据。
- 开放新手8次换人仅2次A结算；惯性玩家4次换人A结算0次。
- request写 `nextCombatTargetCondition`，运行时只接受 `targetCondition`。
- 惯性玩家10次失败后情绪最低仍是初始38，失败体验尚未验证为可信。
- 概率型掉落预期和分层Progress仍未修复。
- Agent采样非确定；同种子前后行为差异不是单次严格因果证明。
- 编排器无法确认实际模型，只能记录请求模型为5.5fast、实际为未知平台默认。

## Recommended Next Step

先做两个最小而高价值的配对：

1. 输出、治疗、护盾对胜负贡献相等的角色认知配对，修正支援/坦克强度共同口径。
2. 同配置同种子、同配置多种子、真实换人/换装三组重试配对，把随机结果分布与因果改善分开。

随后统一 `targetCondition` 合同，并回到“确认/证伪的EVerify、C、A、R分账”专项测试。概率掉落仍按原任务顺序保留。
