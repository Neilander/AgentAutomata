# Coop Handoff Entry Point

Do not treat this file as the only source of truth. It is mutable by design because existing agent instructions ask agents to read it first.

Read the timestamped report index first:

[`REPORT_INDEX.md`](REPORT_INDEX.md)

Most recent current-work report:

[`reports/2026-07-20_0113_player-model-integration-audit.md`](reports/2026-07-20_0113_player-model-integration-audit.md)

Last updated: 2026-07-20

当前重点：历史接线审计确认最近的角色认知、信息过滤、换人预期/A/C、结构化EVerify和假设注意均已进入正式V27。真正的旧成果孤岛是V4反馈存量/习惯化/概率放弃、V5的P×Q/deadRepetition/incomprehension/kP/Agency，以及被真实Agent选择替代的V1–V3代码行动策略。当前“强反证后原样乱试”不应修改EDecision，而应把旧deadRepetition重新接到正式Q；不要整模块导入，以免重复计算现有R/A/C/EVerify。
