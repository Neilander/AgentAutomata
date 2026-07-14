# Coop Handoff Entry Point

Do not treat this file as the only source of truth. It is mutable by design because existing agent instructions ask agents to read it first.

Read the timestamped report index first:

[`REPORT_INDEX.md`](REPORT_INDEX.md)

Most recent current-work report:

[`reports/2026-07-14_1817_player-hypothesis-loop-repaired.md`](reports/2026-07-14_1817_player-hypothesis-loop-repaired.md)

Last updated: 2026-07-14

Current focus: The explicit player-hypothesis loop is repaired and verified in a fresh Ranger run. Player hypotheses now persist across actions, settle from authoritative combat evidence, emit EVerify, and remain visible to later decisions. Next evaluate confirmable versus refutable hypotheses under a frozen model and check whether learned results change subsequent choices.
