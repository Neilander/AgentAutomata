# UFS 受注意限制现场试玩 V4 协议

- 执行者：全新隔离 Agent `/root/attention_limited_ufs_playtest_v4`
- 日期：2026-08-24
- Attempt 上限：1；不得复位、换路线或重试。
- 玩家输入：仅 UFS 第 1—9 页公开规则/既有规则阅读知识、公开 CLI 合同、`attention-player-cli.js --help` 用法，以及 CLI 每次返回的 41/153+ 裁剪玩家视图。
- 禁读：V1/V2/V3 实验目录与其报告、路线、choice、thought log；CLI 私有 state/checkpoint；宿主会话实现；正式引擎；scenario fixtures；测试答案。
- 推进方式：只调用 `attention-player-cli.js start|advance|random`，每个 response 后单独观察、思考、落盘，再发下一次操作。
- 边界：`random` 只调用 CLI `random` 获取外部观察；`unknown`、`attention_stop` 或 `complete` 立即封卷。
- 目标：尽可能完成一回合；现场验证是否越过母舰下降格，以及是否真实出现并使用 `choose_research_advance`。
- 诚实性：漏看和错误推断均允许；未注意到的对象一律记为未知，不解释成空或不存在。
- 记录：每一步保存原始 view、单步 choice、machine transcript 与 JSONL thought log。每条思路含 noticed、显式 unknown、宏观需要、合法候选、成本/条件/收益、真正影响选择的反事实、最终操作及动作后工作记忆。

## 工作记忆初值

公开合同记忆：五颗骰子逐颗放置；白骰落位后可能要求外部随机；全部放完进入房间阶段；研究房会先给预算与连续研究格成本，再由玩家选择推进格数；随后挖掘、母舰、生成并在下一回合边界结束。只能把当前裁剪视图中实际 noticed 的对象当作本步事实。
