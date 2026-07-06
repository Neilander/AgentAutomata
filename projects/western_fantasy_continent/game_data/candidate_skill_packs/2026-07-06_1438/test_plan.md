# Candidate Validation Plan: 2026-07-06_1438

Status: text-candidate stage only.

No official skill assets were modified. No combat runtime validation was run in this round.

Planned validation after blind review:

1. Implement user-approved candidates into a temporary executable candidate runtime.
2. For each candidate, build 4 intent-matched teams:
   - one pure fantasy team;
   - one near-target team;
   - one mixed standard team;
   - one stress team against likely counters.
3. Add 8 logic-built random standard teams.
4. Test against strong-waterline top 20% or the closest available strong bucket.
5. Record:
   - target-team uplift;
   - near-target uplift;
   - random-team uplift;
   - output / healing / shield / survival composition;
   - whether the intended fantasy actually appears in battle signals.

Current lightweight validation only checks that the blind review data is parseable.
