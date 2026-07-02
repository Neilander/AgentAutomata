# Coop Handoff Entry Point

Do not treat this file as the only source of truth. It is mutable by design because existing agent instructions ask agents to read it first.

Read the timestamped report index first:

[`REPORT_INDEX.md`](REPORT_INDEX.md)

Most recent current-work report:

[`reports/2026-07-02_1938_equipment-v2-followup-and-drop-bug.md`](reports/2026-07-02_1938_equipment-v2-followup-and-drop-bug.md)

Last updated: 2026-07-02

Current focus: equipment generation v2 is implemented, but the current grind simulation's drop progression is wrong. It uses super-waterline score to decide drop tier, causing teams to keep receiving low-level drops. Next step is to separate loot source level from benchmark score.
