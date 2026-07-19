# Coop Handoff Entry Point

Do not treat this file as the only source of truth. It is mutable by design because existing agent instructions ask agents to read it first.

Read the timestamped report index first:

[`REPORT_INDEX.md`](REPORT_INDEX.md)

Most recent current-work report:

[`reports/2026-07-19_1517_everify-causal-chain-v2.md`](reports/2026-07-19_1517_everify-causal-chain-v2.md)

Last updated: 2026-07-19

当前重点：隔离EVerify已重建为完整因果链V2。Agent必须先写claim、chosenBehavior和至少3个有序语义步骤；程序只用已接收步骤、时间和冻结informationTier逐边计算support。全链成立才确认，任一边反证则整链证伪，链不完整时整链support为0但已成立前缀保留为局部知识。35/65和步骤平均已删除。正式Agent合同及真实事件到步骤的匹配器尚未接入。
