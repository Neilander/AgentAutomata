# Agent Handoff: AI 手动注意力与动作唤醒两阶段盲测

- Date: 2026-08-16
- Agent/thread: `/root`，阶段 1/2 玩家 `/root/blind_ufs_player`，独立审查 `/root/blind_wakeup_reviewer`
- Scope: 隔离验证“AI 读规则形成可粘连动作，再只凭初始动作唤醒后续链”
- Status: complete

## User Intent

暂不解决自动注意力。先允许 AI 遍历场景并手动分配注意力，通过反馈逐步调参；验证 AI 能否先读 UFS 规则形成可粘连动作，再在未被告知完整后续链的场景中自行想起并执行潜在后续动作。

## Completed

- 建立独立实验目录 `blind_agent_wakeup_play_v0` 和 8 条自包含 UFS 规则。
- 让全新子 Agent 只读规则，冻结出 6 类动作、6 组注意力预设、6 条正向粘连、4 条“已知无动作”记忆和 2 个停止边界。
- 冻结后才创建 7 个场景，并让同一 Agent 只凭初始放骰动作与冻结记忆推演。
- 场景覆盖箭头递归、零移动、母舰判负、无即时效果、随机边界、路径/终点区分和双飞船分支。
- 预测提交后才创建期望文件；程序精确比较最终状态并检查规则/记忆召回、禁止误触发、链长度和显式注意力。
- 由另一名 Agent 严苛复核，明确区分结果正确、规则接口闭合和注意力因果性。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/blind_agent_wakeup_play_v0/README.md`: 实验目的、流程、结果和边界。
- `.../rules/R01.txt` 至 `R08.txt`: 阶段 1 唯一规则输入。
- `.../PHASE1_INSTRUCTIONS.md`: 阶段 1 隔离与输出契约。
- `.../outputs/phase1_memory.json`: 子 Agent 冻结的动作—注意力—粘连记忆。
- `.../PHASE2_INSTRUCTIONS.md`: 阶段 2 盲推演契约。
- `.../scenarios.json`: 冻结后创建的 7 个只含初始动作和环境事实的场景。
- `.../outputs/phase2_predictions.json`: 子 Agent 的动作链、注意力轨迹和最终状态。
- `.../hidden_expected.json`: 预测提交后创建的评分期望。
- `.../evaluate_predictions.js`: 程序评分器。
- `.../outputs/programmatic_evaluation.json`: 7/7 程序评分结果。
- `.../outputs/independent_review.md`: 独立审查与风险说明。

## Validation

- `node .../evaluate_predictions.js`: 7/7 场景全部通过，所有最终状态精确一致。
- 独立自然语言审查：5 例无歧义正确；2 例依赖“横移至城市命中格即命中城市”的场景接口，判为条件正确。
- 文件时间顺序：phase1 memory 00:02:14 < scenarios 00:03:40 < predictions 00:06:26 < expected 00:07:34。
- SHA-256：phase1 `4F02514D...11139`；scenarios `64A3D59A...ABD8`；predictions `EAEFB6B1...3C3A77`；expected `575D2AC5...866`。

## Current State

“AI 手动遍历并分配注意力 + 显式规则记忆负责动作粘连”的 MVP 在 7 个小型场景上能运行。Agent 不只执行初始动作，还正确继续了箭头新终点、城市伤害与返回、母舰下降与骷髅判负、白骰随机停止等未作为动作序列直接给出的后续。

更准确的结论是：显式规则记忆已经能充当动作胶水；尚未证明注意力轨迹真实驱动推演。当前场景整体可读，注意力说明仍可能是答案后的回填。

## Unresolved

- R07 没有闭合“箭头横移到城市命中格是否等价于下降击中城市”的接口，影响 2 例的无条件判定。
- 场景特征标签语义较强，尚未测试弱标签、同义改写、噪声干扰或原始视觉输入。
- 阶段 2 一次读完整场景，没有强制“先报关注对象，再看局部信息”，因此注意力因果性未被证明。
- 期望在预测后创建，虽避免作答者看到答案，但不能排除评分标准对预测的适配；正式实验应预测前独立冻结期望和哈希。
- 评分器对规则/记忆 ID 和注意力轨迹的检查偏结构化，最终状态精确比较强，但过程验证较弱。
- 独立审查 Agent 因仓库协议读取了当前 coop 报告，严格洁净独立性存在瑕疵，但未接触本实验场景或答案。

## Recommended Next Step

做一个最小“交互式注意力遮罩”实验：Agent 每一步先提交关注对象，环境只返回该局部内容，再让它选择是否唤醒粘连动作；全过程写不可回写日志。预先由独立方冻结 5–8 个留出场景、期望和哈希，并补全城市命中接口。不要先扩到完整 UFS。
