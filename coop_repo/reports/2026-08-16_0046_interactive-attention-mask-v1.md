# Agent Handoff: 交互式注意力遮罩 v1 与机械消融

- Date: 2026-08-16
- Agent/thread: `/root`；玩家 `/root/masked_attention_player`；审查 `/root/masked_attention_reviewer`
- Scope: 强制“先提交关注对象、环境再揭示局部事实、随后才允许动作”，并检验规则记忆是否为成功原因
- Status: complete

## User Intent

在暂不解决自动注意力的前提下，尝试交互式注意力遮罩：AI 手动分配注意力，环境逐块反馈，以避免一次看完整场景后事后补写注意力解释。

## Completed

- 创建 8 条局部 UFS 规则、6 个密封场景、预冻结终态答案和 SHA-256 清单。
- 创建逐轮遮罩环境：每个活跃案例每轮只允许一个关注或动作命令；关键动作要求相关局部事实已在前轮揭示。
- 同一玩家 Agent 先冻结规则记忆，再进行 10 轮交互。
- 主实验完成 22 次关注、22 次动作，0 拒绝，6/6 终态精确正确。
- 程序验证 12 项冻结哈希、10 轮请求—响应哈希链、逐例顺序和终态。
- 独立 Agent 严格审查环境、评分器、语义泄漏和证据边界。
- 增加完全不读规则、不读 Agent 记忆、不读期望的机械消融；机械策略同样 10 轮、0 拒绝、6/6。

## Files Changed

- `logs/fb2/projects/western_fantasy_continent/experiments/interactive_attention_mask_v1/README.md`: 实验结论与下一版约束。
- `.../rules/R01.txt` 至 `R08.txt`: 规则学习输入。
- `.../sealed/cases.json`, `.../sealed/expected.json`: 预测前冻结的场景和终态答案。
- `.../FROZEN_MANIFEST.md`: 12 项输入 SHA-256。
- `.../masked_env.js`: 交互遮罩有限状态环境。
- `.../agent/memory.json`: 玩家 Agent 的冻结规则记忆。
- `.../transcript/`: 10 轮主实验请求、响应和哈希链。
- `.../evaluation.json`: 主实验 6/6 程序评分。
- `.../review.md`: 独立严苛审查。
- `.../mechanical_baseline.js`, `.../mechanical_env.js`, `.../mechanical_control/`: 无规则/无记忆机械消融与记录。

## Validation

- `node .../evaluate.js`: `allPassed=true`；6/6；10 轮；22 focus + 22 action；0 rejected；冻结输入未变；hash chain valid。
- 独立审查：12 项哈希、10 轮链、6 个终态和外部“先关注后动作”时序成立。
- `node .../mechanical_baseline.js`: 10 轮、0 rejected、allFinished；逐例对比密封终态为 6/6。
- 审查文件 SHA-256：`CCA410C861D5816BD36F4955C7576D932BC149C122E26F4FDB8194344D88C9CD`。

## Current State

遮罩作为执行协议是有效的：它把局部事实的可见时间与动作执行时间分开，避免同一轮先看再做，主轨迹确实跨轮完成箭头递归、母舰新行、白骰随机边界和双飞船分支。

但注意力/记忆因果性不成立：案例名、feature 名、operation 名和响应提示太直白。机械程序不读规则与记忆仍然 6/6，说明当前成功主要来自接口分派，而不能归功于规则记忆唤醒。

## Unresolved

- 需要去语义化案例、观察和动作，并加入诱饵关注对象。
- 需要预测前冻结环境、评分器和过程不变量；当前只冻结终态相关输入。
- 评分器应从密封初态重放 transcript，而不是信任 runtime。
- `finish_case`、白骰重投、落点动作的状态机前置条件存在可绕过点。
- 需要有记忆 Agent、无记忆 Agent、机械基线三组正式对照。
- 仓库协议使玩家 Agent 读取了上一版交接报告，严格洁净性仍有限。

## Recommended Next Step

做 v2，但不要增加更多 UFS 内容：沿用 6 个场景，改为不透明案例 ID、中性原始观察、通用低层动作和诱饵关注对象；修复状态机漏洞并预冻结可重放评分器。三组并行对照中，只有规则记忆 Agent 显著高于无记忆/机械组，才继续讨论“注意力唤醒动作粘连”。
