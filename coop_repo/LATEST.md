# Coop Handoff Entry Point

Do not treat this file as the only source of truth. It is mutable by design because existing agent instructions ask agents to read it first.

Read the timestamped report index first:

[`REPORT_INDEX.md`](REPORT_INDEX.md)

Most recent current-work report:

[`reports/2026-07-19_1745_causal-evidence-parser-channel.md`](reports/2026-07-19_1745_causal-evidence-parser-channel.md)

Last updated: 2026-07-19

当前重点：原始战斗事件本来就保存玩家可见的主体、目标、动作和时间，细节是在知识摘要聚合时丢失。解析器现已增加独立`causalEvidence`通道：每条证据单独经过低/普通/高感知，内部ID转换为公开引用，并由整理器明确隔离于普通观察和知识路由。真实fixture中普通感知可用游侠伤害→击杀同一目标→胜利确认三步因果链；匹配器16例PASS。下一步是让正式Agent战前假设使用同一套公开引用，再把该通道接入正式EVerify；novelty/closure仍保持0。
