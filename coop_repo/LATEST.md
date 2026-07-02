# Coop Handoff Entry Point

Do not treat this file as the only source of truth. It is mutable by design because existing agent instructions ask agents to read it first.

Read the timestamped report index first:

[`REPORT_INDEX.md`](REPORT_INDEX.md)

Most recent current-work report:

[`reports/2026-07-02_0000_weapon-and-archetype-affix-audit.md`](reports/2026-07-02_0000_weapon-and-archetype-affix-audit.md)

Last updated: 2026-07-02

Current focus: equipment grind audit. The current simulator has one `weapon` slot, not left/right hands. The corrected affix rule is that every normal archetype affix must have at least two real user roles; `fireAmp`, `stealthDuration`, `lowHpDamage`, and `auraPower` currently fail this rule.
